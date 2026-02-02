import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useAuth } from "../../contexts/AuthContext";
import { navigate } from "../../utils/navigation";
import { useAuth0 } from "@auth0/auth0-react";
import { ArrowLeftIcon } from "lucide-react";
import signInImage from "../../assets/Sign in Page.jpg";

const Login = () => {
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAuthenticated } = useAuth();
  const { 
    loginWithRedirect, 
    isAuthenticated: isAuth0Authenticated, 
    user: auth0User,
    getIdTokenClaims,
    getAccessTokenSilently,
    isLoading: isAuth0Loading 
  } = useAuth0();


  // Handle Auth0 authentication callback
  useEffect(() => {
    const handleAuth0Login = async () => {
      if (isAuth0Authenticated && auth0User) {
        try {
          // Get the ID token from Auth0
          const claims = await getIdTokenClaims();
          const token = claims?.__raw || '';
          
          // Get the access token for API calls
          let accessToken = '';
          try {
            accessToken = await getAccessTokenSilently();
          } catch (e) {
            //
          }
          
          // Parse name from Auth0 user
          // Check if name is actually an email (Auth0 sometimes sets email as name)
          const isNameEmail = auth0User.name?.includes('@');
          const emailUsername = auth0User.email?.split('@')[0] || '';
          
          // Try to get first name from various sources
          let firstName = '';
          let lastName = '';
          
          if (auth0User.given_name) {
            firstName = auth0User.given_name;
            lastName = auth0User.family_name || '';
          } else if (auth0User.name && !isNameEmail) {
            // Name exists and is not an email
            const nameParts = auth0User.name.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          } else if (auth0User.nickname && auth0User.nickname !== emailUsername) {
            // Use nickname if it's different from email username
            firstName = auth0User.nickname;
          } else {
            // Fallback: capitalize first letter of email username
            firstName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
          }
          
          // Store Auth0 user data and token directly
          const userData = {
            _id: auth0User.sub,
            email: auth0User.email,
            firstName: firstName,
            lastName: lastName,
            picture: auth0User.picture,
            name: auth0User.name || `${firstName} ${lastName}`.trim(),
            nickname: auth0User.nickname,
            isEmailVerified: auth0User.email_verified || false,
          };
          
          // Set session expiry from Auth0 token expiry (exp claim is in seconds)
          const tokenExpiry = claims?.exp;
          const sessionExpiry = tokenExpiry 
            ? new Date(tokenExpiry * 1000) // Convert seconds to milliseconds
            : new Date(Date.now() + 86400 * 1000); // Fallback to 24 hours
          
          localStorage.setItem('mocksurvey_token', accessToken || token);
          localStorage.setItem('mocksurvey_user', JSON.stringify(userData));
          localStorage.setItem('mocksurvey_session_expiry', sessionExpiry.toISOString());
          
        
          
          // Navigate to dashboard using window.location to trigger AuthContext reload
          const intendedRoute = localStorage.getItem('mocksurvey_intended_route');
          if (intendedRoute && intendedRoute !== '/login') {
            localStorage.removeItem('mocksurvey_intended_route');
            window.location.href = intendedRoute;
          } else {
            window.location.href = "/dashboard";
          }
        } catch (error) {
          
          setLoginError(error.message || 'Failed to complete authentication.');
        }
      }
    };
    
    handleAuth0Login();
  }, [isAuth0Authenticated, auth0User, getIdTokenClaims, getAccessTokenSilently]);

  // Redirect if already authenticated
  useEffect(() => {
    // Check both AuthContext and Auth0 authentication
    const hasToken = localStorage.getItem('mocksurvey_token');
    if (isAuthenticated || isAuth0Authenticated || hasToken) {
      const timer = setTimeout(() => {
        const intendedRoute = localStorage.getItem('mocksurvey_intended_route');
        if (intendedRoute && intendedRoute !== '/login' && intendedRoute !== '/verify-otp') {
          localStorage.removeItem('mocksurvey_intended_route'); 
          navigate(intendedRoute);
        } else {
          navigate("/dashboard");
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isAuth0Authenticated]);

  // Handle Sign In with Auth0
  const handleSignIn = async () => {
    try {
      setLoginError('');
      setIsSubmitting(true);
      
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'login',
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          // Request MFA
          acr_values: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
        },
      });
    } catch (error) {
      setLoginError(error.message || 'Failed to initiate sign in.');
      setIsSubmitting(false);
    }
  };

  // Handle Sign Up with Auth0
  const handleSignUp = async () => {
    try {
      setLoginError('');
      setIsSubmitting(true);
      
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          // Request MFA enrollment after signup
          acr_values: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
        },
      });
    } catch (error) {
      setLoginError(error.message || 'Failed to initiate sign up.');
      setIsSubmitting(false);
    }
  };
 
  // Show loading while Auth0 is initializing or user is already authenticated
  const hasToken = localStorage.getItem('mocksurvey_token');
  const isRedirecting = isAuthenticated || isAuth0Authenticated || hasToken;
  
  if (isAuth0Loading || isRedirecting) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-sky-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">
            {isRedirecting ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
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
      {/* Left Panel - Login Content */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 overflow-y-auto">
        <div className="md:w-[70%] w-[90%] max-w-md space-y-6 py-4">
         
          {/* Back to home */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-sm hover:text-sky-600 font-medium transition-colors cursor-pointer hover:underline flex items-center space-x-2"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Home
          </button>

          {/* Welcome Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome Back 
            </h2>
            <p className="text-sm text-gray-600">
              Today is a new day. It's your day. You shape it. Sign in to start managing your mock survey.
            </p>
          </div>

          {/* Error Alert */}
          {loginError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800 text-sm">
                {loginError}
              </AlertDescription>
            </Alert>
          )}

          {/* Sign In Button */}
          <div className="space-y-4 pt-4">
            <Button
              type="button"
              onClick={handleSignIn}
              className="w-full h-12 bg-sky-900 hover:bg-sky-800 text-white font-medium text-base rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Redirecting...</span>
                </div>
              ) : (
                "Sign in"
              )}
            </Button>

            {/* Sign Up Link */}
            {/* <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={handleSignUp}
                  disabled={isSubmitting}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  Sign up
                </button>
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
