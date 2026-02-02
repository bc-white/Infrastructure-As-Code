const User = require("../../models/user-model/user.model");
const Survey = require("../../models/surveyModels/survey.model");
const TeamMember = require("../../models/surveyModels/teamMembers.model");
const AssignedFacility = require("../../models/surveyModels/assignedFacility.model");
const PreSurveyRequirement = require("../../models/surveyModels/preSurveyRequirement.model");
const OffSiteCheckList = require("../../models/surveyModels/offsiteCheckList.model");
const SurveyLog = require("../../models/surveyModels/surveyLogs.model");
const FacilityEntrance = require("../../models/surveyModels/facilityEntrance.model");
const DocumentsToUpload = require("../../models/surveyModels/documentsToUpload.model");
const RequestEntranceItem = require("../../models/surveyModels/requestEntranceItems.model");
const ResidentEntrance = require("../../models/surveyModels/residentEntrance.model");
const InitialAssessmentEntrance = require("../../models/surveyModels/initialAssessmentEntrance.model");
const InitialPool = require("../../models/surveyModels/initialPool.model");
const FinalSample = require("../../models/surveyModels/finalSample.model");
const RiskFinalSampleSummaryCount = require("../../models/surveyModels/riskFinalSampleSummaryCount.model");
const InvestigationData = require("../../models/surveyModels/Investigation.model");
const FacilityMandatoryTask = require("../../models/surveyModels/mandatoryFacilityTask.model");
const TeamMeeting = require("../../models/surveyModels/teamMeeting.model");
const Closure = require("../../models/surveyModels/closure.model");
const ExistConference = require("../../models/surveyModels/existConference.model");
const CitationReport = require("../../models/surveyModels/citationReport.model");
const PlanOfCorrection = require("../../models/surveyModels/planofCorrection.model");
const Facility = require("../../models/configs/facility.model");
const CONSTANTS = require("../../constants/constants");
const { sendEmail } = require("../../helpers/sendEmail");
const requestEmailHtml = require("../../utils/html/requestEmail");
const appInviteHtml = require("../../utils/html/appInvite");
const {
  Types: { ObjectId },
} = require("mongoose");

const {
  addSurveyFirstPage,
  removeTeammemberValidation,
  updateSurveyFirstPage,
  removeAssignedFacilityFromATeamMemberValidation,
  addSurveySecondPage,
  addSurveyThirdPage,
  removeFacilityEntranceResidentValidation,
  addInitialPool,
  removeTeamMemberInitialPoolResidentValidation,
  addTeamMemberInitialPool,
  teamMemberInitialPoolResidentValidation,
  addFinalSample,
  addInvestigation,
  addTeamMemberInvestigations,
  addMandatoryFacilityTask,
  addTeamMemberMandatoryFacilityTask,
  addTeamMeeting,
  addClosure,
  addExistConference,
  addCitationReport,
  addUpdatePlanCorrection,
  addMemberTeamMeeting,
  viewResidentTeamMember,
} = require("../../validators/survey-validators/survey.validators");

const parseDate = (dateStr) => {
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
};

const dashboardMatrix = async (req, res) => {
  try {
    const { facilityName, startDate, endDate } = req.query;
    const userId = req.user._id;

    const teamMemberships = await TeamMember.find({
      teamMemberUserId: userId,
    })
      .select("surveyId teamCoordinator")
      .lean();

    const teamSurveyIds = (teamMemberships || [])
      .map((m) => m?.surveyId)
      .filter(Boolean);

    const surveyQuery = {
      $or: [{ createdBy: userId }, { _id: { $in: teamSurveyIds } }],
      ...(startDate &&
        endDate && {
          surveyCreationDate: {
            $gte: parseDate(startDate),
            $lte: parseDate(endDate),
          },
        }),
    };

    let surveys = await Survey.find(surveyQuery).lean();

    if (!surveys?.length) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "No surveys found for the selected filters",
        data: {},
      });
    }

    const allFacilityIds = surveys.map((s) => s?.facilityId).filter(Boolean);

    const facilityQuery = {
      _id: { $in: allFacilityIds },
      ...(facilityName &&
        facilityName.trim() !== "" && {
          Provider_Name: {
            $regex: facilityName.trim(),
            $options: "i",
          },
        }),
    };

    const facilities = await Facility.find(facilityQuery).lean();
    if (!facilities?.length) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: facilityName
          ? `No facilities found matching "${facilityName}"`
          : "No facilities found for the selected filters",
        data: {},
      });
    }

    const allowedFacilityIdsSet = new Set(
      facilities.map((f) => f?._id?.toString()).filter(Boolean),
    );

    surveys = surveys.filter((s) =>
      allowedFacilityIdsSet.has(s?.facilityId?.toString()),
    );

    if (!surveys?.length) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "No surveys found for the selected filters",
        data: {},
      });
    }

    const totalSurveys = surveys.length;

    const surveyIds = surveys.map((s) => s._id).filter(Boolean);
    const riskCounts = await RiskFinalSampleSummaryCount.find({
      surveyId: { $in: surveyIds },
    })
      .select("surveyId riskName")
      .lean();

    const deficienciesBySurveyId = {};
    for (const rc of riskCounts || []) {
      const sId = rc?.surveyId?.toString();
      if (!sId) continue;
      if (!rc?.riskName) continue;
      deficienciesBySurveyId[sId] = (deficienciesBySurveyId[sId] || 0) + 1;
    }

    let totalDeficiencies = 0;

    const facilityMap = {};
    for (const survey of surveys) {
      const fId = survey?.facilityId?.toString();
      const sId = survey?._id?.toString();
      const deficiencyCount = deficienciesBySurveyId[sId] || 0;

      totalDeficiencies += deficiencyCount;

      if (!facilityMap[fId]) {
        facilityMap[fId] = {
          facilityId: fId,
          facilityName:
            facilities.find((f) => f._id.toString() === fId)?.Provider_Name ||
            "Unknown",
          surveyCount: 0,
          deficiencyCount: 0,
        };
      }

      facilityMap[fId].surveyCount += 1;
      facilityMap[fId].deficiencyCount += deficiencyCount;
    }

    const facilityComparison = Object.values(facilityMap);

    const user = await User.findById(userId);
    await SurveyLog.create({
      activity: `Dashboard matrix fetched by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Dashboard Matrix retrieved successfully",
      data: {
        totalSurveys,
        totalDeficiencies,
        facilityComparison,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    await SurveyLog.create({
      activity: "Dashboard matrix fetch failed",
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during dashboard matrix: ${errorMsg}`,
    });
  }
};

// Helper function to build risk summary from final sample residents
const buildRiskSummary = (finalSampleResidents) => {
  if (!Array.isArray(finalSampleResidents)) {
    return [];
  }

  // 1. Define risk group mappings
  const RISK_GROUPS = {
    Medications: [
      "INSULIN",
      "ANTICOAGULANT",
      "ANTIBIOTIC",
      "DIURETIC",
      "OPIOID",
      "HYPNOTIC",
      "ANTIANXIETY",
      "ANTIPSYCHOTIC",
      "ANTIDEPRESSANT",
      "RESPIRATORY",
      "Antipsych Med (S)",
      "Antipsych Med (L)",
      "Antianxiety/Hypnotic Prev (L)",
      "Antianxiety/Hypnotic % (L)",
    ],
    BehavaSxOthers: ["Behav Sx affect Others (L)"],
    IncreaseADLHelp: ["Incr ADL Help (L)", "Move Indep Worsens (L)"],
    PressureUlcers: [
      "PRESSURE ULCER I",
      "PRESSURE ULCER II",
      "PRESSURE ULCER III",
      "PRESSURE ULCER IV",
      "PRESSURE ULCER U",
      "PRESSURE ULCER S",
      "Pressure Ulcers (L)",
      "Pressure Ulcer",
    ],
    WeightLoss: [
      "EXCESSIVE WEIGHT LOSS WITHOUT PRESCRIBED WEIGHT LOSS PROGRAM",
      "Excess Wt Loss (L)",
      "EXCESSIVE WEIGHT LOSS",
    ],
    TubeFeeding: ["TUBE FEEDING ENTERAL (E)", "TUBE FEEDING PARENTERAL (P)"],
    Dehydration: ["DEHYDRATION"],
    PhysicalRestraints: ["PHYSICAL RESTRAINTS", "Phys restraints (L)"],
    Falls: [
      "Fall",
      "FALL (F)",
      "FALL WITH INJURY (FI)",
      "FALL WITH MAJOR INJURY (FMI)",
      "Depress Sx (L)",
      "Cath Insert/Left Bladder (L)",
      "Falls (L)",
      "Falls w/Maj Injury (L)",
    ],
    IndwellingCatheter: ["INDWELLING CATHETER"],
    IVTherapy: ["IV Therapy"],
    Dialysis: [
      "DIALYSIS PERITONEAL",
      "DIALYSIS HEMO (H)",
      "DIALYSIS IN FACILITY",
      "DIALYSIS OFFSITE",
      "OFFSITE",
      "DIALYSIS",
    ],
    Hospice: ["HOSPICE"],
    EndOfLifeCare: ["END OF LIFE CARE", "COMFORT CARE", "PALLIATIVE CARE"],
    TransmissionBasedPrecautions: ["TRANSMISSION-BASED PRECAUTIONS"],
    Tracheostomy: ["TRACHEOSTOMY"],
    Ventilator: ["VENTILATOR"],
    IntravenousTherapy: ["INTRAVENOUS THERAPY"],
    NeworWorsenedBB: ["New or Worsened B/B (L)"],
    Infections: [
      "INFECTION M",
      "INFECTION WI",
      "INFECTION P",
      "INFECTION TB",
      "INFECTION VH",
      "INFECTION C",
      "Infection",
      "UTI",
      "SEPSIS",
      "SCA",
      "GI INFECTION",
      "COVID",
      "INFECTION O",
      "FLU",
      "FLU A",
      "MRSA",
    ],
    PTSDTrauma: ["PTSD", "TRAUMA"],
    AlzheimerDementia: ["ALZHEIMER'S", "DEMENTIA"],
    PASARR: ["MD", "ID", "RC", "No PAS ARR Level II"],
  };

  // 2. Initialize counters
  const summary = Object.keys(RISK_GROUPS).reduce((acc, group) => {
    acc[group] = 0;
    return acc;
  }, {});

  const normalize = (value) =>
    value
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .trim();

  // 3. Count residents per group (once per resident per group)
  for (const resident of finalSampleResidents) {
    const normalizedRiskName = normalize(resident.riskName);

    for (const [groupName, keywords] of Object.entries(RISK_GROUPS)) {
      const hasRisk = keywords.some((keyword) =>
        normalizedRiskName.includes(keyword),
      );

      if (hasRisk) {
        summary[groupName] += resident.residentCount || 1;
      }
    }
  }

  // 4. Return formatted output
  return Object.entries(summary)
    .filter(([, count]) => count > 0)
    .map(([riskName, residentCount]) => ({
      riskName,
      residentCount,
      createdAt: summary?.createdAt,
      surveyId: summary?.surveyId,
      _id: summary?._id,
    }));
};

// survey
const addSurveyFirstPageMain = async (req, res) => {
  try {
    const { error, value } = addSurveyFirstPage(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      surveyCreationDate,
      surveyCategory,
      census,
      initialPool,
      finalSample,
      facilityId,
      status,
      teamMembers,
      // preSurveyRequirements,
    } = req.body;

    console.log("-----------------------------------");
    console.log("body", req.body);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyData = await Survey.create({
      surveyCreationDate,
      surveyCategory,
      census,
      initialPool,
      finalSample,
      createdBy: req.user._id,
      uniqueOrgCode: user?.uniqueCode,
      facilityId,
      status,
    });

    // team members
    await Promise.all(
      teamMembers.map(async (arr) => {
        // send email to users
        // send email to invited users
        let emsinfo = arr?.email.toLowerCase();
        let teamInfo = await TeamMember.findOne({
          email: emsinfo,
          surveyId: surveyData._id,
        });
        if (!teamInfo) {
          // donot exist
          console.log("email sent");
          sendEmail(
            emsinfo,
            "MockSurvey365 Invite",
            appInviteHtml({
              name: arr?.name,
              email: emsinfo,
              company: user?.firstName + " " + user?.lastName,
              site: CONSTANTS.SITE_LOGIN_URL,
            }),
          );
        }

        let ems = arr?.email.toLowerCase();
        let userOld = await User.findOne({ email: ems });
        if (userOld) {
          let team = await TeamMember.findOne({
            email: ems,
            surveyId: surveyData._id,
          });
          if (!team) {
            let teamId = await TeamMember.create({
              name: arr?.name,
              email: arr?.email.toLowerCase(),
              phone: arr?.phone,
              specialization: arr?.specialization,
              teamCoordinator: arr?.teamCoordinator,
              invited: arr?.invited,
              teamMemberUserId: userOld?._id,
              role: arr?.role,
              surveyId: surveyData._id,
              createdBy: req.user._id,
              updatedBy: req.user._id,
            });
            // assign user facility
            await Promise.all(
              arr?.assignedFacilityTasks.map(async (row) => {
                await AssignedFacility.create({
                  mandatorytaskId: row?.mandatorytaskId,
                  surveyId: surveyData._id,
                  teamMemberId: teamId?._id,
                  teamMemberUserId: userOld?._id,
                  createdBy: req.user._id,
                  updatedBy: req.user._id,
                });
              }),
            );
          }
        } else {
          // user is not found
          // create user
          let team = await TeamMember.findOne({
            email: ems,
            surveyId: surveyData._id,
          });
          if (!team) {
            let users = await User.create({
              firstName: arr?.name,
              lastName: "",
              email: arr?.email.toLowerCase(),
              organization: user?.organization,
              phoneNumber: "",
              agreementConfirmation: true,
              roleId: arr?.role,
              src: "cpanel",
              uniqueCode: user?.uniqueCode,
              isEmailVerified: true,
            });
            let teamId = await TeamMember.create({
              name: arr?.name,
              email: arr?.email.toLowerCase(),
              phone: arr?.phone,
              specialization: arr?.specialization,
              teamCoordinator: arr?.teamCoordinator,
              invited: arr?.invited,
              teamMemberUserId: users?._id,
              role: arr?.role,
              surveyId: surveyData._id,
              createdBy: req.user._id,
              updatedBy: req.user._id,
            });
            // assign user facility
            await Promise.all(
              arr?.assignedFacilityTasks.map(async (row) => {
                await AssignedFacility.create({
                  mandatorytaskId: row?.mandatorytaskId,
                  surveyId: surveyData._id,
                  teamMemberId: teamId?._id,
                  teamMemberUserId: users?._id,
                  createdBy: req.user._id,
                  updatedBy: req.user._id,
                });
              }),
            );
          }
        }
      }),
    );

    await SurveyLog.create({
      activity: `Creating First Survey by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Survey Created Successfully.",
      data: surveyData,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Creating First Survey by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during add survey: ${errorMsg}`,
    });
  }
};

