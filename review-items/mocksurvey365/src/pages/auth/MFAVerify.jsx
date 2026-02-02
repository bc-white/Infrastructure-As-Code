import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useAuth } from "../../contexts/AuthContext";
import { ArrowLeftIcon, Shield, Smartphone } from "lucide-react";
import signInImage from "../../assets/Sign in Page.jpg";

const MFAVerify = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [mfaError, setMfaError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('mocksurvey_remember') === 'true';
  });
  const inputRefs = useRef([]);

  const navigate = useNavigate();
  const { verifyMfa, isLoading } = useAuth();
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
      const intendedRoute = localStorage.getItem('mocksurvey_intended_route');
      if (intendedRoute && intendedRoute !== '/login' && intendedRoute !== '/verify-mfa') {
        localStorage.removeItem('mocksurvey_intended_route');
        navigate(intendedRoute, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loginSuccess, navigate]);



  const handleCodeChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take the last character
    setCode(newCode);
    setMfaError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      // Focus the next empty input or the last one
      const nextEmptyIndex = newCode.findIndex(c => !c);
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
    }
  };

  const handleVerifyMfa = async (e) => {
    e?.preventDefault();
    
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setMfaError('Please enter a valid 6-digit code');
      return;
    }

    setMfaError('');

    try {
      const result = await verifyMfa(fullCode, userEmail);

      if (result.success) {
        // Clean up
        localStorage.removeItem('mocksurvey_otp_email');
        setLoginSuccess(true);
      } else {
        setMfaError(result.error || 'Invalid code. Please try again.');
      }
    } catch (error) {
      setMfaError(error.message || 'Failed to verify code. Please try again.');
    }
  };

  const handleBackToLogin = () => {
    localStorage.removeItem('mocksurvey_otp_email');
    navigate('/login', { replace: true });
  };

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

      {/* Left Panel - MFA Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 overflow-y-auto">
        <div className="md:w-[70%] w-[90%] max-w-md space-y-6 py-4">
          {/* Back to Login */}
          <button
            type="button"
            onClick={handleBackToLogin}
            className="text-sm hover:text-sky-600 font-medium transition-colors cursor-pointer hover:underline flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Login
          </button>

          {/* Header */}
          <div className="text-left space-y-4">
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Two-Factor Authentication
              </h2>
              <p className="text-sm text-gray-600">
                Enter the 6-digit verification code generated by your authenticator app.
              </p>
              {userEmail && (
                <p className="text-sm text-gray-500">
                  Signing in as <span className="font-medium text-gray-700">{userEmail}</span>
                </p>
              )}
            </div>
          </div>

          {/* Error Alert */}
          {mfaError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800 text-sm">
                {mfaError}
              </AlertDescription>
            </Alert>
          )}

          {/* MFA Form */}
          <form onSubmit={handleVerifyMfa} className="space-y-6">
            {/* Code Input Fields */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 block text-left">
                Verification Code
              </Label>
              <div className="flex justify-start gap-2 sm:gap-3">
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isLoading}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold border-gray-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded-lg"
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-sky-900 hover:bg-sky-800 text-white font-medium text-base rounded-lg transition-colors"
              disabled={isLoading || code.join('').length !== 6}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                "Verify & Sign In"
              )}
            </Button>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRememberMe(checked);
                    if (checked) {
                      localStorage.setItem("mocksurvey_remember", "true");
                    } else {
                      localStorage.removeItem("mocksurvey_remember");
                    }
                  }}
                  disabled={isLoading}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700">Remember for 14 days</span>
              </label>
            </div>
          </form>

          {/* Help Text */}
          <div className="text-left space-y-3 pt-4">
            <div className="flex items-left justify-start gap-2 text-sm text-gray-500">
              <Smartphone className="w-4 h-4" />
              <span>Open your authenticator app to get the code</span>
            </div>
           {/* // lost your MFA method? Contact support. */}
              <div className="flex items-left justify-center gap-2 text-sm text-gray-500">
                
                <span>Lost access to your authenticator app? <button 
                  onClick={() => window.location.href = 'mailto: staff@theinspac.com'}
                    className="text-sky-600 hover:underline font-medium cursor-pointer">Contact Support</button>
                </span>
               
                </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MFAVerify;
