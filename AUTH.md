# Localhost Multi-Role Authentication System Plan

## Complete File Tree and Architecture

```
multirole-auth-system/
├── .env                              # Root environment variables for development
├── .env.example                      # Template for environment variables
├── package.json                      # Root package.json for monorepo scripts
├── docker-compose.yml                # All services (postgres, redis) configuration
├── .gitignore                        # Git ignore patterns
├── README.md                         # Project documentation
├── CLAUDE.md                         # Task Master context
├── AUTH.md                          # This authentication plan
│
├── frontend/                         # Next.js 14+ Application (Port 3000)
│   ├── package.json                 # Frontend dependencies
│   ├── tsconfig.json               # TypeScript configuration
│   ├── next.config.js              # Next.js configuration
│   ├── .env.local                  # Frontend environment variables
│   ├── middleware.ts               # Auth middleware for route protection
│   │
│   ├── app/                        # App Router (Next.js 14+)
│   │   ├── layout.tsx             # Root layout with providers
│   │   ├── page.tsx               # Home page (redirects based on auth)
│   │   ├── globals.css            # Global styles with Tailwind
│   │   │
│   │   ├── (auth)/                # Auth routes group
│   │   │   ├── layout.tsx         # Auth layout (no sidebar)
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # Login page component
│   │   │   ├── register/
│   │   │   │   └── page.tsx       # Registration page
│   │   │   └── forgot-password/
│   │   │       └── page.tsx       # Password reset request
│   │   │
│   │   ├── (dashboard)/           # Protected routes group
│   │   │   ├── layout.tsx         # Dashboard layout with sidebar
│   │   │   ├── admin/             # Admin-only routes
│   │   │   │   ├── page.tsx       # Admin dashboard
│   │   │   │   ├── users/         # User management
│   │   │   │   │   ├── page.tsx   # Users list
│   │   │   │   │   └── [id]/      # User detail
│   │   │   │   │       └── page.tsx
│   │   │   │   └── settings/      # System settings
│   │   │   │       └── page.tsx
│   │   │   ├── sales/             # Sales team routes
│   │   │   │   ├── page.tsx       # Sales dashboard
│   │   │   │   ├── customers/     # Customer management
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── orders/        # Sales orders
│   │   │   │   │   └── page.tsx
│   │   │   │   └── reports/       # Sales analytics
│   │   │   │       └── page.tsx
│   │   │   ├── finance/           # Finance team routes
│   │   │   │   ├── page.tsx       # Finance dashboard
│   │   │   │   ├── invoices/      # Invoice management
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── transactions/  # Transaction history
│   │   │   │   │   └── page.tsx
│   │   │   │   └── reports/       # Financial reports
│   │   │   │       └── page.tsx
│   │   │   └── operations/        # Operations team routes
│   │   │       ├── page.tsx       # Operations dashboard
│   │   │       ├── inventory/     # Inventory management
│   │   │       │   └── page.tsx
│   │   │       ├── suppliers/     # Supplier management
│   │   │       │   └── page.tsx
│   │   │       └── fulfillment/   # Order fulfillment
│   │   │           └── page.tsx
│   │   │
│   │   └── api/                   # API routes (if needed for NextAuth)
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts    # NextAuth configuration
│   │
│   ├── components/                # Reusable UI Components
│   │   ├── ui/                   # Base UI components
│   │   │   ├── Button.tsx        # Button component
│   │   │   ├── Input.tsx         # Input component
│   │   │   ├── Card.tsx          # Card component
│   │   │   ├── Modal.tsx         # Modal component
│   │   │   ├── Toast.tsx         # Toast notifications
│   │   │   └── Spinner.tsx       # Loading spinner
│   │   │
│   │   ├── auth/                 # Auth-specific components
│   │   │   ├── LoginForm.tsx     # Login form with validation
│   │   │   ├── RegisterForm.tsx  # Registration form
│   │   │   ├── AuthGuard.tsx     # Route protection wrapper
│   │   │   └── RoleGuard.tsx     # Role-based access wrapper
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   ├── Header.tsx        # App header with user menu
│   │   │   ├── Sidebar.tsx       # Dashboard sidebar
│   │   │   ├── Footer.tsx        # App footer
│   │   │   └── UserMenu.tsx      # User dropdown menu
│   │   │
│   │   └── dashboard/            # Dashboard components
│   │       ├── StatsCard.tsx     # Statistics display
│   │       ├── UserTable.tsx     # User management table
│   │       └── ActivityFeed.tsx  # Recent activity
│   │
│   ├── lib/                      # Utilities and configurations
│   │   ├── api/                  # API layer
│   │   │   ├── client.ts         # Axios instance configuration
│   │   │   ├── auth.ts           # Auth API calls
│   │   │   ├── users.ts          # User API calls
│   │   │   └── interceptors.ts   # Request/response interceptors
│   │   │
│   │   ├── utils/                # Utility functions
│   │   │   ├── validation.ts     # Form validation schemas (Zod)
│   │   │   ├── formatters.ts     # Data formatters
│   │   │   ├── constants.ts      # App constants
│   │   │   └── errors.ts         # Error handling utilities
│   │   │
│   │   └── types/                # TypeScript types
│   │       ├── auth.ts           # Auth-related types
│   │       ├── user.ts           # User types
│   │       └── api.ts            # API response types
│   │
│   ├── stores/                   # Zustand state management
│   │   ├── authStore.ts          # Authentication state
│   │   ├── userStore.ts          # User data state
│   │   └── uiStore.ts            # UI state (modals, toasts)
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Auth hook
│   │   ├── useUser.ts            # Current user hook
│   │   ├── useRole.ts            # Role checking hook
│   │   └── useApi.ts             # API call hook
│   │
│   ├── styles/                   # Additional styles
│   │   └── components/           # Component-specific styles
│   │
│   └── public/                   # Static assets
│       ├── images/               # Images
│       └── icons/                # Icon files
│
├── backend/                      # Node.js + Express API (Port 5000)
│   ├── package.json             # Backend dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   ├── .env                    # Backend environment variables
│   ├── nodemon.json            # Nodemon configuration
│   │
│   ├── prisma/                 # Prisma ORM
│   │   ├── schema.prisma       # Database schema
│   │   ├── seed.ts            # Database seeding
│   │   └── migrations/         # Database migrations
│   │       └── [timestamp]_init/
│   │           └── migration.sql
│   │
│   ├── src/                    # Source code
│   │   ├── index.ts           # Entry point
│   │   ├── app.ts             # Express app configuration
│   │   │
│   │   ├── config/            # Configuration files
│   │   │   ├── database.ts    # Database connection
│   │   │   ├── redis.ts       # Redis connection
│   │   │   ├── cors.ts        # CORS configuration
│   │   │   └── env.ts         # Environment validation
│   │   │
│   │   ├── routes/            # API routes
│   │   │   ├── index.ts       # Route aggregator
│   │   │   ├── auth.routes.ts # Auth endpoints
│   │   │   ├── user.routes.ts # User CRUD endpoints
│   │   │   ├── admin.routes.ts # Admin-only endpoints
│   │   │   └── health.routes.ts # Health check
│   │   │
│   │   ├── controllers/       # Request handlers
│   │   │   ├── auth.controller.ts # Auth logic
│   │   │   ├── user.controller.ts # User operations
│   │   │   └── admin.controller.ts # Admin operations
│   │   │
│   │   ├── services/          # Business logic
│   │   │   ├── auth.service.ts # Authentication service
│   │   │   ├── token.service.ts # JWT management
│   │   │   ├── user.service.ts # User operations
│   │   │   ├── email.service.ts # Email notifications
│   │   │   └── cache.service.ts # Redis caching
│   │   │
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.middleware.ts # JWT verification
│   │   │   ├── role.middleware.ts # Role checking
│   │   │   ├── validation.middleware.ts # Request validation
│   │   │   ├── error.middleware.ts # Error handling
│   │   │   └── rateLimiter.middleware.ts # Rate limiting
│   │   │
│   │   ├── models/            # Data models
│   │   │   ├── user.model.ts  # User model extensions
│   │   │   └── token.model.ts # Token model
│   │   │
│   │   ├── validators/        # Request validators
│   │   │   ├── auth.validator.ts # Auth validation schemas
│   │   │   └── user.validator.ts # User validation schemas
│   │   │
│   │   ├── utils/             # Utilities
│   │   │   ├── logger.ts      # Winston logger
│   │   │   ├── errors.ts      # Custom error classes
│   │   │   ├── helpers.ts     # Helper functions
│   │   │   └── constants.ts   # Backend constants
│   │   │
│   │   └── types/             # TypeScript types
│   │       ├── express.d.ts   # Express type extensions
│   │       ├── environment.d.ts # Environment types
│   │       └── models.ts      # Model types
│   │
│   └── tests/                 # Backend tests
│       ├── unit/              # Unit tests
│       ├── integration/       # Integration tests
│       └── fixtures/          # Test data
│
├── shared/                    # Shared code between frontend/backend
│   ├── types/                # Shared TypeScript types
│   │   ├── auth.ts          # Auth types
│   │   ├── user.ts          # User types
│   │   └── api.ts           # API types
│   └── constants/           # Shared constants
│       └── roles.ts         # Role definitions
│
├── scripts/                  # Development scripts
│   ├── setup.sh             # Initial setup script
│   ├── reset-db.sh          # Database reset
│   ├── seed-db.sh           # Database seeding
│   └── dev.sh               # Start dev environment
│
├── docs/                    # Documentation
│   ├── api/                # API documentation
│   │   ├── auth.md        # Auth endpoints
│   │   └── users.md       # User endpoints
│   ├── setup.md           # Setup guide
│   └── deployment.md      # Deployment guide
│
└── .github/                # GitHub configuration
    └── workflows/         # GitHub Actions
        ├── ci.yml         # Continuous Integration
        └── test.yml       # Test automation
```

