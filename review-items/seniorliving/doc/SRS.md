# **System Requirements Specification (SRS)**
## **Regulatory Survey Management System for Assisted Living Facilities**

---

## **Document Control**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 2.1 | 2025-01-XX | Product Team | Updated for Florida Assisted Living Facilities - MVP Scope |

---

## **1. Introduction**

### **1.1 Purpose**
This SRS defines requirements for a Regulatory Survey Management System for Assisted Living Facilities in Florida. The system includes survey creation, survey-taking, deficiency tracking, plan of correction, compliance analytics, and document management. The system is designed to support Florida state regulatory compliance for Assisted Living Facilities. **Note:** This is a facility-side tool for facilities to manage their own compliance; it is not integrated with Florida state licensing agency systems.

### **1.2 Scope**
1. **Survey Builder** — Create and manage regulatory survey templates (Florida-specific)
2. **Taking Surveys** — Complete surveys digitally
3. **Deficiency Tracking** — Document and track regulatory deficiencies
4. **Plan of Correction Builder** — Create and manage POCs
5. **Compliance Analytics** — Dashboard and reporting
6. **Document Management** — Centralized document repository

**Out of Scope (for MVP):**
- Electronic Health Records (EHR) system integration
- Billing/payment processing
- Staff scheduling
- Resident admission/discharge management
- Integration with Florida state licensing agency systems (SCATSSTEM or other)
- Multi-language support
- Offline capability
- Real-time collaboration on surveys
- AI-powered compliance suggestions

### **1.3 Definitions, Acronyms, and Abbreviations**

| Term | Definition |
|------|------------|
| **ALF** | Assisted Living Facility |
| **State Survey** | Regulatory inspection conducted by state licensing agency |
| **Regulation Tag** | State regulation identifier/reference number (varies by state) |
| **POC** | Plan of Correction |
| **DON** | Director of Nursing / Health Services Coordinator |
| **Survey Builder** | Tool for creating and editing surveys |
| **Survey Template** | Reusable survey structure/format |
| **Survey Instance** | A specific occurrence of a survey being taken |
| **Survey Response** | Answers to survey questions |
| **Deficiency** | Violation of state regulation identified during survey |
| **Immediate Jeopardy** | Situation that has caused or may cause serious injury, harm, impairment, or death (state-defined severity) |
| **Severity Level** | Classification of deficiency severity (varies by state: Immediate Jeopardy, Actual Harm, Potential for Harm, No Actual Harm, etc.) |
| **Scope** | Classification of deficiency scope (Isolated, Pattern, Widespread - varies by state) |
| **Corrective Action** | Steps taken to remedy a deficiency |
| **State Licensing Agency** | State regulatory body responsible for ALF oversight |
| **Licensing Standards** | State-specific regulations governing Assisted Living Facilities |

### **1.4 References**
- Florida Administrative Code (FAC) Chapter 58A-5 - Assisted Living Facilities
- Florida Statutes Chapter 429 - Assisted Living Facilities
- Florida Agency for Health Care Administration (AHCA) regulations and standards
- Florida ALF Survey Protocols and Procedures
- HIPAA Security Rule (45 CFR Parts 160 and 164)
- Florida health and safety codes

**Note:** This MVP is designed specifically for Florida regulations. The system uses Florida-specific regulation tags and compliance requirements.

### **1.5 Document Overview**
Section 2 provides overall system description. Section 3 details functional requirements for each feature. Section 4 covers external interface requirements. Section 5 lists non-functional requirements. Section 6 covers constraints and assumptions.

---

## **2. Overall Description**

### **2.1 Product Perspective**
Web-based application for Florida Assisted Living Facilities to prepare for, manage, and remediate state regulatory surveys. This is a **facility-side tool** that facilities use internally to manage their compliance; it is not integrated with Florida state licensing agency systems (e.g., SCATSSTEM). Includes:
- Survey creation and management (based on Florida regulations)
- Digital survey completion
- Deficiency documentation and tracking
- Plan of correction development
- Compliance monitoring and analytics
- Document management

**System Architecture:**
- Web Application (React + TanStack Router)
- Mobile Application (React Native/Expo) - Future consideration
- Backend API (Convex)
- Authentication (Clerk)
- Document Storage (TBD - AWS S3 or similar)

**Important:** This system is designed for facilities to use internally. Florida state surveyors will not use this system; facilities use it to prepare for and track their own compliance.

### **2.2 Product Functions**

1. **Survey Builder** — Create/edit regulatory survey templates
2. **Taking Surveys** — Complete surveys digitally
3. **Deficiency Tracking** — Document and track deficiencies
4. **Plan of Correction Builder** — Create and manage POCs
5. **Compliance Dashboard** — Analytics and metrics
6. **Document Management** — Store and organize documents

### **2.3 User Classes**

