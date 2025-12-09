import { SymptomEntity } from "../entity/SymptomEntity";
import { SymptomRepository } from "../repository/SymptomRepository";
import { BadRequestError } from "../utils/AppError";
import { BaseService } from "./BaseService";
import { DeepPartial } from "typeorm";

export class SymptomService extends BaseService<SymptomEntity> {
    constructor(repo: SymptomRepository) {
        super(repo, "Symptom");
    }

    // Override create to add specific validation
    async create(data: DeepPartial<SymptomEntity>): Promise<SymptomEntity> {
        this.validateSymptomData(data);
        return super.create(data);
    }

    // Override update to add specific validation
    async update(id: number, data: DeepPartial<SymptomEntity>): Promise<void> {
        this.validateSymptomData(data);
        return super.update(id, data);
    }

    private validateSymptomData(data: DeepPartial<SymptomEntity>) {
        if (data.severity !== undefined && (data.severity < 1 || data.severity > 10)) 
            throw new BadRequestError("Severity must be between 1 and 10");
        if (data.frequency !== undefined && (data.frequency < 1 || data.frequency > 5)) 
            throw new BadRequestError("Frequency must be between 1 and 5");
        if (data.duration !== undefined && (data.duration < 1 || data.duration > 5)) 
            throw new BadRequestError("Duration must be between 1 and 5");
        if (data.lifeImpact !== undefined && (data.lifeImpact < 1 || data.lifeImpact > 10)) 
            throw new BadRequestError("Life impact must be between 1 and 10");
    }
}