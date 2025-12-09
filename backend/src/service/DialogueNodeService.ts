import { BaseService } from "./BaseService";
import { DialogueNodeEntity } from "../entity/DialogueNodeEntity";
import { DialogueNodeRepository } from "../repository/DialogueNodeRepository";
import { TherapistChoiceRepository } from "../repository/TherapistChoiceRepository";
import { BadRequestError } from "../utils/AppError";

export class DialogueNodeService extends BaseService<DialogueNodeEntity> {
    constructor(
        repo: DialogueNodeRepository,
        private choiceRepo: TherapistChoiceRepository
    ) {
        super(repo, "Dialogue Node");
    }

    // Override getByID to ensure we fetch nested choices and next node relations
    async getByID(id: number): Promise<DialogueNodeEntity> {
        const fullNode = await (this.repository as any).repo.findOne({
            where: { id },
            relations: ["therapistChoices", "therapistChoices.nextNode"]
        });
        return fullNode || await this.repository.findByID(id);
    }

    // Override getAll to include relations
    async getAll(): Promise<DialogueNodeEntity[]> {
        return await (this.repository as any).repo.find({
            relations: ["therapistChoices", "therapistChoices.nextNode"]
        });
    }

    // Logic for creating complex nodes
    async create(data: any): Promise<DialogueNodeEntity> {
        if (!data.botText) throw new BadRequestError("Bot Text is required");

        // Create the node
        const node = this.repository.create({ botText: data.botText });
        const savedNode = await this.repository.save(node);

        // Handle choices if present
        if (data.therapistChoices && Array.isArray(data.therapistChoices)) {
            await this.handleChoicesUpdate(savedNode, data.therapistChoices);
        }

        return this.getByID(savedNode.id);
    }

    async update(id: number, data: any): Promise<void> {
        const node = await this.repository.findByID(id);

        // Update text
        if (data.botText) {
            node.botText = data.botText;
            await this.repository.save(node);
        }

        // Update choices
        if (data.therapistChoices && Array.isArray(data.therapistChoices)) {
            // Remove existing choices for this node
            await this.choiceRepo.deleteBySourceNodeID(id);
            // Add new ones
            await this.handleChoicesUpdate(node, data.therapistChoices);
        }
    }

    // Helper
    private async handleChoicesUpdate(sourceNode: DialogueNodeEntity, choicesData: any[]) {
        for (const cData of choicesData) {
            // Determine Next Node ID: Handle both { id: 1 } object format and raw ID
            let nextNodeId = cData.nextNode;
            if (typeof cData.nextNode === 'object' && cData.nextNode !== null) {
                nextNodeId = cData.nextNode.id;
            }

            if (nextNodeId) {
                const nextNode = await this.repository.findByID(Number(nextNodeId));
                const choice = this.choiceRepo.create({
                    text: cData.text,
                    sourceNode: sourceNode,
                    nextNode: nextNode
                });
                await this.choiceRepo.save(choice);
            }
        }
    }
}