# 🎯 ADMIN OTP AUTHENTICATION - TESTING CHECKLIST

**Date:** February 2, 2026  
**Version:** 1.0.0  
**Test Environment:** Postman / cURL

---

## ✅ PRE-TESTING SETUP

### Step 1: Environment Configuration
```
Check .env file has:
☐ MONGODB_URL=mongodb://localhost:27017/lms_admin_db
☐ JWT_SECRET=your_jwt_secret_here
☐ JWT_REFRESH_SECRET=your_refresh_secret_here
☐ ADMIN_MAIL=vivek.dubey0305@gmail.com
☐ ADMIN_ID=vivek@123
☐ SMTP_HOST=smtp.gmail.com (or your mail service)
☐ SMTP_USER=your_email@gmail.com
☐ SMTP_PASS=your_app_password
```

### Step 2: Dependencies Installed
```bash
☐ npm install
☐ All packages installed successfully
```

### Step 3: Database Running
```bash
☐ MongoDB running on port 27017
☐ lms_admin_db database accessible
```

### Step 4: Server Starting
```bash
☐ npm start (or npm run dev)
☐ Server running on port 5000
☐ No errors in console
```

### Step 5: First Admin Created
```bash
☐ Run: node seeds/admin.seed.js
☐ Output shows: "✅ Super Admin created successfully!"
☐ Admin created with:
  ☐ Email: vivek.dubey0305@gmail.com
  ☐ Password: vivek@123
  ☐ Super Admin: Yes
  ☐ All permissions assigned
```

---

## 🧪 TEST SUITE 1: LOGIN ENDPOINT

### Test 1.1: Valid Login
```
Request:
POST /api/v1/admin/login
{
  "email": "vivek.dubey0305@gmail.com",
  "password": "vivek@123"
}

Expected:
☐ Status: 200
☐ Message: "OTP sent to email. Verify to login."
☐ Data includes: email, otpExpiresIn: "10 minutes"
☐ OTP sent to console/email

Verify in Database:
☐ Admin.verificationCode is set (6-digit)
☐ Admin.verificationCodeExpires is 10 min from now
☐ Admin.isOtpVerified = false
```

### Test 1.2: Invalid Email
```
Request:
POST /api/v1/admin/login
{
  "email": "nonexistent@example.com",
  "password": "vivek@123"
}

Expected:
☐ Status: 401
☐ Message: "Invalid email or password"
```

### Test 1.3: Invalid Password
```
Request:
POST /api/v1/admin/login
{
  "email": "vivek.dubey0305@gmail.com",
  "password": "wrongpassword"
}

Expected:
☐ Status: 401
☐ Message: "Invalid email or password"

Verify in Database:
☐ Admin.loginAttempts incremented by 1
```

### Test 1.4: Multiple Failed Logins (5+ times)
```
Steps:
1. Try wrong password 5 times
2. Check loginAttempts = 5 in database
3. Try 6th login

Expected on 6th attempt:
☐ Status: 429
☐ Message: "Account locked. Try again in 120 minutes"
☐ lockUntil is set to 2 hours from now

Note: Account automatically unlocks after 2 hours
```

### Test 1.5: Inactive Admin
```
(Manually set admin.isActive = false in database)

Request:
POST /api/v1/admin/login
{
  "email": "vivek.dubey0305@gmail.com",
  "password": "vivek@123"
}

Expected:
☐ Status: 403
☐ Message: "Admin account is inactive"
```

### Test 1.6: Missing Fields
```
Request 1: Missing email
POST /api/v1/admin/login
{"password": "vivek@123"}

Expected:
☐ Status: 400
☐ Message: "Email and password are required"

Request 2: Missing password
POST /api/v1/admin/login
{"email": "vivek.dubey0305@gmail.com"}

Expected:
☐ Status: 400
☐ Message: "Email and password are required"
```

---

## 🔐 TEST SUITE 2: VERIFY OTP ENDPOINT