| User Class | Description | Permissions |
|------------|-------------|-------------|
| **System Administrator** | Manages system configuration, users, permissions | Full system access |
| **Facility Administrator** | Manages facility, oversees operations | Facility-wide access |
| **Survey Administrator** | Creates/manages surveys, views all results | Survey builder + view all surveys |
| **Director of Health Services / DON** | Clinical oversight, manages deficiencies, POCs | Survey taking + deficiency + POC access |
| **Compliance Officer** | Manages compliance, POCs, remediation | Compliance + deficiency + POC access |
| **Survey Coordinator** | Prepares for surveys, manages survey documentation | Survey preparation + document access |
| **State Surveyor** | Conducts state surveys (external user) | Can take surveys, view assigned surveys |
| **Clinical Staff** | Nurses, aides - documentation | Limited - view assigned surveys, upload documents |
| **Viewer** | External consultants, corporate oversight | Read-only access |

### **2.4 Operating Environment**
- Web browsers: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile: iOS 14+, Android 8+
- Screen sizes: Desktop (1920x1080), Tablet (768px+), Mobile (375px+)

### **2.5 Design and Implementation Constraints**



**Regulatory Constraints:**
- HIPAA compliance (encryption, access controls, audit logs)
- State-specific regulation variations (system must accommodate)
- State regulation updates (system must accommodate changes)

**Business Constraints:**
- Launch timeline: 12-16 weeks for MVP
- Budget constraints (cloud service costs)
- Limited integration with legacy systems (phase 1)

---

## **3. System Features - Detailed Requirements**

### **3.1 Feature 1: Survey Builder**

#### **3.1.1 Description**
Tool for creating and managing regulatory survey templates tailored for Assisted Living Facilities.

#### **3.1.2 Functional Requirements**

**FR-SB-1.1: Survey Creation**
- System shall allow creating new surveys with:
  - Survey title
  - Description/purpose
  - Survey type (Standard, Complaint Investigation, Follow-up, Abbreviated, Pre-licensing)
  - State/jurisdiction reference (Florida - fixed for MVP)
  - Associated regulation tags/references (Florida FAC Chapter 58A-5 regulations)
  - Status (Draft, Published, Archived)
  - Facility reference (multi-tenant)

**FR-SB-1.2: Florida-Specific Configuration**
- System shall be configured for Florida regulations:
  - State/jurisdiction: Florida (fixed for MVP)
  - Regulation framework: Florida Administrative Code (FAC) Chapter 58A-5
  - Regulation tag format: Florida-specific regulation references
  - Severity level definitions: Florida-specific (as defined by AHCA)
  - Scope definitions: Florida-specific (Isolated, Pattern, Widespread)
- System shall use Florida ALF survey protocols and procedures
- System shall maintain Florida-specific survey templates
- **Note:** Multi-state support is out of scope for MVP

**FR-SB-1.3: Survey Sections**
- System shall allow adding sections to surveys with:
  - Section title
  - Section description
  - Section order/position
- System shall support reordering sections (drag-and-drop)
- System shall allow adding/removing sections
- System shall support nesting sections (subsections)
- System shall allow section-specific state regulation references

**FR-SB-1.4: Question Management**
- System shall allow adding questions to sections with:
  - Question text
  - Question type (see FR-SB-1.5)
  - Required/optional flag
  - Help text/instructions
  - Regulation reference/tag (customizable by state)
  - State-specific compliance guidance (optional)
- System shall allow editing question text and properties
- System shall allow deleting questions
- System shall allow reordering questions within sections

**FR-SB-1.5: Question Types**
System shall support the following question types:

1. **Single Choice (Radio)**
   - Multiple options, select one
   - Options: Yes/No, Yes/No/N/A, Yes/No/Not Applicable/Unable to Assess, Custom options

2. **Multiple Choice (Checkbox)**
   - Multiple options, select many
   - Custom option list

3. **Text Input**
   - Single-line text
   - Character limit configurable

4. **Text Area**
   - Multi-line text
   - Character limit configurable

5. **Rating Scale**
   - Numeric scale (e.g., 1-5)
   - Labels for scale points

6. **Date Picker**
   - Date selection
   - Date range selection (optional)

7. **File Upload**
   - Upload documents/photos
   - File type restrictions
   - File size limits

8. **Matrix/Grid**
   - Questions with multiple rows and columns
   - Useful for related questions with same options

9. **Resident-Specific Questions**
   - Questions that can be answered per resident (for sampling)
   - Supports resident selection/identification

**FR-SB-1.6: Regulation Reference System**
- System shall allow linking questions to Florida regulations
- System shall support Florida regulation tags/identifiers (FAC Chapter 58A-5 references)
- System shall allow adding regulation text/description
- System shall support Florida-specific regulation framework
- System shall allow facility-specific custom regulations (for internal use)

**FR-SB-1.7: Question Options**
- System shall allow configuring answer options for choice questions
- System shall allow adding/removing options
- System shall allow reordering options
- System shall allow "Other" option with text input
- System shall support state-specific answer options

