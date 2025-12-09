import { Repository, ObjectLiteral, EntityTarget, DeepPartial, FindOptionsWhere } from "typeorm";
import { AppDataSource } from "../data-source";
import { NotFoundError } from "../utils/AppError";

export class BaseRepository<T extends ObjectLiteral> {
    public readonly repo: Repository<T>;
    protected entityName: string;
    protected defaultRelations: string[];

    constructor(entity: EntityTarget<T>, entityName: string, defaultRelations: string[] = []) {
        this.repo = AppDataSource.getRepository(entity);
        this.entityName = entityName;
        this.defaultRelations = defaultRelations;
    }

    create(data: DeepPartial<T>): T {
        return this.repo.create(data);
    }

    async findByID(id: number): Promise<T> {
        const entity = await this.repo.findOne({ 
            where: { id } as any,
            relations: this.defaultRelations
        });
        if (!entity) throw new NotFoundError(`${this.entityName} with ID ${id} not found`);
        return entity;
    }

    async findByName(name: string): Promise<T> {
        // We cast to any here because we assume the entity has a 'name' column if this is called
        const entity = await this.repo.findOne({ 
            where: { name } as any,
            relations: this.defaultRelations
        });
        if (!entity) throw new NotFoundError(`${this.entityName} '${name}' not found`);
        return entity;
    }

    async findAll(): Promise<T[]> {
        return await this.repo.find({
            relations: this.defaultRelations
        });
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