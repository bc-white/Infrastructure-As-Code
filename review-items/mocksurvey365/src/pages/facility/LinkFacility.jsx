import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Search, X, Building2, MapPin, Star, Users, Plus, ArrowLeft, Trash2, Check, ChevronsUpDown, ChevronDown } from "lucide-react";

const INITIAL_SEARCH_FILTERS = {
  address: "",
  city: "",
  state: "",
};
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { toast } from "sonner";
import api from "../../service/api";
import { DatePicker } from "../../components/ui/date-picker";

const LinkFacility = ({ facility = null, onSubmit, isEditing = false, onCancel }) => {
  const navigate = useNavigate();
  // Load persisted data from localStorage once on mount
  const loadPersistedData = () => {
    try {
      const persisted = localStorage.getItem("linkFacilityData");
      if (persisted) {
        return JSON.parse(persisted);
      }
    } catch (error) {
    
    }
    return null;
  };

  // Only use persisted data if not in edit mode
  const persistedData = isEditing ? null : loadPersistedData();
  
  const [searchTerm, setSearchTerm] = useState(() => persistedData?.searchTerm || "");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchFilters, setSearchFilters] = useState(
    () => persistedData?.searchFilters || { ...INITIAL_SEARCH_FILTERS }
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(() => {
    if (typeof persistedData?.showAdvancedFilters === "boolean") {
      return persistedData.showAdvancedFilters;
    }
    const filters = persistedData?.searchFilters;
    return Boolean(filters?.address || filters?.city || filters?.state);
  });

  const [step, setStep] = useState(() => {
    // If editing, skip search step
    if (isEditing) return 2;
    return persistedData?.step || 1;
  });
  const [selectedFacility, setSelectedFacility] = useState(() => {
    if (isEditing && facility) {
      // In edit mode, treat the facility as selected
      return facility;
    }
    return persistedData?.selectedFacility || null;
  });
  const [loading, setLoading] = useState(false);
  
  // Initialize formData with persisted data or defaults
  const [formData, setFormData] = useState(persistedData?.formData || {
    name: "",
    providerNumber: "",
    type: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "USA"
    },
    size: {
      beds: "", 
      floors: ""
    },
    contact: [
      {
        name: "",
        phone: "",
        email: "",
        role: ""
      }
    ],
    notes: "",
    lastSurvey: "",
   
    secondaryContactPhone: ""
  });
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [stateOpen, setStateOpen] = useState(false);
  const [searchStateOpen, setSearchStateOpen] = useState(false);
  const debounceTimer = useRef(null);

  const states = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  const sanitizeText = (value) => {
    if (typeof value === "string") {
      return value.trim();
    }
    if (value === null || value === undefined) {
      return "";
    }
    return value;
  };

  const toNumberOrNull = (value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const stripNonDigits = (value) => {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value).replace(/\D/g, "");
  };

  const toTrimmedString = (value) => {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value).trim();
  };

  const removeUndefinedFields = (obj) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      return obj;
    }

    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, Array.isArray(obj) ? [] : {});
  };

  // Fetch facility types from API
  useEffect(() => {
    const fetchFacilityTypes = async () => {
      try {
        setLoadingTypes(true);
        const response = await api.facility.getFacilityTypes();
        
        if (response && response.status && response.data) {
          setFacilityTypes(response.data);
        }
      } catch (error) {
     
        toast.error("Failed to load facility types.", { position: "top-right" });
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchFacilityTypes();
  }, []);

  // Update formData when facility prop changes (for edit mode)
  useEffect(() => {
    if (isEditing && facility) {
      const newFormData = {
        name: facility.name || facility.Provider_Name || facility.Chain || "",
        providerNumber: facility.providerNumber || facility.CMS_Certification_Number_CCN || facility.Chain_ID || "",
        type: facility.type?._id || facility.type || "",
        address: facility.address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "USA"
        },
        size: facility.size ? {
          beds: facility.size.beds?.toString() || "",
          floors: facility.size.floors?.toString() || ""
        } : {
          beds: "",
          floors: ""
        },
        contact: Array.isArray(facility.contact) && facility.contact.length > 0 
          ? facility.contact 
          : [{
              name: "",
              phone: "",
              email: "",
              role: ""
            }],
        notes: facility.notes || "",
        lastSurvey: facility.lastSurvey ? facility.lastSurvey.split('T')[0] : "",
        secondaryContactPhone: facility.secondaryContactPhone || ""
      };
     
      setFormData(newFormData);
      setSelectedFacility(facility);
    }
  }, [facility, isEditing]);

  // Save to localStorage whenever step, selectedFacility, or formData changes (only in add mode)
  useEffect(() => {
    if (!isEditing) {
      const dataToPersist = {
        step,
        selectedFacility,
        formData,
        searchTerm,
        searchFilters,
        showAdvancedFilters
      };
      localStorage.setItem("linkFacilityData", JSON.stringify(dataToPersist));
    }
  }, [step, selectedFacility, formData, searchTerm, searchFilters, showAdvancedFilters, isEditing]);

  const handleClearFilters = () => {
    setSearchFilters({ ...INITIAL_SEARCH_FILTERS });
    setSearchStateOpen(false);
  };

  // Clear persisted data when facility is successfully added
  const clearPersistedData = () => {
    localStorage.removeItem("linkFacilityData");
    setSearchTerm("");
    handleClearFilters();
    setSearchResults([]);
    setShowAdvancedFilters(false);
  };

  const searchNursingHomes = async (name, address, city, stateFilter) => {
    const trimmedName = name?.trim() || "";
    const trimmedAddress = address?.trim() || "";
    const trimmedCity = city?.trim() || "";
    const trimmedState = stateFilter?.trim() || "";

    const hasNameQuery = trimmedName.length >= 3;
    const hasAdditionalFilters = [trimmedAddress, trimmedCity, trimmedState].some((value) => value.length > 0);

    if (!hasNameQuery && !hasAdditionalFilters) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await api.facility.searchNursingHomesProviders(
        hasNameQuery ? trimmedName : "",
        trimmedAddress,
        trimmedCity,
        trimmedState
      );

      if (
        response &&
        response.status &&
        response.data &&
        response.data.nursinghomes
      ) {
        setSearchResults(response.data.nursinghomes);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
     
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      const nameQuery = searchTerm.trim();
      const addressQuery = (searchFilters.address || "").trim();
      const cityQuery = (searchFilters.city || "").trim();
      const stateQuery = (searchFilters.state || "").trim();
      const hasNameQuery = nameQuery.length >= 3;
      const hasAdditionalFilters =
        addressQuery.length > 0 || cityQuery.length > 0 || stateQuery.length > 0;

      if (hasNameQuery || hasAdditionalFilters) {
        searchNursingHomes(
          searchTerm,
          searchFilters.address,
          searchFilters.city,
          searchFilters.state
        );
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce delay

    // Cleanup timer on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, searchFilters.address, searchFilters.city, searchFilters.state]);

  const handleSelectFacility = (facility) => {
    setSelectedFacility(facility);
    
    // Auto-populate form data from selected facility
    const providerName = facility.Provider_Name || facility.Chain || facility.name || "";
    const providerId = facility.CMS_Certification_Number_CCN || facility.Chain_ID || facility.providerNumber || "";
    const address = facility.Provider_Address || facility.address?.street || "";
    const city = facility.City_Town || facility.address?.city || "";
    const state = facility.State || facility.address?.state || "";
    const zipCode = facility.ZIP_Code || facility.address?.zipCode || "";
    const phone = facility.Telephone_Number || "";
    const beds = facility.Number_of_Certified_Beds || facility.size?.beds || "";
    
    setFormData(prev => ({
      ...prev,
      name: prev.name || providerName,
      providerNumber: prev.providerNumber || providerId,
      address: {
        street: prev.address.street || address,
        city: prev.address.city || city,
        state: prev.address.state || state,
        zipCode: prev.address.zipCode || zipCode,
        country: prev.address.country || "USA"
      },
      size: {
        beds: prev.size.beds || beds.toString(),
        floors: prev.size.floors || ""
      },
      contact: prev.contact.map((contact, index) => 
        index === 0 ? {
          ...contact,
          phone: contact.phone || phone || ""
        } : contact
      )
    }));
    
    setStep(2);
  };

  const handleSubmitFacility = async () => {
    try {
      setLoading(true);

      const parsedContacts = formData.contact.map((contact) => ({
        name: sanitizeText(contact.name || ""),
        phone: sanitizeText(contact.phone || ""),
        email: sanitizeText(contact.email || ""),
        role: sanitizeText(contact.role || ""),
      }));

      const formBeds = toNumberOrNull(formData.size.beds);
      const formFloors = toNumberOrNull(formData.size.floors);

      const basePayload = {
        address: removeUndefinedFields({
          street: sanitizeText(formData.address.street || ""),
          city: sanitizeText(formData.address.city || ""),
          state: sanitizeText(formData.address.state || ""),
          zipCode: sanitizeText(formData.address.zipCode || ""),
          country: sanitizeText(formData.address.country || "USA") || "USA",
        }),
        size: removeUndefinedFields({
          beds: formBeds !== null ? formBeds : undefined,
          floors: formFloors !== null ? formFloors : undefined,
        }),
        contact: parsedContacts,
        notes: sanitizeText(formData.notes || ""),
        lastSurvey: formData.lastSurvey || "",
      };

      const secondaryContactPhone = sanitizeText(formData.secondaryContactPhone || "");
      if (secondaryContactPhone) {
        basePayload.secondaryContactPhone = secondaryContactPhone;
      }

      const primaryContactPhoneDigits = stripNonDigits(parsedContacts?.[0]?.phone);
      const normalizedPrimaryPhoneString = primaryContactPhoneDigits
        ? toTrimmedString(primaryContactPhoneDigits)
        : "";

      const bedsNumber = formBeds;
      const bedsString =
        bedsNumber !== null && bedsNumber !== undefined
          ? toTrimmedString(bedsNumber)
          : "";
      const floorsNumber = formFloors;

      const cleanseFacilitySource = (facilitySource = {}) => {
        const {
          _id,
          id,
          userId,
          nursingHomeData,
          tags,
          type,
          createdAt,
          updatedAt,
          __v,
          ...rest
        } = facilitySource;
        return { ...rest };
      };

      const facilityFromSearch =
        selectedFacility &&
        (selectedFacility.CMS_Certification_Number_CCN || selectedFacility.Chain_ID);

      const zipForDatasetString = toTrimmedString(basePayload.address.zipCode);
      let payload;

      if (facilityFromSearch) {
        const cleanedFacility = cleanseFacilitySource(selectedFacility);
        const providerName =
          sanitizeText(cleanedFacility.Provider_Name) ||
          sanitizeText(cleanedFacility.Chain) ||
          sanitizeText(formData.name) ||
          "";
        const providerId =
          cleanedFacility.CMS_Certification_Number_CCN ||
          cleanedFacility.Chain_ID ||
          sanitizeText(formData.providerNumber) ||
          "";

        payload = removeUndefinedFields({
          ...cleanedFacility,
          ...basePayload,
          Provider_Name: providerName,
          CMS_Certification_Number_CCN: providerId,
          Provider_Address: basePayload.address.street || cleanedFacility.Provider_Address || "",
          City_Town: basePayload.address.city || cleanedFacility.City_Town || "",
          State: basePayload.address.state || cleanedFacility.State || "",
          ZIP_Code:
            zipForDatasetString ||
            toTrimmedString(cleanedFacility.ZIP_Code) ||
            "",
          Telephone_Number:
            normalizedPrimaryPhoneString ||
            toTrimmedString(cleanedFacility.Telephone_Number) ||
            "",
          Number_of_Certified_Beds:
            bedsString ||
            toTrimmedString(cleanedFacility.Number_of_Certified_Beds) ||
            "",
          name: providerName,
          providerNumber: providerId,
        });

        payload.size = {
          beds:
            bedsNumber ??
            toNumberOrNull(cleanedFacility.size?.beds) ??
            toNumberOrNull(cleanedFacility.Number_of_Certified_Beds) ??
            0,
          floors:
            floorsNumber ??
            toNumberOrNull(cleanedFacility.size?.floors) ??
            0,
        };
      } else if (isEditing && selectedFacility) {
        const cleanedFacility = cleanseFacilitySource(selectedFacility);
        const providerName =
          sanitizeText(formData.name) ||
          sanitizeText(cleanedFacility.Provider_Name) ||
          sanitizeText(cleanedFacility.Chain) ||
          "";
        const providerId =
          sanitizeText(formData.providerNumber) ||
          cleanedFacility.CMS_Certification_Number_CCN ||
          cleanedFacility.Chain_ID ||
          "";

        payload = removeUndefinedFields({
          ...cleanedFacility,
          ...basePayload,
          Provider_Name: providerName,
          CMS_Certification_Number_CCN: providerId,
          Provider_Address: basePayload.address.street || cleanedFacility.Provider_Address || "",
          City_Town: basePayload.address.city || cleanedFacility.City_Town || "",
          State: basePayload.address.state || cleanedFacility.State || "",
          ZIP_Code:
            zipForDatasetString ||
            toTrimmedString(cleanedFacility.ZIP_Code) ||
            "",
          Telephone_Number:
            normalizedPrimaryPhoneString ||
            toTrimmedString(cleanedFacility.Telephone_Number) ||
            "",
          Number_of_Certified_Beds:
            bedsString ||
            toTrimmedString(cleanedFacility.Number_of_Certified_Beds) ||
            "",
          name: providerName,
          providerNumber: providerId,
        });

        payload.size = {
          beds:
            bedsNumber ??
            toNumberOrNull(cleanedFacility.size?.beds) ??
            toNumberOrNull(cleanedFacility.Number_of_Certified_Beds) ??
            0,
          floors:
            floorsNumber ??
            toNumberOrNull(cleanedFacility.size?.floors) ??
            0,
        };
      } else {
        const providerName = sanitizeText(formData.name);
        const providerId = sanitizeText(formData.providerNumber);

        payload = removeUndefinedFields({
          ...basePayload,
          Provider_Name: providerName,
          CMS_Certification_Number_CCN: providerId,
          Provider_Address: basePayload.address.street || "",
          City_Town: basePayload.address.city || "",
          State: basePayload.address.state || "",
          ZIP_Code: zipForDatasetString || "",
          Telephone_Number: normalizedPrimaryPhoneString || "",
          Number_of_Certified_Beds: bedsString || "",
          name: providerName,
          providerNumber: providerId,
        });

        payload.size = {
          beds: bedsNumber ?? 0,
          floors: floorsNumber ?? 0,
        };
      }

      if (onSubmit) {
       const response = await onSubmit(payload, clearPersistedData);
 
       if (response && response.status && response.data) {
        clearPersistedData(); // Clear persisted data on success
        toast.success("Facility added successfully", { position: "top-center" }, { duration: 500 });
        //clear the search results and forms populated from the nursing home database
        setSearchResults([]);
        localStorage.removeItem("linkFacilityData");
        setSearchTerm("");
        handleClearFilters();
        setSearchResults([]);
        setShowAdvancedFilters(false);
        setFormData({});
        navigate("/facilities");
       }

      } else {
        const response = await api.facility.addFacility(payload);
        if (response && response.status && response.data) {
          clearPersistedData(); // Clear persisted data on success
          toast.success("Facility added successfully", { position: "top-center" }, { duration: 500 });
          //clear the search results and forms populated from the nursing home database
          setSearchResults([]);
          localStorage.removeItem("linkFacilityData");
          setSearchTerm("");
          handleClearFilters();
          setSearchResults([]);
          setShowAdvancedFilters(false);
          setFormData({});
          navigate("/facilities");
        }
      }
    } catch (error) {
      
      toast.error(error.message || "An error occurred. Please try again.", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const activeAdvancedFilters = (() => {
    const filters = [];
    const addressQuery = (searchFilters.address || "").trim();
    const cityQuery = (searchFilters.city || "").trim();
    const stateQuery = (searchFilters.state || "").trim();

    if (addressQuery) filters.push({ label: "Address", value: addressQuery });
    if (cityQuery) filters.push({ label: "City", value: cityQuery });
    if (stateQuery) filters.push({ label: "State", value: stateQuery });

    return filters;
  })();

  const hasSearchParams = (() => {
    const nameQuery = searchTerm.trim();
    return nameQuery.length >= 3 || activeAdvancedFilters.length > 0;
  })();

  const contentPaddingTop = (() => {
    if (step !== 1 || isEditing) {
      return "6rem"; // Header height allowance
    }

    if (showAdvancedFilters) {
      return "19rem"; // Header + search + expanded filters
    }

    if (activeAdvancedFilters.length > 0) {
      return "15rem"; // Header + search + badges
    }

    return "13rem"; // Header + search input baseline
  })();

  const handleToggleAdvancedFilters = () => {
    setShowAdvancedFilters((prev) => {
      const next = !prev;
      if (!next) {
        setSearchStateOpen(false);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen">
         {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex p-2 sm:flex-row sm:items-center justify-between gap-6 max-w-7xl mx-auto py-2">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-base font-bold text-gray-900 mb-2">
                  {isEditing ? "Edit Facility" : "Add Facility"} 
                  {!isEditing && <span className="text-sm text-gray-500 bg-[#ECEDF5] px-2 py-1 rounded-md ml-2">via Nursing Home</span>}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  clearPersistedData();
                  navigate("/facilities");
                }
              }}
              variant="outline"
              className="border-gray-300 w-fit"
            >
              <X className="w-5 h-5 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
      {/* Search Input - Fixed below header, only show on step 1 */}
      {step === 1 && !isEditing && (
        <div className="fixed top-[60px] left-0 right-0 z-40 bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for your facility..."
                  className="w-full h-12 pr-10"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <Button
                    type="link"
                    variant="ghost"
                    onClick={handleToggleAdvancedFilters}
                    className="w-fit justify-between text-[#000000] hover:text-[#065B7D] text-sm font-medium border-none underline"
                  >
                    <span>Advanced Filters</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showAdvancedFilters ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                  {activeAdvancedFilters.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleClearFilters}
                      className="w-fit text-[#BF0D20] hover:text-[#8F0A18] text-sm font-medium border-none underline"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
                {!showAdvancedFilters && activeAdvancedFilters.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeAdvancedFilters.map((filter) => (
                      <Badge key={filter.label} variant="secondary" className="bg-[#ECEDF5] text-gray-700">
                        {filter.label}: {filter.value}
                      </Badge>
                    ))}
                  </div>
                )}
                {showAdvancedFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      value={searchFilters.address}
                      onChange={(e) =>
                        setSearchFilters((prev) => ({ ...prev, address: e.target.value }))
                      }
                      placeholder="Address"
                      className="h-11 border-none bg-[#9FA2B8]/10"
                    />
                    <Input
                      value={searchFilters.city}
                      onChange={(e) =>
                        setSearchFilters((prev) => ({ ...prev, city: e.target.value }))
                      }
                      placeholder="City"
                      className="h-11 border-none bg-[#9FA2B8]/10"
                    />
                    <Popover open={searchStateOpen} onOpenChange={setSearchStateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={searchStateOpen}
                          className="w-full justify-between border-none bg-[#9FA2B8]/10 h-11"
                        >
                          {searchFilters.state || "State"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command className="bg-white">
                          <CommandInput placeholder="Search state..." />
                          <CommandList>
                            <CommandEmpty>No state found.</CommandEmpty>
                            <CommandGroup>
                              {states.map((state) => (
                                <CommandItem
                                  key={state}
                                  value={state}
                                  onSelect={(currentValue) => {
                                    setSearchFilters((prev) => ({
                                      ...prev,
                                      state: currentValue === prev.state ? "" : currentValue,
                                    }));
                                    setSearchStateOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      searchFilters.state === state ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {state}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Main Content */}
      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8"
        style={{ paddingTop: contentPaddingTop }}
      >
        {step === 1 ? (
          <>


        {searching && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Locating facility, kindly wait...</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {searchResults.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results ({searchResults.length})
              </h2>
              <p className="text-gray-500 mt-1">Select a facility to connect</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {searchResults.map((result, index) => (
                <Card
                  key={index}
                  className="p-3 hover:shadow-lg transition-all cursor-pointer border-none  bg-[#ECEDF5]/20"
                  onClick={() => handleSelectFacility(result)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    {(result.Overall_Rating || result.Average_overall_5_star_rating) && (
                      <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        {result.Overall_Rating || result.Average_overall_5_star_rating}/5
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-[15px] font-semibold text-gray-900 mb-3 line-clamp-2">
                    {result.Provider_Name || result.Chain}
                  </h3>

                  <div className="space-y-2 mb-4">
                    {(result.CMS_Certification_Number_CCN || result.Chain_ID) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium text-[13px] mr-2">Provider ID:</span>
                        <Badge variant="outline" className="text-xs">
                          {result.CMS_Certification_Number_CCN || result.Chain_ID}
                        </Badge>
                      </div>
                    )}

                    {result.Provider_Address && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="line-clamp-1">
                          {result.Provider_Address}, {result.City_Town}, {result.State}
                        </span>
                      </div>
                    )}

                    {result.Number_of_Certified_Beds && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{result.Number_of_Certified_Beds} Certified Beds</span>
                      </div>
                    )}

                    {result.Number_of_facilities && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{result.Number_of_facilities} Facilities</span>
                      </div>
                    )}

                    {result.Number_of_states_and_territories_with_operations && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          {
                            result.Number_of_states_and_territories_with_operations
                          }{" "}
                          State(s)
                        </span>
                      </div>
                    )}
                  </div>

                   <div className="flex justify-end">
                   <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectFacility(result);
                    }}
                    className="w-fit text-xs"
                    size="sm"
                    style={{ backgroundColor: '#065B7D' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#054A66'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#065B7D'}
                  >
                    Link Facility
                  </Button>
                   </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results Message */}
        {searchResults.length === 0 &&
          hasSearchParams &&
          !searching && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Facilities Found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm.trim().length > 0
                  ? `We couldn't find any facilities matching "${searchTerm}"`
                  : "We couldn't find any facilities matching your filters"}
              </p>
              <div className="flex flex-col gap-3 items-center">
                
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    handleClearFilters();
                    setSearchResults([]);
                    setShowAdvancedFilters(false);
                  }}
                  variant="outline"
                >
                  Try Another Search
                </Button>
                <Button
                  onClick={() => {
                    setSelectedFacility(null);
                    setStep(2);
                  }}
                  variant="outline"
                  className="text-blue-600 hover:text-blue-700"
                >
                  No facility found, add manually
                </Button>
              </div>
            </div>
          )}

        {/* Empty State */}
        {!hasSearchParams && searchResults.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200  p-12 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Find Your Facility
            </h3>
            <p className="text-gray-600">
              Search for your facility in the nursing home database to
              automatically link and sync your data
            </p>
          </div>
        )}
          </>
        ) : (
          // Step 2: Additional Details Form
          <div className="bg-white rounded-lg border-none p-6">
            <div className="mb-6">
              <button
                onClick={() => setStep(1)}
                className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
              </button>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Complete Facility Details
              </h2>
              {selectedFacility && (
                <div className="mb-4">
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedFacility.Provider_Name || selectedFacility.Chain || selectedFacility.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Provider ID: {selectedFacility.CMS_Certification_Number_CCN || selectedFacility.Chain_ID || selectedFacility.providerNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Facility Name, Type and Provider Number (only for manual entry) */}
            {!selectedFacility && (
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Facility Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter facility name"
                      className="border-none bg-[#9FA2B8]/10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Facility Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        handleInputChange("type", value)
                      }
                      disabled={loadingTypes}
                    > 
                      <SelectTrigger className="border-none bg-[#9FA2B8]/10">
                        <SelectValue
                          placeholder={loadingTypes ? "Loading facility types..." : "Select facility type"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {facilityTypes.map((type) => (
                          <SelectItem key={type._id || type} value={type._id || type}>
                            {type.name || type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="providerNumber">Provider Number</Label>
                    <Input
                      id="providerNumber"
                      value={formData.providerNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, providerNumber: e.target.value })
                      }
                      placeholder="Enter provider number"
                      className="border-none bg-[#9FA2B8]/10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Address Section */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-gray-900">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value },
                      })
                    }
                    placeholder="123 Sunset Blvd"
                    className="border-none bg-[#9FA2B8]/10"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                    placeholder="New York"
                    className="border-none bg-[#9FA2B8]/10"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Popover open={stateOpen} onOpenChange={setStateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={stateOpen}
                        className="w-full justify-between border-none bg-[#9FA2B8]/10 h-11"
                      >
                        {formData.address.state ? states.find((s) => s === formData.address.state) : "Select state..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command className="bg-white">
                        <CommandInput placeholder="Search state..." />
                        <CommandList>
                          <CommandEmpty>No state found.</CommandEmpty>
                          <CommandGroup>
                            {states.map((state) => (
                              <CommandItem
                                key={state}
                                value={state}
                                onSelect={(currentValue) => {
                                  setFormData({
                                    ...formData,
                                    address: { ...formData.address, state: currentValue === formData.address.state ? "" : currentValue },
                                  });
                                  setStateOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${formData.address.state === state ? "opacity-100" : "opacity-0"}`}
                                />
                                {state}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.address.zipCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, zipCode: e.target.value },
                      })
                    }
                    placeholder="62701"
                    className="border-none bg-[#9FA2B8]/10"
                  />
                </div>
              </div>
            </div>

            {/* Size Section */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-gray-900">Size</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="beds">Number of Beds</Label>
                  <Input
                    id="beds"
                    type="number"
                    value={formData.size.beds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        size: { ...formData.size, beds: e.target.value },
                      })
                    }
                    placeholder="12"
                    className="border-none bg-[#9FA2B8]/10"
                  />
                </div>
                <div>
                  <Label htmlFor="floors">Number of Floors</Label>
                  <Input
                    id="floors"
                    type="number"
                    value={formData.size.floors}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        size: { ...formData.size, floors: e.target.value },
                      })
                    }
                    placeholder="6"
                    className="border-none bg-[#9FA2B8]/10"
                  />
                </div>
              </div>
            </div>

            {/* Contacts Section */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-gray-900">Contacts</h4>
              {formData.contact.map((contact, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`contact-name-${index}`}>Name</Label>
                      <Input
                        id={`contact-name-${index}`}
                        value={contact.name}
                        onChange={(e) => {
                          const newContacts = [...formData.contact];
                          newContacts[index].name = e.target.value;
                          setFormData({ ...formData, contact: newContacts });
                        }}
                        placeholder="Sarah Johnson"
                        className="border-none bg-[#9FA2B8]/10"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`contact-role-${index}`}>Role</Label>
                      <Input
                        id={`contact-role-${index}`}
                        value={contact.role}
                        onChange={(e) => {
                          const newContacts = [...formData.contact];
                          newContacts[index].role = e.target.value;
                          setFormData({ ...formData, contact: newContacts });
                        }}
                        placeholder="Administrator"
                        className="border-none bg-[#9FA2B8]/10"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`contact-phone-${index}`}>Phone</Label>
                      <Input
                        id={`contact-phone-${index}`}
                        value={contact.phone}
                        onChange={(e) => {
                          const newContacts = [...formData.contact];
                          newContacts[index].phone = e.target.value;
                          setFormData({ ...formData, contact: newContacts });
                        }}
                        placeholder="(555) 123-4567"
                        className="border-none bg-[#9FA2B8]/10"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`contact-email-${index}`}>Email</Label>
                      <Input
                        id={`contact-email-${index}`}
                        type="email"
                        value={contact.email}
                        onChange={(e) => {
                          const newContacts = [...formData.contact];
                          newContacts[index].email = e.target.value;
                          setFormData({ ...formData, contact: newContacts });
                        }}
                        placeholder="sarah.johnson@sunsetmanor.com"
                        className="border-none bg-[#9FA2B8]/10"
                      />
                    </div>
                  </div>
                  {formData.contact.length > 1 && (
                   <div className="flex items-center justify-end">
                        <button
                      type="button"
                      onClick={() => {
                        const newContacts = formData.contact.filter((_, i) => i !== index);
                            setFormData({ ...formData, contact: newContacts });
                      }}
                      className="text-red-600 bg-red-50 p-2 rounded-md text-xs hover:text-red-700 mt-4 text-sm flex items-center justify-end gap-2 hover:underline"
                    >
                       Remove Contact
                    </button>
                   </div>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    ...formData,
                    contact: [
                      ...formData.contact,
                      { name: "", phone: "", email: "", role: "" },
                    ],
                  });
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Contact
              </Button>
            </div>

            {/* Date Of Last Annual Survey */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-gray-900">
                Date of Last Annual Survey
              </h4>

              <div className="space-y-2">
                <Label
                  htmlFor="lastSurvey"
                  className="text-sm font-medium text-gray-700"
                >
                  Last Survey Date
                </Label>

                <DatePicker
                  date={
                    formData.lastSurvey
                      ? new Date(formData.lastSurvey + "T00:00:00")
                      : undefined
                  }
                  onSelect={(date) =>
                    handleInputChange(
                      "lastSurvey",
                      date ? date.toISOString().split("T")[0] : ""
                    )
                  }
                  placeholder="Select date of last annual survey"
                  className="w-full"
                />
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-gray-900">Additional Notes</h4>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any additional notes about this facility..."
                className="w-full p-3 border-none bg-[#9FA2B8]/10 rounded-md resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3 justify-end">
              {!isEditing && (
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="w-fit"
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleSubmitFacility}
                className="w-fit bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (isEditing ? "Updating Facility..." : "Adding Facility...") : (isEditing ? "Update Facility" : "Add Facility")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkFacility;
