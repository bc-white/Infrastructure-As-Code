import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { AuthProvider } from "./contexts/AuthContext";
import { FeatureGateProvider } from "./contexts/FeatureGateContext";
import { FacilityProvider } from "./contexts/FacilityContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Toaster } from "./components/ui/sonner";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";
import MFAVerify from "./pages/auth/MFAVerify";
import ProfileManagement from "./pages/auth/ProfileManagement";
import Dashboard from "./pages/Dashboard";
import SurveyBuilder from "./pages/SurveyBuilder";
import SurveyReport from "./pages/SurveyReport";
import Surveys from "./pages/Surveys";
import Reports from "./pages/Reports";
import ResourceCenter from "./pages/ResourceCenter";
import ResourceDetail from "./pages/ResourceDetail";
import FTagManagement from "./pages/FTagManagement";
import FTagDetail from "./pages/FTagDetail";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import MultiFacilityDashboard from "./pages/MultiFacilityDashboard";
import Facilities from "./pages/Facilities";
import AddEditFacility from "./pages/facility/AddEditFacility";
import FacilityDetail from "./pages/facility/FacilityDetail";
import LinkFacility from "./pages/facility/LinkFacility";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AccessDenied from "./pages/errors/AccessDenied";
import InsufficientPermissions from "./pages/errors/InsufficientPermissions";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";
import Index from "./pages/home/Index";
import LifeSafetySurvey from "./pages/survey/LifeSafetySurvey";
import FacilityInitiatedSurvey from "./pages/survey/FacilityInitiatedSurvey";
import UserManagement from "./pages/user-management/Index";
import MemberDetail from "./pages/user-management/MemberDetail";
import Poc from "./pages/poc/Index";
import POCHistory from "./pages/poc/POCHistory";
import AskMocky365 from "./pages/AskMocky365";
import ResidentInvestigation from "./pages/residentInvestigation";
import RiskBasedProcess from "./pages/survey/RiskBasedProcess";
import RiskBaseList from "./pages/RiskBaseList";
import SampleSection from "./pages/sampleSection";
import OldRiskBase from "./pages/survey/old-risk-base";



// PayPal configuration
const paypalOptions = {
  "client-id":
    import.meta.env.VITE_PAYPAL_CLIENT_ID,
  currency: "USD",
  intent: "capture",
  "data-client-token": import.meta.env.VITE_PAYPAL_CLIENT_TOKEN || undefined,
};

function App() {
  return (
    <PayPalScriptProvider options={paypalOptions}>
      <AuthProvider>
          <FeatureGateProvider>
            <FacilityProvider>
              <NotificationProvider>
                <Router>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/verify-otp" element={<VerifyOtp />} />
                  <Route path="/verify-mfa" element={<MFAVerify />} />
                  {/* <Route path="/register" element={<Register />} /> */}
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  {/* <Route path="/pricing" element={<Pricing />} /> */}
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route
                    path="/demo"
                    element={
                      <ErrorBoundary>
                        <SurveyBuilder />
                      </ErrorBoundary>
                    }
                  />

                  {/* Payment Routes - Protected */}
                  <Route
                    path="/checkout/:planId"
                    element={
                      <ProtectedRoute noLayout={true}>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  /> 

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/mocksurvey365"
                    element={
                      <ProtectedRoute noLayout={true}>
                        <ErrorBoundary>
                          <SurveyBuilder />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/plan-of-correction/add/:id?"
                    element={
                      <ProtectedRoute>
                        <Poc />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/plan-of-correction"
                    element={
                      <ProtectedRoute>
                         <POCHistory />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/survey-report/:id"
                    element={
                      <ProtectedRoute noLayout={true}>
                        <SurveyReport />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/surveys"
                    element={
                      <ProtectedRoute>
                        <Surveys />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/life-safety-survey"
                    element={
                      <ProtectedRoute noLayout={true}>
                        <LifeSafetySurvey />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/risk-based-survey"
                    element={
                      <ProtectedRoute noLayout={true}>
                        <OldRiskBase />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/risk-based-process"
                    element={
                      <ProtectedRoute noLayout={true}>
                        <RiskBasedProcess />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/risk-based-list"
                    element={
                      <ProtectedRoute>
                        <RiskBaseList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sample-section"
                    element={
                      <ProtectedRoute>
                        <SampleSection />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/resource-center"
                    element={
                      <ProtectedRoute>
                        <ResourceCenter />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/resource/:id"
                    element={
                      <ProtectedRoute>
                        <ResourceDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/f-tag-library"
                    element={
                      <ProtectedRoute>
                        <FTagManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/f-tag/:tag"
                    element={
                      <ProtectedRoute>
                        <FTagDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfileManagement />
                      </ProtectedRoute>
                    }
                  /> 
                  <Route
                    path="/multi-facility"
                    element={
                      <ProtectedRoute>
                        <MultiFacilityDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/facilities"
                    element={
                      <ProtectedRoute>
                        <Facilities />
                      </ProtectedRoute>
                    }
                  />

                  {/* Facility Management Routes */}
                  <Route
                    path="/facility/add"
                    element={
                      <ProtectedRoute noLayout={true}>
                        <AddEditFacility />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/facility/link"
                    element={
                      <ProtectedRoute noLayout={true}>
                        <LinkFacility />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/facility/:id"
                    element={
                      <ProtectedRoute>
                        <FacilityDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/facility/:id/edit"
                    element={
                      <ProtectedRoute noLayout={true}>
                        <AddEditFacility />
                      </ProtectedRoute>
                    }
                  />

                  {/* User Management Routes - Available to all authenticated users */}
                  <Route
                    path="/user-management"
                    element={
                      <ProtectedRoute>
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/user-management/:id"
                    element={
                      <ProtectedRoute>
                        <MemberDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <div className="text-center py-12">
                          <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            System Settings
                          </h1>
                          <p className="text-gray-600">
                            Admin-only system configuration
                          </p>
                        </div>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/analytics"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <div className="text-center py-12">
                          <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Analytics Dashboard
                          </h1>
                          <p className="text-gray-600">
                            Admin-only analytics and insights
                          </p>
                        </div>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/ask-mocky365"
                    element={
                      <ProtectedRoute noLayout={true}>
                        <AskMocky365 />
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="/resident-investigation"
                    element={<ResidentInvestigation />}
                  />

               

                  {/* Error Routes */}
                  <Route path="/access-denied" element={<AccessDenied />} />
                  <Route
                    path="/insufficient-permissions"
                    element={<InsufficientPermissions />}
                  />

                  {/* Catch-all route for authenticated users */}
                  <Route
                    path="*"
                    element={
                      <ProtectedRoute>
                        <div className="text-center py-12">
                          <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Page Not Found
                          </h1>
                          <p className="text-gray-600">
                            The page you're looking for doesn't exist.
                          </p>
                        </div>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Router>
              <Toaster />
            </NotificationProvider>
          </FacilityProvider>
        </FeatureGateProvider>
      </AuthProvider>
    </PayPalScriptProvider>
  );
}

export default App;
