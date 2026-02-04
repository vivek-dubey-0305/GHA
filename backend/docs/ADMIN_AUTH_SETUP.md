# 🔐 Admin Authentication System - Setup & Implementation Guide

## Overview
OTP-based admin authentication system with secure token management, automatic OTP expiry, and database integration.

---

## 📋 Features Implemented

### 1. **Admin Schema Updates**
- ✅ Verification Code (OTP) with auto-deletion
- ✅ Verification Code Expiry (10 minutes, auto-deletes via MongoDB TTL index)
- ✅ Access Token & Expiry (15 minutes)
- ✅ Refresh Token & Expiry (7 days)
- ✅ OTP Verification Status Flag
- ✅ Auto-delete after successful verification
- ✅ Auto-delete after expiry

### 2. **OTP-Based Login Flow**
```
Step 1: Admin Login
  POST /api/v1/admin/login
  Input: email, password
  Output: OTP sent to email
  
Step 2: Verify OTP
  POST /api/v1/admin/verify-otp
  Input: email, otp
  Output: accessToken, refreshToken (via cookies)
  
Step 3: Access Protected Routes
  GET /api/v1/admin/profile
  Header: Authorization: Bearer <accessToken>
```

### 3. **Token Management**
- Access Token: 15 minutes validity
- Refresh Token: 7 days validity
- Automatic token refresh endpoint
- Secure cookie storage (httpOnly, sameSite: strict)

### 4. **Auto-Deletion Features**
- OTP automatically deletes after 10 minutes (MongoDB TTL index)
- OTP immediately deleted after successful verification
- Tokens cleared on logout

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Create/Update `.env` file:
```env
# Database
MONGODB_URL=mongodb://localhost:27017/lms_admin_db

# JWT Secrets
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here

# Admin Seed Credentials (First Admin Only)
ADMIN_MAIL=vivek.dubey0305@gmail.com
ADMIN_ID=vivek@123

# Mail Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Server
PORT=5000
NODE_ENV=development
```

### Step 3: Run Admin Seed Script
Create the first super admin:
```bash
node seeds/admin.seed.js
```

Output:
```
✅ Super Admin created successfully!

Admin Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: vivek.dubey0305@gmail.com
🔐 Password: vivek@123
👑 Super Admin: Yes
✓ Active: Yes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4: Start Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

---

## 📱 API Endpoints

### Public Endpoints

#### 1. Login (Send OTP)
```http
POST /api/v1/admin/login
Content-Type: application/json

{
  "email": "vivek.dubey0305@gmail.com",
  "password": "vivek@123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "OTP sent to email. Verify to login.",
  "data": {
    "email": "vivek.dubey0305@gmail.com",
    "message": "Check your email for the 6-digit OTP",
    "otpExpiresIn": "10 minutes"
  }
}
```

---

#### 2. Verify OTP
```http
POST /api/v1/admin/verify-otp
Content-Type: application/json

{
  "email": "vivek.dubey0305@gmail.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "admin": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Super Admin",
      "email": "vivek.dubey0305@gmail.com",
      "isSuperAdmin": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "15m"
    },
    "cookies": {
      "accessToken": "Set",
      "refreshToken": "Set"
    }
  }
}
```

**Cookies Set:**
- `accessToken` (httpOnly, 15 minutes)
- `refreshToken` (httpOnly, 7 days)

---

#### 3. Resend OTP
```http
POST /api/v1/admin/resend-otp
Content-Type: application/json

{
  "email": "vivek.dubey0305@gmail.com"
}
```

---

#### 4. Refresh Access Token
```http
POST /api/v1/admin/refresh-token
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Access token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

---

### Protected Endpoints (Require Authentication)

