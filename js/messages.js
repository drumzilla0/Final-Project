/* ==========================================================================
   IDENTIFICATION: FRONT-END LOGIC (JAVASCRIPT) - DIRECT MESSAGING SYSTEM
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: Renders Direct Messaging Portal, Student-Supervisor Chat Threads,
                Instant Reply Dispatcher, & Conversation State Layer.
   ========================================================================== */

(function() {
  'use strict';

  window.SSMSMessages = {
    activeRecipientId: null,

    escapeHTML: function(value) {
      if (value === null || value === undefined) return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    renderMessagingPortal: function(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const currentUser = window.SSMSAuth.getCurrentUser();
      const users = window.SSMSData.getUsers();

      let recipientList = [];

      if (currentUser.role === 'student') {
        const supervisor = users.find(u => u.id === currentUser.supervisorId);
        if (supervisor) recipientList.push(supervisor);

        const teammates = users.filter(u => u.role === 'student' && u.id !== currentUser.id && (
          (currentUser.groupName && u.groupName === currentUser.groupName) ||
          (currentUser.groupId && u.groupId === currentUser.groupId)
        ));
        recipientList.push(...teammates);
      } else if (currentUser.role === 'supervisor') {
        // Supervisors can chat with their assigned students AND the HOD/Admin
        const myStudents = users.filter(u => u.role === 'student' && u.supervisorId === currentUser.id);
        const adminUsers = users.filter(u => u.role === 'admin');
        recipientList = [...myStudents, ...adminUsers];
      } else if (currentUser.role === 'admin') {
        // System Chat on the Admin side is strictly for Supervisors and the Admin only
        recipientList = users.filter(u => u.role === 'supervisor');
      }

      if (!this.activeRecipientId && recipientList.length > 0) {
        this.activeRecipientId = recipientList[0].id;
      }

      const activeRecipient = users.find(u => u.id === this.activeRecipientId);

      let html = `
        <div class="card" style="padding: 0; overflow: hidden; display: flex; min-height: 520px; border-radius: var(--radius-lg);">
          
          <!-- LEFT SIDEBAR: CONTACT LIST -->
          <div style="width: 280px; background: #F8FAFC; border-right: 1px solid #E2E8F0; display: flex; flex-direction: column;">
            <div style="padding: 20px; border-bottom: 1px solid #E2E8F0; background: var(--primary-blue); color: white;">
              <h3 style="font-size: 1.05rem; font-weight: 700;">Direct Chat Threads</h3>
              <p style="font-size: 0.78rem; opacity: 0.85;">${currentUser.role.toUpperCase()} Workspace</p>
            </div>
            <div style="flex: 1; overflow-y: auto; padding: 10px;">
      `;

      if (recipientList.length === 0) {
        html += `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No conversation partners available.</div>`;
      } else {
        recipientList.forEach(rec => {
          const isActive = rec.id === this.activeRecipientId;
          const initials = this.escapeHTML(rec.name).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

          let roleTag = rec.role;
          if (currentUser.role === 'student') {
            if (rec.role === 'supervisor') {
              roleTag = 'Supervisor';
            } else {
              roleTag = 'Teammate (' + (rec.matricNo || 'Student') + ')';
            }
          }

          html += `
            <div class="chat-contact-item ${isActive ? 'active' : ''}" onclick="window.SSMSMessages.selectRecipient('${rec.id}')">
              <div style="overflow: hidden; flex: 1;">
                <div style="font-weight: 700; font-size: 0.88rem; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; color: var(--text-dark);">${this.escapeHTML(rec.name)}</div>
                <div style="font-size: 0.75rem; color: var(--accent-orange); font-weight: 600;">${this.escapeHTML(roleTag)}</div>
              </div>
            </div>
          `;
        });
      }

      html += `
            </div>
          </div>

          <!-- RIGHT SIDE: CHAT CONVERSATION VIEW -->
          <div style="flex: 1; display: flex; flex-direction: column; background: var(--pure-white);">
      `;

      if (!activeRecipient) {
        html += `
          <div style="flex:1; display:flex; align-items:center; justify-content:center; color: var(--text-muted);">
            Select a contact on the left to start messaging.
          </div>
        `;
      } else {
        const allMessages = window.SSMSData.getMessages();
        const threadMessages = allMessages.filter(m => 
          (m.senderId === currentUser.id && m.recipientId === activeRecipient.id) ||
          (m.senderId === activeRecipient.id && m.recipientId === currentUser.id)
        );

        html += `
          <!-- CHAT HEADER -->
          <div style="padding: 16px 24px; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between; background: #F8FAFC;">
            <div>
              <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--primary-blue);">${this.escapeHTML(activeRecipient.name)}</h4>
              <p style="font-size: 0.78rem; color: var(--text-muted);">${this.escapeHTML(activeRecipient.role.toUpperCase())} | ${this.escapeHTML(activeRecipient.email)}</p>
            </div>
            <span class="stage-badge badge-approved" style="font-size: 0.75rem;">Connected Channel</span>
          </div>

          <!-- CHAT MESSAGES FEED -->
          <div class="chat-feed-container" id="chatFeedArea">
        `;

        if (threadMessages.length === 0) {
          html += `
            <div style="text-align: center; margin: auto; color: var(--text-muted); font-size: 0.9rem;">
              No messages sent yet in this thread. Type your message below to begin consultation.
            </div>
          `;
        } else {
          threadMessages.forEach(msg => {
            const isMine = msg.senderId === currentUser.id;
            html += `
              <div class="chat-bubble-wrapper ${isMine ? 'mine' : 'theirs'}">
                <div class="chat-bubble ${isMine ? 'mine' : 'theirs'}">
                  <div style="font-weight: 700; font-size: 0.75rem; margin-bottom: 4px; opacity: 0.9;">
                    ${this.escapeHTML(msg.senderName)} (${this.escapeHTML(msg.senderRole.toUpperCase())})
                  </div>
                  <div>${this.escapeHTML(msg.text)}</div>
                  ${msg.attachment ? `
                    <div style="background: rgba(255,255,255,0.2); border-radius: var(--radius-sm); padding: 8px 12px; margin-top: 6px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid rgba(255,255,255,0.35);">
                      <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem;">
                        <span style="font-size:1.2rem;"></span>
                        <div style="text-align:left;">
                          <strong style="display: block; font-size:0.85rem;">${this.escapeHTML(msg.attachment.fileName)}</strong>
                          <span style="font-size: 0.72rem; opacity: 0.85;">${this.escapeHTML(msg.attachment.fileSize || '1.5 MB')}</span>
                        </div>
                      </div>
                      <a href="#" onclick="window.SSMSApp.showNotification('Downloading file attachment: ${this.escapeHTML(msg.attachment.fileName)}', 'success'); return false;" class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 2px 8px; color: inherit; border-color: currentColor;">
                        Download File
                      </a>
                    </div>
                  ` : ''}
                  <div class="chat-timestamp">${this.escapeHTML(msg.timestamp)}</div>
                </div>
              </div>
            `;
          });
        }

        html += `
          </div>

          <!-- CHAT INPUT COMPOSER -->
          <div style="padding: 16px 24px; border-top: 1px solid #E2E8F0; background: #F8FAFC;">
            <input type="file" id="chatFileInput" style="display: none;" onchange="window.SSMSMessages.handleChatFileSelected(this)">
            <form id="sendMessageForm" style="display: flex; gap: 10px; align-items: center;">
              <button type="button" class="btn btn-outline" style="padding: 10px 14px;" onclick="document.getElementById('chatFileInput').click()" title="Attach File/Document">
                Attach File
              </button>
              <input type="text" id="chatMessageInput" class="form-control" placeholder="Type message to ${this.escapeHTML(activeRecipient.name)}..." style="flex: 1;">
              <button type="submit" class="btn btn-accent" style="white-space: nowrap; font-weight: 700;">
                Send Message
              </button>
            </form>
            <div id="chatFileSelectedBadge" style="display:none; font-size: 0.82rem; color: var(--primary-blue); font-weight:700; margin-top: 6px; padding-left: 10px;"></div>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;

      container.innerHTML = html;

      // Scroll chat feed to bottom
      const feed = document.getElementById('chatFeedArea');
      if (feed) feed.scrollTop = feed.scrollHeight;

      // Attach submit handler
      const sendForm = document.getElementById('sendMessageForm');
      if (sendForm) {
        sendForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = document.getElementById('chatMessageInput');
          const text = input.value.trim();
          if (!text && !this.pendingAttachment) return;

          this.dispatchMessage(currentUser, activeRecipient, text);
          input.value = '';
        });
      }
    },

    pendingAttachment: null,

    handleChatFileSelected: function(inputElem) {
      if (inputElem.files && inputElem.files[0]) {
        const file = inputElem.files[0];
        const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        this.pendingAttachment = {
          fileName: file.name,
          fileSize: sizeStr,
          fileType: file.name.split('.').pop().toLowerCase()
        };

        const badge = document.getElementById('chatFileSelectedBadge');
        if (badge) {
          badge.style.display = 'block';
          badge.innerHTML = `Attached File Ready: <strong>${this.escapeHTML(file.name)}</strong> (${sizeStr}) <button onclick="window.SSMSMessages.clearPendingAttachment()" style="background:none; border:none; color:red; font-weight:700; cursor:pointer;">&times;</button>`;
        }
        window.SSMSApp.showNotification(`Attached file: ${file.name}. Click Send to share.`, 'info');
      }
    },

    clearPendingAttachment: function() {
      this.pendingAttachment = null;
      const badge = document.getElementById('chatFileSelectedBadge');
      if (badge) badge.style.display = 'none';
      const input = document.getElementById('chatFileInput');
      if (input) input.value = '';
    },

    selectRecipient: function(recId) {
      this.activeRecipientId = recId;
      this.renderMessagingPortal('messagesContentArea');
    },

    dispatchMessage: function(sender, recipient, text) {
      const messages = window.SSMSData.getMessages();
      const now = new Date();
      const timeStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newMsg = {
        id: 'msg_' + Date.now(),
        senderId: sender.id,
        senderName: sender.name,
        senderRole: sender.role,
        recipientId: recipient.id,
        text: text || (this.pendingAttachment ? `Shared document file: ${this.pendingAttachment.fileName}` : 'File attachment'),
        attachment: this.pendingAttachment ? { ...this.pendingAttachment } : null,
        timestamp: timeStr
      };

      messages.push(newMsg);
      window.SSMSData.saveMessages(messages);

      if (this.pendingAttachment) {
        const docs = window.SSMSData.getDocs();
        docs.unshift({
          id: 'doc_' + Date.now(),
          title: this.pendingAttachment.fileName,
          category: 'Group Shared File',
          uploadedBy: sender.name + ' (' + sender.role.toUpperCase() + ')',
          uploaderRole: sender.role,
          uploaderId: sender.id,
          recipientId: recipient.id,
          studentId: sender.role === 'student' ? sender.id : recipient.id,
          supervisorId: sender.role === 'supervisor' ? sender.id : (recipient.role === 'supervisor' ? recipient.id : sender.supervisorId),
          groupName: sender.groupName || null,
          groupId: sender.groupId || null,
          fileSize: this.pendingAttachment.fileSize,
          uploadDate: new Date().toISOString().split('T')[0],
          status: 'Shared in Chat',
          version: 'v1.0',
          fileType: this.pendingAttachment.fileType,
          downloadUrl: '#'
        });
        window.SSMSData.saveDocs(docs);
      }

      this.pendingAttachment = null;
      this.renderMessagingPortal('messagesContentArea');
    }
  };
})();
