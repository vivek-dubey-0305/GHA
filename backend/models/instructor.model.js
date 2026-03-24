import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { convertToMilliseconds } from "../utils/time.utils.js";

/**
 * Instructor Model — Production Grade
 * ════════════════════════════════════
 *
 * Profile fields follow a clear hierarchy to avoid any duplication:
 *
 *   specializations[] → Domain-level expertise (Web Development, ML, Design)
 *                        Used as filter chips on listing + cards on detail page
 *
 *   skills[]          → Technology/tool proficiency with percentage
 *                        (Node.js 98%, AWS 95%) → skills bar card on detail page
 *
 *   tags[]            → Free-text SEO/search keywords
 *                        Drives text-search index + searchable keywords
 *
 *   workExperience[]  → Career timeline (company, role, date range, tech stack)
 *                        Drives the experience timeline on detail page
 *
 *   qualifications[]  → Education + certifications (degree OR cert, unified model)
 *                        Drives qualification grid on detail page
 *
 *   achievements[]    → Awards, speaking, publications, milestones
 *                        Drives achievements card on detail page
 *
 *   yearsOfExperience → Denormalised number for quick sort/filter on listing
 *                        (Instructor keeps this in sync manually; virtual also computes it)
 *
 * Financial data:
 *   Wallet + Payout models handle all earnings / withdrawal logic.
 *   No bank/card data is stored here (PCI DSS compliance).
 *
 * Streaming:
 *   One Cloudflare Live Input per instructor, reused across all live sessions.
 *   RTMP credentials live here; per-session recording lives on LiveClass model.
 */

// ─────────────────────────────────────────────
//  SUB-SCHEMAS
// ─────────────────────────────────────────────

/**
 * Work Experience entry — Career timeline
 * companyType drives the listing-page "Background" filter.
 */
const workExperienceSchema = new mongoose.Schema({
    company: {
        type: String,
        required: [true, "Company name is required"],
        trim: true,
        maxlength: [100, "Company name cannot exceed 100 characters"]
    },
    role: {
        type: String,
        required: [true, "Role is required"],
        trim: true,
        maxlength: [100, "Role cannot exceed 100 characters"]
    },
    companyType: {
        type: String,
        enum: ["faang", "startup", "research", "corporate", "freelance", "academic"],
        default: "corporate"
    },
    startMonth: {
        type: Number,
        min: 1,
        max: 12
    },
    startYear: {
        type: Number,
        required: [true, "Start year is required"],
        min: 1970,
        max: new Date().getFullYear()
    },
    endMonth: {
        type: Number,
        min: 1,
        max: 12,
        default: null
    },
    endYear: {
        type: Number,
        min: 1970,
        default: null
    },
    isCurrent: {
        type: Boolean,
        default: false   // true → shows "Present" instead of endYear
    },
    description: {
        type: String,
        trim: true,
        maxlength: [600, "Description cannot exceed 600 characters"]
    },
    techStack: [{
        type: String,
        trim: true,
        maxlength: 40
    }],
    location: {
        type: String,
        trim: true,
        maxlength: 100
    }
}, { _id: true });

/**
 * Qualification entry — covers both academic degrees AND certifications.
 * `entryType` distinguishes them.
 *   "degree"      → B.S. Computer Science, M.S. Distributed Systems
 *   "certification" → AWS SA Pro, CKA, PMP
 *   "bootcamp"    → General Assembly, Le Wagon
 *   "online_course" → Specialised course completion
 */
const qualificationSchema = new mongoose.Schema({
    entryType: {
        type: String,
        enum: ["degree", "certification", "bootcamp", "online_course"],
        default: "degree"
    },
    title: {
        type: String,
        required: [true, "Qualification title is required"],
        trim: true,
        maxlength: [150, "Title cannot exceed 150 characters"]
    },
    institution: {
        type: String,
        required: [true, "Institution is required"],
        trim: true,
        maxlength: [150, "Institution cannot exceed 150 characters"]
    },
    fieldOfStudy: {
        type: String,
        trim: true,
        maxlength: 100
    },
    startYear: {
        type: Number,
        min: 1950,
        max: new Date().getFullYear()
    },
    endYear: {
        type: Number,
        min: 1950,
        max: new Date().getFullYear() + 6
    },
    isOngoing: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        trim: true,
        maxlength: [400, "Description cannot exceed 400 characters"]
    },
    credentialId: {
        type: String,
        trim: true,
        maxlength: 100
    },
    credentialUrl: {
        type: String,
        trim: true,
        maxlength: 300
    },
    isVerified: {
        type: Boolean,
        default: false   // Admin-verified credential
    },
    icon: {
        type: String,
        trim: true,
        maxlength: 40,
        default: "GraduationCap"
    }
}, { _id: true });

