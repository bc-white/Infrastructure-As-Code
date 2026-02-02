// Mock Survey Service
// Simulates backend API calls using localStorage
// TODO: Replace with real API service when backend is ready

import mockSurveysData from '../data/mockSurveys.json'
import { US_STATES } from '../utils/constants'

// Storage keys
const STORAGE_KEYS = {
  SURVEYS: 'mock_surveys'
}

// Survey types
export const SURVEY_TYPES = [
  "Standard",
  "Complaint Investigation",
  "Follow-up",
  "Abbreviated",
  "Pre-licensing"
]

// Survey statuses
export const SURVEY_STATUSES = [
  "Draft",
  "Published",
  "Archived"
]

// Initialize mock data in localStorage if not exists
const initializeMockData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.SURVEYS)) {
    localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(mockSurveysData.surveys))
  }
}

// Simulate API delay
const delay = (ms = 300) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Get surveys from localStorage
const getSurveys = () => {
  const surveysJson = localStorage.getItem(STORAGE_KEYS.SURVEYS)
  return surveysJson ? JSON.parse(surveysJson) : []
}

// Save surveys to localStorage
const saveSurveys = (surveys) => {
  localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(surveys))
}

// Generate unique ID
const generateId = (prefix = 'item') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Initialize on module load
initializeMockData()

