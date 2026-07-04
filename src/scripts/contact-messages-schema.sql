-- =============================================================================
-- contact_messages Table Schema
-- =============================================================================
-- This SQL script creates the contact_messages table for storing
-- contact form submissions from the portfolio website.
--
-- Run this manually in your PostgreSQL database if you're not using
-- TypeORM automatic schema synchronization.
-- =============================================================================

CREATE TABLE IF NOT EXISTS contact_messages (
    id              SERIAL PRIMARY KEY,
    firstname       VARCHAR(100) NOT NULL,
    lastname        VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Index on created_at for efficient sorting (newest/oldest first)
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
    ON contact_messages (created_at DESC);

-- Index on email for potential lookup/searches
CREATE INDEX IF NOT EXISTS idx_contact_messages_email
    ON contact_messages (email);

-- =============================================================================
-- Optional: Row-Level Security & Permissions
-- =============================================================================

-- Grant necessary permissions (adjust the role name as needed)
-- GRANT SELECT, INSERT, DELETE ON contact_messages TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE contact_messages_id_seq TO your_app_user;

-- =============================================================================
-- Notes:
-- =============================================================================
-- 1. TypeORM will automatically create this table if synchronize: true is set
--    in data-source.ts (not recommended for production).
-- 2. For production, run this script manually or use migrations.
-- 3. The 'id' field auto-increments via SERIAL.
-- 4. 'created_at' is automatically set by TypeORM's @CreateDateColumn.
-- =============================================================================