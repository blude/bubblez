# Implementation Plan: University Social Network

**Branch**: `001-university-social-network` | **Date**: 2025-12-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-university-social-network/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a decentralized university social network using the Mastodon Protocol with ActivityPub federation. The system will be split into a lightweight backend server and mobile web frontend, implementing droplets (posts), bubbles (hashtags), hotseat games, and university systems integration. The architecture prioritizes simplicity and learning while supporting real-time collaboration and cross-university federation.

## Technical Context

**Language/Version**: Go 1.21 (GoToSocial) + Node.js 20 (real-time layer)  
**Primary Dependencies**: GoToSocial, Socket.io, PostgreSQL, Redis, Nginx  
**Storage**: PostgreSQL + S3-compatible storage (MinIO for self-hosted)  
**Testing**: Go testing + Jest + Playwright + k6  
**Target Platform**: Docker containers on Linux server  
**Project Type**: web (backend server + mobile web frontend)  
**Performance Goals**: 10,000 concurrent users, <3s feed updates, 95% sync accuracy  
**Constraints**: Lightweight infrastructure, mobile web compatibility, university system integration  
**Scale/Scope**: Single university initial deployment, multi-university federation capability

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
├── gotosocial/                  # GoToSocial ActivityPub server
│   ├── config/
│   ├── cmd/
│   └── internal/
├── nodejs/                     # Real-time layer and university integration
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   ├── university/
│   │   │   └── realtime/
│   │   └── utils/
│   ├── tests/
│   └── package.json
├── database/
│   ├── migrations/
│   └── seeds/
└── docker/
    ├── postgres/
    └── redis/

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

infrastructure/
├── nginx/
├── docker-compose.yml
└── docker-compose.prod.yml

docs/
├── api/                        # Generated from contracts/
├── deployment/
└── guides/
```

```

**Structure Decision**: Selected hybrid web application structure with separated backend services (GoToSocial + Node.js) and PWA frontend. This supports federation requirements while maintaining clear separation of concerns for educational value.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Dual backend (GoToSocial + Node.js) | Federation (GoToSocial) + custom real-time features (Node.js) require different technology stacks | Single solution would either lack federation support or real-time capabilities |
| PostgreSQL + Redis | Complex social interactions need relational DB + real-time caching | Single database solution would not handle 10K concurrent users efficiently |
| Docker deployment | University environment needs containerized, scalable deployment | Direct deployment would be difficult to maintain and scale |

**All complexity justified by learning value and functional requirements**

## Phase 0: Research Complete ✅

**Resolved Technical Decisions**:
- Backend: GoToSocial (Go) + Node.js real-time layer
- Database: PostgreSQL + S3 storage  
- Testing: Jest + Playwright + k6
- Deployment: Docker containers on Linux server
- Frontend: PWA (mobile web)

**Files Created**:
- `research.md` - Technical decision documentation
- `data-model.md` - Complete entity definitions
- `contracts/api.yaml` - OpenAPI specification
- `quickstart.md` - Setup and deployment guide

## Phase 1: Design Complete ✅

**Architecture Decisions**:
- Federation via GoToSocial (ActivityPub)
- Real-time features via Node.js + Socket.io + Redis
- University system integration via REST/LDAP
- Mobile web experience via PWA
- Lightweight deployment pattern

**Learning Outcomes**:
- Go systems programming and federation protocols
- Real-time microservices architecture
- Enterprise database administration
- Progressive web app development
- Modern testing practices

## Phase 2: Implementation Tasks *(Not Created Here)*

**Next Command**: `/speckit.tasks` to generate implementation tasks

**Implementation Phases**:
1. **Core Platform**: GoToSocial + Node.js basic setup
2. **Frontend**: PWA with core social features
3. **Integration**: University systems and real-time features
4. **Testing**: Comprehensive test suite and performance validation
5. **Deployment**: Production setup and monitoring

## Success Criteria

All technology decisions resolved and architecture documented. Ready for task-based implementation following spec-driven development principles.

---

**Status**: Phase 0 & 1 Complete | **Next**: `/speckit.tasks`
