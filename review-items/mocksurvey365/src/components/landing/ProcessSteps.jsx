import { CheckCircle, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    title: "Register",
    description: "Create your account"
  },
  {
    title: "Start Mock Survey",
    description: "Begin CMS-style survey simulation"
  },
  {
    title: "Improve Compliance",
    description: "Get actionable insights"
  }
];

export const ProcessSteps = ({ className }) => {
  return (
    <div className={cn("bg-sky-100/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-sky-200/50", className)}>
      <p className="text-sm md:text-base font-medium text-sky-800 mb-6 text-center">
        From registration to compliance improvement in 3 easy steps:
      </p>
      
      <div className="flex flex-col gap-4">
        {STEPS.map((step, index) => (
          <div key={index} className="flex flex-col items-center gap-3">
            <button 
              className="w-full max-w-xs bg-white hover:bg-sky-50 border-2 border-sky-300 hover:border-sky-400 rounded-xl px-6 py-4 transition-all duration-200 shadow-sm hover:shadow-md text-sky-800 font-medium"
            >
              {step.title}
            </button>
            {index < STEPS.length - 1 && (
              <ArrowDown className="w-5 h-5 text-sky-600" />
            )}
          </div>
        ))}
        
        <div className="flex items-center justify-center gap-2 mt-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-sky-800">Nice!</span>
        </div>
      </div>
    </div>
  );
};

