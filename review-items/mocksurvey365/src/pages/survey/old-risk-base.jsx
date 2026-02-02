import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { DatePicker } from "../../components/ui/date-picker";
import {
  CheckSquare,
  FileText,
  Save,
  Download,
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  X,
  Lock,
  Plus, 
  Trash2,
} from "lucide-react";
import { surveyAPI, healthAssistantAPI, surveySocketService } from "../../service/api";
import { toast } from "sonner";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";

const CLINICAL_AREA_KEYS = [
  "admissions",
  "behaviors",
  "falls",
  "changeInCondition",
  "grievances",
  "hospitalReadmissions",
  "incidents",
  "infections",
  "pain",
  "pressureUlcers",
  "ivTherapy",
  "weightLoss",
  "psychotropicMedications",
  "activities",
  "staffEducation",
];

const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

const normalizeDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }
  const parsedDate = new Date(value);
  return isValidDate(parsedDate) ? parsedDate : null;
};

const normalizeResidentEntry = (resident = {}) => {
  const normalized = {
    ...resident,
    name: resident?.name || "",
    room: resident?.room || "",
    notes: resident?.notes || "",
  };

  normalized.admissionDate = normalizeDateValue(resident?.admissionDate);

  return normalized;
};

const ensureResidentArray = (residents) =>
  Array.isArray(residents) ? residents.map((resident) => normalizeResidentEntry(resident)) : [];

// FTag Response Display Component
const FTagResponseDisplay = ({ isLoading, responseData }) => {
  if (isLoading) {
    return (
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-xs text-blue-700">Loading F-Tag information...</span>
        </div>
      </div>
    );
  }

  if (!responseData) {
    return null;
  }

  return (
    <div className="mt-2 p-2 sm:p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
      <div className="flex flex-wrap items-start gap-2">
        <Badge 
          variant={responseData.compliant ? "default" : "destructive"}
          className={responseData.compliant 
            ? "bg-green-100 text-green-800 border-green-200 text-xs flex-shrink-0" 
            : "bg-red-100 text-red-800 border-red-200 text-xs flex-shrink-0"
          }
        >
          {responseData.ftag || 'N/A'}
        </Badge>
        {responseData.compliant !== undefined && (
          <Badge 
            variant="outline"
            className={responseData.compliant 
              ? "bg-green-50 text-green-700 border-green-300 text-xs flex-shrink-0" 
              : "bg-red-50 text-red-700 border-red-300 text-xs flex-shrink-0"
            }
          >
            {responseData.compliant ? 'Compliant' : 'Non-Compliant'}
          </Badge>
        )}
      </div>
      
      {responseData.citation && (
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-1">Citation:</p>
          <p className="text-xs text-slate-600 leading-relaxed break-words">{responseData.citation}</p>
        </div>
      )}
      
      {responseData.explanation && (
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-1">Explanation:</p>
          <p className="text-xs text-slate-600 leading-relaxed break-words">{responseData.explanation}</p>
        </div>
      )}
    </div>
  );
};

// Section Header Component (similar to LifeSafetySurvey)
const SectionHeader = ({ sectionId, title, isExpanded, onToggle, itemCount, isDisabled = false }) => {
  return (
    <button 
      className={`w-full p-3 sm:p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${isDisabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-20 cursor-pointer'}`}
      onClick={onToggle}
      disabled={isDisabled}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-slate-900 text-xs sm:text-sm truncate">{title}</h3>
          </div>
        </div>
        {itemCount !== undefined && (
          <span className="text-xs text-slate-500 px-2 py-1 rounded-md font-medium flex-shrink-0">
            {itemCount}
          </span>
        )}
      </div>
    </button>
  );
};

