# Phase 3: Survey Builder - Implementation Plan

## Analysis & Overview

### Complexity Assessment
**High Complexity Feature** - This is a multi-faceted feature requiring:
- Complex nested data structures (Surveys → Sections → Questions → Options)
- Drag-and-drop functionality for reordering
- Dynamic form generation based on question types
- Validation at multiple levels
- State management for complex editing workflows

### Key Challenges
1. **Data Structure Management**: Nested survey structure (survey → sections → questions → options)
2. **State Management**: Managing draft changes, validation, and saving
3. **Drag-and-Drop**: Reordering sections and questions
4. **Question Type System**: Different UI for each question type
5. **Regulation Integration**: Linking to Florida regulations (FAC Chapter 58A-5)
6. **Versioning**: Preventing edits to published surveys

## Data Structure Design

### Survey Model
```javascript
{
  id: string,
  title: string,
  description: string,
  type: "Standard" | "Complaint Investigation" | "Follow-up" | "Abbreviated" | "Pre-licensing",
  state: "Florida", // Locked to Florida
  status: "Draft" | "Published" | "Archived",
  facilityId: string | null,
  createdBy: string, // userId
  createdAt: timestamp,
  updatedAt: timestamp,
  lastModifiedBy: string,
  regulationReferences: string[], // Array of FAC references
  sections: Section[]
}

### Section Model
{
  id: string,
  surveyId: string,
  title: string,
  description: string,
  order: number,
  regulationReference: string | null, // FAC reference
  parentSectionId: string | null, // For nested sections
  questions: Question[]
}

### Question Model
{
  id: string,
  sectionId: string,
  text: string,
  type: "radio" | "checkbox" | "text" | "textarea" | "date" | "file" | "rating" | "matrix",
  required: boolean,
  helpText: string,
  regulationReference: string | null,
  order: number,
  validation: {
    minLength?: number,
    maxLength?: number,
    min?: number,
    max?: number,
    pattern?: string
  },
  options?: QuestionOption[] // For choice types
}

### QuestionOption Model (for radio/checkbox)
{
  id: string,
  questionId: string,
  label: string,
  value: string,
  order: number,
  hasOther?: boolean // For "Other" option with text input
}
```

## Implementation Strategy

### Phase 3.1: Core Structure (MVP)
**Goal**: Get basic survey creation working end-to-end

1. **Data Layer**:
   - Create mock data service: `src/services/mockSurveyService.js`
   - Create mock data: `src/data/mockSurveys.json`
   - CRUD operations for surveys, sections, questions

2. **Survey List Page**:
   - Basic table view with columns
   - Search and filters (simplified)
   - Create new survey button
   - Navigate to builder

3. **Survey Builder - Basic Flow**:
   - Survey metadata form (title, description, type)
   - Simple section management (add/remove sections)
   - Simple question management (add/remove questions)
   - Basic question types (Radio, Checkbox, Text, Textarea)
   - Save as draft
   - Preview functionality

4. **Survey Preview**:
   - Read-only view of survey structure
   - Shows all sections and questions
   - No interaction, just display

### Phase 3.2: Enhanced Features
**Goal**: Add polish and advanced features

1. **Drag-and-Drop**:
   - Install `@dnd-kit/core` or `react-beautiful-dnd`
   - Reorder sections
   - Reorder questions within sections

2. **Advanced Question Types**:
   - Question options configuration UI
   - Validation rules UI
   - Help text editor
   - "Other" option support

3. **Regulation Integration**:
   - Regulation selector component
   - Link regulations to sections/questions
   - Display regulation references in preview

4. **Publishing Flow**:
   - Validation before publish
   - Publish/unpublish functionality
   - Archive functionality
   - Prevent editing published surveys

5. **Advanced Features**:
   - Duplicate survey
   - Bulk actions in list view
   - Better filtering and search
   - Pagination

## Component Architecture

### Pages
```
src/pages/Surveys/
  ├── SurveyList.jsx          # List view with table
  ├── SurveyBuilder.jsx       # Main builder interface
  └── SurveyPreview.jsx       # Preview mode
```

