import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, selectRegisterLoading, selectRegisterError, selectIsAuthenticated } from '../../redux/slices/auth.slice';
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
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');
  const [toastState, setToastState] = useState({ visible: false, type: 'success', message: '' });
  const [isRegisterAttempted, setIsRegisterAttempted] = useState(false);

  const registerLoading = useSelector(selectRegisterLoading);
  const registerError = useSelector(selectRegisterError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // COMMENTED OUT: OTP verification flow - temporarily using direct authentication via cookies
  // Redirect to verify OTP page on successful registration
  // useEffect(() => {
  //   if (registerSuccess) {
  //     setToastState({
  //       visible: true,
  //       type: 'success',
  //       message: 'Registration successful! OTP sent to your email.'
  //     });
  //     // Redirect to verify page after 2 seconds
  //     setTimeout(() => {
  //       navigate('/verify', { state: { email: formData.email } });
  //     }, 2000);
  //   }
  // }, [registerSuccess, navigate, formData.email]);

  // TEMPORARY: Navigate to dashboard after successful registration (cookies are set automatically)
  // Only navigate if a registration was attempted, it completed, and authentication succeeded
  useEffect(() => {
    if (isRegisterAttempted && registerLoading === false && registerError === null && isAuthenticated) {
      setToastState({
        visible: true,
        type: 'success',
        message: 'Welcome to your dashboard!'
      });
      // Small delay to ensure cookies are set and toast is visible
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isRegisterAttempted, registerLoading, registerError, isAuthenticated, navigate]);

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
      phone: formData.phone
    });

    setIsRegisterAttempted(true);
    dispatch(register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      phone: formData.phone
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center px-4 py-8">
      <Card
        size="md"
        title="Student Registration"
        subtitle="Create your account to start learning"
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
              placeholder="student@example.com"
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

          {/* Phone Input (Optional) */}
          <div>
            <Input
              title="Phone Number (Optional)"
              type="tel"
              name="phone"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              border2d={true}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-2">{errors.phone}</p>
            )}
            <p className="text-xs text-gray-600 mt-2">
              Enter your phone number for account recovery (optional)
            </p>
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
              to="/login"
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