## File Purpose and Connections

### Core Configuration Files

#### `/docker-compose.yml`
- **Purpose**: Defines all local services (PostgreSQL, Redis)
- **Connects to**: 
  - `backend/src/config/database.ts` (PostgreSQL connection)
  - `backend/src/config/redis.ts` (Redis connection)
- **Used by**: Development environment setup

#### `/package.json` (Root)
- **Purpose**: Monorepo scripts and dev dependencies
- **Contains**: Concurrent script to run frontend/backend
- **Connects to**: `frontend/package.json`, `backend/package.json`

### Frontend Files

#### `/frontend/middleware.ts`
- **Purpose**: Next.js middleware for route protection
- **Connects to**: 
  - `frontend/stores/authStore.ts` (checks auth state)
  - `frontend/lib/utils/constants.ts` (protected routes)
- **Protects**: All routes under `(dashboard)`

#### `/frontend/app/layout.tsx`
- **Purpose**: Root layout with providers
- **Wraps**: Entire application
- **Provides**: 
  - Zustand store context
  - Toast notifications
  - Global error boundary

#### `/frontend/stores/authStore.ts`
- **Purpose**: Global auth state management
- **Connects to**:
  - `frontend/lib/api/auth.ts` (API calls)
  - `frontend/hooks/useAuth.ts` (consumed by hook)
- **Stores**: User data, tokens, auth status

#### `/frontend/components/auth/AuthGuard.tsx`
- **Purpose**: Wrapper component for protected routes
- **Uses**: `authStore` to check authentication
- **Redirects**: Unauthenticated users to login

#### `/frontend/lib/api/client.ts`
- **Purpose**: Axios instance with interceptors
- **Connects to**: 
  - `authStore` (gets tokens)
  - `backend` API endpoints
- **Handles**: Token refresh, error responses

### Backend Files

#### `/backend/src/index.ts`
- **Purpose**: Server entry point
- **Initializes**: 
  - Express app from `app.ts`
  - Database connection
  - Redis connection
- **Starts**: Server on port 5000

#### `/backend/src/middleware/auth.middleware.ts`
- **Purpose**: JWT verification middleware
- **Uses**: `token.service.ts` for validation
- **Attaches**: User data to request object
- **Protects**: API routes

#### `/backend/src/services/token.service.ts`
- **Purpose**: JWT token management
- **Connects to**:
  - `cache.service.ts` (stores refresh tokens)
  - `user.service.ts` (gets user data)
- **Handles**: Token generation, validation, refresh

#### `/backend/prisma/schema.prisma`
- **Purpose**: Database schema definition
- **Defines**: User, Role, Session models
- **Generates**: Prisma Client types
- **Used by**: All database operations

### Shared Files

#### `/shared/types/user.ts`
- **Purpose**: Shared user type definitions
- **Used by**: Both frontend and backend
- **Ensures**: Type consistency across stack

## Data Flow and Dependencies

### Authentication Flow

1. **Login Request**
   - `LoginForm.tsx` → `authStore.ts` → `auth.ts` (API) → Backend
   - Backend: `auth.routes.ts` → `auth.controller.ts` → `auth.service.ts`
   - Response: JWT tokens → stored in `authStore` and cookies

2. **Protected Route Access**
   - `middleware.ts` checks `authStore`
   - `AuthGuard.tsx` wraps protected components
   - `RoleGuard.tsx` checks user role permissions

3. **API Request with Auth**
   - `client.ts` interceptor adds token from `authStore`
   - Backend `auth.middleware.ts` validates token
   - `role.middleware.ts` checks permissions

4. **Token Refresh**
   - `client.ts` detects 401 response
   - Calls refresh endpoint with refresh token
   - Updates `authStore` with new tokens

### State Management Flow

1. **Frontend State**
   - Zustand stores maintain client state
   - Components use hooks to access stores
   - API calls update store state

2. **Backend State**
   - PostgreSQL stores persistent data
   - Redis caches sessions and temporary data
   - Prisma ORM manages database operations

### Development Workflow

1. **Initial Setup**
   - Run `scripts/setup.sh`
   - Docker Compose starts services
   - Prisma migrations create database schema
   - Seed script populates test data

2. **Development**
   - `npm run dev` starts both frontend and backend
   - Hot reload on file changes
   - Logs visible in terminal

3. **Testing**
   - Frontend tests use React Testing Library
   - Backend tests use Jest and Supertest
   - Integration tests verify full flow

This architecture ensures:
- Clear separation of concerns
- Type safety across the stack
- Scalable folder structure
- Easy local development
- Production-ready code patterns

## Architecture Overview (Localhost Development)

- Frontend: Next.js 14+ on http://localhost:3000
- Backend: Node.js with Express.js on http://localhost:5000
- Database: PostgreSQL via Docker on localhost:5432
- Cache: Redis via Docker on localhost:6379
- Authentication: JWT with refresh tokens
- State Management: Zustand with devtools
- Development: Docker Compose for services
- Testing: Local test environment
- Version Control: Git with GitHub

## Development Philosophy

This plan is designed for **localhost-first development** with the ability to deploy later. All services run locally via Docker, making it easy to develop without cloud dependencies while maintaining production-grade code quality.

## Project Structure

```
/
├── .github/                    # GitHub configs
│   ├── workflows/             # GitHub Actions for CI
│   └── ISSUE_TEMPLATE/        # Issue templates
├── docker/                    # Docker configurations
│   ├── docker-compose.yml     # All services setup
│   ├── postgres/             # PostgreSQL init scripts
│   └── redis/                # Redis config
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # Reusable components
│   ├── lib/                # Utilities & API clients
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   ├── styles/             # Global styles
│   ├── tests/              # Frontend tests
│   └── middleware.ts       # Auth middleware
├── backend/                # Node.js API
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Helper functions
│   │   └── config/       # Configuration
│   ├── tests/            # Backend tests
│   └── scripts/          # DB migrations
├── shared/               # Shared types/constants
├── docs/                 # Documentation
│   ├── setup.md         # Setup instructions
│   └── api.md           # API documentation
└── scripts/             # Development scripts
    ├── setup.sh         # Initial setup script
    └── reset-db.sh      # Database reset script
```

