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
      navigate('/admin/verify', { state: { email: formData.email } });
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
        title="Admin Login"
        subtitle="Enter your credentials to access the admin panel"
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
              placeholder="admin@example.com"
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
              to="/admin/forgot"
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

          {/* Info Text */}
          <p className="text-center text-xs text-gray-600 mt-4">
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
