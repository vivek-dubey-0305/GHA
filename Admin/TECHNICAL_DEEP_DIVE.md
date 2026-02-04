# Technical Deep Dive - Admin Authentication System

## System Architecture

### High-Level Flow

```
┌─────────────────┐
│  Login Page     │ (Public Route)
│  - Validate     │
│  - Submit creds │
└────────┬────────┘
         │ POST /admin/login
         ↓
┌─────────────────────────────────────┐
│  Backend Processing (Login)         │
│  1. Validate credentials            │
│  2. Check if admin active           │
│  3. Check account lock              │
│  4. Compare password (bcrypt)       │
│  5. Generate 6-digit OTP            │
│  6. Send OTP to email               │
│  7. Return success response         │
└────────┬────────────────────────────┘
         │ Response with email
         ↓
┌─────────────────┐
│  Verify Page    │ (Public Route)
│  - Show email   │
│  - Input OTP    │
│  - Resend btn   │
└────────┬────────┘
         │ POST /admin/verify-otp
         ↓
┌──────────────────────────────────────┐
│  Backend Processing (Verify OTP)     │
│  1. Find admin by email              │
│  2. Check OTP attempt limit          │
│  3. Check if OTP set                 │
│  4. Check OTP expiry                 │
│  5. Validate OTP                     │
│  6. Clear OTP fields                 │
│  7. Generate Access Token (15m)      │
│  8. Generate Refresh Token (30d)     │
│  9. Hash refresh token               │
│  10. Store refresh token hash        │
│  11. Set httpOnly cookies            │
│  12. Return admin profile            │
└────────┬─────────────────────────────┘
         │ Cookies set + Profile data
         ↓
┌──────────────────────────────┐
│  Redux Store Updated         │
│  - isAuthenticated = true    │
│  - admin = {profile}         │
│  - otpVerified = true        │
└────────┬─────────────────────┘
         │ Schedule Token Refresh
         ↓
┌──────────────────────┐
│  Dashboard Page      │ (Protected Route)
│  - Show admin info   │
│  - Token auto-ref    │
│  - Logout button     │
└──────────┬───────────┘
           │ After 14 minutes
           ↓
┌────────────────────────────────────┐
│  Auto Token Refresh                │
│  1. POST /admin/refresh-token      │
│  2. Use refresh token from cookie  │
│  3. Get new access token           │
│  4. Update cookies                 │
│  5. Schedule next refresh          │
└────────────────────────────────────┘
```

## Redux State Management

### State Structure
```javascript
auth: {
  // Core authentication
  isAuthenticated: boolean,      // Master auth flag
  admin: {                       // Admin user object
    id: ObjectId,
    name: string,
    email: string,
    isSuperAdmin: boolean,
    isActive: boolean,
    permissions: [string]
  },

  // Login flow (Step 1)
  loginLoading: boolean,         // POST /login in progress
  loginError: string | null,     // Error from login attempt
  otpSent: boolean,              // OTP sent to email

  // OTP verification (Step 2)
  verifyOtpLoading: boolean,     // POST /verify-otp in progress
  verifyOtpError: string | null, // OTP verification error
  otpVerified: boolean,          // OTP successfully verified

  // Resend OTP
  resendOtpLoading: boolean,     // POST /resend-otp in progress
  resendOtpError: string | null, // Resend error

  // Profile operations
  profileLoading: boolean,       // GET /profile in progress
  profileError: string | null,   // Profile fetch error

  // Logout
  logoutLoading: boolean,        // POST /logout in progress
  logoutError: string | null,    // Logout error

  // Token refresh
  refreshTokenLoading: boolean,  // POST /refresh-token in progress
  refreshTokenError: string | null // Refresh error
}
```

### Action Flow

**Login Process:**
```
dispatch(login({ email, password }))
  ↓
login.pending → loginLoading = true
  ↓
[API Call POST /admin/login]
  ↓
login.fulfilled → otpSent = true, loginError = null
            OR
login.rejected → loginError = message, otpSent = false
```

