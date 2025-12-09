import { Router } from "express";
import { services } from "../container";
import { BaseController } from "../controller/BaseController";
import { catchAsync } from "../utils/catchAsync";

const router = Router();

// Initialize Controllers
const copingCtrl = new BaseController(services.coping);
const triggerCtrl = new BaseController(services.trigger);
const moodCtrl = new BaseController(services.mood);
const symptomCtrl = new BaseController(services.symptom);
const conditionCtrl = new BaseController(services.condition);
const diagnosisCtrl = new BaseController(services.diagnosis);
const nodeCtrl = new BaseController(services.dialogueNode);

// Helper to register standard CRUD routes
const registerCrud = (path: string, controller: BaseController<any>) => {
    router.post(path, catchAsync(controller.create));
    router.put(`${path}/:id`, catchAsync(controller.update));
    router.delete(`${path}/:id`, catchAsync(controller.delete));
};

// Explicit Route Definitions
registerCrud("/coping-mechanisms", copingCtrl);
registerCrud("/triggers", triggerCtrl);
registerCrud("/moods", moodCtrl);
registerCrud("/symptoms", symptomCtrl);
registerCrud("/conditions", conditionCtrl);
registerCrud("/diagnoses", diagnosisCtrl);
registerCrud("/dialogue-nodes", nodeCtrl);

export default router;