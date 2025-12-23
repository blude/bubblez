# Data Model: University Social Network

**Created**: 2025-12-23  
**Purpose**: Define core entities and relationships for implementation

## Core Entities

### User
```typescript
interface User {
  id: string;                    // UUID
  username: string;              // Unique identifier
  email: string;                 // University email
  displayName: string;            // Preferred display name
  avatarUrl?: string;            // Profile image
  role: UserRole;                // STUDENT | PROFESSOR | STAFF
  universityId: string;           // University identifier
  department?: string;            // Academic department
  yearOfStudy?: number;          // For students
  joinedBubbles: string[];        // Array of bubble IDs
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;              // Account status
}

enum UserRole {
  STUDENT = 'student',
  PROFESSOR = 'professor', 
  STAFF = 'staff'
}

interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  hotseatOptIn: boolean;
  dataSharing: DataSharingLevel;
}

enum DataSharingLevel {
  PRIVATE = 'private',
  UNIVERSITY = 'university',
  FEDERATED = 'federated'
}
```

### Droplet (Post/Content)
```typescript
interface Droplet {
  id: string;                    // UUID
  authorId: string;              // User ID
  content: string;               // Text content (supports markdown)
  mediaAttachments: MediaAttachment[];
  bubbles: string[];             // Hashtag/bubble references
  mentions: string[];             // User mentions
  replyToId?: string;            // If this is a reply
  interactions: InteractionMetrics;
  universityData?: UniversityData; // Auto-populated from university systems
  visibility: VisibilityLevel;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;              // Soft delete
}

interface MediaAttachment {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
}

enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio'
}

interface InteractionMetrics {
  upvotes: number;
  downvotes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  badges: Badge[];              // Awarded badges
}

interface Badge {
  id: string;
  type: BadgeType;
  awardedBy: string;             // User who awarded
  reason: string;
  awardedAt: Date;
}

enum BadgeType {
  HELPFUL = 'helpful',
  INSIGHTFUL = 'insightful',
  CREATIVE = 'creative',
  COLLABORATIVE = 'collaborative'
}

enum VisibilityLevel {
  PUBLIC = 'public',
  UNIVERSITY = 'university',
  BUBBLE = 'bubble',
  PRIVATE = 'private'
}
```

### Bubble (Topic/Hashtag)
```typescript
interface Bubble {
  id: string;                    // UUID or normalized hashtag
  name: string;                  // Display name
  hashtag: string;               // #hashtag format
  description?: string;          // Optional description
  creatorId: string;             // User who created
  memberCount: number;
  dropletCount: number;
  isPublic: boolean;
  universityId?: string;         // If university-specific
  moderators: string[];          // User IDs
  tags: string[];               // Additional categorization
  createdAt: Date;
  updatedAt: Date;
}
```

### Hotseat Game
```typescript
interface HotseatGame {
  id: string;
  name: string;
  description?: string;
  status: GameStatus;
  createdBy: string;              // User ID
  maxParticipants: number;
  currentParticipants: Participant[];
  roundDuration: number;          // Minutes
  currentRound?: number;
  totalRounds: number;
  settings: GameSettings;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

enum GameStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

interface Participant {
  userId: string;
  joinedAt: Date;
  currentGroup?: string;          // Group ID for current round
  totalScore: number;
}

interface GameSettings {
  autoAssignGroups: boolean;
  groupSize: number;
  shuffleEachRound: boolean;
  scoringRules: ScoringRule[];
}

interface ScoringRule {
  action: GameAction;
  points: number;
}

enum GameAction {
  POST_DROPLET = 'post_droplet',
  COMMENT = 'comment',
  UPVOTE = 'upvote',
  JOIN_DISCUSSION = 'join_discussion'
}
```

### University System Integration
```typescript
interface UniversitySystem {
  id: string;
  name: string;                  // e.g., "Canvas LMS", "Student Portal"
  type: SystemType;
  config: SystemConfig;
  status: SystemStatus;
  lastSyncAt?: Date;
  createdAt: Date;
}

enum SystemType {
  E_LEARNING = 'e_learning',
  STUDENT_PORTAL = 'student_portal',
  INTRANET = 'intranet',
  PUBLIC_PORTAL = 'public_portal',
  SIS = 'student_information_system'
}

interface SystemConfig {
  apiUrl: string;
  authenticationMethod: AuthMethod;
  syncFrequency: number;         // Minutes
  dataMapping: DataMapping;
  credentials?: SecureCredentials; // Encrypted storage
}

enum AuthMethod {
  OAUTH2 = 'oauth2',
  LDAP = 'ldap',
  API_KEY = 'api_key',
  SAML = 'saml'
}

interface DataMapping {
  userFields: FieldMapping[];
  courseFields: FieldMapping[];
  eventFields: FieldMapping[];
}

interface FieldMapping {
  sourceField: string;           // External system field
  targetField: string;           // Our system field
  transform?: TransformFunction;
}

interface UniversityData {
  source: string;                // Which system provided data
  type: DataType;
  content: any;                  // Structured data from university
  syncAt: Date;
}

enum DataType {
  COURSE_ANNOUNCEMENT = 'course_announcement',
  UNIVERSITY_EVENT = 'university_event',
  ASSIGNMENT = 'assignment',
  DEADLINE = 'deadline',
  SUPPORT_GROUP = 'support_group'
}
```

## Relationships

### User Relationships
- `User 1:N Droplet` (author)
- `User N:M Bubble` (membership)
- `User 1:N Interaction` (votes, comments, bookmarks)
- `User N:M HotseatGame` (participation)

### Content Relationships  
- `Droplet 1:N Comment` (replies)
- `Droplet N:M Bubble` (categorization)
- `Droplet 1:N MediaAttachment`
- `Droplet 1:N Interaction` (metrics)

### Game Relationships
- `HotseatGame 1:N Participant`
- `HotseatGame N:M User` (through Participant)

### Integration Relationships
- `UniversitySystem N:M Droplet` (data source)
- `UniversitySystem 1:N UniversityData`

## Validation Rules

### User Validation
- Email must be from university domain
- Username unique across federation
- Role-specific field validation (e.g., yearOfStudy for students)

### Droplet Validation
- Content length: 1-5000 characters
- Max media attachments: 10 per droplet
- Max hashtags: 5 per droplet
- Rate limiting: 10 droplets per hour per user

### Bubble Validation
- Hashtag format: alphanumeric + underscores, max 50 chars
- Unique within university
- Creator automatically becomes moderator

### Hotseat Game Validation
- Min participants: 3, Max: 50
- Round duration: 5-60 minutes
- Creator cannot participate unless explicitly allowed

## Performance Considerations

### Indexing Strategy
- Users: email, username, universityId
- Droplets: authorId, createdAt, bubbles[]
- Bubbles: hashtag, universityId
- Interactions: userId, dropletId, type

### Caching Strategy
- User profiles: Redis (30 min TTL)
- Bubble membership: Redis (15 min TTL)
- Trending content: Redis (5 min TTL)
- University data: PostgreSQL + Redis sync

### Data Archiving
- Archive droplets older than 2 years
- Soft delete with 30-day grace period
- University data retention policies respected

## Security Considerations

### Data Privacy
- Personal identifiable information encryption
- University data access controls
- Federation data sharing preferences respected

### Content Security
- Media file scanning and validation
- XSS protection in content rendering
- Rate limiting and spam protection

### Access Control
- Role-based permissions (professor > student > staff)
- University system access scoped by role
- Bubble moderator permissions