import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import aboutImage from '@/assets/SurveyReady Page About.jpg';
import simulationImage from '@/assets/SurveyReady Page Simulation.jpg';
import aiImage from '@/assets/SurveyReady Page AI.jpg';

const TABS = [
  {
    id: 'mock-survey',
    label: 'MockSurvey365™',
    title: 'About MockSurvey365™',
    content: 'MockSurvey365™ is a mock survey platform designed for skilled nursing and senior care providers seeking a structured, realistic approach to regulatory preparedness.',
    features: [
      'MockSurvey365™ replicates CMS surveyor methodology',
      'Enables you and your team conduct simulated Critical Element Pathway Investigations',
      'Allows you to conduct internal mock surveys expertly and accurately without clipboards or lost paper'
    ],
    image: aboutImage
  },
  {
    id: 'simulation',
    label: 'CMS-Aligned',
    title: 'Mirrors the CMS Critical Pathway',
    content: 'MockSurvey365™ replicates CMS surveyor methodology and enables you and your team to conduct simulated Critical Element Pathway Investigations. Our platform allows you to conduct internal mock surveys expertly and accurately without clipboards or lost paper.',
    features: [
      'Your mock survey will be conducted in the same sequence surveyors use with our online platform',
      'Findings are captured using the same criteria surveyors apply when determining scope, severity, and compliance risk',
      'Our realistic survey simulation platform is designed for use on the floor, during care delivery, where real surveys happen'
    ],
    image: simulationImage
  },
  {
    id: 'ai-analysis',
    label: 'Data-Driven',
    title: 'Data-Driven Compliance Insights',
    content: 'MockSurvey365™ provides AI-assisted identification of compliance risks across survey and critical element pathway data, helping you anticipate areas of surveyor focus and potential citation risks.',
    features: [
      'Provides you with AI-assisted identification of compliance risks across survey and critical element pathway data',
      'MockSurvey365™ has predictive survey analytics that anticipate areas of surveyor focus and potential citation risks',
      'Provides data-supported recommendations leadership can implement with confidence, enabling assigned scheduling, contact tracking, and education slides'
    ],
    image: aiImage
  }
];

export const AboutSection = ({ show }) => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const currentTab = TABS.find(tab => tab.id === activeTab) || TABS[0];

  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600} >
      <section className="min-h-screen flex items-center bg-white py-16 md:py-24" id="about">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">

          {/* Two Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 lg:gap-0 items-center">

            {/* Left Panel - Header, Tabs, and Content */}
            <div className="order-2 lg:order-1 lg:px-8">
              {/* Section Header */}
              <div className="mb-8 ">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 text-center lg:text-left leading-tight pt-8 lg:pt-20 md:mt-0">
                  Survey Readiness
                </h2>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
                  <span className='font-bold'> MockSurvey365™ </span>can help you be survey ready 365 days a year. Our platform helps you document and conduct a full mock survey from start to finish using your own internal team.
                </p>
              </div>

              {/* Tabs Navigation */}
              <div className="mb-8 flex flex-nowrap gap-2 overflow-x-auto justify-center lg:justify-start pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 sm:px-6 py-2.5 rounded-[14px] font-semibold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                        ? 'bg-[#246988] text-white'
                        : 'bg-white border border-[#246988] text-[#246988] hover:bg-gray-50'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-snug text-center lg:text-left">
                    {currentTab.title}
                  </h3>



                  <ul className="space-y-3 mb-8 list-disc pl-5 max-w-2xl mx-auto lg:mx-0 justify-center lg:justify-start text-gray-700">
                    {currentTab.features.map((feature, index) => (
                      <li key={index} className="text-gray-700 font-medium leading-normal">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center lg:justify-start">
                <button
                  className="bg-[#246988] hover:bg-[#1e556d] text-white px-8 py-4 text-lg font-semibold rounded-full transition-all hover:-translate-y-1 cursor-pointer"
                  onClick={() => window.open('https://inspac.pipedrive.com/scheduler/exaMODU5/mocksurvey365-demo', '_blank')}
                >
                  Book a Demo
                </button>
              </div>
              <p className="text-sm md:text-base font-bold text-black uppercase tracking-wide mt-10 text-center lg:text-left" style={{ fontFamily: 'Open Sans' }}>
                MOCK SURVEY. PLAN OF CORRECTION. INSPAC.
              </p>
            </div>

            {/* Right Panel - Images */}
            <div className="relative order-1 lg:order-2 mt-12 lg:mt-0 flex justify-center perspective-1000 min-h-[400px] lg:min-h-[600px]">
              <div className="relative w-full max-w-[500px] h-[400px] lg:h-[600px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTab.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <img
                      src={currentTab.image}
                      alt={currentTab.title}
                      className="max-w-full max-h-full object-contain rounded-4xl border-4 border-[#246988]"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>

        </div>
      </section>
    </AnimatedTransition>
  );
};

