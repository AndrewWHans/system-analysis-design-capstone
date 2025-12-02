import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "moods" })
export class MoodEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    name!: string;
}