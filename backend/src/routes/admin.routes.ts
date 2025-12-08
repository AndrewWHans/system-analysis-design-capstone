import { Router, Request, Response, NextFunction } from "express";
import { services } from "../container";

const router = Router();

// Gneric interface for our Entity Config
interface RouteConfig {
    path: string;
    create: (body: any) => Promise<any>;
    update: (id: number, body: any) => Promise<any>;
    delete: (id: number) => Promise<void>;
}

// Map the services to the config
// This acts as an adapter, mapping the consistent router calls to the specific service methods
const entities: RouteConfig[] = [
    {
        path: "/coping-mechanisms",
        create: (body) => services.coping.createCopingMechanism(body.name),
        update: (id, body) => services.coping.updateCopingMechanism(id, body.name),
        delete: (id) => services.coping.deleteCopingMechanism(id)
    },
    {
        path: "/triggers",
        create: (body) => services.trigger.createTrigger(body.name),
        update: (id, body) => services.trigger.updateTrigger(id, body.name),
        delete: (id) => services.trigger.deleteTrigger(id)
    },
    {
        path: "/moods",
        create: (body) => services.mood.createMood(body.name),
        update: (id, body) => services.mood.updateMood(id, body.name),
        delete: (id) => services.mood.deleteMood(id)
    },
    {
        path: "/symptoms",
        create: (b) => services.symptom.createSymptom(b.name, b.severity, b.frequency, b.duration, b.triggers, b.moods, b.copingMechanisms, b.lifeImpact),
        update: (id, b) => services.symptom.updateSymptom(id, b.name, b.severity, b.frequency, b.duration, b.triggers, b.moods, b.copingMechanisms, b.lifeImpact),
        delete: (id) => services.symptom.deleteSymptom(id)
    },
    {
        path: "/conditions",
        create: (body) => services.condition.createCondition(body.name, body.symptoms),
        update: (id, body) => services.condition.updateCondition(id, body.name, body.symptoms),
        delete: (id) => services.condition.deleteCondition(id)
    },
    {
        path: "/diagnoses",
        create: (body) => services.diagnosis.createDiagnosis(body.condition, body.symptoms),
        update: (id, body) => services.diagnosis.updateDiagnosis(id, body.condition, body.symptoms),
        delete: (id) => services.diagnosis.deleteDiagnosis(id)
    }
];

// Generate routes dynamically
entities.forEach(entity => {
    // Create
    router.post(entity.path, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await entity.create(req.body);
            res.status(201).json(result);
        } catch (e) { next(e); }
    });

    // Update
    router.put(`${entity.path}/:id`, async (req: Request, res: Response, next: NextFunction) => {
        try {
            await entity.update(Number(req.params.id), req.body);
            res.json({ message: "Updated successfully" });
        } catch (e) { next(e); }
    });

    // Delete
    router.delete(`${entity.path}/:id`, async (req: Request, res: Response, next: NextFunction) => {
        try {
            await entity.delete(Number(req.params.id));
            res.json({ message: "Deleted successfully" });
        } catch (e) { next(e); }
    });
});

export default router;