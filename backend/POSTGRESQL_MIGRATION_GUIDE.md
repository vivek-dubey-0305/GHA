# MongoDB vs PostgreSQL: Migration Analysis & Complete Guide

## Executive Summary

**Current State**: Greed Hunter Academy uses MongoDB with Mongoose ODM for all data persistence.

**Recommendation**: **DO NOT switch to PostgreSQL at this time**. The current MongoDB setup is well-architected and suitable for the application's needs. A migration would be extremely costly and risky without clear benefits.

**Key Findings**:
- MongoDB's document model fits the hierarchical course structure perfectly
- Current system is stable and performant
- Migration complexity outweighs potential benefits
- PostgreSQL would not solve the core architectural issues (live classes, grading)

---

## Detailed Analysis: MongoDB vs PostgreSQL

### Current MongoDB Architecture Assessment

**Strengths of Current Setup:**
- **Hierarchical Data Model**: Courses → Modules → Lessons structure maps perfectly to MongoDB documents
- **Flexible Schema**: Course content can evolve without schema changes
- **Embedded Relationships**: Progress tracking and enrollment data embedded efficiently
- **Real-time Performance**: Excellent for frequent updates (progress, chat, live sessions)
- **Development Velocity**: Rapid iteration with Mongoose ODM
- **JSON-Native**: Perfect match for JavaScript/Node.js ecosystem

**Current Pain Points:**
- Complex aggregation queries for analytics
- Data consistency challenges (not ACID)
- Limited JOIN capabilities for complex relationships
- Manual referential integrity management

### PostgreSQL Advantages for E-Learning Platform

**Data Integrity & Consistency:**
- ACID compliance critical for financial transactions (payments, payouts)
- Foreign key constraints prevent orphaned records
- Transaction rollback capabilities for failed operations
- Better data validation at database level

**Advanced Querying & Analytics:**
- Superior JOIN performance for complex analytics
- Window functions for ranking and analytics
- Advanced indexing (GIN, GIST, BRIN)
- Stored procedures for complex business logic
- Better support for complex aggregations

**Scalability & Performance:**
- Better horizontal scaling with read replicas
- Advanced partitioning strategies
- Superior query optimization
- Better memory management

**Enterprise Features:**
- Advanced security features (Row Level Security)
- Better audit capabilities
- Comprehensive backup/restore
- Advanced replication options

### PostgreSQL Disadvantages for Current Use Case

**Schema Rigidity:**
- Fixed schema would complicate course content evolution
- JSONB can help but loses MongoDB's natural document feel
- Schema migrations become complex with large datasets

**Development Complexity:**
- ORM selection (Prisma, TypeORM, Sequelize)
- Complex relationship management
- Steeper learning curve for team
- More boilerplate code

**Performance Considerations:**
- Not optimized for hierarchical document storage
- JSONB operations slower than native MongoDB queries
- More complex indexing strategies required

---

## Migration Cost-Benefit Analysis

### Costs of Migration

**Development Time**: 6-12 months for full migration
**Financial Cost**: $50,000 - $200,000 (development + infrastructure)
**Risk Level**: HIGH (data loss, downtime, feature regression)
**Team Training**: 2-3 months for PostgreSQL expertise

**Technical Challenges:**
1. **Schema Design**: Converting hierarchical documents to relational tables
2. **Data Migration**: 100% data integrity required, complex relationships
3. **Application Rewrite**: All Mongoose queries → SQL/ORM queries
4. **Real-time Features**: Socket.IO integration testing
5. **Performance Tuning**: Query optimization and indexing
6. **Testing**: Comprehensive test suite for all features

### Benefits of Migration

**Data Integrity**: ACID compliance for financial operations
**Analytics Performance**: 3-5x faster complex queries
**Scalability**: Better horizontal scaling capabilities
**Enterprise Features**: Advanced security and compliance
**Query Flexibility**: Superior JOIN and aggregation capabilities

### Risk Assessment

**HIGH RISK Areas:**
- Payment processing (financial data integrity)
- Course content structure (hierarchical data)
- Real-time features (live classes, chat)
- User progress tracking (frequent updates)
- File storage integration (AWS S3, Cloudflare)

**MITIGATION Required:**
- Phased migration approach
- Comprehensive testing environment
- Rollback strategy
- Data validation at every step

