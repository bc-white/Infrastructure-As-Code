import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { navigate } from '../../utils/navigation';
import { authAPI } from '../../service/api';
import signInImage from '../../assets/Sign in Page.jpg';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState('email'); // 'email', 'otp', 'reset'
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Call the actual forgot password API
      const response = await authAPI.forgotPassword(email.trim());
      
      if (response.status && response.statusCode === 200) {
        setCurrentStep('otp');
        setError('');
      } else {
        setError(response.message || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };


  const handleOtpChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 4 digits
    if (/^\d{0,4}$/.test(value)) {
      setOtp(value);
      setOtpError(''); // Clear error when user types
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
      // For now, just proceed to password reset step
      // In a real implementation, you might want to verify the OTP first
      setCurrentStep('reset');
    } catch (error) {
      setOtpError(error.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResendingOtp(true);
    setOtpError('');

    try {
      const response = await authAPI.forgotPassword(email.trim());
      
      if (response.status && response.statusCode === 200) {
        setOtpError('');
        // You could add a success message here
      } else {
        setOtpError(response.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      setOtpError(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (!newPassword || newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsResettingPassword(true);
    setPasswordError('');

    try {
      const response = await authAPI.resetPassword(otp, newPassword, confirmPassword);
      
      if (response.status && response.statusCode === 200) {
        // Password reset successful
        setCurrentStep('success');
      } else {
        setPasswordError(response.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setPasswordError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleBackToEmail = () => {
    setCurrentStep('email');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setOtpError('');
    setPasswordError('');
  };

  const handleBackToOtp = () => {
    setCurrentStep('otp');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  if (currentStep === 'success') {
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

         {/* Left Panel - Success Message */}
         <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 overflow-y-auto">
          <div className="md:w-[70%] w-[90%] max-w-md space-y-4 py-4">
          

            {/* Success Message */}
            <div className="space-y-4 text-left">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Password Reset Successful!</h1>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Your password has been successfully reset.</p>
                <p className="text-sm">You can now log in with your new password.</p>
              </div>
            </div>
              
            {/* Actions */}
            <div className="space-y-4">
              <Button 
                className="w-full h-12 bg-sky-900 hover:bg-sky-800 text-white font-medium text-base rounded-lg transition-colors"
                onClick={handleBackToLogin}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div> 
      </div>
    );
  }

  // OTP Verification Step
  if (currentStep === 'otp') {
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
          

            {/* OTP Form */}
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <h1 className="text-2xl font-bold text-gray-900">Reset Your Password </h1>
                <p className="text-sm text-gray-600">
                  We've sent a 4-digit verification code to <span className="font-medium text-gray-900">{email}</span>
                </p>
              </div>

              {otpError && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800 text-sm">{otpError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-gray-700">Enter Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="0000"
                    value={otp}
                    onChange={handleOtpChange}
                    maxLength={4}
                    className="h-12 text-center text-lg font-mono tracking-widest border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-base rounded-lg bg-gray-50"
                    disabled={isVerifyingOtp}
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={!otp || otp.length !== 4 || isVerifyingOtp}
                    className="w-full h-12 bg-sky-900 hover:bg-sky-800 text-white font-medium text-base rounded-lg transition-colors"
                  >
                    {isVerifyingOtp ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      'Verify Code'
                    )}
                  </Button>

                  <Button
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

                  <Button
                    onClick={handleBackToEmail}
                    variant="ghost"
                    className="w-full h-10 font-medium text-base text-gray-600 hover:text-gray-800"
                  >
                    ← Back to Email
                  </Button>
                </div>
              </div>

              {/* Help Text */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Didn't receive the code? Check your spam folder or click "Resend Code" above.
                </p>
              </div>
            </div>
          </div>
        </div>
       
      </div>
    );
  }

  // Password Reset Step
  if (currentStep === 'reset') {
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

         {/* Left Panel - Password Reset Form */}
         <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 overflow-y-auto">
          <div className="md:w-[70%] w-[90%] max-w-md space-y-4 py-4">
           

            {/* Password Reset Form */}
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <h1 className="text-2xl font-bold text-gray-900">Reset Your Password <span className="inline-block">�</span></h1>
                <p className="text-sm text-gray-600">
                  Enter your new password below
                </p>
              </div>

              {passwordError && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800 text-sm">{passwordError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError('');
                    }}
                    required
                    disabled={isResettingPassword}
                    className="h-12 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-base rounded-lg bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError('');
                    }}
                    required
                    disabled={isResettingPassword}
                    className="h-12 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-base rounded-lg bg-gray-50"
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={!newPassword || !confirmPassword || newPassword.length < 8 || isResettingPassword}
                    className="w-full h-12 bg-sky-900 hover:bg-sky-800 text-white font-medium text-base rounded-lg transition-colors"
                  >
                    {isResettingPassword ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Resetting Password...</span>
                      </div>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>

                  <Button
                    onClick={handleBackToOtp}
                    variant="ghost"
                    className="w-full h-10 font-medium text-base text-gray-600 hover:text-gray-800"
                  >
                    ← Back to OTP
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF] flex">
      

      {/* Right Panel - Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden rounded-l-3xl m-2">
        <img 
          src={signInImage} 
          alt="Sign in" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Left Panel - Forgot Password Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="md:w-[70%] w-[90%] space-y-8">
        

          {/* Forgot Password Form */}
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <h1 className="text-3xl font-bold text-gray-900">Reset Your Password </h1>
              <p className="text-sm text-gray-600">
                Today is a new day. It's your day. You shape it. Enter your email to reset your password.
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Example@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  required
                  disabled={isLoading}
                  className="h-12 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-base rounded-lg bg-gray-50"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-sky-900 hover:bg-sky-800 text-white font-medium text-base rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  'Send Reset Instructions'
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <button
                  onClick={handleBackToLogin}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </div>

            {/* Copyright */}
            <div className="text-center pt-8">
              <p className="text-sm text-gray-400">
                © 2025 ALL RIGHTS RESERVED
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
