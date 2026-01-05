---

description: "Task list for University Social Network implementation"
---

# Tasks: University Social Network

**Input**: Design documents from `/specs/001-university-social-network/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included as this is a comprehensive implementation with Jest + Playwright + k6 testing framework specified.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/` following Node.js structure
- **Frontend**: `frontend/src/` following PWA structure
- **Tests**: `backend/tests/` for backend tests, `frontend/tests/` for frontend tests

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure per implementation plan
- [X] T002 Initialize Node.js backend project with Express.js dependencies in backend/package.json
- [X] T003 Initialize PWA frontend project in frontend/package.json
- [X] T004 [P] Configure ESLint and Prettier for backend code formatting
- [X] T005 [P] Configure ESLint and Prettier for frontend code formatting
- [X] T006 Create environment configuration files (.env, .env.example)
- [X] T007 Setup Git repository with proper .gitignore for Node.js projects

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Setup SQLite database schema and migrations framework in backend/src/database/
- [X] T009 [P] Implement JWT authentication framework in backend/src/middleware/auth.js
- [X] T010 [P] Setup API routing structure in backend/src/app.js
- [X] T011 Create User model/entity in backend/src/models/user.js
- [X] T012 Configure error handling middleware in backend/src/middleware/errors.js
- [X] T013 Setup environment configuration management in backend/src/config/
- [X] T014 Setup Socket.io for real-time features in backend/src/services/realtime/
- [X] T015 Create basic API response structure and validation middleware in backend/src/middleware/validation.js
- [X] T016 Setup file upload handling for media in backend/src/services/media/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Share Academic Content (Priority: P1) 🎯 MVP

**Goal**: Users can create droplets with text and media content that appear in their federated feed

**Independent Test**: Can create a droplet and verify it appears in the user's feed within 5 seconds with proper formatting and metadata

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T017 [P] [US1] Contract test for POST /droplets in backend/tests/contract/test_droplets.js
- [X] T018 [P] [US1] Integration test for droplet creation workflow in backend/tests/integration/test_droplet_creation.js
- [X] T019 [P] [US1] E2E test for content creation and feed display in frontend/tests/e2e/test_content_creation.test.js
- [X] T020 [P] [US1] Create Droplet model in backend/src/models/droplet.js
- [X] T021 [P] [US1] Create MediaAttachment model in backend/src/models/media.js
- [X] T022 [P] [US1] Create InteractionMetrics model in backend/src/models/interaction.js
- [X] T023 [US1] Implement DropletService in backend/src/services/droplet.js (depends on T020, T021, T022)
- [X] T024 [US1] Implement droplets API endpoints in backend/src/controllers/droplets.js
- [X] T025 [US1] Add droplet creation validation and error handling
- [X] T026 [US1] Implement real-time feed updates via Socket.io in backend/src/services/realtime/feed.js
- [X] T027 [US1] Create frontend droplet creation component in frontend/src/components/droplets/DropletCreation.js
- [X] T028 [US1] Create frontend feed display component in frontend/src/components/feed/FeedDisplay.js
- [ ] T029 [US1] Add frontend API client for droplet operations in frontend/src/services/api.js
- [ ] T030 [US1] Implement hashtag parsing and bubble organization in backend/src/services/content/parser.js
- [ ] T031 [US1] Add media file upload handling and validation
- [ ] T032 [US1] Document learning insights and key decisions in docs/learning/university-social-us1.md
- [X] T033 [P] [US2] Contract test for GET /bubbles in backend/tests/contract/test_bubbles.js
- [X] T034 [P] [US2] Integration test for bubble discovery and joining in backend/tests/integration/test_bubble_discovery.js
- [X] T035 [P] [US2] E2E test for bubble search and join workflow in frontend/tests/e2e/test_bubble_interaction.test.js
- [X] T036 [P] [US2] Create Bubble model in backend/src/models/bubble.js
- [X] T037 [US2] Implement BubbleService in backend/src/services/bubble.js
- [X] T038 [US2] Implement bubbles API endpoints in backend/src/controllers/bubbles.js
- [X] T039 [US2] Create frontend bubble discovery component in frontend/src/components/bubbles/BubbleDiscovery.js
- [ ] T040 [US2] Create frontend bubble management component in frontend/src/components/bubbles/BubbleManager.js
- [ ] T041 [US2] Implement bubble search and filtering logic
- [ ] T042 [US2] Update feed service to prioritize joined bubble content
- [ ] T043 [US2] Add real-time notifications for new bubble content
- [ ] T044 [US2] Document learning insights and key decisions in docs/learning/university-social-us2.md

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 4 - Interact with Content (Priority: P1)

