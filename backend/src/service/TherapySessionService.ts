import { TherapySessionRepository } from "../repository/TherapySessionRepository";
import { BaseRepository } from "../repository/BaseRepository";
import { MessageEntity } from "../entity/MessageEntity";
import { TherapySessionEntity } from "../entity/TherapySessionEntity";
import { DialogueNodeEntity, NodeType } from "../entity/DialogueNodeEntity";
import { TherapistChoiceEntity } from "../entity/TherapistChoiceEntity";
import { ScenarioEntity } from "../entity/ScenarioEntity";
import { ConditionEntity } from "../entity/ConditionEntity";
import { SimulationService } from "./SimulationService";
import { SenderType } from "../utils/enums";
import { BadRequestError, NotFoundError } from "../utils/AppError";

export class TherapySessionService {
    constructor(
        private therapySessionRepository: TherapySessionRepository,
        private dialogueNodeRepository: BaseRepository<DialogueNodeEntity>,
        private messageRepository: BaseRepository<MessageEntity>,
        private therapistChoiceRepository: BaseRepository<TherapistChoiceEntity>,
        private scenarioRepository: BaseRepository<ScenarioEntity>,
        private conditionRepository: BaseRepository<ConditionEntity>,
        private simulationService: SimulationService
    ) {}

    async startSession(therapistID: number, scenarioID: number): Promise<any> {
        const scenario = await this.scenarioRepository.repo.findOne({
            where: { id: scenarioID },
            relations: ["rootDialogueNode"]
        });
        
        if (!scenario || !scenario.rootDialogueNode) {
            throw new NotFoundError("Scenario or Root Node not found");
        }

        const rootNode = await this.dialogueNodeRepository.findByID(scenario.rootDialogueNode.id);

        const session = this.therapySessionRepository.create({
            therapistID,
            scenarioID,
            startTime: new Date().toISOString(),
            currentDialogueNodeID: rootNode.id,
            context: scenario.initialState || {}
        });

        const savedSession = await this.therapySessionRepository.save(session);
        
        // Use the recursive processor to handle Root node (incase Root is state/logic)
        await this.processCurrentNodeRecursive(savedSession, rootNode);

        return await this.getSessionDetails(savedSession.id);
    }

    async processTherapistChoice(sessionID: number, choiceID: number): Promise<any> {
        const session = await this.therapySessionRepository.findByID(sessionID);
        if (!session.currentDialogueNodeID) throw new BadRequestError("Session has no current dialogue node");
        
        const choice = await this.therapistChoiceRepository.repo.findOne({
            where: { id: choiceID },
            relations: ["nextNode"]
        });
        
        if (!choice || !choice.nextNode) throw new BadRequestError("Invalid choice or missing next node");

        // Log therapist selection
        await this.logMessage(session, SenderType.THERAPIST, choice.text);

        // Load the immediate next node
        const nextNode = await this.dialogueNodeRepository.findByID(choice.nextNode.id);

        // Recursive processing (handles State Updates, Logic, Random, then stops at Dialogue)
        await this.processCurrentNodeRecursive(session, nextNode);
        
        return await this.getSessionDetails(sessionID);
    }

    /**
     * Recursively processes nodes until it hits a DIALOGUE node (bot speaks) or END node.
     */
    private async processCurrentNodeRecursive(session: TherapySessionEntity, node: DialogueNodeEntity): Promise<void> {
        // Ensure we have choices loaded for logic/random processing
        const fullNode = await this.dialogueNodeRepository.repo.findOne({
            where: { id: node.id },
            relations: ["therapistChoices", "therapistChoices.nextNode"],
            order: { therapistChoices: { orderIndex: "ASC" } }
        });
        
        if (!fullNode) throw new NotFoundError("Node not found during traversal");

        // Update session pointer
        session.currentDialogueNodeID = fullNode.id;

        // CASE 1: State Update (Invisible)
        if (fullNode.type === NodeType.STATE_UPDATE) {
            session.context = this.simulationService.applyStateUpdate(session.context, fullNode.metadata);
            await this.therapySessionRepository.save(session);
            
            // Auto-advance to the first connection
            if (fullNode.therapistChoices && fullNode.therapistChoices.length > 0) {
                const nextId = fullNode.therapistChoices[0].nextNode?.id;
                if (nextId) {
                    const nextNode = await this.dialogueNodeRepository.findByID(nextId);
                    return this.processCurrentNodeRecursive(session, nextNode);
                }
            }
        }
        // CASE 2: Logic Check (Invisible)
        else if (fullNode.type === NodeType.LOGIC) {
            const result = this.simulationService.evaluateLogic(session.context, fullNode.metadata);
            
            // Convention: Choice 0 is TRUE path, Choice 1 is FALSE path
            let nextChoice = fullNode.therapistChoices[0]; // Default to True/First
            
            if (!result && fullNode.therapistChoices.length > 1) {
                nextChoice = fullNode.therapistChoices[1]; // False/Second
            }

            if (nextChoice && nextChoice.nextNode) {
                const nextNode = await this.dialogueNodeRepository.findByID(nextChoice.nextNode.id);
                return this.processCurrentNodeRecursive(session, nextNode);
            }
        }
        // CASE 3: Random (Invisible)
        else if (fullNode.type === NodeType.RANDOM) {
            const choices = fullNode.therapistChoices;
            if (choices.length > 0) {
                const randomIndex = Math.floor(Math.random() * choices.length);
                const randomChoice = choices[randomIndex];
                if (randomChoice.nextNode) {
                    const nextNode = await this.dialogueNodeRepository.findByID(randomChoice.nextNode.id);
                    return this.processCurrentNodeRecursive(session, nextNode);
                }
            }
        }
        // CASE 4: Observation (System Message)
        else if (fullNode.type === NodeType.OBSERVATION) {
            await this.logMessage(session, SenderType.BOT, `[OBSERVATION] ${fullNode.botText}`);
            
            // Auto advance
            if (fullNode.therapistChoices && fullNode.therapistChoices.length > 0) {
                const nextId = fullNode.therapistChoices[0].nextNode?.id;
                if (nextId) {
                    const nextNode = await this.dialogueNodeRepository.findByID(nextId);
                    return this.processCurrentNodeRecursive(session, nextNode);
                }
            }
        }
        // CASE 5: End Node
        else if (fullNode.isEndNode || fullNode.type === NodeType.END) {
            session.endTime = new Date().toISOString();
            if (fullNode.botText) {
                await this.logMessage(session, SenderType.BOT, fullNode.botText);
            }
            await this.therapySessionRepository.save(session);
            return;
        }
        // CASE 6: Standard Dialogue / Root (Visible)
        else {
            // Bot Speaks
            if (fullNode.botText) {
                await this.logMessage(session, SenderType.BOT, fullNode.botText);
            }
            await this.therapySessionRepository.save(session);
            // We stop here and wait for user input
            return;
        }
    }

