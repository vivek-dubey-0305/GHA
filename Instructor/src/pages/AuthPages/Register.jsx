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
