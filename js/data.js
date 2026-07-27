/* ==========================================================================
   IDENTIFICATION: FRONT-END LOGIC (JAVASCRIPT) - DATA STORAGE & INITIAL STATE
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: LocalStorage Persistent Data Layer, Initial Default Credentials,
                Supervisor Specialty Areas, Project Stages, Documents, Messages, & Appointments.
   ========================================================================== */

(function() {
  'use strict';

  // Seed Data Configuration
  const INITIAL_USERS = [
    {
      id: 'usr_admin',
      name: 'Dr. Elizabeth Vance (HOD)',
      email: 'hod@univ.edu',
      passwordHash: 'admin123',
      isDefaultPassword: true,
      role: 'admin',
      department: 'Computer Science & Software Engineering',
      phone: '+234 803 111 2233'
    },
    {
      id: 'usr_sup_1',
      name: 'Prof. Marcus Sterling',
      email: 'sup2026@univ.edu',
      passwordHash: 'super123',
      isDefaultPassword: true,
      role: 'supervisor',
      department: 'Computer Science',
      maxStudents: 5,
      specialties: ['Artificial Intelligence', 'Web Development', 'Cloud Computing']
    },
    {
      id: 'usr_std_1',
      name: 'Alexander Pierce',
      email: 'std2026@univ.edu',
      passwordHash: 'student123',
      isDefaultPassword: true,
      role: 'student',
      matricNo: 'CSC/2022/1042',
      supervisorId: 'usr_sup_1',
      projectTitle: 'AI-Powered Student Project Progress & Document Vault System'
    }
  ];

  const INITIAL_PROJECT_STAGES = [
    {
      stageId: 1,
      name: 'Proposal & Title Defense',
      description: 'Submission and defense of project topic proposal, problem formulation, and supervisor matching.',
      status: 'approved',
      supervisorComment: 'Proposal approved by HOD board. Scope well defined.',
      dateUpdated: '2026-06-15'
    },
    {
      stageId: 2,
      name: 'Chapter 1: Introduction',
      description: 'Background of study, statement of problem, objectives, scope, and significance.',
      status: 'approved',
      supervisorComment: 'Good introduction. Objectives align with research scope.',
      dateUpdated: '2026-06-28'
    },
    {
      stageId: 3,
      name: 'Chapter 2: Literature Review',
      description: 'Comprehensive review of related work, theoretical framework, and gap analysis.',
      status: 'in-progress',
      supervisorComment: 'Under review. Please add 5 recent 2025/2026 journal citations.',
      dateUpdated: '2026-07-10'
    },
    {
      stageId: 4,
      name: 'Chapter 3: System Methodology',
      description: 'System design, architectural diagrams, data flow modeling, and database schema.',
      status: 'pending',
      supervisorComment: 'Awaiting submission.',
      dateUpdated: null
    },
    {
      stageId: 5,
      name: 'Chapter 4: Implementation & Results',
      description: 'Coding implementation, algorithm evaluation, testing results, and system screenshots.',
      status: 'pending',
      supervisorComment: 'Awaiting submission.',
      dateUpdated: null
    },
    {
      stageId: 6,
      name: 'Chapter 5: Conclusion & Recommendation',
      description: 'Summary of findings, limitations, future work recommendations, and references.',
      status: 'pending',
      supervisorComment: 'Awaiting submission.',
      dateUpdated: null
    },
    {
      stageId: 7,
      name: 'Final Defense & Binding',
      description: 'Final oral defense presentation, corrections verification, and hard-cover binding.',
      status: 'pending',
      supervisorComment: 'Pending previous chapters completion.',
      dateUpdated: null
    }
  ];

  const INITIAL_DOCUMENTS = [
    {
      id: 'doc_101',
      title: 'Approved_Project_Proposal_v2.pdf',
      category: 'Proposal',
      uploadedBy: 'Alexander Pierce (Student)',
      uploaderRole: 'student',
      recipientId: 'usr_sup_1',
      fileSize: '2.4 MB',
      uploadDate: '2026-06-14',
      status: 'Approved',
      version: 'v2.0',
      fileType: 'pdf',
      downloadUrl: '#'
    },
    {
      id: 'doc_102',
      title: 'Chapter_1_Introduction_FinalDraft.docx',
      category: 'Chapter 1',
      uploadedBy: 'Alexander Pierce (Student)',
      uploaderRole: 'student',
      recipientId: 'usr_sup_1',
      fileSize: '1.1 MB',
      uploadDate: '2026-06-26',
      status: 'Approved',
      version: 'v1.2',
      fileType: 'doc',
      downloadUrl: '#'
    },
    {
      id: 'doc_103',
      title: 'Supervisor_Corrections_Chapter_2.pdf',
      category: 'Supervisor Feedback',
      uploadedBy: 'Prof. Marcus Sterling (Supervisor)',
      uploaderRole: 'supervisor',
      recipientId: 'usr_std_1',
      fileSize: '780 KB',
      uploadDate: '2026-07-12',
      status: 'Revision Required',
      version: 'v1.0',
      fileType: 'pdf',
      downloadUrl: '#'
    }
  ];

  const INITIAL_MESSAGES = [
    {
      id: 'msg_1',
      senderId: 'usr_std_1',
      senderName: 'Alexander Pierce',
      senderRole: 'student',
      recipientId: 'usr_sup_1',
      text: 'Good day Prof. Sterling, I have updated Chapter 2 with the 2025/2026 literature citations as requested.',
      timestamp: '2026-07-22 09:30 AM'
    },
    {
      id: 'msg_2',
      senderId: 'usr_sup_1',
      senderName: 'Prof. Marcus Sterling',
      senderRole: 'supervisor',
      recipientId: 'usr_std_1',
      text: 'Hello Alexander. Thank you for the update. I will review the citations and provide feedback in our next scheduled meeting.',
      timestamp: '2026-07-22 11:15 AM'
    }
  ];

  const INITIAL_APPOINTMENTS = [
    {
      id: 'apt_101',
      studentId: 'usr_std_1',
      studentName: 'Alexander Pierce',
      supervisorId: 'usr_sup_1',
      supervisorName: 'Prof. Marcus Sterling',
      topic: 'Chapter 2 Review & Methodology Setup',
      requestedDate: '2026-07-26',
      requestedTime: '02:00 PM',
      venue: 'HOD Office / Room 304',
      status: 'Confirmed',
      supervisorNote: 'Confirmed. Please bring printouts of Chapter 2 citations.',
      dateUpdated: '2026-07-22'
    }
  ];

  // Helper Methods to Initialize and Retrieve LocalStorage
  window.SSMSData = {
    getUsers: function() {
      const data = localStorage.getItem('ssms_users');
      return data ? JSON.parse(data) : INITIAL_USERS;
    },
    saveUsers: function(users) {
      localStorage.setItem('ssms_users', JSON.stringify(users));
    },
    getStages: function() {
      const data = localStorage.getItem('ssms_stages');
      return data ? JSON.parse(data) : INITIAL_PROJECT_STAGES;
    },
    saveStages: function(stages) {
      localStorage.setItem('ssms_stages', JSON.stringify(stages));
    },
    getDocs: function() {
      const data = localStorage.getItem('ssms_docs');
      return data ? JSON.parse(data) : INITIAL_DOCUMENTS;
    },
    saveDocs: function(docs) {
      localStorage.setItem('ssms_docs', JSON.stringify(docs));
    },
    getMessages: function() {
      const data = localStorage.getItem('ssms_messages');
      return data ? JSON.parse(data) : INITIAL_MESSAGES;
    },
    saveMessages: function(msgs) {
      localStorage.setItem('ssms_messages', JSON.stringify(msgs));
    },
    getAppointments: function() {
      const data = localStorage.getItem('ssms_appointments');
      return data ? JSON.parse(data) : INITIAL_APPOINTMENTS;
    },
    saveAppointments: function(apts) {
      localStorage.setItem('ssms_appointments', JSON.stringify(apts));
    },
    init: function() {
      if (!localStorage.getItem('ssms_users')) {
        this.saveUsers(INITIAL_USERS);
      }
      if (!localStorage.getItem('ssms_stages')) {
        this.saveStages(INITIAL_PROJECT_STAGES);
      }
      if (!localStorage.getItem('ssms_docs')) {
        this.saveDocs(INITIAL_DOCUMENTS);
      }
      if (!localStorage.getItem('ssms_messages')) {
        this.saveMessages(INITIAL_MESSAGES);
      }
      if (!localStorage.getItem('ssms_appointments')) {
        this.saveAppointments(INITIAL_APPOINTMENTS);
      }
    }
  };

  // Initialize data on load
  window.SSMSData.init();
})();
