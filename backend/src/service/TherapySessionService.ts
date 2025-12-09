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
import { BadRequestError } from "../utils/AppError";

export class TherapySessionService {
    constructor(
        private therapySessionRepository: TherapySessionRepository,
        private dialogueNodeRepository: BaseRepository<DialogueNodeEntity>,
        private messageRepository: BaseRepository<MessageEntity>,
        private therapistChoiceRepository: BaseRepository<TherapistChoiceEntity>,
        private scenarioRepository: BaseRepository<ScenarioEntity>,
        private simulationService: SimulationService
    ) {}

    async startSession(therapistID: number, scenarioID: number): Promise<TherapySessionEntity> {
        const scenario = await this.scenarioRepository.findByID(scenarioID);
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

        return savedSession;
    }

    async processTherapistChoice(sessionID: number, choiceID: number): Promise<TherapySessionEntity> {
        const session = await this.therapySessionRepository.findByID(sessionID);
        if (!session.currentDialogueNodeID) throw new BadRequestError("Session has no current dialogue node");
        
        // Get Data
        const choice = await this.therapistChoiceRepository.findByID(choiceID);
        // Ensure we have the full next node
        const fullChoice = await this.therapistChoiceRepository.repo.findOne({
            where: { id: choiceID },
            relations: ["nextNode"]
        });
        
        if (!fullChoice || !fullChoice.nextNode) throw new BadRequestError("Invalid choice or missing next node");

        // Log Therapist Action
        await this.logMessage(session, SenderType.THERAPIST, choice.text);

        // Delegate Logic to SimulationService (SRP)
        const result = this.simulationService.getNextState(fullChoice);

        // Update Session State
        session.currentDialogueNodeID = result.nextNode.id;
        await this.logMessage(session, SenderType.BOT, result.botResponse);

        return await this.therapySessionRepository.save(session);
    }

    async submitDiagnosis(sessionID: number, diagnosis: DiagnosisEntity): Promise<TherapySessionEntity> {
        const session = await this.therapySessionRepository.findByID(sessionID);
        const scenario = await this.scenarioRepository.findByID(session.scenarioID);

        // Delegate Logic to SimulationService (SRP)
        const result = this.simulationService.evaluateDiagnosis(scenario, diagnosis);

        // Update Session State
        session.finalDiagnosis = diagnosis;
        session.endTime = new Date().toISOString();

        // Log Result
        await this.logMessage(session, SenderType.BOT, result.feedback);

        return await this.therapySessionRepository.save(session);
    }

    async getSessionDetails(sessionID: number): Promise<TherapySessionEntity> {
        const session = await this.therapySessionRepository.findByID(sessionID);
        const allMessages = await this.messageRepository.findAll();
        
        session.messages = allMessages.filter(
            (m) => m.therapySession.id === sessionID
        );
        return session;
    }

    // Helper
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