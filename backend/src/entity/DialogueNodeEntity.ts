import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { TherapistChoiceEntity } from "./TherapistChoiceEntity";
import { ScenarioEntity } from "./ScenarioEntity";

export enum NodeType {
    ROOT = "root",
    DIALOGUE = "dialogue",
    END = "end",
    LOGIC = "logic",
    STATE_UPDATE = "state_update",
    RANDOM = "random",
    OBSERVATION = "observation"
}

@Entity({ name: "dialogue_nodes" })
export class DialogueNodeEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: "enum",
        enum: NodeType,
        default: NodeType.DIALOGUE
    })
    type!: NodeType;

    @Column("text", { nullable: true })
    botText!: string;

    @Column("simple-json", { nullable: true })
    metadata!: any; 

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