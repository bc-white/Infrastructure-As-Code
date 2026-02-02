# Phase 6: Plan of Correction Builder (Feature 4)

## Status
**Not Started** - Depends on Phase 5 (Deficiency Tracking)

## Overview
Create, manage, and track Plans of Correction for identified deficiencies. Includes root cause analysis, corrective actions, prevention measures, and approval workflow.

## Tasks

### 6.1 POC List View
- [ ] Create `pages/POC/POCList.jsx`
- [ ] Display table of POCs with columns:
  - Related deficiency (with link)
  - Regulation tag
  - Status (badge)
  - Submitted date
  - Approved date (if approved)
  - Created by
  - Implementation progress
- [ ] Add filters:
  - Status (Draft, Under Review, Approved Internally, Submitted, Approved by Surveyor, Rejected)
  - Linked deficiency
  - Date range
  - Assigned to
- [ ] Add search functionality
- [ ] Add "Create POC" button
- [ ] Add row actions: View, Edit (if draft), Delete
- [ ] Implement pagination

### 6.2 POC Builder
- [ ] Create `pages/POC/POCBuilder.jsx`
- [ ] Create `components/POC/RootCauseAnalysis.jsx` - Root cause text field
- [ ] Create `components/POC/CorrectiveActionsList.jsx` - Manage actions
- [ ] Create `components/POC/CorrectiveActionForm.jsx` - Add/edit actions
- [ ] Create `components/POC/PreventionMeasures.jsx` - Prevention field
- [ ] Create `components/POC/POCTimeline.jsx` - Visual timeline/Gantt
- [ ] Implement POC form:
  - Link to deficiency (required, pre-selected if created from deficiency)
  - Root cause analysis (required, textarea)
  - Prevention measures (required, structured format)
  - Corrective actions list
  - Implementation timeline
- [ ] Implement corrective actions:
  - Add action button
  - Action description (required, textarea)
  - Person responsible (required, dropdown)
  - Start date (required, date picker)
  - Target completion date (required, date picker)
  - Status (Not Started, In Progress, Completed, Verified)
  - Completion date (auto-set when marked complete)
  - Verification notes (when verified)
  - Edit action (before POC submission)
  - Delete action (before POC submission)
- [ ] Implement prevention measures field:
  - Policy/procedure updates
  - Training required
  - Process changes
  - Monitoring systems
  - Structured format with checkboxes or text areas
- [ ] Validate timeline (start date before completion date)
- [ ] Calculate overall POC timeline (earliest start to latest completion)

### 6.3 POC Approval Workflow
- [ ] Implement status workflow:
  - Draft (being created)
  - Under Review (submitted for internal review)
  - Approved Internally (ready for submission)
  - Submitted (submitted to surveyor/regulator)
  - Approved by Surveyor/Regulator
  - Rejected (requires revision)
- [ ] Add approval interface:
  - Submit for internal review button
  - Approve internally button
  - Submit to surveyor button
  - Approve/reject buttons (for surveyor)
- [ ] Implement electronic signatures:
  - Signature fields for approvals
  - Signature capture/upload
- [ ] Maintain approval audit trail:
  - Who approved/rejected
  - When
  - Comments/notes
- [ ] Send notifications at each workflow stage

### 6.4 POC Submission
- [ ] Validate all required fields before submission
- [ ] Generate formatted POC document (PDF)
- [ ] Format according to state requirements (Florida)
- [ ] Include all required information:
  - Deficiency information
  - Root cause analysis
  - All corrective actions
  - Timeline
  - Prevention measures
  - Signatures

### 6.5 Implementation Tracking
- [ ] Create `pages/POC/POCDetail.jsx` - Full POC view
- [ ] Track implementation progress:
  - Show all corrective actions
  - Display action statuses
  - Show progress percentage
- [ ] Allow updating action status:
  - Mark as "In Progress"
  - Mark as "Completed" (with completion notes)
  - Add verification notes