/**
 * Specialization entry — Domain-level expertise areas.
 * `category` maps to the same keys used in Course model's CATEGORY_MAP
 * so instructors and courses stay aligned.
 *
 * These appear as:
 *  - Filter chips on the listing sidebar ("Web Dev", "Machine Learning")
 *  - Spec tag pills on listing cards
 *  - Specialization cards on the detail page
 */
const specializationSchema = new mongoose.Schema({
    area: {
        type: String,
        required: [true, "Specialization area is required"],
        trim: true,
        maxlength: 60
        // Display label: "Web Development", "Machine Learning", "UI/UX Design"
    },
    category: {
        // Corresponds to Course model CATEGORY_MAP keys for cross-linking
        type: String,
        enum: [
            "web_development", "mobile_app_development", "data_science",
            "artificial_intelligence", "machine_learning", "cloud_computing",
            "cybersecurity", "devops", "blockchain", "design",
            "business", "soft_skills", "other"
        ],
        required: [true, "Specialization category is required"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, "Description cannot exceed 200 characters"]
        // e.g. "Design fault-tolerant distributed systems. CAP theorem, consensus algorithms."
    },
    icon: {
        type: String,
        trim: true,
        maxlength: 40,
        default: "Sparkles"
        // emoji: "⚡", "🔗", "☁️", "🎯", etc.
    },
    isPrimary: {
        type: Boolean,
        default: false
        // First/primary specialization shown prominently in cards
    }
}, { _id: true });

/**
 * Skill entry — Specific technology/tool with proficiency percentage.
 * Distinct from specializations (domain areas) and tags (SEO keywords).
 * Drives the skills bar visual on the detail page.
 */
const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Skill name is required"],
        trim: true,
        maxlength: 60
        // e.g. "Node.js / TypeScript", "AWS / Cloud Architecture", "Kubernetes"
    },
    proficiency: {
        type: Number,
        required: [true, "Proficiency percentage is required"],
        min: [1, "Proficiency must be at least 1"],
        max: [100, "Proficiency cannot exceed 100"]
    },
    category: {
        type: String,
        enum: ["language", "framework", "tool", "cloud", "database", "other"],
        default: "other"
    },
    displayOrder: {
        type: Number,
        default: 0
        // Controls order of skill bars rendered on profile
    }
}, { _id: true });

/**
 * Achievement entry — Awards, speaking, publications, milestones.
 * Drives the achievements card on the detail page.
 */
