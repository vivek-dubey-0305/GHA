import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetPasswordThunk, selectResetPasswordLoading, selectResetPasswordError, selectResetPasswordSuccess, clearResetPasswordError } from '../../redux/slices/auth.slice';
import { Card, Button, Input, SuccessToast, ErrorToast } from '../../components/ui';
import { validatePassword, getPasswordStrengthMessage } from '../../utils/auth.utils';

const Reset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [toastState, setToastState] = useState({ visible: false, type: 'success', message: '', title: '' });
  const [passwordStrength, setPasswordStrength] = useState('');

  const resetPasswordLoading = useSelector(selectResetPasswordLoading);
  const resetPasswordError = useSelector(selectResetPasswordError);
  const resetPasswordSuccess = useSelector(selectResetPasswordSuccess);

  const resetToken = searchParams.get('token');

  // Validate token exists
  useEffect(() => {
    if (!resetToken) {
      setToastState({
        visible: true,
        type: 'error',
        title: 'Invalid Link',
        message: 'Password reset link is invalid or expired'
      });
      setTimeout(() => {
        navigate('/instructor/login');
      }, 3000);
    }
  }, [resetToken, navigate]);

  // Handle reset password success
  useEffect(() => {
    if (resetPasswordSuccess) {
      setToastState({
        visible: true,
        type: 'success',
        title: 'Success',
        message: 'Password reset successfully. Redirecting to login...'
      });
      setTimeout(() => {
        navigate('/instructor/login');
      }, 3000);
    }
  }, [resetPasswordSuccess, navigate]);

  // Handle reset password error
  useEffect(() => {
    if (resetPasswordError) {
      setToastState({
        visible: true,
        type: 'error',
        title: 'Reset Failed',
        message: resetPasswordError
      });
    }
  }, [resetPasswordError]);

  const handlePasswordChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, password: value }));
    setPasswordStrength(getPasswordStrengthMessage(value));
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, confirmPassword: value }));
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, number, and special character';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clear previous errors
    dispatch(clearResetPasswordError());

    // Dispatch reset password action
    dispatch(resetPasswordThunk({
      token: resetToken,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    }));
  };

  if (!resetToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center px-4 py-8">
      <Card
        size="sm"
        title="Reset Password"
        subtitle="Enter your new password"
        borders={{ top: true, right: true, bottom: true, left: true }}
        className="w-full max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password Input */}
          <div>
            <Input
              title="New Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handlePasswordChange}
              error={errors.password}
              border2d={true}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-2">{errors.password}</p>
            )}
            {formData.password && passwordStrength && (
              <p className={`text-sm mt-2 ${
                passwordStrength === 'Weak password' ? 'text-yellow-600' :
                passwordStrength === 'Moderate password' ? 'text-orange-600' :
                'text-green-600'
              }`}>
                {passwordStrength}
              </p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <Input
              title="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleConfirmPasswordChange}
              error={errors.confirmPassword}
              border2d={true}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-2">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-xs font-semibold text-gray-900 mb-2">Password Requirements:</p>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>✓ At least 8 characters long</li>
              <li>✓ Contains uppercase letters (A-Z)</li>
              <li>✓ Contains lowercase letters (a-z)</li>
              <li>✓ Contains numbers (0-9)</li>
              <li>✓ Contains special characters (@$!%*?&)</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={resetPasswordLoading}
            disabled={resetPasswordLoading}
            className="w-full"
          >
            {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
          </Button>

          {/* Back to Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Back to Login
            </button>
          </div>
        </form>
      </Card>

      {/* Success Toast */}
      <SuccessToast
        isVisible={toastState.visible && toastState.type === 'success'}
        onDismiss={() => setToastState({ ...toastState, visible: false })}
        title={toastState.title}
        message={toastState.message}
        duration={5000}
      />

      {/* Error Toast */}
      <ErrorToast
        isVisible={toastState.visible && toastState.type === 'error'}
        onDismiss={() => setToastState({ ...toastState, visible: false })}
        title={toastState.title}
        message={toastState.message}
        duration={5000}
      />
    </div>
  );
};

export default Reset;
