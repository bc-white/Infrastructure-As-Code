import { AnimatedTransition } from '@/components/AnimatedTransition';

const FEATURES = [
  {
    title: "CMS-Style Mock Surveys",
    description: "Conduct mock surveys aligned using CMS surveyor methodology, reflecting real survey flow, evaluation logic, and compliance expectations"
  },
  {
    title: "Offsite Survey Preparation",
    description: "Review key facility data and documentation in advance to identify gaps and readiness concerns before on-site survey activity begins"
  },
  {
    title: "Resident Sample Selection",
    description: "AI-assisted resident sampling that reflects CMS's initial and expanded sample selection practices, supporting consistency across facilities"
  },
  {
    title: "Critical Element Pathway",
    description: "Structured investigations using CMS Critical Element Pathways to evaluate care delivery, systems, and operational processes"
  }, 
  {
    title: "Deficiency Statements",
    description: "Develop clear, survey-ready deficiency statements aligned with CMS standards to support accurate findings and effective follow-up"
  },
  {
    title: "CMS-Style Plan of Correction Writer",
    description: "Generate a Plan of Correction aligned with CMS expectations, supporting clarity, accountability, and regulatory acceptance"
  }
];

export const ComplianceSection = ({ show }) => {
  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <section className="min-h-screen flex items-center bg-white py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Section Header */}
          <div className="mb-10 lg:mb-14">
            <div className="max-w-3xl mx-auto text-center">
              <span className="text-black font-bold tracking-wider uppercase text-lg md:text-xl lg:text-2xl block">
                FEATURES & CAPABILITIES
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight mb-6">
                What MockSurvey365™ Delivers
              </h2>
              <p className="text-base md:text-lg text-black leading-relaxed">
                <span className='font-bold'>MockSurvey365™</span> provides a structured, CMS-aligned mock survey experience that reflects how surveys are actually conducted—helping teams identify risk, validate compliance, and prepare with confidence.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <div
                key={index}
                className="bg-[#fecc1b] rounded-lg p-6"
              >
                <h3 className="text-lg font-bold text-black mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-black leading-normal">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AnimatedTransition>
  );
};

