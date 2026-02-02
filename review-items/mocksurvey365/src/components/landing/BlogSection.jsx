import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import faqImage from '@/assets/FAQ page.jpg';

const FAQS = [
  {
    id: 'faq-1',
    question: "What makes MockSurvey365 different from other mock survey tools?",
    answer: "MockSurvey365™ is built to reflect how CMS surveyors actually conduct investigation not just checklist compliance. The platform combines CMS-aligned workflows, AI-assisted analysis, and human clinical and regulatory expertise to simulate the full survey process, helping teams identify risks that traditional audits often overlook."
  },
  {
    id: 'faq-2',
    question: "How does the AI-assisted resident sample selection work?",
    answer: "MockSurvey365™ uses AI-assisted logic to support resident sampling that reflects CMS initial and expanded sample selection practices. This helps facilities apply a consistent, defensible approach while allowing leadership and consultants to review and adjust selections as needed."
  },
  {
    id: 'faq-3',
    question: "Can the mock survey be customized for my facility's needs?",
    answer: "Yes. MockSurvey365™ allows flexibility within a CMS-aligned framework. Facilities can tailor pathways, focus areas, and survey scope while maintaining alignment with how CMS evaluates compliance."
  },
  {
    id: 'faq-4',
    question: "Is MockSurvey365 suitable for multi-facility organizations?",
    answer: "Absolutely. The platform supports standardized mock survey execution across multiple locations, providing leadership with consistent visibility into compliance risk, readiness trends, and performance across facilities."
  },
  {
    id: 'faq-5',
    question: "How quickly can we get started with MockSurvey365?",
    answer: "Most organizations can begin using MockSurvey365™ quickly. After onboarding, teams can initiate mock surveys, assign roles, and start reviewing readiness data without lengthy setup or disruption to operations."
  }
];

export const BlogSection = ({ show }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleItem = (id) => {
    setExpandedItems(prev => {
      const newSet = new Set();
      if (!prev.has(id)) {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <section className="min-h-screen flex items-center bg-[#fecc1b] py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-12 lg:gap-20 items-start">
            
            {/* Left Column - Image Only */}
            <div>
              {/* Fixed Size Image Container */}
              <div className="relative w-full max-w-[500px] h-[400px] lg:h-[600px] mx-auto lg:mx-0">
                <div className="absolute inset-0 p-2 flex items-center justify-center">
                  <img 
                    src={faqImage}  
                    alt="MockSurvey365 FAQ" 
                    className="max-w-full max-h-full object-contain rounded-4xl border-4 border-[#246988]"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - FAQ Accordion */}
            <div className="pr-4 lg:pr-8">
              {/* Header Section - Above Accordion */}
              <div className="mb-8 lg:mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-black leading-tight mb-4 text-center lg:text-left pt-8 md:mt-0">
                  FAQs
                </h2>
                <p className="text-base md:text-lg text-black leading-relaxed max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
                  Everything you need to know about how <span className="font-bold">MockSurvey365™</span> supports realistic mock surveys and ongoing survey readiness.
                </p>
              </div>

              <div className="space-y-4">
                {FAQS.map((faq) => {
                  const isExpanded = expandedItems.has(faq.id);
                  
                  return (
                    <div
                      key={faq.id}
                      className="bg-white border border-black rounded-lg overflow-hidden"
                    >
                      {/* Question Header */}
                      <button
                        onClick={() => toggleItem(faq.id)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors gap-4 cursor-pointer"
                      >
                        <h3 className="text-lg md:text-xl font-bold text-black flex-1">
                          {faq.question}
                        </h3>
                        <ChevronDown
                          className={`h-5 w-5 text-black flex-shrink-0 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Answer Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-4 pt-0">
                              <p className="text-base text-black leading-normal">
                                {faq.answer}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </section>
    </AnimatedTransition>
  );
};

