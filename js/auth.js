/* ==========================================================================
   IDENTIFICATION: FRONT-END LOGIC (JAVASCRIPT) - AUTHENTICATION & SECURITY
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: Handles Login Authentication, Default Password Enforcement Modal,
                New Password Creation, Session Token Management, & Logout.
   ========================================================================== */

(function() {
  'use strict';

  window.SSMSAuth = {
    getCurrentUser: function() {
      const session = localStorage.getItem('ssms_session');
      if (!session) return null;
      let user = JSON.parse(session);
      if (window.SSMSData) {
        const users = window.SSMSData.getUsers();
        const freshUser = users.find(u => u.id === user.id);
        if (freshUser) {
          user = freshUser;
          localStorage.setItem('ssms_session', JSON.stringify(user));
        }
      }
      return user;
    },

    getToken: function() {
      return localStorage.getItem('ssms_token');
    },

    setToken: function(token) {
      if (token) {
        localStorage.setItem('ssms_token', token);
      }
    },

    clearAuthStorage: function() {
      localStorage.removeItem('ssms_session');
      localStorage.removeItem('ssms_token');
      localStorage.removeItem('ssms_pending_login');
    },

    setPendingLogin: function(payload) {
      localStorage.setItem('ssms_pending_login', JSON.stringify(payload));
    },

    getPendingLogin: function() {
      const pending = localStorage.getItem('ssms_pending_login');
      return pending ? JSON.parse(pending) : null;
    },

    clearPendingLogin: function() {
      localStorage.removeItem('ssms_pending_login');
    },

    validateSession: async function() {
      try {
        const response = await window.SSMSApi.getMe();
        if (response.success && response.user) {
          localStorage.setItem('ssms_session', JSON.stringify(response.user));
          return true;
        }
      } catch (error) {
        // no-op
      }
      this.clearAuthStorage();
      return false;
    },

    login: async function(email, password) {
      const cleanEmail = email.trim().toLowerCase();
      const response = await window.SSMSApi.login(cleanEmail, password);

      if (!response.success) {
        return { success: false, message: response.message || 'Unable to log in. Please try again.' };
      }

      const sessionUser = { ...response.user };

      if (response.token) {
        this.setToken(response.token);
      }

      if (response.requirePasswordChange) {
        this.setPendingLogin({ user: sessionUser, token: response.token });
        return {
          success: true,
          requirePasswordChange: true,
          user: sessionUser,
          message: response.message || 'Default password detected. Please create a new password.'
        };
      }

      localStorage.setItem('ssms_session', JSON.stringify(sessionUser));

      return {
        success: true,
        requirePasswordChange: false,
        user: sessionUser,
        message: response.message || 'Login successful. Redirecting to workspace portal...'
      };
    },

    forceCreateNewPassword: async function(userId, newPassword, confirmPassword) {
      if (!newPassword || newPassword.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters long.' };
      }

      if (newPassword !== confirmPassword) {
        return { success: false, message: 'New password and password confirmation do not match.' };
      }

      const pendingLogin = this.getPendingLogin();
      if (!pendingLogin || !pendingLogin.token) {
        return { success: false, message: 'No pending login session found. Please log in again.' };
      }

      this.setToken(pendingLogin.token);
      const response = await window.SSMSApi.changePassword(newPassword, confirmPassword);

      if (!response.success) {
        return { success: false, message: response.message || 'Password change failed.' };
      }

      localStorage.setItem('ssms_session', JSON.stringify(pendingLogin.user));
      this.clearPendingLogin();

      return {
        success: true,
        user: pendingLogin.user,
        message: response.message || 'Password changed successfully.'
      };
    },

    logout: async function() {
      try {
        await window.SSMSApi.logout();
      } catch (error) {
        // ignore errors on logout
      }

      this.clearAuthStorage();
      window.location.reload();
    }
  };
})();
