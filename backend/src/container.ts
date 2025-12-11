import { AppDataSource } from "./data-source";
import { BaseRepository } from "./repository/BaseRepository";

// Entities
import { TherapistEntity } from "./entity/TherapistEntity";
import { ScenarioEntity } from "./entity/ScenarioEntity";
import { TherapySessionEntity } from "./entity/TherapySessionEntity";
import { MessageEntity } from "./entity/MessageEntity";
import { DialogueNodeEntity } from "./entity/DialogueNodeEntity";
import { TherapistChoiceEntity } from "./entity/TherapistChoiceEntity";
import { CopingMechanismEntity } from "./entity/CopingMechanismEntity";
import { TriggerEntity } from "./entity/TriggerEntity";
import { MoodEntity } from "./entity/MoodEntity";
import { SymptomEntity } from "./entity/SymptomEntity";
import { ConditionEntity } from "./entity/ConditionEntity";
import { DiagnosisEntity } from "./entity/DiagnosisEntity";

// Custom Repositories
import { TherapistRepository } from "./repository/TherapistRepository";
import { TherapySessionRepository } from "./repository/TherapySessionRepository";
import { TherapistChoiceRepository } from "./repository/TherapistChoiceRepository";
import { DiagnosisRepository } from "./repository/DiagnosisRepository";

// Services
import { TherapistService } from "./service/TherapistService";
import { TherapySessionService } from "./service/TherapySessionService";
import { ScenarioService } from "./service/ScenarioService";
import { SymptomService } from "./service/SymptomService"
import { BaseService } from "./service/BaseService";
import { DialogueNodeService } from "./service/DialogueNodeService";
import { SimulationService } from "./service/SimulationService";
import { SeederService } from "./service/SeederService";

// Initialize Repositories
const therapistRepo = new TherapistRepository();
const sessionRepo = new TherapySessionRepository();
const choiceRepo = new TherapistChoiceRepository();
const diagnosisRepo = new DiagnosisRepository();

// Generic Repositories
const scenarioRepo = new BaseRepository(ScenarioEntity, "Scenario", ["rootDialogueNode", "correctDiagnosis"]);
const messageRepo = new BaseRepository(MessageEntity, "Message");
const nodeRepo = new BaseRepository(DialogueNodeEntity, "Dialogue Node");
const copingRepo = new BaseRepository(CopingMechanismEntity, "Coping Mechanism");
const triggerRepo = new BaseRepository(TriggerEntity, "Trigger");
const moodRepo = new BaseRepository(MoodEntity, "Mood");
const symptomRepo = new BaseRepository(SymptomEntity, "Symptom", ["triggers", "moods", "copingMechanisms"]);
const conditionRepo = new BaseRepository(ConditionEntity, "Condition", ["symptoms"]);

// Initialize Services
const simulationService = new SimulationService();
const seederService = new SeederService(triggerRepo, moodRepo, copingRepo, symptomRepo, conditionRepo, diagnosisRepo);
const therapistService = new TherapistService(therapistRepo);
const sessionService = new TherapySessionService(sessionRepo, nodeRepo, messageRepo, choiceRepo, scenarioRepo, simulationService);

export const services = {
    therapist: therapistService,
    session: sessionService,
    scenario: new ScenarioService(scenarioRepo, nodeRepo, choiceRepo),
    symptom: new SymptomService(symptomRepo),
    coping: new BaseService(copingRepo, "Coping Mechanism"),
    trigger: new BaseService(triggerRepo, "Trigger"),
    mood: new BaseService(moodRepo, "Mood"),
    condition: new BaseService(conditionRepo, "Condition"),
    diagnosis: new BaseService(diagnosisRepo, "Diagnosis"),
    dialogueNode: new DialogueNodeService(nodeRepo, choiceRepo),
    seeder: seederService
};

export const initializeDatabase = async () => {
    let retries = 5;
    while (retries) {
        try {
            await AppDataSource.initialize();
            console.log("Database connected via TypeORM");
            await services.therapist.createAdmin();
            await services.seeder.seed();
            break;
        } catch (error) {
            console.log(`Database connection failed. Retrying in 5s... (${retries} attempts left)`);
            retries -= 1;
            await new Promise(res => setTimeout(res, 5000));
        }
    }
};