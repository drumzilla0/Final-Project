# SSMS Backend API

Student & Supervisor Project Management System (SSMS) - Backend Server

## Project Overview

The SSMS Backend provides a comprehensive REST API and GraphQL endpoint for managing student projects, supervisor interactions, document versioning, messaging, appointments, and progress tracking.

## Features

- JWT Authentication & Authorization
- Role-based Access Control (Admin, Supervisor, Student)
- Project Management (CRUD operations)
- Document Vault with versioning
- Real-time Messaging System
- Appointment Scheduling
- Progress Tracking
- GraphQL API
- REST API
- MySQL Database Integration
- Error Handling & Logging

## Tech Stack

- **Runtime**: Node.js 14+
- **Framework**: Express.js 4.x
- **API**: REST + GraphQL (Apollo Server)
- **Database**: MySQL 8.0+
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, Helmet, CORS

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js     # MySQL connection pool
│   │   └── initDatabase.js # Database schema initialization
│   ├── controllers/        # Business logic
│   │   ├── authController.js
│   │   └── projectController.js
│   ├── routes/             # API routes
│   │   ├── authRoutes.js
│   │   └── projectRoutes.js
│   ├── middleware/         # Custom middleware
│   │   └── auth.js        # JWT authentication
│   ├── graphql/            # GraphQL setup
│   │   ├── schema/        # Type definitions
│   │   └── resolvers/     # Resolver functions
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
├── package.json
├── .env.example
└── README.md
```

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ssms_db
PORT=5000
JWT_SECRET=your_secret_key
```

### 3. Initialize Database

Create the database and tables:

```bash
node src/config/initDatabase.js
```

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000`

## API Documentation

### REST API Endpoints

#### Authentication
- `POST /api/auth/login` - Login with email & password
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

#### Projects
- `GET /api/projects` - Get all projects (role-based)
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project (admin only)

### GraphQL Endpoint

`POST /graphql`

#### Example Query

```graphql
query {
  me {
    id
    name
    email
    role
  }
  projects {
    id
    title
    status
    student {
      name
    }
  }
}
```

#### Example Mutation

```graphql
mutation {
  createProject(
    studentId: 1
    supervisorId: 1
    title: "AI Research Project"
    description: "Research on machine learning"
  ) {
    id
    title
    status
  }
}
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Login Example

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@univ.edu","password":"password123"}'
```

Response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "student@univ.edu",
    "name": "John Doe",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Database Schema

### Core Tables

- **users** - User accounts with roles
- **students** - Student-specific information
- **supervisors** - Supervisor-specific information
- **projects** - Student projects
- **milestones** - Project milestones
- **documents** - Project documents/vault
- **messages** - Direct messaging
- **appointments** - Meeting scheduling
- **progress_tracker** - Progress entries
- **notifications** - System notifications

## Role-Based Access Control

| Role | Permissions |
|------|-----------|
| **Admin** | Full system access, user management, all CRUD operations |
| **Supervisor** | Manage assigned students, approve documents, view projects |
| **Student** | Submit projects, upload documents, message supervisor, view appointments |

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- CORS protection
- Rate limiting on API routes
- Helmet.js for HTTP headers
- SQL prepared statements (prevent SQL injection)

## Development

### Running Tests

```bash
npm test
```

### Code Structure

- Each module (controller/route/middleware) has a single responsibility
- Error handling is centralized
- Database queries use connection pooling
- All timestamps are ISO 8601 format

## Deployment

### Prerequisites

- Node.js 14+ installed
- MySQL 8.0+ database
- Environment variables configured

### Steps

1. Install dependencies: `npm install`
2. Initialize database: `node src/config/initDatabase.js`
3. Start server: `npm start`

> If Node is not available in your PATH on Windows, use `npm run start-win` instead.

## Contributing

Follow these guidelines:
- Use meaningful commit messages
- Keep functions focused and testable
- Document complex logic
- Use consistent naming conventions

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, contact the development team or submit an issue.

---

**SSMS Backend v1.0.0**
Built with ❤️ by Antigravity Coding
