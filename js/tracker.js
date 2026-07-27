/* ==========================================================================
   IDENTIFICATION: FRONT-END LOGIC (JAVASCRIPT) - PROJECT STAGE TRACKER MODULE
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: Renders Interactive Milestone Pipeline, Calculates Stage Progress,
                Handles Stage Status Updates & Supervisor Review Feedback.
   ========================================================================== */

(function() {
  'use strict';

  window.SSMSTracker = {
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

    renderTracker: function(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const stages = window.SSMSData.getStages();
      const progressPercent = this.calculateProgress(stages);
      const currentUser = window.SSMSAuth.getCurrentUser();

      const approvedStages = stages.filter(s => s.status === 'approved').length;
      const activeStage = stages.find(s => s.status === 'in-progress') || stages.find(s => s.status === 'revision') || stages[stages.length - 1];

      let html = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span style="color: var(--accent-orange); font-size: 1.4rem;">🎯</span>
              Project Stage & Milestone Progress Tracker
            </div>
            <span class="stage-badge badge-in-progress">Overall Completion: ${progressPercent}%</span>
          </div>

          <div class="tracker-summary-grid">
            <div class="stat-card">
              <div>
                <div class="stat-val">${progressPercent}%</div>
                <div class="stat-label">Total Progress</div>
              </div>
              <div style="font-size: 2rem; color: var(--primary-blue);">📊</div>
            </div>
            <div class="stat-card orange">
              <div>
                <div class="stat-val">${approvedStages} / ${stages.length}</div>
                <div class="stat-label">Chapters Approved</div>
              </div>
              <div style="font-size: 2rem; color: var(--accent-orange);">✅</div>
            </div>
            <div class="stat-card">
              <div>
                <div class="stat-val" style="font-size: 1.1rem; color: var(--primary-blue); font-weight: 700;">
                  ${activeStage ? activeStage.name : 'Completed'}
                </div>
                <div class="stat-label">Current Active Stage</div>
              </div>
              <div style="font-size: 2rem; color: var(--primary-blue);">📍</div>
            </div>
          </div>

          <div class="overall-progress-container">
            <div class="progress-header">
              <span>Thesis Pipeline Progress</span>
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
              <span style="color: var(--primary-blue); font-size: 1.4rem;">📌</span>
              Detailed Milestone Stages & Supervisor Approvals
            </div>
          </div>

          <div class="stage-timeline">
      `;

      stages.forEach((stage, idx) => {
        let statusClass = 'pending';
        let badgeClass = 'badge-pending';
        let statusLabel = 'Pending';
        let iconSymbol = idx + 1;

        if (stage.status === 'approved') {
          statusClass = 'completed';
          badgeClass = 'badge-approved';
          statusLabel = 'Approved ✓';
          iconSymbol = '✓';
        } else if (stage.status === 'in-progress') {
          statusClass = 'current';
          badgeClass = 'badge-in-progress';
          statusLabel = 'In Progress';
        } else if (stage.status === 'revision') {
          statusClass = 'current';
          badgeClass = 'badge-revision';
          statusLabel = 'Revision Required';
          iconSymbol = '⚠️';
        }

        const canEdit = currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'admin');

        html += `
          <div class="stage-node ${statusClass}">
            <div class="stage-info">
              <div class="stage-number">${iconSymbol}</div>
              <div class="stage-details">
                <h4>${this.escapeHTML(stage.name)}</h4>
                <p>${this.escapeHTML(stage.description)}</p>
                ${stage.supervisorComment ? `
                  <div style="margin-top: 8px; padding: 8px 12px; background: rgba(0,76,132,0.05); border-left: 3px solid var(--primary-blue); border-radius: 4px; font-size: 0.83rem;">
                    <strong>Supervisor Remark:</strong> "${this.escapeHTML(stage.supervisorComment)}"
                    ${stage.dateUpdated ? `<span style="color: var(--text-muted); font-size: 0.75rem; margin-left: 8px;">(${this.escapeHTML(stage.dateUpdated)})</span>` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
              <span class="stage-badge ${badgeClass}">${statusLabel}</span>
              ${canEdit ? `
                <button class="btn btn-outline btn-sm" onclick="window.SSMSTracker.openStageModal(${stage.stageId})">
                  Update Status
                </button>
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

    openStageModal: function(stageId) {
      const stages = window.SSMSData.getStages();
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
                <label class="form-label">Select Stage Status</label>
                <select id="stageStatusSelect" class="form-control">
                  <option value="pending" ${stage.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="in-progress" ${stage.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                  <option value="revision" ${stage.status === 'revision' ? 'selected' : ''}>Revision Required</option>
                  <option value="approved" ${stage.status === 'approved' ? 'selected' : ''}>Approved ✓</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Supervisor Remarks / Directions</label>
                <textarea id="stageRemarkInput" class="form-control" rows="4" placeholder="Enter comments or corrections for the student...">${stage.supervisorComment || ''}</textarea>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button type="button" class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-accent">Save Stage Update</button>
              </div>
            </form>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(modalHtml);

      document.getElementById('stageUpdateForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const newStatus = document.getElementById('stageStatusSelect').value;
        const newRemark = document.getElementById('stageRemarkInput').value;

        const currentStages = window.SSMSData.getStages();
        const targetIdx = currentStages.findIndex(s => s.stageId === stageId);
        if (targetIdx !== -1) {
          currentStages[targetIdx].status = newStatus;
          currentStages[targetIdx].supervisorComment = newRemark;
          currentStages[targetIdx].dateUpdated = new Date().toISOString().split('T')[0];
          window.SSMSData.saveStages(currentStages);
        }

        window.SSMSApp.closeModal();
        window.SSMSTracker.renderTracker('trackerContentArea');
      });
    }
  };
})();
