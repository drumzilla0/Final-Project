# SSMS Backend - API Reference

## Base URL

```
http://localhost:5000
```

## Authentication

All protected endpoints require an Authorization header with a valid JWT token:

```
Authorization: Bearer <token>
```

Obtain a token by logging in via `/api/auth/login`.

---

## REST API Endpoints

### 1. Authentication Endpoints

#### Login
**POST** `/api/auth/login`

Login with email and password to obtain JWT token.

**Request Body:**
```json
{
  "email": "std2026@univ.edu",
  "password": "student123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "requirePasswordChange": false,
  "user": {
    "id": 3,
    "email": "std2026@univ.edu",
    "name": "John Student",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid credentials. User not found."
}
```

---

#### Change Password
**POST** `/api/auth/change-password`

Change password for authenticated user. If using default password, you'll be redirected to force password change.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "newPassword": "newsecure123",
  "confirmPassword": "newsecure123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Passwords do not match."
}
```

---

#### Get Current User
**GET** `/api/auth/me`

Retrieve information about the currently authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "id": 3,
    "email": "std2026@univ.edu",
    "name": "John Student",
    "role": "student"
  }
}
```

---

#### Logout
**POST** `/api/auth/logout`

Logout current user. Note: Token revocation is handled client-side.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 2. Projects Endpoints

#### List Projects
**GET** `/api/projects`

Get all projects (filtered by user role and optional status filter).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by project status (proposed, approved, in-progress, submitted, completed, rejected)

**Example:**
```
GET /api/projects?status=in-progress
```

**Response (Success - 200):**
```json
{
  "success": true,
  "projects": [
    {
      "id": 1,
      "student_id": 3,
      "supervisor_id": 2,
      "title": "AI Research Project",
      "description": "Exploring machine learning algorithms",
      "status": "in-progress",
      "start_date": "2026-01-15",
      "end_date": "2026-06-15",
      "student_name": "John Student",
      "student_email": "std2026@univ.edu",
      "supervisor_name": "Prof. Supervisor",
      "supervisor_email": "sup2026@univ.edu",
      "created_at": "2026-01-15T10:30:00.000Z",
      "updated_at": "2026-02-20T14:45:00.000Z"
    }
  ]
}
```

---

#### Get Project by ID
**GET** `/api/projects/:id`

Get detailed information about a specific project.

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
GET /api/projects/1
```

**Response (Success - 200):**
```json
{
  "success": true,
  "project": {
    "id": 1,
    "student_id": 3,
    "supervisor_id": 2,
    "title": "AI Research Project",
    "description": "Exploring machine learning algorithms",
    "status": "in-progress",
    "start_date": "2026-01-15",
    "end_date": "2026-06-15",
    "student_name": "John Student",
    "supervisor_name": "Prof. Supervisor",
    "created_at": "2026-01-15T10:30:00.000Z",
    "updated_at": "2026-02-20T14:45:00.000Z"
  }
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Project not found"
}
```

---

#### Create Project
**POST** `/api/projects`

Create a new project. Requires student and supervisor IDs.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentId": 3,
  "supervisorId": 2,
  "title": "New Research Project",
  "description": "Project description here",
  "startDate": "2026-03-01",
  "endDate": "2026-08-01"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "projectId": 5
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Required fields missing: studentId, supervisorId, title"
}
```

---

#### Update Project
**PUT** `/api/projects/:id`

Update project details. Only specified fields are updated.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Project Title",
  "status": "submitted",
  "description": "Updated description"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Project updated successfully"
}
```

---

#### Delete Project
**DELETE** `/api/projects/:id`

Delete a project. Only administrators can delete projects.

**Headers:**
```
Authorization: Bearer <token>
```

**Required Role:** `admin`

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "message": "Access denied. Required role: admin"
}
```

---

## GraphQL API

### Endpoint

```
POST /graphql
```

### Authentication

Include Authorization header:
```
Authorization: Bearer <token>
```

### Common Queries

#### Get Current User
```graphql
query {
  me {
    id
    name
    email
    role
  }
}
```

#### Get All Projects
```graphql
query {
  projects {
    id
    title
    status
    student {
      name
      studentId
    }
    supervisor {
      name
      employeeId
    }
  }
}
```

#### Get Project Details
```graphql
query {
  project(id: 1) {
    id
    title
    description
    status
    student {
      name
      department
    }
    supervisor {
      name
      specialization
    }
    milestones {
      id
      title
      dueDate
      status
    }
    documents {
      id
      title
      version
      isApproved
    }
  }
}
```

#### Get Messages
```graphql
query {
  messages(unreadOnly: true) {
    id
    subject
    body
    sender {
      name
      email
    }
    isRead
    createdAt
  }
}
```

### Common Mutations

#### Create Project
```graphql
mutation {
  createProject(
    studentId: 3
    supervisorId: 2
    title: "New Project"
    description: "Project details"
  ) {
    id
    title
    status
  }
}
```

#### Update Project Status
```graphql
mutation {
  updateProject(
    id: 1
    status: submitted
    description: "Updated description"
  ) {
    id
    title
    status
    updatedAt
  }
}
```

#### Send Message
```graphql
mutation {
  sendMessage(
    recipientId: 2
    projectId: 1
    subject: "Project Update"
    body: "Here's my progress update..."
  ) {
    id
    subject
    createdAt
  }
}
```

#### Add Progress Entry
```graphql
mutation {
  addProgressEntry(
    projectId: 1
    title: "Week 5 Progress"
    progressPercentage: 45
    category: "development"
  ) {
    id
    progressPercentage
    entryDate
  }
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Codes

| Status | Message | Cause |
|--------|---------|-------|
| 400 | Bad Request | Missing or invalid parameters |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Header**: `X-RateLimit-*` headers included in responses

---

## Data Types & Enums

### UserRole
- `admin` - System administrator
- `supervisor` - Faculty supervisor
- `student` - Student user

### ProjectStatus
- `proposed` - Initial submission
- `approved` - Approved by supervisor
- `in-progress` - Currently active
- `submitted` - Final submission
- `completed` - Project complete
- `rejected` - Rejected

### MilestoneStatus
- `pending` - Not started
- `in_progress` - Currently working
- `completed` - Finished
- `overdue` - Past due date

### AppointmentStatus
- `proposed` - Awaiting response
- `accepted` - Accepted
- `rejected` - Declined
- `completed` - Meeting held
- `cancelled` - Cancelled

---

## Response Headers

Standard response headers:

```
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Examples

### Complete Login & Fetch Projects Flow

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "std2026@univ.edu",
    "password": "student123"
  }' | jq -r '.token')

# 2. Get Projects using token
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 3. Create Project
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 3,
    "supervisorId": 2,
    "title": "New Project",
    "description": "Description"
  }'
```

---

**API Version:** 1.0.0  
**Last Updated:** 2026-07-25