**FR-SB-1.8: Conditional Logic**
- System shall allow showing/hiding questions based on previous answers
- Conditions:
  - If [Question X] equals [Value Y], then show [Question Z]
  - If [Question X] is not equal to [Value Y], then hide [Question Z]
  - Multiple conditions (AND/OR)
- System shall validate conditional logic to prevent circular references
- System shall support facility-specific conditional logic

**FR-SB-1.9: Question Validation**
- System shall allow setting validation rules:
  - Required field
  - Minimum/maximum length (for text)
  - Minimum/maximum value (for numbers)
  - Date range restrictions
  - Custom validation patterns (regex)
  - State-specific validation requirements

**FR-SB-1.10: Survey Preview**
- System shall provide preview mode showing survey as it will appear
- Preview shall show all sections and questions
- Preview shall allow testing conditional logic
- Preview shall be read-only (no data saved)
- Preview shall show regulation references

**FR-SB-1.11: Survey Publishing**
- System shall allow publishing a survey (making it available to take)
- System shall validate required fields before publishing:
  - Survey must have at least one section
  - Each section must have at least one question
  - All required fields must have validation rules
  - State/jurisdiction must be selected
- System shall allow unpublishing a survey (prevent new instances)
- System shall not allow editing published surveys directly (create new version instead)
- System shall archive old survey versions

**FR-SB-1.12: Survey Duplication & Versioning**
- System shall allow duplicating/copying an existing survey
- System shall allow duplicating individual sections or questions
- Duplicated surveys shall be in "Draft" status
- System shall maintain version history of surveys
- System shall track who made changes and when
- System shall allow viewing previous versions
- System shall prevent editing published surveys directly

**FR-SB-1.13: Survey Metadata**
- System shall store survey metadata:
  - Created date and creator
  - Last modified date and modifier
  - Published date
  - Version number
  - Number of times taken (instances created)
  - State/jurisdiction
  - Associated regulations

---

### **3.2 Feature 2: Taking Surveys**

#### **3.2.1 Description**
Interface for surveyors/staff to complete surveys digitally.

#### **3.2.2 Functional Requirements**

**FR-ST-2.1: Survey Access**
- System shall display list of published surveys available to take
- System shall show:
  - Survey title
  - Survey type
  - Description
  - State/jurisdiction (Florida)
  - Estimated completion time (if set)
  - Last taken date (if applicable)
- System shall allow filtering/searching available surveys

**FR-ST-2.2: Starting a Survey**
- System shall allow starting a new survey instance
- System shall create a new survey response record with:
  - Survey template reference
  - Started timestamp
  - Status (In Progress)
  - Surveyor/user ID
  - Facility reference
- System shall display survey instructions (if provided)

**FR-ST-2.3: Survey Navigation**
- System shall display survey in sections
- System shall provide navigation:
  - Previous/Next buttons between sections
  - Section menu/table of contents
  - Progress indicator (e.g., "Section 2 of 5")
  - Question counter (e.g., "Question 5 of 25")
- System shall allow jumping to specific sections (if all previous sections completed)

**FR-ST-2.4: Answering Questions**
- System shall display questions based on question type:
  - Radio buttons for single choice
  - Checkboxes for multiple choice
  - Text input for text fields
  - Date picker for date questions
  - File upload button for file uploads
- System shall validate answers in real-time:
  - Show error if required question is skipped
  - Show error if validation rules are violated
  - Highlight invalid fields
- System shall show help text/instructions for questions (if provided)

**FR-ST-2.5: Conditional Logic Execution**
- System shall show/hide questions based on conditional logic
- System shall recalculate visibility when answers change
- System shall skip hidden questions in validation
- System shall preserve answers if question becomes hidden then visible again

**FR-ST-2.6: Auto-Save Progress**
- System shall automatically save answers as user progresses
- System shall save answers:
  - On field blur (when user leaves a field)
  - Every 30 seconds (periodic save)
  - On section navigation
- System shall show save status indicator ("Saving...", "Saved")
- System shall handle save errors gracefully (retry mechanism)

**FR-ST-2.7: Resume Incomplete Survey**
- System shall allow resuming incomplete surveys
- System shall display list of in-progress surveys with:
  - Survey title
  - Progress percentage
  - Last saved date/time
  - Time elapsed
- System shall allow continuing from last completed question
- System shall allow restarting survey (with confirmation)

**FR-ST-2.8: Survey Progress Tracking**
- System shall display progress indicator:
  - Percentage complete
  - Number of questions answered / total questions
  - Visual progress bar
- System shall track:
  - Time started
  - Time of last save
  - Total time spent (if submitted)

**FR-ST-2.9: Required Questions Validation**
- System shall identify required questions
- System shall prevent submission if required questions are unanswered
- System shall highlight unanswered required questions
- System shall display summary of missing required questions before submission

**FR-ST-2.10: Review Before Submission**
- System shall provide review screen before submission showing:
  - Summary of all sections
  - Number of questions answered
  - List of unanswered required questions (if any)
  - Option to go back and edit answers