    async submitDiagnosis(sessionID: number, conditionID: number): Promise<any> {
        const session = await this.therapySessionRepository.repo.findOne({
            where: { id: sessionID },
            relations: ["scenario", "scenario.correctDiagnosis"]
        });

        if (!session) throw new NotFoundError("Session not found");
        if (!session.endTime) throw new BadRequestError("Cannot submit diagnosis before session ends");

        const submittedCondition = await this.conditionRepository.findByID(conditionID);

        // Evaluate
        const evaluation = this.simulationService.evaluateDiagnosis(session.scenario, submittedCondition);

        // Update session
        session.finalDiagnosis = submittedCondition;
        session.isDiagnosisCorrect = evaluation.isCorrect;
        
        await this.therapySessionRepository.save(session);

        return {
            ...evaluation,
            session: await this.getSessionDetails(sessionID)
        };
    }

    async getSessionDetails(sessionID: number): Promise<any> {
        const session = await this.therapySessionRepository.repo.findOne({
            where: { id: sessionID },
            relations: ["scenario", "finalDiagnosis"] 
        });

        if(!session) throw new NotFoundError("Session not found");

        const allMessages = await this.messageRepository.repo.find({
            where: { therapySession: { id: sessionID } },
            order: { timestamp: "ASC", id: "ASC" }
        });
        
        session.messages = allMessages;

        let availableChoices: TherapistChoiceEntity[] = [];
        let isEndNode = false;

        if (session.currentDialogueNodeID && !session.endTime) {
            const currentNode = await this.dialogueNodeRepository.repo.findOne({
                where: { id: session.currentDialogueNodeID },
                relations: ["therapistChoices", "therapistChoices.nextNode"],
                order: { therapistChoices: { orderIndex: "ASC" } }
            });
            
            if (currentNode) {
                availableChoices = currentNode.therapistChoices;
                isEndNode = currentNode.isEndNode || currentNode.type === NodeType.END;
            }
        } else {
            isEndNode = true;
        }

        return {
            ...session,
            isEndNode,
            availableChoices: availableChoices.map(c => ({
                id: c.id,
                text: c.text
            }))
        };
    }

    async getSessionHistory(therapistID: number): Promise<TherapySessionEntity[]> {
        return await this.therapySessionRepository.repo.find({ 
            where: { therapistID },
            relations: ["scenario", "finalDiagnosis"],
            order: { startTime: "DESC" }
        });
    }

    async getTherapistStats(therapistID: number) {
        const sessions = await this.therapySessionRepository.findByTherapistID(therapistID);
        
        const totalStarted = sessions.length;
        const totalCompleted = sessions.filter(s => s.endTime).length;
        const totalDiagnoses = sessions.filter(s => s.finalDiagnosis).length;
        const correctDiagnoses = sessions.filter(s => s.isDiagnosisCorrect === true).length;
        
        const accuracy = totalDiagnoses > 0 
            ? Math.round((correctDiagnoses / totalDiagnoses) * 100) 
            : 0;

        return {
            totalStarted,
            totalCompleted,
            totalDiagnoses,
            correctDiagnoses,
            accuracy,
            recentSessions: sessions.slice(0, 5) 
        };
    }

    private async logMessage(session: TherapySessionEntity, sender: SenderType, content: string) {
        const msg = this.messageRepository.create({
            therapySession: session,
            sender,
            content,
            timestamp: new Date().toISOString()
        });
        
        await this.messageRepository.save(msg);
    }
}