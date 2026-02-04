import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOtp, resendOtp, selectVerifyOtpLoading, selectVerifyOtpError, selectResendOtpLoading, selectResendOtpError, selectIsAuthenticated } from '../../redux/slices/auth.slice';
import { Card, Button, Input, SuccessToast, ErrorToast, WarningToast } from '../../components/ui';
import { validateOTP } from '../../utils/auth.utils';

const Verify = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [toastState, setToastState] = useState({ visible: false, type: 'success', message: '', title: '' });

  const verifyOtpLoading = useSelector(selectVerifyOtpLoading);
  const verifyOtpError = useSelector(selectVerifyOtpError);
  const resendOtpLoading = useSelector(selectResendOtpLoading);
  const resendOtpError = useSelector(selectResendOtpError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Get email from navigation state or redirect
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  // Initialize cooldown when page mounts (OTP was just sent from login)
  useEffect(() => {
    setResendCooldown(60);
  }, []);

  // Redirect on successful OTP verification
  useEffect(() => {
    if (isAuthenticated) {
      console.log('OTP verification successful, user authenticated');
      setToastState({
        visible: true,
        type: 'success',
        title: 'Verification Successful',
        message: 'Welcome! Redirecting to dashboard...'
      });
      // Redirect after showing success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  }, [isAuthenticated, navigate]);

  // Handle verify OTP error
  useEffect(() => {
    if (verifyOtpError) {
      const timer = setTimeout(() => {
        setToastState({
          visible: true,
          type: 'error',
          title: 'Verification Failed',
          message: verifyOtpError
        });
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [verifyOtpError]);

  // Handle resend OTP error
  useEffect(() => {
    if (resendOtpError) {
      const timer = setTimeout(() => {
        setToastState({
          visible: true,
          type: 'error',
          title: 'Resend Failed',
          message: resendOtpError
        });
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [resendOtpError]);

  // Resend cooldown timer
  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (otpError) {
      setOtpError('');
    }
  };

  const validateForm = () => {
    if (!otp) {
      setOtpError('OTP is required');
      return false;
    }
    if (!validateOTP(otp)) {
      setOtpError('OTP must be a 6-digit number');
      return false;
    }
    return true;
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log('Submitting OTP verification for email:', email);
    dispatch(verifyOtp({
      email,
      otp
    }));
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    dispatch(resendOtp({ email }));
    setResendCooldown(60);
    setOtp('');
    setOtpError('');

    setToastState({
      visible: true,
      type: 'success',
      title: 'OTP Resent',
      message: 'Check your email for the new OTP'
    });
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center px-4 py-8">
      <Card
        size="sm"
        title="Verify OTP"
        subtitle={`Enter the 6-digit code sent to ${email}`}
        borders={{ top: true, right: true, bottom: true, left: true }}
        className="w-full max-w-md"
      >
        <form onSubmit={handleVerify} className="space-y-5">
          {/* OTP Input */}
          <div>
            <Input
              title="One-Time Password"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength="6"
              value={otp}
              onChange={handleOtpChange}
              error={otpError}
              border2d={true}
            />
            {otpError && (
              <p className="text-red-500 text-sm mt-2">{otpError}</p>
            )}
            <p className="text-xs text-gray-600 mt-2">
              Enter the 6-digit code from your email
            </p>
          </div>

          {/* Verify Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={verifyOtpLoading}
            disabled={verifyOtpLoading || otp.length !== 6}
            className="w-full"
          >
            {verifyOtpLoading ? 'Verifying...' : 'Verify OTP'}
          </Button>

          {/* Resend OTP Section */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-3">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendOtpLoading}
              loading={resendOtpLoading}
              className="w-full"
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : resendOtpLoading
                ? 'Resending...'
                : 'Resend OTP'}
            </Button>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
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
        duration={3000}
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

export default Verify;
