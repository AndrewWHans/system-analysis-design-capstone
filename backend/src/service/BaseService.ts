import { ObjectLiteral, DeepPartial } from "typeorm";
import { BaseRepository } from "../repository/BaseRepository";
import { BadRequestError } from "../utils/AppError";

export class BaseService<T extends ObjectLiteral> {
    constructor(
        protected repository: BaseRepository<T>,
        protected entityName: string
    ) {}

    async getAll(): Promise<T[]> {
        return await this.repository.findAll();
    }

    async getByID(id: number): Promise<T> {
        return await this.repository.findByID(id);
    }

    async create(data: DeepPartial<T>): Promise<T> {
        // Basic validation: checks if 'name' exists in data and is empty
        if ('name' in data && typeof (data as any).name === 'string' && !(data as any).name.trim()) {
            throw new BadRequestError(`${this.entityName} Name is required`);
        }
        const entity = this.repository.create(data);
        return await this.repository.save(entity);
    }

    async update(id: number, data: DeepPartial<T>): Promise<void> {
        const existing = await this.repository.findByID(id);
        
        if ('name' in data && typeof (data as any).name === 'string' && !(data as any).name.trim()) {
            throw new BadRequestError(`${this.entityName} Name is required`);
        }

        // Merge updates into existing entity
        Object.assign(existing, data);
        await this.repository.save(existing);
    }

    async delete(id: number): Promise<void> {
        await this.repository.deleteByID(id);
    }
}