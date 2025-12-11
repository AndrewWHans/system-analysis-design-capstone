import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { ConditionEntity } from "./ConditionEntity";
import { DialogueNodeEntity } from "./DialogueNodeEntity";

@Entity({ name: "scenarios" })
export class ScenarioEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column("text")
    description!: string;

    @Column("simple-json", { nullable: true })
    initialState!: any;

    @ManyToOne(() => ConditionEntity)
    @JoinColumn({ name: "correct_condition_id" })
    correctDiagnosis!: ConditionEntity;

    @OneToOne(() => DialogueNodeEntity)
    @JoinColumn({ name: "root_dialogue_node_id" })
    rootDialogueNode!: DialogueNodeEntity;
}