**OTP Verification:**
```
dispatch(verifyOtp({ email, otp }))
  ↓
verifyOtp.pending → verifyOtpLoading = true
  ↓
[API Call POST /admin/verify-otp]
  ↓
verifyOtp.fulfilled → isAuthenticated = true, admin = {...}
                      otpVerified = true
                      scheduleTokenRefresh('15m')
               OR
verifyOtp.rejected → verifyOtpError = message
```

## Token Management System

### Token Lifecycle

**Generation (Backend):**
```javascript
// Access Token (15 minutes)
jwt.sign(
  { id: admin._id, email: admin.email, role: "admin" },
  JWT_ACCESS_TOKEN_SECRET,
  { expiresIn: "15m" }
)

// Refresh Token (30 days)
jwt.sign(
  { id: admin._id, role: "admin" },
  JWT_REFRESH_TOKEN_SECRET,
  { expiresIn: "30d" }
)
```

**Storage:**
```javascript
// Sent to frontend as httpOnly cookies
res.cookie("accessToken", accessToken, {
  httpOnly: true,           // Can't be accessed by JS
  secure: production,        // HTTPS only in production
  sameSite: "strict",       // CSRF protection
  maxAge: 15 * 60 * 1000    // 15 minutes in ms
});

res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: production,
  sameSite: "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days in ms
});
```

### Refresh Timer Logic

**Initial Setup (On OTP verification):**
```javascript
export const scheduleTokenRefresh = (expiresInString = '15m') => {
  // Clear any existing timer
  if (refreshTokenTimer) clearTimeout(refreshTokenTimer);

  // Parse expiry string: "15m" → 15 * 60 * 1000 = 900000 ms
  const expiryMs = parseExpiry(expiresInString);

  // Set global expiry timestamp
  tokenExpiryTime = Date.now() + expiryMs;

  // Schedule refresh 1 minute BEFORE expiry
  // 900000 - 60000 = 840000 ms (14 minutes)
  const refreshTime = expiryMs - 60 * 1000;

  refreshTokenTimer = setTimeout(() => {
    handleTokenRefresh();
  }, refreshTime);
};
```

**Automatic Refresh (14 minutes after login):**
```javascript
const handleTokenRefresh = async () => {
  try {
    const state = store.getState();

    // Only refresh if authenticated
    if (state.auth.isAuthenticated) {
      // Dispatch thunk that posts to /refresh-token
      await store.dispatch(refreshToken());

      // Schedule next refresh (14 min from now)
      scheduleTokenRefresh('15m');
    }
  } catch (error) {
    // If refresh fails, force logout
    store.dispatch(manualLogout());
  }
};
```

**Activity-Based Re-scheduling:**
```javascript
export const useTokenRefreshOnActivity = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      // Any user activity: mouse, keyboard, scroll, touch
      // Re-schedule the refresh timer
      scheduleTokenRefresh('15m');
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated]);
};
```

### API Interceptor Logic

**Request Interceptor:**
```javascript
apiClient.interceptors.request.use(
  (config) => {
    // All requests include cookies automatically
    // (withCredentials: true on axios instance)
    return config;
  }
);
```

**Response Interceptor:**
```javascript
apiClient.interceptors.response.use(
  (response) => response,  // Success: return as-is

  async (error) => {
    const originalRequest = error.config;

    // If not 401, don't handle
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // If already refreshing, queue the request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(originalRequest));  // Retry
    }

    // Start refresh process
    isRefreshing = true;

    try {
      // POST to /refresh-token with refresh token from cookie
      await store.dispatch(refreshToken());

      // Retry all queued requests
      processQueue(null);

      // Retry original request
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed, logout
      store.dispatch(manualLogout());
      processQueue(refreshError);
      window.location.href = '/admin/login';
      return Promise.reject(refreshError);
    }
  }
);
```

## OTP System

### OTP Generation (Backend)
```javascript
admin.generateOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in database (NOT HASHED - for verification)
  this.verificationCode = otp;

  // Set 10-minute expiry
  this.verificationCodeExpires = Date.now() + 10 * 60 * 1000;

  // Reset verification flag
  this.isOtpVerified = false;

  // Track when OTP was sent
  this.otpLastSentAt = Date.now();

  return otp;  // Return to send via email
};
```

