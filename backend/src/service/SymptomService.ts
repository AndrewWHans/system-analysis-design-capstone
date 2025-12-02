import { SymptomEntity } from "../entity/SymptomEntity";
import { TriggerEntity } from "../entity/TriggerEntity";
import { MoodEntity } from "../entity/MoodEntity";
import { CopingMechanismEntity } from "../entity/CopingMechanismEntity";
import { SymptomRepository } from "../repository/SymptomRepository";
import { BadRequestError } from "../utils/AppError";

export class SymptomService {
    constructor(private symptomRepository: SymptomRepository) {}

    private validateSeverity(severity: number): void {
        if (severity < 1 || severity > 10) throw new BadRequestError("Severity must be between 1 and 10");
    }

    private validateFrequency(frequency: number): void {
        if (frequency < 1 || frequency > 5) throw new BadRequestError("Frequency must be between 1 and 5");
    }

    private validateDuration(duration: number): void {
        if (duration < 1 || duration > 5) throw new BadRequestError("Duration must be between 1 and 5");
    }

    private validateLifeImpact(lifeImpact: number): void {
        if (lifeImpact < 1 || lifeImpact > 10) throw new BadRequestError("Life impact must be between 1 and 10");
    }

    async createSymptom(
        name: string,
        severity: number,
        frequency: number,
        duration: number,
        triggers: TriggerEntity[],
        moods: MoodEntity[],
        copingMechanisms: CopingMechanismEntity[],
        lifeImpact: number
    ): Promise<SymptomEntity> {
        if (!name.trim()) throw new BadRequestError("Name is required");
        
        this.validateSeverity(severity);
        this.validateFrequency(frequency);
        this.validateDuration(duration);
        this.validateLifeImpact(lifeImpact);

        const symptom = this.symptomRepository.create({
            name,
            severity,
            frequency,
            duration,
            triggers,
            moods,
            copingMechanisms,
            lifeImpact
        });

        return await this.symptomRepository.save(symptom);
    }

    async getAllSymptoms(): Promise<SymptomEntity[]> {
        return await this.symptomRepository.findAll();
    }

    async getSymptomByID(symptomID: number): Promise<SymptomEntity> {
        return await this.symptomRepository.findByID(symptomID);
    }

    async getSymptomByName(name: string): Promise<SymptomEntity> {
        return await this.symptomRepository.findByName(name);
    }

    async updateSymptom(
        symptomID: number,
        name: string,
        severity: number,
        frequency: number,
        duration: number,
        triggers: TriggerEntity[],
        moods: MoodEntity[],
        copingMechanisms: CopingMechanismEntity[],
        lifeImpact: number
    ): Promise<void> {
        const existing = await this.symptomRepository.findByID(symptomID);
        
        if (!name.trim()) throw new BadRequestError("Name is required");
        this.validateSeverity(severity);
        this.validateFrequency(frequency);
        this.validateDuration(duration);
        this.validateLifeImpact(lifeImpact);

        // Update fields
        existing.name = name;
        existing.severity = severity;
        existing.frequency = frequency;
        existing.duration = duration;
        existing.triggers = triggers;
        existing.moods = moods;
        existing.copingMechanisms = copingMechanisms;
        existing.lifeImpact = lifeImpact;

        await this.symptomRepository.save(existing);
    }

    async deleteSymptom(symptomID: number): Promise<void> {
        await this.symptomRepository.deleteByID(symptomID);
    }
}