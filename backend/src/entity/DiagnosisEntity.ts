import { Entity, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, JoinColumn } from "typeorm";
import { ConditionEntity } from "./ConditionEntity";
import { SymptomEntity } from "./SymptomEntity";

@Entity({ name: "diagnoses" })
export class DiagnosisEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => ConditionEntity)
    @JoinColumn({ name: "condition_id" })
    condition!: ConditionEntity;

    @ManyToMany(() => SymptomEntity)
    @JoinTable({ name: "diagnosis_symptoms" })
    symptoms!: SymptomEntity[];
}