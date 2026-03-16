--old register.jsx:
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, selectRegisterLoading, selectRegisterError, selectRegisterSuccess } from '../../redux/slices/auth.slice';
import { Card, Button, Input, SuccessToast, ErrorToast } from '../../components/ui';
import { validateEmail, validatePassword, getPasswordStrengthMessage } from '../../utils/auth.utils';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialization: '',
    bio: ''
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');
  const [toastState, setToastState] = useState({ visible: false, type: 'success', message: '' });

  const registerLoading = useSelector(selectRegisterLoading);
  const registerError = useSelector(selectRegisterError);
  const registerSuccess = useSelector(selectRegisterSuccess);

  // Redirect to verify OTP page on successful registration
  useEffect(() => {
    if (registerSuccess) {
      setToastState({
        visible: true,
        type: 'success',
        message: 'Registration successful! OTP sent to your email.'
      });
      // Redirect to verify page after 2 seconds
      setTimeout(() => {
        navigate('/instructor/verify', { state: { email: formData.email } });
      }, 2000);
    }
  }, [registerSuccess, navigate, formData.email]);

  // Show error toast
  useEffect(() => {
    if (registerError) {
      const timer = setTimeout(() => {
        setToastState({
          visible: true,
          type: 'error',
          message: registerError
        });
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [registerError]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, number, and special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.specialization.trim()) {
      newErrors.specialization = 'Specialization is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update password strength
    if (name === 'password') {
      setPasswordStrength(getPasswordStrengthMessage(value));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log('Submitting registration with:', {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password ? '***' : 'MISSING',
      confirmPassword: formData.confirmPassword ? '***' : 'MISSING',
      specialization: formData.specialization,
      bio: formData.bio
    });

    dispatch(register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      specialization: formData.specialization,
      bio: formData.bio
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center px-4 py-8">
      <Card
        size="md"
        title="Instructor Registration"
        subtitle="Create your instructor account to start teaching"
        borders={{ top: true, right: true, bottom: true, left: true }}
        className="w-full max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                title="First Name"
                type="text"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                border2d={true}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-2">{errors.firstName}</p>
              )}
            </div>
            <div>
              <Input
                title="Last Name"
                type="text"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                border2d={true}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-2">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email Input */}
          <div>
            <Input
              title="Email Address"
              type="email"
              name="email"
              placeholder="instructor@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              border2d={true}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2">{errors.email}</p>
            )}
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                title="Password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                border2d={true}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-2">{errors.password}</p>
              )}
              {formData.password && passwordStrength && (
                <p className="text-xs text-gray-600 mt-2">{passwordStrength}</p>
              )}
            </div>
            <div>
              <Input
                title="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                border2d={true}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-2">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Specialization Input */}
          <div>
            <Input
              title="Specialization"
              type="text"
              name="specialization"
              placeholder="e.g., Web Development, Data Science, Machine Learning"
              value={formData.specialization}
              onChange={handleChange}
              error={errors.specialization}
              border2d={true}
            />
            {errors.specialization && (
              <p className="text-red-500 text-sm mt-2">{errors.specialization}</p>
            )}
            <p className="text-xs text-gray-600 mt-2">
              Enter your area of expertise (can be comma-separated for multiple)
            </p>
          </div>

          {/* Bio Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio (Optional)
            </label>
            <textarea
              name="bio"
              rows="4"
              placeholder="Tell us about yourself and your teaching experience..."
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={registerLoading}
            disabled={registerLoading}
            className="w-full"
          >
            {registerLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          {/* Login Link */}
          <div className="border-t border-gray-200 pt-4 text-center">
            <Link
              to="/instructor/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Already have an account? <span className="font-semibold">Sign in here</span>
            </Link>
          </div>

          {/* Info Text */}
          <p className="text-center text-xs text-gray-600 mt-2">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </Card>

      {/* Success Toast */}
      <SuccessToast
        isVisible={toastState.visible && toastState.type === 'success'}
        onDismiss={() => setToastState({ ...toastState, visible: false })}
        title="Registration Successful"
        message={toastState.message}
        duration={5000}
      />

      {/* Error Toast */}
      <ErrorToast
        isVisible={toastState.visible && toastState.type === 'error'}
        onDismiss={() => setToastState({ ...toastState, visible: false })}
        title="Registration Failed"
        message={toastState.message}
        duration={5000}
      />
    </div>
  );
};

export default Register;




