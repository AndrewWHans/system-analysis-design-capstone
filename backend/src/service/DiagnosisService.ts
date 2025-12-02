import { DiagnosisEntity } from "../entity/DiagnosisEntity";
import { ConditionEntity } from "../entity/ConditionEntity";
import { SymptomEntity } from "../entity/SymptomEntity";
import { DiagnosisRepository } from "../repository/DiagnosisRepository";

export class DiagnosisService {
    constructor(private diagnosisRepository: DiagnosisRepository) {}

    async createDiagnosis(
        condition: ConditionEntity, 
        symptoms: SymptomEntity[]
    ): Promise<DiagnosisEntity> {
        const diagnosis = this.diagnosisRepository.create({
            condition,
            symptoms
        });
        return await this.diagnosisRepository.save(diagnosis);
    }

    async getAllDiagnoses(): Promise<DiagnosisEntity[]> {
        return await this.diagnosisRepository.findAll();
    }

    async getDiagnosisByID(diagnosisID: number): Promise<DiagnosisEntity> {
        return await this.diagnosisRepository.findByID(diagnosisID);
    }

    async getDiagnosisByName(name: string): Promise<DiagnosisEntity> {
        return await this.diagnosisRepository.findByName(name);
    }

    async updateDiagnosis(
        diagnosisID: number, 
        condition: ConditionEntity, 
        symptoms: SymptomEntity[]
    ): Promise<void> {
        const existing = await this.diagnosisRepository.findByID(diagnosisID);
        
        existing.condition = condition;
        existing.symptoms = symptoms;

        await this.diagnosisRepository.save(existing);
    }

    async deleteDiagnosis(diagnosisID: number): Promise<void> {
        await this.diagnosisRepository.deleteByID(diagnosisID);
    }
}