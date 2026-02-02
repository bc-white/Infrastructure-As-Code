# Phase 5: Deficiency Tracking (Feature 3)

## Status
**Not Started** - Can be built in parallel with Phase 4

## Overview
Document, track, and manage regulatory deficiencies identified during surveys. Includes Florida-specific severity levels, scope definitions, and compliance tracking.

## Tasks

### 5.1 Deficiency List View
- [ ] Create `pages/Deficiencies/DeficiencyList.jsx`
- [ ] Display table of deficiencies with columns:
  - Regulation tag/reference
  - Deficiency description (truncated)
  - Severity level (badge)
  - Scope (badge)
  - Status (badge)
  - Identified date
  - Due date
  - Assigned to
  - Linked survey (if applicable)
- [ ] Implement filters:
  - Status (Identified, POC Required, POC Submitted, In Remediation, Corrected, Verified, Closed)
  - Severity level (Immediate Jeopardy, Actual Harm, Potential for Harm, No Actual Harm)
  - Scope (Isolated, Pattern, Widespread)
  - Regulation tag/reference (Florida FAC Chapter 58A-5)
  - Date range (identified date)
  - Assigned to (user)
  - Facility (if multi-tenant)
- [ ] Add search functionality (search by description, regulation tag)
- [ ] Add advanced filters (multiple criteria)
- [ ] Add "Create Deficiency" button
- [ ] Add row actions: View, Edit, Create POC, Delete
- [ ] Add bulk actions (bulk status update, bulk assign)
- [ ] Implement pagination
- [ ] Sort by date, severity, status

### 5.2 Deficiency Detail View
- [ ] Create `pages/Deficiencies/DeficiencyDetail.jsx`
- [ ] Create `components/Deficiencies/DeficiencyInfo.jsx` - Basic info display
- [ ] Create `components/Deficiencies/DeficiencyTimeline.jsx` - Status history
- [ ] Create `components/Deficiencies/LinkedDocuments.jsx` - Related documents
- [ ] Create `components/Deficiencies/RelatedPOC.jsx` - Linked POC display
- [ ] Display full deficiency information:
  - Regulation reference with regulation text
  - Deficiency description (full)
  - Severity and scope (Florida-specific)
  - Status and workflow timeline
  - Assigned to user
  - Associated survey (with link)
  - Associated residents (if applicable)
  - Documents/evidence
  - Related POC (if exists)
  - Status history with comments
  - Dates (identified, due, corrected, verified)
