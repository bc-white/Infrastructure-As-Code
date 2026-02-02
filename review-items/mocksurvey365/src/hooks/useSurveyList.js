import { useState, useEffect, useCallback } from 'react';
import { surveyAPI } from '../service/api';

/**
 * Custom hook for managing survey list data
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Survey data and methods
 */
export const useSurveyList = (initialFilters = {}) => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    facility: null,
    category: null,
    status: null,
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
    ...initialFilters
  });

  // Memoized fetch function
  const fetchSurveys = useCallback(async (customFilters = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const activeFilters = customFilters || filters;
    
      
      const response = await surveyAPI.getUserSurveyList(activeFilters);
      
      if (response.success) {
        setSurveys(response.data || []);
      
      } else {
        throw new Error(response.message || 'Failed to fetch surveys');
      }
    } catch (err) {
   
      setError(err.message || 'Failed to load surveys');
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Update filters and trigger fetch
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      facility: null,
      category: null,
      status: null,
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10
    };
    setFilters(clearedFilters);
  }, []);

  // Refresh surveys
  const refresh = useCallback(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // Load specific test scenario
  const loadTestScenario = useCallback(async (scenario = 'default') => {
    const scenarios = {
      default: {
        facility: '68bda48c8a05adc6a070367e',
        category: 'Annual',
        status: 'offsite-preparation',
        startDate: '',
        endDate: ''
      },
      allFacility: {
        facility: '68bda48c8a05adc6a070367e',
        category: null,
        status: null,
        startDate: '',
        endDate: ''
      },
      annualOnly: {
        facility: null,
        category: 'Annual',
        status: null,
        startDate: '',
        endDate: ''
      },
      offsiteOnly: {
        facility: null,
        category: null,
        status: 'offsite-preparation',
        startDate: '',
        endDate: ''
      }
    };

    const testFilters = scenarios[scenario] || scenarios.default;
    setFilters(prev => ({ ...prev, ...testFilters }));
    await fetchSurveys(testFilters);
  }, [fetchSurveys]);

  // Effect to fetch surveys when filters change
  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  return {
    // Data
    surveys,
    loading,
    error,
    filters,
    
    // Methods
    updateFilters,
    clearFilters,
    refresh,
    loadTestScenario,
    
    // Computed values
    isEmpty: surveys.length === 0,
    count: surveys.length,
    
    // Filter helpers
    setFacility: (facility) => updateFilters({ facility }),
    setCategory: (category) => updateFilters({ category }),
    setStatus: (status) => updateFilters({ status }),
    setDateRange: (startDate, endDate) => updateFilters({ startDate, endDate }),
    
    // Pagination helpers
    setPage: (page) => updateFilters({ page }),
    setLimit: (limit) => updateFilters({ limit, page: 1 }),
  };
};

export default useSurveyList;
