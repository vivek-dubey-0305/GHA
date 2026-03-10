import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";
import connectDB from "../configs/connection.config.js";
import { Instructor } from "../models/instructor.model.js";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { Module } from "../models/module.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Assignment } from "../models/assignment.model.js";
import { LiveClass } from "../models/liveclass.model.js";
import { VideoPackage } from "../models/videopackage.model.js";
import { Material } from "../models/material.model.js";
import { Payment } from "../models/payment.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Progress } from "../models/progress.model.js";
import { Submission } from "../models/submission.model.js";
import { Review } from "../models/review.model.js";
import { Certificate } from "../models/certificate.model.js";
import { Discussion } from "../models/discussion.model.js";
import { Announcement } from "../models/announcement.model.js";
import { Notification } from "../models/notification.model.js";
import { Coupon } from "../models/coupon.model.js";
import { Wallet } from "../models/wallet.model.js";
import { Payout } from "../models/payout.model.js";

dotenv.config();

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════
const separator = () => console.log("━".repeat(60));
const logCreated = (label, id, extra = "") =>
    console.log(`   ✅ ${label}: ${id}${extra ? ` (${extra})` : ""}`);

const generatePaymentId = () => `pay_${crypto.randomBytes(12).toString("hex")}`;
const generateOrderId = () => `order_${crypto.randomBytes(12).toString("hex")}`;

const STOCK = {
    instructorProfile: { public_id: "seed/vivek-dubey", secure_url: "https://picsum.photos/seed/vivek-dubey/200/200" },
    courseThumbnails: [
        { public_id: "seed/vd-course-blockchain", secure_url: "https://picsum.photos/seed/blockchain-course/800/450" },
        { public_id: "seed/vd-course-cybersecurity", secure_url: "https://picsum.photos/seed/cybersecurity-course/800/450" },
    ],
    moduleThumbnail: (i) => ({ public_id: `seed/vd-mod-${i}`, secure_url: `https://picsum.photos/seed/vd-mod-${i}/400/225` }),
    lessonThumbnail: (i) => ({ public_id: `seed/vd-lesson-${i}`, secure_url: `https://picsum.photos/seed/vd-lesson-${i}/400/225` }),
    assignmentThumbnail: (i) => ({ public_id: `seed/vd-asgn-${i}`, secure_url: `https://picsum.photos/seed/vd-asgn-${i}/400/225` }),
    userProfile: (i) => ({ public_id: `seed/vd-user-${i}`, secure_url: `https://picsum.photos/seed/vd-user-${i}/200/200` }),
};

// ══════════════════════════════════════════════════════════════
//  TEST DATA
// ══════════════════════════════════════════════════════════════
const INSTRUCTOR_DATA = {
    firstName: "Vivek",
    lastName: "Dubey",
    email: "vivek.dubey0305@gmail.com",
    phone: "+919876500305",
    password: "Vivek@1234",
    dateOfBirth: new Date("1995-03-05"),
    gender: "Male",
    bio: "Blockchain & Cybersecurity Expert with 8+ years of hands-on experience. Built DeFi protocols handling $50M+ TVL. Former Security Engineer at a Big-4 firm. Passionate about decentralised systems and ethical hacking.",
    address: {
        street: "42 Blockchain Avenue",
        city: "Indore",
        state: "Madhya Pradesh",
        postalCode: "452001",
        country: "India",
    },
    specialization: ["blockchain", "cybersecurity", "web_development"],
    qualifications: [
        { degree: "M.Tech Computer Science", institution: "IIT Bombay", yearOfCompletion: 2018, certificationId: "IITB-2018-CS-305" },
        { degree: "Certified Ethical Hacker (CEH)", institution: "EC-Council", yearOfCompletion: 2020, certificationId: "CEH-2020-V11-7890" },
        { degree: "Certified Blockchain Developer", institution: "Blockchain Council", yearOfCompletion: 2021, certificationId: "CBD-2021-1234" },
    ],
    yearsOfExperience: 8,
};

const TEST_USERS_VD = [
    {
        firstName: "Arjun",
        lastName: "Mehra",
        email: "arjun.mehra@testmail.com",
        phone: "+919876500401",
        password: "Test@1234",
        dateOfBirth: new Date("1997-06-10"),
        gender: "Male",
        address: { street: "10 Nehru Nagar", city: "Jaipur", state: "Rajasthan", postalCode: "302001", country: "India" },
    },
    {
        firstName: "Sneha",
        lastName: "Kapoor",
        email: "sneha.kapoor@testmail.com",
        phone: "+919876500402",
        password: "Test@1234",
        dateOfBirth: new Date("1999-01-25"),
        gender: "Female",
        address: { street: "88 Lake Road", city: "Bhopal", state: "Madhya Pradesh", postalCode: "462001", country: "India" },
    },
    {
        firstName: "Rohan",
        lastName: "Joshi",
        email: "rohan.joshi@testmail.com",
        phone: "+919876500403",
        password: "Test@1234",
        dateOfBirth: new Date("1996-09-18"),
        gender: "Male",
        address: { street: "25 Mall Road", city: "Lucknow", state: "Uttar Pradesh", postalCode: "226001", country: "India" },
    },
];

const COURSES_VD = [
    {
        title: "Blockchain Development & Web3 Masterclass 2026",
        description: "Build decentralised applications from scratch. Solidity, Ethereum, Hardhat, IPFS, DeFi protocols, NFT marketplaces, and Layer-2 scaling. Deploy production-grade smart contracts and dApps.",
        shortDescription: "Master Solidity, Ethereum, DeFi, NFTs, and Layer-2 with 8+ real projects.",
        category: "programming",
        level: "intermediate",
        language: "English",
        price: 5499,
        currency: "INR",
        discountPrice: 2199,
        learningOutcomes: [
            "Write and deploy production-grade Solidity smart contracts",
            "Build full-stack dApps with React + Ethers.js",
            "Create ERC-20 tokens, ERC-721 NFTs, and DeFi protocols",
            "Understand Layer-2 solutions: Optimism, Arbitrum, zkSync",
            "Audit smart contracts for security vulnerabilities",
        ],
        prerequisites: ["JavaScript fundamentals", "Basic React knowledge", "Understanding of HTTP & APIs"],
        targetAudience: ["Web developers transitioning to Web3", "Entrepreneurs building blockchain products", "CS students interested in DeFi"],
        tags: ["blockchain", "solidity", "ethereum", "web3", "defi", "nft", "smart-contracts", "hardhat"],
    },
    {
        title: "Cybersecurity & Ethical Hacking Professional Certificate",
        description: "Comprehensive cybersecurity training: network security, penetration testing, OWASP Top 10, cryptography, incident response, and compliance frameworks. Hands-on labs with Kali Linux, Burp Suite, and Metasploit.",
        shortDescription: "Pentesting, OWASP, Kali Linux, Burp Suite, Metasploit — from zero to pro.",
        category: "programming",
        level: "advanced",
        language: "English",
        price: 6499,
        currency: "INR",
        discountPrice: 2799,
        learningOutcomes: [
            "Perform professional penetration testing engagements",
            "Exploit and remediate OWASP Top 10 vulnerabilities",
            "Master Kali Linux, Burp Suite, Metasploit, and Nmap",
            "Implement cryptographic protocols and PKI infrastructure",
            "Write professional security assessment reports",
        ],
        prerequisites: ["Linux command-line basics", "Networking fundamentals (TCP/IP, DNS)", "Basic programming (Python recommended)"],
        targetAudience: ["Aspiring penetration testers", "Developers wanting to write secure code", "IT professionals moving to security"],
        tags: ["cybersecurity", "ethical-hacking", "pentesting", "kali-linux", "owasp", "burpsuite", "metasploit"],
    },
];

const MODULES_VD = {
    course1: [
        {
            title: "Blockchain Fundamentals & Solidity",
            description: "Understand blockchain architecture, consensus mechanisms, and Solidity programming from scratch.",
            objectives: ["Understand blockchain internals", "Write Solidity smart contracts", "Deploy contracts to testnets"],
        },
        {
            title: "Building DApps with React & Ethers.js",
            description: "Full-stack decentralised application development: wallet integration, contract interaction, and state management.",
            objectives: ["Connect React frontend to smart contracts", "Integrate MetaMask and WalletConnect", "Handle blockchain transactions in UI"],
        },
        {
            title: "DeFi, NFTs & Advanced Topics",
            description: "Create DeFi protocols, NFT marketplaces, and explore Layer-2 scaling and smart contract auditing.",
            objectives: ["Build a DEX and lending protocol", "Create an NFT marketplace", "Audit contracts for vulnerabilities"],
        },
    ],
    course2: [
        {
            title: "Network Security & Reconnaissance",
            description: "Network fundamentals, scanning, enumeration, and information gathering techniques for penetration testing.",
            objectives: ["Map target networks with Nmap", "Perform OSINT reconnaissance", "Identify attack surfaces"],
        },
        {
            title: "Web Application Penetration Testing",
            description: "OWASP Top 10, Burp Suite mastery, SQL injection, XSS, CSRF, authentication bypass, and API security testing.",
            objectives: ["Exploit OWASP Top 10 vulnerabilities", "Master Burp Suite Professional", "Test APIs for security flaws"],
        },
        {
            title: "Advanced Exploitation & Reporting",
            description: "Metasploit framework, privilege escalation, post-exploitation, cryptography, and professional reporting.",
            objectives: ["Use Metasploit for exploitation", "Perform privilege escalation", "Write professional pentest reports"],
        },
    ],
};

