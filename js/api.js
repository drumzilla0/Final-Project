/* ==========================================================================
   IDENTIFICATION: FRONT-END LOGIC (JAVASCRIPT) - API SERVICE
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: HTTP helper module for communicating with SSMS backend REST APIs.
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

      const response = await fetch(url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

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
    },

    login: function(email, password) {
      return this.request('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });
    },

    changePassword: function(newPassword, confirmPassword) {
      return this.request('/api/auth/change-password', {
        method: 'POST',
        body: { newPassword, confirmPassword }
      });
    },

    getMe: function() {
      return this.request('/api/auth/me', {
        method: 'GET'
      });
    },

    logout: function() {
      return this.request('/api/auth/logout', {
        method: 'POST'
      });
    }
  };
})();