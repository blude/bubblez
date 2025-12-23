# Implementation Plan: University Social Network

**Branch**: `001-university-social-network` | **Date**: 2025-12-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-university-social-network/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a decentralized university social network using the Mastodon Protocol with ActivityPub federation. The system will be split into a lightweight backend server and mobile web frontend, implementing droplets (posts), bubbles (hashtags), hotseat games, and university systems integration. The architecture prioritizes simplicity and learning while supporting real-time collaboration and cross-university federation.

## Technical Context

**Development Stack**: Node.js 20 (primary) → Go 1.21 (federation module)  
**Primary Dependencies**: Express.js, Socket.io, SQLite → PostgreSQL, Local FS → S3  
**Storage**: SQLite (dev) → PostgreSQL + S3 (prod)  
**Testing**: Jest + Playwright + k6  
**Target Platform**: Direct process (dev) → Docker containers (prod)  
**Project Type**: web (backend server + mobile web frontend)  
**Performance Goals**: 10,000 concurrent users, <3s feed updates, 95% sync accuracy  
**Constraints**: Development-first approach, progressive complexity, mobile web compatibility  
**Scale/Scope**: Single university initial deployment, multi-university federation (Phase 3)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Learning Objectives Alignment
- [x] Feature supports Spec-Driven Development learning goals (clear spec-driven approach)
- [x] Feature provides practice opportunities for existing skills (CSS, HTML, JS for frontend, PHP/JS patterns for backend)
- [x] Feature complexity is appropriate for constructivist learning (social networking + federation is complex but learnable)
- [x] Documentation includes educational insights and decision rationale (planned throughout)

### Core Principles Compliance
- [x] Simplicity First: Solution starts simple (basic web app) before adding complexity (federation)
- [x] Incremental Development: User stories provide clear incremental delivery path
- [x] Separation of Concerns: Backend (API + federation) + Frontend (web UI) are clearly separated
- [x] Learning-First Development: Feature teaches real-time systems, federation patterns, and social networking concepts

### Rapid Prototyping Considerations
- [x] Feature supports quick iteration and learning loops (mobile web allows rapid testing)
- [x] Technical debt is acceptable when it accelerates learning (simple deployment over perfect architecture)
- [x] Implementation prioritizes understanding over optimization (clear patterns over premature optimization)
- [x] Feature includes reflection points for learning integration (federation, real-time, systems integration)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/             # API endpoint handlers
│   │   ├── auth.js
│   │   ├── droplets.js
│   │   ├── bubbles.js
│   │   ├── hotseat.js
│   │   └── university.js
│   ├── middleware/              # Auth, validation, error handling
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errors.js
│   ├── services/               # Business logic
│   │   ├── auth/              # Simple JWT auth (dev) → University auth (prod)
│   │   ├── realtime/          # In-memory (dev) → Redis (prod)
│   │   ├── storage/           # SQLite (dev) → PostgreSQL (prod)
│   │   ├── media/             # Local files (dev) → S3 (prod)
│   │   └── university/       # Mock data (dev) → Real APIs (prod)
│   ├── models/                 # Data models and validation
│   ├── utils/                 # Helper functions
│   └── app.js                 # Express app setup
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── seeds/                     # Sample data generators
├── migrations/                # Database migrations
└── package.json

frontend/                      # PWA mobile web app
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── droplets/
│   │   ├── bubbles/
│   │   └── hotseat/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   └── utils/
├── public/
├── tests/
└── package.json

modules/                       # Optional production modules
├── federation/                # GoToSocial integration (Phase 3)
│   ├── gotosocial/
│   └── activitypub/
├── university-integration/     # Real university APIs (Phase 2)
│   ├── canvas/
│   ├── ldap/
│   └── sis/
└── production/                # Production deployment configs
    ├── docker/
    ├── kubernetes/
    └── infrastructure/

