import { BaseRepository } from "./BaseRepository";
import { ConditionEntity } from "../entity/ConditionEntity";
import { NotFoundError } from "../utils/AppError";

export class ConditionRepository extends BaseRepository<ConditionEntity> {
    constructor() {
        super(ConditionEntity, "Condition");
    }

    async findByName(name: string): Promise<ConditionEntity> {
        const entity = await this.repo.findOne({ 
            where: { name },
            relations: ["symptoms"] 
        });
        if (!entity) throw new NotFoundError(`Condition '${name}' not found`);
        return entity;
    }

    async findAll(): Promise<ConditionEntity[]> {
        return await this.repo.find({ relations: ["symptoms"] });
    }
}