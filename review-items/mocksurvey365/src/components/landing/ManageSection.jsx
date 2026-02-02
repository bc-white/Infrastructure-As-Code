import { useState } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { FeatureIcon } from './FeatureIllustrations/FeatureIcon';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    title: "Survey Builder",
    description: "Wizard-style flow for facility information, findings entry, and deficiency drafting with AI suggestions."
  },
  {
    title: "CMS Reports Style",
    description: "Auto-generated CMS Form 2567-style reports with editable inline content and export options."
  },
  {
    title: "AI Deficiency",
    description: "AI-driven deficiency statement generation with optional Plan of Correction (PoC) suggestions."
  },
  {
    title: "Multi-Facility",
    description: "Cross-facility dashboard for consultants with save/resume surveys and audit trail logging."
  },
  {
    title: "F-Tag Search",
    description: "AI-assisted searchable database with real-time CMS tag updates and regulatory guidance."
  },
  {
    title: "Resource Center",
    description: "Tools including Resident Interview Guide, Med Pass Observation Tool, ICAR, and more."
  },
  {
    title: "Export Options",
    description: "Export reports as PDF or Word documents with proper fonts (Courier, Arial) and watermarks."
  },
  {
    title: "Compliance",
    description: "Track regulatory readiness with benchmarking and deficiency frequency analysis."
  },
  {
    title: "Mobile Ready",
    description: "Responsive design for mobile/tablet/desktop with auto-save functionality."
  },
  {
    title: "HIPAA Aligned",
    description: "Secure, encrypted hosting with HIPAA-aligned data protection and privacy controls."
  },
  {
    title: "Analytics",
    description: "Multi-facility performance analytics and tag frequency benchmarking for consultants."
  }
];

export const ManageSection = ({ show }) => {
  const [activeFeature, setActiveFeature] = useState(null);

  const handleFeatureClick = (index) => {
    setActiveFeature(index === activeFeature ? null : index);
  };

  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <section className="py-16 md:py-24 lg:py-32">
        <div className="flex flex-col items-center text-center gap-4 mb-16 md:mb-20">
          <h2 className="text-4xl font-bold text-sky-800 md:text-6xl lg:text-8xl tracking-tight">
            Compliance
          </h2>
          <p className="text-foreground max-w-3xl text-lg md:text-xl lg:text-2xl mt-2 text-gray-600 leading-relaxed">
            The complete CMS survey simulation and regulatory reporting platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {FEATURES.map((feature, index) => {
            const isActive = activeFeature === index;
            
            return (
              <div
                key={index}
                onClick={() => handleFeatureClick(index)}
                className={cn(
                  "group relative flex flex-col items-center text-center p-6 rounded-2xl",
                  "transition-all duration-300 ease-out cursor-pointer",
                  "bg-white border border-gray-100 hover:border-sky-200",
                  "hover:shadow-lg hover:shadow-sky-100/50",
                  "hover:-translate-y-1",
                  isActive && "border-sky-300 shadow-xl shadow-sky-100/50 scale-[1.02]"
                )}
              >
                {/* Background gradient on hover */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
                    "bg-gradient-to-br from-sky-50/50 to-transparent",
                    "group-hover:opacity-100",
                    isActive && "opacity-100"
                  )}
                />
                
                {/* Icon container */}
                <div 
                  className={cn(
                    "relative w-16 h-16 md:w-20 md:h-20 rounded-2xl",
                    "flex items-center justify-center mb-4",
                    "transition-all duration-300",
                    "bg-gradient-to-br from-sky-50 to-sky-100/50",
                    "group-hover:from-sky-100 group-hover:to-sky-200/50",
                    "group-hover:scale-110",
                    isActive && "from-sky-100 to-sky-200 ring-2 ring-sky-300/50 ring-offset-2"
                  )}
                >
                  <FeatureIcon index={index} size={42} className="transition-transform duration-300 group-hover:scale-110" />
                </div>

                {/* Content */}
                <div className="relative z-10 w-full">
                  <h3 className="font-bold mb-2 text-sky-700 text-base md:text-lg group-hover:text-sky-800 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {feature.description}
                  </p>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </AnimatedTransition>
  );
};