## Detailed Implementation Plan (10-Level Granular for Localhost)

### 0. Development Environment Setup
#### 0.1 Prerequisites Installation
##### 0.1.1 Core Tools Setup
###### 0.1.1.1 Install Node.js and npm
####### 0.1.1.1.1 Download Node.js LTS (v20+)
######## 0.1.1.1.1.1 Verify installation
######### 0.1.1.1.1.1.1 Run node --version
########## 0.1.1.1.1.1.1.1 Should output v20.x.x or higher
########### 0.1.1.1.1.1.1.1.1 Check npm version
############ 0.1.1.1.1.1.1.1.1.1 Run npm --version
############# 0.1.1.1.1.1.1.1.1.1.1 Should be 10.x.x or higher
############## 0.1.1.1.1.1.1.1.1.1.1.1 Update npm if needed: npm install -g npm@latest

##### 0.1.2 Docker Setup
###### 0.1.2.1 Install Docker Desktop
####### 0.1.2.1.1 Download for your OS
######## 0.1.2.1.1.1 Configure Docker settings
######### 0.1.2.1.1.1.1 Allocate resources
########## 0.1.2.1.1.1.1.1 Set memory to 4GB minimum
########### 0.1.2.1.1.1.1.1.1 Set CPU to 2 cores minimum
############ 0.1.2.1.1.1.1.1.1.1 Enable file sharing for project directory
############# 0.1.2.1.1.1.1.1.1.1.1 Add /Users/[username]/Documents to sharing
############## 0.1.2.1.1.1.1.1.1.1.1.1 Restart Docker Desktop to apply

#### 0.2 Project Initialization
##### 0.2.1 Create Project Structure
###### 0.2.1.1 Initialize Git repository
####### 0.2.1.1.1 Run git init in project root
######## 0.2.1.1.1.1 Create .gitignore file
######### 0.2.1.1.1.1.1 Add Node.js patterns
########## 0.2.1.1.1.1.1.1 Add node_modules/
########### 0.2.1.1.1.1.1.1.1 Add .env files
############ 0.2.1.1.1.1.1.1.1.1 Add .DS_Store for macOS
############# 0.2.1.1.1.1.1.1.1.1.1 Add dist/ and build/
############## 0.2.1.1.1.1.1.1.1.1.1.1 Add *.log files

### 1. Initialize Projects
#### 1.1 Frontend Setup
##### 1.1.1 Next.js Installation
###### 1.1.1.1 Create Next.js app
####### 1.1.1.1.1 Run creation command
######## 1.1.1.1.1.1 Execute in terminal
######### 1.1.1.1.1.1.1 cd to project root
########## 1.1.1.1.1.1.1.1 Run: npx create-next-app@latest frontend
########### 1.1.1.1.1.1.1.1.1 Select TypeScript: Yes
############ 1.1.1.1.1.1.1.1.1.1 Select ESLint: Yes
############# 1.1.1.1.1.1.1.1.1.1.1 Select Tailwind CSS: Yes
############## 1.1.1.1.1.1.1.1.1.1.1.1 Select App Router: Yes

####### 1.1.1.2 Configure development environment
######## 1.1.1.2.1 Update package.json scripts
######### 1.1.1.2.1.1 Modify dev script
########## 1.1.1.2.1.1.1 Set custom port
########### 1.1.1.2.1.1.1.1 Change to: "dev": "next dev -p 3000"
############ 1.1.1.2.1.1.1.1.1 Add dev:debug script
############# 1.1.1.2.1.1.1.1.1.1 Add: "dev:debug": "NODE_OPTIONS='--inspect' next dev"
############## 1.1.1.2.1.1.1.1.1.1.1 Enables Chrome DevTools debugging

##### 1.1.2 Essential Dependencies
###### 1.1.2.1 Install core packages
####### 1.1.2.1.1 Navigate to frontend directory
######## 1.1.2.1.1.1 Install dependencies
######### 1.1.2.1.1.1.1 Run npm install command
########## 1.1.2.1.1.1.1.1 Install axios zustand zustand/middleware
########### 1.1.2.1.1.1.1.1.1 Add react-hook-form
############ 1.1.2.1.1.1.1.1.1.1 Add @hookform/resolvers zod
############# 1.1.2.1.1.1.1.1.1.1.1 Add js-cookie for token storage
############## 1.1.2.1.1.1.1.1.1.1.1.1 Add @types/js-cookie as dev dependency

##### 1.1.3 Environment Configuration
###### 1.1.3.1 Create environment files
####### 1.1.3.1.1 Create .env.local
######## 1.1.3.1.1.1 Add environment variables
######### 1.1.3.1.1.1.1 Set API URL
########## 1.1.3.1.1.1.1.1 Add: NEXT_PUBLIC_API_URL=http://localhost:5000
########### 1.1.3.1.1.1.1.1.1 Add: NEXT_PUBLIC_APP_NAME=AuthApp
############ 1.1.3.1.1.1.1.1.1.1 Add: NEXT_PUBLIC_ENV=development
############# 1.1.3.1.1.1.1.1.1.1.1 Create .env.example
############## 1.1.3.1.1.1.1.1.1.1.1.1 Copy without sensitive values

#### 1.2 Backend Setup
##### 1.2.1 Node.js Project Initialization
###### 1.2.1.1 Create backend directory
####### 1.2.1.1.1 Initialize npm project
######## 1.2.1.1.1.1 Run npm init
######### 1.2.1.1.1.1.1 Set package details
########## 1.2.1.1.1.1.1.1 Name: backend
########### 1.2.1.1.1.1.1.1.1 Entry: dist/index.js
############ 1.2.1.1.1.1.1.1.1.1 Remove type: "module" (using CommonJS)
############# 1.2.1.1.1.1.1.1.1.1.1 Set license: MIT
############## 1.2.1.1.1.1.1.1.1.1.1.1 Add engines field for Node version

##### 1.2.2 Backend Dependencies
###### 1.2.2.1 Install Express and TypeScript
####### 1.2.2.1.1 Install production dependencies
######## 1.2.2.1.1.1 Run installation command
######### 1.2.2.1.1.1.1 Core packages
########## 1.2.2.1.1.1.1.1 npm install express cors helmet
########### 1.2.2.1.1.1.1.1.1 Add body parsing: express
############ 1.2.2.1.1.1.1.1.1.1 Add dotenv for env vars
############# 1.2.2.1.1.1.1.1.1.1.1 Add bcryptjs jsonwebtoken
############## 1.2.2.1.1.1.1.1.1.1.1.1 Add express-rate-limit

####### 1.2.2.2 Install development dependencies
######## 1.2.2.2.1 TypeScript setup
######### 1.2.2.2.1.1 Install TypeScript packages
########## 1.2.2.2.1.1.1 Run npm install -D command
########### 1.2.2.2.1.1.1.1 Install typescript @types/node
############ 1.2.2.2.1.1.1.1.1 Add @types/express @types/cors
############# 1.2.2.2.1.1.1.1.1.1 Add nodemon ts-node
############## 1.2.2.2.1.1.1.1.1.1.1 Add @types/bcryptjs @types/jsonwebtoken

##### 1.2.3 TypeScript Configuration
###### 1.2.3.1 Create tsconfig.json
####### 1.2.3.1.1 Configure compiler options
######## 1.2.3.1.1.1 Set basic options
######### 1.2.3.1.1.1.1 Target and module
########## 1.2.3.1.1.1.1.1 "target": "ES2022"
########### 1.2.3.1.1.1.1.1.1 "module": "commonjs"
############ 1.2.3.1.1.1.1.1.1.1 "outDir": "./dist"
############# 1.2.3.1.1.1.1.1.1.1.1 "rootDir": "./src"
############## 1.2.3.1.1.1.1.1.1.1.1.1 "strict": true