const achievementSchema = new mongoose.Schema({
    icon: {
        type: String,
        trim: true,
        maxlength: 40,
        default: "Trophy"
    },
    title: {
        type: String,
        required: [true, "Achievement title is required"],
        trim: true,
        maxlength: [150, "Title cannot exceed 150 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, "Description cannot exceed 200 characters"]
    },
    year: {
        type: Number,
        min: 1970,
        max: new Date().getFullYear() + 1
    },
    category: {
        type: String,
        enum: ["award", "speaking", "publication", "milestone", "certification", "media", "other"],
        default: "award"
    },
    url: {
        type: String,
        trim: true,
        maxlength: 300
    }
}, { _id: true });

// ─────────────────────────────────────────────
//  MAIN SCHEMA
// ─────────────────────────────────────────────

const instructorSchema = new mongoose.Schema({

    // ══════════════════════════════════════════
    //  BASIC INFORMATION (Auth-grade fields)
    // ══════════════════════════════════════════
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        maxlength: [50, "First name cannot exceed 50 characters"],
        minlength: [2, "First name must be at least 2 characters"]
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        maxlength: [50, "Last name cannot exceed 50 characters"],
        minlength: [2, "Last name must be at least 2 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        set: v => v.toLowerCase().trim(),
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please enter a valid email address"
        ]
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        match: [
            /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
            "Please enter a valid phone number"
        ]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters"],
        match: [
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
            "Password must include uppercase, lowercase, number, and special character"
        ],
        select: false
    },
    dateOfBirth: {
        type: Date,
        sparse: true
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other", "Prefer not to say"],
        default: null
    },
    address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },

    // ══════════════════════════════════════════
    //  MEDIA ASSETS
    // ══════════════════════════════════════════
    profilePicture: {
        public_id: { type: String },
        secure_url: { type: String }
        // Cloudinary/R2 — avatar shown on all cards and detail page
    },
    bannerImage: {
        public_id: { type: String },
        secure_url: { type: String }
        // Custom cover photo shown behind avatar on detail page hero
    },
    bannerColor: {
        type: String,
        default: "#111111",
        trim: true,
        maxlength: 9
        // Hex fallback when no bannerImage. Used for generated SVG banners on listing.
    },

    // ══════════════════════════════════════════
    //  PROFESSIONAL IDENTITY
    //  (All 4 fields serve different display purposes — no duplication)
    // ══════════════════════════════════════════
    professionalTitle: {
        type: String,
        trim: true,
        maxlength: [120, "Professional title cannot exceed 120 characters"],
        // One-liner shown under name on detail page.
        // e.g. "Staff Engineer @ Stripe · Ex-Netflix · Ex-Cloudflare"
    },
    shortBio: {
        type: String,
        trim: true,
        maxlength: [300, "Short bio cannot exceed 300 characters"],
        // Used on listing card body (replaces old 500-char bio for cards).
        // e.g. "Former researcher at DeepMind and OpenAI. PhD in CS from MIT."
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [3000, "Bio cannot exceed 3000 characters"],
        // Long-form narrative shown in "About" tab of detail page (multi-paragraph).
        // Replaces old 500-char bio field. Rendered as paragraph-rich text.
    },

    // ══════════════════════════════════════════
    //  PROFESSIONAL PROFILE (rich data)
    // ══════════════════════════════════════════

    /**
     * specializations[] — Domain areas (Web Development, Machine Learning, Design).
     * Drives: listing card spec chips, sidebar filter, detail page expertise cards.
     * NOT the same as skills[] (which are technologies/tools with percentages).
     */
    specializations: {
        type: [specializationSchema],
        default: [],
        validate: {
            validator: function(arr) { return arr.length <= 10; },
            message: "Cannot have more than 10 specializations"
        }
    },

    /**
     * skills[] — Specific tech/tool proficiency with %.
     * Drives: skills bar card on detail page.
     * NOT the same as specializations (domain areas) or tags (SEO keywords).
     */
    skills: {
        type: [skillSchema],
        default: [],
        validate: {
            validator: function(arr) { return arr.length <= 20; },
            message: "Cannot have more than 20 skills"
        }
    },

    /**
     * tags[] — Free-text keywords for text search and SEO.
     * Drives: full-text search index on listing, instructor discovery.
     * NOT stored in specializations or skills — pure search/SEO layer.
     */
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 50
    }],

    /**
     * workExperience[] — Career timeline with date ranges.
     * Drives: experience timeline on detail About tab.
     * yearsOfExperience (below) is a denormalised summary for quick sort/filter.
     */
    workExperience: {
        type: [workExperienceSchema],
        default: [],
        validate: {
            validator: function(arr) { return arr.length <= 15; },
            message: "Cannot have more than 15 work experience entries"
        }
    },

    /**
     * yearsOfExperience — Quick number for listing sort & range filter.
     * Instructor sets this manually. Virtual `computedYearsOfExperience` also
     * calculates from workExperience[] for reference.
     */
    yearsOfExperience: {
        type: Number,
        default: 0,
        min: [0, "Years of experience cannot be negative"],
        max: [50, "Years of experience cannot exceed 50"]
    },

    /**
     * qualifications[] — Academic degrees + professional certifications unified.
     * entryType: "degree" | "certification" | "bootcamp" | "online_course"
     * Drives: qualifications grid on detail About tab.
     * Previous model had two separate concerns (degree vs certificationId) — now unified.
     */
    qualifications: {
        type: [qualificationSchema],
        default: [],
        validate: {
            validator: function(arr) { return arr.length <= 15; },
            message: "Cannot have more than 15 qualification entries"
        }
    },

    /**
     * achievements[] — Awards, speaking engagements, publications, milestones.
     * Drives: achievements card on detail page right sidebar.
     */
    achievements: {
        type: [achievementSchema],
        default: [],
        validate: {
            validator: function(arr) { return arr.length <= 20; },
            message: "Cannot have more than 20 achievements"
        }
    },

    /**
     * socialLinks — External profile links.
     * Drives: "Connect" card on detail page right sidebar.
     */
    socialLinks: {
        linkedin:  { type: String, trim: true, maxlength: 300 },
        github:    { type: String, trim: true, maxlength: 300 },
        twitter:   { type: String, trim: true, maxlength: 300 },
        website:   { type: String, trim: true, maxlength: 300 },
        youtube:   { type: String, trim: true, maxlength: 300 }
    },

    /**
     * teachingLanguages — Languages the instructor teaches in.
     * DISTINCT from preferences.language (UI language) — no duplication.
     * e.g. ["English", "Hindi", "Spanish"]
     */
    teachingLanguages: {
        type: [String],
        default: ["English"]
    },

    /**
     * backgroundType — High-level career background bucket for listing filter.
     * Drives: "Background" sidebar filter on listing page.
     * ("FAANG Background" | "Startup Founder" | "Researcher / PhD" | "Live Mentor")
     * Set manually by instructor; can be inferred from workExperience but stored
     * for indexed query performance.
     */
    backgroundType: {
        type: String,
        enum: ["faang", "startup", "research", "corporate", "freelance", "academic"],
        default: null
    },

    /**
     * availability — Live session / mentorship booking settings.
     * Drives: "Hire for Mentorship" button state + live mentor badge on listing.
     */
    availability: {
        isAvailableForMentorship: {
            type: Boolean,
            default: false
        },
        isAvailableForLive: {
            type: Boolean,
            default: false
        },
        weeklyAvailableHours: {
            type: Number,
            min: 0,
            max: 168,
            default: 0
        },
        bookingMessage: {
            type: String,
            trim: true,
            maxlength: 300
            // Custom message shown on "Book Live Session" modal
        }
    },

    // ══════════════════════════════════════════
    //  BADGES (admin-set + system flags)
    // ══════════════════════════════════════════
    isTopInstructor: {
        type: Boolean,
        default: false
        // Admin-set. Drives "Top Instructor" badge on listing & detail pages.
    },
    // isVerifiedExpert: use existing isDocumentsVerified (same concept)
    // isMentorAvailable: derived from availability.isAvailableForMentorship via virtual
    // isNew: derived from createdAt via virtual (< 90 days)

    // ══════════════════════════════════════════
    //  DENORMALISED STATS (updated by hooks/cron)
    //  Kept for fast listing queries — source of truth is in related models.
    // ══════════════════════════════════════════
    totalStudentsTeaching: {
        type: Number,
        default: 0,
        min: 0
    },
    totalCourses: {
        type: Number,
        default: 0,
        min: 0
    },
    totalLiveClasses: {
        type: Number,
        default: 0,
        min: 0
    },
    totalReviews: {
        // Aggregated across all courses — kept in sync with rating.totalReviews
        type: Number,
        default: 0,
        min: 0
    },

    // ══════════════════════════════════════════
    //  RATING (aggregated across all instructor courses)
    // ══════════════════════════════════════════
    rating: {
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalReviews: {
            type: Number,
            default: 0
        },
        ratingBreakdown: {
            fivestar:  { type: Number, default: 0 },
            fourstar:  { type: Number, default: 0 },
            threestar: { type: Number, default: 0 },
            twostar:   { type: Number, default: 0 },
            onestar:   { type: Number, default: 0 }
        }
    },

    // ══════════════════════════════════════════
    //  ACCOUNT STATUS
    // ══════════════════════════════════════════
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    isDocumentsVerified: {
        type: Boolean,
        default: false
        // Admin-verified credentials → drives "✓ Verified Expert" badge
    },
    isKYCVerified: {
        type: Boolean,
        default: false
        // KYC for payouts
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    suspensionReason: {
        type: String,
        trim: true,
        maxlength: 500
    },
    suspendedAt: Date,

    // ══════════════════════════════════════════
    //  CONTENT REFERENCES
    // ══════════════════════════════════════════
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    }],
    liveClasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "LiveClass"
    }],

    // ══════════════════════════════════════════
    //  CLOUDFLARE STREAM (One Live Input per Instructor)
    //  Per-session recording UID stored on LiveClass model.
    // ══════════════════════════════════════════
    cfLiveInputId: { type: String, default: null },
    cfRtmpUrl:     { type: String, default: null },
    cfRtmpKey:     { type: String, default: null, select: false },
    cfSrtUrl:      { type: String, default: null },
    cfWebRTCUrl:   { type: String, default: null },

    // ══════════════════════════════════════════
    //  SESSIONS & SECURITY
    // ══════════════════════════════════════════
    sessions: [{
        refreshTokenHash: { type: String, required: true },
        device: String,
        ip: String,
        userAgent: String,
        lastActive: { type: Date, default: Date.now },
        createdAt:  { type: Date, default: Date.now }
    }],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    lastLogin: Date,
    lastLoginIP: String,

    // ══════════════════════════════════════════
    //  OTP / VERIFICATION
    // ══════════════════════════════════════════
    verificationCode: {
        type: String,
        default: null,
        select: false
    },
    verificationCodeExpires: { type: Date, default: null },
    isOtpVerified: { type: Boolean, default: false },
    otpAttempts: { type: Number, default: 0 },
    otpLastSentAt: Date,

    // ══════════════════════════════════════════
    //  PREFERENCES
    // ══════════════════════════════════════════
    preferences: {
        emailNotifications: { type: Boolean, default: true },
        classReminders:     { type: Boolean, default: true },
        studentUpdates:     { type: Boolean, default: true },
        promotionalEmails:  { type: Boolean, default: true },
        language: {
            // UI/dashboard language — distinct from teachingLanguages
            type: String,
            default: "en"
        },
        timezone: {
            // Used for scheduling live classes and dashboard display
            type: String,
            default: "UTC"
        }
    },

    // ══════════════════════════════════════════
    //  FINANCIAL (compliance note)
    //  Bank/card details are NOT stored here.
    //  Wallet tracks balance (Wallet model).
    //  Withdrawals handled via Payout model.
    // ══════════════════════════════════════════

    // ══════════════════════════════════════════
    //  SOFT DELETE & AUDIT
    // ══════════════════════════════════════════
    deletedAt: Date,
    deletionReason: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }

}, {
    timestamps: true,
    collection: "instructors"
});

