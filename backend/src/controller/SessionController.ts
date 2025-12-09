import { Request, Response } from "express";
import { TherapySessionService } from "../service/TherapySessionService";

export class SessionController {
    constructor(private sessionService: TherapySessionService) {}

    startSession = async (req: Request, res: Response) => {
        const { therapistId, scenarioId } = req.body;
        const session = await this.sessionService.startSession(therapistId, scenarioId);
        res.status(201).json(session);
    };
}