**Goal**: Users can comment, upvote, downvote, share, bookmark, and gift badges to droplets and bubbles

**Independent Test**: Can perform each interaction type on a droplet and verify the results are properly recorded and displayed

### Tests for User Story 4

- [ ] T045 [P] [US4] Contract test for POST /droplets/{id}/interact in backend/tests/contract/test_interactions.js
- [ ] T046 [P] [US4] Integration test for interaction workflow in backend/tests/integration/test_interactions.js
- [ ] T047 [P] [US4] E2E test for content interactions in frontend/tests/e2e/test_content_interactions.test.js

### Implementation for User Story 4

- [ ] T048 [P] [US4] Create Badge model in backend/src/models/badge.js
- [ ] T049 [US4] Implement InteractionService in backend/src/services/interaction.js
- [ ] T050 [US4] Implement interaction API endpoints in backend/src/controllers/interactions.js
- [ ] T051 [US4] Create frontend interaction components in frontend/src/components/interactions/
- [ ] T052 [US4] Implement voting system with real-time updates
- [ ] T053 [US4] Implement bookmarking functionality
- [ ] T054 [US4] Implement badge gifting system
- [ ] T055 [US4] Add sharing capabilities for content
- [ ] T056 [US4] Document learning insights and key decisions in docs/learning/university-social-us4.md

**Checkpoint**: At this point, User Stories 1, 2, AND 4 should all work independently

---

## Phase 6: User Story 5 - University Systems Integration (Priority: P1)

**Goal**: The social network seamlessly connects to existing university systems to retrieve and display relevant information

**Independent Test**: Can configure connections to university systems and verify data retrieval and display functionality

### Tests for User Story 5

- [ ] T057 [P] [US5] Contract test for GET /university/systems in backend/tests/contract/test_university.js
- [ ] T058 [P] [US5] Integration test for university system data sync in backend/tests/integration/test_university_integration.js
- [ ] T059 [P] [US5] Mock university API responses for testing in backend/tests/mocks/university_apis.js

### Implementation for User Story 5

- [ ] T060 [P] [US5] Create UniversitySystem model in backend/src/models/university.js
- [ ] T061 [P] [US5] Create UniversityData model in backend/src/models/university_data.js
- [ ] T062 [US5] Implement UniversityIntegrationService in backend/src/services/university/integration.js
- [ ] T063 [US5] Create mock university API connectors in backend/src/services/university/mock/
- [ ] T064 [US5] Implement university system API endpoints in backend/src/controllers/university.js
- [ ] T065 [US5] Create data transformation and mapping utilities in backend/src/services/university/data_mapping.js
- [ ] T066 [US5] Implement scheduled data synchronization
- [ ] T067 [US5] Create frontend university data display components in frontend/src/components/university/
- [ ] T068 [US5] Add university data to feed processing
- [ ] T069 [US5] Document learning insights and key decisions in docs/learning/university-social-us5.md

**Checkpoint**: At this point, all P1 user stories should be independently functional

---

## Phase 7: User Story 3 - Participate in Hotseat Game (Priority: P2)

**Goal**: Users can join a hotseat game where they are randomly assigned to temporary groups for collaborative activities

**Independent Test**: Can join a hotseat game and verify group assignment and temporary collaboration features work

### Tests for User Story 3

- [ ] T070 [P] [US3] Contract test for hotseat game endpoints in backend/tests/contract/test_hotseat.js
- [ ] T071 [P] [US3] Integration test for hotseat game mechanics in backend/tests/integration/test_hotseat_game.js
- [ ] T072 [P] [US3] E2E test for hotseat participation workflow in frontend/tests/e2e/test_hotseat_experience.test.js

### Implementation for User Story 3