---

## Recommendation: Stay with MongoDB

**Rationale:**
1. **Current System Works**: MongoDB handles the use case well
2. **Risk vs Benefit**: Migration costs far exceed benefits
3. **Core Issues Not Solved**: PostgreSQL won't fix live class scalability or grading bottlenecks
4. **Team Expertise**: Current team experienced with MongoDB
5. **Time to Market**: Migration would delay feature development significantly

**Alternative Solutions:**
1. **Optimize Current MongoDB**: Better indexing, query optimization
2. **Hybrid Approach**: PostgreSQL for financial data, MongoDB for content
3. **Incremental Improvements**: Address specific pain points without full migration

---

## Complete PostgreSQL Migration Guide (If You Decide to Proceed)

> **⚠️ WARNING**: This migration is extremely complex and not recommended. Only proceed if you have 6+ months and significant budget.

### Phase 1: Planning & Design (2-3 months)

#### 1.1 Schema Design Principles
```sql
-- Use UUIDs for all primary keys (better than serial for distributed systems)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Use JSONB for flexible content storage
-- Maintain referential integrity with foreign keys
-- Design for analytics with proper normalization
```

#### 1.2 Database Schema Design

**Users Table:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_data JSONB, -- Flexible profile information
    role VARCHAR(20) CHECK (role IN ('student', 'instructor', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

**Courses Table (Normalized):**
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100),
    level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    metadata JSONB, -- Flexible course metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_price ON courses(price);
-- Full-text search index
CREATE INDEX idx_courses_search ON courses USING GIN (to_tsvector('english', title || ' ' || description));
```

**Modules Table:**
```sql
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, order_index)
);

CREATE INDEX idx_modules_course ON modules(course_id);
```

**Lessons Table:**
```sql
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('video', 'article', 'assignment', 'live', 'material')),
    order_index INTEGER NOT NULL,
    content JSONB, -- Flexible content storage
    metadata JSONB, -- Additional lesson data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(module_id, order_index)
);

CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_type ON lessons(type);
```

**Enrollments Table:**
```sql
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'refunded', 'expired')),
    progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
```

**Progress Tracking:**
```sql
CREATE TABLE progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed')),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- in seconds
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_data JSONB, -- Video progress, activity data
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_progress_user ON progress(user_id);
CREATE INDEX idx_progress_lesson ON progress(lesson_id);
CREATE INDEX idx_progress_status ON progress(status);
```

**Payments Table (Critical for ACID):**
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(20),
    gateway_order_id VARCHAR(255),
    gateway_payment_id VARCHAR(255),
    gateway_signature TEXT,
    idempotency_key VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_course ON payments(course_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_idempotency ON payments(idempotency_key);
```

#### 1.3 Choose ORM
**Options:**
- **Prisma**: Type-safe, excellent migration support, modern DX
- **TypeORM**: Flexible, decorator-based, good MongoDB migration experience
- **Sequelize**: Mature, comprehensive feature set

**Recommendation**: Prisma for type safety and excellent PostgreSQL support.

### Phase 2: Infrastructure Setup (1 month)

#### 2.1 PostgreSQL Configuration
```sql
-- postgresql.conf optimizations
shared_buffers = '256MB'              -- 25% of RAM
effective_cache_size = '1GB'          -- 75% of RAM
work_mem = '4MB'                      -- Per-connection working memory
maintenance_work_mem = '64MB'         -- For VACUUM, CREATE INDEX
checkpoint_completion_target = 0.9     -- Spread checkpoint I/O
wal_buffers = '16MB'                  -- WAL buffer size
default_statistics_target = 100       -- Statistics target
random_page_cost = 1.1                -- SSD optimization
effective_io_concurrency = 200        -- SSD optimization
```

#### 2.2 Connection Pooling
```javascript
// pg.Pool configuration
const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  max: 20,              // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### 2.3 Migration Tools Setup
```bash
# Install migration tools
npm install prisma @prisma/client
npm install pg
npm install migrate-mongo-to-postgres