#### 5. Get Admin Profile
```http
GET /api/v1/admin/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

#### 6. Logout
```http
POST /api/v1/admin/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Logout successful",
  "data": {
    "email": "vivek.dubey0305@gmail.com",
    "message": "Tokens cleared and cookies removed"
  }
}
```

---

## 🧪 Testing with Postman

### Import Collection
1. Open Postman
2. Create new folder: "Admin Auth"
3. Add requests as per endpoints above

### Set Environment Variables
```json
{
  "baseUrl": "http://localhost:5000/api/v1",
  "email": "vivek.dubey0305@gmail.com",
  "password": "vivek@123",
  "accessToken": "",
  "refreshToken": ""
}
```

### Auto-populate Tokens in Postman
After verify-otp request, add this in Tests tab:
```javascript
if (pm.response.code === 200) {
    pm.environment.set("accessToken", pm.response.json().data.tokens.accessToken);
    pm.environment.set("refreshToken", pm.response.json().data.tokens.refreshToken);
}
```

### Test Sequence
1. **POST** `/admin/login` → Get OTP
2. Check email for OTP (or check console in dev)
3. **POST** `/admin/verify-otp` → Get tokens
4. **GET** `/admin/profile` → Verify access
5. **POST** `/admin/logout` → Clear tokens

---

## 🔄 Database Schema Reference

### Admin Collection Fields

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed, excluded from queries),
  
  // OTP Fields
  verificationCode: String (6-digit OTP),
  verificationCodeExpires: Date (expires in 10 min, auto-delete via TTL index),
  isOtpVerified: Boolean (default: false),
  
  // Token Fields
  accessToken: String,
  accessTokenExpires: Date,
  refreshToken: String,
  refreshTokenExpires: Date,
  
  // Other security fields...
  permissions: [String],
  isSuperAdmin: Boolean,
  isActive: Boolean,
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}
```

### Indexes
- `email` (unique)
- `verificationCodeExpires` (TTL index for auto-deletion)
- `createdAt`, `isActive`, `deletedAt`

---

## 🔐 Security Features

1. **Password Security**
   - Bcrypt hashing with salt rounds 12
   - Required format: uppercase, lowercase, number, special char

2. **OTP Security**
   - 6-digit random code
   - 10-minute validity
   - Auto-deletes on expiry or successful verification
   - Cannot reuse same OTP

3. **Token Security**
   - JWT with secure secret keys
   - httpOnly cookies (not accessible via JavaScript)
   - sameSite: strict (CSRF protection)
   - Short-lived access tokens
   - Long-lived refresh tokens

4. **Account Protection**
   - Login attempt tracking
   - Account lockout after 5 failed attempts (2 hours)
   - Soft delete for admin accounts

---

## 📧 Email Integration

The system uses OTP template to send emails. Configure your mail service:

```javascript
// In admin.auth.controller.js
const emailHtml = otpTemplate({
    userName: admin.name,
    otp: otp,
    otpType: "login",
    expiryTime: "10 minutes",
    expiryMinutes: 10
});

// Send via mail service
await mailService.send({
    to: admin.email,
    subject: "Admin Login OTP Verification",
    html: emailHtml
});
```

### Development Testing
For testing without email service, check console logs:
```
📧 OTP sent to vivek.dubey0305@gmail.com: 123456
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: OTP not deleting after expiry
**Solution:** Ensure MongoDB is running and TTL index is created:
```javascript
// TTL index in schema
verificationCodeExpires: {
    type: Date,
    index: { expireAfterSeconds: 0 }
}
```

### Issue 2: Token not stored in cookies
**Solution:** 
- Ensure credentials mode in fetch: `credentials: 'include'`
- Check Postman cookie handling settings
- Verify httpOnly flag is set correctly

### Issue 3: "OTP expired" on valid OTP
**Solution:** Check system time synchronization and OTP generation time

### Issue 4: Cannot login with correct credentials
**Solution:** 
- Check password matches exactly (case-sensitive)
- Verify admin is created with seed script
- Check admin.isActive = true

---

## 📚 File Structure

```
backend/
├── models/
│   └── admin.model.js (updated with OTP & tokens)
├── controllers/
│   └── admin.auth.controller.js (new - auth logic)
├── routes/
│   └── admin.auth.routes.js (new - API routes)
├── middlewares/
│   └── admin.auth.middleware.js (new - verification)
├── templates/
│   └── otp.template.js (email template)
├── seeds/
│   └── admin.seed.js (new - first admin setup)
├── utils/
│   └── response.utils.js (new - response formatting)
└── docs/
    └── ADMIN_AUTH_POSTMAN_GUIDE.md (testing guide)
```

---

## 🎯 Next Steps

1. ✅ Run seed script for first admin
2. ✅ Test all endpoints in Postman
3. ✅ Configure mail service for OTP emails
4. ✅ Integrate with frontend login page
5. ⏳ Add more admin management endpoints (update, delete, list)
6. ⏳ Add role-based access control (RBAC)

---

## 📞 Support

For detailed Postman testing guide, see: `docs/ADMIN_AUTH_POSTMAN_GUIDE.md`

---

**Version:** 1.0.0  
**Last Updated:** February 2, 2026  
**Status:** ✅ Ready for Testing