- System shall allow editing answers from review screen

**FR-ST-2.11: Survey Submission**
- System shall validate all required questions are answered before submission
- System shall display confirmation dialog before submission:
  - Warning if required questions are unanswered
  - Confirmation that submission is final
- Upon submission, system shall:
  - Mark survey as "Completed"
  - Set completion timestamp
  - Lock responses (prevent further editing)
  - Generate submission confirmation
  - Trigger any post-submission actions (notifications, deficiency identification)

**FR-ST-2.12: File Upload Handling**
- System shall allow uploading files for file upload questions
- System shall validate file types and sizes
- System shall show upload progress
- System shall allow removing/replacing uploaded files
- System shall store files securely
- System shall display uploaded file names/previews

**FR-ST-2.13: Survey Completion Confirmation**
- System shall display confirmation message after submission
- System shall show:
  - Survey completion confirmation
  - Submission timestamp
  - Survey ID/Reference number
  - Summary of responses (optional)
- System shall provide option to:
  - View submitted survey (read-only)
  - Take another survey
  - Return to dashboard

**FR-ST-2.14: Time Tracking (Optional)**
- System shall track time spent on survey (optional feature)
- System shall pause timer if survey is idle for extended period
- System shall display elapsed time (if enabled)

---

### **3.3 Feature 3: Deficiency Tracking**

#### **3.3.1 Description**
Document, track, and manage regulatory deficiencies identified during surveys.

#### **3.3.2 Functional Requirements**

**FR-DT-3.1: Deficiency Creation**
- System shall allow creating deficiency records from survey responses
- System shall allow manual deficiency creation
- Deficiency record shall include:
  - Regulation tag/reference (Florida FAC Chapter 58A-5 specific)
  - Regulation description/reference
  - Deficiency description (detailed finding)
  - Severity level (Florida-specific: Immediate Jeopardy, Actual Harm, Potential for Harm, No Actual Harm, etc.)
  - Scope (Florida-specific: Isolated, Pattern, Widespread)
  - Survey date and surveyor name
  - Associated survey instance (if created from survey)
  - Associated resident(s) (if applicable)
  - Facility reference
  - Created by and timestamp
  - State/jurisdiction (Florida)

**FR-DT-3.2: Deficiency Status Tracking**
- System shall track deficiency status:
  - Identified (newly found)
  - POC Required (awaiting plan of correction)
  - POC Submitted (plan submitted, awaiting approval)
  - POC Approved (plan approved by surveyor/regulator)
  - In Remediation (corrective actions in progress)
  - Corrected (actions completed, awaiting verification)
  - Verified (surveyor verified correction)
  - Closed (deficiency resolved and closed)
- System shall allow status updates with comments
- System shall track status change history

**FR-DT-3.3: Deficiency Prioritization**
- System shall automatically prioritize by severity
- System shall calculate due dates based on Florida-specific severity requirements:
  - Immediate Jeopardy: Immediate correction required (24 hours per Florida regulations)
  - Actual Harm: Florida-specific timeline (typically 30 days for POC)
  - Potential for Harm: Florida-specific timeline (typically 45 days for POC)
  - No Actual Harm: Florida-specific timeline (typically 90 days for POC)
- System shall send alerts for upcoming deadlines

**FR-DT-3.4: Deficiency Assignment**
- System shall assign deficiencies to responsible parties
- System shall allow assigning to roles:
  - DON (Director of Nursing/Health Services)
  - Compliance Officer
  - Facility Administrator
  - Department Heads
  - Specific staff members
- System shall allow reassignment
- System shall notify assignees of new deficiencies
- System shall notify assignees of status changes

**FR-DT-3.5: Deficiency Search and Filtering**
- System shall allow searching/filtering by:
  - Status
  - Severity level
  - Scope
  - Regulation tag/reference (Florida FAC Chapter 58A-5)
  - Date range (identified date)
  - Assigned to
  - Facility (if multi-tenant)
  - State/jurisdiction (Florida - fixed for MVP)
- System shall support advanced filters (multiple criteria)

**FR-DT-3.6: Deficiency Details View**
- System shall display detailed deficiency information:
  - Full deficiency description
  - Regulation reference with regulation text
  - Severity and scope
  - Status and timeline
  - Assigned to
  - Associated survey
  - Associated residents (if applicable)
  - Documents/evidence
  - Related POC (if exists)
  - Status history with comments

**FR-DT-3.7: Deficiency Linking to Surveys**
- System shall allow linking deficiencies to survey instances
- System shall allow linking to specific survey responses
- System shall allow creating deficiencies directly from survey responses
- System shall show all deficiencies related to a survey

**FR-DT-3.8: Deficiency Notifications**
- System shall send notifications for:
  - New deficiencies assigned
  - Status changes
  - Approaching deadlines (90, 60, 30, 7 days before due)
  - Overdue deficiencies
  - POC approval/rejection

