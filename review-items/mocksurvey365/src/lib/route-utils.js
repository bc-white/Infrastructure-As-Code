// Route metadata for generating dynamic titles and breadcrumbs
export const getRouteMetadata = (pathname) => {
  const routes = {
    '/dashboard': {
      title: 'Dashboard',
      subheading: 'Overview of your survey activities and performance',
      breadcrumbs: [{ label: 'Dashboard' }]
    },
    '/mocksurvey365': {
      title: 'MockSurvey365',
      subheading: 'Create and manage your surveys',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'MockSurvey365' }
      ]
    },
    '/ftag-management': {
      title: 'F-Tag Management',
      subheading: 'Manage F-Tag regulations and compliance',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'F-Tag Management' }
      ]
    },
    '/resource-center': {
      title: 'Resource Center',
      subheading: 'Access documentation and training materials',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Resource Center' }
      ]
    },
    '/reports': {
      title: 'Reports',
      subheading: 'View and generate survey reports',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Reports' }
      ]
    },
    '/admin/users': {
      title: 'User Management',
      subheading: 'Manage system users and permissions',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Administration', href: '/admin' },
        { label: 'User Management' }
      ]
    },
    '/admin/settings': {
      title: 'System Settings',
      subheading: 'Configure system preferences and settings',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Administration', href: '/admin' },
        { label: 'System Settings' }
      ]
    },
    '/admin/analytics': {
      title: 'Analytics',
      subheading: 'View system usage and performance analytics',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Administration', href: '/admin' },
        { label: 'Analytics' }
      ]
    },
    '/profile': {
      title: 'Profile Settings',
      subheading: 'Manage your account and preferences',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Profile Settings' }
      ]
    }
  };

  // Default metadata for unknown routes
  const defaultMetadata = {
    title: 'MockSurvey365',
    subheading: 'Professional survey and assessment platform',
    breadcrumbs: [{ label: 'Dashboard', href: '/dashboard' }]
  };

  return routes[pathname] || defaultMetadata;
};

// Get header actions based on current route
export const getHeaderActions = ({ pathname }) => {
  const actions = {
    '/mocksurvey365': [
      { label: 'New Survey', href: '/mocksurvey365/new', variant: 'default' }
    ],
    '/reports': [
      { label: 'Generate Report', href: '/reports/new', variant: 'default' }
    ],
    '/admin/users': [
      { label: 'Add User', href: '/admin/users/new', variant: 'default' }
    ]
  };

  return actions[pathname] || [];
};
