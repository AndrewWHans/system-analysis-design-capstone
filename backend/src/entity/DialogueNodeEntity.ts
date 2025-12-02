import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { TherapistChoiceEntity } from "./TherapistChoiceEntity";

@Entity({ name: "dialogue_nodes" })
export class DialogueNodeEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("text")
    botText!: string;

    @OneToMany(() => TherapistChoiceEntity, (choice) => choice.sourceNode, {
        cascade: true,
    })
    therapistChoices!: TherapistChoiceEntity[];
}