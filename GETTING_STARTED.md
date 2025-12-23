# Getting Started Guide

**Purpose**: Onboarding guide for new team members joining the University Social Network project

## 🎯 Welcome to the Team!

We're excited to have you join us in building a **decentralized social network for universities**. This project combines modern web development with real-world academic community needs, making it both technically challenging and socially meaningful.

## 📅 Your First Week

### Day 1: Project Overview & Setup
- **Morning**: Read project overview and understand our mission
- **Afternoon**: Set up development environment and run the application
- **Goal**: Have the application running locally and understand basic functionality

### Day 2-3: Code Exploration & Documentation
- **Read key documentation**: Feature spec, implementation plan, data model
- **Explore codebase**: Understand project structure and existing patterns
- **Goal**: Understand how the system works and where to make changes

### Day 4-5: First Contribution
- **Pick a small task**: Choose a simple bug fix or documentation update
- **Make your changes**: Follow development workflow and submit PR
- **Goal**: Complete your first contribution and understand team workflow

## 🛠️ Development Environment Setup

### Prerequisites
```bash
# Check Node.js version (should be 20+)
node --version

# Check Git version
git --version

# Optional: Check Docker version
docker --version

# Recommended: Install openCode (AI-powered development assistant)
# Visit: https://opencode.ai/ for installation instructions
# Available for VS Code, CLI, and other editors

# Recommended: Install Spec-Kit (spec-driven development tools)
# Visit: https://github.com/sst/spec-kit for complete toolkit
# Install via npm: `npm install -g @spec-kit/cli`
```

### Quick Setup (5 minutes)
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

**Success!** 🎉 Open http://localhost:3000 to see the application running.

### Verify Setup
- ✅ Application loads without errors
- ✅ Can create an account and log in
- ✅ Can create posts and join bubbles
- ✅ Real-time updates are working
- ✅ Sample data is visible and realistic

## 📚 Essential Reading

### Start Here (High Priority)
1. **[README.md](README.md)** - Project overview and quick start
2. **[Feature Specification](specs/001-university-social-network/spec.md)** - What we're building and why
3. **[Development Quick Start](specs/001-university-social-network/quickstart-dev.md)** - Detailed setup guide

### Technical Deep Dive (Medium Priority)
4. **[Implementation Plan](specs/001-university-social-network/plan.md)** - Technical architecture and decisions
5. **[Data Model](specs/001-university-social-network/data-model.md)** - System entities and relationships
6. **[Content Strategy](specs/001-university-social-network/content-strategy.md)** - Content types and sample data

### Advanced Topics (Low Priority)
7. **[Development Ergonomics](specs/001-university-social-network/development-ergonomics.md)** - Why we chose this approach
8. **[Research Findings](specs/001-university-social-network/research.md)** - Technical research and alternatives
9. **[API Documentation](specs/001-university-social-network/contracts/api.yaml)** - Complete API specification

## 🏗️ Understanding the Codebase

### Project Structure
```
university-social-network/
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/     # API endpoint handlers
│   │   ├── middleware/      # Authentication, validation, errors
│   │   ├── services/        # Business logic and data processing
│   │   ├── models/          # Data models and validation
│   │   └── utils/           # Helper functions
│   ├── tests/               # Backend tests
│   └── seeds/               # Sample data generators
├── frontend/               # React PWA frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page-level components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API calls and data fetching
│   │   └── utils/           # Frontend utilities
│   ├── public/             # Static assets
│   └── tests/               # Frontend tests
├── modules/                # Optional advanced features
│   ├── federation/         # GoToSocial integration
│   └── university-integration/  # Real university APIs
└── specs/                  # Project documentation and specifications
```

### Key Concepts to Understand

**Droplets**: Posts/content that float in the user's feed
- Can contain text, media, hashtags, and mentions
- Organized into bubbles (topics)
- Support interactions (votes, comments, badges)

**Bubbles**: Topic clusters (like hashtags) that organize content
- Users can join/leave bubbles
- Content prioritized by joined bubbles
- Can be public or private

**Hotseat Games**: Real-time collaborative activities
- Random group assignments
- Time-limited discussions
- Scoring and gamification elements

**University Integration**: Connection with existing university systems
- Canvas LMS integration
- Student portal data
- Official announcements and events

## 🧪 Testing Your Setup

### Run the Test Suite
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run coverage report
npm run test:coverage
```

### Manual Testing Checklist
- [ ] **User Registration**: Can create new account with university email
- [ ] **Login/Logout**: Authentication works correctly
- [ ] **Create Droplet**: Can post content with text and hashtags
- [ ] **Join Bubbles**: Can find and join topic bubbles
- [ ] **Real-time Updates**: See live updates without page refresh
- [ ] **Interactions**: Can vote, comment, and bookmark content
- [ ] **Hotseat Game**: Can join and participate in real-time games

### Explore Sample Data
- **Users**: 50+ sample users with different roles (students, professors, staff)
- **Content**: 200+ sample droplets covering academic, social, and administrative topics
- **Bubbles**: 15+ active bubbles with realistic academic topics
- **Interactions**: Sample votes, comments, and badges demonstrating social features

## 🔧 Development Workflow

### Daily Development
```bash
# 1. Start development server
npm run dev