### 2. Docker Setup for Local Services
#### 2.1 Docker Compose Configuration
##### 2.1.1 Create docker-compose.yml
###### 2.1.1.1 Define services
####### 2.1.1.1.1 PostgreSQL service
######## 2.1.1.1.1.1 Configure postgres container
######### 2.1.1.1.1.1.1 Set image version
########## 2.1.1.1.1.1.1.1 Use postgres:15-alpine
########### 2.1.1.1.1.1.1.1.1 Set container name: auth_postgres
############ 2.1.1.1.1.1.1.1.1.1 Map port 5432:5432
############# 2.1.1.1.1.1.1.1.1.1.1 Set POSTGRES_DB=authdb
############## 2.1.1.1.1.1.1.1.1.1.1.1 Set POSTGRES_PASSWORD=localpass

####### 2.1.1.2 Redis service
######## 2.1.1.2.1 Configure redis container
######### 2.1.1.2.1.1 Set image version
########## 2.1.1.2.1.1.1 Use redis:7-alpine
########### 2.1.1.2.1.1.1.1 Set container name: auth_redis
############ 2.1.1.2.1.1.1.1.1 Map port 6379:6379
############# 2.1.1.2.1.1.1.1.1.1 Add command: redis-server --appendonly yes
############## 2.1.1.2.1.1.1.1.1.1.1 Mount volume for persistence

#### 2.2 Database Setup
##### 2.2.1 Prisma Configuration
###### 2.2.1.1 Install Prisma
####### 2.2.1.1.1 Add to backend
######## 2.2.1.1.1.1 Install packages
######### 2.2.1.1.1.1.1 Run in backend directory
########## 2.2.1.1.1.1.1.1 npm install prisma --save-dev
########### 2.2.1.1.1.1.1.1.1 npm install @prisma/client
############ 2.2.1.1.1.1.1.1.1.1 npx prisma init
############# 2.2.1.1.1.1.1.1.1.1.1 Creates prisma/schema.prisma
############## 2.2.1.1.1.1.1.1.1.1.1.1 Creates .env with DATABASE_URL

##### 2.2.2 Schema Design
###### 2.2.2.1 Create User model
####### 2.2.2.1.1 Define in schema.prisma
######## 2.2.2.1.1.1 Add User model
######### 2.2.2.1.1.1.1 Define fields
########## 2.2.2.1.1.1.1.1 id String @id @default(uuid())
########### 2.2.2.1.1.1.1.1.1 email String @unique
############ 2.2.2.1.1.1.1.1.1.1 password String
############# 2.2.2.1.1.1.1.1.1.1.1 role Role @relation
############## 2.2.2.1.1.1.1.1.1.1.1.1 createdAt DateTime @default(now())

### 3. Authentication Implementation
#### 3.1 Backend Auth Service
##### 3.1.1 JWT Service
###### 3.1.1.1 Create token service
####### 3.1.1.1.1 Create src/services/token.service.ts
######## 3.1.1.1.1.1 Implement token generation
######### 3.1.1.1.1.1.1 Create generateTokens function
########## 3.1.1.1.1.1.1.1 Generate access token
########### 3.1.1.1.1.1.1.1.1 Set expiry to 15 minutes
############ 3.1.1.1.1.1.1.1.1.1 Include user id and role
############# 3.1.1.1.1.1.1.1.1.1.1 Sign with JWT_SECRET
############## 3.1.1.1.1.1.1.1.1.1.1.1 Return token string

##### 3.1.2 Auth Controller
###### 3.1.2.1 Create auth routes
####### 3.1.2.1.1 Create src/routes/auth.routes.ts
######## 3.1.2.1.1.1 Implement login endpoint
######### 3.1.2.1.1.1.1 POST /auth/login
########## 3.1.2.1.1.1.1.1 Validate email/password
########### 3.1.2.1.1.1.1.1.1 Check user exists
############ 3.1.2.1.1.1.1.1.1.1 Verify password with bcrypt
############# 3.1.2.1.1.1.1.1.1.1.1 Generate tokens
############## 3.1.2.1.1.1.1.1.1.1.1.1 Return tokens and user data

#### 3.2 Frontend Auth Integration
##### 3.2.1 Auth Store Setup
###### 3.2.1.1 Create Zustand store
####### 3.2.1.1.1 Create stores/authStore.ts
######## 3.2.1.1.1.1 Define store interface
######### 3.2.1.1.1.1.1 Add state properties
########## 3.2.1.1.1.1.1.1 user: User | null
########### 3.2.1.1.1.1.1.1.1 isAuthenticated: boolean
############ 3.2.1.1.1.1.1.1.1.1 isLoading: boolean
############# 3.2.1.1.1.1.1.1.1.1.1 error: string | null
############## 3.2.1.1.1.1.1.1.1.1.1.1 Add login/logout actions

##### 3.2.2 API Client Setup
###### 3.2.2.1 Configure Axios
####### 3.2.2.1.1 Create lib/api/client.ts
######## 3.2.2.1.1.1 Create axios instance
######### 3.2.2.1.1.1.1 Set base configuration
########## 3.2.2.1.1.1.1.1 baseURL from env
########### 3.2.2.1.1.1.1.1.1 timeout: 10000ms
############ 3.2.2.1.1.1.1.1.1.1 withCredentials: true
############# 3.2.2.1.1.1.1.1.1.1.1 Add request interceptor
############## 3.2.2.1.1.1.1.1.1.1.1.1 Attach auth token to headers

### 4. Local Development Workflow
#### 4.1 Development Scripts
##### 4.1.1 Setup Scripts
###### 4.1.1.1 Create setup script
####### 4.1.1.1.1 Create scripts/setup.sh
######## 4.1.1.1.1.1 Add initialization commands
######### 4.1.1.1.1.1.1 Check prerequisites
########## 4.1.1.1.1.1.1.1 Verify Node.js installed
########### 4.1.1.1.1.1.1.1.1 Verify Docker running
############ 4.1.1.1.1.1.1.1.1.1 Install dependencies
############# 4.1.1.1.1.1.1.1.1.1.1 Start Docker services
############## 4.1.1.1.1.1.1.1.1.1.1.1 Run database migrations

##### 4.1.2 Development Commands
###### 4.1.2.1 Create dev command
####### 4.1.2.1.1 Add to root package.json
######## 4.1.2.1.1.1 Create concurrent dev script
######### 4.1.2.1.1.1.1 Install concurrently
########## 4.1.2.1.1.1.1.1 npm install -D concurrently
########### 4.1.2.1.1.1.1.1.1 Add dev script
############ 4.1.2.1.1.1.1.1.1.1 "dev": "concurrently \"npm:dev:*\""
############# 4.1.2.1.1.1.1.1.1.1.1 "dev:frontend": "cd frontend && npm run dev"
############## 4.1.2.1.1.1.1.1.1.1.1.1 "dev:backend": "cd backend && npm run dev"

#### 4.2 Testing Setup
##### 4.2.1 Jest Configuration
###### 4.2.1.1 Frontend testing
####### 4.2.1.1.1 Install Jest
######## 4.2.1.1.1.1 Add testing dependencies
######### 4.2.1.1.1.1.1 Install packages
########## 4.2.1.1.1.1.1.1 npm install -D jest @types/jest
########### 4.2.1.1.1.1.1.1.1 Add @testing-library/react
############ 4.2.1.1.1.1.1.1.1.1 Add @testing-library/jest-dom
############# 4.2.1.1.1.1.1.1.1.1.1 Add jest-environment-jsdom
############## 4.2.1.1.1.1.1.1.1.1.1.1 Create jest.config.js