### Test 2.1: Valid OTP
```
Prerequisites:
☐ Have valid OTP from Test 1.1 (check console)

Request:
POST /api/v1/admin/verify-otp
{
  "email": "vivek.dubey0305@gmail.com",
  "otp": "123456"  // Use actual OTP from login
}

Expected:
☐ Status: 200
☐ Message: "Login successful"
☐ Data includes:
  ☐ admin: { id, name, email, isSuperAdmin }
  ☐ tokens: { accessToken, refreshToken, expiresIn: "15m" }
  ☐ cookies: { accessToken: "Set", refreshToken: "Set" }

Verify in Postman:
☐ Cookies tab shows: accessToken, refreshToken
☐ Cookies are httpOnly (not visible in JS)

Verify in Database:
☐ Admin.verificationCode = null (cleared)
☐ Admin.verificationCodeExpires = null (cleared)
☐ Admin.isOtpVerified = true
☐ Admin.accessToken is set
☐ Admin.refreshToken is set
☐ Admin.lastLogin updated to now
☐ Admin.loginAttempts = 0 (reset)
☐ Admin.lockUntil = undefined (unlocked)
```

### Test 2.2: Invalid OTP
```
Prerequisites:
☐ Have fresh OTP from login

Request:
POST /api/v1/admin/verify-otp
{
  "email": "vivek.dubey0305@gmail.com",
  "otp": "000000"  // Wrong OTP
}

Expected:
☐ Status: 401
☐ Message: "Invalid OTP"

Verify in Database:
☐ Admin.verificationCode still exists (not cleared)
☐ Admin.isOtpVerified = false (not changed)
```

### Test 2.3: Expired OTP
```
Prerequisites:
☐ Get OTP from login
☐ Wait 10+ minutes (or manually set verificationCodeExpires to past)

Request:
POST /api/v1/admin/verify-otp
{
  "email": "vivek.dubey0305@gmail.com",
  "otp": "123456"  // Valid OTP but expired
}

Expected:
☐ Status: 401
☐ Message: "OTP expired. Request a new OTP"

Verify in Database:
☐ Admin.verificationCode = null (auto-deleted)
☐ Admin.verificationCodeExpires = null (auto-deleted)

Note: Verify TTL index works by checking if field is removed
```

### Test 2.4: OTP Format Validation
```
Request 1: Non-6-digit OTP
POST /api/v1/admin/verify-otp
{
  "email": "vivek.dubey0305@gmail.com",
  "otp": "12345"  // Only 5 digits
}

Expected:
☐ Status: 400
☐ Message: "OTP must be a 6-digit number"

Request 2: Non-numeric OTP
POST /api/v1/admin/verify-otp
{
  "email": "vivek.dubey0305@gmail.com",
  "otp": "abcdef"
}

Expected:
☐ Status: 400
☐ Message: "OTP must be a 6-digit number"
```

### Test 2.5: Missing Fields
```
Request:
POST /api/v1/admin/verify-otp
{
  "email": "vivek.dubey0305@gmail.com"
  // Missing otp
}

Expected:
☐ Status: 400
☐ Message: "Email and OTP are required"
```

### Test 2.6: OTP Not Found
```
(Scenario: Admin tried login but didn't request OTP)

Request:
POST /api/v1/admin/verify-otp
{
  "email": "vivek.dubey0305@gmail.com",
  "otp": "123456"
}

Expected (if no OTP generated yet):
☐ Status: 400
☐ Message: "OTP not found. Request a new OTP"
```

---

## 📱 TEST SUITE 3: PROTECTED ROUTES

### Test 3.1: Get Admin Profile
```
Prerequisites:
☐ Successfully logged in (have accessToken from Test 2.1)

Request:
GET /api/v1/admin/profile
Authorization: Bearer <accessToken>

Expected:
☐ Status: 200
☐ Message: "Admin profile retrieved"
☐ Data includes:
  ☐ _id
  ☐ name: "Super Admin"
  ☐ email: "vivek.dubey0305@gmail.com"
  ☐ isSuperAdmin: true
  ☐ permissions: [array of permissions]
  ☐ isActive: true
  ☐ createdAt
  ☐ updatedAt

Verify Security:
☐ Password NOT in response
☐ Tokens NOT in response
☐ OTP fields NOT in response
☐ loginAttempts NOT in response
```

### Test 3.2: Without Access Token
```
Request:
GET /api/v1/admin/profile
(No Authorization header)

Expected:
☐ Status: 401
☐ Message: "Access token not found. Please login."
```

### Test 3.3: Invalid Access Token
```
Request:
GET /api/v1/admin/profile
Authorization: Bearer invalid.token.here

Expected:
☐ Status: 401
☐ Message: "Invalid access token"
```

### Test 3.4: Expired Access Token
```
Prerequisites:
☐ Access token older than 15 minutes
(Or manually set admin.accessTokenExpires to past)

Request:
GET /api/v1/admin/profile
Authorization: Bearer <old_accessToken>

Expected:
☐ Status: 401
☐ Message: "Access token expired. Use refresh token to get new token."
```