-- old login.jsx:
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, selectLoginLoading, selectLoginError, selectOtpSent } from '../../redux/slices/auth.slice'
import { Card, Button, Input, SuccessToast, ErrorToast } from '../../components/ui';
import { validateEmail } from '../../utils/auth.utils';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [toastState, setToastState] = useState({ visible: false, type: 'success', message: '' });

  const loginLoading = useSelector(selectLoginLoading);
  const loginError = useSelector(selectLoginError);
  const otpSent = useSelector(selectOtpSent);

  // Redirect to verify page when OTP is sent
  useEffect(() => {
    if (otpSent) {
      navigate('/instructor/verify', { state: { email: formData.email } });
    }
  }, [otpSent, navigate, formData.email]);

  // Show error toast
  useEffect(() => {
    if (loginError) {
      const timer = setTimeout(() => {
        setToastState({
          visible: true,
          type: 'error',
          message: loginError
        });
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [loginError]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    dispatch(login({
      email: formData.email,
      password: formData.password
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center px-4 py-8">
      <Card
        size="sm"
        title="Instructor Login"
        subtitle="Enter your credentials to access your instructor portal"
        borders={{ top: true, right: true, bottom: true, left: true }}
        className="w-full max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <Input
              title="Email Address"
              type="email"
              name="email"
              placeholder="instructor@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              border2d={true}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2">{errors.email}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <Input
              title="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              border2d={true}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-2">{errors.password}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              to="/instructor/forgot"
              state={{ fromLogin: true }}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loginLoading}
            disabled={loginLoading}
            className="w-full"
          >
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          {/* Register Link */}
          <div className="border-t border-gray-200 pt-4 text-center">
            <Link
              to="/instructor/register"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Don't have an account? <span className="font-semibold">Register here</span>
            </Link>
          </div>

          {/* Info Text */}
          <p className="text-center text-xs text-gray-600 mt-2">
            OTP will be sent to your registered email address
          </p>
        </form>
      </Card>

      {/* Error Toast */}
      <ErrorToast
        isVisible={toastState.visible && toastState.type === 'error'}
        onDismiss={() => setToastState({ ...toastState, visible: false })}
        title="Login Failed"
        message={toastState.message}
        duration={5000}
      />
    </div>
  );
};

export default Login;



--old instructor.auth.controller.js:
import { Instructor } from "../models/instructor.model.js";
import logger from "../configs/logger.config.js";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import {
    generateAndSendOtp,
    issueTokensAndRespond,
    logoutService,
    resendOtpService,
    forgotPasswordService,
    resetPasswordService,
    verifyResetTokenService,
    refreshTokenService,
    getSessionsService,
    logoutSessionService,
    logoutAllSessionsService,
    changePasswordService,
    validateOtpRequest,
} from "../services/auth.service.js";

const getInstructorData = (i) => ({
    instructor: { id: i._id, firstName: i.firstName, lastName: i.lastName, email: i.email, isActive: i.isActive },
});

// @route   POST /api/v1/instructor/register
export const registerInstructor = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, specialization, bio } = req.body;

    logger.info(`Instructor registration attempt: ${email}`);
    const missing = ["firstName", "lastName", "email", "password", "confirmPassword"].filter(f => !req.body[f]);
    if (missing.length) return errorResponse(res, 400, `Missing required fields: ${missing.join(", ")}`);
    if (password !== confirmPassword) return errorResponse(res, 400, "Passwords do not match");

    const existing = await Instructor.findOne({ email: email.toLowerCase() });
    if (existing) return errorResponse(res, 409, "Instructor with this email already exists");

    try {
        let processedSpecialization = [];
        if (specialization) {
            const arr = Array.isArray(specialization) ? specialization : specialization.split(",").map(s => s.trim());
            processedSpecialization = arr.map(s => s.toLowerCase().replace(/\s+/g, "_")).filter(Boolean);
        }

        const instructor = new Instructor({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase(),
            password,
            specialization: processedSpecialization.length ? processedSpecialization : undefined,
            bio: bio ? bio.trim() : undefined,
            isActive: true,
            isEmailVerified: false,
        });

        await generateAndSendOtp(instructor, `${firstName} ${lastName}`, "verify");

        return successResponse(res, 201, "Registration successful. Please verify your email with the OTP sent.", {
            email: instructor.email,
            message: "Check your email for the 6-digit OTP",
            otpExpiresIn: "10 minutes",
        });
    } catch (e) {
        logger.error(`Instructor registration error: ${e.message}`);
        return errorResponse(res, 500, "Registration failed. Please try again later.");
    }
});

// @route   POST /api/v1/instructor/login
export const loginInstructor = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    logger.info(`Instructor login attempt: ${email}`);
    if (!email || !password) return errorResponse(res, 400, "Email and password are required");

    const instructor = await Instructor.findOne({ email: email.toLowerCase() }).select("+password");
    if (!instructor) return errorResponse(res, 401, "Invalid email or password");
    if (!instructor.isActive) return errorResponse(res, 403, "Instructor account is inactive");
    if (!instructor.isEmailVerified) return errorResponse(res, 403, "Please verify your email before logging in");
    if (instructor.isSuspended) return errorResponse(res, 403, `Instructor account is suspended. Reason: ${instructor.suspensionReason || "Not specified"}`);

    if (instructor.isLocked) {
        const wait = Math.ceil((instructor.lockUntil - Date.now()) / 60_000);
        return errorResponse(res, 429, `Account locked. Try again in ${wait} minutes`);
    }

    const isPasswordValid = await instructor.comparePassword(password);
    if (!isPasswordValid) {
        await Instructor.failLogin(instructor._id);
        const updated = await Instructor.findById(instructor._id);
        const remaining = 5 - updated.loginAttempts;
        if (remaining <= 0) return errorResponse(res, 429, "Account locked due to too many failed login attempts. Try again in 2 hours.");
        return errorResponse(res, 401, `Invalid email or password. Attempts remaining: ${remaining}`);
    }

    try {
        await generateAndSendOtp(instructor, `${instructor.firstName} ${instructor.lastName}`, "login");
    } catch {
        instructor.verificationCode = null;
        instructor.verificationCodeExpires = null;
        await instructor.save({ validateBeforeSave: false });
        return errorResponse(res, 500, "Failed to send OTP email. Please try again later.");
    }

    return successResponse(res, 200, "OTP sent to email. Verify to login.", {
        email: instructor.email,
        message: "Check your email for the 6-digit OTP",
        otpExpiresIn: "10 minutes",
    });
});

