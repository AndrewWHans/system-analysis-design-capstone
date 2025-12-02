import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "triggers" })
export class TriggerEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    name!: string;
}