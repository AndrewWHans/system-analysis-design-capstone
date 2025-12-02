import { BaseRepository } from "./BaseRepository";
import { ScenarioEntity } from "../entity/ScenarioEntity";
import { NotFoundError } from "../utils/AppError";

export class ScenarioRepository extends BaseRepository<ScenarioEntity> {
    constructor() {
        super(ScenarioEntity, "Scenario");
    }

    async findByName(name: string): Promise<ScenarioEntity> {
        const entity = await this.repo.findOne({ 
            where: { name },
            relations: ["rootDialogueNode", "correctDiagnosis"]
        });
        if (!entity) throw new NotFoundError(`Scenario ${name} not found`);
        return entity;
    }
}