### 5. UI Components Development
#### 5.1 Authentication Pages
##### 5.1.1 Login Page
###### 5.1.1.1 Create login component
####### 5.1.1.1.1 Create app/login/page.tsx
######## 5.1.1.1.1.1 Build login form
######### 5.1.1.1.1.1.1 Use react-hook-form
########## 5.1.1.1.1.1.1.1 Define form schema with Zod
########### 5.1.1.1.1.1.1.1.1 Add email validation
############ 5.1.1.1.1.1.1.1.1.1 Add password validation
############# 5.1.1.1.1.1.1.1.1.1.1 Style with Tailwind CSS
############## 5.1.1.1.1.1.1.1.1.1.1.1 Add loading states

##### 5.1.2 Dashboard Pages
###### 5.1.2.1 Create role-based dashboards
####### 5.1.2.1.1 Admin dashboard
######## 5.1.2.1.1.1 Create app/admin/page.tsx
######### 5.1.2.1.1.1.1 Add layout component
########## 5.1.2.1.1.1.1.1 Create sidebar navigation
########### 5.1.2.1.1.1.1.1.1 Add user management link
############ 5.1.2.1.1.1.1.1.1.1 Add settings link
############# 5.1.2.1.1.1.1.1.1.1.1 Add logout button
############## 5.1.2.1.1.1.1.1.1.1.1.1 Style with Tailwind classes

### 6. Local Database Management
#### 6.1 Migration System
##### 6.1.1 Prisma Migrations
###### 6.1.1.1 Create initial migration
####### 6.1.1.1.1 Run migration command
######## 6.1.1.1.1.1 Execute prisma migrate
######### 6.1.1.1.1.1.1 npx prisma migrate dev
########## 6.1.1.1.1.1.1.1 Name: initial_schema
########### 6.1.1.1.1.1.1.1.1 Creates migration file
############ 6.1.1.1.1.1.1.1.1.1 Updates database
############# 6.1.1.1.1.1.1.1.1.1.1 Generates Prisma Client
############## 6.1.1.1.1.1.1.1.1.1.1.1 Creates migration history

##### 6.1.2 Seed Data
###### 6.1.2.1 Create seed script
####### 6.1.2.1.1 Create prisma/seed.ts
######## 6.1.2.1.1.1 Add seed data
######### 6.1.2.1.1.1.1 Create roles
########## 6.1.2.1.1.1.1.1 Admin role
########### 6.1.2.1.1.1.1.1.1 User role
############ 6.1.2.1.1.1.1.1.1.1 Moderator role
############# 6.1.2.1.1.1.1.1.1.1.1 Create test users
############## 6.1.2.1.1.1.1.1.1.1.1.1 One for each role

### 7. Local Development Security
#### 7.1 Environment Security
##### 7.1.1 Secrets Management
###### 7.1.1.1 Local environment files
####### 7.1.1.1.1 Create .env files
######## 7.1.1.1.1.1 Backend .env
######### 7.1.1.1.1.1.1 Add variables
########## 7.1.1.1.1.1.1.1 DATABASE_URL=postgresql://user:pass@localhost:5432/authdb
########### 7.1.1.1.1.1.1.1.1 JWT_SECRET=local-dev-secret-change-in-prod
############ 7.1.1.1.1.1.1.1.1.1 REDIS_URL=redis://localhost:6379
############# 7.1.1.1.1.1.1.1.1.1.1 PORT=5000
############## 7.1.1.1.1.1.1.1.1.1.1.1 NODE_ENV=development

##### 7.1.2 CORS Configuration
###### 7.1.2.1 Configure for localhost
####### 7.1.2.1.1 Update CORS settings
######## 7.1.2.1.1.1 Allow localhost origins
######### 7.1.2.1.1.1.1 Set allowed origins
########## 7.1.2.1.1.1.1.1 Add http://localhost:3000
########### 7.1.2.1.1.1.1.1.1 Allow credentials
############ 7.1.2.1.1.1.1.1.1.1 Set methods: GET,POST,PUT,DELETE
############# 7.1.2.1.1.1.1.1.1.1.1 Allow headers: Content-Type, Authorization
############## 7.1.2.1.1.1.1.1.1.1.1.1 Max age: 86400

### 8. Testing in Localhost
#### 8.1 Unit Testing
##### 8.1.1 Component Testing
###### 8.1.1.1 Test auth components
####### 8.1.1.1.1 Create test files
######## 8.1.1.1.1.1 Test login form
######### 8.1.1.1.1.1.1 Create LoginForm.test.tsx
########## 8.1.1.1.1.1.1.1 Test form validation
########### 8.1.1.1.1.1.1.1.1 Test empty submission
############ 8.1.1.1.1.1.1.1.1.1 Test invalid email
############# 8.1.1.1.1.1.1.1.1.1.1 Test successful submission
############## 8.1.1.1.1.1.1.1.1.1.1.1 Mock API calls

##### 8.1.2 API Testing
###### 8.1.2.1 Test endpoints
####### 8.1.2.1.1 Create API tests
######## 8.1.2.1.1.1 Test auth endpoints
######### 8.1.2.1.1.1.1 Test login endpoint
########## 8.1.2.1.1.1.1.1 Valid credentials
########### 8.1.2.1.1.1.1.1.1 Invalid credentials
############ 8.1.2.1.1.1.1.1.1.1 Missing fields
############# 8.1.2.1.1.1.1.1.1.1.1 Rate limiting
############## 8.1.2.1.1.1.1.1.1.1.1.1 Token generation

### 9. Local Performance Optimization
#### 9.1 Development Performance
##### 9.1.1 Hot Reload Optimization
###### 9.1.1.1 Configure fast refresh
####### 9.1.1.1.1 Next.js settings
######## 9.1.1.1.1.1 Enable fast refresh
######### 9.1.1.1.1.1.1 Already enabled by default
########## 9.1.1.1.1.1.1.1 Optimize for speed
########### 9.1.1.1.1.1.1.1.1 Disable source maps in dev
############ 9.1.1.1.1.1.1.1.1.1 Use SWC compiler
############# 9.1.1.1.1.1.1.1.1.1.1 Already default in Next.js 13+
############## 9.1.1.1.1.1.1.1.1.1.1.1 Faster than Babel

##### 9.1.2 Database Performance
###### 9.1.2.1 Local DB optimization
####### 9.1.2.1.1 PostgreSQL tuning
######## 9.1.2.1.1.1 Adjust for development
######### 9.1.2.1.1.1.1 Reduce shared_buffers
########## 9.1.2.1.1.1.1.1 Set to 128MB for local
########### 9.1.2.1.1.1.1.1.1 Enable query logging
############ 9.1.2.1.1.1.1.1.1.1 Log slow queries > 100ms
############# 9.1.2.1.1.1.1.1.1.1.1 Use for optimization
############## 9.1.2.1.1.1.1.1.1.1.1.1 Add EXPLAIN ANALYZE

### 10. Documentation and Debugging
#### 10.1 Local Development Docs
##### 10.1.1 Setup Documentation
###### 10.1.1.1 Create README.md
####### 10.1.1.1.1 Add setup instructions
######## 10.1.1.1.1.1 Prerequisites section
######### 10.1.1.1.1.1.1 List required tools
########## 10.1.1.1.1.1.1.1 Node.js version
########### 10.1.1.1.1.1.1.1.1 Docker Desktop
############ 10.1.1.1.1.1.1.1.1.1 Git
############# 10.1.1.1.1.1.1.1.1.1.1 VS Code (recommended)
############## 10.1.1.1.1.1.1.1.1.1.1.1 Minimum 8GB RAM

##### 10.1.2 Debugging Setup
###### 10.1.2.1 VS Code configuration
####### 10.1.2.1.1 Create launch.json
######## 10.1.2.1.1.1 Add debug configs
######### 10.1.2.1.1.1.1 Frontend debugging
########## 10.1.2.1.1.1.1.1 Chrome debugging
########### 10.1.2.1.1.1.1.1.1 Port 3000
############ 10.1.2.1.1.1.1.1.1.1 Source maps enabled
############# 10.1.2.1.1.1.1.1.1.1.1 Backend debugging
############## 10.1.2.1.1.1.1.1.1.1.1.1 Attach to Node.js process

