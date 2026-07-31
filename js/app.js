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
    init: async function() {
      await this.checkSessionAndRender();
      this.setupGlobalEventListeners();
    },

    escapeHTML: function(value) {
      if (value === null || value === undefined) return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    checkSessionAndRender: async function() {
      const loginOverlay = document.getElementById('loginOverlay');
      const appContainer = document.getElementById('appShellContainer');
      let currentUser = window.SSMSAuth.getCurrentUser();

      if (window.SSMSAuth.getToken()) {
        const valid = await window.SSMSAuth.validateSession();
        if (valid) {
          currentUser = window.SSMSAuth.getCurrentUser();
        } else {
          currentUser = null;
        }
      }

      if (!currentUser) {
        if (loginOverlay) loginOverlay.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
        this.renderFrontCover();
      } else {
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
        
        this.renderSidebar(currentUser);
        this.renderHeader(currentUser);

        if (currentUser.role === 'admin') {
          this.switchView('admin');
        } else if (currentUser.role === 'supervisor') {
          this.switchView('supervisor');
        } else {
          this.switchView('tracker');
        }
      }
    },

    renderFrontCover: function() {
      const authContainer = document.getElementById('authContainerArea');
      if (!authContainer) return;

      authContainer.innerHTML = `
        <div class="front-cover-card">
          <div class="cover-hero">
            <h1 class="cover-welcome-title">Welcome to Student-Supervisor Management System</h1>
            <p class="cover-welcome-subtitle">
              Official academic project tracking and thesis supervision portal for <strong>Koforidua Technical University (KTU)</strong>.
            </p>

            <div class="cover-cta-group">
              <button id="btnProceedToLogin" class="btn btn-accent btn-lg cover-cta-btn">
                <span>Proceed to Portal Login</span>
                <span class="cta-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const proceedBtn = document.getElementById('btnProceedToLogin');
      if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
          this.renderLoginScreen();
        });
      }
    },

    renderLoginScreen: function() {
      const authContainer = document.getElementById('authContainerArea');
      if (!authContainer) return;

      authContainer.innerHTML = `
        <div class="auth-card">
          <div class="auth-card-top-nav">
            <button id="btnBackToCover" class="btn-back-link">
              ← Back to Welcome Cover
            </button>
          </div>
          <div class="auth-header">
            <h2 class="auth-title">Portal Secure Login</h2>
            <p class="auth-subtitle">Student-Supervisor Management System (KTU)</p>
          </div>
          <div class="auth-body">
            <form id="loginForm">
              <div id="loginErrorAlert" class="alert-box alert-error modal-alert--small" style="display: none;"></div>
              <div class="form-group">
                <label class="form-label">Student ID / Staff ID / Email Address</label>
                <input type="text" id="loginEmail" class="form-control" placeholder="e.g. 04/2023/0001D or BT04/2023/0001D or Asare002sid@ktu.edu.gh" required autofocus>
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <div class="modal-row">
                  <input type="password" id="loginPassword" class="form-control modal-input-flex" placeholder="••••••••" required>
                  <button type="button" id="togglePasswordBtn" class="btn btn-outline btn-sm modal-button-small" aria-label="Show password">Show</button>
                </div>
                <div class="modal-row-end">
                  <a href="#" onclick="window.SSMSApp.openForgotPasswordModal(); return false;" class="modal-link">Forgot Password?</a>
                </div>
              </div>
              <button type="submit" class="btn btn-accent modal-button-full">
                Secure Portal Login →
              </button>
            </form>
          </div>
        </div>
      `;

      const backBtn = document.getElementById('btnBackToCover');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.renderFrontCover();
        });
      }

      const passwordInput = document.getElementById('loginPassword');
      const togglePasswordBtn = document.getElementById('togglePasswordBtn');

      if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
          const isHidden = passwordInput.type === 'password';
          passwordInput.type = isHidden ? 'text' : 'password';
          togglePasswordBtn.textContent = isHidden ? 'Hide' : 'Show';
          togglePasswordBtn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
          passwordInput.focus();
        });
      }

      document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;

        await this.processLoginAttempt(email, pass);
      });
    },

    processLoginAttempt: async function(email, password) {
      const errorAlert = document.getElementById('loginErrorAlert');
      const authCard = document.querySelector('.auth-card');

      if (errorAlert) {
        errorAlert.style.display = 'none';
        errorAlert.innerHTML = '';
      }

      const result = await window.SSMSAuth.login(email, password);

      if (!result.success) {
        // Display inline card notification
        if (errorAlert) {
          errorAlert.innerHTML = `<span><strong>Login Failed:</strong> ${this.escapeHTML(result.message)}</span>`;
        }

        // Visual shake feedback on login card
        if (authCard) {
          authCard.classList.remove('login-shake');
          void authCard.offsetWidth; // trigger reflow
          authCard.classList.add('login-shake');
        }

        // Show floating toast notification banner
        this.showNotification(result.message, 'error');

        if (result.locked || (result.attempts && result.attempts >= 3)) {
          setTimeout(() => {
            this.openForgotPasswordModal(email);
          }, 1200);
        }
        return;
      }

      if (result.requirePasswordChange) {
        this.promptMandatoryPasswordChange(result.user);
      } else {
        this.showNotification(`Welcome back, ${this.escapeHTML(result.user.name)}!`, 'success');
        this.checkSessionAndRender();
      }
    },

    openForgotPasswordModal: function(defaultIdentifier) {
      const users = window.SSMSData ? window.SSMSData.getUsers() : [];
      let initialVal = defaultIdentifier || '';

      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">Password Reset Request</div>
            <button onclick="window.SSMSApp.closeModal()" class="btn-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="alert-box alert-warning modal-alert--small">
              If you forgot your password or had 3+ failed attempts, enter your Student ID, Staff ID, or Email below. A <strong>Password Reset Request</strong> will be sent directly to the Admin / HOD.
            </div>
            <form id="forgotPasswordForm">
              <div class="form-group">
                <label class="form-label">Student ID / Staff ID / Email Address</label>
                <input type="text" id="forgotIdInput" class="form-control" value="${this.escapeHTML(initialVal)}" placeholder="e.g. 04/2023/0001D or BT04/2023/0001D or Asare002sid@ktu.edu.gh" required autofocus>
              </div>
              <div class="modal-row-end">
                <button type="button" class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-accent">Send Reset Request to HOD</button>
              </div>
            </form>
          </div>
        </div>
      `;

      this.showCustomModal(modalHtml);

      document.getElementById('forgotPasswordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const inputVal = document.getElementById('forgotIdInput').value.trim().toLowerCase();
        if (!inputVal) return;

        const cleanVal = inputVal.replace(/[^a-z0-9]/g, '');

        const targetUser = users.find(u => 
          (u.email && u.email.toLowerCase() === inputVal) ||
          (u.matricNo && u.matricNo.toLowerCase() === inputVal) ||
          (u.matricNo && u.matricNo.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal) ||
          (u.staffId && u.staffId.toLowerCase() === inputVal) ||
          (u.staffId && u.staffId.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal)
        );

        if (!targetUser) {
          this.showNotification('No registered account found matching this Student ID, Staff ID, or Email.', 'error');
          return;
        }

        window.SSMSData.submitResetRequest(targetUser, 'User Submitted Password Reset Request');

        const defaultPass = targetUser.role === 'supervisor' ? 'Supervisor2026' : 'Student2026';
        this.closeModal();

        const successHtml = `
          <div class="modal-card">
            <div class="modal-header" style="background: var(--status-approved); color: white;">
              <div class="modal-title">Reset Request Sent Successfully</div>
              <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
            </div>
            <div class="modal-body">
              <div class="alert-box alert-success" style="margin-bottom: 16px;">
                <strong>Request Delivered!</strong> A Password Reset Request notification has been sent to the HOD for <strong>${this.escapeHTML(targetUser.name)}</strong>.
              </div>
              <p style="font-size:0.88rem; color:var(--text-dark); margin-bottom: 14px;">
                Once the HOD resets your password back to default (<code>${defaultPass}</code>), log in using <code>${defaultPass}</code>. You will then be prompted to create your new secret password.
              </p>
              <div class="modal-row-end">
                <button class="btn btn-primary" onclick="window.SSMSApp.closeModal();">Got it →</button>
              </div>
            </div>
          </div>
        `;
        this.showCustomModal(successHtml);
      });
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
                <input type="text" class="form-control" value="${this.escapeHTML(tempUser.name)} (${this.escapeHTML(tempUser.email)})" readonly style="font-weight:600; color:var(--primary-blue);">
              </div>
                      <div class="form-group">
                <label class="form-label">Create New Secret Password</label>
                <div style="display:flex; align-items:center; gap:8px;">
                  <input type="password" id="newPassInput" class="form-control" placeholder="Enter new password (e.g. admin2026)" required autofocus style="flex:1;">
                  <button type="button" id="toggleNewPassBtn" class="btn btn-outline btn-sm" aria-label="Show new password" style="padding: 10px 12px; white-space: nowrap;">Show</button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <div style="display:flex; align-items:center; gap:8px;">
                  <input type="password" id="confirmPassInput" class="form-control" placeholder="Re-enter new password" required style="flex:1;">
                  <button type="button" id="toggleConfirmPassBtn" class="btn btn-outline btn-sm" aria-label="Show confirm password" style="padding: 10px 12px; white-space: nowrap;">Show</button>
                </div>
              </div>
              <button type="submit" class="btn btn-accent" style="width: 100%; padding: 12px; margin-top: 10px; font-weight:700;">
                Save New Password & Open Portal →
              </button>
            </form>
          </div>
        </div>
      `;

      this.showCustomModal(modalHtml, false);

      const newPassInput = document.getElementById('newPassInput');
      const confirmPassInput = document.getElementById('confirmPassInput');
      const toggleNewPassBtn = document.getElementById('toggleNewPassBtn');
      const toggleConfirmPassBtn = document.getElementById('toggleConfirmPassBtn');

      if (toggleNewPassBtn && newPassInput) {
        toggleNewPassBtn.addEventListener('click', () => {
          const isHidden = newPassInput.type === 'password';
          newPassInput.type = isHidden ? 'text' : 'password';
          toggleNewPassBtn.textContent = isHidden ? 'Hide' : 'Show';
          toggleNewPassBtn.setAttribute('aria-label', isHidden ? 'Hide new password' : 'Show new password');
          newPassInput.focus();
        });
      }

      if (toggleConfirmPassBtn && confirmPassInput) {
        toggleConfirmPassBtn.addEventListener('click', () => {
          const isHidden = confirmPassInput.type === 'password';
          confirmPassInput.type = isHidden ? 'text' : 'password';
          toggleConfirmPassBtn.textContent = isHidden ? 'Hide' : 'Show';
          toggleConfirmPassBtn.setAttribute('aria-label', isHidden ? 'Hide confirm password' : 'Show confirm password');
          confirmPassInput.focus();
        });
      }

      document.getElementById('forcePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newP = document.getElementById('newPassInput').value;
        const confP = document.getElementById('confirmPassInput').value;

        const res = await window.SSMSAuth.forceCreateNewPassword(tempUser.id, newP, confP);
        if (!res.success) {
          this.showNotification(res.message, 'error');
          return;
        }

        this.closeModal();
        this.showNotification(`Success! Password created for ${this.escapeHTML(tempUser.name)}. Welcome to the SSMS Portal.`, 'success');
        this.checkSessionAndRender();
      });
    },

    renderSidebar: function(user) {
      const sidebarNav = document.getElementById('sidebarNavContainer');
      const userBadge = document.getElementById('userBadgeContainer');
      if (!sidebarNav) return;

      const escapedRole = this.escapeHTML(user.role);
      const escapedName = this.escapeHTML(user.name);
      let navHtml = ``;

      if (user.role === 'student') {
        navHtml += `
          <a href="#" class="nav-link active" id="nav-tracker" onclick="window.SSMSApp.switchView('tracker')">
            <span class="nav-text">Project Tracker</span>
          </a>
          <a href="#" class="nav-link" id="nav-vault" onclick="window.SSMSApp.switchView('vault')">
            <span class="nav-text">Document Vault</span>
          </a>
          <a href="#" class="nav-link" id="nav-messages" onclick="window.SSMSApp.switchView('messages')">
            <span class="nav-text">Direct Messages</span>
          </a>
          <a href="#" class="nav-link" id="nav-appointments" onclick="window.SSMSApp.switchView('appointments')">
            <span class="nav-text">Book Meetings</span>
          </a>
        `;
      } else if (user.role === 'supervisor') {
        navHtml += `
          <a href="#" class="nav-link active" id="nav-supervisor" onclick="window.SSMSApp.switchView('supervisor')">
            <span class="nav-text">My Students</span>
          </a>
          <a href="#" class="nav-link" id="nav-tracker" onclick="window.SSMSApp.switchView('tracker')">
            <span class="nav-text">Stage Tracker</span>
          </a>
          <a href="#" class="nav-link" id="nav-vault" onclick="window.SSMSApp.switchView('vault')">
            <span class="nav-text">Document Vault</span>
          </a>
          <a href="#" class="nav-link" id="nav-messages" onclick="window.SSMSApp.switchView('messages')">
            <span class="nav-text">Student Messages</span>
          </a>
          <a href="#" class="nav-link" id="nav-appointments" onclick="window.SSMSApp.switchView('appointments')">
            <span class="nav-text">Appointments</span>
          </a>
        `;
      } else if (user.role === 'admin') {
        navHtml += `
          <a href="#" class="nav-link active" id="nav-admin" onclick="window.SSMSApp.switchView('admin')">
            <span class="nav-text">HOD Dashboard</span>
          </a>
          <a href="#" class="nav-link" id="nav-allocation" onclick="window.SSMSApp.switchView('allocation')">
            <span class="nav-text">Allocation Matrix</span>
          </a>
          <a href="#" class="nav-link" id="nav-messages" onclick="window.SSMSApp.switchView('messages')">
            <span class="nav-text">Supervisor Chat</span>
          </a>
        `;
      }

      sidebarNav.innerHTML = navHtml;

      const initials = this.escapeHTML(user.name).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      userBadge.innerHTML = `
        <div class="user-badge">
          <div class="user-info">
            <div class="user-name">${escapedName}</div>
            <div class="user-role-tag">${escapedRole} portal</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" style="width: 100%; border-color: rgba(255,255,255,0.4); color: white;" onclick="window.SSMSAuth.logout()">
          Logout Portal
        </button>
      `;
    },

    renderHeader: function(user) {
      const headerTitle = document.getElementById('headerTitle');
      const headerSubtitle = document.getElementById('headerSubtitle');

      if (user.role === 'student') {
        const users = window.SSMSData ? window.SSMSData.getUsers() : [];
        const supervisor = users.find(u => u.id === user.supervisorId);
        const supName = supervisor ? supervisor.name : 'Unassigned (Awaiting HOD Allocation)';

        let teammateText = 'Solo Project';
        if (user.groupName || user.groupId) {
          const teammates = users.filter(u => u.role === 'student' && u.id !== user.id && (
            (user.groupName && u.groupName === user.groupName) ||
            (user.groupId && u.groupId === user.groupId)
          ));
          if (teammates.length > 0) {
            teammateText = teammates.map(t => t.name).join(', ');
          }
        }

        if (headerTitle) headerTitle.innerText = `Welcome, ${this.escapeHTML(user.name)}`;
        if (headerSubtitle) {
          headerSubtitle.innerHTML = `
            ${this.escapeHTML(user.program || 'Computer Science')} (${this.escapeHTML(user.level || 'BTech')} - ${this.escapeHTML(user.duration || '4 Years')}) | 
            <strong>Supervisor:</strong> <span style="color: var(--accent-orange); font-weight: 700;">${this.escapeHTML(supName)}</span> | 
            <strong>Teammates:</strong> <span style="color: var(--primary-blue); font-weight: 700;">${this.escapeHTML(teammateText)}</span>
          `;
        }
      } else {
        if (headerTitle) headerTitle.innerText = `Welcome, ${this.escapeHTML(user.name)}`;
        if (headerSubtitle) headerSubtitle.innerText = `${this.escapeHTML(user.department || 'Computer Science Department')} | SSMS Workspace`;
      }
    },

    switchView: function(viewName, targetStudentId) {
      const currentUser = window.SSMSAuth.getCurrentUser();

      // Enforce Role Access Restrictions: Admin can ONLY access 'admin', 'allocation', and 'messages'
      if (currentUser && currentUser.role === 'admin') {
        if (viewName !== 'admin' && viewName !== 'allocation' && viewName !== 'messages') {
          viewName = 'admin';
        }
      }

      // Highlight nav links
      document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
      const activeNav = document.getElementById(`nav-${viewName}`);
      if (activeNav) activeNav.classList.add('active');

      const mainContent = document.getElementById('mainContentArea');
      if (!mainContent) return;

      if (viewName === 'tracker') {
        mainContent.innerHTML = `<div id="trackerContentArea"></div>`;
        window.SSMSTracker.renderTracker('trackerContentArea', targetStudentId);
      } else if (viewName === 'vault') {
        mainContent.innerHTML = `<div id="vaultContentArea"></div>`;
        window.SSMSDocuments.renderVault('vaultContentArea');
      } else if (viewName === 'messages') {
        mainContent.innerHTML = `<div id="messagesContentArea"></div>`;
        if (targetStudentId) {
          window.SSMSMessages.activeRecipientId = targetStudentId;
        }
        window.SSMSMessages.renderMessagingPortal('messagesContentArea');
      } else if (viewName === 'appointments') {
        mainContent.innerHTML = `<div id="appointmentsContentArea"></div>`;
        window.SSMSAppointments.renderAppointmentsPage('appointmentsContentArea');
      } else if (viewName === 'admin') {
        mainContent.innerHTML = `<div id="adminContentArea"></div>`;
        window.SSMSAdmin.renderAdminPanel('adminContentArea');
      } else if (viewName === 'allocation') {
        mainContent.innerHTML = `<div id="adminContentArea"></div>`;
        window.SSMSAdmin.renderAllocationMatrix('adminContentArea');
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
              <td><strong>${this.escapeHTML(std.matricNo || 'CSC/2026/001')}</strong></td>
              <td><strong>${this.escapeHTML(std.name)}</strong></td>
              <td>${this.escapeHTML(std.projectTitle || 'Topic Pending')}</td>
              <td>
                <div style="display:flex; gap: 8px;">
                  <button class="btn btn-accent btn-sm" onclick="window.SSMSApp.switchView('tracker', '${std.id}')">
                    Stage Tracker
                  </button>
                  <button class="btn btn-primary btn-sm" onclick="window.SSMSMessages.selectRecipient('${std.id}'); window.SSMSApp.switchView('messages');">
                    Message
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

    confirmAction: function(message, onConfirm) {
      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">Confirm action</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <p style="margin:0 0 20px;">${this.escapeHTML(message)}</p>
            <div style="display:flex; justify-content:flex-end; gap: 10px;">
              <button type="button" class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Cancel</button>
              <button type="button" class="btn btn-primary" id="confirmActionButton">Confirm</button>
            </div>
          </div>
        </div>
      `;

      this.showCustomModal(modalHtml, false);
      setTimeout(() => {
        const confirmButton = document.getElementById('confirmActionButton');
        if (confirmButton) {
          confirmButton.addEventListener('click', () => {
            this.closeModal();
            onConfirm();
          });
        }
      }, 0);
    },

    closeModal: function() {
      const overlay = document.getElementById('globalModalOverlay');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
          overlay.innerHTML = '';
          overlay.onclick = null;
        }, 200);
      }
    },

    showNotification: function(msg, type = 'info') {
      const existing = document.getElementById('ssmsNotificationBanner');
      if (existing) existing.remove();

      const banner = document.createElement('div');
      banner.id = 'ssmsNotificationBanner';
      banner.className = `notification-banner notification-${type}`;
      
      const icon = '';
      banner.innerHTML = `<span style="font-size:1.1rem; flex-shrink:0;">${icon}</span> <span>${this.escapeHTML(msg)}</span>`;
      document.body.appendChild(banner);

      requestAnimationFrame(() => {
        banner.classList.add('show');
      });

      setTimeout(() => {
        banner.classList.remove('show');
        banner.classList.add('dismissed');
      }, 4000);
      setTimeout(() => {
        banner.remove();
      }, 4500);
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