// Clinical Area Component
const ClinicalArea = memo(({ 
  areaId, 
  title, 
  regulatoryBasis, 
  residentSample, 
  selfReportItems, 
  surveyFocusItems,
  data,
  onDataChange,
  isExpanded,
  onToggle,
  isDisabled = false
}) => {
  const [loadingStates, setLoadingStates] = useState({});

  const handleAnswerChange = async (section, field, answer) => {
    const currentData = data || {};
    
    // For custom items, just update the answer without API call
    if (field.startsWith('custom_item_')) {
    onDataChange(areaId, {
      ...currentData,
      [section]: {
        ...(currentData[section] || {}),
          [field]: answer
        }
      });
      return;
    }

    // For predefined questions, update answer and call API
    onDataChange(areaId, {
      ...currentData,
      [section]: {
        ...(currentData[section] || {}),
        [field]: answer
      }
    });

    // Call health assistant API for predefined questions only (not custom questions)
    // Custom questions have field names like "custom_item_0", "custom_item_1", etc.
    if (field.startsWith('item_')) {
      let questionText = '';
      
      // Determine question text based on section and field index
      if (section === 'selfReport' && selfReportItems) {
        const idx = parseInt(field.replace('item_', ''));
        if (idx >= 0 && idx < selfReportItems.length) {
          questionText = selfReportItems[idx];
        }
      } else if (section === 'surveyFocus' && surveyFocusItems) {
        const idx = parseInt(field.replace('item_', ''));
        if (idx >= 0 && idx < surveyFocusItems.length) {
          questionText = surveyFocusItems[idx];
        }
      }
      
      // Only call API if we have a valid question text
      if (questionText) {
        const responseKey = `${section}_${field}`;
        setLoadingStates(prev => ({ ...prev, [responseKey]: true }));
        
        try {
          const response = await healthAssistantAPI.getFTagInfo(questionText, answer);
          if (response?.data) {
            // Store F-Tag response in the main data structure
            const updatedData = {
              ...currentData,
              [section]: {
                ...(currentData[section] || {}),
                [field]: answer,
                [`${field}_ftagResponse`]: response.data
              }
            };
            onDataChange(areaId, updatedData);
          }
        } catch (error) {
         
          // Store null response to indicate API call failed
          const updatedData = {
            ...currentData,
            [section]: {
              ...(currentData[section] || {}),
              [field]: answer,
              [`${field}_ftagResponse`]: null
            }
          };
          onDataChange(areaId, updatedData);
        } finally {
          setLoadingStates(prev => ({ ...prev, [responseKey]: false }));
        }
      }
    }
  };

  const handleTextChange = (section, field, value) => {
    const currentData = data || {};
    // If section is a top-level property (like 'notes'), set it directly
    if (section === field) {
      onDataChange(areaId, {
        ...currentData,
        [section]: value
      });
    } else {
      // Otherwise, it's a nested object
      onDataChange(areaId, {
        ...currentData,
        [section]: {
          ...(currentData[section] || {}),
          [field]: value
        }
      });
    }
  };

  const handleCheckboxChange = (section, field, checked) => {
    const currentData = data || {};
    onDataChange(areaId, {
      ...currentData,
      [section]: {
        ...(currentData[section] || {}),
        [field]: checked
      }
    });
  };

  const residentEntries = ensureResidentArray(data?.residentSample?.residents);

  const handleAddResident = () => {
    if (isDisabled) return;
    const currentData = data || {};
    const currentResidentSample = currentData.residentSample || {};
    const currentResidents = ensureResidentArray(currentResidentSample.residents);
    if (currentResidents.length >= 3) return;

    const updatedResidents = [
      ...currentResidents,
      normalizeResidentEntry({})
    ];

    onDataChange(areaId, {
      ...currentData,
      residentSample: {
        ...currentResidentSample,
        residents: updatedResidents
      }
    });
  };

  const handleRemoveResident = (index) => {
    if (isDisabled) return;
    const currentData = data || {};
    const currentResidentSample = currentData.residentSample || {};
    const currentResidents = ensureResidentArray(currentResidentSample.residents);
    const updatedResidents = currentResidents.filter((_, idx) => idx !== index);

    onDataChange(areaId, {
      ...currentData,
      residentSample: {
        ...currentResidentSample,
        residents: updatedResidents
      }
    });
  };

  const handleResidentFieldChange = (index, field, value) => {
    const currentData = data || {};
    const currentResidentSample = currentData.residentSample || {};
    const currentResidents = ensureResidentArray(currentResidentSample.residents);

    const updatedResidents = currentResidents.map((resident, idx) => {
      if (idx !== index) return resident;

      let nextValue = value;
      if (field === "admissionDate") {
        nextValue = normalizeDateValue(value);
      }

      return {
        ...resident,
        [field]: field === "admissionDate" ? nextValue : value
      };
    });

    onDataChange(areaId, {
      ...currentData,
      residentSample: {
        ...currentResidentSample,
        residents: updatedResidents
      }
    });
  };

  const handleResidentDateChange = (index, date) => {
    handleResidentFieldChange(index, "admissionDate", date || null);
  };

  // Get custom questions from data
  const customSelfReportItems = Array.isArray(data?.customSelfReportItems) ? data.customSelfReportItems : [];
  const customSurveyFocusItems = Array.isArray(data?.customSurveyFocusItems) ? data.customSurveyFocusItems : [];
  
  // Exclude self-report items from count for Admissions
  const itemCount = areaId === "admissions" 
    ? surveyFocusItems.length + customSurveyFocusItems.length
    : selfReportItems.length + surveyFocusItems.length + customSelfReportItems.length + customSurveyFocusItems.length;

  // Handle adding custom self-report item
  const handleAddCustomSelfReport = () => {
    if (isDisabled) return;
    const currentData = data || {};
    const currentCustom = Array.isArray(currentData.customSelfReportItems) ? currentData.customSelfReportItems : [];
    onDataChange(areaId, {
      ...currentData,
      customSelfReportItems: [...currentCustom, ""]
    });
  };

  // Handle removing custom self-report item
  const handleRemoveCustomSelfReport = (index) => {
    if (isDisabled) return;
    const currentData = data || {};
    const currentCustom = Array.isArray(currentData.customSelfReportItems) ? currentData.customSelfReportItems : [];
    onDataChange(areaId, {
      ...currentData,
      customSelfReportItems: currentCustom.filter((_, idx) => idx !== index)
    });
  };

  // Handle updating custom self-report item
  const handleUpdateCustomSelfReport = (index, value) => {
    const currentData = data || {};
    const currentCustom = Array.isArray(currentData.customSelfReportItems) ? currentData.customSelfReportItems : [];
    const updated = [...currentCustom];
    updated[index] = value;
    onDataChange(areaId, {
      ...currentData,
      customSelfReportItems: updated
    });
  };

  // Handle adding custom survey focus item
  const handleAddCustomSurveyFocus = () => {
    if (isDisabled) return;
    const currentData = data || {};
    const currentCustom = Array.isArray(currentData.customSurveyFocusItems) ? currentData.customSurveyFocusItems : [];
    onDataChange(areaId, {
      ...currentData,
      customSurveyFocusItems: [...currentCustom, ""]
    });
  };

  // Handle removing custom survey focus item
  const handleRemoveCustomSurveyFocus = (index) => {
    if (isDisabled) return;
    const currentData = data || {};
    const currentCustom = Array.isArray(currentData.customSurveyFocusItems) ? currentData.customSurveyFocusItems : [];
    onDataChange(areaId, {
      ...currentData,
      customSurveyFocusItems: currentCustom.filter((_, idx) => idx !== index)
    });
  };

  // Handle updating custom survey focus item
  const handleUpdateCustomSurveyFocus = (index, value) => {
    const currentData = data || {};
    const currentCustom = Array.isArray(currentData.customSurveyFocusItems) ? currentData.customSurveyFocusItems : [];
    const updated = [...currentCustom];
    updated[index] = value;
    onDataChange(areaId, {
      ...currentData,
      customSurveyFocusItems: updated
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <SectionHeader
        sectionId={areaId}
        title={title}
        isExpanded={isExpanded}
        onToggle={onToggle}
        itemCount={itemCount}
        isDisabled={isDisabled}
      />
      
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 sm:p-6 space-y-6">
          {/* Regulatory Basis */}
          <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 flex-shrink-0" />
                        Regulatory Basis
                      </Label>
            <div className="flex flex-wrap gap-2">
              {regulatoryBasis.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Resident Sample */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Users className="h-4 w-4 flex-shrink-0" />
              Resident Sample
            </Label>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs sm:text-sm text-slate-700 break-words">{residentSample}</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                id={`${areaId}-residents-selected`}
                checked={data?.residentSample?.selected || false}
                onCheckedChange={(checked) => 
                  handleCheckboxChange('residentSample', 'selected', checked)
                }
                disabled={isDisabled}
              />
              <Label htmlFor={`${areaId}-residents-selected`} className={`text-xs sm:text-sm text-slate-700 break-words ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                3 residents selected and added to surveyor-initiated sample
              </Label>
            </div>
            <div className="mt-3 space-y-3">
              {residentEntries.length === 0 && (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-slate-600">
                    Add up to three residents who meet the criteria for this sample. Document their name, location, and any relevant notes gathered during the review.
                  </p>
                </div>
              )}

              {residentEntries.map((resident, idx) => {
                const admissionDateValue = resident?.admissionDate
                  ? resident.admissionDate instanceof Date
                    ? resident.admissionDate
                    : normalizeDateValue(resident.admissionDate)
                  : null;

                return (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-slate-700 block mb-1">
                            Resident Name
                          </Label>
                          <Input
                            value={resident.name || ""}
                            onChange={(e) => handleResidentFieldChange(idx, "name", e.target.value)}
                            placeholder="Enter resident name"
                            disabled={isDisabled}
                            className="text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                          />
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-slate-700 block mb-1">
                            Room / Unit
                          </Label>
                          <Input
                            value={resident.room || ""}
                            onChange={(e) => handleResidentFieldChange(idx, "room", e.target.value)}
                            placeholder="Enter room or unit"
                            disabled={isDisabled}
                            className="text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                          />
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-slate-700 block mb-1">
                            Admission Date
                          </Label>
                          <DatePicker
                            date={admissionDateValue}
                            onSelect={(date) => handleResidentDateChange(idx, date)}
                            placeholder="Select admission date"
                            disabled={isDisabled}
                            className="text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                          />
                         
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveResident(idx)}
                        disabled={isDisabled}
                        className="flex-shrink-0 text-slate-500 hover:text-red-600"
                        aria-label="Remove resident"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-slate-700 block mb-1">
                        Notes
                      </Label>
                      <Textarea
                        value={resident.notes || ""}
                        onChange={(e) => handleResidentFieldChange(idx, "notes", e.target.value)}
                        placeholder="Observations, interview notes, follow-up items..."
                        rows={3}
                        disabled={isDisabled}
                        className="w-full text-sm bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs text-slate-500">
                  You can add up to three residents to this sample.
                </p>
                <Button
                  type="button"
                  onClick={handleAddResident}
                  disabled={isDisabled || residentEntries.length >= 3}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs sm:text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Resident
                </Button>
              </div>
            </div>
          </div>

          {/* Self Report Items - Hidden for Admissions */}
          {areaId !== "admissions" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText className="h-4 w-4 flex-shrink-0" />
                Self Report Items
              </Label>
            </div>
            <div className="space-y-2">
              {selfReportItems.map((item, idx) => {
                const responseKey = `selfReport_item_${idx}`;
                const isLoading = loadingStates[responseKey];
                const responseData = data?.selfReport?.[`item_${idx}_ftagResponse`];
                const currentAnswer = data?.selfReport?.[`item_${idx}`] || null;
                
                return (
                  <div key={idx}>
                    <div className="flex items-start gap-3 py-2">
                      <div className="flex-1">
                        <Label className="text-xs sm:text-sm text-slate-700 leading-relaxed block mb-2 break-words">
                          {item}
                        </Label>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant={currentAnswer === 'Yes' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleAnswerChange('selfReport', `item_${idx}`, 'Yes')}
                            disabled={isDisabled || isLoading}
                            className={`h-8 px-4 text-xs font-medium ${
                              currentAnswer === 'Yes' 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            Yes
                          </Button>
                          <Button
                            type="button"
                            variant={currentAnswer === 'No' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleAnswerChange('selfReport', `item_${idx}`, 'No')}
                            disabled={isDisabled || isLoading}
                            className={`h-8 px-4 text-xs font-medium ${
                              currentAnswer === 'No' 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            No
                          </Button>
                        </div>
                      </div>
                    </div>
                    <FTagResponseDisplay 
                      isLoading={isLoading} 
                      responseData={responseData}
                    />
                  </div>
                );
              })}
              
              {/* Divider for custom items */}
              {customSelfReportItems.length > 0 && (
                <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-200">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Custom Items</span>
                </div>
              )}
              
              {/* Custom Self Report Items */}
              {customSelfReportItems.map((item, idx) => {
                const currentAnswer = data?.selfReport?.[`custom_item_${idx}`] || null;
                
                return (
                  <div key={`custom-selfreport-${idx}`} className="flex items-start gap-3 py-2 group">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={item}
                        onChange={(e) => handleUpdateCustomSelfReport(idx, e.target.value)}
                        placeholder="Enter custom self-report item..."
                        disabled={isDisabled}
                        className="text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={currentAnswer === 'Yes' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAnswerChange('selfReport', `custom_item_${idx}`, 'Yes')}
                          disabled={isDisabled}
                          className={`h-8 px-4 text-xs font-medium ${
                            currentAnswer === 'Yes' 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={currentAnswer === 'No' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAnswerChange('selfReport', `custom_item_${idx}`, 'No')}
                          disabled={isDisabled}
                          className={`h-8 px-4 text-xs font-medium ${
                            currentAnswer === 'No' 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          No
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCustomSelfReport(idx)}
                          disabled={isDisabled}
                          className="flex-shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove custom question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Add Custom Self Report Button */}
              {!isDisabled && (
                <div className="pt-1">
                  <Button
                    type="button"
                    onClick={handleAddCustomSelfReport}
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-dashed border-slate-300 hover:border-slate-400"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Item
                  </Button>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Survey Focus */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
            <Label className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 flex-shrink-0" />
              Survey Focus
            </Label>
            </div>
            <div className="space-y-2">
              {surveyFocusItems.map((item, idx) => {
                const responseKey = `surveyFocus_item_${idx}`;
                const isLoading = loadingStates[responseKey];
                const responseData = data?.surveyFocus?.[`item_${idx}_ftagResponse`];
                const currentAnswer = data?.surveyFocus?.[`item_${idx}`] || null;
                
                return (
                  <div key={idx}>
                    <div className="flex items-start gap-3 py-2">
                      <div className="flex-1">
                        <Label className="text-xs sm:text-sm text-slate-700 leading-relaxed block mb-2 break-words">
                          {item}
                        </Label>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant={currentAnswer === 'Yes' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleAnswerChange('surveyFocus', `item_${idx}`, 'Yes')}
                            disabled={isDisabled || isLoading}
                            className={`h-8 px-4 text-xs font-medium ${
                              currentAnswer === 'Yes' 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            Yes
                          </Button>
                          <Button
                            type="button"
                            variant={currentAnswer === 'No' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleAnswerChange('surveyFocus', `item_${idx}`, 'No')}
                            disabled={isDisabled || isLoading}
                            className={`h-8 px-4 text-xs font-medium ${
                              currentAnswer === 'No' 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            No
                          </Button>
                        </div>
                      </div>
                    </div>
                    <FTagResponseDisplay 
                      isLoading={isLoading} 
                      responseData={responseData}
                    />
                  </div>
                );
              })}
              
              {/* Divider for custom items */}
              {customSurveyFocusItems.length > 0 && (
                <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-200">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Custom Items</span>
                </div>
              )}
              
              {/* Custom Survey Focus Items */}
              {customSurveyFocusItems.map((item, idx) => {
                const currentAnswer = data?.surveyFocus?.[`custom_item_${idx}`] || null;
                
                return (
                  <div key={`custom-focus-${idx}`} className="flex items-start gap-3 py-2 group">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={item}
                        onChange={(e) => handleUpdateCustomSurveyFocus(idx, e.target.value)}
                        placeholder="Enter custom survey focus question..."
                        disabled={isDisabled}
                        className="text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={currentAnswer === 'Yes' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAnswerChange('surveyFocus', `custom_item_${idx}`, 'Yes')}
                          disabled={isDisabled}
                          className={`h-8 px-4 text-xs font-medium ${
                            currentAnswer === 'Yes' 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={currentAnswer === 'No' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAnswerChange('surveyFocus', `custom_item_${idx}`, 'No')}
                          disabled={isDisabled}
                          className={`h-8 px-4 text-xs font-medium ${
                            currentAnswer === 'No' 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          No
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCustomSurveyFocus(idx)}
                          disabled={isDisabled}
                          className="flex-shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove custom question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Add Custom Survey Focus Button */}
              {!isDisabled && (
                <div className="pt-1">
                  <Button
                    type="button"
                    onClick={handleAddCustomSurveyFocus}
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-dashed border-slate-300 hover:border-slate-400"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Question
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Notes/Observations */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-semibold text-slate-700">Notes & Observations</Label>
            <Textarea
              value={data?.notes || ""}
              onChange={(e) => handleTextChange('notes', 'notes', e.target.value)}
              placeholder="Enter findings, observations, interviews, and any additional notes..."
              rows={4}
              disabled={isDisabled}
              className="w-full text-xs sm:text-sm bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      )}
    </div>
  );
});

ClinicalArea.displayName = 'ClinicalArea';

// Annual Education Component
const AnnualEducationSection = memo(({ data, onDataChange, isExpanded, onToggle, isDisabled = false }) => {
  const educationItems = [
    "Abuse, Neglect, and Exploitation Prevention (F600–F607): Recognition, reporting procedures, and mandated reporter training.",
    "Resident Rights and Confidentiality (F550–F586): Including HIPAA compliance.",
    "Infection Prevention and Control (F880–F882): Hand hygiene, PPE, transmission-based precautions, and outbreak management.",
    "Emergency Preparedness and Fire Safety (F838): Disaster plan review and fire drills.",
    "Falls and Accident Prevention (F689): Root-cause analysis and preventive interventions.",
    "Pressure Injury Prevention and Skin Integrity (F686–F687): Risk assessment and repositioning protocols.",
    "Medication Administration and Error Prevention (F760–F761): \"Five rights,\" labeling, storage, and documentation.",
    "Pain Management and Comfort Care (F697): Assessment and reassessment documentation.",
    "Behavior Management and Psychotropic Use (F740–F758): Non-pharmacologic approaches and monitoring.",
    "Dementia and Trauma-Informed Care (F740–F741): Person-centered behavioral care.",
    "Infection Surveillance and Antibiotic Stewardship (F881): Appropriate antibiotic use and reporting.",
    "Nutrition and Hydration Monitoring (F692–F694): Meal assistance, choking prevention, and hydration tracking.",
    "QAPI Awareness (F865): Staff role in identifying and correcting systemic issues.",
    "Elopement Prevention and Resident Safety (F689): Supervision and door alarm testing.",
    "Cultural Competency and Communication: Respectful interaction and care delivery.",
    "OSHA and Bloodborne Pathogens compliance."
  ];

  // Get custom education items from data
  const customEducationItems = Array.isArray(data?.customEducationItems) ? data.customEducationItems : [];
  const itemCount = educationItems.length + customEducationItems.length;

  const [loadingStates, setLoadingStates] = useState({});

  const handleAnswerChange = async (field, answer) => {
    // For custom items, just update the answer without API call
    if (field.startsWith('custom_item_')) {
      onDataChange({
        ...data,
        [field]: answer
      });
      return;
    }

    // For predefined questions, update answer and call API
    onDataChange({
      ...data,
      [field]: answer
    });

    // Call health assistant API for predefined questions only (not custom questions)
    // Custom questions have field names like "custom_item_0", "custom_item_1", etc.
    if (field.startsWith('item_')) {
      const idx = parseInt(field.replace('item_', ''));
      if (idx >= 0 && idx < educationItems.length) {
        const questionText = educationItems[idx];
        const responseKey = `annualEducation_${field}`;
        setLoadingStates(prev => ({ ...prev, [responseKey]: true }));
        
        try {
          const response = await healthAssistantAPI.getFTagInfo(questionText, answer);
          if (response?.data) {
            // Store F-Tag response in the main data structure
            onDataChange({
              ...data,
              [field]: answer,
              [`${field}_ftagResponse`]: response.data
            });
          }
        } catch (error) {
         
          // Store null response to indicate API call failed
          onDataChange({
            ...data,
            [field]: answer,
            [`${field}_ftagResponse`]: null
          });
        } finally {
          setLoadingStates(prev => ({ ...prev, [responseKey]: false }));
        }
      }
    }
  };

  const handleTextChange = (field, value) => {
    onDataChange({
      ...data,
      [field]: value
    });
  };

  // Handle adding custom education item
  const handleAddCustomEducation = () => {
    if (isDisabled) return;
    const currentCustom = Array.isArray(data?.customEducationItems) ? data.customEducationItems : [];
    onDataChange({
      ...data,
      customEducationItems: [...currentCustom, ""]
    });
  };

  // Handle removing custom education item
  const handleRemoveCustomEducation = (index) => {
    if (isDisabled) return;
    const currentCustom = Array.isArray(data?.customEducationItems) ? data.customEducationItems : [];
    onDataChange({
      ...data,
      customEducationItems: currentCustom.filter((_, idx) => idx !== index)
    });
  };

  // Handle updating custom education item
  const handleUpdateCustomEducation = (index, value) => {
    const currentCustom = Array.isArray(data?.customEducationItems) ? data.customEducationItems : [];
    const updated = [...currentCustom];
    updated[index] = value;
    onDataChange({
      ...data,
      customEducationItems: updated
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <SectionHeader
        sectionId="annualEducation"
        title="Annual and Mandatory Education"
        isExpanded={isExpanded}
        onToggle={onToggle}
        itemCount={itemCount}
        isDisabled={isDisabled}
      />
      
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 sm:p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs sm:text-sm text-blue-900 break-words">
              All staff must complete the following at hire and annually. Validation Checklist:
            </p>
          </div>
          <div className="space-y-2">
            {educationItems.map((item, idx) => {
              const responseKey = `annualEducation_item_${idx}`;
              const isLoading = loadingStates[responseKey];
              const responseData = data?.[`item_${idx}_ftagResponse`];
              const currentAnswer = data?.[`item_${idx}`] || null;
              
              return (
                <div key={idx}>
                  <div className="flex items-start gap-3 py-2">
                    <div className="flex-1">
                      <Label className="text-sm text-slate-700 leading-relaxed block mb-2">
                        {item}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={currentAnswer === 'Yes' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAnswerChange(`item_${idx}`, 'Yes')}
                          disabled={isDisabled || isLoading}
                          className={`h-8 px-4 text-xs font-medium ${
                            currentAnswer === 'Yes' 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={currentAnswer === 'No' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAnswerChange(`item_${idx}`, 'No')}
                          disabled={isDisabled || isLoading}
                          className={`h-8 px-4 text-xs font-medium ${
                            currentAnswer === 'No' 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  </div>
                  <FTagResponseDisplay 
                    isLoading={isLoading} 
                    responseData={responseData}
                  />
                </div>
              );
            })}
            
            {/* Divider for custom items */}
            {customEducationItems.length > 0 && (
              <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-200">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Custom Items</span>
              </div>
            )}
            
            {/* Custom Education Items */}
            {customEducationItems.map((item, idx) => {
              const currentAnswer = data?.[`custom_item_${idx}`] || null;
              
              return (
                <div key={`custom-ed-${idx}`} className="flex items-start gap-3 py-2 group">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={item}
                      onChange={(e) => handleUpdateCustomEducation(idx, e.target.value)}
                      placeholder="Enter custom education item..."
                      disabled={isDisabled}
                      className="text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={currentAnswer === 'Yes' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleAnswerChange(`custom_item_${idx}`, 'Yes')}
                        disabled={isDisabled}
                        className={`h-8 px-4 text-xs font-medium ${
                          currentAnswer === 'Yes' 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={currentAnswer === 'No' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleAnswerChange(`custom_item_${idx}`, 'No')}
                        disabled={isDisabled}
                        className={`h-8 px-4 text-xs font-medium ${
                          currentAnswer === 'No' 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        No
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCustomEducation(idx)}
                        disabled={isDisabled}
                        className="flex-shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove custom question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Add Custom Education Button */}
            {!isDisabled && (
              <div className="pt-1">
                <Button
                  type="button"
                  onClick={handleAddCustomEducation}
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-dashed border-slate-300 hover:border-slate-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Item
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Validation Notes</Label>
            <Textarea
              value={data?.validationNotes || ""}
              onChange={(e) => handleTextChange('validationNotes', e.target.value)}
              placeholder="Enter notes about staff education validation, competency checks, and training records..."
              rows={3}
              disabled={isDisabled}
              className="w-full text-sm bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      )}
    </div>
  );
});

AnnualEducationSection.displayName = 'AnnualEducationSection';

// Risk Management Process Component
const RiskManagementProcessSection = memo(({ data, onDataChange, isExpanded, onToggle, isDisabled = false }) => {
  const riskManagementItems = [
    "Staff able to verbalize actions to take if abuse observed.",
    "Staff able to verbalize who to report allegations to.",
    "Documentation supports the reviewing and follow-up of Concern and Comment/Blue Cards of allegations of abuse.",
    "Staff able to verbally how and where to obtain fall intervention equipment and assistive devices.",
    "Staff able to verbalize steps to take if resident exhibits or verbalizes threats of suicide (remain with resident, report to supervisor, etc.).",
    "Burns are being discussed during daily Clinical Grand Rounds.",
    "Facility has a process regarding delivery of hot beverages (not to exceed 155 degrees) to residents and/or visitors.",
    "Falls are being discussed during daily Clinical Grand Rounds.",
    "Facility has a sign-in and sign-out log in place."
  ];

  // Get custom risk management items from data
  const customRiskManagementItems = Array.isArray(data?.customRiskManagementItems) ? data.customRiskManagementItems : [];
  const itemCount = riskManagementItems.length + customRiskManagementItems.length;

  const [loadingStates, setLoadingStates] = useState({});

  const handleAnswerChange = async (field, answer) => {
    // For custom items, just update the answer without API call
    if (field.startsWith('custom_item_')) {
      onDataChange({
        ...data,
        [field]: answer
      });
      return;
    }

    // For predefined questions, update answer and call API
    onDataChange({
      ...data,
      [field]: answer
    });

    // Call health assistant API for predefined questions only (not custom questions)
    // Custom questions have field names like "custom_item_0", "custom_item_1", etc.
    if (field.startsWith('item_')) {
      const idx = parseInt(field.replace('item_', ''));
      if (idx >= 0 && idx < riskManagementItems.length) {
        const questionText = riskManagementItems[idx];
        const responseKey = `riskManagement_${field}`;
        setLoadingStates(prev => ({ ...prev, [responseKey]: true }));
        
        try {
          const response = await healthAssistantAPI.getFTagInfo(questionText, answer);
          if (response?.data) {
            // Store F-Tag response in the main data structure
            onDataChange({
              ...data,
              [field]: answer,
              [`${field}_ftagResponse`]: response.data
            });
          }
        } catch (error) {
          
          // Store null response to indicate API call failed
          onDataChange({
            ...data,
            [field]: answer,
            [`${field}_ftagResponse`]: null
          });
        } finally {
          setLoadingStates(prev => ({ ...prev, [responseKey]: false }));
        }
      }
    }
  };

  const handleTextChange = (field, value) => {
    onDataChange({
      ...data,
      [field]: value
    });
  };

  // Handle adding custom risk management item
  const handleAddCustomRiskManagement = () => {
    if (isDisabled) return;
    const currentCustom = Array.isArray(data?.customRiskManagementItems) ? data.customRiskManagementItems : [];
    onDataChange({
      ...data,
      customRiskManagementItems: [...currentCustom, ""]
    });
  };

  // Handle removing custom risk management item
  const handleRemoveCustomRiskManagement = (index) => {
    if (isDisabled) return;
    const currentCustom = Array.isArray(data?.customRiskManagementItems) ? data.customRiskManagementItems : [];
    onDataChange({
      ...data,
      customRiskManagementItems: currentCustom.filter((_, idx) => idx !== index)
    });
  };

  // Handle updating custom risk management item
  const handleUpdateCustomRiskManagement = (index, value) => {
    const currentCustom = Array.isArray(data?.customRiskManagementItems) ? data.customRiskManagementItems : [];
    const updated = [...currentCustom];
    updated[index] = value;
    onDataChange({
      ...data,
      customRiskManagementItems: updated
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <SectionHeader
        sectionId="riskManagementProcess"
        title="Risk Management Process"
        isExpanded={isExpanded}
        onToggle={onToggle}
        itemCount={itemCount}
        isDisabled={isDisabled}
      />
      
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 sm:p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs sm:text-sm text-blue-900 break-words">
              Evaluate the facility's risk management processes and staff knowledge of critical safety protocols.
            </p>
          </div>
          <div className="space-y-2">
            {riskManagementItems.map((item, idx) => {
              const responseKey = `riskManagement_item_${idx}`;
              const isLoading = loadingStates[responseKey];
              const responseData = data?.[`item_${idx}_ftagResponse`];
              const currentAnswer = data?.[`item_${idx}`] || null;
              
              return (
                <div key={idx}>
                  <div className="flex items-start gap-3 py-2">
                    <div className="flex-1">
                      <Label className="text-sm text-slate-700 leading-relaxed block mb-2">
                        {item}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={currentAnswer === 'Yes' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAnswerChange(`item_${idx}`, 'Yes')}
                          disabled={isDisabled || isLoading}
                          className={`h-8 px-4 text-xs font-medium ${
                            currentAnswer === 'Yes' 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={currentAnswer === 'No' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAnswerChange(`item_${idx}`, 'No')}
                          disabled={isDisabled || isLoading}
                          className={`h-8 px-4 text-xs font-medium ${
                            currentAnswer === 'No' 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  </div>
                  <FTagResponseDisplay 
                    isLoading={isLoading} 
                    responseData={responseData}
                  />
                </div>
              );
            })}
            
            {/* Divider for custom items */}
            {customRiskManagementItems.length > 0 && (
              <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-200">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Custom Items</span>
              </div>
            )}
            
            {/* Custom Risk Management Items */}
            {customRiskManagementItems.map((item, idx) => {
              const currentAnswer = data?.[`custom_item_${idx}`] || null;
              
              return (
                <div key={`custom-risk-${idx}`} className="flex items-start gap-3 py-2 group">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={item}
                      onChange={(e) => handleUpdateCustomRiskManagement(idx, e.target.value)}
                      placeholder="Enter custom risk management item..."
                      disabled={isDisabled}
                      className="text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={currentAnswer === 'Yes' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleAnswerChange(`custom_item_${idx}`, 'Yes')}
                        disabled={isDisabled}
                        className={`h-8 px-4 text-xs font-medium ${
                          currentAnswer === 'Yes' 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={currentAnswer === 'No' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleAnswerChange(`custom_item_${idx}`, 'No')}
                        disabled={isDisabled}
                        className={`h-8 px-4 text-xs font-medium ${
                          currentAnswer === 'No' 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        No
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCustomRiskManagement(idx)}
                        disabled={isDisabled}
                        className="flex-shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove custom question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Add Custom Risk Management Button */}
            {!isDisabled && (
              <div className="pt-1">
                <Button
                  type="button"
                  onClick={handleAddCustomRiskManagement}
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-dashed border-slate-300 hover:border-slate-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Item
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-semibold text-slate-700">Risk Management Notes</Label>
            <Textarea
              value={data?.riskManagementNotes || ""}
              onChange={(e) => handleTextChange('riskManagementNotes', e.target.value)}
              placeholder="Enter notes about risk management processes, observations, and follow-up items..."
              rows={3}
              disabled={isDisabled}
              className="w-full text-xs sm:text-sm bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      )}
    </div>
  );
});

RiskManagementProcessSection.displayName = 'RiskManagementProcessSection';

const FacilityInitiatedSurvey = () => {
  const [surveyData, setSurveyData] = useState({
    // Clinical Areas
    admissions: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    }, 
    behaviors: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    },
    falls: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    },
    changeInCondition: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    }, 
    grievances: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    },
    hospitalReadmissions: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    },
    incidents: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    },
    infections: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    },
    pain: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    },
    pressureUlcers: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    },
    ivTherapy: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    },
    weightLoss: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    },
    psychotropicMedications: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    },
    activities: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    },
    staffEducation: {
      residentSample: { selected: false, residents: [] },
      selfReport: {},
      surveyFocus: {},
      notes: ""
    },
    annualEducation: {},
    riskManagementProcess: {}
  });

  const [expandedSections, setExpandedSections] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFacilityDataLoaded, setShowFacilityDataLoaded] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [isClosingSurvey, setIsClosingSurvey] = useState(false);
  const [closureData, setClosureData] = useState({
    surveyClosed: false,
    closureNotes: "",
    closureSignature: {
      signedBy: "",
      title: "",
      signedDate: new Date(),
      confirmed: false,
    }
  });
  const [surveyClosed, setSurveyClosed] = useState(false);

  // Track unsaved changes to prevent race conditions
  const [unsavedChanges, setUnsavedChanges] = useState({});
  
  // Ref to track unsaved changes for socket listeners (avoids stale closures)
  const unsavedChangesRef = useRef({});
  useEffect(() => {
    unsavedChangesRef.current = unsavedChanges;
  }, [unsavedChanges]);

  const [lastSaveTime, setLastSaveTime] = useState(null);

  // Helper function to convert boolean values to "Yes"/"No" for backward compatibility
  const convertBooleanToYesNo = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    const converted = { ...obj };
    Object.keys(converted).forEach(key => {
      // Skip F-Tag response fields
      if (key.includes('_ftagResponse')) return;
      // Convert boolean to "Yes"/"No"
      if (typeof converted[key] === 'boolean') {
        converted[key] = converted[key] ? 'Yes' : 'No';
      }
    });
    return converted;
  };

  const mergeLoadedSurveyData = useCallback((prevData, loadedData) => {
    if (!loadedData || typeof loadedData !== "object") {
      return prevData;
    }

    const nextData = { ...prevData };

    Object.entries(loadedData).forEach(([key, value]) => {
      if (CLINICAL_AREA_KEYS.includes(key)) {
        const prevArea = prevData[key] || {};
        const incomingArea = value || {};
        const residentSample = {
          ...(prevArea.residentSample || {}),
          ...(incomingArea.residentSample || {})
        };

        // Convert boolean values to "Yes"/"No" in selfReport and surveyFocus
        const selfReport = convertBooleanToYesNo(incomingArea.selfReport || prevArea.selfReport || {});
        const surveyFocus = convertBooleanToYesNo(incomingArea.surveyFocus || prevArea.surveyFocus || {});

        nextData[key] = {
          ...prevArea,
          ...incomingArea,
          residentSample: {
            ...residentSample,
            selected: !!residentSample.selected,
            residents: ensureResidentArray(residentSample.residents || [])
          },
          selfReport: selfReport,
          surveyFocus: surveyFocus,
          notes: incomingArea.notes ?? prevArea.notes ?? "",
          customSelfReportItems: Array.isArray(incomingArea.customSelfReportItems) 
            ? incomingArea.customSelfReportItems 
            : (Array.isArray(prevArea.customSelfReportItems) ? prevArea.customSelfReportItems : []),
          customSurveyFocusItems: Array.isArray(incomingArea.customSurveyFocusItems) 
            ? incomingArea.customSurveyFocusItems 
            : (Array.isArray(prevArea.customSurveyFocusItems) ? prevArea.customSurveyFocusItems : [])
        };
      } else if (key === "annualEducation") {
        // Convert boolean values to "Yes"/"No" in annualEducation
        const annualEd = convertBooleanToYesNo(value || {});
        nextData.annualEducation = {
          ...prevData.annualEducation,
          ...annualEd,
          customEducationItems: Array.isArray(value?.customEducationItems) 
            ? value.customEducationItems 
            : (Array.isArray(prevData.annualEducation?.customEducationItems) 
                ? prevData.annualEducation.customEducationItems 
                : [])
        };
      } else if (key === "riskManagementProcess") {
        // Convert boolean values to "Yes"/"No" in riskManagementProcess
        const riskMgmt = convertBooleanToYesNo(value || {});
        nextData.riskManagementProcess = {
          ...prevData.riskManagementProcess,
          ...riskMgmt,
          customRiskManagementItems: Array.isArray(value?.customRiskManagementItems) 
            ? value.customRiskManagementItems 
            : (Array.isArray(prevData.riskManagementProcess?.customRiskManagementItems) 
                ? prevData.riskManagementProcess.customRiskManagementItems 
                : [])
        };
      } else {
        nextData[key] = value;
      }
    });

    return nextData;
  }, []);

  // Clinical Areas Configuration
  const clinicalAreas = [
    {
      id: "admissions",
      title: "1. Admissions",
      regulatoryBasis: ["F640", "F641", "F642", "F643", "F656"],
      residentSample: "3 new admissions within past 30 days (Surveyor-Initiated Sample)",
      selfReportItems: [
        "Improper admission",
        "Missing PASRR",
        "Failure to complete baseline care plan",
        "Unsafe transfer at admission"
      ],
      surveyFocusItems: [
        "Verify PASRR Level I and II documentation before admission",
        "Confirm baseline care plan completed within 48 hours and resident/family included",
        "Review admission orders for accuracy (medications, diet, therapy, activity)",
        "Confirm orientation and rights information provided at admission",
        "Observe admission documentation process for completeness and timeliness"
      ]
    },
    {
      id: "behaviors",
      title: "2. Behaviors",
      regulatoryBasis: ["F740", "F741", "F742", "F743", "F744", "F758"],
      residentSample: "3 residents with documented behavioral issues or psychotropic use",
      selfReportItems: [
        "Aggression, altercations",
        "Abuse allegations",
        "Elopement related to behaviors"
      ],
      surveyFocusItems: [
        "Review behavior tracking documentation and antecedent/intervention logs",
        "Confirm care plan interventions are individualized and revised as needed",
        "Evaluate use of non-pharmacologic approaches before medication use",
        "Observe interactions to assess staff response and resident dignity",
        "Interview CNAs and nurses about behavior plans and crisis response"
      ]
    },
    {
      id: "falls",
      title: "3. Falls",
      regulatoryBasis: ["F689", "F657", "F684"],
      residentSample: "3 residents who sustained a fall within last 90 days",
      selfReportItems: [
        "Falls with injury or fractures"
      ],
      surveyFocusItems: [
        "Verify fall risk assessments on admission, quarterly, and post-fall",
        "Confirm neurological checks, incident forms, and root-cause analysis",
        "Evaluate documentation of revised interventions post-fall",
        "Observe environment for hazards, call light access, and proper footwear",
        "Interview staff about fall response procedures and prevention education"
      ]
    },
    {
      id: "changeInCondition",
      title: "4. Change in Condition",
      regulatoryBasis: ["F684", "F580", "F622"],
      residentSample: "3 residents with recent condition changes or hospital transfers",
      selfReportItems: [
        "Delayed assessment",
        "Lack of timely physician notification",
        "Neglect"
      ],
      surveyFocusItems: [
        "Verify prompt nursing assessment and provider notification",
        "Review documentation of new orders and follow-up care",
        "Evaluate return-from-hospital process and readmission care plan updates",
        "Observe if staff recognize and act upon subtle condition changes",
        "Interview nurses on protocols for condition change reporting"
      ]
    },
    {
      id: "grievances",
      title: "5. Grievances",
      regulatoryBasis: ["F585", "F609"],
      residentSample: "3 residents who have filed a grievance",
      selfReportItems: [
        "Abuse, neglect, misappropriation",
        "Unresolved grievances"
      ],
      surveyFocusItems: [
        "Confirm grievance log includes acknowledgment, investigation, and resolution",
        "Verify written outcomes provided to resident/representative",
        "Assess timeliness of investigation and communication",
        "Interview residents about satisfaction and fear-free reporting",
        "Review QAPI minutes for grievance trend analysis"
      ]
    },
    {
      id: "hospitalReadmissions",
      title: "6. Hospital Readmissions",
      regulatoryBasis: ["F684", "F661", "F676"],
      residentSample: "3 residents readmitted to hospital within 30–60 days",
      selfReportItems: [
        "Transfers resulting from neglect",
        "Treatment delays",
        "Medication errors leading to hospitalization"
      ],
      surveyFocusItems: [
        "Confirm pre-transfer assessment and documentation of interventions",
        "Verify communication with provider and family prior to transfer",
        "Review medication reconciliation post-return",
        "Check follow-up documentation and care plan revisions",
        "Evaluate QAPI analysis for preventable readmission patterns"
      ]
    },
    {
      id: "incidents",
      title: "7. Incidents / Near Misses",
      regulatoryBasis: ["F607", "F865", "F689"],
      residentSample: "3 residents involved in reportable incidents",
      selfReportItems: [
        "Elopement",
        "Medication errors with harm",
        "Injuries of unknown origin",
        "Resident altercations"
      ],
      surveyFocusItems: [
        "Verify immediate reporting to State and timely internal investigation",
        "Review corrective actions and monitoring plans",
        "Confirm incident report documentation is complete and consistent",
        "Observe staff awareness of reporting protocols",
        "Evaluate inclusion of incident data in QAPI analysis"
      ]
    },
    {
      id: "infections",
      title: "8. Infections",
      regulatoryBasis: ["F880", "F881", "F882"],
      residentSample: "3 residents with recent infection (UTI, pneumonia, wound, or COVID)",
      selfReportItems: [
        "Infection outbreaks",
        "Isolation breaches",
        "Delayed treatment leading to harm"
      ],
      surveyFocusItems: [
        "Verify infection control logs include date, organism, site, and treatment",
        "Observe PPE compliance and hand hygiene",
        "Confirm infection preventionist monitors trends and reports to QAPI",
        "Review staff education on transmission-based precautions",
        "Check for prompt physician notification and antibiotic stewardship documentation"
      ]
    },
    {
      id: "pain",
      title: "9. Pain",
      regulatoryBasis: ["F697"],
      residentSample: "3 residents with documented chronic or acute pain",
      selfReportItems: [
        "Failure to treat pain",
        "Neglect related to unmanaged pain"
      ],
      surveyFocusItems: [
        "Review pain assessments at admission and after interventions",
        "Confirm PRN medication documentation includes reassessment",
        "Evaluate care plan and interdisciplinary involvement",
        "Observe residents for signs of pain and staff response",
        "Interview residents on satisfaction with pain control"
      ]
    },
    {
      id: "pressureUlcers",
      title: "10. Pressure Ulcers (Pressure Injuries)",
      regulatoryBasis: ["F686", "F687"],
      residentSample: "3 residents with current or healed pressure injuries",
      selfReportItems: [
        "New or worsening pressure injuries"
      ],
      surveyFocusItems: [
        "Confirm accurate staging and wound documentation",
        "Verify risk assessments on admission, quarterly and with change in condition (Braden) and preventative interventions",
        "Review wound care physician and nursing documentation for consistency",
        "Observe positioning, offloading, and turning schedules",
        "Interview staff on daily skin checks and care plan updates",
        "Verify protocol for weekly skin checks",
        "Verify care plans are up to date"
      ]
    },
    {
      id: "ivTherapy",
      title: "11. IV Therapy",
      regulatoryBasis: ["F755", "F760", "F761"],
      residentSample: "3 residents currently or recently receiving IV therapy",
      selfReportItems: [
        "Infiltration",
        "Infection",
        "Medication error related to IV administration"
      ],
      surveyFocusItems: [
        "Verify orders for medication, rate, and duration",
        "Check for aseptic technique during IV care",
        "Review line assessments and flushing documentation",
        "Confirm staff IV competency validation and training records",
        "Observe proper labeling and storage of IV medications"
      ] 
    },
    {
      id: "weightLoss",
      title: "12. Significant Weight Loss / Nutrition",
      regulatoryBasis: ["F692", "F693", "F694"],
      residentSample: "3 residents with ≥5% weight loss in 30 days or ≥10% in 180 days",
      selfReportItems: [
        "Malnutrition",
        "Dehydration",
        "Choking with injury/death"
      ],
      surveyFocusItems: [
        "Verify nutrition assessments and dietitian involvement",
        "Review meal intake documentation and supplement orders",
        "Observe meal service for assistance and portion accuracy",
        "Evaluate care plan revisions for ongoing weight loss",
        "Interview residents about satisfaction with meals and snacks"
      ]
    },
    {
      id: "psychotropicMedications",
      title: "13. Psychotropic Medications",
      regulatoryBasis: ["F758", "F757", "F741"],
      residentSample: "3 residents prescribed antipsychotics, anxiolytics, antidepressants, or hypnotics",
      selfReportItems: [
        "Medication error or adverse reaction leading to hospitalization or harm"
      ],
      surveyFocusItems: [
        "Verify diagnosis supports use; consent obtained and documented",
        "Confirm non-pharmacologic interventions attempted prior to initiation",
        "Review GDR (gradual dose reduction) documentation and physician follow-up",
        "Evaluate side effect monitoring and pharmacist monthly review",
        "Observe residents for sedation or behavior changes"
      ]
    },
    {
      id: "activities",
      title: "14. Activities",
      regulatoryBasis: ["F679", "F680"],
      residentSample: "3 residents with different cognitive and physical abilities",
      selfReportItems: [
        "Resident neglect",
        "Lack of supervision",
        "Psychosocial harm due to isolation"
      ],
      surveyFocusItems: [
        "Verify activity assessments reflect interests and capabilities",
        "Review care plan integration and attendance documentation",
        "Observe resident participation and engagement",
        "Interview residents for satisfaction and variety of activities",
        "Confirm sufficient staffing and adaptive equipment for participation"
      ]
    },
    {
      id: "staffEducation",
      title: "15. Staff Education and Competencies",
      regulatoryBasis: ["F941", "F942", "F943", "F944", "F945", "F946", "F947", "F948", "F949", "F695", "F726"],
      residentSample: "3 residents linked to incidents, infection, or care errors to test staff competency correlation",
      selfReportItems: [
        "Abuse, neglect",
        "Infection breaches",
        "Medication errors",
        "Failure to monitor care"
      ],
      surveyFocusItems: [
        "Verify annual education on abuse prevention, infection control, falls, pain, wound care, and dementia care",
        "Review competency checklists for nurses and CNAs (vitals, medication pass, skin care, IV skills, documentation)",
        "Observe direct care for adherence to policy and technique",
        "Interview staff regarding mandatory reporting and resident rights",
        "Review QAPI documentation of staff training follow-up and re-education after incidents",
        "Validate completion of staff performance appraisals"
      ]
    }
  ];

  // Load saved data
  useEffect(() => {
    const loadSurveyData = async () => {
      try {
        setIsLoading(true);
        // Get survey ID from localStorage or URL params
        const surveyId = localStorage.getItem('currentSurveyId') || new URLSearchParams(window.location.search).get('surveyId');
        
        if (surveyId) {
          try {
            // Try to get the survey wizard data for facility info
            const wizardResponse = await surveyAPI.getSurveyWizard(surveyId);
            if (wizardResponse.statusCode === 200 && wizardResponse.data) {
              setShowFacilityDataLoaded(true);
              setTimeout(() => setShowFacilityDataLoaded(false), 5000);
              
              // Check if survey is closed from wizard response
              const isClosed = wizardResponse?.data?.surveyClosureSurvey?.surveyClosed || 
                               wizardResponse?.data?.surveyClosureSurvey?.surveyCompleted ||
                               wizardResponse?.data?.surveyCompleted;
              if (isClosed) {
                setSurveyClosed(true);
              }
            }

            // Try to get the facility initiated survey data
            const response = await surveyAPI.getFacilityInitiatedSurvey(surveyId);
            if (response.statusCode === 200 && response.data) {
              // Merge the loaded data with existing state
              let loadedData = {};
              if (response.data.stepData) {
                loadedData = response.data.stepData;
              } else if (response.data.facilityInitiatedSurvey) {
                loadedData = response.data.facilityInitiatedSurvey;
              } else {
                loadedData = response.data;
              }
              
              // Exclude completedAt from loaded data when setting state
              const { completedAt: _, surveyId: __, submittedAt: ___, ...surveyDataOnly } = loadedData;
              
              setSurveyData(prev => mergeLoadedSurveyData(prev, surveyDataOnly));
            }

            // Try to get survey closure status
            try {
              const closureResponse = await surveyAPI.getSurveyClosure(surveyId);
              if (closureResponse.statusCode === 200 && closureResponse.data) {
                const closure = closureResponse.data.stepData || closureResponse.data;
                if (closure.surveyClosed) {
                  setSurveyClosed(true);
                  const signature = closure.closureSignature || {};
                  setClosureData({
                    surveyClosed: closure.surveyClosed || false,
                    closureNotes: closure.closureNotes || "",
                    closureSignature: {
                      signedBy: signature.signedBy || "",
                      title: signature.title || "",
                      signedDate: signature.signedDate ? new Date(signature.signedDate) : null,
                      confirmed: signature.confirmed || false,
                    }
                  });
                }
              }
            } catch (closureError) {
              // Closure not found is okay, survey might not be closed yet
              //console.log("Survey closure not found or not yet closed");
            }
          } catch (error) {
            //console.error("Error loading survey data:", error);
          }
        }
      } catch (error) {
       // console.error("Error loading survey data:", error);
        toast.error("Failed to load survey data");
      } finally {
        setIsLoading(false);
      }
    };

    loadSurveyData();
  }, []);

  // Socket connection for real-time updates and saving
  useEffect(() => {
    const surveyId = localStorage.getItem('currentSurveyId') || new URLSearchParams(window.location.search).get('surveyId');
    
    // Get user ID from localStorage
    const storedUser = JSON.parse(localStorage.getItem('mocksurvey_user') || '{}');
    const currentUserId = storedUser?._id || storedUser?.id;

    // Only connect if we have both surveyId and userId
    if (!surveyId || !currentUserId) {
      return;
    }

    // Check if socket is already connected with same IDs
    const existingSocket = surveySocketService.getSocket();
    const isAlreadyConnected = existingSocket && existingSocket.connected;

    // Only connect if not already connected
    if (!isAlreadyConnected) {
      surveySocketService.connect(surveyId, currentUserId);
    }

    // Debounce mechanism to prevent multiple simultaneous API calls
    let lastSyncTime = 0;
    const SYNC_DEBOUNCE_MS = 500;

    const shouldSync = () => {
      const now = Date.now();
      if (now - lastSyncTime < SYNC_DEBOUNCE_MS) {
        return false;
      }
      lastSyncTime = now;
      return true;
    };

    const joinRoom = async () => {
      const socket = surveySocketService.getSocket();
      if (socket && socket.connected) {
        // Only join view_risk_based room - this is for receiving updates
        socket.emit("join_view_risk_based", {
          surveyId: surveyId,
          userId: currentUserId
        });

        // Fetch latest data after joining room
        const fetchLatestData = async () => {
          try {
            const response = await surveyAPI.getFacilityInitiatedSurvey(surveyId);
            if (response.statusCode === 200 && response.data) {
              let loadedData = {};
              if (response.data.stepData) {
                loadedData = response.data.stepData;
              } else if (response.data.facilityInitiatedSurvey) {
                loadedData = response.data.facilityInitiatedSurvey;
              } else {
                loadedData = response.data;
              }
              
              const { completedAt: _, surveyId: __, submittedAt: ___, ...surveyDataOnly } = loadedData;
              setSurveyData(prev => mergeLoadedSurveyData(prev, surveyDataOnly));
            }
          } catch (error) {
            // Error fetching latest data
          }
        };

        fetchLatestData();
        setTimeout(fetchLatestData, 1500);
      }
    };

    const handleSocketConnect = (data) => {
      const socket = surveySocketService.getSocket();
      if (socket && socket.connected) {
        joinRoom();
      }
    };

    // Handle view_risk_based broadcast (general real-time updates)
    const handleViewRiskBased = async (message) => {
      // 1. Process data immediately from message if available
      if (message?.data?.facilityInitiatedSurvey) {
        const facilityData = message.data.facilityInitiatedSurvey;
        
        // Merge with existing data using smart merge to preserve unsaved changes
        setSurveyData(prev => {
          const merged = { ...prev };
          const now = Date.now();
          const currentUnsaved = unsavedChangesRef.current;
          
          // Merge each clinical area intelligently
          Object.keys(facilityData).forEach(key => {
            // Skip metadata fields
            if (key === 'surveyId' || key === 'submittedAt' || key === 'surveyMode' || key === 'residents' || key === 'completedAt') {
              return;
            }
            
            const hasUnsavedChanges = currentUnsaved[key];
            const unsavedTimestamp = hasUnsavedChanges?.timestamp || 0;
            
            // If there are very recent unsaved changes (within last 5 seconds), preserve them
            if (hasUnsavedChanges && (now - unsavedTimestamp) < 5000) {
              // Keep the local unsaved data for this field
              return;
            }
            
            // Accept remote data for this field
            merged[key] = facilityData[key];
          });

          return merged;
        });
      }

      // 2. Background sync (debounced) for any additional updates
      if (shouldSync()) {
        try {
          const response = await surveyAPI.getFacilityInitiatedSurvey(surveyId);
          if (response.statusCode === 200 && response.data) {
            let loadedData = {};
            if (response.data.stepData) {
              loadedData = response.data.stepData;
            } else if (response.data.facilityInitiatedSurvey) {
              loadedData = response.data.facilityInitiatedSurvey;
            } else {
              loadedData = response.data;
            }
            
            const { completedAt: _, surveyId: __, submittedAt: ___, ...surveyDataOnly } = loadedData;
            setSurveyData(prev => mergeLoadedSurveyData(prev, surveyDataOnly));
          }
        } catch (error) {
          // Error fetching update
        }
      }
    };

    // Handle risk_based_nonresident broadcast (for facility-based surveys)
    const handleRiskBasedNonresident = async (message) => {
      if (!message?.data?.facilityInitiatedSurvey) {
        return;
      }

      const facilityData = message.data.facilityInitiatedSurvey;

      // Merge with existing data using smart merge to preserve unsaved changes
      setSurveyData(prev => {
        const merged = { ...prev };
        const now = Date.now();
        const currentUnsaved = unsavedChangesRef.current;
        
        // Merge each clinical area intelligently
        Object.keys(facilityData).forEach(key => {
          // Skip metadata fields
          if (key === 'surveyId' || key === 'submittedAt' || key === 'surveyMode' || key === 'residents') {
            return;
          }
          
          const hasUnsavedChanges = currentUnsaved[key];
          const unsavedTimestamp = hasUnsavedChanges?.timestamp || 0;
          
          // If there are very recent unsaved changes (within last 5 seconds), preserve them
          if (hasUnsavedChanges && (now - unsavedTimestamp) < 5000) {
            // Keep the local unsaved data for this field
            return;
          }
          
          // Accept remote data for this field
          merged[key] = facilityData[key];
        });

        return merged;
      });

      toast.success("Survey data updated", {
        description: "Changes from team member received",
        position: 'top-right',
        duration: 3000
      });

      // Background sync for metadata (debounced)
      if (shouldSync()) {
        try {
          const response = await surveyAPI.getFacilityInitiatedSurvey(surveyId);
          if (response.statusCode === 200 && response.data) {
            let loadedData = {};
            if (response.data.stepData) {
              loadedData = response.data.stepData;
            } else if (response.data.facilityInitiatedSurvey) {
              loadedData = response.data.facilityInitiatedSurvey;
            } else {
              loadedData = response.data;
            }
            
            const { completedAt: _, surveyId: __, submittedAt: ___, ...surveyDataOnly } = loadedData;
            setSurveyData(prev => mergeLoadedSurveyData(prev, surveyDataOnly));
          }
        } catch (error) {
          // Error fetching real-time update
        }
      }
    };

    // Register socket event listeners
    surveySocketService.on("connect", handleSocketConnect);
    surveySocketService.on("reconnect", handleSocketConnect);
    surveySocketService.on("view_risk_based", handleViewRiskBased);
    surveySocketService.on("risk_based_nonresident", handleRiskBasedNonresident);

    // If already connected, emit join events immediately
    if (isAlreadyConnected && existingSocket) {
      joinRoom();
    }

    // Retry join after a short delay
    const retryTimer = setTimeout(joinRoom, 2000);

    // Cleanup function
    return () => {
      clearTimeout(retryTimer);
      surveySocketService.off("connect", handleSocketConnect);
      surveySocketService.off("reconnect", handleSocketConnect);
      surveySocketService.off("view_risk_based", handleViewRiskBased);
      surveySocketService.off("risk_based_nonresident", handleRiskBasedNonresident);
    };
  }, []);

  const handleAreaDataChange = useCallback((areaId, newData) => {
    const now = Date.now();
    
    // Track this change as unsaved
    setUnsavedChanges(prev => ({
      ...prev,
      [areaId]: {
        ...(prev[areaId] || {}),
        timestamp: now,
        data: newData
      }
    }));
    
    setSurveyData(prev => ({
      ...prev,
      [areaId]: newData
    }));
  }, []);

  const handleAnnualEducationChange = useCallback((newData) => {
    const now = Date.now();
    
    // Track this change as unsaved
    setUnsavedChanges(prev => ({
      ...prev,
      annualEducation: {
        ...(prev.annualEducation || {}),
        timestamp: now,
        data: newData
      }
    }));
    
    setSurveyData(prev => ({
      ...prev,
      annualEducation: newData
    }));
  }, []);

  const handleRiskManagementProcessChange = useCallback((newData) => {
    const now = Date.now();
    
    // Track this change as unsaved
    setUnsavedChanges(prev => ({
      ...prev,
      riskManagementProcess: {
        ...(prev.riskManagementProcess || {}),
        timestamp: now,
        data: newData
      }
    }));
    
    setSurveyData(prev => ({
      ...prev,
      riskManagementProcess: newData
    }));
  }, []);

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const surveyId = localStorage.getItem('currentSurveyId') || new URLSearchParams(window.location.search).get('surveyId');
      const currentUserData = JSON.parse(localStorage.getItem('mocksurvey_user') || '{}');
      const currentUserId = currentUserData?._id || currentUserData?.id;

      if (!surveyId) {
        toast.error("No survey found. Please create a survey first.", { position: 'top-right' });
        return;
      }

      // Exclude completedAt from surveyData when creating stepData
      const { completedAt: _, ...surveyDataWithoutCompletedAt } = surveyData;
      
      const payload = {
        currentStep: 'facility-initiated-survey',
        stepData: {
          surveyId: surveyId,
          ...surveyDataWithoutCompletedAt,
          submittedAt: new Date().toISOString()
        },
        completedAt: new Date().toISOString()
      };

      // Verify socket is connected
      const socketCheck = surveySocketService.getSocket();
      if (!socketCheck || !socketCheck.connected) {
        // If not connected, try to connect (fallback)
        surveySocketService.connect(surveyId, currentUserId);

        // Wait a moment for connection
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Check again
        const socketAfterConnect = surveySocketService.getSocket();
        if (!socketAfterConnect || !socketAfterConnect.connected) {
          // Save offline and inform user
          const saveOfflineData = async (payload, surveyId) => {
            try {
              const offlineData = {
                ...payload,
                submittedAt: new Date().toISOString(),
                apiEndpoint: "updateFacilityInitiatedSurvey", // Store which API to call (will try update first)
                apiFallbackEndpoint: "submitFacilityInitiatedSurvey", // Fallback API endpoint
                apiMethod: "survey", // Store API method/namespace
                existingSurveyId: surveyId || null, // Store existing survey ID if updating
              };

              // Step 1: Save to IndexedDB sync queue (permanent storage)
              let syncQueueId = null;
              const tempSurveyId = surveyId || `temp_facility_initiated_${Date.now()}`; // Temporary ID for facility initiated survey creation
              const stepId = payload.currentStep || "facility-initiated-survey";
              const syncItem = await surveyIndexedDB.addToSyncQueue(
                tempSurveyId,
                stepId,
                offlineData,
                "api_facility_initiated_survey" // type for API-based facility initiated survey
              );
              syncQueueId = syncItem.id;

              // Step 2: Update Zustand store (UI state) with sync queue ID
              useSurveyStore.getState().setOfflineData({
                ...offlineData,
                syncQueueId, // Store the sync queue ID for proper cleanup
              });

              // Step 3: If online, trigger sync attempt
              if (navigator.onLine) {
                // The sync service will automatically sync when online
                // But we can trigger an immediate sync attempt
                surveySyncService.syncUnsyncedData(surveyId).catch(
                  (error) => {
                    // Sync failed, but data is saved offline - this is expected if still offline
                  
                  }
                );
              }
            } catch (error) {
             
              // Still try to save to Zustand even if IndexedDB fails
              useSurveyStore.getState().setOfflineData({
                ...payload,
                submittedAt: new Date().toISOString(),
              });
            }
          };

          await saveOfflineData(payload, surveyId);
          toast.success("Internet connectivity issues detected. Data saved offline and will sync when connection is restored.", {
            position: "top-right",
            duration: 5000,
          });
          
          // Clear unsaved changes and update last save time
          setUnsavedChanges({});
          setLastSaveTime(Date.now());
          setIsSaving(false);
          return; // Exit early - data is saved offline
        }
      }

      // Set loading state and show loading toast
      toast.loading("Saving survey data...", {
        id: "saving-survey",
      });

      const socket = surveySocketService.getSocket();
      const emitEvent = "join_risk_based_nonresident";

      // Emit save event via socket
      socket.emit(emitEvent, payload);

      // Set up listener for response
      let responseReceived = false;
      let timeoutId = null;
      const saveTimestamp = Date.now();

      const handleSaveResponse = (message) => {
        if (responseReceived) return;
        
        const messageTimestamp = message?.data?.submittedAt 
          ? new Date(message.data.submittedAt).getTime() 
          : 0;
        const isRecentSave = Math.abs(messageTimestamp - saveTimestamp) < 10000;

        if (!isRecentSave && responseReceived === false) {
          return;
        }

        responseReceived = true;

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        // Emit join_view_risk_based after receiving the response
        setTimeout(() => {
          socket.emit("join_view_risk_based", {
            surveyId: surveyId,
            userId: currentUserId,
          });
        }, 1000);

        // Clear loading state and show success toast
        setIsSaving(false);
        toast.dismiss("saving-survey");
        toast.success("Survey data saved successfully!", {
          description: "Your changes are being saved and shared with the team.",
          position: 'top-right'
        });
        
        // Clear unsaved changes and update last save time
        setUnsavedChanges({});
        setLastSaveTime(Date.now());
      };

      // Set up one-time listener for response
      if (socket) {
        socket.once("risk_based_nonresident", handleSaveResponse);
      }

      // Timeout fallback in case response doesn't come (after 5 seconds)
      timeoutId = setTimeout(() => {
        if (responseReceived) return;
        responseReceived = true;
        timeoutId = null;

        // Still emit join_view_risk_based even if no response
        socket.emit("join_view_risk_based", {
          surveyId: surveyId,
          userId: currentUserId,
        });

        // Clear loading state and show success (timeout fallback)
        setIsSaving(false);
        toast.dismiss("saving-survey");
        toast.success("Survey data saved successfully!", {
          description: "Your changes are being saved and shared with the team.",
          position: 'top-right'
        });
        
        // Clear unsaved changes and update last save time
        setUnsavedChanges({});
        setLastSaveTime(Date.now());
        
      }, 5000);
    } catch (error) {
      toast.error(`Error saving survey: ${error.message}`, { position: 'top-right' });
    } finally {
      setIsSaving(false);
    }
  };



  const handleCloseSurvey = async () => {
    // Ensure signedDate is set to current date
    const currentDate = new Date();
    
    if (!closureData.closureSignature.signedBy || !closureData.closureSignature.title) {
      toast.error("Please complete all signature fields", {
        description: "Signed By and Title are required.",
        position: 'top-right'
      });
      return;
    }

    if (!closureData.closureSignature.confirmed) {
      toast.error("Please confirm that all survey activities have been completed", {
        position: 'top-right'
      });
      return;
    }

    try {
      setIsClosingSurvey(true);
      const surveyId = localStorage.getItem('currentSurveyId') || new URLSearchParams(window.location.search).get('surveyId');
      
      if (!surveyId) {
        toast.error("No survey found. Please create a survey first.", { position: 'top-right' });
        return;
      }

      const payload = {
        currentStep: "survey-closure",
        stepData: {
          surveyId: surveyId,
          surveyClosed: true,
          closureNotes: closureData.closureNotes,
          closureSignature: {
            signedBy: closureData.closureSignature.signedBy,
            title: closureData.closureSignature.title,
            signedDate: currentDate.toISOString(),
            confirmed: closureData.closureSignature.confirmed,
          },
          closedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          closedFromStep: "facility-initiated-survey",
        },
        completedAt: new Date().toISOString(),
        surveyCompleted: true,
      };

      // Try to update existing closure first, then create new if needed
      try {
        await surveyAPI.updateSurveyClosure(surveyId, payload);
        toast.success("Survey closed successfully!", {
          description: "The survey has been marked as closed.",
          position: 'top-right'
        });
      } catch (updateError) {
        // If update fails, try to create new
        await surveyAPI.submitSurveyClosure(payload);
        toast.success("Survey closed successfully!", {
          description: "The survey has been marked as closed.",
          position: 'top-right'
        });
      }

      setSurveyClosed(true);
      setShowClosureModal(false);
    
    } catch (error) {
    
      toast.error(`Error closing survey: ${error.message}`, { position: 'top-right' });
    } finally {
      setIsClosingSurvey(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                onClick={() => window.location.href = '/risk-based-process'}
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900 text-xs sm:text-sm flex-shrink-0"
              >
                ← Back
              </Button>
              <div className="h-4 sm:h-6 w-px bg-slate-300 flex-shrink-0"></div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 truncate">Risk Based Survey</h1> 
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">Clinical Systems Review</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
              {surveyClosed && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs sm:text-sm">
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Survey Closed
                </Badge>
              )} 
              {!surveyClosed && (
                <Button
                  onClick={() => {
                    // Reset signature date to current date when opening modal
                    setClosureData(prev => ({
                      ...prev,
                      closureSignature: {
                        ...prev.closureSignature,
                        signedDate: new Date()
                      }
                    }));
                    setShowClosureModal(true);
                  }}
                  disabled={isSaving || !localStorage.getItem('currentSurveyId')}
                  className="h-8 sm:h-9 px-3 sm:px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50 text-xs sm:text-sm"
                >
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Close Survey</span>
                  <span className="sm:hidden">Close</span>
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving || surveyClosed || !localStorage.getItem('currentSurveyId')}
                className="h-8 sm:h-9 px-3 sm:px-4 bg-sky-800 hover:bg-sky-700 text-white font-medium rounded-lg disabled:opacity-50 text-xs sm:text-sm"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Save</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Save Survey</span>
                    <Save className="w-4 h-4 sm:hidden" />
                  </>
                )}
              </Button>
            </div> 
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex max-w-7xl mx-auto pt-20 sm:pt-24">
        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 pb-8 pr-0 lg:pr-6">
          {/* Success Notification */}
          {showFacilityDataLoaded && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-lg">
              <div className="flex items-start">
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-emerald-900 mb-1">
                    Facility data imported successfully
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-700">
                    Your facility information has been automatically populated from the survey setup.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xs sm:text-sm lg:text-base font-semibold text-blue-900 mb-2">
              Instructions for Use
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-blue-800">
              <p className="break-words">For each area:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 sm:ml-4">
                <li className="break-words">Select 3 residents (Add to Surveyor-Initiated Sample).</li>
                <li className="break-words">Validate findings through observation, record review, and interviews (residents, staff, family).</li>
                <li className="break-words">Verify system-level compliance through QAPI and leadership follow-up.</li>
              </ul>
            </div>
          </div>

          {/* Assessment Sections */}
          <div className="space-y-6 sm:space-y-8">
            {/* Part I Header */}
            <div className="pb-2">
              <h2 className="text-base sm:text-lg font-medium text-slate-900">
                Clinical Systems Review Areas
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Comprehensive review of 15 clinical systems areas
              </p>
            </div>

            {/* Assessment sections container */}
            <div className="space-y-4 sm:space-y-6">
              {clinicalAreas.map((area) => (
                <ClinicalArea
                  key={area.id}
                  areaId={area.id}
                  title={area.title}
                  regulatoryBasis={area.regulatoryBasis}
                  residentSample={area.residentSample}
                  selfReportItems={area.selfReportItems}
                  surveyFocusItems={area.surveyFocusItems}
                  data={surveyData[area.id]}
                  onDataChange={handleAreaDataChange}
                  isExpanded={expandedSections[area.id]}
                  onToggle={() => toggleSection(area.id)}
                  isDisabled={surveyClosed}
                />
              ))}
            </div>
          </div>

          {/* Annual Education Section */}
          <div className="space-y-6 sm:space-y-8 mt-12">
            <div className="pb-2">
              <h2 className="text-base sm:text-lg font-medium text-slate-900">
                Annual and Mandatory Education
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Staff education and competency validation requirements
              </p>
            </div>

            <AnnualEducationSection
              data={surveyData.annualEducation}
              onDataChange={handleAnnualEducationChange}
              isExpanded={expandedSections.annualEducation}
              onToggle={() => toggleSection('annualEducation')}
              isDisabled={surveyClosed}
            />
          </div>

          {/* Risk Management Process Section */}
          <div className="space-y-6 sm:space-y-8 mt-12">
            <div className="pb-2">
              <h2 className="text-base sm:text-lg font-medium text-slate-900">
                Risk Management Process
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Evaluation of facility risk management processes and staff knowledge
              </p>
            </div>

            <RiskManagementProcessSection
              data={surveyData.riskManagementProcess}
              onDataChange={handleRiskManagementProcessChange}
              isExpanded={expandedSections.riskManagementProcess}
              onToggle={() => toggleSection('riskManagementProcess')}
              isDisabled={surveyClosed}
            />
          </div>
        </main>

      
      </div>

      {/* Survey Closure Modal */}
      {showClosureModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 break-words">
                Close Survey
              </h3>
              <Button
                onClick={() => setShowClosureModal(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-amber-900 mb-1">
                      Important Notice
                    </h4>
                    <p className="text-xs sm:text-sm text-amber-800 break-words">
                      Once you close this survey, it will be marked as complete and you will not be able to make further changes. Please ensure all survey activities have been completed and documented before closing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                    Closure Notes (Optional)
                  </Label>
                  <Textarea
                    value={closureData.closureNotes}
                    onChange={(e) => setClosureData(prev => ({
                      ...prev,
                      closureNotes: e.target.value
                    }))}
                    placeholder="Enter any additional notes about the survey closure..."
                    rows={3}
                    className="w-full text-xs sm:text-sm bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  />
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 mb-3 sm:mb-4">Closure Signature</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                        Signed By <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={closureData.closureSignature.signedBy}
                        onChange={(e) => setClosureData(prev => ({
                          ...prev,
                          closureSignature: {
                            ...prev.closureSignature,
                            signedBy: e.target.value
                          }
                        }))}
                        placeholder="Enter name of person closing survey..."
                        className="w-full text-xs sm:text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                        Title/Position <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={closureData.closureSignature.title}
                        onChange={(e) => setClosureData(prev => ({
                          ...prev,
                          closureSignature: {
                            ...prev.closureSignature,
                            title: e.target.value
                          }
                        }))}
                        placeholder="Enter title or position..."
                        className="w-full text-xs sm:text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                        Signature Date <span className="text-red-500">*</span>
                      </Label>
                      <DatePicker
                        date={closureData.closureSignature.signedDate || new Date()}
                        onSelect={(date) => setClosureData(prev => ({
                          ...prev,
                          closureSignature: {
                            ...prev.closureSignature,
                            signedDate: date
                          }
                        }))}
                        disabled={true}
                        placeholder="Current date"
                        className="w-full"
                      />
                      <p className="text-xs text-slate-500 mt-1 break-words">
                        Automatically set to today's date
                      </p>
                    </div>

                    <div className="flex items-start space-x-2 sm:space-x-3 pt-2">
                      <Checkbox
                        id="confirmClosure"
                        checked={closureData.closureSignature.confirmed}
                        onCheckedChange={(checked) => setClosureData(prev => ({
                          ...prev,
                          closureSignature: {
                            ...prev.closureSignature,
                            confirmed: checked
                          }
                        }))}
                        className="mt-1 flex-shrink-0"
                      />
                      <Label
                        htmlFor="confirmClosure"
                        className="text-xs sm:text-sm text-slate-700 cursor-pointer leading-relaxed flex-1 break-words"
                      >
                        I confirm that all survey activities have been completed and documented. This survey is ready to be closed.
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-slate-200">
              <Button
                onClick={() => setShowClosureModal(false)}
                variant="outline"
                className="h-9 px-4 text-xs sm:text-sm w-full sm:w-auto"
                disabled={isClosingSurvey}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCloseSurvey}
                disabled={isClosingSurvey}
                className="h-9 px-4 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
              >
                {isClosingSurvey ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 flex-shrink-0"></div>
                    <span className="hidden sm:inline">Closing Survey...</span>
                    <span className="sm:hidden">Closing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Close Survey</span>
                    <span className="sm:hidden">Close</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityInitiatedSurvey;


