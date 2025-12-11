import { TherapySessionRepository } from "../repository/TherapySessionRepository";
import { BaseRepository } from "../repository/BaseRepository";
import { MessageEntity } from "../entity/MessageEntity";
import { TherapySessionEntity } from "../entity/TherapySessionEntity";
import { DialogueNodeEntity } from "../entity/DialogueNodeEntity";
import { TherapistChoiceEntity } from "../entity/TherapistChoiceEntity";
import { ScenarioEntity } from "../entity/ScenarioEntity";
import { DiagnosisEntity } from "../entity/DiagnosisEntity";
import { SimulationService } from "./SimulationService";
import { SenderType } from "../utils/enums";
import { BadRequestError, NotFoundError } from "../utils/AppError";
import { AppDataSource } from "../data-source";

export class TherapySessionService {
    constructor(
        private therapySessionRepository: TherapySessionRepository,
        private dialogueNodeRepository: BaseRepository<DialogueNodeEntity>,
        private messageRepository: BaseRepository<MessageEntity>,
        private therapistChoiceRepository: BaseRepository<TherapistChoiceEntity>,
        private scenarioRepository: BaseRepository<ScenarioEntity>,
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
        
        // Get data
        const choice = await this.therapistChoiceRepository.repo.findOne({
            where: { id: choiceID },
            relations: ["nextNode"]
        });
        
        if (!choice || !choice.nextNode) throw new BadRequestError("Invalid choice or missing next node");

        // Log therapist action
        await this.logMessage(session, SenderType.THERAPIST, choice.text);

        // Get next scenario node
        const result = this.simulationService.getNextState(choice);

        // Update session state
        session.currentDialogueNodeID = result.nextNode.id;
        
        if (result.botResponse) {
            await this.logMessage(session, SenderType.BOT, result.botResponse);
        }

        // Check if next node is an end node
        const nextNodeFull = await this.dialogueNodeRepository.findByID(result.nextNode.id);
        if(nextNodeFull.isEndNode) {
            session.endTime = new Date().toISOString(); 
        }

        await this.therapySessionRepository.save(session);
        return await this.getSessionDetails(sessionID);
    }

    async submitDiagnosis(sessionID: number, diagnosisID: number): Promise<any> {
        const session = await this.therapySessionRepository.repo.findOne({
            where: { id: sessionID },
            relations: ["scenario", "scenario.correctDiagnosis", "scenario.correctDiagnosis.condition"]
        });

        if (!session) throw new NotFoundError("Session not found");
        if (!session.endTime) throw new BadRequestError("Cannot submit diagnosis before session ends");

        const diagnosisRepo = AppDataSource.getRepository(DiagnosisEntity);
        const submittedDiagnosis = await diagnosisRepo.findOne({
            where: { id: diagnosisID },
            relations: ["condition"]
        });

        if (!submittedDiagnosis) throw new NotFoundError("Diagnosis not found");

        // Evaluate
        const evaluation = this.simulationService.evaluateDiagnosis(session.scenario, submittedDiagnosis);

        // Update Session
        session.finalDiagnosis = submittedDiagnosis;
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
            relations: ["scenario", "finalDiagnosis", "finalDiagnosis.condition"] 
        });

        if(!session) throw new NotFoundError("Session not found");

        const allMessages = await this.messageRepository.repo.find({
            where: { therapySession: { id: sessionID } },
            order: { timestamp: "ASC", id: "ASC" }
        });
        
        session.messages = allMessages;

        let availableChoices: TherapistChoiceEntity[] = [];
        let isEndNode = false;

        // If session is ended, don't return choices
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
            isEndNode = true; // Treated as end node if session is closed
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
        return await this.therapySessionRepository.findByTherapistID(therapistID);
    }

    async getTherapistStats(therapistID: number) {
        const sessions = await this.therapySessionRepository.findByTherapistID(therapistID);
        
        const totalStarted = sessions.length;
        const totalCompleted = sessions.filter(s => s.endTime).length;
        const totalDiagnoses = sessions.filter(s => s.finalDiagnosis).length;
        const correctDiagnoses = sessions.filter(s => s.isDiagnosisCorrect === true).length;
        
        // Calculate accuracy only based on sessions where a diagnosis was actually submitted
        const accuracy = totalDiagnoses > 0 
            ? Math.round((correctDiagnoses / totalDiagnoses) * 100) 
            : 0;

        return {
            totalStarted,
            totalCompleted,
            totalDiagnoses,
            correctDiagnoses,
            accuracy,
            recentSessions: sessions.slice(0, 5) // Last 5 sessions
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