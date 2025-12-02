import { BaseRepository } from "./BaseRepository";
import { TherapistEntity } from "../entity/TherapistEntity";

export class TherapistRepository extends BaseRepository<TherapistEntity> {
    constructor() {
        super(TherapistEntity, "Therapist");
    }

    async findByUsername(username: string): Promise<TherapistEntity> {
        const entity = await this.repo.findOneBy({ username });
        if (!entity) {
            throw new Error("Therapist not found");
        }
        return entity;
    }

    async findByEmail(email: string): Promise<TherapistEntity> {
        const entity = await this.repo.findOneBy({ email });
        if (!entity) {
            throw new Error("Therapist not found");
        }
        return entity;
    }
}