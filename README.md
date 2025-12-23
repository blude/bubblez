# Bubblez: University Social Network

A decentralized and transparent social networking platform designed specifically for university communities, connecting students, professors, and staff through academic collaboration, organizational coordination, and social engagement.

## 🎯 Project Overview

**Mission**: Create an authentic academic ecosystem where learning, collaboration, and community building seamlessly blend through innovative "floating droplets" and "bubbles" interface metaphors.

**Key Features**:
- 🎓 **Academic Focus**: Course discussions, study groups, research collaboration
- 🔄 **Real-time Collaboration**: Hotseat games for cross-department engagement
- 🏛️ **University Integration**: Seamless connection with existing university systems
- 🌐 **Federation Ready**: Connect with other universities through ActivityPub protocol
- 📱 **Mobile-First**: Progressive Web App for campus-wide accessibility

## 🚀 Quick Start (5 Minutes)

### For Beginners - Get Running Immediately

```bash
# 1. Clone the repository
git clone <repository-url>
cd university-social-network

# 2. Install dependencies
npm install

# 3. Create sample data
npm run seed

# 4. Start development server
npm run dev
```

🎉 **That's it!** Your social network is running at http://localhost:3000

### What You Get Immediately
- ✅ Full social network features (posts, comments, likes)
- ✅ User registration and authentication
- ✅ Bubbles (topics/hashtags) for content organization
- ✅ Real-time updates and notifications
- ✅ Sample university data and users
- ✅ Hot seat game functionality

## 📖 Project Documentation

### 📋 Planning & Specification
- **[Feature Specification](specs/001-university-social-network/spec.md)** - Complete feature requirements and user stories
- **[Implementation Plan](specs/001-university-social-network/plan.md)** - Technical architecture and development approach
- **[Content Strategy](specs/001-university-social-network/content-strategy.md)** - Content models and sample data strategy
- **[Data Model](specs/001-university-social-network/data-model.md)** - Complete entity definitions and relationships

### 🛠️ Development Guides
- **[Development Quick Start](specs/001-university-social-network/quickstart-dev.md)** - 5-minute setup for local development
- **[Production Quick Start](specs/001-university-social-network/quickstart.md)** - Production deployment guide
- **[Development Ergonomics](specs/001-university-social-network/development-ergonomics.md)** - Analysis of simplified development approach
- **[API Documentation](specs/001-university-social-network/contracts/api.yaml)** - Complete API specification

### 🧪 Testing & Quality
- **[Requirements Checklist](specs/001-university-social-network/checklists/requirements.md)** - Feature validation checklist
- **[Research Findings](specs/001-university-social-network/research.md)** - Technical research and decision documentation

## 🏗️ Architecture Overview

### Development-First Approach
We use a **progressive complexity** approach that prioritizes learning and rapid iteration:

```
Phase 1: Simple Development (Current)
┌─────────────────┐    ┌──────────────────┐
│   PWA Frontend  │◄──►│  Node.js Backend │
│   (React/Vite)  │    │  (Express.js)    │
└─────────────────┘    └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  SQLite          │
                       │  + In-memory     │
                       │  + Local Files   │
                       └──────────────────┘

Phase 2+: Production Patterns (Gradual)
┌─────────────────┐    ┌──────────────────┐
│   PWA Frontend  │◄──►│  Node.js Backend │
│   (React/Vite)  │    │  + PostgreSQL    │
└─────────────────┘    │  + Redis         │
                       │  + S3 Storage    │
                       └──────────────────┘

Phase 3+: Federation (Advanced)
┌─────────────────┐    ┌───────────────────────┐
│   PWA Frontend  │◄──►│  Node.js + GoToSocial │
│   (React/Vite)  │    │  (ActivityPub)        │
└─────────────────┘    └───────────────────────┘
```

### Technology Stack
- **Frontend**: React + Vite (PWA)
- **Backend**: Node.js + Express.js
- **Database**: SQLite (dev) → PostgreSQL (prod)
- **Real-time**: Socket.io (in-memory → Redis)
- **Storage**: Local filesystem → S3-compatible
- **Federation**: GoToSocial (ActivityPub) - optional module

## 👥 Team Collaboration Guide

### For New Team Members

**Getting Started**:
1. Read the [Feature Specification](specs/001-university-social-network/spec.md) to understand project goals
2. Follow the [Development Quick Start](specs/001-university-social-network/quickstart-dev.md) for setup
3. Review the [Content Strategy](specs/001-university-social-network/content-strategy.md) for data understanding
4. Join team discussions and ask questions!

**Learning Path**:
- **Week 1**: Core features (posts, bubbles, users)
- **Week 2**: Real-time features (Socket.io, notifications)
- **Week 3**: University integration (mock APIs)
- **Week 4**: Production patterns (PostgreSQL, Redis)
- **Week 5+**: Advanced features (federation, deployment)

### For Technical Contributors

**Development Workflow**:
```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes with hot reload
npm run dev  # Auto-reloads on changes

# 3. Test thoroughly
npm run test          # All tests
npm run test:unit     # Unit tests only
npm run test:e2e      # End-to-end tests

# 4. Commit changes
git add . && git commit -m "feature: your feature description"

# 5. Create pull request for review
```

