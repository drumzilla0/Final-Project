/* ==========================================================================
   IDENTIFICATION: BACKEND - PROJECT CONTROLLER
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   DESCRIPTION: Project management logic - CRUD operations
   ========================================================================== */

const pool = require('../config/database');

class ProjectController {
  static async createProject(studentId, supervisorId, projectData) {
    try {
      const { title, description, startDate, endDate } = projectData;
      const conn = await pool.getConnection();

      const [result] = await conn.query(
        `INSERT INTO projects (student_id, supervisor_id, title, description, start_date, end_date, status)
         VALUES (?, ?, ?, ?, ?, ?, 'proposed')`,
        [studentId, supervisorId, title, description, startDate, endDate]
      );

      conn.release();

      return {
        success: true,
        message: 'Project created successfully',
        projectId: result.insertId
      };
    } catch (error) {
      return {
        success: false,
        message: 'Project creation failed: ' + error.message
      };
    }
  }

  static async getProjects(userId, role, filters = {}) {
    try {
      const conn = await pool.getConnection();
      let query = `
        SELECT p.*, 
               u1.name as student_name, u1.email as student_email,
               u2.name as supervisor_name, u2.email as supervisor_email
        FROM projects p
        JOIN students s ON p.student_id = s.id
        JOIN users u1 ON s.user_id = u1.id
        JOIN supervisors sup ON p.supervisor_id = sup.id
        JOIN users u2 ON sup.user_id = u2.id
        WHERE 1=1
      `;
      const params = [];

      // Role-based filtering
      if (role === 'student') {
        query += ' AND p.student_id IN (SELECT id FROM students WHERE user_id = ?)';
        params.push(userId);
      } else if (role === 'supervisor') {
        query += ' AND p.supervisor_id IN (SELECT id FROM supervisors WHERE user_id = ?)';
        params.push(userId);
      }

      // Additional filters
      if (filters.status) {
        query += ' AND p.status = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY p.created_at DESC';

      const [projects] = await conn.query(query, params);
      conn.release();

      return {
        success: true,
        projects: projects
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch projects: ' + error.message
      };
    }
  }

  static async getProjectById(projectId) {
    try {
      const conn = await pool.getConnection();

      const [projects] = await conn.query(
        `SELECT p.*, 
                u1.name as student_name, u1.email as student_email,
                u2.name as supervisor_name, u2.email as supervisor_email
         FROM projects p
         JOIN students s ON p.student_id = s.id
         JOIN users u1 ON s.user_id = u1.id
         JOIN supervisors sup ON p.supervisor_id = sup.id
         JOIN users u2 ON sup.user_id = u2.id
         WHERE p.id = ?`,
        [projectId]
      );

      conn.release();

      if (projects.length === 0) {
        return {
          success: false,
          message: 'Project not found'
        };
      }

      return {
        success: true,
        project: projects[0]
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch project: ' + error.message
      };
    }
  }

  static async updateProject(projectId, updateData) {
    try {
      const conn = await pool.getConnection();
      const { title, description, status, endDate } = updateData;

      await conn.query(
        `UPDATE projects 
         SET title = ?, description = ?, status = ?, end_date = ?
         WHERE id = ?`,
        [title, description, status, endDate, projectId]
      );

      conn.release();

      return {
        success: true,
        message: 'Project updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Project update failed: ' + error.message
      };
    }
  }

  static async deleteProject(projectId) {
    try {
      const conn = await pool.getConnection();

      await conn.query('DELETE FROM projects WHERE id = ?', [projectId]);
      conn.release();

      return {
        success: true,
        message: 'Project deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Project deletion failed: ' + error.message
      };
    }
  }
}

module.exports = ProjectController;