// ─────────────────────────────────────────────
//  INDEXES
// ─────────────────────────────────────────────

// Auth & lookup
instructorSchema.index({ isActive: 1 });
instructorSchema.index({ isEmailVerified: 1 });
instructorSchema.index({ deletedAt: 1 });
instructorSchema.index({ createdAt: -1 });
instructorSchema.index({ verificationCodeExpires: 1 }, { expireAfterSeconds: 0 });

// Content references
instructorSchema.index({ courses: 1 });
instructorSchema.index({ liveClasses: 1 });

// Listing page sorting & filtering
instructorSchema.index({ "rating.averageRating": -1 });
instructorSchema.index({ totalStudentsTeaching: -1 });
instructorSchema.index({ totalCourses: -1 });
instructorSchema.index({ yearsOfExperience: 1 });
instructorSchema.index({ backgroundType: 1 });
instructorSchema.index({ isTopInstructor: 1 });
instructorSchema.index({ "availability.isAvailableForMentorship": 1 });
instructorSchema.index({ "specializations.category": 1 });

// Compound: listing page common query pattern
instructorSchema.index({ isActive: 1, "rating.averageRating": -1 });
instructorSchema.index({ isActive: 1, backgroundType: 1 });
instructorSchema.index({ isActive: 1, isTopInstructor: 1, "rating.averageRating": -1 });

