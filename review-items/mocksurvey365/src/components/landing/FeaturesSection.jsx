import { AnimatedTransition } from '@/components/AnimatedTransition';
import { motion } from 'framer-motion';

const TRUST_INDICATORS = [
  {
    title: "500+ Senior Care Facilities",
    description: "Rely on MockSurvey365™ to prepare for real CMS surveys"
  },
  {
    title: "Multi-Facility Operators",
    description: "Standardize mock survey execution and compliance oversight across locations using your internal teams"
  },
  {
    title: "Regulatory Consultants",
    description: "Enable the delivery of consistent, defensible mock surveys using CMS-aligned workflows"
  },
  {
    title: "Clinical Teams",
    description: "Identify documentation gaps and care risks before surveyors do"
  },
  {
    title: "Adm. & Leadership Teams",
    description: "Gain clear visibility into readiness, risk areas, and corrective priorities"
  },
  {
    title: "Senior Care Providers",
    description: "Strengthen operational discipline while staying survey-ready 365 days a year"
  }
];

export const FeaturesSection = ({ show }) => {
  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <section className="min-h-screen flex items-center bg-[#fecc1b] relative overflow-hidden py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-black leading-tight">
              Trusted by Healthcare Leaders Nationwide
            </h2>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight mb-2">
              MockSurvey365™
            </h3>
            <p className="text-lg text-black leading-relaxed">
              Leading skilled nursing and senior care organizations rely on <span className='font-bold'>MockSurvey365™</span> to conduct realistic, CMS-style mock surveys that strengthen compliance, reduce risk, and improve survey readiness.
            </p>
          </div>

          {/* Trust Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRUST_INDICATORS.map((item, index) => {
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-white rounded-lg border-2 border-black p-6"
                >
                  <h3 className="text-lg font-bold text-black mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-black leading-normal">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </AnimatedTransition>
  );
};
