import { Router } from "express";
import { services } from "../container";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware";
import adminRouter from "./admin.routes";
import { catchAsync } from "../utils/catchAsync";
import { AuthController } from "../controller/AuthController";
import { SessionController } from "../controller/SessionController";
import { BaseController } from "../controller/BaseController";

const router = Router();

// Initialize controllers
const authController = new AuthController(services.therapist, services.session);
const sessionController = new SessionController(services.session);

// Generic controllers for read-only access
const copingCtrl = new BaseController(services.coping);
const triggerCtrl = new BaseController(services.trigger);
const moodCtrl = new BaseController(services.mood);
const symptomCtrl = new BaseController(services.symptom);
const conditionCtrl = new BaseController(services.condition);
const diagnosisCtrl = new BaseController(services.diagnosis);
const nodeCtrl = new BaseController(services.dialogueNode);

// --- Routes ---

// Auth
router.post("/register", catchAsync(authController.register));
router.post("/login", catchAsync(authController.login));
router.get("/me", authenticateToken, catchAsync(authController.getProfile));

// Session
router.get("/sessions", authenticateToken, catchAsync(sessionController.getHistory));
router.post("/sessions", authenticateToken, catchAsync(sessionController.startSession));
router.get("/sessions/:id", authenticateToken, catchAsync(sessionController.getSession));
router.post("/sessions/:id/choice", authenticateToken, catchAsync(sessionController.submitChoice));
router.post("/sessions/:id/diagnosis", authenticateToken, catchAsync(sessionController.submitDiagnosis));

// Public read-only resources
router.get("/coping-mechanisms", catchAsync(copingCtrl.getAll));
router.get("/coping-mechanisms/:id", catchAsync(copingCtrl.getById));

router.get("/triggers", catchAsync(triggerCtrl.getAll));
router.get("/triggers/:id", catchAsync(triggerCtrl.getById));

router.get("/moods", catchAsync(moodCtrl.getAll));
router.get("/moods/:id", catchAsync(moodCtrl.getById));

router.get("/symptoms", catchAsync(symptomCtrl.getAll));
router.get("/symptoms/:id", catchAsync(symptomCtrl.getById));

router.get("/conditions", catchAsync(conditionCtrl.getAll));
router.get("/conditions/:id", catchAsync(conditionCtrl.getById));

router.get("/diagnoses", catchAsync(diagnosisCtrl.getAll));
router.get("/diagnoses/:id", catchAsync(diagnosisCtrl.getById));

router.get("/dialogue-nodes", catchAsync(nodeCtrl.getAll));
router.get("/dialogue-nodes/:id", catchAsync(nodeCtrl.getById));

router.get("/scenarios", catchAsync(async (req, res) => {
    const items = await services.scenario.getAllScenarios();
    res.json(items);
}));
router.get("/scenarios/:id", catchAsync(async (req, res) => {
    const item = await services.scenario.getScenarioByID(Number(req.params.id));
    res.json(item);
}));

// Admin namespace
router.use("/admin", authenticateToken, requireAdmin, adminRouter);

export default router;