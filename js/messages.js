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
      } else if (currentUser.role === 'supervisor') {
        recipientList = users.filter(u => u.role === 'student' && u.supervisorId === currentUser.id);
      } else if (currentUser.role === 'admin') {
        recipientList = users.filter(u => u.id !== currentUser.id);
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
              <h3 style="font-size: 1.05rem; font-weight: 700;">💬 Direct Chat Threads</h3>
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

          html += `
            <div class="chat-contact-item ${isActive ? 'active' : ''}" onclick="window.SSMSMessages.selectRecipient('${rec.id}')">
              <div class="user-avatar" style="width: 36px; height: 36px; font-size: 0.85rem; flex-shrink: 0;">${initials}</div>
              <div style="overflow: hidden; flex: 1;">
                <div style="font-weight: 700; font-size: 0.88rem; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; color: var(--text-dark);">${this.escapeHTML(rec.name)}</div>
                <div style="font-size: 0.75rem; color: var(--accent-orange); text-transform: capitalize;">${this.escapeHTML(rec.role)}</div>
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
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="user-avatar" style="background: var(--primary-blue); color: white;">
                ${this.escapeHTML(activeRecipient.name).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--primary-blue);">${this.escapeHTML(activeRecipient.name)}</h4>
                <p style="font-size: 0.78rem; color: var(--text-muted);">${this.escapeHTML(activeRecipient.role.toUpperCase())} | ${this.escapeHTML(activeRecipient.email)}</p>
              </div>
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
            <form id="sendMessageForm" style="display: flex; gap: 12px;">
              <input type="text" id="chatMessageInput" class="form-control" placeholder="Type your message to ${this.escapeHTML(activeRecipient.name)}..." required style="flex: 1;">
              <button type="submit" class="btn btn-accent" style="white-space: nowrap;">
                Send Message 📤
              </button>
            </form>
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
          if (!text) return;

          this.dispatchMessage(currentUser, activeRecipient, text);
          input.value = '';
        });
      }
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
        text: text,
        timestamp: timeStr
      };

      messages.push(newMsg);
      window.SSMSData.saveMessages(messages);
      this.renderMessagingPortal('messagesContentArea');
    }
  };
})();
