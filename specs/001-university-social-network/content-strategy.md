# Content Strategy: University Social Network

**Created**: 2025-12-23  
**Purpose**: Document comprehensive content strategy for implementation

## Executive Summary

The university social network implements a **progressive content strategy** that balances academic utility, social engagement, and technical feasibility. The system creates an authentic academic ecosystem through "floating droplets" and "bubbles" metaphor while maintaining development-first approach.

## 1. Content Intent Framework

### Primary Content Types (70% User-Generated)

**Academic Content (Core Purpose)**
- Course-related discussions and Q&A
- Study materials and references sharing  
- Research collaboration and peer review
- Department-specific academic discourse
- Assignment and exam preparation

**Administrative Content (University Integration)**
- Official university announcements
- Course updates and deadlines
- Event scheduling and activities
- Support group information
- Policy and procedure communications

**Social Content (Community Building)**
- Student life and campus discussions
- Club and organization activities
- Peer support and networking
- Campus culture and events
- General university conversations

**Media Content (Rich Learning)**
- Lecture recordings and slides
- Study group documentation
- Academic project portfolios
- Campus event documentation
- Educational resource sharing

### Content Sources Hierarchy

```
Phase 1: User-Generated (100%)
├── Students, professors, staff content
├── Real-time interactions
└── Basic academic discussions

Phase 2+: University Integration (25% of content)
├── E-learning platform data (Canvas, Moodle)
├── Student portal information
├── University intranet announcements
└── Public portal events

Phase 3+: Federated Content (5% of content)
├── Other university networks
├── Cross-institution research
└── Shared academic resources
```

## 2. Content Purpose Matrix

| Purpose | Content Types | User Value | Implementation Priority |
|----------|---------------|-------------|---------------------|
| **Learning & Education** | Academic discussions, study materials, university data | Academic success, knowledge access | P1 |
| **Collaboration** | Study groups, research projects, hotseat games | Team productivity, academic networking | P1 |
| **Organization** | Deadlines, events, schedules, announcements | Time management, planning efficiency | P2 |
| **Social Connection** | Student life, community discussions, events | Belonging, campus engagement | P2 |

## 3. Content Models and Constraints

### Core Content Interfaces

```typescript
interface ContentStrategy {
  contentTypes: ContentType[];
  moderationPolicy: ModerationPolicy;
  distributionRules: DistributionRules;
  personalizationRules: PersonalizationRules;
}

interface ContentType {
  id: string;
  name: string;
  purpose: ContentPurpose;
  allowedMediaTypes: MediaType[];
  maxLength: number;
  requiredFields: string[];
  optionalFields: string[];
}

enum ContentPurpose {
  ACADEMIC = 'academic',
  ADMINISTRATIVE = 'administrative', 
  SOCIAL = 'social',
  MEDIA = 'media'
}
```

### Content Creation Constraints

```typescript
interface ContentConstraints {
  droplet: {
    minLength: 1;
    maxLength: 5000;
    maxHashtags: 5;
    maxMentions: 10;
    maxMediaAttachments: 10;
    maxMediaSize: 50 * 1024 * 1024; // 50MB
    allowedMimeTypes: [
      'text/plain', 'text/markdown',
      'image/jpeg', 'image/png', 'image/gif',
      'video/mp4', 'video/webm',
      'application/pdf', 
      'audio/mpeg', 'audio/ogg'
    ];
    rateLimit: {
      perHour: 10;
      perDay: 100;
    };
  };
  bubble: {
    nameMinLength: 3;
    nameMaxLength: 50;
    hashtagPattern: /^[a-z0-9_]+$/i;
    maxDescriptionLength: 500;
    maxTags: 10;
    rateLimit: {
      perHour: 5;
      perDay: 20;
    };
  };
}
```

### Realism Level: Near-Production Academic Content

**Authentic Academic Environment**:
- Real course codes and departments (CS101, MATH203, ENGL305)
- Realistic academic calendar and deadlines
- Department-specific content and jargon
- University policy and procedure discussions
- Mix of undergraduate/graduate perspectives

