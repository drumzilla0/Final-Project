/* ==========================================================================
   IDENTIFICATION: BACKEND - SEED DATA SCRIPT
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   DESCRIPTION: Initialize database with demo users
   ========================================================================== */

const pool = require('./config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedDatabase = async () => {
  const conn = await pool.getConnection();

  try {
    console.log('Seeding SSMS Database with demo users...\n');

    // Demo users data
    const demoUsers = [
      {
        email: 'hod@univ.edu',
        password: 'admin123',
        name: 'Dr. Head of Department',
        role: 'admin'
      },
      {
        email: 'sup2026@univ.edu',
        password: 'super123',
        name: 'Prof. Supervisor',
        role: 'supervisor'
      },
      {
        email: 'std2026@univ.edu',
        password: 'student123',
        name: 'John Student',
        role: 'student'
      }
    ];

    // Insert users
    for (const user of demoUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const [result] = await conn.query(
        `INSERT INTO users (email, password_hash, name, role, is_default_password)
         VALUES (?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE password_hash = ?, is_default_password = TRUE`,
        [user.email.toLowerCase(), hashedPassword, user.name, user.role, hashedPassword]
      );

      console.log(`✓ ${user.role.toUpperCase()}: ${user.email} (password: ${user.password})`);
    }

    // Insert demo student record
    const [adminUsers] = await conn.query(
      'SELECT id FROM users WHERE email = ?',
      ['std2026@univ.edu']
    );

    if (adminUsers.length > 0) {
      const studentUserId = adminUsers[0].id;

      const [existingStudent] = await conn.query(
        'SELECT id FROM students WHERE user_id = ?',
        [studentUserId]
      );

      if (existingStudent.length === 0) {
        await conn.query(
          `INSERT INTO students (user_id, student_id, department, enrollment_year, cgpa)
           VALUES (?, ?, ?, ?, ?)`,
          [studentUserId, 'STD-2026-001', 'Computer Science', 2026, 3.8]
        );
        console.log(`✓ Student profile created`);
      }
    }

    // Insert demo supervisor record
    const [supUsers] = await conn.query(
      'SELECT id FROM users WHERE email = ?',
      ['sup2026@univ.edu']
    );

    if (supUsers.length > 0) {
      const supervisorUserId = supUsers[0].id;

      const [existingSup] = await conn.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [supervisorUserId]
      );

      if (existingSup.length === 0) {
        await conn.query(
          `INSERT INTO supervisors (user_id, employee_id, department, specialization, office_location)
           VALUES (?, ?, ?, ?, ?)`,
          [supervisorUserId, 'SUP-2026-001', 'Computer Science', 'Artificial Intelligence', 'Tech Building, Room 301']
        );
        console.log(`✓ Supervisor profile created`);
      }
    }

    console.log('\n✓ Database seeding completed successfully\n');
    console.log('Demo Credentials:');
    console.log('─────────────────────────────────────────');
    console.log('Admin/HOD:  hod@univ.edu / admin123');
    console.log('Supervisor: sup2026@univ.edu / super123');
    console.log('Student:    std2026@univ.edu / student123');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Database seeding failed:', error.message);
    process.exit(1);
  } finally {
    await conn.release();
  }
};

seedDatabase();
