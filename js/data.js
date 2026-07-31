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
      name: 'Prof. Ebenezer Antwi (HOD)',
      email: 'hod@univ.edu',
      passwordHash: 'Adm!2026#H0D',
      isDefaultPassword: true,
      role: 'admin',
      department: 'Computer Science & Software Engineering',
      phone: '+233 24 111 2233'
    },
    {
      id: 'usr_sup_1',
      name: 'Asare (Prof. Marcus Asare)',
      staffId: '002sid',
      email: 'Asare002sid@ktu.edu.gh',
      passwordHash: 'Supervisor2026',
      isDefaultPassword: true,
      role: 'supervisor',
      department: 'Computer Science',
      maxStudents: 7,
      specialization: 'Artificial Intelligence (AI) & Web Application Development',
      specialties: ['Artificial Intelligence (AI)', 'Web Application Development']
    },
    {
      id: 'usr_sup_2',
      name: 'Morgan (Dr. Cynthia Morgan)',
      staffId: '003sid',
      email: 'Morgan003sid@ktu.edu.gh',
      passwordHash: 'Supervisor2026',
      isDefaultPassword: true,
      role: 'supervisor',
      department: 'Computer Science',
      maxStudents: 7,
      specialization: 'Information & Communication Technology (ICT) & Networking',
      specialties: ['Information & Communication Technology (ICT)', 'Networking']
    },
    {
      id: 'usr_sup_3',
      name: 'Mensah (Dr. Kwame Mensah)',
      staffId: '004sid',
      email: 'Mensah004sid@ktu.edu.gh',
      passwordHash: 'Supervisor2026',
      isDefaultPassword: true,
      role: 'supervisor',
      department: 'Computer Science',
      maxStudents: 7,
      specialization: 'Networking & Web Application Development',
      specialties: ['Networking', 'Web Application Development']
    },
    {
      id: 'usr_sup_4',
      name: 'Owusu (Prof. Abigail Owusu)',
      staffId: '005sid',
      email: 'Owusu005sid@ktu.edu.gh',
      passwordHash: 'Supervisor2026',
      isDefaultPassword: true,
      role: 'supervisor',
      department: 'Computer Science',
      maxStudents: 7,
      specialization: 'Artificial Intelligence (AI) & Information & Communication Technology (ICT)',
      specialties: ['Artificial Intelligence (AI)', 'Information & Communication Technology (ICT)']
    },
    // --- 15 ENROLLED STUDENTS ---
    {
      id: 'usr_std_1',
      name: 'Elijah Akorli',
      email: 'Elijahbt0420230001d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: 'BT04/2023/0001D',
      program: 'Computer Science',
      level: 'BTech',
      duration: '4 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'AI-Powered Student Project Progress & Document Vault System'
    },
    {
      id: 'usr_std_2',
      name: 'Alexander Pierce',
      email: 'Alexanderbt0420230002d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: 'BT04/2023/0002D',
      program: 'Computer Science',
      level: 'BTech',
      duration: '4 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'Design & Implementation of Mobile Thesis Tracker'
    },
    {
      id: 'usr_std_3',
      name: 'Kwame Mensah',
      email: 'Kwame0420230001d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: '04/2023/0001D',
      program: 'Networking',
      level: 'HND',
      duration: '3 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'Design & Deployment of Secure Enterprise Software-Defined Network'
    },
    {
      id: 'usr_std_4',
      name: 'Grace Amoah',
      email: 'Gracebt0420230003d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: 'BT04/2023/0003D',
      program: 'Artificial Intelligence',
      level: 'BTech',
      duration: '4 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'Predictive Analytics Model for Academic Performance Tracking'
    },
    {
      id: 'usr_std_5',
      name: 'Emmanuel Osei',
      email: 'Emmanuel0420230002d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: '04/2023/0002D',
      program: 'Information & Communication Technology',
      level: 'HND',
      duration: '3 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'Cloud-Based Inventory Management System for Campus Stores'
    },
    {
      id: 'usr_std_6',
      name: 'Fatima Bello',
      email: 'Fatima0420230003d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: '04/2023/0003D',
      program: 'Computer Science',
      level: 'HND',
      duration: '3 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'Automated Timetabling & Venue Scheduling System'
    },
    {
      id: 'usr_std_7',
      name: 'Daniel Kpakpo',
      email: 'Daniel0420230004d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: '04/2023/0004D',
      program: 'Networking',
      level: 'HND',
      duration: '3 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'Campus Wi-Fi Infrastructure Optimization & Traffic Analysis'
    },
    {
      id: 'usr_std_8',
      name: 'Sandra Boateng',
      email: 'Sandra0420230005d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: '04/2023/0005D',
      program: 'Artificial Intelligence',
      level: 'HND',
      duration: '3 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'Computer Vision Based Student Attendance Verification'
    },
    {
      id: 'usr_std_9',
      name: 'Kofi Annan',
      email: 'Kofibt0420230004d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: 'BT04/2023/0004D',
      program: 'Information & Communication Technology',
      level: 'BTech',
      duration: '4 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'Smart Campus IoT Environmental Quality Monitor'
    },
    {
      id: 'usr_std_10',
      name: 'Priscilla Appiah',
      email: 'Priscilla0420230006d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: '04/2023/0006D',
      program: 'Computer Science',
      level: 'HND',
      duration: '3 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'E-Library Resource Portal & Digital Reservation System'
    },
    {
      id: 'usr_std_11',
      name: 'Bernard Darko',
      email: 'Bernard0420230007d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: '04/2023/0007D',
      program: 'Networking',
      level: 'HND',
      duration: '3 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'Vulnerability Assessment & Network Intrusion Detection System'
    },
    {
      id: 'usr_std_12',
      name: 'Abena Serwaa',
      email: 'Abenabt0420230005d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: 'BT04/2023/0005D',
      program: 'Artificial Intelligence',
      level: 'BTech',
      duration: '4 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'Natural Language Processing Chatbot for Campus Enquiries'
    },
    {
      id: 'usr_std_13',
      name: 'Samuel Yeboah',
      email: 'Samuel0420230008d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: '04/2023/0008D',
      program: 'Information & Communication Technology',
      level: 'HND',
      duration: '3 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'Mobile Payment Integration Gateway for KTU Fees Collection'
    },
    {
      id: 'usr_std_14',
      name: 'Rita Donkor',
      email: 'Rita0420230009d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: '04/2023/0009D',
      program: 'Computer Science',
      level: 'HND',
      duration: '3 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'Cross-Platform Student Transcript Request System'
    },
    {
      id: 'usr_std_15',
      name: 'Gideon Quaye',
      email: 'Gideon0420230010d@ktu.edu.gh',
      passwordHash: 'Student2026',
      isDefaultPassword: true,
      role: 'student',
      matricNo: '04/2023/0010D',
      program: 'Artificial Intelligence',
      level: 'HND',
      duration: '3 Years',
      supervisorId: null,
      groupName: null,
      projectTitle: 'Machine Learning Model for Automated Exam Grading'
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
      let users = data ? JSON.parse(data) : INITIAL_USERS;
      let modified = false;

      // Ensure all seed initial users exist in the active users array and have sync'd names, matric numbers & emails
      INITIAL_USERS.forEach(initUser => {
        const existingIdx = users.findIndex(u => u.id === initUser.id);
        if (existingIdx === -1) {
          users.push(initUser);
          modified = true;
        } else {
          if (users[existingIdx].name !== initUser.name || users[existingIdx].matricNo !== initUser.matricNo || users[existingIdx].email !== initUser.email) {
            users[existingIdx].name = initUser.name;
            users[existingIdx].matricNo = initUser.matricNo;
            users[existingIdx].email = initUser.email;
            modified = true;
          }
        }
      });

      users.forEach(u => {
        if (u.role === 'student') {
          if (!u.program) { u.program = 'Computer Science'; modified = true; }
          if (!u.level) { u.level = 'BTech'; modified = true; }
          if (!u.duration) { u.duration = u.level === 'HND' ? '3 Years' : '4 Years'; modified = true; }
          if (u.isDefaultPassword && u.passwordHash !== 'Student2026') {
            u.passwordHash = 'Student2026';
            modified = true;
          }
        } else if (u.role === 'supervisor') {
          if (u.isDefaultPassword && u.passwordHash !== 'Supervisor2026') {
            u.passwordHash = 'Supervisor2026';
            modified = true;
          }
        }
      });

      if (modified || !data) {
        localStorage.setItem('ssms_users', JSON.stringify(users));
      }
      return users;
    },
    resetDefaultUsers: function() {
      localStorage.setItem('ssms_users', JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    },
    saveUsers: function(users) {
      localStorage.setItem('ssms_users', JSON.stringify(users));
    },
    deleteUser: function(userId) {
      let users = this.getUsers();
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) return false;
      if (userToDelete.role === 'admin') return false;

      users = users.filter(u => u.id !== userId);

      if (userToDelete.role === 'supervisor') {
        users.forEach(u => {
          if (u.supervisorId === userId) {
            u.supervisorId = null;
            u.groupName = null;
          }
        });
      }

      this.saveUsers(users);

      let requests = this.getResetRequests();
      if (requests.some(r => r.userId === userId)) {
        requests = requests.filter(r => r.userId !== userId);
        this.saveResetRequests(requests);
      }

      return true;
    },
    getResetRequests: function() {
      const data = localStorage.getItem('ssms_reset_requests');
      return data ? JSON.parse(data) : [];
    },
    saveResetRequests: function(requests) {
      localStorage.setItem('ssms_reset_requests', JSON.stringify(requests));
    },
    submitResetRequest: function(user, reason) {
      const requests = this.getResetRequests();
      const existing = requests.find(r => r.userId === user.id && r.status === 'pending');
      if (existing) return existing;

      const now = new Date();
      const timeStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newReq = {
        id: 'req_' + Date.now(),
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        userEmail: user.email,
        matricNo: user.matricNo || user.staffId || user.email,
        program: user.program || user.department || 'General',
        reason: reason || 'Forgotten Password / Account Locked',
        timestamp: timeStr,
        status: 'pending'
      };

      requests.push(newReq);
      this.saveResetRequests(requests);

      // Send a notification message to HOD/Admin in messages table
      const messages = this.getMessages();
      messages.push({
        id: 'msg_req_' + Date.now(),
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        recipientId: 'usr_admin',
        text: `PASSWORD RESET REQUEST: Account locked after failed password attempts. ID/Matric: ${user.matricNo || user.staffId || user.email}. Please reset password to default (${user.role === 'supervisor' ? 'Supervisor2026' : 'Student2026'}).`,
        timestamp: timeStr
      });
      this.saveMessages(messages);

      return newReq;
    },
    generateUniqueStudentStages: function(studentId) {
      // Deterministic pseudo-random seed based on studentId string
      let seed = 0;
      for (let i = 0; i < studentId.length; i++) {
        seed = (seed << 5) - seed + studentId.charCodeAt(i);
        seed |= 0;
      }
      seed = Math.abs(seed);

      // Varied approved stages count based on seed (1 to 5 approved stages)
      const approvedCount = (seed % 5) + 1;
      const hasInProgress = (seed % 2) === 0;

      const baseStages = [
        { stageId: 1, name: 'Proposal & Title Defense', description: 'Submission and defense of project topic proposal, problem formulation, and supervisor matching.' },
        { stageId: 2, name: 'Chapter 1: Introduction', description: 'Background of study, statement of problem, objectives, scope, and significance.' },
        { stageId: 3, name: 'Chapter 2: Literature Review', description: 'Comprehensive review of related work, theoretical framework, and gap analysis.' },
        { stageId: 4, name: 'Chapter 3: System Methodology', description: 'System design, architectural diagrams, data flow modeling, and database schema.' },
        { stageId: 5, name: 'Chapter 4: Implementation & Results', description: 'Coding implementation, algorithm evaluation, testing results, and system screenshots.' },
        { stageId: 6, name: 'Chapter 5: Conclusion & Recommendation', description: 'Summary of findings, limitations, future work recommendations, and references.' },
        { stageId: 7, name: 'Final Defense & Binding', description: 'Final oral defense presentation, corrections verification, and hard-cover binding.' }
      ];

      return baseStages.map((stage, idx) => {
        let status = 'pending';
        let comment = 'Awaiting stage submission.';
        let date = null;

        if (idx < approvedCount) {
          status = 'approved';
          comment = `Stage ${stage.stageId} approved by supervisor. Requirements satisfied.`;
          const day = 10 + (idx * 4);
          date = `2026-06-${day < 10 ? '0' + day : day}`;
        } else if (idx === approvedCount && hasInProgress) {
          status = (seed % 3 === 0) ? 'revision' : 'in-progress';
          comment = status === 'revision' ? 'Revision required. Please incorporate supervisor feedback.' : 'Draft under review by supervisor.';
          date = '2026-07-20';
        }

        return {
          ...stage,
          status: status,
          supervisorComment: comment,
          dateUpdated: date
        };
      });
    },

    getStudentStages: function(studentId) {
      if (!studentId) {
        const currentUser = window.SSMSAuth ? window.SSMSAuth.getCurrentUser() : null;
        if (currentUser && currentUser.role === 'student') {
          studentId = currentUser.id;
        } else {
          studentId = 'usr_std_1';
        }
      }

      const allData = localStorage.getItem('ssms_student_stages');
      let studentStagesMap = allData ? JSON.parse(allData) : null;

      if (!studentStagesMap) {
        studentStagesMap = this.initStudentStagesMap();
      }

      if (!studentStagesMap[studentId]) {
        studentStagesMap[studentId] = this.generateUniqueStudentStages(studentId);
        localStorage.setItem('ssms_student_stages', JSON.stringify(studentStagesMap));
      }

      return studentStagesMap[studentId];
    },

    saveStudentStages: function(studentId, stages) {
      if (!studentId) return;
      const allData = localStorage.getItem('ssms_student_stages');
      let studentStagesMap = allData ? JSON.parse(allData) : this.initStudentStagesMap();
      studentStagesMap[studentId] = stages;
      localStorage.setItem('ssms_student_stages', JSON.stringify(studentStagesMap));
    },

    initStudentStagesMap: function() {
      const users = this.getUsers ? this.getUsers() : [];
      const students = users.filter(u => u.role === 'student');
      const map = {};

      students.forEach(std => {
        map[std.id] = this.generateUniqueStudentStages(std.id);
      });

      // Default fallback student IDs
      ['usr_std_0', 'usr_std_1', 'usr_std_2', 'usr_std_3', 'usr_std_4', 'usr_std_5'].forEach(id => {
        if (!map[id]) {
          map[id] = this.generateUniqueStudentStages(id);
        }
      });

      localStorage.setItem('ssms_student_stages', JSON.stringify(map));
      return map;
    },

    getStages: function() {
      const currentUser = window.SSMSAuth ? window.SSMSAuth.getCurrentUser() : null;
      const studentId = (currentUser && currentUser.role === 'student') ? currentUser.id : 'usr_std_0';
      return this.getStudentStages(studentId);
    },
    saveStages: function(stages) {
      const currentUser = window.SSMSAuth ? window.SSMSAuth.getCurrentUser() : null;
      const studentId = (currentUser && currentUser.role === 'student') ? currentUser.id : 'usr_std_0';
      this.saveStudentStages(studentId, stages);
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
    getEvaluations: function() {
      const data = localStorage.getItem('ssms_evaluations');
      const initial = [
        {
          id: 'eval_1',
          studentId: 'usr_std_0',
          studentName: 'Elijah Akorli',
          stageId: 1,
          stageName: 'Proposal & Title Defense',
          workloadPercent: 60,
          effortScore: 9,
          grade: 'A',
          attendance: 'Punctual & Active',
          remarks: 'Spearheaded system architecture and backend REST contract design for the team.',
          date: '2026-06-15'
        },
        {
          id: 'eval_2',
          studentId: 'usr_std_1',
          studentName: 'Alexander Pierce',
          stageId: 1,
          stageName: 'Proposal & Title Defense',
          workloadPercent: 40,
          effortScore: 8,
          grade: 'B+',
          attendance: 'Punctual & Active',
          remarks: 'Managed literature gathering and front-end interface mockups efficiently.',
          date: '2026-06-15'
        }
      ];
      return data ? JSON.parse(data) : initial;
    },
    getStudentEvaluations: function(studentId) {
      const all = this.getEvaluations();
      return all.filter(e => e.studentId === studentId);
    },
    saveEvaluations: function(evals) {
      localStorage.setItem('ssms_evaluations', JSON.stringify(evals));
    },
    saveStudentEvaluation: function(evalObj) {
      const evals = this.getEvaluations();
      const existingIdx = evals.findIndex(e => e.studentId === evalObj.studentId && e.stageId === evalObj.stageId);
      if (existingIdx !== -1) {
        evals[existingIdx] = Object.assign({}, evals[existingIdx], evalObj);
      } else {
        evals.unshift(evalObj);
      }
      this.saveEvaluations(evals);
    },
    init: function() {
      if (!localStorage.getItem('ssms_users')) {
        this.saveUsers(INITIAL_USERS);
      }
      if (!localStorage.getItem('ssms_student_stages')) {
        this.initStudentStagesMap();
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
      if (!localStorage.getItem('ssms_evaluations')) {
        this.saveEvaluations(this.getEvaluations());
      }
    }
  };

  // Initialize data on load
  window.SSMSData.init();
})();
