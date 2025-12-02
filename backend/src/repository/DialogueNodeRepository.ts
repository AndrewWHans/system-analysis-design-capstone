import { BaseRepository } from "./BaseRepository";
import { DialogueNodeEntity } from "../entity/DialogueNodeEntity"; 

export class DialogueNodeRepository extends BaseRepository<DialogueNodeEntity> {
    constructor() {
        super(DialogueNodeEntity, "Dialogue Node");
    }
}