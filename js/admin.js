/* ==========================================================================
   IDENTIFICATION: FRONT-END LOGIC (JAVASCRIPT) - ADMIN & HOD CONTROL PANEL
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: HOD Management of Supervisors and Students, Provisioning Default Passwords,
                Supervisor-Student Allocation Matrix, & System Controls.
   ========================================================================== */

(function() {
  'use strict';

  window.SSMSAdmin = {
    renderAdminPanel: function(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const users = window.SSMSData.getUsers();
      const supervisors = users.filter(u => u.role === 'supervisor');
      const students = users.filter(u => u.role === 'student');
      const unassignedStudents = students.filter(s => !s.supervisorId);

      let html = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span style="color: var(--accent-orange); font-size: 1.4rem;">🏛️</span>
              Admin / HOD Departmental Control Panel
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button class="btn btn-primary" onclick="window.SSMSAdmin.openAddSupervisorModal()">
                + Add Supervisor
              </button>
              <button class="btn btn-accent" onclick="window.SSMSAdmin.openAddStudentModal()">
                + Add Student
              </button>
              <button class="btn btn-outline" style="border-color: var(--accent-orange); color: var(--accent-orange); font-weight: 700;" onclick="window.SSMSAdmin.switchAdminTab('allocation')">
                ⚡ Allocation Matrix
              </button>
            </div>
          </div>

          <div class="alert-box alert-warning">
            <span style="font-size: 1.2rem;">🔐</span>
            <div>
              <strong>Security Protocol Enforced:</strong> Student, Supervisor, and HOD rosters are strictly restricted to authenticated Administrative portals. All newly added accounts are provisioned with default passwords. Users are mandated to change their password on initial login.
            </div>
          </div>

          <div style="display: flex; gap: 20px; border-bottom: 2px solid #E2E8F0; margin-bottom: 20px; flex-wrap: wrap;">
            <button id="adminTabSupervisors" class="btn btn-outline" style="border-radius:0; border:none; border-bottom:3px solid var(--primary-blue); font-weight:700;" onclick="window.SSMSAdmin.switchAdminTab('supervisors')">
              Academic Supervisors (${supervisors.length})
            </button>
            <button id="adminTabStudents" class="btn btn-outline" style="border-radius:0; border:none; color:var(--text-muted);" onclick="window.SSMSAdmin.switchAdminTab('students')">
              Enrolled Students (${students.length})
            </button>
            <button id="adminTabAllocation" class="btn btn-outline" style="border-radius:0; border:none; color:var(--text-muted);" onclick="window.SSMSAdmin.switchAdminTab('allocation')">
              🎯 Supervisor Allocation Matrix ${unassignedStudents.length > 0 ? `<span style="background:var(--accent-orange); color:white; padding:2px 8px; border-radius:12px; font-size:0.75rem; margin-left:6px;">${unassignedStudents.length} Unassigned</span>` : '<span style="color:var(--status-approved); font-size:0.75rem; margin-left:6px;">✓ Complete</span>'}
            </button>
          </div>

          <!-- Supervisors Section -->
          <div id="supervisorsSection">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Supervisor Name</th>
                    <th>Email Address</th>
                    <th>Specialization</th>
                    <th>Default Password</th>
                    <th>Password Changed?</th>
                    <th>Assigned Students</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
      `;

      if (supervisors.length === 0) {
        html += `<tr><td colspan="7" style="text-align:center; padding: 20px;">No supervisors registered yet.</td></tr>`;
      } else {
        supervisors.forEach(sup => {
          const assignedCount = students.filter(s => s.supervisorId === sup.id).length;
          html += `
            <tr>
              <td><strong>${sup.name}</strong></td>
              <td>${sup.email}</td>
              <td>${sup.specialization || 'Computer Science'}</td>
              <td><span class="cred-pill">${sup.passwordHash}</span></td>
              <td>
                <span class="stage-badge ${sup.isDefaultPassword ? 'badge-revision' : 'badge-approved'}">
                  ${sup.isDefaultPassword ? 'No (Default)' : 'Yes (Secured)'}
                </span>
              </td>
              <td><strong>${assignedCount} Students</strong></td>
              <td>
                <button class="btn btn-outline btn-sm" onclick="window.SSMSAdmin.resetDefaultPassword('${sup.id}')">
                  Reset Password
                </button>
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

          <!-- Students Section -->
          <div id="studentsSection" style="display: none;">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Matric No</th>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th>Project Topic</th>
                    <th>Assigned Supervisor</th>
                    <th>Default Password</th>
                    <th>Password Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
      `;

      if (students.length === 0) {
        html += `<tr><td colspan="8" style="text-align:center; padding: 20px;">No students registered yet.</td></tr>`;
      } else {
        students.forEach(std => {
          const supObj = supervisors.find(s => s.id === std.supervisorId);
          const supName = supObj ? supObj.name : 'Unassigned';

          html += `
            <tr>
              <td><strong>${std.matricNo || 'CSC/2026/001'}</strong></td>
              <td><strong>${std.name}</strong></td>
              <td>${std.email}</td>
              <td style="max-width: 250px;">${std.projectTitle || 'Project Topic Under Review'}</td>
              <td><span style="color: var(--primary-blue); font-weight:600;">${supName}</span></td>
              <td><span class="cred-pill">${std.passwordHash}</span></td>
              <td>
                <span class="stage-badge ${std.isDefaultPassword ? 'badge-revision' : 'badge-approved'}">
                  ${std.isDefaultPassword ? 'Default' : 'Custom'}
                </span>
              </td>
              <td>
                <button class="btn btn-outline btn-sm" onclick="window.SSMSAdmin.openAssignSupervisorModal('${std.id}')">
                  ${supObj ? 'Change Supervisor' : 'Assign Supervisor'}
                </button>
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

          <!-- Supervisor Allocation Section -->
          <div id="allocationSection" style="display: none;">
            <div style="margin-bottom: 20px; padding: 16px; background: var(--primary-blue-subtle); border-left: 4px solid var(--primary-blue); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
              <div>
                <h4 style="color: var(--primary-blue); margin-bottom: 4px; font-size: 1.05rem;">🎓 Supervisor-Student Allocation Dashboard</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted);">
                  Dedicated HOD allocation panel. Assign or reassign students to academic supervisors directly below.
                </p>
              </div>
              <div style="display: flex; gap: 10px;">
                <span class="stage-badge badge-approved" style="font-size: 0.8rem;">Allocated: ${students.length - unassignedStudents.length}</span>
                <span class="stage-badge ${unassignedStudents.length > 0 ? 'badge-revision' : 'badge-approved'}" style="font-size: 0.8rem;">Unassigned: ${unassignedStudents.length}</span>
              </div>
            </div>

            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Matric No</th>
                    <th>Student Name</th>
                    <th>Project Topic</th>
                    <th>Current Status</th>
                    <th>Select / Allocate Supervisor</th>
                  </tr>
                </thead>
                <tbody>
      `;

      if (students.length === 0) {
        html += `<tr><td colspan="5" style="text-align:center; padding: 20px;">No students registered in system.</td></tr>`;
      } else {
        students.forEach(std => {
          const currentSup = supervisors.find(s => s.id === std.supervisorId);
          let supOptionsHtml = supervisors.map(s => 
            `<option value="${s.id}" ${std.supervisorId === s.id ? 'selected' : ''}>${s.name} (${s.specialization || 'Computer Science'})</option>`
          ).join('');

          html += `
            <tr>
              <td><strong>${std.matricNo || 'CSC/2026/001'}</strong></td>
              <td><strong>${std.name}</strong></td>
              <td style="max-width: 250px;">${std.projectTitle || 'Topic Pending'}</td>
              <td>
                <span class="stage-badge ${currentSup ? 'badge-approved' : 'badge-revision'}">
                  ${currentSup ? currentSup.name : '⚠️ Unassigned'}
                </span>
              </td>
              <td>
                <select class="form-control" style="font-size: 0.85rem; padding: 6px 10px; max-width: 280px;" onchange="window.SSMSAdmin.updateStudentSupervisor('${std.id}', this.value)">
                  <option value="">-- Select / Unassigned --</option>
                  ${supOptionsHtml}
                </select>
              </td>
            </tr>
          `;
        });
      }

      html += `
                </tbody>
              </table>
            </div>

            <div style="margin-top: 30px;">
              <h4 style="color: var(--primary-blue); font-size: 1.05rem; margin-bottom: 12px;">📊 Supervisor Workload & Allocated Capacity</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
      `;

      supervisors.forEach(sup => {
        const assignedStds = students.filter(s => s.supervisorId === sup.id);
        html += `
          <div style="background: white; border: 1px solid #E2E8F0; border-radius: var(--radius-md); padding: 16px; box-shadow: var(--shadow-sm);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <strong style="color: var(--primary-blue); font-size: 0.95rem;">${sup.name}</strong>
              <span class="stage-badge badge-in-progress" style="font-size: 0.75rem;">${assignedStds.length} / ${sup.maxStudents || 5} Students</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--accent-orange); margin-bottom: 10px;">${sup.specialization || 'Computer Science'}</div>
            <div style="font-size: 0.82rem; color: var(--text-dark);">
              <strong>Assigned Students:</strong>
              ${assignedStds.length === 0 ? '<span style="color:var(--text-muted); display:block; margin-top:4px;">No students assigned yet.</span>' : `
                <ul style="margin-top: 4px; padding-left: 16px; font-size: 0.8rem; color: var(--text-muted);">
                  ${assignedStds.map(s => `<li>${s.name} (${s.matricNo || 'CSC/2026'})</li>`).join('')}
                </ul>
              `}
            </div>
          </div>
        `;
      });

      html += `
              </div>
            </div>

          </div>

        </div>
      `;

      container.innerHTML = html;
    },

    switchAdminTab: function(tab) {
      const supSec = document.getElementById('supervisorsSection');
      const stdSec = document.getElementById('studentsSection');
      const alcSec = document.getElementById('allocationSection');

      const btnSup = document.getElementById('adminTabSupervisors');
      const btnStd = document.getElementById('adminTabStudents');
      const btnAlc = document.getElementById('adminTabAllocation');

      if (supSec) supSec.style.display = 'none';
      if (stdSec) stdSec.style.display = 'none';
      if (alcSec) alcSec.style.display = 'none';

      [btnSup, btnStd, btnAlc].forEach(b => {
        if (b) {
          b.style.borderBottom = 'none';
          b.style.fontWeight = '400';
          b.style.color = 'var(--text-muted)';
        }
      });

      if (tab === 'supervisors' && supSec && btnSup) {
        supSec.style.display = 'block';
        btnSup.style.borderBottom = '3px solid var(--primary-blue)';
        btnSup.style.fontWeight = '700';
        btnSup.style.color = 'var(--text-dark)';
      } else if (tab === 'students' && stdSec && btnStd) {
        stdSec.style.display = 'block';
        btnStd.style.borderBottom = '3px solid var(--primary-blue)';
        btnStd.style.fontWeight = '700';
        btnStd.style.color = 'var(--text-dark)';
      } else if (tab === 'allocation' && alcSec && btnAlc) {
        alcSec.style.display = 'block';
        btnAlc.style.borderBottom = '3px solid var(--primary-blue)';
        btnAlc.style.fontWeight = '700';
        btnAlc.style.color = 'var(--text-dark)';
      }
    },

    updateStudentSupervisor: function(studentId, supervisorId) {
      const users = window.SSMSData.getUsers();
      const student = users.find(u => u.id === studentId);
      if (student) {
        student.supervisorId = supervisorId || null;
        window.SSMSData.saveUsers(users);
        const assignedSup = users.find(u => u.id === supervisorId);
        const supName = assignedSup ? assignedSup.name : 'Unassigned';
        window.SSMSApp.showNotification(`Student ${student.name} allocated to ${supName}.`, 'success');
        this.renderAdminPanel('adminContentArea');
        this.switchAdminTab('allocation');
      }
    },

    openAddSupervisorModal: function() {
      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">➕ Add New Academic Supervisor</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <form id="addSupervisorForm">
              <div class="form-group">
                <label class="form-label">Full Name & Title</label>
                <input type="text" id="supNameInput" class="form-control" placeholder="e.g. Dr. Sarah Jenkins" required>
              </div>
              <div class="form-group">
                <label class="form-label">Email Address (Login Username)</label>
                <input type="email" id="supEmailInput" class="form-control" placeholder="jenkins@univ.edu" required>
              </div>
              <div class="form-group">
                <label class="form-label">Field of Specialization</label>
                <input type="text" id="supSpecInput" class="form-control" placeholder="e.g. Cybersecurity & Networks">
              </div>
              <div class="form-group">
                <label class="form-label">Default Assigned Password</label>
                <input type="text" id="supDefaultPassInput" class="form-control" value="super123" required readonly>
                <span style="font-size:0.75rem; color:var(--text-muted);">Supervisor will be required to change this upon 1st login.</span>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button type="button" class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Supervisor Account</button>
              </div>
            </form>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(modalHtml);

      document.getElementById('addSupervisorForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('supNameInput').value;
        const email = document.getElementById('supEmailInput').value;
        const spec = document.getElementById('supSpecInput').value;
        const defaultPass = document.getElementById('supDefaultPassInput').value;

        const users = window.SSMSData.getUsers();
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          alert('A user with this email address already exists in the system.');
          return;
        }

        const newSupervisor = {
          id: 'usr_sup_' + Date.now(),
          name: name,
          email: email,
          passwordHash: defaultPass,
          isDefaultPassword: true,
          role: 'supervisor',
          specialization: spec || 'Software Engineering',
          department: 'Computer Science'
        };

        users.push(newSupervisor);
        window.SSMSData.saveUsers(users);

        window.SSMSApp.closeModal();
        window.SSMSAdmin.renderAdminPanel('adminContentArea');
        window.SSMSApp.showNotification(`Supervisor ${name} added with default password '${defaultPass}'!`, 'success');
      });
    },

    openAddStudentModal: function() {
      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">🎓 Register New Student</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <form id="addStudentForm">
              <div class="form-group">
                <label class="form-label">Student Full Name</label>
                <input type="text" id="stdNameInput" class="form-control" placeholder="e.g. David Okon" required>
              </div>
              <div class="form-group">
                <label class="form-label">Matriculation Number</label>
                <input type="text" id="stdMatricInput" class="form-control" placeholder="CSC/2026/1089" required>
              </div>
              <div class="form-group">
                <label class="form-label">Email Address (Login)</label>
                <input type="email" id="stdEmailInput" class="form-control" placeholder="david@univ.edu" required>
              </div>
              <div class="form-group">
                <label class="form-label">Assigned Project Topic</label>
                <input type="text" id="stdTopicInput" class="form-control" placeholder="Design & Implementation of ..." required>
              </div>
              <div class="form-group">
                <label class="form-label">Default Assigned Password</label>
                <input type="text" id="stdDefaultPassInput" class="form-control" value="student123" required readonly>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button type="button" class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-accent">Register Student Account</button>
              </div>
            </form>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(modalHtml);

      document.getElementById('addStudentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('stdNameInput').value;
        const matric = document.getElementById('stdMatricInput').value;
        const email = document.getElementById('stdEmailInput').value;
        const topic = document.getElementById('stdTopicInput').value;
        const defaultPass = document.getElementById('stdDefaultPassInput').value;

        const currentUsers = window.SSMSData.getUsers();
        if (currentUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          alert('A user with this email address already exists in the system.');
          return;
        }

        const newStudent = {
          id: 'usr_std_' + Date.now(),
          name: name,
          matricNo: matric,
          email: email,
          passwordHash: defaultPass,
          isDefaultPassword: true,
          role: 'student',
          projectTitle: topic,
          supervisorId: null
        };

        currentUsers.push(newStudent);
        window.SSMSData.saveUsers(currentUsers);

        window.SSMSApp.closeModal();
        window.SSMSAdmin.renderAdminPanel('adminContentArea');
        window.SSMSApp.showNotification(`Student ${name} registered successfully! Default pass: '${defaultPass}'`, 'success');
      });
    },

    openAssignSupervisorModal: function(studentId) {
      const users = window.SSMSData.getUsers();
      const student = users.find(u => u.id === studentId);
      if (!student) return;

      const supervisors = users.filter(u => u.role === 'supervisor');
      let supOptionsHtml = supervisors.map(s => 
        `<option value="${s.id}" ${s.id === student.supervisorId ? 'selected' : ''}>${s.name} (${s.specialization || 'Computer Science'})</option>`
      ).join('');

      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">🎓 Assign Academic Supervisor</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <form id="assignSupervisorForm">
              <div class="form-group">
                <label class="form-label">Student Name</label>
                <input type="text" class="form-control" value="${student.name} (${student.matricNo || 'CSC/2026/001'})" readonly style="font-weight:600; color:var(--primary-blue);">
              </div>
              <div class="form-group">
                <label class="form-label">Select Academic Supervisor</label>
                <select id="assignSupervisorSelect" class="form-control">
                  <option value="">-- Unassigned --</option>
                  ${supOptionsHtml}
                </select>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button type="button" class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(modalHtml);

      document.getElementById('assignSupervisorForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const selectedSupId = document.getElementById('assignSupervisorSelect').value;

        const currentUsers = window.SSMSData.getUsers();
        const targetStudent = currentUsers.find(u => u.id === studentId);
        if (targetStudent) {
          targetStudent.supervisorId = selectedSupId || null;
          window.SSMSData.saveUsers(currentUsers);
        }

        window.SSMSApp.closeModal();
        window.SSMSAdmin.renderAdminPanel('adminContentArea');
        window.SSMSAdmin.switchAdminTab('students');
        const assignedSup = currentUsers.find(u => u.id === selectedSupId);
        const supName = assignedSup ? assignedSup.name : 'Unassigned';
        window.SSMSApp.showNotification(`Supervisor for ${student.name} set to ${supName}.`, 'success');
      });
    },

    resetDefaultPassword: function(userId) {
      const users = window.SSMSData.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return;

      if (confirm(`Reset password for ${user.name} back to default?`)) {
        user.passwordHash = user.role === 'supervisor' ? 'super123' : 'student123';
        user.isDefaultPassword = true;
        window.SSMSData.saveUsers(users);
        window.SSMSAdmin.renderAdminPanel('adminContentArea');
        alert(`Password for ${user.name} reset to default '${user.passwordHash}'. User will be forced to change it on next login.`);
      }
    }
  };
})();
