# Multi-Role Authentication System

A full-stack authentication system with role-based access control (RBAC) supporting 4 business roles: Admin, Sales, Finance, and Operations.

## Features

- 🔐 Secure JWT-based authentication with refresh tokens
- 👥 Role-based access control (RBAC)
- 🎨 Modern UI with Next.js 14+ and Tailwind CSS
- 🔧 RESTful API with Express.js and TypeScript
- 🗄️ PostgreSQL database with Prisma ORM
- 🚀 Redis for session management and caching
- 📧 Email verification and password reset
- 🛡️ Security best practices (helmet, CORS, rate limiting)
- 📊 Audit logging for compliance
- 🔔 Real-time notifications

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- React Hook Form + Zod (Form Validation)
- Axios (HTTP Client)

### Backend
- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- JWT Authentication
- Winston (Logging)

## Business Roles

1. **Admin**
   - Full system access
   - User management
   - System settings
   - All reports access

2. **Sales**
   - Customer management
   - Order management
   - Sales reports

3. **Finance**
   - Invoice management
   - Transaction viewing
   - Financial reports

4. **Operations**
   - Inventory management
   - Supplier management
   - Order fulfillment

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm 10+

## Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd multirole-auth-system
   ```

2. Run the setup script:
   ```bash
   ./scripts/setup.sh
   ```

3. Start the development servers:
   ```bash
   npm run dev
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@localhost | admin123 |
| Sales | sales@localhost | sales123 |
| Finance | finance@localhost | finance123 |
| Operations | operations@localhost | operations123 |

⚠️ **Important**: Change these passwords immediately after first login!

## Project Structure

```
.
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
├── shared/            # Shared types and constants
├── scripts/           # Development and deployment scripts
├── docs/              # Documentation
└── docker-compose.yml # Docker services configuration
```

## Development

### Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### Database Commands

```bash
# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Reset the database
npm run db:reset
```

### Docker Commands

```bash
# Start services
npm run docker:up

# Stop services
npm run docker:down

# View logs
npm run docker:logs
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change password

### Admin
- `GET /api/admin/users` - List all users (Admin only)
- `GET /api/admin/users/:id` - Get user details (Admin only)
- `PUT /api/admin/users/:id` - Update user (Admin only)
- `DELETE /api/admin/users/:id` - Delete user (Admin only)

## Security

- Passwords are hashed using bcrypt
- JWT tokens for stateless authentication
- Refresh tokens stored in httpOnly cookies
- Rate limiting on authentication endpoints
- Input validation and sanitization
- SQL injection protection via Prisma
- XSS protection headers
- CORS properly configured

## License

MIT