**Sample Data Categories**:
```javascript
// Academic Content Examples
"CS101 students working on Linked Lists assignment - study group meeting today at 3pm in library room 201 #computer-science #study-groups"

// University Integration Examples  
"SYSTEM: Midterm exam schedule posted - CS201 Oct 25, MATH180 Oct 27 - Check student portal for room assignments #deadlines #announcements"

// Social Content Examples
"Anyone interested in joining the coding club? We meet every Tuesday and work on open-source projects #student-life #programming"
```

## 4. User Experience States

### Floating Droplets Display

```typescript
interface DropletDisplay {
  id: string;
  content: string;
  author: User;
  media: MediaAttachment[];
  metadata: DropletMetadata;
  interactionMetrics: InteractionMetrics;
  visualPriority: number; // Size and positioning
  colorCoding: ColorScheme; // By content type
  sourceIndicators: SourceIndicator[];
}

interface DropletMetadata {
  contentType: ContentType;
  isUniversityGenerated: boolean;
  sourceSystem?: string;
  bubbleCategories: string[];
  timeSensitivity: TimeSensitivity;
  academicRelevance: AcademicRelevanceLevel;
}

enum ColorScheme {
  ACADEMIC_BLUE = '#0066cc',
  ADMINISTRATIVE_RED = '#dc3545', 
  SOCIAL_PURPLE = '#6f42c1',
  MEDIA_GREEN = '#28a745'
}
```

### Bubble Organization UX

```typescript
interface BubbleDisplay {
  id: string;
  name: string;
  hashtag: string;
  memberCount: number;
  activityLevel: ActivityLevel;
  contentType: BubbleContentType;
  membershipStatus: MembershipStatus;
  personalizationWeight: number;
}

enum BubbleContentType {
  ACADEMIC = 'academic',
  SOCIAL = 'social',
  ADMINISTRATIVE = 'administrative',
  MIXED = 'mixed'
}

enum ActivityLevel {
  HIGH = 'high',     // >10 posts/day
  MEDIUM = 'medium',   // 3-10 posts/day  
  LOW = 'low',         // 1-3 posts/day
  DORMANT = 'dormant'  // <1 post/day
}
```

## 5. Edge Case Handling

### Content State Management

```typescript
interface ContentStateTransitions {
  states: ContentState[];
  transitions: StateTransition[];
  errorHandling: ErrorHandlingStrategy;
}

enum ContentState {
  DRAFT = 'draft',
  PUBLISHING = 'publishing',
  PUBLISHED = 'published', 
  PROCESSING = 'processing', // Media uploads
  FAILED = 'failed',
  ARCHIVED = 'archived'
  FEDERATING = 'federating',
  FEDERATION_FAILED = 'federation_failed'
}

interface ErrorHandlingStrategy {
  retryPolicy: RetryPolicy;
  fallbackBehavior: FallbackBehavior;
  userNotification: NotificationTemplate;
}
```

### Network and System Resilience

```typescript
interface ResilienceStrategy {
  connectivityHandling: ConnectivityStrategy;
  universitySystemFailures: SystemFailureHandling;
  realTimeDisconnections: DisconnectionHandling;
  federationOutages: FederationHandling;
}

interface ConnectivityStrategy {
  offlineMode: OfflineMode;
  queueingBehavior: QueueingBehavior;
  syncOnReconnect: SyncStrategy;
}

interface OfflineMode {
  enableReadWrite: boolean; // Read-only vs full offline
  cacheStrategy: CacheStrategy;
  maxCacheSize: number;
}
```

## 6. Empty and Error States

### Empty State Management

```typescript
interface EmptyStateStrategy {
  scenarios: EmptyState[];
  actionTemplates: ActionTemplate[];
  personalizationRules: PersonalizationRule[];
}

enum EmptyState {
  NO_CONTENT = 'no_content',
  NO_BUBBLES = 'no_bubbles', 
  NO_MATCHES = 'no_matches',
  NO_RESULTS = 'no_results',
  NETWORK_ERROR = 'network_error',
  UNIVERSITY_SYSTEM_OFFLINE = 'university_system_offline',
  NO_ACTIVE_GAMES = 'no_active_games',
  FIRST_TIME_USER = 'first_time_user'
}

interface ActionTemplate {
  type: 'create_content' | 'join_bubble' | 'search_users' | 'explore_bubbles' | 'check_connection';
  label: string;
  icon: string;
  priority: number;
  contextual: boolean; // Appears based on context
}
```

