# Phase 4: Taking Surveys (Feature 2)

## Status
**Not Started** - Depends on Phase 3 (Survey Builder)

## Overview
Interface for surveyors/staff to complete surveys digitally. Includes auto-save, progress tracking, validation, and review before submission.

## Tasks

### 4.1 Survey Instance List
- [ ] Create `pages/SurveyTaking/SurveyInstanceList.jsx`
- [ ] Display list of published surveys available to take
- [ ] Show survey information:
  - Survey title
  - Survey type
  - Description
  - State/jurisdiction (Florida)
  - Estimated completion time (if set)
  - Last taken date (if applicable)
- [ ] Add filters/search for available surveys
- [ ] Show "Start New Survey" button for each survey
- [ ] Display in-progress surveys with:
  - Progress percentage
  - Last saved date/time
  - Time elapsed
  - Resume button
- [ ] Display completed surveys with view option

### 4.2 Survey Taking Interface
- [ ] Create `pages/SurveyTaking/TakeSurvey.jsx`
- [ ] Create `components/SurveyTaking/ProgressIndicator.jsx` - Progress bar
- [ ] Create `components/SurveyTaking/SectionNavigation.jsx` - Section menu/TOC
- [ ] Create `components/SurveyTaking/QuestionRenderer.jsx` - Render questions by type
- [ ] Create `components/SurveyTaking/AutoSaveIndicator.jsx` - Save status
- [ ] Implement section-by-section navigation:
  - Previous/Next buttons between sections
  - Section menu/table of contents
  - Progress indicator ("Section 2 of 5")
  - Question counter ("Question 5 of 25")
  - Jump to specific sections (if previous sections completed)
- [ ] Implement question rendering based on type:
  - Radio buttons for single choice
  - Checkboxes for multiple choice
  - Text input for text fields
  - Textarea for multi-line text
  - Date picker for date questions (future)
  - File upload button for file uploads (future)
- [ ] Implement real-time validation:
  - Show error if required question is skipped
  - Show error if validation rules are violated
  - Highlight invalid fields
- [ ] Display help text/instructions for questions
- [ ] Implement conditional logic execution (future enhancement):
  - Show/hide questions based on answers
  - Recalculate visibility when answers change
  - Skip hidden questions in validation

### 4.3 Auto-Save Progress
- [ ] Create `hooks/useAutoSave.js` - Auto-save hook
- [ ] Implement auto-save on field blur (when user leaves a field)
- [ ] Implement periodic save (every 30 seconds)
- [ ] Implement save on section navigation
- [ ] Show save status indicator ("Saving...", "Saved", "Error")
- [ ] Handle save errors gracefully (retry mechanism)
- [ ] Display last saved timestamp

### 4.4 Resume Incomplete Survey
- [ ] Display list of in-progress surveys
- [ ] Show progress information:
  - Survey title
  - Progress percentage
  - Last saved date/time
  - Time elapsed
- [ ] Implement resume functionality (continue from last completed question)
- [ ] Implement restart survey option (with confirmation dialog)

### 4.5 Survey Progress Tracking
- [ ] Display progress indicator:
  - Percentage complete
  - Number of questions answered / total questions
  - Visual progress bar
- [ ] Track timing:
  - Time started
  - Time of last save
  - Total time spent (if submitted)
- [ ] Show time elapsed (optional feature)

### 4.6 Required Questions Validation
- [ ] Identify required questions
- [ ] Prevent submission if required questions are unanswered
- [ ] Highlight unanswered required questions
- [ ] Display summary of missing required questions before submission

### 4.7 Review Before Submission
- [ ] Create review screen before submission
- [ ] Display summary:
  - Summary of all sections
  - Number of questions answered
  - List of unanswered required questions (if any)
  - Option to go back and edit answers
- [ ] Allow editing answers from review screen
- [ ] Show navigation to specific sections/questions

### 4.8 Survey Submission
- [ ] Validate all required questions are answered before submission
- [ ] Display confirmation dialog:
  - Warning if required questions are unanswered
  - Confirmation that submission is final
- [ ] Upon submission:
  - Mark survey as "Completed"
  - Set completion timestamp
  - Lock responses (prevent further editing)
  - Generate submission confirmation
  - Trigger post-submission actions (notifications, deficiency identification)

### 4.9 File Upload Handling (Future Enhancement)
- [ ] Allow uploading files for file upload questions
- [ ] Validate file types and sizes
- [ ] Show upload progress
- [ ] Allow removing/replacing uploaded files
- [ ] Store files securely
- [ ] Display uploaded file names/previews

### 4.10 Survey Completion Confirmation
- [ ] Create `pages/SurveyTaking/SurveyComplete.jsx`
- [ ] Display confirmation message after submission
- [ ] Show submission information:
  - Survey completion confirmation
  - Submission timestamp
  - Survey ID/Reference number
  - Summary of responses (optional)
- [ ] Provide navigation options:
  - View submitted survey (read-only)
  - Take another survey
  - Return to dashboard
  - Create deficiency from responses (if applicable)

### 4.11 View Submitted Survey
- [ ] Create read-only view of submitted survey
- [ ] Display all sections and answers
- [ ] Show completion information
- [ ] Allow creating deficiencies from responses
- [ ] Allow linking to related deficiencies

## Components to Create

### Pages
- `pages/SurveyTaking/SurveyInstanceList.jsx`
- `pages/SurveyTaking/TakeSurvey.jsx`
- `pages/SurveyTaking/SurveyComplete.jsx`
- `pages/SurveyTaking/ViewSurveyInstance.jsx`

### Components
- `components/SurveyTaking/ProgressIndicator.jsx`
- `components/SurveyTaking/SectionNavigation.jsx`
- `components/SurveyTaking/QuestionRenderer.jsx`
- `components/SurveyTaking/QuestionTypes/RadioQuestion.jsx`
- `components/SurveyTaking/QuestionTypes/CheckboxQuestion.jsx`
- `components/SurveyTaking/QuestionTypes/TextQuestion.jsx`
- `components/SurveyTaking/QuestionTypes/TextareaQuestion.jsx`
- `components/SurveyTaking/AutoSaveIndicator.jsx`
- `components/SurveyTaking/ReviewScreen.jsx`

### Hooks
- `hooks/useAutoSave.js` - Auto-save functionality
- `hooks/useSurveyProgress.js` - Progress tracking

## Functional Requirements (from SRS)

### FR-ST-2.1: Survey Access
- Display list of published surveys
- Filter/search available surveys

### FR-ST-2.2: Starting a Survey
- Create new survey instance
- Store survey response record with metadata

### FR-ST-2.3: Survey Navigation
- Section-by-section navigation
- Progress indicator
- Section menu/table of contents

### FR-ST-2.4: Answering Questions
- Display questions based on type
- Validate answers in real-time
- Show help text/instructions

### FR-ST-2.6: Auto-Save Progress
- Auto-save on field blur, periodic (30s), section navigation
- Show save status
- Handle errors gracefully

### FR-ST-2.7: Resume Incomplete Survey
- Display in-progress surveys
- Continue from last completed question
- Restart option

### FR-ST-2.9: Required Questions Validation
- Identify required questions
- Prevent submission if unanswered
- Highlight missing required questions

### FR-ST-2.10: Review Before Submission
- Review screen with summary
- Edit answers from review

### FR-ST-2.11: Survey Submission
- Validate before submission
- Confirmation dialog
- Lock responses after submission

## Notes
- Auto-save is critical - users should never lose progress
- Progress tracking is important for long surveys
- Review screen is essential before final submission
- Must support surveys with 100+ questions
- Mobile-friendly interface required