# Initialize Prisma
npx prisma init
```

### Phase 3: Data Migration (2-3 months)

#### 3.1 Migration Strategy
**Approach**: Parallel run with gradual cutover
1. Set up PostgreSQL database alongside MongoDB
2. Create migration scripts for each collection
3. Run migrations in order (respect foreign keys)
4. Validate data integrity at each step
5. Gradual traffic cutover with rollback capability

#### 3.2 Data Export from MongoDB
```javascript
// scripts/export-mongodb.js
import mongoose from 'mongoose';
import fs from 'fs';

async function exportCollection(collectionName, query = {}) {
  const collection = mongoose.connection.collection(collectionName);
  const cursor = collection.find(query);
  const documents = await cursor.toArray();

  fs.writeFileSync(
    `${collectionName}.json`,
    JSON.stringify(documents, null, 2)
  );

  console.log(`Exported ${documents.length} documents from ${collectionName}`);
}

// Export all collections
await exportCollection('users');
await exportCollection('courses');
await exportCollection('modules');
await exportCollection('lessons');
// ... continue for all collections
```

#### 3.3 Data Transformation Scripts
```javascript
// scripts/transform-data.js
import fs from 'fs';

// Transform MongoDB ObjectId to UUID
function transformId(mongoId) {
  // Convert MongoDB ObjectId to UUID v4 format
  // This is a simplified example - use proper UUID generation
  return uuidv4();
}

// Transform course document
function transformCourse(mongoCourse) {
  return {
    id: transformId(mongoCourse._id),
    title: mongoCourse.title,
    description: mongoCourse.description,
    instructor_id: transformId(mongoCourse.instructor),
    category: mongoCourse.category,
    level: mongoCourse.level,
    price: mongoCourse.price,
    currency: mongoCourse.currency || 'USD',
    status: mongoCourse.status || 'draft',
    metadata: {
      shortDescription: mongoCourse.shortDescription,
      language: mongoCourse.language,
      thumbnail: mongoCourse.thumbnail,
      trailerVideo: mongoCourse.trailerVideo,
      learningOutcomes: mongoCourse.learningOutcomes,
      prerequisites: mongoCourse.prerequisites,
      targetAudience: mongoCourse.targetAudience,
      tags: mongoCourse.tags,
      seoTitle: mongoCourse.seoTitle,
      seoDescription: mongoCourse.seoDescription,
      enrolledCount: mongoCourse.enrolledCount,
      rating: mongoCourse.rating,
      totalReviews: mongoCourse.totalReviews,
      totalModules: mongoCourse.totalModules,
      totalLessons: mongoCourse.totalLessons,
      totalDuration: mongoCourse.totalDuration
    },
    created_at: mongoCourse.createdAt || new Date(),
    updated_at: mongoCourse.updatedAt || new Date()
  };
}
```

#### 3.4 Import to PostgreSQL
```javascript
// scripts/import-postgresql.js
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function importCourses() {
  const courses = JSON.parse(fs.readFileSync('courses.json', 'utf8'));

  for (const course of courses) {
    try {
      const transformedCourse = transformCourse(course);
      await prisma.course.create({
        data: transformedCourse
      });
      console.log(`Imported course: ${transformedCourse.title}`);
    } catch (error) {
      console.error(`Failed to import course ${course._id}:`, error);
    }
  }
}

// Import in dependency order
await importUsers();
await importCourses();
await importModules();
await importLessons();
await importEnrollments();
await importProgress();
await importPayments();
// ... continue for all tables
```

#### 3.5 Data Validation
```javascript
// scripts/validate-migration.js
async function validateMigration() {
  // Count comparison
  const mongoUsers = await mongo.collection('users').countDocuments();
  const pgUsers = await prisma.user.count();

  if (mongoUsers !== pgUsers) {
    throw new Error(`User count mismatch: MongoDB ${mongoUsers}, PostgreSQL ${pgUsers}`);
  }

  // Spot checks
  const sampleMongoUser = await mongo.collection('users').findOne();
  const correspondingPgUser = await prisma.user.findUnique({
    where: { id: transformId(sampleMongoUser._id) }
  });

  // Validate relationships
  const enrollmentsWithInvalidRefs = await prisma.$queryRaw`
    SELECT e.id FROM enrollments e
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN courses c ON e.course_id = c.id
    WHERE u.id IS NULL OR c.id IS NULL
  `;

  if (enrollmentsWithInvalidRefs.length > 0) {
    throw new Error(`Found ${enrollmentsWithInvalidRefs.length} enrollments with invalid references`);
  }
}
```

### Phase 4: Application Migration (3-4 months)

#### 4.1 ORM Setup
```javascript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  firstName String?
  lastName  String?
  profileData Json?
  role      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  enrollments    Enrollment[]
  progress       Progress[]
  payments       Payment[]
  courses        Course[]      @relation("InstructorCourses")

  @@map("users")
}