---

## 🔄 TEST SUITE 4: REFRESH TOKEN ENDPOINT

### Test 4.1: Valid Refresh Token
```
Prerequisites:
☐ Successfully logged in (have refreshToken from Test 2.1)

Request:
POST /api/v1/admin/refresh-token
Cookie: refreshToken=<refreshToken>

OR

POST /api/v1/admin/refresh-token
{
  "refreshToken": "<refreshToken>"
}

Expected:
☐ Status: 200
☐ Message: "Access token refreshed"
☐ Data includes:
  ☐ accessToken: "new token"
  ☐ expiresIn: "15m"

Verify:
☐ New accessToken is different from old one
☐ New cookie set with accessToken
☐ Can use new accessToken for protected routes

Verify in Database:
☐ Admin.accessToken updated
☐ Admin.accessTokenExpires updated to 15 min from now
```

### Test 4.2: Invalid Refresh Token
```
Request:
POST /api/v1/admin/refresh-token
{
  "refreshToken": "invalid.token.here"
}

Expected:
☐ Status: 401
☐ Message: "Invalid or expired refresh token"
```

### Test 4.3: Expired Refresh Token
```
Prerequisites:
☐ Refresh token older than 7 days
(Or manually set admin.refreshTokenExpires to past)

Request:
POST /api/v1/admin/refresh-token
{
  "refreshToken": "<old_refreshToken>"
}

Expected:
☐ Status: 401
☐ Message: "Invalid or expired refresh token"

Note: User must login again
```

### Test 4.4: Refresh Token After Logout
```
Prerequisites:
☐ Admin logged in
☐ Admin logged out (Test 5.1)

Request:
POST /api/v1/admin/refresh-token
{
  "refreshToken": "<old_refreshToken>"
}

Expected:
☐ Status: 401
☐ Message: "Invalid refresh token"

Verify in Database:
☐ Admin.refreshToken = null (cleared by logout)
```

---

## 🚪 TEST SUITE 5: LOGOUT ENDPOINT

### Test 5.1: Valid Logout
```
Prerequisites:
☐ Successfully logged in (have accessToken)

Request:
POST /api/v1/admin/logout
Authorization: Bearer <accessToken>

Expected:
☐ Status: 200
☐ Message: "Logout successful"
☐ Data includes:
  ☐ email: "vivek.dubey0305@gmail.com"
  ☐ message: "Tokens cleared and cookies removed"

Verify in Postman:
☐ Cookies tab: accessToken and refreshToken removed

Verify in Database:
☐ Admin.accessToken = null
☐ Admin.accessTokenExpires = null
☐ Admin.refreshToken = null
☐ Admin.refreshTokenExpires = null
☐ Admin.isOtpVerified = false
```

### Test 5.2: Logout Without Token
```
Request:
POST /api/v1/admin/logout
(No Authorization header)

Expected:
☐ Status: 401
☐ Message: "Unauthorized"
```

### Test 5.3: Operations After Logout
```
Prerequisites:
☐ Successfully logged out (Test 5.1)

Request:
GET /api/v1/admin/profile
Authorization: Bearer <old_accessToken>

Expected:
☐ Status: 401
☐ Message: "Invalid access token"
(Because token was cleared from database)
```

---

## 📧 TEST SUITE 6: RESEND OTP ENDPOINT

### Test 6.1: Valid Resend OTP
```
Prerequisites:
☐ Logged in once (have OTP set)
☐ OTP is expired or want new one

Request:
POST /api/v1/admin/resend-otp
{
  "email": "vivek.dubey0305@gmail.com"
}

Expected:
☐ Status: 200
☐ Message: "OTP resent to email"
☐ Data includes:
  ☐ email: "vivek.dubey0305@gmail.com"
  ☐ otpExpiresIn: "10 minutes"

Verify in Database:
☐ Admin.verificationCode updated (new OTP)
☐ Admin.verificationCodeExpires updated (new expiry)

Verify OTP:
☐ Can use new OTP in /verify-otp endpoint
☐ Old OTP should not work
```

### Test 6.2: Resend OTP for Invalid Email
```
Request:
POST /api/v1/admin/resend-otp
{
  "email": "nonexistent@example.com"
}

Expected:
☐ Status: 401
☐ Message: "Invalid email"
```

