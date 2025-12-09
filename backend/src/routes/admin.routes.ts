import { Router, Request, Response, NextFunction } from "express";
import { services } from "../container";

const router = Router();

interface RouteConfig {
    path: string;
    service: any;
}

const entities: RouteConfig[] = [
    { path: "/coping-mechanisms", service: services.coping },
    { path: "/triggers", service: services.trigger },
    { path: "/moods", service: services.mood },
    { path: "/symptoms", service: services.symptom },
    { path: "/conditions", service: services.condition },
    { path: "/diagnoses", service: services.diagnosis }
];

entities.forEach(entity => {
    // Create
    router.post(entity.path, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await entity.service.create(req.body);
            res.status(201).json(result);
        } catch (e) { next(e); }
    });

    // Update
    router.put(`${entity.path}/:id`, async (req: Request, res: Response, next: NextFunction) => {
        try {
            await entity.service.update(Number(req.params.id), req.body);
            res.json({ message: "Updated successfully" });
        } catch (e) { next(e); }
    });

    // Delete
    router.delete(`${entity.path}/:id`, async (req: Request, res: Response, next: NextFunction) => {
        try {
            await entity.service.delete(Number(req.params.id));
            res.json({ message: "Deleted successfully" });
        } catch (e) { next(e); }
    });
});

export default router;