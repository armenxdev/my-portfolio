import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Admin } from "./Admin";

@Entity({ name: "posts" })
export class Post {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "varchar", length: 255, unique: true })
    slug!: string;

    @Column({ type: "text" })
    content!: string;

    @Column({ type: "text", array: true, default: () => "'{}'" })
    tags!: string[];

    @Column({ type: "varchar", length: 100, nullable: true })
    category!: string | null;

    @Column({ type: "int", nullable: true })
    adminId!: number | null;

    @ManyToOne(() => Admin, { onDelete: "SET NULL", nullable: true })
    @JoinColumn({ name: "adminId" })
    admin!: Admin | null;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at!: Date;
}