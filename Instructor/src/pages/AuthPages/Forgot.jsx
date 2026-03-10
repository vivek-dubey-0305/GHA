import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, selectForgotPasswordLoading, selectForgotPasswordError, selectForgotPasswordSent, clearForgotPasswordError } from '../../redux/slices/auth.slice';
import { Card, Button, Input, SuccessToast, ErrorToast } from '../../components/ui';
import { validateEmail } from '../../utils/auth.utils';

const Forgot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [toastState, setToastState] = useState({ visible: false, type: 'success', message: '' });

  const forgotPasswordLoading = useSelector(selectForgotPasswordLoading);
  const forgotPasswordError = useSelector(selectForgotPasswordError);
  const forgotPasswordSent = useSelector(selectForgotPasswordSent);

  // Check if user came from the login page with proper intent
  useEffect(() => {
    if (!location.state?.fromLogin) {
      navigate('/instructor/login');
    }
  }, [location.state, navigate]);

  // Handle forgot password success
  useEffect(() => {
    if (forgotPasswordSent) {
      setToastState({
        visible: true,
        type: 'success',
        message: 'Password reset link sent to your email. Check your inbox and spam folder.'
      });
      setEmail('');
      setTimeout(() => {
        navigate('/instructor/login');
      }, 3000);
    }
  }, [forgotPasswordSent, navigate]);

  // Handle forgot password error
  useEffect(() => {
    if (forgotPasswordError) {
      setToastState({
        visible: true,
        type: 'error',
        message: forgotPasswordError
      });
    }
  }, [forgotPasswordError]);

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

    // Clear previous errors
    dispatch(clearForgotPasswordError());

    // Dispatch forgot password action
    dispatch(forgotPassword({ email }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center px-4 py-8">
      <Card
        size="sm"
        title="Forgot Password"
        subtitle="Enter your instructor email to receive a password reset link"
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
            loading={forgotPasswordLoading}
            disabled={forgotPasswordLoading}
            className="w-full"
          >
            {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          {/* Back to Login */}
          <div className="border-t border-gray-200 pt-4 text-center">
            <Link
              to="/instructor/login"
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
