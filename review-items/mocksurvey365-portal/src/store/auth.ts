import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Organization {
  id: string;
  name: string;
  email: string;
  type: string;
  contact: string;
  location: string;
  org_structure: string;
  hcbs_subtype: string | null;
  preferred_suborg_label: string | null;
  preferred_room_label: string | null;
  preferred_unit_label: string | null;
  do_beds_have_names: boolean;
  bed_naming_scheme: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  pivot?: {
    user_id: string;
    organization_id: string;
    created_at: string;
    updated_at: string;
  };
  facilities?: Facility[];
}

export interface Facility {
  id: string;
  organization_id: string;
  type: string;
  name: string;
  email: string;
  manager_name: string;
  manager_email: string;
  address: {
    street: string;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
  };
  phone_number: string;
  fax_number: string;
  website: string;
  latitude: string | null;
  longitude: string | null;
  onboarding_status: string;
  current_onboarding_step: string | null;
  onboarding_started_at: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string | null; 
  access_level?: string;
  organizationId?: string; // For Organization Admin users
  facilityId?: string; // For Facility Admin users
  organizations?: Organization[]; // Array of organizations for org-admin
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentOrganizationId: string | null; // Currently selected organization for org-admins
  login: (user: Partial<User>, token: string) => void;
  logout: () => void;
  setCurrentOrganization: (organizationId: string) => void;
  updateUserRole: (role: string) => void;
  // Check if user is authenticated
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      currentOrganizationId: null,
      login: (user: Partial<User>, token: string | null) => {
        const userObj = user as User;
        // Set the first organization as default if user has organizations
        const defaultOrgId = userObj?.organizations?.[0]?.id || null;
        set({ 
          user: userObj, 
          token, 
          isAuthenticated: !!token,
          currentOrganizationId: defaultOrgId
        });
      },
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        currentOrganizationId: null
      }),
      setCurrentOrganization: (organizationId: string) => 
        set({ currentOrganizationId: organizationId }),
      updateUserRole: (role: string) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { ...currentUser, role } 
          });
        }
      },
      checkAuth: () => {
        const state = get();
        return state.isAuthenticated && !!state.token;
      },
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
