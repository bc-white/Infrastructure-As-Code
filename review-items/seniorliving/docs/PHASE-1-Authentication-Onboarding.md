# Phase 1: Authentication & Onboarding

## Status
**✅ Complete** - Authentication flow and onboarding implemented with mock data

## Overview
Complete authentication flow and Florida-specific onboarding implemented using mock JSON data stored in localStorage. This allows frontend development to proceed without backend dependency. All features are fully functional and ready for backend integration when available.

## Implementation Notes
- **Mock Data Approach**: Using mock JSON data files and localStorage instead of Clerk/backend for MVP
- **Authentication Service**: `src/services/mockAuthService.js` simulates backend API calls
- **Session Management**: Stored in localStorage with expiration (24 hours)
- **OTP Handling**: Stored in localStorage with expiration (5 minutes). Test OTP: `123456`
- **Migration Path**: Easy to replace mock service with real API calls when backend is ready

## Tasks

### 1.1 Authentication Flow
- [x] Complete authentication logic integration (using mock service)
- [x] Add protected routes wrapper component
- [x] Implement session management (localStorage-based)
- [x] Add role-based route guards (basic implementation)
- [x] Handle authentication state globally (Context API)

### 1.2 Onboarding Enhancements
- [x] Remove old onboarding steps (personal info, facility details, state selection, account type)
- [x] Create new onboarding based on SRS requirements:
  - [x] Lock state selection to "Florida" only (SRS requirement)
  - [x] Add role selection (System Admin, Facility Admin, Survey Admin, DON, Compliance Officer, Survey Coordinator, Clinical Staff, Viewer)
  - [x] Add facility license number field (Florida-specific)
  - [x] Add facility capacity field
  - [x] Store onboarding data properly (localStorage)
  - [x] Redirect to dashboard after completion

### 1.3 Protected Routes
- [x] Create `components/ProtectedRoute.jsx`
- [x] Implement route protection based on authentication status
- [x] Implement role-based access control (basic implementation)
- [x] Create redirect logic for unauthenticated users

### 1.4 Auth Context
- [x] Create `context/AuthContext.jsx`
- [x] Manage authentication state globally
- [x] Provide user data and role information
- [x] Handle login/logout functionality

## Components to Create/Update

### New Components
- `components/ProtectedRoute.jsx` - Route protection wrapper
- `context/AuthContext.jsx` - Authentication context
- `context/UserContext.jsx` - User profile & role context
- `hooks/useAuth.js` - Authentication hook

### Update Existing
- `src/pages/Onboarding.jsx` - Complete rewrite for proper onboarding
- `src/pages/Auth.jsx` - Connect to authentication logic
- `src/App.jsx` - Add protected routes

## User Roles (from SRS)
- System Administrator
- Facility Administrator
- Survey Administrator
- Director of Health Services / DON
- Compliance Officer
- Survey Coordinator
- Clinical Staff
- Viewer

## Implementation Details

### Mock Data Files
- `src/data/mockUsers.json` - Pre-defined users for testing
- `src/data/mockFacilities.json` - Mock facility data
- `src/data/mockRoles.json` - Role definitions and permissions

### Services
- `src/services/mockAuthService.js` - Mock authentication service
  - Simulates API calls with delays (200-500ms)
  - Uses localStorage for persistence
  - OTP codes stored with expiration
  - Test OTP: `123456` (always works for testing)

### Context Providers
- `src/context/AuthContext.jsx` - Authentication state management
- `src/context/UserContext.jsx` - User profile and facility data

### Components Created
- `src/components/ProtectedRoute.jsx` - Route protection wrapper
- `src/pages/Onboarding.jsx` - 3-step Florida-specific onboarding
- `src/pages/Dashboard.jsx` - Placeholder dashboard (for testing)

### Test Users
- `admin@test.com` / `password123` - System Admin (onboarding completed)
- `don@test.com` / `password123` - DON (onboarding completed)
- `newuser@test.com` / `password123` - New user (onboarding incomplete)

## Notes
- System is Florida-only for MVP (lock state to Florida)
- Onboarding must collect facility license number
- Role assignment happens during onboarding
- **Mock data approach**: All data stored in localStorage
- **Migration path**: When backend is ready, replace `mockAuthService.js` with real API service

## Future Backend Integration
When backend is ready:
1. Create `src/services/authService.js` with real API calls
2. Update `AuthContext.jsx` to use real service instead of mock
3. Remove mock service and JSON data files
4. Update API endpoints configuration