// Full-text search across discoverable fields
instructorSchema.index(
    {
        firstName: "text",
        lastName: "text",
        professionalTitle: "text",
        shortBio: "text",
        tags: "text",
        "specializations.area": "text"
    },
    {
        weights: {
            firstName: 10,
            lastName: 10,
            professionalTitle: 6,
            "specializations.area": 4,
            tags: 3,
            shortBio: 1
        },
        name: "instructor_text_search"
    }
);

// ─────────────────────────────────────────────
//  VIRTUALS
// ─────────────────────────────────────────────

instructorSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});

instructorSchema.virtual("isLocked").get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

/** Drives "New" badge on listing cards — instructor within first 90 days */
instructorSchema.virtual("isNew").get(function () {
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    return Date.now() - this.createdAt < ninetyDays;
});

/** "Live Mentor" badge — instructor is set up for live mentorship */
instructorSchema.virtual("isMentorAvailable").get(function () {
    return this.availability?.isAvailableForMentorship === true;
});

/**
 * Compute total years of experience from workExperience[] timeline.
 * Accounts for overlapping roles by collapsing into date ranges.
 * Instructor can override via yearsOfExperience field.
 */
instructorSchema.virtual("computedYearsOfExperience").get(function () {
    if (!this.workExperience || this.workExperience.length === 0) {
        return this.yearsOfExperience || 0;
    }

    const currentYear = new Date().getFullYear();
    const ranges = this.workExperience.map(w => ({
        start: w.startYear,
        end: w.isCurrent ? currentYear : (w.endYear || currentYear)
    }));

    // Sort by start year
    ranges.sort((a, b) => a.start - b.start);

    // Merge overlapping ranges
    let merged = [ranges[0]];
    for (let i = 1; i < ranges.length; i++) {
        const last = merged[merged.length - 1];
        if (ranges[i].start <= last.end) {
            last.end = Math.max(last.end, ranges[i].end);
        } else {
            merged.push(ranges[i]);
        }
    }

    return merged.reduce((total, r) => total + (r.end - r.start), 0);
});

