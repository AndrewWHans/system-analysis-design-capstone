import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { MessageEntity } from "./MessageEntity";
import { DiagnosisEntity } from "./DiagnosisEntity";
import { ScenarioEntity } from "./ScenarioEntity";

@Entity({ name: "therapy_sessions" })
export class TherapySessionEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    therapistID!: number;

    @Column()
    scenarioID!: number;

    @ManyToOne(() => ScenarioEntity, { createForeignKeyConstraints: false })
    @JoinColumn({ name: "scenarioID" })
    scenario!: ScenarioEntity;

    @Column()
    startTime!: string;

    @Column({ nullable: true })
    endTime!: string;

    @Column()
    currentDialogueNodeID!: number;

    @OneToMany(() => MessageEntity, (message) => message.therapySession, {
        cascade: true,
    })
    messages!: MessageEntity[];

    @ManyToOne(() => DiagnosisEntity, { nullable: true })
    @JoinColumn({ name: "final_diagnosis_id" })
    finalDiagnosis!: DiagnosisEntity | null;

    @Column({ type: "boolean", nullable: true })
    isDiagnosisCorrect!: boolean | null;
}