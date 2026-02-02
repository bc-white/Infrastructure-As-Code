import { Routes, Route, Navigate } from "react-router-dom"
import Landing from "./pages/Landing"
import Auth from "./pages/Auth"
import VerifyOTP from "./pages/VerifyOTP"
import ForgotPassword from "./pages/ForgotPassword"
import Onboarding from "./pages/Onboarding"
import InviteUsers from "./pages/InviteUsers"
import Dashboard from "./pages/Dashboard"
import SurveyList from "./pages/Surveys/SurveyList"
import SurveyBuilder from "./pages/Surveys/SurveyBuilder"
import SurveyBuilderMultiStep from "./pages/Surveys/SurveyBuilderMultiStep"
import TakeSurvey from "./pages/Surveys/TakeSurvey"
import SurveyInstances from "./pages/Surveys/SurveyInstances"
import SurveyInstanceDetail from "./pages/Surveys/SurveyInstanceDetail"
import FamilyCareFlow from "./pages/FamilyCare/FamilyCareFlow"
import ProcessingPage from "./pages/FamilyCare/ProcessingPage"
import FacilitiesResults from "./pages/FamilyCare/FacilitiesResults"
import HealthcareProviders from "./pages/FamilyCare/HealthcareProviders"
import Reports from "./pages/Reports"
import ServiceList from "./pages/Service/ServiceList"
import CreateService from "./pages/Service/CreateService"
import Resources from "./pages/Resources"
import Libraries from "./pages/Libraries"
import LibraryDetail from "./pages/Libraries/LibraryDetail"
import FacilitiesList from "./pages/Facilities/FacilitiesList"
import FacilityDetail from "./pages/Facilities/FacilityDetail"
import AddFacility from "./pages/Facilities/AddFacility"
import EditFacility from "./pages/Facilities/EditFacility"
import MultiFacility from "./pages/MultiFacility"
import PlanOfCorrection from "./pages/PlanOfCorrection"
import AskMocky365 from "./pages/AskMocky365"
import ProtectedRoute from "./components/ProtectedRoute"
import DashboardLayout from "./components/Layout/DashboardLayout"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/signup" element={<Navigate to="/auth" replace />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/family-care" element={<FamilyCareFlow />} />
      <Route path="/family-care/processing" element={<ProcessingPage />} />
      <Route path="/family-care/results" element={<FacilitiesResults />} />
      <Route path="/healthcare-providers" element={<HealthcareProviders />} />
      <Route 
        path="/onboarding" 
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/invite-users" 
        element={
          <ProtectedRoute>
            <InviteUsers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/surveys/builder" 
        element={
          <ProtectedRoute>
            <SurveyBuilderMultiStep />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/surveys/builder/:id" 
        element={
          <ProtectedRoute>
            <SurveyBuilderMultiStep />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/surveys/take" 
        element={
          <ProtectedRoute>
            <TakeSurvey />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/surveys/take/:id" 
        element={
          <ProtectedRoute>
            <TakeSurvey />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/surveys/instances" 
        element={
          <ProtectedRoute>
            <SurveyInstances />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/surveys/instances/:id" 
        element={
          <ProtectedRoute>
            <SurveyInstanceDetail />
          </ProtectedRoute>
        } 
      />
      
      {/* Dashboard routes with layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="surveys" element={<SurveyList />} />
        <Route path="service" element={<ServiceList />} />
        <Route path="service/new" element={<CreateService />} />
        <Route path="resources" element={<Resources />} />
        <Route path="libraries" element={<Libraries />} />
        <Route path="libraries/:id" element={<LibraryDetail />} />
        <Route path="facilities" element={<FacilitiesList />} />
        <Route path="facilities/:id" element={<FacilityDetail />} />
        <Route path="facilities/new" element={<AddFacility />} />
        <Route path="facilities/edit/:id" element={<EditFacility />} />
        <Route path="multi-facility" element={<MultiFacility />} />
        <Route path="plan-of-correction" element={<PlanOfCorrection />} />
        <Route path="ask-mocky365" element={<AskMocky365 />} />
        {/* Additional routes will be added here as features are implemented */}
        {/* <Route path="surveys/preview/:id" element={<SurveyPreview />} />
        <Route path="deficiencies" element={<DeficiencyList />} />
        <Route path="deficiencies/new" element={<CreateDeficiency />} />
        <Route path="deficiencies/:id" element={<DeficiencyDetail />} />
        <Route path="poc" element={<POCList />} />
        <Route path="poc/new" element={<CreatePOC />} />
        <Route path="poc/:id" element={<POCDetail />} />
        <Route path="documents" element={<DocumentLibrary />} />
        <Route path="settings" element={<Settings />} /> */}
      </Route>
    </Routes>
  )
}

export default App
