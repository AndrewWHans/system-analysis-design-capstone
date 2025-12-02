import { BaseRepository } from "./BaseRepository";
import { MessageEntity } from "../entity/MessageEntity";

export class MessageRepository extends BaseRepository<MessageEntity> {
    constructor() {
        super(MessageEntity, "Message");
    }
}