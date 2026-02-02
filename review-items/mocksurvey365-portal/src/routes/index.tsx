import { BrowserRouter as Router, Routes, Route } from "react-router";
import GuestLayout from "@/components/layouts/GuestLayout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "@/pages/Login";
// import Register from "@/pages/Register";
import { Toaster } from "@/components/ui/sonner";
import { NotificationProvider } from "@/contexts/NotificationContext";
import DashboardLayout from "@/components/layouts/Layout";
import { useAuthStore } from "@/store/auth";
import { Navigate } from "react-router";
import MerchantDashboard from "@/pages/Merchant/Dashboard";
import DiscountManagement from "@/pages/Merchant/DiscountManagement";
import AddEditDiscount from "@/pages/Merchant/AddEditDiscount";
import DiscountDetail from "@/pages/Merchant/DiscountDetail";
import AddNewUser from "@/pages/Merchant/AddNewUser";
import AnalyticsDashboard from "@/pages/Merchant/AnalyticsDashboard";
import CriticalElementsDashboard from "@/pages/Merchant/CriticalElementsDashboard";
import AccountManagement from "@/pages/Merchant/AccountManagement";
import ProfileSetup from "@/pages/Merchant/ProfileSetup";
import AddEditMandatoryTask from "@/pages/Merchant/AddEditMandatoryTask";
import MandatoryTasks from "@/pages/Merchant/MandatoryTasks";
import FacilityEntranceInitialAssessments from "@/pages/Merchant/FacilityEntranceInitialAssessments";
import AddEditAssessment from "@/pages/Merchant/AddEditAssessment";
import FtagSetupPage from "@/pages/Merchant/FtagSetupPage";
import AddEditFtagSetup from "@/pages/Merchant/AddEditFtagSetup";
import SubscriptionPage from "@/pages/Merchant/SubscriptionPage";
import AddEditSubscription from "@/pages/Merchant/AddEditSubscription";


function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* Guest Routes - No Authentication Required */}
            <Route element={<GuestLayout />}>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              {/* <Route path="/register" element={<Register />} /> */}
            </Route>


            {/* Protected Routes - Omcura Admin (Authentication Required) */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout showHeader={true} />
                </ProtectedRoute>
              }
            >
              {/* Super Admin Routes */}

              {/* Merchant Dashboard Routes */}
              <Route
                path="/dashboard"
                element={<MerchantDashboard />}
              />
              <Route
                path="/dashboard/resources"
                element={<AnalyticsDashboard />}
              />
              <Route
                path="/dashboard/critical-elements"
                element={<CriticalElementsDashboard />}
              />
              <Route
                path="/dashboard/facility-entrance-initial-assessments"
                element={<FacilityEntranceInitialAssessments />}
              />
              <Route
                path="/dashboard/mandatory-tasks"
                element={<MandatoryTasks />}
              />
              <Route
                path="/dashboard/ftag-setup"
                element={<FtagSetupPage />}
              />
              <Route
                path="/dashboard/account-management"
                element={<AccountManagement />}
              />
              <Route
                path="/dashboard/subscriptions"
                element={<SubscriptionPage />}
              />
            </Route>

            {/* Discount Management Routes - No Header */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout showHeader={true} />
                </ProtectedRoute>
              }
            >
              <Route
                path="/dashboard/accounts"
                element={<DiscountManagement />}
              />
            </Route>
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout showHeader={false} />
                </ProtectedRoute>
              }
            >
              <Route
                path="/dashboard/merchant/discount/add"
                element={<AddEditDiscount />}
              />
              <Route
                path="/dashboard/merchant/discount/edit/:id"
                element={<AddEditDiscount />}
              />
              <Route
                path="/dashboard/accounts/detail/:id"
                element={<DiscountDetail />}
              />
              <Route
                path="/dashboard/merchant/profile-setup"
                element={<ProfileSetup />}
              />
              <Route
                path="/dashboard/merchant/add-user"
                element={<AddNewUser />}
              />
               <Route
                path="/dashboard/mandatory-tasks/add"
                element={<AddEditMandatoryTask />}
              />
              <Route
                path="/dashboard/mandatory-tasks/edit/:id"
                element={<AddEditMandatoryTask />}
              />
              <Route
                path="/dashboard/facility-entrance-initial-assessments/add"
                element={<AddEditAssessment />}
              />
              <Route
                path="/dashboard/facility-entrance-initial-assessments/edit/:id"
                element={<AddEditAssessment />}
              />
              <Route
                path="/dashboard/ftag-setup/add"
                element={<AddEditFtagSetup />}
              />
              <Route
                path="/dashboard/ftag-setup/edit/:id"
                element={<AddEditFtagSetup />}
              />
              <Route
                path="/dashboard/subscriptions/add"
                element={<AddEditSubscription />}
              />
              <Route
                path="/dashboard/subscriptions/edit/:id"
                element={<AddEditSubscription />}
              />
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
