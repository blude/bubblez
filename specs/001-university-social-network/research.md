# Research Findings: University Social Network

**Created**: 2025-12-23  
**Purpose**: Technical research to resolve architecture decisions for implementation

## Backend Technology Stack

### Decision: Progressive Development Approach

**Phase 1: Node.js-Only Development**
**Rationale**: 
- Single language ecosystem reduces learning curve and setup friction
- Immediate development without external service dependencies
- Builds on existing JavaScript knowledge
- Hot reload and instant iteration for learning

**Phase 2+: Add GoToSocial Federation Module**
**Rationale**:
- GoToSocial provides lightweight ActivityPub federation (~1GB RAM vs Mastodon's 8GB+)
- Federation as optional module maintains development simplicity
- Learn Go systems programming when ready
- Separation concerns: core features (Node.js) + federation (GoToSocial)

**Progressive Architecture**:
```
Phase 1: Frontend → Node.js → SQLite → In-memory Storage
Phase 2+: Frontend → Node.js → PostgreSQL/Redis → S3/University APIs
Phase 3+: Frontend → Node.js + GoToSocial → Federation
```

**Performance**: Node.js handles 10k+ concurrent WebSocket connections with <5ms latency (production with Redis)

## Database Storage Solution

### Decision: Progressive Database Approach

**Phase 1: SQLite + Local Storage**
**Rationale**:
- Zero external dependencies for immediate development
- Instant setup with single file database
- Perfect for social network data modeling and basic queries
- Local file storage eliminates S3 complexity during development
- Focus on core features without infrastructure overhead

**Phase 2+: PostgreSQL + S3 Migration Path**
**Rationale**:
- PostgreSQL excellent for production social network queries and complex relationships
- Native JSONB support for ActivityPub federation data
- GoToSocial officially supports PostgreSQL
- S3-compatible storage for production media handling
- Enterprise-grade skills with high learning value

**Configuration**:
- **Phase 1**: SQLite for structured data + local filesystem for media
- **Phase 2+**: PostgreSQL for structured data + S3 for media + Redis for caching

## Testing Framework Strategy

### Decision: Multi-language Testing Stack

**Components**:
- **Go Backend**: Built-in `testing` + `testify` + `testcontainers-go`
- **Node.js Layer**: Jest + `jest-websocket-mock` + `superwstest`
- **E2E Testing**: Playwright (mobile web simulation)
- **Performance**: k6 (10K concurrent user testing)

**Learning Value**: All frameworks have excellent documentation and complement existing JavaScript knowledge

## Deployment Architecture

### Decision: Lightweight Single-Server Deployment

**Rationale**:
- Single GoToSocial binary + Node.js runtime for simplicity
- Docker containerization for university infrastructure compatibility
- Nginx reverse proxy for SSL termination and static file serving
- PostgreSQL + Redis for data and caching
- Scalable to multi-instance when needed

## University System Integration

### Decision: REST API + LDAP Integration

**Approach**:
- LDAP/Active Directory for SSO authentication
- REST API connectors for university SIS systems (Canvas, Blackboard)
- SAML/Shibboleth compliance for university standards
- Node.js middleware layer for data transformation and caching

## Real-time Features Implementation

### Decision: Socket.io + Redis Pub/Sub

**Benefits**:
- Mature WebSocket ecosystem
- Automatic fallback to long-polling
- Redis clustering for horizontal scaling
- Excellent educational value for real-time patterns

## Mobile Web Frontend

### Decision: Progressive Web App (PWA)

**Rationale**:
- Single codebase for all devices
- Native-like experience through PWA capabilities
- Builds on existing HTML/CSS/JavaScript skills
- Rapid iteration and testing
- App store distribution through PWA installation

## Technology Summary

| Component | Technology | Learning Value | Performance |
|------------|-------------|----------------|-------------|
| Federation | GoToSocial (Go) | Systems programming, protocols | Excellent |
| Real-time | Node.js + Socket.io | Real-time architecture | 10K+ users |
| Database | PostgreSQL | Enterprise skills | Excellent |
| Frontend | PWA (JS/CSS/HTML) | Progressive enhancement | Mobile-native |
| Testing | Jest + Playwright + k6 | Modern testing practices | Comprehensive |

## Implementation Phases

### Phase 1: Core Platform
- Deploy GoToSocial for ActivityPub federation
- Build Node.js authentication with university LDAP
- Implement basic WebSocket layer for hotseat game
- Create PWA frontend with core social features

### Phase 2: Integration
- Connect to university SIS via REST APIs
- Implement real-time notifications
- Add university-specific features
- Performance testing and optimization

### Phase 3: Scaling
- Horizontal scaling with Redis clusters
- Advanced real-time features
- Cross-university federation testing
- Production deployment optimization

## Learning Outcomes

This architecture provides comprehensive learning opportunities:
- **Go**: Modern systems programming and memory safety
- **Node.js**: Real-time microservices architecture
- **PostgreSQL**: Enterprise database administration
- **ActivityPub**: Federation protocols and decentralized systems
- **PWA**: Progressive enhancement and mobile development
- **Testing**: Modern testing practices across multiple languages

All decisions prioritize educational value while meeting performance requirements for 10,000 concurrent users in a university environment.