const LESSONS_VD = {
    // Course 1 (Blockchain)
    "0-0": [
        { title: "What is Blockchain? Architecture Deep Dive", type: "video", duration: 1500, isFree: true },
        { title: "Setting Up Development Environment (Hardhat + Node)", type: "video", duration: 1200, isFree: true },
        { title: "Solidity Syntax, Types & Storage", type: "article", isFree: false },
        { title: "Writing Your First Smart Contract", type: "video", duration: 2400, isFree: false },
        { title: "Deploy to Sepolia Testnet — Assignment", type: "assignment", isFree: false },
    ],
    "0-1": [
        { title: "React + Vite Project Setup for Web3", type: "video", duration: 1200, isFree: false },
        { title: "Connecting Wallets with Ethers.js v6", type: "video", duration: 1800, isFree: false },
        { title: "Reading & Writing Contract State from UI", type: "article", isFree: false },
        { title: "Building a Token Dashboard", type: "video", duration: 2700, isFree: false },
        { title: "Build a Voting DApp — Assignment", type: "assignment", isFree: false },
    ],
    "0-2": [
        { title: "ERC-20 Token Standard Explained", type: "video", duration: 1800, isFree: false },
        { title: "Building a Decentralised Exchange (AMM)", type: "video", duration: 3000, isFree: false },
        { title: "NFT Standards: ERC-721 & ERC-1155", type: "article", isFree: false },
        { title: "Layer-2 Rollups: Optimism & Arbitrum", type: "video", duration: 2100, isFree: false },
        { title: "Build an NFT Marketplace — Assignment", type: "assignment", isFree: false },
    ],
    // Course 2 (Cybersecurity)
    "1-0": [
        { title: "Introduction to Ethical Hacking & Legal Framework", type: "video", duration: 1200, isFree: true },
        { title: "Kali Linux Setup & Essential Tools", type: "video", duration: 1500, isFree: true },
        { title: "TCP/IP, DNS & Network Protocols Deep Dive", type: "article", isFree: false },
        { title: "Network Scanning with Nmap & Masscan", type: "video", duration: 2100, isFree: false },
        { title: "Reconnaissance Report — Assignment", type: "assignment", isFree: false },
    ],
    "1-1": [
        { title: "OWASP Top 10 — 2025 Edition Overview", type: "video", duration: 1800, isFree: false },
        { title: "SQL Injection: Detection & Exploitation", type: "video", duration: 2400, isFree: false },
        { title: "XSS, CSRF & Authentication Bypass", type: "article", isFree: false },
        { title: "Burp Suite Professional Masterclass", type: "video", duration: 2700, isFree: false },
        { title: "Hack the Juice Shop — Assignment", type: "assignment", isFree: false },
    ],
    "1-2": [
        { title: "Metasploit Framework Deep Dive", type: "video", duration: 2100, isFree: false },
        { title: "Privilege Escalation (Linux & Windows)", type: "video", duration: 2400, isFree: false },
        { title: "Cryptography & PKI Infrastructure", type: "article", isFree: false },
        { title: "Incident Response & Forensics Basics", type: "video", duration: 1800, isFree: false },
        { title: "Full Pentest Report — Final Assignment", type: "assignment", isFree: false },
    ],
};

const ARTICLE_CONTENTS_VD = {
    "Solidity Syntax, Types & Storage": `# Solidity Syntax, Types & Storage

## Data Types
\`\`\`solidity
// Value Types
uint256 public count = 0;
int256 public negativeNum = -1;
bool public isActive = true;
address public owner;
bytes32 public data;

// Reference Types
string public name = "MyToken";
uint256[] public numbers;
mapping(address => uint256) public balances;
\`\`\`

## Storage vs Memory vs Calldata
- **storage**: Persistent on-chain (expensive writes)
- **memory**: Temporary, exists during function execution
- **calldata**: Read-only, for external function parameters

## Visibility Modifiers
- \`public\` — Accessible everywhere
- \`private\` — Only within contract
- \`internal\` — Contract + derived contracts
- \`external\` — Only from outside

## Functions
\`\`\`solidity
function transfer(address to, uint256 amount) external returns (bool) {
    require(balances[msg.sender] >= amount, "Insufficient balance");
    balances[msg.sender] -= amount;
    balances[to] += amount;
    return true;
}
\`\`\``,

    "Reading & Writing Contract State from UI": `# Reading & Writing Contract State from React

## Setup Ethers.js v6
\`\`\`javascript
import { BrowserProvider, Contract } from "ethers";

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new Contract(address, abi, signer);
\`\`\`

## Reading State (Free — no gas)
\`\`\`javascript
const balance = await contract.balanceOf(userAddress);
const totalSupply = await contract.totalSupply();
\`\`\`

## Writing State (Costs gas)
\`\`\`javascript
const tx = await contract.transfer(recipient, amount);
await tx.wait(); // Wait for confirmation
\`\`\`

## Listening to Events
\`\`\`javascript
contract.on("Transfer", (from, to, value) => {
    console.log(\`Transfer: \${from} → \${to} : \${value}\`);
});
\`\`\``,

    "NFT Standards: ERC-721 & ERC-1155": `# NFT Standards: ERC-721 & ERC-1155

## ERC-721 (Non-Fungible Token)
Each token is unique.
\`\`\`solidity
function _mint(address to, uint256 tokenId) internal {
    _owners[tokenId] = to;
    _balances[to] += 1;
    emit Transfer(address(0), to, tokenId);
}
\`\`\`

## ERC-1155 (Multi-Token Standard)
Manages both fungible and non-fungible tokens in one contract.
\`\`\`solidity
function safeTransferFrom(
    address from, address to,
    uint256 id, uint256 amount, bytes calldata data
) external;
\`\`\`

## Metadata
\`\`\`json
{
    "name": "GHA Certificate #1",
    "description": "Course completion certificate",
    "image": "ipfs://..."
}
\`\`\``,

    "TCP/IP, DNS & Network Protocols Deep Dive": `# TCP/IP & Network Protocols

## OSI Model Layers
1. Physical → Ethernet, Wi-Fi
2. Data Link → MAC addressing
3. Network → IP, ICMP
4. Transport → TCP, UDP
5. Session → NetBIOS
6. Presentation → SSL/TLS
7. Application → HTTP, DNS, SMTP

## TCP Three-Way Handshake
\`\`\`
Client → SYN → Server
Client ← SYN-ACK ← Server
Client → ACK → Server
\`\`\`

## DNS Resolution Flow
1. Browser cache → OS cache → Recursive resolver
2. Root → TLD (.com) → Authoritative NS
3. A/AAAA record returned

## Key Protocols for Pentesters
- **ARP** — Layer 2, spoofable for MITM
- **DHCP** — Starvation attacks possible
- **DNS** — Zone transfers, cache poisoning
- **HTTP/S** — OWASP Top 10 focus`,

    "XSS, CSRF & Authentication Bypass": `# XSS, CSRF & Authentication Bypass

## Cross-Site Scripting (XSS)
### Reflected XSS
\`\`\`
https://target.com/search?q=<script>alert(1)</script>
\`\`\`

### Stored XSS
Payload stored in database, executes on every page load.

### DOM-Based XSS
\`\`\`javascript
document.getElementById("output").innerHTML = location.hash;
\`\`\`

## CSRF (Cross-Site Request Forgery)
Victim's browser sends authenticated request to target:
\`\`\`html
<form action="https://bank.com/transfer" method="POST">
    <input type="hidden" name="to" value="attacker" />
    <input type="hidden" name="amount" value="10000" />
</form>
<script>document.forms[0].submit();</script>
\`\`\`

## Authentication Bypass Techniques
- Default credentials
- SQL injection in login forms
- JWT manipulation (alg:none, weak secrets)
- Session fixation`,

    "Cryptography & PKI Infrastructure": `# Cryptography & PKI

## Symmetric Encryption
Same key for encrypt + decrypt.
\`\`\`
AES-256-GCM — Standard for data at rest
ChaCha20-Poly1305 — Standard for data in transit
\`\`\`

## Asymmetric Encryption
Key pair: public (encrypt) + private (decrypt).
\`\`\`
RSA-4096 — Key exchange, signatures
Ed25519 — Modern, fast signatures
ECDHE — Perfect forward secrecy in TLS
\`\`\`

## Hashing
One-way functions: SHA-256, SHA-3, bcrypt, Argon2.

## PKI (Public Key Infrastructure)
1. Certificate Authority (CA) issues certificates
2. Server presents cert during TLS handshake
3. Client verifies chain of trust

## TLS 1.3 Handshake
\`\`\`
Client Hello + KeyShare →
← Server Hello + KeyShare + Certificate
Client Finished →
\`\`\`
Only 1 round-trip vs 2 in TLS 1.2.`,
};

