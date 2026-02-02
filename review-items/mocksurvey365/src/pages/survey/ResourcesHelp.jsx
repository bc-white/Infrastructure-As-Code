import React from "react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  ChevronLeft,
  Download,
  FileText,
  ChevronRight,
  ExternalLink,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";
import useSurveyAccess from "../../hooks/useSurveyAccess";

const ResourcesHelp = ({
  sectionData,
  surveyData,
  setCurrentStep,
  canContinueFromStep,
  handleSurveyDataChange,
  isInvitedUser: isInvitedUserProp = () => false, 
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Get current survey ID for access check
  const currentSurveyId = surveyData?.surveyId || surveyData?.id || surveyData?._id || localStorage.getItem("currentSurveyId");
  
  // Use the survey access hook to determine user access type
  const { isInvitedUser: isInvitedUserFromHook, isLoading: isAccessLoading } = useSurveyAccess(currentSurveyId);
  
  // Use hook-based isInvitedUser, fall back to prop if hook is still loading
  const isInvitedUser = isAccessLoading ? isInvitedUserProp : isInvitedUserFromHook;


  // Handle resource download
  const handleResourceDownload = async (resourceId, resourceName) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading("Downloading Resource", {
        description: `Preparing ${resourceName} for download...`,
        duration: 0, // Keep loading until dismissed
      });

      // Call API to download resource
      await api.resource.viewResource(resourceId);
      
      // Track resource access
      const accessedResources = surveyData.resourcesAccessed || [];
      const resourceAccess = {
        resourceId,
        resourceName,
        accessedAt: new Date().toISOString(),
      };
      
      // Update survey data with accessed resource
      if (!accessedResources.find(r => r.resourceId === resourceId)) {
        handleSurveyDataChange("resourcesAccessed", [...accessedResources, resourceAccess]);
      }
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Download Complete", {
        description: `${resourceName} has been downloaded successfully`,
        duration: 3000,
      });
    } catch (error) {
   
      
      // Show error toast
      toast.error("Download Failed", {
        description: error.message || `Failed to download ${resourceName}. Please try again.`,
        duration: 5000,
        action: {
          label: "Retry",
          onClick: () => handleResourceDownload(resourceId, resourceName),
        },
      });
    }
  };

  return (
    <div className=" max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {sectionData[12].title}
        </h2>
        <p className="text-gray-500 text-sm leading-tight max-w-5xl">{sectionData[12].description}</p>
      </div>

      <div className="bg-white rounded-2xl pt-4">
        <div className="space-y-8">
          {/* Resources & Help Section */} 
          <div>
           

            {/* Downloadable Resources */}
            <div className="bg-gray-10 rounded-2xl p-6 border border-gray-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Download className="w-5 h-5 mr-2 text-[#075b7d]" />
                  Mock Survey Resources
                </h4>
                {surveyData.resourcesAccessed?.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {surveyData.resourcesAccessed.length} accessed
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleResourceDownload("68d45d716cfe20de0a4a2445", "Facility Entrance Conference Worksheet")}
                  className="inline-flex items-center justify-between h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
                >
                  <span className="flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Facility Entrance Conference Worksheet
                  </span>
                  {surveyData.resourcesAccessed?.find(r => r.resourceId === "68d45d716cfe20de0a4a2445") && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                      Downloaded
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => handleResourceDownload("68d461796cfe20de0a4a249c", "CMS-672 Resident Census Form")}
                  className="inline-flex items-center justify-between h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
                >
                  <span className="flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    CMS-671 Resident Census Form
                  </span>
                  {surveyData.resourcesAccessed?.find(r => r.resourceId === "68d461796cfe20de0a4a249c") && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                      Downloaded
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => handleResourceDownload("68d462756cfe20de0a4a24bb", "CMS-802 Roster/Sample Matrix Form")}
                  className="inline-flex items-center justify-between h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
                >
                  <span className="flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    CMS-802 Roster/Sample Matrix Form
                  </span>
                  {surveyData.resourcesAccessed?.find(r => r.resourceId === "68d462756cfe20de0a4a24bb") && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                      Downloaded
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => handleResourceDownload("68d4686399860dc0a48a564c", "Team Assignment Worksheet")}
                  className="inline-flex items-center justify-between h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
                >
                  <span className="flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Team Assignment Worksheet
                  </span>
                  {surveyData.resourcesAccessed?.find(r => r.resourceId === "68d4686399860dc0a48a564c") && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                      Downloaded
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => handleResourceDownload("68d464546cfe20de0a4a24f9", "State Operations Manual-Appendix PP")}
                  className="inline-flex items-center justify-between h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
                >
                  <span className="flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    State Operations Manual-Appendix PP
                  </span>
                  {surveyData.resourcesAccessed?.find(r => r.resourceId === "68d464546cfe20de0a4a24f9") && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                      Downloaded
                    </Badge>
                  )}
                </button>
                <a
                  href="/resource-center"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
                >
                  <span className="flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Long Term Care Regulations-State by State
                  </span>
                </a>
                <button
                  onClick={() => handleResourceDownload("68d463b66cfe20de0a4a24da", "Critical Elements Pathways-PDFs")}
                  className="inline-flex items-center justify-between h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
                >
                  <span className="flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Critical Elements Pathways-PDFs
                  </span>
                  {surveyData.resourcesAccessed?.find(r => r.resourceId === "68d463b66cfe20de0a4a24da") && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                      Downloaded
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            {/* External CMS & Regulatory Resources */}
            <div className="bg-gray-10 rounded-2xl p-6 border border-gray-200 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ExternalLink className="w-5 h-5 mr-2 text-[#075b7d]" />
                External CMS & Regulatory Resources
              </h4>

              <div className="grid grid-cols-1 gap-3">
                <a
                  href="https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-483"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-start h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Code of Federal Regulations
                </a>
                
                <a
                  href="https://www.medicare.gov/care-compare/?providerType=NursingHome"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-start h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Nursing Home Compare Page
                </a>
                
                <a
                  href="https://www.cms.gov/medicare/health-safety-standards/certification-compliance/nursing-homes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-start h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Nursing Home Certification and Compliance
                </a>
                
                <a
                  href="https://www.cms.gov/medicare/health-safety-standards/certification-compliance/life-safety-code-health-care-facilities-code-requirements"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-start h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Life Safety Codes
                </a>
                
                <a
                  href="https://www.cms.gov/medicare/health-safety-standards/certification-compliance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-start h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Quality and Oversight Enforcement
                </a>
                
                <a
                  href="https://www.cms.gov/medicare/health-safety-standards/quality-safety-oversight-general-information/policy-memos/policy-memos-states-regions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-start h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CMS Memos and Policy Changes
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4">
         

            {/* Floating Navigation Buttons */}
            <div className="fixed bottom-6 right-6 z-40 flex gap-4">
              <Button
                onClick={() => setCurrentStep(12)}
                variant="outline"
                className="shadow-lg bg-white hover:bg-gray-50 text-gray-700 border-gray-200 rounded-full px-6"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {!isInvitedUser() && (
                <Button
                  onClick={() => window.location.href = "/surveys"}
                  disabled={isSubmitting}
                  className="shadow-lg bg-[#075b7d] hover:bg-[#064d63] text-white rounded-full px-6"
                >
                   Return to Dashboard
                      <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesHelp;