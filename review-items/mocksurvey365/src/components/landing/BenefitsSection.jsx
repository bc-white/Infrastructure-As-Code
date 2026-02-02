import { AnimatedTransition } from '@/components/AnimatedTransition';
import { CheckCircle } from 'lucide-react';

const BENEFITS = [
  "Supports care systems that promote improved resident outcomes",
  "Reinforces practices that influence Five-Star Quality Rating performance",
  "Helps reduce exposure to civil monetary penalties through early identification of compliance risk",
  "Strengthens organizational credibility and regulatory reputation",
  "Builds staff confidence by familiarizing teams with the survey process before the actual survey"
];

export const BenefitsSection = ({ show }) => {
  return (
        <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <section className="min-h-[800px] flex items-center bg-slate-50 relative overflow-hidden py-16 md:py-24">
        {/* Subtle Gray Pattern Overlay */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px'
        }}></div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Side - Content */}
            <div className="order-2 lg:order-1">
              <span className="text-sky-600 font-bold tracking-wider uppercase text-sm mb-4 block">
                Why Choose Us
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Why Nursing Home Leaders Use MockSurvey365™️
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                MockSurvey365™️ combines AI-assisted technology with human clinical and regulatory expertise to help leadership teams identify risk, address gaps, and strengthen compliance before surveyors arrive.
              </p>
              
              <div className="space-y-6">
                {BENEFITS.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                    <p className="text-gray-700 text-lg leading-relaxed flex-1 group-hover:text-gray-900 transition-colors">
                      {benefit}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Image */}
            <div className="relative order-1 lg:order-2">
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/4269205/pexels-photo-4269205.jpeg"
                  alt="Healthcare professional reviewing compliance documentation"
                  className="w-full aspect-[4/5] object-cover hover:scale-105 transition-transform duration-700"
                />
                
                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>
              </div>
              
              {/* Background Decorative Pattern */}
              <div className="absolute -bottom-10 -right-10 w-full h-full bg-[#FFC567]/20 rounded-[2.5rem] -z-10"></div>
            </div>
          </div>
        </div>
      </section>
    </AnimatedTransition>
  );
};