### Components
```
src/components/Surveys/
  ├── SurveyMetadataForm.jsx     # Survey info (title, type, etc.)
  ├── SectionManager.jsx         # Manage sections list
  ├── SectionForm.jsx            # Add/edit section
  ├── QuestionEditor.jsx         # Main question editor
  ├── QuestionTypeSelector.jsx   # Select question type
  ├── QuestionOptionsForm.jsx    # Configure options for choice questions
  ├── RegulationSelector.jsx     # Select regulation references
  ├── DragDropList.jsx           # Reusable drag-drop component
  └── SurveyPreviewView.jsx      # Preview display component
```

## Implementation Order (Recommended)

### Sprint 1: Foundation
1. ✅ Create mock data service and data files
2. ✅ Create Survey List page (basic table)
3. ✅ Create Survey Builder page structure
4. ✅ Survey metadata form

### Sprint 2: Core Builder
1. ✅ Section management (add/remove/edit)
2. ✅ Question management (add/remove/edit)
3. ✅ Basic question types (Text, Textarea)
4. ✅ Save/load functionality

### Sprint 3: Question Types
1. ✅ Radio button questions
2. ✅ Checkbox questions
3. ✅ Question options configuration
4. ✅ Required/optional toggle

### Sprint 4: Polish & Advanced
1. ✅ Drag-and-drop reordering
2. ✅ Regulation selector
3. ✅ Preview page
4. ✅ Publishing flow

## Technical Decisions

### State Management
- **Local Component State**: For form editing (useState)
- **Context API**: For survey builder state (optional - may not need)
- **Mock Service**: All CRUD operations through `mockSurveyService.js`

### Drag-and-Drop Library
- **Option 1**: `@dnd-kit/core` + `@dnd-kit/sortable` (recommended)
  - Modern, accessible, good TypeScript support
  - Lighter weight than react-beautiful-dnd
  
- **Option 2**: `react-beautiful-dnd`
  - More mature, but heavier
  - May have React 18 compatibility issues

### Question Type System
- Use a factory pattern or switch statement
- Each question type has its own configuration form
- Store type-specific data in question.options or question.config

### Validation Strategy
- Survey-level validation before publish
- Section-level validation (must have title)
- Question-level validation (must have text, valid options)
- Real-time validation feedback in builder

### Data Persistence
- Use localStorage for mock data (matching auth pattern)
- Separate storage keys for surveys, sections, questions
- Implement auto-save as draft (optional enhancement)

## UI/UX Considerations

### Builder Layout
- **Left Sidebar**: Sections list (collapsible)
- **Main Area**: Current section/questions
- **Right Sidebar**: Question editor/form (when question selected)
- **Top Bar**: Survey metadata, save, preview, publish actions

### Question Editor
- Modal or slide-in panel for editing
- Tabs or accordion for different question properties
- Live preview of question appearance

### List View
- Shadcn Table component
- Search bar at top
- Filter chips
- Bulk selection checkbox
- Action dropdown per row

## Next Steps

1. **Create Implementation Plan Document** (this file) ✅
2. **Set up mock data service**
3. **Build Survey List page** (starting point)
4. **Build Survey Builder foundation**
5. **Iteratively add features**

## Missing UI Components Needed

Based on the requirements, we need to create these Shadcn UI components:

1. **`components/ui/table.jsx`** - Data table for survey list
2. **`components/ui/textarea.jsx`** - Textarea for descriptions
3. **`components/ui/select.jsx`** - Select dropdown (can use Combobox instead)
4. **`components/ui/switch.jsx`** - Toggle switch for required/optional
5. **`components/ui/tooltip.jsx`** - Tooltips for help text
6. **`components/ui/checkbox.jsx`** - Checkbox for bulk selection
7. **`components/ui/radio-group.jsx`** - Radio group for question types

## Dependencies to Install

- **`@dnd-kit/core`** - Core drag-and-drop functionality
- **`@dnd-kit/sortable`** - Sortable list functionality
- **`@dnd-kit/utilities`** - Utility functions for dnd-kit

## Implementation Recommendations

### MVP Scope (Phase 3.1)
**Focus on getting core functionality working first:**

1. **Start Simple**: 
   - No nested sections in MVP (add later if needed)
   - No drag-and-drop initially (use up/down arrows)
   - Basic validation only

2. **Question Types Priority**:
   - MVP: Text, Textarea, Radio, Checkbox (4 types)
   - Phase 2: Date, File Upload, Rating, Matrix

3. **Regulation References**:
   - Make optional in MVP (can link later)
   - Use simple text input or combobox for FAC references
   - Full regulation selector can be Phase 2

