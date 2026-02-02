# Phase 2: Core Layout & Navigation

## Status
**Not Started**

## Overview
Create the main application layout with navigation, sidebar, header, and routing structure that will house all other features.

## Tasks

### 2.1 Main Dashboard Layout
- [ ] Create `Layout/DashboardLayout.jsx` - Main app shell
- [ ] Implement responsive layout (desktop, tablet, mobile)
- [ ] Add sidebar navigation component
- [ ] Add top header component
- [ ] Add breadcrumb navigation
- [ ] Implement mobile menu toggle

### 2.2 Sidebar Navigation
- [ ] Create `components/Navigation/Sidebar.jsx`
- [ ] Implement menu items based on user roles
- [ ] Add menu items:
  - Dashboard (all users)
  - Surveys (Survey Admin, Survey Coordinator, Clinical Staff)
  - Survey Builder (Survey Admin)
  - Taking Surveys (all survey-takers)
  - Deficiencies (DON, Compliance Officer, Facility Admin)
  - Plans of Correction (DON, Compliance Officer)
  - Documents (all users with varying permissions)
  - Settings (System Admin, Facility Admin)
- [ ] Add active state highlighting
- [ ] Add collapsed/expanded state for mobile
- [ ] Implement role-based menu visibility

### 2.3 Header Component
- [ ] Create `components/Navigation/Header.jsx`
- [ ] Add user profile dropdown
- [ ] Add notifications bell icon
- [ ] Add search bar (optional, future)
- [ ] Add logout functionality
- [ ] Display current user name and role
- [ ] Show facility name (if applicable)

### 2.4 Breadcrumbs
- [ ] Create `components/Navigation/Breadcrumbs.jsx`
- [ ] Implement breadcrumb trail based on route
- [ ] Add clickable breadcrumb links
- [ ] Show current page in breadcrumb

### 2.5 Route Structure
- [ ] Update `App.jsx` with all routes
- [ ] Implement protected routes for authenticated pages
- [ ] Add role-based route access
- [ ] Create route definitions:
  - `/dashboard` - Main dashboard
  - `/surveys` - Survey list
  - `/surveys/builder` - Survey builder
  - `/surveys/builder/:id` - Edit survey
  - `/surveys/take` - Available surveys to take
  - `/surveys/take/:id` - Take specific survey
  - `/surveys/instances/:id` - View survey instance
  - `/deficiencies` - Deficiency list
  - `/deficiencies/new` - Create deficiency
  - `/deficiencies/:id` - Deficiency detail
  - `/poc` - Plan of Correction list
  - `/poc/new` - Create POC
  - `/poc/:id` - POC detail
  - `/documents` - Document library
  - `/settings` - Settings (role-based)

## Components to Create

### New Components
- `Layout/DashboardLayout.jsx` - Main layout wrapper
- `components/Navigation/Sidebar.jsx` - Left sidebar navigation
- `components/Navigation/Header.jsx` - Top header
- `components/Navigation/Breadcrumbs.jsx` - Breadcrumb navigation
- `components/Navigation/UserMenu.jsx` - User dropdown menu
- `components/Navigation/Notifications.jsx` - Notifications dropdown

### Shared UI Components Needed
- `components/ui/dropdown-menu.jsx` - Dropdown menu component
- `components/ui/avatar.jsx` - User avatar component
- `components/ui/badge.jsx` - Status badges

## Navigation Structure

### Menu Items (Role-based)
1. **Dashboard** - All users
2. **Surveys** - Survey Admin, Survey Coordinator, Clinical Staff
   - Survey Builder (Survey Admin only)
   - Taking Surveys
   - Survey Instances
3. **Deficiencies** - DON, Compliance Officer, Facility Admin
4. **Plans of Correction** - DON, Compliance Officer
5. **Documents** - All users (with permission levels)
6. **Settings** - System Admin, Facility Admin

## Design Requirements
- Responsive design (desktop, tablet, mobile)
- Accessible navigation (keyboard, screen reader)
- Loading states for route transitions
- Smooth transitions between pages

