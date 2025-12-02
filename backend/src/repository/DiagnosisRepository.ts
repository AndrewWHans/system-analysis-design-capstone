import { BaseRepository } from "./BaseRepository";
import { DiagnosisEntity } from "../entity/DiagnosisEntity";
import { NotFoundError } from "../utils/AppError";

export class DiagnosisRepository extends BaseRepository<DiagnosisEntity> {
    constructor() {
        super(DiagnosisEntity, "Diagnosis");
    }

    async findByName(conditionName: string): Promise<DiagnosisEntity> {
        const entity = await this.repo.findOne({ 
            where: { condition: { name: conditionName } },
            relations: ["condition", "symptoms"] 
        });
        if (!entity) throw new NotFoundError(`Diagnosis for condition '${conditionName}' not found`);
        return entity;
    }

    async findAll(): Promise<DiagnosisEntity[]> {
        return await this.repo.find({ relations: ["condition", "symptoms"] });
    }
}