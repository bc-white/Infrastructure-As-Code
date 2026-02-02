import { AnimatedTransition } from '@/components/AnimatedTransition';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import lastImage from "@/assets/LastpageWebsiteMockSurvey365.jpg";

export const CallToAction = ({ show }) => {
  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <section className="min-h-screen flex items-center bg-gradient-to-br from-[#246988] to-[#1e556d] relative overflow-hidden ">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="rounded-[3rem] p-8 md:p-12 lg:p-20 overflow-hidden relative">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                
                {/* Content Side */}
                <div>
                   <span className="inline-block px-4 py-2 rounded-full bg-white/10 text-white text-sm font-semibold tracking-wide uppercase mb-6">
                      READY TO GET STARTED?
                   </span>
                   
                   <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                      Transform Your Survey Readiness Today
                   </h2>
                   
                   <p className="text-lg text-white/90 mb-8 leading-relaxed max-w-xl">
                      Join hundreds of skilled nursing facilities using MockSurvey365™ to identify risks, streamline compliance, and empower their teams with AI-driven insights.
                   </p>

                   <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start">
                      <button 
                        className="group bg-[#fecc1b] hover:bg-[#e6b918] text-black px-8 py-4 rounded-full text-lg font-bold transition-all flex items-center justify-center gap-3 shadow-lg hover:-translate-y-1 cursor-pointer w-fit mx-auto lg:mx-0"
                        onClick={() => window.open('https://inspac.pipedrive.com/scheduler/exaMODU5/mocksurvey365-demo', '_blank')}
                      >
                        <span>Book a Demo</span>
                        <ArrowRight className="w-5 h-5 text-black" />
                      </button>
                   </div>
                   
                   <div className="flex flex-wrap items-center gap-6 text-sm text-white font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[#fecc1b]" />
                        <span>HIPAA Compliant</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <CheckCircle2 className="w-5 h-5 text-[#fecc1b]" />
                         <span>Healthcare Certified</span>
                      </div>
                   </div>
                </div>

                {/* Visual Side - Abstract Dashboard Representation */}
                <div className="relative order-first lg:order-last flex justify-center perspective-1000 min-h-[400px] lg:min-h-[600px]">
                  <div className="relative w-full max-w-[500px] h-[400px] lg:h-[600px] flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        className="max-w-full max-h-full object-contain rounded-4xl shadow-xl border-4 border-white"
                        src={lastImage} 
                        alt="Lastpage Website MockSurvey365" 
                      />
                    </div>
                  </div>
                </div>

             </div>
          </div>
        </div>
      </section>
    </AnimatedTransition>
  );
};