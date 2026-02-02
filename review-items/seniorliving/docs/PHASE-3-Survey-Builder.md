# Phase 3: Survey Builder (Feature 1)

## Status
**Not Started**

## Overview
Tool for creating and managing regulatory survey templates tailored for Florida Assisted Living Facilities. This is a core MVP feature.

## Tasks

### 3.1 Survey List View
- [ ] Create `pages/Surveys/SurveyList.jsx`
- [ ] Display table of surveys with columns:
  - Survey title
  - Survey type (Standard, Complaint Investigation, Follow-up, Abbreviated, Pre-licensing)
  - Status (Draft, Published, Archived)
  - Last modified date
  - Created by
  - Number of instances
- [ ] Add filters (status, type, date range)
- [ ] Add search functionality
- [ ] Add "Create New Survey" button
- [ ] Add row actions: Edit, Duplicate, Archive, Delete
- [ ] Add bulk actions (bulk archive, bulk delete)
- [ ] Implement pagination

### 3.2 Survey Creation/Editing
- [ ] Create `pages/Surveys/SurveyBuilder.jsx`
- [ ] Create `components/Surveys/SurveyMetadataForm.jsx` - Survey basic info
- [ ] Create `components/Surveys/SectionManager.jsx` - Manage sections
- [ ] Create `components/Surveys/QuestionEditor.jsx` - Question builder
- [ ] Create `components/Surveys/QuestionTypeSelector.jsx` - Select question type
- [ ] Create `components/Surveys/RegulationSelector.jsx` - Link Florida regulations
- [ ] Implement survey metadata fields:
  - Survey title (required)
  - Description/purpose
  - Survey type (dropdown)
  - State/jurisdiction (locked to "Florida")
  - Status (Draft/Published/Archived)
  - Regulation tags/references (Florida FAC Chapter 58A-5)
- [ ] Implement section management:
  - Add section button
  - Section title and description
  - Section order/position (drag-and-drop)
  - Delete section
  - Nested sections (subsections) support
  - Regulation reference per section
- [ ] Implement question management:
  - Add question button
  - Question text input
  - Question type selector
  - Required/optional toggle
  - Help text/instructions field
  - Regulation reference selector
  - Question options configuration (for choice types)
  - Delete question
  - Reorder questions (drag-and-drop)
  - Question validation rules

### 3.3 Question Types (MVP)
- [ ] **Single Choice (Radio)** - Yes/No, Yes/No/N/A, Custom options
- [ ] **Multiple Choice (Checkbox)** - Multiple selections
- [ ] **Text Input** - Single-line text with character limit
- [ ] **Text Area** - Multi-line text with character limit
- [ ] **Date Picker** - Date selection (future enhancement)
- [ ] **File Upload** - Document/photo upload (future enhancement)
- [ ] **Rating Scale** - Numeric scale (future enhancement)
- [ ] **Matrix/Grid** - Grid of questions (future enhancement)

### 3.4 Survey Preview
- [ ] Create `pages/Surveys/SurveyPreview.jsx`
- [ ] Display survey as it will appear to users
- [ ] Show all sections and questions
- [ ] Read-only mode (no data saved)
- [ ] Show regulation references
- [ ] Test conditional logic (Phase 2 feature)

### 3.5 Survey Publishing
- [ ] Validate required fields before publishing:
  - Survey must have at least one section
  - Each section must have at least one question
  - All required fields must have validation rules
  - State/jurisdiction must be "Florida"
- [ ] Publish survey (make available to take)
- [ ] Unpublish survey (prevent new instances)
- [ ] Archive survey
- [ ] Prevent editing published surveys directly (create new version)

### 3.6 Survey Duplication & Versioning
- [ ] Implement duplicate/copy survey functionality
- [ ] Duplicate individual sections or questions
- [ ] Duplicated surveys start as "Draft"
- [ ] Track version history (future enhancement)
- [ ] View previous versions (future enhancement)

## Components to Create

### Pages
- `pages/Surveys/SurveyList.jsx`
- `pages/Surveys/SurveyBuilder.jsx`
- `pages/Surveys/SurveyPreview.jsx`

### Components
- `components/Surveys/SurveyMetadataForm.jsx`
- `components/Surveys/SectionManager.jsx`
- `components/Surveys/SectionForm.jsx`
- `components/Surveys/QuestionEditor.jsx`
- `components/Surveys/QuestionTypeSelector.jsx`
- `components/Surveys/QuestionOptionsForm.jsx`
- `components/Surveys/RegulationSelector.jsx`
- `components/Surveys/DragDropList.jsx` (for reordering)

### Shared UI Components Needed
- `components/ui/select.jsx` - Select dropdown
- `components/ui/textarea.jsx` - Textarea
- `components/ui/table.jsx` - Data table
- `components/ui/dialog.jsx` - Modal dialogs
- `components/ui/tooltip.jsx` - Tooltips
- `components/ui/switch.jsx` - Toggle switches

## Functional Requirements (from SRS)

### FR-SB-1.1: Survey Creation
- Survey title, description, type, state (Florida), regulation tags, status, facility reference

### FR-SB-1.2: Florida-Specific Configuration
- State locked to Florida
- Regulation framework: Florida Administrative Code (FAC) Chapter 58A-5
- Florida-specific regulation tag format
- Florida-specific severity and scope definitions

### FR-SB-1.3: Survey Sections
- Add/remove sections
- Reorder sections (drag-and-drop)
- Nested sections (subsections)
- Section-specific regulation references

### FR-SB-1.4: Question Management
- Add/edit/delete questions
- Reorder questions
- Question properties (text, type, required, help text, regulation reference)

### FR-SB-1.5: Question Types
- MVP: Radio, Checkbox, Text, Textarea
- Phase 2: Date Picker, File Upload, Rating Scale, Matrix

### FR-SB-1.6: Regulation Reference System
- Link questions to Florida regulations (FAC Chapter 58A-5)
- Add regulation text/description
- Facility-specific custom regulations support

### FR-SB-1.7: Question Options
- Configure answer options for choice questions
- Add/remove/reorder options
- "Other" option with text input

### FR-SB-1.11: Survey Publishing
- Validate before publishing
- Publish/unpublish functionality
- Archive surveys

## Notes
- This is a core MVP feature - must be fully functional
- Focus on MVP question types first (Radio, Checkbox, Text, Textarea)
- Drag-and-drop for reordering is important for UX
- Florida regulations must be integrated

