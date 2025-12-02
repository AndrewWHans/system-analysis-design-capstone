import { TriggerEntity } from "../entity/TriggerEntity";
import { TriggerRepository } from "../repository/TriggerRepository";
import { BadRequestError } from "../utils/AppError";

export class TriggerService {
    constructor(private triggerRepository: TriggerRepository) {}

    async getAllTriggers(): Promise<TriggerEntity[]> {
        return await this.triggerRepository.findAll();
    }

    async getTriggerByID(id: number): Promise<TriggerEntity> {
        return await this.triggerRepository.findByID(id);
    }

    async getTriggerByName(name: string): Promise<TriggerEntity> {
        return await this.triggerRepository.findByName(name);
    }

    async createTrigger(name: string): Promise<TriggerEntity> {
        if (!name.trim()) {
            throw new BadRequestError("Name is required");
        }
        const entity = this.triggerRepository.create({ name });
        return await this.triggerRepository.save(entity);
    }

    async updateTrigger(id: number, name: string): Promise<void> {
        const existing = await this.triggerRepository.findByID(id);
        if (!name.trim()) {
            throw new BadRequestError("Name is required");
        }
        existing.name = name;
        await this.triggerRepository.save(existing);
    }

    async deleteTrigger(id: number): Promise<void> {
        await this.triggerRepository.deleteByID(id);
    }
}