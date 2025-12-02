import { BaseRepository } from "./BaseRepository";
import { CopingMechanismEntity } from "../entity/CopingMechanismEntity";
import { NotFoundError } from "../utils/AppError";

export class CopingMechanismRepository extends BaseRepository<CopingMechanismEntity> {
    constructor() {
        super(CopingMechanismEntity, "CopingMechanism");
    }

    async findByName(name: string): Promise<CopingMechanismEntity> {
        const entity = await this.repo.findOneBy({ name });
        if (!entity) throw new NotFoundError(`CopingMechanism '${name}' not found`);
        return entity;
    }
}