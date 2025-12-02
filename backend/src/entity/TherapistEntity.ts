import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "therapists" })
export class TherapistEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true, nullable: true })
    username!: string;

    @Column({ unique: true, nullable: true })
    email!: string;

    @Column()
    hashedPassword!: string;

    @Column({ default: false })
    isAdmin!: boolean;
}