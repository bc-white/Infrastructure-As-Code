import { AnimatedTransition } from '@/components/AnimatedTransition';

const COMPANIES = [
  {
    name: "Company 1",
    logo: "/logo.png" // You can replace these with actual company logos
  },
  {
    name: "Company 2",
    logo: "/logo.png"
  },
  {
    name: "Company 3",
    logo: "/logo.png"
  },
  {
    name: "Company 4",
    logo: "/logo.png"
  },
  {
    name: "Company 5",
    logo: "/logo.png"
  },
  {
    name: "Company 6",
    logo: "/logo.png"
  }
];

export const CompaniesSection = ({ show }) => {
  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <section className="py-16 md:py-24 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col items-center text-center gap-4 mb-12">
            <div className="bg-gray-900 text-white px-4 py-1 rounded-lg text-sm font-medium mb-4">
              Trusted By
            </div>
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl tracking-tight">
              Companies Using Our System
            </h2>
            <p className="text-foreground max-w-3xl text-base md:text-lg mt-2 text-gray-600 leading-relaxed">
              Leading healthcare facilities and compliance teams trust MockSurvey365 for their regulatory readiness needs.
            </p>
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
            {COMPANIES.map((company, index) => (
              <div
                key={index}
                className="flex items-center justify-center p-6 bg-white rounded-lg"
              >
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-12 w-auto opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </AnimatedTransition>
  );
};

