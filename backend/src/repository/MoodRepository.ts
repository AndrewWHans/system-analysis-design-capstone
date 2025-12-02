import { BaseRepository } from "./BaseRepository";
import { MoodEntity } from "../entity/MoodEntity";
import { NotFoundError } from "../utils/AppError";

export class MoodRepository extends BaseRepository<MoodEntity> {
    constructor() {
        super(MoodEntity, "Mood");
    }

    async findByName(name: string): Promise<MoodEntity> {
        const entity = await this.repo.findOneBy({ name });
        if (!entity) throw new NotFoundError(`Mood '${name}' not found`);
        return entity;
    }
}