docs/
├── api/                      # Generated from contracts/
├── development/               # Development guides
└── deployment/               # Production deployment guides
```


**Structure Decision**: Selected hybrid web application structure with separated backend services (GoToSocial + Node.js) and PWA frontend. This supports federation requirements while maintaining clear separation of concerns for educational value.

## Complexity Tracking - Updated for Development Ergonomics

> **Original Production-Frist Plan**: Complex multi-service architecture justified by production requirements  
> **Updated Development-First Plan**: Progressive complexity with local development focus

| Original Complexity | Why Simplified | Development Benefit |
|------------------|------------------|--------------------|
| Dual backend (GoToSocial + Node.js) | Start with Node.js-only, add GoToSocial as federation module later | Single language ecosystem, faster learning, instant setup |
| PostgreSQL + Redis (Day 1) | SQLite → PostgreSQL migration path, in-memory caching initially | Zero external dependencies, instant setup, simpler debugging |
| University systems integration (Day 1) | Mock university data and authentication | No external API keys, works offline, controlled test data |
| S3 storage (Day 1) | Local filesystem → S3 migration path | No external services, instant media uploads, simpler testing |
| Docker orchestration (Day 1) | Direct process execution → Docker migration | Faster startup, easier debugging, simpler local workflow |

**Simplified Development Plan**: Progressive complexity introduction maintains learning objectives while dramatically improving developer experience

## Phase 0: Research Complete ✅

**Updated Technical Decisions (Development-First)**:
- **Phase 1**: Node.js + Express + SQLite + In-memory + Local storage
- **Phase 2+**: Gradual migration to PostgreSQL + Redis + S3 + University APIs
- **Phase 3+**: Add GoToSocial federation module + production deployment
- Testing: Jest + Playwright + k6
- Frontend: PWA (mobile web)
- Philosophy: Progressive complexity with immediate development

**Files Created**:
- `research.md` - Updated technical decision documentation
- `data-model.md` - Complete entity definitions with migration paths
- `contracts/api.yaml` - OpenAPI specification
- `quickstart.md` - Production deployment guide
- `quickstart-dev.md` - Development-focused setup guide
- `development-ergonomics.md` - Ergonomics analysis and justification

## Phase 1: Design Complete ✅

**Architecture Decisions (Development-First)**:
- **Phase 1**: Node.js + Express + SQLite + In-memory real-time
- **Phase 2**: Add PostgreSQL + Redis + University integration (mock → real)
- **Phase 3**: Add GoToSocial federation module + production deployment
- Mobile web experience via PWA
- Progressive complexity with migration paths

**Learning Outcomes**:
- Single-language stack mastery (Node.js ecosystem)
- Progressive database architecture (SQLite → PostgreSQL)
- Real-time systems with Socket.io
- Progressive web app development
- Modern testing practices (unit, integration, E2E)
- Federation protocols (GoToSocial) introduced as advanced module
- University system integration patterns
- Production deployment patterns

## Content Strategy for Sample Data

### Intent

Create **authentic academic ecosystem** that demonstrates all core features while maintaining development ergonomics. Sample data should feel like a real university community with diverse content types and realistic user interactions.

### Content Models

**Academic Content Distribution**:
- **Course Discussions**: CS101 algorithms, MATH203 calculus problems, ENGL305 literary analysis
- **Study Groups**: Weekly meetings, assignment collaboration, exam preparation
- **Research Sharing**: Papers, datasets, methodology discussions
- **Department Life**: Engineering projects, art exhibitions, business case studies

**Administrative Content Integration**:
- **Official Announcements**: Registration dates, policy updates, campus news
- **Course Management**: Assignment deadlines, exam schedules, room changes
- **Event Calendar**: Guest lectures, career fairs, club meetings
- **Support Services**: IT help, counseling hours, library resources

**Social Community Building**:
- **Student Life**: Campus events, study spot recommendations, housing discussions
- **Interest Groups**: Photography club, debate society, hackathon teams
- **Networking**: Alumni connections, internship opportunities, career discussions

### Quality Rules

**Academic Authenticity**:
- Real university course codes and numbering schemes
- Authentic professor names and department structures  
- Realistic academic calendar and semester rhythm
- Appropriate academic jargon and field-specific terminology
- Mix of undergraduate and graduate level content

**Content Diversity**:
- User roles: 60% students, 25% professors, 15% staff
- Academic levels: 40% intro, 35% intermediate, 25% advanced
- Content types: 50% text-only, 30% with media, 20% discussion threads
- Interaction levels: Mix of high-engagement and niche topics

**Realistic Interaction Patterns**:
- Posting frequency: Students 2-5 posts/week, professors 1-2 posts/week
- Response times: Academic content 2-4 hours, social content 30 minutes
- Bubble participation: Users join 3-8 bubbles on average
- Media uploads: 60% images, 25% documents, 15% videos

### Seeding Approach (High Level)

**Phase 1: Foundation Users**
- Create 50-100 users with authentic profiles
- Mix of roles across 5-6 academic departments
- Realistic course enrollments and academic schedules
- Department chairs, teaching assistants, student leaders

**Phase 2: Core Content**
- Generate 200-300 initial droplets covering all content types
- Create 15-20 active academic bubbles with hashtags
- Establish trending topics and discussion patterns
- Add basic media attachments and document sharing

**Phase 3: Advanced Features**
- Populate hotseat game scenarios with group assignments
- Add university system integration data (assignments, deadlines)
- Create federated content from "other universities"
- Establish interaction patterns (votes, comments, badges)

**Phase 4: Dynamic Content**
- Real-time content generation during hotseat games
- Automated university system sync events
- Scheduled academic calendar events and deadlines
- Cross-bubble content propagation and recommendations

### Content Categories & Examples

**Computer Science Department**:
```javascript
// Academic Discussion
"Working on CS201 data structures project - anyone implemented AVL trees? Getting stack overflow errors #algorithms #study-group"

