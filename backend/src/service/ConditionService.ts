import { ConditionEntity } from "../entity/ConditionEntity";
import { SymptomEntity } from "../entity/SymptomEntity";
import { ConditionRepository } from "../repository/ConditionRepository";
import { BadRequestError } from "../utils/AppError";

export class ConditionService {
    constructor(private conditionRepository: ConditionRepository) {}

    async createCondition(name: string, symptoms: SymptomEntity[]): Promise<ConditionEntity> {
        if (!name.trim()) throw new BadRequestError("Name is required");

        const condition = this.conditionRepository.create({
            name,
            symptoms
        });

        return await this.conditionRepository.save(condition);
    }

    async getAllConditions(): Promise<ConditionEntity[]> {
        return await this.conditionRepository.findAll();
    }

    async getConditionByID(conditionID: number): Promise<ConditionEntity> {
        return await this.conditionRepository.findByID(conditionID);
    }

    async getConditionByName(name: string): Promise<ConditionEntity> {
        return await this.conditionRepository.findByName(name);
    }

    async updateCondition(conditionID: number, name: string, symptoms: SymptomEntity[]): Promise<void> {
        const existing = await this.conditionRepository.findByID(conditionID);
        
        if (!name.trim()) throw new BadRequestError("Name is required");

        existing.name = name;
        existing.symptoms = symptoms;

        await this.conditionRepository.save(existing);
    }

    async deleteCondition(conditionID: number): Promise<void> {
        await this.conditionRepository.deleteByID(conditionID);
    }
}