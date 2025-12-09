import { BaseRepository } from "../repository/BaseRepository";
import { ScenarioEntity } from "../entity/ScenarioEntity";
import { DialogueNodeEntity } from "../entity/DialogueNodeEntity";
import { DiagnosisEntity } from "../entity/DiagnosisEntity";
import { BadRequestError } from "../utils/AppError";

export class ScenarioService {
    constructor(
        private scenarioRepository: BaseRepository<ScenarioEntity>,
        private dialogueNodeRepository: BaseRepository<DialogueNodeEntity>
    ) {}

    async getScenarioByID(scenarioID: number): Promise<ScenarioEntity> {
        return await this.scenarioRepository.findByID(scenarioID);
    }

    async getScenarioByName(scenarioName: string): Promise<ScenarioEntity> {
        return await this.scenarioRepository.findByName(scenarioName);
    }

    async getAllScenarios(): Promise<ScenarioEntity[]> {
        return await this.scenarioRepository.findAll();
    }

    async createScenario(
        name: string,
        description: string,
        correctDiagnosis: DiagnosisEntity
    ): Promise<ScenarioEntity> {
        if (!name.trim()) throw new BadRequestError("Name is required");

        const placeholderRoot = this.dialogueNodeRepository.create({
            botText: "Start of scenario",
            therapistChoices: []
        });
        const savedRoot = await this.dialogueNodeRepository.save(placeholderRoot);

        const scenario = this.scenarioRepository.create({
            name,
            description,
            correctDiagnosis,
            rootDialogueNode: savedRoot
        });

        return await this.scenarioRepository.save(scenario);
    }

    async updateScenario(
        scenarioID: number,
        name: string,
        description: string,
        correctDiagnosis: DiagnosisEntity,
    ): Promise<ScenarioEntity> {
        const existing = await this.scenarioRepository.findByID(scenarioID);
        
        if (!name.trim()) {
            throw new BadRequestError("Name is required");
        }

        existing.name = name;
        existing.description = description;
        existing.correctDiagnosis = correctDiagnosis;

        return await this.scenarioRepository.save(existing);
    }

    async deleteScenario(scenarioID: number): Promise<void> {
        await this.scenarioRepository.deleteByID(scenarioID);
    }
}