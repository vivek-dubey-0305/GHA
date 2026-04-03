# Greed Hunter Academy - Backend

## Overview
The backend is a Node.js/Express API server that powers the Greed Hunter Academy platform. It provides RESTful endpoints for course management, user authentication, payments, live streaming, and real-time features using Socket.IO.

## Tech Stack
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js v5.2.1
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens, OTP verification
- **Payments**: Razorpay integration
- **Live Streaming**: Cloudflare Stream (migrated from Bunny)
- **File Storage**: AWS S3
- **Caching**: Redis
- **Real-time**: Socket.IO
- **Email**: Nodemailer
- **Security**: Helmet, CORS, CSRF protection, rate limiting

## Architecture

### Project Structure
```
backend/
├── app.js                 # Express app configuration
├── server.js              # Server startup with Socket.IO
├── configs/               # Configuration files
│   ├── app.config.js      # App settings
│   ├── connection.config.js # DB connection
│   ├── env.config.js      # Environment validation
│   ├── logger.config.js   # Logging setup
│   └── ...
├── constants/             # Application constants
├── controllers/           # Route handlers
├── middlewares/           # Express middlewares
├── models/                # Mongoose schemas
├── routes/                # API route definitions
├── services/              # Business logic layer
├── utils/                 # Utility functions
├── seeds/                 # Database seeding
├── scripts/               # Maintenance scripts
└── templates/             # Email templates
```

### Key Models

#### User Management
- **User**: Student accounts with profile, enrollment tracking
- **Instructor**: Teaching staff with verification, wallet management
- **Admin**: Platform administrators

#### Content Models
- **Course**: Hierarchical structure (Course → Modules → Lessons)
- **Lesson**: Multiple types (video, article, assignment, live, material)
- **VideoPackage**: Video content with Bunny/Cloudflare integration
- **Assignment**: Student submissions with grading
- **Material**: Downloadable resources

#### Engagement Models
- **Enrollment**: Student progress tracking, certificates
- **Progress**: Lesson-level completion tracking
- **Discussion**: Q&A threads with replies
- **Review**: Course ratings and feedback
- **Notification**: Real-time notifications

#### Live Features
- **LiveClass**: Scheduled/Instant sessions with Cloudflare Stream
- **Poll**: Real-time polling during live classes
- **PollVote**: Student responses with timing

#### Business Models
- **Payment**: Razorpay transactions with webhook verification
- **Payout**: Instructor earnings and withdrawals
- **Coupon**: Discount codes
- **Announcement**: Platform-wide notifications

## Core Features

### 1. Authentication & Authorization
**Pros:**
- Secure JWT implementation with refresh tokens
- OTP-based email verification
- Session management (max 5 concurrent sessions)
- Role-based access control (User/Instructor/Admin)
- Password security with bcrypt hashing

**Cons:**
- Email dependency for OTP can cause delays
- No social login options
- Password reset requires email access

**Security:**
- Helmet for security headers
- CORS configuration
- CSRF protection on sensitive endpoints
- Rate limiting on auth endpoints
- Input validation and sanitization

### 2. Course Management
**Course Types:**
- **Recorded Courses**: Video-based learning with modules/lessons
- **Live Classes**: Scheduled interactive sessions
- **Assignments**: Graded submissions
- **Materials**: Downloadable resources

**Flow:**
1. Instructor creates course with modules and lessons
2. Course published after content completion
3. Students enroll via payment or free access
4. Progress tracked per lesson
5. Certificate issued on completion

**Pros:**
- Flexible content types
- Hierarchical organization
- Progress tracking
- Certificate generation

**Cons:**
- Complex creation workflow
- No course versioning
- Limited content preview

### 3. Live Classes & Streaming
**Implementation:**
- Cloudflare Stream for video delivery
- RTMP ingest for instructor broadcasting
- HLS playback for students
- Auto-recording with signed URLs

**Session Types:**
- `lecture`: Course lectures (all enrolled)
- `doubt`: Q&A sessions (invited students)
- `instant`: Ad-hoc sessions
- `instructor`: Peer sessions
- `business`: Admin calls

**Real-time Features:**
- Socket.IO for chat, reactions, hand-raising
- Live polling with voting and results
- Participant management
- Recording access post-session

**Pros:**
- High-quality streaming
- Interactive features
- Auto-recording
- Scalable delivery

**Cons:**
- **Critical Drawback**: For new enrollments, instructor must go live each time
  - Course published once, but live sessions require instructor presence for every new student
  - No batch scheduling - each enrollment triggers separate live requirement
  - **Recommendation**: Separate batch-based courses from live sessions
  - **Better Approach**: Recorded content + optional live Q&A batches

**Security:**
- Signed playback URLs (time-limited)
- Instructor-only RTMP credentials
- Enrollment verification for access

### 4. Payment & Enrollment
**Payment Flow:**
1. Student initiates enrollment
2. Razorpay order creation
3. Payment completion with signature verification
4. Webhook confirmation for settlement
5. Enrollment creation with access provisioning

**Pros:**
- Secure Razorpay integration
- Webhook verification prevents fraud
- Idempotent operations
- Wallet system for instructors

**Cons:**
- No partial payments
- No subscription models
- Limited currency support

