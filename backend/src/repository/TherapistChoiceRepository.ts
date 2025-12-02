import { BaseRepository } from "./BaseRepository";
import { TherapistChoiceEntity } from "../entity/TherapistChoiceEntity";

export class TherapistChoiceRepository extends BaseRepository<TherapistChoiceEntity> {
    constructor() {
        super(TherapistChoiceEntity, "Therapist Choice");
    }

    async deleteBySourceNodeID(nodeID: number): Promise<void> {
        await this.repo.delete({ sourceNode: { id: nodeID } });
    }

    async findByNextNodeID(nodeID: number): Promise<TherapistChoiceEntity[]> {
        return await this.repo.find({
            where: { nextNode: { id: nodeID } },
            relations: ["nextNode"]
        });
    }
}