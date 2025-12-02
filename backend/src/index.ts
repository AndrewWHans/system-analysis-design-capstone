import express from "express";
import cors from "cors";
import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { errorHandler } from "./utils/errorHandler";
import { authenticateToken, requireAdmin } from "./middleware/authMiddleware";

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

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Init Repos
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

// Init Services
const therapistService = new TherapistService(therapistRepo);
const sessionService = new TherapySessionService(sessionRepo, nodeRepo, messageRepo, choiceRepo, scenarioRepo);
const copingService = new CopingMechanismService(copingRepo);
const triggerService = new TriggerService(triggerRepo);
const moodService = new MoodService(moodRepo);
const symptomService = new SymptomService(symptomRepo);
const conditionService = new ConditionService(conditionRepo);
const diagnosisService = new DiagnosisService(diagnosisRepo);

// Auth Routes
app.post("/register", async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const newTherapist = await therapistService.register(username, email, password);
        const token = await therapistService.login(username || email, password);
        res.status(201).json({ message: "Registration successful", token, user: { id: newTherapist.id, username: newTherapist.username } });
    } catch (e) { next(e); }
});

app.post("/login", async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const token = await therapistService.login(username, password);
        res.json({ token });
    } catch (e) { next(e); }
});

// Session Routes
app.post("/sessions", async (req, res, next) => {
    try {
        const { therapistId, scenarioId } = req.body;
        const session = await sessionService.startSession(therapistId, scenarioId);
        res.status(201).json(session);
    } catch (e) { next(e); }
});

// Public Read Routes
app.get("/coping-mechanisms", async (req, res, next) => { try { res.json(await copingService.getAllCopingMechanisms()); } catch (e) { next(e); } });
app.get("/triggers", async (req, res, next) => { try { res.json(await triggerService.getAllTriggers()); } catch (e) { next(e); } });
app.get("/moods", async (req, res, next) => { try { res.json(await moodService.getAllMoods()); } catch (e) { next(e); } });
app.get("/symptoms", async (req, res, next) => { try { res.json(await symptomService.getAllSymptoms()); } catch (e) { next(e); } });
app.get("/conditions", async (req, res, next) => { try { res.json(await conditionService.getAllConditions()); } catch (e) { next(e); } });
app.get("/diagnoses", async (req, res, next) => { try { res.json(await diagnosisService.getAllDiagnoses()); } catch (e) { next(e); } });

// Public Read Single (for specific edits)
app.get("/coping-mechanisms/:id", async (req, res, next) => { try { res.json(await copingService.getCopingMechanismByID(Number(req.params.id))); } catch (e) { next(e); } });
app.get("/triggers/:id", async (req, res, next) => { try { res.json(await triggerService.getTriggerByID(Number(req.params.id))); } catch (e) { next(e); } });
app.get("/moods/:id", async (req, res, next) => { try { res.json(await moodService.getMoodByID(Number(req.params.id))); } catch (e) { next(e); } });
app.get("/symptoms/:id", async (req, res, next) => { try { res.json(await symptomService.getSymptomByID(Number(req.params.id))); } catch (e) { next(e); } });
app.get("/conditions/:id", async (req, res, next) => { try { res.json(await conditionService.getConditionByID(Number(req.params.id))); } catch (e) { next(e); } });
app.get("/diagnoses/:id", async (req, res, next) => { try { res.json(await diagnosisService.getDiagnosisByID(Number(req.params.id))); } catch (e) { next(e); } });


// Admin Routes
app.use("/admin", authenticateToken, requireAdmin);

// Coping Mechanisms
app.post("/admin/coping-mechanisms", async (req, res, next) => {
    try { res.status(201).json(await copingService.createCopingMechanism(req.body.name)); } catch (e) { next(e); }
});
app.put("/admin/coping-mechanisms/:id", async (req, res, next) => {
    try { await copingService.updateCopingMechanism(Number(req.params.id), req.body.name); res.json({ message: "Updated" }); } catch (e) { next(e); }
});
app.delete("/admin/coping-mechanisms/:id", async (req, res, next) => {
    try { await copingService.deleteCopingMechanism(Number(req.params.id)); res.json({ message: "Deleted" }); } catch (e) { next(e); }
});

