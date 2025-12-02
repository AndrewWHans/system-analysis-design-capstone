import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { TriggerEntity } from "./TriggerEntity";
import { MoodEntity } from "./MoodEntity";
import { CopingMechanismEntity } from "./CopingMechanismEntity";

@Entity({ name: "symptoms" })
export class SymptomEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    name!: string;

    @Column()
    severity!: number; // 1-10

    @Column()
    frequency!: number; // 1-5

    @Column()
    duration!: number; // 1-5

    @Column()
    lifeImpact!: number; // 1-10

    @ManyToMany(() => TriggerEntity, { cascade: true })
    @JoinTable({ name: "symptom_triggers" })
    triggers!: TriggerEntity[];

    @ManyToMany(() => MoodEntity, { cascade: true })
    @JoinTable({ name: "symptom_moods" })
    moods!: MoodEntity[];

    @ManyToMany(() => CopingMechanismEntity, { cascade: true })
    @JoinTable({ name: "symptom_coping_mechanisms" })
    copingMechanisms!: CopingMechanismEntity[];
}