## Role Definitions and Permissions Matrix

### User Roles

#### 1. Admin Role
- **ID**: `admin`
- **Description**: Full system access with complete control
- **Permissions**:
  - Create, read, update, delete all users
  - Assign/change user roles
  - Access system settings and configurations
  - View all dashboards and reports
  - Manage application settings
  - Access all department data

#### 2. Sales Role
- **ID**: `sales`
- **Description**: Sales team with customer and revenue focus
- **Permissions**:
  - Access sales dashboard
  - View and manage customer data
  - Create and update sales orders
  - View sales reports and analytics
  - Access customer communications
  - View own profile and team data

#### 3. Finance Role
- **ID**: `finance`
- **Description**: Finance team with monetary data access
- **Permissions**:
  - Access finance dashboard
  - View financial reports
  - Manage invoices and payments
  - View all transactions
  - Access accounting data
  - Generate financial statements
  - View sales data (read-only)

#### 4. Operations Role
- **ID**: `operations`
- **Description**: Operations team managing logistics and inventory
- **Permissions**:
  - Access operations dashboard
  - Manage inventory levels
  - View and update order fulfillment
  - Access warehouse data
  - Manage suppliers and vendors
  - View logistics and shipping data
  - View sales orders (read-only)

### Permissions Matrix

| Action                    | Admin | Sales | Finance | Operations |
|--------------------------|-------|-------|---------|------------|
| View own profile         | ✅    | ✅    | ✅      | ✅         |
| Edit own profile         | ✅    | ✅    | ✅      | ✅         |
| Delete own account       | ✅    | ❌    | ❌      | ❌         |
| View all users           | ✅    | ❌    | ❌      | ❌         |
| Create new users         | ✅    | ❌    | ❌      | ❌         |
| Edit other users         | ✅    | ❌    | ❌      | ❌         |
| Delete other users       | ✅    | ❌    | ❌      | ❌         |
| Change user roles        | ✅    | ❌    | ❌      | ❌         |
| Access admin dashboard   | ✅    | ❌    | ❌      | ❌         |
| Access sales dashboard   | ✅    | ✅    | ❌      | ❌         |
| Access finance dashboard | ✅    | ❌    | ✅      | ❌         |
| Access operations dashboard | ✅ | ❌    | ❌      | ✅         |
| Manage customers         | ✅    | ✅    | ❌      | ❌         |
| Create sales orders      | ✅    | ✅    | ❌      | ❌         |
| View sales data          | ✅    | ✅    | ✅      | ✅         |
| Manage invoices          | ✅    | ❌    | ✅      | ❌         |
| View financial reports   | ✅    | ❌    | ✅      | ❌         |
| Manage inventory         | ✅    | ❌    | ❌      | ✅         |
| Manage suppliers         | ✅    | ❌    | ❌      | ✅         |
| View system logs         | ✅    | ❌    | ❌      | ❌         |
| Modify system settings   | ✅    | ❌    | ❌      | ❌         |

## API Endpoints Specification

### Authentication Endpoints

#### POST /api/auth/register
**Description**: Register a new user account
**Access**: Public
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```
**Response**: 201 Created
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### POST /api/auth/login
**Description**: Authenticate user and receive tokens
**Access**: Public
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tokens": {
      "accessToken": "jwt.access.token",
      "refreshToken": "jwt.refresh.token"
    }
  }
}
```

#### POST /api/auth/refresh
**Description**: Refresh access token using refresh token
**Access**: Authenticated
**Request Body**:
```json
{
  "refreshToken": "jwt.refresh.token"
}
```
**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "accessToken": "new.jwt.access.token",
    "refreshToken": "new.jwt.refresh.token"
  }
}
```

#### POST /api/auth/logout
**Description**: Logout user and invalidate tokens
**Access**: Authenticated
**Headers**: `Authorization: Bearer <access_token>`
**Response**: 200 OK
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### User Management Endpoints

#### GET /api/users
**Description**: Get list of all users (paginated)
**Access**: Admin, Moderator
**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10)
- `search` (optional)
- `role` (optional)
**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

#### GET /api/users/:id
**Description**: Get specific user details
**Access**: Admin, Moderator, or Own User
**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/users/:id
**Description**: Update user information
**Access**: Admin or Own User
**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "newemail@example.com"
}
```

#### DELETE /api/users/:id
**Description**: Delete user account
**Access**: Admin or Own User
**Response**: 200 OK

#### PUT /api/users/:id/role
**Description**: Change user role
**Access**: Admin only
**Request Body**:
```json
{
  "role": "moderator"
}
```

### Profile Endpoints

#### GET /api/profile
**Description**: Get current user profile
**Access**: Authenticated
**Response**: 200 OK

#### PUT /api/profile
**Description**: Update current user profile
**Access**: Authenticated
**Request Body**:
```json
{
  "firstName": "Updated",
  "lastName": "Name"
}
```

#### PUT /api/profile/password
**Description**: Change password
**Access**: Authenticated
**Request Body**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  firstName     String
  lastName      String
  role          Role      @relation(fields: [roleId], references: [id])
  roleId        String
  isActive      Boolean   @default(true)
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  
  @@index([email])
  @@index([roleId])
}

