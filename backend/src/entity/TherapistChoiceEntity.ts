import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { DialogueNodeEntity } from "./DialogueNodeEntity";

@Entity({ name: "therapist_choices" })
export class TherapistChoiceEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("text")
    text!: string;

    @ManyToOne(() => DialogueNodeEntity, (node) => node.therapistChoices)
    @JoinColumn({ name: "source_node_id" })
    sourceNode!: DialogueNodeEntity;

    @ManyToOne(() => DialogueNodeEntity)
    @JoinColumn({ name: "next_node_id" })
    nextNode!: DialogueNodeEntity;
}