- [ ] Add edit button (if user has permission)
- [ ] Add status update functionality
- [ ] Add assign/reassign functionality
- [ ] Add document upload/link functionality
- [ ] Add "Create POC" button (if POC doesn't exist)

### 5.3 Create/Edit Deficiency
- [ ] Create `pages/Deficiencies/CreateDeficiency.jsx`
- [ ] Create `pages/Deficiencies/EditDeficiency.jsx`
- [ ] Create `components/Deficiencies/DeficiencyForm.jsx` - Form component
- [ ] Implement form fields:
  - Regulation tag/reference (required) - Florida FAC Chapter 58A-5
  - Regulation description/reference (auto-populate if possible)
  - Deficiency description (required, textarea)
  - Severity level (required, dropdown) - Florida-specific:
    - Immediate Jeopardy
    - Actual Harm
    - Potential for Harm
    - No Actual Harm
  - Scope (required, dropdown) - Florida-specific:
    - Isolated
    - Pattern
    - Widespread
  - Survey date and surveyor name
  - Associated survey instance (optional, dropdown)
  - Associated resident(s) (optional, future enhancement)
  - Identified date (default: today)
  - Due date (auto-calculated based on severity)
  - Assigned to (dropdown of users)
  - State/jurisdiction (locked to "Florida")
- [ ] Auto-calculate due dates based on severity:
  - Immediate Jeopardy: 24 hours (per Florida regulations)
  - Actual Harm: 30 days for POC
  - Potential for Harm: 45 days for POC
  - No Actual Harm: 90 days for POC
- [ ] Allow creating from survey response:
  - Pre-populate from survey
  - Link to specific survey question/response
  - Extract regulation reference from survey question
- [ ] Implement validation
- [ ] Save as draft or submit

### 5.4 Deficiency Status Tracking
- [ ] Implement status workflow:
  - Identified (newly found)
  - POC Required (awaiting plan of correction)
  - POC Submitted (plan submitted, awaiting approval)
  - POC Approved (plan approved)
  - In Remediation (corrective actions in progress)
  - Corrected (actions completed, awaiting verification)
  - Verified (surveyor verified correction)
  - Closed (deficiency resolved and closed)
- [ ] Allow status updates with comments/notes
- [ ] Track status change history:
  - Previous status
  - New status
  - Changed by (user)
  - Changed date/time
  - Comments
- [ ] Display status timeline/history

### 5.5 Deficiency Assignment
- [ ] Allow assigning deficiencies to responsible parties
- [ ] Support assignment to roles:
  - DON (Director of Nursing/Health Services)
  - Compliance Officer
  - Facility Administrator
  - Department Heads
  - Specific staff members
- [ ] Allow reassignment
- [ ] Send notifications to assignees:
  - New deficiency assigned
  - Status changes
  - Approaching deadlines
  - Overdue deficiencies

### 5.6 Deficiency Prioritization
- [ ] Automatically prioritize by severity
- [ ] Calculate due dates based on Florida-specific severity requirements
- [ ] Display priority indicators (color coding, badges)
- [ ] Send alerts for upcoming deadlines (90, 60, 30, 7 days before due)
- [ ] Identify and highlight overdue deficiencies

### 5.7 Deficiency Dashboard
- [ ] Create `pages/Deficiencies/DeficiencyDashboard.jsx`
- [ ] Display overview metrics:
  - Total deficiencies by status (chart/graph)
  - Deficiencies by severity (chart/graph)
  - Deficiencies by scope (chart/graph)
  - Overdue deficiencies count
  - Upcoming deadlines (next 30 days)
  - Recent activity feed
- [ ] Add charts/graphs:
  - Bar chart: Deficiencies by status
  - Pie chart: Deficiencies by severity
  - Bar chart: Deficiencies by scope
  - Line chart: Trends over time
- [ ] Quick access to:
  - All deficiencies
  - Overdue items
  - Pending POC
  - Recent activity

### 5.8 Deficiency Export
- [ ] Implement export functionality (PDF/Excel)
- [ ] Export includes:
  - Deficiency details
  - Status information
  - Timeline/history
  - Associated documents (optional)
- [ ] Support date range filtering for export

### 5.9 Deficiency Notifications
- [ ] Create notification system for deficiencies
- [ ] Send notifications for:
  - New deficiencies assigned
  - Status changes
  - Approaching deadlines (90, 60, 30, 7 days before due)
  - Overdue deficiencies
  - POC approval/rejection
- [ ] In-app notifications
- [ ] Email notifications (future enhancement)

## Components to Create

### Pages
- `pages/Deficiencies/DeficiencyList.jsx`
- `pages/Deficiencies/DeficiencyDetail.jsx`
- `pages/Deficiencies/CreateDeficiency.jsx`
- `pages/Deficiencies/EditDeficiency.jsx`
- `pages/Deficiencies/DeficiencyDashboard.jsx`

### Components
- `components/Deficiencies/DeficiencyInfo.jsx`
- `components/Deficiencies/DeficiencyForm.jsx`
- `components/Deficiencies/DeficiencyTimeline.jsx`
- `components/Deficiencies/LinkedDocuments.jsx`
- `components/Deficiencies/RelatedPOC.jsx`
- `components/Deficiencies/DeficiencyFilters.jsx`
- `components/Deficiencies/SeverityBadge.jsx`
- `components/Deficiencies/ScopeBadge.jsx`
- `components/Deficiencies/StatusBadge.jsx`

### Shared UI Components Needed
- `components/ui/select.jsx` - Select dropdown
- `components/ui/textarea.jsx` - Textarea
- `components/ui/badge.jsx` - Status badges
- `components/ui/date-picker.jsx` - Date picker

## Functional Requirements (from SRS)

### FR-DT-3.1: Deficiency Creation
- Create from survey or manually
- All required fields including Florida regulation tags

### FR-DT-3.2: Deficiency Status Tracking
- Track status workflow with history
- Status updates with comments

### FR-DT-3.3: Deficiency Prioritization
- Auto-prioritize by severity
- Calculate due dates (Florida-specific timelines)

### FR-DT-3.4: Deficiency Assignment
- Assign to responsible parties
- Notifications to assignees

### FR-DT-3.5: Deficiency Search and Filtering
- Search/filter by multiple criteria
- Advanced filters

### FR-DT-3.6: Deficiency Details View
- Display all deficiency information
- Related documents and POC

### FR-DT-3.8: Deficiency Notifications
- Notifications for various events
- Deadline alerts

### FR-DT-3.10: Deficiency Dashboard
- Overview metrics and charts
- Quick access to key items

## Florida-Specific Requirements
- Severity levels: Immediate Jeopardy, Actual Harm, Potential for Harm, No Actual Harm
- Scope: Isolated, Pattern, Widespread
- Regulation framework: Florida Administrative Code (FAC) Chapter 58A-5
- Due dates based on Florida regulations (24 hours for Immediate Jeopardy, etc.)

## Notes
- Florida regulations are critical - must use correct severity and scope definitions
- Status workflow must be clear and trackable
- Deadline calculations must match Florida regulations
- Integration with surveys and POCs is important

