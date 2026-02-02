import { useState, useEffect } from 'react';
import { useAnimateIn } from '@/lib/animations';
import { NavigationHeader } from '@/components/landing/NavigationHeader.jsx';
import { HeroSection } from '@/components/landing/HeroSection.jsx';
import { FeaturesSection } from '@/components/landing/FeaturesSection.jsx';
import { AboutSection } from '@/components/landing/AboutSection.jsx';
import { ComplianceSection } from '@/components/landing/ComplianceSection.jsx';
import { BenefitsSection } from '@/components/landing/BenefitsSection.jsx';
import { BlogSection } from '@/components/landing/BlogSection.jsx';
import TestimonialsSection from '@/components/landing/TestimonialsSection.jsx';
import { CallToAction } from '@/components/landing/CallToAction.jsx';
import { Footer } from '@/components/landing/Footer.jsx';
import { LoadingScreen } from '@/components/landing/LoadingScreen.jsx';
import { clearOldSurveyData } from '@/utils/surveyStorageIndexedDB';

const ANIMATION_DELAYS = {
  hero: 300,
  features: 600,
  about: 900,
  compliance: 1200,
  benefits: 1500,
  blog: 1800,
  testimonials: 2100,
  callToAction: 2400
};

const Index = () => {
  const [loading, setLoading] = useState(true);
  
  // Animation triggers
  const showHero = useAnimateIn(false, ANIMATION_DELAYS.hero);
  const showFeatures = useAnimateIn(false, ANIMATION_DELAYS.features);
  const showAbout = useAnimateIn(false, ANIMATION_DELAYS.about);
  const showCompliance = useAnimateIn(false, ANIMATION_DELAYS.compliance);
  const showBenefits = useAnimateIn(false, ANIMATION_DELAYS.benefits);
  const showBlog = useAnimateIn(false, ANIMATION_DELAYS.blog);
  const showTestimonials = useAnimateIn(false, ANIMATION_DELAYS.testimonials);
  const showCallToAction = useAnimateIn(false, ANIMATION_DELAYS.callToAction);
  
  useEffect(() => {
    // Clear old survey data from localStorage when home page loads
    clearOldSurveyData();
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="relative overflow-hidden min-h-screen bg-white">
      <NavigationHeader />
      <div className="flex flex-col">
        <HeroSection showTitle={showHero} />
        
        <AboutSection show={showAbout} />
        
        <FeaturesSection show={showFeatures} />
        
        <ComplianceSection show={showCompliance} />
        
        
        <BlogSection show={showBlog} />
        
        <TestimonialsSection show={showTestimonials} />
        
        <CallToAction show={showCallToAction} />
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
