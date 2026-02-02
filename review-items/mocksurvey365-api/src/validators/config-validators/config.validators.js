const Joi = require("joi");

const addCEValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().messages({
      "string.base": "name must be a string value",
      "any.required": "name is required",
    }),
    pdflink: Joi.string().required().messages({
      "string.base": "pdflink must be a string value",
      "any.required": "pdflink is required",
    }),
    type: Joi.string().required().messages({
      "string.base": "type must be a string value",
      "any.required": "type is required",
    }),
  });

  return schema.validate(data);
};

const updateCEValidation = (data) => {
  const schema = Joi.object({
    id: Joi.string().required().messages({
      "string.base": "id must be a string value",
      "any.required": "id is required",
    }),
    name: Joi.string().required().messages({
      "string.base": "name must be a string value",
      "any.required": "name is required",
    }),
    pdflink: Joi.string().required().messages({
      "string.base": "pdflink must be a string value",
      "any.required": "pdflink is required",
    }),
    type: Joi.string().required().messages({
      "string.base": "type must be a string value",
      "any.required": "type is required",
    }),
  });

  return schema.validate(data);
};

const addLongTermRegulationsValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().messages({
      "string.base": "name must be a string value",
      "any.required": "name is required",
    }),
    state: Joi.string().required().messages({
      "string.base": "state must be a string value",
      "any.required": "state is required",
    }),
    pdflink: Joi.string().required().messages({
      "string.base": "pdflink must be a string value",
      "any.required": "pdflink is required",
    }),
    date: Joi.date().required().messages({
      "date.base": "date must be a date value",
      "any.required": "date is required",
    }),
    description: Joi.string().allow(null, "").default(null),
  });

  return schema.validate(data);
};

const updateLongTermRegulationsValidation = (data) => {
  const schema = Joi.object({
    id: Joi.string().required().messages({
      "string.base": "id must be a string value",
      "any.required": "id is required",
    }),

    name: Joi.string().required().messages({
      "string.base": "name must be a string value",
      "any.required": "name is required",
    }),
    state: Joi.string().required().messages({
      "string.base": "state must be a string value",
      "any.required": "state is required",
    }),
    pdflink: Joi.string().required().messages({
      "string.base": "pdflink must be a string value",
      "any.required": "pdflink is required",
    }),
    date: Joi.date().required().messages({
      "date.base": "date must be a date value",
      "any.required": "date is required",
    }),
    description: Joi.string().allow(null, "").default(null),
  });

  return schema.validate(data);
};

const addFacilityTypesValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().messages({
      "string.base": "name must be a string value",
      "any.required": "name is required",
    }),
  });

  return schema.validate(data);
};

const addFacilityValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().allow(null, "").default(null),
    address: Joi.object({
      street: Joi.string().allow(null, "").default(null),
      city: Joi.string().allow(null, "").default(null),
      state: Joi.string().allow(null, "").default(null),
      zipCode: Joi.string().allow(null, "").default(null),
      country: Joi.string().allow(null, "").default(null),
    }).optional(),
    size: Joi.object({
      beds: Joi.number().allow(null, "").default(null),
      floors: Joi.number().allow(null, "").default(null),
    }).optional(),
    contact: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().allow(null, "").default(null),
          phone: Joi.string().allow(null, "").default(null),
          email: Joi.string().allow(null, "").default(null),
          role: Joi.string().allow(null, "").default(null),
        })
      )
      .optional()
      .default([]),
    secondaryContactPhone: Joi.string().allow(null, "").default(null),
    notes: Joi.string().allow(null, "").default(null),
    lastSurvey: Joi.date().allow(null, "").default(null),
    providerNumber: Joi.string().allow(null, "").default(null),

    CMS_Certification_Number_CCN: Joi.string().allow(null, "").default(null),
    Provider_Name: Joi.string().allow(null, "").default(null),
    Provider_Address: Joi.string().allow(null, "").default(null),
    City_Town: Joi.string().allow(null, "").default(null),
    State: Joi.string().allow(null, "").default(null),
    ZIP_Code: Joi.string().allow(null, "").default(null),
    Telephone_Number: Joi.string().allow(null, "").default(null),
    Provider_SSA_County_Code: Joi.string().allow(null, "").default(null),
    County_Parish: Joi.string().allow(null, "").default(null),
    Ownership_Type: Joi.string().allow(null, "").default(null),
    Number_of_Certified_Beds: Joi.string().allow(null, "").default(null),
    Average_Number_of_Residents_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Average_Number_of_Residents_per_Day_Footnote: Joi.string()
      .allow(null, "")
      .default(null),
    Provider_Type: Joi.string().allow(null, "").default(null),
    Provider_Resides_in_Hospital: Joi.string().allow(null, "").default(null),
    Legal_Business_Name: Joi.string().allow(null, "").default(null),
    Date_First_Approved_to_Provide_Medicare_and_Medicaid_Services: Joi.string()
      .allow(null, "")
      .default(null),
    Chain_Name: Joi.string().allow(null, "").default(null),
    Chain_ID: Joi.string().allow(null, "").default(null),
    Number_of_Facilities_in_Chain: Joi.string().allow(null, "").default(null),
    Chain_Average_Overall_5_star_Rating: Joi.string()
      .allow(null, "")
      .default(null),
    Chain_Average_Health_Inspection_Rating: Joi.string()
      .allow(null, "")
      .default(null),
    Chain_Average_Staffing_Rating: Joi.string().allow(null, "").default(null),
    Chain_Average_QM_Rating: Joi.string().allow(null, "").default(null),
    Continuing_Care_Retirement_Community: Joi.string()
      .allow(null, "")
      .default(null),
    Special_Focus_Status: Joi.string().allow(null, "").default(null),
    Abuse_Icon: Joi.string().allow(null, "").default(null),
    Most_Recent_Health_Inspection_More_Than_2_Years_Ago: Joi.string()
      .allow(null, "")
      .default(null),
    Provider_Changed_Ownership_in_Last_12_Months: Joi.string()
      .allow(null, "")
      .default(null),
    With_a_Resident_and_Family_Council: Joi.string()
      .allow(null, "")
      .default(null),
    Automatic_Sprinkler_Systems_in_All_Required_Areas: Joi.string()
      .allow(null, "")
      .default(null),
    Overall_Rating: Joi.string().allow(null, "").default(null),
    Overall_Rating_Footnote: Joi.string().allow(null, "").default(null),
    Health_Inspection_Rating: Joi.string().allow(null, "").default(null),
    Health_Inspection_Rating_Footnote: Joi.string()
      .allow(null, "")
      .default(null),
    QM_Rating: Joi.string().allow(null, "").default(null),
    QM_Rating_Footnote: Joi.string().allow(null, "").default(null),
    Long_Stay_QM_Rating: Joi.string().allow(null, "").default(null),
    Long_Stay_QM_Rating_Footnote: Joi.string().allow(null, "").default(null),
    Short_Stay_QM_Rating: Joi.string().allow(null, "").default(null),
    Short_Stay_QM_Rating_Footnote: Joi.string().allow(null, "").default(null),
    Staffing_Rating: Joi.string().allow(null, "").default(null),
    Staffing_Rating_Footnote: Joi.string().allow(null, "").default(null),
    Reported_Staffing_Footnote: Joi.string().allow(null, "").default(null),
    Physical_Therapist_Staffing_Footnote: Joi.string()
      .allow(null, "")
      .default(null),
    Reported_Nurse_Aide_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Reported_LPN_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Reported_RN_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Reported_Licensed_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Total_number_of_nurse_staff_hours_per_resident_per_day_on_the_weekend:
      Joi.string().allow(null, "").default(null),
    Registered_Nurse_hours_per_resident_per_day_on_the_weekend: Joi.string()
      .allow(null, "")
      .default(null),
    Reported_Physical_Therapist_Staffing_Hours_per_Resident_Per_Day:
      Joi.string().allow(null, "").default(null),
    Total_nursing_staff_turnover: Joi.string().allow(null, "").default(null),
    Total_nursing_staff_turnover_footnote: Joi.string()
      .allow(null, "")
      .default(null),
    Registered_Nurse_turnover: Joi.string().allow(null, "").default(null),
    Registered_Nurse_turnover_footnote: Joi.string()
      .allow(null, "")
      .default(null),
    Number_of_administrators_who_have_left_the_nursing_home: Joi.string()
      .allow(null, "")
      .default(null),
    Administrator_turnover_footnote: Joi.string().allow(null, "").default(null),
    Nursing_Case_Mix_Index: Joi.string().allow(null, "").default(null),
    Nursing_Case_Mix_Index_Ratio: Joi.string().allow(null, "").default(null),
    Case_Mix_Nurse_Aide_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Case_Mix_LPN_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Case_Mix_RN_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Case_Mix_Total_Nurse_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Case_Mix_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day:
      Joi.string().allow(null, "").default(null),
    Adjusted_Nurse_Aide_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Adjusted_LPN_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Adjusted_RN_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Adjusted_Total_Nurse_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Adjusted_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day:
      Joi.string().allow(null, "").default(null),
    Rating_Cycle_1_Standard_Survey_Health_Date: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_1_Total_Number_of_Health_Deficiencies: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_1_Number_of_Complaint_Health_Deficiencies: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_1_Health_Deficiency_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_1_Number_of_Health_Revisits: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_1_Health_Revisit_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_1_Total_Health_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_Standard_Health_Survey_Date: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_3_Total_Number_of_Health_Deficiencies: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_Number_of_Standard_Health_Deficiencies: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_3_Number_of_Complaint_Health_Deficiencies: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_3_Health_Deficiency_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_Number_of_Health_Revisits: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_3_Number_of_Health_Revisits: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_3_Health_Revisit_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_3_Total_Health_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Total_Weighted_Health_Survey_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Number_of_Facility_Reported_Incidents: Joi.string()
      .allow(null, "")
      .default(null),
    Number_of_Substantiated_Complaints: Joi.string()
      .allow(null, "")
      .default(null),
    Number_of_Citations_from_Infection_Control_Inspections: Joi.string()
      .allow(null, "")
      .default(null),
     Rating_Cycle_1_Number_of_Standard_Health_Deficiencies: Joi.string()
      .allow(null, "")
      .default(null),
    Number_of_Fines: Joi.string().allow(null, "").default(null),
    Total_Amount_of_Fines_in_Dollars: Joi.string()
      .allow(null, "")
      .default(null),
    Number_of_Payment_Denials: Joi.string().allow(null, "").default(null),
    Total_Number_of_Penalties: Joi.string().allow(null, "").default(null),
    Location: Joi.string().allow(null, "").default(null),
    Latitude: Joi.string().allow(null, "").default(null),
    Longitude: Joi.string().allow(null, "").default(null),
    Geocoding_Footnote: Joi.string().allow(null, "").default(null),
    Processing_Date: Joi.string().allow(null, "").default(null),
  });

  return schema.validate(data);
};