// ══════════════════════════════════════════════════════════════
//  MAIN SEEDER
// ══════════════════════════════════════════════════════════════

const seedVivekDubey = async () => {
    const startTime = Date.now();
    const ids = {}; // Tracks all created IDs for cleanup

    console.log("\n");
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║       🌱 VIVEK DUBEY — COMPREHENSIVE INSTRUCTOR SEEDER     ║");
    console.log("║    Blockchain & Cybersecurity — Full Data Graph             ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");

    try {
        await connectDB();
        console.log("✅ Database connected\n");

        // ────────────────────────────────────────────────
        // STEP 1: INSTRUCTOR
        // ────────────────────────────────────────────────
        console.log("👨‍🏫 Step 1: Creating Instructor — Vivek Dubey");
        separator();

        let instructor = await Instructor.findOne({ email: INSTRUCTOR_DATA.email }).select("+email");
        if (instructor) {
            console.log(`   ⚠️  Instructor already exists: ${INSTRUCTOR_DATA.email} (ID: ${instructor._id})`);
        } else {
            instructor = new Instructor({
                ...INSTRUCTOR_DATA,
                profilePicture: STOCK.instructorProfile,
                isEmailVerified: true,
                isPhoneVerified: true,
                isDocumentsVerified: true,
                isKYCVerified: true,
                isActive: true,
                rating: {
                    averageRating: 4.7,
                    totalReviews: 0,
                    ratingBreakdown: { fivestar: 0, fourstar: 0, threestar: 0, twostar: 0, onestar: 0 },
                },
                preferences: {
                    emailNotifications: true,
                    classReminders: true,
                    studentUpdates: true,
                    language: "en",
                    timezone: "Asia/Kolkata",
                },
            });
            await instructor.save();
            logCreated("Instructor", instructor._id, INSTRUCTOR_DATA.email);
            console.log(`      📧 Email: ${INSTRUCTOR_DATA.email}`);
            console.log(`      🔐 Password: ${INSTRUCTOR_DATA.password}`);
        }
        ids.instructorId = instructor._id.toString();
        separator();

        // ────────────────────────────────────────────────
        // STEP 2: TEST USERS (3)
        // ────────────────────────────────────────────────
        console.log("\n👥 Step 2: Creating Test Users (3)");
        separator();

        const userIds = [];
        for (let i = 0; i < TEST_USERS_VD.length; i++) {
            const ud = TEST_USERS_VD[i];
            let user = await User.findOne({ email: ud.email }).select("+email");
            if (user) {
                console.log(`   ⚠️  User already exists: ${ud.email}`);
            } else {
                user = new User({
                    ...ud,
                    profilePicture: STOCK.userProfile(i + 1),
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    isActive: true,
                    preferences: { emailNotifications: true, smsNotifications: false, courseUpdates: true, promotionalEmails: true, language: "en" },
                });
                await user.save();
                logCreated(`User ${i + 1}`, user._id, ud.email);
            }
            userIds.push(user._id.toString());
        }
        ids.userIds = userIds;
        separator();

        // ────────────────────────────────────────────────
        // STEP 3: COURSES (2)
        // ────────────────────────────────────────────────
        console.log("\n📚 Step 3: Creating Courses (2)");
        separator();

        const courseIds = [];
        for (let i = 0; i < COURSES_VD.length; i++) {
            const cd = COURSES_VD[i];
            let course = await Course.findOne({ title: cd.title });
            if (course) {
                console.log(`   ⚠️  Course already exists: ${cd.title}`);
            } else {
                course = new Course({
                    ...cd,
                    instructor: instructor._id,
                    thumbnail: STOCK.courseThumbnails[i],
                    trailerVideo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    discountValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                    totalModules: 3,
                    totalLessons: 15,
                    totalDuration: 1020 + i * 60,
                    status: "published",
                    isPublished: true,
                    publishedAt: new Date(),
                    enrolledCount: 0,
                    maxStudents: 5000,
                    rating: 0,
                    totalReviews: 0,
                    seoTitle: cd.title.substring(0, 50) + " | GHA",
                    seoDescription: cd.shortDescription,
                    isFree: false,
                    allowPreview: true,
                    certificateEnabled: true,
                    createdBy: instructor._id,
                    updatedBy: instructor._id,
                });
                await course.save();

                await Instructor.findByIdAndUpdate(instructor._id, {
                    $push: { courses: course._id },
                    $inc: { totalCourses: 1 },
                });

                logCreated(`Course ${i + 1}`, course._id, cd.title);
                console.log(`      💰 Price: ₹${cd.price} (Discount: ₹${cd.discountPrice})`);
            }
            courseIds.push(course._id.toString());
        }
        ids.courseIds = courseIds;
        separator();

        // ────────────────────────────────────────────────
        // STEP 4: MODULES (3 per course = 6)
        // ────────────────────────────────────────────────
        console.log("\n📦 Step 4: Creating Modules (6 total — 3 per course)");
        separator();

        const allModuleIds = [];
        const courseModuleMap = {}; // courseIndex → [moduleId, ...]

        for (let ci = 0; ci < courseIds.length; ci++) {
            const mods = ci === 0 ? MODULES_VD.course1 : MODULES_VD.course2;
            courseModuleMap[ci] = [];

            for (let mi = 0; mi < mods.length; mi++) {
                const md = mods[mi];
                const existing = await Module.findOne({ course: courseIds[ci], order: mi + 1 });
                if (existing) {
                    console.log(`   ⚠️  Module exists: ${md.title}`);
                    allModuleIds.push(existing._id.toString());
                    courseModuleMap[ci].push(existing._id.toString());
                    continue;
                }

                const mod = new Module({
                    title: md.title,
                    description: md.description,
                    course: courseIds[ci],
                    order: mi + 1,
                    thumbnail: STOCK.moduleThumbnail(ci * 3 + mi + 1),
                    isPublished: true,
                    publishedAt: new Date(),
                    objectives: md.objectives,
                    createdBy: instructor._id,
                    updatedBy: instructor._id,
                });
                await mod.save();
                allModuleIds.push(mod._id.toString());
                courseModuleMap[ci].push(mod._id.toString());
                logCreated(`  C${ci + 1}-M${mi + 1}`, mod._id, md.title);
            }

            // Link modules to course
            await Course.findByIdAndUpdate(courseIds[ci], {
                modules: courseModuleMap[ci],
                totalModules: courseModuleMap[ci].length,
            });
        }
        ids.moduleIds = allModuleIds;
        separator();

        // ────────────────────────────────────────────────
        // STEP 5: LESSONS (5 per module = 30)
        // ────────────────────────────────────────────────
        console.log("\n📝 Step 5: Creating Lessons (30 total — 5 per module)");
        separator();

        const allLessonIds = [];
        const videoLessonIds = [];
        const articleLessonIds = [];
        const assignmentLessonIds = [];
        let lessonCounter = 0;

        for (let ci = 0; ci < courseIds.length; ci++) {
            for (let mi = 0; mi < courseModuleMap[ci].length; mi++) {
                const key = `${ci}-${mi}`;
                const templates = LESSONS_VD[key] || [];

                for (let li = 0; li < templates.length; li++) {
                    const tpl = templates[li];
                    lessonCounter++;

                    const existing = await Lesson.findOne({
                        course: courseIds[ci],
                        module: courseModuleMap[ci][mi],
                        order: li + 1,
                    });
                    if (existing) {
                        allLessonIds.push(existing._id.toString());
                        if (existing.type === "video") videoLessonIds.push(existing._id.toString());
                        else if (existing.type === "article") articleLessonIds.push(existing._id.toString());
                        else if (existing.type === "assignment") assignmentLessonIds.push(existing._id.toString());
                        continue;
                    }

                    const lessonPayload = {
                        title: tpl.title,
                        description: `Lesson ${li + 1} of module ${mi + 1}: ${tpl.title}`,
                        course: courseIds[ci],
                        module: courseModuleMap[ci][mi],
                        order: li + 1,
                        thumbnail: STOCK.lessonThumbnail(lessonCounter),
                        type: tpl.type,
                        isFree: tpl.isFree,
                        isPublished: true,
                        publishedAt: new Date(),
                        createdBy: instructor._id,
                        updatedBy: instructor._id,
                    };

                    if (tpl.type === "article") {
                        lessonPayload.content = {
                            articleContent: ARTICLE_CONTENTS_VD[tpl.title] || `# ${tpl.title}\n\nArticle content placeholder for ${tpl.title}.`,
                        };
                    }

                    const lesson = new Lesson(lessonPayload);
                    await lesson.save();
                    allLessonIds.push(lesson._id.toString());

                    if (tpl.type === "video") videoLessonIds.push(lesson._id.toString());
                    else if (tpl.type === "article") articleLessonIds.push(lesson._id.toString());
                    else if (tpl.type === "assignment") assignmentLessonIds.push(lesson._id.toString());
                }

                // Update module with lesson refs + counts
                const moduleLessons = allLessonIds.slice(-templates.length);
                await Module.findByIdAndUpdate(courseModuleMap[ci][mi], {
                    lessons: moduleLessons,
                    totalLessons: templates.length,
                    totalDuration: templates.reduce((s, t) => s + (t.duration || 0), 0) / 60,
                });
            }
        }
        ids.lessonIds = allLessonIds;
        ids.videoLessonIds = videoLessonIds;
        ids.articleLessonIds = articleLessonIds;
        ids.assignmentLessonIds = assignmentLessonIds;
        console.log(`   📊 Lessons created: ${allLessonIds.length} (video: ${videoLessonIds.length}, article: ${articleLessonIds.length}, assignment: ${assignmentLessonIds.length})`);
        separator();

        // ────────────────────────────────────────────────
        // STEP 6: ASSIGNMENTS (one per assignment lesson = 6)
        // ────────────────────────────────────────────────
        console.log("\n📋 Step 6: Creating Assignments (6)");
        separator();

        const assignmentTitles = [
            "Deploy to Sepolia Testnet",
            "Build a Voting DApp",
            "Build an NFT Marketplace",
            "Reconnaissance Report",
            "Hack the Juice Shop",
            "Full Pentest Report",
        ];

        const assignmentIds = [];
        for (let i = 0; i < assignmentLessonIds.length; i++) {
            const lesson = await Lesson.findById(assignmentLessonIds[i]);
            if (!lesson) continue;

            const existing = await Assignment.findOne({ lesson: lesson._id });
            if (existing) {
                assignmentIds.push(existing._id.toString());
                console.log(`   ⚠️  Assignment exists for lesson: ${lesson.title}`);
                continue;
            }

            const assignment = new Assignment({
                title: assignmentTitles[i] || `Assignment ${i + 1}`,
                description: `Complete the following assignment: ${assignmentTitles[i]}. Submit your work as per the instructions below. This assignment tests your practical skills covered in the module.`,
                thumbnail: STOCK.assignmentThumbnail(i + 1),
                course: lesson.course,
                lesson: lesson._id,
                instructor: instructor._id,
                type: i < 3 ? "mixed" : "file",
                maxScore: 100,
                passingScore: 60,
                dueDate: new Date(Date.now() + (30 + i * 7) * 24 * 60 * 60 * 1000),
                allowLateSubmission: true,
                lateSubmissionPenalty: 10,
                instructions: `1. Read the assignment brief carefully.\n2. Complete all tasks listed.\n3. Submit before the deadline.\n4. Late submissions will have a 10% penalty.`,
                isPublished: true,
                publishedAt: new Date(),
                rubrics: [
                    { criterion: "Correctness", description: "Functional requirements met", maxPoints: 40 },
                    { criterion: "Code Quality", description: "Clean, readable, well-structured code", maxPoints: 30 },
                    { criterion: "Documentation", description: "README, comments, and explanations", maxPoints: 20 },
                    { criterion: "Bonus", description: "Extra features or creativity", maxPoints: 10 },
                ],
                createdBy: instructor._id,
                updatedBy: instructor._id,
            });
            await assignment.save();
            assignmentIds.push(assignment._id.toString());

            // Link assignment to lesson
            await Lesson.findByIdAndUpdate(lesson._id, { assignmentId: assignment._id });

            logCreated(`Assignment ${i + 1}`, assignment._id, assignmentTitles[i]);
        }
        ids.assignmentIds = assignmentIds;
        separator();

        // ────────────────────────────────────────────────
        // STEP 7: VIDEO PACKAGES (1 per course = 2)
        // ────────────────────────────────────────────────
        console.log("\n🎬 Step 7: Creating Video Packages (2)");
        separator();

        const videoPackageIds = [];
        for (let ci = 0; ci < courseIds.length; ci++) {
            const courseVideoLessons = await Lesson.find({ course: courseIds[ci], type: "video" }).sort({ order: 1 });

            const existing = await VideoPackage.findOne({ course: courseIds[ci], instructor: instructor._id });
            if (existing) {
                videoPackageIds.push(existing._id.toString());
                console.log(`   ⚠️  VideoPackage exists for course ${ci + 1}`);
                continue;
            }

            const videos = courseVideoLessons.map((l, idx) => ({
                videoId: new mongoose.Types.ObjectId(),
                bunnyVideoId: `bunny-vd-c${ci + 1}-${idx + 1}`,
                title: l.title,
                description: `Video for lesson: ${l.title}`,
                duration: LESSONS_VD[`${ci}-${Math.floor(idx / 5)}`]?.[idx % 5]?.duration || 1200,
                fileSize: 50 * 1024 * 1024 + idx * 10 * 1024 * 1024,
                url: "",
                thumbnail: "",
                status: "available",
                order: idx + 1,
            }));

            const vp = new VideoPackage({
                instructor: instructor._id,
                course: courseIds[ci],
                packageName: `${COURSES_VD[ci].title} — Video Package`,
                description: `All video lessons for ${COURSES_VD[ci].title}`,
                videos,
                isPublished: true,
                isPublic: false,
                price: 0,
                currency: "INR",
                tags: COURSES_VD[ci].tags.slice(0, 4),
                category: "lecture",
                createdBy: instructor._id,
                updatedBy: instructor._id,
            });
            await vp.save();
            videoPackageIds.push(vp._id.toString());

            // Link video package to video lessons
            for (let idx = 0; idx < courseVideoLessons.length; idx++) {
                await Lesson.findByIdAndUpdate(courseVideoLessons[idx]._id, { videoPackageId: vp._id });
            }

            // Update instructor
            await Instructor.findByIdAndUpdate(instructor._id, { $push: { videoPackages: vp._id } });

            logCreated(`VideoPackage C${ci + 1}`, vp._id, `${videos.length} videos`);
        }
        ids.videoPackageIds = videoPackageIds;
        separator();

        // ────────────────────────────────────────────────
        // STEP 8: LIVE CLASSES (1 per course = 2)
        // ────────────────────────────────────────────────
        console.log("\n📡 Step 8: Creating Live Classes (2)");
        separator();

        const liveClassTitles = [
            { title: "Live Q&A: Smart Contract Security Best Practices", tags: ["solidity", "security", "live"] },
            { title: "Live Workshop: Bug Bounty Hunting Walkthrough", tags: ["bugbounty", "pentest", "live"] },
        ];

        const liveClassIds = [];
        for (let ci = 0; ci < courseIds.length; ci++) {
            const lct = liveClassTitles[ci];
            const existing = await LiveClass.findOne({ course: courseIds[ci], instructor: instructor._id, title: lct.title });
            if (existing) {
                liveClassIds.push(existing._id.toString());
                console.log(`   ⚠️  LiveClass exists for course ${ci + 1}`);
                continue;
            }

            const lc = new LiveClass({
                instructor: instructor._id,
                course: courseIds[ci],
                title: lct.title,
                description: `Live interactive session for ${COURSES_VD[ci].title} students. Bring your questions!`,
                scheduledAt: new Date(Date.now() + (14 + ci * 7) * 24 * 60 * 60 * 1000),
                duration: 90 + ci * 30,
                timezone: "Asia/Kolkata",
                bunnyVideoId: `bunny-live-vd-c${ci + 1}`,
                rtmpUrl: "rtmp://live.bunny.net/stream",
                rtmpKey: `stream-key-vd-c${ci + 1}-${crypto.randomBytes(8).toString("hex")}`,
                playbackUrl: `https://iframe.mediadelivery.net/embed/vd-live-c${ci + 1}`,
                maxParticipants: 500,
                status: "scheduled",
                notes: "Ensure your mic and camera are ready. Join 5 minutes early.",
                tags: lct.tags,
                isPublic: false,
                createdBy: instructor._id,
                updatedBy: instructor._id,
            });
            await lc.save();
            liveClassIds.push(lc._id.toString());

            await Instructor.findByIdAndUpdate(instructor._id, {
                $push: { liveClasses: lc._id },
                $inc: { totalLiveClasses: 1 },
            });

            logCreated(`LiveClass C${ci + 1}`, lc._id, lct.title);
        }
        ids.liveClassIds = liveClassIds;
        separator();

        // ────────────────────────────────────────────────
        // STEP 9: MATERIALS (3 per course = 6)
        // ────────────────────────────────────────────────
        console.log("\n📎 Step 9: Creating Materials (6)");
        separator();

        const materialTemplates = [
            // Course 1 materials
            { title: "Solidity Cheatsheet", type: "pdf", fileUrl: "https://r2.example.com/vd-materials/solidity-cheatsheet.pdf", fileName: "solidity-cheatsheet.pdf", fileSize: 2 * 1024 * 1024, courseIdx: 0 },
            { title: "Hardhat Project Starter Kit", type: "code", fileUrl: "https://r2.example.com/vd-materials/hardhat-starter.zip", fileName: "hardhat-starter.zip", fileSize: 5 * 1024 * 1024, content: "Hardhat starter project with pre-configured tests, deployment scripts, and CI/CD.", courseIdx: 0 },
            { title: "Web3 Developer Roadmap 2026", type: "link", externalLink: "https://roadmap.sh/blockchain", courseIdx: 0 },
            // Course 2 materials
            { title: "OWASP Testing Guide v5", type: "pdf", fileUrl: "https://r2.example.com/vd-materials/owasp-testing-guide.pdf", fileName: "owasp-testing-guide-v5.pdf", fileSize: 8 * 1024 * 1024, courseIdx: 1 },
            { title: "Kali Linux Command Reference", type: "document", fileUrl: "https://r2.example.com/vd-materials/kali-commands.pdf", fileName: "kali-commands.pdf", fileSize: 1 * 1024 * 1024, courseIdx: 1 },
            { title: "TryHackMe Lab Access", type: "link", externalLink: "https://tryhackme.com", courseIdx: 1 },
        ];

        const materialIds = [];
        for (const mt of materialTemplates) {
            const ci = mt.courseIdx;
            const existing = await Material.findOne({ course: courseIds[ci], title: mt.title });
            if (existing) {
                materialIds.push(existing._id.toString());
                continue;
            }

            const material = new Material({
                instructor: instructor._id,
                course: courseIds[ci],
                module: courseModuleMap[ci][0], // first module
                title: mt.title,
                description: `Supplemental material: ${mt.title}`,
                type: mt.type,
                fileUrl: mt.fileUrl,
                externalLink: mt.externalLink,
                content: mt.content,
                fileName: mt.fileName,
                fileSize: mt.fileSize,
                mimeType: mt.type === "pdf" ? "application/pdf" : mt.type === "code" ? "application/zip" : undefined,
                isPublic: false,
                accessLevel: "enrolled_students",
                order: materialIds.filter((_, idx) => materialTemplates[idx]?.courseIdx === ci).length + 1,
                tags: COURSES_VD[ci].tags.slice(0, 3),
                status: "published",
                metadata: { language: "English", difficulty: ci === 0 ? "intermediate" : "advanced" },
                createdBy: instructor._id,
                updatedBy: instructor._id,
            });
            await material.save();
            materialIds.push(material._id.toString());
            logCreated("Material", material._id, mt.title);
        }
        ids.materialIds = materialIds;
        separator();

        // ────────────────────────────────────────────────
        // STEP 10: PAYMENTS (3 users × 2 courses = 6)
        // ────────────────────────────────────────────────
        console.log("\n💳 Step 10: Creating Payments (6)");
        separator();

        const paymentIds = [];
        for (let ui = 0; ui < userIds.length; ui++) {
            for (let ci = 0; ci < courseIds.length; ci++) {
                const existing = await Payment.findOne({ user: userIds[ui], course: courseIds[ci], status: "completed" });
                if (existing) {
                    paymentIds.push(existing._id.toString());
                    continue;
                }

                const courseData = COURSES_VD[ci];
                const payment = new Payment({
                    user: userIds[ui],
                    course: courseIds[ci],
                    amount: courseData.discountPrice,
                    currency: courseData.currency,
                    originalAmount: courseData.price,
                    paymentMethod: "razorpay",
                    paymentGatewayId: generatePaymentId(),
                    gatewayOrderId: generateOrderId(),
                    gatewaySignature: `sig_${crypto.randomBytes(16).toString("hex")}`,
                    status: "completed",
                    completedAt: new Date(Date.now() - (30 - ui * 5) * 24 * 60 * 60 * 1000),
                    taxAmount: Math.round(courseData.discountPrice * 0.18),
                    processingFee: Math.round(courseData.discountPrice * 0.02),
                    discountAmount: courseData.price - courseData.discountPrice,
                    metadata: {
                        ipAddress: `192.168.1.${100 + ui}`,
                        userAgent: "Mozilla/5.0 (seed)",
                        couponCode: ci === 0 ? "BLOCKCHAIN20" : null,
                    },
                });
                await payment.save();
                paymentIds.push(payment._id.toString());
                logCreated(`Payment U${ui + 1}-C${ci + 1}`, payment._id, `₹${courseData.discountPrice}`);
            }
        }
        ids.paymentIds = paymentIds;
        separator();

        // ────────────────────────────────────────────────
        // STEP 11: ENROLLMENTS (3 users × 2 courses = 6)
        // ────────────────────────────────────────────────
        console.log("\n🎓 Step 11: Creating Enrollments (6)");
        separator();

        const enrollmentIds = [];
        let paymentIndex = 0;
        for (let ui = 0; ui < userIds.length; ui++) {
            for (let ci = 0; ci < courseIds.length; ci++) {
                const existing = await Enrollment.findOne({ user: userIds[ui], course: courseIds[ci] });
                if (existing) {
                    enrollmentIds.push(existing._id.toString());
                    paymentIndex++;
                    continue;
                }

                const progressPct = ui === 0 ? (ci === 0 ? 100 : 60) : ui === 1 ? (ci === 0 ? 75 : 30) : (ci === 0 ? 40 : 10);
                const totalLessons = 15;
                const completedCount = Math.round((progressPct / 100) * totalLessons);

                const enrollment = new Enrollment({
                    user: userIds[ui],
                    course: courseIds[ci],
                    payment: paymentIds[paymentIndex],
                    enrolledAt: new Date(Date.now() - (28 - ui * 5) * 24 * 60 * 60 * 1000),
                    status: progressPct >= 100 ? "completed" : "active",
                    progressPercentage: progressPct,
                    completedLessons: completedCount,
                    totalLessons,
                    timeSpent: completedCount * 25,
                    lastAccessedAt: new Date(Date.now() - ui * 24 * 60 * 60 * 1000),
                    completedAt: progressPct >= 100 ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : undefined,
                    isLifetime: true,
                    certificateIssued: progressPct >= 100,
                    enrolledBy: userIds[ui],
                });
                await enrollment.save();
                enrollmentIds.push(enrollment._id.toString());

                // Increment course enrollment count
                await Course.findByIdAndUpdate(courseIds[ci], { $inc: { enrolledCount: 1 } });

                logCreated(`Enrollment U${ui + 1}-C${ci + 1}`, enrollment._id, `${progressPct}%`);
                paymentIndex++;
            }
        }
        ids.enrollmentIds = enrollmentIds;

        // Update instructor student count
        await Instructor.findByIdAndUpdate(instructor._id, { totalStudentsTeaching: userIds.length });
        separator();

        // ────────────────────────────────────────────────
        // STEP 12: PROGRESS (per user per course — 1 lesson each for sampling)
        // ────────────────────────────────────────────────
        console.log("\n📊 Step 12: Creating Progress Records");
        separator();

        const progressIds = [];
        for (let ui = 0; ui < userIds.length; ui++) {
            for (let ci = 0; ci < courseIds.length; ci++) {
                // Create progress for first lesson of first module of each course
                const firstLesson = await Lesson.findOne({ course: courseIds[ci] }).sort({ order: 1 });
                if (!firstLesson) continue;

                const existing = await Progress.findOne({ user: userIds[ui], lesson: firstLesson._id });
                if (existing) {
                    progressIds.push(existing._id.toString());
                    continue;
                }

                const pct = ui === 0 ? 100 : ui === 1 ? 70 : 30;
                const progress = new Progress({
                    user: userIds[ui],
                    course: courseIds[ci],
                    lesson: firstLesson._id,
                    status: pct >= 100 ? "completed" : pct > 0 ? "in-progress" : "not-started",
                    progressPercentage: pct,
                    timeSpent: pct * 12,
                    lastAccessedAt: new Date(Date.now() - ui * 2 * 24 * 60 * 60 * 1000),
                    completedAt: pct >= 100 ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : undefined,
                    videoProgress: firstLesson.type === "video" ? { currentTime: pct * 15, totalDuration: 1500 } : undefined,
                });
                await progress.save();
                progressIds.push(progress._id.toString());
            }
        }
        ids.progressIds = progressIds;
        console.log(`   📊 Progress records: ${progressIds.length}`);
        separator();

        // ────────────────────────────────────────────────
        // STEP 13: SUBMISSIONS (1 per user for first assignment per course)
        // ────────────────────────────────────────────────
        console.log("\n📤 Step 13: Creating Submissions");
        separator();

        const submissionIds = [];
        // First assignment per course = index 0 and 3
        const firstAssignmentPerCourse = [assignmentIds[0], assignmentIds[3]];

        for (let ui = 0; ui < userIds.length; ui++) {
            for (let ai = 0; ai < firstAssignmentPerCourse.length; ai++) {
                if (!firstAssignmentPerCourse[ai]) continue;
                const assignment = await Assignment.findById(firstAssignmentPerCourse[ai]);
                if (!assignment) continue;

                const existing = await Submission.findOne({ user: userIds[ui], assignment: assignment._id });
                if (existing) {
                    submissionIds.push(existing._id.toString());
                    continue;
                }

                const score = 60 + ui * 10 + ai * 5;
                const submission = new Submission({
                    user: userIds[ui],
                    assignment: assignment._id,
                    course: assignment.course,
                    content: {
                        text: `Submission by User ${ui + 1} for ${assignment.title}. All tasks completed as per the rubric.`,
                        files: [{ name: "submission.zip", url: "https://r2.example.com/submissions/sub.zip", type: "application/zip", size: 2 * 1024 * 1024 }],
                        links: [{ title: "GitHub Repo", url: "https://github.com/example/submission" }],
                    },
                    status: ui === 0 ? "graded" : "submitted",
                    submittedAt: new Date(Date.now() - (10 - ui * 3) * 24 * 60 * 60 * 1000),
                    gradedAt: ui === 0 ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : undefined,
                    score: ui === 0 ? score : undefined,
                    maxScore: 100,
                    grade: ui === 0 ? (score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B+" : "B") : undefined,
                    isPassed: ui === 0 ? score >= 60 : false,
                    instructorFeedback: ui === 0 ? "Great work! Clean code and good documentation." : undefined,
                    rubricScores: ui === 0
                        ? [
                              { criterion: "Correctness", score: 35, maxPoints: 40, feedback: "All tests pass" },
                              { criterion: "Code Quality", score: 25, maxPoints: 30, feedback: "Clean and readable" },
                              { criterion: "Documentation", score: 15, maxPoints: 20, feedback: "Good README" },
                              { criterion: "Bonus", score: 5, maxPoints: 10, feedback: "Nice extra feature" },
                          ]
                        : [],
                    attemptNumber: 1,
                    isLate: false,
                    latePenalty: 0,
                    submittedBy: userIds[ui],
                    gradedBy: ui === 0 ? instructor._id : undefined,
                });
                await submission.save();
                submissionIds.push(submission._id.toString());
            }
        }
        ids.submissionIds = submissionIds;
        console.log(`   📊 Submissions: ${submissionIds.length}`);
        separator();

        // ────────────────────────────────────────────────
        // STEP 14: REVIEWS (1 per user per course = 6)
        // ────────────────────────────────────────────────
        console.log("\n⭐ Step 14: Creating Reviews (6)");
        separator();

        const reviewComments = [
            { title: "Absolutely brilliant!", comment: "Vivek explains complex blockchain concepts in the simplest way possible. The hands-on projects are top-notch.", rating: 5 },
            { title: "Great course, well structured", comment: "Loved the progression from basics to advanced DeFi. The NFT marketplace project was the highlight.", rating: 4 },
            { title: "Very comprehensive", comment: "Covers everything you need to start building in Web3. Would recommend to anyone interested in blockchain.", rating: 5 },
            { title: "Best cybersecurity course!", comment: "The hands-on labs with Kali Linux and Burp Suite are incredibly practical. Vivek's real-world experience shines through.", rating: 5 },
            { title: "Solid content, great instructor", comment: "The OWASP module alone is worth the price. Very thorough coverage of web application security.", rating: 4 },
            { title: "Challenging and rewarding", comment: "The final pentest report assignment really pulls everything together. Great preparation for real security work.", rating: 5 },
        ];

        const reviewIds = [];
        let reviewIdx = 0;
        for (let ui = 0; ui < userIds.length; ui++) {
            for (let ci = 0; ci < courseIds.length; ci++) {
                const rc = reviewComments[reviewIdx];
                const existing = await Review.findOne({ user: userIds[ui], course: courseIds[ci] });
                if (existing) {
                    reviewIds.push(existing._id.toString());
                    reviewIdx++;
                    continue;
                }

                const review = new Review({
                    user: userIds[ui],
                    course: courseIds[ci],
                    rating: rc.rating,
                    title: rc.title,
                    comment: rc.comment,
                    isVerified: true,
                    isApproved: true,
                });
                await review.save();
                reviewIds.push(review._id.toString());
                logCreated(`Review U${ui + 1}-C${ci + 1}`, review._id, `${rc.rating}⭐`);
                reviewIdx++;
            }
        }
        ids.reviewIds = reviewIds;
        separator();

        // ────────────────────────────────────────────────
        // STEP 15: CERTIFICATES (for user 1 who completed course 1)
        // ────────────────────────────────────────────────
        console.log("\n🏆 Step 15: Creating Certificate");
        separator();

        const certificateIds = [];
        // User 1 completed course 1 (100%)
        const certExisting = await Certificate.findOne({ user: userIds[0], course: courseIds[0] });
        if (certExisting) {
            certificateIds.push(certExisting._id.toString());
            console.log(`   ⚠️  Certificate already exists`);
        } else {
            const cert = new Certificate({
                title: `Certificate of Completion — ${COURSES_VD[0].title}`,
                user: userIds[0],
                course: courseIds[0],
                instructor: instructor._id,
                isTemplate: false,
                completionPercentage: 100,
                totalLessons: 15,
                completedLessons: 15,
                timeSpent: 42,
                status: "active",
                certificateUrl: "https://r2.example.com/certificates/vd-cert-1.pdf",
                skills: ["Solidity", "Ethereum", "DeFi", "NFTs", "Smart Contract Auditing"],
                grade: "A",
                issuedBy: instructor._id,
                verificationCode: crypto.randomBytes(16).toString("hex"),
                shareableUrl: `https://gha.com/certificates/${crypto.randomBytes(8).toString("hex")}`,
                certificateId: `CERT-${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
            });
            await cert.save();
            certificateIds.push(cert._id.toString());
            logCreated("Certificate", cert._id, `User 1 — Course 1`);

            // Link to enrollment
            const enrollment = await Enrollment.findOne({ user: userIds[0], course: courseIds[0] });
            if (enrollment) {
                enrollment.certificateIssued = true;
                enrollment.certificateId = cert._id;
                await enrollment.save();
            }

            // Link to course
            await Course.findByIdAndUpdate(courseIds[0], { $push: { certificates: cert._id } });
        }
        ids.certificateIds = certificateIds;
        separator();

        // ────────────────────────────────────────────────
        // STEP 16: DISCUSSIONS (2 per course = 4)
        // ────────────────────────────────────────────────
        console.log("\n💬 Step 16: Creating Discussions (4)");
        separator();

        const discussionTemplates = [
            { title: "Gas optimization tips for ERC-20?", content: "I noticed my deploy costs are quite high. What are some best practices to reduce gas in Solidity?", courseIdx: 0, authorIdx: 0, authorRole: "User" },
            { title: "Best way to test reentrancy guards?", content: "I'm writing tests for my contract's reentrancy protection. Should I use Hardhat or Foundry for this?", courseIdx: 0, authorIdx: 1, authorRole: "User" },
            { title: "Recommended practice labs beyond TryHackMe?", content: "Loving the TryHackMe labs. Are there other platforms you'd recommend for more advanced challenges?", courseIdx: 1, authorIdx: 2, authorRole: "User" },
            { title: "How to approach bug bounty programs?", content: "I want to start doing bug bounties after this course. Any tips on which programs are beginner-friendly?", courseIdx: 1, authorIdx: 0, authorRole: "User" },
        ];

        const discussionIds = [];
        for (const dt of discussionTemplates) {
            const existing = await Discussion.findOne({ course: courseIds[dt.courseIdx], title: dt.title });
            if (existing) {
                discussionIds.push(existing._id.toString());
                continue;
            }

            const discussion = new Discussion({
                course: courseIds[dt.courseIdx],
                author: dt.authorRole === "User" ? userIds[dt.authorIdx] : instructor._id,
                authorRole: dt.authorRole,
                title: dt.title,
                content: dt.content,
                replies: [
                    {
                        author: instructor._id,
                        authorRole: "Instructor",
                        content: "Great question! I'll cover this in the next live session. In the meantime, check out the supplementary materials I've uploaded.",
                    },
                ],
                isResolved: false,
                isPinned: false,
                tags: COURSES_VD[dt.courseIdx].tags.slice(0, 2),
            });
            await discussion.save();
            discussionIds.push(discussion._id.toString());
            logCreated("Discussion", discussion._id, dt.title);
        }
        ids.discussionIds = discussionIds;
        separator();

        // ────────────────────────────────────────────────
        // STEP 17: ANNOUNCEMENTS (2 per course = 4)
        // ────────────────────────────────────────────────
        console.log("\n📢 Step 17: Creating Announcements (4)");
        separator();

        const announcementTemplates = [
            { title: "New Module Added: Layer-2 Deep Dive", content: "I've just published a bonus section covering Optimism and Arbitrum in detail. Check it out!", type: "new_lecture", priority: "high", courseIdx: 0 },
            { title: "Upcoming Live Q&A Session", content: "Join me this Saturday at 7 PM IST for a live Q&A on smart contract security. Link will be shared in course.", type: "live_class", priority: "normal", courseIdx: 0 },
            { title: "OWASP Top 10 — 2025 Update", content: "The OWASP Top 10 2025 list has been updated. I've refreshed the course materials to reflect the changes.", type: "update", priority: "high", courseIdx: 1 },
            { title: "Bug Bounty Workshop Registration Open", content: "Register for our exclusive bug bounty workshop. Limited spots available!", type: "general", priority: "normal", courseIdx: 1 },
        ];

        const announcementIds = [];
        for (const at of announcementTemplates) {
            const existing = await Announcement.findOne({ instructor: instructor._id, title: at.title });
            if (existing) {
                announcementIds.push(existing._id.toString());
                continue;
            }

            const ann = new Announcement({
                instructor: instructor._id,
                course: courseIds[at.courseIdx],
                title: at.title,
                content: at.content,
                type: at.type,
                priority: at.priority,
                isPublished: true,
            });
            await ann.save();
            announcementIds.push(ann._id.toString());
            logCreated("Announcement", ann._id, at.title);
        }
        ids.announcementIds = announcementIds;
        separator();

        // ────────────────────────────────────────────────
        // STEP 18: COUPONS (2)
        // ────────────────────────────────────────────────
        console.log("\n🎟️  Step 18: Creating Coupons (2)");
        separator();

        const couponTemplates = [
            { code: "BLOCKCHAIN20", discountType: "percentage", discountValue: 20, maxDiscount: 1000, usageLimit: 100, courseIdx: 0, description: "20% off Blockchain Masterclass" },
            { code: "CYBERSEC500", discountType: "flat", discountValue: 500, usageLimit: 50, courseIdx: 1, description: "₹500 off Cybersecurity Certificate" },
        ];

        const couponIds = [];
        for (const ct of couponTemplates) {
            const existing = await Coupon.findOne({ code: ct.code });
            if (existing) {
                couponIds.push(existing._id.toString());
                console.log(`   ⚠️  Coupon ${ct.code} already exists`);
                continue;
            }

            const coupon = new Coupon({
                code: ct.code,
                instructor: instructor._id,
                course: courseIds[ct.courseIdx],
                discountType: ct.discountType,
                discountValue: ct.discountValue,
                maxDiscount: ct.maxDiscount || null,
                minPurchaseAmount: 0,
                usageLimit: ct.usageLimit,
                perUserLimit: 1,
                startDate: new Date(),
                expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                isActive: true,
                description: ct.description,
            });
            await coupon.save();
            couponIds.push(coupon._id.toString());
            logCreated("Coupon", coupon._id, ct.code);
        }
        ids.couponIds = couponIds;
        separator();

        // ────────────────────────────────────────────────
        // STEP 19: NOTIFICATIONS (samples)
        // ────────────────────────────────────────────────
        console.log("\n🔔 Step 19: Creating Notifications");
        separator();

        const notificationTemplates = [
            // Instructor notifications
            { recipient: instructor._id, recipientRole: "Instructor", type: "new_enrollment", title: "New Enrollment!", message: "Arjun Mehra enrolled in Blockchain Development & Web3 Masterclass.", data: { courseId: courseIds[0] } },
            { recipient: instructor._id, recipientRole: "Instructor", type: "new_review", title: "New 5-Star Review", message: "Arjun Mehra left a 5-star review on your Blockchain course.", data: { courseId: courseIds[0] } },
            { recipient: instructor._id, recipientRole: "Instructor", type: "assignment_submission", title: "New Submission", message: "Arjun Mehra submitted the Deploy to Sepolia assignment.", data: { courseId: courseIds[0] } },
            // User notifications
            { recipient: userIds[0], recipientRole: "User", type: "certificate_issued", title: "Congratulations! 🎉", message: "Your certificate for Blockchain Development & Web3 Masterclass is ready!", data: { courseId: courseIds[0] } },
            { recipient: userIds[0], recipientRole: "User", type: "live_class_reminder", title: "Live Class Tomorrow", message: "Don't forget: Smart Contract Security Q&A tomorrow at 7 PM IST.", data: { courseId: courseIds[0] } },
            { recipient: userIds[1], recipientRole: "User", type: "announcement", title: "New Module Added", message: "Vivek Dubey added a new module: Layer-2 Deep Dive.", data: { courseId: courseIds[0] } },
        ];

        const notificationIds = [];
        for (const nt of notificationTemplates) {
            const notification = new Notification({
                ...nt,
                isRead: Math.random() > 0.5,
                readAt: Math.random() > 0.5 ? new Date() : undefined,
            });
            await notification.save();
            notificationIds.push(notification._id.toString());
        }
        ids.notificationIds = notificationIds;
        console.log(`   📊 Notifications: ${notificationIds.length}`);
        separator();

        // ────────────────────────────────────────────────
        // STEP 20: INSTRUCTOR WALLET
        // ────────────────────────────────────────────────
        console.log("\n💰 Step 20: Creating Instructor Wallet");
        separator();

        const walletTransactions = [
            { type: "credit", amount: 5499, currency: "INR", source: "course_earning", description: "Course sale: Blockchain Masterclass — Arjun Mehra", balanceAfter: 5499, status: "completed", createdAt: new Date(Date.now() - 25 * 86400000) },
            { type: "debit", amount: 549.90, currency: "INR", source: "platform_commission", description: "10% platform commission on ₹5499", balanceAfter: 4949.10, status: "completed", createdAt: new Date(Date.now() - 25 * 86400000) },
            { type: "credit", amount: 5499, currency: "INR", source: "course_earning", description: "Course sale: Blockchain Masterclass — Sneha Kapoor", balanceAfter: 10448.10, status: "completed", createdAt: new Date(Date.now() - 20 * 86400000) },
            { type: "debit", amount: 549.90, currency: "INR", source: "platform_commission", description: "10% platform commission on ₹5499", balanceAfter: 9898.20, status: "completed", createdAt: new Date(Date.now() - 20 * 86400000) },
            { type: "credit", amount: 6499, currency: "INR", source: "course_earning", description: "Course sale: Cybersecurity Certificate — Arjun Mehra", balanceAfter: 16397.20, status: "completed", createdAt: new Date(Date.now() - 18 * 86400000) },
            { type: "debit", amount: 649.90, currency: "INR", source: "platform_commission", description: "10% platform commission on ₹6499", balanceAfter: 15747.30, status: "completed", createdAt: new Date(Date.now() - 18 * 86400000) },
            { type: "credit", amount: 6499, currency: "INR", source: "course_earning", description: "Course sale: Cybersecurity Certificate — Rohan Joshi", balanceAfter: 22246.30, status: "completed", createdAt: new Date(Date.now() - 15 * 86400000) },
            { type: "debit", amount: 649.90, currency: "INR", source: "platform_commission", description: "10% platform commission on ₹6499", balanceAfter: 21596.40, status: "completed", createdAt: new Date(Date.now() - 15 * 86400000) },
            { type: "debit", amount: 10000, currency: "INR", source: "payout", description: "Withdrawal to bank account — HDFC ****1234", balanceAfter: 11596.40, status: "completed", createdAt: new Date(Date.now() - 10 * 86400000) },
            { type: "credit", amount: 5499, currency: "INR", source: "course_earning", description: "Course sale: Blockchain Masterclass — Rohan Joshi", balanceAfter: 17095.40, status: "completed", createdAt: new Date(Date.now() - 7 * 86400000) },
            { type: "debit", amount: 549.90, currency: "INR", source: "platform_commission", description: "10% platform commission on ₹5499", balanceAfter: 16545.50, status: "completed", createdAt: new Date(Date.now() - 7 * 86400000) },
            { type: "credit", amount: 6499, currency: "INR", source: "course_earning", description: "Course sale: Cybersecurity Certificate — Sneha Kapoor", balanceAfter: 23044.50, status: "completed", createdAt: new Date(Date.now() - 5 * 86400000) },
            { type: "debit", amount: 649.90, currency: "INR", source: "platform_commission", description: "10% platform commission on ₹6499", balanceAfter: 22394.60, status: "completed", createdAt: new Date(Date.now() - 5 * 86400000) },
            { type: "credit", amount: 1000, currency: "INR", source: "bonus", description: "Welcome bonus — top instructor reward", balanceAfter: 23394.60, status: "completed", createdAt: new Date(Date.now() - 3 * 86400000) },
        ];

        const existingWallet = await Wallet.findOne({ owner: instructor._id, ownerModel: "Instructor" });
        if (existingWallet) {
            ids.walletId = existingWallet._id.toString();
            console.log(`   ⚠️  Wallet already exists`);
        } else {
            const wallet = new Wallet({
                owner: instructor._id,
                ownerModel: "Instructor",
                balance: 23394.60,
                currency: "INR",
                lifetimeEarnings: 35994,
                totalWithdrawn: 10000,
                totalCredited: 36994,
                totalDebited: 13599.40,
                holdAmount: 0,
                transactions: walletTransactions,
                isActive: true,
                isFrozen: false,
                lastTransactionAt: new Date(Date.now() - 3 * 86400000),
            });
            await wallet.save();
            ids.walletId = wallet._id.toString();
            console.log(`   💰 Wallet created: balance ₹${wallet.balance}, ${walletTransactions.length} transactions`);
        }
        separator();

        // ────────────────────────────────────────────────
        // STEP 21: PAYOUT (completed withdrawal)
        // ────────────────────────────────────────────────
        console.log("\n🏦 Step 21: Creating Payout Record");
        separator();

        const existingPayout = await Payout.findOne({ owner: instructor._id, ownerModel: "Instructor", amount: 10000, status: "completed" });
        if (existingPayout) {
            ids.payoutIds = [existingPayout._id.toString()];
            console.log(`   ⚠️  Payout already exists`);
        } else {
            const payout = new Payout({
                owner: instructor._id,
                ownerModel: "Instructor",
                wallet: ids.walletId,
                amount: 10000,
                currency: "INR",
                platformFee: 0,
                tds: 0,
                netAmount: 10000,
                method: "bank_transfer",
                bankDetails: {
                    accountHolderName: "Vivek Dubey",
                    accountNumberMasked: "****1234",
                    ifsc: "HDFC0001234",
                    bankName: "HDFC Bank",
                },
                status: "completed",
                requestedAt: new Date(Date.now() - 10 * 86400000),
                processedAt: new Date(Date.now() - 9 * 86400000),
                completedAt: new Date(Date.now() - 9 * 86400000),
                transactionReference: `NEFT_${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
                notes: "First payout — monthly settlement",
            });
            await payout.save();
            ids.payoutIds = [payout._id.toString()];
            console.log(`   🏦 Payout: ₹${payout.amount} — ${payout.status}`);
        }
        separator();

        // ────────────────────────────────────────────────
        // SUMMARY
        // ────────────────────────────────────────────────
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log("\n");
        console.log("╔══════════════════════════════════════════════════════════════╗");
        console.log("║              ✅ SEED COMPLETE — VIVEK DUBEY                 ║");
        console.log("╠══════════════════════════════════════════════════════════════╣");
        console.log(`║  Instructor  : 1  (${INSTRUCTOR_DATA.email})`);
        console.log(`║  Users       : ${userIds.length}`);
        console.log(`║  Courses     : ${courseIds.length}`);
        console.log(`║  Modules     : ${allModuleIds.length}`);
        console.log(`║  Lessons     : ${allLessonIds.length} (V:${videoLessonIds.length} A:${articleLessonIds.length} Asgn:${assignmentLessonIds.length})`);
        console.log(`║  Assignments : ${assignmentIds.length}`);
        console.log(`║  VideoPackages: ${videoPackageIds.length}`);
        console.log(`║  LiveClasses : ${liveClassIds.length}`);
        console.log(`║  Materials   : ${materialIds.length}`);
        console.log(`║  Payments    : ${paymentIds.length}`);
        console.log(`║  Enrollments : ${enrollmentIds.length}`);
        console.log(`║  Progress    : ${progressIds.length}`);
        console.log(`║  Submissions : ${submissionIds.length}`);
        console.log(`║  Reviews     : ${reviewIds.length}`);
        console.log(`║  Certificates: ${certificateIds.length}`);
        console.log(`║  Discussions : ${discussionIds.length}`);
        console.log(`║  Announcements: ${announcementIds.length}`);
        console.log(`║  Coupons     : ${couponIds.length}`);
        console.log(`║  Notifications: ${notificationIds.length}`);
        console.log(`║  Wallet      : 1  (created)`);
        console.log(`║  Payouts     : ${ids.payoutIds.length}`);
        console.log(`╠══════════════════════════════════════════════════════════════╣`);
        console.log(`║  ⏱️  Completed in ${elapsed}s`);
        console.log("╚══════════════════════════════════════════════════════════════╝\n");

        // ── LOGIN CREDENTIALS ──
        console.log("🔑 LOGIN CREDENTIALS:");
        console.log(`   Instructor: ${INSTRUCTOR_DATA.email} / ${INSTRUCTOR_DATA.password}`);
        for (const u of TEST_USERS_VD) {
            console.log(`   User: ${u.email} / ${u.password}`);
        }
        console.log("");

        return ids;

    } catch (error) {
        console.error("\n❌ SEED FAILED:", error.message);
        console.error(error.stack);
        throw error;
    }
};

// ══════════════════════════════════════════════════════════════
//  CLEANUP — removes only Vivek Dubey seed data
// ══════════════════════════════════════════════════════════════

const cleanupVivekDubey = async () => {
    console.log("\n");
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║       🧹 CLEANUP — VIVEK DUBEY SEED DATA                   ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");

    try {
        await connectDB();
        console.log("✅ Database connected\n");

        // Find instructor
        const instructor = await Instructor.findOne({ email: INSTRUCTOR_DATA.email });
        if (!instructor) {
            console.log("   ⚠️  Instructor not found. Nothing to clean.");
            return;
        }
        const instructorId = instructor._id;

        // Find courses by this instructor
        const courses = await Course.find({ instructor: instructorId });
        const courseIds = courses.map(c => c._id);

        // Find users created for this seed (by their unique emails)
        const userEmails = TEST_USERS_VD.map(u => u.email);
        const users = await User.find({ email: { $in: userEmails } });
        const userObjIds = users.map(u => u._id);

        console.log("   Deleting in reverse dependency order...\n");

        // Notifications
        const notifDel = await Notification.deleteMany({
            $or: [
                { recipient: instructorId },
                { recipient: { $in: userObjIds } },
            ],
        });
        console.log(`   🗑️  Notifications: ${notifDel.deletedCount}`);

        // Wallet & Payouts
        const payoutDel = await Payout.deleteMany({ owner: instructorId, ownerModel: "Instructor" });
        console.log(`   🗑️  Payouts: ${payoutDel.deletedCount}`);
        const walletDel = await Wallet.deleteMany({ owner: instructorId, ownerModel: "Instructor" });
        console.log(`   🗑️  Wallet: ${walletDel.deletedCount}`);

        // Coupons
        const couponDel = await Coupon.deleteMany({ instructor: instructorId });
        console.log(`   🗑️  Coupons: ${couponDel.deletedCount}`);

        // Announcements
        const annDel = await Announcement.deleteMany({ instructor: instructorId });
        console.log(`   🗑️  Announcements: ${annDel.deletedCount}`);

        // Discussions
        const discDel = await Discussion.deleteMany({ course: { $in: courseIds } });
        console.log(`   🗑️  Discussions: ${discDel.deletedCount}`);

        // Certificates
        const certDel = await Certificate.deleteMany({ course: { $in: courseIds } });
        console.log(`   🗑️  Certificates: ${certDel.deletedCount}`);

        // Reviews
        const revDel = await Review.deleteMany({ course: { $in: courseIds } });
        console.log(`   🗑️  Reviews: ${revDel.deletedCount}`);

        // Submissions
        const subDel = await Submission.deleteMany({ course: { $in: courseIds } });
        console.log(`   🗑️  Submissions: ${subDel.deletedCount}`);

        // Progress
        const progDel = await Progress.deleteMany({ course: { $in: courseIds } });
        console.log(`   🗑️  Progress: ${progDel.deletedCount}`);

        // Enrollments
        const enrDel = await Enrollment.deleteMany({ course: { $in: courseIds } });
        console.log(`   🗑️  Enrollments: ${enrDel.deletedCount}`);

        // Payments
        const payDel = await Payment.deleteMany({ course: { $in: courseIds } });
        console.log(`   🗑️  Payments: ${payDel.deletedCount}`);

        // Materials
        const matDel = await Material.deleteMany({ instructor: instructorId });
        console.log(`   🗑️  Materials: ${matDel.deletedCount}`);

        // LiveClasses
        const lcDel = await LiveClass.deleteMany({ instructor: instructorId });
        console.log(`   🗑️  LiveClasses: ${lcDel.deletedCount}`);

        // VideoPackages
        const vpDel = await VideoPackage.deleteMany({ instructor: instructorId });
        console.log(`   🗑️  VideoPackages: ${vpDel.deletedCount}`);

        // Assignments
        const asgnDel = await Assignment.deleteMany({ instructor: instructorId });
        console.log(`   🗑️  Assignments: ${asgnDel.deletedCount}`);

        // Lessons
        const lsnDel = await Lesson.deleteMany({ course: { $in: courseIds } });
        console.log(`   🗑️  Lessons: ${lsnDel.deletedCount}`);

        // Modules
        const modDel = await Module.deleteMany({ course: { $in: courseIds } });
        console.log(`   🗑️  Modules: ${modDel.deletedCount}`);

        // Courses
        const crsDel = await Course.deleteMany({ instructor: instructorId });
        console.log(`   🗑️  Courses: ${crsDel.deletedCount}`);

        // Users
        // Use direct delete to bypass soft-delete pre-find hooks
        for (const uid of userObjIds) {
            await mongoose.connection.db.collection("users").deleteOne({ _id: uid });
        }
        console.log(`   🗑️  Users: ${userObjIds.length}`);

        // Instructor
        await Instructor.findByIdAndDelete(instructorId);
        console.log(`   🗑️  Instructor: 1 (${INSTRUCTOR_DATA.email})`);

        console.log("\n   ✅ Cleanup complete!\n");

    } catch (error) {
        console.error("\n❌ CLEANUP FAILED:", error.message);
        console.error(error.stack);
    }
};

// ══════════════════════════════════════════════════════════════
//  CLI ENTRY POINT
// ══════════════════════════════════════════════════════════════

const isCleanup = process.argv.includes("--cleanup");

(async () => {
    try {
        if (isCleanup) {
            await cleanupVivekDubey();
        } else {
            await seedVivekDubey();
        }
        process.exit(0);
    } catch (error) {
        console.error("❌ Fatal:", error.message);
        process.exit(1);
    }
})();
