import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { TherapistChoiceEntity } from "./TherapistChoiceEntity";
import { ScenarioEntity } from "./ScenarioEntity";

@Entity({ name: "dialogue_nodes" })
export class DialogueNodeEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("text")
    botText!: string;

    @Column({ type: "int", default: 0 })
    uiX!: number;

    @Column({ type: "int", default: 0 })
    uiY!: number;

    @Column({ default: false })
    isEndNode!: boolean;

    @OneToMany(() => TherapistChoiceEntity, (choice) => choice.sourceNode, {
        cascade: true,
    })
    therapistChoices!: TherapistChoiceEntity[];

    @ManyToOne(() => ScenarioEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "scenario_id" })
    scenario!: ScenarioEntity;

    toJSON() {
        const { scenario, ...rest } = this;
        return rest;
    }
}