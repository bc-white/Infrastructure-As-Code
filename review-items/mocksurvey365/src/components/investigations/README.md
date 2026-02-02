# Investigations Component Architecture

## Component Structure

```
Investigations.jsx (Main Component)
│
├── Header & Controls
│   ├── Team Lead Controls
│   ├── Team Member Controls
│   └── Manage Team Members Button
│
├── Main Layout (Grid)
│   │
│   ├── Left Panel: ResidentListPanel
│   │   ├── View Mode Toggle (By Resident / By Care Area)
│   │   ├── Search & Filters
│   │   └── Resident List
│   │       └── Resident Card
│   │           ├── Name & Room
│   │           ├── Assigned Team Member
│   │           ├── Investigation Count
│   │           ├── Risk Recommendations
│   │           └── Risk Factors
│   │
│   └── Right Panel: InvestigationWorkspace
│       ├── Resident Header
│       │   ├── Name & Room
│       │   ├── Diagnosis
│       │   ├── Selection Reason
│       │   └── Assigned Team Member
│       │
│       ├── Resident Summary
│       │   ├── Total Investigations
│       │   ├── Pending Count
│       │   ├── In Progress Count
│       │   ├── Completed Count
│       │   └── Priority Summary
│       │
│       └── Investigation Content (Children)
│           ├── Investigation List
│           ├── Investigation Details
│           ├── Probe Management
│           └── CE Pathway Assessment
│
└── Modals
    ├── BodyMapModal
    ├── WeightCalculatorModal
    ├── ScopeSeverityModal
    ├── DeficiencyDraftingModal
    └── TeamMemberManagementModal
```

## State Management

### Custom Hook: `useInvestigationsState`

Manages all component state including:
- Search and filters
- Modal visibility states
- Investigation data
- Resident data
- Team member data
- UI state (loading, errors, etc.)

### Props Flow

```
Parent Component
    ↓
Investigations
    ↓
    ├── ResidentListPanel (Left)
    │   - Receives: search, filters, residents, handlers
    │   - Emits: resident selection
    │
    └── InvestigationWorkspace (Right)
        - Receives: selectedResident, investigations, handlers
        - Renders: investigation details and actions
```

## Utility Functions

### `investigationHelpers.js`

Core utility functions for:
- User management
- Investigation calculations
- Data filtering
- Status management

## Key Features

### Left Panel (ResidentListPanel)
- ✅ Resident search and filtering
- ✅ View mode toggle (By Resident / By Care Area)
- ✅ Display assigned team members
- ✅ Show investigation counts
- ✅ Display risk recommendations
- ✅ Visual selection indicators

### Right Panel (InvestigationWorkspace)
- ✅ Resident information header
- ✅ Investigation statistics summary
- ✅ Priority-based organization
- ✅ Investigation status tracking
- ✅ Flexible content rendering (children pattern)

## Integration Example

```jsx
import { useInvestigationsState } from "../../hooks/investigations";
import { ResidentListPanel, InvestigationWorkspace } from "../../components/investigations/panels";

const Investigations = (props) => {
  const state = useInvestigationsState(props.surveyData);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ResidentListPanel
        viewMode={state.viewMode}
        setViewMode={state.setViewMode}
        searchTerm={state.searchTerm}
        setSearchTerm={state.setSearchTerm}
        {...otherProps}
      />

      <InvestigationWorkspace
        selectedResident={selectedResident}
        investigations={state.investigations}
        {...otherProps}
      >
        {/* Investigation content */}
      </InvestigationWorkspace>
    </div>
  );
};
```

## Benefits

1. **Modularity** - Each component has a single responsibility
2. **Reusability** - Components can be used independently
3. **Testability** - Easier to write unit tests for smaller components
4. **Maintainability** - Changes are isolated to specific files
5. **Performance** - Can optimize individual components
6. **Readability** - Easier to understand component structure

## File Locations

- **Hooks:** `src/hooks/investigations/`
- **Utils:** `src/utils/investigations/`
- **Components:** `src/components/investigations/panels/`
- **Modals:** `src/components/investigations/`

## Next Steps for Further Refactoring

1. Break down InvestigationWorkspace into smaller sub-components
2. Extract investigation actions into custom hooks
3. Create separate components for modals
4. Add comprehensive prop-types or TypeScript types
5. Create unit tests for each component
