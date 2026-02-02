import { AnimatedTransition } from "@/components/AnimatedTransition";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import welcome1 from "@/assets/Welcome 1.jpg";
import welcome2 from "@/assets/Welcome 2.jpg";
import welcome3 from "@/assets/Welcome 3.jpg";
import welcome4 from "@/assets/Welcome 4.jpg";

const HERO_IMAGES = [
  welcome1,
  welcome2,
  welcome3,
  welcome4
];

export const HeroSection = ({ showTitle }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate images
  useEffect(() => {
    if (!showTitle) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [showTitle]);
  
  return (
    <>
      <div className="relative md:min-h-screen bg-[#fecc1b] overflow-hidden font-sans w-full md:mt-4 py-16 md:py-24">
      
        {/* Hero Content - Image Left, Text Right Layout */}
        <div className="relative  w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto md:py-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Left Side - Image Stack */}
            <div className="relative order-1 lg:order-1 mt-12 lg:mt-0 flex justify-center perspective-1000 min-h-[400px] lg:min-h-[600px]">
              <div className="relative w-full max-w-[500px] h-[400px] lg:h-[600px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {HERO_IMAGES.map((image, index) => {
                    if (index !== currentImageIndex) return null;
                    
                    return (
                      <motion.div
                        key={image}
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      >
                        <img 
                          src={image} 
                          alt={`Healthcare professional ${index + 1}`} 
                          className="max-w-full max-h-full object-contain rounded-4xl border-4 border-[#246988]"
                        />
                      
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Side - Content */}
            <AnimatedTransition
              show={showTitle}
              animation="slide-up"
              duration={600}
              className="order-2 lg:order-2 text-center lg:text-left"
            >
              <div className="relative">
                <span className="inline-block text-black font-bold text-lg tracking-wide mb-4">
                  Welcome to MockSurvey365™
                </span>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6 leading-none" style={{ fontFamily: 'Open Sans', fontWeight: 700 }}>
                  Survey Ready. <br/>
                  Everyday.
                </h1>

                <div className="mb-6 space-y-2">
                  <p className="text-lg md:text-xl font-bold text-black leading-snug max-w-2xl mx-auto lg:mx-0" style={{ fontFamily: 'Open Sans' }}>
                    A CMS-style Mock Survey Platform for Skilled Nursing & Senior Care
                  </p>
                  <p className="text-lg md:text-xl font-bold text-black leading-snug max-w-2xl mx-auto lg:mx-0" style={{ fontFamily: 'Open Sans' }}>
                    Conduct Internal Mock Surveys Using a CMS Surveyor Approach
                  </p>
                </div>

                <p className="text-base md:text-lg text-black mb-10 leading-normal max-w-2xl mx-auto lg:mx-0" style={{ fontFamily: 'Open Sans' }}>
                  MockSurvey365™ helps facilities identify compliance risk, close gaps, and strengthen survey readiness through structured workflows, AI-driven insight, and expert clinical review built using CMS Critical Element Pathway methodology.
                </p>

                <div className="flex sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <button
                    onClick={() => window.open('https://inspac.pipedrive.com/scheduler/exaMODU5/mocksurvey365-demo', '_blank')}
                    className="bg-[#246988] hover:bg-[#1e556d] text-white px-8 py-4 text-lg font-bold rounded-full transition-all hover:-translate-y-1 cursor-pointer w-fit mx-auto lg:mx-0"
                  >
                    Book a Demo
                  </button>
                </div>

                <p className="text-sm md:text-base font-bold text-black uppercase tracking-wide pb-10 md:pb-0" style={{ fontFamily: 'Open Sans' }}>
                  MOCK SURVEY. PLAN OF CORRECTION. INSPAC.
                </p>
              </div>
            </AnimatedTransition>

          </div>
        </div>
      </div>
    </>
  );
};
