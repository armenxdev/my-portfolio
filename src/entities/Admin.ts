import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity({ name: "admins" })
@Index("idx_admin_email", ["email"]) // Index for faster email lookups on login
export class Admin {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index({ unique: true }) // Unique index on email column
    @Column({ type: "varchar", length: 255, unique: true })
    email!: string;

    @Column({ type: "varchar", length: 255, select: false })
    password_hash!: string;

    // 2FA fields
    @Column({ type: "varchar", length: 255, nullable: true, select: false })
    twoFactorSecret!: string | null;

    @Column({ type: "boolean", default: false })
    twoFactorEnabled!: boolean;

    @CreateDateColumn({ type: "timestamp with time zone" })
    created_at!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    updated_at!: Date;
}