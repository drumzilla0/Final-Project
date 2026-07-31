/* ==========================================================================
   IDENTIFICATION: BACKEND - GRAPHQL RESOLVERS
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   DESCRIPTION: GraphQL resolver functions
   ========================================================================== */

const pool = require('../../config/database');
const AuthController = require('../../controllers/authController');
const ProjectController = require('../../controllers/projectController');
const jwt = require('jsonwebtoken');

const resolvers = {
  Query: {
    // Auth
    me: async (_, __, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      return context.user;
    },

    login: async (_, { email, password }) => {
      return await AuthController.login(email, password);
    },

    // Projects
    projects: async (_, { status }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      const result = await ProjectController.getProjects(
        context.user.id,
        context.user.role,
        { status }
      );
      return result.projects || [];
    },

    project: async (_, { id }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      const result = await ProjectController.getProjectById(id);
      return result.project;
    },

    // Users
    users: async (_, { role }) => {
      const conn = await pool.getConnection();
      let query = 'SELECT id, email, name, role, is_active, is_default_password, created_at, updated_at FROM users WHERE 1=1';
      const params = [];
      
      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }

      const [users] = await conn.query(query, params);
      conn.release();

      return users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: u.is_active,
        isDefaultPassword: u.is_default_password,
        createdAt: u.created_at.toISOString(),
        updatedAt: u.updated_at.toISOString()
      }));
    },

    // Messages
    messages: async (_, { unreadOnly }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const conn = await pool.getConnection();
      let query = `
        SELECT m.*, 
               u1.name as sender_name, u1.email as sender_email,
               u2.name as recipient_name, u2.email as recipient_email
        FROM messages m
        JOIN users u1 ON m.sender_id = u1.id
        JOIN users u2 ON m.recipient_id = u2.id
        WHERE m.recipient_id = ?
      `;

      if (unreadOnly) {
        query += ` AND m.is_read = FALSE`;
      }

      const [messages] = await conn.query(query, [context.user.id]);
      conn.release();

      return messages.map(m => ({
        id: m.id,
        senderId: m.sender_id,
        recipientId: m.recipient_id,
        projectId: m.project_id,
        subject: m.subject,
        body: m.body,
        isRead: m.is_read,
        readAt: m.read_at?.toISOString(),
        createdAt: m.created_at.toISOString()
      }));
    }
  },

  Mutation: {
    // Auth
    changePassword: async (_, { newPassword, confirmPassword }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      return await AuthController.changePassword(context.user.id, newPassword, confirmPassword);
    },

    // Projects
    createProject: async (_, { studentId, supervisorId, title, description, startDate, endDate }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const result = await ProjectController.createProject(
        studentId,
        supervisorId,
        { title, description, startDate, endDate }
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      return await ProjectController.getProjectById(result.projectId);
    },

    updateProject: async (_, { id, title, description, status, endDate }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const result = await ProjectController.updateProject(id, {
        title,
        description,
        status,
        endDate
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      return await ProjectController.getProjectById(id);
    },

    deleteProject: async (_, { id }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      const result = await ProjectController.deleteProject(id);
      return result.success;
    },

    // Messages
    sendMessage: async (_, { recipientId, projectId, subject, body }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const conn = await pool.getConnection();
      const [result] = await conn.query(
        `INSERT INTO messages (sender_id, recipient_id, project_id, subject, body)
         VALUES (?, ?, ?, ?, ?)`,
        [context.user.id, recipientId, projectId, subject, body]
      );

      const [messages] = await conn.query(
        'SELECT * FROM messages WHERE id = ?',
        [result.insertId]
      );

      conn.release();

      const msg = messages[0];
      return {
        id: msg.id,
        senderId: msg.sender_id,
        recipientId: msg.recipient_id,
        projectId: msg.project_id,
        subject: msg.subject,
        body: msg.body,
        isRead: msg.is_read,
        readAt: msg.read_at?.toISOString(),
        createdAt: msg.created_at.toISOString()
      };
    },

    markMessageAsRead: async (_, { id }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const conn = await pool.getConnection();
      await conn.query(
        'UPDATE messages SET is_read = TRUE, read_at = NOW() WHERE id = ?',
        [id]
      );

      const [messages] = await conn.query('SELECT * FROM messages WHERE id = ?', [id]);
      conn.release();

      const msg = messages[0];
      return {
        id: msg.id,
        senderId: msg.sender_id,
        recipientId: msg.recipient_id,
        projectId: msg.project_id,
        subject: msg.subject,
        body: msg.body,
        isRead: msg.is_read,
        readAt: msg.read_at?.toISOString(),
        createdAt: msg.created_at.toISOString()
      };
    }
  }
};

module.exports = resolvers;
