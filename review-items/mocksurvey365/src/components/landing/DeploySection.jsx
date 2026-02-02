import { Activity, TrendingUp, Layout, Maximize } from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { cn } from '@/lib/utils';

const DEPLOY_FEATURES = [
  {
    icon: Activity,
    title: "Export Reports",
    description: "Generate CMS Form 2567-style reports with PDF and Word export options.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: TrendingUp,
    title: "Analytics",
    description: "Track multi-facility performance with benchmarking and compliance analytics.",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    icon: Layout,
    title: "AI Deficiency",
    description: "Leverage AI to generate deficiency statements and Plan of Correction suggestions.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Maximize,
    title: "Multi-Facility",
    description: "Manage surveys across multiple facilities with consultant dashboard tools.",
    gradient: "from-orange-500 to-amber-500"
  }
];

export const DeploySection = ({ show }) => {
  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50/50">
        <div className="flex flex-col items-center text-center gap-4 mb-16 md:mb-20">
          <h2 className="text-4xl font-bold text-sky-800 md:text-6xl lg:text-8xl tracking-tight">
            Reports
          </h2>
          <p className="text-foreground max-w-3xl text-lg md:text-xl lg:text-2xl mt-2 text-gray-600 leading-relaxed">
            Generate professional CMS reports and export regulatory documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {DEPLOY_FEATURES.map((feature, index) => {
            const IconComponent = feature.icon;
            
            return (
              <div
                key={index}
                className={cn(
                  "group relative flex flex-col items-center text-center p-8 rounded-2xl",
                  "transition-all duration-300 ease-out",
                  "bg-white border border-gray-100",
                  "hover:border-transparent hover:shadow-xl",
                  "hover:-translate-y-2"
                )}
              >
                {/* Gradient background on hover */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
                    `bg-gradient-to-br ${feature.gradient}`,
                    "group-hover:opacity-5"
                  )}
                />
                
                {/* Icon container with gradient */}
                <div 
                  className={cn(
                    "relative w-20 h-20 rounded-2xl mb-6",
                    "flex items-center justify-center",
                    "transition-all duration-300",
                    `bg-gradient-to-br ${feature.gradient}`,
                    "group-hover:scale-110 group-hover:shadow-lg",
                    "shadow-md"
                  )}
                >
                  <IconComponent 
                    size={36} 
                    className="text-white transition-transform duration-300 group-hover:scale-110" 
                  />
                  
                  {/* Shine effect */}
                  <div 
                    className={cn(
                      "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
                      "bg-gradient-to-br from-white/20 to-transparent",
                      "group-hover:opacity-100"
                    )}
                  />
                </div>

                {/* Content */}
                <div className="relative z-10 w-full">
                  <h3 className="font-bold mb-3 text-gray-900 text-lg md:text-xl group-hover:text-sky-800 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative corner accent */}
                <div 
                  className={cn(
                    "absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-0 transition-opacity duration-300",
                    `bg-gradient-to-br ${feature.gradient}`,
                    "group-hover:opacity-10"
                  )}
                />
              </div>
            );
          })}
        </div>
      </section>
    </AnimatedTransition>
  );
};