/* ==========================================================================
   IDENTIFICATION: FRONT-END LOGIC (JAVASCRIPT) - MAIN APPLICATION CONTROLLER
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: Application Initialization, View Routing, Dynamic Navigation Rendering,
                1-Click Quick Demo Login Handlers, Modal Dialog Controls, & Event Listeners.
   ========================================================================== */

(function() {
  'use strict';

  window.SSMSApp = {
    init: function() {
      this.checkSessionAndRender();
      this.setupGlobalEventListeners();
    },

    checkSessionAndRender: function() {
      const currentUser = window.SSMSAuth.getCurrentUser();
      const loginOverlay = document.getElementById('loginOverlay');
      const appContainer = document.getElementById('appShellContainer');

      if (!currentUser) {
        // Show Login Page Only (Front View hides roster & dashboard)
        if (loginOverlay) loginOverlay.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
        this.renderLoginScreen();
      } else {
        // User Authenticated: Show Dashboard Shell
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
        
        this.renderSidebar(currentUser);
        this.renderHeader(currentUser);

        // Default initial tab based on role
        if (currentUser.role === 'admin') {
          this.switchView('admin');
        } else if (currentUser.role === 'supervisor') {
          this.switchView('supervisor');
        } else {
          this.switchView('tracker');
        }
      }
    },

    renderLoginScreen: function() {
      const authContainer = document.getElementById('authContainerArea');
      if (!authContainer) return;

      authContainer.innerHTML = `
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">SSMS</div>
            <h2 class="auth-title">Student & Supervisor Portal</h2>
            <p class="auth-subtitle">Project & Thesis Management System</p>
          </div>
          <div class="auth-body">
            <form id="loginForm">
              <div class="form-group">
                <label class="form-label">Portal Email Address</label>
                <input type="email" id="loginEmail" class="form-control" placeholder="e.g. hod@univ.edu" required>
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" id="loginPassword" class="form-control" placeholder="••••••••" required>
              </div>
              <button type="submit" class="btn btn-accent" style="width: 100%; padding: 12px; margin-top: 10px; font-weight: 700;">
                Secure Portal Login →
              </button>
            </form>
          </div>
        </div>
      `;

      document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;

        await this.processLoginAttempt(email, pass);
      });
    },

    processLoginAttempt: async function(email, password) {
      const result = await window.SSMSAuth.login(email, password);

      if (!result.success) {
        alert(result.message);
        return;
      }

      if (result.requirePasswordChange) {
        this.promptMandatoryPasswordChange(result.user);
      } else {
        this.checkSessionAndRender();
      }
    },

    promptMandatoryPasswordChange: function(tempUser) {
      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">🔐 Mandatory Password Creation Required</div>
          </div>
          <div class="modal-body">
            <div class="alert-box alert-warning">
              You are logging in with a default password. To protect your portal, you MUST create your new secret password now.
            </div>
            <form id="forcePasswordForm">
              <div class="form-group">
                <label class="form-label">Logged In Account</label>
                <input type="text" class="form-control" value="${tempUser.name} (${tempUser.email})" readonly style="font-weight:600; color:var(--primary-blue);">
              </div>
              <div class="form-group">
                <label class="form-label">Create New Secret Password</label>
                <input type="password" id="newPassInput" class="form-control" placeholder="Enter new password (e.g. admin2026)" required autofocus>
              </div>
              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" id="confirmPassInput" class="form-control" placeholder="Re-enter new password" required>
              </div>
              <button type="submit" class="btn btn-accent" style="width: 100%; padding: 12px; margin-top: 10px; font-weight:700;">
                Save New Password & Open Portal →
              </button>
            </form>
          </div>
        </div>
      `;

      this.showCustomModal(modalHtml, false);

      document.getElementById('forcePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newP = document.getElementById('newPassInput').value;
        const confP = document.getElementById('confirmPassInput').value;

        const res = await window.SSMSAuth.forceCreateNewPassword(tempUser.id, newP, confP);
        if (!res.success) {
          alert(res.message);
          return;
        }

        this.closeModal();
        alert(`Success! Password created for ${tempUser.name}. Welcome to the SSMS Portal.`);
        this.checkSessionAndRender();
      });
    },

    renderSidebar: function(user) {
      const sidebarNav = document.getElementById('sidebarNavContainer');
      const userBadge = document.getElementById('userBadgeContainer');
      if (!sidebarNav) return;

      let navHtml = ``;

      if (user.role === 'student') {
        navHtml += `
          <a href="#" class="nav-link active" id="nav-tracker" onclick="window.SSMSApp.switchView('tracker')">
            <span>🎯</span> <span class="nav-text">Project Tracker</span>
          </a>
          <a href="#" class="nav-link" id="nav-vault" onclick="window.SSMSApp.switchView('vault')">
            <span>📁</span> <span class="nav-text">Document Vault</span>
          </a>
          <a href="#" class="nav-link" id="nav-messages" onclick="window.SSMSApp.switchView('messages')">
            <span>💬</span> <span class="nav-text">Direct Messages</span>
          </a>
          <a href="#" class="nav-link" id="nav-appointments" onclick="window.SSMSApp.switchView('appointments')">
            <span>📅</span> <span class="nav-text">Book Meetings</span>
          </a>
        `;
      } else if (user.role === 'supervisor') {
        navHtml += `
          <a href="#" class="nav-link active" id="nav-supervisor" onclick="window.SSMSApp.switchView('supervisor')">
            <span>🎓</span> <span class="nav-text">My Students</span>
          </a>
          <a href="#" class="nav-link" id="nav-tracker" onclick="window.SSMSApp.switchView('tracker')">
            <span>🎯</span> <span class="nav-text">Stage Tracker</span>
          </a>
          <a href="#" class="nav-link" id="nav-vault" onclick="window.SSMSApp.switchView('vault')">
            <span>📁</span> <span class="nav-text">Document Vault</span>
          </a>
          <a href="#" class="nav-link" id="nav-messages" onclick="window.SSMSApp.switchView('messages')">
            <span>💬</span> <span class="nav-text">Student Messages</span>
          </a>
          <a href="#" class="nav-link" id="nav-appointments" onclick="window.SSMSApp.switchView('appointments')">
            <span>📅</span> <span class="nav-text">Appointments</span>
          </a>
        `;
      } else if (user.role === 'admin') {
        navHtml += `
          <a href="#" class="nav-link active" id="nav-admin" onclick="window.SSMSApp.switchView('admin')">
            <span>🏛️</span> <span class="nav-text">HOD Dashboard</span>
          </a>
          <a href="#" class="nav-link" id="nav-tracker" onclick="window.SSMSApp.switchView('tracker')">
            <span>🎯</span> <span class="nav-text">Global Tracker</span>
          </a>
          <a href="#" class="nav-link" id="nav-vault" onclick="window.SSMSApp.switchView('vault')">
            <span>📁</span> <span class="nav-text">All Documents</span>
          </a>
          <a href="#" class="nav-link" id="nav-messages" onclick="window.SSMSApp.switchView('messages')">
            <span>💬</span> <span class="nav-text">System Chat</span>
          </a>
          <a href="#" class="nav-link" id="nav-appointments" onclick="window.SSMSApp.switchView('appointments')">
            <span>📅</span> <span class="nav-text">All Appointments</span>
          </a>
        `;
      }

      sidebarNav.innerHTML = navHtml;

      const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      userBadge.innerHTML = `
        <div class="user-badge">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-role-tag">${user.role} portal</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" style="width: 100%; border-color: rgba(255,255,255,0.4); color: white;" onclick="window.SSMSAuth.logout()">
          🔒 Logout Portal
        </button>
      `;
    },

    renderHeader: function(user) {
      const headerTitle = document.getElementById('headerTitle');
      const headerSubtitle = document.getElementById('headerSubtitle');
      if (headerTitle) headerTitle.innerText = `Welcome, ${user.name}`;
      if (headerSubtitle) headerSubtitle.innerText = `${user.department || 'Computer Science Department'} | SSMS Workspace`;
    },

    switchView: function(viewName) {
      // Highlight nav links
      document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
      const activeNav = document.getElementById(`nav-${viewName}`);
      if (activeNav) activeNav.classList.add('active');

      const mainContent = document.getElementById('mainContentArea');
      if (!mainContent) return;

      if (viewName === 'tracker') {
        mainContent.innerHTML = `<div id="trackerContentArea"></div>`;
        window.SSMSTracker.renderTracker('trackerContentArea');
      } else if (viewName === 'vault') {
        mainContent.innerHTML = `<div id="vaultContentArea"></div>`;
        window.SSMSDocuments.renderVault('vaultContentArea');
      } else if (viewName === 'messages') {
        mainContent.innerHTML = `<div id="messagesContentArea"></div>`;
        window.SSMSMessages.renderMessagingPortal('messagesContentArea');
      } else if (viewName === 'appointments') {
        mainContent.innerHTML = `<div id="appointmentsContentArea"></div>`;
        window.SSMSAppointments.renderAppointmentsPage('appointmentsContentArea');
      } else if (viewName === 'admin') {
        mainContent.innerHTML = `<div id="adminContentArea"></div>`;
        window.SSMSAdmin.renderAdminPanel('adminContentArea');
      } else if (viewName === 'supervisor') {
        this.renderSupervisorStudentList(mainContent);
      }
    },

    renderSupervisorStudentList: function(container) {
      const users = window.SSMSData.getUsers();
      const currentUser = window.SSMSAuth.getCurrentUser();
      const assignedStudents = users.filter(u => u.role === 'student' && u.supervisorId === currentUser.id);

      let html = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span style="color: var(--primary-blue); font-size: 1.4rem;">🎓</span>
              Assigned Project Students
            </div>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Matric No</th>
                  <th>Student Name</th>
                  <th>Project Topic</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
      `;

      if (assignedStudents.length === 0) {
        html += `<tr><td colspan="4" style="text-align:center; padding:30px;">No students assigned to you yet by HOD.</td></tr>`;
      } else {
        assignedStudents.forEach(std => {
          html += `
            <tr>
              <td><strong>${std.matricNo || 'CSC/2026/001'}</strong></td>
              <td><strong>${std.name}</strong></td>
              <td>${std.projectTitle || 'Topic Pending'}</td>
              <td>
                <div style="display:flex; gap: 8px;">
                  <button class="btn btn-accent btn-sm" onclick="window.SSMSApp.switchView('tracker')">
                    Track Stage
                  </button>
                  <button class="btn btn-primary btn-sm" onclick="window.SSMSMessages.selectRecipient('${std.id}'); window.SSMSApp.switchView('messages');">
                    💬 Message
                  </button>
                </div>
              </td>
            </tr>
          `;
        });
      }

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.innerHTML = html;
    },

    showCustomModal: function(htmlContent, allowCloseOverlay = true) {
      let overlay = document.getElementById('globalModalOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'globalModalOverlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
      }

      overlay.innerHTML = htmlContent;
      overlay.classList.add('active');

      if (allowCloseOverlay) {
        overlay.onclick = (e) => {
          if (e.target === overlay) this.closeModal();
        };
      } else {
        overlay.onclick = null;
      }
    },

    closeModal: function() {
      const overlay = document.getElementById('globalModalOverlay');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.innerHTML = ''; }, 200);
      }
    },

    showNotification: function(msg, type = 'info') {
      alert(`[SSMS SYSTEM NOTIFICATION]\n\n${msg}`);
    },

    setupGlobalEventListeners: function() {
      // Reserved for global app events
    }
  };

  // Bootstrap when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    window.SSMSApp.init();
  });
})();
