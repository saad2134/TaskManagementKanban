-- Task Management Kanban Board Database Schema
-- Run this SQL in your MySQL database to set up the tables

CREATE DATABASE IF NOT EXISTS task_kanban;
USE task_kanban;

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Columns table (lists)
CREATE TABLE IF NOT EXISTS columns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    board_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Tasks table (cards)
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    column_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    due_date DATE,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
);

-- Labels table
CREATE TABLE IF NOT EXISTS labels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    board_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE SET NULL
);

-- Task-Label junction table
CREATE TABLE IF NOT EXISTS task_labels (
    task_id INT NOT NULL,
    label_id INT NOT NULL,
    PRIMARY KEY (task_id, label_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

-- Insert default board
INSERT INTO boards (name, description, color, position) VALUES
('Project Alpha', 'Main project board', '#6366f1', 0),
('Project Beta', 'Secondary project board', '#8b5cf6', 1);

-- Insert default columns
INSERT INTO columns (board_id, name, position) VALUES
(1, 'To Do', 0),
(1, 'In Progress', 1),
(1, 'Review', 2),
(1, 'Done', 3);

-- Insert sample tasks
INSERT INTO tasks (column_id, title, description, priority, position) VALUES
(1, 'Design Database Schema', 'Create the database structure for the application', 'high', 0),
(1, 'Set Up API Endpoints', 'Create REST API endpoints for CRUD operations', 'high', 1),
(1, 'Create User Authentication', 'Implement login and registration system', 'medium', 2),
(2, 'Build Drag & Drop', 'Implement drag and drop functionality for cards', 'high', 0),
(2, 'Style Components', 'Apply shadcn-inspired styling to all components', 'medium', 1),
(3, 'Test API Endpoints', 'Test all API endpoints with sample data', 'medium', 0),
(4, 'Project Setup', 'Initialize project and configure environment', 'low', 0);

-- Insert sample labels
INSERT INTO labels (name, color, board_id) VALUES
('Bug', '#ef4444', 1),
('Feature', '#22c55e', 1),
('Enhancement', '#3b82f6', 1),
('Documentation', '#f59e0b', 1);
