/* ==========================================================================
   IDENTIFICATION: BACKEND - DATABASE INITIALIZATION & SCHEMA
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   DESCRIPTION: Creates all required tables and initializes the database
   ========================================================================== */

const mysql = require('mysql2/promise');
require('dotenv').config();

const initializeDatabase = async () => {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'ssms_db';

  try {
    console.log(`Connecting to XAMPP MySQL server (${host}:${port})...`);
    const rootConn = await mysql.createConnection({ host, port, user, password });
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await rootConn.end();
    console.log(`✓ Database '${dbName}' created/verified successfully in XAMPP.`);
  } catch (err) {
    console.error('✗ Unable to connect to XAMPP MySQL server:', err.message);
    console.error('  Please ensure XAMPP Control Panel is open and MySQL is STARTED.');
    process.exit(1);
  }

  const pool = require('./database');
  const conn = await pool.getConnection();
  
  try {
    console.log('Initializing SSMS Database Schema...');

    // Users Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'supervisor', 'student') NOT NULL DEFAULT 'student',
        is_active BOOLEAN DEFAULT TRUE,
        is_default_password BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      )
    `);

    // Students Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        student_id VARCHAR(50) NOT NULL UNIQUE,
        department VARCHAR(255),
        enrollment_year INT,
        cgpa DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_student_id (student_id)
      )
    `);

    // Supervisors Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS supervisors (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        employee_id VARCHAR(50) NOT NULL UNIQUE,
        department VARCHAR(255),
        specialization VARCHAR(255),
        office_location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_employee_id (employee_id)
      )
    `);

    // Projects Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        supervisor_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description LONGTEXT,
        status ENUM('proposed', 'approved', 'in-progress', 'submitted', 'completed', 'rejected') DEFAULT 'proposed',
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE CASCADE,
        INDEX idx_student (student_id),
        INDEX idx_supervisor (supervisor_id),
        INDEX idx_status (status)
      )
    `);

    // Project Milestones Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description LONGTEXT,
        due_date DATE NOT NULL,
        completion_date DATE,
        status ENUM('pending', 'in-progress', 'completed', 'overdue') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        INDEX idx_project (project_id),
        INDEX idx_status (status)
      )
    `);

    // Documents/Vault Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        uploaded_by INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description LONGTEXT,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(50),
        file_size INT,
        version INT DEFAULT 1,
        is_approved BOOLEAN DEFAULT FALSE,
        approved_by INT,
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_project (project_id),
        INDEX idx_is_approved (is_approved)
      )
    `);

    // Messages Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        sender_id INT NOT NULL,
        recipient_id INT NOT NULL,
        project_id INT,
        subject VARCHAR(255),
        body LONGTEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
        INDEX idx_recipient (recipient_id),
        INDEX idx_is_read (is_read),
        INDEX idx_created (created_at)
      )
    `);

    // Appointments Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        initiator_id INT NOT NULL,
        scheduled_with INT NOT NULL,
        appointment_date DATETIME NOT NULL,
        duration_minutes INT DEFAULT 30,
        location VARCHAR(255),
        agenda LONGTEXT,
        status ENUM('proposed', 'accepted', 'rejected', 'completed', 'cancelled') DEFAULT 'proposed',
        notes LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (scheduled_with) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_project (project_id),
        INDEX idx_appointment_date (appointment_date),
        INDEX idx_status (status)
      )
    `);

    // Tracker/Progress Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS progress_tracker (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        created_by INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description LONGTEXT,
        progress_percentage INT DEFAULT 0,
        category VARCHAR(100),
        entry_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_project (project_id),
        INDEX idx_entry_date (entry_date)
      )
    `);

    // Notifications Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message LONGTEXT,
        type VARCHAR(50),
        related_entity VARCHAR(50),
        related_id INT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_is_read (is_read)
      )
    `);

    console.log('✓ Database schema initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await conn.release();
  }
};

initializeDatabase();