### Error Recovery Framework

```typescript
interface ErrorRecoveryStrategy {
  errorTypes: ErrorType[];
  recoveryActions: RecoveryAction[];
  escalationPaths: EscalationPath[];
  userCommunication: CommunicationStrategy;
}

enum ErrorType {
  CONTENT_CREATION_FAILED = 'content_creation_failed',
  MEDIA_UPLOAD_FAILED = 'media_upload_failed',
  BUBBLE_JOIN_FAILED = 'bubble_join_failed',
  GAME_CONNECTION_LOST = 'game_connection_lost',
  UNIVERSITY_SYNC_FAILED = 'university_sync_failed',
  FEDERATION_ERROR = 'federation_error',
  PERMISSION_DENIED = 'permission_denied',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
}

interface RecoveryAction {
  type: 'RETRY' | 'CONTACT_SUPPORT' | 'TRY_ALTERNATIVE' | 'WAIT_AND_RETRY';
  label: string;
  action: (() => void) | string; // Function or navigation target
  autoRetry: boolean;
  maxRetries: number;
}
```

## 7. Content Non-Goals

### Explicitly Excluded Categories

**Academic Context Violations**:
- Commercial advertising and promotions
- Non-academic external content (general news, politics)
- Personal social media content (food, fashion, vacation photos)
- Spam and irrelevant promotional materials
- Content unrelated to university mission

**Limited Inclusion**:
- Entertainment content (unless academic-related)
- Non-academic hobby discussions  
- External commercial content
- Political content (unless university-related)

**Moderation Requirements**:
- University-appropriate language and content standards
- Academic relevance verification
- Spam and harassment prevention
- Copyright compliance for educational content
- Privacy protection for student information

## 8. Implementation Phases

### Phase 1: Core Content System
- **User-generated content** with basic validation
- **Simple bubble organization** with hashtag support
- **Basic media handling** with local storage
- **Fundamental error states** with user feedback
- **Empty state handling** with clear CTAs

### Phase 2: Content Enhancement
- **University system integration** with real-time sync
- **Advanced media processing** with cloud storage
- **Content moderation** with automated filtering
- **Performance optimization** with caching strategies
- **Advanced error recovery** with retry logic

### Phase 3: Content Federation
- **Cross-university content** sharing
- **Content prioritization** across federated instances
- **Advanced content filtering** and personalization
- **Content analytics** and optimization
- **Comprehensive moderation** across instances

## 9. Success Metrics

### Content Engagement Metrics
- **Droplet Creation Rate**: Target 100+ droplets/day in active university
- **Bubble Participation**: Average 5+ bubbles per user within first week
- **Interaction Rate**: Average 3.2 interactions per droplet
- **Media Sharing**: 25% of droplets include media attachments

### University Integration Metrics  
- **Sync Accuracy**: 95% university data synchronization
- **Timeliness**: University announcements appear in under 2 minutes
- **Coverage**: 90% of users access university data through platform

### Content Quality Metrics
- **Academic Relevance**: 80% of content rated as academically relevant
- **Moderation Response**: Reported content reviewed in under 2 hours
- **User Satisfaction**: 90% satisfaction with content discovery and organization

## 10. Technical Constraints

### Performance Requirements
- **Content Loading**: Feed loads in under 2 seconds
- **Real-time Updates**: Content updates appear in under 3 seconds
- **Media Upload**: 50MB files upload in under 10 seconds
- **Search Performance**: Bubble search results in under 500ms

### Scalability Constraints
- **Concurrent Users**: Support 10,000 concurrent content interactions
- **Content Volume**: Handle 1000+ droplets created per hour
- **Media Storage**: Scale to 1TB of academic media content
- **Real-time Connections**: Support 5000+ concurrent WebSocket connections

## Conclusion

This content strategy creates a **comprehensive academic ecosystem** that:

- **Prioritizes learning and collaboration** through content type design
- **Supports progressive complexity** from basic user content to university integration
- **Handles edge cases gracefully** with robust error recovery
- **Maintains academic focus** through clear content guidelines
- **Scales effectively** to university requirements while keeping development manageable

The strategy ensures the university social network becomes an **essential academic tool** rather than just another social media platform, with the "floating droplets" and "bubbles" metaphor creating an intuitive and engaging user experience.