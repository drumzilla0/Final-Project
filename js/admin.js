/* ==========================================================================
   IDENTIFICATION: FRONT-END LOGIC (JAVASCRIPT) - ADMIN & HOD CONTROL PANEL
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: HOD Management of Supervisors and Students, Program & Level Selection,
                HND (3 Yrs) & BTech (4 Yrs) Group Size Enforcement (HND <= 5, BTech <= 2),
                Dedicated Supervisor Allocation Matrix View, & System Controls.
   ========================================================================== */

(function() {
  'use strict';

  window.SSMSAdmin = {
    activeLevelFilter: 'all',
    activeProgramFilter: 'all',

    generateDefaultPassword: function(role) {
      if (role === 'supervisor') {
        return 'Supervisor2026';
      }
      return 'Student2026';
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

    validateSupervisorAllocation: function(studentId, supervisorId) {
      if (!supervisorId) return { valid: true };

      const users = window.SSMSData.getUsers();
      const student = users.find(u => u.id === studentId);
      if (!student) return { valid: true };

      const supervisor = users.find(u => u.id === supervisorId);
      const supName = supervisor ? supervisor.name : 'Selected Supervisor';

      // Get current students assigned to this supervisor excluding the current student being assigned
      const assignedStudents = users.filter(u => u.role === 'student' && u.supervisorId === supervisorId && u.id !== studentId);

      const studentLevel = student.level || 'BTech';

      if (studentLevel === 'HND') {
        const hndCount = assignedStudents.filter(s => s.level === 'HND').length;
        if (hndCount >= 5) {
          return {
            valid: false,
            message: `Group Limit Exceeded: HND project groups are limited to a maximum of 5 members per supervisor. ${supName} already has ${hndCount} HND students assigned.`
          };
        }
      } else if (studentLevel === 'BTech') {
        const btechCount = assignedStudents.filter(s => s.level === 'BTech').length;
        if (btechCount >= 2) {
          return {
            valid: false,
            message: `Group Limit Exceeded: BTech project groups are limited to 1 or 2 members per supervisor. ${supName} already has ${btechCount} BTech students assigned.`
          };
        }
      }

      return { valid: true };
    },

    renderAdminPanel: function(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const users = window.SSMSData.getUsers();
      const supervisors = users.filter(u => u.role === 'supervisor');
      const students = users.filter(u => u.role === 'student');

      const hndStudents = students.filter(s => s.level === 'HND');
      const btechStudents = students.filter(s => s.level === 'BTech');

      const resetRequests = window.SSMSData.getResetRequests ? window.SSMSData.getResetRequests() : [];
      const pendingResetRequests = resetRequests.filter(r => r.status === 'pending');

      let html = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              Admin / HOD Departmental Control Panel
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button class="btn btn-primary" onclick="window.SSMSAdmin.openAddSupervisorModal()">
                + Add Supervisor
              </button>
              <button class="btn btn-accent" onclick="window.SSMSAdmin.openAddStudentModal()">
                + Add Student
              </button>
            </div>
          </div>

          ${pendingResetRequests.length > 0 ? `
            <div class="alert-box alert-warning" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-left: 5px solid var(--accent-orange);">
              <div>
                <strong style="color: #9A4900; font-size: 1.05rem;">Pending Password Reset Requests (${pendingResetRequests.length})</strong>
                <div style="font-size: 0.85rem; color: var(--text-dark); margin-top: 4px;">
                  The following accounts requested a password reset back to default:
                  <ul style="margin: 4px 0 0 16px;">
                    ${pendingResetRequests.map(r => `<li><strong>${this.escapeHTML(r.userName)}</strong> (${this.escapeHTML(r.userRole.toUpperCase())} - ID: <code>${this.escapeHTML(r.matricNo)}</code>) — <em>${r.timestamp}</em></li>`).join('')}
                  </ul>
                </div>
              </div>
              <button class="btn btn-accent" style="font-weight: 700; white-space: nowrap;" onclick="window.SSMSAdmin.openResetRequestsModal()">
                Process Reset Requests (${pendingResetRequests.length}) →
              </button>
            </div>
          ` : ''}

          <div class="alert-box alert-warning">
            <div>
              <strong>KTU Departmental Guidelines:</strong> HND programs are <strong>3 Years</strong> (Max 5 students per supervisor group). BTech programs are <strong>4 Years</strong> (1 or 2 students per supervisor group). All newly added students & supervisors receive default passwords.
            </div>
          </div>

          <!-- Main Navigation Tabs -->
          <div style="display: flex; gap: 20px; border-bottom: 2px solid #E2E8F0; margin-bottom: 20px; flex-wrap: wrap;">
            <button id="adminTabSupervisors" class="btn btn-outline" style="border-radius:0; border:none; border-bottom:3px solid var(--primary-blue); font-weight:700;" onclick="window.SSMSAdmin.switchAdminTab('supervisors')">
              Academic Supervisors (${supervisors.length})
            </button>
            <button id="adminTabStudents" class="btn btn-outline" style="border-radius:0; border:none; color:var(--text-muted);" onclick="window.SSMSAdmin.switchAdminTab('students')">
              Enrolled Students (${students.length})
            </button>
            <button id="adminTabPrograms" class="btn btn-outline" style="border-radius:0; border:none; color:var(--text-muted);" onclick="window.SSMSAdmin.switchAdminTab('programs')">
              Programs & Levels Roster (${students.length})
            </button>
          </div>

          <!-- SECTION 1: SUPERVISORS -->
          <div id="supervisorsSection">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Supervisor Name</th>
                    <th>Email Address</th>
                    <th>Specialization</th>
                    <th>Default Password</th>
                    <th>HND Load (Max 5)</th>
                    <th>BTech Load (Max 2)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
      `;

      if (supervisors.length === 0) {
        html += `<tr><td colspan="7" style="text-align:center; padding: 20px;">No supervisors registered yet.</td></tr>`;
      } else {
        supervisors.forEach(sup => {
          const supStudents = students.filter(s => s.supervisorId === sup.id);
          const supHndCount = supStudents.filter(s => s.level === 'HND').length;
          const supBtechCount = supStudents.filter(s => s.level === 'BTech').length;

          html += `
            <tr>
              <td><strong>${this.escapeHTML(sup.name)}</strong></td>
              <td>${this.escapeHTML(sup.email)}</td>
              <td>${this.escapeHTML(sup.specialization || 'Computer Science')}</td>
              <td><span class="cred-pill">${sup.isDefaultPassword ? 'Default Active' : 'Changed'}</span></td>
              <td>
                <span class="stage-badge ${supHndCount >= 5 ? 'badge-revision' : 'badge-approved'}">
                  ${supHndCount} / 5 HND
                </span>
              </td>
              <td>
                <span class="stage-badge ${supBtechCount >= 2 ? 'badge-revision' : 'badge-approved'}">
                  ${supBtechCount} / 2 BTech
                </span>
              </td>
              <td>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button class="btn btn-outline btn-sm" onclick="window.SSMSAdmin.resetDefaultPassword('${sup.id}')">
                    Reset Password
                  </button>
                  <button class="btn btn-outline btn-sm" style="border-color: #EF4444; color: #DC2626;" onclick="window.SSMSAdmin.confirmDeleteUser('${sup.id}', 'supervisor')">
                    Remove
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

          <!-- SECTION 2: ENROLLED STUDENTS -->
          <div id="studentsSection" style="display: none;">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Matric No / Student ID</th>
                    <th>Student Identifier</th>
                    <th>Program</th>
                    <th>Level & Duration</th>
                    <th>Group Cap Rule</th>
                    <th>Assigned Supervisor</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
      `;

      if (students.length === 0) {
        html += `<tr><td colspan="7" style="text-align:center; padding: 20px;">No students registered yet.</td></tr>`;
      } else {
        const sortedStudents = [...students].sort((a, b) => {
          if (a.program !== b.program) return (a.program || '').localeCompare(b.program || '');
          if (a.level !== b.level) return a.level === 'HND' ? -1 : 1;
          return (a.matricNo || '').localeCompare(b.matricNo || '', undefined, { numeric: true, sensitivity: 'base' });
        });

        let currentProg = null;
        sortedStudents.forEach(std => {
          const stdProg = std.program || 'Computer Science';
          if (stdProg !== currentProg) {
            currentProg = stdProg;
            html += `
              <tr style="background: #F1F5F9; font-weight: 700;">
                <td colspan="7" style="padding: 10px 16px; color: var(--primary-blue); font-size: 0.92rem; border-top: 2px solid #CBD5E1; border-bottom: 2px solid #CBD5E1;">
                  Academic Program: ${this.escapeHTML(currentProg)}
                </td>
              </tr>
            `;
          }

          const supObj = supervisors.find(s => s.id === std.supervisorId);
          const supName = supObj ? supObj.name : 'Unassigned';
          const levelBadgeClass = std.level === 'HND' ? 'badge-in-progress' : 'badge-approved';
          const ruleText = std.level === 'HND' ? 'HND (Max 5)' : 'BTech (1-2 Members)';

          html += `
            <tr>
              <td><strong>${this.escapeHTML(std.matricNo || 'CSC/2026/001')}</strong></td>
              <td><strong>${this.escapeHTML(std.name)}</strong></td>
              <td><strong>${this.escapeHTML(std.program || 'Computer Science')}</strong></td>
              <td>
                <span class="stage-badge ${levelBadgeClass}">
                  ${this.escapeHTML(std.level || 'BTech')} (${this.escapeHTML(std.duration || '4 Years')})
                </span>
              </td>
              <td><span style="font-size:0.8rem; font-weight:600; color:var(--primary-blue);">${ruleText}</span></td>
              <td><span style="color: var(--primary-blue); font-weight:600;">${this.escapeHTML(supName)}</span></td>
              <td>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button class="btn btn-outline btn-sm" onclick="window.SSMSAdmin.openAssignSupervisorModal('${std.id}')">
                    ${supObj ? 'Change Supervisor' : 'Assign Supervisor'}
                  </button>
                  <button class="btn btn-outline btn-sm" style="border-color: #EF4444; color: #DC2626;" onclick="window.SSMSAdmin.confirmDeleteUser('${std.id}', 'student')">
                    Remove
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

          <!-- SECTION 3: PROGRAMS & LEVELS ROSTER -->
          <div id="programsSection" style="display: none;">
            <!-- Summary Header for HOD -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 24px;">
              <div style="background: var(--primary-blue-subtle); border-left: 5px solid var(--primary-blue); padding: 18px; border-radius: var(--radius-md);">
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary-blue); text-transform: uppercase;">HND Programs Overview</div>
                <div style="font-size: 1.6rem; font-weight: 800; color: var(--primary-blue-dark); margin: 4px 0;">${hndStudents.length} HND Students</div>
                <div style="font-size: 0.82rem; color: var(--text-muted);">Duration: <strong>3 Years</strong> | Group Cap: <strong>≤ 5 Students per group</strong></div>
              </div>
              <div style="background: var(--accent-orange-subtle); border-left: 5px solid var(--accent-orange); padding: 18px; border-radius: var(--radius-md);">
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-orange); text-transform: uppercase;">BTech Programs Overview</div>
                <div style="font-size: 1.6rem; font-weight: 800; color: #9A4900; margin: 4px 0;">${btechStudents.length} BTech Students</div>
                <div style="font-size: 0.82rem; color: var(--text-muted);">Duration: <strong>4 Years</strong> | Group Cap: <strong>1 or 2 Students per group</strong></div>
              </div>
            </div>

            <!-- Filters Bar -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: var(--radius-md); margin-bottom: 20px; display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
              <div>
                <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 4px;">Filter by Level:</label>
                <select id="programFilterLevelSelect" class="form-control" style="font-size:0.85rem; padding:6px 12px; width: 220px;" onchange="window.SSMSAdmin.applyProgramsRosterFilter()">
                  <option value="all">All Levels (HND & BTech)</option>
                  <option value="HND">HND (3 Years - Max 5 members)</option>
                  <option value="BTech">BTech (4 Years - 1 or 2 members)</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 4px;">Filter by Academic Program:</label>
                <select id="programFilterNameSelect" class="form-control" style="font-size:0.85rem; padding:6px 12px; width: 280px;" onchange="window.SSMSAdmin.applyProgramsRosterFilter()">
                  <option value="all">All Academic Programs</option>
                  <option value="Networking">Networking (HND - 3 Yrs)</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Artificial Intelligence">Artificial Intelligence (AI)</option>
                  <option value="Information & Communication Technology">Information & Communication Technology (ICT)</option>
                </select>
              </div>
            </div>

            <!-- Program & Level Roster Table -->
            <div class="table-container">
              <table class="data-table" id="programsRosterTable">
                <thead>
                  <tr>
                    <th>Matric No / Student ID</th>
                    <th>Student Identifier</th>
                    <th>Academic Program</th>
                    <th>Qualification Level</th>
                    <th>Program Duration</th>
                    <th>Group Capacity Rule</th>
                    <th>Assigned Supervisor</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="programsRosterTableBody">
                  ${this.renderProgramsRosterRows(students, supervisors, 'all', 'all')}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      `;

      container.innerHTML = html;
    },

    autoAllocateGroups: function() {
      const users = window.SSMSData.getUsers();
      const supervisors = users.filter(u => u.role === 'supervisor');
      const students = users.filter(u => u.role === 'student');

      if (supervisors.length === 0) {
        window.SSMSApp.showNotification('No academic supervisors registered in system.', 'error');
        return;
      }

      // Reset supervisor loads tracking for allocation calculation
      const supervisorLoads = {};
      supervisors.forEach(s => {
        supervisorLoads[s.id] = {
          hnd: 0,
          btech: 0,
          total: 0,
          supervisor: s
        };
      });

      const createdGroups = [];
      const programGroupCounters = {};

      // Helper function to get/increment group counter per (program + level)
      const getNextGroupName = (program, level, duration) => {
        const key = `${program}_${level}`;
        programGroupCounters[key] = (programGroupCounters[key] || 0) + 1;
        return `${program} ${level} Group ${programGroupCounters[key]} (${duration})`;
      };

      // Helper function to find best supervisor for HND group (HND Load < 5)
      const findSupervisorForHND = () => {
        return supervisors.find(s => supervisorLoads[s.id].hnd < 5);
      };

      // Helper function to find best supervisor for BTech group (BTech Load < 2)
      const findSupervisorForBTech = () => {
        return supervisors.find(s => supervisorLoads[s.id].btech < 2);
      };

      // 1. Separate Students by Qualification Level (HND vs BTech)
      const hndStudents = students.filter(s => s.level === 'HND');
      const btechStudents = students.filter(s => s.level === 'BTech');

      // --- ALLOCATE HND STUDENTS (3 Years - Group Cap: max 5 members per group/supervisor) ---
      const hndPrograms = [...new Set(hndStudents.map(s => s.program || 'Computer Science'))];

      hndPrograms.forEach(prog => {
        const progStudents = hndStudents.filter(s => (s.program || 'Computer Science') === prog);
        
        // Chunk into groups of up to 5 members
        for (let i = 0; i < progStudents.length; i += 5) {
          const chunk = progStudents.slice(i, i + 5);
          const sup = findSupervisorForHND();

          if (sup) {
            const groupName = getNextGroupName(prog, 'HND', '3 Years');

            chunk.forEach(std => {
              std.supervisorId = sup.id;
              std.groupName = groupName;
            });

            supervisorLoads[sup.id].hnd += chunk.length;
            supervisorLoads[sup.id].total += chunk.length;

            createdGroups.push({
              name: groupName,
              level: 'HND',
              duration: '3 Years',
              program: prog,
              count: chunk.length,
              supervisorName: sup.name,
              members: chunk.map(c => c.name)
            });
          }
        }
      });

      // --- ALLOCATE BTECH STUDENTS (4 Years - Group Cap: 1 or 2 members per group/supervisor) ---
      const btechPrograms = [...new Set(btechStudents.map(s => s.program || 'Computer Science'))];

      btechPrograms.forEach(prog => {
        const progStudents = btechStudents.filter(s => (s.program || 'Computer Science') === prog);

        // Chunk into pairs of 2 (or 1 remaining)
        for (let i = 0; i < progStudents.length; i += 2) {
          const chunk = progStudents.slice(i, i + 2);
          const sup = findSupervisorForBTech();

          if (sup) {
            const groupName = getNextGroupName(prog, 'BTech', '4 Years');

            chunk.forEach(std => {
              std.supervisorId = sup.id;
              std.groupName = groupName;
            });

            supervisorLoads[sup.id].btech += chunk.length;
            supervisorLoads[sup.id].total += chunk.length;

            createdGroups.push({
              name: groupName,
              level: 'BTech',
              duration: '4 Years',
              program: prog,
              count: chunk.length,
              supervisorName: sup.name,
              members: chunk.map(c => c.name)
            });
          }
        }
      });

      // Save updated users list to localStorage
      window.SSMSData.saveUsers(users);

      // Render Modal Report summarizing the automated allocation results
      let reportHtml = `
        <div class="modal-card" style="max-width: 680px;">
          <div class="modal-header" style="background: var(--primary-blue); color: white;">
            <div class="modal-title">Automated Grouping & Supervisor Allocation Complete</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <div class="alert-box alert-success" style="margin-bottom: 20px;">
              <strong>Success!</strong> Formed <strong>${createdGroups.length} Program-Based Project Groups</strong> and automatically allocated <strong>${students.length} Students</strong> to academic supervisors according to KTU rules (HND ≤ 5 | BTech 1-2).
            </div>

            <h4 style="color: var(--primary-blue); margin-bottom: 10px; font-size: 1rem;">Generated Program Groups & Supervisor Allocation Breakdown:</h4>
            <div style="max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
      `;

      createdGroups.forEach(grp => {
        const badgeClass = grp.level === 'HND' ? 'badge-in-progress' : 'badge-approved';
        reportHtml += `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="color: var(--primary-blue); font-size: 0.92rem;">${this.escapeHTML(grp.name)}</strong>
              <span class="stage-badge ${badgeClass}">${grp.level} (${grp.duration}) — ${grp.count} Members</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--accent-orange); margin-bottom: 4px;">
              Assigned Academic Supervisor: <strong>${this.escapeHTML(grp.supervisorName)}</strong>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">
              Group Members: ${grp.members.map(m => `<strong>${this.escapeHTML(m)}</strong>`).join(', ')}
            </div>
          </div>
        `;
      });

      reportHtml += `
            </div>

            <div style="display: flex; justify-content: flex-end;">
              <button class="btn btn-primary" onclick="window.SSMSApp.closeModal(); window.SSMSAdmin.renderAllocationMatrix('adminContentArea');">
                View Allocation Matrix Dashboard →
              </button>
            </div>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(reportHtml);
      window.SSMSAdmin.renderAllocationMatrix('adminContentArea');
      window.SSMSApp.showNotification(`Successfully auto-allocated ${students.length} students into ${createdGroups.length} program groups!`, 'success');
    },

    renderAllocationMatrix: function(containerId) {
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
              Supervisor-Student Allocation Dashboard
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
              <button class="btn btn-accent" style="font-weight: 700; display: flex; align-items: center; gap: 6px;" onclick="window.SSMSAdmin.autoAllocateGroups()">
                Auto-Generate Groups & Allocate
              </button>
              <span class="stage-badge badge-approved" style="font-size: 0.85rem;">Allocated: ${students.length - unassignedStudents.length}</span>
              <span class="stage-badge ${unassignedStudents.length > 0 ? 'badge-revision' : 'badge-approved'}" style="font-size: 0.85rem;">Unassigned: ${unassignedStudents.length}</span>
            </div>
          </div>

          <div style="margin-bottom: 20px; padding: 16px; background: var(--primary-blue-subtle); border-left: 4px solid var(--primary-blue); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <h4 style="color: var(--primary-blue); margin-bottom: 4px; font-size: 1.05rem;">Departmental Allocation & Grouping Engine</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
                Click <strong>"Auto-Generate Groups & Allocate"</strong> to automatically create project groups and assign supervisors respecting group limits (<strong>HND: ≤ 5 members</strong> | <strong>BTech: 1 or 2 members</strong>).
              </p>
            </div>
            <button class="btn btn-primary" onclick="window.SSMSAdmin.autoAllocateGroups()">
              Run Automation Now
            </button>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Program & Level</th>
                  <th>Formed Project Group</th>
                  <th>Group Limit Rule</th>
                  <th>Current Allocation</th>
                  <th>Manual Supervisor Override</th>
                </tr>
              </thead>
              <tbody>
      `;

      if (students.length === 0) {
        html += `
          <tr>
            <td colspan="7" style="text-align:center; padding: 30px;">
              <div style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 12px;">No student records found in current storage session.</div>
              <button class="btn btn-accent" onclick="window.SSMSData.resetDefaultUsers(); window.SSMSAdmin.renderAllocationMatrix('adminContentArea');">
                Restore 15 Enrolled Students Dataset
              </button>
            </td>
          </tr>
        `;
      } else {
        const sortedStudents = [...students].sort((a, b) => {
          if (a.program !== b.program) return (a.program || '').localeCompare(b.program || '');
          if (a.level !== b.level) return a.level === 'HND' ? -1 : 1;
          return (a.matricNo || '').localeCompare(b.matricNo || '', undefined, { numeric: true, sensitivity: 'base' });
        });

        let currentProg = null;
        sortedStudents.forEach(std => {
          const stdProg = std.program || 'Computer Science';
          if (stdProg !== currentProg) {
            currentProg = stdProg;
            html += `
              <tr style="background: #F1F5F9; font-weight: 700;">
                <td colspan="7" style="padding: 10px 16px; color: var(--primary-blue); font-size: 0.92rem; border-top: 2px solid #CBD5E1; border-bottom: 2px solid #CBD5E1;">
                  Academic Program: ${this.escapeHTML(currentProg)}
                </td>
              </tr>
            `;
          }

          const currentSup = supervisors.find(s => s.id === std.supervisorId);
          let supOptionsHtml = supervisors.map(s => {
            const isSelected = std.supervisorId === s.id;
            return `<option value="${s.id}" ${isSelected ? 'selected' : ''}>${this.escapeHTML(s.name)} (${this.escapeHTML(s.specialization || 'Computer Science')})</option>`;
          }).join('');

          const levelBadgeClass = std.level === 'HND' ? 'badge-in-progress' : 'badge-approved';
          const limitBadgeText = std.level === 'HND' ? 'HND (Max 5)' : 'BTech (Max 2)';
          const groupBadgeText = std.groupName || 'Unassigned Group';

          html += `
            <tr>
              <td><strong>${this.escapeHTML(std.matricNo || 'CSC/2026/001')}</strong></td>
              <td><strong>${this.escapeHTML(std.name)}</strong></td>
              <td>
                <span class="stage-badge ${levelBadgeClass}">
                  ${this.escapeHTML(std.program || 'CS')} - ${this.escapeHTML(std.level || 'BTech')}
                </span>
              </td>
              <td>
                <span class="stage-badge ${std.groupName ? 'badge-approved' : 'badge-revision'}">
                  ${this.escapeHTML(groupBadgeText)}
                </span>
              </td>
              <td><span style="font-size:0.8rem; font-weight:700; color:var(--primary-blue);">${limitBadgeText}</span></td>
              <td>
                <span class="stage-badge ${currentSup ? 'badge-approved' : 'badge-revision'}">
                  ${currentSup ? this.escapeHTML(currentSup.name) : 'Unassigned'}
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
            <h4 style="color: var(--primary-blue); font-size: 1.05rem; margin-bottom: 12px;">Supervisor Workload & Allocated Group Capacity</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
      `;

      supervisors.forEach(sup => {
        const assignedStds = students.filter(s => s.supervisorId === sup.id);
        const hndCount = assignedStds.filter(s => s.level === 'HND').length;
        const btechCount = assignedStds.filter(s => s.level === 'BTech').length;

        html += `
          <div style="background: white; border: 1px solid #E2E8F0; border-radius: var(--radius-md); padding: 16px; box-shadow: var(--shadow-sm);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <strong style="color: var(--primary-blue); font-size: 0.95rem;">${this.escapeHTML(sup.name)}</strong>
              <span class="stage-badge badge-approved" style="font-size: 0.75rem;">${assignedStds.length} Total</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--accent-orange); margin-bottom: 10px;">${this.escapeHTML(sup.specialization || 'Computer Science')}</div>
            
            <div style="display:flex; gap:8px; margin-bottom:12px;">
              <span class="stage-badge ${hndCount >= 5 ? 'badge-revision' : 'badge-in-progress'}" style="font-size:0.75rem;">
                HND Load: ${hndCount} / 5 Max
              </span>
              <span class="stage-badge ${btechCount >= 2 ? 'badge-revision' : 'badge-approved'}" style="font-size:0.75rem;">
                BTech Load: ${btechCount} / 2 Max
              </span>
            </div>

            <div style="font-size: 0.82rem; color: var(--text-dark);">
              <strong>Assigned Roster:</strong>
              ${assignedStds.length === 0 ? '<span style="color:var(--text-muted); display:block; margin-top:4px;">No students assigned yet.</span>' : `
                <ul style="margin-top: 4px; padding-left: 16px; font-size: 0.8rem; color: var(--text-muted);">
                  ${assignedStds.map(s => `<li>${this.escapeHTML(s.name)} (<strong style="color:var(--primary-blue);">${this.escapeHTML(s.level || 'BTech')}</strong> - ${this.escapeHTML(s.program || 'CS')})</li>`).join('')}
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
      `;

      container.innerHTML = html;
    },

    renderProgramsRosterRows: function(students, supervisors, levelFilter, programFilter) {
      let filtered = students.filter(std => {
        const matchesLevel = levelFilter === 'all' || (std.level || 'BTech') === levelFilter;
        const matchesProgram = programFilter === 'all' || (std.program || 'Computer Science') === programFilter;
        return matchesLevel && matchesProgram;
      });

      if (filtered.length === 0) {
        return `<tr><td colspan="8" style="text-align:center; padding: 24px; color:var(--text-muted);">No students match the selected Program or Level filter.</td></tr>`;
      }

      filtered.sort((a, b) => {
        if (a.program !== b.program) return (a.program || '').localeCompare(b.program || '');
        if (a.level !== b.level) return a.level === 'HND' ? -1 : 1;
        return (a.matricNo || '').localeCompare(b.matricNo || '', undefined, { numeric: true, sensitivity: 'base' });
      });

      let currentProg = null;
      let rowsHtml = '';
      filtered.forEach(std => {
        const stdProg = std.program || 'Computer Science';
        if (stdProg !== currentProg) {
          currentProg = stdProg;
          rowsHtml += `
            <tr style="background: #F1F5F9; font-weight: 700;">
              <td colspan="8" style="padding: 10px 16px; color: var(--primary-blue); font-size: 0.92rem; border-top: 2px solid #CBD5E1; border-bottom: 2px solid #CBD5E1;">
                Academic Program: ${this.escapeHTML(currentProg)}
              </td>
            </tr>
          `;
        }

        const supObj = supervisors.find(s => s.id === std.supervisorId);
        const supName = supObj ? supObj.name : 'Unassigned';
        const levelBadgeClass = std.level === 'HND' ? 'badge-in-progress' : 'badge-approved';
        const ruleText = std.level === 'HND' ? 'HND (≤ 5 Members)' : 'BTech (1 - 2 Members)';

        rowsHtml += `
          <tr>
            <td><strong>${this.escapeHTML(std.matricNo || 'CSC/2026/001')}</strong></td>
            <td><strong>${this.escapeHTML(std.name)}</strong></td>
            <td><strong>${this.escapeHTML(std.program || 'Computer Science')}</strong></td>
            <td>
              <span class="stage-badge ${levelBadgeClass}">
                ${this.escapeHTML(std.level || 'BTech')}
              </span>
            </td>
            <td><strong>${this.escapeHTML(std.duration || '4 Years')}</strong></td>
            <td><span style="font-size:0.8rem; font-weight:700; color:var(--primary-blue);">${ruleText}</span></td>
            <td><span style="color: var(--primary-blue); font-weight:600;">${this.escapeHTML(supName)}</span></td>
            <td>
              <span class="stage-badge ${supObj ? 'badge-approved' : 'badge-revision'}">
                ${supObj ? 'Assigned' : 'Unassigned'}
              </span>
            </td>
            <td>
              <button class="btn btn-outline btn-sm" style="border-color: #EF4444; color: #DC2626;" onclick="window.SSMSAdmin.confirmDeleteUser('${std.id}', 'student')">
                Remove
              </button>
            </td>
          </tr>
        `;
      });
      return rowsHtml;
    },

    applyProgramsRosterFilter: function() {
      const levelSel = document.getElementById('programFilterLevelSelect');
      const progSel = document.getElementById('programFilterNameSelect');
      const tableBody = document.getElementById('programsRosterTableBody');

      if (!levelSel || !progSel || !tableBody) return;

      const levelVal = levelSel.value;
      const progVal = progSel.value;

      const users = window.SSMSData.getUsers();
      const students = users.filter(u => u.role === 'student');
      const supervisors = users.filter(u => u.role === 'supervisor');

      tableBody.innerHTML = this.renderProgramsRosterRows(students, supervisors, levelVal, progVal);
    },

    switchAdminTab: function(tab) {
      const supSec = document.getElementById('supervisorsSection');
      const stdSec = document.getElementById('studentsSection');
      const prgSec = document.getElementById('programsSection');

      const btnSup = document.getElementById('adminTabSupervisors');
      const btnStd = document.getElementById('adminTabStudents');
      const btnPrg = document.getElementById('adminTabPrograms');

      [supSec, stdSec, prgSec].forEach(s => { if (s) s.style.display = 'none'; });

      [btnSup, btnStd, btnPrg].forEach(b => {
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
      } else if (tab === 'programs' && prgSec && btnPrg) {
        prgSec.style.display = 'block';
        btnPrg.style.borderBottom = '3px solid var(--primary-blue)';
        btnPrg.style.fontWeight = '700';
        btnPrg.style.color = 'var(--text-dark)';
      }
    },

    updateStudentSupervisor: function(studentId, supervisorId) {
      if (supervisorId) {
        const check = this.validateSupervisorAllocation(studentId, supervisorId);
        if (!check.valid) {
          window.SSMSApp.showNotification(check.message, 'error');
          this.renderAllocationMatrix('adminContentArea');
          return;
        }
      }

      const users = window.SSMSData.getUsers();
      const student = users.find(u => u.id === studentId);
      if (student) {
        student.supervisorId = supervisorId || null;
        window.SSMSData.saveUsers(users);
        const assignedSup = users.find(u => u.id === supervisorId);
        const supName = assignedSup ? assignedSup.name : 'Unassigned';
        window.SSMSApp.showNotification(`Student ${window.SSMSApp.escapeHTML(student.name)} (${student.level}) allocated to ${window.SSMSApp.escapeHTML(supName)}.`, 'success');
        this.renderAllocationMatrix('adminContentArea');
      }
    },

    handleProgramChange: function(programValue) {
      const levelSelect = document.getElementById('stdLevelInput');
      const levelHelpText = document.getElementById('levelHelpText');
      if (!levelSelect) return;

      if (programValue === 'Networking') {
        levelSelect.value = 'HND';
        levelSelect.disabled = true;
        if (levelHelpText) {
          levelHelpText.innerHTML = `<span style="color:var(--accent-orange); font-weight:600;">Networking is offered as HND (3 Years). Group size limit: max 5 members.</span>`;
        }
      } else if (programValue) {
        levelSelect.disabled = false;
        if (levelHelpText) {
          levelHelpText.innerHTML = `HND (3 Years - max 5 members per group) | BTech (4 Years - 1 or 2 members per group).`;
        }
      }
    },

    updateStudentVerificationPreview: function() {
      const nameInput = document.getElementById('stdNameInput');
      const matricInput = document.getElementById('stdMatricInput');
      const verifyBox = document.getElementById('studentVerificationBox');
      const nameText = document.getElementById('verifyStudentNameText');
      const idText = document.getElementById('verifyStudentIDText');
      const emailText = document.getElementById('verifyStudentEmailText');

      if (!nameInput || !matricInput || !verifyBox) return;

      const fullName = nameInput.value.trim();
      const rawMatric = matricInput.value.trim();

      if (!fullName && !rawMatric) {
        verifyBox.style.display = 'none';
        return;
      }

      verifyBox.style.display = 'block';

      // Extract first name (e.g. "Elijah Akorli" -> "Elijah")
      const nameParts = fullName.split(' ').filter(p => p.length > 0);
      const firstName = nameParts.length > 0 ? nameParts[0] : 'Student';

      // Clean Student ID / Index Number (e.g. "04/2023/2299D" -> "0420232299d")
      const cleanID = rawMatric.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      // Format: Elijah0420232299d@ktu.edu.gh
      const generatedEmail = `${firstName}${cleanID}@ktu.edu.gh`;

      if (nameText) nameText.innerText = fullName || 'Pending...';
      if (idText) idText.innerText = rawMatric || 'Pending...';
      if (emailText) emailText.innerText = generatedEmail;
    },

    updateSupervisorVerificationPreview: function() {
      const nameInput = document.getElementById('supNameInput');
      const staffNoInput = document.getElementById('supStaffNoInput');
      const verifyBox = document.getElementById('supVerificationBox');
      const nameText = document.getElementById('verifySupNameText');
      const idText = document.getElementById('verifySupIDText');
      const emailText = document.getElementById('verifySupEmailText');

      if (!nameInput || !staffNoInput || !verifyBox) return;

      const name = nameInput.value.trim();
      const rawStaffNo = staffNoInput.value.trim();

      if (!name && !rawStaffNo) {
        verifyBox.style.display = 'none';
        return;
      }

      verifyBox.style.display = 'block';

      // Clean supervisor name (e.g. "Prof. Asare" -> "Asare")
      const nameParts = name.replace(/^(prof|dr|mr|mrs|ms)\.?\s+/i, '').split(' ').filter(p => p.length > 0);
      const cleanName = nameParts.length > 0 ? nameParts[0] : 'Supervisor';
      
      // Clean staff number: e.g. "002" -> "002sid"
      let cleanStaffNo = rawStaffNo.replace(/[^a-zA-Z0-9]/g, '');
      if (!cleanStaffNo.toLowerCase().endsWith('sid')) {
        cleanStaffNo += 'sid';
      }

      // Format: Asare002sid@ktu.edu.gh
      const generatedEmail = `${cleanName}${cleanStaffNo}@ktu.edu.gh`;

      if (nameText) nameText.innerText = name || 'Pending...';
      if (idText) idText.innerText = cleanStaffNo || '002sid';
      if (emailText) emailText.innerText = generatedEmail;
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
                <label class="form-label">Supervisor Surname / Name</label>
                <input type="text" id="supNameInput" class="form-control" placeholder="e.g. Asare or Prof. Asare" required oninput="window.SSMSAdmin.updateSupervisorVerificationPreview()">
              </div>
              <div class="form-group">
                <label class="form-label">Staff Number / ID</label>
                <input type="text" id="supStaffNoInput" class="form-control" placeholder="e.g. 002" required oninput="window.SSMSAdmin.updateSupervisorVerificationPreview()">
                <small style="color: var(--text-muted); font-size: 0.78rem; display: block; margin-top: 4px;">
                  System automatically appends 'sid' to staff number (e.g. 002 -> 002sid).
                </small>
              </div>
              <div class="form-group">
                <label class="form-label">Fields of Specialization (Select 1 or more areas based on programs)</label>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-top: 6px; padding: 14px; background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: var(--radius-md);">
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 0.86rem; font-weight: 600; cursor: pointer; color: var(--text-dark);">
                    <input type="checkbox" name="supSpecOption" value="Artificial Intelligence (AI)" checked style="width: 16px; height: 16px; accent-color: var(--primary-blue);">
                    Artificial Intelligence (AI)
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 0.86rem; font-weight: 600; cursor: pointer; color: var(--text-dark);">
                    <input type="checkbox" name="supSpecOption" value="Networking" style="width: 16px; height: 16px; accent-color: var(--primary-blue);">
                    Networking
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 0.86rem; font-weight: 600; cursor: pointer; color: var(--text-dark);">
                    <input type="checkbox" name="supSpecOption" value="Web Application Development" checked style="width: 16px; height: 16px; accent-color: var(--primary-blue);">
                    Web Application Development
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 0.86rem; font-weight: 600; cursor: pointer; color: var(--text-dark);">
                    <input type="checkbox" name="supSpecOption" value="Information & Communication Technology (ICT)" style="width: 16px; height: 16px; accent-color: var(--primary-blue);">
                    Information & Communication Technology (ICT)
                  </label>
                </div>
                <small style="color: var(--text-muted); font-size: 0.78rem; display: block; margin-top: 6px;">
                  Select one, two, or more areas of specialization based on departmental programs.
                </small>
              </div>

              <!-- REAL-TIME VERIFICATION PREVIEW -->
              <div id="supVerificationBox" class="alert-box alert-success" style="display: none; font-size:0.85rem; margin-bottom: 16px;">
                <div style="width:100%;">
                  <strong style="color: #065F46; display:block; margin-bottom:4px;">Supervisor Identity Verification:</strong>
                  <div>• Verified Name: <strong id="verifySupNameText" style="color:#004C84;">-</strong></div>
                  <div>• Staff ID: <strong id="verifySupIDText" style="color:#004C84;">-</strong></div>
                  <div>• Generated Official Email: <code id="verifySupEmailText" style="background:#D1FAE5; padding:2px 8px; border-radius:4px; color:#065F46; font-weight:700;">-</code></div>
                </div>
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
        const name = document.getElementById('supNameInput').value.trim();
        const rawStaffNo = document.getElementById('supStaffNoInput').value.trim();

        const selectedSpecs = Array.from(document.querySelectorAll('input[name="supSpecOption"]:checked')).map(cb => cb.value);

        if (!name || !rawStaffNo) {
          window.SSMSApp.showNotification('Please enter Supervisor Name and Staff Number.', 'error');
          return;
        }

        if (selectedSpecs.length === 0) {
          window.SSMSApp.showNotification('Please select at least one field of specialization.', 'error');
          return;
        }

        const specStr = selectedSpecs.join(' & ');

        const nameParts = name.replace(/^(prof|dr|mr|mrs|ms)\.?\s+/i, '').split(' ').filter(p => p.length > 0);
        const cleanName = nameParts.length > 0 ? nameParts[0] : 'Supervisor';

        let staffId = rawStaffNo.replace(/[^a-zA-Z0-9]/g, '');
        if (!staffId.toLowerCase().endsWith('sid')) {
          staffId += 'sid';
        }

        const generatedEmail = `${cleanName}${staffId}@ktu.edu.gh`;
        const defaultPass = window.SSMSAdmin.generateDefaultPassword('supervisor');

        const users = window.SSMSData.getUsers();
        if (users.some(u => u.email.toLowerCase() === generatedEmail.toLowerCase())) {
          window.SSMSApp.showNotification('A supervisor with this Staff ID / Email already exists.', 'error');
          return;
        }

        const newSupervisor = {
          id: 'usr_sup_' + Date.now(),
          name: name,
          staffId: staffId,
          email: generatedEmail,
          passwordHash: defaultPass,
          isDefaultPassword: true,
          role: 'supervisor',
          specialization: specStr,
          specialties: selectedSpecs,
          department: 'Computer Science'
        };

        users.push(newSupervisor);
        window.SSMSData.saveUsers(users);

        window.SSMSApp.closeModal();
        window.SSMSAdmin.renderAdminPanel('adminContentArea');
        window.SSMSApp.showNotification(`Supervisor ${window.SSMSApp.escapeHTML(name)} (${generatedEmail}) registered. Default Password: ${defaultPass}`, 'success');
      });
    },

    openAddStudentModal: function() {
      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">Register New Student</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <form id="addStudentForm">
              <div class="form-group">
                <label class="form-label">Student Full Name</label>
                <input type="text" id="stdNameInput" class="form-control" placeholder="e.g. Elijah Akorli" required autofocus oninput="window.SSMSAdmin.updateStudentVerificationPreview()">
              </div>
              <div class="form-group">
                <label class="form-label">Student ID / Index Number</label>
                <input type="text" id="stdMatricInput" class="form-control" placeholder="e.g. 04/2023/0001D or BT04/2023/0001D" required oninput="window.SSMSAdmin.updateStudentVerificationPreview()">
                <small style="color: var(--text-muted); font-size: 0.78rem; display: block; margin-top: 4px;">
                  Official KTU Student Index Number (HND: 04/2023/0001D | BTech: BT04/2023/0001D).
                </small>
              </div>
              <div class="form-group">
                <label class="form-label">Academic Program</label>
                <select id="stdProgramInput" class="form-control" required onchange="window.SSMSAdmin.handleProgramChange(this.value)">
                  <option value="">-- Select Academic Program --</option>
                  <option value="Networking">Networking (HND - 3 Years)</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Artificial Intelligence">Artificial Intelligence (AI)</option>
                  <option value="Information & Communication Technology">Information & Communication Technology (ICT)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Qualification Level & Duration</label>
                <select id="stdLevelInput" class="form-control" required>
                  <option value="">-- Select Qualification Level --</option>
                  <option value="HND">HND (3 Years - Max 5 members per group)</option>
                  <option value="BTech">BTech (4 Years - 1 or 2 members per group)</option>
                </select>
                <small id="levelHelpText" style="color: var(--text-muted); font-size: 0.78rem; display: block; margin-top: 4px;">
                  HND programs run for 3 Years (Group size limit: max 5). BTech programs run for 4 Years (Group size limit: 1 or 2).
                </small>
              </div>

              <!-- REAL-TIME STUDENT VERIFICATION PREVIEW -->
              <div id="studentVerificationBox" class="alert-box alert-success" style="display: none; font-size:0.85rem; margin-bottom: 16px;">
                <div style="width:100%;">
                  <strong style="color: #065F46; display:block; margin-bottom:4px;">🔍 Student Identity Verification:</strong>
                  <div>• Verified Name: <strong id="verifyStudentNameText" style="color:#004C84;">-</strong></div>
                  <div>• Student ID / Index No: <strong id="verifyStudentIDText" style="color:#004C84;">-</strong></div>
                  <div>• Generated Official Email: <code id="verifyStudentEmailText" style="background:#D1FAE5; padding:2px 8px; border-radius:4px; color:#065F46; font-weight:700;">-</code></div>
                </div>
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
        const fullName = document.getElementById('stdNameInput').value.trim();
        const matric = document.getElementById('stdMatricInput').value.trim();
        const program = document.getElementById('stdProgramInput').value;
        const levelSelect = document.getElementById('stdLevelInput');
        const level = levelSelect.value;

        if (!fullName || !matric) {
          window.SSMSApp.showNotification('Please enter Student Name and Student ID.', 'error');
          return;
        }

        if (!program || !level) {
          window.SSMSApp.showNotification('Please select both Academic Program and Qualification Level.', 'error');
          return;
        }

        const nameParts = fullName.split(' ').filter(p => p.length > 0);
        const firstName = nameParts.length > 0 ? nameParts[0] : 'Student';
        const cleanID = matric.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        // KTU Email Format: Elijah0420232299d@ktu.edu.gh
        const generatedEmail = `${firstName}${cleanID}@ktu.edu.gh`;
        const duration = (level === 'HND' || program === 'Networking') ? '3 Years' : '4 Years';
        const defaultPass = window.SSMSAdmin.generateDefaultPassword('student');

        const currentUsers = window.SSMSData.getUsers();
        if (currentUsers.some(u => (u.matricNo && u.matricNo.toLowerCase() === matric.toLowerCase()) || u.email.toLowerCase() === generatedEmail.toLowerCase())) {
          window.SSMSApp.showNotification('A student with this Student ID or Email already exists.', 'error');
          return;
        }

        const newStudent = {
          id: 'usr_std_' + Date.now(),
          name: fullName,
          matricNo: matric,
          email: generatedEmail,
          passwordHash: defaultPass,
          isDefaultPassword: true,
          role: 'student',
          program: program,
          level: level,
          duration: duration,
          projectTitle: 'Topic Pending',
          supervisorId: null
        };

        currentUsers.push(newStudent);
        window.SSMSData.saveUsers(currentUsers);

        window.SSMSApp.closeModal();
        window.SSMSAdmin.renderAdminPanel('adminContentArea');
        window.SSMSAdmin.switchAdminTab('students');
        window.SSMSApp.showNotification(`Student ${window.SSMSApp.escapeHTML(fullName)} (${generatedEmail}) registered. Default Password: ${defaultPass}`, 'success');
      });
    },

    openAssignSupervisorModal: function(studentId) {
      const users = window.SSMSData.getUsers();
      const student = users.find(u => u.id === studentId);
      if (!student) return;

      const supervisors = users.filter(u => u.role === 'supervisor');
      let supOptionsHtml = supervisors.map(s => 
        `<option value="${s.id}" ${s.id === student.supervisorId ? 'selected' : ''}>${window.SSMSApp.escapeHTML(s.name)} (${window.SSMSApp.escapeHTML(s.specialization || 'Computer Science')})</option>`
      ).join('');

      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">Assign Academic Supervisor</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <form id="assignSupervisorForm">
              <div class="form-group">
                <label class="form-label">Student Details</label>
                <input type="text" class="form-control" value="${window.SSMSApp.escapeHTML(student.name)} (${window.SSMSApp.escapeHTML(student.program || 'CS')} - ${window.SSMSApp.escapeHTML(student.level || 'BTech')})" readonly style="font-weight:600; color:var(--primary-blue);">
              </div>
              <div class="alert-box alert-warning" style="margin-bottom: 16px; font-size:0.82rem;">
                <strong>Group Rule:</strong> ${student.level === 'HND' ? 'HND students must be assigned in groups of 5 or fewer members.' : 'BTech students must be assigned in groups of 1 or 2 members.'}
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

        if (selectedSupId) {
          const check = window.SSMSAdmin.validateSupervisorAllocation(studentId, selectedSupId);
          if (!check.valid) {
            window.SSMSApp.showNotification(check.message, 'error');
            return;
          }
        }

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
        window.SSMSApp.showNotification(`Supervisor for ${window.SSMSApp.escapeHTML(student.name)} set to ${window.SSMSApp.escapeHTML(supName)}.`, 'success');
      });
    },

    resetDefaultPassword: function(userId) {
      const users = window.SSMSData.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return;

      window.SSMSApp.confirmAction(`Reset password for ${window.SSMSApp.escapeHTML(user.name)} back to default?`, () => {
        const newPass = window.SSMSAdmin.generateDefaultPassword(user.role);
        user.passwordHash = newPass;
        user.isDefaultPassword = true;
        window.SSMSData.saveUsers(users);

        // Clear failed attempts counter
        const failedMap = JSON.parse(localStorage.getItem('ssms_failed_attempts') || '{}');
        delete failedMap[user.id];
        localStorage.setItem('ssms_failed_attempts', JSON.stringify(failedMap));

        window.SSMSAdmin.renderAdminPanel('adminContentArea');
        window.SSMSApp.showNotification(`Password for ${window.SSMSApp.escapeHTML(user.name)} reset to default: ${newPass}`, 'info');
      });
    },

    openResetRequestsModal: function() {
      const requests = window.SSMSData.getResetRequests ? window.SSMSData.getResetRequests() : [];
      const pending = requests.filter(r => r.status === 'pending');

      let modalHtml = `
        <div class="modal-card" style="max-width: 650px;">
          <div class="modal-header">
            <div class="modal-title">Pending Password Reset Requests (${pending.length})</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
      `;

      if (pending.length === 0) {
        modalHtml += `<div style="text-align:center; padding: 20px; color:var(--text-muted);">No pending password reset requests.</div>`;
      } else {
        pending.forEach(req => {
          const defaultPass = req.userRole === 'supervisor' ? 'Supervisor2026' : 'Student2026';
          modalHtml += `
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px; border-radius: var(--radius-md); margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="color: var(--primary-blue); font-size: 0.95rem;">${this.escapeHTML(req.userName)}</strong>
                <span class="stage-badge badge-revision">${this.escapeHTML(req.userRole.toUpperCase())}</span>
              </div>
              <div style="font-size: 0.82rem; color: var(--text-dark); margin-bottom: 4px;">
                ID / Matric: <strong>${this.escapeHTML(req.matricNo)}</strong> | Email: ${this.escapeHTML(req.userEmail)}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px;">
                Requested: ${this.escapeHTML(req.timestamp)} | Reason: ${this.escapeHTML(req.reason)}
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button class="btn btn-primary btn-sm" onclick="window.SSMSAdmin.resolveResetRequest('${req.id}')">
                  Reset to Default (${defaultPass}) & Resolve
                </button>
              </div>
            </div>
          `;
        });
      }

      modalHtml += `
            <div style="display: flex; justify-content: flex-end; margin-top: 15px;">
              <button class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Close</button>
            </div>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(modalHtml);
    },

    resolveResetRequest: function(reqId) {
      const requests = window.SSMSData.getResetRequests();
      const req = requests.find(r => r.id === reqId);
      if (!req) return;

      const users = window.SSMSData.getUsers();
      const user = users.find(u => u.id === req.userId);
      if (user) {
        const defaultPass = user.role === 'supervisor' ? 'Supervisor2026' : 'Student2026';
        user.passwordHash = defaultPass;
        user.isDefaultPassword = true;
        window.SSMSData.saveUsers(users);

        // Clear failed attempts counter
        const failedMap = JSON.parse(localStorage.getItem('ssms_failed_attempts') || '{}');
        delete failedMap[user.id];
        localStorage.setItem('ssms_failed_attempts', JSON.stringify(failedMap));

        // Mark request as resolved
        req.status = 'resolved';
        window.SSMSData.saveResetRequests(requests);

        window.SSMSApp.closeModal();
        window.SSMSAdmin.renderAdminPanel('adminContentArea');
        window.SSMSApp.showNotification(`Password for ${window.SSMSApp.escapeHTML(user.name)} reset to default (${defaultPass}). User can log in now.`, 'success');
      }
    },

    confirmDeleteUser: function(userId, role) {
      const users = window.SSMSData.getUsers();
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;

      if (targetUser.role === 'admin') {
        window.SSMSApp.showNotification('Admin / HOD account cannot be removed.', 'error');
        return;
      }

      const userIdentifier = targetUser.matricNo || targetUser.staffId || targetUser.email;
      const modalHtml = `
        <div class="modal-card" style="max-width: 480px;">
          <div class="modal-header" style="background: #DC2626;">
            <div class="modal-title">Confirm Account Removal</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <p style="font-size: 0.95rem; color: var(--text-dark); margin-bottom: 12px; line-height: 1.5;">
              Are you sure you want to permanently remove <strong>${this.escapeHTML(targetUser.name)}</strong> (${this.escapeHTML(role.toUpperCase())} - <code>${this.escapeHTML(userIdentifier)}</code>) from the system?
            </p>
            ${role === 'supervisor' ? `
              <div class="alert-box alert-warning" style="font-size: 0.85rem; margin-bottom: 16px; border-left: 4px solid var(--accent-orange);">
                Notice: Any students currently assigned to <strong>${this.escapeHTML(targetUser.name)}</strong> will become unassigned and will require reallocation.
              </div>
            ` : ''}
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
              <button type="button" class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Cancel</button>
              <button type="button" class="btn btn-accent" style="background: #DC2626; border-color: #B91C1C;" onclick="window.SSMSAdmin.executeDeleteUser('${userId}')">
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(modalHtml);
    },

    executeDeleteUser: function(userId) {
      const users = window.SSMSData.getUsers();
      const targetUser = users.find(u => u.id === userId);
      const userName = targetUser ? targetUser.name : 'User';
      const role = targetUser ? targetUser.role : 'user';

      const deleted = window.SSMSData.deleteUser(userId);
      window.SSMSApp.closeModal();

      if (deleted) {
        this.renderAdminPanel('adminContentArea');
        window.SSMSApp.showNotification(`${role.toUpperCase()} account for "${userName}" has been removed.`, 'success');
      } else {
        window.SSMSApp.showNotification('Failed to remove user account.', 'error');
      }
    }
  };
})();
