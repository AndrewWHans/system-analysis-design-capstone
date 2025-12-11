import { TherapySessionRepository } from "../repository/TherapySessionRepository";
import { BaseRepository } from "../repository/BaseRepository";
import { MessageEntity } from "../entity/MessageEntity";
import { TherapySessionEntity } from "../entity/TherapySessionEntity";
import { DialogueNodeEntity } from "../entity/DialogueNodeEntity";
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
            messages: []
        });

        const savedSession = await this.therapySessionRepository.save(session);
        await this.logMessage(savedSession, SenderType.BOT, rootNode.botText);

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

        await this.logMessage(session, SenderType.THERAPIST, choice.text);
        const result = this.simulationService.getNextState(choice);

        session.currentDialogueNodeID = result.nextNode.id;
        
        if (result.botResponse) {
            await this.logMessage(session, SenderType.BOT, result.botResponse);
        }

        const nextNodeFull = await this.dialogueNodeRepository.findByID(result.nextNode.id);
        if(nextNodeFull.isEndNode) {
            session.endTime = new Date().toISOString(); 
        }

        await this.therapySessionRepository.save(session);
        return await this.getSessionDetails(sessionID);
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

        // Update Session
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
                relations: ["therapistChoices", "therapistChoices.nextNode"]
            });
            
            if (currentNode) {
                availableChoices = currentNode.therapistChoices;
                isEndNode = currentNode.isEndNode;
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