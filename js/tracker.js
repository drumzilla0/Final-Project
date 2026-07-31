/* ==========================================================================
   IDENTIFICATION: FRONT-END LOGIC (JAVASCRIPT) - PROJECT STAGE TRACKER MODULE
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: Renders Interactive Vertical Milestone Pipeline per Student,
                Calculates Stage Progress, Displays Checkmarks for Completed Stages,
                Handles Stage Status Updates & Supervisor Review Approvals.
   ========================================================================== */

(function() {
  'use strict';

  window.SSMSTracker = {
    activeStudentId: null,

    escapeHTML: function(value) {
      if (value === null || value === undefined) return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    calculateProgress: function(stages) {
      if (!stages || stages.length === 0) return 0;
      const approvedCount = stages.filter(s => s.status === 'approved').length;
      const inProgressCount = stages.filter(s => s.status === 'in-progress').length * 0.5;
      const total = stages.length;
      return Math.round(((approvedCount + inProgressCount) / total) * 100);
    },

    renderTracker: function(containerId, targetStudentId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const currentUser = window.SSMSAuth.getCurrentUser();
      const allUsers = window.SSMSData.getUsers();

      // Check role permissions and eligible students for supervisor / admin / student
      if (currentUser && currentUser.role === 'supervisor') {
        const myStudents = allUsers.filter(u => u.role === 'student' && u.supervisorId === currentUser.id);

        if (myStudents.length === 0) {
          container.innerHTML = `
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  Stage Tracker & Milestone Approvals
                </div>
              </div>
              <div style="text-align: center; padding: 45px 20px;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-dark);">No Students Assigned To You</h3>
                <p style="color: var(--text-muted); max-width: 520px; margin: 8px auto 24px auto; font-size: 0.92rem; line-height: 1.6;">
                  You currently have no project students allocated to you by the HOD / Department Admin. Stage tracking and milestone approvals will be available here once students are allocated to your supervision.
                </p>
                <button class="btn btn-primary" onclick="window.SSMSApp.switchView('supervisor')">
                  View Assigned Students List
                </button>
              </div>
            </div>
          `;
          return;
        }

        // Validate active target student belongs to this supervisor
        if (targetStudentId && myStudents.some(s => s.id === targetStudentId)) {
          this.activeStudentId = targetStudentId;
        } else if (!this.activeStudentId || !myStudents.some(s => s.id === this.activeStudentId)) {
          this.activeStudentId = myStudents[0].id;
        }
      } else if (currentUser && currentUser.role === 'student') {
        this.activeStudentId = currentUser.id;
      } else {
        // Admin user viewing tracker
        const allStudents = allUsers.filter(u => u.role === 'student');
        if (allStudents.length === 0) {
          container.innerHTML = `<div class="card"><div style="padding: 30px; text-align: center;">No students found in the system.</div></div>`;
          return;
        }
        if (targetStudentId && allStudents.some(s => s.id === targetStudentId)) {
          this.activeStudentId = targetStudentId;
        } else if (!this.activeStudentId || !allStudents.some(s => s.id === this.activeStudentId)) {
          this.activeStudentId = allStudents[0].id;
        }
      }

      const selectedStudent = allUsers.find(u => u.id === this.activeStudentId) || {
        name: 'Student Project',
        matricNo: 'N/A',
        groupName: 'Individual Project',
        projectTitle: 'Final Year Project',
        program: 'Computer Science'
      };

      // Find group partners
      let groupPartnerText = 'Individual Project';
      if (selectedStudent.groupId) {
        const partners = allUsers.filter(u => u.role === 'student' && u.groupId === selectedStudent.groupId && u.id !== selectedStudent.id);
        if (partners.length > 0) {
          groupPartnerText = partners.map(p => p.name).join(', ');
        }
      }

      const stages = window.SSMSData.getStudentStages(this.activeStudentId);
      const studentEvals = window.SSMSData.getStudentEvaluations(this.activeStudentId);
      const progressPercent = this.calculateProgress(stages);
      const approvedStages = stages.filter(s => s.status === 'approved').length;
      const activeStage = stages.find(s => s.status === 'in-progress') || stages.find(s => s.status === 'revision') || stages[stages.length - 1];

      // Calculate average workload % & effort score
      let avgWorkload = 0;
      let avgEffort = 0;
      if (studentEvals.length > 0) {
        const totalW = studentEvals.reduce((acc, e) => acc + (e.workloadPercent || 50), 0);
        const totalE = studentEvals.reduce((acc, e) => acc + (e.effortScore || 8), 0);
        avgWorkload = Math.round(totalW / studentEvals.length);
        avgEffort = (totalE / studentEvals.length).toFixed(1);
      }

      const isSupervisorOrAdmin = currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'admin');

      let html = '';

      // Student's Assigned Supervisor Card
      if (currentUser && currentUser.role === 'student') {
        const studentSup = allUsers.find(u => u.id === currentUser.supervisorId);

        if (studentSup) {
          html += `
            <div class="card mb-4" style="border-left: 5px solid var(--primary-blue); background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%);">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div>
                  <div style="font-size: 0.82rem; font-weight: 700; color: var(--primary-blue); text-transform: uppercase; letter-spacing: 0.5px;">
                    Assigned Academic Supervisor
                  </div>
                  <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-dark); margin: 2px 0;">
                    ${this.escapeHTML(studentSup.name)}
                  </h3>
                  <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                    Specialization: <strong>${this.escapeHTML(studentSup.specialization || 'Computer Science')}</strong> | Institutional Email: <code>${this.escapeHTML(studentSup.email)}</code>
                  </div>
                </div>
                <div>
                  <button class="btn btn-primary btn-sm" onclick="window.SSMSApp.switchView('messages')">
                    Contact Supervisor ${this.escapeHTML(studentSup.name.split(' ')[0])}
                  </button>
                </div>
              </div>
            </div>
          `;
        } else {
          html += `
            <div class="card mb-4" style="border-left: 5px solid var(--accent-orange); background: #FFFBEB;">
              <div style="display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: #92400E;">
                <div>
                  <strong>Notice:</strong> You have not been assigned an academic supervisor yet by the HOD. Stage status updates and chapter reviews will be performed once your supervisor is allocated.
                </div>
              </div>
            </div>
          `;
        }

        // Student's Project Group & Teammates Roster Card
        const groupMembers = allUsers.filter(u => u.role === 'student' && (
          (currentUser.groupName && u.groupName === currentUser.groupName) ||
          (currentUser.groupId && u.groupId === currentUser.groupId)
        ));

        if (groupMembers.length > 0) {
          html += `
            <div class="card mb-4" style="border-left: 5px solid var(--accent-orange); background: #FFFBEB;">
              <div>
                <div style="font-size: 0.82rem; font-weight: 700; color: #9A4900; text-transform: uppercase; letter-spacing: 0.5px;">
                  Assigned Project Group & Teammates
                </div>
                <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-dark); margin: 2px 0 8px 0;">
                  ${this.escapeHTML(currentUser.groupName || 'Individual Project Group')}
                </h4>
                <div style="font-size: 0.85rem; color: var(--text-dark);">
                  <strong>Group Members (${groupMembers.length} Total):</strong>
                  <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px;">
                    ${groupMembers.map(m => `
                      <span class="badge" style="background: white; border: 1px solid #CBD5E1; color: var(--text-dark); font-size: 0.82rem; padding: 6px 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;">
                        ${m.id === currentUser.id ? '<strong>You:</strong> ' : ''}${this.escapeHTML(m.name)} [ID: <code>${this.escapeHTML(m.matricNo || 'N/A')}</code>]
                        ${m.id !== currentUser.id ? `
                          <button class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.75rem;" onclick="window.SSMSApp.switchView('messages', '${m.id}')">
                            Chat
                          </button>
                        ` : ''}
                      </span>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          `;
        }
      }

      // Supervisor / Admin Student Selector Header Bar
      if (isSupervisorOrAdmin) {
        let studentOptions = '';
        let eligibleStudents = [];
        if (currentUser.role === 'supervisor') {
          eligibleStudents = allUsers.filter(u => u.role === 'student' && u.supervisorId === currentUser.id);
        } else {
          eligibleStudents = allUsers.filter(u => u.role === 'student');
        }

        eligibleStudents.forEach(std => {
          const isSelected = std.id === this.activeStudentId ? 'selected' : '';
          studentOptions += `<option value="${std.id}" ${isSelected}>${this.escapeHTML(std.name)} [ID: ${this.escapeHTML(std.matricNo || 'N/A')}] (${this.escapeHTML(std.program || 'CS')} - ${this.escapeHTML(std.level || 'BTech')})</option>`;
        });

        html += `
          <div class="card mb-4" style="border-left: 5px solid var(--primary-blue); background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
              <div>
                <div style="font-size: 0.82rem; font-weight: 700; color: var(--primary-blue); text-transform: uppercase; letter-spacing: 0.5px;">
                  Supervisor Stage & Workload Approval Hub
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-dark); margin: 2px 0;">
                  Viewing Stage Tracker for: <span style="color: var(--primary-blue);">${this.escapeHTML(selectedStudent.name)}</span>
                  <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">[ID: ${this.escapeHTML(selectedStudent.matricNo || 'N/A')}]</span>
                </h3>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                  <strong>Program & Duration:</strong> ${this.escapeHTML(selectedStudent.program || 'CS')} (${this.escapeHTML(selectedStudent.level || 'BTech')} - ${this.escapeHTML(selectedStudent.duration || '4 Years')}) |
                  <strong>Project Group:</strong> <span class="badge" style="background: var(--primary-blue-subtle); color: var(--primary-blue); font-weight:700;">${this.escapeHTML(selectedStudent.groupName || 'Individual Project')}</span>
                </div>
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 8px; min-width: 320px;">
                <!-- SEARCH INPUT FOR STUDENT NAME OR ID -->
                <div style="display: flex; align-items: center; gap: 8px;">
                  <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark); white-space: nowrap;">Search Student:</label>
                  <input type="text" id="trackerStudentSearchInput" class="form-control" placeholder="Type Name or Student ID (e.g. 04/2023/0001D or BT04/2023/0001D)..." oninput="window.SSMSTracker.filterAndSelectStudent(this.value)" style="font-size: 0.85rem; padding: 6px 10px;">
                </div>

                <!-- DROPDOWN SELECTOR FOR STUDENT -->
                <div style="display: flex; align-items: center; gap: 8px;">
                  <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark); white-space: nowrap;">Select Student:</label>
                  <select class="form-control" style="font-weight: 600; border-color: var(--primary-blue); font-size: 0.85rem; padding: 6px 10px;" onchange="window.SSMSTracker.switchStudent(this.value)">
                    ${studentOptions}
                  </select>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // Summary Header Card
      html += `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              Vertical Stage Tracker & Workload Score Summary
            </div>
            <span class="stage-badge badge-in-progress">Overall Progress: ${progressPercent}%</span>
          </div>

          <div class="tracker-summary-grid">
            <div class="stat-card">
              <div>
                <div class="stat-val">${progressPercent}%</div>
                <div class="stat-label">Total Completion</div>
              </div>
              <div style="font-size: 2rem; color: var(--primary-blue);"></div>
            </div>
            <div class="stat-card orange">
              <div>
                <div class="stat-val">${approvedStages} / ${stages.length}</div>
                <div class="stat-label">Stages Approved</div>
              </div>
              <div style="font-size: 2rem; color: #10B981;"></div>
            </div>
            <div class="stat-card">
              <div>
                <div class="stat-val" style="font-size: 1.1rem; color: var(--primary-blue); font-weight: 800;">
                  ${avgWorkload > 0 ? avgWorkload + '%' : 'N/A'}
                </div>
                <div class="stat-label">Avg. Workload Share</div>
              </div>
              <div style="font-size: 2rem; color: var(--accent-orange);"></div>
            </div>
            <div class="stat-card">
              <div>
                <div class="stat-val" style="font-size: 1.1rem; color: #059669; font-weight: 800;">
                  ${avgEffort > 0 ? avgEffort + ' / 10' : 'N/A'}
                </div>
                <div class="stat-label">Avg. Effort Rating</div>
              </div>
              <div style="font-size: 2rem; color: #10B981;"></div>
            </div>
          </div>

          <div class="overall-progress-container">
            <div class="progress-header">
              <span>Thesis Pipeline Completion</span>
              <span style="color: var(--accent-orange); font-weight: 700;">${progressPercent}% Completed</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">
              Vertical Stage Progress & Individual Workload Evaluations
            </div>
            <div style="font-size: 0.82rem; color: var(--text-muted);">
              Evaluated per stage by Academic Supervisor
            </div>
          </div>

          <!-- VERTICAL STAGE TRACKER CONTAINER -->
          <div class="vertical-stage-tracker">
            <div class="vertical-tracker-line"></div>
      `;

      stages.forEach((stage, idx) => {
        let statusClass = 'pending';
        let badgeClass = 'badge-pending';
        let statusLabel = 'Pending';
        let iconContent = `<span class="step-num">${idx + 1}</span>`;

        if (stage.status === 'approved') {
          statusClass = 'completed';
          badgeClass = 'badge-approved';
          statusLabel = 'Approved';
          iconContent = `<span class="check-mark">✓</span>`;
        } else if (stage.status === 'in-progress') {
          statusClass = 'current';
          badgeClass = 'badge-in-progress';
          statusLabel = 'In Progress';
          iconContent = `<span class="step-num">${idx + 1}</span>`;
        } else if (stage.status === 'revision') {
          statusClass = 'revision';
          badgeClass = 'badge-revision';
          statusLabel = 'Revision Required';
          iconContent = `<span class="warn-mark"></span>`;
        }

        const stageEval = studentEvals.find(e => e.stageId === stage.stageId);

        html += `
          <div class="vertical-stage-item ${statusClass}">
            <div class="vertical-stage-node">
              ${iconContent}
            </div>

            <div class="vertical-stage-card">
              <div class="vertical-stage-header">
                <div>
                  <span class="stage-step-tag">Stage ${idx + 1} of ${stages.length}</span>
                  <h4 class="vertical-stage-title">${this.escapeHTML(stage.name)}</h4>
                </div>
                <span class="stage-badge ${badgeClass}">${statusLabel}</span>
              </div>

              <p class="vertical-stage-desc">${this.escapeHTML(stage.description)}</p>

              ${stage.supervisorComment ? `
                <div class="supervisor-remark-box">
                  <div class="remark-header">
                    <span><strong>Supervisor Approval Remark:</strong></span>
                    ${stage.dateUpdated ? `<span class="remark-date">(${this.escapeHTML(stage.dateUpdated)})</span>` : ''}
                  </div>
                  <p class="remark-text">"${this.escapeHTML(stage.supervisorComment)}"</p>
                </div>
              ` : ''}

              <!-- WORKLOAD & EFFORT EVALUATION BOX FOR THIS STAGE -->
              <div style="margin-top: 14px; padding: 12px 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: var(--radius-md);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary-blue);">
                    Workload & Effort Score (Individual Evaluation)
                  </span>
                  ${stageEval ? `
                    <span style="font-size: 0.82rem; font-weight: 800; color: #059669; background: #D1FAE5; padding: 3px 10px; border-radius: var(--radius-full);">
                      Grade: ${this.escapeHTML(stageEval.grade)}
                    </span>
                  ` : `
                    <span style="font-size: 0.78rem; color: var(--text-muted); font-style: italic;">
                      Evaluation Pending
                    </span>
                  `}
                </div>

                ${stageEval ? `
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; font-size: 0.83rem; margin-bottom: 6px;">
                    <div><strong>Workload Share:</strong> <span style="color: var(--accent-orange); font-weight:700;">${stageEval.workloadPercent}%</span></div>
                    <div><strong>Effort Rating:</strong> <span style="color: #059669; font-weight:700;">${stageEval.effortScore} / 10</span></div>
                    <div><strong>Attendance:</strong> ${this.escapeHTML(stageEval.attendance)}</div>
                  </div>
                  ${stageEval.remarks ? `
                    <div style="font-size: 0.82rem; color: var(--text-dark); margin-top: 4px;">
                      <strong>Supervisor Remarks:</strong> <em>"${this.escapeHTML(stageEval.remarks)}"</em>
                    </div>
                  ` : ''}
                ` : `
                  <div style="font-size: 0.82rem; color: var(--text-muted);">
                    No workload evaluation recorded yet for this stage.
                  </div>
                `}
              </div>

              ${isSupervisorOrAdmin ? `
                <div class="vertical-stage-actions" style="display:flex; gap:10px; flex-wrap:wrap;">
                  <button class="btn btn-outline btn-sm" onclick="window.SSMSTracker.openStageModal(${stage.stageId})">
                    Update Status & Approval
                  </button>
                  <button class="btn btn-accent btn-sm" onclick="window.SSMSTracker.openEvaluationModal(${stage.stageId}, '${this.escapeHTML(stage.name)}')">
                    Score Workload & Effort
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;

      container.innerHTML = html;
    },

    switchStudent: function(studentId) {
      this.activeStudentId = studentId;
      this.renderTracker('trackerContentArea', studentId);
    },

    openEvaluationModal: function(stageId, stageName) {
      if (!this.activeStudentId) return;

      const allUsers = window.SSMSData.getUsers();
      const student = allUsers.find(u => u.id === this.activeStudentId) || { name: 'Student' };
      const studentEvals = window.SSMSData.getStudentEvaluations(this.activeStudentId);
      const existing = studentEvals.find(e => e.stageId === stageId) || {};

      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">Score Student Workload & Effort</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <div style="margin-bottom: 15px; padding: 10px; background: rgba(0,76,132,0.05); border-radius: var(--radius-sm); font-size: 0.88rem;">
              Evaluating: <strong>${this.escapeHTML(student.name)}</strong> (${this.escapeHTML(student.groupName || 'Individual')})<br>
              Stage: <strong>${this.escapeHTML(stageName)}</strong>
            </div>

            <form id="stageEvaluationForm">
              <div class="form-group">
                <label class="form-label">Individual Workload Contribution (%)</label>
                <input type="number" id="evalWorkloadInput" class="form-control" min="0" max="100" value="${existing.workloadPercent || 50}" required>
                <small style="color: var(--text-muted);">Percentage of total team workload accomplished by this student in this stage (e.g. 50%, 65%).</small>
              </div>

              <div class="form-group">
                <label class="form-label">Individual Technical Effort Score (1 to 10)</label>
                <select id="evalEffortInput" class="form-control">
                  <option value="10" ${existing.effortScore === 10 ? 'selected' : ''}>10 - Exceptional Effort & Quality</option>
                  <option value="9" ${existing.effortScore === 9 || !existing.effortScore ? 'selected' : ''}>9 - Outstanding Effort</option>
                  <option value="8" ${existing.effortScore === 8 ? 'selected' : ''}>8 - Very Good Effort</option>
                  <option value="7" ${existing.effortScore === 7 ? 'selected' : ''}>7 - Good Effort</option>
                  <option value="6" ${existing.effortScore === 6 ? 'selected' : ''}>6 - Satisfactory Effort</option>
                  <option value="5" ${existing.effortScore === 5 ? 'selected' : ''}>5 - Average / Minimal Effort</option>
                  <option value="4" ${existing.effortScore === 4 ? 'selected' : ''}>4 - Below Expectations</option>
                  <option value="3" ${existing.effortScore === 3 ? 'selected' : ''}>3 - Poor Effort</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Stage Assessment Grade</label>
                <select id="evalGradeInput" class="form-control">
                  <option value="A" ${existing.grade === 'A' || !existing.grade ? 'selected' : ''}>A (Excellent - 80-100%)</option>
                  <option value="B+" ${existing.grade === 'B+' ? 'selected' : ''}>B+ (Very Good - 75-79%)</option>
                  <option value="B" ${existing.grade === 'B' ? 'selected' : ''}>B (Good - 70-74%)</option>
                  <option value="C+" ${existing.grade === 'C+' ? 'selected' : ''}>C+ (Credit - 65-69%)</option>
                  <option value="C" ${existing.grade === 'C' ? 'selected' : ''}>C (Pass - 60-64%)</option>
                  <option value="D" ${existing.grade === 'D' ? 'selected' : ''}>D (Below Average - 50-59%)</option>
                  <option value="F" ${existing.grade === 'F' ? 'selected' : ''}>F (Fail - Below 50%)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Stage / Meeting Attendance & Punctuality</label>
                <select id="evalAttendanceInput" class="form-control">
                  <option value="Punctual & Active" ${existing.attendance === 'Punctual & Active' || !existing.attendance ? 'selected' : ''}>Punctual & Active</option>
                  <option value="Present" ${existing.attendance === 'Present' ? 'selected' : ''}>Present</option>
                  <option value="Late with Notice" ${existing.attendance === 'Late with Notice' ? 'selected' : ''}>Late with Notice</option>
                  <option value="Absent without Notice" ${existing.attendance === 'Absent without Notice' ? 'selected' : ''}>Absent without Notice</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Supervisor Workload & Contribution Remarks</label>
                <textarea id="evalRemarksInput" class="form-control" rows="3" placeholder="Explain the student's individual contribution vs team partners...">${existing.remarks || ''}</textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button type="button" class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-accent">Save Workload Score</button>
              </div>
            </form>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(modalHtml);

      const self = this;
      document.getElementById('stageEvaluationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const workload = parseInt(document.getElementById('evalWorkloadInput').value, 10);
        const effort = parseInt(document.getElementById('evalEffortInput').value, 10);
        const grade = document.getElementById('evalGradeInput').value;
        const attendance = document.getElementById('evalAttendanceInput').value;
        const remarks = document.getElementById('evalRemarksInput').value;

        const evalObj = {
          id: 'eval_' + Date.now(),
          studentId: self.activeStudentId,
          studentName: student.name,
          stageId: stageId,
          stageName: stageName,
          workloadPercent: workload,
          effortScore: effort,
          grade: grade,
          attendance: attendance,
          remarks: remarks,
          date: new Date().toISOString().split('T')[0]
        };

        window.SSMSData.saveStudentEvaluation(evalObj);
        window.SSMSApp.closeModal();
        self.renderTracker('trackerContentArea', self.activeStudentId);
        window.SSMSApp.showNotification(`Workload & Effort score saved for ${student.name}.`, 'success');
      });
    },

    openStageModal: function(stageId) {
      if (!this.activeStudentId) return;

      const stages = window.SSMSData.getStudentStages(this.activeStudentId);
      const stage = stages.find(s => s.stageId === stageId);
      if (!stage) return;

      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">Update Stage: ${this.escapeHTML(stage.name)}</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <form id="stageUpdateForm">
              <div class="form-group">
                <label class="form-label">Supervisor Approval Status</label>
                <select id="stageStatusSelect" class="form-control">
                  <option value="pending" ${stage.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="in-progress" ${stage.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                  <option value="revision" ${stage.status === 'revision' ? 'selected' : ''}>Revision Required</option>
                  <option value="approved" ${stage.status === 'approved' ? 'selected' : ''}>Approved (Mark Done)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Supervisor Approval Remarks & Feedback</label>
                <textarea id="stageRemarkInput" class="form-control" rows="4" placeholder="Enter comments or corrections for the student...">${stage.supervisorComment || ''}</textarea>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button type="button" class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-accent">Save Supervisor Approval</button>
              </div>
            </form>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(modalHtml);

      const self = this;
      document.getElementById('stageUpdateForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const newStatus = document.getElementById('stageStatusSelect').value;
        const newRemark = document.getElementById('stageRemarkInput').value;

        const currentStages = window.SSMSData.getStudentStages(self.activeStudentId);
        const targetIdx = currentStages.findIndex(s => s.stageId === stageId);
        if (targetIdx !== -1) {
          currentStages[targetIdx].status = newStatus;
          currentStages[targetIdx].supervisorComment = newRemark;
          currentStages[targetIdx].dateUpdated = new Date().toISOString().split('T')[0];
          window.SSMSData.saveStudentStages(self.activeStudentId, currentStages);
        }

        window.SSMSApp.closeModal();
        self.renderTracker('trackerContentArea', self.activeStudentId);
      });
    },

    switchStudent: function(studentId) {
      if (!studentId) return;
      this.activeStudentId = studentId;
      this.renderTracker('trackerContentArea', studentId);
    },

    filterAndSelectStudent: function(query) {
      const cleanQ = (query || '').trim().toLowerCase();
      if (!cleanQ) return;

      const currentUser = window.SSMSAuth.getCurrentUser();
      const allUsers = window.SSMSData.getUsers();

      let eligibleStudents = [];
      if (currentUser && currentUser.role === 'supervisor') {
        eligibleStudents = allUsers.filter(u => u.role === 'student' && u.supervisorId === currentUser.id);
      } else {
        eligibleStudents = allUsers.filter(u => u.role === 'student');
      }

      const match = eligibleStudents.find(std => 
        (std.name && std.name.toLowerCase().includes(cleanQ)) ||
        (std.matricNo && std.matricNo.toLowerCase().includes(cleanQ)) ||
        (std.matricNo && std.matricNo.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanQ.replace(/[^a-z0-9]/g, ''))) ||
        (std.email && std.email.toLowerCase().includes(cleanQ))
      );

      if (match && match.id !== this.activeStudentId) {
        this.activeStudentId = match.id;
        this.renderTracker('trackerContentArea', match.id);

        const searchInp = document.getElementById('trackerStudentSearchInput');
        if (searchInp) {
          searchInp.value = query;
          searchInp.focus();
          searchInp.selectionStart = searchInp.selectionEnd = query.length;
        }
      }
    }
  };
})();