- [ ] Send reminders for upcoming deadlines
- [ ] Display timeline/Gantt chart of implementation
- [ ] Show overdue actions

### 6.6 POC Verification
- [ ] Allow surveyor/verifier to verify corrective actions
- [ ] Add verification notes for each action
- [ ] Mark actions as verified individually
- [ ] Mark entire POC as verified
- [ ] Track verification date and verifier
- [ ] Display verification status

### 6.7 POC Document Export
- [ ] Implement PDF export functionality
- [ ] Export includes:
  - Deficiency information
  - Root cause analysis
  - All corrective actions with details
  - Timeline
  - Prevention measures
  - Signatures and approval history
- [ ] Format according to Florida state requirements

### 6.8 POC Templates (Future Enhancement)
- [ ] Provide POC templates for common deficiencies
- [ ] Allow saving custom POC templates
- [ ] Apply templates to deficiencies

### 6.9 POC Revision
- [ ] Allow revising rejected POCs
- [ ] Maintain version history
- [ ] Compare versions (future enhancement)
- [ ] Track revision history

### 6.10 POC Linking
- [ ] Link POC to deficiency (required)
- [ ] Link POC to survey (if applicable)
- [ ] Show related deficiencies (if POC addresses multiple)
- [ ] Display POC from deficiency detail page

## Components to Create

### Pages
- `pages/POC/POCList.jsx`
- `pages/POC/POCBuilder.jsx`
- `pages/POC/POCDetail.jsx`
- `pages/POC/EditPOC.jsx`

### Components
- `components/POC/RootCauseAnalysis.jsx`
- `components/POC/CorrectiveActionsList.jsx`
- `components/POC/CorrectiveActionForm.jsx`
- `components/POC/CorrectiveActionItem.jsx`
- `components/POC/PreventionMeasures.jsx`
- `components/POC/POCTimeline.jsx`
- `components/POC/ApprovalWorkflow.jsx`
- `components/POC/ApprovalHistory.jsx`
- `components/POC/SignatureCapture.jsx`
- `components/POC/ImplementationTracker.jsx`

### Shared UI Components Needed
- `components/ui/select.jsx` - Select dropdown
- `components/ui/textarea.jsx` - Textarea
- `components/ui/date-picker.jsx` - Date picker
- `components/ui/badge.jsx` - Status badges
- `components/ui/progress.jsx` - Progress bars

## Functional Requirements (from SRS)

### FR-POC-4.1: POC Creation
- Create POC linked to deficiency
- Template-based creation (future)

### FR-POC-4.2: Corrective Actions
- Multiple actions per deficiency
- Action details: description, responsible, dates, status
- Add/remove/edit actions

### FR-POC-4.3: Root Cause Analysis
- Text field for root cause
- Support multiple paragraphs
- Attach documents as evidence

### FR-POC-4.4: Prevention Measures
- Structured format field
- Policy/procedure updates, training, process changes, monitoring

### FR-POC-4.5: Implementation Timeline
- Timeline for each action
- Visual timeline/Gantt chart
- Overall POC timeline calculation

### FR-POC-4.6: POC Approval Workflow
- Status workflow with approvals
- Electronic signatures
- Approval audit trail
- Notifications

### FR-POC-4.7: POC Submission
- Validate before submission
- Generate formatted PDF document

### FR-POC-4.8: Implementation Tracking
- Track progress
- Update action status
- Reminders for deadlines
- Mark actions complete

### FR-POC-4.9: POC Verification
- Verify corrective actions
- Verification notes
- Track verifier and date

### FR-POC-4.10: POC Document Export
- Export as PDF
- Include all required information
- Format per state requirements

## Notes
- POC workflow must be clear and trackable
- Timeline visualization is important for understanding implementation
- Approval workflow must maintain audit trail
- PDF export must match Florida state requirements
- Integration with deficiencies is critical