const updateFacilityValidation = (data) => {
  const schema = Joi.object({
    id: Joi.string().required().messages({
      "string.base": "id must be a string value",
      "any.required": "id is required",
    }),
    name: Joi.string().allow(null, "").default(null),

    address: Joi.object({
      street: Joi.string().allow(null, "").default(null),
      city: Joi.string().allow(null, "").default(null),
      state: Joi.string().allow(null, "").default(null),
      zipCode: Joi.string().allow(null, "").default(null),
      country: Joi.string().allow(null, "").default(null),
    }).optional(),
    size: Joi.object({
      beds: Joi.number().allow(null, "").default(null),
      floors: Joi.number().allow(null, "").default(null),
    }).optional(),

    contact: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().allow(null, "").default(null),
          phone: Joi.string().allow(null, "").default(null),
          email: Joi.string().allow(null, "").default(null),
          role: Joi.string().allow(null, "").default(null),
        })
      )
      .optional()
      .default([]),

    secondaryContactPhone: Joi.string().allow(null, "").default(null),
    notes: Joi.string().allow(null, "").default(null),
    contractStart: Joi.date().allow(null, "").default(null),
    monthlyFee: Joi.number().allow(null, "").default(null),
    lastSurvey: Joi.date().allow(null, "").default(null),
    providerNumber: Joi.string().allow(null, "").default(null),
   
    CMS_Certification_Number_CCN: Joi.string().allow(null, "").default(null),
    Provider_Name: Joi.string().allow(null, "").default(null),
    Provider_Address: Joi.string().allow(null, "").default(null),
    City_Town: Joi.string().allow(null, "").default(null),
    State: Joi.string().allow(null, "").default(null),
    ZIP_Code: Joi.string().allow(null, "").default(null),
    Telephone_Number: Joi.string().allow(null, "").default(null),
    Provider_SSA_County_Code: Joi.string().allow(null, "").default(null),
    County_Parish: Joi.string().allow(null, "").default(null),
    Ownership_Type: Joi.string().allow(null, "").default(null),
    Number_of_Certified_Beds: Joi.string().allow(null, "").default(null),
    Average_Number_of_Residents_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Average_Number_of_Residents_per_Day_Footnote: Joi.string()
      .allow(null, "")
      .default(null),
    Provider_Type: Joi.string().allow(null, "").default(null),
    Provider_Resides_in_Hospital: Joi.string().allow(null, "").default(null),
    Legal_Business_Name: Joi.string().allow(null, "").default(null),
    Date_First_Approved_to_Provide_Medicare_and_Medicaid_Services: Joi.string()
      .allow(null, "")
      .default(null),
    Chain_Name: Joi.string().allow(null, "").default(null),
    Chain_ID: Joi.string().allow(null, "").default(null),
    Number_of_Facilities_in_Chain: Joi.string().allow(null, "").default(null),
    Chain_Average_Overall_5_star_Rating: Joi.string()
      .allow(null, "")
      .default(null),
    Chain_Average_Health_Inspection_Rating: Joi.string()
      .allow(null, "")
      .default(null),
    Chain_Average_Staffing_Rating: Joi.string().allow(null, "").default(null),
    Chain_Average_QM_Rating: Joi.string().allow(null, "").default(null),
    Continuing_Care_Retirement_Community: Joi.string()
      .allow(null, "")
      .default(null),
    Special_Focus_Status: Joi.string().allow(null, "").default(null),
    Abuse_Icon: Joi.string().allow(null, "").default(null),
    Most_Recent_Health_Inspection_More_Than_2_Years_Ago: Joi.string()
      .allow(null, "")
      .default(null),
    Provider_Changed_Ownership_in_Last_12_Months: Joi.string()
      .allow(null, "")
      .default(null),
    With_a_Resident_and_Family_Council: Joi.string()
      .allow(null, "")
      .default(null),
    Automatic_Sprinkler_Systems_in_All_Required_Areas: Joi.string()
      .allow(null, "")
      .default(null),
    Overall_Rating: Joi.string().allow(null, "").default(null),
    Overall_Rating_Footnote: Joi.string().allow(null, "").default(null),
    Health_Inspection_Rating: Joi.string().allow(null, "").default(null),
    Health_Inspection_Rating_Footnote: Joi.string()
      .allow(null, "")
      .default(null),
    QM_Rating: Joi.string().allow(null, "").default(null),
    QM_Rating_Footnote: Joi.string().allow(null, "").default(null),
    Long_Stay_QM_Rating: Joi.string().allow(null, "").default(null),
    Long_Stay_QM_Rating_Footnote: Joi.string().allow(null, "").default(null),
    Short_Stay_QM_Rating: Joi.string().allow(null, "").default(null),
    Short_Stay_QM_Rating_Footnote: Joi.string().allow(null, "").default(null),
    Staffing_Rating: Joi.string().allow(null, "").default(null),
    Staffing_Rating_Footnote: Joi.string().allow(null, "").default(null),
    Reported_Staffing_Footnote: Joi.string().allow(null, "").default(null),
    Physical_Therapist_Staffing_Footnote: Joi.string()
      .allow(null, "")
      .default(null),
    Reported_Nurse_Aide_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Reported_LPN_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Reported_RN_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Reported_Licensed_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Total_number_of_nurse_staff_hours_per_resident_per_day_on_the_weekend:
      Joi.string().allow(null, "").default(null),
    Registered_Nurse_hours_per_resident_per_day_on_the_weekend: Joi.string()
      .allow(null, "")
      .default(null),
    Reported_Physical_Therapist_Staffing_Hours_per_Resident_Per_Day:
      Joi.string().allow(null, "").default(null),
    Total_nursing_staff_turnover: Joi.string().allow(null, "").default(null),
    Total_nursing_staff_turnover_footnote: Joi.string()
      .allow(null, "")
      .default(null),
    Registered_Nurse_turnover: Joi.string().allow(null, "").default(null),
    Registered_Nurse_turnover_footnote: Joi.string()
      .allow(null, "")
      .default(null),
    Number_of_administrators_who_have_left_the_nursing_home: Joi.string()
      .allow(null, "")
      .default(null),
    Administrator_turnover_footnote: Joi.string().allow(null, "").default(null),
    Nursing_Case_Mix_Index: Joi.string().allow(null, "").default(null),
    Nursing_Case_Mix_Index_Ratio: Joi.string().allow(null, "").default(null),
    Case_Mix_Nurse_Aide_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Case_Mix_LPN_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Case_Mix_RN_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Case_Mix_Total_Nurse_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Case_Mix_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day:
      Joi.string().allow(null, "").default(null),
    Adjusted_Nurse_Aide_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Adjusted_LPN_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Adjusted_RN_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Adjusted_Total_Nurse_Staffing_Hours_per_Resident_per_Day: Joi.string()
      .allow(null, "")
      .default(null),
    Adjusted_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day:
      Joi.string().allow(null, "").default(null),
    Rating_Cycle_1_Standard_Survey_Health_Date: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_1_Total_Number_of_Health_Deficiencies: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_1_Number_of_Complaint_Health_Deficiencies: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_1_Health_Deficiency_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_1_Number_of_Health_Revisits: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_1_Health_Revisit_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_1_Total_Health_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_Standard_Health_Survey_Date: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_3_Total_Number_of_Health_Deficiencies: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_Number_of_Standard_Health_Deficiencies: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_3_Number_of_Complaint_Health_Deficiencies: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_3_Health_Deficiency_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_1_Number_of_Standard_Health_Deficiencies: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_Number_of_Health_Revisits: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_3_Number_of_Health_Revisits: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_3_Health_Revisit_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Rating_Cycle_2_3_Total_Health_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Total_Weighted_Health_Survey_Score: Joi.string()
      .allow(null, "")
      .default(null),
    Number_of_Facility_Reported_Incidents: Joi.string()
      .allow(null, "")
      .default(null),
    Number_of_Substantiated_Complaints: Joi.string()
      .allow(null, "")
      .default(null),
    Number_of_Citations_from_Infection_Control_Inspections: Joi.string()
      .allow(null, "")
      .default(null),
    Number_of_Fines: Joi.string().allow(null, "").default(null),
    Total_Amount_of_Fines_in_Dollars: Joi.string()
      .allow(null, "")
      .default(null),
    Number_of_Payment_Denials: Joi.string().allow(null, "").default(null),
    Total_Number_of_Penalties: Joi.string().allow(null, "").default(null),
    Location: Joi.string().allow(null, "").default(null),
    Latitude: Joi.string().allow(null, "").default(null),
    Longitude: Joi.string().allow(null, "").default(null),
    Geocoding_Footnote: Joi.string().allow(null, "").default(null),
    Processing_Date: Joi.string().allow(null, "").default(null),
  });

  return schema.validate(data);
};

const addResourcesValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().messages({
      "string.base": "name must be a string value",
      "any.required": "name is required",
    }),
    type: Joi.string().required().messages({
      "string.base": "type must be a string value",
      "any.required": "type is required",
    }),
    pdflink: Joi.string().required().messages({
      "string.base": "pdflink must be a string value",
      "any.required": "pdflink is required",
    }),
    date: Joi.date().required().messages({
      "date.base": "date must be a date value",
      "any.required": "date is required",
    }),
    description: Joi.string().allow(null, "").default(null),
  });

  return schema.validate(data);
};

const updateResourcesValidation = (data) => {
  const schema = Joi.object({
    id: Joi.string().required().messages({
      "string.base": "id must be a string value",
      "any.required": "id is required",
    }),
    name: Joi.string().required().messages({
      "string.base": "name must be a string value",
      "any.required": "name is required",
    }),
    type: Joi.string().required().messages({
      "string.base": "type must be a string value",
      "any.required": "type is required",
    }),
    pdflink: Joi.string().required().messages({
      "string.base": "pdflink must be a string value",
      "any.required": "pdflink is required",
    }),
    date: Joi.date().required().messages({
      "date.base": "date must be a date value",
      "any.required": "date is required",
    }),
    description: Joi.string().allow(null, "").default(null),
  });

  return schema.validate(data);
};

