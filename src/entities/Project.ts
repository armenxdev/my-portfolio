import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity({ name: "projects" })
export class Project {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "text", array: true, default: "{}" })
    tech_stack!: string[];

    @Column({ type: "varchar", length: 255 })
    github_url!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    live_url!: string;

    @Column({ type: "boolean", default: false })
    isFeatured!: boolean;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;
}