// Triggers
app.post("/admin/triggers", async (req, res, next) => {
    try { res.status(201).json(await triggerService.createTrigger(req.body.name)); } catch (e) { next(e); }
});
app.put("/admin/triggers/:id", async (req, res, next) => {
    try { await triggerService.updateTrigger(Number(req.params.id), req.body.name); res.json({ message: "Updated" }); } catch (e) { next(e); }
});
app.delete("/admin/triggers/:id", async (req, res, next) => {
    try { await triggerService.deleteTrigger(Number(req.params.id)); res.json({ message: "Deleted" }); } catch (e) { next(e); }
});

// Moods
app.post("/admin/moods", async (req, res, next) => {
    try { res.status(201).json(await moodService.createMood(req.body.name)); } catch (e) { next(e); }
});
app.put("/admin/moods/:id", async (req, res, next) => {
    try { await moodService.updateMood(Number(req.params.id), req.body.name); res.json({ message: "Updated" }); } catch (e) { next(e); }
});
app.delete("/admin/moods/:id", async (req, res, next) => {
    try { await moodService.deleteMood(Number(req.params.id)); res.json({ message: "Deleted" }); } catch (e) { next(e); }
});

// Symptoms
app.post("/admin/symptoms", async (req, res, next) => {
    try {
        const { name, severity, frequency, duration, triggers, moods, copingMechanisms, lifeImpact } = req.body;
        res.status(201).json(await symptomService.createSymptom(name, severity, frequency, duration, triggers, moods, copingMechanisms, lifeImpact));
    } catch (e) { next(e); }
});
app.put("/admin/symptoms/:id", async (req, res, next) => {
    try {
        const { name, severity, frequency, duration, triggers, moods, copingMechanisms, lifeImpact } = req.body;
        await symptomService.updateSymptom(Number(req.params.id), name, severity, frequency, duration, triggers, moods, copingMechanisms, lifeImpact);
        res.json({ message: "Updated" });
    } catch (e) { next(e); }
});
app.delete("/admin/symptoms/:id", async (req, res, next) => {
    try { await symptomService.deleteSymptom(Number(req.params.id)); res.json({ message: "Deleted" }); } catch (e) { next(e); }
});

// Conditions
app.post("/admin/conditions", async (req, res, next) => {
    try { res.status(201).json(await conditionService.createCondition(req.body.name, req.body.symptoms)); } catch (e) { next(e); }
});
app.put("/admin/conditions/:id", async (req, res, next) => {
    try { await conditionService.updateCondition(Number(req.params.id), req.body.name, req.body.symptoms); res.json({ message: "Updated" }); } catch (e) { next(e); }
});
app.delete("/admin/conditions/:id", async (req, res, next) => {
    try { await conditionService.deleteCondition(Number(req.params.id)); res.json({ message: "Deleted" }); } catch (e) { next(e); }
});

// Diagnoses
app.post("/admin/diagnoses", async (req, res, next) => {
    try { res.status(201).json(await diagnosisService.createDiagnosis(req.body.condition, req.body.symptoms)); } catch (e) { next(e); }
});
app.put("/admin/diagnoses/:id", async (req, res, next) => {
    try { await diagnosisService.updateDiagnosis(Number(req.params.id), req.body.condition, req.body.symptoms); res.json({ message: "Updated" }); } catch (e) { next(e); }
});
app.delete("/admin/diagnoses/:id", async (req, res, next) => {
    try { await diagnosisService.deleteDiagnosis(Number(req.params.id)); res.json({ message: "Deleted" }); } catch (e) { next(e); }
});

app.get("/", (_req, res) => {
    res.send("Therabot API is running");
});

const startServer = async () => {
    let retries = 5;
    while (retries) {
        try {
            await AppDataSource.initialize();
            console.log("Database connected via TypeORM");
            await therapistService.createAdmin();
            app.use(errorHandler);
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
            break;
        } catch (error) {
            console.log(`Database connection failed. Retrying in 5s... (${retries} attempts left)`);
            retries -= 1;
            await new Promise(res => setTimeout(res, 5000));
        }
    }
};

startServer();