const addFtagValidation = (data) => {
  const schema = Joi.object({
    question: Joi.string().required().messages({
      "string.base": "question must be a string value",
      "any.required": "question is required",
    }),
    answer: Joi.string().required().messages({
      "string.base": "answer must be a string value",
      "any.required": "answer is required",
    }),
  });

  return schema.validate(data);
};

const addFtagSetupValidation = (data) => {
  const schema = Joi.object({
    tags: Joi.array().optional().default([]),
  });

  return schema.validate(data);
};

const updateFtagSetupValidation = (data) => {
  const schema = Joi.object({
    id: Joi.string().required().messages({
      "string.base": "id must be a string value",
      "any.required": "id is required",
    }),
    ftag: Joi.string().allow(null, "").default(null),
    category: Joi.string().allow(null, "").default(null),
    definitions: Joi.string().allow(null, "").default(null),
    rev_and_date: Joi.string().allow(null, "").default(null),
    description: Joi.string().allow(null, "").default(null),
    intent: Joi.string().allow(null, "").default(null),
    guidance: Joi.string().allow(null, "").default(null),
    procedure: Joi.string().allow(null, "").default(null),
  });

  return schema.validate(data);
};

const addMandatoryTaskValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().required().messages({
      "string.base": "title must be a string value",
      "any.required": "title is required",
    }),
    version_date: Joi.date().required().messages({
      "date.base": "version_date must be a date value",
      "any.required": "version_date is required",
    }),
    source_citation: Joi.string().required().messages({
      "string.base": "source_citation must be a string value",
      "any.required": "source_citation is required",
    }),
    desc: Joi.string().required().messages({
      "string.base": "desc must be a string value",
      "any.required": "desc is required",
    }),
    categories: Joi.array().optional().default([]),
  });

  return schema.validate(data);
};