### OTP Verification
```javascript
admin.verifyOTP = function(providedOTP) {
  // Check if OTP exists
  if (!this.verificationCode || !this.verificationCodeExpires) {
    return false;
  }

  // Check if expired
  if (Date.now() > this.verificationCodeExpires) {
    return false;
  }

  // Check if matches
  return this.verificationCode === providedOTP;
};
```

### OTP Attempt Limiting
```javascript
// On each failed OTP attempt
admin.otpAttempts += 1;
await admin.save();

// Check before verification
if (admin.otpAttempts >= 5) {
  return errorResponse(res, 429, "Too many attempts");
}

// On successful verification
admin.clearOTP();  // Clear code, expiry, increment reset to 0
```

## Session Management

### Session Storage (Backend)
```javascript
// In admin model
sessions: [{
  refreshTokenHash: {      // SHA256(refreshToken)
    type: String,
    required: true
  },
  device: String,          // User-Agent parsed device
  ip: String,              // Request IP address
  userAgent: String,       // Full user-agent string
  lastActive: Date,        // Last time this device was used
  createdAt: Date          // When session was created
}]

// Max 5 concurrent sessions (devices)
const MAX_SESSIONS = 5;
if (this.sessions.length >= MAX_SESSIONS) {
  this.sessions.shift();  // Remove oldest session
}
```

### Session Verification
```javascript
// To verify refresh token is valid
admin.verifyAndRemoveRefreshToken = function(refreshToken) {
  const hash = this.hashToken(refreshToken);

  // Find session with matching hash
  const sessionIndex = this.sessions.findIndex(
    session => session.refreshTokenHash === hash
  );

  if (sessionIndex === -1) return false;

  // Remove used session (one-time use)
  this.sessions.splice(sessionIndex, 1);
  return true;
};
```

## Password Management

### Password Hashing (Backend)
```javascript
// Before saving
const saltRounds = 12;
this.password = await bcrypt.hash(this.password, saltRounds);

// When comparing
admin.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

### Password Reset Token (Backend)
```javascript
admin.createPasswordResetToken = function() {
  // Generate 32 random bytes
  const rawToken = crypto.randomBytes(32).toString("hex");

  // Store SHA256 hash in database
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  // Set 1-hour expiry
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000;

  // Return raw token to send in email link
  return rawToken;
};
```

## Error Handling Strategy

### Error Classification
```javascript
export const handleAuthError = (error) => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;

  switch (status) {
    case 400:  // Bad Request
      return { type: 'validation', message };
    case 401:  // Unauthorized
      return { type: 'unauthorized', message };
    case 403:  // Forbidden
      return { type: 'forbidden', message };
    case 429:  // Too Many Requests
      return { type: 'tooManyAttempts', message };
    case 500:  // Server Error
      return { type: 'server', message };
    default:
      return { type: 'unknown', message };
  }
};
```

### Toast Notifications
```javascript
// Success: OTP sent
<SuccessToast
  isVisible={otpSent}
  title="OTP Sent"
  message="Check your email for 6-digit code"
  duration={3000}  // Auto-dismiss after 3s
/>

// Error: Failed OTP attempt
<ErrorToast
  isVisible={!!verifyOtpError}
  title="Verification Failed"
  message={verifyOtpError}
  duration={5000}  // Error shown longer
/>

// Warning: OTP expiring soon
<WarningToast
  isVisible={isTokenAboutToExpire()}
  title="Session Expiring"
  message="Activity detected - token auto-refreshed"
  duration={3000}
/>
```

## Component Integration Patterns

### Protected Routes
```javascript
const Dashboard = () => {
  // Check auth and redirect if not authenticated
  useProtectedRoute();

  // Reschedule token refresh on activity
  useTokenRefreshOnActivity();

  // Component is now protected
  return <div>Protected content</div>;
};
```

### Form Validation
```javascript
const validateForm = () => {
  const errors = {};

  // Email validation
  if (!email) {
    errors.email = 'Email required';
  } else if (!validateEmail(email)) {
    errors.email = 'Invalid email format';
  }

  // Password validation
  if (!password) {
    errors.password = 'Password required';
  } else if (password.length < 8) {
    errors.password = 'Min 8 characters';
  } else if (!validatePassword(password)) {
    errors.password = 'Must include uppercase, lowercase, number, special';
  }

  return Object.keys(errors).length === 0;
};
```

### Async Thunk Usage
```javascript
const handleLogin = async (email, password) => {
  try {
    // Dispatch thunk
    const action = await dispatch(login({ email, password }));

    // Check if fulfilled
    if (login.fulfilled.match(action)) {
      // Success: navigate to verify
      navigate('/admin/verify', { state: { email } });
    } else {
      // Error: thunk already updated state with error
      // Toast will show from useEffect watching loginError
    }
  } catch (error) {
    // Fallback error handling
    showErrorToast(error.message);
  }
};
```

## Performance Considerations

### 1. Lazy Loading
```javascript
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const Login = lazy(() => import('../pages/AuthPages/Login'));

