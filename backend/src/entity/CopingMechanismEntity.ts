import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "coping_mechanisms" })
export class CopingMechanismEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    name!: string;
}