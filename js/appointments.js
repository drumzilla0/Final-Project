/* ==========================================================================
   IDENTIFICATION: FRONT-END LOGIC (JAVASCRIPT) - APPOINTMENT SCHEDULING MODULE
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: Student Meeting Slot Booking, Supervisor Approval Workflow,
                Date & Time Rescheduling Engine, & Appointment Status Dashboard.
   ========================================================================== */

(function() {
  'use strict';

  window.SSMSAppointments = {
    renderAppointmentsPage: function(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const currentUser = window.SSMSAuth.getCurrentUser();
      const appointments = window.SSMSData.getAppointments();

      let userAppointments = [];
      if (currentUser.role === 'student') {
        userAppointments = appointments.filter(a => a.studentId === currentUser.id);
      } else if (currentUser.role === 'supervisor') {
        userAppointments = appointments.filter(a => a.supervisorId === currentUser.id);
      } else if (currentUser.role === 'admin') {
        userAppointments = appointments;
      }

      let html = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span style="color: var(--accent-orange); font-size: 1.4rem;">📅</span>
              Meeting & Consultation Appointment Scheduler
            </div>
            ${currentUser.role === 'student' ? `
              <button class="btn btn-accent" onclick="window.SSMSAppointments.openBookModal()">
                + Book Meeting Slot
              </button>
            ` : ''}
          </div>

          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px;">
            Schedule physical or online thesis defense consultations, methodology reviews, and supervisor feedback sessions.
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
      `;

      if (userAppointments.length === 0) {
        html += `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
            No appointments scheduled yet. ${currentUser.role === 'student' ? 'Click "Book Meeting Slot" above to request a consultation.' : ''}
          </div>
        `;
      } else {
        userAppointments.forEach(apt => {
          html += this.createAppointmentCardHtml(apt, currentUser);
        });
      }

      html += `
          </div>
        </div>
      `;

      container.innerHTML = html;
    },

    createAppointmentCardHtml: function(apt, currentUser) {
      let badgeClass = 'badge-pending';
      if (apt.status === 'Confirmed') badgeClass = 'badge-approved';
      if (apt.status === 'Rescheduled') badgeClass = 'badge-in-progress';
      if (apt.status === 'Declined') badgeClass = 'badge-revision';

      const isSupervisor = currentUser.role === 'supervisor' || currentUser.role === 'admin';

      return `
        <div style="background: var(--pure-white); border: 2px solid #E2E8F0; border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-space-between;">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span class="stage-badge ${badgeClass}">${apt.status}</span>
              <span style="font-size: 0.8rem; color: var(--text-muted);">ID: ${apt.id}</span>
            </div>

            <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--primary-blue); margin-bottom: 8px;">
              ${apt.topic}
            </h4>

            <div style="font-size: 0.85rem; color: var(--text-dark); margin-bottom: 12px; display: flex; flex-direction: column; gap: 4px;">
              <div>👤 <strong>Student:</strong> ${apt.studentName}</div>
              <div>🎓 <strong>Supervisor:</strong> ${apt.supervisorName}</div>
              <div>📆 <strong>Date:</strong> <span style="color: var(--accent-orange); font-weight: 700;">${apt.requestedDate}</span></div>
              <div>⏰ <strong>Time:</strong> <span style="font-weight: 700;">${apt.requestedTime}</span></div>
              <div>📍 <strong>Venue / Link:</strong> ${apt.venue}</div>
            </div>

            ${apt.supervisorNote ? `
              <div style="margin-top: 10px; padding: 10px; background: var(--accent-orange-subtle); border-left: 3px solid var(--accent-orange); border-radius: 4px; font-size: 0.82rem; color: #8C4400;">
                <strong>Supervisor Remark:</strong> "${apt.supervisorNote}"
              </div>
            ` : ''}
          </div>

          ${isSupervisor ? `
            <div style="display: flex; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid #E2E8F0;">
              <button class="btn btn-primary btn-sm" style="flex:1;" onclick="window.SSMSAppointments.updateStatus('${apt.id}', 'Confirmed')">
                ✓ Confirm
              </button>
              <button class="btn btn-outline btn-sm" style="flex:1;" onclick="window.SSMSAppointments.openRescheduleModal('${apt.id}')">
                🔄 Reschedule
              </button>
              <button class="btn btn-danger btn-sm" onclick="window.SSMSAppointments.updateStatus('${apt.id}', 'Declined')">
                ✕ Decline
              </button>
            </div>
          ` : ''}
        </div>
      `;
    },

    openBookModal: function() {
      const currentUser = window.SSMSAuth.getCurrentUser();
      const users = window.SSMSData.getUsers();
      const supervisor = users.find(u => u.id === currentUser.supervisorId);

      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">📅 Schedule Consultation Appointment</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <form id="bookAppointmentForm">
              <div class="form-group">
                <label class="form-label">Assigned Academic Supervisor</label>
                <input type="text" class="form-control" value="${supervisor ? supervisor.name : 'Prof. Marcus Sterling'}" readonly style="font-weight:600; color:var(--primary-blue);">
              </div>
              <div class="form-group">
                <label class="form-label">Meeting Agenda / Topic</label>
                <input type="text" id="aptTopicInput" class="form-control" placeholder="e.g. Chapter 3 Methodology Review & Feedback" required>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Preferred Date</label>
                  <input type="date" id="aptDateInput" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Preferred Time Slot</label>
                  <input type="time" id="aptTimeInput" class="form-control" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Location / Preferred Venue</label>
                <select id="aptVenueInput" class="form-control">
                  <option value="Supervisor Office (Physical)">Supervisor Office (Physical Room 304)</option>
                  <option value="HOD Conference Hall">HOD Conference Hall</option>
                  <option value="Google Meet / Zoom (Online)">Google Meet / Zoom (Online Link)</option>
                </select>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button type="button" class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-accent">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(modalHtml);

      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById('aptDateInput').value = tomorrow.toISOString().split('T')[0];
      document.getElementById('aptTimeInput').value = '14:00';

      document.getElementById('bookAppointmentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const topic = document.getElementById('aptTopicInput').value;
        const dateVal = document.getElementById('aptDateInput').value;
        const timeVal = document.getElementById('aptTimeInput').value;
        const venue = document.getElementById('aptVenueInput').value;

        // Format time 12h
        const [h, m] = timeVal.split(':');
        const hourNum = parseInt(h, 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const formattedHour = hourNum % 12 || 12;
        const formattedTime = `${formattedHour}:${m} ${ampm}`;

        const newApt = {
          id: 'apt_' + Date.now().toString().slice(-4),
          studentId: currentUser.id,
          studentName: currentUser.name,
          supervisorId: supervisor ? supervisor.id : 'usr_sup_1',
          supervisorName: supervisor ? supervisor.name : 'Prof. Marcus Sterling',
          topic: topic,
          requestedDate: dateVal,
          requestedTime: formattedTime,
          venue: venue,
          status: 'Pending',
          supervisorNote: 'Awaiting supervisor confirmation.',
          dateUpdated: new Date().toISOString().split('T')[0]
        };

        const appointments = window.SSMSData.getAppointments();
        appointments.unshift(newApt);
        window.SSMSData.saveAppointments(appointments);

        window.SSMSApp.closeModal();
        this.renderAppointmentsPage('appointmentsContentArea');
        window.SSMSApp.showNotification('Appointment booking submitted! Awaiting supervisor confirmation.', 'success');
      });
    },

    openRescheduleModal: function(aptId) {
      const appointments = window.SSMSData.getAppointments();
      const apt = appointments.find(a => a.id === aptId);
      if (!apt) return;

      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">🔄 Reschedule Appointment</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <form id="rescheduleAptForm">
              <div class="form-group">
                <label class="form-label">Student</label>
                <input type="text" class="form-control" value="${apt.studentName} (${apt.topic})" readonly>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">New Proposed Date</label>
                  <input type="date" id="reschDateInput" class="form-control" value="${apt.requestedDate}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">New Proposed Time</label>
                  <input type="time" id="reschTimeInput" class="form-control" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Reason / Guidance Note for Student</label>
                <textarea id="reschNoteInput" class="form-control" rows="3" placeholder="e.g. Rescheduled due to faculty board meeting. Please prepare Chapter 3 slides." required></textarea>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button type="button" class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-accent">Propose New Date & Time</button>
              </div>
            </form>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(modalHtml);
      document.getElementById('reschTimeInput').value = '10:00';

      document.getElementById('rescheduleAptForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const newDate = document.getElementById('reschDateInput').value;
        const newTimeVal = document.getElementById('reschTimeInput').value;
        const note = document.getElementById('reschNoteInput').value;

        const [h, m] = newTimeVal.split(':');
        const hourNum = parseInt(h, 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const formattedHour = hourNum % 12 || 12;
        const formattedTime = `${formattedHour}:${m} ${ampm}`;

        const allApts = window.SSMSData.getAppointments();
        const target = allApts.find(a => a.id === aptId);
        if (target) {
          target.requestedDate = newDate;
          target.requestedTime = formattedTime;
          target.status = 'Rescheduled';
          target.supervisorNote = note;
          target.dateUpdated = new Date().toISOString().split('T')[0];
          window.SSMSData.saveAppointments(allApts);
        }

        window.SSMSApp.closeModal();
        this.renderAppointmentsPage('appointmentsContentArea');
        window.SSMSApp.showNotification('Appointment rescheduled successfully! Student notified.', 'success');
      });
    },

    updateStatus: function(aptId, newStatus) {
      const allApts = window.SSMSData.getAppointments();
      const target = allApts.find(a => a.id === aptId);
      if (target) {
        target.status = newStatus;
        if (newStatus === 'Confirmed') target.supervisorNote = 'Meeting confirmed as scheduled.';
        if (newStatus === 'Declined') target.supervisorNote = 'Meeting request declined due to schedule conflict.';
        target.dateUpdated = new Date().toISOString().split('T')[0];
        window.SSMSData.saveAppointments(allApts);
        this.renderAppointmentsPage('appointmentsContentArea');
        window.SSMSApp.showNotification(`Appointment marked as ${newStatus}.`, 'info');
      }
    }
  };
})();