**Code Quality Standards**:
- Follow existing code conventions and patterns
- Write self-documenting code with clear names
- Include educational comments explaining "why" decisions
- Add tests for new features and edge cases
- Update documentation for API changes

**Project Structure**:
```
backend/                 # Node.js backend
├── src/
│   ├── controllers/     # API endpoints
│   ├── middleware/      # Auth, validation, errors
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   └── utils/           # Helper functions
├── tests/               # Test files
└── seeds/               # Sample data generators

frontend/               # PWA frontend
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   └── utils/          # Helper functions
└── public/             # Static assets

modules/                # Optional production modules
├── federation/         # GoToSocial integration
├── university-integration/  # Real university APIs
└── production/         # Production deployment configs
```

## 🎓 Learning Objectives

This project serves as a **learning platform** for mastering modern web development:

### Core Skills Development
- **Progressive Web Apps**: Mobile-first development with offline capabilities
- **Real-time Systems**: WebSocket programming with Socket.io
- **Database Architecture**: SQLite → PostgreSQL migration patterns
- **API Design**: RESTful APIs with comprehensive documentation
- **Modern Testing**: Unit, integration, and end-to-end testing practices

### Advanced Topics (Optional)
- **Federation Protocols**: ActivityPub and decentralized social networking
- **Go Systems Programming**: GoToSocial integration
- **Production Deployment**: Docker, monitoring, and scaling
- **University Integration**: LDAP, SIS systems, and data synchronization

### Educational Philosophy
- **Spec-Driven Development**: Start with clear specifications before coding
- **Progressive Complexity**: Learn concepts incrementally
- **Real-world Applications**: Solve actual university community problems
- **Collaborative Learning**: Work in teams with code reviews and knowledge sharing

## 🧪 Testing Strategy

### Test Types
- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint and database interaction testing
- **End-to-End Tests**: Complete user journey testing
- **Performance Tests**: Load testing for 10K concurrent users

### Running Tests
```bash
# All tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# Performance testing
npm run test:performance
```

### Test Quality Standards
- All business logic must have unit tests
- Critical user flows need integration tests
- Major features require end-to-end tests
- Tests should be fast, reliable, and independent

## 📊 Project Status

### Current Phase: Development-First Implementation
- ✅ **Phase 0**: Research and planning complete
- ✅ **Phase 1**: Design and architecture complete
- 🔄 **Phase 2**: Core implementation in progress
- ⏳ **Phase 3**: Production features (future)
- ⏳ **Phase 4**: Federation and deployment (future)

### Completed Features
- [x] Feature specification and user stories
- [x] Technical architecture and research
- [x] Data models and API contracts
- [x] Development setup and ergonomics analysis
- [x] Content strategy and sample data models

### In Progress
- [ ] Core backend implementation (Node.js + Express)
- [ ] Frontend PWA development (React + Vite)
- [ ] Real-time features (Socket.io)
- [ ] Sample data generation and seeding
- [ ] Basic testing framework setup

### Planned Features
- [ ] University system integration (mock → real)
- [ ] Hot seat game implementation
- [ ] Production database migration (PostgreSQL)
- [ ] Media storage (S3-compatible)
- [ ] GoToSocial federation module
- [ ] Production deployment and monitoring

## 🤝 Contributing Guidelines

### How to Contribute
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Review Process
- All changes require code review before merging
- Reviews focus on logic, style, and adherence to project principles
- Use automated tools to catch common issues
- Encourage collaborative discussion and improvement

### Development Principles
- **Simplicity First**: Choose the simplest solution that meets requirements
- **Learning-First**: Prioritize educational value over optimization
- **Incremental Development**: Small, testable changes preferred
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data

## 📞 Support & Communication

### Getting Help
- **Documentation**: Check project docs first
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Team Chat**: Join our team communication platform (details in team docs)

### Contact Information
- **Project Lead**: [Contact information]
- **Technical Support**: [Support email/channel]
- **Documentation Issues**: [Documentation maintainer]

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **University Community**: For inspiring the need for better academic collaboration tools
- **Open Source Community**: For providing the tools and frameworks that make this project possible
- **Spec-Driven Development**: For the methodology that guides our approach
- **Team Contributors**: For their dedication to creating meaningful educational technology

## 👥 Team Collaboration

### For New Team Members
- **[Getting Started Guide](GETTING_STARTED.md)** - Your first week and onboarding
- **[Team Collaboration Guide](TEAM.md)** - Internal team processes and guidelines
- **[Development Quick Start](specs/001-university-social-network/quickstart-dev.md)** - 5-minute setup guide

### For Technical Contributors
- **[Project Structure](README.md#-project-structure)** - Code organization and patterns
- **[Development Workflow](README.md#-development-workflow)** - Git workflow and code review
- **[Testing Strategy](README.md#-testing-strategy)** - Quality assurance and testing practices

### For Project Managers
- **[Feature Specification](specs/001-university-social-network/spec.md)** - Complete requirements and user stories
- **[Implementation Plan](specs/001-university-social-network/plan.md)** - Technical architecture and timeline
- **[Progress Tracking](README.md#-progress-tracking)** - Metrics and reporting

---

**Ready to start building?** Follow the [Getting Started Guide](GETTING_STARTED.md) and join us in creating the future of university social networking! 🚀