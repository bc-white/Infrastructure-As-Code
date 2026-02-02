import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useFeatureGate } from "../../contexts/FeatureGateContext";
import FacilityForm from "../../components/facility/FacilityForm";
import { toast } from "sonner";
import api from "../../service/api";
import LinkFacility from "./LinkFacility";

const AddEditFacility = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { canAccessMultiFacility } = useFeatureGate();

  // All users can access multi-facility features now
  // Backend will handle actual data restrictions

  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(id);

  // Clear persisted data when entering add mode
  useEffect(() => {
    if (!isEditing) {
      localStorage.removeItem("linkFacilityData");
    }
  }, [isEditing]);

  // Handle linked facility data from LinkFacility page
  useEffect(() => {
    if (!isEditing && location.state?.linkedFacility) {
      const linkedData = location.state.linkedFacility;
      setFacility({
        name: linkedData.Chain || "",
        providerNumber: linkedData.Chain_ID || "",
        ...linkedData,
        //nursingHomeData: linkedData,
      });

    
    }
  }, [location.state, isEditing]);

  useEffect(() => {
    if (isEditing && id) {
      const fetchFacility = async () => {
        try {
          setLoading(true);
          const response = await api.facility.getFacility(id);

        

          if (response && response.status && response.data) {
            setFacility(response.data);
          } else {
            toast.error("Facility not found", { position: "top-right" });
            navigate("/facilities");
          }
        } catch (error) {
         
          toast.error("Failed to load facility", { position: "top-right" });
          navigate("/facilities");
        } finally {
          setLoading(false);
        }
      };

      fetchFacility();
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (facilityData, clearPersistedData) => {
  
    setLoading(true);

    const stripMetaFields = (data = {}) => {
      const {
        _id,
        id: nestedId,
        userId,
        nursingHomeData,
        createdAt,
        updatedAt,
        __v,
        tags,
        type,
        ...rest
      } = data || {};
      return { ...rest };
    };

    const toIntOrDefault = (value, fallback = 0) => {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
      const fallbackParsed = Number.parseInt(fallback, 10);
      if (!Number.isNaN(fallbackParsed)) {
        return fallbackParsed;
      }
      return 0;
    };

    const ensureArray = (value) => {
      if (Array.isArray(value)) {
        return value;
      }
      return [];
    };

    const ensureObject = (value) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
      }
      return {};
    };

    try {
      if (isEditing) {
        const existingFacility = stripMetaFields(facility || {});
        const submittedFacility = stripMetaFields(facilityData || {});

        const mergedPayload = {
          id,
          ...existingFacility,
          ...submittedFacility,
        };

        mergedPayload.address = ensureObject(submittedFacility.address || existingFacility.address);
        mergedPayload.contact = ensureArray(submittedFacility.contact || existingFacility.contact);
        mergedPayload.size = {
          beds: toIntOrDefault(submittedFacility.size?.beds, existingFacility.size?.beds),
          floors: toIntOrDefault(submittedFacility.size?.floors, existingFacility.size?.floors),
        };

        if (!mergedPayload.secondaryContactPhone) {
          delete mergedPayload.secondaryContactPhone;
        }

        const response = await api.facility.updateFacility(id, mergedPayload);

        if (response) {
          toast.success("Facility updated successfully!", {
            position: "top-right",
          });
          localStorage.removeItem("linkFacilityData");
          clearPersistedData();
          navigate("/facilities");
        }
      } else {
        const cleanedPayload = stripMetaFields(facilityData || {});

        cleanedPayload.address = ensureObject(cleanedPayload.address);
        cleanedPayload.contact = ensureArray(cleanedPayload.contact);
        cleanedPayload.size = {
          beds: toIntOrDefault(cleanedPayload.size?.beds),
          floors: toIntOrDefault(cleanedPayload.size?.floors),
        };

        if (!cleanedPayload.secondaryContactPhone) {
          delete cleanedPayload.secondaryContactPhone;
        }

        const response = await api.facility.addFacility(cleanedPayload);

        return response;
      }
    } catch (error) {
    
      toast.error(error.message || "An error occurred. Please try again.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Clear persisted data when cancelling
    localStorage.removeItem("linkFacilityData");
    navigate("/facilities");
  };

  return (
    <div className="min-h-screen relative">
      {/* Loading Modal Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50  z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-xl ">
            <div className="flex justify-center">
              <div role="status">
                <svg
                  aria-hidden="true"
                  class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 mb-4"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span class="sr-only">Loading...</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isEditing ? "Updating Facility" : "Adding Facility"}
            </h3>
            <p className="text-gray-600">
              {isEditing
                ? "Please wait while we update the facility information..."
                : "Please wait while we create the new facility..."}
            </p>
          </div>
        </div>
      )}
      <div>
        {/* Facility Form */}
        {/* <FacilityForm
          facility={facility}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEditing={isEditing}
          disabled={loading}
        /> */}

        <LinkFacility
          facility={facility}
          onSubmit={(payload, clearPersistedData) => handleSubmit(payload, clearPersistedData)}
          isEditing={isEditing}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default AddEditFacility;
