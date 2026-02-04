import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Input, SuccessToast, ErrorToast } from '../../components/ui';
import { validateEmail } from '../../utils/auth.utils';

const Forgot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastState, setToastState] = useState({ visible: false, type: 'success', message: '' });

  // Check if user came from the login page with proper intent
  useEffect(() => {
    if (!location.state?.fromLogin) {
      navigate('/admin/login');
    }
  }, [location.state, navigate]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1/admin';

  const validateForm = () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { value } = e.target;
    setEmail(value);
    if (emailError) {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create forgot password request
      // Note: This endpoint needs to be created in the backend
      // For now, we'll assume it exists
      await axios.post(
        `${API_BASE_URL}/forgot-password`,
        { email }
      );

      setToastState({
        visible: true,
        type: 'success',
        message: 'Password reset link sent to your email. Check your inbox and spam folder.'
      });

      // Clear form
      setEmail('');

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/admin/login');
      }, 3000);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset link. Please try again.';
      
      setToastState({
        visible: true,
        type: 'error',
        message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center px-4 py-8">
      <Card
        size="sm"
        title="Forgot Password"
        subtitle="Enter your email to receive a password reset link"
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
              value={email}
              onChange={handleChange}
              error={emailError}
              border2d={true}
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-2">{emailError}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          {/* Back to Login */}
          <div className="border-t border-gray-200 pt-4 text-center">
            <Link
              to="/admin/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Back to Login
            </Link>
          </div>

          {/* Info Text */}
          <p className="text-center text-xs text-gray-600">
            You will receive an email with instructions to reset your password
          </p>
        </form>
      </Card>

      {/* Success Toast */}
      <SuccessToast
        isVisible={toastState.visible && toastState.type === 'success'}
        onDismiss={() => setToastState({ ...toastState, visible: false })}
        title="Success"
        message={toastState.message}
        duration={5000}
      />

      {/* Error Toast */}
      <ErrorToast
        isVisible={toastState.visible && toastState.type === 'error'}
        onDismiss={() => setToastState({ ...toastState, visible: false })}
        title="Error"
        message={toastState.message}
        duration={5000}
      />
    </div>
  );
};

export default Forgot;
