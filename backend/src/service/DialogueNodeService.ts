import { BaseService } from "./BaseService";
import { DialogueNodeEntity } from "../entity/DialogueNodeEntity";
import { DialogueNodeRepository } from "../repository/DialogueNodeRepository";

export class DialogueNodeService extends BaseService<DialogueNodeEntity> {
    constructor(repo: DialogueNodeRepository) {
        super(repo, "Dialogue Node");
    }

    // Override getByID to ensure we fetch the nested choices and the next node ID
    async getByID(id: number): Promise<DialogueNodeEntity> {
        const node = await this.repository.findByID(id);
        // We need to fetch relations explicitly or update repo find options
        // Using the repo directly to add relations query
        const fullNode = await (this.repository as any).repo.findOne({
            where: { id },
            relations: ["therapistChoices", "therapistChoices.nextNode"]
        });
        return fullNode || node;
    }

    // Override getAll to include relations
    async getAll(): Promise<DialogueNodeEntity[]> {
        return await (this.repository as any).repo.find({
            relations: ["therapistChoices", "therapistChoices.nextNode"]
        });
    }
}