**FR-DT-3.9: Deficiency Export**
- System shall allow exporting deficiency reports (PDF/Excel)
- Export shall include:
  - Deficiency details
  - Status information
  - Timeline
  - Associated documents (optional)

**FR-DT-3.10: Deficiency Dashboard**
- System shall display dashboard with:
  - Total deficiencies by status
  - Deficiencies by severity
  - Deficiencies by scope
  - Overdue deficiencies
  - Upcoming deadlines
  - Recent activity

---

### **3.4 Feature 4: Plan of Correction Builder**

#### **3.4.1 Description**
Create, manage, and track Plans of Correction for identified deficiencies.

#### **3.4.2 Functional Requirements**

**FR-POC-4.1: POC Creation**
- System shall allow creating POC records linked to deficiencies
- System shall provide template-based POC creation
- POC shall require:
  - Root cause analysis (text field)
  - Corrective actions (list of actions)
  - Measures to prevent recurrence
  - Implementation timeline (start date, completion date)
  - Person responsible for each action
  - Verification method

**FR-POC-4.2: Corrective Actions**
- System shall allow multiple corrective actions per deficiency
- Each action shall include:
  - Action description
  - Person responsible
  - Start date
  - Target completion date
  - Status (Not Started, In Progress, Completed, Verified)
  - Completion date (when marked complete)
  - Verification notes
- System shall allow adding/removing actions
- System shall allow editing actions (before POC submission)

**FR-POC-4.3: Root Cause Analysis**
- System shall provide text field for root cause analysis
- System shall support multiple paragraphs
- System shall allow editing (before submission)
- System shall support attaching documents as evidence

**FR-POC-4.4: Prevention Measures**
- System shall provide field for measures to prevent recurrence
- System shall support structured format:
  - Policy/procedure updates
  - Training required
  - Process changes
  - Monitoring systems
- System shall allow attaching supporting documents

**FR-POC-4.5: Implementation Timeline**
- System shall allow setting timeline for each corrective action
- System shall validate timeline (start date before completion date)
- System shall calculate overall POC timeline (earliest start to latest completion)
- System shall show timeline in visual format (Gantt chart or timeline view)

**FR-POC-4.6: POC Approval Workflow**
- System shall support approval workflow:
  - Draft (being created)
  - Under Review (submitted for internal review)
  - Approved Internally (ready for submission)
  - Submitted (submitted to surveyor/regulator)
  - Approved by Surveyor/Regulator
  - Rejected (requires revision)
- System shall require electronic signatures
- System shall maintain approval audit trail
- System shall notify relevant parties at each stage

**FR-POC-4.7: POC Submission**
- System shall allow submitting POC to surveyor/regulator
- System shall validate all required fields are completed
- System shall generate formatted POC document (PDF)
- System shall format according to state requirements
- System shall include all required information

**FR-POC-4.8: Implementation Tracking**
- System shall track implementation progress
- System shall allow updating action status
- System shall send reminders for upcoming deadlines
- System shall allow marking actions as completed
- System shall require completion notes when marking complete

**FR-POC-4.9: POC Verification**
- System shall allow surveyor/verifier to verify corrective actions
- System shall allow adding verification notes
- System shall allow marking actions as verified
- System shall allow marking entire POC as verified
- System shall track verification date and verifier

**FR-POC-4.10: POC Document Export**
- System shall export POC as PDF
- PDF shall include:
  - Deficiency information
  - Root cause analysis
  - All corrective actions
  - Timeline
  - Prevention measures
  - Signatures and approval history
- System shall format according to state requirements

**FR-POC-4.11: POC Templates**
- System shall provide POC templates for common deficiencies
- System shall allow saving custom POC templates
- System shall allow applying templates to deficiencies

**FR-POC-4.12: POC Revision**
- System shall allow revising rejected POCs
- System shall maintain version history
- System shall allow comparing versions
- System shall track revision history

**FR-POC-4.13: POC Linking**
- System shall link POC to deficiency
- System shall link POC to survey (if applicable)
- System shall show related deficiencies (if POC addresses multiple)

---

### **3.5 Feature 5: Compliance Dashboard and Analytics**

#### **3.5.1 Description**
Analytics dashboard and reporting for compliance monitoring.

#### **3.5.2 Functional Requirements**

**FR-CA-5.1: Compliance Dashboard**
- System shall display compliance dashboard with:
  - Overview metrics (total surveys, deficiencies, POCs)
  - Compliance score/rating
  - Active deficiencies count
  - Overdue items count
  - Recent activity feed
  - Quick access to key functions

**FR-CA-5.2: Deficiency Analytics**
- System shall provide analytics on deficiencies:
  - Total deficiencies by status
  - Deficiencies by severity (chart/graph)
  - Deficiencies by scope (chart/graph)
  - Deficiencies by regulation tag (most common violations)
  - Trends over time (deficiency rate)
  - Average time to resolution
  - Open vs. closed deficiencies

