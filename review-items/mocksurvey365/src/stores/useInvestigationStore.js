import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Zustand store for Investigation Results data
 * Persists residents information fetched from the API when "Generate Investigation Results" is clicked
 * This store ensures data persists across page refreshes and stays active on the page
 */

const useInvestigationStore = create(
  persist(
    (set, get) => ({
      // State
      apiResidentsData: null, // Raw API response data
      fetchedAt: null, // Timestamp when data was last fetched
      surveyId: null, // Survey ID associated with this data
      isLoading: false,
      error: null,

      // Actions
      /**
       * Set the residents data from API response
       * Transforms API response to resident-centric structure matching letsRefactor.json format
       * @param {Array} data - Array of resident investigation data from API [{ resident: {...}, investigation: {...} }]
       * @param {string} surveyId - Survey ID associated with this data
       */
      setApiResidentsData: (data, surveyId) => {
        const targetSurveyId = surveyId || localStorage.getItem("currentSurveyId");
        const dataCount = Array.isArray(data) ? data.length : 0;
       
        
        // Transform API response to resident-centric structure (like letsRefactor.json)
        let transformedData = null;
        
        if (!data) {
         // No data provided
        } else if (Array.isArray(data) && data.length > 0) {
         
          
          // Check if data is already in resident-centric format (has residents array)
          if (data.residents && Array.isArray(data.residents)) {
            transformedData = data;
         
          } 
          // Check if first item has resident/investigation structure (API format)
          else if (data[0]?.resident && data[0]?.investigation) {
            // Transform from API format [{ resident: {...}, investigation: {...} }] 
            // to resident-centric format { residents: [{ id, name, investigations: {...} }] }
            const residentsMap = new Map();
            
            data.forEach((item) => {
              if (!item.resident || !item.investigation) return;
              
              const residentId = item.resident.id;
              
              // Transform probes array to requiredProbes format
              const requiredProbes = (item.investigation.probes || []).map((probe, index) => ({
                id: `probe_${residentId}_${index}`,
                name: probe.title,
                description: probe.description,
                evidenceTypes: [probe.relatedType].filter(Boolean),
                ftag: probe.ftag,
                status: probe.status || "Not Started",
                required: probe.required !== false,
                pathwayName: probe.pathwayName,
                cePathwayQuestions: probe.CE_pathway_questions || {},
              }));
              
              // Build investigation object
              const investigationObj = {
                id: item.investigation.id || `inv_${residentId}_${Date.now()}`,
                residentId: residentId,
                residentName: item.resident.name,
                residentDiagnosis: item.resident.diagnosis || "",
                residentSpecialTypes: item.resident.patientNeeds || item.resident.specialTypes || [],
                careArea: item.investigation.category || "",
                fTag: item.investigation.probes?.[0]?.ftag || "",
                title: `${item.investigation.category || "Investigation"} - ${item.resident.name}`,
                reason: item.resident.selectionReason || "",
                status: item.investigation.status || "Pending",
                priority: item.investigation.priority || "Low",
                assignedSurveyor: item.investigation.assignedSurveyor || null,
                assignedSurveyorName: item.investigation.assignedSurveyorName || null,
                createdAt: new Date().toISOString(),
                createdBy: null,
                createdById: null,
                startedAt: null,
                startedBy: null,
                startedById: null,
                completedAt: null,
                completedBy: null,
                completedById: null,
                observations: [],
                interviews: [],
                recordReview: [],
                severity: null,
                notes: "",
                attachments: [],
                evidence: item.investigation.evidence || [],
                aiGenerated: true,
                source: "auto-generated",
                requiredProbes: requiredProbes,
                completedProbes: [],
                cePathwayQuestions: item.investigation.probes?.[0]?.CE_pathway_questions || {},
                cePathwayAssessment: null,
              };
              
              // Check if resident already exists in map
              if (residentsMap.has(residentId)) {
                // Merge investigations if resident already exists (shouldn't happen in API response, but handle it)
                const existingResident = residentsMap.get(residentId);
                existingResident.investigations = investigationObj;
              } else {
                // Create new resident object
                residentsMap.set(residentId, {
                  id: residentId,
                  name: item.resident.name,
                  specialTypes: item.resident.patientNeeds || item.resident.specialTypes || [],
                  patientNeeds: item.resident.patientNeeds || item.resident.specialTypes || [],
                  diagnosis: item.resident.diagnosis || "",
                  selectionReason: item.resident.selectionReason || "",
                  investigationStatus: item.investigation.status || "Pending",
                  investigations: investigationObj,
                  bodyMapObservations: [],
                  weightCalculatorData: null,
                  notes: {},
                  attachments: {},
                });
              }
            });
            
            // Convert map to array and wrap in resident-centric structure
            transformedData = {
              residents: Array.from(residentsMap.values()),
            };
           
          } else {
          
            
            // Try to detect if this is an object with residents property (not array)
            if (data && typeof data === "object" && !Array.isArray(data) && data.residents) {
              transformedData = data;
            
            } else if (Array.isArray(data) && data.length > 0) {
            
              if (data[0].id && data[0].name && !data[0].resident) {
                // Already in resident format, just wrap
                transformedData = { residents: data };
               
              } else {
                // Save as-is but log warning - might need manual transformation
                transformedData = data;
               
              }
            } else {
              // Save as-is but log warning
              transformedData = data;
             
            }
          }
        } else if (data && typeof data === "object" && !Array.isArray(data)) {
          // Data is an object (could be resident-centric format already)
          if (data.residents && Array.isArray(data.residents)) {
            transformedData = data;
         
          } else {
            // Unknown object format
            transformedData = data;
           
          }
        } else if (data && Array.isArray(data) && data.length === 0) {
         
          transformedData = { residents: [] };
        }
        
        // Always save surveyId if provided, even if data transformation had issues
        // Log warning if surveyId is missing but still try to save data
        if (!targetSurveyId) {
          // No survey ID provided
        }
        
        // If transformation failed, try to save raw data as fallback
        if (!transformedData && data) {
       
          // Wrap raw data in residents array if it's an array
          if (Array.isArray(data)) {
            transformedData = { residents: data };
          } else if (data && typeof data === "object") {
            transformedData = data;
          }
        }
        
        // Only skip saving if we have neither data nor surveyId
        if (!transformedData && !targetSurveyId) {
         
          set({ error: "No data or Survey ID provided" });
          return;
        }
        
        // Save data - always save surveyId if provided, and data if available
        const stateToSave = {
          fetchedAt: new Date().toISOString(),
          error: null,
        };
        
        if (transformedData !== null && transformedData !== undefined) {
          stateToSave.apiResidentsData = transformedData;
        } else if (data) {
          // Fallback: save raw data if transformation completely failed
          stateToSave.apiResidentsData = Array.isArray(data) ? { residents: data } : data;
         
        }
        
        if (targetSurveyId) {
          stateToSave.surveyId = String(targetSurveyId); // Ensure it's a string for consistent comparison
        }
        
      
        
        set(stateToSave);
        
        // Verify immediately after setting
        const stateAfterSet = get();
      },

    
      getApiResidentsData: (surveyId = null) => {
        const state = get();
        const targetSurveyId = surveyId || localStorage.getItem("currentSurveyId");
        
        // Return null if no data
        if (!state.apiResidentsData) {
          return null;
        }
        
        // If no survey ID filter, return all data
        if (!targetSurveyId) {
          // Return in consistent format: { residents: [...] }
          if (state.apiResidentsData.residents && Array.isArray(state.apiResidentsData.residents)) {
            return state.apiResidentsData;
          }
          // Legacy format: wrap array in object
          if (Array.isArray(state.apiResidentsData)) {
            return { residents: state.apiResidentsData };
          }
          return state.apiResidentsData;
        }
        
        // Return data only if it matches the current survey
        if (String(state.surveyId) === String(targetSurveyId)) {
          // Ensure consistent format: { residents: [...] }
          if (state.apiResidentsData.residents && Array.isArray(state.apiResidentsData.residents)) {
            return state.apiResidentsData;
          }
          // Legacy format: wrap array in object
          if (Array.isArray(state.apiResidentsData)) {
            return { residents: state.apiResidentsData };
          }
          return state.apiResidentsData;
        }
        
        return null;
      },

      /**
       * Check if data exists for current survey
       * @param {string} surveyId - Optional survey ID to check
       * @returns {boolean}
       */
      hasDataForSurvey: (surveyId = null) => {
        const state = get();
        const targetSurveyId = surveyId || localStorage.getItem("currentSurveyId");
        
        // Check for new resident-centric structure: { residents: [...] }
        const hasResidentsArray = state.apiResidentsData?.residents && Array.isArray(state.apiResidentsData.residents);
        const residentsCount = hasResidentsArray ? state.apiResidentsData.residents.length : 0;
        
        // Check for legacy array format
        const isLegacyArray = Array.isArray(state.apiResidentsData);
        const legacyArrayLength = isLegacyArray ? state.apiResidentsData.length : 0;
        
        // Check survey ID match (use string comparison to handle type mismatches)
        const surveyIdMatch = String(state.surveyId) === String(targetSurveyId);
        
        const checks = {
          hasApiResidentsData: !!state.apiResidentsData,
          isResidentCentricObject: hasResidentsArray,
          isLegacyArray: isLegacyArray,
          residentsCount: residentsCount,
          legacyArrayLength: legacyArrayLength,
          surveyIdMatch: surveyIdMatch,
          storedSurveyId: state.surveyId,
          requestedSurveyId: targetSurveyId,
          surveyIdTypes: {
            stored: typeof state.surveyId,
            requested: typeof targetSurveyId,
          },
        };
        
        // Result: data exists if it has residents array with items OR legacy array with items, AND survey ID matches
        const result = (
          state.apiResidentsData &&
          ((hasResidentsArray && residentsCount > 0) || (isLegacyArray && legacyArrayLength > 0)) &&
          surveyIdMatch
        );
        
        // Only log when called (to avoid spam)
        if (state.apiResidentsData || targetSurveyId) {
         // console.log("🔷 Investigation Store - hasDataForSurvey checks:", checks); --- IGNORE ---
        }
        
        return Boolean(result);
      },

      /**
       * Set loading state
       * @param {boolean} loading
       */
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      /**
       * Set error state
       * @param {string|null} error
       */
      setError: (error) => {
        set({ error });
      },

      /**
       * Clear all stored data
       */
      clearData: () => {
        set({
          apiResidentsData: null,
          fetchedAt: null,
          surveyId: null,
          error: null,
        });
        
      },

      /**
       * Clear data for a specific survey
       * @param {string} surveyId
       */
      clearDataForSurvey: (surveyId) => {
        const state = get();
        if (state.surveyId === surveyId) {
          set({
            apiResidentsData: null,
            fetchedAt: null,
            surveyId: null,
            error: null,
          });
        
        }
      },

      /**
       * Get metadata about stored data
       * @returns {Object} Metadata object
       */
      getMetadata: () => {
        const state = get();
        
        // Count residents from new resident-centric structure or legacy array format
        let residentsCount = 0;
        if (state.apiResidentsData?.residents && Array.isArray(state.apiResidentsData.residents)) {
          residentsCount = state.apiResidentsData.residents.length;
        } else if (Array.isArray(state.apiResidentsData)) {
          residentsCount = state.apiResidentsData.length;
        }
        
        return {
          hasData: !!state.apiResidentsData && residentsCount > 0,
          residentsCount: residentsCount,
          fetchedAt: state.fetchedAt,
          surveyId: state.surveyId,
          isLoading: state.isLoading,
          error: state.error,
        };
      },
    }),
    {
      name: 'investigation-results-store', // localStorage key
      // Only persist the data, not loading/error states
      partialize: (state) => ({
        apiResidentsData: state.apiResidentsData,
        fetchedAt: state.fetchedAt,
        surveyId: state.surveyId,
      }),
    }
  )
);

export default useInvestigationStore;
