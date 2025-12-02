import { ScenarioRepository } from "../repository/ScenarioRepository";
import { TherapistChoiceRepository } from "../repository/TherapistChoiceRepository";
import { DialogueNodeRepository } from "../repository/DialogueNodeRepository";
import { DialogueNodeEntity } from "../entity/DialogueNodeEntity";
import { TherapistChoiceEntity } from "../entity/TherapistChoiceEntity";
import { ScenarioEntity } from "../entity/ScenarioEntity";
import { DiagnosisEntity } from "../entity/DiagnosisEntity";
import { BadRequestError } from "../utils/AppError";

export class ScenarioService {
    constructor(
        private scenarioRepository: ScenarioRepository,
        private dialogueNodeRepository: DialogueNodeRepository,
        private therapistChoiceRepository: TherapistChoiceRepository
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

        // Create placeholder root node
        const placeholderRoot = this.dialogueNodeRepository.create({
            botText: "",
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

    async addDialogueNode(
        scenarioID: number,
        botText: string,
        choicesData: { text: string; nextNodeID: number }[] 
    ): Promise<DialogueNodeEntity> {
        const scenario = await this.scenarioRepository.findByID(scenarioID);
        
        // Create the node
        const node = this.dialogueNodeRepository.create({ botText });
        const savedNode = await this.dialogueNodeRepository.save(node);

        // Create choices
        for (const cData of choicesData) {
            // Validate next node exists
            const nextNode = await this.dialogueNodeRepository.findByID(cData.nextNodeID);
            
            const choice = this.therapistChoiceRepository.create({
                text: cData.text,
                sourceNode: savedNode,
                nextNode: nextNode
            });
            await this.therapistChoiceRepository.save(choice);
        }

        // If scenario has no real root, set this as root
        if (!scenario.rootDialogueNode || scenario.rootDialogueNode.botText === "") {
            scenario.rootDialogueNode = savedNode;
            await this.scenarioRepository.save(scenario);
        }

        return savedNode;
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

    async updateDialogueNode(
        scenarioID: number,
        dialogueNodeID: number,
        botText: string,
        choicesData: { text: string; nextNodeID: number }[]
    ): Promise<DialogueNodeEntity> {
        // Verify scenario exists first
        await this.scenarioRepository.findByID(scenarioID);

        // Fetch node with existing choices to handle cleanup if necessary
        const node = await this.dialogueNodeRepository.findByID(dialogueNodeID);
        
        node.botText = botText;

        // Save the text update first
        const savedNode = await this.dialogueNodeRepository.save(node);

        // Handle choices
        await this.therapistChoiceRepository.deleteBySourceNodeID(dialogueNodeID);

        const savedChoices: TherapistChoiceEntity[] = [];

        for (const cData of choicesData) {
            const nextNode = await this.dialogueNodeRepository.findByID(cData.nextNodeID);
            
            const choice = this.therapistChoiceRepository.create({
                text: cData.text,
                sourceNode: savedNode,
                nextNode: nextNode
            });
            const savedChoice = await this.therapistChoiceRepository.save(choice);
            savedChoices.push(savedChoice);
        }

        // Update the node relation (Local object update, DB is already updated via choice saves)
        savedNode.therapistChoices = savedChoices;
        return savedNode;
    }

    async deleteScenario(scenarioID: number): Promise<void> {
        await this.scenarioRepository.deleteByID(scenarioID);
    }

    async deleteDialogueNode(scenarioID: number, dialogueNodeID: number): Promise<void> {
        const scenario = await this.scenarioRepository.findByID(scenarioID);
        
        // We must ensure the relations are loaded to check the ID
        if (scenario.rootDialogueNode && scenario.rootDialogueNode.id === dialogueNodeID) {
            throw new BadRequestError("Cannot delete root dialogue node of scenario");
        }

        await this.dialogueNodeRepository.deleteByID(dialogueNodeID);
    }

    async replaceDialogueNode(
        scenarioID: number,
        originalDialogueNodeID: number,
        newDialogueNodeID: number,
    ): Promise<ScenarioEntity> {
        const scenario = await this.scenarioRepository.findByID(scenarioID);
        const newNode = await this.dialogueNodeRepository.findByID(newDialogueNodeID);

        // If the root was the original node, point Root to new node
        if (scenario.rootDialogueNode && scenario.rootDialogueNode.id === originalDialogueNodeID) {
            scenario.rootDialogueNode = newNode;
            await this.scenarioRepository.save(scenario);
        }

        // Update all choices in the DB that pointed to the old node
        const choicesPointingToOldNode = await this.therapistChoiceRepository.findByNextNodeID(originalDialogueNodeID);

        for (const choice of choicesPointingToOldNode) {
            choice.nextNode = newNode;
            await this.therapistChoiceRepository.save(choice);
        }

        // Return updated scenario
        return await this.scenarioRepository.findByID(scenarioID);
    }
}