/* ==========================================================================
   IDENTIFICATION: BACKEND - SERVER SETUP
   PROJECT: STUDENT & SUPERVISOR PROJECT MANAGEMENT SYSTEM (SSMS)
   AUTHOR: ANTIGRAVITY / DEEPMIND AGENTIC CODING
   DESCRIPTION: Express server initialization, middleware setup, REST & GraphQL APIs
   ========================================================================== */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { ApolloServer } = require('apollo-server-express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const rootDir = path.join(__dirname, '../../');

// Import Routes & GraphQL
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const typeDefs = require('./graphql/schema/typeDefs');
const resolvers = require('./graphql/resolvers/resolvers');

// Middleware
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Serve frontend static assets from project root
app.use(express.static(rootDir));

// ============================================================================
// APOLLO SERVER (GRAPHQL) SETUP
// ============================================================================

async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Get token from headers
      const token = req.headers.authorization?.split(' ')[1];
      
      let user = null;
      if (token) {
        try {
          user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
          console.error('GraphQL Auth Error:', error.message);
        }
      }

      return { user };
    },
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        extensions: {
          code: error.extensions?.code
        }
      };
    }
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  console.log(`✓ GraphQL API running at /graphql`);
}

// ============================================================================
// REST API ROUTES
// ============================================================================

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'SSMS Backend API',
    version: '1.0.0',
    endpoints: {
      authentication: {
        'POST /api/auth/login': 'Login with email & password',
        'POST /api/auth/change-password': 'Change password (auth required)',
        'GET /api/auth/me': 'Get current user (auth required)',
        'POST /api/auth/logout': 'Logout (auth required)'
      },
      projects: {
        'GET /api/projects': 'Get all projects (auth required)',
        'GET /api/projects/:id': 'Get project by ID (auth required)',
        'POST /api/projects': 'Create project (auth required)',
        'PUT /api/projects/:id': 'Update project (auth required)',
        'DELETE /api/projects/:id': 'Delete project (admin only)'
      },
      graphql: 'GraphQL API at /graphql'
    }
  });
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// Project Routes
app.use('/api/projects', projectRoutes);

// Serve SPA for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error : {}
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function main() {
  try {
    // Initialize GraphQL Server
    await startApolloServer();

    // Start Express Server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║   SSMS Backend API Server Running                             ║
║   ─────────────────────────────────────────────────────────── ║
║   REST API:  http://localhost:${PORT}/api                         ║
║   GraphQL:   http://localhost:${PORT}/graphql                     ║
║   Health:    http://localhost:${PORT}/health                      ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(45)} ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

main();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✓ Server shutdown gracefully');
  process.exit(0);
});
