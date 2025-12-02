import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { SymptomEntity } from "./SymptomEntity";

@Entity({ name: "conditions" })
export class ConditionEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    name!: string;

    @ManyToMany(() => SymptomEntity, { cascade: true })
    @JoinTable({ name: "condition_symptoms" })
    symptoms!: SymptomEntity[];
}