/**
 * Profile completion score — percentage of optional profile fields filled.
 * Shown on instructor dashboard to encourage full profile setup.
 */
instructorSchema.virtual("profileCompletionScore").get(function () {
    const checks = [
        !!this.profilePicture?.secure_url,            // 10%
        !!this.bannerImage?.secure_url,               // 5%
        !!this.professionalTitle,                     // 10%
        !!this.shortBio,                              // 10%
        !!this.bio && this.bio.length > 200,          // 10%
        this.specializations?.length > 0,             // 10%
        this.skills?.length >= 3,                     // 10%
        this.workExperience?.length > 0,              // 10%
        this.qualifications?.length > 0,              // 5%
        this.achievements?.length > 0,                // 5%
        !!(this.socialLinks?.linkedin || this.socialLinks?.website), // 5%
        this.tags?.length >= 3,                       // 5%
        this.teachingLanguages?.length > 0,           // 5%
    ];

    const weights = [10, 5, 10, 10, 10, 10, 10, 10, 5, 5, 5, 5, 5];
    const score = checks.reduce((sum, passed, i) => sum + (passed ? weights[i] : 0), 0);
    return Math.min(100, score);
});

// ─────────────────────────────────────────────
//  PRE-SAVE MIDDLEWARE
// ─────────────────────────────────────────────

instructorSchema.pre("save", async function () {
    // Password hashing
    if (this.isModified("password")) {
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        this.passwordChangedAt = Date.now() - 1000;
    }

    // Sync totalReviews with rating sub-object
    if (this.isModified("rating.totalReviews")) {
        this.totalReviews = this.rating.totalReviews;
    }

    // Ensure only one primary specialization
    if (this.isModified("specializations")) {
        const primaries = this.specializations.filter(s => s.isPrimary);
        if (primaries.length > 1) {
            // Keep only the first as primary
            let foundFirst = false;
            this.specializations.forEach(s => {
                if (s.isPrimary) {
                    if (foundFirst) s.isPrimary = false;
                    else foundFirst = true;
                }
            });
        }
    }
});

// Soft delete filter — exclude deleted documents from all find queries
instructorSchema.pre(/^find/, function () {
    this.where({ deletedAt: { $exists: false } });
});

// ─────────────────────────────────────────────
//  INSTANCE METHODS
// ─────────────────────────────────────────────

/** Compare candidate password against hashed password */
instructorSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

/** Check if password was changed after a JWT was issued */
instructorSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

