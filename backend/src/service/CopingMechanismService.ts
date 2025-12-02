import { CopingMechanismEntity } from "../entity/CopingMechanismEntity";
import { CopingMechanismRepository } from "../repository/CopingMechanismRepository";
import { BadRequestError } from "../utils/AppError";

export class CopingMechanismService {
    constructor(private copingMechanismRepository: CopingMechanismRepository) {}

    async getAllCopingMechanisms(): Promise<CopingMechanismEntity[]> {
        return await this.copingMechanismRepository.findAll();
    }

    async getCopingMechanismByID(id: number): Promise<CopingMechanismEntity> {
        return await this.copingMechanismRepository.findByID(id);
    }

    async getCopingMechanismByName(name: string): Promise<CopingMechanismEntity> {
        return await this.copingMechanismRepository.findByName(name);
    }

    async createCopingMechanism(name: string): Promise<CopingMechanismEntity> {
        if (!name.trim()) {
            throw new BadRequestError("Name is required");
        }
        const entity = this.copingMechanismRepository.create({ name });
        return await this.copingMechanismRepository.save(entity);
    }

    async updateCopingMechanism(id: number, name: string): Promise<void> {
        const existing = await this.copingMechanismRepository.findByID(id);
        if (!name.trim()) {
            throw new BadRequestError("Name is required");
        }
        existing.name = name;
        await this.copingMechanismRepository.save(existing);
    }

    async deleteCopingMechanism(id: number): Promise<void> {
        await this.copingMechanismRepository.deleteByID(id);
    }
}