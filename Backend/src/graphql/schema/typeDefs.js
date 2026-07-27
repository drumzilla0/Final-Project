/* ==========================================================================
   IDENTIFICATION: BACKEND - GRAPHQL SCHEMA
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   DESCRIPTION: GraphQL type definitions for all entities
   ========================================================================== */

const { gql } = require('apollo-server-express');

const typeDefs = gql`
  enum UserRole {
    admin
    supervisor
    student
  }

  enum ProjectStatus {
    proposed
    approved
    in_progress
    submitted
    completed
    rejected
  }

  enum MilestoneStatus {
    pending
    in_progress
    completed
    overdue
  }

  enum AppointmentStatus {
    proposed
    accepted
    rejected
    completed
    cancelled
  }

  type User {
    id: Int!
    email: String!
    name: String!
    role: UserRole!
    isActive: Boolean!
    isDefaultPassword: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Student {
    id: Int!
    userId: Int!
    studentId: String!
    department: String
    enrollmentYear: Int
    cgpa: Float
    user: User!
    projects: [Project!]!
  }

  type Supervisor {
    id: Int!
    userId: Int!
    employeeId: String!
    department: String
    specialization: String
    officeLocation: String
    user: User!
    projects: [Project!]!
  }

  type Project {
    id: Int!
    studentId: Int!
    supervisorId: Int!
    title: String!
    description: String
    status: ProjectStatus!
    startDate: String
    endDate: String
    student: Student!
    supervisor: Supervisor!
    milestones: [Milestone!]!
    documents: [Document!]!
    messages: [Message!]!
    appointments: [Appointment!]!
    progressEntries: [ProgressTracker!]!
    createdAt: String!
    updatedAt: String!
  }

  type Milestone {
    id: Int!
    projectId: Int!
    title: String!
    description: String
    dueDate: String!
    completionDate: String
    status: MilestoneStatus!
    project: Project!
    createdAt: String!
    updatedAt: String!
  }

  type Document {
    id: Int!
    projectId: Int!
    uploadedById: Int!
    title: String!
    description: String
    filePath: String!
    fileType: String
    fileSize: Int
    version: Int!
    isApproved: Boolean!
    approvedBy: Int
    approvedAt: String
    uploadedBy: User!
    project: Project!
    approver: User
    createdAt: String!
    updatedAt: String!
  }

  type Message {
    id: Int!
    senderId: Int!
    recipientId: Int!
    projectId: Int
    subject: String
    body: String!
    isRead: Boolean!
    readAt: String
    sender: User!
    recipient: User!
    project: Project
    createdAt: String!
  }

  type Appointment {
    id: Int!
    projectId: Int!
    initiatorId: Int!
    scheduledWithId: Int!
    appointmentDate: String!
    durationMinutes: Int!
    location: String
    agenda: String
    status: AppointmentStatus!
    notes: String
    project: Project!
    initiator: User!
    scheduledWith: User!
    createdAt: String!
    updatedAt: String!
  }

  type ProgressTracker {
    id: Int!
    projectId: Int!
    createdById: Int!
    title: String!
    description: String
    progressPercentage: Int!
    category: String
    entryDate: String!
    createdBy: User!
    project: Project!
    createdAt: String!
    updatedAt: String!
  }

  type Notification {
    id: Int!
    userId: Int!
    title: String!
    message: String
    type: String
    relatedEntity: String
    relatedId: Int
    isRead: Boolean!
    user: User!
    createdAt: String!
  }

  type AuthPayload {
    success: Boolean!
    message: String!
    user: User
    token: String
    requirePasswordChange: Boolean
  }

  type Query {
    # Auth
    me: User!
    login(email: String!, password: String!): AuthPayload!

    # Projects
    projects(status: ProjectStatus): [Project!]!
    project(id: Int!): Project

    # Users
    student(id: Int!): Student
    supervisor(id: Int!): Supervisor
    users(role: UserRole): [User!]!

    # Messages
    messages(unreadOnly: Boolean): [Message!]!
    message(id: Int!): Message

    # Appointments
    appointments(status: AppointmentStatus): [Appointment!]!
    appointment(id: Int!): Appointment

    # Documents
    documents(projectId: Int!): [Document!]!
    document(id: Int!): Document

    # Progress
    progressEntries(projectId: Int!): [ProgressTracker!]!

    # Notifications
    notifications(unreadOnly: Boolean): [Notification!]!
  }

  type Mutation {
    # Auth
    changePassword(newPassword: String!, confirmPassword: String!): AuthPayload!

    # Projects
    createProject(studentId: Int!, supervisorId: Int!, title: String!, description: String, startDate: String, endDate: String): Project!
    updateProject(id: Int!, title: String, description: String, status: ProjectStatus, endDate: String): Project!
    deleteProject(id: Int!): Boolean!

    # Milestones
    createMilestone(projectId: Int!, title: String!, dueDate: String!): Milestone!
    updateMilestone(id: Int!, status: MilestoneStatus, completionDate: String): Milestone!
    deleteMilestone(id: Int!): Boolean!

    # Documents
    uploadDocument(projectId: Int!, title: String!, filePath: String!): Document!
    approveDocument(id: Int!): Document!
    deleteDocument(id: Int!): Boolean!

    # Messages
    sendMessage(recipientId: Int!, projectId: Int, subject: String, body: String!): Message!
    markMessageAsRead(id: Int!): Message!
    deleteMessage(id: Int!): Boolean!

    # Appointments
    createAppointment(projectId: Int!, scheduledWithId: Int!, appointmentDate: String!, agenda: String): Appointment!
    updateAppointmentStatus(id: Int!, status: AppointmentStatus!): Appointment!
    deleteAppointment(id: Int!): Boolean!

    # Progress
    addProgressEntry(projectId: Int!, title: String!, progressPercentage: Int!, category: String): ProgressTracker!
    updateProgressEntry(id: Int!, progressPercentage: Int, description: String): ProgressTracker!
    deleteProgressEntry(id: Int!): Boolean!
  }
`;

module.exports = typeDefs;
