import { Request, Response } from "express";
import { TherapySessionService } from "../service/TherapySessionService";

export class SessionController {
    constructor(private sessionService: TherapySessionService) {}

    startSession = async (req: Request, res: Response) => {
        const therapistId = req.user?.userId;
        const { scenarioId } = req.body;
        
        const session = await this.sessionService.startSession(Number(therapistId), Number(scenarioId));
        res.status(201).json(session);
    };

    getSession = async (req: Request, res: Response) => {
        const session = await this.sessionService.getSessionDetails(Number(req.params.id));
        res.json(session);
    };

    getHistory = async (req: Request, res: Response) => {
        if (!req.user || !req.user.userId) {
            res.status(400).json({ message: "User ID missing from token" });
            return;
        }

        const therapistId = req.user.userId;
        const history = await this.sessionService.getSessionHistory(Number(therapistId));
        
        res.json(history || []);
    }

    submitChoice = async (req: Request, res: Response) => {
        const sessionId = Number(req.params.id);
        const { choiceId } = req.body;
        const updatedSession = await this.sessionService.processTherapistChoice(sessionId, choiceId);
        res.json(updatedSession);
    }

    submitDiagnosis = async (req: Request, res: Response) => {
        const sessionId = Number(req.params.id);
        const { diagnosisId } = req.body;
        
        const result = await this.sessionService.submitDiagnosis(sessionId, Number(diagnosisId));
        res.json(result);
    }
}