import React from "react";
import { Button } from "@/components/ui/button";

const InvestigationNavigation = ({
  setCurrentStep,
  saveInvestigationSurveyData,
  setIsContinueClicked,
  isLoading,
  isSurveyClosed,
  isInvitedUser,
  isPageClosed,
}) => {
  return (
    <div className="pt-6 border-t border-gray-200 mt-8">
      <div className="flex justify-between">
        <Button
          onClick={() => setCurrentStep(5)}
          variant="outline"
          className="h-12 px-6 text-gray-600 border-gray-300 hover:bg-gray-50 rounded-lg"
        >
          Final Sample Selection
        </Button>

        {!isInvitedUser() && (
          <Button
            onClick={() => {
              saveInvestigationSurveyData(true);
              setIsContinueClicked(true);
            }}
            disabled={isLoading || isSurveyClosed}
            className="h-12 px-6 bg-[#075b7d] hover:bg-[#075b7d] text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg"
          >
            {isLoading ? "Saving..." : "Continue to Facility Tasks"}
          </Button>
        )}
        {isInvitedUser() && (
          <Button
            onClick={() => {
              saveInvestigationSurveyData();
              setIsContinueClicked(false);
            }}
            disabled={
              isLoading || isSurveyClosed || isInvitedUser || isPageClosed
            }
            className="h-12 px-6 bg-[#075b7d] hover:bg-[#075b7d] text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg"
          >
            {isLoading ? "Saving..." : "Submit & Continue to Facility Tasks"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default InvestigationNavigation;