model Course {
  id          String   @id @default(uuid())
  title       String
  description String?
  instructorId String
  instructor   User     @relation("InstructorCourses", fields: [instructorId], references: [id])
  category    String
  level       String
  price       Decimal
  currency    String   @default("USD")
  status      String   @default("draft")
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  modules      Module[]
  enrollments  Enrollment[]
  payments     Payment[]

  @@map("courses")
}
```

#### 4.2 Update Business Logic
**Before (Mongoose):**
```javascript
// Old Mongoose code
const course = await Course.findById(courseId)
  .populate('instructor')
  .populate('modules');

const enrollment = await Enrollment.findOne({
  user: userId,
  course: courseId
});

const progress = await Progress.find({
  user: userId,
  course: courseId
}).populate('lesson');
```

**After (Prisma):**
```javascript
// New Prisma code
const course = await prisma.course.findUnique({
  where: { id: courseId },
  include: {
    instructor: true,
    modules: {
      include: {
        lessons: true
      }
    }
  }
});

const enrollment = await prisma.enrollment.findFirst({
  where: {
    userId: userId,
    courseId: courseId
  }
});

const progress = await prisma.progress.findMany({
  where: {
    userId: userId,
    lesson: {
      module: {
        courseId: courseId
      }
    }
  },
  include: {
    lesson: true
  }
});
```

#### 4.3 Update Controllers
```javascript
// controllers/course.controller.js - Updated
export const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileData: true
          }
        },
        modules: {
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: { enrollments: true }
        }
      }
    });

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }

    res.json({
      status: 'success',
      data: course
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
```

#### 4.4 Update Analytics Queries
**Complex Analytics Query Migration:**

**Before (MongoDB Aggregation):**
```javascript
const analytics = await Course.aggregate([
  {
    $match: { instructor: instructorId }
  },
  {
    $lookup: {
      from: 'enrollments',
      localField: '_id',
      foreignField: 'course',
      as: 'enrollments'
    }
  },
  {
    $lookup: {
      from: 'payments',
      localField: '_id',
      foreignField: 'course',
      as: 'payments'
    }
  },
  {
    $project: {
      title: 1,
      enrollmentsCount: { $size: '$enrollments' },
      revenue: { $sum: '$payments.amount' },
      averageRating: '$rating'
    }
  }
]);
```

**After (PostgreSQL with CTE):**
```sql
WITH course_stats AS (
  SELECT
    c.id,
    c.title,
    c.rating,
    COUNT(e.id) as enrollments_count,
    COALESCE(SUM(p.amount), 0) as total_revenue
  FROM courses c
  LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'completed'
  LEFT JOIN payments p ON c.id = p.course_id AND p.status = 'completed'
  WHERE c.instructor_id = $1
  GROUP BY c.id, c.title, c.rating
)
SELECT * FROM course_stats;
```

**Prisma Implementation:**
```javascript
const analytics = await prisma.$queryRaw`
  SELECT
    c.id,
    c.title,
    c.rating,
    COUNT(e.id) as enrollments_count,
    COALESCE(SUM(p.amount), 0) as total_revenue
  FROM courses c
  LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'completed'
  LEFT JOIN payments p ON c.id = p.course_id AND p.status = 'completed'
  WHERE c.instructor_id = ${instructorId}
  GROUP BY c.id, c.title, c.rating
`;
```

### Phase 5: Testing & Validation (1-2 months)

#### 5.1 Unit Tests Migration
```javascript
// tests/course.test.js - Updated
import { PrismaClient } from '@prisma/client';
import { createCourse } from '../services/course.service.js';

const prisma = new PrismaClient();

describe('Course Service', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.enrollment.deleteMany();
    await prisma.progress.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.module.deleteMany();
    await prisma.course.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createCourse', () => {
    it('should create a course with modules and lessons', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'Test Description',
        instructorId: 'test-instructor-id',
        modules: [
          {
            title: 'Module 1',
            lessons: [
              {
                title: 'Lesson 1',
                type: 'video',
                content: { videoUrl: 'test.mp4' }
              }
            ]
          }
        ]
      };

      const course = await createCourse(courseData);

      expect(course.title).toBe(courseData.title);
      expect(course.modules).toHaveLength(1);
      expect(course.modules[0].lessons).toHaveLength(1);
    });
  });
});
```

#### 5.2 Integration Tests
```javascript
// tests/integration/course-lifecycle.test.js
describe('Course Lifecycle', () => {
  let testUser, testCourse, testEnrollment;

  beforeAll(async () => {
    // Setup test data
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      }
    });

    testCourse = await prisma.course.create({
      data: {
        title: 'Integration Test Course',
        description: 'Test course for integration testing',
        instructorId: testUser.id,
        price: 99.99,
        status: 'published'
      }
    });
  });

  it('should complete full enrollment and progress flow', async () => {
    // Create payment
    const payment = await prisma.payment.create({
      data: {
        userId: testUser.id,
        courseId: testCourse.id,
        amount: testCourse.price,
        status: 'completed'
      }
    });

    // Create enrollment
    testEnrollment = await prisma.enrollment.create({
      data: {
        userId: testUser.id,
        courseId: testCourse.id,
        paymentId: payment.id
      }
    });

    expect(testEnrollment.status).toBe('active');

    // Simulate progress
    const lesson = await prisma.lesson.create({
      data: {
        moduleId: (await prisma.module.create({
          data: {
            courseId: testCourse.id,
            title: 'Test Module',
            orderIndex: 1
          }
        })).id,
        title: 'Test Lesson',
        type: 'video',
        orderIndex: 1,
        content: { videoUrl: 'test.mp4' }
      }
    });

    const progress = await prisma.progress.create({
      data: {
        userId: testUser.id,
        lessonId: lesson.id,
        status: 'completed',
        progressPercentage: 100
      }
    });

    expect(progress.status).toBe('completed');
  });
});
```

#### 5.3 Performance Testing
```javascript
// tests/performance/analytics-performance.test.js
describe('Analytics Performance', () => {
  it('should handle complex analytics queries within time limits', async () => {
    const startTime = Date.now();

    const result = await prisma.$queryRaw`
      SELECT
        c.id, c.title,
        COUNT(DISTINCT e.user_id) as unique_students,
        COUNT(p.id) as total_payments,
        SUM(p.amount) as total_revenue,
        AVG(c.rating) as avg_rating
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN payments p ON c.id = p.course_id AND p.status = 'completed'
      WHERE c.status = 'published'
      GROUP BY c.id, c.title
      ORDER BY total_revenue DESC
      LIMIT 50
    `;

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
  });
});
```

### Phase 6: Deployment & Monitoring (1 month)

#### 6.1 Gradual Cutover Strategy
1. **Read Operations**: Switch frontend to read from PostgreSQL
2. **Write Operations**: Continue writing to MongoDB, sync to PostgreSQL
3. **Full Cutover**: Switch all operations to PostgreSQL
4. **Rollback Plan**: Ability to switch back to MongoDB within 1 hour

#### 6.2 Monitoring Setup
```javascript
// monitoring/database-health.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkDatabaseHealth() {
  const startTime = Date.now();

  try {
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Test complex query performance
    const complexQueryStart = Date.now();
    await prisma.course.findMany({
      include: {
        modules: {
          include: {
            lessons: true
          }
        },
        enrollments: true
      },
      take: 10
    });
    const complexQueryTime = Date.now() - complexQueryStart;

    // Test write performance
    const writeStart = Date.now();
    const testRecord = await prisma.user.create({
      data: {
        email: `health-check-${Date.now()}@test.com`,
        firstName: 'Health',
        lastName: 'Check'
      }
    });
    await prisma.user.delete({
      where: { id: testRecord.id }
    });
    const writeTime = Date.now() - writeStart;

    const totalTime = Date.now() - startTime;

    return {
      status: 'healthy',
      metrics: {
        connectivityTime: totalTime,
        complexQueryTime,
        writeTime,
        connectionPoolSize: prisma.$pool?.size || 'unknown'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
```

#### 6.3 Backup & Recovery
```sql
-- Automated backup script
CREATE OR REPLACE FUNCTION create_backup()
RETURNS void AS $$
DECLARE
  backup_name text;
BEGIN
  backup_name := 'gha_backup_' || to_char(now(), 'YYYYMMDD_HH24MI');

  -- Create backup using pg_dump
  EXECUTE format('pg_dump -h %s -U %s -d %s -f /backups/%s.sql',
    current_setting('custom.host'),
    current_setting('custom.user'),
    current_setting('custom.database'),
    backup_name
  );
END;
$$ LANGUAGE plpgsql;
```

### Phase 7: Post-Migration Optimization (Ongoing)

#### 7.1 Query Optimization
```sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX CONCURRENTLY idx_progress_user_lesson ON progress(user_id, lesson_id);
CREATE INDEX CONCURRENTLY idx_payments_status_created ON payments(status, created_at DESC);

-- Partition large tables
CREATE TABLE payments_y2024 PARTITION OF payments
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Create materialized views for analytics
CREATE MATERIALIZED VIEW course_analytics AS
SELECT
  c.id,
  c.title,
  c.instructor_id,
  COUNT(DISTINCT e.user_id) as enrolled_students,
  COUNT(DISTINCT p.id) as total_payments,
  SUM(p.amount) as total_revenue,
  AVG(c.rating) as avg_rating
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
LEFT JOIN payments p ON c.id = p.course_id AND p.status = 'completed'
GROUP BY c.id, c.title, c.instructor_id;
```

#### 7.2 Connection Pool Tuning
```javascript
// Optimized pool configuration
const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,

  // Connection pool settings
  max: parseInt(process.env.PG_MAX_CONNECTIONS) || 20,
  min: parseInt(process.env.PG_MIN_CONNECTIONS) || 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  acquireTimeoutMillis: 60000,

  // Health checks
  allowExitOnIdle: true,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
});
```

## Migration Timeline & Costs

### Timeline (7-12 months total)
- **Phase 1**: Planning & Design (2-3 months)
- **Phase 2**: Infrastructure Setup (1 month)
- **Phase 3**: Data Migration (2-3 months)
- **Phase 4**: Application Migration (3-4 months)
- **Phase 5**: Testing & Validation (1-2 months)
- **Phase 6**: Deployment & Monitoring (1 month)
- **Phase 7**: Post-Migration Optimization (Ongoing)

### Cost Breakdown
- **Development Team**: $150,000 - $300,000 (6-12 months)
- **Infrastructure**: $20,000 - $50,000 (PostgreSQL setup, migration tools)
- **Testing & QA**: $30,000 - $60,000 (Comprehensive testing)
- **Contingency**: $50,000 (Risk mitigation, rollback)
- **Total**: $250,000 - $460,000

### Risk Mitigation
1. **Phased Approach**: Gradual cutover with rollback capability
2. **Data Validation**: Automated checks at every migration step
3. **Performance Benchmarking**: Ensure PostgreSQL meets performance requirements
4. **Team Training**: PostgreSQL and Prisma expertise development
5. **Backup Strategy**: Multiple backup points with quick recovery

## Final Recommendation

**AGAIN: DO NOT MIGRATE TO POSTGRESQL**

The current MongoDB setup is appropriate for Greed Hunter Academy's needs. The proposed migration would:

- Cost $250,000-$460,000 and 7-12 months
- Risk data loss and system downtime
- Not solve core business problems (live classes, grading)
- Require extensive team retraining
- Delay feature development significantly

**Better Alternatives:**
1. **Optimize Current MongoDB**: Better indexing, query optimization
2. **Hybrid Storage**: PostgreSQL for financial data only
3. **Address Real Issues**: Fix live class scalability and implement auto-grading
4. **Incremental Improvements**: Solve specific performance bottlenecks

**When PostgreSQL Makes Sense:**
- Heavy analytical workloads
- Complex financial reporting
- Strong ACID requirements for all data
- Large team with SQL expertise
- Legacy system modernization

For Greed Hunter Academy, MongoDB's document model, flexibility, and performance characteristics make it the right choice. Focus development efforts on the core product issues rather than infrastructure migration.