import { Router } from "express";
import { services } from "../container";
import { BaseController } from "../controller/BaseController";
import { catchAsync } from "../utils/catchAsync";

const router = Router();

// Initialize controllers
const copingCtrl = new BaseController(services.coping);
const triggerCtrl = new BaseController(services.trigger);
const moodCtrl = new BaseController(services.mood);
const symptomCtrl = new BaseController(services.symptom);
const conditionCtrl = new BaseController(services.condition);

// Custom scenario handler
router.get("/scenarios", catchAsync(async (req, res) => {
    const data = await services.scenario.getAllScenarios();
    res.json(data);
}));

router.get("/scenarios/:id", catchAsync(async (req, res) => {
    const scenario = await services.scenario.getScenarioByID(Number(req.params.id));
    res.json(scenario);
}));

router.post("/scenarios/graph", catchAsync(async (req, res) => {
    const result = await services.scenario.saveScenarioGraph(null, req.body);
    res.status(201).json(result);
}));

router.put("/scenarios/graph/:id", catchAsync(async (req, res) => {
    const result = await services.scenario.saveScenarioGraph(Number(req.params.id), req.body);
    res.json(result);
}));

router.delete("/scenarios/:id", catchAsync(async (req, res) => {
    await services.scenario.deleteScenario(Number(req.params.id));
    res.json({ message: "Deleted" });
}));

// Explicit route definitions
registerCrud("/coping-mechanisms", copingCtrl);
registerCrud("/triggers", triggerCtrl);
registerCrud("/moods", moodCtrl);
registerCrud("/symptoms", symptomCtrl);
registerCrud("/conditions", conditionCtrl);

// Helper to register standard CRUD routes
function registerCrud(path: string, controller: BaseController<any>) {
    router.post(path, catchAsync(controller.create));
    router.get(path, catchAsync(controller.getAll));
    router.get(`${path}/:id`, catchAsync(controller.getById));
    router.put(`${path}/:id`, catchAsync(controller.update));
    router.delete(`${path}/:id`, catchAsync(controller.delete));
};

export default router;