**FR-CA-5.3: Survey Analytics**
- System shall provide analytics on surveys:
  - Total surveys (by type)
  - Surveys completed vs. in progress
  - Average completion time
  - Survey response rates
  - Most common findings
  - Survey frequency/timeline

**FR-CA-5.4: POC Analytics**
- System shall provide analytics on Plans of Correction:
  - Total POCs by status
  - Average POC approval time
  - Average implementation time
  - POC success rate (verified/completed)
  - On-time completion rate

**FR-CA-5.5: Compliance Score Calculation**
- System shall calculate compliance score based on:
  - Number of deficiencies
  - Severity of deficiencies
  - Resolution time
  - POC compliance rate
- System shall display score on dashboard
- System shall show score trend over time

**FR-CA-5.6: Historical Trends**
- System shall display historical trends:
  - Deficiencies over time (line chart)
  - Compliance score over time
  - Survey results over time
  - Resolution time trends

**FR-CA-5.7: Benchmarking** (Future enhancement)
- System shall allow comparing facility metrics to benchmarks
- System shall compare to industry averages (if available)
- System shall compare to peer facilities (if multi-facility)

**FR-CA-5.8: Reporting**
- System shall generate reports:
  - Compliance summary report (PDF/Excel)
  - Deficiency report (PDF/Excel)
  - Survey report (PDF/Excel)
  - POC status report (PDF/Excel)
  - Executive summary report
- System shall allow customizing report date ranges
- System shall allow exporting reports in multiple formats

**FR-CA-5.9: Regulation Tag Analysis**
- System shall analyze deficiencies by regulation tag:
  - Most frequently cited regulation tags
  - Regulation tags by category (Care, Rights, Environment, etc.)
  - Trends by regulation tag over time
  - Risk assessment by regulation tag

**FR-CA-5.10: Alert System**
- System shall provide alerts for:
  - Overdue deficiencies
  - Approaching POC deadlines
  - High-risk deficiencies (Immediate Jeopardy)
  - Compliance score drops
  - Unusual patterns/trends

**FR-CA-5.11: Data Visualization**
- System shall provide visualizations:
  - Charts (bar, line, pie)
  - Graphs for trends
  - Progress indicators
  - Heat maps (if applicable)
- System shall allow customizing date ranges for visualizations

**FR-CA-5.12: Export and Sharing**
- System shall allow exporting dashboard data (PDF/Excel)
- System shall allow sharing reports with stakeholders
- System shall support scheduled report generation

---

### **3.6 Feature 6: Document Management**

#### **3.6.1 Description**
Centralized repository for documents and evidence.

#### **3.6.2 Functional Requirements**

**FR-DM-6.1: Document Upload**
- System shall allow uploading documents with:
  - File name (customizable)
  - Category/type (see FR-DM-6.2)
  - Description/tags
  - Associated regulation tag (optional)
  - Associated survey (optional)
  - Associated deficiency (optional)
  - Associated POC (optional)
  - Effective date
  - Expiration date (if applicable)
- System shall support file types:
  - PDF
  - DOC, DOCX
  - XLS, XLSX
  - JPG, PNG
  - Other common formats
- System shall enforce maximum file size (e.g., 50 MB)
- System shall validate file types

**FR-DM-6.2: Document Organization**
- System shall organize documents by categories:
  - Policies and Procedures
  - Care Plans
  - Training Records
  - Incident Reports
  - Medication Records (MAR)
  - Survey Evidence
  - Survey Responses
  - Licenses and Certifications
  - Deficiency Documentation
  - POC Documentation
  - Other
- System shall support tagging for searchability
- System shall support folders/subfolders
- System shall support custom categories

**FR-DM-6.3: Document Versioning**
- System shall maintain document versions
- System shall track version history with:
  - Version number
  - Upload date
  - Uploaded by
  - Change description
- System shall allow reverting to previous versions
- System shall allow comparing versions

**FR-DM-6.4: Document Access Control**
- System shall enforce role-based access:
  - View only
  - Download
  - Upload
  - Edit/Delete
- System shall support document-level permissions
- System shall track who accessed/downloaded documents
- System shall maintain audit log

**FR-DM-6.5: Document Search**
- System shall provide search by:
  - File name
  - Category
  - Tags
  - Upload date range
  - Associated survey/deficiency/POC
  - Content (if OCR enabled - future)
- System shall support advanced search (multiple criteria)
- System shall support full-text search (if implemented)

**FR-DM-6.6: Document Preview**
- System shall provide document preview:
  - PDF preview in browser
  - Image preview
  - Text file preview
- System shall allow downloading from preview

**FR-DM-6.7: Document Linking**
- System shall allow linking documents to:
  - Surveys
  - Survey responses
  - Deficiencies
  - Plans of Correction
  - Regulation tags/Regulations
- System shall show related documents from detail views

