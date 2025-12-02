import { BaseRepository } from "./BaseRepository";
import { TriggerEntity } from "../entity/TriggerEntity";
import { NotFoundError } from "../utils/AppError";

export class TriggerRepository extends BaseRepository<TriggerEntity> {
    constructor() {
        super(TriggerEntity, "Trigger");
    }

    async findByName(name: string): Promise<TriggerEntity> {
        const entity = await this.repo.findOneBy({ name });
        if (!entity) throw new NotFoundError(`Trigger '${name}' not found`);
        return entity;
    }
}