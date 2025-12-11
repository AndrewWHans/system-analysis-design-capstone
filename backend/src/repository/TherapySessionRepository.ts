import { BaseRepository } from "./BaseRepository";
import { TherapySessionEntity } from "../entity/TherapySessionEntity";

export class TherapySessionRepository extends BaseRepository<TherapySessionEntity> {
    constructor() {
        super(TherapySessionEntity, "TherapySession");
    }

    async findByTherapistID(therapistID: number): Promise<TherapySessionEntity[]> {
        return await this.repo.find({ 
            where: { therapistID },
            relations: ["scenario"],
            order: { startTime: "DESC" }
        });
    }
}