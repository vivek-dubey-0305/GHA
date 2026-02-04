# Quick Reference - Admin Auth System

## File Structure

```
src/
├── pages/
│   ├── AuthPages/
│   │   ├── Login.jsx          # Email/password login
│   │   ├── Verify.jsx         # OTP verification
│   │   ├── Forgot.jsx         # Forgot password
│   │   └── Reset.jsx          # Password reset
│   └── Dashboard/
│       └── Dashboard.jsx       # Main admin dashboard
├── redux/
│   ├── slices/
│   │   └── auth.slice.js      # Redux auth state & thunks
│   └── store/
│       └── store.js            # Redux store config
├── router/
│   └── router.js               # Lazy-loaded routes
├── hooks/
│   └── useProtectedRoute.js    # Auth & token refresh hooks
└── utils/
    ├── auth.utils.js           # Auth helper functions
    └── api.utils.js            # Axios instance & interceptors
```

## Important Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/admin/login` | Send credentials, get OTP |
| POST | `/admin/verify-otp` | Verify OTP, get tokens |
| POST | `/admin/resend-otp` | Resend OTP |
| POST | `/admin/refresh-token` | Get new access token |
| POST | `/admin/logout` | Clear sessions |
| GET | `/admin/profile` | Get admin data |
| POST | `/admin/forgot-password` | Request reset link |
| POST | `/admin/reset-password` | Reset password |

## Redux Dispatch Examples

```javascript
import { useDispatch } from 'react-redux';
import { login, verifyOtp, resendOtp, logout } from '../redux/slices/auth.slice';

const MyComponent = () => {
  const dispatch = useDispatch();

  // Login - Step 1
  dispatch(login({ email: 'admin@example.com', password: 'Password123!' }));

  // Verify OTP - Step 2
  dispatch(verifyOtp({ email: 'admin@example.com', otp: '123456' }));

  // Resend OTP
  dispatch(resendOtp({ email: 'admin@example.com' }));

  // Logout
  dispatch(logout());
};
```

## Redux Selectors

```javascript
import { useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectAdmin,
  selectLoginLoading,
  selectLoginError,
  selectOtpSent,
  selectVerifyOtpLoading,
  selectVerifyOtpError,
  selectOtpVerified
} from '../redux/slices/auth.slice';

const MyComponent = () => {
  const isAuth = useSelector(selectIsAuthenticated);
  const admin = useSelector(selectAdmin);
  const loading = useSelector(selectLoginLoading);
  const error = useSelector(selectLoginError);
};
```

## Protected Route Usage

```javascript
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { useTokenRefreshOnActivity } from '../hooks/useProtectedRoute';

const Dashboard = () => {
  // Protect this component
  useProtectedRoute();

  // Manage token refresh
  useTokenRefreshOnActivity();

  return <div>Protected Content</div>;
};
```

## Validation Functions

```javascript
import {
  validateEmail,
  validatePassword,
  validateOTP,
  getPasswordStrengthMessage,
  scheduleTokenRefresh,
  getTokenTimeRemaining
} from '../utils/auth.utils';

// Email validation
const isValidEmail = validateEmail('admin@example.com'); // true/false

// Password validation
const isStrongPassword = validatePassword('Pass123!'); // true/false
const strength = getPasswordStrengthMessage('Pass123!'); // "Strong password"

// OTP validation
const isValidOTP = validateOTP('123456'); // true/false

// Token management
scheduleTokenRefresh('15m');
const timeLeft = getTokenTimeRemaining(); // milliseconds
```

## Environment Variables

```bash
# .env file
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Admin Panel
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=true
```

## Testing Credentials

Use credentials from backend seed or create test admin:

```javascript
// Example test credentials
Email: admin@example.com
Password: AdminPass123!
```

## Common Tasks

### Redirecting After Login
```jsx
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  
  // After successful OTP verification
  navigate('/admin/dashboard');
};
```

### Showing Toast Notifications
```jsx
import { SuccessToast, ErrorToast } from '../components/ui';

const MyComponent = () => {
  const [toast, setToast] = useState({ visible: false, message: '' });

  return (
    <>
      <SuccessToast
        isVisible={toast.visible}
        onDismiss={() => setToast({ visible: false })}
        title="Success"
        message={toast.message}
      />
    </>
  );
};
```

### Using Form Components
```jsx
import { Card, Button, Input } from '../components/ui';

const Form = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  return (
    <Card title="Login" size="sm">
      <Input
        title="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        border2d={true}
      />
      <Button variant="primary" size="md">
        Submit
      </Button>
    </Card>
  );
};
```

## Token Refresh Flow

1. User logs in → tokens set in cookies
2. System schedules refresh at 14 minutes
3. At 14 minutes → auto POST to `/refresh-token`
4. New tokens stored in cookies
5. Next refresh scheduled
6. User stays logged in as long as active

## Error Handling

```javascript
import { useSelector } from 'react-redux';
import { selectLoginError } from '../redux/slices/auth.slice';

const LoginComponent = () => {
  const error = useSelector(selectLoginError);

  return (
    <>
      {error && <div className="text-red-500">{error}</div>}
    </>
  );
};
```

## Logging Out

```javascript
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/auth.slice';
import { clearTokenRefresh } from '../utils/auth.utils';

const Header = () => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    clearTokenRefresh(); // Cancel auto-refresh
    dispatch(logout()); // Call logout endpoint & clear state
    // Auto-redirected to login by middleware
  };

  return <button onClick={handleLogout}>Logout</button>;
};
```

## Debugging

Enable debug logging in `.env`:
```bash
VITE_ENABLE_DEBUG=true
```

Check browser console for:
- Redux action logs (in Redux DevTools)
- API request/response (Network tab)
- Token timing (console logs in auth.utils.js)
- Component render logs (React DevTools)

## Known Limitations

1. **Forgot/Reset Password:** Endpoints not yet implemented in backend
2. **Profile Update:** Update admin profile not implemented
3. **2FA Settings:** Enable/disable 2FA not implemented
4. **Session Management:** View/logout from other devices not implemented

## Performance Notes

- All pages are lazy loaded
- Tokens refreshed automatically (no user action needed)
- Activity-based refresh keeps tokens fresh
- Minimal re-renders with proper selector usage
- No localStorage used for security

## Security Checklist

- ✓ Tokens in httpOnly cookies only
- ✓ CORS with credentials enabled
- ✓ 15-minute access token expiry
- ✓ Auto-refresh 1 minute before expiry
- ✓ 6-digit OTP with 10-minute expiry
- ✓ Max 5 OTP attempts
- ✓ Password strength validation
- ✓ Account lock after failed attempts
- ✓ No sensitive data in localStorage
- ✓ Automatic logout on token expiry
