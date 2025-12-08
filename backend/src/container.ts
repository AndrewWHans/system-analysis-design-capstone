import { AppDataSource } from "./data-source";

// Repositories
import { TherapistRepository } from "./repository/TherapistRepository";
import { ScenarioRepository } from "./repository/ScenarioRepository";
import { TherapySessionRepository } from "./repository/TherapySessionRepository";
import { MessageRepository } from "./repository/MessageRepository";
import { DialogueNodeRepository } from "./repository/DialogueNodeRepository";
import { TherapistChoiceRepository } from "./repository/TherapistChoiceRepository";
import { CopingMechanismRepository } from "./repository/CopingMechanismRepository";
import { TriggerRepository } from "./repository/TriggerRepository";
import { MoodRepository } from "./repository/MoodRepository";
import { SymptomRepository } from "./repository/SymptomRepository";
import { ConditionRepository } from "./repository/ConditionRepository";
import { DiagnosisRepository } from "./repository/DiagnosisRepository";

// Services
import { TherapistService } from "./service/TherapistService";
import { TherapySessionService } from "./service/TherapySessionService";
import { CopingMechanismService } from "./service/CopingMechanismService";
import { TriggerService } from "./service/TriggerService";
import { MoodService } from "./service/MoodService";
import { SymptomService } from "./service/SymptomService";
import { ConditionService } from "./service/ConditionService";
import { DiagnosisService } from "./service/DiagnosisService";
import { ScenarioService } from "./service/ScenarioService";

// Initialize Repos
const therapistRepo = new TherapistRepository();
const scenarioRepo = new ScenarioRepository();
const sessionRepo = new TherapySessionRepository();
const messageRepo = new MessageRepository();
const nodeRepo = new DialogueNodeRepository();
const choiceRepo = new TherapistChoiceRepository();
const copingRepo = new CopingMechanismRepository();
const triggerRepo = new TriggerRepository();
const moodRepo = new MoodRepository();
const symptomRepo = new SymptomRepository();
const conditionRepo = new ConditionRepository();
const diagnosisRepo = new DiagnosisRepository();

// Initialize services and export singleton instances
export const services = {
    therapist: new TherapistService(therapistRepo),
    session: new TherapySessionService(sessionRepo, nodeRepo, messageRepo, choiceRepo, scenarioRepo),
    scenario: new ScenarioService(scenarioRepo, nodeRepo, choiceRepo),
    coping: new CopingMechanismService(copingRepo),
    trigger: new TriggerService(triggerRepo),
    mood: new MoodService(moodRepo),
    symptom: new SymptomService(symptomRepo),
    condition: new ConditionService(conditionRepo),
    diagnosis: new DiagnosisService(diagnosisRepo)
};

export const initializeDatabase = async () => {
    let retries = 5;
    while (retries) {
        try {
            await AppDataSource.initialize();
            console.log("Database connected via TypeORM");
            await services.therapist.createAdmin();
            break;
        } catch (error) {
            console.log(`Database connection failed. Retrying in 5s... (${retries} attempts left)`);
            retries -= 1;
            await new Promise(res => setTimeout(res, 5000));
        }
    }
};