**FR-DM-6.8: Document Expiration Tracking**
- System shall track document expiration dates (if applicable)
- System shall send alerts before expiration (90, 60, 30 days)
- System shall identify expired documents
- System shall prompt for renewal/update

**FR-DM-6.9: Bulk Operations**
- System shall allow bulk operations:
  - Bulk upload (multiple files)
  - Bulk download (as ZIP)
  - Bulk delete (with confirmation)
  - Bulk categorization

**FR-DM-6.10: Document Storage**
- System shall store documents securely:
  - Encrypted at rest
  - Secure access controls
  - Backup and recovery
- System shall support cloud storage (AWS S3, Cloudflare R2, etc.)
- System shall maintain file integrity

**FR-DM-6.11: Document Export**
- System shall allow exporting documents:
  - Individual file download
  - Bulk download (ZIP)
  - Export with metadata (CSV)

**FR-DM-6.12: Document Usage Analytics**
- System shall track document usage:
  - Number of views
  - Number of downloads
  - Most accessed documents
  - Recently accessed documents

---

## **4. External Interface Requirements**

### **4.1 User Interface Requirements**

**4.1.1 General UI**
- Consistent design system
- Responsive design (desktop, tablet, mobile)
- Loading states for async operations
- Clear error messages
- Success confirmations
- Help tooltips
- Accessible (WCAG 2.1 Level AA minimum)

**4.1.2 Survey Builder UI**
- Drag-and-drop interface for reordering sections/questions
- WYSIWYG-style question editor
- Real-time preview panel
- Clean, intuitive form-based interface
- Responsive design (works on tablet)

**4.1.3 Survey Taking UI**
- Clean, distraction-free interface
- Large, readable fonts
- Clear navigation buttons
- Progress indicator always visible
- Mobile-friendly (touch-optimized)
- Accessible (keyboard navigation, screen reader support)

**4.1.4 Dashboard UI**
- Interactive charts and graphs
- Customizable widgets
- Real-time data updates
- Color-coded status indicators

### **4.2 Software Interfaces**

**4.2.1 Authentication**
- **MVP Implementation**: Mock authentication service using localStorage (for frontend development)
- Mock data stored in JSON files and localStorage
- Role-based access control implemented
- Session management via localStorage with expiration
- **Future Implementation**: Clerk integration for production authentication (when backend is ready)
- Single sign-on (SSO) support (future)

**4.2.2 Backend API**
- Convex backend for data operations
- Real-time data synchronization
- RESTful API patterns

**4.2.3 File Storage**
- Cloud storage service (AWS S3, Cloudflare R2, etc.)
- Secure file access
- CDN for file delivery (optional)

**4.2.4 Notifications**
- Email notifications
- In-app notifications
- Push notifications (mobile - future)

---

## **5. System Requirements**

### **5.1 Functional Requirements Summary**

| Feature | Priority | MVP |
|---------|----------|-----|
| **Survey Builder** | Must Have | ✅ |
| **Taking Surveys** | Must Have | ✅ |
| **Deficiency Tracking** | Must Have | ✅ |
| **Plan of Correction** | Must Have | ✅ |
| **Compliance Dashboard** | Should Have | Phase 2 |
| **Document Management** | Must Have | ✅ |

### **5.2 Non-Functional Requirements**

**5.2.1 Performance**
- Page load time: < 2 seconds
- Survey save response: < 500ms
- Dashboard load: < 3 seconds
- Document upload: Support up to 50 MB files
- Support 100+ concurrent users

**5.2.2 Security**
- HIPAA compliance required
- Encryption at rest and in transit
- Role-based access control
- Audit logging for all actions
- Secure file storage
- Authentication required for all operations
- Session timeout after inactivity

**5.2.3 Usability**
- Intuitive interface (minimal training)
- Clear error messages
- Comprehensive help documentation
- Mobile-responsive design
- Keyboard navigation support
- Screen reader compatibility

**5.2.4 Reliability**
- 99% uptime availability
- Data backup and recovery
- Auto-save with retry mechanism
- Graceful error handling
- No data loss guarantee

**5.2.5 Scalability**
- Support 1000+ survey templates
- Support 10,000+ survey instances
- Support 1000+ deficiencies per facility
- Support 100+ concurrent survey instances
- Efficient database queries with pagination

**5.2.6 Maintainability**
- Modular architecture
- Well-documented code
- Version control
- Automated testing
- Easy deployment

---

## **6. Data Model (High-Level)**

### **6.1 Core Entities**

**Facility**
- id, name, address, licenseNumber, capacity, state/jurisdiction, createdAt, updatedAt

**Survey Template**
- id, title, description, type, status, facilityId, state/jurisdiction, createdBy, createdAt, updatedAt, version

**Survey Section**
- id, surveyTemplateId, title, description, order, parentSectionId

**Survey Question**
- id, sectionId, questionText, questionType, options[], required, validationRules, conditionalLogic[], order, regulationReference

