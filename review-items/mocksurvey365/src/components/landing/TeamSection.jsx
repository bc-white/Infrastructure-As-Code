import { AnimatedTransition } from '@/components/AnimatedTransition';
import { FeatureIcon } from './FeatureIllustrations/FeatureIcon';

const FEATURES = [
  {
    title: "Survey Builder.",
    description: "Wizard-style flow for facility information, findings entry, and deficiency drafting with AI suggestions."
  },
  {
    title: "CMS Reports Style.",
    description: "Auto-generated CMS Form 2567-style reports with editable inline content and export options."
  },
  {
    title: "AI Deficiency.",
    description: "AI-driven deficiency statement generation with optional Plan of Correction (PoC) suggestions."
  },
  {
    title: "Multi-Facility.",
    description: "Cross-facility dashboard for consultants with save/resume surveys and audit trail logging."
  },
  {
    title: "F-Tag Search.",
    description: "AI-assisted searchable database with real-time CMS tag updates and regulatory guidance."
  },
  {
    title: "Resource Center.",
    description: "Tools including Resident Interview Guide, Med Pass Observation Tool, ICAR, and more."
  }
];

export const TeamSection = ({ show }) => {
  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <section className="py-16 md:py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col items-center text-center gap-4 mb-12">
            <div className="bg-gray-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium mb-4">
              Compliance
            </div>
            <h2 className="text-3xl font-bold text-sky-900 md:text-4xl lg:text-5xl tracking-tight">
              What We Offer
            </h2>
            <p className="text-foreground max-w-3xl text-base md:text-lg mt-2 text-gray-600 leading-relaxed">
              The complete CMS survey simulation and regulatory reporting platform with comprehensive tools for compliance readiness.
            </p>
          </div>

          {/* Features Grid - 2x3 Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col bg-white rounded-lg p-6 border border-gray-100"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-sky-100 border-2 border-sky-300 flex items-center justify-center mb-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <FeatureIcon index={index} size={32} />
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 text-lg mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed text-sm flex-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AnimatedTransition>
  );
};

