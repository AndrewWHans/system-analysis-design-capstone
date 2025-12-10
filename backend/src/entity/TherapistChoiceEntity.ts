import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { DialogueNodeEntity } from "./DialogueNodeEntity";

@Entity({ name: "therapist_choices" })
export class TherapistChoiceEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("text")
    text!: string;

    @Column({ type: "int", default: 0 })
    orderIndex!: number;

    @ManyToOne(() => DialogueNodeEntity, (node) => node.therapistChoices, { onDelete: "CASCADE" })
    @JoinColumn({ name: "source_node_id" })
    sourceNode!: DialogueNodeEntity;

    @ManyToOne(() => DialogueNodeEntity, { onDelete: "SET NULL" })
    @JoinColumn({ name: "next_node_id" })
    nextNode!: DialogueNodeEntity;
}