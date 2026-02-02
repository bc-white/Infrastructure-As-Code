import React, { useState, useMemo } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { resourceAPI, userAPI } from '../service/api';
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';

const AddResourceModal = ({ isOpen, onClose, onSuccess, resourceType = 'regulation' }) => {
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    description: '',
    date: undefined
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [stateSearchTerm, setStateSearchTerm] = useState('');

  // US States list
  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
    'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
    'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  // Filter states based on search term
  const filteredStates = useMemo(() => {
    if (!stateSearchTerm) return states;
    return states.filter(state =>
      state.toLowerCase().includes(stateSearchTerm.toLowerCase())
    );
  }, [stateSearchTerm]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form based on resource type
      if (!formData.name || !file) {
        setError('Please fill in all required fields and select a file');
        setLoading(false);
        return;
      }

      // For regulations, state is required
      if (resourceType === 'regulation' && !formData.state) {
        setError('Please select a state for the regulation');
        setLoading(false);
        return;
      }

      // Upload file first
      const uploadResponse = await userAPI.uploadFile(file);
      
      if (!uploadResponse.status) {
        throw new Error(uploadResponse.message || 'File upload failed');
      }

      // Prepare data based on resource type
      let resourceData;
      let addResponse;

      if (resourceType === 'critical-element') {
        resourceData = {
          name: formData.name,
          pdflink: uploadResponse.data?.url || uploadResponse.data?.fileUrl || uploadResponse.data
        };

        // Add critical element
        addResponse = await resourceAPI.addCriticalElement(resourceData);
      } else {
        resourceData = {
          name: formData.name,
          state: formData.state,
          pdflink: uploadResponse.data?.url || uploadResponse.data?.fileUrl || uploadResponse.data,
          date: formData.date ? format(formData.date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
          description: formData.description || ''
        };

        // Add regulation
        addResponse = await resourceAPI.addLongTermRegulation(resourceData);
      }
      
      if (!addResponse.status) {
        throw new Error(addResponse.message || `Failed to add ${resourceType === 'critical-element' ? 'critical element' : 'regulation'}`);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);

    } catch (err) {
      setError(err.message || 'Failed to add resource. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      state: '',
      description: '',
      date: undefined
    });
    setFile(null);
    setError('');
    setSuccess(false);
    setLoading(false);
    setStateSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-[9999] ">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in z-[9998]"
      />

      <div className="fixed inset-0 z-[9999] w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-[600px] data-closed:sm:translate-y-0 data-closed:sm:scale-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <DialogTitle as="h3" className="text-xl font-semibold text-gray-900 mb-2">
                    Add New {resourceType === 'critical-element' ? 'Critical Element' : 'Resource'}
                  </DialogTitle>
                  <p className="text-sm text-gray-500 mb-6">
                    Upload a new {resourceType === 'critical-element' ? 'critical elements pathway file' : 'regulation document'} to the resource center.
                  </p>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {resourceType === 'critical-element' ? 'Critical Element' : 'Resource'} Added Successfully!
            </h3>
            <p className="text-gray-600">
              The new {resourceType === 'critical-element' ? 'critical element' : 'regulation'} has been added to the database.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <div className="grid gap-4">
              {/* Resource Name */}
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  {resourceType === 'critical-element' ? 'Critical Element Name' : 'Resource Name'} *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={resourceType === 'critical-element' 
                    ? "e.g., CMS-20081 Respiratory Care" 
                    : "e.g., Alabama – Nursing Facility Regulations (Chapter 420-5-10)"
                  }
                  required
                />
              </div>

              {/* State and Date Row - Only show for regulations */}
              {resourceType === 'regulation' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="state" className="text-sm font-medium">
                      State *
                    </Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a state" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        <div className="p-2">
                          <Input
                            placeholder="Search states..."
                            value={stateSearchTerm}
                            onChange={(e) => setStateSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="h-8"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredStates.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                          {filteredStates.length === 0 && (
                            <div className="px-2 py-1.5 text-sm text-gray-500">
                              No states found
                            </div>
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="date" className="text-sm font-medium">
                      Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[10000]" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => handleInputChange('date', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Description - Only show for regulations */}
              {resourceType === 'regulation' && (
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Optional description of the regulation..."
                    className="min-h-[80px]"
                    rows={3}
                  />
                </div>
              )}

              {/* File Upload */}
              <div className="grid gap-2">
                <Label htmlFor="file" className="text-sm font-medium">
                  PDF File *
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    {file ? (
                      <div className="space-y-2">
                        <FileText className="w-8 h-8 text-blue-500 mx-auto" />
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-sm font-medium text-gray-900">
                          Click to upload PDF file
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF files only, max 10MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-md bg-[#075b7d] px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#075b7d]/90 sm:ml-3 sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  `Add ${resourceType === 'critical-element' ? 'Critical Element' : 'Resource'}`
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default AddResourceModal;
