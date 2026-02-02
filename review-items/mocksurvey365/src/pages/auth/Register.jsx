import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { USER_ROLES } from '../../contexts/AuthContext';
import { navigate } from '../../utils/navigation';
import { authAPI } from '../../service/api';
import signInImage from '../../assets/Sign in Page.jpg';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: USER_ROLES.CONSULTANT,
    organization: '',
    phoneNumber: '',
    agreeToTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [roles, setRoles] = useState([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // Fetch roles when component mounts
  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoadingRoles(true);
      try {
        const response = await authAPI.getRoles();
        if (response.status && response.statusCode === 200 && response.data) {
          setRoles(response.data);
          // Set default role to first available role if none selected
          if (response.data.length > 0 && !formData.role) {
            setFormData(prev => ({
              ...prev,
              role: response.data[0]._id
            }));
          }
        }
      } catch (error) {
    
        // Fallback to default roles if API fails
        setRoles([
          { _id: "689634cedb9e2674c11bab2f", name: "Consultant" },
          { _id: "689635c4db9e2674c11bab30", name: "Clinical Team Member" },
          { _id: "68963666db9e2674c11bab31", name: "Administrator" }
        ]);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.organization.trim()) {
      newErrors.organization = 'Organization is required';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the actual signup API
      const response = await authAPI.signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        organization: formData.organization,
        phoneNumber: formData.phoneNumber,
        agreementConfirmation: formData.agreeToTerms,
        roleId: formData.role
      });
      
      // Handle signup response - show OTP modal for verification
      if (response.status && response.statusCode === 200) {
        setUserEmail(formData.email);
        setShowOtpModal(true);
      } else {
        setErrors({ submit: response.message || 'Registration failed. Please try again.' });
      }
      
    } catch (error) {
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
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
      // Registration doesn't use rememberMe, default to false
      const response = await authAPI.verifyOtp(otp, false);
      
      if (response.status && response.statusCode === 200) {
        // OTP verified successfully
        setShowOtpModal(false);
        setRegistrationSuccess(true);
        
        // Store user data if provided in response
        if (response.data && response.data.user) {
          localStorage.setItem('mocksurvey_user', JSON.stringify(response.data.user));
          localStorage.setItem('mocksurvey_session_expiry', new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString());
        }
      } else {
        setOtpError(response.message || 'Invalid OTP. Please try again.');
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

    try {
      const response = await authAPI.resendOtp(userEmail);
      
      if (response.status && response.statusCode === 200) {
        // Show success message
        setOtpError('');
        // You could add a success message here if needed
      } else {
        setOtpError(response.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      setOtpError(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
    setOtp('');
    setOtpError('');
    // Optionally redirect to login or reset form
    navigate('/login');
  };

  if (registrationSuccess) {
    return (
      <div className="h-screen bg-white flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-md text-center space-y-4">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Survey365!</h1>
            <p className="text-sm text-gray-600">
              Your account has been created successfully. You're currently on our free demo plan.
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>What's next?</strong> Start exploring with our demo features, or upgrade to a paid plan for full access to all features.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full h-12 bg-sky-900 hover:bg-sky-800 text-white font-medium text-base rounded-lg transition-colors cursor-pointer"
              onClick={handleBackToLogin}
            >
              Get Started
            </Button>
            {/* <Button 
              variant="outline"
              className="w-full h-12 font-medium text-base rounded-md cursor-pointer"
              onClick={() => navigate('/pricing')}
            >
              View Pricing Plans
            </Button> */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#FFF] flex overflow-hidden">
      {/* Left Panel - Visual/Marketing Content */}
     

      {/* Right Panel - Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden rounded-l-3xl m-2">
        <img 
          src={signInImage} 
          alt="Sign in" 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 overflow-y-auto">
        <div className="md:w-[70%] w-[90%] max-w-md space-y-4 py-4">
         

          {/* Welcome Message */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">
             Create an Account
            </h2>
            <p className="text-sm text-gray-600">
              Sign up to start managing your projects.
            </p>
          </div>

          {/* Error Alert */}
          {errors.submit && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800 text-sm">
                {errors.submit}
              </AlertDescription>
            </Alert>
          )}

          {/* Registration Form - Scrollable Content */}
          <div className="overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label> 
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                className="h-12 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-base rounded-lg bg-gray-50"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                className="h-12 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-base rounded-lg bg-gray-50"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                placeholder="Example@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                className="h-12 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-base rounded-lg bg-gray-50"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Organization */}
              <div className="space-y-2">
                <Label htmlFor="organization" className="text-sm font-medium text-gray-700">Organization</Label>
                <Input
                  id="organization"
                  name="organization"
                  placeholder="Your Company Name"
                  value={formData.organization}
                  onChange={handleInputChange}
                  disabled={isLoading}
                className="h-12 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-base rounded-lg bg-gray-50"
                />
                {errors.organization && (
                  <p className="text-sm text-red-600">{errors.organization}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number (Optional)</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={isLoading}
                className="h-12 border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-base rounded-lg bg-gray-50"
                />
                <small className="text-gray-500">NB: country code is required</small>
              </div>

              {/* Role Selection */}
              {/* <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))} value={formData.role} disabled={isLoading || isLoadingRoles}>
                  <SelectTrigger className="h-12 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none">
                    <SelectValue placeholder={isLoadingRoles ? "Loading roles..." : "Select a role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isLoadingRoles && (
                  <p className="text-sm text-gray-500">Loading available roles...</p>
                )}
              </div> */}


              {/* Terms Agreement */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked }))}
                  disabled={isLoading}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                />
                <div className="text-sm">
                  <Label htmlFor="agreeToTerms" className="text-gray-600">
                    I agree to the{' '}
                    <a href="/terms" target="_blank" className="text-sky-600 hover:text-sky-700 font-medium">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" target="_blank" className="text-sky-600 hover:text-sky-700 font-medium">
                      Privacy Policy
                    </a>
                  </Label>
                  {errors.agreeToTerms && (
                    <p className="text-red-600 mt-1">{errors.agreeToTerms}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-sky-900 hover:bg-sky-800 text-white font-medium text-base rounded-lg transition-colors"
                disabled={isLoading || !formData.agreeToTerms}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Sign up'
                )}
              </Button>
            </form>

            {/* Separator */}
            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

         

            {/* Login Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                Don't you have an account?{' '}
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                  >
                  Sign in
                  </button>
                </p>
              </div>

          </div>
        </div>
      </div>


      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-sky-900">Verify Your Email</h2>
              <p className="text-gray-600">
                We've sent a 4-digit verification code to <span className="font-medium text-gray-900">{userEmail}</span>
              </p>
            </div>

            {/* OTP Input */}
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
                  className="h-12 text-center text-lg font-mono tracking-widest border-gray-300 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-none"
                  disabled={isVerifyingOtp}
                />
                {otpError && (
                  <p className="text-sm text-red-600 text-center">{otpError}</p>
                )}
              </div>

              {/* Action Buttons */}
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
                    'Verify Email'
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
                  onClick={handleCloseOtpModal}
                  variant="ghost"
                  className="w-full h-10 font-medium text-base text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Didn't receive the code? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResendingOtp}
                  className="text-sky-600 hover:text-sky-700 font-medium underline"
                >
                  request a new one
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
