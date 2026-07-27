/* ==========================================================================
   IDENTIFICATION: FRONT-END LOGIC (JAVASCRIPT) - DOCUMENT REPOSITORY VAULT
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: Document Storage Vault, File Transmission between Student & Supervisor,
                Document Categories, Version Tracking, & Simulated File Downloads.
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

    renderVault: function(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const docs = window.SSMSData.getDocs();
      const currentUser = window.SSMSAuth.getCurrentUser();

      let html = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span style="color: var(--primary-blue); font-size: 1.4rem;">📁</span>
              Document Repository & Project File Vault
            </div>
            <button class="btn btn-accent" onclick="window.SSMSDocuments.openUploadModal()">
              <span style="font-size: 1.1rem;">📤</span> Send / Upload Document
            </button>
          </div>

          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
            Secure file vault for exchanging project proposals, draft chapters, supervisor corrections, and final thesis documents between students and supervisors.
          </p>

          <div class="upload-zone" onclick="window.SSMSDocuments.openUploadModal()">
            <div style="font-size: 2.2rem; color: var(--primary-blue); margin-bottom: 8px;">☁️</div>
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

      if (docs.length === 0) {
        html += `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
            No documents found in vault. Click "Send / Upload Document" above to send your first file.
          </div>
        `;
      } else {
        docs.forEach(doc => {
          html += this.createDocCardHtml(doc);
        });
      }

      html += `
          </div>
        </div>
      `;

      container.innerHTML = html;
    },

    createDocCardHtml: function(doc) {
      let icon = '📄';
      if (doc.fileType === 'pdf') icon = '📕';
      if (doc.fileType === 'doc' || doc.fileType === 'docx') icon = '📘';
      if (doc.fileType === 'zip') icon = '📦';

      let statusColor = '#004C84';
      if (doc.status === 'Approved') statusColor = '#10B981';
      if (doc.status === 'Revision Required') statusColor = '#EF4444';

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
              <span class="doc-tag" style="background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor};">
                ${this.escapeHTML(doc.status)}
              </span>
            </div>
          </div>
          <div class="doc-actions">
            <button class="btn btn-primary btn-sm" style="flex:1;" onclick="window.SSMSDocuments.downloadDoc('${doc.id}')">
              📥 Download
            </button>
            <button class="btn btn-outline btn-sm" onclick="window.SSMSDocuments.viewDetails('${doc.id}')">
              👁️ Details
            </button>
          </div>
        </div>
      `;
    },

    filterDocs: function() {
      const searchVal = document.getElementById('docSearchInput').value.toLowerCase();
      const catVal = document.getElementById('docCategoryFilter').value;
      const docs = window.SSMSData.getDocs();
      const grid = document.getElementById('docGridContainer');

      const filtered = docs.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(searchVal) || d.uploadedBy.toLowerCase().includes(searchVal);
        const matchesCat = catVal === 'all' || d.category === catVal;
        return matchesSearch && matchesCat;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No matching documents found.</div>`;
      } else {
        grid.innerHTML = filtered.map(d => this.createDocCardHtml(d)).join('');
      }
    },

    openUploadModal: function() {
      const currentUser = window.SSMSAuth.getCurrentUser();
      const isSupervisor = currentUser && currentUser.role === 'supervisor';

      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">📤 Send Document File</div>
            <button onclick="window.SSMSApp.closeModal()" style="background:none; color:white; font-size:1.4rem;">&times;</button>
          </div>
          <div class="modal-body">
            <form id="uploadDocForm">
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
                <label class="form-label">Attach File (Simulated)</label>
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

        const newDoc = {
          id: 'doc_' + Date.now(),
          title: fileName,
          category: category,
          uploadedBy: currentUser ? currentUser.name + ' (' + currentUser.role.toUpperCase() + ')' : 'User',
          uploaderRole: currentUser ? currentUser.role : 'student',
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
        window.SSMSDocuments.renderVault('vaultContentArea');
        window.SSMSApp.showNotification('Document transmitted successfully to file vault!', 'success');
      });
    },

    downloadDoc: function(docId) {
      const docs = window.SSMSData.getDocs();
      const doc = docs.find(d => d.id === docId);
      if (!doc) return;
      window.SSMSApp.showNotification(`Downloading ${this.escapeHTML(doc.title)}. Transmission simulated successfully.`, 'success');
    },

    viewDetails: function(docId) {
      const docs = window.SSMSData.getDocs();
      const doc = docs.find(d => d.id === docId);
      if (!doc) return;

      const modalHtml = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">📄 Document Details</div>
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
