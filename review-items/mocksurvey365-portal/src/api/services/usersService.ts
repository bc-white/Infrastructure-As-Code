import apiClient from '../client';

// Helper function to create auth headers
const createAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

export interface SignedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  phoneNumber: string;
  roleId: {
    id: string;
    name: string;
  };
  createdAt: string;
  lastSignIn?: string;
  countryName?: string;
  city?: string;
  uniqueCode?: string;
  isEmailVerified?: boolean;
  isSubscribed?: boolean;
  emailNotification?: boolean;
  agreementConfirmation?: boolean;
  surveyResponsesNotification?: boolean;
  weeklyReportNotification?: boolean;
}

export interface InvitedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  phoneNumber?: string;
  roleId: {
    id: string;
    name: string;
  };
  createdAt: string;
  lastSignIn?: string;
  uniqueCode?: string;
  invited: string;
}

export interface PaginatedSignedUsersResponse {
  users: SignedUser[];
  pagination: {
    total: number;
    totalPages: number;
    limit: number;
    currentPage: number;
  };
}

export interface Role {
  id: string;
  name: string;
  status?: boolean;
}

export const getRoles = async (): Promise<Role[]> => {
  const response = await apiClient.get(
    `/admin/roles`,
    createAuthHeaders()
  );

  const raw = response.data;
  const data = raw?.data ?? raw;

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((role: any) => ({
    id: role._id || role.id || '',
    name: role.name || '',
    status: role.status,
  }));
};

// Get signed users with pagination
export const getSignedUsers = async (
  page: number = 1,
  limit: number = 20
): Promise<PaginatedSignedUsersResponse> => {
  const response = await apiClient.get(
    `/user/signedUsers?page=${page}&limit=${limit}`,
    createAuthHeaders()
  );

  // API response: { status: true, data: { users: [...], pagination: {...} } }
  const raw = response.data;
  const data = raw?.data || raw;

  return {
    users: (data?.users || []).map((user: any) => ({
      id: user._id || user.id || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      organization: user.organization || '',
      phoneNumber: user.phoneNumber || '',
      roleId: {
        id: user.roleId?._id || user.roleId?.id || '',
        name: user.roleId?.name || '',
      },
      createdAt: user.createdAt || '',
      lastSignIn: user.lastSignIn,
      countryName: user.countryName,
      city: user.city,
      uniqueCode: user.uniqueCode,
      isEmailVerified: user.isEmailVerified,
      isSubscribed: user.isSubscribed,
      emailNotification: user.emailNotification,
      agreementConfirmation: user.agreementConfirmation,
      surveyResponsesNotification: user.surveyResponsesNotification,
      weeklyReportNotification: user.weeklyReportNotification,
    })),
    pagination: data?.pagination || {
      total: 0,
      totalPages: 0,
      limit: limit,
      currentPage: page,
    },
  };
};

// Get a single signed user by ID
export const getSignedUserById = async (userId: string): Promise<SignedUser | null> => {
  // Fetch all users and find the one with matching ID
  // Note: In a real scenario, there might be a specific endpoint like /user/signedUsers/:id
  const response = await apiClient.get(
    `/user/signedUsers?page=1&limit=1000`, // Large limit to get all users
    createAuthHeaders()
  );

  const raw = response.data;
  const data = raw?.data || raw;
  const users = data?.users || [];

  // Find user by ID
  const user = users.find((u: any) => (u._id || u.id) === userId);
  
  if (!user) {
    return null;
  }

  return {
    id: user._id || user.id || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    organization: user.organization || '',
    phoneNumber: user.phoneNumber || '',
    roleId: {
      id: user.roleId?._id || user.roleId?.id || '',
      name: user.roleId?.name || '',
    },
    createdAt: user.createdAt || '',
    lastSignIn: user.lastSignIn,
    countryName: user.countryName,
    city: user.city,
    uniqueCode: user.uniqueCode,
    isEmailVerified: user.isEmailVerified,
    isSubscribed: user.isSubscribed,
    emailNotification: user.emailNotification,
    agreementConfirmation: user.agreementConfirmation,
    surveyResponsesNotification: user.surveyResponsesNotification,
    weeklyReportNotification: user.weeklyReportNotification,
  };
};

// Get invited users for a specific user
export const getInvitedUsers = async (userId: string): Promise<InvitedUser[]> => {
  const response = await apiClient.get(
    `/user/invitedUsers/${userId}`,
    createAuthHeaders()
  );

  // API response: { status: true, data: [...] }
  const raw = response.data;
  const data = raw?.data || [];

  return (Array.isArray(data) ? data : []).map((user: any) => ({
    id: user._id || user.id || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    organization: user.organization || '',
    phoneNumber: user.phoneNumber || '',
    roleId: {
      id: user.roleId?._id || user.roleId?.id || '',
      name: user.roleId?.name || '',
    },
    createdAt: user.createdAt || '',
    lastSignIn: user.lastSignIn,
    uniqueCode: user.uniqueCode,
    invited: user.invited || 'false',
  }));
};

export interface Facility {
  id: string;
  name: string;
  type: string;
  location: string;
  status: "active" | "inactive" | "pending";
  memberSince: string;
  members: number;
}

export interface Survey {
  id: string;
  title: string;
  status: "completed" | "pending" | "not_started";
  completedDate?: string;
  startedDate?: string;
  responses: number;
  completionPercentage: number;
}

