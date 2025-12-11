import { Request, Response } from "express";
import { TherapistService } from "../service/TherapistService";
import { TherapySessionService } from "../service/TherapySessionService";

export class AuthController {
    constructor(
        private therapistService: TherapistService,
        private sessionService: TherapySessionService 
    ) {}

    register = async (req: Request, res: Response) => {
        const { username, email, password } = req.body;
        const newTherapist = await this.therapistService.register(username, email, password);
        const token = await this.therapistService.login(username || email, password);
        
        res.status(201).json({ 
            message: "Registration successful", 
            token, 
            user: { id: newTherapist.id, username: newTherapist.username } 
        });
    };

    login = async (req: Request, res: Response) => {
        const { username, password } = req.body;
        const token = await this.therapistService.login(username, password);
        res.json({ token });
    };

    getProfile = async (req: Request, res: Response) => {
        if (!req.user || !req.user.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const stats = await this.sessionService.getTherapistStats(req.user.userId);
        
        res.json({
            user: {
                id: req.user.userId,
                username: req.user.username,
                email: req.user.email,
                isAdmin: req.user.isAdmin
            },
            stats
        });
    };
}