// update survey
const updateSurveyFirstPageMain = async (req, res) => {
  try {
    const { error, value } = updateSurveyFirstPage(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      surveyId,
      surveyCreationDate,
      surveyCategory,
      census,
      initialPool,
      finalSample,
      facilityId,
      status,
      teamMembers,
      // preSurveyRequirements,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    const surveyDatas = await Survey.findByIdAndUpdate(surveyId, {
      surveyCreationDate,
      surveyCategory,
      census,
      initialPool,
      finalSample,
      facilityId,
      status,
    });

    // team members will continue
    await Promise.all(
      teamMembers.map(async (arr) => {
        // send email to users
        // send email to invited users
        if (arr?.teamMemberId) {
          await TeamMember.findByIdAndUpdate(arr?.teamMemberId, {
            name: arr?.name,
            email: arr?.email.toLowerCase(),
            phone: arr?.phone,
            specialization: arr?.specialization,
            teamCoordinator: arr?.teamCoordinator,
            invited: arr?.invited,
            role: arr?.role,
            updatedBy: req.user._id,
          });

          await Promise.all(
            arr?.assignedFacilityTasks.map(async (row) => {
              if (row?.assignedFacilityId) {
                await AssignedFacility.findByIdAndUpdate(
                  row?.assignedFacilityId,
                  {
                    mandatorytaskId: row?.mandatorytaskId,
                    updatedBy: req.user._id,
                  },
                );
              } else {
                let memberUserId = await TeamMember.findById(arr?.teamMemberId);
                await AssignedFacility.create({
                  mandatorytaskId: row?.mandatorytaskId,
                  surveyId: surveyId,
                  teamMemberId: arr?.teamMemberId,
                  teamMemberUserId: memberUserId?.teamMemberUserId,
                  createdBy: req.user._id,
                  updatedBy: req.user._id,
                });
              }
            }),
          );
        } else {
          let emsinfo = arr?.email.toLowerCase();
          let teamInfo = await TeamMember.findOne({
            email: emsinfo,
            surveyId: surveyId,
          });
          if (!teamInfo) {
            sendEmail(
              emsinfo,
              "MockSurvey365 Invite",
              appInviteHtml({
                name: arr?.name,
                email: emsinfo,
                company: user?.firstName + " " + user?.lastName,
                site: CONSTANTS.SITE_LOGIN_URL,
              }),
            );
          }

          // here

          let ems = arr?.email.toLowerCase();
          let userOld = await User.findOne({ email: ems });
          if (userOld) {
            let team = await TeamMember.findOne({
              email: ems,
              surveyId: surveyId,
            });
            if (!team) {
              let teamId = await TeamMember.create({
                name: arr?.name,
                email: arr?.email.toLowerCase(),
                phone: arr?.phone,
                specialization: arr?.specialization,
                teamCoordinator: arr?.teamCoordinator,
                invited: arr?.invited,
                teamMemberUserId: userOld?._id,
                role: arr?.role,
                surveyId: surveyId,
                createdBy: req.user._id,
                updatedBy: req.user._id,
              });
              // assign user facility
              await Promise.all(
                arr?.assignedFacilityTasks.map(async (row) => {
                  await AssignedFacility.create({
                    mandatorytaskId: row?.mandatorytaskId,
                    surveyId: surveyId,
                    teamMemberId: teamId?._id,
                    teamMemberUserId: userOld?._id,
                    createdBy: req.user._id,
                    updatedBy: req.user._id,
                  });
                }),
              );
            } else {
              // team member exist
              await TeamMember.findByIdAndUpdate(team?._id, {
                name: arr?.name,
                email: arr?.email.toLowerCase(),
                phone: arr?.phone,
                specialization: arr?.specialization,
                teamCoordinator: arr?.teamCoordinator,
                invited: arr?.invited,
                role: arr?.role,
                updatedBy: req.user._id,
              });

              await Promise.all(
                arr?.assignedFacilityTasks.map(async (row) => {
                  if (row?.assignedFacilityId) {
                    await AssignedFacility.findByIdAndUpdate(
                      row?.assignedFacilityId,
                      {
                        mandatorytaskId: row?.mandatorytaskId,
                        updatedBy: req.user._id,
                      },
                    );
                  } else {
                    let memberUserId = await TeamMember.findById(team?._id);
                    await AssignedFacility.create({
                      mandatorytaskId: row?.mandatorytaskId,
                      surveyId: surveyId,
                      teamMemberId: team?._id,
                      teamMemberUserId: memberUserId?.teamMemberUserId,
                      createdBy: req.user._id,
                      updatedBy: req.user._id,
                    });
                  }
                }),
              );
            }
          } else {
            // user is not found
            // create user
            let team = await TeamMember.findOne({
              email: ems,
              surveyId: surveyId,
            });
            if (!team) {
              let users = await User.create({
                firstName: arr?.name,
                lastName: "",
                email: arr?.email.toLowerCase(),
                organization: user?.organization,
                phoneNumber: "",
                agreementConfirmation: true,
                roleId: arr?.role,
                src: "cpanel",
                uniqueCode: user?.uniqueCode,
                isEmailVerified: true,
              });
              let teamId = await TeamMember.create({
                name: arr?.name,
                email: arr?.email.toLowerCase(),
                phone: arr?.phone,
                specialization: arr?.specialization,
                teamCoordinator: arr?.teamCoordinator,
                invited: arr?.invited,
                teamMemberUserId: users?._id,
                role: arr?.role,
                surveyId: surveyId,
                createdBy: req.user._id,
                updatedBy: req.user._id,
              });
              // assign user facility
              await Promise.all(
                arr?.assignedFacilityTasks.map(async (row) => {
                  await AssignedFacility.create({
                    mandatorytaskId: row?.mandatorytaskId,
                    surveyId: surveyId,
                    teamMemberId: teamId?._id,
                    teamMemberUserId: users?._id,
                    createdBy: req.user._id,
                    updatedBy: req.user._id,
                  });
                }),
              );
            }
          }
        }
      }),
    );

    await SurveyLog.create({
      activity: `Updated First Page Survey by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Survey Updated Successfully.",
      data: surveyDatas,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Updating First Survey by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during add survey: ${errorMsg}`,
    });
  }
};

// remove team member
const removeTeamMember = async (req, res) => {
  try {
    const { error, value } = removeTeammemberValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const { teamMemberUserId, surveyId } = req.body;

    let survey = await Survey.findById(surveyId);
    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator = survey.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }

    const deletedTeamMember = await TeamMember.findOneAndDelete({
      teamMemberUserId: teamMemberUserId,
      surveyId: surveyId,
    });

    await AssignedFacility.findOneAndDelete({
      teamMemberUserId: teamMemberUserId,
      surveyId: surveyId,
    });

    if (!deletedTeamMember) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Team Member not found in this survey.",
      });
    }

    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove Team Member from Survey by ${users.firstName} ${users.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Team Member removed successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove Team Member from Survey by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during from removing team member from survey: ${errorMsg}`,
    });
  }
};

// remove assigned facility to a team member
const removeAssignedFacilityToTeamMember = async (req, res) => {
  try {
    const { error, value } = removeAssignedFacilityFromATeamMemberValidation(
      req.body,
    );
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const { assignedFacilityId, surveyId } = req.body;

    let survey = await Survey.findById(surveyId);
    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator = survey.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }

    const deletedFacility = await AssignedFacility.findOneAndDelete({
      _id: assignedFacilityId,
      surveyId: surveyId,
    });

    if (!deletedFacility) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Assigned Facility not found in this survey.",
      });
    }

    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove Team Member from Assigned Facility by ${users.firstName} ${users.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Team member removed from assigned facility successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove Team Member from Assigned Facility by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during from removing team member from survey: ${errorMsg}`,
    });
  }
};

// creator survey
const mySurveys = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      category,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const userId = req.user._id;

    /* -------------------- Survey Filters -------------------- */
    const surveyFilter = {};

    if (startDate || endDate) {
      surveyFilter.createdAt = {};
      if (startDate) surveyFilter.createdAt.$gte = new Date(startDate);
      if (endDate) surveyFilter.createdAt.$lte = new Date(endDate);
    }

    if (status) {
      surveyFilter.status = { $regex: `^${status}`, $options: "i" };
    }

    if (category) {
      surveyFilter.surveyCategory = { $regex: `^${category}`, $options: "i" };
    }

    /* -------------------- Surveys where user is invited -------------------- */
    const invitedSurveyIds = await TeamMember.find({
      teamMemberUserId: userId,
    }).distinct("surveyId");

    /* -------------------- Final Query -------------------- */
    const finalQuery = {
      ...surveyFilter,
      $or: [
        { createdBy: userId }, // creator
        { _id: { $in: invitedSurveyIds } }, // team member
      ],
    };

    /* -------------------- Pagination -------------------- */
    const total = await Survey.countDocuments(finalQuery);
    const totalPages = Math.ceil(total / parseInt(limit));

    let surveyData = await Survey.find(finalQuery)
      .select(
        "_id surveyCreationDate surveyCategory census initialPool finalSample facilityId status uniqueOrgCode createdBy createdAt",
      )
      .populate("facilityId", "_id name providerNumber address lastSurvey")
      .populate("createdBy", "_id firstName lastName email organization")
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    surveyData = surveyData.map((survey) => ({
      ...survey.toObject(),
      accessType: survey.createdBy._id.equals(userId)
        ? "CREATOR"
        : "TEAM_MEMBER",
    }));

    /* -------------------- Log -------------------- */
    const user = await User.findById(userId);
    await SurveyLog.create({
      activity: `Survey list fetched by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Surveys fetched successfully.",
      data: {
        surveyData,
        pagination: {
          total,
          totalPages,
          limit: parseInt(limit),
          currentPage: parseInt(page),
        },
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    await SurveyLog.create({
      activity: "Survey list fetch failed",
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `Error fetching surveys: ${errorMsg}`,
    });
  }
};

// view survey
const viewSurveyFirstPage = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select(
        "_id surveyCreationDate surveyCategory census initialPool finalSample facilityId status uniqueOrgCode createdBy createdAt",
      )
      .populate("facilityId", "_id name providerNumber address lastSurvey")
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";

    if (surveyData.createdBy._id.equals(userId)) {
      accessType = "CREATOR";
    } else {
      const isTeamMember = await TeamMember.exists({
        surveyId,
        teamMemberUserId: userId,
      });

      if (isTeamMember) {
        accessType = "TEAM_MEMBER";
      }
    }

    /* -------------------- Other data -------------------- */
    const teamMembers = await TeamMember.find({ surveyId })
      .select(
        "_id name email phone specialization teamCoordinator invited teamMemberUserId role surveyId",
      )
      .sort({ createdAt: -1 });

    const assignedFacility = await AssignedFacility.find({ surveyId })
      .select("mandatorytaskId surveyId teamMemberId teamMemberUserId")
      .populate("mandatorytaskId", "_id title version_date")
      .populate(
        "teamMemberId",
        "_id name email phone specialization teamCoordinator invited teamMemberUserId role surveyId",
      )
      .sort({ createdAt: -1 });

    await SurveyLog.create({
      activity: `View Survey data fetched`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Survey Data viewed successfully.",
      data: {
        accessType, // ✅ added here
        surveyData,
        teamMembers,
        // preSurveyRequirement,
        assignedFacility,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Error viewing survey: ${error.message}`,
    });
  }
};

// add or update second page offsite check list
const addSurveySecondPageMainOffSite = async (req, res) => {
  try {
    const { error, value } = addSurveySecondPage(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, offsiteChecklist, status, preSurveyRequirements } =
      req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator =
      surveyInfo.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }

    // update survey status
    await Survey.findByIdAndUpdate(surveyId, {
      status,
      updatedBy: req.user._id,
    });

    // preSurveyRequirements
    await Promise.all(
      preSurveyRequirements.map(async (arr) => {
        if (arr?.preSurveyRequirementId) {
          await PreSurveyRequirement.findByIdAndUpdate(
            arr?.preSurveyRequirementId,
            {
              type: arr?.type,
              requested: arr?.requested,
              received: arr?.received,
              notReceived: arr?.notReceived,
              notes: arr?.notes,
              requestTimestamp: arr?.requestTimestamp,
              receivedTimestamp: arr?.receivedTimestamp,
              notReceivedTimestamp: arr?.notReceivedTimestamp,
              updatedBy: req.user._id,
            },
          );
        } else {
          await PreSurveyRequirement.create({
            type: arr?.type,
            requested: arr?.requested,
            received: arr?.received,
            notReceived: arr?.notReceived,
            notes: arr?.notes,
            requestTimestamp: arr?.requestTimestamp,
            receivedTimestamp: arr?.receivedTimestamp,
            notReceivedTimestamp: arr?.notReceivedTimestamp,
            surveyId: surveyId,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          });
        }
      }),
    );

    // offsiteChecklist
    await Promise.all(
      offsiteChecklist.map(async (arr) => {
        if (arr?.offsiteChecklistId) {
          await OffSiteCheckList.findByIdAndUpdate(arr?.offsiteChecklistId, {
            taskName: arr?.taskName,
            taskIndex: arr?.taskIndex,
            completed: arr?.completed,
            timestamp: arr?.timestamp,
            description: arr?.description,
            surveyId: surveyId,
            notes: arr?.notes,
            files: arr?.files,
            otherItem: arr?.otherItem,
            updatedBy: req.user._id,
          });
        } else {
          await OffSiteCheckList.create({
            taskName: arr?.taskName,
            taskIndex: arr?.taskIndex,
            completed: arr?.completed,
            timestamp: arr?.timestamp,
            description: arr?.description,
            surveyId: surveyId,
            notes: arr?.notes,
            files: arr?.files,
            otherItem: arr?.otherItem,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          });
        }
      }),
    );

    await SurveyLog.create({
      activity: `Creating or Updating PreSurveyRequirement and OffsiteCheckList by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message:
        "PreSurveyRequirement and OffsiteCheckList Created/Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Creating or Updating PreSurveyRequirement and OffsiteCheckList by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during Creating or Updating PreSurveyRequirement and OffsiteCheckList: ${errorMsg}`,
    });
  }
};