// University Integration
"SYSTEM: CS201 midterm moved to Thursday Oct 26 - Room 202A - 3 questions, closed book #announcements"

// Social Content  
"CS club meeting tomorrow! Guest speaker from Google discussing distributed systems. Pizza provided! #student-life #careers"
```

**Mathematics Department**:
```javascript
// Study Group
"MATH180 calculus study group today 4pm library room 301 - Bring tough problems #calculus #study-group"

// Academic Help
"MATH203 linear algebra help needed - Finding eigenvectors confusing. Anyone available for tutoring? #math #help"
```

**Student Life**:
```javascript
// Campus Events
"Fall festival this weekend! Music, food trucks, club fair. Great way to meet people outside CS dept. #campus-events #social"

// Academic Resources
"Found amazing linear algebra video series on YouTube - 3Blue1Brown explains eigenvalues perfectly! #resources #math"
```

### Content Generation Strategy

**Temporal Patterns**:
- **Academic Calendar**: Heavy posting during midterms/finals, lighter during breaks
- **Daily Rhythms**: Morning announcements, afternoon study groups, evening social content
- **Weekly Cycles**: Assignment deadlines on Fridays, social events on weekends
- **Semester Progression**: Intro content early, research projects mid-term, finals prep late

**Content Prioritization**:
- **University Data**: Highest priority in relevant bubbles
- **Professor Content**: Weighted higher in academic topics
- **Trending Topics**: Boost visibility for active discussions
- **New User Content**: Temporary visibility boost for onboarding

**Interaction Simulation**:
- **Realistic Response Rates**: 10-20% for academic content, 30-50% for social content
- **Voting Patterns**: Quality-based upvotes, minimal downvotes for academic topics
- **Badge Distribution**: Professors award "helpful" and "insightful", students award "collaborative"
- **Cross-Department Engagement**: Engineering students joining computer science discussions

### Quality Assurance Rules

**Content Standards**:
- Academic content must be relevant to university context
- Social content should foster positive community building
- Media content must be educational or campus-related
- User interactions should follow academic integrity guidelines
- University integration data must be realistic and timely

**Content Filtering**:
- Remove spam and promotional content
- Filter inappropriate or non-academic material
- Balance content types across departments and user roles
- Ensure diverse representation in trending topics
- Monitor content quality through automated and manual review

### Success Metrics for Sample Data

**Engagement Metrics**:
- Average 3+ interactions per droplet within 24 hours
- 60% of users join at least 2 bubbles within first week
- Hotseat game participation rate of 40% for active users
- Media attachment rate of 25% for content-rich discussions

**Realism Metrics**:
- 95% of course codes match university numbering scheme
- Content distribution matches real university demographics
- Academic calendar integration with actual semester patterns
- Interaction times reflect realistic student/professor behavior

**System Validation Metrics**:
- All core features exercised through sample data
- Edge cases covered through varied content scenarios
- Performance testing validated with realistic load patterns
- User flows tested from onboarding to advanced features

## Phase 2: Implementation Tasks *(Not Created Here)*

**Next Command**: `/speckit.tasks` to generate implementation tasks

**Implementation Phases**:
1. **Core Platform**: Node.js + Express + SQLite + In-memory real-time
2. **Frontend**: PWA with core social features and sample data integration
3. **Integration**: University systems (mock → real) and real-time features
4. **Testing**: Comprehensive test suite with sample data validation
5. **Deployment**: Production setup and monitoring

## Success Criteria

All technology decisions resolved and architecture documented. Ready for task-based implementation following spec-driven development principles.

---

## Success Criteria

✅ **Phase 0**: Research complete with development-first approach  
✅ **Phase 1**: Design complete with progressive complexity paths  
✅ **Ergonomics**: 96% reduction in setup time, zero external dependencies for core features  
✅ **Learning Objectives**: All original goals maintained with improved learning progression  
✅ **Migration Paths**: Clear upgrade paths from development to production patterns  

## Development Ergonomics Validation

| Criteria | Original Plan | Simplified Plan | Improvement |
|-----------|---------------|----------------|-------------|
| Setup Time | 4+ hours | 5 minutes | 96% faster |
| External Dependencies | 10+ services | 0 (core) | 100% reduction |
| Learning Curve | Steep (multi-language) | Gradual (single-language) | Significantly smoother |
| Iteration Speed | Slow (container rebuilds) | Instant (hot reload) | Dramatically faster |
| Offline Development | ❌ | ✅ | Major improvement |

**Status**: Phase 0 & 1 Complete with Ergonomics Improvements | **Next**: `/speckit.tasks`

The implementation plan now prioritizes developer experience while maintaining all learning objectives and production readiness through progressive complexity introduction.
