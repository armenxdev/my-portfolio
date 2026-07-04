import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity({ name: "contact_messages" })
export class ContactMessage {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 100 })
    firstname!: string;

    @Column({ type: "varchar", length: 100 })
    lastname!: string;

    @Column({ type: "varchar", length: 255 })
    email!: string;

    @Column({ type: "text" })
    message!: string;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;
}