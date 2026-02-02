import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFeatureGate } from '../../contexts/FeatureGateContext';
import FacilityProfile from '../../components/facility/FacilityProfile';
import { toast } from 'sonner';
import { Building2} from 'lucide-react';
import api from '../../service/api';

const FacilityDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { canAccessMultiFacility } = useFeatureGate();
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);

  // All users can access multi-facility features now
  // Backend will handle actual data restrictions

  useEffect(() => {
    const parseNumber = (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const numeric = Number(trimmed.replace(/,/g, ''));
        return Number.isFinite(numeric) ? numeric : null;
      }
      return null;
    };

    const fetchFacility = async () => {
      try { 
        setLoading(true);
        const response = await api.facility.getFacility(id);
        const facilityPayload = response?.data?.data ?? response?.data;
        
        if (response && response.status && facilityPayload) {
          // Transform API data to match component structure
          const facilityData = facilityPayload;
          const beds = facilityData.size?.beds ?? parseNumber(facilityData.Number_of_Certified_Beds) ?? 0;
          const averageResidentsPerDay = parseNumber(facilityData.Average_Number_of_Residents_per_Day);
          const calculatedOccupancy = beds && averageResidentsPerDay
            ? Math.min(100, Math.round((averageResidentsPerDay / beds) * 100))
            : null;
          const normalizedAddress = facilityData.address || {
            street: facilityData.Provider_Address || facilityData.Location || '',
            city: facilityData.City_Town || facilityData.addressCity || '',
            state: facilityData.State || facilityData.addressState || '',
            zipCode: facilityData.ZIP_Code || facilityData.addressZip || '',
            country: facilityData.addressCountry || 'USA'
          };
          const normalizedSize = {
            ...facilityData.size,
            beds,
            floors: facilityData.size?.floors ?? null,
          };
          const totalNurseHours = parseNumber(facilityData.Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day)
            ?? parseNumber(facilityData.Adjusted_Total_Nurse_Staffing_Hours_per_Resident_per_Day);
          const weekendNurseHours = parseNumber(facilityData.Total_number_of_nurse_staff_hours_per_resident_per_day_on_the_weekend)
            ?? parseNumber(facilityData.Adjusted_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day);
          const rnHours = parseNumber(facilityData.Reported_RN_Staffing_Hours_per_Resident_per_Day)
            ?? parseNumber(facilityData.Case_Mix_RN_Staffing_Hours_per_Resident_per_Day);
          const adjustedRnHours = parseNumber(facilityData.Adjusted_RN_Staffing_Hours_per_Resident_per_Day);
          const rnWeekendHours = parseNumber(facilityData.Registered_Nurse_hours_per_resident_per_day_on_the_weekend);
          const nursingStaffTurnover = parseNumber(facilityData.Total_nursing_staff_turnover);
          const registeredNurseTurnover = parseNumber(facilityData.Registered_Nurse_turnover);
          const totalFines = parseNumber(facilityData.Number_of_Fines) ?? 0;
          const totalFinesAmount = parseNumber(facilityData.Total_Amount_of_Fines_in_Dollars);
          const averageFines = parseNumber(facilityData.Average_number_of_fines);
          const averageFineAmount = parseNumber(facilityData.Average_amount_of_fines_in_dollars);
          const totalPaymentDenials = parseNumber(facilityData.Number_of_Payment_Denials);
          const averagePaymentDenials = parseNumber(facilityData.Average_number_of_payment_denials);
          const overallRating = parseNumber(facilityData.Overall_Rating) ?? parseNumber(facilityData.Chain_Average_Overall_5_star_Rating);
          const healthInspectionRating = parseNumber(facilityData.Health_Inspection_Rating) ?? parseNumber(facilityData.Chain_Average_Health_Inspection_Rating);
          const staffingRating = parseNumber(facilityData.Staffing_Rating) ?? parseNumber(facilityData.Chain_Average_Staffing_Rating);
          const qualityRating = parseNumber(facilityData.QM_Rating) ?? parseNumber(facilityData.Chain_Average_QM_Rating);
          const numberOfFacilitiesInChain = parseNumber(facilityData.Number_of_Facilities_in_Chain);
          const occupancy = calculatedOccupancy ?? parseNumber(facilityData.occupancy);
          const surveyCount = [
            facilityData.Rating_Cycle_1_Standard_Survey_Health_Date,
            facilityData.Rating_Cycle_2_Standard_Health_Survey_Date,
            facilityData.Rating_Cycle_3_Standard_Health_Survey_Date,
          ].filter(Boolean).length;
          const recentHealthDeficiencies = parseNumber(facilityData.Rating_Cycle_1_Total_Number_of_Health_Deficiencies)
            ?? parseNumber(facilityData.Number_of_Substantiated_Complaints)
            ?? 0;
          const criticalFindings = parseNumber(facilityData.Number_of_Facility_Reported_Incidents)
            ?? parseNumber(facilityData.Number_of_Citations_from_Infection_Control_Inspections)
            ?? 0;
          const riskScore = parseNumber(facilityData.Total_Weighted_Health_Survey_Score);
          const tags = [];
          if (facilityData.Ownership_Type) tags.push(facilityData.Ownership_Type);
          if (facilityData.Provider_Type) tags.push(facilityData.Provider_Type);
          if (facilityData.With_a_Resident_and_Family_Council) {
            tags.push(`${facilityData.With_a_Resident_and_Family_Council} Council`);
          }
          if (facilityData.Automatic_Sprinkler_Systems_in_All_Required_Areas) {
            tags.push(`Sprinklers: ${facilityData.Automatic_Sprinkler_Systems_in_All_Required_Areas}`);
          }
          const fallbackContactName = `${facilityData.userId?.firstName || ''} ${facilityData.userId?.lastName || ''}`.trim()
            || facilityData.Provider_Name
            || facilityData.name;
          const fallbackContactPhone = facilityData.Telephone_Number || facilityData.secondaryContactPhone || '';
          const contactList = Array.isArray(facilityData.contact) && facilityData.contact.length > 0
            ? facilityData.contact
            : facilityData.contact
              ? [facilityData.contact]
              : [{
                  name: fallbackContactName,
                  phone: fallbackContactPhone,
                  email: facilityData.userId?.email || '',
                  role: facilityData.userId?.organization || 'Primary Contact',
                }];
          const statusSource = facilityData.status
            ?? facilityData.Special_Focus_Status
            ?? (facilityData.Abuse_Icon === 'Y' ? 'High Risk' : 'Active');

          const transformedFacility = {
            id: facilityData._id,
            name: facilityData.name || facilityData.Provider_Name || 'Unnamed Facility',
            type: facilityData.type?.name || facilityData.type || facilityData.Provider_Type || 'Unknown',
            location: `${normalizedAddress.city || ''}, ${normalizedAddress.state || ''}`,
            beds,
            occupancy: occupancy ?? 0,
            lastSurvey: facilityData.lastSurvey
              || facilityData.Rating_Cycle_1_Standard_Survey_Health_Date
              || facilityData.Rating_Cycle_2_Standard_Health_Survey_Date
              || null,
            nextSurvey: facilityData.nextSurvey || null,
            status: typeof statusSource === 'string'
              ? statusSource.toLowerCase().replace(/\s+/g, '-')
              : 'active',
            riskScore: riskScore ?? 0,
            recentFindings: recentHealthDeficiencies,
            criticalFindings: criticalFindings,
            surveyCount,
            avgSurveyScore: qualityRating ?? overallRating ?? 0,
            contact: contactList,
            phone: facilityData.Telephone_Number || '',
            secondaryContactPhone: facilityData.secondaryContactPhone || '',
            contractStart: facilityData.contractStart || facilityData.Date_First_Approved_to_Provide_Medicare_and_Medicaid_Services || '',
            monthlyFee: facilityData.monthlyFee ? parseNumber(facilityData.monthlyFee) : null,
            tags: facilityData.tags?.length ? facilityData.tags : tags,
            trend: facilityData.trend
              || (facilityData.Most_Recent_Health_Inspection_More_Than_2_Years_Ago === 'N' ? 'up' : 'down'),
            address: normalizedAddress,
            size: normalizedSize,
            notes: facilityData.notes || '',
            providerNumber: facilityData.providerNumber
              || facilityData.CMS_Certification_Number_CCN
              || facilityData.Provider_Number
              || '',
            // Additional API fields
            userId: facilityData.userId,
            createdAt: facilityData.createdAt || facilityData.Processing_Date || null,
            // Chain Information
            chain: facilityData.Chain || facilityData.Chain_Name || '',
            chainId: facilityData.Chain_ID || '',
            numberOfFacilities: facilityData.Number_of_facilities || numberOfFacilitiesInChain || '',
            numberOfStatesAndTerritories: facilityData.Number_of_states_and_territories_with_operations || '',
            numberOfSpecialFocusFacilities: facilityData.Number_of_Special_Focus_Facilities_SFF || '',
            numberOfSFFCandidates: facilityData.Number_of_SFF_candidates || '',
            numberOfAbuseIconFacilities: facilityData.Number_of_facilities_with_an_abuse_icon || '',
            percentageOfAbuseIconFacilities: facilityData.Percentage_of_facilities_with_an_abuse_icon || '',
            percentForProfit: facilityData.Percent_of_facilities_classified_as_for_profit || '',
            percentNonProfit: facilityData.Percent_of_facilities_classified_as_non_profit || '',
            percentGovernmentOwned: facilityData.Percent_of_facilities_classified_as_government_owned || '',
            // Star Ratings
            averageOverall5StarRating: overallRating,
            averageHealthInspectionRating: healthInspectionRating,
            averageStaffingRating: staffingRating,
            averageQualityRating: qualityRating,
            // Staffing Metrics
            averageTotalNurseHoursPerResidentDay: totalNurseHours,
            averageTotalWeekendNurseHoursPerResidentDay: weekendNurseHours,
            averageTotalRegisteredNurseHoursPerResidentDay: rnHours,
            averageTotalRegisteredNurseHoursPerResidentDayAlt: adjustedRnHours ?? rnWeekendHours,
            averageTotalNursingStaffTurnoverPercentage: nursingStaffTurnover,
            averageRegisteredNurseTurnoverPercentage: registeredNurseTurnover,
            averageNumberOfAdministratorsWhoLeft: facilityData.Number_of_administrators_who_have_left_the_nursing_home || '',
            // Fines and Payment Denials
            totalNumberOfFines: totalFines,
            averageNumberOfFines: averageFines,
            totalAmountOfFinesInDollars: totalFinesAmount,
            averageAmountOfFinesInDollars: averageFineAmount,
            totalNumberOfPaymentDenials: totalPaymentDenials,
            averageNumberOfPaymentDenials: averagePaymentDenials,
            // Short Stay Quality Metrics
            averageShortStayRehospitalizedPercentage: parseNumber(facilityData.Average_percentage_of_short_stay_residents_who_were_re_hospitalized_after_a_nursing_home_admission) ?? '',
            averageShortStayEDVisitPercentage: parseNumber(facilityData.Average_percentage_of_short_stay_residents_who_have_had_an_outpatient_emergency_department_visit) ?? '',
            averageShortStayAntipsychoticPercentage: parseNumber(facilityData.Average_percentage_of_short_stay_residents_who_newly_received_an_antipsychotic_medication) ?? '',
            averageShortStayPressureUlcerPercentage: parseNumber(facilityData.Average_percentage_of_short_stay_residents_with_pressure_ulcers_or_pressure_injuries_that_are_new_or_worsened) ?? '',
            averageShortStayDischargeAbilityPercentage: parseNumber(facilityData.Average_percentage_of_short_stay_residents_who_are_at_or_above_an_expected_ability_to_care_for_themselves_and_move_around_at_discharge) ?? '',
            averageShortStayInfluenzaVaccinePercentage: parseNumber(facilityData.Average_percentage_of_short_stay_residents_who_were_assessed_and_appropriately_given_the_seasonal_influenza_vaccine) ?? '',
            averageShortStayPneumococcalVaccinePercentage: parseNumber(facilityData.Average_percentage_of_short_stay_residents_who_were_assessed_and_appropriately_given_the_pneumococcal_vaccine) ?? '',
            // Long Stay Quality Metrics
            averageLongStayHospitalizationsPer1000: parseNumber(facilityData.Average_number_of_hospitalizations_per_1000_long_stay_resident_days) ?? '',
            averageLongStayEDVisitsPer1000: parseNumber(facilityData.Average_number_of_outpatient_emergency_department_visits_per_1000_long_stay_resident_days) ?? '',
            averageLongStayAntipsychoticPercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_who_received_an_antipsychotic_medication) ?? '',
            averageLongStayFallsWithInjuryPercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_experiencing_one_or_more_falls_with_major_injury) ?? '',
            averageLongStayPressureUlcersPercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_with_pressure_ulcers) ?? '',
            averageLongStayUTIPercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_with_a_urinary_tract_infection) ?? '',
            averageLongStayCatheterPercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_who_have_or_had_a_catheter_inserted_and_left_in_their_bladder) ?? '',
            averageLongStayMobilityWorsenedPercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_whose_ability_to_move_independently_worsened) ?? '',
            averageLongStayADLHelpIncreasedPercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_whose_need_for_help_with_activities_of_daily_living_has_increased) ?? '',
            averageLongStayInfluenzaVaccinePercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_who_were_assessed_and_appropriately_given_the_seasonal_influenza_vaccine) ?? '',
            averageLongStayPneumococcalVaccinePercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_who_were_assessed_and_appropriately_given_the_pneumococcal_vaccine) ?? '',
            averageLongStayPhysicallyRestrainedPercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_who_were_physically_restrained) ?? '',
            averageLongStayIncontinencePercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_with_new_or_worsened_bowel_or_bladder_incontinence) ?? '',
            averageLongStayWeightLossPercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_who_lose_too_much_weight) ?? '',
            averageLongStayDepressionPercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_who_have_symptoms_of_depression) ?? '',
            averageLongStayAntianxietyMedicationPercentage: parseNumber(facilityData.Average_percentage_of_long_stay_residents_who_used_antianxiety_or_hypnotic_medication) ?? '',
            averageRateOfPreventableReadmissions: parseNumber(facilityData.Average_rate_of_potentially_preventable_hospital_readmissions_30_days_after_discharge_from_a_snf) ?? ''
          };

          setFacility(transformedFacility);
        } else {
          toast.error('Facility not found', { position: 'top-right' });
          navigate('/facilities');
        }
      } catch (error) {
    
        toast.error('Failed to load facility', { position: 'top-right' });
        navigate('/multi-facility');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFacility();
    }
  }, [id, navigate]);

  const handleEdit = () => {
    navigate(`/facility/${id}/edit`);
  };

  const handleUserAdd = (newUser) => {
    // In real app, this would call an API
    toast.success(`User ${newUser.name} added successfully`);
  };

  const handleUserUpdate = (updatedUser) => {
    // In real app, this would call an API
    toast.success(`User ${updatedUser.name} updated successfully`);
  };

  const handleUserRemove = (userId) => {
    // In real app, this would call an API
    toast.success('User removed successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading facility...</p>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Facility Not Found</h1>
          <p className="text-gray-600 mb-4">
            The facility you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate('/facilities')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-[16px] sm:text-[20px] font-bold text-gray-900">{facility.name}</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage facility details and user access</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleEdit}
                className="bg-[#075b7d] hover:bg-[#075b7d] text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Facility
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Overall 5-Star Rating</p>
                <p className={`text-lg sm:text-2xl font-bold ${
                  facility.averageOverall5StarRating >= 4 ? 'text-green-600' : 
                  facility.averageOverall5StarRating >= 3 ? 'text-yellow-600' : 
                  facility.averageOverall5StarRating ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {facility.averageOverall5StarRating || 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {facility.averageQualityRating ? `Quality: ${facility.averageQualityRating}` : 'CMS Rating'}
            </p>
              </div>
             
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Health Inspection</p>
                <p className={`text-lg sm:text-2xl font-bold ${
                  facility.averageHealthInspectionRating >= 4 ? 'text-green-600' : 
                  facility.averageHealthInspectionRating >= 3 ? 'text-yellow-600' : 
                  facility.averageHealthInspectionRating ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {facility.averageHealthInspectionRating || 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {facility.averageStaffingRating ? `Staffing: ${facility.averageStaffingRating}` : 'Inspection Rating'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">
                  {facility.numberOfFacilities ? 'Chain Facilities' : 'Total Beds'}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {facility.numberOfFacilities || facility.beds || 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {facility.numberOfFacilities ? `States: ${facility.numberOfStatesAndTerritories || 'N/A'}` : 
               facility.chain ? `Chain: ${facility.chain}` : 
               `Occupancy: ${facility.occupancy || 0}%`}
                </p>
              </div>
             
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Last Survey</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {facility.lastSurvey ? new Date(facility.lastSurvey).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {facility.nextSurvey ? `Next: ${new Date(facility.nextSurvey).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}` : 'No upcoming survey'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Staffing Rating</p>
                <p className={`text-lg sm:text-2xl font-bold ${
                  facility.averageStaffingRating >= 4 ? 'text-green-600' : 
                  facility.averageStaffingRating >= 3 ? 'text-yellow-600' : 
                  facility.averageStaffingRating ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {facility.averageStaffingRating || 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {facility.averageTotalNurseHoursPerResidentDay ? `Nurse Hours: ${facility.averageTotalNurseHoursPerResidentDay}` : 'CMS Staffing'}
            </p>
              </div>
             
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Fines</p>
                <p className={`text-lg sm:text-2xl font-bold ${
                  facility.totalNumberOfFines > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {facility.totalNumberOfFines || '0'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {facility.totalAmountOfFinesInDollars ? `Amount: $${parseFloat(facility.totalAmountOfFinesInDollars).toLocaleString()}` : 'No fines recorded'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Nurse Hours/Resident</p>
                <p className={`text-lg sm:text-2xl font-bold ${
                  facility.averageTotalNurseHoursPerResidentDay >= 4 ? 'text-green-600' : 
                  facility.averageTotalNurseHoursPerResidentDay >= 3 ? 'text-yellow-600' : 
                  facility.averageTotalNurseHoursPerResidentDay ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {facility.averageTotalNurseHoursPerResidentDay || 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {facility.averageTotalWeekendNurseHoursPerResidentDay ? `Weekend: ${facility.averageTotalWeekendNurseHoursPerResidentDay}` : 'Per resident day'}
            </p>
              </div>
             
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Staff Turnover</p>
                <p className={`text-lg sm:text-2xl font-bold ${
                  facility.averageTotalNursingStaffTurnoverPercentage <= 20 ? 'text-green-600' : 
                  facility.averageTotalNursingStaffTurnoverPercentage <= 30 ? 'text-yellow-600' : 
                  facility.averageTotalNursingStaffTurnoverPercentage ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {facility.averageTotalNursingStaffTurnoverPercentage ? `${facility.averageTotalNursingStaffTurnoverPercentage}%` : 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {facility.averageRegisteredNurseTurnoverPercentage ? `RN Turnover: ${facility.averageRegisteredNurseTurnoverPercentage}%` : 'Nursing staff'}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-gray-200">
          <FacilityProfile facility={facility} facilityId={id} onEdit={handleEdit} />
        </div>
      </div>
    </div>
  );
};

export default FacilityDetail; 