// Wrapped with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Suspense>
```

### 2. Memoization
```javascript
// Email memoized from state to prevent re-renders
const LoginComponent = ({ email }) => {
  useEffect(() => {
    // Only runs when email changes
    validateEmail(email);
  }, [email]);
};
```

### 3. Redux Selectors
```javascript
// Selector returns same object reference if state unchanged
const admin = useSelector(selectAdmin);
// Only re-renders if selectAdmin returns different value

// vs. directly accessing state
const admin = useSelector(state => state.auth.admin);
// Creates new object reference on every state change!
```

## Security Deep Dive

### HttpOnly Cookies vs LocalStorage

**HttpOnly Cookies (Used):**
- ✓ Not accessible via JavaScript
- ✓ Automatically sent with requests
- ✓ Protected from XSS attacks
- ✓ Requires CORS configuration
- ✗ Requires backend to set/clear

**LocalStorage (NOT Used):**
- ✗ Accessible via JavaScript
- ✗ Vulnerable to XSS attacks
- ✗ Not automatically sent
- ✓ Easy to clear on logout
- ✓ Works without CORS

**Decision:** HttpOnly cookies for maximum security

### CORS Configuration
```javascript
// Backend must set:
app.use(cors({
  origin: 'http://localhost:5173',  // Frontend URL
  credentials: true                   // Allow cookies
}));

// Frontend must set:
axios.defaults.withCredentials = true;  // Include cookies
```

### CSRF Protection
```javascript
// Backend sets SameSite flag
res.cookie("token", token, {
  sameSite: "strict"  // Only same-site requests
});

// This prevents cross-site request forgery
```

## Testing Scenarios

### 1. Normal Login Flow
1. User logs in
2. OTP sent to email
3. User enters OTP
4. Tokens created, stored in cookies
5. Redirect to dashboard
6. Token auto-refreshes at 14 min mark
7. User logs out

### 2. Token Refresh Failure
1. User is on dashboard
2. Token refresh scheduled
3. At 14 min mark, POST to /refresh-token
4. Request fails (network, server error)
5. User auto-logged out
6. Redirected to login
7. Must login again

### 3. Concurrent Requests During Refresh
1. User makes request A at 14:00
2. Token refresh starts automatically
3. User makes request B at 14:01 (gets 401)
4. Request B queued
5. Refresh completes at 14:02
6. Request B retried and succeeds
7. Response returned to user

### 4. OTP Attempt Limiting
1. User enters wrong OTP
2. Attempt count = 1
3. User tries 4 more times
4. Attempt count = 5
5. Next attempt returns 429
6. User must request new OTP

## Troubleshooting Guide

### Issue: Tokens not in cookies
- Check: `withCredentials: true` in axios
- Check: Backend CORS allows credentials
- Check: Backend sets httpOnly cookies

### Issue: Auto-logout after 15 minutes
- Cause: Token refresh not scheduled
- Fix: Ensure useProtectedRoute() used
- Fix: Check timer is set correctly

### Issue: OTP keeps expiring
- Cause: 10-minute window too short
- Fix: Check OTP_EXPIRES_IN in backend .env
- Fix: Check server time sync

### Issue: Can't logout
- Cause: API endpoint returning error
- Fix: Check /logout endpoint exists
- Fix: Verify authentication token valid

### Issue: Infinite redirect loops
- Cause: useProtectedRoute() called on login page
- Fix: Only use on protected routes
- Fix: Check route protection logic