// Export service functions
export const mockSurveyService = {
  // Get all surveys
  getAllSurveys: async () => {
    await delay(200)
    return getSurveys()
  },

  // Get survey by ID
  getSurveyById: async (id) => {
    await delay(200)
    const surveys = getSurveys()
    return surveys.find(s => s.id === id) || null
  },

  // Get surveys by facility ID
  getSurveysByFacility: async (facilityId) => {
    await delay(200)
    const surveys = getSurveys()
    return surveys.filter(s => s.facilityId === facilityId)
  },

  // Get surveys by status
  getSurveysByStatus: async (status) => {
    await delay(200)
    const surveys = getSurveys()
    return surveys.filter(s => s.status === status)
  },

  // Get surveys by state
  getSurveysByState: async (state) => {
    await delay(200)
    const surveys = getSurveys()
    return surveys.filter(s => s.state === state)
  },

  // Create new survey
  createSurvey: async (surveyData) => {
    await delay(300)
    
    const surveys = getSurveys()
    
    // Validate state
    if (!surveyData.state || !US_STATES.includes(surveyData.state)) {
      throw new Error('Invalid state selected')
    }

    const newSurvey = {
      id: generateId('survey'),
      title: surveyData.title || 'Untitled Survey',
      description: surveyData.description || '',
      type: surveyData.type || 'Standard',
      state: surveyData.state,
      status: 'Draft',
      facilityId: surveyData.facilityId || null,
      createdBy: surveyData.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModifiedBy: surveyData.createdBy,
      regulationReferences: surveyData.regulationReferences || [],
      sections: surveyData.sections || []
    }

    surveys.push(newSurvey)
    saveSurveys(surveys)

    return newSurvey
  },

  // Update survey
  updateSurvey: async (id, updates) => {
    await delay(300)
    
    const surveys = getSurveys()
    const surveyIndex = surveys.findIndex(s => s.id === id)

    if (surveyIndex === -1) {
      throw new Error('Survey not found')
    }

    // Don't allow editing published surveys directly
    if (surveys[surveyIndex].status === 'Published') {
      throw new Error('Cannot edit published survey. Please create a new version.')
    }

    // Validate state if provided
    if (updates.state && !US_STATES.includes(updates.state)) {
      throw new Error('Invalid state selected')
    }

    const updatedSurvey = {
      ...surveys[surveyIndex],
      ...updates,
      id, // Preserve ID
      updatedAt: new Date().toISOString(),
      lastModifiedBy: updates.lastModifiedBy || surveys[surveyIndex].lastModifiedBy
    }

    surveys[surveyIndex] = updatedSurvey
    saveSurveys(surveys)

    return updatedSurvey
  },

  // Delete survey
  deleteSurvey: async (id) => {
    await delay(300)
    
    const surveys = getSurveys()
    const surveyIndex = surveys.findIndex(s => s.id === id)

    if (surveyIndex === -1) {
      throw new Error('Survey not found')
    }

    surveys.splice(surveyIndex, 1)
    saveSurveys(surveys)

    return { success: true }
  },

  // Duplicate survey
  duplicateSurvey: async (id, newTitle = null) => {
    await delay(400)
    
    const surveys = getSurveys()
    const originalSurvey = surveys.find(s => s.id === id)

    if (!originalSurvey) {
      throw new Error('Survey not found')
    }

    // Deep clone the survey
    const duplicatedSurvey = {
      ...JSON.parse(JSON.stringify(originalSurvey)),
      id: generateId('survey'),
      title: newTitle || `${originalSurvey.title} (Copy)`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModifiedBy: originalSurvey.createdBy
    }

    // Update IDs for nested structures
    duplicatedSurvey.sections = duplicatedSurvey.sections.map((section, sectionIndex) => {
      const newSectionId = generateId('section')
      return {
        ...section,
        id: newSectionId,
        surveyId: duplicatedSurvey.id,
        order: sectionIndex + 1,
        questions: section.questions.map((question, questionIndex) => {
          const newQuestionId = generateId('question')
          return {
            ...question,
            id: newQuestionId,
            sectionId: newSectionId,
            order: questionIndex + 1,
            options: question.options ? question.options.map((option, optionIndex) => ({
              ...option,
              id: generateId('opt'),
              questionId: newQuestionId,
              order: optionIndex + 1
            })) : []
          }
        })
      }
    })

    surveys.push(duplicatedSurvey)
    saveSurveys(surveys)

    return duplicatedSurvey
  },

  // Publish survey
  publishSurvey: async (id) => {
    await delay(300)
    
    const surveys = getSurveys()
    const survey = surveys.find(s => s.id === id)

    if (!survey) {
      throw new Error('Survey not found')
    }

    // Validate before publishing
    if (!survey.sections || survey.sections.length === 0) {
      throw new Error('Survey must have at least one section before publishing')
    }

    const hasEmptySections = survey.sections.some(section => 
      !section.questions || section.questions.length === 0
    )

    if (hasEmptySections) {
      throw new Error('All sections must have at least one question before publishing')
    }

    // Update status
    const updatedSurvey = {
      ...survey,
      status: 'Published',
      updatedAt: new Date().toISOString()
    }

    const surveyIndex = surveys.findIndex(s => s.id === id)
    surveys[surveyIndex] = updatedSurvey
    saveSurveys(surveys)

    return updatedSurvey
  },

  // Unpublish survey
  unpublishSurvey: async (id) => {
    await delay(300)
    
    const surveys = getSurveys()
    const surveyIndex = surveys.findIndex(s => s.id === id)

    if (surveyIndex === -1) {
      throw new Error('Survey not found')
    }

    surveys[surveyIndex] = {
      ...surveys[surveyIndex],
      status: 'Draft',
      updatedAt: new Date().toISOString()
    }
    saveSurveys(surveys)

    return surveys[surveyIndex]
  },

  // Archive survey
  archiveSurvey: async (id) => {
    await delay(300)
    
    const surveys = getSurveys()
    const surveyIndex = surveys.findIndex(s => s.id === id)

    if (surveyIndex === -1) {
      throw new Error('Survey not found')
    }

    surveys[surveyIndex] = {
      ...surveys[surveyIndex],
      status: 'Archived',
      updatedAt: new Date().toISOString()
    }
    saveSurveys(surveys)

    return surveys[surveyIndex]
  },

  // Search surveys
  searchSurveys: async (searchTerm) => {
    await delay(200)
    
    const surveys = getSurveys()
    const term = searchTerm.toLowerCase()

    return surveys.filter(survey => 
      survey.title.toLowerCase().includes(term) ||
      survey.description.toLowerCase().includes(term) ||
      survey.type.toLowerCase().includes(term) ||
      survey.state.toLowerCase().includes(term)
    )
  },

  // Get survey types
  getSurveyTypes: () => SURVEY_TYPES,

  // Get survey statuses
  getSurveyStatuses: () => SURVEY_STATUSES,

  // Get available states
  getAvailableStates: () => US_STATES
}

export default mockSurveyService