/** Generate a signed password reset token (raw returned, hashed stored) */
instructorSchema.methods.createPasswordResetToken = function () {
    const rawToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    this.passwordResetExpires = Date.now() + convertToMilliseconds(process.env.PASSWORD_RESET_EXPIRES_IN);
    return rawToken;
};

/** Generate 6-digit OTP for email/phone verification */
instructorSchema.methods.generateOTP = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationCode = otp;
    this.verificationCodeExpires = Date.now() + convertToMilliseconds(process.env.OTP_EXPIRES_IN);
    this.isOtpVerified = false;
    this.otpLastSentAt = Date.now();
    return otp;
};

/** Verify a provided OTP against stored value */
instructorSchema.methods.verifyOTP = function (providedOTP) {
    if (!this.verificationCode || !this.verificationCodeExpires) return false;
    if (Date.now() > this.verificationCodeExpires) return false;
    return this.verificationCode === providedOTP;
};

/** Clear OTP state after successful verification */
instructorSchema.methods.clearOTP = function () {
    this.verificationCode = null;
    this.verificationCodeExpires = null;
    this.isOtpVerified = true;
    this.otpAttempts = 0;
};

/** SHA-256 hash of a token */
instructorSchema.methods.hashToken = function (token) {
    return crypto.createHash("sha256").update(token).digest("hex");
};

/** Add a new login session (max 5 concurrent sessions) */
instructorSchema.methods.addSession = function (refreshToken, deviceInfo = {}) {
    const hash = this.hashToken(refreshToken);
    const MAX_SESSIONS = 5;
    if (this.sessions.length >= MAX_SESSIONS) this.sessions.shift();
    this.sessions.push({
        refreshTokenHash: hash,
        device: deviceInfo.device,
        ip: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        lastActive: new Date()
    });
};

/** Verify a refresh token and remove its session */
instructorSchema.methods.verifyAndRemoveRefreshToken = function (refreshToken) {
    const hash = this.hashToken(refreshToken);
    const idx = this.sessions.findIndex(s => s.refreshTokenHash === hash);
    if (idx === -1) return false;
    this.sessions.splice(idx, 1);
    return true;
};

/** Invalidate all sessions (e.g. on password change) */
instructorSchema.methods.clearAllSessions = function () {
    this.sessions = [];
};

/** Reset failed login attempts */
instructorSchema.methods.resetLoginAttempts = function () {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    return this.save({ validateBeforeSave: false });
};

/**
 * Update the instructor's aggregated rating when a new review is submitted.
 * Called from Review model's post-save hook via Course → Instructor chain.
 */
instructorSchema.methods.updateRating = function (newRating) {
    if (newRating < 1 || newRating > 5) throw new Error("Rating must be between 1 and 5");

    const totalRating = this.rating.averageRating * this.rating.totalReviews + newRating;
    this.rating.totalReviews += 1;
    this.rating.averageRating = Math.round((totalRating / this.rating.totalReviews) * 100) / 100;
    this.totalReviews = this.rating.totalReviews;

    const starMap = { 5: "fivestar", 4: "fourstar", 3: "threestar", 2: "twostar", 1: "onestar" };
    if (starMap[newRating]) this.rating.ratingBreakdown[starMap[newRating]] += 1;
};

/**
 * Add or update a work experience entry.
 * If companyType is faang/research/startup, auto-updates backgroundType
 * to the first matching type found in current experience.
 */
instructorSchema.methods.upsertWorkExperience = function (entry) {
    const existing = entry._id
        ? this.workExperience.id(entry._id)
        : null;

    if (existing) {
        Object.assign(existing, entry);
    } else {
        this.workExperience.push(entry);
    }

    // Auto-update backgroundType from the most notable experience
    const priority = ["faang", "research", "startup", "academic", "corporate", "freelance"];
    for (const type of priority) {
        if (this.workExperience.some(w => w.companyType === type)) {
            this.backgroundType = type;
            break;
        }
    }

    return this.save();
};

// ─────────────────────────────────────────────
//  STATIC METHODS
// ─────────────────────────────────────────────

