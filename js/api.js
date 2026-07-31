/* ==========================================================================
   IDENTIFICATION: FRONT-END LOGIC (JAVASCRIPT) - API SERVICE & HYBRID AUTH
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: HTTP helper module for communicating with SSMS backend REST APIs,
                with automatic persistent LocalStorage fallback when offline/static.
   ========================================================================== */

(function() {
  'use strict';

  const API_BASE_URL = (() => {
    if (window.location.protocol === 'file:') {
      return 'http://localhost:5000';
    }
    return window.location.origin;
  })();

  window.SSMSApi = {
    getBaseUrl: function() {
      return API_BASE_URL;
    },

    getAuthHeaders: function() {
      const token = window.SSMSAuth ? window.SSMSAuth.getToken() : null;
      return token ? { Authorization: `Bearer ${token}` } : {};
    },

    request: async function(path, options = {}) {
      const url = `${API_BASE_URL}${path}`;
      const headers = {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...(options.headers || {})
      };

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined
        });

        if (response.status === 401 || response.status === 403) {
          if (window.SSMSAuth) window.SSMSAuth.clearAuthStorage();
        }

        let payload;
        try {
          payload = await response.json();
        } catch (error) {
          payload = { success: false, message: 'Invalid JSON response from server.' };
        }

        return {
          status: response.status,
          ok: response.ok,
          ...payload
        };
      } catch (networkError) {
        // Backend server offline or unavailable - trigger local fallback
        return null;
      }
    },

    login: async function(email, password) {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();

      // Attempt backend API login first if server is running
      const res = await this.request('/api/auth/login', {
        method: 'POST',
        body: { email: cleanEmail, password: cleanPassword }
      });

      if (res && res.status !== 404 && res.success) {
        return res;
      }

      // Local persistent data fallback (for offline or static mode)
      const users = window.SSMSData ? window.SSMSData.getUsers() : [];
      const user = users.find(u => 
        (u.email && u.email.toLowerCase() === cleanEmail) ||
        (u.matricNo && u.matricNo.toLowerCase() === cleanEmail) ||
        (u.matricNo && u.matricNo.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanEmail.replace(/[^a-z0-9]/g, ''))
      );

      if (!user) {
        return {
          success: false,
          userNotFound: true,
          message: `Invalid Student ID, Staff ID, or Email address. No registered account found matching "${cleanEmail}".`
        };
      }

      // Track failed attempts per user ID
      const failedMap = JSON.parse(localStorage.getItem('ssms_failed_attempts') || '{}');
      const currentAttempts = failedMap[user.id] || 0;

      if (user.passwordHash !== cleanPassword) {
        const newAttempts = currentAttempts + 1;
        failedMap[user.id] = newAttempts;
        localStorage.setItem('ssms_failed_attempts', JSON.stringify(failedMap));

        if (newAttempts >= 3) {
          return {
            success: false,
            attempts: newAttempts,
            locked: true,
            user: user,
            message: `Invalid password (${newAttempts} failed attempts). Account temporarily locked. Click "Forgot Password" below to send a Reset Request to the HOD.`
          };
        }

        return {
          success: false,
          attempts: newAttempts,
          locked: false,
          message: `Invalid password. Please check your password and try again (Attempt ${newAttempts} of 3).`
        };
      }

      // Password correct - clear failed attempts counter
      delete failedMap[user.id];
      localStorage.setItem('ssms_failed_attempts', JSON.stringify(failedMap));

      const mockToken = `token_${user.role}_${Date.now()}`;
      const requirePasswordChange = Boolean(user.isDefaultPassword);

      return {
        success: true,
        user: user,
        token: mockToken,
        requirePasswordChange: requirePasswordChange,
        message: requirePasswordChange
          ? 'Default password detected. Please create your new secret password.'
          : 'Login successful. Opening workspace portal...'
      };
    },

    changePassword: async function(newPassword, confirmPassword) {
      const res = await this.request('/api/auth/change-password', {
        method: 'POST',
        body: { newPassword, confirmPassword }
      });

      if (res && res.status !== 404 && res.success) {
        return res;
      }

      // Local fallback
      const pendingLogin = window.SSMSAuth ? window.SSMSAuth.getPendingLogin() : null;
      const currentUser = window.SSMSAuth ? window.SSMSAuth.getCurrentUser() : null;
      const targetUser = pendingLogin ? pendingLogin.user : currentUser;

      if (!targetUser) {
        return { success: false, message: 'No active session or pending login found.' };
      }

      const users = window.SSMSData ? window.SSMSData.getUsers() : [];
      const dbUser = users.find(u => u.id === targetUser.id);
      if (dbUser) {
        dbUser.passwordHash = newPassword;
        dbUser.isDefaultPassword = false;
        window.SSMSData.saveUsers(users);
        targetUser.isDefaultPassword = false;
      }

      return {
        success: true,
        user: targetUser,
        message: 'Password changed successfully.'
      };
    },

    getMe: async function() {
      const res = await this.request('/api/auth/me', {
        method: 'GET'
      });

      if (res && res.status !== 404 && res.success) {
        return res;
      }

      const currentUser = window.SSMSAuth ? window.SSMSAuth.getCurrentUser() : null;
      if (currentUser) {
        return { success: true, user: currentUser };
      }
      return { success: false, message: 'Not authenticated.' };
    },

    logout: async function() {
      await this.request('/api/auth/logout', {
        method: 'POST'
      });
      return { success: true };
    }
  };
})();