4. **Auto-Save**:
   - Manual save only in MVP
   - Auto-save as draft can be enhancement later

### Data Storage Structure

**LocalStorage Keys** (following mockAuthService pattern):
```javascript
const STORAGE_KEYS = {
  SURVEYS: 'mock_surveys',
  SECTIONS: 'mock_sections', 
  QUESTIONS: 'mock_questions',
  QUESTION_OPTIONS: 'mock_question_options'
}
```

**Alternative**: Store everything nested in surveys array (simpler for MVP):
- Each survey has sections array
- Each section has questions array  
- Each question has options array (if choice type)

**Recommendation**: Start with nested structure (simpler), refactor later if needed.

## Key Design Decisions

### 1. Builder Layout Options

**Option A: Three-Panel Layout** (Recommended)
```
┌──────────────┬─────────────────────┬──────────────┐
│   Sections   │   Questions List    │   Question   │
│   Sidebar    │   (Main Area)       │   Editor     │
│              │                     │   (Panel)    │
└──────────────┴─────────────────────┴──────────────┘
```

**Option B: Two-Panel Layout**
```
┌──────────────┬──────────────────────────────────────┐
│   Sections   │   Questions List                    │
│   Sidebar    │   Question Editor (Modal/Slide-in)  │
└──────────────┴──────────────────────────────────────┘
```

**Recommendation**: Start with Option B (simpler), move to Option A if needed.

### 2. Question Editor Approach

**Option A: Modal Dialog**
- Click question → opens modal
- Edit and save
- Simple but interrupts flow

**Option B: Slide-in Panel**
- Click question → panel slides in from right
- Edit and save
- Better for longer forms

**Option C: Inline Editing**
- Edit directly in place
- Most seamless
- Complex state management

**Recommendation**: Start with Option A (modal), upgrade to Option B later.

### 3. Section Management

**Option A: Separate Page/View**
- Click section → navigate to section view
- Edit all questions in that section
- Good for large surveys

**Option B: All in One View**
- Show all sections and questions
- Collapsible sections
- Better for small surveys

**Recommendation**: Start with Option B (simpler), add Option A if needed.

## Questions to Consider

1. **Nested Sections**: Should we support nested sections in MVP or later?
   - **Recommendation**: Not in MVP - add later if needed

2. **Auto-Save**: Should auto-save be implemented from the start?
   - **Recommendation**: Manual save in MVP, auto-save as enhancement

3. **Question Types**: What's the minimum viable question types for MVP?
   - **Recommendation**: Text, Textarea, Radio, Checkbox (4 types)

4. **Regulation References**: Should regulation references be mandatory or optional?
   - **Recommendation**: Optional in MVP, can link later

5. **Survey Templates**: How should we handle survey templates/libraries?
   - **Recommendation**: Duplicate functionality for MVP, template library later

6. **Published Survey Editing**: How to handle editing published surveys?
   - **Recommendation**: Prevent direct edits, require creating new version (duplicate + edit)

## Risk Assessment

### High Risk Areas
1. **Complex State Management**: Managing nested survey state
   - Mitigation: Start simple, use local state, refactor if needed

2. **Drag-and-Drop Complexity**: Reordering sections/questions
   - Mitigation: Use up/down arrows in MVP, add drag-drop later

3. **Question Type System**: Different UI for each type
   - Mitigation: Use factory pattern, start with 4 types

### Medium Risk Areas
1. **Validation at Multiple Levels**: Survey, section, question
   - Mitigation: Use helper functions, validate before save

2. **Large Survey Performance**: 100+ questions
   - Mitigation: Implement pagination/virtualization if needed

## Success Criteria

**Phase 3.1 MVP Complete When:**
- ✅ Can create new survey with metadata
- ✅ Can add/remove sections
- ✅ Can add/remove questions  
- ✅ Can configure 4 question types (Text, Textarea, Radio, Checkbox)
- ✅ Can save survey as draft
- ✅ Can preview survey
- ✅ Can publish survey (with validation)
- ✅ Survey list shows all surveys with basic info

**Phase 3.2 Enhancements:**
- ✅ Drag-and-drop reordering
- ✅ Regulation reference linking
- ✅ Duplicate survey functionality
- ✅ Advanced question options ("Other" option)
- ✅ Bulk actions in list view
- ✅ Better filtering and search

