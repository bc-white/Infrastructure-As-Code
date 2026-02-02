import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useAuth } from "../../contexts/AuthContext";
import { authAPI, isAuthenticated as checkAuthStatus } from "../../service/api";
import signInImage from "../../assets/Sign in Page.jpg";

const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const navigate = useNavigate();
  const { verifyOtp, isLoading, error, clearError, isAuthenticated } = useAuth();
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Initialize user email from localStorage
  useEffect(() => {
    const email = localStorage.getItem('mocksurvey_otp_email');
    if (email) {
      setUserEmail(email);
    } else {
      // If no email found, redirect back to login
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Handle successful login navigation
  useEffect(() => {
    if (loginSuccess) {
      // Check if there's an intended route to redirect to
      const intendedRoute = localStorage.getItem('mocksurvey_intended_route');
      if (intendedRoute && intendedRoute !== '/login' && intendedRoute !== '/verify-otp') {
        localStorage.removeItem('mocksurvey_intended_route');
        navigate(intendedRoute, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loginSuccess, navigate]);

  const handleOtpChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 4 digits
    if (/^\d{0,4}$/.test(value)) {
      setOtp(value);
      setOtpError(''); // Clear error when user types
      setOtpSuccess(''); // Clear success message when user types
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 4) {
      setOtpError('Please enter a valid 4-digit OTP');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');

    try {
      const result = await verifyOtp(otp);



      if (result.success) {
        // Verify session was set up correctly
        const token = localStorage.getItem('mocksurvey_token');
        const user = localStorage.getItem('mocksurvey_user');



        if (!token || !user || token === 'undefined' || token === 'null') {

          setOtpError('Session setup failed. Please try again.');
          setIsVerifyingOtp(false);
          return;
        }

        // Mark login as successful - this will trigger the useEffect to navigate
        setLoginSuccess(true);


      } else {

        setOtpError(result.error || 'Invalid OTP. Please try again.');
      }
    } catch (error) {

      setOtpError(error.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResendingOtp(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      const response = await authAPI.resendOtp(userEmail);

      if (response.status && response.statusCode === 200) {
        setOtpError('');
        // Show success message from API response
        setOtpSuccess(response.message || 'OTP has been sent to your email. Please check your inbox.');
      } else {
        setOtpError(response.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      setOtpError(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleBackToLogin = () => {
    localStorage.removeItem('mocksurvey_otp_email');
    navigate('/login', { replace: true });
  };

  if (!userEmail) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="h-screen bg-[#FFF] flex overflow-hidden">
      {/* Right Panel - Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden rounded-l-3xl m-2">
        <img 
          src={signInImage} 
          alt="Sign in" 
          className="w-full h-full object-cover"
        />
      </div>
      {/* Left Panel - OTP Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 overflow-y-auto">
        <div className="md:w-[70%] w-[90%] max-w-md space-y-4 py-4">
         


          {/* Header */}
          <div className="space-y-1">
            <Button
              type="button"
              onClick={handleBackToLogin}
              variant="ghost"
              className="w-fit font-medium text-sm text-gray-600 hover:text-gray-800 cursor-pointer -ml-2"
            >
              ← Back to Login
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">
              Verify Your Email
            </h2>
            <p className="text-sm text-gray-600">
              We've sent a 4-digit verification code to <span className="font-medium text-gray-900">{userEmail}</span>. Enter the code to continue.
            </p>
          </div>

      

          {/* OTP Error Alert */}
          {otpError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800 text-sm">
                {otpError}
              </AlertDescription>
            </Alert>
          )}

          {/* OTP Success Alert */}
          {otpSuccess && (
            <Alert variant="success" className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800 text-sm">
                {otpSuccess}
              </AlertDescription>
            </Alert>
          )}

          {/* OTP Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-4">
            {/* OTP Input */}
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                Enter Verification Code
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="0000"
                value={otp}
                onChange={handleOtpChange}
                maxLength={4}
                className="h-12 text-center text-lg font-mono tracking-widest border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none bg-gray-50"
                disabled={isVerifyingOtp}
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={!otp || otp.length !== 4 || isVerifyingOtp}
                className="w-full h-12 bg-sky-900 hover:bg-sky-800 text-white font-medium text-base rounded-lg transition-colors"
              >
                {isVerifyingOtp ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Verify & Login'
                )}
              </Button> 

              <Button
                type="button"
                onClick={handleResendOtp}
                disabled={isResendingOtp}
                variant="outline"
                className="w-full h-12 font-medium text-base rounded-lg"
              >
                {isResendingOtp ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Resending...</span>
                  </div>
                ) : (
                  'Resend Code'
                )}
              </Button>


            </div>
          </form>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Didn't receive the code? Check your spam folder or{' '}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResendingOtp}
                className="text-blue-600 hover:text-blue-700 font-medium underline cursor-pointer"
              >
                request a new one
              </button>
            </p>
          </div>
        </div>
      </div>


    </div>
  );
};

export default VerifyOtp;

