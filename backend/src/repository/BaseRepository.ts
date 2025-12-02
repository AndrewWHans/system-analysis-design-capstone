import { Repository, ObjectLiteral, EntityTarget, DeepPartial } from "typeorm";
import { AppDataSource } from "../data-source";
import { NotFoundError } from "../utils/AppError";

export abstract class BaseRepository<T extends ObjectLiteral> {
    protected repo: Repository<T>;
    protected entityName: string;

    constructor(entity: EntityTarget<T>, entityName: string) {
        this.repo = AppDataSource.getRepository(entity);
        this.entityName = entityName;
    }

    create(data: DeepPartial<T>): T {
        return this.repo.create(data);
    }

    async findByID(id: number): Promise<T> {
        const entity = await this.repo.findOneBy({ id } as any);
        if (!entity) throw new NotFoundError(`${this.entityName} with ID ${id} not found`);
        return entity;
    }

    async findAll(): Promise<T[]> {
        return await this.repo.find();
    }

    async save(entity: DeepPartial<T>): Promise<T> {
        return await this.repo.save(entity);
    }

    async deleteByID(id: number): Promise<void> {
        const entity = await this.findByID(id);
        if (!entity) throw new NotFoundError(`${this.entityName} with ID ${id} not found`);
        await this.repo.remove(entity);
    }
}