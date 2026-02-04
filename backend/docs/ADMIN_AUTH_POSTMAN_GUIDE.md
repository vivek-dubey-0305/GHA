/**
 * ADMIN AUTHENTICATION - POSTMAN TESTING GUIDE
 * 
 * OTP-Based Login Flow
 * 
 * This document contains all API endpoints and their examples for testing
 * the admin authentication system in Postman.
 */

// ============================================================================
// 1. STEP 1: LOGIN (Email + Password) → Send OTP
// ============================================================================

/**
 * Endpoint: POST /api/v1/admin/login
 * Description: Verify admin credentials and send OTP to email
 * Access: Public
 */

POST /api/v1/admin/login
Content-Type: application/json

{
  "email": "vivek.dubey0305@gmail.com",
  "password": "vivek@123"
}

// Success Response (200):
{
  "status": "success",
  "statusCode": 200,
  "message": "OTP sent to email. Verify to login.",
  "data": {
    "email": "vivek.dubey0305@gmail.com",
    "message": "Check your email for the 6-digit OTP",
    "otpExpiresIn": "10 minutes"
  },
  "timestamp": "2026-02-02T10:30:45.123Z"
}

// Error Responses:
// 400 - Missing email or password
{
  "status": "error",
  "statusCode": 400,
  "message": "Email and password are required",
  "timestamp": "2026-02-02T10:30:45.123Z"
}

// 401 - Invalid credentials
{
  "status": "error",
  "statusCode": 401,
  "message": "Invalid email or password",
  "timestamp": "2026-02-02T10:30:45.123Z"
}

// 403 - Admin account inactive
{
  "status": "error",
  "statusCode": 403,
  "message": "Admin account is inactive",
  "timestamp": "2026-02-02T10:30:45.123Z"
}

// 429 - Account locked (too many failed attempts)
{
  "status": "error",
  "statusCode": 429,
  "message": "Account locked. Try again in 120 minutes",
  "timestamp": "2026-02-02T10:30:45.123Z"
}

// ============================================================================
// 2. STEP 2: VERIFY OTP → Get Access & Refresh Tokens
// ============================================================================

/**
 * Endpoint: POST /api/v1/admin/verify-otp
 * Description: Verify OTP and get access/refresh tokens
 * Access: Public
 * Note: OTP sent to email in step 1 (valid for 10 minutes)
 */

POST /api/v1/admin/verify-otp
Content-Type: application/json

{
  "email": "vivek.dubey0305@gmail.com",
  "otp": "123456"
}

// Success Response (200):
{
  "status": "success",
  "statusCode": 200,
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
  },
  "timestamp": "2026-02-02T10:35:00.123Z"
}

// Error Responses:
// 400 - Missing email or OTP
{
  "status": "error",
  "statusCode": 400,
  "message": "Email and OTP are required",
  "timestamp": "2026-02-02T10:35:00.123Z"
}

// 400 - Invalid OTP format
{
  "status": "error",
  "statusCode": 400,
  "message": "OTP must be a 6-digit number",
  "timestamp": "2026-02-02T10:35:00.123Z"
}

// 401 - Invalid OTP
{
  "status": "error",
  "statusCode": 401,
  "message": "Invalid OTP",
  "timestamp": "2026-02-02T10:35:00.123Z"
}

// 401 - OTP expired
{
  "status": "error",
  "statusCode": 401,
  "message": "OTP expired. Request a new OTP",
  "timestamp": "2026-02-02T10:35:00.123Z"
}

// ============================================================================
// 3. RESEND OTP (if not received or expired)
// ============================================================================

/**
 * Endpoint: POST /api/v1/admin/resend-otp
 * Description: Resend OTP to email if expired or not received
 * Access: Public
 */

POST /api/v1/admin/resend-otp
Content-Type: application/json

{
  "email": "vivek.dubey0305@gmail.com"
}

// Success Response (200):
{
  "status": "success",
  "statusCode": 200,
  "message": "OTP resent to email",
  "data": {
    "email": "vivek.dubey0305@gmail.com",
    "otpExpiresIn": "10 minutes"
  },
  "timestamp": "2026-02-02T10:40:00.123Z"
}

// ============================================================================
// 4. GET ADMIN PROFILE (Protected Route)
// ============================================================================

/**
 * Endpoint: GET /api/v1/admin/profile
 * Description: Get current admin profile (requires authentication)
 * Access: Private (requires valid access token)
 * Headers: Authorization: Bearer <accessToken> OR Cookie with accessToken
 */

GET /api/v1/admin/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// OR
Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Success Response (200):
{
  "status": "success",
  "statusCode": 200,
  "message": "Admin profile retrieved",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Super Admin",
    "email": "vivek.dubey0305@gmail.com",
    "isSuperAdmin": true,
    "isActive": true,
    "permissions": [
      "manage_users",
      "manage_courses",
      "manage_instructors",
      "manage_payments",
      "view_analytics",
      "system_settings",
      "delete_data"
    ],
    "lastLogin": "2026-02-02T10:35:00.000Z",
    "createdAt": "2026-02-01T15:20:00.000Z",
    "updatedAt": "2026-02-02T10:35:00.000Z"
  },
  "timestamp": "2026-02-02T10:45:00.123Z"
}

