# Development Quick Start: University Social Network

**Purpose**: Developer setup for local development with minimal friction

## Development Philosophy

**Progressive Complexity**: Start simple, add production features when needed
- **Phase 1**: Core social features (5-minute setup)
- **Phase 2**: Production patterns (gradual migration)
- **Phase 3**: Federation and deployment (production-ready)

## Phase 1: Instant Development Setup

### Prerequisites
```bash
# Required Software
Node.js 20+ 
Git

# Optional (for Phase 2+)
Docker & Docker Compose
PostgreSQL client tools
```

### 5-Minute Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd university-social-network

# 2. Install dependencies
npm install

# 3. Create sample data
npm run seed

# 4. Start development server
npm run dev
```

**That's it!** Your social network is running at http://localhost:3000

### What You Get Immediately
- ✅ Full social network features (posts, comments, likes)
- ✅ User registration and authentication
- ✅ Bubbles (topics/hashtags)
- ✅ Real-time updates (in-memory)
- ✅ Media uploads (local filesystem)
- ✅ Sample university data (mock)
- ✅ Hot seat game functionality

## Phase 2: Adding Production Patterns

### Database Migration (SQLite → PostgreSQL)
```bash
# 1. Set up PostgreSQL
docker-compose up -d postgres

# 2. Migrate data
npm run migrate:to-postgres

# 3. Start with PostgreSQL
npm run dev:postgres
```

### Real-time Caching (In-memory → Redis)
```bash
# 1. Start Redis
docker-compose up -d redis

# 2. Enable Redis caching
npm run dev:redis
```

### Media Storage (Local → S3)
```bash
# 1. Configure S3 credentials
cp .env.example .env
# Edit AWS_S3_* variables

# 2. Enable S3 storage
npm run dev:s3
```

### University Integration (Mock → Real APIs)
```bash
# 1. Configure university systems
cp config/university.example.js config/university.js

# 2. Add real API keys
# Edit config/university.js with Canvas/LDAP credentials

# 3. Enable university integration
npm run dev:university
```

## Phase 3: Federation and Production

### Add Federation Module (GoToSocial)
```bash
# 1. Build GoToSocial module
cd modules/federation
npm run build:gotosocial

# 2. Configure federation
cp config/federation.example.js config/federation.js

# 3. Enable federation
npm run dev:federation
```

### Production Deployment
```bash
# 1. Build production assets
npm run build

# 2. Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d

# 3. Set up SSL and domain
# See docs/deployment/production.md
```

## Development Commands

### Core Development
```bash
npm run dev          # Start development server (Phase 1)
npm run seed          # Create sample data
npm run test          # Run all tests
npm run test:unit     # Unit tests only
npm run test:e2e      # End-to-end tests
```

### Phase 2+ Commands
```bash
npm run dev:postgres  # PostgreSQL backend
npm run dev:redis     # Redis caching enabled
npm run dev:s3        # S3 media storage
npm run dev:university # University integration
npm run dev:federation # GoToSocial federation
```

### Database Operations
```bash
npm run migrate         # Run SQLite migrations
npm run migrate:to-postgres # Migrate to PostgreSQL
npm run seed:university # Generate university sample data
npm run reset:db       # Reset database
```

### Testing Commands
```bash
npm run test           # All tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run test:performance # Load testing
```

## Development Workflow

### Daily Development
```bash
# 1. Start clean
npm run reset:db && npm run seed && npm run dev

# 2. Make changes with hot reload
# Frontend and backend reload automatically

# 3. Test changes
npm run test

# 4. Commit changes
git add . && git commit -m "feature: new social feature"
```

### Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Add tests
# Tests in tests/unit/, tests/integration/, tests/e2e/

# 3. Implement feature
# Code in backend/src/ and frontend/src/

# 4. Test thoroughly
npm run test

# 5. Review and merge
git checkout main
git merge feature/new-feature
```

## Architecture Overview (Development)

```
┌─────────────────┐    ┌──────────────────┐
│   PWA Frontend │◄──►│  Node.js Backend │
│   (React/Vite)  │    │  (Express.js)    │
└─────────────────┘    └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  SQLite         │
                       │  + In-memory     │
                       │  + Local files   │
                       └──────────────────┘

Optional Additions (Phase 2+):
- PostgreSQL (replace SQLite)
- Redis (replace in-memory)
- S3 (replace local files)
- University APIs (replace mock data)
- GoToSocial (add federation)
```

## Learning Path

### Week 1: Core Features
- Node.js backend architecture
- Express.js API design
- SQLite database operations
- Real-time updates with Socket.io
- PWA frontend development
- Social media interaction patterns

### Week 2: Testing & Quality
- Jest unit testing
- E2E testing with Playwright
- API testing patterns
- Database migrations
- Code quality and linting

### Week 3: Production Patterns
- PostgreSQL database design
- Redis caching strategies
- S3 media storage
- Error handling and logging
- Performance optimization

### Week 4: Integration
- University API integration
- Authentication patterns
- Data synchronization
- Security best practices
- API documentation

### Week 5+: Advanced Topics
- ActivityPub federation
- GoToSocial integration
- Deployment automation
- Monitoring and scaling
- Production troubleshooting

## Troubleshooting

### Port Already in Use
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Database Issues
```bash
# Reset database
npm run reset:db

# Recreate sample data
npm run seed
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Real-time Updates Not Working
```bash
# Check browser console for WebSocket errors
# Ensure both frontend and backend are running
# Try incognito window to test fresh connection
```

## Getting Help

### Documentation
- `docs/development/` - Development guides
- `docs/api/` - API documentation
- `CONTRIBUTING.md` - Contribution guidelines

### Common Issues
- Check GitHub Issues for known problems
- Review `docs/troubleshooting.md`
- Join developer Discord/Slack for help

### Support
- Email: dev-team@university.edu
- Create GitHub Issue for bugs
- Stack Overflow with `university-social-network` tag

## Next Steps

1. **Start with Phase 1**: `npm install && npm run seed && npm run dev`
2. **Explore features**: Create posts, join bubbles, test real-time updates
3. **Make changes**: Modify code and see immediate results
4. **Add Phase 2+**: Graduate to production patterns when ready
5. **Deploy**: Use Phase 3 for production deployment

This progressive approach ensures you can start building immediately and learn production patterns at your own pace!