model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  permissions Json
  users       User[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([name])
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshToken String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  
  @@index([userId])
  @@index([refreshToken])
}
```

## Implementation Code Examples

### Backend: JWT Token Service
```typescript
// backend/src/services/token.service.ts
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class TokenService {
  private static ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET!;
  private static REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;
  private static ACCESS_TOKEN_EXPIRY = '15m';
  private static REFRESH_TOKEN_EXPIRY = '7d';

  static generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(
      payload,
      this.ACCESS_TOKEN_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      payload,
      this.REFRESH_TOKEN_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as TokenPayload;
  }

  static async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const payload = jwt.verify(token, this.REFRESH_TOKEN_SECRET) as TokenPayload;
      
      // Check if token exists in database
      const session = await prisma.session.findUnique({
        where: { refreshToken: token }
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}
```

### Frontend: Auth Store (Zustand)
```typescript
// frontend/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '@/lib/api/auth';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(email, password);
          const { user, tokens } = response.data;
          
          // Store tokens
          Cookies.set('accessToken', tokens.accessToken, { expires: 15/(24*60) }); // 15 minutes
          Cookies.set('refreshToken', tokens.refreshToken, { expires: 7 }); // 7 days
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Continue with logout even if API call fails
        }
        
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        
        set({
          user: null,
          isAuthenticated: false,
          error: null
        });
      },

      refreshToken: async () => {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await authApi.refresh(refreshToken);
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          Cookies.set('accessToken', accessToken, { expires: 15/(24*60) }); // 15 minutes
          Cookies.set('refreshToken', newRefreshToken, { expires: 7 }); // 7 days
        } catch {
          get().logout();
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);
```

### Middleware: Auth Protection
```typescript
// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const payload = TokenService.verifyAccessToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};
```

### Frontend: Route Protection
```typescript
// frontend/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/admin', '/sales', '/finance', '/operations'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken');

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if route is auth route (login/register)
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth route with token
  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL('/user', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
```

## Environment Variables

### Root .env
```bash
NODE_ENV=development
```

### Frontend .env.local
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Multi-Role Auth System
NEXT_PUBLIC_ENV=development
```

### Backend .env
```bash
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://postgres:localpass@localhost:5432/authdb

# JWT Secrets
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Redis
REDIS_URL=redis://localhost:6379

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: auth_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: localpass
      POSTGRES_DB: authdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: auth_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass ""
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

## Setup Scripts

### Initial Setup Script
```bash
#!/bin/bash
# scripts/setup.sh

echo "🚀 Setting up Multi-Role Authentication System..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }

# Create project structure
mkdir -p frontend backend shared scripts docs

# Initialize root package.json
cat > package.json << EOL
{
  "name": "multirole-auth-system",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \\"npm:dev:*\\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "setup": "./scripts/setup.sh",
    "reset-db": "./scripts/reset-db.sh"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
EOL

# Install root dependencies
npm install

# Setup frontend
echo "📦 Setting up frontend..."
npx create-next-app@latest frontend --typescript --tailwind --app --eslint

# Setup backend
echo "📦 Setting up backend..."
cd backend
npm init -y
npm install express cors helmet dotenv bcryptjs jsonwebtoken express-rate-limit
npm install -D typescript @types/node @types/express @types/cors @types/helmet nodemon ts-node @types/bcryptjs @types/jsonwebtoken prisma @types/express-rate-limit

# Initialize Prisma
npx prisma init

# Start Docker services
echo "🐳 Starting Docker services..."
cd ..
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Run migrations
echo "🗄️ Running database migrations..."
cd backend
npx prisma migrate dev --name init

echo "✅ Setup complete! Run 'npm run dev' to start development."
```

### Database Reset Script
```bash
#!/bin/bash
# scripts/reset-db.sh

echo "🔄 Resetting database..."

# Stop services
docker-compose down

# Remove volumes
docker volume rm multirole-auth-system_postgres_data 2>/dev/null

# Restart services
docker-compose up -d

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
sleep 10

# Run migrations
cd backend
npx prisma migrate reset --force

echo "✅ Database reset complete!"
```

## Security Best Practices

### 1. Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 2. Token Security
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens are invalidated on logout
- Refresh tokens are stored in httpOnly cookies
- Implement token rotation on refresh

### 3. Rate Limiting
- Login endpoint: 5 attempts per 15 minutes
- Registration: 3 attempts per hour
- API endpoints: 100 requests per 15 minutes

### 4. Data Validation
- All inputs are validated and sanitized
- SQL injection prevention via Prisma ORM
- XSS prevention via input sanitization
- CSRF protection via token validation

### 5. HTTPS in Production
- Always use HTTPS in production
- Implement HSTS headers
- Use secure cookies

## Testing Strategy

### Unit Tests
```typescript
// backend/tests/unit/auth.service.test.ts
import { AuthService } from '../../src/services/auth.service';
import { prisma } from '../../src/config/database';

describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      // Test implementation
    });

    it('should throw error for invalid credentials', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests
```typescript
// backend/tests/integration/auth.routes.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('tokens');
    });
  });
});
```

### Frontend Tests
```typescript
// frontend/components/auth/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should display validation errors', async () => {
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });
});
```

## Error Handling

### API Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {}
  }
}
```

### Error Codes
- `AUTH_INVALID_CREDENTIALS` - Invalid login credentials
- `AUTH_TOKEN_EXPIRED` - JWT token has expired
- `AUTH_TOKEN_INVALID` - JWT token is invalid
- `AUTH_UNAUTHORIZED` - User not authenticated
- `AUTH_FORBIDDEN` - User lacks required permissions
- `VALIDATION_ERROR` - Request validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVER_ERROR` - Internal server error

## Deployment Considerations

### Environment-Specific Configurations
1. **Development**: Relaxed CORS, detailed error messages
2. **Staging**: Production-like with debug capabilities
3. **Production**: Strict security, minimal error exposure

### Health Check Endpoints
```typescript
// GET /api/health
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

## Frontend API Implementation

### Auth API Client
```typescript
// frontend/lib/api/auth.ts
import { apiClient } from './client';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest extends LoginRequest {
  firstName: string;
  lastName: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export const authApi = {
  login: (data: LoginRequest) => 
    apiClient.post<LoginResponse>('/auth/login', data),
    
  register: (data: RegisterRequest) => 
    apiClient.post('/auth/register', data),
    
  logout: () => 
    apiClient.post('/auth/logout'),
    
  refresh: (refreshToken: string) => 
    apiClient.post('/auth/refresh', { refreshToken }),
    
  forgotPassword: (email: string) => 
    apiClient.post('/auth/forgot-password', { email }),
    
  resetPassword: (token: string, newPassword: string) => 
    apiClient.post('/auth/reset-password', { token, newPassword })
};
```

### Axios Client Configuration
```typescript
// frontend/lib/api/client.ts
import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/stores/authStore';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await useAuthStore.getState().refreshToken();
        const token = Cookies.get('accessToken');
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

## Backend Implementation Details

### Backend App Configuration
```typescript
// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import routes from './routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = config.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api', limiter);

// Routes
app.use('/api', routes);

// Error handling
app.use(errorMiddleware);

export default app;
```

### Database Configuration
```typescript
// backend/src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export { prisma };
```

### Redis Configuration
```typescript
// backend/src/config/redis.ts
import { createClient } from 'redis';
import { config } from './env';

const redis = createClient({
  url: config.REDIS_URL
});

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('Redis Connected'));

export { redis };
```

### Environment Configuration
```typescript
// backend/src/config/env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  REDIS_URL: z.string(),
  ALLOWED_ORIGINS: z.string(),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100')
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error('Invalid environment variables:', envParse.error.format());
  process.exit(1);
}

export const config = envParse.data;
```

### Backend Entry Point
```typescript
// backend/src/index.ts
import app from './app';
import { config } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';

const PORT = parseInt(config.PORT, 10);

async function startServer() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected');

    // Connect to Redis
    await redis.connect();
    console.log('✅ Redis connected');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

startServer();
```

### Routes Aggregator
```typescript
// backend/src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import salesRoutes from './sales.routes';
import financeRoutes from './finance.routes';
import operationsRoutes from './operations.routes';
import healthRoutes from './health.routes';
import profileRoutes from './profile.routes';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Health check (public)
router.use('/health', healthRoutes);

// Auth routes (public)
router.use('/auth', authRoutes);

// User routes (authenticated)
router.use('/users', authenticate, userRoutes);

// Admin routes (admin only)
router.use('/admin', authenticate, authorize('admin'), adminRoutes);

// Department routes (role-specific)
router.use('/sales', authenticate, authorize('admin', 'sales'), salesRoutes);
router.use('/finance', authenticate, authorize('admin', 'finance'), financeRoutes);
router.use('/operations', authenticate, authorize('admin', 'operations'), operationsRoutes);

// Profile routes (authenticated)
router.use('/profile', authenticate, profileRoutes);

export default router;
```

### Error Middleware
```typescript
// backend/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/env';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorMiddleware = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  // Default error
  let statusCode = 500;
  let code = 'SERVER_ERROR';
  let message = 'Internal server error';
  let details = undefined;

  // Handle known errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = err.errors;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'AUTH_TOKEN_INVALID';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'AUTH_TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log error
  console.error(`Error ${code}:`, err);

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: config.NODE_ENV === 'development' ? details : undefined
    }
  });
};
```

### Auth Routes Implementation
```typescript
// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation.middleware';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string()
      .min(8)
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50)
  })
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string()
  })
});

// Routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', validateRequest(refreshSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);

export default router;
```

### Validation Middleware
```typescript
// backend/src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.errors
          }
        });
      }
      next(error);
    }
  };
};
```

### Prisma Seed Script
```typescript
// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      description: 'Administrator with full access',
      permissions: {
        users: ['create', 'read', 'update', 'delete'],
        roles: ['read', 'update'],
        system: ['read', 'update']
      }
    }
  });

  const salesRole = await prisma.role.create({
    data: {
      name: 'sales',
      description: 'Sales team member with customer and order access',
      permissions: {
        sales: ['create', 'read', 'update', 'delete'],
        customers: ['create', 'read', 'update'],
        orders: ['create', 'read', 'update'],
        reports: ['read:sales']
      }
    }
  });

  const financeRole = await prisma.role.create({
    data: {
      name: 'finance',
      description: 'Finance team member with financial data access',
      permissions: {
        finance: ['create', 'read', 'update'],
        invoices: ['create', 'read', 'update', 'delete'],
        transactions: ['read'],
        reports: ['read:finance'],
        sales: ['read']
      }
    }
  });

  const operationsRole = await prisma.role.create({
    data: {
      name: 'operations',
      description: 'Operations team member managing inventory and fulfillment',
      permissions: {
        operations: ['create', 'read', 'update'],
        inventory: ['create', 'read', 'update', 'delete'],
        suppliers: ['create', 'read', 'update'],
        fulfillment: ['read', 'update'],
        orders: ['read']
      }
    }
  });

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.create({
    data: {
      email: 'admin@localhost',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      roleId: adminRole.id,
      emailVerified: true
    }
  });

  await prisma.user.create({
    data: {
      email: 'sales@localhost',
      password: hashedPassword,
      firstName: 'Sales',
      lastName: 'Manager',
      roleId: salesRole.id,
      emailVerified: true
    }
  });

  await prisma.user.create({
    data: {
      email: 'finance@localhost',
      password: hashedPassword,
      firstName: 'Finance',
      lastName: 'Manager',
      roleId: financeRole.id,
      emailVerified: true
    }
  });

  await prisma.user.create({
    data: {
      email: 'operations@localhost',
      password: hashedPassword,
      firstName: 'Operations',
      lastName: 'Manager',
      roleId: operationsRole.id,
      emailVerified: true
    }
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Package.json Scripts

#### Backend package.json
```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "Multi-role auth system backend",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node prisma/seed.ts",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^6.10.0",
    "helmet": "^7.0.0",
    "jsonwebtoken": "^9.0.2",
    "redis": "^4.6.7",
    "zod": "^3.22.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.2",
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.17",
    "@types/express-rate-limit": "^6.0.0",
    "@types/helmet": "^4.0.0",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/node": "^20.4.5",
    "jest": "^29.6.2",
    "nodemon": "^3.0.1",
    "prisma": "^5.0.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6"
  }
}
```

#### Auth Service Implementation
```typescript
// backend/src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { TokenService } from './token.service';
import { AppError } from '../middleware/error.middleware';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  static async register(data: RegisterData) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new AppError(409, 'USER_EXISTS', 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Get default user role
    const userRole = await prisma.role.findUnique({
      where: { name: 'user' }
    });

    if (!userRole) {
      throw new AppError(500, 'ROLE_NOT_FOUND', 'Default user role not found');
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: userRole.id
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name
    };
  }

  static async login(data: LoginData) {
    // Find user with role
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        role: {
          select: {
            name: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Generate tokens
    const tokens = TokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role.name
    });

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        expiresAt
      }
    });

    // Cache user session in Redis
    await redis.setEx(
      `session:${user.id}`,
      60 * 60 * 24 * 7, // 7 days in seconds
      JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role.name
      })
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name
      },
      tokens
    };
  }

  static async logout(userId: string, refreshToken?: string) {
    // Remove session from database
    if (refreshToken) {
      await prisma.session.deleteMany({
        where: {
          userId,
          refreshToken
        }
      });
    }

    // Remove from Redis cache
    await redis.del(`session:${userId}`);
  }

  static async refreshTokens(refreshToken: string) {
    const payload = await TokenService.verifyRefreshToken(refreshToken);
    
    if (!payload) {
      throw new AppError(401, 'AUTH_TOKEN_INVALID', 'Invalid refresh token');
    }

    // Get user to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          select: {
            name: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'AUTH_USER_NOT_FOUND', 'User not found or inactive');
    }

    // Generate new tokens
    const tokens = TokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role.name
    });

    // Update refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.update({
      where: { refreshToken },
      data: {
        refreshToken: tokens.refreshToken,
        expiresAt
      }
    });

    return tokens;
  }
}
```

### Auth Controller Implementation
```typescript
// backend/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const tokens = await AuthService.refreshTokens(req.body.refreshToken);
      
      res.json({
        success: true,
        data: tokens
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken;
      await AuthService.logout(req.user!.userId, refreshToken);
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
```

### Health Routes Implementation
```typescript
// backend/src/routes/health.routes.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbStatus = 'connected';

    // Check Redis connection
    const redisPing = await redis.ping();
    const redisStatus = redisPing === 'PONG' ? 'connected' : 'disconnected';

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        redis: 'disconnected'
      }
    });
  }
});