const updateMandatoryTaskValidation = (data) => {
  const schema = Joi.object({
    id: Joi.string().required().messages({
      "string.base": "id must be a string value",
      "any.required": "id is required",
    }),
    title: Joi.string().required().messages({
      "string.base": "title must be a string value",
      "any.required": "title is required",
    }),
    version_date: Joi.date().required().messages({
      "date.base": "version_date must be a date value",
      "any.required": "version_date is required",
    }),
    source_citation: Joi.string().required().messages({
      "string.base": "source_citation must be a string value",
      "any.required": "source_citation is required",
    }),
    desc: Joi.string().required().messages({
      "string.base": "desc must be a string value",
      "any.required": "desc is required",
    }),
    categories: Joi.array().optional().default([]),
  });

  return schema.validate(data);
};

module.exports.addLongTermRegulationsValidation =
  addLongTermRegulationsValidation;

module.exports.updateLongTermRegulationsValidation =
  updateLongTermRegulationsValidation;

module.exports.addFacilityTypesValidation = addFacilityTypesValidation;

module.exports.addFacilityValidation = addFacilityValidation;

module.exports.updateFacilityValidation = updateFacilityValidation;

module.exports.addResourcesValidation = addResourcesValidation;

module.exports.updateResourcesValidation = updateResourcesValidation;

module.exports.addFtagValidation = addFtagValidation;

module.exports.addCEValidation = addCEValidation;

module.exports.updateCEValidation = updateCEValidation;

module.exports.addFtagSetupValidation = addFtagSetupValidation;

module.exports.updateFtagSetupValidation = updateFtagSetupValidation;

module.exports.addMandatoryTaskValidation = addMandatoryTaskValidation;

module.exports.updateMandatoryTaskValidation = updateMandatoryTaskValidation;
