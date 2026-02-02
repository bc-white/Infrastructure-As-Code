# MockSurvey365 

A comprehensive healthcare facility mock survey simulation and management platform built with React, Vite, and Firebase. MockSurvey365 enables healthcare facilities to conduct realistic practice surveys to ensure compliance and prepare for regulatory inspections.

## Overview

MockSurvey365 is a full-featured survey management system designed specifically for healthcare facilities. It provides tools for conducting mock surveys following regulatory frameworks (F-Tags), managing resident investigations, tracking facility compliance, and generating detailed reports. The platform simulates the actual survey process including entrance conferences, clinical investigations, facility task observations, and exit conferences.

### Key Features

- **Survey Management**: Create, manage, and track multiple surveys with different statuses (setup, in-progress, completed)
- **Facility Management**: Manage multiple healthcare facilities with detailed profiles and contact information
- **Resident Investigations**: Conduct resident-based and facility-based investigations using Critical Element Pathways
- **Compliance Tracking**: Link findings to regulatory requirements (F-Tags) with automated compliance detection
- **Clinical Area Assessments**: Evaluate clinical systems including admissions, falls, infections, pain management, pressure ulcers, medications, and more
- **Facility Tasks**: Track mandatory observations including dining, medication administration, infection control, and kitchen safety
- **Environmental Audits**: Conduct facility entrance tours with detailed environmental checklists
- **Real-time Collaboration**: Multi-user support with role-based access control and team member management
- **Comprehensive Reporting**: Generate detailed survey reports with findings, citations, and recommendations
- **Health Assistant AI**: Integrated AI assistance for F-Tag information and compliance guidance
- **Offline Support**: IndexedDB for local data persistence and offline functionality
- **Multi-facility Dashboard**: Aggregate metrics across multiple facilities

## Tech Stack

- **Frontend**: React 19 with TypeScript support
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS with custom components (Radix UI)
- **State Management**: Zustand
- **Database**: Firebase (Firestore, Authentication, Storage, Cloud Messaging)
- **Local Storage**: Dexie (IndexedDB wrapper) for offline-first data
- **Data Visualization**: Chart.js, Recharts
- **Tables**: TanStack React Table
- **Animations**: Framer Motion
- **UI Components**: Headless UI, Radix UI
- **Payments**: PayPal integration
- **Notifications**: Sonner (toast notifications)

## Getting Started

### Prerequisites

- Node.js 16+ and npm/pnpm
- Firebase project with credentials configured

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TheInspac/mocksurvey365.git
cd mocksurvey365
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up Firebase configuration:
   - Create a Firebase project at [firebase.google.com](https://console.firebase.google.com)
   - Generate and configure your Firebase credentials
   - The app includes a script to auto-generate the Firebase config file

4. Start the development server:
```bash
pnpm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
pnpm run build
pnpm run preview
```

## Project Structure

```
src/
├── components/           # Reusable React components
│   ├── ui/              # Base UI components
│   ├── survey/          # Survey-specific components
│   ├── facility/        # Facility management components
│   ├── data-table.jsx   # Powerful data table component
│   └── ...
├── pages/               # Page components and features
│   ├── auth/            # Authentication pages (login, register, MFA)
│   ├── survey/          # Survey workflow pages
│   │   ├── SurveySetup.jsx
│   │   ├── FacilityEntrance.jsx
│   │   ├── FacilityInitiatedSurvey.jsx
│   │   ├── FacilityTasks.jsx
│   │   └── ExitConference.jsx
│   ├── Dashboard.jsx
│   ├── Facilities.jsx
│   ├── Reports.jsx
│   └── ...
├── contexts/            # React Context providers
│   ├── AuthContext.jsx
│   ├── FacilityContext.jsx
│   ├── FeatureGateContext.jsx
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useSurveyList.js
│   ├── useSubscription.js
│   └── ...
├── service/             # API service layer
│   └── api.js
├── lib/                 # Utilities and helpers
│   ├── firebase.js
│   ├── utils.js
│   └── ...
├── stores/              # Zustand stores
└── App.jsx              # Main app component
```

## Core Features Explained

### Survey Workflow

The mock survey process follows these main steps:

1. **Survey Setup** - Define survey parameters, select facility, set census
2. **Offsite Preparation** - Initial planning and documentation review
3. **Facility Entrance** - Entrance conference and environmental tour
4. **Initial Pool Processing** - Resident sampling and selection
5. **Sample Finalization** - Validate and finalize survey sample
6. **Resident Investigations** - Conduct detailed resident-based investigations
7. **Facility Tasks** - Observe and document mandatory facility tasks
8. **Exit Conference** - Present findings and recommendations

### Investigation Pathways

The platform includes Critical Element Pathways for investigating:
- Admissions processes
- Behavioral health
- Falls prevention
- Change in condition management
- Grievance handling
- Hospital readmissions
- Incident management
- Infection control
- Pain management
- Pressure ulcer prevention
- IV therapy administration
- Weight loss monitoring
- Psychotropic medication use
- Activities and engagement
- Staff education compliance

### Compliance Framework

Findings are linked to specific F-Tags (regulatory citations) that correspond to:
- Quality of care standards
- Resident rights and safety
- Environmental conditions
- Staff qualifications and performance
- Infection control practices
- Medical administration standards

## Authentication & Authorization

- Multi-factor authentication (MFA) support
- Role-based access control (Admin, Surveyor, Facility Staff, etc.)
- Subscription-based feature access
- Trial period management
- Secure password reset with OTP verification

## Data Management

- **Real-time Sync**: Firebase Firestore integration for live data synchronization
- **Offline-First**: IndexedDB stores survey data locally for offline access
- **Automatic Backup**: Cloud storage integration for document uploads
- **Data Compression**: LZ-string compression for efficient storage

## Advanced Features

- **Health Assistant AI**: Automated F-Tag guidance based on survey responses
- **Multi-facility Support**: Manage surveys across multiple healthcare locations
- **User Management**: Team member management with role assignment
- **Subscription Management**: Flexible billing with PayPal integration
- **Custom Reporting**: Generate exportable survey reports
- **Resource Center**: Comprehensive knowledge base and training materials

## Development

### Available Scripts

```bash
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run preview      # Preview production build
pnpm run lint         # Run ESLint
```

### ESLint Configuration

The project uses ESLint for code quality. To expand the configuration for production use, see [TypeScript ESLint documentation](https://typescript-eslint.io).

## Contributing

This project is maintained by The Inspac team. For contributions, please follow standard Git practices:

1. Create a feature branch
2. Make your changes
3. Submit a pull request for review

## Current Branch

The project is currently on the `indexDB-reactive` branch, which focuses on IndexedDB reactive data management improvements.

## Support & Documentation

- See individual component documentation in their respective directories
- API documentation available in `service/api.js`
- Survey workflow details in `src/pages/survey/README.md`

## License

Private repository - All rights reserved by The Inspac

---

**MockSurvey365** - Making healthcare facility compliance preparation easier and more effective. 🎯
