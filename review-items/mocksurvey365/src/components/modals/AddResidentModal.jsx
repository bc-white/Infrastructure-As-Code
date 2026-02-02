import React, { useState, useEffect, useCallback, memo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { DatePicker } from "../ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { X, Check, ChevronsUpDown } from "lucide-react";
import api from "../../service/api";

const AddResidentModal = memo(({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isDisabled = false,
  title = "Add New Resident",
  saveButtonText = "Add Resident",
}) => {
  const [formData, setFormData] = useState({
    name: "",
    room: "",
    admissionDate: null,
    diagnosis: "",
    canBeInterviewed: true,
    specialTypes: [],
    specialTypesOthers: [],
    notes: "",
  });

  const [showOthersInput, setShowOthersInput] = useState(false);
  const [specialTypesList, setSpecialTypesList] = useState([]);
  const [loadingSpecialTypes, setLoadingSpecialTypes] = useState(false);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          room: initialData.room || "",
          admissionDate: initialData.admissionDate ? new Date(initialData.admissionDate) : null,
          diagnosis: initialData.diagnosis || initialData.primaryDiagnosis || "",
          canBeInterviewed: initialData.canBeInterviewed ?? initialData.interviewable ?? true,
          specialTypes: initialData.specialTypes || initialData.specialNeeds || [],
          specialTypesOthers: initialData.specialTypesOthers || [],
          notes: initialData.notes || "",
        });
        // Check if there are custom types (items not in specialTypesList)
        const hasOthers = (initialData.specialTypesOthers || []).length > 0;
        setShowOthersInput(hasOthers);
      } else {
        setFormData({
          name: "",
          room: "",
          admissionDate: null,
          diagnosis: "",
          canBeInterviewed: true,
          specialTypes: [],
          specialTypesOthers: [],
          notes: "",
        });
        setShowOthersInput(false);
      }
    }
  }, [isOpen, initialData]);

  // Fetch special types on mount
  useEffect(() => {
    const fetchSpecialTypes = async () => {
      try {
        setLoadingSpecialTypes(true);
        const response = await api.survey.getSpecialTypes();
        if (response && response.status && response.data) {
          const types = response.data.map(item =>
            typeof item === 'string' ? item : item.name || item.label || item
          );
          if (!types.includes("Others")) {
            types.push("Others");
          }
          setSpecialTypesList(types);
        }
      } catch (error) {
        
        setSpecialTypesList([
          "Dementia",
          "Behavioral",
          "Wound Care",
          "IV Therapy",
          "Oxygen",
          "Dialysis",
          "Others",
        ]);
      } finally {
        setLoadingSpecialTypes(false);
      }
    };
    fetchSpecialTypes();
  }, []);

  // Memoized handlers to prevent unnecessary re-renders
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSpecialTypeToggle = useCallback((type) => {
    if (type === "Others") {
      setShowOthersInput(prev => {
        if (prev) {
          // Clear specialTypesOthers when hiding
          setFormData(f => ({ ...f, specialTypesOthers: [] }));
        }
        return !prev;
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      specialTypes: prev.specialTypes.includes(type)
        ? prev.specialTypes.filter(t => t !== type)
        : [...prev.specialTypes, type],
    }));
  }, []);

  const handleRemoveSpecialType = useCallback((type) => {
    setFormData(prev => ({
      ...prev,
      specialTypes: prev.specialTypes.filter(t => t !== type),
    }));
  }, []);

  const handleRemoveOtherType = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      specialTypesOthers: prev.specialTypesOthers.filter((_, i) => i !== index),
    }));
  }, []);

  const handleAddOtherType = useCallback((value) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        specialTypesOthers: [...(prev.specialTypesOthers || []), value.trim()],
      }));
    }
  }, []);

  const handleSave = useCallback(() => {
    // Merge specialTypesOthers into specialTypes (excluding "Others")
    const mergedSpecialTypes = [
      ...formData.specialTypes.filter(t => t !== "Others"),
      ...(formData.specialTypesOthers || []),
    ];

    const dataToSave = {
      ...formData,
      specialTypes: mergedSpecialTypes,
    };

    // Remove specialTypesOthers from the final data
    delete dataToSave.specialTypesOthers;

    onSave(dataToSave);
  }, [formData, onSave]);

  const handleClose = useCallback(() => {
    setFormData({
      name: "",
      room: "",
      admissionDate: null,
      diagnosis: "",
      canBeInterviewed: true,
      specialTypes: [],
      specialTypesOthers: [],
      notes: "",
    });
    setShowOthersInput(false);
    onClose();
  }, [onClose]);

  const isValid = formData.name && formData.room && formData.admissionDate;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <h3 className="text-xl font-semibold text-gray-900">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Fill in the resident details below
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Resident Name *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter resident name"
                disabled={isDisabled}
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Room */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Room Number *
              </Label>
              <Input
                value={formData.room}
                onChange={(e) => handleInputChange("room", e.target.value)}
                placeholder="Enter room number"
                disabled={isDisabled}
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Admission Date */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Admission Date *
            </Label>
            <DatePicker
              date={formData.admissionDate}
              onSelect={(date) => handleInputChange("admissionDate", date)}
              placeholder="Select admission date"
              disabled={isDisabled}
              className="w-full"
            />
          </div>

          {/* Diagnosis */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Diagnosis
            </Label>
            <Input
              value={formData.diagnosis}
              onChange={(e) => handleInputChange("diagnosis", e.target.value)}
              placeholder="Enter diagnosis (optional)"
              disabled={isDisabled}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Interview Status */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Interview Status
            </Label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.canBeInterviewed}
                onChange={(e) => handleInputChange("canBeInterviewed", e.target.checked)}
                disabled={isDisabled}
                className="w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-[#075b7d] disabled:opacity-50"
              />
              <span className="text-sm text-gray-700">Can be interviewed</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Check if this resident can be interviewed for surveys
            </p>
          </div>

          {/* Special Types */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Special Types
            </Label>
            {!loadingSpecialTypes && (
              <div className="space-y-3">
                {/* Selected tags */}
                {formData.specialTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.specialTypes.map((type) => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className="text-xs bg-[#075b7d]/10 text-[#075b7d] border-[#075b7d]/20 flex items-center gap-1 px-2 py-1"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialType(type)}
                          disabled={isDisabled}
                          className="hover:bg-[#075b7d]/20 rounded-full p-0.5 transition-colors disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Searchable multi-select combobox */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      disabled={isDisabled}
                      className="w-full justify-between h-10 font-normal text-sm"
                    >
                      <span className="text-gray-500">
                        {formData.specialTypes.length > 0
                          ? `${formData.specialTypes.length} type(s) selected`
                          : "Search and select special types..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search special types..." />
                      <CommandList>
                        <CommandEmpty>No special type found.</CommandEmpty>
                        <CommandGroup>
                          {specialTypesList.map((type) => (
                            <CommandItem
                              key={type}
                              value={type}
                              onSelect={() => handleSpecialTypeToggle(type)}
                              className="cursor-pointer"
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  type === "Others"
                                    ? showOthersInput
                                      ? "opacity-100 text-[#075b7d]"
                                      : "opacity-0"
                                    : formData.specialTypes.includes(type)
                                    ? "opacity-100 text-[#075b7d]"
                                    : "opacity-0"
                                }`}
                              />
                              {type}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Others input */}
            {showOthersInput && (
              <div className="space-y-2 mt-4">
                <Label className="text-xs text-gray-600 block">
                  Other Special Types:
                </Label>
                {/* Display existing tags */}
                {Array.isArray(formData.specialTypesOthers) &&
                  formData.specialTypesOthers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.specialTypesOthers.map((item, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 px-2 py-1"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => handleRemoveOtherType(index)}
                            disabled={isDisabled}
                            className="hover:bg-blue-200 rounded-full p-0.5 transition-colors disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                {/* Input for adding new tags */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.includes(",")) {
                        const newItems = value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean);
                        newItems.forEach(handleAddOtherType);
                        e.target.value = "";
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.value.trim()) {
                        e.preventDefault();
                        handleAddOtherType(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    placeholder="Type and press Enter or use comma to separate"
                    disabled={isDisabled}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Notes
            </Label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any additional notes about this resident..."
              rows={3}
              disabled={isDisabled}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid || isDisabled}
              className="px-6 bg-[#075b7d] hover:bg-[#075b7d]/90"
            >
              {saveButtonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

AddResidentModal.displayName = "AddResidentModal";

export default AddResidentModal;