// view offsite checklist and presurvey requirement

const viewOffsitePresurvey = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select("_id surveyCreationDate status  createdBy createdAt")
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";

    if (surveyData.createdBy._id.equals(userId)) {
      accessType = "CREATOR";
    } else {
      const isTeamMember = await TeamMember.exists({
        surveyId,
        teamMemberUserId: userId,
      });

      if (isTeamMember) {
        accessType = "TEAM_MEMBER";
      }
    }

    /* -------------------- Other data -------------------- */

    const preSurveyRequirement = await PreSurveyRequirement.find({ surveyId })
      .select(
        "_id type requested received notReceived notes requestTimestamp notReceivedTimestamp receivedTimestamp surveyId",
      )
      .sort({ createdAt: -1 });

    const offsiteCheckList = await OffSiteCheckList.find({ surveyId })
      .select(
        "_id taskName taskIndex completed notes timestamp description files otherItem surveyId",
      )
      .sort({ createdAt: -1 });

    await SurveyLog.create({
      activity: `View Survey data fetched for OffSiteCheckList and Presurvey Requirements`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message:
        "Survey Data viewed successfully for OffSiteCheckList and Presurvey Requirements.",
      data: {
        accessType, // ✅ added here
        surveyData,
        preSurveyRequirement,
        offsiteCheckList,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing PreSurveyRequirement and OffsiteCheckList by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing survey: ${errorMsg}`,
    });
  }
};

// add or update third page facility entrance
const addSurveyThirdPageMainFacilityEntrance = async (req, res) => {
  try {
    const { error, value } = addSurveyThirdPage(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      surveyId,
      status,
      entranceTime,
      entranceDate,
      entranceAttendees,
      facilityId,
      customItems,
      isGenerated,
      isEditing,
      entranceNotes,
      entranceAgenda,
      bindingArbitration,
      residents,
      documentsToUpload,
      requestedEntranceItems,
      initialAssessments,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator =
      surveyInfo.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }

    // update survey status
    await Survey.findByIdAndUpdate(surveyId, {
      status,
      updatedBy: req.user._id,
    });

    // add or update facility entrance
    let facilityEntra = await FacilityEntrance.findOne({ surveyId: surveyId });
    if (facilityEntra) {
      // updating
      await FacilityEntrance.findByIdAndUpdate(facilityEntra?._id, {
        entranceTime: entranceTime,
        entranceDate: entranceDate,
        entranceAttendees: entranceAttendees,
        entranceAgenda: entranceAgenda,
        entranceNotes: entranceNotes,
        bindingArbitration: bindingArbitration,
        isEditing: isEditing,
        isGenerated: isGenerated,
        customItems: customItems,
        facilityId: facilityId,
        surveyId: surveyId,
        updatedBy: req.user._id,
      });
    } else {
      // creating
      await FacilityEntrance.create({
        entranceTime: entranceTime,
        entranceDate: entranceDate,
        entranceAttendees: entranceAttendees,
        entranceAgenda: entranceAgenda,
        entranceNotes: entranceNotes,
        bindingArbitration: bindingArbitration,
        isEditing: isEditing,
        isGenerated: isGenerated,
        customItems: customItems,
        facilityId: facilityId,
        surveyId: surveyId,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });
    }

    // const extRecord = await ResidentEntrance.find({
    //   surveyId: surveyId,
    // });
    // if (extRecord.length > 0) {
    //   await ResidentEntrance.deleteMany({ surveyId: surveyId });
    // }

    // residents facility entrance
    await Promise.all(
      residents.map(async (arr) => {
        if (arr?.residentId) {
          await ResidentEntrance.findByIdAndUpdate(arr?.residentId, {
            type: arr?.type,
            name: arr?.name,
            room: arr?.room,
            admissionDate: arr?.admissionDate,
            diagnosis: arr?.diagnosis,
            specialTypes: arr?.specialTypes,
            specialTypesOthers: arr?.specialTypesOthers,
            included: arr?.included,
            isNewAdmission: arr?.isNewAdmission,
            fiFlagged: arr?.fiFlagged,
            ijHarm: arr?.ijHarm,
            surveyorNotes: arr?.surveyorNotes,
            surveyId: surveyId,
            updatedBy: req.user._id,
          });
        } else {
          await ResidentEntrance.create({
            type: arr?.type,
            name: arr?.name,
            room: arr?.room,
            admissionDate: arr?.admissionDate,
            diagnosis: arr?.diagnosis,
            specialTypes: arr?.specialTypes,
            specialTypesOthers: arr?.specialTypesOthers,
            included: arr?.included,
            isNewAdmission: arr?.isNewAdmission,
            fiFlagged: arr?.fiFlagged,
            ijHarm: arr?.ijHarm,
            surveyorNotes: arr?.surveyorNotes,
            surveyId: surveyId,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          });
        }
      }),
    );

    // documentsToUpload
    await Promise.all(
      documentsToUpload.map(async (arr) => {
        if (arr?.documentId) {
          await DocumentsToUpload.findByIdAndUpdate(arr?.documentId, {
            type: arr?.type,
            docUrl: arr?.docUrl,
            uploaded: arr?.uploaded,
            uploadTimestamp: arr?.uploadTimestamp,
            surveyId: surveyId,
            updatedBy: req.user._id,
          });
        } else {
          await DocumentsToUpload.create({
            type: arr?.type,
            docUrl: arr?.docUrl,
            uploaded: arr?.uploaded,
            uploadTimestamp: arr?.uploadTimestamp,
            surveyId: surveyId,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          });
        }
      }),
    );

    // requested entrance items
    await Promise.all(
      requestedEntranceItems.map(async (arr) => {
        if (arr?.requestedEntranceItemId) {
          await RequestEntranceItem.findByIdAndUpdate(
            arr?.requestedEntranceItemId,
            {
              type: arr?.type,
              requested: arr?.requested,
              received: arr?.received,
              receivedTimestamp: arr?.receivedTimestamp,
              requestedTimestamp: arr?.requestedTimestamp,
              fullName: arr?.fullName,
              shortName: arr?.shortName,
              notes: arr?.notes,
              surveyId: surveyId,
              updatedBy: req.user._id,
            },
          );
        } else {
          await RequestEntranceItem.create({
            type: arr?.type,
            requested: arr?.requested,
            received: arr?.received,
            receivedTimestamp: arr?.receivedTimestamp,
            requestedTimestamp: arr?.requestedTimestamp,
            fullName: arr?.fullName,
            shortName: arr?.shortName,
            notes: arr?.notes,
            surveyId: surveyId,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          });
        }
      }),
    );

    // initial assessments
    await Promise.all(
      initialAssessments.map(async (arr) => {
        if (arr?.initialAssessmentId) {
          await InitialAssessmentEntrance.findByIdAndUpdate(
            arr?.initialAssessmentId,
            {
              type: arr?.type,
              completed: arr?.completed,
              dateTime: arr?.dateTime,
              notes: arr?.notes,
              additionalComments: arr?.additionalComments,
              probeList: arr?.probeList,
              surveyId: surveyId,
              updatedBy: req.user._id,
            },
          );
        } else {
          await InitialAssessmentEntrance.create({
            type: arr?.type,
            completed: arr?.completed,
            dateTime: arr?.dateTime,
            notes: arr?.notes,
            additionalComments: arr?.additionalComments,
            probeList: arr?.probeList,
            surveyId: surveyId,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          });
        }
      }),
    );

    await SurveyLog.create({
      activity: `Creating or Updating Facility Entrance by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Facility Entrance Created/Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Creating or Updating Facility Entrance by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during Creating or Updating Facility Entrance: ${errorMsg}`,
    });
  }
};

// view facility entrance
const viewFacilityEntrance = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select("_id surveyCreationDate status  createdBy createdAt")
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";

    if (surveyData.createdBy._id.equals(userId)) {
      accessType = "CREATOR";
    } else {
      const isTeamMember = await TeamMember.exists({
        surveyId,
        teamMemberUserId: userId,
      });

      if (isTeamMember) {
        accessType = "TEAM_MEMBER";
      }
    }

    /* -------------------- Other data -------------------- */

    const facilityEntra = await FacilityEntrance.find({ surveyId })
      .select(
        "_id entranceTime entranceDate entranceAttendees entranceAgenda entranceNotes bindingArbitration isEditing isGenerated customItems facilityId surveyId createdAt",
      )
      .populate("facilityId", "_id name providerNumber address lastSurvey")
      .sort({ createdAt: -1 });

    const residentEntra = await ResidentEntrance.find({ surveyId })
      .select(
        "_id type name room admissionDate diagnosis specialTypes specialTypesOthers included isNewAdmission fiFlagged ijHarm surveyorNotes surveyId",
      )
      .sort({ createdAt: -1 });

    const documentsToUpload = await DocumentsToUpload.find({ surveyId })
      .select("_id type docUrl uploaded surveyId")
      .sort({ createdAt: -1 });

    const requestEntranceItems = await RequestEntranceItem.find({ surveyId })
      .select(
        "_id type requested received receivedTimestamp requestedTimestamp fullName shortName notes surveyId",
      )
      .sort({ createdAt: -1 });

    const initialAssessment = await InitialAssessmentEntrance.find({ surveyId })
      .select(
        "_id type completed dateTime notes additionalComments probeList surveyId",
      )
      .sort({ createdAt: -1 });

    await SurveyLog.create({
      activity: `View Survey data fetched for OffSiteCheckList and Presurvey Requirements`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Survey Data viewed successfully for Facility Entrance.",
      data: {
        accessType, // ✅ added here
        surveyData,
        facilityEntrance: facilityEntra,
        residentEntrance: residentEntra,
        documentsToUpload,
        requestEntranceItems,
        initialAssessment,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Facility Entrance by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing survey: ${errorMsg}`,
    });
  }
};

