# Greed Hunter Academy - Frontend (Student Portal)

## Overview
The student frontend is a React-based single-page application that provides the learning interface for Greed Hunter Academy. It offers course browsing, enrollment, video playback, progress tracking, and interactive learning features.

## Tech Stack
- **Framework**: React 19.2.0 with Vite
- **State Management**: Redux Toolkit 2.11.2
- **Routing**: React Router DOM 7.13.0
- **Styling**: Tailwind CSS 4.1.18
- **HTTP Client**: Axios 1.13.4
- **Real-time**: Socket.IO Client 4.8.3
- **Video Playback**: HLS.js 1.6.15
- **Animations**: Framer Motion 12.36.0
- **Icons**: Lucide React 0.577.0, Heroicons 2.2.0
- **Security**: DOMPurify 3.3.1

## Architecture

### Project Structure
```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── redux/             # State management
│   ├── router/            # Routing configuration
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── constants/         # App constants
│   ├── styles/            # CSS styles
│   └── mock/              # Mock data (development)
├── public/                # Static assets
└── dist/                  # Build output
```

### Key Pages & Features

#### Authentication Pages
- **Login/Register**: OTP-based authentication
- **Password Reset**: Email-based recovery
- **Profile Management**: Account settings

#### Course Discovery
- **Course Listing**: Browse available courses
- **Course Details**: Preview content and reviews
- **Search & Filters**: Category, level, price filters

#### Learning Interface
- **Course Player**: Video playback with progress tracking
- **Lesson Navigation**: Module-based organization
- **Assignments**: Submission interface
- **Materials**: Downloadable resources

#### Live Learning
- **Live Classes**: Real-time streaming
- **Interactive Polls**: Voting during sessions
- **Chat & Reactions**: Real-time engagement

#### Community Features
- **Discussions**: Q&A threads
- **Doubt Tickets**: Instructor support
- **Reviews**: Course feedback

#### User Dashboard
- **Progress Tracking**: Learning analytics
- **Certificates**: Completion credentials
- **Wallet**: Payment history
- **Achievements**: Gamification elements

## Core Features

### 1. Authentication & User Management
**Flow:**
1. Email registration/login
2. OTP verification via email
3. JWT token management
4. Profile completion

**Pros:**
- Secure OTP verification
- Persistent login state
- Profile customization
- Account recovery options

**Cons:**
- Email dependency
- No social login
- OTP delivery delays

**Security:**
- Secure token storage
- Input validation
- XSS protection with DOMPurify

### 2. Course Discovery & Enrollment
**Features:**
- Course catalog with search/filtering
- Detailed course previews
- Pricing and discount display
- Enrollment with Razorpay integration

**Pros:**
- Intuitive browsing experience
- Rich course information
- Seamless payment flow

**Cons:**
- Limited preview content
- No trial periods
- Static course listings

### 3. Learning Experience
**Video Playback:**
- HLS streaming with HLS.js
- Progress synchronization
- Quality selection
- Fullscreen support

**Content Types:**
- **Video Lessons**: Primary learning content
- **Articles**: Text-based materials
- **Assignments**: Interactive tasks
- **Live Sessions**: Real-time classes
- **Downloadable Materials**: Resources

**Progress Tracking:**
- Lesson completion marking
- Time spent analytics
- Course progress percentage
- Certificate eligibility

**Pros:**
- Smooth video streaming
- Comprehensive progress tracking
- Multi-format content support

**Cons:**
- No offline viewing
- Limited interactive elements
- Basic quiz functionality

### 4. Live Class Experience
**Features:**
- Real-time video streaming
- Interactive polling system
- Live chat and reactions
- Hand-raising for questions
- Recording access post-session

**Technical Implementation:**
- Socket.IO for real-time communication
- HLS.js for video playback
- Signed URL validation
- Participant management

**Pros:**
- Engaging live sessions
- Real-time interaction
- Recording availability

**Cons:**
- **Connectivity dependent**
- **Scheduling conflicts**
- **Instructor availability issues**
- **No catch-up for missed sessions**

### 5. Assignment & Assessment
**Student Interface:**
- Assignment viewing with instructions
- File upload for submissions
- Submission status tracking
- Feedback viewing

**Pros:**
- Structured submission process
- File upload support