### 5. Progress & Learning Analytics
**Tracking:**
- Lesson-level progress (video watch time, completion)
- Course completion percentage
- Time spent analytics
- Certificate eligibility

**Pros:**
- Detailed progress tracking
- Time-based analytics
- Completion certificates

**Cons:**
- No learning path recommendations
- Limited gamification
- No adaptive learning

### 6. Communication & Community
**Features:**
- Discussion threads per course
- Real-time notifications
- Doubt ticket system
- Review and rating system

**Pros:**
- Active community building
- Instructor-student interaction
- Real-time updates

**Cons:**
- No moderation tools
- Limited search in discussions

### 7. Assignment & Grading
**System:**
- Assignment creation with files/materials
- Student submissions
- Manual grading by instructors

**Pros:**
- File upload support
- Structured grading

**Cons:**
- **Manual Grading Drawback**: No auto-grading capabilities
  - Every submission requires instructor review
  - Scalability issues with large classes
  - Delayed feedback for students
  - **Recommendation**: Implement auto-grading for objective questions
  - **Technical Feasibility**: Add question types (MCQ, coding challenges)
  - **Benefits**: Instant feedback, reduced instructor workload
  - **Implementation**: Code execution environments, test case validation

### 8. Analytics & Reporting
**Instructor Analytics:**
- Revenue tracking
- Enrollment trends
- Student engagement metrics
- Course performance

**Admin Analytics:**
- Platform-wide metrics
- User management
- Financial reporting

**Pros:**
- Comprehensive dashboards
- Real-time data

**Cons:**
- No predictive analytics
- Limited export options

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login with OTP
- `POST /api/v1/auth/verify-otp` - OTP verification
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/logout` - Logout

### Courses
- `GET /api/v1/courses` - Public course listing
- `POST /api/v1/courses` - Create course (Instructor)
- `GET /api/v1/courses/:id` - Course details
- `PUT /api/v1/courses/:id/full` - Update full course

### Live Classes
- `GET /api/v1/live-classes` - Public upcoming classes
- `POST /api/v1/live-classes` - Create session
- `POST /api/v1/live-classes/:id/register` - Student registration
- `GET /api/v1/live-classes/:id/rtmp` - RTMP credentials (Instructor)

### Payments
- `POST /api/v1/payments/initiate` - Create payment order
- `POST /api/v1/payments/verify` - Verify payment
- `POST /api/v1/payments/webhook` - Razorpay webhook

### Progress
- `POST /api/v1/progress/lesson/:lessonId` - Update progress
- `GET /api/v1/progress/course/:courseId` - Course progress

## Security Considerations

### Authentication Security
- JWT tokens with short expiry (15min access, 30d refresh)
- Secure cookie storage with httpOnly
- Password hashing with bcrypt
- OTP rate limiting (60s cooldown)

### API Security
- Input validation with Joi/Mongoose schemas
- SQL injection prevention (MongoDB)
- XSS protection with DOMPurify
- Rate limiting on sensitive endpoints
- CORS policy enforcement

### Data Security
- Environment variable validation on startup
- Sensitive data encryption
- Secure file upload handling
- Audit logging for critical operations

### Infrastructure Security
- Helmet security headers
- HTTPS enforcement
- CSRF protection
- Request size limits

## Performance Optimizations

### Database
- Strategic indexing on frequently queried fields
- Aggregation pipelines for analytics
- Connection pooling
- Query optimization

### Caching
- Redis for session storage
- Response caching for public data
- CDN integration for media files

### Real-time
- Socket.IO rooms for efficient broadcasting
- Connection limits and cleanup
- Message queuing for high load

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Redis for shared state
- Database read replicas
- Load balancer configuration

### Content Delivery
- Cloudflare CDN for video streaming
- AWS S3 for file storage
- Regional deployment options

### Monitoring
- Error logging and tracking
- Performance monitoring
- Database query analysis
- Real-time metrics

## Deployment

### Environment Setup
```bash
# Install dependencies
npm install

# Environment configuration
cp .env.example .env
# Configure MongoDB, Redis, AWS, Razorpay, etc.

# Development
npm run dev

# Production
npm start
```

### Docker Support
- Containerized deployment
- Multi-stage builds
- Environment-specific configurations

### CI/CD
- Automated testing
- Build pipelines
- Deployment scripts

## Future Enhancements

1. **Auto-Grading System**
   - MCQ auto-grading
   - Code execution environments
   - Plagiarism detection

2. **Advanced Live Features**
   - Breakout rooms
   - Screen sharing
   - Whiteboard integration

3. **Learning Analytics**
   - Predictive learning paths
   - AI-powered recommendations
   - Advanced reporting

4. **Mobile API**
   - REST API optimization for mobile
   - Push notifications
   - Offline content sync

5. **Multi-Tenant Support**
   - Organization management
   - Custom branding
   - Isolated data environments

## Maintenance

### Database Migrations
- Schema versioning
- Data migration scripts
- Backup procedures

### Monitoring & Alerting
- Error tracking
- Performance monitoring
- Security incident response

### Backup & Recovery
- Automated backups
- Disaster recovery plans
- Data retention policies

---

*This backend powers a comprehensive e-learning platform with modern architecture, security best practices, and scalable design.*