// remove facility entrance resident
const removeFacilityEntranceResident = async (req, res) => {
  try {
    const { error, value } = removeFacilityEntranceResidentValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { residentId, surveyId } = req.body;

    let survey = await Survey.findById(surveyId);
    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator = survey.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }

    const deletedResident = await ResidentEntrance.findOneAndDelete({
      _id: residentId,
      surveyId: surveyId,
    });

    if (!deletedResident) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Resident not found in this survey.",
      });
    }

    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove Resident from Facility Entrance by ${users.firstName} ${users.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Resident removed from facility entrance successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove Resident from Facility Entrance by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during from removing resident from survey: ${errorMsg}`,
    });
  }
};

// save and send email to users with assigned residents
// InitialPool
const saveInitialResidents = async (req, res) => {
  try {
    const { error, value } = addInitialPool(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, status, residents } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator =
      surveyInfo.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }
    // saving and updating at the same time
    // update survey status
    await Survey.findByIdAndUpdate(surveyId, {
      status,
      updatedBy: req.user._id,
    });

    // Check if this is a fresh creation by verifying if any generatedId exists in the database
    const generatedIds = residents
      .map((r) => r?.generatedId)
      .filter((id) => id);

    let isFreshCreation = false;

    if (generatedIds.length > 0) {
      // Check if any of the generatedIds already exist in the database
      const existingRecords = await InitialPool.find({
        surveyId: surveyId,
        generatedId: { $in: generatedIds },
      });

      // If none of the generatedIds exist, it's a fresh creation
      isFreshCreation = existingRecords.length === 0;
    } else {
      // No generatedIds at all means fresh creation
      isFreshCreation = true;
    }

    // If this is a fresh creation, delete all existing records for this survey
    if (isFreshCreation) {
      await InitialPool.deleteMany({ surveyId: surveyId });
      console.log(
        `Deleted all existing InitialPool records for survey: ${surveyId} (fresh creation detected)`,
      );
    }

    await Promise.all(
      residents.map(async (arr) => {
        if (arr?.generatedId) {
          let initId = await InitialPool.findOne({
            surveyId: surveyId,
            generatedId: arr?.generatedId,
          });
          if (initId) {
            await InitialPool.findByIdAndUpdate(initId?._id, {
              generatedId: arr?.generatedId,
              name: arr?.name,
              room: arr?.room,
              admissionDate: arr?.admissionDate,
              isNewAdmission: arr?.isNewAdmission,
              pressureUlcers: arr?.pressureUlcers,
              risks: arr?.risks,
              interviews: arr?.interviews,
              observations: arr?.observations,
              included: arr?.included,
              notes: arr?.notes,
              scheduleInterviewType: arr?.scheduleInterviewType,
              scheduleInterviewEmail: arr?.scheduleInterviewEmail,
              scheduleInterviewDateTime: arr?.scheduleInterviewDateTime,
              scheduleInterviewNotes: arr?.scheduleInterviewNotes,
              scheduleObservationArea: arr?.scheduleObservationArea,
              scheduleObservationDescription:
                arr?.scheduleObservationDescription,
              scheduleObservationDateTime: arr?.scheduleObservationDateTime,
              surveyId: surveyId,
              qualityMeasureCount: arr?.qualityMeasureCount,
              teamMemberUserId: arr?.teamMemberUserId
                ? arr?.teamMemberUserId
                : null,
              updatedBy: req.user._id,
            });

            let finalsample = await FinalSample.findOne({
              surveyId: surveyId,
              generatedId: arr?.generatedId,
            });
            if (finalsample) {
              await FinalSample.findByIdAndUpdate(finalsample?._id, {
                generatedId: arr?.generatedId,
                name: arr?.name,
                room: arr?.room,
                admissionDate: arr?.admissionDate,
                isNewAdmission: arr?.isNewAdmission,
                pressureUlcers: arr?.pressureUlcers,
                risks: arr?.risks,
                interviews: arr?.interviews,
                observations: arr?.observations,
                included: arr?.included,
                notes: arr?.notes,
                scheduleInterviewType: arr?.scheduleInterviewType,
                scheduleInterviewEmail: arr?.scheduleInterviewEmail,
                scheduleInterviewDateTime: arr?.scheduleInterviewDateTime,
                scheduleInterviewNotes: arr?.scheduleInterviewNotes,
                scheduleObservationArea: arr?.scheduleObservationArea,
                scheduleObservationDescription:
                  arr?.scheduleObservationDescription,
                scheduleObservationDateTime: arr?.scheduleObservationDateTime,
                surveyId: surveyId,
                qualityMeasureCount: arr?.qualityMeasureCount,
                teamMemberUserId: arr?.teamMemberUserId
                  ? arr?.teamMemberUserId
                  : null,
                updatedBy: req.user._id,
              });
            }

            // investigation
            let investigation = await InvestigationData.findOne({
              surveyId: surveyId,
              generatedId: arr?.generatedId,
            });
            if (investigation) {
              await InvestigationData.findByIdAndUpdate(investigation?._id, {
                generatedId: arr?.generatedId,
                name: arr?.name,
                room: arr?.room,
                admissionDate: arr?.admissionDate,
                isNewAdmission: arr?.isNewAdmission,
                risks: arr?.risks,
                included: arr?.included,
                surveyId: surveyId,
                teamMemberUserId: arr?.teamMemberUserId
                  ? arr?.teamMemberUserId
                  : null,
                updatedBy: req.user._id,
              });
            }
          } else {
            await InitialPool.create({
              generatedId: arr?.generatedId,
              name: arr?.name,
              room: arr?.room,
              admissionDate: arr?.admissionDate,
              isNewAdmission: arr?.isNewAdmission,
              pressureUlcers: arr?.pressureUlcers,
              risks: arr?.risks,
              interviews: arr?.interviews,
              observations: arr?.observations,
              included: arr?.included,
              notes: arr?.notes,
              scheduleInterviewType: arr?.scheduleInterviewType,
              scheduleInterviewEmail: arr?.scheduleInterviewEmail,
              scheduleInterviewDateTime: arr?.scheduleInterviewDateTime,
              scheduleInterviewNotes: arr?.scheduleInterviewNotes,
              scheduleObservationArea: arr?.scheduleObservationArea,
              scheduleObservationDescription:
                arr?.scheduleObservationDescription,
              scheduleObservationDateTime: arr?.scheduleObservationDateTime,
              surveyId: surveyId,
              qualityMeasureCount: arr?.qualityMeasureCount,
              teamMemberUserId: arr?.teamMemberUserId
                ? arr?.teamMemberUserId
                : null,
              createdBy: req.user._id,
              updatedBy: req.user._id,
            });
          }
        } else {
          await InitialPool.create({
            generatedId: arr?.generatedId,
            name: arr?.name,
            room: arr?.room,
            admissionDate: arr?.admissionDate,
            isNewAdmission: arr?.isNewAdmission,
            pressureUlcers: arr?.pressureUlcers,
            risks: arr?.risks,
            interviews: arr?.interviews,
            observations: arr?.observations,
            notes: arr?.notes,
            included: arr?.included,
            scheduleInterviewType: arr?.scheduleInterviewType,
            scheduleInterviewEmail: arr?.scheduleInterviewEmail,
            scheduleInterviewDateTime: arr?.scheduleInterviewDateTime,
            scheduleInterviewNotes: arr?.scheduleInterviewNotes,
            scheduleObservationArea: arr?.scheduleObservationArea,
            scheduleObservationDescription: arr?.scheduleObservationDescription,
            scheduleObservationDateTime: arr?.scheduleObservationDateTime,
            surveyId: surveyId,
            qualityMeasureCount: arr?.qualityMeasureCount,
            teamMemberUserId: arr?.teamMemberUserId
              ? arr?.teamMemberUserId
              : null,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          });
        }
      }),
    );

    // 1️⃣ Extract unique team member IDs safely
    const uniqueTeamMemberIds = [
      ...new Set(
        residents
          .map((r) => r?.teamMemberUserId?._id || r?.teamMemberUserId)
          .filter(Boolean)
          .map(String),
      ),
    ];

    // 2️⃣ Send emails only if there are team members assigned
    if (uniqueTeamMemberIds.length > 0) {
      // Fetch users in bulk
      const users = await User.find({
        _id: { $in: uniqueTeamMemberIds },
      }).lean();

      const usersById = new Map(users.map((u) => [u._id.toString(), u]));

      // Fetch existing InitialPool entries in bulk
      const existingSamples = await InitialPool.find({
        surveyId,
        teamMemberUserId: { $in: uniqueTeamMemberIds },
      }).lean();

      const existingUserIds = new Set(
        existingSamples.map((s) => s.teamMemberUserId.toString()),
      );

      // Send emails only when needed
      await Promise.all(
        uniqueTeamMemberIds.map(async (userId) => {
          if (existingUserIds.has(userId)) return;

          const user = usersById.get(userId);
          if (!user?.email) return;

          const subject = "MockSurvey365 Survey Update";
          const message = `Hi ${user.firstName || ""} ${user.lastName || ""}, 
there is a new update on the Survey ${surveyInfo.surveyCategory}.`;

          const fileUrl = `${CONSTANTS.CP_URL}surveys`;

          await sendEmail(
            user.email,
            subject,
            requestEmailHtml({ subject, message, fileUrl }),
          );
        }),
      );
    }

    await SurveyLog.create({
      activity: `Creating or Updating InitialPool by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "InitialPool Created/Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Save Initial Residents by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during saving initial residents: ${errorMsg}`,
    });
  }
};

// view initial pool
const viewInitialPool = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select("_id surveyCreationDate status  createdBy createdAt")
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";
    let initialpoolData;

    if (surveyData.createdBy._id.equals(userId)) {
      accessType = "CREATOR";

      initialpoolData = await InitialPool.find({ surveyId })
        .select(
          "_id generatedId name room admissionDate isNewAdmission pressureUlcers risks qualityMeasureCount included teamMemberUserId scheduleInterviewType scheduleInterviewEmail scheduleInterviewDateTime scheduleInterviewNotes scheduleObservationArea scheduleObservationDescription scheduleObservationDateTime interviews observations notes surveyId createdAt",
        )
        .populate(
          "teamMemberUserId",
          "_id firstName lastName email organization",
        )
        .sort({ createdAt: -1 });
    } else {
      const isTeamMember = await TeamMember.exists({
        surveyId,
        teamMemberUserId: userId,
      });

      if (isTeamMember) {
        accessType = "TEAM_MEMBER";
      }

      initialpoolData = await InitialPool.find({
        surveyId,
        teamMemberUserId: req.user?._id,
      })
        .select(
          "_id generatedId name room admissionDate isNewAdmission pressureUlcers risks qualityMeasureCount included teamMemberUserId scheduleInterviewType scheduleInterviewEmail scheduleInterviewDateTime scheduleInterviewNotes scheduleObservationArea scheduleObservationDescription scheduleObservationDateTime interviews observations notes surveyId createdAt",
        )
        .populate(
          "teamMemberUserId",
          "_id firstName lastName email organization",
        )
        .sort({ createdAt: -1 });
    }

    await SurveyLog.create({
      activity: `View InitialPool data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "InitialPool Data viewed successfully.",
      data: {
        accessType, // ✅ added here
        surveyData,
        initialpoolData,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing InitialPool data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing survey: ${errorMsg}`,
    });
  }
};

// view team member residents
const viewTeamMemberResidents = async (req, res) => {
  try {
    const { error, value } = viewResidentTeamMember(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, teamMemberUserId } = req.body;

    const userId = req.user._id;

    let data = await InitialPool.find({
      surveyId,
      teamMemberUserId: teamMemberUserId,
    });

    await SurveyLog.create({
      activity: `View Team member InitialPool data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "View Team Member InitialPool Data successfully.",
      data: data.length,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Team Member InitialPool data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing survey: ${errorMsg}`,
    });
  }
};

const viewTeamMemberSurveyAccess = async (req, res) => {
  try {
    const { error, value } = viewResidentTeamMember(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, teamMemberUserId } = req.body;

    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select(
        "_id surveyCreationDate status census initialPool finalSample createdBy createdAt",
      )
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";

    if (surveyData.createdBy._id.equals(teamMemberUserId)) {
      accessType = "CREATOR";
    } else {
      const isTeamMember = await TeamMember.exists({
        surveyId,
        teamMemberUserId: teamMemberUserId,
      });

      if (isTeamMember) {
        accessType = "TEAM_MEMBER";
      }
    }

    let user = await User.findOne({ _id: teamMemberUserId }).select(
      "firstName lastName email",
    );

    await SurveyLog.create({
      activity: `View Team member survey access data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "View Team Member Survey Access Data successfully.",
      data: {
        accessType,
        user,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Team Member survey access data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing survey: ${errorMsg}`,
    });
  }
};

// remove team member from residents
const removeTeamMemberInitialPoolResident = async (req, res) => {
  try {
    const { error, value } = removeTeamMemberInitialPoolResidentValidation(
      req.body,
    );
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, generatedId } = req.body;

    let survey = await Survey.findById(surveyId);
    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator = survey.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }

    const removeTeamMember = await InitialPool.findOne({
      surveyId: surveyId,
      generatedId: generatedId,
    });

    if (!removeTeamMember) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Team member not found for this resident.",
      });
    }

    await InitialPool.findByIdAndUpdate(removeTeamMember._id, {
      teamMemberUserId: null,
      updatedBy: req.user._id,
    });

    const removeTeamMemberFinalSample = await FinalSample.findOne({
      surveyId: surveyId,
      generatedId: generatedId,
    });

    if (removeTeamMemberFinalSample) {
      await FinalSample.findByIdAndUpdate(removeTeamMemberFinalSample._id, {
        teamMemberUserId: null,
        updatedBy: req.user._id,
      });
    }

    // investigation
    const removeInvestigation = await InvestigationData.findOne({
      surveyId: surveyId,
      generatedId: generatedId,
    });

    if (removeInvestigation) {
      await InvestigationData.findByIdAndUpdate(removeInvestigation._id, {
        teamMemberUserId: null,
        updatedBy: req.user._id,
      });
    }

    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove Team Member from InitialPool by ${users.firstName} ${users.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Team member removed from initial pool successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove Team Member from InitialPool by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during from removing team member from initial pool: ${errorMsg}`,
    });
  }
};

// team member update inital pool resident assigned to him
const saveInitialPoolTeamMemberResidents = async (req, res) => {
  try {
    const { error, value } = addTeamMemberInitialPool(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, residents } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    await Promise.all(
      residents.map(async (arr) => {
        let initId = await InitialPool.findOne({
          surveyId: surveyId,
          generatedId: arr?.generatedId,
          teamMemberUserId: req.user?._id,
        });
        if (initId) {
          await InitialPool.findByIdAndUpdate(initId?._id, {
            interviews: arr?.interviews,
            observations: arr?.observations,
            notes: arr?.notes,
            included: arr?.included,
            scheduleInterviewType: arr?.scheduleInterviewType,
            scheduleInterviewEmail: arr?.scheduleInterviewEmail,
            scheduleInterviewDateTime: arr?.scheduleInterviewDateTime,
            scheduleInterviewNotes: arr?.scheduleInterviewNotes,
            scheduleObservationArea: arr?.scheduleObservationArea,
            scheduleObservationDescription: arr?.scheduleObservationDescription,
            scheduleObservationDateTime: arr?.scheduleObservationDateTime,
            updatedBy: req.user._id,
          });

          let finalsample = await FinalSample.findOne({
            surveyId: surveyId,
            generatedId: arr?.generatedId,
            teamMemberUserId: req.user?._id,
          });
          if (finalsample) {
            await FinalSample.findByIdAndUpdate(finalsample?._id, {
              interviews: arr?.interviews,
              observations: arr?.observations,
              notes: arr?.notes,
              included: arr?.included,
              scheduleInterviewType: arr?.scheduleInterviewType,
              scheduleInterviewEmail: arr?.scheduleInterviewEmail,
              scheduleInterviewDateTime: arr?.scheduleInterviewDateTime,
              scheduleInterviewNotes: arr?.scheduleInterviewNotes,
              scheduleObservationArea: arr?.scheduleObservationArea,
              scheduleObservationDescription:
                arr?.scheduleObservationDescription,
              scheduleObservationDateTime: arr?.scheduleObservationDateTime,
              updatedBy: req.user._id,
            });
          }
        }
      }),
    );

    await SurveyLog.create({
      activity: `Updating InitialPool by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "InitialPool Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Updating InitialPool by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during updating initial pool: ${errorMsg}`,
    });
  }
};

