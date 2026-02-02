# Phase 9: Additional Components & Polish

## Status
**Ongoing** - Built alongside other phases

## Overview
Shared UI components, utilities, context providers, and hooks needed across all features.

## Tasks

### 9.1 Shared UI Components
- [ ] Create missing UI components:
  - `components/ui/select.jsx` - Select dropdown
  - `components/ui/textarea.jsx` - Textarea
  - `components/ui/table.jsx` - Data table
  - `components/ui/dialog.jsx` - Modal dialogs
  - `components/ui/toast.jsx` - Toast notifications
  - `components/ui/badge.jsx` - Status badges
  - `components/ui/dropdown-menu.jsx` - Dropdown menus
  - `components/ui/date-picker.jsx` - Date picker
  - `components/ui/file-upload.jsx` - File upload component
  - `components/ui/loading-spinner.jsx` - Loading states
  - `components/ui/skeleton.jsx` - Loading skeletons
  - `components/ui/tooltip.jsx` - Tooltips
  - `components/ui/switch.jsx` - Toggle switches
  - `components/ui/checkbox.jsx` - Checkboxes
  - `components/ui/radio-group.jsx` - Radio groups
  - `components/ui/progress.jsx` - Progress bars
  - `components/ui/separator.jsx` - Separator line
  - `components/ui/tabs.jsx` - Tabs (already exists)
  - `components/ui/card.jsx` - Cards (already exists)
  - `components/ui/button.jsx` - Buttons (already exists)
  - `components/ui/input.jsx` - Inputs (already exists)
  - `components/ui/label.jsx` - Labels (already exists)

### 9.2 Context Providers
- [ ] Create `context/AuthContext.jsx` - Authentication context
  - Auth state management
  - Login/logout functions
  - User data
  - Session management
- [ ] Create `context/UserContext.jsx` - User profile & role context
  - User profile data
  - Role and permissions
  - Facility information
- [ ] Create `context/ThemeContext.jsx` - Theme context (if needed)
  - Light/dark mode
  - Theme preferences

### 9.3 Hooks
- [ ] Create `hooks/useAuth.js` - Authentication hook
  - Use authentication context
  - Check authentication status
  - Get current user
- [ ] Create `hooks/useProtectedRoute.js` - Route protection hook
  - Check if route is protected
  - Verify user has access
  - Redirect if not authorized
- [ ] Create `hooks/useAutoSave.js` - Auto-save hook
  - Auto-save functionality
  - Save on blur, periodic, navigation
  - Save status tracking
- [ ] Create `hooks/usePagination.js` - Pagination hook
  - Pagination logic
  - Page navigation
  - Items per page
- [ ] Create `hooks/useFilters.js` - Filters hook
  - Filter state management
  - Apply filters
  - Reset filters
- [ ] Create `hooks/useDebounce.js` - Debounce hook
  - Debounce function calls
  - Search input debouncing
- [ ] Create `hooks/useLocalStorage.js` - Local storage hook
  - Save/load from local storage
  - Preferences storage
- [ ] Create `hooks/useQuery.js` - Query hook (if needed)
  - URL query parameters
  - Query string management

### 9.4 Utilities
- [ ] Create `utils/formatters.js` - Formatting utilities
  - Date formatting
  - Number formatting
  - Currency formatting
  - File size formatting
- [ ] Create `utils/validators.js` - Validation utilities
  - Email validation
  - Phone validation
  - Required field validation
  - Custom validation rules
- [ ] Create `utils/helpers.js` - Helper functions
  - Array helpers
  - Object helpers
  - String helpers
  - Common utilities
- [ ] Create `utils/constants.js` - Constants
  - User roles
  - Status values
  - Severity levels (Florida-specific)
  - Scope values (Florida-specific)
  - Survey types
  - Document categories
  - Regulation tags (Florida FAC Chapter 58A-5)
- [ ] Create `utils/date.js` - Date utilities
  - Date calculations
  - Date comparisons
  - Date formatting
  - Date parsing

### 9.5 Error Handling
- [ ] Create `components/ErrorBoundary.jsx` - Error boundary component
  - Catch React errors
  - Display error UI
  - Error logging
- [ ] Create `components/ErrorDisplay.jsx` - Error display component
  - Display error messages
  - Error states
  - Retry functionality
