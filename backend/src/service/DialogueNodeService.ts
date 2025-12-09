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
        const node = await this.getByID(id);

        if (data.botText) {
            node.botText = data.botText;
            await this.repository.save(node);
        }

        if (data.therapistChoices && Array.isArray(data.therapistChoices)) {
            await this.handleChoicesUpdate(node, data.therapistChoices);
        }
    }

    /**
     * Instead of deleting all choices and re-creating them (which kills IDs),
     * we compare existing vs incoming to Update, Create, or Delete specifically.
     */
    private async handleChoicesUpdate(sourceNode: DialogueNodeEntity, incomingChoices: any[]) {
        const existingChoices = await this.choiceRepo.repo.find({
            where: { sourceNode: { id: sourceNode.id } },
            relations: ["nextNode"]
        });

        // 1. Identify IDs present in the payload
        const incomingIds = new Set(incomingChoices.map(c => c.id).filter(id => id));

        // 2. Delete choices that exist in DB but are NOT in the payload
        const toDelete = existingChoices.filter(c => !incomingIds.has(c.id));
        if (toDelete.length > 0) {
            await this.choiceRepo.repo.remove(toDelete);
        }

        // 3. Process Upserts (Update existing or Create new)
        for (const cData of incomingChoices) {
            // Resolve Next Node ID
            let nextNodeId = cData.nextNode;
            if (typeof cData.nextNode === 'object' && cData.nextNode !== null) {
                nextNodeId = cData.nextNode.id;
            }

            if (!nextNodeId) continue; // Skip invalid choices

            const nextNodeEntity = await this.repository.findByID(Number(nextNodeId));

            if (cData.id) {
                // UPDATE existing choice
                const existing = existingChoices.find(e => e.id === cData.id);
                if (existing) {
                    existing.text = cData.text;
                    existing.nextNode = nextNodeEntity;
                    await this.choiceRepo.save(existing);
                }
            } else {
                // CREATE new choice
                const newChoice = this.choiceRepo.create({
                    text: cData.text,
                    sourceNode: sourceNode,
                    nextNode: nextNodeEntity
                });
                await this.choiceRepo.save(newChoice);
            }
        }
    }
}