/** Increment login attempts and lock account at threshold */
instructorSchema.statics.failLogin = async function (instructorId) {
    const instructor = await this.findByIdAndUpdate(
        instructorId,
        { $inc: { loginAttempts: 1 } },
        { new: true }
    );

    const MAX_ATTEMPTS = 5;
    if (instructor.loginAttempts >= MAX_ATTEMPTS) {
        const LOCK_DURATION = process.env.ACCOUNT_LOCK_DURATION || "2h";
        return this.findByIdAndUpdate(
            instructorId,
            { $set: { lockUntil: Date.now() + convertToMilliseconds(LOCK_DURATION) } },
            { new: true }
        );
    }

    return instructor;
};

/** Fetch instructor with their published courses fully populated */
instructorSchema.statics.getInstructorCourses = function (instructorId) {
    return this.findById(instructorId).populate({
        path: "courses",
        match: { status: "published" },
        select: "title description category level price rating enrolledCount thumbnail totalDuration"
    });
};

/** Fetch instructor with upcoming live classes */
instructorSchema.statics.getInstructorLiveClasses = function (instructorId) {
    return this.findById(instructorId).populate({
        path: "liveClasses",
        match: { scheduledAt: { $gte: new Date() }, status: { $in: ["scheduled", "live"] } },
        select: "title scheduledAt duration status actualParticipants",
        populate: { path: "course", select: "title" }
    });
};

/**
 * Public listing query — applies all listing-page filters and returns
 * paginated instructor summaries.
 *
 * @param {Object} filters  - { spec, rating, students, courses, expRange, reviews, backgroundType, search }
 * @param {Object} options  - { sort, page, limit }
 */
instructorSchema.statics.getListingPage = async function (filters = {}, options = {}) {
    const {
        spec, rating, students, courses: courseFilter,
        expRange, reviews, backgroundType, search
    } = filters;

    const { sort = "popular", page = 1, limit = 12 } = options;

    const query = { isActive: true, deletedAt: { $exists: false } };

    if (search) {
        query.$text = { $search: search };
    }
    if (spec?.length) {
        query["specializations.category"] = { $in: spec };
    }
    if (rating) {
        query["rating.averageRating"] = { $gte: parseFloat(rating) };
    }
    if (students) {
        query.totalStudentsTeaching = { $gte: parseInt(students) };
    }
    if (courseFilter) {
        query.totalCourses = courseFilter;
    }
    if (expRange && expRange.length === 2) {
        query.yearsOfExperience = { $gte: expRange[0], $lte: expRange[1] };
    }
    if (reviews) {
        query["rating.totalReviews"] = { $gte: parseInt(reviews) };
    }
    if (backgroundType) {
        query.backgroundType = backgroundType;
    }

    const sortMap = {
        popular: { totalStudentsTeaching: -1 },
        rating:  { "rating.averageRating": -1 },
        students:{ totalStudentsTeaching: -1 },
        courses: { totalCourses: -1 },
        exp:     { yearsOfExperience: -1 },
        reviews: { "rating.totalReviews": -1 }
    };

    const skip = (page - 1) * limit;

    const [instructors, total] = await Promise.all([
        this.find(query)
            .select([
                "firstName", "lastName", "professionalTitle", "shortBio",
                "profilePicture", "bannerImage", "bannerColor",
                "specializations", "tags",
                "rating", "totalStudentsTeaching", "totalCourses",
                "totalLiveClasses", "yearsOfExperience",
                "isTopInstructor", "isDocumentsVerified",
                "availability.isAvailableForMentorship", "backgroundType",
                "createdAt"
            ].join(" "))
            .sort(sortMap[sort] || sortMap.popular)
            .skip(skip)
            .limit(limit),
        this.countDocuments(query)
    ]);

    return { instructors, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ─────────────────────────────────────────────
//  OUTPUT TRANSFORM
// ─────────────────────────────────────────────

instructorSchema.methods.toJSON = function () {
    const obj = this.toObject({ virtuals: true });

    // Strip security fields from API responses
    delete obj.password;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;
    delete obj.loginAttempts;
    delete obj.lockUntil;
    delete obj.sessions;
    delete obj.verificationCode;
    delete obj.otpAttempts;
    delete obj.otpLastSentAt;
    delete obj.cfRtmpKey;   // Streaming key is always sensitive

    return obj;
};

// ─────────────────────────────────────────────
//  MODEL EXPORT
// ─────────────────────────────────────────────

const Instructor = mongoose.model("Instructor", instructorSchema);

export { Instructor };