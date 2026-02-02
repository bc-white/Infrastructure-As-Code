import { AnimatedTransition } from '@/components/AnimatedTransition';
import { Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TESTIMONIALS = [
  {
    name: 'Sarah Mitchell',
    role: 'Nursing Home Administrator',
    company: 'Healthcare Plus',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    content: "MockSurvey365 has transformed our survey preparation process. We now complete preparations in days instead of weeks. The AI-powered deficiency suggestions help us identify and address issues months before surveys."
  },
  {
    name: 'Dr. Michael Rodriguez',
    role: 'Clinical Compliance Manager',
    company: 'MedCare Systems',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    content: "The multi-facility dashboard gives us complete visibility across all locations. Real-time reporting and automated reminders have revolutionized our operations, and our survey outcomes have improved dramatically."
  }, 
  {
    name: 'Jennifer Chen',
    role: 'Healthcare Consultant',
    company: 'Compliance Experts',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
    content: "MockSurvey365 handles dynamic workflows and automated report generation out of the box. Every client I've recommended this platform to has seen immediate improvements in their survey readiness and compliance scores."
  },
  {
    name: 'Marcus Williams',
    role: 'Facility Director',
    company: 'Senior Living Group',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
    content: "The platform's intuitive design and comprehensive features make survey preparation a breeze. Our team can now focus on quality care instead of worrying about compliance documentation."
  }
];

export const TestimonialsSection = ({ show }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!show) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(timer);
  }, [show]);

  const current = TESTIMONIALS[currentIndex];

  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <section id="testimonials" className="min-h-screen flex items-center bg-white py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-black uppercase mb-4">
              WHAT OUR CUSTOMERS HAVE TO SAY
            </h2>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black">
              MockSurvey365™
            </h3>
          </div>

          {/* Testimonial Box */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#f5f5dc] rounded-2xl p-8 md:p-12">
              {/* Testimonials Label */}
              <span className="text-[#246988] font-bold tracking-wider uppercase text-sm mb-4 block">
                TESTIMONIALS
              </span>
              
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-[#FFC567] text-[#FFC567]" />
                ))}
              </div>

              {/* Quote with Fade Animation */}
              <div className="min-h-[120px] mb-8">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-lg md:text-xl text-[#246988] leading-relaxed"
                  >
                    "{current.content}"
                  </motion.p>
                </AnimatePresence>
              </div>
              
              {/* Author Info with Fade Animation */}
              <div className="min-h-[80px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="text-xl font-bold text-black mb-1">{current.name}</p>
                    <p className="text-[#246988] text-base">{current.role}</p>
                    <p className="text-[#246988] text-base">{current.company}</p>
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

export default TestimonialsSection;
