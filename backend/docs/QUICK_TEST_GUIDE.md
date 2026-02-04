#!/usr/bin/env node

/**
 * QUICK START TEST COMMANDS
 * Copy and paste these commands in terminal or Postman
 */

// ============================================================================
// 1. SEED FIRST ADMIN (Run this first!)
// ============================================================================

/*
Command:
node seeds/admin.seed.js

Output:
✅ Super Admin created successfully!

Admin Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: vivek.dubey0305@gmail.com
🔐 Password: vivek@123
👑 Super Admin: Yes
✓ Active: Yes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

// ============================================================================
// 2. CURL COMMANDS (Terminal)
// ============================================================================

// LOGIN - SEND OTP
curl -X POST http://localhost:5000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vivek.dubey0305@gmail.com",
    "password": "vivek@123"
  }' \
  -v

// Expected Response:
// {
//   "status": "success",
//   "message": "OTP sent to email. Verify to login.",
//   "data": {
//     "email": "vivek.dubey0305@gmail.com",
//     "otpExpiresIn": "10 minutes"
//   }
// }

// ============================================================================

// VERIFY OTP - GET TOKENS
curl -X POST http://localhost:5000/api/v1/admin/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vivek.dubey0305@gmail.com",
    "otp": "123456"
  }' \
  -c cookies.txt \
  -v

// Replace "123456" with actual OTP from email
// Use -c cookies.txt to save cookies for next requests

// Expected Response:
// {
//   "status": "success",
//   "message": "Login successful",
//   "data": {
//     "tokens": {
//       "accessToken": "eyJ...",
//       "refreshToken": "eyJ...",
//       "expiresIn": "15m"
//     }
//   }
// }

// ============================================================================

// GET ADMIN PROFILE (Protected Route)
curl -X GET http://localhost:5000/api/v1/admin/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -b cookies.txt \
  -v

// Use accessToken from verify-otp response
// Or use cookies.txt saved from previous request

// ============================================================================

// RESEND OTP
curl -X POST http://localhost:5000/api/v1/admin/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vivek.dubey0305@gmail.com"
  }' \
  -v

// ============================================================================

// REFRESH ACCESS TOKEN
curl -X POST http://localhost:5000/api/v1/admin/refresh-token \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -v

// ============================================================================

// LOGOUT
curl -X POST http://localhost:5000/api/v1/admin/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -b cookies.txt \
  -v

// ============================================================================
// 3. POSTMAN QUICK TEST
// ============================================================================

/*
1. Open Postman
2. Create new collection: "Admin Auth Testing"

3. Create requests:

REQUEST 1: Login
- Method: POST
- URL: {{baseUrl}}/admin/login
- Body (JSON):
{
  "email": "vivek.dubey0305@gmail.com",
  "password": "vivek@123"
}

REQUEST 2: Verify OTP
- Method: POST
- URL: {{baseUrl}}/admin/verify-otp
- Body (JSON):
{
  "email": "vivek.dubey0305@gmail.com",
  "otp": "PASTE_OTP_HERE"
}
- Tests Tab:
  if (pm.response.code === 200) {
      pm.environment.set("accessToken", pm.response.json().data.tokens.accessToken);
  }

REQUEST 3: Get Profile
- Method: GET
- URL: {{baseUrl}}/admin/profile
- Headers:
  Authorization: Bearer {{accessToken}}

REQUEST 4: Logout
- Method: POST
- URL: {{baseUrl}}/admin/logout
- Headers:
  Authorization: Bearer {{accessToken}}

4. Create Environment Variables:
{
  "baseUrl": "http://localhost:5000/api/v1",
  "accessToken": ""
}
*/

// ============================================================================
// 4. JAVASCRIPT FETCH EXAMPLES
// ============================================================================

// LOGIN - SEND OTP
async function loginAdmin() {
  const response = await fetch('http://localhost:5000/api/v1/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies
    body: JSON.stringify({
      email: 'vivek.dubey0305@gmail.com',
      password: 'vivek@123'
    })
  });
  
  const data = await response.json();
  console.log(data);
  // Check email for OTP
}

// VERIFY OTP
async function verifyOtp(otp) {
  const response = await fetch('http://localhost:5000/api/v1/admin/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies
    body: JSON.stringify({
      email: 'vivek.dubey0305@gmail.com',
      otp: otp
    })
  });
  
  const data = await response.json();
  console.log(data);
  // Tokens now in cookies
}

// GET PROFILE
async function getProfile(token) {
  const response = await fetch('http://localhost:5000/api/v1/admin/profile', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include'
  });
  
  const data = await response.json();
  console.log(data);
}

// LOGOUT
async function logout(token) {
  const response = await fetch('http://localhost:5000/api/v1/admin/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include'
  });
  
  const data = await response.json();
  console.log(data);
}

// ============================================================================
// 5. TESTING SCENARIOS
// ============================================================================

const testScenarios = {
  scenario1: {
    name: "Successful Login Flow",
    steps: [
      "1. POST /admin/login with correct credentials",
      "2. Check email for OTP",
      "3. POST /admin/verify-otp with correct OTP",
      "✓ Receive accessToken and refreshToken in cookies",
      "✓ OTP auto-deleted from database"
    ],
    expectedResult: "Login successful, ready for authenticated requests"
  },

  scenario2: {
    name: "Wrong OTP",
    steps: [
      "1. POST /admin/login",
      "2. POST /admin/verify-otp with WRONG otp (e.g., 000000)",
      "✗ Error: Invalid OTP"
    ],
    expectedResult: "Cannot login with wrong OTP"
  },

  scenario3: {
    name: "Expired OTP",
    steps: [
      "1. POST /admin/login",
      "2. Wait 10+ minutes",
      "3. POST /admin/verify-otp with old OTP",
      "✗ Error: OTP expired",
      "4. POST /admin/resend-otp",
      "5. POST /admin/verify-otp with new OTP",
      "✓ Login successful"
    ],
    expectedResult: "OTP auto-deleted after expiry, must regenerate"
  },

  scenario4: {
    name: "Multiple Failed Logins",
    steps: [
      "1. POST /admin/login with WRONG password 5 times",
      "6th attempt: Error 429 - Account locked (2 hours)",
      "✓ loginAttempts = 5, lockUntil = 2 hours from now"
    ],
    expectedResult: "Account locked for 2 hours after 5 failed attempts"
  },

  scenario5: {
    name: "Access Protected Route",
    steps: [
      "1. Login and get accessToken",
      "2. GET /admin/profile with accessToken",
      "✓ Receive admin details"
    ],
    expectedResult: "Protected routes work with valid accessToken"
  },

  scenario6: {
    name: "Expired Access Token",
    steps: [
      "1. Get accessToken (15 min validity)",
      "2. Wait 15+ minutes",
      "3. GET /admin/profile with old accessToken",
      "✗ Error: Access token expired",
      "4. POST /admin/refresh-token with refreshToken",
      "✓ Get new accessToken",
      "5. GET /admin/profile with new accessToken",
      "✓ Works"
    ],
    expectedResult: "Refresh token successfully extends session"
  },

  scenario7: {
    name: "Logout",
    steps: [
      "1. Login and get tokens",
      "2. POST /admin/logout",
      "✓ Tokens cleared from database",
      "✓ Cookies removed",
      "3. Try GET /admin/profile",
      "✗ Error: Access token not found"
    ],
    expectedResult: "Complete session cleanup on logout"
  }
};

// ============================================================================
// 6. DATABASE VERIFICATION
// ============================================================================

/*
MongoDB Commands to verify OTP auto-deletion:

// Check admin record
db.admins.findOne({ email: "vivek.dubey0305@gmail.com" })

// Should show:
{
  _id: ObjectId(...),
  email: "vivek.dubey0305@gmail.com",
  name: "Super Admin",
  isSuperAdmin: true,
  verificationCode: null,  // Cleared after login or auto-deleted after 10 min
  verificationCodeExpires: null,
  accessToken: "eyJ...",
  refreshToken: "eyJ...",
  isOtpVerified: true,
  ...
}

// Check TTL indexes
db.admins.getIndexes()

// Should show:
{
  key: { verificationCodeExpires: 1 },
  expireAfterSeconds: 0
}

// Force immediate OTP generation for testing:
db.admins.updateOne(
  { email: "vivek.dubey0305@gmail.com" },
  {
    $set: {
      verificationCode: "123456",
      verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000)
    }
  }
)
*/

// ============================================================================
// 7. ENVIRONMENTAL TROUBLESHOOTING
// ============================================================================

const troubleshooting = {
  "OTP not received": [
    "✓ Check email spam/junk folder",
    "✓ Check console logs (dev mode prints OTP)",
    "✓ Verify SMTP configuration in .env",
    "✓ Check mailService integration in controller"
  ],

  "Tokens not in cookies": [
    "✓ Ensure credentials: 'include' in fetch",
    "✓ Check Postman cookie handling (Auto-manage cookies)",
    "✓ Verify httpOnly flag is set in response",
    "✓ Check secure flag in production"
  ],

  "OTP not deleting after expiry": [
    "✓ Verify MongoDB is running",
    "✓ Check TTL index exists: db.admins.getIndexes()",
    "✓ Ensure verificationCodeExpires is Date type",
    "✓ Recreate index if missing"
  ],

  "Cannot refresh token": [
    "✓ Ensure refreshToken is valid (not > 7 days old)",
    "✓ Check JWT_REFRESH_SECRET matches in .env",
    "✓ Verify refresh token stored in database",
    "✓ Check token hasn't been cleared by logout"
  ]
};

// ============================================================================
// 8. PRODUCTION CHECKLIST
// ============================================================================

const productionChecklist = [
  "□ Change JWT_SECRET and JWT_REFRESH_SECRET to strong random values",
  "□ Configure SMTP service for email delivery",
  "□ Set NODE_ENV=production",
  "□ Set secure: true for cookies",
  "□ Add rate limiting to /login endpoint",
  "□ Add CORS configuration",
  "□ Enable HTTPS for all endpoints",
  "□ Implement email verification for new admins",
  "□ Add admin activity logging",
  "□ Setup monitoring for login failures",
  "□ Configure backup strategy for database",
  "□ Test OTP email delivery in staging",
  "□ Setup SSL/TLS certificates",
  "□ Add request validation and sanitization",
  "□ Implement audit logging for admin actions"
];

module.exports = {
  testScenarios,
  troubleshooting,
  productionChecklist
};