export default router;
```

### Nodemon Configuration
```json
// backend/nodemon.json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.test.ts"],
  "exec": "ts-node src/index.ts"
}
```

#### TypeScript Configuration
```json
// backend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowJs": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## Frontend Configuration Files

### Frontend package.json
```json
// frontend/package.json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.0",
    "axios": "^1.5.0",
    "js-cookie": "^3.0.5",
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18",
    "react-hook-form": "^7.46.0",
    "zod": "^3.22.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/react": "^14.0.0",
    "@types/js-cookie": "^3.0.4",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10",
    "eslint": "^8",
    "eslint-config-next": "14.0.0",
    "jest": "^29.6.0",
    "jest-environment-jsdom": "^29.6.0",
    "postcss": "^8",
    "tailwindcss": "^3",
    "typescript": "^5"
  }
}
```

### Next.js Configuration
```javascript
// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'accessToken',
            value: undefined
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

### Tailwind Configuration
```javascript
// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
};
```

### PostCSS Configuration
```javascript
// frontend/postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### TypeScript Configuration
```json
// frontend/tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Jest Configuration
```javascript
// frontend/jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
};

module.exports = createJestConfig(customJestConfig);
```

### Jest Setup
```javascript
// frontend/jest.setup.js
import '@testing-library/jest-dom';
```

### ESLint Configuration
```json
// frontend/.eslintrc.json
{
  "extends": ["next/core-web-vitals"]
}
```

## Docker Compose with Networking
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: auth_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: localpass
      POSTGRES_DB: authdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - auth_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: auth_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass ""
    networks:
      - auth_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  auth_network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

## Quick Start Commands

```bash
# Initial setup (run once)
./scripts/setup.sh

# Start all services
docker-compose up -d
npm run dev

# Reset database
./scripts/reset-db.sh

# Run tests
npm run test

# Access services
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

## Default Test Accounts

After running seed script:
- Admin: admin@localhost / password123
- Sales: sales@localhost / password123
- Finance: finance@localhost / password123
- Operations: operations@localhost / password123

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Check if services running: `lsof -i :3000`
   - Kill process or change port

2. **Docker not starting**
   - Ensure Docker Desktop is running
   - Check Docker resources allocation

3. **Database connection failed**
   - Verify PostgreSQL container is running
   - Check DATABASE_URL in .env

4. **CORS errors**
   - Verify backend CORS configuration
   - Check frontend API URL setting

## Next Steps

Once local development is working:
1. Add more features incrementally
2. Write comprehensive tests
3. Set up CI/CD with GitHub Actions
4. Prepare for production deployment
5. Add monitoring and logging

## Advantages of This Approach

1. **No cloud dependencies** - Everything runs locally
2. **Fast iteration** - No deployment needed
3. **Cost-effective** - No cloud bills during development
4. **Easy onboarding** - New devs can start quickly
5. **Production-similar** - Uses same tools as production
6. **Portable** - Works on any OS with Docker

## Migration to Production

When ready for production:
1. Replace Docker Compose with Kubernetes manifests
2. Use managed PostgreSQL (RDS, Cloud SQL)
3. Use managed Redis (ElastiCache, Cloud Memorystore)
4. Add proper secrets management (Vault, KMS)
5. Implement proper monitoring (Datadog, New Relic)
6. Set up CDN for static assets
7. Add rate limiting and DDoS protection

This plan provides the same depth as the enterprise version but focused entirely on localhost development, making it practical to implement immediately while maintaining production-grade code quality.