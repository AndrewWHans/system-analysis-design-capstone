import { BaseService } from "./BaseService";
import { DialogueNodeEntity } from "../entity/DialogueNodeEntity";
import { BaseRepository } from "../repository/BaseRepository";
import { TherapistChoiceRepository } from "../repository/TherapistChoiceRepository";
import { BadRequestError } from "../utils/AppError";

export class DialogueNodeService extends BaseService<DialogueNodeEntity> {
    constructor(
        repo: BaseRepository<DialogueNodeEntity>,
        private choiceRepo: TherapistChoiceRepository
    ) {
        super(repo, "Dialogue Node");
    }

    async getByID(id: number): Promise<DialogueNodeEntity> {
        const fullNode = await this.repository.repo.findOne({
            where: { id },
            relations: ["therapistChoices", "therapistChoices.nextNode"]
        });
        return fullNode || await this.repository.findByID(id);
    }

    async getAll(): Promise<DialogueNodeEntity[]> {
        return await this.repository.repo.find({
            relations: ["therapistChoices", "therapistChoices.nextNode"]
        });
    }

    async create(data: any): Promise<DialogueNodeEntity> {
        if (!data.botText) throw new BadRequestError("Bot Text is required");

        const node = this.repository.create({ botText: data.botText });
        const savedNode = await this.repository.save(node);

        if (data.therapistChoices && Array.isArray(data.therapistChoices)) {
            await this.handleChoicesUpdate(savedNode, data.therapistChoices);
        }

        return this.getByID(savedNode.id);
    }

    async update(id: number, data: any): Promise<void> {
        const node = await this.repository.findByID(id);

        if (data.botText) {
            node.botText = data.botText;
            await this.repository.save(node);
        }

        if (data.therapistChoices && Array.isArray(data.therapistChoices)) {
            await this.choiceRepo.deleteBySourceNodeID(id);
            await this.handleChoicesUpdate(node, data.therapistChoices);
        }
    }

    private async handleChoicesUpdate(sourceNode: DialogueNodeEntity, choicesData: any[]) {
        for (const cData of choicesData) {
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