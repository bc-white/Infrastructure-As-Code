
import Header from '@/components/landingpage/components/Header';
import HeroSection from '@/components/landingpage/components/HeroSection';
import Features from '@/components/landingpage/components/Features';
import Testimonials from '@/components/landingpage/components/Testimonials';
import Footer from '@/components/landingpage/components/Footer';
import { useAuthStore } from '@/store/auth';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Move validRoles outside component to prevent recreation
const validRoles = ['super-admin', 'org-admin', 'facility-admin', 'nurse-manager'];

const Index = () => {

  const { user } = useAuthStore();
  const userRole = user?.role;
  const navigate = useNavigate();

  console.log(userRole, 'userRole');

  // Check if user is authenticated and has a valid role
  const isAuthenticated = user && validRoles.includes((userRole as string) || '');
  
  if (isAuthenticated) {
    // Route based on user role
    switch (userRole) {
      case 'super-admin':
        return <Navigate to="/dashboard/super-admin" />;
      case 'org-admin':
        return <Navigate to="/dashboard/org-admin" />;
      case 'facility-admin':
        return <Navigate to={`/dashboard/org-admin/facility/${user?.organizationId}/${user?.facilityId}`} />;
      case 'nurse-manager':
        return <Navigate to="/dashboard/nurse-manager" />;
      default:
        // Fallback for authenticated users with unexpected roles
        return <Navigate to="/dashboard/org-admin" />;
    }
  }

  // Handle case where user exists but has no role or invalid role
  useEffect(() => {
   
    console.log(user, 'user');
    // Navigate to onboarding if user exists but has invalid/missing role
    if (user && !validRoles.includes((userRole as string) || '')) {
      navigate('/onboard-as-org');
    }
  }, [user, userRole, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <Features />
  <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
