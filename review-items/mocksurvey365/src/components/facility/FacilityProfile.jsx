import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { switchToSurvey, clearSurveyStorage } from "../../utils/surveyStorageIndexedDB";
import api from '../../service/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DataTable } from '../data-table';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { DatePicker } from '../ui/date-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { toast } from 'sonner';
import { 
  Building2, 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Edit,
  ArrowLeft,
  ExternalLink,
  UserPlus,
  Upload,
  Download,
  X,
  Shield,
  Target,
  BarChart,
  Eye,
  Check,
  ChevronsUpDown,
} from 'lucide-react';

const FacilityProfile = ({ facility, facilityId, onEdit }) => {
  const navigate = useNavigate();

  // Add CSS for hiding scrollbar
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      } 
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [showUploadResidentModal, setShowUploadResidentModal] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [viewingResident, setViewingResident] = useState(null);
  const [residents, setResidents] = useState([]);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [updatingResident, setUpdatingResident] = useState(false);
  const [addingResident, setAddingResident] = useState(false);
  const [surveys, setSurveys] = useState([]);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [newResident, setNewResident] = useState({
    name: '',
    room: '',
    admissionDate: null,
    diagnosis: '',
    specialTypes: [],
    specialTypesOthers: [],
    interviewable: true
  });

  // Special types from API
  const [specialTypesList, setSpecialTypesList] = useState([]);
  const [loadingSpecialTypes, setLoadingSpecialTypes] = useState(false);
  const [showOthersInput, setShowOthersInput] = useState(false);

  // Fetch special types on mount
  useEffect(() => {
    const fetchSpecialTypes = async () => {
      try {
        setLoadingSpecialTypes(true);
        const response = await api.survey.getSpecialTypes();
        if (response && response.status && response.data) {
          // Handle array of objects with 'name' property or simple strings
          const types = response.data.map(item => 
            typeof item === 'string' ? item : item.name || item.label || item
          );
          setSpecialTypesList(types);
        }
      } catch (error) {
       
        // Fallback to default types if API fails
        setSpecialTypesList([
          "Dementia",
          "Behavioral",
          "Wound Care",
          "IV Therapy",
          "Oxygen",
          "Dialysis",
        ]);
      } finally {
        setLoadingSpecialTypes(false);
      }
    };
    fetchSpecialTypes();
  }, []);

  // Fetch residents when facility changes
  useEffect(() => {
    if (facility && facility.id) {
      fetchResidents();
    }
  }, [facility]);

  // Fetch surveys when surveys tab is active
  useEffect(() => {
    if (activeTab === 'surveys' && facilityId && surveys.length === 0) {
      fetchFacilitySurveys();
    }
  }, [activeTab, facilityId]);

  const fetchResidents = async () => {
    try {
      setLoadingResidents(true);
      const response = await api.resident.getFacilityResidents(facility.id);
      
      if (response && response.status && response.data) {
        setResidents(response.data.residents || []);
      }
    } catch (error) {
  
      toast.error('Failed to load residents', { position: 'top-right' });
    } finally {
      setLoadingResidents(false);
    }
  };

  const fetchFacilitySurveys = async () => {
    if (!facilityId) return;
    
    try {
      setLoadingSurveys(true);
      const response = await api.facility.getFacilitySurveys(facilityId);
      
      if (response && response.status && response.data) {
        setSurveys(response.data.surveys || response.data || []);
      } else {
        setSurveys([]);
      }
    } catch (error) {
    
      toast.error('Failed to load facility surveys', { position: 'top-right' });
      setSurveys([]);
    } finally {
      setLoadingSurveys(false);
    }
  };

  if (!facility) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Facility not found</p>
      </div>
    );
  }

  const getRiskScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-gray-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };



  // Mock survey history data
  const surveyHistory = [
    {
      id: 1,
      date: '2024-01-15',
      type: 'Annual Survey',
      score: 4.2,
      findings: 3,
      criticalFindings: 0,
      status: 'completed'
    },
    {
      id: 2,
      date: '2023-07-15',
      type: 'Follow-up Survey',
      score: 3.8,
      findings: 5,
      criticalFindings: 1,
      status: 'completed'
    },
    {
      id: 3,
      date: '2023-01-10',
      type: 'Annual Survey',
      score: 4.0,
      findings: 4,
      criticalFindings: 0,
      status: 'completed'
    }
  ];



  // Survey table columns
  const surveyColumns = [
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.getValue("createdAt") || row.original.surveyCreationDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      accessorKey: "surveyCategory",
      header: "Survey Type",
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">{row.getValue("surveyCategory") || 'Standard Survey'}</div>
      ),
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue("status") || 'setup';
        return (
          <div className="text-center">
            <Badge 
              variant={status === "completed" ? "default" : status === "in-progress" ? "secondary" : "outline"}
              className={`text-xs ${
                status === 'completed' ? 'bg-green-100 text-green-800' :
                status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {status === "completed" ? "Completed" : 
               status === "in-progress" ? "In Progress" : 
               status === "setup" ? "Setup" : status}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "teamMembers",
      header: () => <div className="text-center">Team Size</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {row.original.teamMembers ? row.original.teamMembers.length : 0}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const survey = row.original;

        const handleViewSurvey = () => {
          // Store the survey ID for the SurveyBuilder to load
          if (survey._id) {
            // Use utility function to properly switch survey context
            switchToSurvey(survey._id);
            
            // Optional: Set the survey step based on survey status
            const statusToStepMap = {
              'setup': 1,
              'pre-survey': 1,
              'offsite-preparation': 2,
              'facility-entrance': 3,
              'initial-pool-process': 4,
              'sample-selection': 5,
              'investigations': 6,
              'facility-tasks': 7,
              'team-meetings': 8,
              'citation': 9,
              'exit-conference': 10,
              'resources-help': 11,
              'post-survey': 12,
              'completed': 13
            };
            
            const suggestedStep = statusToStepMap[survey.status] || 1;
            // Note: Current step is now managed by IndexedDB in SurveyBuilder
         
          }
          navigate('/mocksurvey365');
        };

        return (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewSurvey}
              className="h-8 px-3 text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
        );
      },
    },
  ];

  // Handler functions for residents
  const handleAddResident = async () => {
    if (newResident.name && newResident.room && newResident.admissionDate) {
      try {
        setAddingResident(true);
        
        // Merge specialTypes: exclude "Others" and include specialTypesOthers values
        const finalSpecialTypes = [
          ...newResident.specialTypes.filter((type) => type !== "Others"),
          ...(newResident.specialTypesOthers || []),
        ];
        
        const residentData = {
          facilityId: facility.id,
          name: newResident.name,
          room: newResident.room,
          admissionDate: newResident.admissionDate instanceof Date 
            ? newResident.admissionDate.toISOString()
            : new Date(newResident.admissionDate).toISOString(),
          primaryDiagnosis: newResident.diagnosis,
          specialNeeds: finalSpecialTypes,
          interviewable: newResident.interviewable
        };
        
        const response = await api.resident.addResident(residentData);
        
        if (response && response.status) {
          toast.success('Resident added successfully!', {
            description: 'The new resident has been added to the facility.',
            duration: 5000,
            position: 'top-right',
          });

          // Refresh residents list
          await fetchResidents();

          // Reset form
          setNewResident({
            name: '',
            room: '',
            admissionDate: null,
            diagnosis: '',
            specialTypes: [],
            specialTypesOthers: [],
            interviewable: true
          });
          setShowOthersInput(false);
          setShowAddResidentModal(false);
        }
      } catch (error) {
      
        toast.error(error.message || 'Failed to add resident', { position: 'top-right' });
      } finally {
        setAddingResident(false);
      }
    }
  };

  const handleUpdateResident = async () => {
    if (editingResident && editingResident.name && editingResident.room && editingResident.admissionDate) {
      try {
        setUpdatingResident(true);
        
        const residentData = {
          id: editingResident._id || editingResident.id,
          name: editingResident.name,
          room: editingResident.room,
          admissionDate: editingResident.admissionDate instanceof Date 
            ? editingResident.admissionDate.toISOString()
            : new Date(editingResident.admissionDate).toISOString(),
            primaryDiagnosis: editingResident.primaryDiagnosis || '',
            specialNeeds: editingResident.specialNeeds || [],
            interviewable: editingResident.interviewable !== undefined ? editingResident.interviewable : true
        };
        
        const response = await api.resident.updateResident(residentData);
        
        if (response && response.status) {
          toast.success('Resident updated successfully!', {
            description: 'The resident information has been updated.',
            duration: 5000,
            position: 'top-right',
          });
          
          // Refresh residents list
          await fetchResidents();
          setEditingResident(null);
        }
      } catch (error) {
      
        toast.error(error.message || 'Failed to update resident', { position: 'top-right' });
      } finally {
        setUpdatingResident(false);
      }
    }
  };

  const handleRemoveResident = (residentId) => {
    toast.error('Are you sure you want to remove this resident from the facility?', {
      description: 'This action cannot be undone.',
      duration: 0,
      position: 'top-center',
      action: {
        label: 'Remove',
        onClick: async () => {
          try {
            const response = await api.resident.deleteResident(residentId);
            
            if (response && response.status) {
              toast.success('Resident removed successfully!', {
                description: 'The resident has been removed from the facility.',
                duration: 5000,
                position: 'top-right',
              });
              
              // Refresh residents list
              await fetchResidents();
            }
          } catch (error) {
            
            toast.error(error.message || 'Failed to remove resident', { position: 'top-right' });
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {
          // User cancelled the action
        },
      },
    });
  };

  const handleSpecialTypeToggle = (type) => {
    // Handle "Others" separately - don't add to specialTypes, just toggle input visibility
    if (type === "Others") {
      const wasShowing = showOthersInput;
      setShowOthersInput(!wasShowing);
      // Clear specialTypesOthers when hiding the input
      if (wasShowing) {
        setNewResident((prev) => ({
          ...prev,
          specialTypesOthers: [],
        }));
      }
      return;
    }

    setNewResident(prev => ({
      ...prev,
      specialTypes: prev.specialTypes.includes(type)
        ? prev.specialTypes.filter(t => t !== type)
        : [...prev.specialTypes, type]
    }));
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Name', 'Room', 'Admission Date', 'Diagnosis', 'Special Types'],
      ['John Doe', '101A', '2024-01-15', 'COPD, Diabetes', 'Dementia;Behavioral'],
      ['Jane Smith', '102B', '2024-02-03', 'Hypertension, Arthritis', 'Wound Care'],
      ['Robert Johnson', '103C', '2024-01-28', 'Heart Disease', 'IV Therapy;Oxygen']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'sample_residents.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Sample CSV file downloaded successfully!', {
        description: 'You can now use this file to upload residents for the facility.',
        duration: 5000,
        position: 'top-right',
      });
    }
  };


  // Residents table columns
  const residentsColumns = [
    {
      accessorKey: "name",
      header: "Resident",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">{row.getValue("name")}</div>
          <div className="text-sm text-gray-500">Room {row.original.room}</div>
        </div>
      ),
    },
    {
      accessorKey: "primaryDiagnosis",
      header: "Primary Diagnosis",
      cell: ({ row }) => (
        <div className="text-sm text-gray-700">
          {row.getValue("primaryDiagnosis") || 'Not specified'}
        </div>
      ),
    },
    {
      accessorKey: "careLevel",
      header: "Care Level",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.getValue("careLevel") || 'Not specified'}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge 
            variant={row.getValue("status") === "active" ? "default" : "secondary"}
            className="text-xs"
          >
            {row.getValue("status") === "active" ? "Active" : "Discharged"}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "interviewable",
      header: "Interviewable",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge 
            variant={row.getValue("interviewable") !== false ? "default" : "secondary"}
            className="text-xs"
          >
            {row.getValue("interviewable") !== false ? "Yes" : "No"}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewingResident(row.original)}
            className="h-8 px-3 text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingResident(row.original)}
            className="h-8 px-3 text-xs"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRemoveResident(row.original._id || row.original.id)}
            className="h-8 px-3 text-xs text-red-600 hover:text-red-700"
          >
            <X className="w-3 h-3 mr-1" />
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
     
    
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 border border-gray-200 text-xs sm:text-sm">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="surveys" className="text-xs sm:text-sm">Surveys</TabsTrigger>
          <TabsTrigger value="activities" className="text-xs sm:text-sm">Residents</TabsTrigger>
          <TabsTrigger value="benchmarking" className="text-xs sm:text-sm">Data Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-gray-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Display multiple contacts */}
                {Array.isArray(facility.contact) && facility.contact.length > 0 ? (
                  facility.contact.map((contact, index) => (
                    <div key={index} className="p-3">
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-base">{contact.name || 'No name'}</p>
                          <p className="text-sm text-gray-600 mt-1">{contact.phone || 'No phone'}</p>
                          {contact.email && (
                            <p className="text-sm text-gray-500 mt-1">{contact.email}</p>
                          )}
                          {contact.role && (
                            <p className="text-sm text-gray-500 mt-1 font-medium">{contact.role}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : facility.contact ? (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-base">{facility.contact.name || facility.contact || 'No contact information'}</p>
                        <p className="text-sm text-gray-600 mt-1">{facility.contact.phone || facility.phone || 'No phone number'}</p>
                        {facility.contact.email && (
                          <p className="text-sm text-gray-500 mt-1">{facility.contact.email}</p>
                        )}
                        {facility.contact.role && (
                          <p className="text-sm text-gray-500 mt-1 font-medium">{facility.contact.role}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">No contact information available</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {facility.secondaryContactPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Secondary Contact</p>
                      <p className="font-medium text-gray-900">{facility.secondaryContactPhone}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Contract Start</p>
                    <p className="font-medium text-gray-900">{facility.contractStart}</p>
                  </div>
                </div>

                
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Monthly Fee</p>
                    <p className="font-medium text-gray-900">${facility.monthlyFee?.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next Survey Due</span>
                  <span className="font-medium text-gray-900">
                    {facility.nextSurvey ? new Date(facility.nextSurvey).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Not scheduled'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Survey</span>
                  <span className="font-medium text-gray-900">
                    {facility.lastSurvey ? new Date(facility.lastSurvey).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Not available'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Facility Type</span>
                  <span className="font-medium text-gray-900">{facility.type}</span>
                </div>
                
                {facility.providerNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Provider Number</span>
                    <span className="font-medium text-gray-900">{facility.providerNumber}</span>
                  </div>
                )}
             
              </CardContent>
            </Card>
          </div>

          {/* Tags & Location */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Tags */}
            {facility.tags && facility.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Specialties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {facility.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="font-medium text-gray-900">{facility.address?.street || 'Address not specified'}</p>
                  <p className="text-gray-600">
                    {facility.address?.city}, {facility.address?.state} {facility.address?.zipCode}
                    {facility.address?.country && `, ${facility.address.country}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Facility Details */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Address Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  Address Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-gray-700">{facility.address?.street || 'Address not specified'}</p>
                  <p className="text-gray-700">
                    {facility.address?.city}, {facility.address?.state} {facility.address?.zipCode}
                    {facility.address?.country && `, ${facility.address.country}`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Size & Capacity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  Size & Capacity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Users className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Beds</p>
                    <p className="font-medium text-gray-900">{facility.beds}</p>
                  </div>
                </div>
                
                {facility.size?.squareFootage && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Building2 className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Square Feet</p>
                      <p className="font-medium text-gray-900">{facility.size.squareFootage}</p>
                    </div>
                  </div>
                )}
                
                {facility.size?.floors && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Building2 className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Floors</p>
                      <p className="font-medium text-gray-900">{facility.size.floors}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {facility.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="text-gray-700">{facility.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </TabsContent>

        {/* Survey History Tab */}
        <TabsContent value="surveys" className="space-y-6">
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Surveys</h2>
              <p className="text-sm sm:text-base text-gray-600">Manage surveys for this facility</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={async () => {
                  // Clear any existing survey data and start fresh
                  await clearSurveyStorage();
                  navigate('/mocksurvey365');
                }}
                className="bg-[#075b7d] hover:bg-[#075b7d] text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Survey
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Facility Surveys ({surveys.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSurveys ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading surveys...</p>
                </div>
              ) : surveys.length > 0 ? (
                <DataTable 
                  columns={surveyColumns} 
                  data={surveys} 
                  searchPlaceholder="Search surveys..."
                  searchColumn="surveyCategory"
                  filters={[
                    {
                      column: "status",
                      title: "Status",
                      options: [
                        { value: "completed", label: "Completed" },
                        { value: "setup", label: "Setup" },
                        { value: "in-progress", label: "In Progress" }
                      ]
                    },
                    {
                      column: "surveyCategory",
                      title: "Type",
                      options: [
                        { value: "standard", label: "Standard Survey" },
                        { value: "follow-up", label: "Follow-up Survey" },
                        { value: "complaint", label: "Complaint Survey" }
                      ]
                    }
                  ]}
                />
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Surveys Found</h3>
                  <p className="text-gray-600 mb-4">This facility doesn't have any surveys yet.</p>
                  <Button
                    onClick={async () => {
                      // Clear any existing survey data and start fresh
                      await clearSurveyStorage();
                      navigate('/mocksurvey365');
                    }}
                    className="bg-[#075b7d] hover:bg-[#075b7d] text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Create First Survey
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Residents Tab */}
        <TabsContent value="activities" className="space-y-4 sm:space-y-6">
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Residents</h2>
              <p className="text-sm sm:text-base text-gray-600">Manage residents and their information</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
             
            
              <Button

               onClick={() => setShowAddResidentModal(true)} className="text-xs sm:text-sm bg-[#075b7d] hover:bg-[#075b7d] text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Resident
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Facility Residents ({residents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingResidents ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading residents...</p>
                </div>
              ) : (
                <DataTable 
                  columns={residentsColumns} 
                  data={residents} 
                  searchPlaceholder="Search residents..."
                  searchColumn="name"
                  filters={[
                    {
                      column: "status",
                      title: "Status",
                      options: [
                        { value: "active", label: "Active" },
                        { value: "discharged", label: "Discharged" },
                        { value: "transferred", label: "Transferred" }
                      ]
                    },
                    {
                      column: "careLevel",
                      title: "Care Level",
                      options: [
                        { value: "skilled-nursing", label: "Skilled Nursing" },
                        { value: "rehabilitation", label: "Rehabilitation" },
                        { value: "long-term-care", label: "Long-term Care" },
                        { value: "assisted-living", label: "Assisted Living" },
                        { value: "specialized-care", label: "Specialized Care" }
                      ]
                    },
                    {
                      column: "interviewable",
                      title: "Interviewable",
                      options: [
                        { value: "true", label: "Yes" },
                        { value: "false", label: "No" }
                      ]
                    }
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benchmarking Tab */}
        <TabsContent value="benchmarking" className="space-y-6">
          {/* Chain Information */}
          {(facility.chainId || facility.numberOfFacilities || facility.numberOfStatesAndTerritories || facility.chain) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  Chain Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {facility.chain && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Chain</span>
                    <span className="font-medium text-gray-900">{facility.chain}</span>
                  </div>
                )}
                {facility.chainId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Chain ID</span>
                    <span className="font-medium text-gray-900">{facility.chainId}</span>
                  </div>
                )}
                {facility.numberOfFacilities && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Number of Facilities</span>
                    <span className="font-medium text-gray-900">{facility.numberOfFacilities}</span>
                  </div>
                )}
                {facility.numberOfStatesAndTerritories && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">States/Territories with Operations</span>
                    <span className="font-medium text-gray-900">{facility.numberOfStatesAndTerritories}</span>
                  </div>
                )}
                {facility.numberOfSpecialFocusFacilities && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Special Focus Facilities (SFF)</span>
                    <span className="font-medium text-gray-900">{facility.numberOfSpecialFocusFacilities}</span>
                  </div>
                )}
                {facility.numberOfSFFCandidates && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">SFF Candidates</span>
                    <span className="font-medium text-gray-900">{facility.numberOfSFFCandidates}</span>
                  </div>
                )}
                {facility.numberOfAbuseIconFacilities && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Facilities with Abuse Icon</span>
                    <span className="font-medium text-gray-900">{facility.numberOfAbuseIconFacilities}</span>
                  </div>
                )}
                {facility.percentageOfAbuseIconFacilities && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">% Facilities with Abuse Icon</span>
                    <span className="font-medium text-gray-900">{facility.percentageOfAbuseIconFacilities}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ownership Information */}
          {(facility.percentForProfit || facility.percentNonProfit || facility.percentGovernmentOwned) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  Ownership Classification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {facility.percentForProfit && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">For Profit</span>
                    <span className="font-medium text-gray-900">{facility.percentForProfit}%</span>
                  </div>
                )}
                {facility.percentNonProfit && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Non Profit</span>
                    <span className="font-medium text-gray-900">{facility.percentNonProfit}%</span>
                  </div>
                )}
                {facility.percentGovernmentOwned && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Government Owned</span>
                    <span className="font-medium text-gray-900">{facility.percentGovernmentOwned}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Star Ratings */}
          {(facility.averageOverall5StarRating || facility.averageHealthInspectionRating || facility.averageStaffingRating || facility.averageQualityRating) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-gray-600" />
                  CMS Star Ratings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {facility.averageOverall5StarRating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall 5-Star Rating</span>
                    <span className="font-medium text-gray-900">{facility.averageOverall5StarRating}</span>
                  </div>
                )}
                {facility.averageHealthInspectionRating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Health Inspection Rating</span>
                    <span className="font-medium text-gray-900">{facility.averageHealthInspectionRating}</span>
                  </div>
                )}
                {facility.averageStaffingRating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Staffing Rating</span>
                    <span className="font-medium text-gray-900">{facility.averageStaffingRating}</span>
                  </div>
                )}
                {facility.averageQualityRating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quality Rating</span>
                    <span className="font-medium text-gray-900">{facility.averageQualityRating}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Staffing Metrics */}
          {(facility.averageTotalNurseHoursPerResidentDay || facility.averageTotalWeekendNurseHoursPerResidentDay || facility.averageTotalRegisteredNurseHoursPerResidentDay) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  Staffing Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {facility.averageTotalNurseHoursPerResidentDay && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Nurse Hours/Resident Day</span>
                    <span className="font-medium text-gray-900">{facility.averageTotalNurseHoursPerResidentDay}</span>
                  </div>
                )}
                {facility.averageTotalWeekendNurseHoursPerResidentDay && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Weekend Nurse Hours/Resident Day</span>
                    <span className="font-medium text-gray-900">{facility.averageTotalWeekendNurseHoursPerResidentDay}</span>
                  </div>
                )}
                {facility.averageTotalRegisteredNurseHoursPerResidentDay && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">RN Hours/Resident Day</span>
                    <span className="font-medium text-gray-900">{facility.averageTotalRegisteredNurseHoursPerResidentDay}</span>
                  </div>
                )}
                {facility.averageTotalNursingStaffTurnoverPercentage && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Nursing Staff Turnover %</span>
                    <span className="font-medium text-gray-900">{facility.averageTotalNursingStaffTurnoverPercentage}%</span>
                  </div>
                )}
                {facility.averageRegisteredNurseTurnoverPercentage && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">RN Turnover %</span>
                    <span className="font-medium text-gray-900">{facility.averageRegisteredNurseTurnoverPercentage}%</span>
                  </div>
                )}
                {facility.averageNumberOfAdministratorsWhoLeft && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Administrators Who Left</span>
                    <span className="font-medium text-gray-900">{facility.averageNumberOfAdministratorsWhoLeft}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fines & Payment Denials */}
          {(facility.totalNumberOfFines || facility.averageNumberOfFines || facility.totalAmountOfFinesInDollars || facility.averageAmountOfFinesInDollars || facility.totalNumberOfPaymentDenials) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-gray-600" />
                  Fines & Payment Denials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {facility.totalNumberOfFines && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Number of Fines</span>
                    <span className="font-medium text-gray-900">{facility.totalNumberOfFines}</span>
                  </div>
                )}
                {facility.averageNumberOfFines && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Number of Fines</span>
                    <span className="font-medium text-gray-900">{facility.averageNumberOfFines}</span>
                  </div>
                )}
                {facility.totalAmountOfFinesInDollars && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Amount of Fines</span>
                    <span className="font-medium text-gray-900">${parseFloat(facility.totalAmountOfFinesInDollars).toLocaleString()}</span>
                  </div>
                )}
                {facility.averageAmountOfFinesInDollars && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Amount of Fines</span>
                    <span className="font-medium text-gray-900">${parseFloat(facility.averageAmountOfFinesInDollars).toLocaleString()}</span>
                  </div>
                )}
                {facility.totalNumberOfPaymentDenials && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Payment Denials</span>
                    <span className="font-medium text-gray-900">{facility.totalNumberOfPaymentDenials}</span>
                  </div>
                )}
                {facility.averageNumberOfPaymentDenials && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Payment Denials</span>
                    <span className="font-medium text-gray-900">{facility.averageNumberOfPaymentDenials}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quality Metrics - Short Stay */}
          {(facility.averageShortStayRehospitalizedPercentage || facility.averageShortStayEDVisitPercentage || facility.averageShortStayAntipsychoticPercentage || facility.averageShortStayPressureUlcerPercentage || facility.averageShortStayDischargeAbilityPercentage || facility.averageShortStayInfluenzaVaccinePercentage || facility.averageShortStayPneumococcalVaccinePercentage) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  Short Stay Quality Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facility.averageShortStayRehospitalizedPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Rehospitalized After Admission</span>
                      <span className="font-medium text-gray-900">{facility.averageShortStayRehospitalizedPercentage}%</span>
                    </div>
                  )}
                  {facility.averageShortStayEDVisitPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Outpatient ED Visits</span>
                      <span className="font-medium text-gray-900">{facility.averageShortStayEDVisitPercentage}%</span>
                    </div>
                  )}
                  {facility.averageShortStayAntipsychoticPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Newly Received Antipsychotic Medication</span>
                      <span className="font-medium text-gray-900">{facility.averageShortStayAntipsychoticPercentage}%</span>
                    </div>
                  )}
                  {facility.averageShortStayPressureUlcerPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Pressure Ulcers/Injuries (New/Worsened)</span>
                      <span className="font-medium text-gray-900">{facility.averageShortStayPressureUlcerPercentage}%</span>
                    </div>
                  )}
                  {facility.averageShortStayDischargeAbilityPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">At/Above Expected Ability at Discharge</span>
                      <span className="font-medium text-gray-900">{facility.averageShortStayDischargeAbilityPercentage}%</span>
                    </div>
                  )}
                  {facility.averageShortStayInfluenzaVaccinePercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Influenza Vaccine (Assessed & Given)</span>
                      <span className="font-medium text-gray-900">{facility.averageShortStayInfluenzaVaccinePercentage}%</span>
                    </div>
                  )}
                  {facility.averageShortStayPneumococcalVaccinePercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Pneumococcal Vaccine (Assessed & Given)</span>
                      <span className="font-medium text-gray-900">{facility.averageShortStayPneumococcalVaccinePercentage}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quality Metrics - Long Stay */}
          {(facility.averageLongStayHospitalizationsPer1000 || facility.averageLongStayEDVisitsPer1000 || facility.averageLongStayAntipsychoticPercentage || facility.averageLongStayFallsWithInjuryPercentage || facility.averageLongStayPressureUlcersPercentage || facility.averageLongStayUTIPercentage || facility.averageLongStayCatheterPercentage) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  Long Stay Quality Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facility.averageLongStayHospitalizationsPer1000 && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Hospitalizations per 1000 Resident Days</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayHospitalizationsPer1000}</span>
                    </div>
                  )}
                  {facility.averageLongStayEDVisitsPer1000 && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">ED Visits per 1000 Resident Days</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayEDVisitsPer1000}</span>
                    </div>
                  )}
                  {facility.averageLongStayAntipsychoticPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Received Antipsychotic Medication</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayAntipsychoticPercentage}%</span>
                    </div>
                  )}
                  {facility.averageLongStayFallsWithInjuryPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Falls with Major Injury</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayFallsWithInjuryPercentage}%</span>
                    </div>
                  )}
                  {facility.averageLongStayPressureUlcersPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Pressure Ulcers</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayPressureUlcersPercentage}%</span>
                    </div>
                  )}
                  {facility.averageLongStayUTIPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Urinary Tract Infection</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayUTIPercentage}%</span>
                    </div>
                  )}
                  {facility.averageLongStayCatheterPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Catheter Inserted/Left in Bladder</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayCatheterPercentage}%</span>
                    </div>
                  )}
                  {facility.averageLongStayMobilityWorsenedPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Ability to Move Independently Worsened</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayMobilityWorsenedPercentage}%</span>
                    </div>
                  )}
                  {facility.averageLongStayADLHelpIncreasedPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Need for ADL Help Increased</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayADLHelpIncreasedPercentage}%</span>
                    </div>
                  )}
                  {facility.averageLongStayInfluenzaVaccinePercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Influenza Vaccine (Assessed & Given)</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayInfluenzaVaccinePercentage}%</span>
                    </div>
                  )}
                  {facility.averageLongStayPneumococcalVaccinePercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Pneumococcal Vaccine (Assessed & Given)</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayPneumococcalVaccinePercentage}%</span>
                    </div>
                  )}
                  {facility.averageLongStayPhysicallyRestrainedPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Physically Restrained</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayPhysicallyRestrainedPercentage}%</span>
                    </div>
                  )}
                  {facility.averageLongStayIncontinencePercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">New/Worsened Incontinence</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayIncontinencePercentage}%</span>
                    </div>
                  )}
                  {facility.averageLongStayWeightLossPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Weight Loss</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayWeightLossPercentage}%</span>
                    </div>
                  )}
                  {facility.averageLongStayDepressionPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Symptoms of Depression</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayDepressionPercentage}%</span>
                    </div>
                  )}
                  {facility.averageLongStayAntianxietyMedicationPercentage && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Used Antianxiety/Hypnotic Medication</span>
                      <span className="font-medium text-gray-900">{facility.averageLongStayAntianxietyMedicationPercentage}%</span>
                    </div>
                  )}
                  {facility.averageRateOfPreventableReadmissions && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Potentially Preventable Hospital Readmissions (30 days)</span>
                      <span className="font-medium text-gray-900">{facility.averageRateOfPreventableReadmissions}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

       
        </TabsContent>

        {/* Add Resident Modal */}
        {showAddResidentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Add New Resident
                  </h3>
                  <button
                    onClick={() => setShowAddResidentModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="residentName" className="text-sm font-medium text-gray-700">
                      Resident Name *
                    </Label>
                    <Input
                      id="residentName"
                      value={newResident.name}
                      onChange={(e) => setNewResident(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter resident name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="residentRoom" className="text-sm font-medium text-gray-700">
                      Room Number *
                    </Label>
                    <Input
                      id="residentRoom"
                      value={newResident.room}
                      onChange={(e) => setNewResident(prev => ({ ...prev, room: e.target.value }))}
                      placeholder="Enter room number"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="admissionDate" className="text-sm font-medium text-gray-700">
                      Admission Date *
                    </Label>
                    <div className="mt-1">
                      <DatePicker
                        date={newResident.admissionDate}
                        onSelect={(date) => setNewResident(prev => ({ ...prev, admissionDate: date }))}
                        placeholder="Select admission date"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="diagnosis" className="text-sm font-medium text-gray-700">
                      Diagnosis
                    </Label>
                    <Input
                      id="diagnosis"
                      value={newResident.diagnosis}
                      onChange={(e) => setNewResident(prev => ({ ...prev, diagnosis: e.target.value }))}
                      placeholder="Enter diagnosis"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Special Types
                    </Label>
                    {loadingSpecialTypes ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading special types...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Selected types badges */}
                        {newResident.specialTypes.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {newResident.specialTypes.map((type) => (
                              <Badge
                                key={type}
                                variant="secondary"
                                className="text-xs bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1 px-2 py-1"
                              >
                                {type}
                                <button
                                  type="button"
                                  onClick={() => handleSpecialTypeToggle(type)}
                                  className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
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
                              className="w-full justify-between h-10 font-normal text-sm"
                            >
                              <span className="text-gray-500">
                                {newResident.specialTypes.length > 0
                                  ? `${newResident.specialTypes.length} type(s) selected`
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
                                              ? "opacity-100 text-gray-800"
                                              : "opacity-0"
                                            : newResident.specialTypes.includes(type)
                                            ? "opacity-100 text-gray-800"
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
                    {showOthersInput && (
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600 block mt-4">
                          Other Special Types:
                        </Label>
                        {/* Display existing tags */}
                        {Array.isArray(newResident.specialTypesOthers) &&
                          newResident.specialTypesOthers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {newResident.specialTypesOthers.map((item, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 px-2 py-1"
                                >
                                  {item}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewResident((prev) => ({
                                        ...prev,
                                        specialTypesOthers:
                                          prev.specialTypesOthers.filter(
                                            (_, i) => i !== index
                                          ),
                                      }));
                                    }}
                                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
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
                              // Auto-split on comma
                              if (value.includes(",")) {
                                const newItems = value
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean);
                                if (newItems.length > 0) {
                                  setNewResident((prev) => ({
                                    ...prev,
                                    specialTypesOthers: [
                                      ...(prev.specialTypesOthers || []),
                                      ...newItems,
                                    ],
                                  }));
                                  e.target.value = "";
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.target.value.trim()) {
                                e.preventDefault();
                                const trimmedValue = e.target.value.trim();
                                if (trimmedValue) {
                                  setNewResident((prev) => ({
                                    ...prev,
                                    specialTypesOthers: [
                                      ...(prev.specialTypesOthers || []),
                                      trimmedValue,
                                    ],
                                  }));
                                  e.target.value = "";
                                }
                              }
                            }}
                            placeholder="Type and press Enter or use comma to separate"
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Interview Status
                    </Label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newResident.interviewable}
                        onChange={(e) => setNewResident(prev => ({ ...prev, interviewable: e.target.checked }))}
                        className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">Interviewable</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Check if this resident can be interviewed for surveys
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => setShowAddResidentModal(false)}
                    variant="outline"
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddResident}
                    disabled={!newResident.name || !newResident.room || !newResident.admissionDate || addingResident}
                    className="px-6 bg-gray-600 hover:bg-gray-700"
                  >
                    {addingResident ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      'Add Resident'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Resident Modal */}
        {editingResident && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Edit Resident
                  </h3>
                  <button
                    onClick={() => setEditingResident(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editName" className="text-sm font-medium text-gray-700">
                      Resident Name *
                    </Label>
                    <Input
                      id="editName"
                      value={editingResident.name}
                      onChange={(e) => setEditingResident(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter resident name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="editRoom" className="text-sm font-medium text-gray-700">
                      Room Number *
                    </Label>
                    <Input
                      id="editRoom"
                      value={editingResident.room}
                      onChange={(e) => setEditingResident(prev => ({ ...prev, room: e.target.value }))}
                      placeholder="Enter room number"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="editAdmissionDate" className="text-sm font-medium text-gray-700">
                      Admission Date *
                    </Label>
                    <div className="mt-1">
                      <DatePicker
                        date={editingResident.admissionDate instanceof Date 
                          ? editingResident.admissionDate 
                          : new Date(editingResident.admissionDate)}
                        onSelect={(date) => setEditingResident(prev => ({ ...prev, admissionDate: date }))}
                        placeholder="Select admission date"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="editDiagnosis" className="text-sm font-medium text-gray-700">
                      Diagnosis
                    </Label>
                    <Input
                      id="editDiagnosis"
                      value={editingResident.primaryDiagnosis || ''}
                      onChange={(e) => setEditingResident(prev => ({ ...prev, primaryDiagnosis: e.target.value }))}
                      placeholder="Enter diagnosis"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Special Types
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Dementia",
                        "Behavioral",
                        "Wound Care",
                        "IV Therapy",
                        "Oxygen",
                        "Dialysis",
                      ].map((type) => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editingResident.specialNeeds && editingResident.specialNeeds.includes(type)}
                            onChange={() => {
                              const currentNeeds = editingResident.specialNeeds || [];
                              const updatedNeeds = currentNeeds.includes(type)
                                ? currentNeeds.filter(t => t !== type)
                                : [...currentNeeds, type];
                              setEditingResident(prev => ({ ...prev, specialNeeds: updatedNeeds }));
                            }}
                            className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                          />
                          <span className="text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Interview Status
                    </Label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingResident.interviewable !== undefined ? editingResident.interviewable : true}
                        onChange={(e) => setEditingResident(prev => ({ ...prev, interviewable: e.target.checked }))}
                        className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">Interviewable</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Check if this resident can be interviewed for surveys
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => setEditingResident(null)}
                    variant="outline"
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateResident}
                    disabled={!editingResident.name || !editingResident.room || !editingResident.admissionDate || updatingResident}
                    className="px-6 bg-gray-600 hover:bg-gray-700"
                  >
                    {updatingResident ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      'Update Resident'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Residents Modal */}
        {showUploadResidentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Upload Residents CSV
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Bulk import residents from a CSV file
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUploadResidentModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">
                      CSV Format Requirements:
                    </h4>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-700">
                        <strong>Column order:</strong> Name, Room, Admission Date, Diagnosis, Special Types
                      </p>
                      <p className="text-xs text-gray-700">
                        <strong>Special Types:</strong> Separate multiple types with semicolons (;)
                      </p>
                      <p className="text-xs text-gray-700">
                        <strong>Date format:</strong> YYYY-MM-DD
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="csvFile" className="text-sm font-medium text-gray-700">
                      Select CSV File
                    </Label>
                    <Input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // Handle file upload logic here
                          toast.success('File uploaded successfully!', {
                            description: 'Residents will be imported shortly.',
                            duration: 5000,
                            position: 'top-right',
                          });
                          setShowUploadResidentModal(false);
                        }
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => setShowUploadResidentModal(false)}
                    variant="outline"
                    className="px-6"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Resident Modal */}
        {viewingResident && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full h-[90vh] sm:h-[80vh] flex flex-col">
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-gray-200 flex-shrink-0">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Resident Details
                </h3>
                <button
                  onClick={() => setViewingResident(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto hide-scrollbar p-4 sm:p-6">

                <div className="space-y-4 sm:space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Name</Label>
                      <p className="mt-1 text-gray-900 font-medium">{viewingResident.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Room</Label>
                      <p className="mt-1 text-gray-900">{viewingResident.room}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Age</Label>
                      <p className="mt-1 text-gray-900">{viewingResident.age || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Status</Label>
                      <div className="mt-1">
                        <Badge 
                          variant={viewingResident.status === "active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {viewingResident.status === "active" ? "Active" : 
                           viewingResident.status === "discharged" ? "Discharged" : "Transferred"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Interview Status</Label>
                      <div className="mt-1">
                        <Badge 
                          variant={viewingResident.interviewable !== false ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {viewingResident.interviewable !== false ? "Interviewable" : "Non-Interviewable"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Admission Date</Label>
                        <p className="mt-1 text-gray-900">
                          {viewingResident.admissionDate ? 
                            new Date(viewingResident.admissionDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Primary Diagnosis</Label>
                        <p className="mt-1 text-gray-900">{viewingResident.primaryDiagnosis || 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Care Level</Label>
                        <p className="mt-1 text-gray-900">{viewingResident.careLevel || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Special Needs */}
                  {viewingResident.specialNeeds && viewingResident.specialNeeds.length > 0 && (
                    <div className="pt-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Special Needs</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingResident.specialNeeds.map((need, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {need}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Family Contact */}
                  <div className="pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Family Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Contact Person</Label>
                        <p className="mt-1 text-gray-900">{viewingResident.familyContact || 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                        <p className="mt-1 text-gray-900">{viewingResident.familyPhone || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {viewingResident.notes && (
                    <div className="pt-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Notes</h4>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                        {viewingResident.notes}
                      </p>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Created Date</Label>
                        <p className="mt-1 text-gray-900">
                          {viewingResident.createdAt ? 
                            new Date(viewingResident.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              
              {/* Fixed Footer */}
              <div className="flex justify-end p-4 sm:p-6 border-gray-200 flex-shrink-0">
                <Button
                  onClick={() => setViewingResident(null)}
                  variant="outline"
                  className="px-6"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

      </Tabs>
    </div>
  );
};

export default FacilityProfile; 