### Test 6.3: Resend OTP After Logout
```
Prerequisites:
☐ Admin logged out

Request:
POST /api/v1/admin/resend-otp
{
  "email": "vivek.dubey0305@gmail.com"
}

Expected:
☐ Status: 200 (still works - public endpoint)
☐ New OTP generated and sent
```

---

## 🗑️ TEST SUITE 7: OTP AUTO-DELETION

### Test 7.1: TTL Index Auto-Deletion
```
Prerequisites:
☐ Login to get fresh OTP
☐ Note the current OTP expiry time

Steps:
1. Check database: Admin.verificationCodeExpires
2. Wait 10+ minutes
3. Query database again for same admin

Verify:
☐ After 10 minutes, verificationCode becomes null
☐ verificationCodeExpires becomes null
☐ (MongoDB TTL index auto-deletes)

Check in MongoDB:
db.admins.findOne({ email: "vivek.dubey0305@gmail.com" })
- verificationCode: null or doesn't exist
- verificationCodeExpires: null or doesn't exist
```

### Test 7.2: Manual Deletion After Verification
```
Prerequisites:
☐ Get fresh OTP from login
☐ Verify OTP with correct code

Steps:
1. Check database before verification
2. Verify OTP
3. Check database after verification

Verify Before:
☐ Admin.verificationCode: "123456"
☐ Admin.verificationCodeExpires: Date (10 min future)

Verify After:
☐ Admin.verificationCode: null
☐ Admin.verificationCodeExpires: null
☐ Admin.isOtpVerified: true
```

### Test 7.3: OTP Index Verification
```
In MongoDB:

1. Check indexes exist:
db.admins.getIndexes()

Output should include:
[
  { key: { _id: 1 } },
  { key: { email: 1 }, unique: true },
  { key: { verificationCodeExpires: 1 }, expireAfterSeconds: 0 },
  { key: { verificationCode: 1 } },
  ... other indexes
]

2. Verify TTL index:
☐ verificationCodeExpires index exists
☐ expireAfterSeconds: 0 (immediate expiry after date)

3. Test TTL functionality:
db.admins.updateOne(
  { email: "vivek.dubey0305@gmail.com" },
  { $set: { verificationCodeExpires: new Date(Date.now() - 1000) } }
)
// Wait a few seconds
db.admins.findOne({ email: "vivek.dubey0305@gmail.com" })
// verificationCode and verificationCodeExpires should be null
```

---

## 📊 TEST SUITE 8: COMPREHENSIVE FLOW

### Test 8.1: Complete Login → Access → Refresh → Logout Flow
```
Step 1: Login
☐ POST /admin/login
☐ Receive: OTP sent message
☐ Database: verificationCode set

Step 2: Verify OTP
☐ POST /admin/verify-otp (with actual OTP)
☐ Receive: accessToken, refreshToken
☐ Database: OTP cleared, tokens set

Step 3: Access Protected Route
☐ GET /admin/profile (with accessToken)
☐ Receive: admin profile
☐ Verify: sensitive fields excluded

Step 4: Refresh Token
☐ POST /admin/refresh-token
☐ Receive: new accessToken
☐ Database: tokens updated

Step 5: Logout
☐ POST /admin/logout
☐ Database: all tokens cleared
☐ Cookies: removed

Step 6: Verify Logged Out
☐ GET /admin/profile (with old accessToken)
☐ Expected: 401 - Invalid access token
```

### Test 8.2: Multiple Admin Sessions
```
Note: Currently designed for single admin (super admin)
This test validates behavior if more admins added later

Setup: (Create second admin manually if needed)
db.admins.insertOne({
  name: "Admin 2",
  email: "admin2@example.com",
  password: "<hashed>",
  isSuperAdmin: false,
  permissions: ["manage_courses"]
})

Test:
1. Admin 1 logs in and gets accessToken1
2. Admin 2 logs in and gets accessToken2
3. Admin 1 accesses /profile with accessToken1
4. Admin 2 accesses /profile with accessToken2
5. Admin 1 cannot access with accessToken2

Verify:
☐ Each admin has separate tokens
☐ Tokens are admin-specific
☐ Cross-admin token usage fails
```

---

## 🔍 TEST SUITE 9: SECURITY TESTS

### Test 9.1: Password Requirements
```
Test weak passwords:
1. "password" (no uppercase, no number, no special char)
2. "12345678" (no letter, no special char)
3. "Pass123" (no special char)
4. "Pass@123" (valid - 8 chars, has all types)

Expected:
☐ First 3 rejected with validation error
☐ Last one accepted

Database verification:
☐ Password stored as bcrypt hash
☐ Original password never stored
```

