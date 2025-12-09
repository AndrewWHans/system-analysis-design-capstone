import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { ConditionEntity } from "./ConditionEntity";

@Entity({ name: "diagnoses" })
export class DiagnosisEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => ConditionEntity)
    @JoinColumn({ name: "condition_id" })
    condition!: ConditionEntity;
}