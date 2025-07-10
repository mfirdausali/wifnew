# Multi-Role Authentication System - Deployment Guide

## Overview

This guide provides instructions for deploying the multi-role authentication system with 4 business roles: Admin, Sales, Finance, and Operations.

## System Architecture

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: Next.js + React + TypeScript  
- **Database**: PostgreSQL with Prisma ORM
- **Session Store**: Redis
- **Authentication**: JWT (access + refresh tokens)
- **Authorization**: Role-Based Access Control (RBAC)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- Docker and Docker Compose (for local development)
- Git

## Environment Configuration

### Backend Environment Variables (.env)

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/authdb

# Redis
REDIS_URL=redis://:password@localhost:6379

# Server
PORT=5001
NODE_ENV=production

# JWT
JWT_SECRET=your-secure-jwt-secret-min-32-chars
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Email (optional)
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Application
APP_NAME=AuthSystem
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables (.env.local)

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/mfirdausali/wifnew.git
   cd wifnew
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

5. **Seed the database (development only)**
   ```bash
   npx prisma db seed
   ```

6. **Start the backend**
   ```bash
   npm run dev
   ```

7. **Start the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

## Production Deployment

### Database Setup

1. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE authdb;
   ```

2. **Run migrations**
   ```bash
   cd backend
   NODE_ENV=production npx prisma migrate deploy
   ```

### Backend Deployment

1. **Build the backend**
   ```bash
   cd backend
   npm run build
   ```

2. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name auth-backend
   pm2 save
   pm2 startup
   ```

### Frontend Deployment

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel (recommended)**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

   Or deploy to any Node.js hosting:
   ```bash
   npm run start
   ```

### Nginx Configuration (if self-hosting)

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret (minimum 32 characters)
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure CORS properly
- [ ] Set secure cookie flags in production
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Regular security updates
- [ ] Backup database regularly

## Role-Based Access Control

The system implements 4 business roles:

- **ADMIN**: Full system access
- **SALES**: Sales dashboard and customer management
- **FINANCE**: Financial reports and billing
- **OPERATIONS**: Order processing and logistics

### API Endpoints by Role

| Endpoint | Admin | Sales | Finance | Operations |
|----------|-------|-------|---------|------------|
| `/api/admin/*` | ✅ | ❌ | ❌ | ❌ |
| `/api/sales/*` | ✅ | ✅ | ❌ | ❌ |
| `/api/finance/*` | ✅ | ❌ | ✅ | ❌ |
| `/api/operations/*` | ✅ | ❌ | ❌ | ✅ |
| `/api/auth/*` | ✅ | ✅ | ✅ | ✅ |
| `/api/user/profile` | ✅ | ✅ | ✅ | ✅ |

## Testing

Run E2E tests to verify deployment:

```bash
cd wifnew
node tests/e2e/auth-flow.test.js
```

Expected output:
```
✅ All tests passed!
```

## Monitoring

### Health Check Endpoints

- Backend: `GET /api/health`
- Frontend: `GET /api/health` (Next.js API route)

### Recommended Monitoring Tools

- **Application**: New Relic, DataDog, or Sentry
- **Database**: pgAdmin or PostgreSQL native monitoring
- **Redis**: Redis Commander or RedisInsight
- **Logs**: ELK Stack or CloudWatch

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall rules

2. **Redis connection errors**
   - Verify Redis is running
   - Check REDIS_URL format
   - Ensure password is correct

3. **CORS errors**
   - Update CORS_ORIGIN in backend .env
   - Ensure frontend URL is whitelisted

4. **JWT errors**
   - Verify JWT_SECRET matches across deployments
   - Check token expiration settings

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

## Maintenance

### Database Backups

```bash
# Backup
pg_dump -U postgres -h localhost authdb > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres -h localhost authdb < backup_20250710.sql
```

### Updates

1. **Update dependencies**
   ```bash
   npm update
   npm audit fix
   ```

2. **Database migrations**
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

## Support

For issues or questions:
- GitHub Issues: https://github.com/mfirdausali/wifnew/issues
- Documentation: See README.md and AUTH.md

---

Last updated: July 2025