**Cons:**
- **Manual grading only** - no instant feedback
- **Delayed assessment** - depends on instructor availability
- **Scalability issues** - large classes create bottlenecks

**Recommendation:** Implement auto-grading for objective assessments
- MCQ auto-grading
- Coding challenge evaluation
- Instant feedback system

### 6. Community & Communication
**Discussion System:**
- Course-specific Q&A threads
- Real-time replies
- Upvoting system
- Instructor responses

**Doubt Tickets:**
- Direct instructor communication
- Priority-based resolution
- Status tracking

**Pros:**
- Active learning community
- Direct support access
- Knowledge sharing

**Cons:**
- Limited moderation
- No advanced search
- Thread management challenges

### 7. Progress Analytics
**Dashboard Features:**
- Course completion tracking
- Time spent visualization
- Achievement system
- Certificate management

**Pros:**
- Comprehensive progress view
- Motivational elements
- Completion recognition

**Cons:**
- Basic analytics
- No predictive insights
- Limited personalization

### 8. Payment & Wallet
**Integration:**
- Razorpay payment gateway
- Wallet balance management
- Transaction history
- Refund processing

**Pros:**
- Secure payment processing
- Transaction tracking
- Refund management

**Cons:**
- No subscription models
- Limited payment options
- No installment plans

## State Management (Redux)

### Core Slices
- **auth**: User authentication state
- **course**: Course data and enrollment
- **enrollment**: Learning progress
- **payment**: Transaction management
- **wallet**: Balance and payouts
- **liveclass**: Live session management

### Async Thunks
- API integration with error handling
- Loading states management
- Response caching
- Retry logic for failed requests

### Selectors
- Computed state derivation
- Performance optimization
- Reusable state access

## Real-time Features

### Socket.IO Integration
**Events:**
- Live class chat messages
- Poll updates and results
- Participant status changes
- Notification broadcasts

**Connection Management:**
- Automatic reconnection
- Room-based messaging
- Error handling
- State synchronization

## Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
- Touch-friendly interfaces
- Optimized video controls
- Collapsible navigation
- Progressive loading

## Performance Optimizations

### Code Splitting
- Route-based lazy loading
- Component lazy loading
- Vendor chunk separation

### Asset Optimization
- Image optimization
- Font loading
- CSS minimization
- JavaScript bundling

### Caching Strategies
- API response caching
- Static asset caching
- Service worker implementation

## Security Considerations

### Client-side Security
- Input sanitization
- XSS prevention
- CSRF token handling
- Secure storage practices

### API Security
- JWT token management
- Request signing
- Rate limiting awareness
- Error handling without data leakage

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- Redux logic testing
- Utility function testing

### Integration Testing
- API integration testing
- End-to-end user flows
- Cross-browser compatibility

## Deployment

### Build Process
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Environment Configuration
- Development, staging, production environments
- Environment-specific API endpoints
- Feature flags management

### CDN Integration
- Asset delivery optimization
- Video streaming optimization
- Global content delivery

## Browser Support

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Progressive Enhancement
- Graceful degradation
- Feature detection
- Fallback implementations

## Accessibility

### WCAG Compliance
- Semantic HTML
- Keyboard navigation
- Screen reader support
- Color contrast ratios

### Inclusive Design
- Responsive layouts
- Touch targets
- Font scaling
- Reduced motion preferences

## Future Enhancements

1. **Offline Learning**
   - Content downloading
   - Offline progress sync
   - Background sync

2. **Advanced Interactions**
   - Interactive quizzes
   - Branching scenarios
   - Gamification elements

3. **Mobile App**
   - React Native implementation
   - Native performance
   - Device integration

4. **AI-Powered Features**
   - Personalized recommendations
   - Smart search
   - Automated assessments

5. **Social Learning**
   - Study groups
   - Peer learning
   - Collaborative projects

## Maintenance

### Code Quality
- ESLint configuration
- Pre-commit hooks
- Code review processes
- Documentation standards

### Monitoring
- Error tracking
- Performance monitoring
- User analytics
- A/B testing framework

### Updates
- Dependency management
- Security patches
- Feature rollouts
- User feedback integration

---

*This frontend delivers an engaging, secure, and scalable learning experience for students on the Greed Hunter Academy platform.*
