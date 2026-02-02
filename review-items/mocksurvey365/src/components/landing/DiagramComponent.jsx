
import { useState } from 'react';
import { FileText, Search, CheckCircle, ArrowRight, ArrowLeft, Building2, ClipboardList, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const DiagramComponent = ({ onSectionClick, activeSection }) => {
  const surveySetupText = "Start with facility information, team assembly, and survey planning. Set up your survey environment with proper documentation and preparation.";
  const surveyExecutionText = "Conduct on-site surveys with real-time data entry, AI-assisted deficiency drafting, and comprehensive findings documentation.";
  const complianceReportingText = "Generate CMS Form 2567 reports, track regulatory compliance, and export findings with proper formatting and watermarks.";

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 relative h-[180px] md:h-[220px]">
      {/* Survey Setup Side */}
      <div 
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-1/3 transform transition-all duration-300 cursor-pointer",
          activeSection === 'setup' ? "scale-110" : "opacity-70 hover:opacity-100"
        )}
        onClick={() => onSectionClick('setup', surveySetupText)}
      >
        <div className="flex flex-wrap justify-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 md:w-6 md:w-6 text-primary" />
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center rotate-12">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center -rotate-12">
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Survey Execution in the Middle */}
      <div 
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform transition-all duration-300 cursor-pointer",
          activeSection === 'execution' ? "scale-110" : "opacity-70 hover:opacity-100"
        )}
        onClick={() => onSectionClick('execution', surveyExecutionText)}
      >
        <div className="relative w-24 h-24 md:w-32 md:h-32">
          <div className="absolute w-full h-full rounded-full bg-primary/5 animate-pulse-slow"></div>
          <div className="absolute w-4/5 h-4/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10"></div>
          <div className="absolute w-3/5 h-3/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20"></div>
          
          {/* Left arrow */}
          <ArrowRight className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-8 text-primary/50" />
          
          {/* Right arrow */}
          <ArrowLeft className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 text-primary/50" />
          
          <div className="absolute w-12 h-12 md:w-16 md:h-16 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 flex items-center justify-center shadow-lg">
            <Search className="w-7 h-7 md:w-9 md:h-9 text-primary" />
          </div>
        </div>
      </div>

      {/* Compliance Reporting Side */}
      <div 
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 w-1/3 transform transition-all duration-300 cursor-pointer",
          activeSection === 'reporting' ? "scale-110" : "opacity-70 hover:opacity-100"
        )}
        onClick={() => onSectionClick('reporting', complianceReportingText)}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 md:w-16 md:h-16 glass-panel rounded-lg flex items-center justify-center">
            <FileText className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 glass-panel rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 glass-panel rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagramComponent;