// check if team member user id is already assigned to a resident
const checkTeamMemberAssignedResident = async (req, res) => {
  try {
    //
    const { error, value } = teamMemberInitialPoolResidentValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, generatedId } = req.body;
    let teamMemberAssignedResident = await InitialPool.findOne({
      surveyId: surveyId,
      generatedId: generatedId,
    })
      .select("_id teamMemberUserId surveyId generatedId name")
      .populate("teamMemberUserId", "_id firstName lastName email organization")
      .sort({ createdAt: -1 });

    let teamMemberAssignedFinalResident = await FinalSample.findOne({
      surveyId: surveyId,
      generatedId: generatedId,
    })
      .select("_id teamMemberUserId surveyId generatedId name")
      .populate("teamMemberUserId", "_id firstName lastName email organization")
      .sort({ createdAt: -1 });

    if (!teamMemberAssignedResident || !teamMemberAssignedFinalResident) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Resident not found.",
      });
    }

    const isAssigned = teamMemberAssignedResident.teamMemberUserId !== null;
    const assignmentStatus = isAssigned
      ? "already assigned"
      : "not assigned to any team member";

    const isAssignedFinal =
      teamMemberAssignedFinalResident.teamMemberUserId !== null;
    const assignmentStatusFinal = isAssignedFinal
      ? "already assigned"
      : "not assigned to any team member";

    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Checking Team Member Assigned Resident by ${users.firstName} ${users.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: `Resident is ${assignmentStatus}.`,
      data: {
        isAssigned: isAssigned || isAssignedFinal,
        assignmentStatus: assignmentStatus || assignmentStatusFinal,
        resident: teamMemberAssignedResident || teamMemberAssignedFinalResident,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Checking Team Member Assigned Resident by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during checking team member assigned resident: ${errorMsg}`,
    });
  }
};

// final sample save or update
const saveFinalSampleResidents = async (req, res) => {
  try {
    const { error, value } = addFinalSample(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, status, residents, riskSummary } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator =
      surveyInfo.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }
    // saving and updating at the same time
    // update survey status
    await Survey.findByIdAndUpdate(surveyId, {
      status,
      updatedBy: req.user._id,
    });

    // Check if this is a fresh creation by verifying if any generatedId exists in the database
    const generatedIds = residents
      .map((r) => r?.generatedId)
      .filter((id) => id);

    let isFreshCreation = false;
    let isNewFreshCreation = false;

    if (generatedIds.length > 0) {
      // Check if any of the generatedIds already exist in the database
      const existingRecords = await FinalSample.find({
        surveyId: surveyId,
        generatedId: { $in: generatedIds },
      });

      const extRecord = await RiskFinalSampleSummaryCount.find({
        surveyId: surveyId,
      });

      // If none of the generatedIds exist, it's a fresh creation
      isFreshCreation = existingRecords.length === 0;
      isNewFreshCreation = extRecord.length === 0;
    } else {
      // No generatedIds at all means fresh creation
      isFreshCreation = true;
      isNewFreshCreation = true;
    }

    // If this is a fresh creation, delete all existing records for this survey
    if (isFreshCreation) {
      await FinalSample.deleteMany({ surveyId: surveyId });
      console.log(
        `Deleted all existing FinalSample records for survey: ${surveyId} (fresh creation detected)`,
      );
    }

    if (isNewFreshCreation) {
      await RiskFinalSampleSummaryCount.deleteMany({ surveyId: surveyId });
      console.log(
        `Deleted all existing RiskFinalSampleSummaryCount records for survey: ${surveyId} (fresh creation detected)`,
      );
    }

    await Promise.all(
      residents.map(async (arr) => {
        if (arr?.generatedId) {
          let final = await FinalSample.findOne({
            surveyId: surveyId,
            generatedId: arr?.generatedId,
          });
          if (final) {
            await FinalSample.findByIdAndUpdate(final?._id, {
              generatedId: arr?.generatedId,
              name: arr?.name,
              room: arr?.room,
              admissionDate: arr?.admissionDate,
              isNewAdmission: arr?.isNewAdmission,
              pressureUlcers: arr?.pressureUlcers,
              risks: arr?.risks,
              interviews: arr?.interviews,
              observations: arr?.observations,
              included: arr?.included,
              notes: arr?.notes,
              scheduleInterviewType: arr?.scheduleInterviewType,
              scheduleInterviewEmail: arr?.scheduleInterviewEmail,
              scheduleInterviewDateTime: arr?.scheduleInterviewDateTime,
              scheduleInterviewNotes: arr?.scheduleInterviewNotes,
              scheduleObservationArea: arr?.scheduleObservationArea,
              scheduleObservationDescription:
                arr?.scheduleObservationDescription,
              scheduleObservationDateTime: arr?.scheduleObservationDateTime,
              surveyId: surveyId,
              qualityMeasureCount: arr?.qualityMeasureCount,
              teamMemberUserId: arr?.teamMemberUserId
                ? arr?.teamMemberUserId
                : null,
              updatedBy: req.user._id,
            });

            // initial pool
            let initId = await InitialPool.findOne({
              surveyId: surveyId,
              generatedId: arr?.generatedId,
            });
            if (initId) {
              await InitialPool.findByIdAndUpdate(initId?._id, {
                generatedId: arr?.generatedId,
                name: arr?.name,
                room: arr?.room,
                admissionDate: arr?.admissionDate,
                isNewAdmission: arr?.isNewAdmission,
                pressureUlcers: arr?.pressureUlcers,
                risks: arr?.risks,
                interviews: arr?.interviews,
                observations: arr?.observations,
                included: arr?.included,
                notes: arr?.notes,
                scheduleInterviewType: arr?.scheduleInterviewType,
                scheduleInterviewEmail: arr?.scheduleInterviewEmail,
                scheduleInterviewDateTime: arr?.scheduleInterviewDateTime,
                scheduleInterviewNotes: arr?.scheduleInterviewNotes,
                scheduleObservationArea: arr?.scheduleObservationArea,
                scheduleObservationDescription:
                  arr?.scheduleObservationDescription,
                scheduleObservationDateTime: arr?.scheduleObservationDateTime,
                surveyId: surveyId,
                qualityMeasureCount: arr?.qualityMeasureCount,
                teamMemberUserId: arr?.teamMemberUserId
                  ? arr?.teamMemberUserId
                  : null,
                updatedBy: req.user._id,
              });
            }
            let investigation = await InvestigationData.findOne({
              surveyId: surveyId,
              generatedId: arr?.generatedId,
            });
            if (investigation) {
              await InvestigationData.findByIdAndUpdate(investigation?._id, {
                generatedId: arr?.generatedId,
                name: arr?.name,
                room: arr?.room,
                admissionDate: arr?.admissionDate,
                isNewAdmission: arr?.isNewAdmission,
                risks: arr?.risks,
                included: arr?.included,
                surveyId: surveyId,
                teamMemberUserId: arr?.teamMemberUserId
                  ? arr?.teamMemberUserId
                  : null,
                updatedBy: req.user._id,
              });
            }
          } else {
            await FinalSample.create({
              generatedId: arr?.generatedId,
              name: arr?.name,
              room: arr?.room,
              admissionDate: arr?.admissionDate,
              isNewAdmission: arr?.isNewAdmission,
              pressureUlcers: arr?.pressureUlcers,
              risks: arr?.risks,
              interviews: arr?.interviews,
              observations: arr?.observations,
              included: arr?.included,
              notes: arr?.notes,
              scheduleInterviewType: arr?.scheduleInterviewType,
              scheduleInterviewEmail: arr?.scheduleInterviewEmail,
              scheduleInterviewDateTime: arr?.scheduleInterviewDateTime,
              scheduleInterviewNotes: arr?.scheduleInterviewNotes,
              scheduleObservationArea: arr?.scheduleObservationArea,
              scheduleObservationDescription:
                arr?.scheduleObservationDescription,
              scheduleObservationDateTime: arr?.scheduleObservationDateTime,
              surveyId: surveyId,
              qualityMeasureCount: arr?.qualityMeasureCount,
              teamMemberUserId: arr?.teamMemberUserId
                ? arr?.teamMemberUserId
                : null,
              createdBy: req.user._id,
              updatedBy: req.user._id,
            });
          }
        } else {
          await FinalSample.create({
            generatedId: arr?.generatedId,
            name: arr?.name,
            room: arr?.room,
            admissionDate: arr?.admissionDate,
            isNewAdmission: arr?.isNewAdmission,
            pressureUlcers: arr?.pressureUlcers,
            risks: arr?.risks,
            interviews: arr?.interviews,
            observations: arr?.observations,
            notes: arr?.notes,
            included: arr?.included,
            scheduleInterviewType: arr?.scheduleInterviewType,
            scheduleInterviewEmail: arr?.scheduleInterviewEmail,
            scheduleInterviewDateTime: arr?.scheduleInterviewDateTime,
            scheduleInterviewNotes: arr?.scheduleInterviewNotes,
            scheduleObservationArea: arr?.scheduleObservationArea,
            scheduleObservationDescription: arr?.scheduleObservationDescription,
            scheduleObservationDateTime: arr?.scheduleObservationDateTime,
            surveyId: surveyId,
            qualityMeasureCount: arr?.qualityMeasureCount,
            teamMemberUserId: arr?.teamMemberUserId
              ? arr?.teamMemberUserId
              : null,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          });
        }
      }),
    );

    const extRecord = await RiskFinalSampleSummaryCount.find({
      surveyId: surveyId,
    });
    if (extRecord.length > 0) {
      await RiskFinalSampleSummaryCount.deleteMany({ surveyId: surveyId });
    }
    await Promise.all(
      riskSummary.map(async (arr) => {
        if (arr?._id) {
          let final = await RiskFinalSampleSummaryCount.findOne({
            surveyId: surveyId,
            _id: arr?._id,
          });
          if (final) {
            await RiskFinalSampleSummaryCount.findByIdAndUpdate(final?._id, {
              riskName: arr?.riskName,
              residentCount: arr?.residentCount,
              surveyId: surveyId,
              updatedBy: req.user._id,
            });
          } else {
            await RiskFinalSampleSummaryCount.create({
              riskName: arr?.riskName,
              residentCount: arr?.residentCount,
              surveyId: surveyId,
              createdBy: req.user._id,
              updatedBy: req.user._id,
            });
          }
        } else {
          await RiskFinalSampleSummaryCount.create({
            riskName: arr?.riskName,
            residentCount: arr?.residentCount,
            surveyId: surveyId,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          });
        }
      }),
    );

    // 1️⃣ Extract unique team member IDs safely
    const uniqueTeamMemberIds = [
      ...new Set(
        residents
          .map((r) => r?.teamMemberUserId?._id || r?.teamMemberUserId)
          .filter(Boolean)
          .map(String),
      ),
    ];

    // 2️⃣ Send emails only if there are team members assigned
    if (uniqueTeamMemberIds.length > 0) {
      // Fetch users in bulk
      const users = await User.find({
        _id: { $in: uniqueTeamMemberIds },
      }).lean();

      const usersById = new Map(users.map((u) => [u._id.toString(), u]));

      // Fetch existing FinalSample entries in bulk
      const existingSamples = await FinalSample.find({
        surveyId,
        teamMemberUserId: { $in: uniqueTeamMemberIds },
      }).lean();

      const existingUserIds = new Set(
        existingSamples.map((s) => s.teamMemberUserId.toString()),
      );

      // Send emails only when needed
      await Promise.all(
        uniqueTeamMemberIds.map(async (userId) => {
          if (existingUserIds.has(userId)) return;

          const user = usersById.get(userId);
          if (!user?.email) return;

          const subject = "MockSurvey365 Survey Update";
          const message = `Hi ${user.firstName || ""} ${user.lastName || ""}, 
there is a new update on the Survey ${surveyInfo.surveyCategory}.`;

          const fileUrl = `${CONSTANTS.CP_URL}surveys`;

          await sendEmail(
            user.email,
            subject,
            requestEmailHtml({ subject, message, fileUrl }),
          );
        }),
      );
    }

    await SurveyLog.create({
      activity: `Creating or Updating Final Sample by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Final Sample Created/Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Save Final Sample Residents by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during saving final sample residents: ${errorMsg}`,
    });
  }
};

// view final sample
const viewfinalSample = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select(
        "_id surveyCreationDate status census initialPool finalSample createdBy createdAt",
      )
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";
    let finalSampleData;
    let riskResidentCount;

    if (surveyData.createdBy._id.equals(userId)) {
      accessType = "CREATOR";

      finalSampleData = await FinalSample.find({ surveyId })
        .select(
          "_id generatedId name room admissionDate isNewAdmission pressureUlcers risks qualityMeasureCount included teamMemberUserId scheduleInterviewType scheduleInterviewEmail scheduleInterviewDateTime scheduleInterviewNotes scheduleObservationArea scheduleObservationDescription scheduleObservationDateTime interviews observations notes surveyId createdAt",
        )
        .populate(
          "teamMemberUserId",
          "_id firstName lastName email organization",
        )
        .sort({ createdAt: -1 });

      riskResidentCount = await RiskFinalSampleSummaryCount.find({ surveyId })
        .select("_id riskName residentCount surveyId createdAt")
        .sort({ createdAt: -1 });
    } else {
      const isTeamMember = await TeamMember.exists({
        surveyId,
        teamMemberUserId: userId,
      });

      if (isTeamMember) {
        accessType = "TEAM_MEMBER";
      }

      finalSampleData = await FinalSample.find({
        surveyId,
        teamMemberUserId: req.user?._id,
      })
        .select(
          "_id generatedId name room admissionDate isNewAdmission pressureUlcers risks qualityMeasureCount included teamMemberUserId scheduleInterviewType scheduleInterviewEmail scheduleInterviewDateTime scheduleInterviewNotes scheduleObservationArea scheduleObservationDescription scheduleObservationDateTime interviews observations notes surveyId createdAt",
        )
        .populate(
          "teamMemberUserId",
          "_id firstName lastName email organization",
        )
        .sort({ createdAt: -1 });

      riskResidentCount = await RiskFinalSampleSummaryCount.find({ surveyId })
        .select("_id riskName residentCount surveyId createdAt")
        .sort({ createdAt: -1 });
    }

    // let riskResidentCount = buildRiskSummary(riskResidentCounts);

    await SurveyLog.create({
      activity: `View FinalSample data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "FinalSample Data viewed successfully.",
      data: {
        accessType, // ✅ added here
        surveyData,
        finalSampleData,
        riskResidentCount,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing FinalSample data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing survey: ${errorMsg}`,
    });
  }
};

// investigation save
const saveInvestigationResidents = async (req, res) => {
  try {
    const { error, value } = addInvestigation(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, status, residents } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator =
      surveyInfo.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }
    // saving and updating at the same time
    // update survey status
    await Survey.findByIdAndUpdate(surveyId, {
      status,
      updatedBy: req.user._id,
    });

    // Check if this is a fresh creation by verifying if any generatedId exists in the database
    const generatedIds = residents
      .map((r) => r?.generatedId)
      .filter((id) => id);

    let isFreshCreation = false;

    if (generatedIds.length > 0) {
      // Check if any of the generatedIds already exist in the database
      const existingRecords = await InvestigationData.find({
        surveyId: surveyId,
        generatedId: { $in: generatedIds },
      });

      // If none of the generatedIds exist, it's a fresh creation
      isFreshCreation = existingRecords.length === 0;
    } else {
      // No generatedIds at all means fresh creation
      isFreshCreation = true;
    }

    // If this is a fresh creation, delete all existing records for this survey
    if (isFreshCreation) {
      await InvestigationData.deleteMany({ surveyId: surveyId });
      console.log(
        `Deleted all existing Investigation records for survey: ${surveyId} (fresh creation detected)`,
      );
    }

    await Promise.all(
      residents.map(async (arr) => {
        if (arr?.generatedId) {
          let investigate = await InvestigationData.findOne({
            surveyId: surveyId,
            generatedId: arr?.generatedId,
          });
          if (investigate) {
            await InvestigationData.findByIdAndUpdate(investigate?._id, {
              generatedId: arr?.generatedId,
              name: arr?.name,
              room: arr?.room,
              admissionDate: arr?.admissionDate,
              isNewAdmission: arr?.isNewAdmission,
              risks: arr?.risks,
              included: arr?.included,
              surveyId: surveyId,
              investigations: arr?.investigations,
              bodyMapObservations: arr?.bodyMapObservations,
              weightCalculatorData: arr?.weightCalculatorData,
              teamMemberUserId: arr?.teamMemberUserId
                ? arr?.teamMemberUserId
                : null,
              generalSurveyorNotes: arr?.generalSurveyorNotes,
              updatedBy: req.user._id,
            });
          } else {
            await InvestigationData.create({
              generatedId: arr?.generatedId,
              name: arr?.name,
              room: arr?.room,
              admissionDate: arr?.admissionDate,
              isNewAdmission: arr?.isNewAdmission,
              risks: arr?.risks,
              included: arr?.included,
              surveyId: surveyId,
              investigations: arr?.investigations,
              bodyMapObservations: arr?.bodyMapObservations,
              weightCalculatorData: arr?.weightCalculatorData,
              teamMemberUserId: arr?.teamMemberUserId
                ? arr?.teamMemberUserId
                : null,
              generalSurveyorNotes: arr?.generalSurveyorNotes,
              createdBy: req.user._id,
              updatedBy: req.user._id,
            });
          }
        } else {
          await InvestigationData.create({
            generatedId: arr?.generatedId,
            name: arr?.name,
            room: arr?.room,
            admissionDate: arr?.admissionDate,
            isNewAdmission: arr?.isNewAdmission,
            risks: arr?.risks,
            included: arr?.included,
            surveyId: surveyId,
            investigations: arr?.investigations,
            bodyMapObservations: arr?.bodyMapObservations,
            weightCalculatorData: arr?.weightCalculatorData,
            teamMemberUserId: arr?.teamMemberUserId
              ? arr?.teamMemberUserId
              : null,
            generalSurveyorNotes: arr?.generalSurveyorNotes,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          });
        }
      }),
    );

    // 1️⃣ Extract unique team member IDs safely
    const uniqueTeamMemberIds = [
      ...new Set(
        residents
          .map((r) => r?.teamMemberUserId?._id || r?.teamMemberUserId)
          .filter(Boolean)
          .map(String),
      ),
    ];

    // 2️⃣ Send emails only if there are team members assigned
    if (uniqueTeamMemberIds.length > 0) {
      // Fetch users in bulk
      const users = await User.find({
        _id: { $in: uniqueTeamMemberIds },
      }).lean();

      const usersById = new Map(users.map((u) => [u._id.toString(), u]));

      // Fetch existing FinalSample entries in bulk
      const existingSamples = await InvestigationData.find({
        surveyId,
        teamMemberUserId: { $in: uniqueTeamMemberIds },
      }).lean();

      const existingUserIds = new Set(
        existingSamples.map((s) => s.teamMemberUserId.toString()),
      );

      // Send emails only when needed
      await Promise.all(
        uniqueTeamMemberIds.map(async (userId) => {
          if (existingUserIds.has(userId)) return;

          const user = usersById.get(userId);
          if (!user?.email) return;

          const subject = "MockSurvey365 Survey Update";
          const message = `Hi ${user.firstName || ""} ${user.lastName || ""}, 
there is a new update on the Survey ${surveyInfo.surveyCategory}.`;

          const fileUrl = `${CONSTANTS.CP_URL}surveys`;

          await sendEmail(
            user.email,
            subject,
            requestEmailHtml({ subject, message, fileUrl }),
          );
        }),
      );
    }

    await SurveyLog.create({
      activity: `Creating or Updating Investigation by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Investigation Created/Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Save/Update Investigation Residents by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during saving investigation residents: ${errorMsg}`,
    });
  }
};

// view investigations
const viewInvestigations = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select(
        "_id surveyCreationDate status census initialPool finalSample createdBy createdAt",
      )
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";
    let investigate;

    if (surveyData.createdBy._id.equals(userId)) {
      accessType = "CREATOR";

      investigate = await InvestigationData.find({ surveyId })
        .select(
          "_id generatedId name room admissionDate isNewAdmission risks included teamMemberUserId generalSurveyorNotes surveyId investigations bodyMapObservations weightCalculatorData createdAt",
        )
        .populate(
          "teamMemberUserId",
          "_id firstName lastName email organization",
        )
        .sort({ createdAt: -1 });
    } else {
      const isTeamMember = await TeamMember.exists({
        surveyId,
        teamMemberUserId: userId,
      });

      if (isTeamMember) {
        accessType = "TEAM_MEMBER";
      }

      investigate = await InvestigationData.find({
        surveyId,
        teamMemberUserId: req.user?._id,
      })
        .select(
          "_id generatedId name room admissionDate isNewAdmission risks included teamMemberUserId generalSurveyorNotes surveyId investigations bodyMapObservations weightCalculatorData createdAt",
        )
        .populate(
          "teamMemberUserId",
          "_id firstName lastName email organization",
        )
        .sort({ createdAt: -1 });
    }

    await SurveyLog.create({
      activity: `View Investigation data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Investigation Data viewed successfully.",
      data: {
        accessType, // ✅ added here
        surveyData,
        investigate,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Investigation data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing survey: ${errorMsg}`,
    });
  }
};

// team member update investigations
const saveTeamMemberInvestigations = async (req, res) => {
  try {
    const { error, value } = addTeamMemberInvestigations(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, residents } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    await Promise.all(
      residents.map(async (arr) => {
        let initId = await InvestigationData.findOne({
          surveyId: surveyId,
          generatedId: arr?.generatedId,
          teamMemberUserId: req.user?._id,
        });
        if (initId) {
          await InvestigationData.findByIdAndUpdate(initId?._id, {
            generatedId: arr?.generatedId,
            name: arr?.name,
            room: arr?.room,
            admissionDate: arr?.admissionDate,
            isNewAdmission: arr?.isNewAdmission,
            included: arr?.included,
            risks: arr?.risks,
            investigations: arr?.investigations,
            generalSurveyorNotes: arr?.generalSurveyorNotes,
            updatedBy: req.user._id,
          });
        }
      }),
    );

    await SurveyLog.create({
      activity: `Updating Investigation by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Investigation Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Updating Investigation by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during updating Investigation: ${errorMsg}`,
    });
  }
};

// view team member assigned facility task
const viewTeamMemberAssignedMandatoryTask = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select(
        "_id surveyCreationDate status census initialPool finalSample createdBy createdAt",
      )
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";
    const isTeamMember = await TeamMember.exists({
      surveyId,
      teamMemberUserId: userId,
    });

    if (isTeamMember) {
      accessType = "TEAM_MEMBER";
    }

    const assignedFacility = await AssignedFacility.find({
      surveyId,
      teamMemberUserId: req.user?._id,
    })
      .select("mandatorytaskId surveyId teamMemberId teamMemberUserId")
      .populate(
        "mandatorytaskId",
        "_id title version_date source_citation desc categories",
      )
      .populate(
        "teamMemberId",
        "_id name email phone specialization teamCoordinator invited teamMemberUserId role surveyId",
      )
      .sort({ createdAt: -1 });

    await SurveyLog.create({
      activity: `View Team Member Assigned Mandatory Task data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Team Member Assigned Mandatory Task Data viewed successfully.",
      data: {
        accessType, // ✅ added here
        surveyData,
        assignedFacility,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Team Member Assigned Mandatory Task data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing survey: ${errorMsg}`,
    });
  }
};

// save mandatory facility task
const saveMandatoryAndUpdate = async (req, res) => {
  try {
    const { error, value } = addMandatoryFacilityTask(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, status, facilityTasks } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator =
      surveyInfo.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }
    // saving and updating at the same time
    // update survey status
    await Survey.findByIdAndUpdate(surveyId, {
      status,
      updatedBy: req.user._id,
    });

    await Promise.all(
      facilityTasks.map(async (arr) => {
        if (arr?.facilityTaskId) {
          let facility = await FacilityMandatoryTask.findOne({
            surveyId: surveyId,
            _id: arr?.facilityTaskId,
          });
          if (facility) {
            await FacilityMandatoryTask.findByIdAndUpdate(facility?._id, {
              mandatorytaskId: arr?.mandatorytaskId,
              mandatorytaskTitle: arr?.mandatorytaskTitle,
              mandatorytaskDescription: arr?.mandatorytaskDescription,
              probe: arr?.probe,
              status: arr?.status,
              fTag: arr?.fTag,
              citation: arr?.citation,
              surveyId: surveyId,
              compliant: arr?.compliant,
              explanation: arr?.explanation,
              citationNote: arr?.citationNote,
              timestamp: arr?.timestamp,
              aiAnalyzed: arr?.aiAnalyzed,
              originalFTag: arr?.originalFTag,
              note: arr?.note,
              observation: arr?.observation,
              teamMemberUserId: arr?.teamMemberUserId
                ? arr?.teamMemberUserId
                : null,
              updatedBy: req.user._id,
            });
          } else {
            await FacilityMandatoryTask.create({
              mandatorytaskId: arr?.mandatorytaskId,
              mandatorytaskTitle: arr?.mandatorytaskTitle,
              mandatorytaskDescription: arr?.mandatorytaskDescription,
              probe: arr?.probe,
              status: arr?.status,
              fTag: arr?.fTag,
              citation: arr?.citation,
              surveyId: surveyId,
              compliant: arr?.compliant,
              explanation: arr?.explanation,
              citationNote: arr?.citationNote,
              timestamp: arr?.timestamp,
              aiAnalyzed: arr?.aiAnalyzed,
              originalFTag: arr?.originalFTag,
              note: arr?.note,
              observation: arr?.observation,
              teamMemberUserId: arr?.teamMemberUserId
                ? arr?.teamMemberUserId
                : null,
              createdBy: req.user._id,
              updatedBy: req.user._id,
            });
          }
        } else {
          await FacilityMandatoryTask.create({
            mandatorytaskId: arr?.mandatorytaskId,
            mandatorytaskTitle: arr?.mandatorytaskTitle,
            mandatorytaskDescription: arr?.mandatorytaskDescription,
            probe: arr?.probe,
            status: arr?.status,
            fTag: arr?.fTag,
            citation: arr?.citation,
            surveyId: surveyId,
            compliant: arr?.compliant,
            explanation: arr?.explanation,
            citationNote: arr?.citationNote,
            timestamp: arr?.timestamp,
            aiAnalyzed: arr?.aiAnalyzed,
            originalFTag: arr?.originalFTag,
            note: arr?.note,
            observation: arr?.observation,
            teamMemberUserId: arr?.teamMemberUserId
              ? arr?.teamMemberUserId
              : null,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          });
        }
      }),
    );

    // 1️⃣ Extract unique team member IDs safely
    const uniqueTeamMemberIds = [
      ...new Set(
        facilityTasks
          .map((r) => r?.teamMemberUserId?._id || r?.teamMemberUserId)
          .filter(Boolean)
          .map(String),
      ),
    ];

    // 2️⃣ Send emails only if there are team members assigned
    if (uniqueTeamMemberIds.length > 0) {
      // Fetch users in bulk
      const users = await User.find({
        _id: { $in: uniqueTeamMemberIds },
      }).lean();

      const usersById = new Map(users.map((u) => [u._id.toString(), u]));

      // Fetch existing FacilityMandatoryTask entries in bulk
      const existingSamples = await FacilityMandatoryTask.find({
        surveyId,
        teamMemberUserId: { $in: uniqueTeamMemberIds },
      }).lean();

      const existingUserIds = new Set(
        existingSamples.map((s) => s.teamMemberUserId.toString()),
      );

      // Send emails only when needed
      await Promise.all(
        uniqueTeamMemberIds.map(async (userId) => {
          if (existingUserIds.has(userId)) return;

          const user = usersById.get(userId);
          if (!user?.email) return;

          const subject = "MockSurvey365 Survey Update";
          const message = `Hi ${user.firstName || ""} ${user.lastName || ""}, 
there is a new update on the Survey ${surveyInfo.surveyCategory}.`;

          const fileUrl = `${CONSTANTS.CP_URL}surveys`;

          await sendEmail(
            user.email,
            subject,
            requestEmailHtml({ subject, message, fileUrl }),
          );
        }),
      );
    }

    await SurveyLog.create({
      activity: `Creating or Updating Facility Mandatory Task by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Facility Mandatory Task Created/Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Creating or Updating Facility Mandatory Task by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error creating or updating facility mandatory task: ${errorMsg}`,
    });
  }
};

// view mandatory facility task
const viewMandatoryFacilityTask = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select(
        "_id surveyCreationDate status census initialPool finalSample createdBy createdAt",
      )
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";
    let facilityTask;

    if (surveyData.createdBy._id.equals(userId)) {
      accessType = "CREATOR";

      facilityTask = await FacilityMandatoryTask.find({ surveyId })
        .select(
          "_id mandatorytaskId mandatorytaskTitle mandatorytaskDescription probe status fTag citation compliant surveyId explanation citationNote timestamp aiAnalyzed originalFTag note teamMemberUserId observation createdAt",
        )
        .populate(
          "mandatorytaskId",
          "_id title version_date source_citation desc",
        )
        .populate(
          "teamMemberUserId",
          "_id firstName lastName email organization",
        )
        .sort({ createdAt: -1 });
    } else {
      const isTeamMember = await TeamMember.exists({
        surveyId,
        teamMemberUserId: userId,
      });

      if (isTeamMember) {
        accessType = "TEAM_MEMBER";
      }

      facilityTask = await FacilityMandatoryTask.find({
        surveyId,
        teamMemberUserId: req.user?._id,
      })
        .select(
          "_id mandatorytaskId mandatorytaskTitle mandatorytaskDescription probe status fTag citation compliant surveyId explanation citationNote timestamp aiAnalyzed originalFTag note teamMemberUserId observation createdAt",
        )
        .populate(
          "mandatorytaskId",
          "_id title version_date source_citation desc",
        )
        .populate(
          "teamMemberUserId",
          "_id firstName lastName email organization",
        )
        .sort({ createdAt: -1 });
    }

    await SurveyLog.create({
      activity: `View Facility Task data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Facility Task Data viewed successfully.",
      data: {
        accessType, // ✅ added here
        surveyData,
        facilityTask,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Facility Task data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing survey: ${errorMsg}`,
    });
  }
};

// save or update team member mandatory facility task
const saveTeamMemberMandatoryFacilityTask = async (req, res) => {
  try {
    const { error, value } = addTeamMemberMandatoryFacilityTask(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, facilityTasks } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    await Promise.all(
      facilityTasks.map(async (arr) => {
        let initId = await FacilityMandatoryTask.findOne({
          surveyId: surveyId,
          _id: arr?.facilityTaskId,
          teamMemberUserId: req.user?._id,
        });
        if (initId) {
          await FacilityMandatoryTask.findByIdAndUpdate(initId?._id, {
            mandatorytaskId: arr?.mandatorytaskId,
            mandatorytaskTitle: arr?.mandatorytaskTitle,
            mandatorytaskDescription: arr?.mandatorytaskDescription,
            probe: arr?.probe,
            status: arr?.status,
            fTag: arr?.fTag,
            citation: arr?.citation,
            surveyId: surveyId,
            compliant: arr?.compliant,
            explanation: arr?.explanation,
            citationNote: arr?.citationNote,
            timestamp: arr?.timestamp,
            aiAnalyzed: arr?.aiAnalyzed,
            originalFTag: arr?.originalFTag,
            note: arr?.note,
            observation: arr?.observation,
            teamMemberUserId: req.user._id,
            updatedBy: req.user._id,
          });
        } else {
          await FacilityMandatoryTask.create({
            mandatorytaskId: arr?.mandatorytaskId,
            mandatorytaskTitle: arr?.mandatorytaskTitle,
            mandatorytaskDescription: arr?.mandatorytaskDescription,
            probe: arr?.probe,
            status: arr?.status,
            fTag: arr?.fTag,
            citation: arr?.citation,
            surveyId: surveyId,
            compliant: arr?.compliant,
            explanation: arr?.explanation,
            citationNote: arr?.citationNote,
            timestamp: arr?.timestamp,
            aiAnalyzed: arr?.aiAnalyzed,
            originalFTag: arr?.originalFTag,
            note: arr?.note,
            observation: arr?.observation,
            teamMemberUserId: req.user._id,
            createdBy: req.user._id,
            updatedBy: req.user._id,
          });
        }
      }),
    );

    await SurveyLog.create({
      activity: `Updating Facility Mandatory Task by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Facility Mandatory Task Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Updating Facility Mandatory Task by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during updating Facility Mandatory Task: ${errorMsg}`,
    });
  }
};

// save team meeting or update
const saveUpdateTeamMeeting = async (req, res) => {
  try {
    const { error, value } = addTeamMeeting(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      surveyId,
      status,
      ethicsComplianceConcerns,
      dailyMeetingAgenda,
      teamDeterminations,
      openingStatements,
      investigations,
      dailyMeetings,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator =
      surveyInfo.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }
    // saving and updating at the same time
    // update survey status
    await Survey.findByIdAndUpdate(surveyId, {
      status,
      updatedBy: req.user._id,
    });

    let teamMeeting = await TeamMeeting.findOne({
      surveyId: surveyId,
    });

    if (teamMeeting) {
      await TeamMeeting.findByIdAndUpdate(teamMeeting?._id, {
        ethicsComplianceConcerns: ethicsComplianceConcerns,
        dailyMeetingAgenda: dailyMeetingAgenda,
        teamDeterminations: teamDeterminations,
        openingStatements: openingStatements,
        investigations: investigations,
        dailyMeetings: dailyMeetings,
        surveyId: surveyId,
        updatedBy: req.user._id,
      });
    } else {
      await TeamMeeting.create({
        ethicsComplianceConcerns: ethicsComplianceConcerns,
        dailyMeetingAgenda: dailyMeetingAgenda,
        teamDeterminations: teamDeterminations,
        openingStatements: openingStatements,
        investigations: investigations,
        dailyMeetings: dailyMeetings,
        surveyId: surveyId,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });
    }

    await SurveyLog.create({
      activity: `Creating or Updating Team Meeting by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Team Meeting Created/Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Creating or Updating Team Meeting by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error creating or updating team meeting: ${errorMsg}`,
    });
  }
};

// team member save team meeting or update
const saveUpdateTeamMemberTeamMeeting = async (req, res) => {
  try {
    const { error, value } = addMemberTeamMeeting(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, teamDeterminations, investigations } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    if (!teamMember) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only a team member can do this.",
      });
    }

    let teamMeeting = await TeamMeeting.findOne({
      surveyId: surveyId,
    });

    if (teamMeeting) {
      await TeamMeeting.findByIdAndUpdate(teamMeeting?._id, {
        teamDeterminations: teamDeterminations,
        investigations: investigations,
        surveyId: surveyId,
        updatedBy: req.user._id,
      });
    } else {
      await TeamMeeting.create({
        teamDeterminations: teamDeterminations,
        investigations: investigations,
        surveyId: surveyId,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });
    }

    await SurveyLog.create({
      activity: `Creating or Updating Team Meeting by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Team Meeting Created/Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Creating or Updating Team Meeting by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error creating or updating team meeting: ${errorMsg}`,
    });
  }
};

// view teammeeting
const viewTeamMeeting = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select(
        "_id surveyCreationDate status census initialPool finalSample createdBy createdAt",
      )
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";
    let teammeeting;

    if (surveyData.createdBy._id.equals(userId)) {
      accessType = "CREATOR";

      teammeeting = await TeamMeeting.find({ surveyId })
        .select(
          "_id ethicsComplianceConcerns dailyMeetingAgenda teamDeterminations openingStatements investigations dailyMeetings surveyId createdAt",
        )
        .sort({ createdAt: -1 });
    } else {
      const isTeamMember = await TeamMember.exists({
        surveyId,
        teamMemberUserId: userId,
      });

      if (isTeamMember) {
        accessType = "TEAM_MEMBER";
      }

      teammeeting = await TeamMeeting.find({
        surveyId,
        createdBy: userId,
      })
        .select(
          "_id ethicsComplianceConcerns dailyMeetingAgenda teamDeterminations openingStatements investigations dailyMeetings surveyId createdAt",
        )
        .sort({ createdAt: -1 });
    }

    await SurveyLog.create({
      activity: `View Team Meeting data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Team Meeting Data viewed successfully.",
      data: {
        accessType, // ✅ added here
        surveyData,
        teammeeting,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Team Meeting data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing Team Meeting: ${errorMsg}`,
    });
  }
};

// save and update closure
const saveUpdateClosure = async (req, res) => {
  try {
    const { error, value } = addClosure(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      surveyId,
      status,
      surveyClosed,
      closureNotes,
      closureSignature,
      surveyCompleted,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator =
      surveyInfo.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }
    // saving and updating at the same time
    // update survey status
    await Survey.findByIdAndUpdate(surveyId, {
      status,
      updatedBy: req.user._id,
    });

    let closing = await Closure.findOne({
      surveyId: surveyId,
    });

    if (closing) {
      await Closure.findByIdAndUpdate(closing?._id, {
        surveyClosed: surveyClosed,
        closureNotes: closureNotes,
        closureSignature: closureSignature,
        surveyCompleted: surveyCompleted,
        surveyId: surveyId,
        updatedBy: req.user._id,
      });
    } else {
      await Closure.create({
        surveyClosed: surveyClosed,
        closureNotes: closureNotes,
        closureSignature: closureSignature,
        surveyCompleted: surveyCompleted,
        surveyId: surveyId,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });
    }

    await SurveyLog.create({
      activity: `Creating or Updating Closure by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Closure Created/Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Creating or Updating Closure by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error creating or updating closure: ${errorMsg}`,
    });
  }
};

// view closure
const viewClosure = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select(
        "_id surveyCreationDate status census initialPool finalSample createdBy createdAt",
      )
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";
    let closing;

    if (surveyData.createdBy._id.equals(userId)) {
      accessType = "CREATOR";

      closing = await Closure.find({ surveyId })
        .select(
          "_id surveyClosed closureNotes closureSignature surveyCompleted surveyId createdAt",
        )
        .sort({ createdAt: -1 });
    } else {
      const isTeamMember = await TeamMember.exists({
        surveyId,
        teamMemberUserId: userId,
      });

      if (isTeamMember) {
        accessType = "TEAM_MEMBER";
      }

      closing = await Closure.find({ surveyId })
        .select(
          "_id surveyClosed closureNotes closureSignature surveyCompleted surveyId createdAt",
        )
        .sort({ createdAt: -1 });
    }

    await SurveyLog.create({
      activity: `View Closure data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Closure Data viewed successfully.",
      data: {
        accessType, // ✅ added here
        surveyData,
        closing,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Team Meeting data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing Team Meeting: ${errorMsg}`,
    });
  }
};

// save and update exist conference
const saveUpdateExistConference = async (req, res) => {
  try {
    const { error, value } = addExistConference(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { surveyId, status, exitDate, exitTime, exitConference } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator =
      surveyInfo.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }
    // saving and updating at the same time
    // update survey status
    await Survey.findByIdAndUpdate(surveyId, {
      status,
      updatedBy: req.user._id,
    });

    let existConference = await ExistConference.findOne({
      surveyId: surveyId,
    });

    if (existConference) {
      await ExistConference.findByIdAndUpdate(existConference?._id, {
        exitDate: exitDate,
        exitTime: exitTime,
        exitConference: exitConference,
        surveyId: surveyId,
        updatedBy: req.user._id,
      });
    } else {
      await ExistConference.create({
        exitDate: exitDate,
        exitTime: exitTime,
        exitConference: exitConference,
        surveyId: surveyId,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });
    }

    await SurveyLog.create({
      activity: `Creating or Updating Exist Conference by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Exist Conference Created/Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Creating or Updating Exist Conference by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error creating or updating exist conference: ${errorMsg}`,
    });
  }
};

// view exist conference
const viewExistConference = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select(
        "_id surveyCreationDate status census initialPool finalSample createdBy createdAt",
      )
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";
    let existConference;

    if (surveyData.createdBy._id.equals(userId)) {
      accessType = "CREATOR";

      existConference = await ExistConference.find({ surveyId })
        .select("_id exitDate exitTime exitConference surveyId createdAt")
        .sort({ createdAt: -1 });
    } else {
      const isTeamMember = await TeamMember.exists({
        surveyId,
        teamMemberUserId: userId,
      });

      if (isTeamMember) {
        accessType = "TEAM_MEMBER";
      }

      existConference = await ExistConference.find({ surveyId })
        .select("_id exitDate exitTime exitConference surveyId createdAt")
        .sort({ createdAt: -1 });
    }

    await SurveyLog.create({
      activity: `View Exist Conference data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Exist Conference Data viewed successfully.",
      data: {
        accessType, // ✅ added here
        surveyData,
        existConference,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Exist Conference data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing Exist Conference: ${errorMsg}`,
    });
  }
};

// citation report
const saveUpdateCitationReport = async (req, res) => {
  try {
    const { error, value } = addCitationReport(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      surveyId,
      status,
      totalFTags,
      totalFindings,
      surveyData,
      professionalFindings,
      citationReportGenerated,
      disclaimer,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const surveyInfo = await Survey.findById(surveyId);
    if (!surveyInfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Survey not found",
      });
    }

    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator =
      surveyInfo.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }
    // saving and updating at the same time
    // update survey status
    await Survey.findByIdAndUpdate(surveyId, {
      status,
      updatedBy: req.user._id,
    });

    let citationReport = await CitationReport.findOne({
      surveyId: surveyId,
    });

    if (citationReport) {
      await CitationReport.findByIdAndUpdate(citationReport?._id, {
        totalFTags: totalFTags,
        totalFindings: totalFindings,
        surveyData: surveyData,
        professionalFindings: professionalFindings,
        citationReportGenerated: citationReportGenerated,
        disclaimer: disclaimer,
        surveyId: surveyId,
        updatedBy: req.user._id,
      });
    } else {
      await CitationReport.create({
        totalFTags: totalFTags,
        totalFindings: totalFindings,
        surveyData: surveyData,
        professionalFindings: professionalFindings,
        citationReportGenerated: citationReportGenerated,
        disclaimer: disclaimer,
        surveyId: surveyId,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });
    }

    await SurveyLog.create({
      activity: `Creating or Updating Citation Report by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Citation Report Created/Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Creating or Updating Citation Report by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error creating or updating Citation Report: ${errorMsg}`,
    });
  }
};

// view citation report
const viewCitationReport = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select(
        "_id surveyCreationDate status census initialPool finalSample createdBy createdAt",
      )
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";
    let citationReport;

    if (surveyData.createdBy._id.equals(userId)) {
      accessType = "CREATOR";

      citationReport = await CitationReport.find({ surveyId })
        .select(
          "_id totalFTags totalFindings surveyData professionalFindings citationReportGenerated surveyId disclaimer createdAt",
        )
        .sort({ createdAt: -1 });
    } else {
      const isTeamMember = await TeamMember.exists({
        surveyId,
        teamMemberUserId: userId,
      });

      if (isTeamMember) {
        accessType = "TEAM_MEMBER";
      }

      citationReport = await CitationReport.find({ surveyId })
        .select(
          "_id totalFTags totalFindings surveyData professionalFindings citationReportGenerated surveyId disclaimer createdAt",
        )
        .sort({ createdAt: -1 });
    }

    await SurveyLog.create({
      activity: `View Citation Report data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Citation Report Data viewed successfully.",
      data: {
        accessType, // ✅ added here
        surveyData,
        citationReport,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Citation Report data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing Citation Report: ${errorMsg}`,
    });
  }
};

// save or update plan of corrections
const saveUpdatePlanOfCorrections = async (req, res) => {
  try {
    const { error, value } = addUpdatePlanCorrection(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      surveyId,
      status,
      summary,
      plansOfCorrection,
      education,
      disclaimer,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    if (surveyId) {
      const surveyInfo = await Survey.findById(surveyId);
      if (!surveyInfo) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          message: "Survey not found",
        });
      }

      const teamMember = await TeamMember.findOne({
        surveyId,
        teamMemberUserId: req.user._id,
      });

      const isCreator =
        surveyInfo.createdBy.toString() === req.user._id.toString();

      const isTeamCoordinator =
        teamMember && teamMember.teamCoordinator === true;

      if (!isCreator && !isTeamCoordinator) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          message:
            "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
        });
      }
      // saving and updating at the same time
      // update survey status
      await Survey.findByIdAndUpdate(surveyId, {
        status,
        updatedBy: req.user._id,
      });

      let planOfCorrection = await PlanOfCorrection.findOne({
        surveyId: surveyId,
      });

      if (planOfCorrection) {
        await PlanOfCorrection.findByIdAndUpdate(planOfCorrection?._id, {
          summary: summary,
          plansOfCorrection: plansOfCorrection,
          surveyId: surveyId,
          education: education,
          disclaimer: disclaimer,
          updatedBy: req.user._id,
        });
      } else {
        await PlanOfCorrection.create({
          summary: summary,
          plansOfCorrection: plansOfCorrection,
          surveyId: surveyId,
          education: education,
          disclaimer: disclaimer,
          createdBy: req.user._id,
          updatedBy: req.user._id,
        });
      }
    } else {
      await PlanOfCorrection.create({
        summary: summary,
        plansOfCorrection: plansOfCorrection,
        education: education,
        disclaimer: disclaimer,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });
    }

    await SurveyLog.create({
      activity: `Creating or Updating Plan of Corrections by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Plan of Corrections Created/Updated Successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Creating or Updating Plan of Corrections by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error creating or updating Plan of Corrections: ${errorMsg}`,
    });
  }
};

// view plan of corrections
const viewPlanOfCorrections = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById(surveyId)
      .select(
        "_id surveyCreationDate status census initialPool finalSample disclaimer createdBy createdAt",
      )
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    /* -------------------- Determine accessType -------------------- */
    let accessType = "NONE";
    let corrections;

    if (surveyData.createdBy._id.equals(userId)) {
      accessType = "CREATOR";

      corrections = await PlanOfCorrection.find({ surveyId })
        .select(
          "_id summary plansOfCorrection surveyId education  disclaimer createdAt",
        )
        .sort({ createdAt: -1 });
    } else {
      const isTeamMember = await TeamMember.exists({
        surveyId,
        teamMemberUserId: userId,
      });

      if (isTeamMember) {
        accessType = "TEAM_MEMBER";
      }

      corrections = await PlanOfCorrection.find({ surveyId })
        .select(
          "_id summary plansOfCorrection surveyId education disclaimer createdAt",
        )
        .sort({ createdAt: -1 });
    }

    await SurveyLog.create({
      activity: `View Plan of Corrections data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Plan of Corrections Data viewed successfully.",
      data: {
        accessType, // ✅ added here
        surveyData,
        corrections,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Plan of Corrections data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing Plan of Corrections: ${errorMsg}`,
    });
  }
};

// my plan of corrections
const myPlanOfCorrections = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const userId = req.user._id;

    /* -------------------- Survey Filters -------------------- */
    const surveyFilter = {};

    if (startDate || endDate) {
      surveyFilter.createdAt = {};
      if (startDate) surveyFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        surveyFilter.createdAt.$lte = end;
      }
    }

    /* -------------------- Surveys where user is invited -------------------- */
    const invitedSurveyIds = await TeamMember.find({
      teamMemberUserId: userId,
    }).distinct("surveyId");

    /* -------------------- Final Query -------------------- */
    const finalQuery = {
      ...surveyFilter,
      $or: [
        { createdBy: userId }, // creator
        { surveyId: { $in: invitedSurveyIds } }, // team member
      ],
    };

    /* -------------------- Pagination -------------------- */
    const total = await PlanOfCorrection.countDocuments(finalQuery);
    const totalPages = Math.ceil(total / parseInt(limit));

    let surveyData = await PlanOfCorrection.find(finalQuery)
      .select(
        "_id summary plansOfCorrection surveyId education disclaimer createdAt createdBy",
      )
      .populate("createdBy", "_id firstName lastName email organization")
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    surveyData = surveyData.map((survey) => ({
      ...survey.toObject(),
      accessType: survey.createdBy._id.equals(userId)
        ? "CREATOR"
        : "TEAM_MEMBER",
    }));

    /* -------------------- Log -------------------- */
    const user = await User.findById(userId);
    await SurveyLog.create({
      activity: `Plan Of Correction list fetched by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Plan Of Correction fetched successfully.",
      data: {
        planofcorrection: surveyData,
        pagination: {
          total,
          totalPages,
          limit: parseInt(limit),
          currentPage: parseInt(page),
        },
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    await SurveyLog.create({
      activity: "Plan Of Correction list fetch failed",
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `Error fetching Plan Of Correction: ${errorMsg}`,
    });
  }
};
const viewMYPlanOfCorrections = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const planData = await PlanOfCorrection.findById(surveyId)
      .select(
        "_id summary plansOfCorrection surveyId education disclaimer createdAt createdBy",
      )
      .populate("createdBy", "_id firstName lastName email organization");

    if (!planData) {
      return res.status(400).json({
        status: false,
        message: "Plan of Correction not found",
      });
    }

    await SurveyLog.create({
      activity: `View Plan of Corrections data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Plan of Corrections Data viewed successfully.",
      data: planData,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Plan of Corrections data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing Plan of Corrections: ${errorMsg}`,
    });
  }
};

// view team member under a survey
const viewTeamMemberInSurvey = async (req, res) => {
  try {
    const surveyId = req.params.id;
    const userId = req.user._id;

    const surveyData = await Survey.findById({ _id: surveyId })
      .select(
        "_id surveyCreationDate status census initialPool finalSample createdBy createdAt",
      )
      .populate("createdBy", "_id firstName lastName email organization");

    if (!surveyData) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    const teamMembers = await TeamMember.find({
      surveyId: surveyId,
    })
      .select(
        "_id name email phone specialization teamCoordinator invited teamMemberUserId role surveyId",
      )
      .populate("teamMemberUserId", "_id firstName lastName email")
      .sort({ createdAt: -1 });

    const teamMemberUserIds = teamMembers
      .map((tm) => tm.teamMemberUserId?._id)
      .filter(Boolean);

    const assignedResidents = await InitialPool.find({
      surveyId: surveyId,
      teamMemberUserId: { $in: teamMemberUserIds },
    }).select("_id teamMemberUserId generatedId name room updatedAt");

    const residentsByTeamMemberUserId = assignedResidents.reduce(
      (acc, resident) => {
        const key = resident.teamMemberUserId?.toString();
        if (!key) return acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          residentId: resident._id,
          generatedId: resident.generatedId,
          name: resident.name,
          room: resident.room,
          assignedAt: resident.updatedAt,
        });
        return acc;
      },
      {},
    );

    const responseData = teamMembers.map((tm) => {
      const tmUserId = tm.teamMemberUserId?._id?.toString();
      return {
        teamMemberId: tm._id,
        teamMemberUserId: tm.teamMemberUserId?._id || tm.teamMemberUserId,
        firstName: tm.teamMemberUserId?.firstName || "",
        lastName: tm.teamMemberUserId?.lastName || "",
        email: tm.teamMemberUserId?.email || tm.email || "",
        assignedResidents: tmUserId
          ? residentsByTeamMemberUserId[tmUserId] || []
          : [],
      };
    });

    await SurveyLog.create({
      activity: `View Team Member data`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Team Member Data viewed successfully.",
      data: responseData,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Team Member data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing Team Member: ${errorMsg}`,
    });
  }
};
// delete survey
const removeSurvey = async (req, res) => {
  try {
    let surveyId = req.params.id;
    let userId = req.user._id;
    let survey = await Survey.findById(surveyId);
    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: userId,
    });

    const isCreator = survey.createdBy.toString() === userId.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }

    await Survey.findByIdAndDelete(surveyId);
    await FinalSample.deleteMany({
      surveyId: surveyId,
    });
    await ResidentEntrance.deleteMany({
      surveyId: surveyId,
    });
    await TeamMember.deleteMany({
      surveyId: surveyId,
    });
    await AssignedFacility.deleteMany({
      surveyId: surveyId,
    });
    await PreSurveyRequirement.deleteMany({
      surveyId: surveyId,
    });
    await OffSiteCheckList.deleteMany({
      surveyId: surveyId,
    });
    await FacilityEntrance.deleteMany({
      surveyId: surveyId,
    });
    await InitialPool.deleteMany({
      surveyId: surveyId,
    });
    await InitialAssessmentEntrance.deleteMany({
      surveyId: surveyId,
    });
    await InvestigationData.deleteMany({
      surveyId: surveyId,
    });
    await FacilityMandatoryTask.deleteMany({
      surveyId: surveyId,
    });
    await TeamMeeting.deleteMany({
      surveyId: surveyId,
    });
    await Closure.deleteMany({
      surveyId: surveyId,
    });
    await ExistConference.deleteMany({
      surveyId: surveyId,
    });
    await CitationReport.deleteMany({
      surveyId: surveyId,
    });
    await PlanOfCorrection.deleteMany({
      surveyId: surveyId,
    });

    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove Survey by ${users.firstName} ${users.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Survey removed successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove Survey by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during from removing survey: ${errorMsg}`,
    });
  }
};

// survey notes
const surveyNotes = async (req, res) => {
  try {
    let surveyId = req.params.id;
    let initialAssessments = await InitialAssessmentEntrance.find({
      surveyId: surveyId,
    }).select("_id type notes additionalComments");
    let initialPool = await InitialPool.find({ surveyId: surveyId })
      .select("_id generatedId name room risks notes teamMemberUserId")
      .populate(
        "teamMemberUserId",
        "_id firstName lastName email organization",
      );

    let investigation = await InvestigationData.find({ surveyId: surveyId })
      .select(
        "_id generatedId name room risks notes teamMemberUserId investigations",
      )
      .populate(
        "teamMemberUserId",
        "_id firstName lastName email organization",
      );

    let mandatoryFacilityTask = await FacilityMandatoryTask.find({
      surveyId: surveyId,
    })
      .select("_id ftag probe note observation teamMemberUserId")
      .populate(
        "teamMemberUserId",
        "_id firstName lastName email organization",
      );

    let closure = await Closure.find({ surveyId: surveyId }).select(
      "_id closureNotes closureSignature",
    );

    let notes = {
      initialAssessmentsNotes: initialAssessments,
      initialPoolNotes: initialPool,
      investigationNotes: investigation,
      facilityMandatoryTaskNotes: mandatoryFacilityTask,
      closureNotes: closure,
    };

    await SurveyLog.create({
      activity: `View Survey Notes data`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Survey notes retrieved successfully",
      data: notes,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Viewing Survey Notes data by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      message: `Error viewing Survey Notes: ${errorMsg}`,
    });
  }
};

// reports
const reports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const userId = req.user._id;

    /* -------------------- Survey Filters -------------------- */
    const surveyFilter = {};

    if (startDate || endDate) {
      surveyFilter.createdAt = {};
      if (startDate) surveyFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        surveyFilter.createdAt.$lte = end;
      }
    }

    /* -------------------- Surveys where user is invited -------------------- */
    const invitedSurveyIds = await TeamMember.find({
      teamMemberUserId: userId,
    }).distinct("surveyId");

    /* -------------------- Final Query -------------------- */
    const finalQuery = {
      ...surveyFilter,
      $or: [
        { createdBy: userId }, // creator
        { surveyId: { $in: invitedSurveyIds } }, // team member
      ],
    };

    let surveyData = await PlanOfCorrection.find(finalQuery)
      .select(
        "_id summary plansOfCorrection surveyId education disclaimer createdAt createdBy",
      )
      .populate("createdBy", "_id firstName lastName email organization")
      .sort({ createdAt: -1 });

    let citationData = await CitationReport.find(finalQuery)
      .select(
        "_id totalFTags totalFindings surveyData professionalFindings surveyId citationReportGenerated disclaimer createdAt createdBy",
      )
      .populate("createdBy", "_id firstName lastName email organization")
      .sort({ createdAt: -1 });

    surveyData = surveyData.map((survey) => ({
      ...survey.toObject(),
      accessType: survey.createdBy._id.equals(userId)
        ? "CREATOR"
        : "TEAM_MEMBER",
    }));

    /* -------------------- Log -------------------- */
    const user = await User.findById(userId);
    await SurveyLog.create({
      activity: `Report list fetched by ${user.firstName} ${user.lastName}`,
      action: "Success",
      createdBy: userId,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Report fetched successfully.",
      data: {
        planofcorrection: surveyData,
        citationreport: citationData,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    await SurveyLog.create({
      activity: "Report list fetch failed",
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `Error fetching Report: ${errorMsg}`,
    });
  }
};

// check if initial pool, final sample, investigation is generated for this survey
const checkSurvey = async (req, res) => {
  try {
    let surveyId = req.params.id;
    let userId = req.user._id;
    let survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(400).json({
        status: false,
        message: "Survey not found",
      });
    }

    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: userId,
    });

    const isCreator = survey.createdBy.toString() === userId.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }

    let initialpool = await InitialPool.find({
      surveyId: surveyId,
    });

    let finalSample = await FinalSample.find({
      surveyId: surveyId,
    });

    let investigation = await InvestigationData.find({
      surveyId: surveyId,
    });

    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Checking Survey State ${users.firstName} ${users.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Survey checked successfully.",
      data: {
        initialPool: initialpool.length > 0 ? true : false,
        finalSample: finalSample.length > 0 ? true : false,
        investigation: investigation.length > 0 ? true : false,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove Survey by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during from removing survey: ${errorMsg}`,
    });
  }
};

// remove plan of corrections
const removePlanOfCorrections = async (req, res) => {
  try {
    let planId = req.params.id;
    let userId = req.user._id;
    let plan = await PlanOfCorrection.findById(planId);

    const isCreator = plan.createdBy.toString() === userId.toString();

    if (!isCreator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the creator can do this.",
      });
    }

    await PlanOfCorrection.findByIdAndDelete(planId);
   

    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove Plan of Corrections by ${users.firstName} ${users.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Plan of Corrections removed successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove Plan of Corrections by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during from removing Plan of Corrections: ${errorMsg}`,
    });
  }
};


module.exports = {
  addSurveyFirstPageMain,
  removeTeamMember,
  mySurveys,
  viewSurveyFirstPage,
  updateSurveyFirstPageMain,
  removeAssignedFacilityToTeamMember,
  addSurveySecondPageMainOffSite,
  viewOffsitePresurvey,
  addSurveyThirdPageMainFacilityEntrance,
  viewFacilityEntrance,
  removeFacilityEntranceResident,
  saveInitialResidents,
  viewInitialPool,
  removeTeamMemberInitialPoolResident,
  saveInitialPoolTeamMemberResidents,
  checkTeamMemberAssignedResident,
  saveFinalSampleResidents,
  viewfinalSample,
  saveInvestigationResidents,
  viewInvestigations,
  saveTeamMemberInvestigations,
  viewTeamMemberAssignedMandatoryTask,
  saveMandatoryAndUpdate,
  viewMandatoryFacilityTask,
  saveTeamMemberMandatoryFacilityTask,
  saveUpdateTeamMeeting,
  viewTeamMeeting,
  saveUpdateClosure,
  viewClosure,
  saveUpdateExistConference,
  viewExistConference,
  saveUpdateCitationReport,
  viewCitationReport,
  saveUpdatePlanOfCorrections,
  viewPlanOfCorrections,
  myPlanOfCorrections,
  viewMYPlanOfCorrections,
  viewTeamMemberResidents,
  saveUpdateTeamMemberTeamMeeting,
  viewTeamMemberInSurvey,
  viewTeamMemberSurveyAccess,
  removeSurvey,
  surveyNotes,
  reports,
  dashboardMatrix,
  checkSurvey,
  removePlanOfCorrections
};
