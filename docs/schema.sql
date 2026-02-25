-- ============================================================
-- TaskFlow Database Schema
-- CP476A Internet Computing - Winter 2026
-- 
-- Team: Allen Dolgonos, Chris Ooi En Shen, Joey Sufaj
-- 
-- This script creates the TaskFlow database and all required
-- tables. Run this file in MySQL to set up the database.
-- ============================================================

-- Create the database (if it does not already exist)
CREATE DATABASE IF NOT EXISTS taskflow_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE taskflow_db;

-- ============================================================
-- Table: users
-- Stores registered user account information.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id       INT           AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(20)   NOT NULL UNIQUE,
    email         VARCHAR(100)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for faster lookups during login
    INDEX idx_users_email (email),
    INDEX idx_users_username (username)
) ENGINE=InnoDB;

-- ============================================================
-- Table: tasks
-- Stores all task records created by users.
-- Each task belongs to exactly one user (foreign key: user_id).
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    task_id       INT           AUTO_INCREMENT PRIMARY KEY,
    user_id       INT           NOT NULL,
    title         VARCHAR(100)  NOT NULL,
    description   TEXT          DEFAULT NULL,
    due_date      DATE          DEFAULT NULL,
    priority      ENUM('low', 'medium', 'high')
                                NOT NULL DEFAULT 'medium',
    status        ENUM('pending', 'in_progress', 'completed')
                                NOT NULL DEFAULT 'pending',
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign key: each task belongs to one user
    CONSTRAINT fk_tasks_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Indexes for common query patterns
    INDEX idx_tasks_user_id (user_id),
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_priority (priority),
    INDEX idx_tasks_due_date (due_date)
) ENGINE=InnoDB;