- [ ] T073 [P] [US3] Create HotseatGame model in backend/src/models/hotseat.js
- [ ] T074 [US3] Create Participant model in backend/src/models/participant.js
- [ ] T075 [US3] Implement HotseatService in backend/src/services/hotseat.js
- [ ] T076 [US3] Implement hotseat API endpoints in backend/src/controllers/hotseat.js
- [ ] T077 [US3] Create frontend hotseat game components in frontend/src/components/hotseat/
- [ ] T078 [US3] Implement group assignment algorithms
- [ ] T079 [US3] Add real-time game state management via Socket.io
- [ ] T080 [US3] Implement scoring and game mechanics
- [ ] T081 [US3] Document learning insights and key decisions in docs/learning/university-social-us3.md

---

## Phase 8: User Story 6 - Multi-University Federation (Priority: P3)

**Goal**: The platform can be deployed by other universities and connected together for cross-institution collaboration

**Independent Test**: Can set up two university instances and verify content can be shared between them

### Tests for User Story 6

- [ ] T082 [P] [US6] Research GoToSocial integration patterns in backend/tests/research/federation_integration.js
- [ ] T083 [US6] Mock federation setup for testing in backend/tests/mocks/federation.js

### Implementation for User Story 6

- [ ] T084 [US6] Set up GoToSocial integration module in modules/federation/gotosocial/
- [ ] T085 [US6] Implement ActivityPub content transformation in backend/src/services/federation/activitypub.js
- [ ] T086 [US6] Create federation configuration management
- [ ] T087 [US6] Implement cross-university content sharing controls
- [ ] T088 [US6] Add federation status and monitoring
- [ ] T089 [US6] Document learning insights and key decisions in docs/learning/university-social-us6.md

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T090 [P] Update API documentation in docs/api/
- [ ] T091 [P] Code cleanup and refactoring across all modules
- [ ] T092 Performance optimization for feed queries and real-time updates
- [ ] T093 [P] Add comprehensive unit tests in backend/tests/unit/
- [ ] T094 Security hardening (input validation, rate limiting, CORS)
- [ ] T095 Run quickstart-dev.md validation and update documentation
- [ ] T096 Create comprehensive learning summary in docs/learning/university-social-summary.md
- [ ] T097 Document how new skills integrate with existing design knowledge
- [ ] T098 Identify extension opportunities for future learning
- [ ] T099 [P] Create sample data seeding scripts in backend/seeds/
- [ ] T100 Set up performance testing with k6 scripts
- [ ] T101 Create deployment documentation for production environment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 4 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for interaction targets
- **User Story 5 (P1)**: Can start after Foundational (Phase 2) - Integrates with content from US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for content creation
- **User Story 6 (P3)**: Can start after P1 stories complete - Federation requires core content functionality

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, P1 stories (US1, US2, US4, US5) can start in parallel
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test for POST /droplets in backend/tests/contract/test_droplets.js"
Task: "Integration test for droplet creation workflow in backend/tests/integration/test_droplet_creation.js"
Task: "E2E test for content creation and feed display in frontend/tests/e2e/test_content_creation.test.js"

# Launch all models for User Story 1 together:
Task: "Create Droplet model in backend/src/models/droplet.js"
Task: "Create MediaAttachment model in backend/src/models/media.js"
Task: "Create InteractionMetrics model in backend/src/models/interaction.js"
```

---

## Implementation Strategy

### MVP First (P1 User Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Content Creation)
4. Complete Phase 4: User Story 2 (Bubble Discovery)
5. Complete Phase 6: User Story 5 (University Integration)
6. Complete Phase 7: User Story 4 (Content Interactions)
7. **STOP and VALIDATE**: Test all P1 stories working together
8. Deploy/demo MVP

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Core content creation working
3. Add User Story 2 → Test independently → Content discovery working
4. Add User Story 4 → Test independently → Content interactions working
5. Add User Story 5 → Test independently → University integration working
6. Add User Story 3 → Test independently → Hotseat games working
7. Add User Story 6 → Test independently → Federation working
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Content Creation)
   - Developer B: User Story 2 (Bubble Discovery)
   - Developer C: User Story 4 (Content Interactions)
   - Developer D: User Story 5 (University Integration)
3. P2 and P3 stories can follow as team capacity allows

--- 

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence