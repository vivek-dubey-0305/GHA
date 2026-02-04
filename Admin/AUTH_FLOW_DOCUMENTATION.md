# Admin Authentication Flow Documentation

## Overview

The admin authentication system implements a secure two-factor login flow with OTP verification and automatic token refresh mechanism.

## Authentication Flow

### Step 1: Login Page (`/admin/login`)
- User enters email and password
- Credentials are validated on the frontend:
  - Email format validation
  - Password minimum length (8 characters)
- On submission, the `login` async thunk is dispatched

**Backend Process:**
- Backend validates credentials against the database
- If valid, generates a 6-digit OTP
- Sends OTP to user's email address
- Returns success response with email

**Frontend Response:**
- On success: Redirect to Verify page with email in state
- On error: Show error toast with message
- Handles account lock after failed attempts (429 status)

### Step 2: Verify OTP Page (`/admin/verify`)
- Receives email from previous page state
- User enters the 6-digit OTP they received
- Real-time validation of OTP format (numeric, 6 digits)
- Resend button with 60-second cooldown

**Backend Process:**
- Validates OTP against stored verification code
- Checks OTP expiry (10 minutes from issue)
- Checks OTP attempt limit (max 5 attempts)
- If valid:
  - Clears OTP verification fields
  - Generates JWT access token (15 minutes expiry)
  - Generates JWT refresh token (30 days expiry)
  - Stores refresh token hash in sessions array
  - Sets httpOnly cookies with tokens
  - Returns admin profile data

**Frontend Response:**
- On success:
  - Updates Redux state with admin data
  - Sets `isAuthenticated = true`
  - Schedules token refresh (1 minute before expiry)
  - Redirects to Dashboard
- On error: Shows error toast
- Handles too many attempts (429 status)

### Step 3: Dashboard (`/admin/dashboard`)
- Protected route - checks authentication state
- Shows admin profile information
- Lists available permissions
- Logout functionality
- Activates token refresh on user activity

## Token Management

### Token Refresh Logic

**When Tokens are Set:**
1. After successful OTP verification
   - Access token: 15 minutes
   - Refresh token: 30 days

**Automatic Token Refresh:**
1. System schedules refresh 1 minute before expiry
2. Refresh token is automatically sent via cookies
3. New tokens are received and cookies are updated
4. New refresh is scheduled for the next interval

**On User Activity:**
- Mouse, keyboard, scroll, touch events trigger re-scheduling
- Ensures tokens stay fresh as long as user is active
- Prevents logout while actively using the app

**On Token Expiry:**
- If access token expires and refresh fails
- User is automatically logged out
- Redirected to login page
- All sessions are cleared

### API Interceptor (`utils/api.utils.js`)

The axios interceptor handles:
1. **Automatic Token Refresh:** If 401 response is received:
   - Dispatch `refreshToken` action
   - Queue failed requests
   - Retry after refresh succeeds
   - Clear queue on refresh failure

2. **Cookie Handling:** All requests include cookies automatically:
   ```javascript
   withCredentials: true
   ```

## Redux State Structure

```javascript
auth: {
  // Authentication state
  isAuthenticated: boolean,      // Login status
  admin: {                       // Admin data
    id: string,
    name: string,
    email: string,
    isSuperAdmin: boolean,
    isActive: boolean,
    permissions: [string]
  },

  // Login flow states
  loginLoading: boolean,
  loginError: string | null,
  otpSent: boolean,              // OTP sent to email

  // OTP verification states
  verifyOtpLoading: boolean,
  verifyOtpError: string | null,
  otpVerified: boolean,

  // Resend OTP states
  resendOtpLoading: boolean,
  resendOtpError: string | null,

  // Profile states
  profileLoading: boolean,
  profileError: string | null,

  // Logout states
  logoutLoading: boolean,
  logoutError: string | null,

  // Token refresh states
  refreshTokenLoading: boolean,
  refreshTokenError: string | null
}
```

## Available Routes

### Public Routes (No Authentication Required)
- `/admin/login` - Login page
- `/admin/verify` - OTP verification page
- `/admin/forgot` - Forgot password page
- `/admin/reset?token=<resetToken>` - Reset password page

### Protected Routes (Authentication Required)
- `/admin/dashboard` - Main dashboard
- All future admin pages will be protected

### Redirects
- `/admin` → `/admin/login`
- `/` → `/admin/login`
- `*` (unknown routes) → `/admin/login`

## Password Requirements

When setting or resetting password:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&)

## Error Handling

### Error Types
| Status | Type | Action |
|--------|------|--------|
| 400 | Validation Error | Show error toast |
| 401 | Unauthorized | Clear session, redirect to login |
| 403 | Forbidden | Show error toast |
| 429 | Too Many Attempts | Show rate limit message |
| 500 | Server Error | Show generic error |

### Toast Notifications
- **Success Toast:** Used for successful actions
- **Error Toast:** Shows error messages
- **Warning Toast:** For important warnings
- Auto-dismiss after 3-5 seconds

## Security Features

1. **HttpOnly Cookies:** Tokens stored in httpOnly cookies, not localStorage
2. **CORS Configuration:** Backend validates origin and credentials
3. **Token Expiry:** Access tokens expire in 15 minutes
4. **OTP Verification:** 6-digit OTP with 10-minute expiry
5. **Attempt Limiting:** Max 5 OTP attempts before requiring resend
6. **Account Lock:** Locked after failed login attempts
7. **Session Management:** Stores up to 5 device sessions per admin
8. **Password Hashing:** bcrypt with 12 salt rounds
9. **Token Hashing:** Refresh tokens stored as SHA256 hashes

## Frontend Utilities

### `utils/auth.utils.js`
- `scheduleTokenRefresh(expiresInString)` - Schedule auto-refresh
- `clearTokenRefresh()` - Cancel scheduled refresh
- `getTokenTimeRemaining()` - Get time until expiry
- `isTokenAboutToExpire()` - Check if within 2 minutes of expiry
- `validateEmail(email)` - Email format validation
- `validatePassword(password)` - Password strength validation
- `validateOTP(otp)` - OTP format validation

### `hooks/useProtectedRoute.js`
- `useProtectedRoute()` - Protect routes and manage auth
- `useTokenRefreshOnActivity()` - Refresh token on user activity

## Environment Variables

Create `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Admin Panel
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=true
```

## Testing the Auth Flow

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd Admin
   npm run dev
   ```

3. **Test Login:**
   - Navigate to `http://localhost:5173/admin/login`
   - Enter credentials
   - Check email for OTP
   - Enter OTP on verify page
   - Should redirect to dashboard

4. **Test Token Refresh:**
   - Wait 14 minutes on dashboard
   - System will auto-refresh token
   - Continue using dashboard seamlessly

5. **Test Logout:**
   - Click logout button
   - All sessions cleared
   - Redirected to login

## Backend Endpoints Required

The frontend expects these endpoints in the backend:

### Authentication
- `POST /api/v1/admin/login` - Submit credentials
- `POST /api/v1/admin/verify-otp` - Verify OTP
- `POST /api/v1/admin/resend-otp` - Resend OTP
- `POST /api/v1/admin/refresh-token` - Refresh access token
- `POST /api/v1/admin/logout` - Logout and clear sessions
- `GET /api/v1/admin/profile` - Get admin profile (protected)

### Password Management (To be implemented)
- `POST /api/v1/admin/forgot-password` - Request password reset
- `POST /api/v1/admin/reset-password` - Reset password with token

## Common Issues

### Issue: Token not being refreshed
- **Cause:** User not active, refresh scheduled only at login
- **Fix:** Move to dashboard to trigger token refresh scheduler

### Issue: 401 errors after some time
- **Cause:** Token expired, refresh mechanism not triggered
- **Fix:** Ensure `useProtectedRoute` hook is used in protected components

### Issue: User still logged in after token expiry
- **Cause:** Token refresh failed but user state not cleared
- **Fix:** Check browser cookies, clear and login again

### Issue: OTP page shows blank email
- **Cause:** Navigation state not passed from login page
- **Fix:** Ensure navigate includes state: `{ state: { email } }`
