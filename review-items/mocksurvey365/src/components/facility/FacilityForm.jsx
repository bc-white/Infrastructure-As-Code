import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { DatePicker } from "../ui/date-picker";
import { Link } from "react-router-dom";
import {
  X,
  Plus,
  MapPin,
  Building2,
  Users,
  Phone,
  Calendar,
  FileText,
  Tag,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../service/api";

const FacilityForm = ({
  facility = null,
  onSubmit,
  onCancel,
  isEditing = false,
  disabled = false,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "USA",
    },
    size: {
      beds: "",
      squareFootage: "",
      floors: "",
    },
    contacts: [
      {
        name: "",
        phone: "",
        email: "",
        role: "",
      },
    ],
    secondaryContactPhone: "",
    notes: "",
    tags: [],
    contractStart: "",
    monthlyFee: "",
    providerNumber: "",
    lastSurvey: "",
    // Additional fields from nursing home database
    chainId: "",
    numberOfFacilities: "",
    nursingHomeData: null, // Store full nursing home object
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState({});
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [addMode, setAddMode] = useState(isEditing ? "manual" : null); // 'manual' or 'connect' or null
  const [showModeModal, setShowModeModal] = useState(!isEditing); // Show modal by default for new facilities only

  // Auto-set mode if facility data is passed (from LinkFacility)
  useEffect(() => {
    if (!isEditing && facility && facility.nursingHomeData) {
      setAddMode("connect");
      setShowModeModal(false);
    }
  }, [facility, isEditing]);

  useEffect(() => {
    if (facility) {
      const processedFacility = {
        ...facility,
        type: facility.type?._id || facility.type || "",
        address: facility.address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "USA",
        },
        size: facility.size || {
          beds: "",
          squareFootage: "",
          floors: "",
        },
        contacts:
          Array.isArray(facility.contact) && facility.contact.length > 0
            ? Array.isArray(facility.contact[0]) &&
              facility.contact[0].length > 0
              ? Array.isArray(facility.contact[0][0]) &&
                facility.contact[0][0].length > 0
                ? facility.contact[0][0]
                : facility.contact[0]
              : facility.contact
            : facility.contact || [
                {
                  name: "",
                  phone: "",
                  email: "",
                  role: "",
                },
              ],
        contractStart: facility.contractStart || "",
        monthlyFee: facility.monthlyFee || "",
        facilityId: facility.providerNumber || "",
        lastSurvey: facility.lastSurvey
          ? facility.lastSurvey.split("T")[0]
          : "",
        secondaryContactPhone: facility.secondaryContactPhone || "",
        tags: facility.tags || [],
      };

      setFormData(processedFacility);
    }
  }, [facility]);

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
       
        toast.error("Failed to load facility types.", {
          position: "top-right",
        });
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchFacilityTypes();
  }, []);

  const states = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY", 
  ];

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAddContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          name: "",
          phone: "",
          email: "",
          role: "",
        },
      ],
    }));
  };

  const handleRemoveContact = (index) => {
    if (formData.contacts.length > 1) {
      setFormData((prev) => ({
        ...prev,
        contacts: prev.contacts.filter((_, i) => i !== index),
      }));
    }
  };

  const handleContactChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      ),
    }));
  };

  const searchNursingHomes = async (name) => {
    if (!name || name.trim().length < 3) {
      toast.error("Please enter at least 3 characters to search", {
        position: "top-right",
      });
      return;
    }

    try {
      setSearching(true);
      const response = await api.facility.searchNursingHomes(name);

      if (
        response &&
        response.status &&
        response.data &&
        response.data.nursinghomes
      ) {
        setSearchResults(response.data.nursinghomes);
        setShowSearchModal(true);
      } else {
        toast.error("No facilities found", { position: "top-right" });
        setSearchResults([]);
      }
    } catch (error) {
    
      toast.error("Failed to search facilities", { position: "top-right" });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    // Auto-fill form with search result data
    setFormData((prev) => ({
      ...prev,
      name: result.Chain || prev.name,
      // Try to extract provider number if available
      providerNumber: result.Chain_ID || prev.providerNumber,
      chainId: result.Chain_ID || "",
      numberOfFacilities: result.Number_of_facilities || "",
      // Store full nursing home data object
      nursingHomeData: result,
      // Store additional data in notes
      notes: `${
        prev.notes ? prev.notes + "\n\n" : ""
      }Automatically imported from nursing home database.\nChain ID: ${
        result.Chain_ID || "N/A"
      }\nNumber of Facilities: ${
        result.Number_of_facilities || "N/A"
      }\nAverage Overall Rating: ${
        result.Average_overall_5_star_rating || "N/A"
      }/5`.trim(), 
    }));
    setShowSearchModal(false);
    setSearchResults([]);
    toast.success("Facility data imported successfully", {
      position: "top-right",
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Facility name is required";
    if (!formData.type) newErrors.type = "Facility type is required";
    if (!formData.address.street.trim())
      newErrors["address.street"] = "Street address is required";
    if (!formData.address.city.trim())
      newErrors["address.city"] = "City is required";
    if (!formData.address.state)
      newErrors["address.state"] = "State is required";
    if (!formData.address.zipCode.trim())
      newErrors["address.zipCode"] = "ZIP code is required";
    if (!formData.size.beds)
      newErrors["size.beds"] = "Number of beds is required";

    // Validate contacts - at least one contact with name and phone required
    if (!formData.contacts || formData.contacts.length === 0) {
      newErrors.contacts = "At least one contact is required";
    } else {
      formData.contacts.forEach((contact, index) => {
        if (!contact.name.trim()) {
          newErrors[`contacts.${index}.name`] = "Contact name is required";
        }
        if (!contact.phone.trim()) {
          newErrors[`contacts.${index}.phone`] = "Contact phone is required";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled || !validateForm()) return;

    // formData.nursingHomeData
    // remove nursingHomeData from formData
    const { nursingHomeData, numberOfFacilities, chainId, ...rest } = formData;
    const processedData = {
      ...rest,
      contact: formData.contacts,
      type: formData.type,
    };

    onSubmit(processedData);
  };

  return (
    <div>
      {addMode === "manual" && (
        <div className="border-b border-gray-200">
          <div className="flex p-2 sm:flex-row sm:items-center justify-between gap-6 max-w-7xl mx-auto py-2">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-base font-bold text-gray-900 mb-2">
                    Add Facility{" "}
                    <span className="text-sm text-gray-500 bg-[#ECEDF5] px-2 py-1 rounded-md ml-2">
                      via Manual Adding
                    </span>
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {!isEditing && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    onClick={() => setShowModeModal(true)}
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                   
                    Link Facility
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Mode Selection Modal */}
      {!isEditing && showModeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Facility
              </h2>
              <button
                onClick={() => setShowModeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <button
                type="button"
                onClick={() => setAddMode("manual")}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  addMode === "manual"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Manually Add Facility
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enter your facility details and staff information
                      yourself.
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      addMode === "manual"
                        ? "border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {addMode === "manual" && (
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAddMode("connect")}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  addMode === "connect"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Link your existing facility
                    </h3>
                    <p className="text-sm text-gray-600">
                      Search the nursing home database to auto-fill facility
                      information.
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      addMode === "connect"
                        ? "border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {addMode === "connect" && (
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                </div>
              </button>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <Button
                onClick={() => {
                  if (addMode === "connect") {
                    // Navigate to link facility page
                    navigate("/facility/link");
                  } else if (addMode === "manual") {
                    setShowModeModal(false);
                  }
                }}
                disabled={!addMode}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {addMode === "manual" && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CardContent className="p-6">
            {/* Add Mode Selector Toggle */}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Basic Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Facility Name *
                    </Label>
                    {!isEditing && addMode === "connect" ? (
                      <div className="flex gap-2">
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          placeholder="Search facility name..."
                          className={`h-11 flex-1 border-none bg-[#9FA2B8]/10 ${
                            errors.name ? "focus:ring-red-500" : ""
                          }`}
                        />
                        <Button
                          type="button"
                          onClick={() => searchNursingHomes(formData.name)}
                          disabled={
                            searching ||
                            !formData.name ||
                            formData.name.trim().length < 3
                          }
                          className="h-11 px-4 bg-blue-600 hover:bg-blue-700"
                          title="Search in nursing home database"
                        >
                          {searching ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="Enter facility name"
                        className={`h-11 border-none bg-[#9FA2B8]/10 ${
                          errors.name ? "focus:ring-red-500" : ""
                        }`}
                      />
                    )}
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <X className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="type"
                      className="text-sm font-medium text-gray-700"
                    >
                      Facility Type *
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        handleInputChange("type", value)
                      }
                      disabled={loadingTypes}
                    >
                      <SelectTrigger
                        className={`h-11 border-none bg-[#9FA2B8]/10 ${
                          errors.type ? "focus:ring-red-500" : ""
                        }`}
                      >
                        <SelectValue
                          placeholder={
                            loadingTypes
                              ? "Loading facility types..."
                              : "Select facility type"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {facilityTypes.map((type) => (
                          <SelectItem
                            key={type._id || type}
                            value={type._id || type}
                          >
                            {type.name || type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <X className="w-4 h-4" />
                        {errors.type}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="providerNumber"
                    className="text-sm font-medium text-gray-700"
                  >
                    Provider Number
                  </Label>
                  <Input
                    id="providerNumber"
                    value={formData.providerNumber}
                    onChange={(e) =>
                      handleInputChange("providerNumber", e.target.value)
                    }
                    placeholder="Enter provider number"
                    className="h-11 border-none bg-[#9FA2B8]/10"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900">Address</h4>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="street"
                      className="text-sm font-medium text-gray-700"
                    >
                      Street Address *
                    </Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) =>
                        handleInputChange("address.street", e.target.value)
                      }
                      placeholder="123 Sunset Blvd"
                      className={`h-11 border-none bg-[#9FA2B8]/10 ${
                        errors["address.street"] ? "focus:ring-red-500" : ""
                      }`}
                    />
                    {errors["address.street"] && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <X className="w-4 h-4" />
                        {errors["address.street"]}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="city"
                        className="text-sm font-medium text-gray-700"
                      >
                        City *
                      </Label>
                      <Input
                        id="city"
                        value={formData.address.city}
                        onChange={(e) =>
                          handleInputChange("address.city", e.target.value)
                        }
                        placeholder="Tema"
                        className={`h-11 border-none bg-[#9FA2B8]/10 ${
                          errors["address.city"] ? "focus:ring-red-500" : ""
                        }`}
                      />
                      {errors["address.city"] && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <X className="w-4 h-4" />
                          {errors["address.city"]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="state"
                        className="text-sm font-medium text-gray-700"
                      >
                        State *
                      </Label>
                      <Select
                        value={formData.address.state}
                        onValueChange={(value) =>
                          handleInputChange("address.state", value)
                        }
                      >
                        <SelectTrigger
                          className={`h-11 border-none bg-[#9FA2B8]/10 ${
                            errors["address.state"] ? "focus:ring-red-500" : ""
                          }`}
                        >
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors["address.state"] && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <X className="w-4 h-4" />
                          {errors["address.state"]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="zipCode"
                        className="text-sm font-medium text-gray-700"
                      >
                        ZIP Code *
                      </Label>
                      <Input
                        id="zipCode"
                        value={formData.address.zipCode}
                        onChange={(e) =>
                          handleInputChange("address.zipCode", e.target.value)
                        }
                        placeholder="62701"
                        className={`h-11 border-none bg-[#9FA2B8]/10 ${
                          errors["address.zipCode"] ? "focus:ring-red-500" : ""
                        }`}
                      />
                      {errors["address.zipCode"] && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <X className="w-4 h-4" />
                          {errors["address.zipCode"]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Size & Capacity */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900">Size & Capacity</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="beds"
                      className="text-sm font-medium text-gray-700"
                    >
                      Number of Beds *
                    </Label>
                    <Input
                      id="beds"
                      type="number"
                      value={formData.size.beds}
                      onChange={(e) =>
                        handleInputChange("size.beds", e.target.value)
                      }
                      placeholder="12"
                      className={`h-11 border-none bg-[#9FA2B8]/10 ${
                        errors["size.beds"] ? "focus:ring-red-500" : ""
                      }`}
                    />
                    {errors["size.beds"] && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <X className="w-4 h-4" />
                        {errors["size.beds"]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="floors"
                      className="text-sm font-medium text-gray-700"
                    >
                      Number of Floors
                    </Label>
                    <Input
                      id="floors"
                      type="number"
                      value={formData.size.floors}
                      onChange={(e) =>
                        handleInputChange("size.floors", e.target.value)
                      }
                      placeholder="6"
                      className="h-11 border-none bg-[#9FA2B8]/10"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900">Contacts</h4>

                {formData.contacts.map((contact, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 relative"
                  >
                    {formData.contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(index)}
                        className="absolute top-4 right-4 text-red-600 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`contactName-${index}`}
                          className="text-sm font-medium text-gray-700"
                        >
                          Contact Name *
                        </Label>
                        <Input
                          id={`contactName-${index}`}
                          value={contact.name}
                          onChange={(e) =>
                            handleContactChange(index, "name", e.target.value)
                          }
                          placeholder="Sarah Johnson"
                          className={`h-11 border-none bg-[#9FA2B8]/10 ${
                            errors[`contacts.${index}.name`]
                              ? "focus:ring-red-500"
                              : ""
                          }`}
                        />
                        {errors[`contacts.${index}.name`] && (
                          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                            <X className="w-4 h-4" />
                            {errors[`contacts.${index}.name`]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`contactRole-${index}`}
                          className="text-sm font-medium text-gray-700"
                        >
                          Contact Role
                        </Label>
                        <Input
                          id={`contactRole-${index}`}
                          value={contact.role}
                          onChange={(e) =>
                            handleContactChange(index, "role", e.target.value)
                          }
                          placeholder="Administrator"
                          className="h-11 border-none bg-[#9FA2B8]/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`contactPhone-${index}`}
                          className="text-sm font-medium text-gray-700"
                        >
                          Contact Phone *
                        </Label>
                        <Input
                          id={`contactPhone-${index}`}
                          value={contact.phone}
                          onChange={(e) =>
                            handleContactChange(index, "phone", e.target.value)
                          }
                          placeholder="(555) 123-4567"
                          className={`h-11 border-none bg-[#9FA2B8]/10 ${
                            errors[`contacts.${index}.phone`]
                              ? "focus:ring-red-500"
                              : ""
                          }`}
                        />
                        {errors[`contacts.${index}.phone`] && (
                          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                            <X className="w-4 h-4" />
                            {errors[`contacts.${index}.phone`]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`contactEmail-${index}`}
                          className="text-sm font-medium text-gray-700"
                        >
                          Contact Email
                        </Label>
                        <Input
                          id={`contactEmail-${index}`}
                          type="email"
                          value={contact.email}
                          onChange={(e) =>
                            handleContactChange(index, "email", e.target.value)
                          }
                          placeholder="sarah.johnson@sunsetmanor.com"
                          className="h-11 border-none bg-[#9FA2B8]/10"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddContact}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Contact
                </Button>

                {errors.contacts && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    {errors.contacts}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900">Specialty</h4>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag (e.g., Memory Care, Rehabilitation)"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddTag())
                      }
                      className="h-11 border-none bg-[#9FA2B8]/10"
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      variant="outline"
                      size="sm"
                      className="h-11 px-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Specialty
                    </Button>
                  </div>

                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-2 px-3 py-2 text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
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

              {/* Notes */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900">
                  Additional Notes
                </h4>

                <div className="space-y-2">
                  <Label
                    htmlFor="notes"
                    className="text-sm font-medium text-gray-700"
                  >
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any additional notes about this facility..."
                    rows={4}
                    className="border-none bg-[#9FA2B8]/10 resize-none"
                  />
                </div>
              </div>

              {/* Search Results Modal */}
              {showSearchModal && searchResults.length > 0 && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Select a Facility from Database
                      </h2>
                      <button
                        onClick={() => {
                          setShowSearchModal(false);
                          setSearchResults([]);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="overflow-y-auto px-6 py-4 flex-1">
                      <div className="space-y-3">
                        {searchResults.map((result, index) => (
                          <div
                            key={index}
                            onClick={() => selectSearchResult(result)}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                  {result.Chain}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                  {result.Chain_ID && (
                                    <div>
                                      <span className="font-medium">
                                        Chain ID:
                                      </span>{" "}
                                      {result.Chain_ID}
                                    </div>
                                  )}
                                  {result.Number_of_facilities && (
                                    <div>
                                      <span className="font-medium">
                                        Facilities:
                                      </span>{" "}
                                      {result.Number_of_facilities}
                                    </div>
                                  )}
                                  {result.Average_overall_5_star_rating && (
                                    <div>
                                      <span className="font-medium">
                                        Rating:
                                      </span>{" "}
                                      {result.Average_overall_5_star_rating}/5
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Select
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200">
                      <Button
                        onClick={() => {
                          setShowSearchModal(false);
                          setSearchResults([]);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="h-11 px-6 order-2 sm:order-1"
                  disabled={disabled}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 px-6 sm:px-8 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                  disabled={disabled}
                >
                  {disabled
                    ? isEditing
                      ? "Updating..."
                      : "Adding..."
                    : isEditing
                    ? "Update Facility"
                    : "Add Facility"}
                </Button>
              </div>
            </form>
          </CardContent>
        </div>
      )}
    </div>
  );
};

export default FacilityForm;
