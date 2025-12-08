import { Router } from "express";
import { services } from "../container";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware";
import adminRouter from "./admin.routes";

const router = Router();

// Auth routes
router.post("/register", async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const newTherapist = await services.therapist.register(username, email, password);
        const token = await services.therapist.login(username || email, password);
        res.status(201).json({ message: "Registration successful", token, user: { id: newTherapist.id, username: newTherapist.username } });
    } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const token = await services.therapist.login(username, password);
        res.json({ token });
    } catch (e) { next(e); }
});

// Session routes
router.post("/sessions", async (req, res, next) => {
    try {
        const { therapistId, scenarioId } = req.body;
        const session = await services.session.startSession(therapistId, scenarioId);
        res.status(201).json(session);
    } catch (e) { next(e); }
});

// Public read-only routes
// Helper for simple gets
const getHandler = (promise: Promise<any>) => async (req: any, res: any, next: any) => {
    try { res.json(await promise); } catch (e) { next(e); }
};

router.get("/coping-mechanisms", (req, res, next) => getHandler(services.coping.getAllCopingMechanisms())(req, res, next));
router.get("/triggers", (req, res, next) => getHandler(services.trigger.getAllTriggers())(req, res, next));
router.get("/moods", (req, res, next) => getHandler(services.mood.getAllMoods())(req, res, next));
router.get("/symptoms", (req, res, next) => getHandler(services.symptom.getAllSymptoms())(req, res, next));
router.get("/conditions", (req, res, next) => getHandler(services.condition.getAllConditions())(req, res, next));
router.get("/diagnoses", (req, res, next) => getHandler(services.diagnosis.getAllDiagnoses())(req, res, next));

// Public read single
router.get("/coping-mechanisms/:id", async (req, res, next) => { try { res.json(await services.coping.getCopingMechanismByID(Number(req.params.id))); } catch (e) { next(e); } });
router.get("/triggers/:id", async (req, res, next) => { try { res.json(await services.trigger.getTriggerByID(Number(req.params.id))); } catch (e) { next(e); } });
router.get("/moods/:id", async (req, res, next) => { try { res.json(await services.mood.getMoodByID(Number(req.params.id))); } catch (e) { next(e); } });
router.get("/symptoms/:id", async (req, res, next) => { try { res.json(await services.symptom.getSymptomByID(Number(req.params.id))); } catch (e) { next(e); } });
router.get("/conditions/:id", async (req, res, next) => { try { res.json(await services.condition.getConditionByID(Number(req.params.id))); } catch (e) { next(e); } });
router.get("/diagnoses/:id", async (req, res, next) => { try { res.json(await services.diagnosis.getDiagnosisByID(Number(req.params.id))); } catch (e) { next(e); } });

// Admin namespace
router.use("/admin", authenticateToken, requireAdmin, adminRouter);

export default router;