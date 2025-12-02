import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { DiagnosisEntity } from "./DiagnosisEntity";
import { DialogueNodeEntity } from "./DialogueNodeEntity";

@Entity({ name: "scenarios" })
export class ScenarioEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column("text")
    description!: string;

    @ManyToOne(() => DiagnosisEntity)
    @JoinColumn({ name: "correct_diagnosis_id" })
    correctDiagnosis!: DiagnosisEntity;

    @OneToOne(() => DialogueNodeEntity)
    @JoinColumn({ name: "root_dialogue_node_id" })
    rootDialogueNode!: DialogueNodeEntity;
}