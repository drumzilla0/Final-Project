/* ==========================================================================
   IDENTIFICATION: BACKEND - AUTHENTICATION CONTROLLER
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   DESCRIPTION: Authentication logic - login, password change, logout
   ========================================================================== */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'ssms_dev_secret';

class AuthController {
  static async login(email, password) {
    try {
      const conn = await pool.getConnection();
      
      // Find user by email
      const [users] = await conn.query(
        'SELECT id, email, password_hash, name, role, is_active, is_default_password FROM users WHERE email = ?',
        [email.toLowerCase()]
      );

      conn.release();

      if (users.length === 0) {
        return {
          success: false,
          message: 'Invalid Student ID, Staff ID, or Email address. Account not found.'
        };
      }

      const user = users[0];

      if (!user.is_active) {
        return {
          success: false,
          message: 'Account is inactive. Contact administrator.'
        };
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid password. Please check your password and try again.'
        };
      }

      // Check if user has default password
      if (user.is_default_password) {
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return {
          success: true,
          requirePasswordChange: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          token,
          message: 'Default password detected. Create new password required.'
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return {
        success: true,
        requirePasswordChange: false,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token: token,
        message: 'Login successful'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Login failed: ' + error.message
      };
    }
  }

  static async changePassword(userId, newPassword, confirmPassword) {
    try {
      if (!newPassword || newPassword.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters long.'
        };
      }

      if (newPassword !== confirmPassword) {
        return {
          success: false,
          message: 'Passwords do not match.'
        };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const conn = await pool.getConnection();

      await conn.query(
        'UPDATE users SET password_hash = ?, is_default_password = FALSE WHERE id = ?',
        [hashedPassword, userId]
      );

      conn.release();

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Password change failed: ' + error.message
      };
    }
  }

  static async resetPassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const conn = await pool.getConnection();

      await conn.query(
        'UPDATE users SET password_hash = ?, is_default_password = TRUE WHERE id = ?',
        [hashedPassword, userId]
      );

      conn.release();

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Password reset failed: ' + error.message
      };
    }
  }
}

module.exports = AuthController;
