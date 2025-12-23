# Quick Start: University Social Network

**Purpose**: Developer setup and initial deployment guide for the university social network

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PWA Frontend │    │  Node.js Layer   │    │  GoToSocial     │
│   (React/HTML) │◄──►│  (Real-time)    │◄──►│  (ActivityPub)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                         │
                                ▼                         ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  PostgreSQL      │    │  S3 Storage     │
│  + Redis         │    │  (Media Files)  │
                       └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ University       │
                       │ Systems (LMS,   │
                       │ Portal, etc.)    │
                       └──────────────────┘
```

## Prerequisites

### Required Software
- Docker & Docker Compose
- Node.js 20+ (for development)
- Go 1.21+ (for GoToSocial compilation, optional with Docker)
- PostgreSQL client tools (optional)

### System Requirements
- 4GB RAM minimum (8GB recommended)
- 20GB disk space
- Linux/macOS/Windows with WSL2

## Quick Setup (Docker Compose)

### 1. Clone Repository
```bash
git clone <repository-url>
cd university-social-network
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your university details
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Initialize Database
```bash
docker-compose exec postgres psql -U postgres -d social_network -f /docker-entrypoint-initdb.d/init.sql
```

### 5. Create Admin User
```bash
docker-compose exec nodejs npm run create-admin -- --email admin@university.edu --password secure_password
```

## Development Setup

### Frontend (PWA)
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

### Backend (Node.js)
```bash
cd backend
npm install
npm run dev
# http://localhost:3001
```

### GoToSocial
```bash
cd gotosocial
# Using binary
./gotosocial --config config.yaml

# Or compile from source
go build -o gotosocial cmd/gotosocial/main.go
./gotosocial --config config.yaml
```

## Configuration

### Environment Variables
```bash
# .env file
DATABASE_URL=postgresql://postgres:password@localhost:5432/social_network
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
UNIVERSITY_ID=your-university
UNIVERSITY_NAME=Your University
UNIVERSITY_DOMAIN=university.edu

# GoToSocial
GOTOSOCIAL_HOST=localhost
GOTOSOCIAL_PORT=8080
GOTOSOCIAL_DB_TYPE=postgres
GOTOSOCIAL_DB_ADDRESS=localhost:5432
GOTOSOCIAL_DB_PORT=5432
GOTOSOCIAL_DB_USER=postgres
GOTOSOCIAL_DB_PASSWORD=password
GOTOSOCIAL_DB_DBNAME=gotosocial
```

### University System Integration
```bash
# Example: Canvas LMS
CANVAS_API_URL=https://university.instructure.com/api/v1
CANVAS_API_KEY=your-canvas-api-key

# LDAP Authentication
LDAP_URL=ldap://university.edu
LDAP_BASE_DN=ou=people,dc=university,dc=edu
LDAP_BIND_DN=cn=admin,dc=university,dc=edu
LDAP_BIND_PASSWORD=admin_password
```

## API Testing

### Start with cURL
```bash
# Get access token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@university.edu","password":"password"}'

# Create droplet
curl -X POST http://localhost:3001/api/v1/droplets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello, university! #introduction","visibility":"university"}'
```

### Using Swagger UI
Visit: http://localhost:3001/api/docs

## University System Integration Setup

### 1. Configure LDAP Connection
```bash
# Test LDAP connection
docker-compose exec nodejs npm run test-ldap
```

### 2. Set up SIS Integration
```bash
# Canvas LMS
docker-compose exec nodejs npm run setup-canvas -- --url https://university.instructure.com --key YOUR_KEY

# Blackboard
docker-compose exec nodejs npm run setup-blackboard -- --url https://university.blackboard.com --key YOUR_KEY
```

### 3. Configure Data Sync
```bash
# Test sync frequency
docker-compose exec nodejs npm run test-sync -- --interval 15 --systems canvas,student-portal
```

## Federation Setup

### 1. Configure GoToSocial Domain
```yaml
# config/gotosocial.yaml
instance-name: "University Social Network"
instance-description: "Decentralized social network for university community"
host: social.university.edu
account-domain: university.edu
```

### 2. Set up SSL
```bash
# Using Let's Encrypt
docker-compose exec nginx certbot --nginx -d social.university.edu
```

### 3. Test Federation
```bash
# Follow external user
curl -X POST http://localhost:3001/api/v1/users/follow \
  -H "Authorization: Bearer <token>" \
  -d '{"username":"external@mastodon.social"}'

# Test federation timeline
curl http://localhost:3001/api/v1/timeline/federation \
  -H "Authorization: Bearer <token>"
```

## Deployment

### Production Docker Setup
```bash
# Production compose file
docker-compose -f docker-compose.prod.yml up -d

# Behind Nginx reverse proxy
docker-compose -f docker-compose.prod.yml -f docker-compose.nginx.yml up -d
```

### Monitoring
```bash
# Health checks
curl http://localhost:3001/health
curl http://localhost:8080/health  # GoToSocial
curl http://localhost:6379/ping   # Redis
```

## Common Issues

### Database Connection Errors
```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
# Wait 30 seconds, then reinitialize
```

### Federation Not Working
```bash
# Check GoToSocial logs
docker-compose logs gotosocial

# Verify domain configuration
docker-compose exec gotosocial ./gotosocial --config config.yaml --check
```

### University System Sync Issues
```bash
# Test API connections
docker-compose exec nodejs npm run test-university-apis

# Check sync logs
docker-compose logs nodejs | grep "sync"
```

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-bubble-feature

# Make changes
# Run tests
npm run test
npm run test:e2e
```

### 2. Testing
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance
```

### 3. Deployment
```bash
# Build production assets
npm run build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## Learning Resources

### Documentation
- [GoToSocial Documentation](https://docs.gotosocial.org/)
- [Socket.io Real-time Guide](https://socket.io/docs/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)

### Code Examples
- `examples/auth/` - Authentication patterns
- `examples/federation/` - ActivityPub examples
- `examples/university-integration/` - SIS connectors

### Testing Examples
- `tests/unit/` - Unit test patterns
- `tests/integration/` - API integration tests
- `tests/e2e/` - End-to-end scenarios

## Support

### Getting Help
- Check logs: `docker-compose logs <service>`
- Health checks: `/health` endpoints
- Development team: `dev-team@university.edu`

### Contributing
1. Fork repository
2. Create feature branch
3. Add tests
4. Submit pull request
5. Code review and merge