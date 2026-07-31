/* ==========================================================================
   IDENTIFICATION: FRONT-END LOGIC (JAVASCRIPT) - DOCUMENT REPOSITORY VAULT
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: Document Storage Vault, Role-Scoped File Access,
                Transmission between Student & Supervisor, Document Status Review,
                & Version Tracking.
   ========================================================================== */

(function() {
  'use strict';

  window.SSMSDocuments = {
    escapeHTML: function(value) {
      if (value === null || value === undefined) return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    getUserDocs: function(currentUser) {
      const allDocs = window.SSMSData.getDocs();
      const allUsers = window.SSMSData.getUsers();

      if (!currentUser) return [];

      if (currentUser.role === 'admin') {
        return allDocs;
      }

      if (currentUser.role === 'supervisor') {
        // Find students assigned to this supervisor
        const myStudentIds = allUsers.filter(u => u.role === 'student' && u.supervisorId === currentUser.id).map(u => u.id);

        if (myStudentIds.length === 0) {
          // Supervisor has NO assigned students -> strictly return 0 documents
          return [];
        }

        return allDocs.filter(d => {
          const isRecipient = d.recipientId === currentUser.id;
          const isUploader = d.uploaderId === currentUser.id;
          const isFromMyStudent = d.studentId && myStudentIds.includes(d.studentId);
          const isForMySupervisor = d.supervisorId && d.supervisorId === currentUser.id;
          return isRecipient || isUploader || isFromMyStudent || isForMySupervisor;
        });
      }

      if (currentUser.role === 'student') {
        return allDocs.filter(d => {
          const isDirect = d.recipientId === currentUser.id || d.uploaderId === currentUser.id || d.studentId === currentUser.id;
          const isGroupDoc = (currentUser.groupName && d.groupName === currentUser.groupName) || (currentUser.groupId && d.groupId === currentUser.groupId);
          return isDirect || isGroupDoc;
        });
      }

      return [];
    },

    renderVault: function(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const currentUser = window.SSMSAuth.getCurrentUser();
      const allUsers = window.SSMSData.getUsers();
      const userDocs = this.getUserDocs(currentUser);

      const isSupervisor = currentUser && currentUser.role === 'supervisor';
      const myStudents = isSupervisor ? allUsers.filter(u => u.role === 'student' && u.supervisorId === currentUser.id) : [];

      let html = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              Document Repository & Project File Vault
            </div>
            <button class="btn btn-accent" onclick="window.SSMSDocuments.openUploadModal()">
              Send / Upload Document
            </button>
          </div>

          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
            Secure file repository for transmitting project proposals, draft chapters, supervisor corrections, and final thesis documents.
          </p>
      `;

      // If supervisor has 0 assigned students, render informative empty state banner
      if (isSupervisor && myStudents.length === 0) {
        html += `
            <div style="text-align: center; padding: 45px 20px; background: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: var(--radius-md); margin-bottom: 20px;">
              <div style="font-size: 3.5rem; margin-bottom: 12px;"></div>
              <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-dark);">No Documents Available</h3>
              <p style="color: var(--text-muted); max-width: 520px; margin: 6px auto 18px auto; font-size: 0.9rem; line-height: 1.5;">
                You currently have no project students assigned to you by the HOD. Document download, viewing, approval, or rejection actions will become available once assigned students submit files to your vault.
              </p>
            </div>
          </div>
        `;
        container.innerHTML = html;
        return;
      }

      html += `
          <div class="upload-zone" onclick="window.SSMSDocuments.openUploadModal()">
            <div style="font-size: 2.2rem; color: var(--primary-blue); margin-bottom: 8px;"></div>
            <h4 style="color: var(--primary-blue); margin-bottom: 4px;">Click to Send a Document to your Supervisor / Student</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Supports PDF, DOCX, PPTX, and ZIP files up to 25MB</p>
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
            <input type="text" id="docSearchInput" class="form-control" placeholder="Search documents by title..." style="max-width: 300px;" oninput="window.SSMSDocuments.filterDocs()">
            <select id="docCategoryFilter" class="form-control" style="max-width: 200px;" onchange="window.SSMSDocuments.filterDocs()">
              <option value="all">All Document Categories</option>
              <option value="Proposal">Proposal</option>
              <option value="Chapter 1">Chapter 1</option>
              <option value="Chapter 2">Chapter 2</option>
              <option value="Chapter 3">Chapter 3</option>
              <option value="Chapter 4">Chapter 4</option>
              <option value="Chapter 5">Chapter 5</option>
              <option value="Supervisor Feedback">Supervisor Feedback</option>
            </select>
          </div>

          <div class="doc-vault-grid" id="docGridContainer">
      `;

      if (userDocs.length === 0) {
        html += `
          <div style="grid-column: 1/-1; text-align: center; padding: 45px 20px; color: var(--text-muted);">
            <div style="font-size: 2.5rem; margin-bottom: 10px;"></div>
            <strong>No documents found in your vault.</strong><br>
            Files uploaded by you or transmitted by your supervisor/students will appear here.
          </div>
        `;
      } else {
        userDocs.forEach(doc => {
          html += this.createDocCardHtml(doc, currentUser);
        });
      }

      html += `
          </div>
        </div>
      `;

      container.innerHTML = html;
    },

    createDocCardHtml: function(doc, currentUser) {
let icon = '';
      if (doc.fileType === 'pdf') icon = '';
      if (doc.fileType === 'doc' || doc.fileType === 'docx') icon = '';
      if (doc.fileType === 'zip') icon = '';

      let statusColor = '#004C84';
      if (doc.status === 'Approved') statusColor = '#10B981';
      if (doc.status === 'Revision Required' || doc.status === 'Rejected') statusColor = '#EF4444';
      if (doc.status === 'Under Review') statusColor = '#F59E0B';

      const isSupervisor = currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'admin');

      return `
        <div class="doc-card">
          <div>
            <div class="doc-header">
              <div class="doc-icon">${icon}</div>
              <div style="flex:1;">
                <div class="doc-title">${this.escapeHTML(doc.title)}</div>
                <div class="doc-meta">Category: <strong>${this.escapeHTML(doc.category)}</strong> (${this.escapeHTML(doc.version)})</div>
              </div>
            </div>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 8px;">
              <strong>Sent by:</strong> ${this.escapeHTML(doc.uploadedBy)}<br>
              <strong>Date:</strong> ${this.escapeHTML(doc.uploadDate)} | <strong>Size:</strong> ${this.escapeHTML(doc.fileSize)}
            </div>
            <div>
              <span class="doc-tag" style="background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}; font-weight: 700;">
                ${this.escapeHTML(doc.status)}
              </span>
            </div>
          </div>
          <div class="doc-actions" style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" style="flex:1;" onclick="window.SSMSDocuments.downloadDoc('${doc.id}')">
              Download
            </button>
            <button class="btn btn-outline btn-sm" onclick="window.SSMSDocuments.viewDetails('${doc.id}')">
              Details
            </button>
            ${isSupervisor ? `
              <button class="btn btn-accent btn-sm" onclick="window.SSMSDocuments.openReviewModal('${doc.id}')">
                Review / Approve
              </button>
            ` : ''}
          </div>
        </div>
      `;
    },

    filterDocs: function() {
      const searchVal = document.getElementById('docSearchInput').value.toLowerCase();
      const catVal = document.getElementById('docCategoryFilter').value;
      const currentUser = window.SSMSAuth.getCurrentUser();
      const userDocs = this.getUserDocs(currentUser);
      const grid = document.getElementById('docGridContainer');

      if (!grid) return;

      const filtered = userDocs.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(searchVal) || d.uploadedBy.toLowerCase().includes(searchVal);
        const matchesCat = catVal === 'all' || d.category === catVal;
        return matchesSearch && matchesCat;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No matching documents found.</div>`;
      } else {
        grid.innerHTML = filtered.map(d => this.createDocCardHtml(d, currentUser)).join('');
      }
    },

    openUploadModal: function() {
      const currentUser = window.SSMSAuth.getCurrentUser();
      const allUsers = window.SSMSData.getUsers();
      const isSupervisor = currentUser && currentUser.role === 'supervisor';

      let recipientSelectorHtml = '';
      if (isSupervisor) {
        const myStudents = allUsers.filter(u => u.role === 'student' && u.supervisorId === currentUser.id);
        if (myStudents.length === 0) {
          window.SSMSApp.showNotification('Cannot upload document: You have no assigned students to send documents to.', 'warning');
          return;
        }
        let options = myStudents.map(s => `<option value="${s.id}">${this.escapeHTML(s.name)} (${this.escapeHTML(s.matricNo || 'ID')})</option>`).join('');
        recipientSelectorHtml = `
          <div class="form-group">
            <label class="form-label">Select Student Recipient</label>
            <select id="docRecipientInput" class="form-control">
              ${options}
            </select>
          </div>
        `;
      }

      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">Send Document File</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <form id="uploadDocForm">
              ${recipientSelectorHtml}
              <div class="form-group">
                <label class="form-label">Document Title / File Name</label>
                <input type="text" id="docTitleInput" class="form-control" placeholder="e.g. Chapter_3_Methodology_v1.pdf" required>
              </div>
              <div class="form-group">
                <label class="form-label">Document Category</label>
                <select id="docCategoryInput" class="form-control">
                  <option value="Proposal">Proposal</option>
                  <option value="Chapter 1">Chapter 1</option>
                  <option value="Chapter 2">Chapter 2</option>
                  <option value="Chapter 3">Chapter 3</option>
                  <option value="Chapter 4">Chapter 4</option>
                  <option value="Chapter 5">Chapter 5</option>
                  <option value="Supervisor Feedback" ${isSupervisor ? 'selected' : ''}>Supervisor Feedback</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Version Number</label>
                <input type="text" id="docVersionInput" class="form-control" value="v1.0" required>
              </div>
              <div class="form-group">
                <label class="form-label">Attach File (Simulated Upload)</label>
                <input type="file" id="docFileInput" class="form-control">
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button type="button" class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-accent">Transmit Document</button>
              </div>
            </form>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(modalHtml);

      const self = this;
      document.getElementById('uploadDocForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('docTitleInput').value;
        const category = document.getElementById('docCategoryInput').value;
        const version = document.getElementById('docVersionInput').value;
        const fileInput = document.getElementById('docFileInput');

        let fileName = title;
        let fileSize = '1.8 MB';
        let ext = 'pdf';

        if (fileInput.files && fileInput.files[0]) {
          fileName = fileInput.files[0].name;
          fileSize = (fileInput.files[0].size / (1024 * 1024)).toFixed(1) + ' MB';
          ext = fileName.split('.').pop().toLowerCase();
        }

        let recipientId = null;
        let studentId = null;
        let supervisorId = null;

        if (currentUser.role === 'student') {
          studentId = currentUser.id;
          supervisorId = currentUser.supervisorId;
          recipientId = currentUser.supervisorId;
        } else if (currentUser.role === 'supervisor') {
          supervisorId = currentUser.id;
          const selectElem = document.getElementById('docRecipientInput');
          recipientId = selectElem ? selectElem.value : null;
          studentId = recipientId;
        }

        const newDoc = {
          id: 'doc_' + Date.now(),
          title: fileName,
          category: category,
          uploadedBy: currentUser ? currentUser.name + ' (' + currentUser.role.toUpperCase() + ')' : 'User',
          uploaderRole: currentUser ? currentUser.role : 'student',
          uploaderId: currentUser ? currentUser.id : null,
          recipientId: recipientId,
          studentId: studentId,
          supervisorId: supervisorId,
          groupName: currentUser.groupName || null,
          groupId: currentUser.groupId || null,
          fileSize: fileSize,
          uploadDate: new Date().toISOString().split('T')[0],
          status: isSupervisor ? 'Supervisor Review Sent' : 'Under Review',
          version: version,
          fileType: ext,
          downloadUrl: '#'
        };

        const docs = window.SSMSData.getDocs();
        docs.unshift(newDoc);
        window.SSMSData.saveDocs(docs);

        window.SSMSApp.closeModal();
        self.renderVault('vaultContentArea');
        window.SSMSApp.showNotification('Document transmitted successfully to file vault!', 'success');
      });
    },

    openReviewModal: function(docId) {
      const docs = window.SSMSData.getDocs();
      const doc = docs.find(d => d.id === docId);
      if (!doc) return;

      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">Review & Approve Document</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <form id="reviewDocForm">
              <div class="form-group">
                <label class="form-label">Document: <strong>${this.escapeHTML(doc.title)}</strong></label>
              </div>
              <div class="form-group">
                <label class="form-label">Select Document Decision / Status</label>
                <select id="reviewStatusSelect" class="form-control">
                  <option value="Approved" ${doc.status === 'Approved' ? 'selected' : ''}>Approved</option>
                  <option value="Revision Required" ${doc.status === 'Revision Required' ? 'selected' : ''}>Revision Required</option>
                  <option value="Rejected" ${doc.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                  <option value="Under Review" ${doc.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                </select>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button type="button" class="btn btn-outline" onclick="window.SSMSApp.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-accent">Save Decision</button>
              </div>
            </form>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(modalHtml);

      const self = this;
      document.getElementById('reviewDocForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const newStatus = document.getElementById('reviewStatusSelect').value;

        const allDocs = window.SSMSData.getDocs();
        const targetDoc = allDocs.find(d => d.id === docId);
        if (targetDoc) {
          targetDoc.status = newStatus;
          window.SSMSData.saveDocs(allDocs);
        }

        window.SSMSApp.closeModal();
        self.renderVault('vaultContentArea');
        window.SSMSApp.showNotification('Document review decision saved successfully.', 'success');
      });
    },

    downloadDoc: function(docId) {
      const currentUser = window.SSMSAuth.getCurrentUser();
      const userDocs = this.getUserDocs(currentUser);
      const doc = userDocs.find(d => d.id === docId);
      if (!doc) {
        window.SSMSApp.showNotification('Access denied: You do not have permission to download this document.', 'error');
        return;
      }
      window.SSMSApp.showNotification(`Downloading ${this.escapeHTML(doc.title)}. Transmission simulated successfully.`, 'success');
    },

    viewDetails: function(docId) {
      const currentUser = window.SSMSAuth.getCurrentUser();
      const userDocs = this.getUserDocs(currentUser);
      const doc = userDocs.find(d => d.id === docId);
      if (!doc) return;

      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">Document Details</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <div style="line-height: 1.65;">
              <strong>Title:</strong> ${this.escapeHTML(doc.title)}<br>
              <strong>Category:</strong> ${this.escapeHTML(doc.category)}<br>
              <strong>Uploaded By:</strong> ${this.escapeHTML(doc.uploadedBy)}<br>
              <strong>Upload Date:</strong> ${this.escapeHTML(doc.uploadDate)}<br>
              <strong>Version:</strong> ${this.escapeHTML(doc.version)}<br>
              <strong>Status:</strong> ${this.escapeHTML(doc.status)}<br>
              <strong>Size:</strong> ${this.escapeHTML(doc.fileSize)}
            </div>
          </div>
        </div>
      `;

      window.SSMSApp.showCustomModal(modalHtml);
    }
  };
})();