### Test 9.2: Token Tampering
```
Test 1: Modified accessToken
GET /api/v1/admin/profile
Authorization: Bearer <accessToken_with_one_char_changed>

Expected:
☐ Status: 401
☐ Message: "Invalid access token"

Test 2: Reversed refreshToken
POST /api/v1/admin/refresh-token
Body: { "refreshToken": "<reversed_token>" }

Expected:
☐ Status: 401
☐ Message: "Invalid or expired refresh token"
```

### Test 9.3: Cookie Security
```
Postman Cookie Verification:
1. Login and get tokens
2. Open Cookies tab
3. Click on accessToken cookie
4. Check properties:
   ☐ httpOnly: true
   ☐ secure: true (if HTTPS)
   ☐ sameSite: strict
   ☐ path: /
```

### Test 9.4: SQL/NoSQL Injection
```
Test 1: Email field injection
POST /api/v1/admin/login
{
  "email": "vivek@example.com' or '1'='1",
  "password": "anything"
}

Expected:
☐ Status: 401
☐ Message: "Invalid email or password"
(No admin found - injection prevented)

Test 2: Password field injection
POST /api/v1/admin/login
{
  "email": "vivek.dubey0305@gmail.com",
  "password": "anything' or '1'='1"
}

Expected:
☐ Status: 401
(Password comparison safe - hashed)
```

---

## 📈 TEST SUITE 10: PERFORMANCE TESTS

### Test 10.1: Concurrent Logins
```
Postman: Run "Login" request 10 times concurrently

Expected:
☐ All requests complete successfully
☐ Each gets unique OTP
☐ No database locks
☐ Response time < 500ms per request
```

### Test 10.2: Token Generation Performance
```
Time the OTP generation:
- Should be < 100ms (instant)

Time the token generation:
- Should be < 50ms (instant)

Time the database save:
- Should be < 200ms

Total /verify-otp time:
- Should be < 500ms
```

### Test 10.3: Database Query Performance
```
Indexes created:
☐ email (unique) - fast lookup
☐ verificationCodeExpires (TTL) - auto-cleanup
☐ verificationCode - OTP lookup
☐ createdAt - sorting
☐ isActive - filtering

Verify with MongoDB:
db.admins.find().explain("executionStats")
- Should use indexes
- Should have high executionStages.stage efficiency
```

---

## ✅ FINAL VERIFICATION

### Database State After All Tests
```
Check final state:
db.admins.findOne({ email: "vivek.dubey0305@gmail.com" })

Should show:
{
  _id: ObjectId(...),
  name: "Super Admin",
  email: "vivek.dubey0305@gmail.com",
  password: "<bcrypt_hash>",
  isSuperAdmin: true,
  isActive: true,
  
  // OTP fields (after logout):
  verificationCode: null,
  verificationCodeExpires: null,
  isOtpVerified: false,
  
  // Token fields (after logout):
  accessToken: null,
  accessTokenExpires: null,
  refreshToken: null,
  refreshTokenExpires: null,
  
  // Timestamp fields:
  lastLogin: Date,
  loginAttempts: 0,
  lockUntil: undefined,
  
  createdAt: Date,
  updatedAt: Date
}
```

### TTL Index Verification
```
db.admins.getIndexes()

Should include:
{
  v: 2,
  key: { verificationCodeExpires: 1 },
  expireAfterSeconds: 0,
  name: "verificationCodeExpires_1"
}
```

---

## 📋 SUMMARY

Total Test Cases: **45+**
Categories:
- Login: 6 tests
- Verify OTP: 6 tests
- Protected Routes: 4 tests
- Refresh Token: 4 tests
- Logout: 3 tests
- Resend OTP: 3 tests
- Auto-Deletion: 3 tests
- Comprehensive Flow: 2 tests
- Security: 4 tests
- Performance: 3 tests

---

## 🎯 EXPECTED RESULTS

All tests should:
✅ Return expected status codes
✅ Include proper error messages
✅ Update database correctly
✅ Manage tokens securely
✅ Auto-delete OTPs on time
✅ Handle edge cases gracefully

---

**Ready for Testing!** 🚀

Date: February 2, 2026  
Version: 1.0.0  
Status: ✅ ALL SYSTEMS READY