- [ ] Create `utils/errorHandler.js` - Error handling utilities
  - Error formatting
  - Error logging
  - Error notification

### 9.6 Loading States
- [ ] Create `components/LoadingSpinner.jsx` - Loading spinner
  - Different sizes
  - Different colors
  - Full-screen loader
- [ ] Create `components/SkeletonLoader.jsx` - Skeleton loaders
  - Text skeleton
  - Card skeleton
  - Table skeleton
- [ ] Create `components/EmptyState.jsx` - Empty state component
  - No data states
  - No results states
  - Custom empty messages

### 9.7 Notifications
- [ ] Create `components/NotificationProvider.jsx` - Notification provider
  - Toast notifications
  - Notification state management
  - Notification queue
- [ ] Create `components/Toast.jsx` - Toast notification component
  - Success toasts
  - Error toasts
  - Warning toasts
  - Info toasts
- [ ] Create `hooks/useToast.js` - Toast hook
  - Show toast notifications
  - Dismiss toasts
  - Toast options

### 9.8 Forms
- [ ] Create `components/FormField.jsx` - Form field wrapper
  - Label, input, error message
  - Consistent styling
  - Validation display
- [ ] Create `components/FormSection.jsx` - Form section wrapper
  - Group form fields
  - Section headers
  - Section descriptions

### 9.9 Modals & Dialogs
- [ ] Create `components/Dialog.jsx` - Dialog component
  - Modal dialogs
  - Confirmation dialogs
  - Form dialogs
  - Full-screen dialogs
- [ ] Create `components/ConfirmDialog.jsx` - Confirmation dialog
  - Confirm actions
  - Cancel/confirm buttons
  - Warning messages

### 9.10 Data Display
- [ ] Create `components/DataTable.jsx` - Data table component
  - Sortable columns
  - Filterable columns
  - Pagination
  - Row actions
- [ ] Create `components/StatusBadge.jsx` - Status badge component
  - Different status colors
  - Status text
  - Icons (optional)

### 9.11 Charts & Visualizations
- [ ] Create `components/Chart.jsx` - Chart wrapper component
  - Bar charts
  - Line charts
  - Pie charts
  - Area charts
- [ ] Create `components/ChartContainer.jsx` - Chart container
  - Chart wrapper
  - Chart controls
  - Chart export

### 9.12 Accessibility
- [ ] Ensure all components are accessible:
  - Keyboard navigation
  - Screen reader support
  - ARIA labels
  - Focus management
  - Color contrast
- [ ] Create `utils/accessibility.js` - Accessibility utilities
  - ARIA helpers
  - Focus management
  - Keyboard shortcuts

### 9.13 Testing (Future)
- [ ] Component tests
- [ ] Integration tests
- [ ] E2E tests

### 9.14 Performance
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Memoization
- [ ] Virtual scrolling (for large lists)

## Components to Create

### UI Components
- All components listed in 9.1

### Context Providers
- `context/AuthContext.jsx`
- `context/UserContext.jsx`
- `context/ThemeContext.jsx` (optional)

### Hooks
- `hooks/useAuth.js`
- `hooks/useProtectedRoute.js`
- `hooks/useAutoSave.js`
- `hooks/usePagination.js`
- `hooks/useFilters.js`
- `hooks/useDebounce.js`
- `hooks/useLocalStorage.js`
- `hooks/useToast.js`

### Utilities
- `utils/formatters.js`
- `utils/validators.js`
- `utils/helpers.js`
- `utils/constants.js`
- `utils/date.js`
- `utils/errorHandler.js`
- `utils/accessibility.js`

### Components
- `components/ErrorBoundary.jsx`
- `components/ErrorDisplay.jsx`
- `components/LoadingSpinner.jsx`
- `components/SkeletonLoader.jsx`
- `components/EmptyState.jsx`
- `components/NotificationProvider.jsx`
- `components/Toast.jsx`
- `components/FormField.jsx`
- `components/FormSection.jsx`
- `components/Dialog.jsx`
- `components/ConfirmDialog.jsx`
- `components/DataTable.jsx`
- `components/StatusBadge.jsx`
- `components/Chart.jsx`
- `components/ChartContainer.jsx`

## Notes
- These components are built alongside other phases as needed
- Focus on reusability and consistency
- Ensure accessibility from the start
- Performance optimization is important
- Testing is important but can come later