# 2. Make changes (auto-reload enabled)

# 3. Run tests
npm run test

# 4. Commit changes
git add . && git commit -m "feature: description of changes"

# 5. Push and create PR
git push origin feature/your-branch-name
```

### Branch Naming
- **Features**: `feature/descriptive-name`
- **Bug fixes**: `fix/descriptive-name`
- **Documentation**: `docs/descriptive-name`
- **Refactoring**: `refactor/descriptive-name`

### Commit Messages
- **Format**: `type: description` (e.g., `feature: add user authentication`)
- **Types**: `feature`, `fix`, `docs`, `refactor`, `test`, `chore`
- **Description**: Clear, concise, present tense
- **Body**: Add context for complex changes (optional)

### Code Review Process
1. **Create Pull Request**: Use GitHub PR template
2. **Request Review**: Tag relevant team members
3. **Address Feedback**: Make requested changes
4. **Merge**: After approval and checks pass

## 🎯 Your First Contribution

### Easy First Tasks
1. **Documentation**: Fix typos or improve explanations
2. **Sample Data**: Add more realistic content or users
3. **Bug Fixes**: Small, well-defined issues
4. **Test Coverage**: Add tests for existing code
5. **UI Improvements**: Small visual enhancements

### Finding Tasks
- **GitHub Issues**: Look for "good first issue" label
- **Code Review**: Help review other team members' PRs
- **Documentation**: Improve guides and explanations
- **Testing**: Add tests for uncovered code

### Getting Help
- **Ask questions**: No question is too basic
- **Pair programming**: Work with experienced team members
- **Code review**: Learn from feedback on your PRs
- **Team meetings**: Participate and share your progress

## 📚 Learning Resources

### Recommended for This Project
- **React Documentation**: https://react.dev/
- **Node.js Guide**: https://nodejs.dev/
- **Express.js**: https://expressjs.com/
- **Socket.io**: https://socket.io/docs/
- **Progressive Web Apps**: https://web.dev/progressive-web-apps/

### Advanced Topics (When Ready)
- **ActivityPub Protocol**: https://activitypub.rocks/
- **GoToSocial**: https://docs.gotosocial.org/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Docker**: https://docs.docker.com/get-started/

### Team Learning
- **Weekly tech talks**: Present topics you're learning
- **Code reviews**: Learn from feedback and discussions
- **Pair programming**: Work directly with experienced developers
- **Documentation**: Share knowledge through writing

## 🤝 Team Communication

### Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Technical questions and ideas
- **Team Chat**: Daily communication and quick questions
- **Email**: Formal announcements and external communication

### Meeting Schedule
- **Sprint Planning**: Weekly (Monday)
- **Retrospective**: Bi-weekly (Friday)
- **Tech Talks**: Monthly (various)
- **1:1s**: Monthly with project lead

### Communication Tips
- **Be specific**: Include relevant context and error messages
- **Use appropriate channels**: Match urgency and formality
- **Document decisions**: Capture important discussions
- **Be responsive**: Acknowledge messages within reasonable time

## 🎓 Success Metrics

### Your First 30 Days
- [ ] **Environment Setup**: Development environment working
- [ ] **Code Understanding**: Can navigate codebase and make changes
- [ ] **First PR**: Successfully merged your first contribution
- [ ] **Team Integration**: Comfortable participating in team discussions
- [ ] **Domain Knowledge**: Understand university social networking concepts

### Ongoing Success
- **Consistent Contributions**: Regular PRs and code reviews
- **Quality Work**: Clean, tested, well-documented code
- **Team Collaboration**: Active participation in discussions and reviews
- **Learning Growth**: Continuously developing new skills
- **Problem Solving**: Independently identify and resolve issues

## 🚨 Common Issues & Solutions

### Setup Problems
- **Node.js version**: Ensure you're using Node.js 20+
- **Port conflicts**: Kill existing processes or use different port
- **Dependency issues**: Delete node_modules and reinstall
- **Database errors**: Run `npm run reset:db && npm run seed`

### Development Issues
- **Hot reload not working**: Check console for errors
- **Tests failing**: Ensure database is seeded and migrations run
- **Real-time updates**: Verify WebSocket connection in browser console
- **API errors**: Check backend logs and network tab

### Getting Unstuck
1. **Check documentation**: Look for existing solutions
2. **Search issues**: Check GitHub Issues for similar problems
3. **Ask the team**: Use appropriate communication channel
4. **Take a break**: Sometimes stepping away helps
5. **Pair program**: Work with someone on the problem

## 🎉 Welcome Aboard!

We're thrilled to have you join our team. This project is a unique opportunity to:

- **Build meaningful technology** that helps university communities
- **Learn modern web development** in a supportive environment
- **Contribute to open source** with real-world impact
- **Develop your skills** through hands-on experience

**Don't hesitate to ask questions** - we're all here to learn and grow together. Your perspective and contributions are valuable to the team's success.

**Ready to start?** Follow the setup guide above and let us know how it goes! 🚀