// Get facilities under a user
export const getFacilitiesUnderUser = async (userId: string): Promise<Facility[]> => {
  const response = await apiClient.get(
    `/user/facilitiesUnderUser/${userId}`,
    createAuthHeaders()
  );

  // API response: { status: true, statusCode: 200, message: "...", data: [...] }
  console.log('Facilities API response:', JSON.stringify(response.data, null, 2));
  
  const raw = response.data;
  const data = raw?.data || [];

  console.log('Facilities data array:', data);

  return (Array.isArray(data) ? data : []).map((facility: any) => {
    // Extract type name from object
    const typeName = typeof facility.type === 'object' && facility.type !== null
      ? (facility.type.name || 'Unknown')
      : (facility.type || facility.facilityType || 'Unknown');
    
    // Extract location from address object
    let location = 'Unknown';
    if (facility.address && typeof facility.address === 'object') {
      const addrParts = [
        facility.address.city,
        facility.address.state,
        facility.address.country
      ].filter(Boolean);
      location = addrParts.length > 0 ? addrParts.join(', ') : 'Unknown';
    } else if (facility.location || facility.city) {
      location = facility.location || facility.city || 'Unknown';
    }
    
    // Handle status - normalize to "active" | "inactive" | "pending"
    let status: "active" | "inactive" | "pending" = 'inactive';
    if (facility.status) {
      const statusLower = String(facility.status).toLowerCase();
      if (statusLower === 'active') {
        status = 'active';
      } else if (statusLower === 'pending') {
        status = 'pending';
      } else {
        status = 'inactive';
      }
    } else if (facility.isActive) {
      status = 'active';
    }
    
    // Extract member since date
    const memberSince = facility.createdAt || facility.memberSince || facility.joinedDate || facility.lastSurvey || '';
    
    // Extract members count - use contact array length or size.beds
    const members = facility.members || facility.memberCount || 
                   (Array.isArray(facility.contact) ? facility.contact.length : 0) ||
                   (facility.size?.beds || 0);
    
    const mapped = {
      id: facility._id || facility.id || '',
      name: facility.name || facility.facilityName || '',
      type: typeName,
      location: location,
      status: status,
      memberSince: memberSince,
      members: members,
    };
    console.log('Mapped facility:', mapped);
    return mapped;
  });
};

// Get surveys under a user
export const getSurveysUnderUser = async (userId: string): Promise<Survey[]> => {
  const response = await apiClient.get(
    `/user/surveyUnderUser/${userId}`,
    createAuthHeaders()
  );

  // API response: { status: true, statusCode: 200, message: "...", data: [...] }
  console.log('Surveys API response:', JSON.stringify(response.data, null, 2));
  
  const raw = response.data;
  const data = raw?.data || [];

  console.log('Surveys data array:', data);

  return (Array.isArray(data) ? data : []).map((survey: any) => {
    // Extract title from survey category and facility name
    const facilityName = survey.facilityId?.name || survey.facilityId?.facilityName || 'Unknown Facility';
    const category = survey.surveyCategory || '';
    const title = category 
      ? `${category} Survey - ${facilityName}`
      : `Survey - ${facilityName}`;
    
    // Determine status - normalize to "completed" | "pending" | "not_started"
    // Based on API: "investigations", "completed", etc.
    let status: "completed" | "pending" | "not_started" = 'not_started';
    if (survey.status) {
      const statusLower = String(survey.status).toLowerCase();
      if (statusLower === 'completed' || statusLower === 'done' || statusLower === 'finished' || statusLower === 'closed') {
        status = 'completed';
      } else if (statusLower === 'pending' || statusLower === 'in_progress' || statusLower === 'started' || 
                 statusLower === 'investigations' || statusLower === 'active' || statusLower === 'ongoing') {
        status = 'pending';
      } else {
        status = 'not_started';
      }
    }
    
    // Use surveyCreationDate as startedDate, updatedAt as completedDate if status is completed
    const startedDate = survey.surveyCreationDate || survey.createdAt || '';
    const completedDate = (status === 'completed' && survey.updatedAt) ? survey.updatedAt : undefined;
    
    // Calculate responses from teamMembers array length
    const responses = survey.teamMembers?.length || survey.responses || survey.totalResponses || survey.responseCount || 0;
    
    // Calculate completion percentage - if status is completed, assume 100%, otherwise calculate based on progress
    let completionPercentage = 0;
    if (status === 'completed') {
      completionPercentage = 100;
    } else if (status === 'pending' && survey.teamMembers && survey.teamMembers.length > 0) {
      // If there are team members assigned, assume some progress (e.g., 50% for investigations)
      completionPercentage = survey.status?.toLowerCase() === 'investigations' ? 50 : 25;
    } else {
      completionPercentage = 0;
    }
    
    const mapped = {
      id: survey._id || survey.id || '',
      title: title,
      status: status,
      completedDate: completedDate,
      startedDate: startedDate,
      responses: responses,
      completionPercentage: completionPercentage,
    };
    console.log('Mapped survey:', mapped);
    return mapped;
  });
};

export interface InviteAccountPayload {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  phoneNumber: string;
  roleId: string;
  agreementConfirmation?: boolean;
  src?: string;
}

export const inviteAccount = async (
  payload: InviteAccountPayload
): Promise<any> => {
  const requestBody = {
    ...payload,
    agreementConfirmation:
      payload.agreementConfirmation === undefined
        ? true
        : payload.agreementConfirmation,
    src: payload.src ?? 'web',
  };

  const response = await apiClient.post(
    `/user/signup`,
    requestBody,
    createAuthHeaders()
  );

  return response.data;
};

