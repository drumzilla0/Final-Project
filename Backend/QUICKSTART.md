# SSMS Backend - Quick Start Guide

## Prerequisites

- **Node.js** v14 or higher
- **MySQL** v8.0 or higher
- **npm** or **yarn** package manager

## Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Database Connection

The `.env` file is already pre-configured with default values for local development:
- Database: `ssms_db`
- User: `root`
- Password: `root`
- Host: `localhost`
- Port: `3306`

If your MySQL credentials differ, edit `.env` accordingly.

### Step 3: Initialize Database

Create the database schema and tables:

```bash
npm run init-db
```

Expected output:
```
✓ Database schema initialized successfully
```

### Step 4: Seed Demo Data

Insert demo users (Admin, Supervisor, Student):

```bash
npm run seed
```

Expected output:
```
✓ ADMIN: hod@univ.edu (password: admin123)
✓ SUPERVISOR: sup2026@univ.edu (password: super123)
✓ STUDENT: std2026@univ.edu (password: student123)
✓ Database seeding completed successfully
```

### Step 5: Start Development Server

```bash
npm run dev
```

Expected output:
```
╔════════════════════════════════════════════════════════════════╗
║   SSMS Backend API Server Running                             ║
║   ─────────────────────────────────────────────────────────── ║
║   REST API:  http://localhost:5000/api                        ║
║   GraphQL:   http://localhost:5000/graphql                    ║
║   Health:    http://localhost:5000/health                     ║
║   Environment: development                                    ║
╚════════════════════════════════════════════════════════════════╝
```

## Testing the API

### Test 1: Health Check

```bash
curl http://localhost:5000/health
```

### Test 2: Login (REST API)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "std2026@univ.edu",
    "password": "student123"
  }'
```

Response:
```json
{
  "success": true,
  "user": {
    "id": 3,
    "email": "std2026@univ.edu",
    "name": "John Student",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test 3: GraphQL Query

Visit `http://localhost:5000/graphql` in your browser and run:

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

(Note: GraphQL Playground will require you to set the Authorization header first)

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/login` | Login with credentials |
| `POST` | `/api/auth/change-password` | Change password |
| `GET` | `/api/auth/me` | Get current user info |
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create new project |
| `GET` | `/api/projects/:id` | Get project details |
| `PUT` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project |

GraphQL endpoint: `POST /graphql`

## One-Command Setup

Run everything in one command:

```bash
npm run setup
```

This will:
1. Install all dependencies
2. Create database schema
3. Seed demo data
4. Ready for development

## Default Demo Credentials

After running `npm run seed`, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin/HOD | `hod@univ.edu` | `admin123` |
| Supervisor | `sup2026@univ.edu` | `super123` |
| Student | `std2026@univ.edu` | `student123` |

## Database Reset

To reset the database (WARNING: deletes all data):

```bash
# Delete all data and recreate schema
npm run init-db
npm run seed
```

## Troubleshooting

### Error: "Cannot find module"
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Error: "Database connection failed"
- Verify MySQL is running: `mysql -u root -p`
- Check `.env` database credentials
- Ensure database `ssms_db` exists or run `npm run init-db`

### Error: "EADDRINUSE: Port 5000 is already in use"
```bash
# Change PORT in .env or kill the process
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

### Error: "JWT token expired"
- Tokens expire after 7 days (see `JWT_EXPIRES_IN` in `.env`)
- Login again to get a new token

## Development Tips

- **Hot Reload**: `npm run dev` uses nodemon for automatic restart on file changes
- **Database Queries**: All queries use prepared statements to prevent SQL injection
- **Error Logs**: Check console for detailed error messages in development mode
- **GraphQL IDE**: Visit `http://localhost:5000/graphql` for interactive GraphQL explorer

## Next Steps

1. Connect frontend to backend API
2. Test authentication flow
3. Create sample projects via API
4. Implement additional features as needed
5. Deploy to production with proper environment variables

## Support

For issues, check:
- Console logs for error messages
- `.env` configuration
- MySQL connection status
- Network requests in browser DevTools

---

**Ready to build!** 🚀
