const RiskBased = require("../models/surveys/risk-based-setup-model");
const auditLogger = require("../helpers/logger");

class SurveyBuilderService {
  static parseDate(dateStr) {
    if (!dateStr) return new Date();

    // Check if it's USA date format (MM/DD/YYYY)
    if (
      typeof dateStr === "string" &&
      /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)
    ) {
      const [month, day, year] = dateStr.split("/");
      return new Date(year, month - 1, day);
    }

    // Otherwise parse as ISO or other format
    return new Date(dateStr);
  }

 

  // risk based resident socket
  static async riskbasedResident(currentStep, stepData, completedAt) {
    try {
      if (!completedAt || !currentStep || !stepData) {
        return {
          status: false,
          statusCode: 400,
          message:
            "All parameters (completedAt, currentStep, stepData) are required.",
        };
      }

      // Find the survey wizard
      const surveyWizard = await RiskBased.findById(stepData?.surveyId);
      if (!surveyWizard) {
        return {
          status: false,
          statusCode: 400,
          message: "Survey wizard not found.",
        };
      }

      surveyWizard.facilityInitiatedSurvey = {
        residents: stepData?.residents,
        surveyMode: stepData?.surveyMode,
        riskManagementProcess: stepData?.riskManagementProcess ?? {},
        submittedAt: stepData?.submittedAt
          ? new Date(stepData?.submittedAt)
          : new Date(),
        completedAt: completedAt ? new Date(completedAt) : new Date(),
      };

      // Update overall status to next stage if needed
      surveyWizard.status = currentStep;

      await surveyWizard.save();

      // console.log("investigations saved successfully", surveyWizard);

      auditLogger(
        "facility initiated saved",
        `facility initiated saved successfully`,
        "UserActivity",
        surveyWizard.userId
      );

      return {
        status: true,
        statusCode: 200,
        message: "facility initiated saved successfully",
        data: surveyWizard,
      };
    } catch (error) {
      const errorMsg = error.response?.data || error.message;

      auditLogger(
        "facility initiated error",
        `Error during facility initiated: ${errorMsg}`,
        "UserActivity",
        ""
      );
      return {
        status: false,
        statusCode: 500,
        message: "An error occurred while processing facility initiated",
        data: {},
      };
    }
  }

  // non resident based
  static async nonresidentRiskbased(currentStep, stepData, completedAt) {
    try {
      if (!completedAt || !currentStep || !stepData) {
        return {
          status: false,
          statusCode: 400,
          message:
            "All parameters (completedAt, currentStep, stepData) are required.",
        };
      }

      // Find the survey wizard
      const surveyWizard = await RiskBased.findById(stepData?.surveyId);
      if (!surveyWizard) {
        return {
          status: false,
          statusCode: 400,
          message: "Survey wizard not found.",
        };
      }

      surveyWizard.facilityInitiatedSurvey = {
        admissions: stepData?.admissions,
        surveyMode: stepData?.surveyMode,
        behaviors: stepData?.behaviors,
        falls: stepData?.falls,
        riskManagementProcess: stepData?.riskManagementProcess ?? {},
        changeInCondition: stepData?.changeInCondition,
        grievances: stepData?.grievances,
        hospitalReadmissions: stepData?.hospitalReadmissions,
        incidents: stepData?.incidents,
        infections: stepData?.infections,
        pain: stepData?.pain,
        pressureUlcers: stepData?.pressureUlcers,
        ivTherapy: stepData?.ivTherapy,
        weightLoss: stepData?.weightLoss,
        ivTherapy: stepData?.ivTherapy,
        psychotropicMedications: stepData?.psychotropicMedications,
        activities: stepData?.activities,
        staffEducation: stepData?.staffEducation,
        annualEducation: stepData?.annualEducation,
        submittedAt: stepData?.submittedAt
          ? new Date(stepData?.submittedAt)
          : new Date(),
        completedAt: completedAt ? new Date(completedAt) : new Date(),
      };

      // Update overall status to next stage if needed
      surveyWizard.status = currentStep;

      await surveyWizard.save();

      // console.log("investigations saved successfully", surveyWizard);

      auditLogger(
        "facility initiated saved",
        `facility initiated saved successfully`,
        "UserActivity",
        surveyWizard.userId
      );

      return {
        status: true,
        statusCode: 200,
        message: "facility initiated saved successfully",
        data: surveyWizard,
      };
    } catch (error) {
      const errorMsg = error.response?.data || error.message;

      auditLogger(
        "facility initiated error",
        `Error during facility initiated: ${errorMsg}`,
        "UserActivity",
        ""
      );
      return {
        status: false,
        statusCode: 500,
        message: "An error occurred while processing facility initiated",
        data: {},
      };
    }
  }

  // view risk based
   static async viewRiskBasedSetup(surveyId, userId) {
    try {
      const surveyWizardId = surveyId;
      if (!surveyWizardId) {
        return {
          status: false,
          statusCode: 400,
          message: "Risk Based ID is required.",
        };
      }

      const surveyWizard = await RiskBased.findById(surveyWizardId);
      if (!surveyWizard) {
        return {
          status: true,
          statusCode: 200,
          message: "Risk Based data not found",
          data: {},
        };
      }

      auditLogger(
        "view risk based setup",
        "risk based setup data view",
        "UserActivity",
        userId
      );

      return {
        status: true,
        statusCode: 200,
        message: "Risk Based data fetched successfully",
        data: surveyWizard,
      };
    } catch (error) {
      auditLogger(
        "view risk based setup Error",
        `view risk based setup encounted an error: ${error.message}`,
        "UserActivity",
        userId
      );
      return {
        status: false,
        statusCode: 500,
        message: "An error occurred while fetching risk based setup data",
        data: {},
      };
    }
  }
}

module.exports = SurveyBuilderService;
