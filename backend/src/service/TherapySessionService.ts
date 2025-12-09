import { TherapySessionRepository } from "../repository/TherapySessionRepository";
import { BaseRepository } from "../repository/BaseRepository";
import { MessageEntity } from "../entity/MessageEntity";
import { TherapySessionEntity } from "../entity/TherapySessionEntity";
import { DialogueNodeEntity } from "../entity/DialogueNodeEntity";
import { TherapistChoiceEntity } from "../entity/TherapistChoiceEntity";
import { ScenarioEntity } from "../entity/ScenarioEntity";
import { DiagnosisEntity } from "../entity/DiagnosisEntity";
import { SenderType } from "../utils/enums";
import { BadRequestError } from "../utils/AppError";

export class TherapySessionService {
    constructor(
        private therapySessionRepository: TherapySessionRepository,
        private dialogueNodeRepository: BaseRepository<DialogueNodeEntity>,
        private messageRepository: BaseRepository<MessageEntity>,
        private therapistChoiceRepository: BaseRepository<TherapistChoiceEntity>,
        // Changed type to BaseRepository
        private scenarioRepository: BaseRepository<ScenarioEntity> 
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

        const botMessage = this.messageRepository.create({
            therapySession: savedSession,
            sender: SenderType.BOT,
            content: rootNode.botText,
            timestamp: new Date().toISOString()
        });
        await this.messageRepository.save(botMessage);

        return savedSession;
    }

    async processTherapistChoice(sessionID: number, choiceID: number): Promise<TherapySessionEntity> {
        const session = await this.therapySessionRepository.findByID(sessionID);
        const currentNodeID = session.currentDialogueNodeID;

        if (!currentNodeID) throw new BadRequestError("Session has no current dialogue node");
        
        const choice = await this.therapistChoiceRepository.findByID(choiceID); 
        
        const nextNode = await this.dialogueNodeRepository.findByID(choice.nextNode.id);

        const therapistMsg = this.messageRepository.create({
            therapySession: session,
            sender: SenderType.THERAPIST,
            content: choice.text,
            timestamp: new Date().toISOString()
        });
        await this.messageRepository.save(therapistMsg);

        session.currentDialogueNodeID = nextNode.id;
        
        const botMsg = this.messageRepository.create({
            therapySession: session,
            sender: SenderType.BOT,
            content: nextNode.botText,
            timestamp: new Date().toISOString()
        });
        await this.messageRepository.save(botMsg);

        return await this.therapySessionRepository.save(session);
    }

    async submitDiagnosis(sessionID: number, diagnosis: DiagnosisEntity): Promise<TherapySessionEntity> {
        const session = await this.therapySessionRepository.findByID(sessionID);
        
        session.finalDiagnosis = diagnosis;
        session.endTime = new Date().toISOString();

        const scenario = await this.scenarioRepository.findByID(session.scenarioID);
        
        const correctConditionId = scenario.correctDiagnosis?.condition?.id;
        const submittedConditionId = diagnosis.condition?.id;

        const isCorrect = correctConditionId === submittedConditionId;

        const resultText = isCorrect 
            ? "Diagnosis matches the scenario's correct diagnosis."
            : "Diagnosis does not match.";

        const resultMsg = this.messageRepository.create({
            therapySession: session,
            sender: SenderType.BOT,
            content: resultText,
            timestamp: new Date().toISOString()
        });
        await this.messageRepository.save(resultMsg);

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
}