**Survey Instance**
- id, surveyTemplateId, facilityId, startedBy, startedAt, status, completedAt, progress

**Survey Response**
- id, surveyInstanceId, questionId, answer, fileUrl, answeredAt

**Deficiency**
- id, facilityId, regulationTag, description, severity, scope, status, surveyInstanceId, identifiedDate, dueDate, assignedTo, state/jurisdiction, createdAt, updatedAt

**Plan of Correction**
- id, deficiencyId, rootCauseAnalysis, preventionMeasures, status, submittedDate, approvedDate, createdBy, createdAt, updatedAt

**Corrective Action**
- id, pocId, description, responsiblePerson, startDate, targetCompletionDate, status, completedDate, verificationNotes

**Document**
- id, facilityId, fileName, fileUrl, category, tags[], associatedSurveyId, associatedDeficiencyId, associatedPocId, uploadDate, expirationDate, version

**User**
- id, email, name, role, facilityId, permissions[]

**Regulation** (Florida-specific)
- id, state/jurisdiction (Florida), regulationTag (FAC Chapter 58A-5), title, description, category, regulationText, effectiveDate

---

## **7. Assumptions and Constraints**

### **7.1 Assumptions**
- Users have basic computer literacy
- Internet connection required (no offline capability)
- Florida regulations may update (system should accommodate changes)
- Facilities may have multiple locations (multi-tenant)
- Surveys can be long (100+ questions)
- Documents may be large (up to 50 MB)
- System is Florida-only for MVP
- System is facility-side tool (not used by Florida state surveyors)
- No integration with Florida state licensing agency systems
- No EHR system integration
- No multi-language support required
- No real-time collaboration on surveys
- No AI-powered compliance suggestions

### **7.2 Constraints**
- Must use existing tech stack (React, Convex, TypeScript)
- HIPAA compliance required
- Initial MVP: Web-focused (mobile responsive)
- File uploads: Maximum 50 MB per file
- Text fields: Maximum 10,000 characters
- No integration with legacy systems (EHR, scheduling, etc.)
- Florida-only regulation framework (no multi-state support in MVP)
- No integration with Florida state licensing agency systems (SCATSSTEM or other)
- No offline capability
- No multi-language support
- No real-time collaboration features

---

## **8. MVP Scope (Phase 1)**

### **Must Have (MVP)**
1. ✅ Survey Builder (basic question types: Radio, Checkbox, Text, Textarea) - Florida-specific
2. ✅ Taking Surveys (with auto-save)
3. ✅ Deficiency Tracking (basic) - Florida regulations
4. ✅ Plan of Correction Builder (basic)
5. ✅ Document Management (upload, organize, link)
6. ✅ Basic compliance dashboard
7. ✅ Florida regulation framework integration

### **Out of Scope for MVP**
- ❌ EHR system integration
- ❌ Integration with Florida state licensing agency systems (SCATSSTEM)
- ❌ Multi-language support
- ❌ Offline capability
- ❌ Real-time collaboration on surveys
- ❌ AI-powered compliance suggestions
- ❌ Multi-state support (Florida-only)

### **Should Have (Phase 2)**
1. Advanced question types (Matrix, Rating Scale, Date Picker)
2. Conditional logic
3. Advanced analytics
4. Report generation
5. Bulk operations
6. Mobile app
7. Additional state support (if needed)

---

## **9. Success Criteria**

- Administrators can create a complete Florida regulatory survey in < 30 minutes
- Surveyors can complete a 50-question survey in < 1 hour
- Zero data loss (all answers and documents saved)
- Deficiencies can be created and tracked (Florida regulations)
- POCs can be created and submitted
- 95% user satisfaction rating
- System handles 50 concurrent survey instances
- HIPAA compliance achieved
- System accurately reflects Florida FAC Chapter 58A-5 regulations
- System supports Florida-specific severity levels and scope definitions

---

## **10. Open Questions - RESOLVED**

1. ✅ **Which specific states should be supported in MVP?** → **Florida only**
2. ✅ **Integration with EHR systems?** → **No - Out of scope**
3. ✅ **Integration with scheduling systems?** → **No - Out of scope**
4. ✅ **Multi-language support?** → **No - Out of scope**
5. ✅ **Offline capability?** → **No - Out of scope**
6. ✅ **Real-time collaboration on surveys?** → **No - Out of scope**
7. ✅ **AI-powered compliance suggestions?** → **No - Out of scope**
8. ✅ **Integration with state licensing agency systems (SCATSSTEM)?** → **No - State will not use this system; it is facility-side only**
9. ⚠️ **Support for pre-licensing surveys?** → **To be determined based on Florida requirements**
10. ⚠️ **Resident sampling functionality for surveys?** → **To be determined based on Florida survey protocols**

**Note:** This system is designed for facilities to use internally to prepare for and manage compliance with Florida regulations. Florida state surveyors will conduct surveys using their own systems; this tool helps facilities prepare and track their compliance.

---

**End of SRS Document**

