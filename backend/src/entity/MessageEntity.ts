import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { TherapySessionEntity } from "./TherapySessionEntity";
import { SenderType } from "../utils/enums";

@Entity({ name: "messages" })
export class MessageEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: "enum",
        enum: SenderType,
    })
    sender!: SenderType;

    @Column("text")
    content!: string;

    @Column()
    timestamp!: string;

    @ManyToOne(() => TherapySessionEntity, (session) => session.messages)
    @JoinColumn({ name: "therapy_session_id" })
    therapySession!: TherapySessionEntity;
}