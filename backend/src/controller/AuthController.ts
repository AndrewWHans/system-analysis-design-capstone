import { Request, Response } from "express";
import { TherapistService } from "../service/TherapistService";

export class AuthController {
    constructor(private therapistService: TherapistService) {}

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
}