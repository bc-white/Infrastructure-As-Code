import React from 'react';
import { Button } from './ui/button';
import api from '../service/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
   
    this.setState({
      error,
      errorInfo
    });

    // Send error report to developer email in the background
    this.sendErrorReport(error, errorInfo);
  }

  sendErrorReport = async (error, errorInfo) => {
    try {
      // Get minimal user info for context (no sensitive data)
      const userStr = localStorage.getItem('mocksurvey_user');
      let userId = 'Not logged in';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          // Only include user ID, not email or personal info
          userId = user._id || 'Unknown';
        } catch (e) {
          userId = 'User info unavailable';
        }
      }

      // Get survey info if available
      const surveyId = localStorage.getItem('currentSurveyId') || 'No survey ID';

      // Prepare error details - NO personal data, tokens, or localStorage dumps
      const errorDetails = `
APPLICATION ERROR REPORT
========================

Time: ${new Date().toLocaleString()}
User ID: ${userId}
Survey ID: ${surveyId}
Browser: ${navigator.userAgent}
URL: ${window.location.href}

ERROR DETAILS:
--------------
Error Message: ${error.toString()}

Component Stack:
${errorInfo.componentStack}

Error Stack:
${error.stack || 'No stack trace available'}
      `.trim();

      // Send email to developer (uses env variable with fallback)
      const errorReportEmail = import.meta.env.VITE_ERROR_REPORT_EMAIL || 'richard@mocksurvey365.com';
      await api.survey.requestEmail({
        to: errorReportEmail,
        subject: `🚨 MockSurvey365 Error Report - ${error.message || 'Unknown Error'}`,
        message: errorDetails
      });

   
    } catch (emailError) {
      // Silently fail if email sending fails - don't disrupt user experience
  
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI - Clean and simple
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              {/* Title */}
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>

              {/* Message */}
              <p className="text-sm text-gray-600 mb-6">
                Don't worry - your work is automatically saved and secure.
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={this.handleReset}
                  className="w-full bg-[#075b7d] hover:bg-[#064d63] text-white h-11"
                >
                  Reload Application
                </Button>
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                  className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Go to Dashboard
                </Button>
              </div>
              {/* Support Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Our team has been notified and will investigate this issue.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