// Error Response (401):
{
  "status": "error",
  "statusCode": 401,
  "message": "Access token not found. Please login.",
  "timestamp": "2026-02-02T10:45:00.123Z"
}

// ============================================================================
// 5. REFRESH ACCESS TOKEN
// ============================================================================

/**
 * Endpoint: POST /api/v1/admin/refresh-token
 * Description: Get new access token using refresh token
 * Access: Private (requires valid refresh token)
 * Token Validity: Refresh token is valid for 7 days
 */

POST /api/v1/admin/refresh-token
Content-Type: application/json
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// OR pass in body:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Success Response (200):
{
  "status": "success",
  "statusCode": 200,
  "message": "Access token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  },
  "timestamp": "2026-02-02T11:00:00.123Z"
}

// ============================================================================
// 6. LOGOUT (Protected Route)
// ============================================================================

/**
 * Endpoint: POST /api/v1/admin/logout
 * Description: Logout admin and clear tokens
 * Access: Private (requires valid access token)
 */

POST /api/v1/admin/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Success Response (200):
{
  "status": "success",
  "statusCode": 200,
  "message": "Logout successful",
  "data": {
    "email": "vivek.dubey0305@gmail.com",
    "message": "Tokens cleared and cookies removed"
  },
  "timestamp": "2026-02-02T11:05:00.123Z"
}

// ============================================================================
// AUTHENTICATION FLOW SUMMARY
// ============================================================================

/*
STEP-BY-STEP TESTING GUIDE:

1. INITIAL SETUP (One-time):
   - Run: node seeds/admin.seed.js
   - This creates the first super admin with credentials from .env
   - Email: vivek.dubey0305@gmail.com
   - Password: vivek@123

2. LOGIN FLOW:
   Step 1: POST /api/v1/admin/login
   - Input: email, password
   - Output: OTP sent to email
   - Check email for 6-digit OTP (valid for 10 minutes)
   
   Step 2: POST /api/v1/admin/verify-otp
   - Input: email, otp
   - Output: accessToken, refreshToken (set as cookies)
   - Tokens are ready to use in subsequent requests

3. PROTECTED REQUESTS:
   - Use accessToken in Authorization header or Cookie
   - Access token is valid for 15 minutes
   - If expired, use POST /api/v1/admin/refresh-token

4. TOKEN EXPIRY & REFRESH:
   - Access Token: 15 minutes
   - Refresh Token: 7 days
   - If refresh token expires, login again

5. LOGOUT:
   - POST /api/v1/admin/logout to clear all tokens
   - Cookies will be removed

6. OTP AUTO-DELETION:
   - OTP auto-deletes after 10 minutes (MongoDB TTL index)
   - OTP auto-deletes immediately after successful verification
   - Expired OTP must be requested again via /resend-otp
*/

// ============================================================================
// POSTMAN ENVIRONMENT VARIABLES (Setup)
// ============================================================================

/*
Add these to your Postman environment for easier testing:

{
  "baseUrl": "http://localhost:5000/api/v1",
  "email": "vivek.dubey0305@gmail.com",
  "password": "vivek@123",
  "otp": "",
  "accessToken": "",
  "refreshToken": ""
}

In POST-RESPONSE scripts, auto-populate tokens:
pm.environment.set("accessToken", pm.response.json().data.tokens.accessToken);
pm.environment.set("refreshToken", pm.response.json().data.tokens.refreshToken);
*/

// ============================================================================
// TESTING SCENARIOS
// ============================================================================

/*
SCENARIO 1: Successful Login
→ POST /api/v1/admin/login (email, password)
→ POST /api/v1/admin/verify-otp (email, correct otp)
✓ Result: Login successful, tokens set

SCENARIO 2: Wrong OTP
→ POST /api/v1/admin/login (email, password)
→ POST /api/v1/admin/verify-otp (email, wrong otp)
✗ Result: Invalid OTP error

SCENARIO 3: Expired OTP
→ POST /api/v1/admin/login (email, password)
→ Wait 10+ minutes
→ POST /api/v1/admin/verify-otp (email, otp)
✗ Result: OTP expired error
→ POST /api/v1/admin/resend-otp (email)
→ POST /api/v1/admin/verify-otp (email, new otp)
✓ Result: Login successful

SCENARIO 4: Access Protected Route
→ GET /api/v1/admin/profile (with accessToken)
✓ Result: Admin profile returned

SCENARIO 5: Refresh Token
→ POST /api/v1/admin/refresh-token (with refreshToken)
✓ Result: New accessToken generated

SCENARIO 6: Logout
→ POST /api/v1/admin/logout (with accessToken)
✓ Result: Tokens cleared and cookies removed
*/
