import { BaseRepository } from "./BaseRepository";
import { SymptomEntity } from "../entity/SymptomEntity";
import { NotFoundError } from "../utils/AppError";

export class SymptomRepository extends BaseRepository<SymptomEntity> {
    constructor() {
        super(SymptomEntity, "Symptom");
    }

    async findByName(name: string): Promise<SymptomEntity> {
        const entity = await this.repo.findOne({ 
            where: { name },
            relations: ["triggers", "moods", "copingMechanisms"]
        });
        if (!entity) throw new NotFoundError(`Symptom '${name}' not found`);
        return entity;
    }

    async findAll(): Promise<SymptomEntity[]> {
        return await this.repo.find({
            relations: ["triggers", "moods", "copingMechanisms"]
        });
    }
}