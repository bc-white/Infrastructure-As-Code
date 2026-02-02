import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { DatePicker } from "../../components/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { 
  CheckSquare,
  FileText,
  Save,
  Download,
  Users,
  AlertTriangle,
  ClipboardList,
  X,
  Lock,
  Plus,
  Trash2,
  FileCheck,
  Building2,
  UserCircle,
  CheckCircle,
  Circle,
  Crown,
} from "lucide-react";
import { surveyAPI, healthAssistantAPI, surveySocketService, profileAPI, authAPI } from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";
import { toast } from "sonner";
import questionsData from "../../data/clinicalAreasQuestions.json";
import { CLINICAL_AREA_KEYS, normalizeDateValue, normalizeResidentEntry, ensureResidentArray } from "./utils";
import { FTagResponseDisplay, SectionHeader } from "./components";
import useRiskBasedSurveyStore from "../../stores/useRiskBasedSurveyStore";

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
  isDisabled = false,
  selectedResidentId,
  residents,
  hideHeader = false // Hide header when in tab mode
}) => {
  const [loadingStates, setLoadingStates] = useState({});

  const handleAnswerChange = async (section, field, answer) => {
    if (!selectedResidentId) return;
    
    const currentData = data || {};
    const currentResidentAnswers = currentData.residentAnswers || {};
    const currentResidentData = currentResidentAnswers[selectedResidentId] || {};
    
    // For custom items, just update the answer without API call
    if (field.startsWith('custom_item_')) {
      const updatedResidentData = {
        ...currentResidentData,
        [section]: {
          ...(currentResidentData[section] || {}),
          [field]: answer
        }
      };
      onDataChange(areaId, {
        ...currentData,
        residentAnswers: {
          ...currentResidentAnswers,
          [selectedResidentId]: updatedResidentData
        }
      });
      return;
    }

    // For predefined questions, update answer and call API
    const updatedResidentData = {
      ...currentResidentData,
      [section]: {
        ...(currentResidentData[section] || {}),
        [field]: answer
      }
    };
    
    onDataChange(areaId, {
      ...currentData,
      residentAnswers: {
        ...currentResidentAnswers,
        [selectedResidentId]: updatedResidentData
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
            // Store F-Tag response in the resident's data
            const updatedResidentData = {
              ...currentResidentData,
              [section]: {
                ...(currentResidentData[section] || {}),
                [field]: answer,
                [`${field}_ftagResponse`]: response.data
              }
            };
            onDataChange(areaId, {
              ...currentData,
              residentAnswers: {
                ...currentResidentAnswers,
                [selectedResidentId]: updatedResidentData
              }
            });
          }
        } catch (error) {
          
          // Store null response to indicate API call failed
          const updatedResidentData = {
            ...currentResidentData,
            [section]: {
              ...(currentResidentData[section] || {}),
              [field]: answer,
              [`${field}_ftagResponse`]: null
            }
          };
          onDataChange(areaId, {
            ...currentData,
            residentAnswers: {
              ...currentResidentAnswers,
              [selectedResidentId]: updatedResidentData
            }
          });
        } finally {
          setLoadingStates(prev => ({ ...prev, [responseKey]: false }));
        }
      }
    }
  };

  const handleTextChange = (section, field, value) => {
    const currentData = data || {};
    // If section is 'notes' (top-level), set it directly
    if (section === 'notes' && field === 'notes') {
      onDataChange(areaId, {
        ...currentData,
        notes: value
      });
    } else if (selectedResidentId) {
      // Otherwise, it's a nested object in resident data
      const currentResidentAnswers = currentData.residentAnswers || {};
      const currentResidentData = currentResidentAnswers[selectedResidentId] || {};
      const updatedResidentData = {
        ...currentResidentData,
        [section]: {
          ...(currentResidentData[section] || {}),
          [field]: value
        }
      };
      onDataChange(areaId, {
        ...currentData,
        residentAnswers: {
          ...currentResidentAnswers,
          [selectedResidentId]: updatedResidentData
        }
      });
    }
  };

  // Get current resident's data
  const currentResidentData = selectedResidentId 
    ? (data?.residentAnswers?.[selectedResidentId] || {})
    : {};
  
  // Get custom questions from data (stored per resident or globally)
  const customSelfReportItems = Array.isArray(currentResidentData?.customSelfReportItems) 
    ? currentResidentData.customSelfReportItems 
    : (Array.isArray(data?.customSelfReportItems) ? data.customSelfReportItems : []);
  const customSurveyFocusItems = Array.isArray(currentResidentData?.customSurveyFocusItems) 
    ? currentResidentData.customSurveyFocusItems 
    : (Array.isArray(data?.customSurveyFocusItems) ? data.customSurveyFocusItems : []);
  
  // Exclude self-report items from count for Admissions
  const itemCount = areaId === "admissions" 
    ? surveyFocusItems.length + customSurveyFocusItems.length
    : selfReportItems.length + surveyFocusItems.length + customSelfReportItems.length + customSurveyFocusItems.length;

  // Handle adding custom self-report item
  const handleAddCustomSelfReport = () => {
    if (isDisabled || !selectedResidentId) return;
    const currentData = data || {};
    const currentResidentAnswers = currentData.residentAnswers || {};
    const currentResidentData = currentResidentAnswers[selectedResidentId] || {};
    const currentCustom = Array.isArray(currentResidentData.customSelfReportItems) 
      ? currentResidentData.customSelfReportItems 
      : [];
    onDataChange(areaId, {
      ...currentData,
      residentAnswers: {
        ...currentResidentAnswers,
        [selectedResidentId]: {
          ...currentResidentData,
          customSelfReportItems: [...currentCustom, ""]
        }
      }
    });
  };

  // Handle removing custom self-report item
  const handleRemoveCustomSelfReport = (index) => {
    if (isDisabled || !selectedResidentId) return;
    const currentData = data || {};
    const currentResidentAnswers = currentData.residentAnswers || {};
    const currentResidentData = currentResidentAnswers[selectedResidentId] || {};
    const currentCustom = Array.isArray(currentResidentData.customSelfReportItems) 
      ? currentResidentData.customSelfReportItems 
      : [];
    onDataChange(areaId, {
      ...currentData,
      residentAnswers: {
        ...currentResidentAnswers,
        [selectedResidentId]: {
          ...currentResidentData,
          customSelfReportItems: currentCustom.filter((_, idx) => idx !== index)
        }
      }
    });
  };

  // Handle updating custom self-report item
  const handleUpdateCustomSelfReport = (index, value) => {
    if (!selectedResidentId) return;
    const currentData = data || {};
    const currentResidentAnswers = currentData.residentAnswers || {};
    const currentResidentData = currentResidentAnswers[selectedResidentId] || {};
    const currentCustom = Array.isArray(currentResidentData.customSelfReportItems) 
      ? currentResidentData.customSelfReportItems 
      : [];
    const updated = [...currentCustom];
    updated[index] = value;
    onDataChange(areaId, {
      ...currentData,
      residentAnswers: {
        ...currentResidentAnswers,
        [selectedResidentId]: {
          ...currentResidentData,
          customSelfReportItems: updated
        }
      }
    });
  };

  // Handle adding custom survey focus item
  const handleAddCustomSurveyFocus = () => {
    if (isDisabled || !selectedResidentId) return;
    const currentData = data || {};
    const currentResidentAnswers = currentData.residentAnswers || {};
    const currentResidentData = currentResidentAnswers[selectedResidentId] || {};
    const currentCustom = Array.isArray(currentResidentData.customSurveyFocusItems) 
      ? currentResidentData.customSurveyFocusItems 
      : [];
    onDataChange(areaId, {
      ...currentData,
      residentAnswers: {
        ...currentResidentAnswers,
        [selectedResidentId]: {
          ...currentResidentData,
          customSurveyFocusItems: [...currentCustom, ""]
        }
      }
    });
  };

  // Handle removing custom survey focus item
  const handleRemoveCustomSurveyFocus = (index) => {
    if (isDisabled || !selectedResidentId) return;
    const currentData = data || {};
    const currentResidentAnswers = currentData.residentAnswers || {};
    const currentResidentData = currentResidentAnswers[selectedResidentId] || {};
    const currentCustom = Array.isArray(currentResidentData.customSurveyFocusItems) 
      ? currentResidentData.customSurveyFocusItems 
      : [];
    onDataChange(areaId, {
      ...currentData,
      residentAnswers: {
        ...currentResidentAnswers,
        [selectedResidentId]: {
          ...currentResidentData,
          customSurveyFocusItems: currentCustom.filter((_, idx) => idx !== index)
        }
      }
    });
  };

  // Handle updating custom survey focus item
  const handleUpdateCustomSurveyFocus = (index, value) => {
    if (!selectedResidentId) return;
    const currentData = data || {};
    const currentResidentAnswers = currentData.residentAnswers || {};
    const currentResidentData = currentResidentAnswers[selectedResidentId] || {};
    const currentCustom = Array.isArray(currentResidentData.customSurveyFocusItems) 
      ? currentResidentData.customSurveyFocusItems 
      : [];
    const updated = [...currentCustom];
    updated[index] = value;
    onDataChange(areaId, {
      ...currentData,
      residentAnswers: {
        ...currentResidentAnswers,
        [selectedResidentId]: {
          ...currentResidentData,
          customSurveyFocusItems: updated
        }
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {!hideHeader && (
      <SectionHeader
        sectionId={areaId}
        title={title}
        isExpanded={isExpanded}
        onToggle={onToggle}
        itemCount={itemCount}
        isDisabled={isDisabled}
      />
      )}
      
      {(isExpanded || hideHeader) && (
        <div className={`p-6 space-y-6 ${!hideHeader ? 'border-t border-slate-200' : ''}`}>
          {/* Regulatory Basis */}
          <div className="space-y-3 pb-4 border-b border-slate-200">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
              Regulatory Basis
            </h4>
            <div className="flex flex-wrap gap-2">
              {regulatoryBasis.map((tag, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded font-mono">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Resident Sample Info */}
          <div className="space-y-3 pb-4 border-b border-slate-200">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
              Resident Sample Criteria
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed break-words">{residentSample}</p>
          </div>

          {/* Self Report Items - Hidden for Admissions */}
          {areaId !== "admissions" && selectedResidentId && (
          <div className="space-y-4 pb-6 border-b border-slate-200">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
              Self Report Items
            </h4>
            <div className="space-y-4">
              {selfReportItems.map((item, idx) => {
                const responseKey = `selfReport_item_${idx}`;
                const isLoading = loadingStates[responseKey];
                const responseData = currentResidentData?.selfReport?.[`item_${idx}_ftagResponse`];
                const currentAnswer = currentResidentData?.selfReport?.[`item_${idx}`] || null;
                
                return (
                  <div key={idx} className="pb-4 border-b border-slate-100 last:border-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-slate-900 leading-relaxed mb-3 break-words">
                          {item}
                        </p>
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
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-200">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Custom Items</span>
                </div>
              )}
              
              {/* Custom Self Report Items */}
              {customSelfReportItems.map((item, idx) => {
                const currentAnswer = currentResidentData?.selfReport?.[`custom_item_${idx}`] || null;
                
                return (
                  <div key={`custom-selfreport-${idx}`} className="pb-4 border-b border-slate-100 last:border-0 group">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={item}
                        onChange={(e) => handleUpdateCustomSelfReport(idx, e.target.value)}
                        placeholder="Enter custom self-report item..."
                        disabled={isDisabled}
                        className="text-xs sm:text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white"
                      />
                      <div className="flex items-center gap-2 flex-wrap">
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
                    className="h-9 px-4 text-xs sm:text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-dashed border-slate-300 hover:border-slate-400"
                  >
                    <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                    Add Custom Item
                  </Button>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Survey Focus */}
          {selectedResidentId && (
          <div className="space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
              Survey Focus
            </h4>
            <div className="space-y-4">
              {surveyFocusItems.map((item, idx) => {
                const responseKey = `surveyFocus_item_${idx}`;
                const isLoading = loadingStates[responseKey];
                const responseData = currentResidentData?.surveyFocus?.[`item_${idx}_ftagResponse`];
                const currentAnswer = currentResidentData?.surveyFocus?.[`item_${idx}`] || null;
                
                return (
                  <div key={idx} className="pb-4 border-b border-slate-100 last:border-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-slate-900 leading-relaxed mb-3 break-words">
                          {item}
                        </p>
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
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-200">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Custom Items</span>
                </div>
              )}
              
              {/* Custom Survey Focus Items */}
              {customSurveyFocusItems.map((item, idx) => {
                const currentAnswer = currentResidentData?.surveyFocus?.[`custom_item_${idx}`] || null;
                
                return (
                  <div key={`custom-focus-${idx}`} className="pb-4 border-b border-slate-100 last:border-0 group">
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
          )}

          {/* Notes/Observations */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900">Notes & Observations</h4>
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

// Non-Resident-Based Clinical Area Component
const NonResidentClinicalArea = memo(({ 
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
  isDisabled = false,
  hideHeader = false // Hide header when in tab mode
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

    // Call health assistant API for predefined questions only
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
            // Store F-Tag response in the data
            onDataChange(areaId, {
              ...currentData,
              [section]: {
                ...(currentData[section] || {}),
                [field]: answer,
                [`${field}_ftagResponse`]: response.data
              }
            });
          }
        } catch (error) {
          
          // Store null response to indicate API call failed
          onDataChange(areaId, {
            ...currentData,
            [section]: {
              ...(currentData[section] || {}),
              [field]: answer,
              [`${field}_ftagResponse`]: null
            }
          });
        } finally {
          setLoadingStates(prev => ({ ...prev, [responseKey]: false }));
        }
      }
    }
  };

  const handleTextChange = (section, field, value) => {
    const currentData = data || {};
    if (section === 'notes' && field === 'notes') {
      onDataChange(areaId, {
        ...currentData,
        notes: value
      });
    } else {
      onDataChange(areaId, {
        ...currentData,
        [section]: {
          ...(currentData[section] || {}),
          [field]: value
        }
      });
    }
  };

  // Get custom questions from data
  const customSelfReportItems = Array.isArray(data?.customSelfReportItems) 
    ? data.customSelfReportItems 
    : [];
  const customSurveyFocusItems = Array.isArray(data?.customSurveyFocusItems) 
    ? data.customSurveyFocusItems 
    : [];
  
  // Exclude self-report items from count for Admissions
  const itemCount = areaId === "admissions" 
    ? surveyFocusItems.length + customSurveyFocusItems.length
    : selfReportItems.length + surveyFocusItems.length + customSelfReportItems.length + customSurveyFocusItems.length;

  // Handle adding custom self-report item
  const handleAddCustomSelfReport = () => {
    if (isDisabled) return;
    const currentData = data || {};
    const currentCustom = Array.isArray(currentData.customSelfReportItems) 
      ? currentData.customSelfReportItems 
      : [];
    onDataChange(areaId, {
      ...currentData,
      customSelfReportItems: [...currentCustom, ""]
    });
  };

  // Handle removing custom self-report item
  const handleRemoveCustomSelfReport = (index) => {
    if (isDisabled) return;
    const currentData = data || {};
    const currentCustom = Array.isArray(currentData.customSelfReportItems) 
      ? currentData.customSelfReportItems 
      : [];
    onDataChange(areaId, {
      ...currentData,
      customSelfReportItems: currentCustom.filter((_, idx) => idx !== index)
    });
  };

  // Handle updating custom self-report item
  const handleUpdateCustomSelfReport = (index, value) => {
    const currentData = data || {};
    const currentCustom = Array.isArray(currentData.customSelfReportItems) 
      ? currentData.customSelfReportItems 
      : [];
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
    const currentCustom = Array.isArray(currentData.customSurveyFocusItems) 
      ? currentData.customSurveyFocusItems 
      : [];
    onDataChange(areaId, {
      ...currentData,
      customSurveyFocusItems: [...currentCustom, ""]
    });
  };

  // Handle removing custom survey focus item
  const handleRemoveCustomSurveyFocus = (index) => {
    if (isDisabled) return;
    const currentData = data || {};
    const currentCustom = Array.isArray(currentData.customSurveyFocusItems) 
      ? currentData.customSurveyFocusItems 
      : [];
    onDataChange(areaId, {
      ...currentData,
      customSurveyFocusItems: currentCustom.filter((_, idx) => idx !== index)
    });
  };

  // Handle updating custom survey focus item
  const handleUpdateCustomSurveyFocus = (index, value) => {
    const currentData = data || {};
    const currentCustom = Array.isArray(currentData.customSurveyFocusItems) 
      ? currentData.customSurveyFocusItems 
      : [];
    const updated = [...currentCustom];
    updated[index] = value;
    onDataChange(areaId, {
      ...currentData,
      customSurveyFocusItems: updated
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {!hideHeader && (
        <SectionHeader
          sectionId={areaId}
          title={title}
          isExpanded={isExpanded}
          onToggle={onToggle}
          itemCount={itemCount}
          isDisabled={isDisabled}
        />
      )}
      
      {(isExpanded || hideHeader) && (
        <div className={`p-6 space-y-6 ${!hideHeader ? 'border-t border-slate-200' : ''}`}>
          {/* Regulatory Basis */}
          <div className="space-y-3 pb-4 border-b border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900">
              Regulatory Basis
            </h4>
            <div className="flex flex-wrap gap-2">
              {regulatoryBasis.map((tag, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded font-mono">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Resident Sample Info */}
          <div className="space-y-3 pb-4 border-b border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900">
              Resident Sample Criteria
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">{residentSample}</p>
          </div>

          {/* Self Report Items - Hidden for Admissions */}
          {areaId !== "admissions" && (
          <div className="space-y-4 pb-6 border-b border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900">
              Self Report Items
            </h4>
            <div className="space-y-4">
              {selfReportItems.map((item, idx) => {
                const responseKey = `selfReport_item_${idx}`;
                const isLoading = loadingStates[responseKey];
                const responseData = data?.selfReport?.[`item_${idx}_ftagResponse`];
                const currentAnswer = data?.selfReport?.[`item_${idx}`] || null;
                
                return (
                  <div key={idx} className="pb-4 border-b border-slate-100 last:border-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-slate-900 leading-relaxed mb-3 break-words">
                          {item}
                        </p>
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
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-200">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Custom Items</span>
                </div>
              )}
              
              {/* Custom Self Report Items */}
              {customSelfReportItems.map((item, idx) => {
                const currentAnswer = data?.selfReport?.[`custom_item_${idx}`] || null;
                
                return (
                  <div key={`custom-selfreport-${idx}`} className="pb-4 border-b border-slate-100 last:border-0 group">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={item}
                        onChange={(e) => handleUpdateCustomSelfReport(idx, e.target.value)}
                        placeholder="Enter custom self-report item..."
                        disabled={isDisabled}
                        className="text-xs sm:text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-400 bg-white"
                      />
                      <div className="flex items-center gap-2 flex-wrap">
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
                    className="h-9 px-4 text-xs sm:text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-dashed border-slate-300 hover:border-slate-400"
                  >
                    <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                    Add Custom Item
                  </Button>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Survey Focus */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">
              Survey Focus
            </h4>
            <div className="space-y-4">
              {surveyFocusItems.map((item, idx) => {
                const responseKey = `surveyFocus_item_${idx}`;
                const isLoading = loadingStates[responseKey];
                const responseData = data?.surveyFocus?.[`item_${idx}_ftagResponse`];
                const currentAnswer = data?.surveyFocus?.[`item_${idx}`] || null;
                
                return (
                  <div key={idx} className="pb-4 border-b border-slate-100 last:border-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-slate-900 leading-relaxed mb-3 break-words">
                          {item}
                        </p>
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
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-200">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Custom Items</span>
                </div>
              )}
              
              {/* Custom Survey Focus Items */}
              {customSurveyFocusItems.map((item, idx) => {
                const currentAnswer = data?.surveyFocus?.[`custom_item_${idx}`] || null;
                
                return (
                  <div key={`custom-focus-${idx}`} className="pb-4 border-b border-slate-100 last:border-0 group">
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
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900">Notes & Observations</h4>
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

NonResidentClinicalArea.displayName = 'NonResidentClinicalArea';

// Annual Education Component
const AnnualEducationSection = memo(({ data, onDataChange, isExpanded, onToggle, isDisabled = false, hideHeader = false }) => {
  // Get Annual Education items from clinicalAreas array
  const annualEducationArea = questionsData.clinicalAreas.find(area => area.id === 'annualEducation');
  const educationItems = annualEducationArea?.surveyFocusItems || [];

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
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {!hideHeader && (
      <SectionHeader
        sectionId="annualEducation"
        title="Annual and Mandatory Education"
        isExpanded={isExpanded}
        onToggle={onToggle}
        itemCount={itemCount}
        isDisabled={isDisabled}
      />
      )}
      
      {(isExpanded || hideHeader) && (
        <div className={`p-6 space-y-6 ${!hideHeader ? 'border-t border-slate-200' : ''}`}>
          <div className="bg-slate-50 border-l-4 border-l-slate-900 p-4">
            <p className="text-sm text-slate-900 leading-relaxed">
              All staff must complete the following at hire and annually. Validation Checklist:
            </p>
          </div>
          <div className="space-y-4">
            {educationItems.map((item, idx) => {
              const responseKey = `annualEducation_item_${idx}`;
              const isLoading = loadingStates[responseKey];
              const responseData = data?.[`item_${idx}_ftagResponse`];
              const currentAnswer = data?.[`item_${idx}`] || null;
              
              return (
                <div key={idx} className="pb-4 border-b border-slate-100 last:border-0">
                    <div className="flex items-start gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-slate-900 leading-relaxed mb-3 break-words">
                          {item}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
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
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-200">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Custom Items</span>
              </div>
            )}
            
            {/* Custom Education Items */}
            {customEducationItems.map((item, idx) => {
              const currentAnswer = data?.[`custom_item_${idx}`] || null;
              
              return (
                <div key={`custom-ed-${idx}`} className="pb-4 border-b border-slate-100 last:border-0 group">
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
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900">Validation Notes</h4>
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

// Progress Tracker Component (Deel-style)
const ProgressTracker = memo(({ 
  clinicalAreas, 
  surveyData, 
  surveyMode, 
  activeTab,
  onTabChange,
  isDisabled = false 
}) => {
  const calculateAreaCompletion = (areaId) => {
    const areaData = surveyData[areaId];
    if (surveyMode === 'residentBased') {
      const residentAnswers = areaData?.residentAnswers || {};
      return Object.keys(residentAnswers).some(residentId => {
        const residentData = residentAnswers[residentId];
        return (residentData?.selfReport && Object.keys(residentData.selfReport).length > 0) ||
               (residentData?.surveyFocus && Object.keys(residentData.surveyFocus).length > 0);
      });
    } else {
      return (areaData?.selfReport && Object.keys(areaData.selfReport).length > 0) ||
             (areaData?.surveyFocus && Object.keys(areaData.surveyFocus).length > 0);
    }
  };

  const calculateAnnualEdCompletion = () => {
    const annualEdData = surveyData.annualEducation || {};
    return Object.keys(annualEdData).some(key =>
      !key.includes('customEducationItems') && !key.includes('validationNotes') && annualEdData[key]
    );
  };

  const totalAreas = clinicalAreas.length; // Annual education is now included in clinicalAreas
  let completedCount = 0;

  clinicalAreas.forEach(area => {
    if (calculateAreaCompletion(area.id)) completedCount++;
  });
  
  const progressPercentage = Math.round((completedCount / totalAreas) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-3 sm:p-4 border-b border-slate-200">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mb-1">Progress</h3>
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 mb-2">
          <span className="break-words">{completedCount} of {totalAreas} completed</span>
          <span className="font-medium flex-shrink-0">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div 
            className="bg-[#075b7d] h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="p-3 sm:p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        <div className="space-y-1">
          {filteredClinicalAreas.map((area, index) => {
            const isCompleted = calculateAreaCompletion(area.id);
            const isActive = activeTab === area.id;
            
            return (
              <div
                key={area.id}
                className={`flex items-start gap-2 sm:gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                  isActive ? 'bg-slate-50' : 'hover:bg-slate-50'
                }`}
                onClick={() => !isDisabled && onTabChange(area.id)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </div>
                  ) : (
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                      isActive ? 'bg-[#075b7d] text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-slate-900 break-words">
                    {area.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {isCompleted ? 'Completed' : 'In Progress'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

ProgressTracker.displayName = 'ProgressTracker';

// Resident Manager Sidebar Component
const ResidentManagerSidebar = memo(({ 
  residents, 
  selectedResidentId, 
  onAddResident, 
  onRemoveResident, 
  onSelectResident,
  onUpdateResident,
  isDisabled = false 
}) => {
  return (
    <div className="h-full bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
          Residents
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4 break-words">
          Add and select residents to answer questions
        </p>
        <Button
          type="button"
          onClick={onAddResident}
          disabled={isDisabled}
          variant="outline"
          size="sm"
          className="w-full h-9 sm:h-10 text-xs sm:text-sm border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium"
        >
          <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
          Add Resident
        </Button>
      </div>

      {/* Residents List */}
      <div className="flex-1 overflow-y-auto">
        {residents.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-xs sm:text-sm text-slate-600 mb-1 font-medium break-words">No residents added</p>
            <p className="text-xs text-slate-500 break-words">
              Add a resident to start answering questions
            </p>
          </div>
        ) : (
          <div>
            {residents.map((resident, idx) => {
              const isSelected = resident.id === selectedResidentId;
              const careAreas = Array.isArray(resident.careArea) 
                ? resident.careArea 
                : (resident.careArea ? [resident.careArea] : []);
              
              return (
                <div
                  key={resident.id}
                  className={`border-b border-slate-200 p-3 sm:p-4 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-50 border-l-4 border-l-slate-900'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                  onClick={() => !isDisabled && onSelectResident(resident.id)}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 break-words">
                          {resident.name || "Unnamed Resident"}
                        </span>
                        {isSelected && (
                          <span className="text-xs text-slate-500 font-medium flex-shrink-0">Active</span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {resident.room && (
                          <div className="text-xs text-slate-600">
                            Room {resident.room}
                          </div>
                        )}
                        {resident.admissionDate && (
                          <div className="text-xs text-slate-600">
                            Admitted {resident.admissionDate instanceof Date 
                              ? resident.admissionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : new Date(resident.admissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            }
                          </div>
                        )}
                        {careAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {careAreas.map((area, areaIdx) => (
                              <span 
                                key={areaIdx} 
                                className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-normal"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveResident(resident.id);
                      }}
                      disabled={isDisabled}
                      className="flex-shrink-0 h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      aria-label="Remove resident"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

ResidentManagerSidebar.displayName = 'ResidentManagerSidebar';

// Care Area MultiSelect Component
const CareAreaMultiSelect = memo(({ 
  value = [], 
  onChange, 
  disabled = false,
  placeholder = "Type and press Enter to add care area"
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      e.stopPropagation();
      const newValue = inputValue.trim();
      if (!value.includes(newValue)) {
        onChange([...value, newValue]);
      }
      setInputValue("");
    }
  };

  const handleRemove = (itemToRemove) => {
    onChange(value.filter(item => item !== itemToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-slate-200 rounded-md bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
        {value.map((item, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 border-blue-200 break-words"
          >
            <span className="break-words">{item}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="hover:text-red-600 transition-colors ml-1 flex-shrink-0"
                aria-label={`Remove ${item}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={value.length === 0 ? placeholder : "Add another..."}
          disabled={disabled}
          className="flex-1 min-w-[100px] sm:min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-xs sm:text-sm"
        />
      </div>
      {value.length > 0 && (
        <p className="text-xs text-slate-500 break-words">
          {value.length} care area{value.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
});

CareAreaMultiSelect.displayName = 'CareAreaMultiSelect';

// Add Resident Modal Component
const AddResidentModal = memo(({ 
  isOpen, 
  onClose, 
  onAdd, 
  isDisabled = false 
}) => {
  const [formData, setFormData] = useState({
    name: "",
    room: "",
    careArea: [],
    admissionDate: null,
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }
    onAdd(formData);
    // Reset form
    setFormData({
      name: "",
      room: "",
      careArea: [],
      admissionDate: null,
      notes: ""
    });
    onClose();
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      name: "",
      room: "",
      careArea: [],
      admissionDate: null,
      notes: ""
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[500px] max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Add Resident</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resident-name" className="text-xs sm:text-sm font-medium text-slate-700">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="resident-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter resident name"
                disabled={isDisabled}
                required
                className="w-full text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resident-room" className="text-xs sm:text-sm font-medium text-slate-700">
                Room / Unit
              </Label>
              <Input
                id="resident-room"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="Enter room or unit"
                disabled={isDisabled}
                className="w-full text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resident-care-area" className="text-xs sm:text-sm font-medium text-slate-700">
                Care Area
              </Label>
              <CareAreaMultiSelect
                value={formData.careArea || []}
                onChange={(areas) => setFormData({ ...formData, careArea: areas })}
                disabled={isDisabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resident-admission-date" className="text-xs sm:text-sm font-medium text-slate-700">
                Admission Date
              </Label>
              <DatePicker
                date={formData.admissionDate}
                onSelect={(date) => setFormData({ ...formData, admissionDate: date })}
                placeholder="Select admission date"
                disabled={isDisabled}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resident-notes" className="text-xs sm:text-sm font-medium text-slate-700">
                Notes
              </Label>
              <Textarea
                id="resident-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observations, interview notes, follow-up items..."
                rows={3}
                disabled={isDisabled}
                className="w-full text-xs sm:text-sm"
              />
            </div>
          </form>
        </DialogBody>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isDisabled}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isDisabled || !formData.name.trim()}
            className="bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto text-xs sm:text-sm"
          >
            Add Resident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

AddResidentModal.displayName = 'AddResidentModal';

const FacilityInitiatedSurvey = () => {
  // Zustand Store Integration for Team Collaboration
  const store = useRiskBasedSurveyStore();

  // Survey mode: 'residentBased' or 'nonResidentBased'
  const [surveyMode, setSurveyMode] = useState('residentBased'); // Default to resident-based

  // Global residents list - shared across all clinical areas (only for resident-based)
  const [residents, setResidents] = useState([]);
  const [selectedResidentId, setSelectedResidentId] = useState(null);
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);

  const [surveyData, setSurveyData] = useState({
    // Clinical Areas - structure depends on mode:
    // residentBased: { residentAnswers: { residentId: { selfReport: {}, surveyFocus: {}, notes: "" } }, notes: "" }
    // nonResidentBased: { selfReport: {}, surveyFocus: {}, customSelfReportItems: [], customSurveyFocusItems: [], notes: "" }
    admissions: {
      residentAnswers: {}, // { residentId: { selfReport: {}, surveyFocus: {}, notes: "" } }
      notes: ""
    }, 
    behaviors: {
      residentAnswers: {},
      notes: ""
    },
    falls: {
      residentAnswers: {},
      notes: ""
    },
    changeInCondition: {
      residentAnswers: {},
      notes: ""
    }, 
    grievances: {
      residentAnswers: {},
      notes: ""
    },
    hospitalReadmissions: {
      residentAnswers: {},
      notes: ""
    },
    incidents: {
      residentAnswers: {},
      notes: ""
    },
    infections: {
      residentAnswers: {},
      notes: ""
    },
    pain: {
      residentAnswers: {},
      notes: ""
    },
    pressureUlcers: {
      residentAnswers: {},
      notes: ""
    },
    ivTherapy: {
      residentAnswers: {},
      notes: ""
    },
    weightLoss: {
      residentAnswers: {},
      notes: ""
    },
    psychotropicMedications: {
      residentAnswers: {},
      notes: ""
    },
    activities: {
      residentAnswers: {},
      notes: ""
    },
    staffEducation: {
      residentAnswers: {},
      notes: ""
    },
    annualEducation: {
      selfReport: {},
      surveyFocus: {},
      customSelfReportItems: [],
      customSurveyFocusItems: [],
      notes: ""
    }
  });

  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState(null); // Track active tab for tab-based view
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileNav, setShowMobileNav] = useState(false); // Mobile navigation menu state
  
  // Track unsaved changes to prevent race conditions
  const [unsavedChanges, setUnsavedChanges] = useState({}); // { areaId: { residentId: { field: timestamp } } }
  
  // Ref to track unsaved changes for socket listeners (avoids stale closures)
  const unsavedChangesRef = useRef({});
  useEffect(() => {
    unsavedChangesRef.current = unsavedChanges;
  }, [unsavedChanges]);

  const [lastSaveTime, setLastSaveTime] = useState(null);

  // Team member and coordinator management
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamCoordinator, setTeamCoordinator] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isTeamCoordinator, setIsTeamCoordinator] = useState(false);
  const [assignedAreas, setAssignedAreas] = useState([]); // Clinical areas assigned to current user

  // Clinical Areas Configuration (moved before calculateProgress)
  const clinicalAreas = questionsData.clinicalAreas;

  // Filter clinical areas - all team members see all areas
  const getFilteredClinicalAreas = useCallback(() => {
    // Everyone sees all clinical areas
    return clinicalAreas;
  }, [clinicalAreas]);

  const filteredClinicalAreas = getFilteredClinicalAreas();

  // Filter residents - all team members see all residents
  const getFilteredResidents = useCallback(() => {
    // Everyone sees all residents
    return residents;
  }, [residents]);

  const filteredResidents = getFilteredResidents();

  // Ensure selected resident is valid for the current user
  useEffect(() => {
    if (surveyMode !== 'residentBased') return;

    if (filteredResidents.length === 0) {
      if (selectedResidentId) {
        setSelectedResidentId(null);
      }
      return;
    }

    // If we have residents but none selected, or selected one is not in the filtered list
    const isSelectedValid = selectedResidentId && filteredResidents.some(r => r.id === selectedResidentId);
    
    if (!isSelectedValid) {
      // Auto-select the first available resident
      setSelectedResidentId(filteredResidents[0].id);
    }
  }, [surveyMode, filteredResidents, selectedResidentId]);


  const [showFacilityDataLoaded, setShowFacilityDataLoaded] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [isClosingSurvey, setIsClosingSurvey] = useState(false);
  const [showModeSwitchModal, setShowModeSwitchModal] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
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

  // Handle survey mode change - DISABLED: Mode is set during setup and cannot be changed
  const handleModeChange = useCallback((newMode) => {
    // Mode switching is disabled - mode is set during setup
    toast.info("Survey mode cannot be changed. It was set during the setup process.", {
      position: 'top-right'
    });
  }, []);

  // Confirm mode switch
  const confirmModeSwitch = useCallback(() => {
    if (!pendingMode) return;
    
    setSurveyMode(pendingMode);
    // Clear selected resident when switching to non-resident mode
    if (pendingMode === 'nonResidentBased') {
      setSelectedResidentId(null);
    } else if (pendingMode === 'residentBased' && filteredResidents.length > 0 && !selectedResidentId) {
      // Auto-select first resident when switching to resident mode
      setSelectedResidentId(filteredResidents[0].id);
    }
    
    setShowModeSwitchModal(false);
    setPendingMode(null);
  }, [pendingMode, filteredResidents, selectedResidentId]);

  // Cancel mode switch
  const cancelModeSwitch = useCallback(() => {
    setShowModeSwitchModal(false);
    setPendingMode(null);
  }, []);

  // Resident management functions
  const handleAddResident = useCallback((formData) => {
    if (surveyClosed) return;

    // Get current user ID to track who created the resident
    let currentUserId = currentUser?._id || currentUser?.id;
    
    // Fallback to localStorage if currentUser is not set yet
    if (!currentUserId) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('mocksurvey_user') || '{}');
        currentUserId = storedUser._id || storedUser.id;
      } catch (e) {
        // Error getting user from local storage
      }
    }

    const newResident = {
      id: `resident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name || "",
      room: formData.room || "",
      careArea: Array.isArray(formData.careArea) ? formData.careArea : [],
      admissionDate: formData.admissionDate || null,
      notes: formData.notes || "",
      createdBy: currentUserId // Track who added this resident
    };
    
    // Track as unsaved change
    setUnsavedChanges(prev => ({
      ...prev,
      [`resident_add_${newResident.id}`]: {
        timestamp: Date.now(),
        action: 'add',
        data: newResident
      }
    }));
    
    setResidents(prev => {
      const updated = [...prev, newResident];
      // Sync with store
      store.setResidents(updated);
      return updated;
    });

    // Auto-select the newly added resident
    setSelectedResidentId(newResident.id);
  }, [surveyClosed, currentUser, store]);

  const handleRemoveResident = useCallback((residentId) => {
    if (surveyClosed) return;
    
    // Track as unsaved change
    setUnsavedChanges(prev => ({
      ...prev,
      [`resident_remove_${residentId}`]: {
        timestamp: Date.now(),
        action: 'remove',
        residentId
      }
    }));
    
    setResidents(prev => {
      const remaining = prev.filter(r => r.id !== residentId);
      // If removing selected resident, select first remaining or null
      if (selectedResidentId === residentId) {
        setSelectedResidentId(remaining.length > 0 ? remaining[0].id : null);
      }
      
      // Sync with store for team collaboration
      store.removeResident(residentId);
      
      return remaining;
    });
  }, [selectedResidentId, surveyClosed, store]);

  const handleUpdateResident = useCallback((residentId, field, value) => {
    if (surveyClosed) return;
    
    // Track as unsaved change
    setUnsavedChanges(prev => ({
      ...prev,
      [`resident_update_${residentId}_${field}`]: {
        timestamp: Date.now(),
        action: 'update',
        residentId,
        field,
        value
      }
    }));
    
    setResidents(prev => prev.map(r => {
      if (r.id !== residentId) return r;
      const updated = { ...r };
      if (field === 'admissionDate') {
        updated.admissionDate = normalizeDateValue(value);
      } else {
        updated[field] = value;
      }
      
      // Sync with store for team collaboration
      store.updateResident(residentId, { [field]: field === 'admissionDate' ? normalizeDateValue(value) : value });
      
      return updated;
    }));
  }, [surveyClosed, store]);

  const handleSelectResident = useCallback((residentId) => {
    setSelectedResidentId(residentId);
  }, []);

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
    const allResidents = new Map();

    // Detect survey mode from loaded data
    // If any clinical area has direct selfReport/surveyFocus (not in residentAnswers), it's non-resident-based
    let detectedMode = 'residentBased';
    for (const key of CLINICAL_AREA_KEYS) {
      if (loadedData[key]) {
        const area = loadedData[key];
        // Check if it has direct selfReport/surveyFocus without residentAnswers
        if ((area.selfReport || area.surveyFocus) && !area.residentAnswers) {
          detectedMode = 'nonResidentBased';
          break;
        }
        // If it has residentAnswers, it's resident-based
        if (area.residentAnswers && Object.keys(area.residentAnswers).length > 0) {
          detectedMode = 'residentBased';
          break;
        }
      }
    }
    setSurveyMode(detectedMode);

    Object.entries(loadedData).forEach(([key, value]) => {
      if (CLINICAL_AREA_KEYS.includes(key)) {
        const prevArea = prevData[key] || {};
        const incomingArea = value || {};
        
        // Check if this is non-resident-based data (has direct selfReport/surveyFocus)
        if ((incomingArea.selfReport || incomingArea.surveyFocus) && !incomingArea.residentAnswers) {
          // Non-resident-based structure
          nextData[key] = {
            ...prevArea,
            selfReport: convertBooleanToYesNo(incomingArea.selfReport || {}),
            surveyFocus: convertBooleanToYesNo(incomingArea.surveyFocus || {}),
            customSelfReportItems: Array.isArray(incomingArea.customSelfReportItems) 
              ? incomingArea.customSelfReportItems 
              : [],
            customSurveyFocusItems: Array.isArray(incomingArea.customSurveyFocusItems) 
              ? incomingArea.customSurveyFocusItems 
              : [],
            notes: incomingArea.notes ?? prevArea.notes ?? ""
          };
        } else {
          // Resident-based structure
        // Handle migration from old structure (residentSample) to new structure (residentAnswers)
        let residentAnswers = incomingArea.residentAnswers || {};
        
        // If old structure exists, migrate it
        if (incomingArea.residentSample?.residents) {
          const oldResidents = ensureResidentArray(incomingArea.residentSample.residents);
          oldResidents.forEach((resident, idx) => {
            // Create a unique ID if not present
            const residentId = resident.id || `resident_${key}_${idx}_${Date.now()}`;
            
            // Store resident in global map
            if (!allResidents.has(residentId)) {
              allResidents.set(residentId, {
                id: residentId,
                name: resident.name || "",
                room: resident.room || "",
                careArea: Array.isArray(resident.careArea) ? resident.careArea : (resident.careArea ? [resident.careArea] : []),
                admissionDate: normalizeDateValue(resident.admissionDate),
                notes: resident.notes || ""
              });
            }
            
            // Migrate old selfReport and surveyFocus to new structure
            if (!residentAnswers[residentId]) {
              residentAnswers[residentId] = {
                selfReport: convertBooleanToYesNo(incomingArea.selfReport || {}),
                surveyFocus: convertBooleanToYesNo(incomingArea.surveyFocus || {})
              };
            }
          });
        }
        
        // If new structure exists, merge it
        if (incomingArea.residentAnswers) {
          Object.entries(incomingArea.residentAnswers).forEach(([residentId, residentData]) => {
            residentAnswers[residentId] = {
              ...residentAnswers[residentId],
              selfReport: convertBooleanToYesNo(residentData.selfReport || {}),
              surveyFocus: convertBooleanToYesNo(residentData.surveyFocus || {}),
              customSelfReportItems: Array.isArray(residentData.customSelfReportItems) 
                ? residentData.customSelfReportItems 
                : [],
              customSurveyFocusItems: Array.isArray(residentData.customSurveyFocusItems) 
                ? residentData.customSurveyFocusItems 
                : []
            };
          });
        }

        nextData[key] = {
          ...prevArea,
          residentAnswers: {
            ...(prevArea.residentAnswers || {}),
            ...residentAnswers
          },
          notes: incomingArea.notes ?? prevArea.notes ?? ""
        };
        }
      } else if (key === "annualEducation") {
        // Convert boolean values to "Yes"/"No" in annualEducation
        const annualEd = convertBooleanToYesNo(value || {});
        nextData.annualEducation = {
          selfReport: {
            ...(prevData.annualEducation?.selfReport || {}),
            ...(annualEd.selfReport || {})
          },
          surveyFocus: {
            ...(prevData.annualEducation?.surveyFocus || {}),
            ...(annualEd.surveyFocus || {})
          },
          customSelfReportItems: Array.isArray(value?.customSelfReportItems)
            ? value.customSelfReportItems
            : (Array.isArray(prevData.annualEducation?.customSelfReportItems)
                ? prevData.annualEducation.customSelfReportItems
                : []),
          customSurveyFocusItems: Array.isArray(value?.customSurveyFocusItems)
            ? value.customSurveyFocusItems
            : (Array.isArray(prevData.annualEducation?.customSurveyFocusItems)
                ? prevData.annualEducation.customSurveyFocusItems
                : []),
          notes: annualEd.notes ?? prevData.annualEducation?.notes ?? ""
        };
      } else if (key === "residents") {
        // Handle global residents array
        if (Array.isArray(value)) {
          value.forEach(resident => {
            const residentId = resident.id || `resident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            if (!allResidents.has(residentId)) {
              allResidents.set(residentId, {
                id: residentId,
                name: resident.name || "",
                room: resident.room || "",
                careArea: Array.isArray(resident.careArea) ? resident.careArea : (resident.careArea ? [resident.careArea] : []),
                admissionDate: normalizeDateValue(resident.admissionDate),
                notes: resident.notes || ""
              });
            }
          });
        }
      } else {
        nextData[key] = value;
      }
    });

    // Set global residents if we found any
    if (allResidents.size > 0) {
      setResidents(Array.from(allResidents.values()));
      // Auto-select first resident if none selected
      if (!selectedResidentId && allResidents.size > 0) {
        setSelectedResidentId(Array.from(allResidents.values())[0].id);
      }
    }

    return nextData;
  }, [selectedResidentId]);

  // Cache utility functions for survey wizard data
  const getCachedWizardData = (surveyId) => {
    try {
      const cacheKey = `survey_wizard_cache_${surveyId}`;
      const cacheTimeKey = `survey_wizard_cache_time_${surveyId}`;
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheTimeKey);
      
      if (cachedData && cacheTime) {
        const now = Date.now();
        const cacheAge = now - parseInt(cacheTime, 10);
        
        // Return cached data if still valid
        if (cacheAge < CACHE_TTL) {
          return JSON.parse(cachedData);
        } else {
          // Cache expired, remove it
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(cacheTimeKey);
        }
      }
      
      return null;
    } catch (error) {
     
      return null;
    }
  };

  const setCachedWizardData = (surveyId, data) => {
    try {
      const cacheKey = `survey_wizard_cache_${surveyId}`;
      const cacheTimeKey = `survey_wizard_cache_time_${surveyId}`;
      
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(cacheTimeKey, Date.now().toString());
    } catch (error) {
      // Error setting wizard cache
    }
  };

  const clearCachedWizardData = (surveyId) => {
    try {
      const cacheKey = `survey_wizard_cache_${surveyId}`;
      const cacheTimeKey = `survey_wizard_cache_time_${surveyId}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(cacheTimeKey);
    } catch (error) {
      // Error clearing wizard cache 
    }
  };

  // Load saved data
  useEffect(() => {
    const loadSurveyData = async () => {
      try {
        setIsLoading(true);
        // Get survey ID from localStorage or URL params
        const surveyId = localStorage.getItem('currentSurveyId') || new URLSearchParams(window.location.search).get('surveyId');

        if (surveyId) {
          // Validate survey ID with store - automatically clears if mismatch
          const isValidSurvey = store.validateSurveyId(surveyId);

          if (!isValidSurvey) {
            toast.info("Starting fresh survey session", {
              description: "Previous survey data has been cleared",
              position: 'top-right',
            });
          }

          // Check store for existing data and use it to initialize state
          if (store.surveyData && Object.keys(store.surveyData).length > 0) {
            setSurveyData(prev => ({
              ...prev,
              ...store.surveyData
            }));
          }

          if (store.residents && store.residents.length > 0) {
            setResidents(store.residents);
            if (!selectedResidentId && store.residents.length > 0) {
              setSelectedResidentId(store.residents[0].id);
            }
          }

          if (store.surveyMode) {
            setSurveyMode(store.surveyMode);
          }

          if (store.teamMembers && store.teamMembers.length > 0) {
            setTeamMembers(store.teamMembers);
          }

          if (store.teamCoordinator) {
            setTeamCoordinator(store.teamCoordinator);
          }

          if (store.assignedAreas && store.assignedAreas.length > 0) {
            setAssignedAreas(store.assignedAreas);
          }

          if (typeof store.isTeamCoordinator === 'boolean') {
            setIsTeamCoordinator(store.isTeamCoordinator);
          }

          if (store.closureData) {
            setClosureData(store.closureData);
            if (store.closureData.surveyClosed) {
              setSurveyClosed(true);
            }
          }
          try {
            // Try to get the survey wizard data for facility info (with caching)
            let wizardResponse = null;
            const cachedWizardData = getCachedWizardData(surveyId);
            
            if (cachedWizardData) {
              // Use cached data
              wizardResponse = cachedWizardData;
            } else {
              // Fetch from API if not cached or cache expired
              wizardResponse = await surveyAPI.getSurveyWizard(surveyId);
              // Cache the response if successful
              if (wizardResponse?.statusCode === 200 && wizardResponse?.data) {
                setCachedWizardData(surveyId, wizardResponse);
              }
            }
            
            if (wizardResponse?.statusCode === 200 && wizardResponse?.data) {
              // Only show notification if data was freshly loaded (not from cache)
              if (!cachedWizardData) {
              setShowFacilityDataLoaded(true);
              setTimeout(() => setShowFacilityDataLoaded(false), 5000);
              }
              
              // Check if survey is closed from wizard response
              const isClosed = wizardResponse?.data?.surveyClosureSurvey?.surveyClosed || 
                               wizardResponse?.data?.surveyClosureSurvey?.surveyCompleted ||
                               wizardResponse?.data?.surveyCompleted;
              if (isClosed) {
                setSurveyClosed(true);
              }
            }

            // Fetch survey mode from riskBasedSetup endpoint and then get the appropriate survey data
            let detectedSurveyMode = null;
            let setupData = null;
            try {
              const riskBasedSetupResponse = await surveyAPI.getRiskBasedSetup(surveyId);
              if (riskBasedSetupResponse && (riskBasedSetupResponse.statusCode === 200 || riskBasedSetupResponse.status === 200)) {
                setupData = riskBasedSetupResponse.data || riskBasedSetupResponse;

                // Extract survey mode
                if (setupData?.surveyMode && (setupData.surveyMode === 'residentBased' || setupData.surveyMode === 'nonResidentBased')) {
                  detectedSurveyMode = setupData.surveyMode;
                  setSurveyMode(setupData.surveyMode);
                  store.setSurveyMode(setupData.surveyMode);
                }

                // Load team members and coordinator
                if (setupData?.teamMembers && Array.isArray(setupData.teamMembers)) {
                  setTeamMembers(setupData.teamMembers);
                  store.setTeamMembers(setupData.teamMembers);
                }
                if (setupData?.teamCoordinator) {
                  setTeamCoordinator(setupData.teamCoordinator);
                  store.setTeamCoordinator(setupData.teamCoordinator);
                }

                // Extract and load facilityInitiatedSurvey data
                if (setupData?.facilityInitiatedSurvey) {
                  const facilityData = setupData.facilityInitiatedSurvey;

                  // Only load residents if we're in resident-based mode
                  // Load residents with their clinical area answers
                  if (detectedSurveyMode === 'residentBased' && facilityData.residents && Array.isArray(facilityData.residents) && facilityData.residents.length > 0) {
                    const loadedResidents = facilityData.residents.map(r => ({
                      id: r.id || `resident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      name: r.name || "",
                      room: r.room || "",
                      careArea: Array.isArray(r.careArea) ? r.careArea : (r.careArea ? [r.careArea] : []),
                      admissionDate: normalizeDateValue(r.admissionDate),
                      notes: r.notes || "",
                      createdBy: r.createdBy || null // Preserve creator ID from API
                    }));

                    setResidents(loadedResidents);
                    store.setResidents(loadedResidents);

                    // Auto-select first resident
                    if (!selectedResidentId && loadedResidents.length > 0) {
                      setSelectedResidentId(loadedResidents[0].id);
                    }

                    // Transform resident data to survey data structure
                    const transformedSurveyData = {};

                    facilityData.residents.forEach(resident => {
                      if (resident.clinicalAreaAnswers) {
                        // Process each clinical area for this resident
                        Object.keys(resident.clinicalAreaAnswers).forEach(areaId => {
                          if (!transformedSurveyData[areaId]) {
                            transformedSurveyData[areaId] = {
                              residentAnswers: {},
                              notes: ""
                            };
                          }

                          const areaAnswers = resident.clinicalAreaAnswers[areaId];
                          transformedSurveyData[areaId].residentAnswers[resident.id] = {
                            selfReport: areaAnswers.selfReport || {},
                            surveyFocus: areaAnswers.surveyFocus || {},
                            customSelfReportItems: areaAnswers.customSelfReportItems || [],
                            customSurveyFocusItems: areaAnswers.customSurveyFocusItems || [],
                            notes: resident.clinicalAreaNotes?.[areaId] || ""
                          };
                        });
                      }
                    });

                    // Merge transformed data with existing survey data
                    setSurveyData(prev => ({
                      ...prev,
                      ...transformedSurveyData,
                      annualEducation: facilityData.residents[0]?.annualEducation || prev.annualEducation || {}
                    }));

                    // Sync with store
                    store.setSurveyData(surveyId, transformedSurveyData);
                  } else if (detectedSurveyMode === 'nonResidentBased') {
                    // Handle facility-based mode: load clinical area data directly
                    // Clear any existing residents
                    setResidents([]);
                    setSelectedResidentId(null);
                    store.setResidents([]);
                    
                    // Load clinical area data from facilityData (excluding metadata fields)
                    const facilitySurveyData = {};
                    Object.keys(facilityData).forEach(key => {
                      // Skip metadata fields
                      if (key !== 'surveyId' && key !== 'submittedAt' && key !== 'surveyMode' && key !== 'residents' && key !== 'completedAt') {
                        facilitySurveyData[key] = facilityData[key];
                      }
                    });
                    
                    // Merge with existing survey data
                    setSurveyData(prev => ({
                      ...prev,
                      ...facilitySurveyData
                    }));
                    
                    // Sync with store
                    store.setSurveyData(surveyId, facilitySurveyData);
                  }
                }
              }
            } catch (error) {
             
              // Fallback to localStorage if API call fails
              const storedSetup = localStorage.getItem('riskBasedProcessSetup');
              if (storedSetup) {
                try {
                  const setup = JSON.parse(storedSetup);
                  setupData = setup;
                  if (setup.surveyMode && (setup.surveyMode === 'residentBased' || setup.surveyMode === 'nonResidentBased')) {
                    detectedSurveyMode = setup.surveyMode;
                    setSurveyMode(setup.surveyMode);
                  }
                  if (setup?.teamMembers && Array.isArray(setup.teamMembers)) {
                    setTeamMembers(setup.teamMembers);
                    store.setTeamMembers(setup.teamMembers);
                  }
                  if (setup?.teamCoordinator) {
                    setTeamCoordinator(setup.teamCoordinator);
                    store.setTeamCoordinator(setup.teamCoordinator);
                  }
                } catch (parseError) {
                  // Error parsing stored setup
                }
              }
            }
            
            // Get current user from API to check if they are team coordinator
            try {
              const userResponse = await profileAPI.getProfile();
              if (userResponse?.statusCode === 200 && userResponse?.data) {
                const currentUserData = userResponse.data;
                setCurrentUser(currentUserData);

            

                // Check if user is team coordinator using setupData
                if (setupData?.teamCoordinator) {
                  // Trim whitespace for comparison
                  const coordinatorValue = String(setupData.teamCoordinator || '').trim();
                  const userName = String(currentUserData?.name || currentUserData?.firstName || '').trim();
                  const userEmail = String(currentUserData?.email || '').trim();
                  const userId = String(currentUserData?._id || currentUserData?.id || '').trim();

                  // First check: Direct comparison with coordinatorValue
                  let isCoordinator = userEmail === coordinatorValue ||
                                     userId === coordinatorValue ||
                                     userName === coordinatorValue;

                  // Second check: Find coordinator in teamMembers and check both name and email
                  if (!isCoordinator && setupData?.teamMembers && Array.isArray(setupData.teamMembers)) {
                    const coordinatorMember = setupData.teamMembers.find(
                      member => 
                        String(member.name || '').trim() === coordinatorValue ||
                        String(member.email || '').trim() === coordinatorValue ||
                        String(member.id || member._id || '').trim() === coordinatorValue
                    );

                    if (coordinatorMember) {
                      const coordinatorName = String(coordinatorMember.name || '').trim();
                      const coordinatorEmail = String(coordinatorMember.email || '').trim();
                      const coordinatorId = String(coordinatorMember.id || coordinatorMember._id || '').trim();

                      isCoordinator = userEmail === coordinatorEmail ||
                                     userName === coordinatorName ||
                                     userId === coordinatorId ||
                                     userEmail === coordinatorName || // Also check if coordinatorValue was a name
                                     userName === coordinatorEmail;   // Also check if coordinatorValue was an email
                    }
                  }

                

                  setIsTeamCoordinator(isCoordinator);
                  store.setIsTeamCoordinator(isCoordinator);

                  if (isCoordinator) {
                    // Team coordinator sees all areas
                    setAssignedAreas([]);
                    store.setAssignedAreas([]);
                  } else {
                    // Team member - check if they're in teamMembers and get assigned areas
                    if (setupData?.teamMembers && Array.isArray(setupData.teamMembers)) {
                      const currentMember = setupData.teamMembers.find(
                        member => member.email === currentUserData?.email ||
                                 member.id === currentUserData?._id ||
                                 member.id === currentUserData?.id ||
                                 String(member.id) === String(currentUserData?._id) ||
                                 String(member.id) === String(currentUserData?.id)
                      );
                      if (currentMember?.assignedAreas) {
                        const areaIds = currentMember.assignedAreas.map(area =>
                          typeof area === 'object' ? area.id : area
                        );
                        setAssignedAreas(areaIds);
                        store.setAssignedAreas(areaIds);
                      } else {
                        setAssignedAreas([]);
                        store.setAssignedAreas([]);
                      }
                    } else {
                      setAssignedAreas([]);
                      store.setAssignedAreas([]);
                    }
                  }
                }
              } else {
                // Fallback to localStorage if API fails
                const currentUserData = JSON.parse(localStorage.getItem('mocksurvey_user') || '{}');
                setCurrentUser(currentUserData);

              

                // Fallback logic using setupData
                if (setupData?.teamCoordinator) {
                  // Trim whitespace for comparison
                  const coordinatorValue = String(setupData.teamCoordinator || '').trim();
                  const userName = String(currentUserData?.name || currentUserData?.firstName || '').trim();
                  const userEmail = String(currentUserData?.email || '').trim();
                  const userId = String(currentUserData?._id || currentUserData?.id || '').trim();

                  // First check: Direct comparison with coordinatorValue
                  let isCoordinator = userEmail === coordinatorValue ||
                                     userId === coordinatorValue ||
                                     userName === coordinatorValue;

                  // Second check: Find coordinator in teamMembers and check both name and email
                  if (!isCoordinator && setupData?.teamMembers && Array.isArray(setupData.teamMembers)) {
                    const coordinatorMember = setupData.teamMembers.find(
                      member => 
                        String(member.name || '').trim() === coordinatorValue ||
                        String(member.email || '').trim() === coordinatorValue ||
                        String(member.id || member._id || '').trim() === coordinatorValue
                    );

                    if (coordinatorMember) {
                      const coordinatorName = String(coordinatorMember.name || '').trim();
                      const coordinatorEmail = String(coordinatorMember.email || '').trim();
                      const coordinatorId = String(coordinatorMember.id || coordinatorMember._id || '').trim();

                      isCoordinator = userEmail === coordinatorEmail ||
                                     userName === coordinatorName ||
                                     userId === coordinatorId ||
                                     userEmail === coordinatorName || // Also check if coordinatorValue was a name
                                     userName === coordinatorEmail;   // Also check if coordinatorValue was an email
                    }
                  }

              

                  setIsTeamCoordinator(isCoordinator);
                  store.setIsTeamCoordinator(isCoordinator);

                  if (isCoordinator) {
                    setAssignedAreas([]);
                    store.setAssignedAreas([]);
                  } else {
                    if (setupData?.teamMembers && Array.isArray(setupData.teamMembers)) {
                      const currentMember = setupData.teamMembers.find(
                        member => member.email === currentUserData?.email ||
                                 member.id === currentUserData?._id ||
                                 member.id === currentUserData?.id ||
                                 String(member.id) === String(currentUserData?._id) ||
                                 String(member.id) === String(currentUserData?.id)
                      );
                      if (currentMember?.assignedAreas) {
                        const areaIds = currentMember.assignedAreas.map(area =>
                          typeof area === 'object' ? area.id : area
                        );
                        setAssignedAreas(areaIds);
                        store.setAssignedAreas(areaIds);
                      } else {
                        setAssignedAreas([]);
                        store.setAssignedAreas([]);
                      }
                    } else {
                      setAssignedAreas([]);
                      store.setAssignedAreas([]);
                    }
                  }
                }
              }
            } catch (userError) {
              // Failed to fetch user profile
              // Fallback to localStorage
              const currentUserData = JSON.parse(localStorage.getItem('mocksurvey_user') || '{}');
              setCurrentUser(currentUserData);

             

              // Fallback logic using setupData
              if (setupData?.teamCoordinator) {
                // Trim whitespace for comparison
                const coordinatorValue = String(setupData.teamCoordinator || '').trim();
                const userName = String(currentUserData?.name || currentUserData?.firstName || '').trim();
                const userEmail = String(currentUserData?.email || '').trim();
                const userId = String(currentUserData?._id || currentUserData?.id || '').trim();

                // First check: Direct comparison with coordinatorValue
                let isCoordinator = userEmail === coordinatorValue ||
                                   userId === coordinatorValue ||
                                   userName === coordinatorValue;

                // Second check: Find coordinator in teamMembers and check both name and email
                if (!isCoordinator && setupData?.teamMembers && Array.isArray(setupData.teamMembers)) {
                  const coordinatorMember = setupData.teamMembers.find(
                    member => 
                      String(member.name || '').trim() === coordinatorValue ||
                      String(member.email || '').trim() === coordinatorValue ||
                      String(member.id || member._id || '').trim() === coordinatorValue
                  );

                  if (coordinatorMember) {
                    const coordinatorName = String(coordinatorMember.name || '').trim();
                    const coordinatorEmail = String(coordinatorMember.email || '').trim();
                    const coordinatorId = String(coordinatorMember.id || coordinatorMember._id || '').trim();

                    isCoordinator = userEmail === coordinatorEmail ||
                                   userName === coordinatorName ||
                                   userId === coordinatorId ||
                                   userEmail === coordinatorName || // Also check if coordinatorValue was a name
                                   userName === coordinatorEmail;   // Also check if coordinatorValue was an email
                  }
                }

               

                setIsTeamCoordinator(isCoordinator);
                store.setIsTeamCoordinator(isCoordinator);

                if (isCoordinator) {
                  setAssignedAreas([]);
                  store.setAssignedAreas([]);
                } else {
                  if (setupData?.teamMembers && Array.isArray(setupData.teamMembers)) {
                    const currentMember = setupData.teamMembers.find(
                      member => member.email === currentUserData?.email ||
                               member.id === currentUserData?._id ||
                               member.id === currentUserData?.id ||
                               String(member.id) === String(currentUserData?._id) ||
                               String(member.id) === String(currentUserData?.id)
                    );
                    if (currentMember?.assignedAreas) {
                      const areaIds = currentMember.assignedAreas.map(area =>
                        typeof area === 'object' ? area.id : area
                      );
                      setAssignedAreas(areaIds);
                      store.setAssignedAreas(areaIds);
                    } else {
                      setAssignedAreas([]);
                      store.setAssignedAreas([]);
                    }
                  } else {
                    setAssignedAreas([]);
                    store.setAssignedAreas([]);
                  }
                }
              }
            }

            // Get the appropriate survey data based on surveyMode
            let response = null;
            if (detectedSurveyMode === 'residentBased') {
              // Use userRiskBasedSetup endpoint for resident-based surveys
              try {
                response = await surveyAPI.getUserRiskBasedSetup(surveyId);
              } catch (error) {
               
                // Fallback to facility initiated survey if user endpoint fails
                response = await surveyAPI.getFacilityInitiatedSurvey(surveyId);
              }
            } else if (detectedSurveyMode === 'nonResidentBased') {
              // Use facilityRiskBasedSetup endpoint for facility-based surveys
              try {
                response = await surveyAPI.getFacilityRiskBasedSetup(surveyId);
              } catch (error) {
               
                // Fallback to facility initiated survey if facility endpoint fails
                response = await surveyAPI.getFacilityInitiatedSurvey(surveyId);
              }
            } else {
              // Fallback to facility initiated survey if surveyMode is not detected
              response = await surveyAPI.getFacilityInitiatedSurvey(surveyId);
            }
            
            if (response && response.statusCode === 200 && response.data) {
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
              const { completedAt: _, surveyId: __, submittedAt: ___, residents: loadedResidents, surveyMode: loadedMode, ...surveyDataOnly } = loadedData;
              
              // Set survey mode if present in loaded data
              if (loadedMode === 'nonResidentBased' || loadedMode === 'residentBased') {
                setSurveyMode(loadedMode);
              }
              
              // Load global residents if they exist and mode is resident-based
              if (loadedMode !== 'nonResidentBased' && Array.isArray(loadedResidents) && loadedResidents.length > 0) {
                const normalizedResidents = loadedResidents.map(r => ({
                  id: r.id || `resident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  name: r.name || "",
                  room: r.room || "",
                  careArea: Array.isArray(r.careArea) ? r.careArea : (r.careArea ? [r.careArea] : []),
                  admissionDate: normalizeDateValue(r.admissionDate),
                  notes: r.notes || ""
                }));
                setResidents(normalizedResidents);
                // Auto-select first resident if none selected
                if (!selectedResidentId && normalizedResidents.length > 0) {
                  setSelectedResidentId(normalizedResidents[0].id);
                }
              }

              setSurveyData(prev => mergeLoadedSurveyData(prev, surveyDataOnly));

              // Sync with Zustand store for team collaboration
              store.setSurveyMode(loadedMode || 'residentBased');
              store.setSurveyData(surveyId, surveyDataOnly);
              if (loadedMode !== 'nonResidentBased' && Array.isArray(loadedResidents) && loadedResidents.length > 0) {
                const normalizedResidents = loadedResidents.map(r => ({
                  id: r.id || `resident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  name: r.name || "",
                  room: r.room || "",
                  careArea: Array.isArray(r.careArea) ? r.careArea : (r.careArea ? [r.careArea] : []),
                  admissionDate: normalizeDateValue(r.admissionDate),
                  notes: r.notes || ""
                }));
                store.setResidents(normalizedResidents);
              }

            }

            // Try to get survey closure status
            try {
              const closureResponse = await surveyAPI.getSurveyClosure(surveyId);
              if (closureResponse.statusCode === 200 && closureResponse.data) {
                const closure = closureResponse.data.stepData || closureResponse.data;
                if (closure.surveyClosed) {
                  setSurveyClosed(true);
                  const signature = closure.closureSignature || {};
                  const closureDataObj = {
                    surveyClosed: closure.surveyClosed || false,
                    closureNotes: closure.closureNotes || "",
                    closureSignature: {
                      signedBy: signature.signedBy || "",
                      title: signature.title || "",
                      signedDate: signature.signedDate ? new Date(signature.signedDate) : null,
                      confirmed: signature.confirmed || false,
                    }
                  };
                  setClosureData(closureDataObj);
                  store.setClosureData(closureDataObj);
                }
              }
            } catch (closureError) {
              // Closure not found is okay, survey might not be closed yet
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

  // Helper function to update team coordinator status during real-time updates
  const updateTeamCoordinatorStatus = useCallback(async (setupData) => {
    try {
      // Get current user data (try API first, fallback to localStorage)
      let currentUserData = null;

      try {
        const userResponse = await profileAPI.getProfile();
        if (userResponse?.statusCode === 200 && userResponse?.data) {
          currentUserData = userResponse.data;
        }
      } catch (apiError) {
        // Profile API failed, using localStorage
      }

      // Fallback to localStorage if API fails
      if (!currentUserData) {
        currentUserData = JSON.parse(localStorage.getItem('mocksurvey_user') || '{}');
      }

      if (!currentUserData || !setupData) {
        return;
      }

      // Debug logs
     
      // Check if current user is the team coordinator
      // Trim whitespace for comparison
      const coordinatorValue = String(setupData.teamCoordinator || '').trim();
      const userName = String(currentUserData?.name || currentUserData?.firstName || '').trim();
      const userEmail = String(currentUserData?.email || '').trim();
      const userId = String(currentUserData?._id || currentUserData?.id || '').trim();

      // First check: Direct comparison with coordinatorValue
      let isCoordinator = userEmail === coordinatorValue ||
                         userId === coordinatorValue ||
                         userName === coordinatorValue;

      // Second check: Find coordinator in teamMembers and check both name and email
      if (!isCoordinator && setupData?.teamMembers && Array.isArray(setupData.teamMembers)) {
        const coordinatorMember = setupData.teamMembers.find(
          member => 
            String(member.name || '').trim() === coordinatorValue ||
            String(member.email || '').trim() === coordinatorValue ||
            String(member.id || member._id || '').trim() === coordinatorValue
        );

        if (coordinatorMember) {
          const coordinatorName = String(coordinatorMember.name || '').trim();
          const coordinatorEmail = String(coordinatorMember.email || '').trim();
          const coordinatorId = String(coordinatorMember.id || coordinatorMember._id || '').trim();

          isCoordinator = userEmail === coordinatorEmail ||
                         userName === coordinatorName ||
                         userId === coordinatorId ||
                         userEmail === coordinatorName || // Also check if coordinatorValue was a name
                         userName === coordinatorEmail;   // Also check if coordinatorValue was an email
        }
      }

     
      setIsTeamCoordinator(isCoordinator);
      store.setIsTeamCoordinator(isCoordinator);

      if (isCoordinator) {
        // Team coordinator sees all areas and residents
        setAssignedAreas([]);
        store.setAssignedAreas([]);
      } else {
        // Team member - check if they're in teamMembers and get assigned areas
        if (setupData?.teamMembers && Array.isArray(setupData.teamMembers)) {
          const currentMember = setupData.teamMembers.find(
            member => member.email === currentUserData?.email ||
                     member.id === currentUserData?._id ||
                     member.id === currentUserData?.id ||
                     String(member.id) === String(currentUserData?._id) ||
                     String(member.id) === String(currentUserData?.id)
          );

          if (currentMember?.assignedAreas) {
            const areaIds = currentMember.assignedAreas.map(area =>
              typeof area === 'object' ? area.id : area
            );
            setAssignedAreas(areaIds);
            store.setAssignedAreas(areaIds);
          } else {
            // Team member with no assigned areas
            setAssignedAreas([]);
            store.setAssignedAreas([]);
          }
        } else {
          // No team members data, default to no assigned areas
          setAssignedAreas([]);
          store.setAssignedAreas([]);
        }
      }
    } catch (error) {
      // Error updating team coordinator status 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - function uses stable store methods and state setters

  // Socket connection for real-time updates and saving
  useEffect(() => {
    const surveyId = localStorage.getItem('currentSurveyId') || new URLSearchParams(window.location.search).get('surveyId');
    
    // Get user ID from state or localStorage
    let currentUserId = currentUser?._id || currentUser?.id;
    if (!currentUserId) {
      const storedUser = JSON.parse(localStorage.getItem('mocksurvey_user') || '{}');
      currentUserId = storedUser?._id || storedUser?.id;
    }

    // Only connect if we have both surveyId and userId
    if (!surveyId || !currentUserId) {
      return;
    }

    // Check if socket is already connected with same IDs
    const existingSocket = surveySocketService.getSocket();
    const isAlreadyConnected = existingSocket && existingSocket.connected;

    // Only connect if not already connected
    // The connect() method will check internally and won't reconnect if already connected with same IDs
    if (!isAlreadyConnected) {
      surveySocketService.connect(surveyId, currentUserId);
    }

    // Debounce mechanism to prevent multiple simultaneous API calls from multiple events
    let lastSyncTime = 0;
    const SYNC_DEBOUNCE_MS = 500; // Wait 500ms between syncs

    const shouldSync = () => {
        const now = Date.now();
      if (now - lastSyncTime < SYNC_DEBOUNCE_MS) {
        return false;
      }
      lastSyncTime = now;
      return true;
    };

    // Helper to process setup data (shared by joinRoom and handleViewRiskBased)
      const processSetupData = async (setupData) => {
          if (!setupData) return;

          // Update team members and coordinator
          if (setupData.teamMembers && Array.isArray(setupData.teamMembers)) {
            setTeamMembers(setupData.teamMembers);
            store.setTeamMembers(setupData.teamMembers);
          }

          if (setupData.teamCoordinator) {
            setTeamCoordinator(setupData.teamCoordinator);
            store.setTeamCoordinator(setupData.teamCoordinator);
          }

          // Update team coordinator status for current user
          await updateTeamCoordinatorStatus(setupData);

          // Update survey mode from setupData if present
          const newMode = setupData.surveyMode && (setupData.surveyMode === 'residentBased' || setupData.surveyMode === 'nonResidentBased')
            ? setupData.surveyMode
            : surveyMode;
          
          if (setupData.surveyMode && (setupData.surveyMode === 'residentBased' || setupData.surveyMode === 'nonResidentBased')) {
            setSurveyMode(setupData.surveyMode);
            store.setSurveyMode(setupData.surveyMode);
            
            // Clear residents if switching to facility mode
            if (setupData.surveyMode === 'nonResidentBased') {
              setResidents([]);
              setSelectedResidentId(null);
              store.setResidents([]);
            }
          }

          // Load facility initiated survey data if present with smart merge
          if (setupData.facilityInitiatedSurvey) {
            const facilityData = setupData.facilityInitiatedSurvey;
            const now = Date.now();
            // ✅ USE REF HERE
            const currentUnsaved = unsavedChangesRef.current;

        // Determine mode: use surveyMode from setupData, fallback to checking residents array
        const currentMode = newMode;
        const isResidentBased = currentMode === 'residentBased';

        // Handle resident-based mode
        if (isResidentBased) {
              const loadedResidents = facilityData.residents.map(r => ({
                id: r.id || `resident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: r.name || "",
                room: r.room || "",
                careArea: Array.isArray(r.careArea) ? r.careArea : (r.careArea ? [r.careArea] : []),
                admissionDate: normalizeDateValue(r.admissionDate),
                notes: r.notes || "",
                createdBy: r.createdBy || null
              }));

              // Smart merge residents to preserve recent local changes
              setResidents(prev => {
                let merged = [...loadedResidents];
                
                // Check for locally added residents (within last 5 seconds)
                const recentlyAdded = Object.keys(currentUnsaved)
                  .filter(key => key.startsWith('resident_add_') && (now - currentUnsaved[key].timestamp) < 5000)
                  .map(key => currentUnsaved[key].data);
                
                // Check for locally removed residents (within last 5 seconds)
                const recentlyRemoved = Object.keys(currentUnsaved)
                  .filter(key => key.startsWith('resident_remove_') && (now - currentUnsaved[key].timestamp) < 5000)
                  .map(key => currentUnsaved[key].residentId);
                
                // Add locally created residents
                recentlyAdded.forEach(resident => {
                  if (!merged.find(r => r.id === resident.id)) {
                    merged.push(resident);
                  }
                });
                
                // Remove residents that were locally deleted
                merged = merged.filter(resident => {
                  if (recentlyRemoved.includes(resident.id)) {
                    return false;
                  }
                  return true;
                });
                
                // Apply local updates to residents
                merged = merged.map(resident => {
                  const updateKeys = Object.keys(currentUnsaved).filter(
                    key => key.startsWith(`resident_update_${resident.id}_`) && (now - currentUnsaved[key].timestamp) < 5000
                  );
                  
                  if (updateKeys.length > 0) {
                    const updated = { ...resident };
                    updateKeys.forEach(key => {
                      const change = currentUnsaved[key];
                      updated[change.field] = change.value;
                    });
                    return updated;
                  }
                  
                  return resident;
                });
                
                return merged;
              });
              
              store.setResidents(loadedResidents);

              // Transform resident data to survey data structure
              const transformedSurveyData = {};

              facilityData.residents.forEach(resident => {
                if (resident.clinicalAreaAnswers) {
                  Object.keys(resident.clinicalAreaAnswers).forEach(areaId => {
                    if (!transformedSurveyData[areaId]) {
                      transformedSurveyData[areaId] = {
                        residentAnswers: {},
                        notes: ""
                      };
                    }

                    const areaAnswers = resident.clinicalAreaAnswers[areaId];
                    transformedSurveyData[areaId].residentAnswers[resident.id] = {
                      selfReport: areaAnswers.selfReport || {},
                      surveyFocus: areaAnswers.surveyFocus || {},
                      customSelfReportItems: areaAnswers.customSelfReportItems || [],
                      customSurveyFocusItems: areaAnswers.customSurveyFocusItems || [],
                      notes: resident.clinicalAreaNotes?.[areaId] || ""
                    };
                  });
                }
              });

              // Smart merge survey data to preserve recent local changes
              setSurveyData(prev => {
                const merged = { ...prev };
                const dataForStore = {};
                
                Object.keys(transformedSurveyData).forEach(areaId => {
                  const hasUnsavedChanges = currentUnsaved[areaId];
                  const unsavedTimestamp = hasUnsavedChanges?.timestamp || 0;
                  
                  if (hasUnsavedChanges && (now - unsavedTimestamp) < 5000) {
                    dataForStore[areaId] = merged[areaId];
                    return; // Skip to next area
                  }
                  
                  if (!merged[areaId]) {
                    merged[areaId] = transformedSurveyData[areaId];
                    dataForStore[areaId] = transformedSurveyData[areaId];
                  } else {
                    const mergedResidentAnswers = { ...merged[areaId].residentAnswers };
                    
                    Object.keys(transformedSurveyData[areaId].residentAnswers || {}).forEach(residentId => {
                      const residentUnsavedKey = `${areaId}_${residentId}`;
                      const hasResidentUnsaved = currentUnsaved[residentUnsavedKey];
                      
                      if (hasResidentUnsaved && (now - hasResidentUnsaved.timestamp) < 5000) {
                        // Keep local
                      } else {
                        mergedResidentAnswers[residentId] = transformedSurveyData[areaId].residentAnswers[residentId];
                      }
                    });
                    
                    merged[areaId] = {
                      ...merged[areaId],
                      residentAnswers: mergedResidentAnswers
                    };
                    dataForStore[areaId] = merged[areaId];
                  }
                });
                
                // ✅ Sync to store INSIDE the callback
                if (surveyId) {
                   store.setSurveyData(surveyId, dataForStore);
                }
                
                return merged;
              });
        } else {
          // Handle non-resident-based mode (facility-based)
          // Clinical areas are at the top level of facilityData
          setSurveyData(prev => {
            const merged = { ...prev };
            const dataToSync = {}; // Track what we'll sync to store
            
            // Merge each clinical area intelligently
            Object.keys(facilityData).forEach(key => {
              // Skip metadata fields
              if (key === 'surveyId' || key === 'submittedAt' || key === 'surveyMode' || key === 'residents') {
                return; // Skip to next key
              }
              
              const hasUnsavedChanges = currentUnsaved[key];
              const unsavedTimestamp = hasUnsavedChanges?.timestamp || 0;
              
              // If there are very recent unsaved changes (within last 5 seconds), preserve them
              if (hasUnsavedChanges && (now - unsavedTimestamp) < 5000) {
                // Keep the local unsaved data for this field
                dataToSync[key] = merged[key]; // Use local data for store
                return; // Skip to next key in forEach
              }
              
              // Accept remote data for this field
              merged[key] = facilityData[key];
              dataToSync[key] = facilityData[key];
            });
            
            // ✅ Sync to store INSIDE the callback
            if (surveyId) {
                store.setSurveyData(surveyId, dataToSync);
            }

            return merged;
          });
        }
      }
    };

    const joinRoom = async () => {
      const socket = surveySocketService.getSocket();
      if (socket && socket.connected) {
       
        socket.emit("join_view_risk_based", {
          surveyId: surveyId,
          userId: currentUserId
        });
        
        // CRITICAL: Also join mode-specific rooms to receive broadcasts from team members
        // When team members save, they emit join_risk_based_resident/join_risk_based_nonresident
        // The backend broadcasts risk_based_resident/risk_based_nonresident events
        // Team lead needs to be in these rooms to receive the broadcasts
        // According to API docs: join_risk_based_resident/join_risk_based_nonresident expects:
        // { currentStep, stepData, completedAt }
        // We send minimal payload with empty stepData to join the room without triggering a save
        // Note: surveyId and userId are handled by socket connection query params
        if (surveyMode === 'residentBased') {
        
          socket.emit("join_risk_based_resident", {
            currentStep: 'facility-initiated-survey',
            stepData: {}, // Empty stepData - just joining room, not saving
            completedAt: null
          });
        } else if (surveyMode === 'nonResidentBased') {
         
          socket.emit("join_risk_based_nonresident", {
            currentStep: 'facility-initiated-survey',
            stepData: {}, // Empty stepData - just joining room, not saving
            completedAt: null
          });
        }

        // CRITICAL: After joining the room, fetch latest data to sync any updates that happened before joining
        // This ensures team leads/coordinators see team member updates even if they joined after saves occurred
        // We fetch immediately and also after a short delay to ensure we get the latest data
        const fetchLatestData = async () => {
          try {
           
            const riskBasedSetupResponse = await surveyAPI.getRiskBasedSetup(surveyId);
            if (riskBasedSetupResponse && riskBasedSetupResponse.data) {
             
              await processSetupData(riskBasedSetupResponse.data);
            } else {
              // No data in response after joining room 
            }
          } catch (error) {
            // Error fetching latest data after joining room
          }
        };

        // Fetch immediately (room join is async, but we can start the fetch)
        fetchLatestData();
        
        // Also fetch after a short delay to catch any data that was saved between join and now
        setTimeout(fetchLatestData, 1500);
      }
    };

    const handleSocketConnect = (data) => {
      const socket = surveySocketService.getSocket();
      if (socket && socket.connected) {
       

        // Check if we have existing survey data
        const hasSurveyData = Object.keys(surveyData).length > 0 || 
          (surveyMode === 'residentBased' && residents.length > 0);

        // If no survey data exists, request it from server via socket
        if (!hasSurveyData) {
          
          // Request data from server - this will populate via view_risk_based response
          socket.emit("join_view_risk_based", {
            surveyId: surveyId,
            userId: currentUserId,
          });
        }

        // Join rooms (this will also emit mode-specific joins)
        joinRoom();
      }
    };

    // Handle view_risk_based broadcast (general real-time updates for ALL team members)
    // Handle view_risk_based broadcast (general real-time updates for ALL team members)
    const handleViewRiskBased = async (message) => {
    

      // processSetupData is defined above, shared with joinRoom

      // 1. Process Payload Immediately (if available)
      if (message?.data) {
        
        await processSetupData(message.data);
      }

      // 2. Background Sync (Debounced)
      if (shouldSync()) {
        try {
            const riskBasedSetupResponse = await surveyAPI.getRiskBasedSetup(surveyId);
            if (riskBasedSetupResponse && riskBasedSetupResponse.data) {
                await processSetupData(riskBasedSetupResponse.data);
            }
        } catch (error) {
           // Error fetching risk-based update
        }
      }
    };

    // Handle risk_based_resident broadcast (for resident-based surveys)
    // RACE CONDITION PROTECTION:
    // - Tracks unsaved changes with timestamps
    // - Preserves local changes made within last 5 seconds when broadcast arrives
    // - Intelligently merges remote data for areas/residents without recent local changes
    // - Prevents accidental data loss when multiple team members edit simultaneously
    const handleRiskBasedResident = async (message) => {
     

      // Check if message has the expected structure
      if (!message?.data?.facilityInitiatedSurvey) {
        
        return;
      }

      const facilityData = message.data.facilityInitiatedSurvey;
     

      // 1. Process Data Update Immediately (using payload)
      // Declare variables outside if block for proper scope
      let loadedResidents = [];

      // Load residents if present with smart merge to handle concurrent operations
      if (facilityData.residents && Array.isArray(facilityData.residents) && facilityData.residents.length > 0) {
        loadedResidents = facilityData.residents.map(r => ({
          id: r.id || `resident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: r.name || "",
          room: r.room || "",
          careArea: Array.isArray(r.careArea) ? r.careArea : (r.careArea ? [r.careArea] : []),
          admissionDate: normalizeDateValue(r.admissionDate),
          notes: r.notes || "",
          createdBy: r.createdBy || null // Preserve creator ID from API
        }));

        // Smart merge: preserve locally added/removed/updated residents if changes are very recent
        setResidents(prev => {
          const now = Date.now();
          // ✅ USE REF HERE
          const currentUnsaved = unsavedChangesRef.current;
          let merged = [...loadedResidents];
          
          // Check for locally added residents (within last 5 seconds)
          const recentlyAdded = Object.keys(currentUnsaved)
            .filter(key => key.startsWith('resident_add_') && (now - currentUnsaved[key].timestamp) < 5000)
            .map(key => currentUnsaved[key].data);
          
          // Check for locally removed residents (within last 5 seconds)
          const recentlyRemoved = Object.keys(currentUnsaved)
            .filter(key => key.startsWith('resident_remove_') && (now - currentUnsaved[key].timestamp) < 5000)
            .map(key => currentUnsaved[key].residentId);
          
          // Add locally created residents that aren't in the broadcast
          recentlyAdded.forEach(resident => {
            if (!merged.find(r => r.id === resident.id)) {
              merged.push(resident);
            }
          });
          
          // Remove residents that were locally deleted
          merged = merged.filter(resident => {
            if (recentlyRemoved.includes(resident.id)) {
              return false;
            }
            return true;
          });
          
          // Apply local updates to residents
          merged = merged.map(resident => {
            const updateKeys = Object.keys(currentUnsaved).filter(
              key => key.startsWith(`resident_update_${resident.id}_`) && (now - currentUnsaved[key].timestamp) < 5000
            );
            
            if (updateKeys.length > 0) {
              const updated = { ...resident };
              updateKeys.forEach(key => {
                const change = currentUnsaved[key];
                updated[change.field] = change.value;
              });
              return updated;
            }
            
            return resident;
          });
          
          return merged;
        });
        
        store.setResidents(loadedResidents);

        // Transform resident data to survey data structure
        const transformedSurveyData = {};

        facilityData.residents.forEach(resident => {
          if (resident.clinicalAreaAnswers) {
            Object.keys(resident.clinicalAreaAnswers).forEach(areaId => {
              if (!transformedSurveyData[areaId]) {
                transformedSurveyData[areaId] = {
                  residentAnswers: {},
                  notes: ""
                };
              }

              const areaAnswers = resident.clinicalAreaAnswers[areaId];
              transformedSurveyData[areaId].residentAnswers[resident.id] = {
                selfReport: areaAnswers.selfReport || {},
                surveyFocus: areaAnswers.surveyFocus || {},
                customSelfReportItems: areaAnswers.customSelfReportItems || [],
                customSurveyFocusItems: areaAnswers.customSurveyFocusItems || [],
                notes: resident.clinicalAreaNotes?.[areaId] || ""
              };
            });
          }
        });

        // Merge with existing data using smart merge to preserve unsaved changes
        setSurveyData(prev => {
          const merged = { ...prev };
          const now = Date.now();
          // ✅ USE REF HERE
          const currentUnsaved = unsavedChangesRef.current;
          const dataForStore = {};

          // Merge each area's data intelligently
          Object.keys(transformedSurveyData).forEach(areaId => {
            const hasUnsavedChanges = currentUnsaved[areaId];
            const unsavedTimestamp = hasUnsavedChanges?.timestamp || 0;
            
            // If there are very recent unsaved changes (within last 5 seconds), preserve them
            if (hasUnsavedChanges && (now - unsavedTimestamp) < 5000) {
              // Keep the local unsaved data for this area (don't update it)
              dataForStore[areaId] = merged[areaId]; // Use local data for store
              return; // Skip to next area in forEach
            }
            
            if (!merged[areaId]) {
              merged[areaId] = transformedSurveyData[areaId];
              dataForStore[areaId] = transformedSurveyData[areaId];
            } else {
              // Merge resident answers, but preserve those with unsaved changes
              const mergedResidentAnswers = { ...merged[areaId].residentAnswers };
              
              Object.keys(transformedSurveyData[areaId].residentAnswers || {}).forEach(residentId => {
                const residentUnsavedKey = `${areaId}_${residentId}`;
                const hasResidentUnsaved = currentUnsaved[residentUnsavedKey];
                
                if (hasResidentUnsaved && (now - hasResidentUnsaved.timestamp) < 5000) {
                  // Keep local data for this resident (already in mergedResidentAnswers)
                } else {
                  // Accept remote data for this resident
                  mergedResidentAnswers[residentId] = transformedSurveyData[areaId].residentAnswers[residentId];
                }
              });
              
              merged[areaId] = {
                ...merged[areaId],
                residentAnswers: mergedResidentAnswers
              };
              
              dataForStore[areaId] = merged[areaId];
            }
          });

          // ✅ Sync to store INSIDE the callback where we have the calculated data
          if (surveyId) {
              store.setSurveyData(surveyId, dataForStore);
          }

          return merged;
        });
      }

      toast.success("Survey data updated", {
        description: "Changes from team member received",
        position: 'top-right',
        duration: 3000
      });

      // 2. Background Sync for Metadata (Team members, etc) - Debounced
      if (shouldSync()) {
        try {
          // Fetch fresh data to get team members, coordinator, and all setup info
          const riskBasedSetupResponse = await surveyAPI.getRiskBasedSetup(surveyId);

          if (riskBasedSetupResponse && riskBasedSetupResponse.data) {
            const setupData = riskBasedSetupResponse.data;

            // Update team members and coordinator
            if (setupData.teamMembers && Array.isArray(setupData.teamMembers)) {
              setTeamMembers(setupData.teamMembers);
              store.setTeamMembers(setupData.teamMembers);
            }

            if (setupData.teamCoordinator) {
              setTeamCoordinator(setupData.teamCoordinator);
              store.setTeamCoordinator(setupData.teamCoordinator);
            }

            // Update team coordinator status for current user
            await updateTeamCoordinatorStatus(setupData);
          }
        } catch (error) {
          // Error fetching real-time metadata update
        }
      }
    };

    // Handle risk_based_nonresident broadcast (for facility-based surveys)
    // RACE CONDITION PROTECTION:
    // - Same protection as resident-based mode
    // - Preserves unsaved field-level changes when broadcast arrives
    // - Only syncs remote data for fields without recent local changes
    const handleRiskBasedNonresident = async (message) => {
     

      // Check if message has the expected structure
      if (!message?.data?.facilityInitiatedSurvey) {
        
        return;
      }

      const facilityData = message.data.facilityInitiatedSurvey;
     

      // 1. Process Data Update Immediately (using payload)
      // Merge with existing data using smart merge to preserve unsaved changes
      setSurveyData(prev => {
        const merged = { ...prev };
        const now = Date.now();
        // ✅ USE REF HERE
        const currentUnsaved = unsavedChangesRef.current;
        const dataToSync = {}; // Track what we'll sync to store
        
        // Merge each clinical area intelligently
        Object.keys(facilityData).forEach(key => {
          // Skip metadata fields
          if (key === 'surveyId' || key === 'submittedAt' || key === 'surveyMode' || key === 'residents') {
            return; // Skip to next key
          }
          
          const hasUnsavedChanges = currentUnsaved[key];
          const unsavedTimestamp = hasUnsavedChanges?.timestamp || 0;
          
          // If there are very recent unsaved changes (within last 5 seconds), preserve them
          if (hasUnsavedChanges && (now - unsavedTimestamp) < 5000) {
            // Keep the local unsaved data for this field
            dataToSync[key] = merged[key]; // Use local data for store
            return; // Skip to next key in forEach
          }
          
          // Accept remote data for this field
          merged[key] = facilityData[key];
          dataToSync[key] = facilityData[key];
        });
        
        // ✅ Sync to store INSIDE the callback
        if (surveyId) {
            store.setSurveyData(surveyId, dataToSync);
        }

        return merged;
      });

      toast.success("Survey data updated", {
        description: "Changes from team member received",
        position: 'top-right',
        duration: 3000
      });

      // 2. Background Sync for Metadata (Debounced)
      if (shouldSync()) {
        try { 
          // Fetch fresh data to get team members, coordinator, and all setup info
          const riskBasedSetupResponse = await surveyAPI.getRiskBasedSetup(surveyId);

          if (riskBasedSetupResponse && riskBasedSetupResponse.data) {
            const setupData = riskBasedSetupResponse.data;

            // Update team members and coordinator
            if (setupData.teamMembers && Array.isArray(setupData.teamMembers)) {
              setTeamMembers(setupData.teamMembers);
              store.setTeamMembers(setupData.teamMembers);
            }

            if (setupData.teamCoordinator) {
              setTeamCoordinator(setupData.teamCoordinator);
              store.setTeamCoordinator(setupData.teamCoordinator);
            }

            // Update team coordinator status for current user
            await updateTeamCoordinatorStatus(setupData);
          }
        } catch (error) {
          // Error fetching real-time metadata update 
        }
      }
    };

    // Register socket event listeners
    surveySocketService.on("connect", handleSocketConnect);
    surveySocketService.on("reconnect", handleSocketConnect);
    surveySocketService.on("view_risk_based", handleViewRiskBased);

    // IMPORTANT: Listen to BOTH mode-specific events to ensure all team members receive updates
    // Team leads and team members both need to hear these events
   
    surveySocketService.on("risk_based_resident", handleRiskBasedResident);
    
    surveySocketService.on("risk_based_nonresident", handleRiskBasedNonresident);

    // CRITICAL: Fetch latest data on mount to ensure team leads see any data saved before they joined
    // This is independent of socket connection - we always want the latest data
    const fetchInitialData = async () => {
      try {
       
        const riskBasedSetupResponse = await surveyAPI.getRiskBasedSetup(surveyId);
        if (riskBasedSetupResponse && riskBasedSetupResponse.data) {
         
          await processSetupData(riskBasedSetupResponse.data);
        } else {
          // No data in initial response
        }
      } catch (error) {
        // Error fetching initial data on mount
      }
    };

    // Fetch initial data immediately on mount
    fetchInitialData();

    // If already connected, emit join events immediately
    if (isAlreadyConnected && existingSocket) {
      joinRoom();
    }

    // Retry join after a short delay to ensure connection is established and room is joined
    const retryTimer = setTimeout(joinRoom, 2000);

    // Cleanup function
    return () => {
      clearTimeout(retryTimer);
      surveySocketService.off("connect", handleSocketConnect);
      surveySocketService.off("reconnect", handleSocketConnect);
      surveySocketService.off("view_risk_based", handleViewRiskBased);
      surveySocketService.off("risk_based_resident", handleRiskBasedResident);
      surveySocketService.off("risk_based_nonresident", handleRiskBasedNonresident);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyMode, currentUser]); // Depend on currentUser to ensure connection when user data loads

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
    
    setSurveyData(prev => {
      const updated = {
        ...prev,
        [areaId]: newData
      };
      
      // Sync with store for team collaboration
      const surveyId = localStorage.getItem('currentSurveyId');
      if (surveyId) {
        store.updateClinicalArea(areaId, newData);
      }
      
      return updated;
    });
  }, [store]);

  // Handle area data change for non-resident-based mode
  const handleNonResidentAreaDataChange = useCallback((areaId, newData) => {
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
    
    setSurveyData(prev => {
      const updated = {
        ...prev,
        [areaId]: newData
      };
      
      // Sync with store for team collaboration
      const surveyId = localStorage.getItem('currentSurveyId');
      if (surveyId) {
        store.updateClinicalArea(areaId, newData);
      }
      
      return updated;
    });
  }, [store]);

  // Handle switching team coordinator
  const handleSwitchCoordinator = useCallback(async (newCoordinatorId) => {
    try {
      const surveyId = localStorage.getItem('currentSurveyId') || new URLSearchParams(window.location.search).get('surveyId');
      if (!surveyId) {
        toast.error("No survey found", { position: 'top-right' });
        return;
      }

      // Find the new coordinator member
      const newCoordinator = teamMembers.find(m => m.id === newCoordinatorId || m._id === newCoordinatorId);
      if (!newCoordinator) {
        toast.error("Team member not found", { position: 'top-right' });
        return;
      }

      // Find the current coordinator
      const oldCoordinator = teamMembers.find(m =>
        (m.name || m.email) === teamCoordinator ||
        m.id === teamCoordinator ||
        m._id === teamCoordinator
      );

      // Step 1: Set old coordinator's invited status to "true" (make them a team member)
      if (oldCoordinator && (oldCoordinator.id || oldCoordinator._id)) {
        try {
          await authAPI.setInvited(oldCoordinator.id || oldCoordinator._id, "true");
        } catch (error) {
         
          // Continue even if this fails
        }
      }

      // Step 2: Set new coordinator's invited status to "false" (make them a team lead)
      try {
        await authAPI.setInvited(newCoordinator.id || newCoordinator._id, "false");
      } catch (error) {
        
        toast.error("Failed to update coordinator permissions", { position: 'top-right' });
        return;
      }

      // Step 3: Update the risk-based setup with new coordinator
      const setupData = {
        teamCoordinator: newCoordinator.name || newCoordinator.email
      };

      await surveyAPI.updateRiskBasedSetup(surveyId, setupData);

      // Step 4: Update local state
      setTeamCoordinator(newCoordinator.name || newCoordinator.email);

      // Check if the current user is the new coordinator
      const isCurrentUserNewCoordinator =
        currentUser?.email === newCoordinator.email ||
        currentUser?._id === newCoordinator.id ||
        currentUser?._id === newCoordinator._id ||
        String(currentUser?._id) === String(newCoordinator.id) ||
        String(currentUser?._id) === String(newCoordinator._id);

      setIsTeamCoordinator(isCurrentUserNewCoordinator);

      // If current user is the new coordinator, clear assigned areas
      if (isCurrentUserNewCoordinator) {
        setAssignedAreas([]);
      }

      // If current user was the old coordinator, they need to reload to get their assigned areas
      const wasCurrentUserOldCoordinator =
        currentUser?.email === oldCoordinator?.email ||
        currentUser?._id === oldCoordinator?.id ||
        currentUser?._id === oldCoordinator?._id;

      if (wasCurrentUserOldCoordinator) {
        // Fetch updated user data to get assigned areas
        try {
          const userResponse = await profileAPI.getProfile();
          if (userResponse?.statusCode === 200 && userResponse?.data) {
            const updatedUser = userResponse.data;
            setCurrentUser(updatedUser);

            // Update assigned areas based on new role
            const assignedTasks = updatedUser.assignedFacilityTasks || [];
            const areaIds = assignedTasks.map(task =>
              typeof task === 'object' ? (task.areaId || task.id || task) : task
            );
            setAssignedAreas(areaIds);
          }
        } catch (error) {
          // Error refreshing user data
        }
      }

      toast.success("Team coordinator updated successfully!", {
        description: `${newCoordinator.name || newCoordinator.email} is now the team coordinator.`,
        position: 'top-right'
      });
    } catch (error) {
      // Error switching coordinator 
      toast.error(`Failed to switch coordinator: ${error.message}`, { position: 'top-right' });
    }
  }, [teamMembers, currentUser, teamCoordinator]);

  const handleAnnualEducationChange = useCallback((newData) => {
    setSurveyData(prev => {
      const updated = {
        ...prev,
        annualEducation: newData
      };
      
      // Sync with store for team collaboration
      store.setAnnualEducation(newData);
      
      return updated;
    });
  }, [store]);

  // Toggle section expansion (for backward compatibility, but we'll use tabs now)
  const toggleSection = (sectionId) => {
    setActiveTab(sectionId);
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: true
    }));
  };

  // Clean up old unsaved changes (older than 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setUnsavedChanges(prev => {
        const cleaned = {};
        Object.keys(prev).forEach(key => {
          // Keep changes that are less than 10 seconds old
          if (now - prev[key].timestamp < 10000) {
            cleaned[key] = prev[key];
          }
        });
        
        // Only update if something was actually cleaned
        if (Object.keys(cleaned).length !== Object.keys(prev).length) {
        }
        
        return Object.keys(cleaned).length !== Object.keys(prev).length ? cleaned : prev;
      });
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Initialize active tab to first area if none selected
  useEffect(() => {
    if (!activeTab && filteredClinicalAreas.length > 0) {
      setActiveTab(filteredClinicalAreas[0].id);
    }
  }, [activeTab, filteredClinicalAreas]);

  // Initialize active tab when residents are added (for resident-based mode)
  useEffect(() => {
    if (surveyMode === 'residentBased' && residents.length > 0 && !activeTab && filteredClinicalAreas.length > 0) {
      setActiveTab(filteredClinicalAreas[0].id);
    }
  }, [surveyMode, residents.length, activeTab, filteredClinicalAreas]);

  // Reset active tab if current tab is not in filtered list
  useEffect(() => {
    if (activeTab && !filteredClinicalAreas.find(a => a.id === activeTab)) {
      if (filteredClinicalAreas.length > 0) {
        setActiveTab(filteredClinicalAreas[0].id);
      } else {
        setActiveTab(null);
      }
    }
  }, [activeTab, filteredClinicalAreas]);

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

      // Exclude completedAt and transform data structure based on mode
      const { completedAt: _, ...clinicalAreasData } = surveyData;
      
      const transformedStepData = {
        surveyId: surveyId,
        surveyMode: surveyMode
      };
      
      if (surveyMode === 'residentBased') {
        // Resident-based structure: All answers are nested within each resident object
        transformedStepData.residents = residents.map(resident => {
          const residentId = resident.id;
          
          // Build clinicalAreaAnswers for this resident
          const clinicalAreaAnswers = {};
          const clinicalAreaNotes = {};
          
          CLINICAL_AREA_KEYS.forEach(areaId => {
            const areaData = clinicalAreasData[areaId] || {};
            const residentAnswers = areaData.residentAnswers || {};
            const residentData = residentAnswers[residentId] || {};
            
            clinicalAreaAnswers[areaId] = {
              surveyFocus: residentData.surveyFocus || {},
              selfReport: residentData.selfReport || {},
              customSurveyFocusItems: Array.isArray(residentData.customSurveyFocusItems) 
                ? residentData.customSurveyFocusItems 
                : [],
              customSelfReportItems: Array.isArray(residentData.customSelfReportItems) 
                ? residentData.customSelfReportItems 
                : []
            };
            
            clinicalAreaNotes[areaId] = residentData.notes || areaData.notes || "";
          });

          return {
            id: resident.id,
            name: resident.name || "",
            room: resident.room || "",
            careArea: Array.isArray(resident.careArea)
              ? resident.careArea
              : (resident.careArea ? [resident.careArea] : []),
            admissionDate: resident.admissionDate
              ? (resident.admissionDate instanceof Date
                  ? resident.admissionDate.toISOString()
                  : new Date(resident.admissionDate).toISOString())
              : null,
            notes: resident.notes || "",
            createdBy: resident.createdBy || null, // Include creator ID
            clinicalAreaAnswers: clinicalAreaAnswers,
            clinicalAreaNotes: clinicalAreaNotes
          };
        });

        // Add Annual Education at facility level (shared across all residents)
        const annualEducationData = clinicalAreasData.annualEducation || {};
        transformedStepData.annualEducation = {
          selfReport: annualEducationData.selfReport || {},
          surveyFocus: annualEducationData.surveyFocus || {},
          customSelfReportItems: Array.isArray(annualEducationData.customSelfReportItems)
            ? annualEducationData.customSelfReportItems
            : [],
          customSurveyFocusItems: Array.isArray(annualEducationData.customSurveyFocusItems)
            ? annualEducationData.customSurveyFocusItems
            : [],
          notes: annualEducationData.notes || ""
        }; 
      } else { 
        // Facility-based structure: Clinical areas at top level
        CLINICAL_AREA_KEYS.forEach(areaId => {
          const areaData = clinicalAreasData[areaId] || {};
          
          transformedStepData[areaId] = {
            selfReport: areaData.selfReport || {},
            surveyFocus: areaData.surveyFocus || {},
            customSelfReportItems: Array.isArray(areaData.customSelfReportItems) 
              ? areaData.customSelfReportItems 
              : [],
            customSurveyFocusItems: Array.isArray(areaData.customSurveyFocusItems) 
              ? areaData.customSurveyFocusItems 
              : [],
            notes: areaData.notes || ""
          };
        });
      }
      
      const payload = {
        currentStep: 'facility-initiated-survey',
        stepData: {
          ...transformedStepData,
          submittedAt: new Date().toISOString()
        },
        completedAt: new Date().toISOString(),
    
      };

      // Verify socket is connected (should already be connected from useEffect)
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
      const emitEvent = surveyMode === 'residentBased'
        ? "join_risk_based_resident"
        : "join_risk_based_nonresident";

      // Emit mode-specific save events via socket
     
      socket.emit(emitEvent, payload);

      // Set up listener for response (following Investigations pattern)
      // Note: We use a flag to track if this is our save response vs a broadcast from another user
      let responseReceived = false;
      let timeoutId = null;
      const saveTimestamp = Date.now(); // Track when we saved to identify our response

      const handleSaveResponse = (message) => {
        if (responseReceived) return; // Prevent duplicate handling
        
        // Check if this message is likely from our save (has recent timestamp or matches our payload structure)
        // The broadcast will contain the saved data, so we can use it as confirmation
        const messageTimestamp = message?.data?.submittedAt 
          ? new Date(message.data.submittedAt).getTime() 
          : 0;
        const isRecentSave = Math.abs(messageTimestamp - saveTimestamp) < 10000; // Within 10 seconds

        // Only treat as our save response if it's recent (to avoid handling other users' saves)
        if (!isRecentSave && responseReceived === false) {
          // This might be a broadcast from another user, not our save confirmation
          // The persistent listeners will handle it, so we can skip here
          return;
        }

        responseReceived = true;

        // Clear timeout since we received the response
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

   

        // Emit join_view_risk_based after receiving the response
        // Add a small delay to ensure DB consistency (prevent reading stale data)
        setTimeout(() => {
          socket.emit("join_view_risk_based", {
            surveyId: surveyId,
            userId: currentUserId,
          });
         
        }, 1000);

        // Clear loading state and show success toast only after receiving response
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

      // Set up one-time listener for response using socket instance directly
      // This won't conflict with persistent listeners since it's one-time
      if (socket) {
        socket.once(surveyMode === 'residentBased' ? "risk_based_resident" : "risk_based_nonresident", handleSaveResponse);
      }

      // Timeout fallback in case response doesn't come (after 5 seconds)
      timeoutId = setTimeout(() => {
        if (responseReceived) return; // Response already received, don't proceed
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
      
      // Clear wizard cache when survey is closed to force refresh on next load
      const closedSurveyId = localStorage.getItem('currentSurveyId') || new URLSearchParams(window.location.search).get('surveyId');
      if (closedSurveyId) {
        clearCachedWizardData(closedSurveyId);
      }
    
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
                onClick={() => {
                  // clear local storage
                  localStorage.removeItem("currentSurveyId");
                  localStorage.removeItem("riskBasedProcessSurveyId");
                  localStorage.removeItem("riskBasedProcessSetup");
                  localStorage.removeItem("riskBasedProcessTeamMembers");
                  localStorage.removeItem("riskBasedProcessTeamLeaders");
                  localStorage.removeItem("riskBasedProcessTeamLead");
                  window.location.href = '/risk-based-list';
                }}
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs sm:text-sm flex-shrink-0"
              >
                Exit
              </Button>
              <div className="h-4 sm:h-6 w-px bg-slate-300 flex-shrink-0"></div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">Risk-based Process Review</h1> 
                <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Clinical Systems Review</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Manage Team Button for Coordinator */}
              {isTeamCoordinator && !surveyClosed && (
                <Button
                  onClick={() => {
                    const surveyId = localStorage.getItem('currentSurveyId') || new URLSearchParams(window.location.search).get('surveyId');
                    if (surveyId) {
                      window.location.href = `/risk-based-process?surveyId=${surveyId}`;
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-50 flex-shrink-0"
                >
                  <Users className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                  <span className="hidden sm:inline">Manage Team</span>
                  <span className="sm:hidden">Team</span>
                </Button>
              )}

              {/* Team Coordinator Display and Switch (only for coordinator) */}
              {isTeamCoordinator && teamMembers.length > 0 && (
                <div className="flex items-center gap-1 sm:gap-2 border border-slate-200 rounded-md px-2 sm:px-3 py-1.5 bg-slate-50 flex-shrink-0">
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-xs text-slate-600 hidden sm:inline">Coordinator:</span>
                  <Select
                    value={teamCoordinator || ""}
                    onValueChange={(value) => {
                      const member = teamMembers.find(m => (m.name || m.email) === value);
                      if (member) {
                        handleSwitchCoordinator(member.id || member._id);
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 w-auto min-w-[100px] sm:min-w-[120px] border-0 bg-transparent text-xs font-medium text-slate-900 p-0 focus:ring-0">
                      <SelectValue placeholder="Select coordinator" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id || member._id} value={member.name || member.email}>
                          <span className="break-words">{member.name || member.email}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Survey Mode Display (Read-only) */}
              {!surveyClosed && (
                <div className="flex items-center gap-1 border border-slate-200 rounded-md p-0.5 bg-slate-50 flex-shrink-0">
                  <div
                    className={`h-7 px-2 sm:px-3 text-xs font-medium flex items-center ${
                      surveyMode === 'residentBased'
                        ? 'bg-white text-slate-900'
                        : 'bg-white text-slate-900'
                    }`}
                  >
                    {surveyMode === 'residentBased' ? (
                      <>
                        <UserCircle className="w-3 h-3 mr-1 sm:mr-1.5 flex-shrink-0" />
                        <span className="hidden sm:inline">Resident Mode</span>
                        <span className="sm:hidden">Resident</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3 h-3 mr-1 sm:mr-1.5 flex-shrink-0" />
                        <span className="hidden sm:inline">Facility Mode</span>
                        <span className="sm:hidden">Facility</span>
                      </>
                    )}
                  </div>
                </div>
              )}
              {surveyClosed && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs flex-shrink-0">
                  <Lock className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="hidden sm:inline">Survey Closed</span>
                  <span className="sm:hidden">Closed</span>
                </Badge>
              )}
            </div> 
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex h-[calc(100vh-64px)] mt-16 sm:mt-20 bg-slate-50">
        {/* Left Sidebar - Residents (only for resident-based mode) */}
        {surveyMode === 'residentBased' && (
          <aside className="w-80 border-r border-slate-200 bg-white flex-shrink-0 hidden lg:block">
          <ResidentManagerSidebar
            residents={filteredResidents}
            selectedResidentId={selectedResidentId}
            onAddResident={() => setShowAddResidentModal(true)}
            onRemoveResident={handleRemoveResident}
            onSelectResident={handleSelectResident}
            onUpdateResident={handleUpdateResident}
            isDisabled={surveyClosed}
          />
        </aside>
        )}

        {/* Mobile Resident Selector (only for resident-based mode) */}
        {surveyMode === 'residentBased' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 sm:p-3 z-40 shadow-lg">
          <div className="flex items-center gap-2 overflow-x-auto">
            {filteredResidents.length === 0 ? (
              <Button
                type="button"
                onClick={() => setShowAddResidentModal(true)}
                disabled={surveyClosed}
                className="flex-shrink-0 bg-[#075b7d] hover:bg-[#075b7d]/90 text-white text-xs sm:text-sm font-medium h-8 sm:h-9"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Add Resident</span>
                <span className="sm:hidden">Add</span>
              </Button>
            ) : (
              <> 
                {filteredResidents.map((resident) => (
                  <Button
                    key={resident.id}
                    type="button"
                    onClick={() => handleSelectResident(resident.id)}
                    variant={selectedResidentId === resident.id ? "default" : "outline"}
                    size="sm"
                    className="flex-shrink-0 whitespace-nowrap text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                  >
                    <span className="truncate max-w-[120px] sm:max-w-none">{resident.name || `Resident ${filteredResidents.indexOf(resident) + 1}`}</span>
                  </Button>
                ))}
                <Button
                  type="button"
                  onClick={() => setShowAddResidentModal(true)}
                  disabled={surveyClosed}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 h-8 sm:h-9 w-8 sm:w-9 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        )}

        {/* Mobile Navigation Menu Button */}
        {((surveyMode === 'residentBased' && filteredResidents.length > 0) || surveyMode === 'nonResidentBased') && (
          <div className={`lg:hidden fixed left-3 sm:left-4 z-50 ${
            surveyMode === 'residentBased' ? 'bottom-20 sm:bottom-20' : 'bottom-20 sm:bottom-20'
          }`}>
            <Button
              type="button"
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="h-auto px-3 sm:px-4 py-2 sm:py-3 rounded-full bg-[#075b7d] hover:bg-[#075b7d]/90 text-white shadow-lg flex items-center gap-1 sm:gap-2"
              size="lg"
            >
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Menu</span>
            </Button>
          </div>
        )}

        {/* Mobile Navigation Menu Drawer */}
        {((surveyMode === 'residentBased' && filteredResidents.length > 0) || surveyMode === 'nonResidentBased') && (
          <>
            {/* Overlay */}
            {showMobileNav && (
              <div 
                className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
                onClick={() => setShowMobileNav(false)}
              />
            )}
            
            {/* Drawer */}
            <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 transition-transform duration-300 ease-in-out ${
              showMobileNav ? 'translate-y-0' : 'translate-y-full'
            }`}>
              <div className="max-h-[70vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 flex-shrink-0">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900">Navigation</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileNav(false)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
                
                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
                  {filteredClinicalAreas.map((area, index) => {
                    const isActive = activeTab === area.id;
                    const areaData = surveyData[area.id];
                    let itemCount = 0;
                    if (surveyMode === 'residentBased') {
                      const residentAnswers = areaData?.residentAnswers || {};
                      const residentData = selectedResidentId ? residentAnswers[selectedResidentId] : {};
                      const customSelfReportItems = Array.isArray(residentData?.customSelfReportItems) 
                        ? residentData.customSelfReportItems 
                        : [];
                      const customSurveyFocusItems = Array.isArray(residentData?.customSurveyFocusItems) 
                        ? residentData.customSurveyFocusItems 
                        : [];
                      itemCount = area.id === "admissions" 
                        ? area.surveyFocusItems.length + customSurveyFocusItems.length
                        : area.selfReportItems.length + area.surveyFocusItems.length + customSelfReportItems.length + customSurveyFocusItems.length;
                    } else {
                      const customSelfReportItems = Array.isArray(areaData?.customSelfReportItems) 
                        ? areaData.customSelfReportItems 
                        : [];
                      const customSurveyFocusItems = Array.isArray(areaData?.customSurveyFocusItems) 
                        ? areaData.customSurveyFocusItems 
                        : [];
                      itemCount = area.id === "admissions" 
                        ? area.surveyFocusItems.length + customSurveyFocusItems.length
                        : area.selfReportItems.length + area.surveyFocusItems.length + customSelfReportItems.length + customSurveyFocusItems.length;
                    }
                    
                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(area.id);
                          setShowMobileNav(false);
                        }}
                        disabled={surveyClosed}
                        className={`w-full flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-md text-left transition-colors ${
                          isActive
                            ? 'bg-slate-100 text-[#075b7d]'
                            : 'text-slate-600 hover:bg-slate-50'
                        } ${surveyClosed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            isActive ? 'bg-[#075b7d] text-white' : 'bg-slate-300 text-slate-600'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-medium break-words">{area.title}</div>
                          <div className="text-xs text-slate-500">{itemCount} items</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main Content - Questions */}
        <main className="flex-1 overflow-y-auto min-w-0 pb-32 lg:pb-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className={`grid grid-cols-1 gap-6 lg:gap-8 ${
              (surveyMode === 'residentBased' && residents.length > 0) || surveyMode === 'nonResidentBased'
                ? 'lg:grid-cols-[1fr_280px]'
                : 'lg:grid-cols-1'
            }`}>
              {/* Main Content Area */}
              <div className="space-y-6">
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

            {/* Show message if no residents (resident-based mode only) */}
            {surveyMode === 'residentBased' && filteredResidents.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                  No Residents Added
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-4 break-words">
                  Add a resident to start answering survey questions.
                </p>
                <p className="text-xs text-slate-500 mb-6 break-words">
                  Each resident will have their own set of questions to answer.
                </p>
                <Button
                  type="button"
                  onClick={() => setShowAddResidentModal(true)}
                  disabled={surveyClosed}
                  className="bg-[#075b7d] hover:bg-[#075b7d]/90 text-white text-xs sm:text-sm h-10 sm:h-12 px-4 sm:px-8"
                  size="lg"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                  Add Resident
                </Button>
              </div>
            ) : surveyMode === 'residentBased' && (!selectedResidentId || !filteredResidents.find(r => r.id === selectedResidentId)) ? (
              <div className="text-center py-12 sm:py-16">
                <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                  Select a Resident
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 break-words">
                  Please select a resident from the left panel to view and answer questions.
                </p>
              </div>
            ) : (
              <>
                {/* Selected Resident Header (only for resident-based mode) */}
                {surveyMode === 'residentBased' && (
                <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-200">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 break-words">
                      {residents.find(r => r.id === selectedResidentId)?.name || 'Selected Resident'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 mb-4">
                      {residents.find(r => r.id === selectedResidentId)?.room && (
                        <span className="break-words">Room {residents.find(r => r.id === selectedResidentId)?.room}</span>
                      )}
                      {residents.find(r => r.id === selectedResidentId)?.admissionDate && (
                        <span className="break-words">
                          Admitted {(() => {
                            const date = residents.find(r => r.id === selectedResidentId)?.admissionDate;
                            return date instanceof Date 
                              ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                              : new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                          })()}
                        </span>
                      )}
                    </div>
                    {(() => {
                      const selectedResident = residents.find(r => r.id === selectedResidentId);
                      const careAreas = Array.isArray(selectedResident?.careArea) 
                        ? selectedResident.careArea 
                        : (selectedResident?.careArea ? [selectedResident.careArea] : []);
                      return careAreas.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {careAreas.map((area, idx) => (
                            <span 
                              key={idx} 
                              className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded font-normal"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                )}

                {/* Instructions Card */}
                <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                    Instructions for Use
                  </h2>
                  <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {surveyMode === 'residentBased' ? (
                      <>
                        <p className="font-medium text-slate-900 break-words">For each clinical area:</p>
                        <ul className="list-disc list-inside space-y-1.5 ml-2 text-slate-600">
                      <li className="break-words">Expand a clinical area to see questions for the selected resident.</li>
                      <li className="break-words">Answer all questions for this resident.</li>
                      <li className="break-words">Switch to another resident to answer questions for them.</li>
                      <li className="break-words">Each resident has their own separate answers.</li>
                      <li className="break-words">Validate findings through observation, record review, and interviews.</li>
                    </ul>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-slate-900 break-words">For each clinical area:</p>
                        <ul className="list-disc list-inside space-y-1.5 ml-2 text-slate-600">
                          <li className="break-words">Expand a clinical area to see facility-level questions.</li>
                          <li className="break-words">Answer all questions based on facility-wide observations and systems.</li>
                          <li className="break-words">These answers apply to the entire facility, not individual residents.</li>
                          <li className="break-words">Validate findings through observation, record review, and interviews.</li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>

                {/* Assessment Sections - Tab Based */}
                <div className="space-y-4">
                  {/* Part I Header */}
                  <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                      Clinical Systems Review Areas
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 break-words">
                      {surveyMode === 'residentBased' && selectedResidentId
                        ? `Comprehensive review of 15 clinical systems areas for ${residents.find(r => r.id === selectedResidentId)?.name || 'selected resident'}`
                        : 'Comprehensive review of 15 clinical systems areas at the facility level'}
                    </p>
                  </div>

                  {/* Content Area */}
                  <div className="bg-white rounded-lg border border-slate-200">
                    <div className="p-6">
                      {activeTab && (() => {
                        const area = filteredClinicalAreas.find(a => a.id === activeTab);
                        if (!area) return null;

                        // Annual Education is always rendered as NonResidentClinicalArea
                        if (area.id === 'annualEducation') {
                          return (
                            <NonResidentClinicalArea
                              key={area.id}
                              areaId={area.id}
                              title={area.title}
                              regulatoryBasis={area.regulatoryBasis}
                              residentSample={area.residentSample || "All staff members"}
                              selfReportItems={area.selfReportItems}
                              surveyFocusItems={area.surveyFocusItems}
                              data={surveyData[area.id]}
                              onDataChange={handleNonResidentAreaDataChange}
                              isExpanded={true}
                              onToggle={() => {}}
                              isDisabled={surveyClosed}
                              hideHeader={true}
                            />
                          );
                        }

                        if (surveyMode === 'residentBased') {
                          return (
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
                              isExpanded={true}
                              onToggle={() => {}}
                        isDisabled={surveyClosed}
                        selectedResidentId={selectedResidentId}
                        residents={filteredResidents}
                              hideHeader={true}
                            />
                          );
                        } else {
                          return (
                            <NonResidentClinicalArea
                              key={area.id}
                              areaId={area.id}
                              title={area.title}
                              regulatoryBasis={area.regulatoryBasis}
                              residentSample={area.residentSample}
                              selfReportItems={area.selfReportItems}
                              surveyFocusItems={area.surveyFocusItems}
                              data={surveyData[area.id]}
                              onDataChange={handleNonResidentAreaDataChange}
                              isExpanded={true}
                              onToggle={() => {}}
                              isDisabled={surveyClosed}
                              hideHeader={true}
                            />
                          );
                        }
                      })()}
                </div>
                  </div>
                </div>

              </>
            )}
              </div>

              {/* Right Sidebar - Navigation Menu (show after residents added for resident mode, always for facility mode) */}
              {((surveyMode === 'residentBased' && filteredResidents.length > 0) || surveyMode === 'nonResidentBased') && (
                <aside className="hidden lg:block">
                  <div className="sticky top-24"> 
                    <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col h-[calc(100vh-300px)]">
                      <h3 className="text-sm font-semibold text-slate-900 mb-4 flex-shrink-0">Navigation</h3>
                      <nav className="space-y-1 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {filteredClinicalAreas.map((area, index) => {
                          const isActive = activeTab === area.id;
                          const areaData = surveyData[area.id];
                          let itemCount = 0;
                          if (surveyMode === 'residentBased') {
                            const residentAnswers = areaData?.residentAnswers || {};
                            const residentData = selectedResidentId ? residentAnswers[selectedResidentId] : {};
                            const customSelfReportItems = Array.isArray(residentData?.customSelfReportItems) 
                              ? residentData.customSelfReportItems 
                              : [];
                            const customSurveyFocusItems = Array.isArray(residentData?.customSurveyFocusItems) 
                              ? residentData.customSurveyFocusItems 
                              : [];
                            itemCount = area.id === "admissions" 
                              ? area.surveyFocusItems.length + customSurveyFocusItems.length
                              : area.selfReportItems.length + area.surveyFocusItems.length + customSelfReportItems.length + customSurveyFocusItems.length;
                          } else {
                            const customSelfReportItems = Array.isArray(areaData?.customSelfReportItems) 
                              ? areaData.customSelfReportItems 
                              : [];
                            const customSurveyFocusItems = Array.isArray(areaData?.customSurveyFocusItems) 
                              ? areaData.customSurveyFocusItems 
                              : [];
                            itemCount = area.id === "admissions" 
                              ? area.surveyFocusItems.length + customSurveyFocusItems.length
                              : area.selfReportItems.length + area.surveyFocusItems.length + customSelfReportItems.length + customSurveyFocusItems.length;
                          }
                          
                          return (
                            <button
                              key={area.id}
                              type="button"
                              onClick={() => setActiveTab(area.id)}
                              disabled={surveyClosed}
                              className={`w-full flex items-start gap-3 p-2 rounded-md text-left transition-colors ${
                                isActive
                                  ? 'bg-slate-100 text-[#075b7d]'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              } ${surveyClosed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                                  isActive ? 'bg-[#075b7d] text-white' : 'bg-slate-300 text-slate-600'
                                }`}>
                                  {index + 1}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{area.title}</div>
                                <div className="text-xs text-slate-500">{itemCount} items</div>
                              </div>
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-[100px] right-6 z-40 flex flex-col items-end gap-2">
        {/* Unsaved Changes Indicator */}
        {Object.keys(unsavedChanges).length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 animate-pulse">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            {Object.keys(unsavedChanges).length} unsaved change{Object.keys(unsavedChanges).length !== 1 ? 's' : ''}
          </div>
        )}
        
        <Button
          onClick={handleSave}
          disabled={
            isSaving || surveyClosed || !(localStorage.getItem('currentSurveyId') || new URLSearchParams(window.location.search).get('surveyId'))
          }
          className={`h-12 px-6 ${Object.keys(unsavedChanges).length > 0 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#075b7d] hover:bg-[#075b7d]'} text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center gap-2 transition-all`}
          size="lg"
          title={Object.keys(unsavedChanges).length > 0 ? `Save ${Object.keys(unsavedChanges).length} unsaved change${Object.keys(unsavedChanges).length !== 1 ? 's' : ''}` : "Save your progress without navigating away"}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <FileCheck className="w-5 h-5" />
              <span className="hidden sm:inline">Save Progress</span>
              <span className="sm:hidden">Save</span>
            </>
          )}
        </Button>
      </div>

      {/* Floating Action Buttons */}
      {!surveyClosed && (
        <div className="fixed bottom-6 right-6 z-40 flex gap-4">
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
            className="h-12 px-4 sm:px-8 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-full flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            <Lock className="w-5 h-5" />
            <span className="hidden sm:inline">Close Survey</span>
            <span className="sm:hidden">Close</span>
          </Button>
        </div>
      )}

      {/* Add Resident Modal */}
      <AddResidentModal
        isOpen={showAddResidentModal}
        onClose={() => setShowAddResidentModal(false)}
        onAdd={handleAddResident}
        isDisabled={surveyClosed}
      />

      {/* Survey Closure Modal */}
      {showClosureModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-2xl w-full max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto">
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

      {/* Mode Switch Confirmation Modal */}
      <Dialog open={showModeSwitchModal} onOpenChange={(open) => !open && cancelModeSwitch()}>
        <DialogContent className="sm:max-w-[500px] max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Switch Survey Mode</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-slate-900 font-medium mb-2 break-words">
                    Are you sure you want to switch to {pendingMode === 'residentBased' ? 'Resident-Based' : 'Non-Resident-Based'} mode?
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words">
                    Note: Your current answers will be preserved, but the data structure will change. 
                    Make sure to save your progress before switching if needed.
                  </p>
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={cancelModeSwitch}
              className="h-9 px-4 text-xs sm:text-sm w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmModeSwitch}
              className="h-9 px-4 text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto"
            >
              Switch Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacilityInitiatedSurvey;