// @route   POST /api/v1/instructor/verify-otp
export const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    logger.info(`Instructor OTP verification attempt: ${email}`);
    if (!email || !otp) return errorResponse(res, 400, "Email and OTP are required");
    if (otp.length !== 6 || isNaN(otp)) return errorResponse(res, 400, "OTP must be a 6-digit number");

    const instructor = await Instructor.findOne({ email: email.toLowerCase() })
        .select("+verificationCode +verificationCodeExpires +otpAttempts");

    const otpError = await validateOtpRequest(instructor, otp, res);
    if (otpError) return otpError;

    return issueTokensAndRespond(instructor, "instructor", req, res, getInstructorData, {
        setEmailVerified: true,
        nameForEmail: `${instructor.firstName} ${instructor.lastName}`,
    });
});

// @route   POST /api/v1/instructor/logout
export const logoutInstructor = asyncHandler(async (req, res) => {
    if (!req.instructor?.id) return errorResponse(res, 401, "Unauthorized");
    const instructor = await Instructor.findById(req.instructor.id);
    if (instructor) return logoutService(instructor, res);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return successResponse(res, 200, "Logout successful");
});

// @route   POST /api/v1/instructor/resend-otp
export const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, "Email is required");
    const instructor = await Instructor.findOne({ email: email.toLowerCase() });
    if (!instructor) return errorResponse(res, 401, "Invalid email");
    return resendOtpService(instructor, `${instructor.firstName} ${instructor.lastName}`, res);
});

// @route   GET /api/v1/instructor/profile
export const getInstructorProfile = asyncHandler(async (req, res) => {
    if (!req.instructor?.id) return errorResponse(res, 401, "Unauthorized");
    const instructor = await Instructor.findById(req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    return successResponse(res, 200, "Instructor profile retrieved", instructor);
});

// @route   POST /api/v1/instructor/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, "Email is required");
    const instructor = await Instructor.findOne({ email: email.toLowerCase() });
    const name = instructor ? `${instructor.firstName} ${instructor.lastName}` : "";
    return forgotPasswordService(instructor, "/instructor/reset", name, res);
});

// @route   POST /api/v1/instructor/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, password, confirmPassword } = req.body;
    return resetPasswordService(Instructor, token, password, confirmPassword, "/instructor/login", res);
});

// @route   POST /api/v1/instructor/verify-reset-token
export const verifyResetToken = asyncHandler(async (req, res) => {
    return verifyResetTokenService(Instructor, req.body.token, res);
});

// @route   POST /api/v1/instructor/refresh-token
export const refreshAccessToken = asyncHandler(async (req, res) => {
    return refreshTokenService(Instructor, "instructor", req, res, getInstructorData);
});

// @route   GET /api/v1/instructor/sessions
export const getInstructorSessions = asyncHandler(async (req, res) => {
    const instructor = await Instructor.findById(req.instructor.id).select("sessions");
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    return getSessionsService(instructor, res);
});

// @route   POST /api/v1/instructor/logout-session
export const logoutSession = asyncHandler(async (req, res) => {
    const instructor = await Instructor.findById(req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    return logoutSessionService(instructor, req.body.sessionId, res);
});

// @route   POST /api/v1/instructor/logout-all-sessions
export const logoutAllSessions = asyncHandler(async (req, res) => {
    const instructor = await Instructor.findById(req.instructor.id);
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    const currentRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    return logoutAllSessionsService(instructor, currentRefreshToken, res);
});

// @route   POST /api/v1/instructor/change-password
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    logger.info(`Password change attempt for instructor: ${req.instructor.id}`);
    const instructor = await Instructor.findById(req.instructor.id).select("+password");
    if (!instructor) return errorResponse(res, 404, "Instructor not found");
    try {
        await changePasswordService(instructor, currentPassword, newPassword, confirmPassword);
        return successResponse(res, 200, "Password changed successfully. Please login again.");
    } catch (e) {
        return errorResponse(res, e.message === "Current password is incorrect" ? 401 : 400, e.message);
    }
});



..user.auth.controller.js *backend
*frontend/  
login.jsx
register.jsx
auth.slice.js