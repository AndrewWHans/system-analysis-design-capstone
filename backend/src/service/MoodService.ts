import { MoodEntity } from "../entity/MoodEntity";
import { MoodRepository } from "../repository/MoodRepository";
import { BadRequestError } from "../utils/AppError";

export class MoodService {
    constructor(private moodRepository: MoodRepository) {}

    async getAllMoods(): Promise<MoodEntity[]> {
        return await this.moodRepository.findAll();
    }

    async getMoodByID(id: number): Promise<MoodEntity> {
        return await this.moodRepository.findByID(id);
    }

    async getMoodByName(name: string): Promise<MoodEntity> {
        return await this.moodRepository.findByName(name);
    }

    async createMood(name: string): Promise<MoodEntity> {
        if (!name.trim()) {
            throw new BadRequestError("Name is required");
        }
        const entity = this.moodRepository.create({ name });
        return await this.moodRepository.save(entity);
    }

    async updateMood(id: number, name: string): Promise<void> {
        const existing = await this.moodRepository.findByID(id);
        if (!name.trim()) {
            throw new BadRequestError("Name is required");
        }
        existing.name = name;
        await this.moodRepository.save(existing);
    }

    async deleteMood(id: number): Promise<void> {
        await this.moodRepository.deleteByID(id);
    }
}