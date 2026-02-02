// Mock Authentication Service
// Simulates backend API calls using localStorage
// TODO: Replace with real API service when backend is ready

import mockUsersData from '../data/mockUsers.json'
import mockFacilitiesData from '../data/mockFacilities.json'
import mockRolesData from '../data/mockRoles.json'

// Storage keys
const STORAGE_KEYS = {
  USERS: 'mock_users',
  FACILITIES: 'mock_facilities',
  SESSION: 'mock_session',
  OTP: 'mock_otp'
}

// Initialize mock data in localStorage if not exists
const initializeMockData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsersData.users))
  }
  if (!localStorage.getItem(STORAGE_KEYS.FACILITIES)) {
    localStorage.setItem(STORAGE_KEYS.FACILITIES, JSON.stringify(mockFacilitiesData.facilities))
  }
}

// Generate session token
const generateSessionToken = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Generate OTP code
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Simulate API delay
const delay = (ms = 300) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Get users from localStorage
const getUsers = () => {
  const usersJson = localStorage.getItem(STORAGE_KEYS.USERS)
  return usersJson ? JSON.parse(usersJson) : []
}

// Save users to localStorage
const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

// Get facilities from localStorage
const getFacilities = () => {
  const facilitiesJson = localStorage.getItem(STORAGE_KEYS.FACILITIES)
  return facilitiesJson ? JSON.parse(facilitiesJson) : []
}

// Save facilities to localStorage
const saveFacilities = (facilities) => {
  localStorage.setItem(STORAGE_KEYS.FACILITIES, JSON.stringify(facilities))
}

// Initialize on module load
initializeMockData()

// Export service functions
export const mockAuthService = {
  // Login with email and password
  login: async (email, password) => {
    await delay(300)
    
    const users = getUsers()
    const user = users.find(u => u.email === email && u.password === password)
    
    if (!user) {
      throw new Error('Invalid email or password')
    }
    
    // Create session
    const sessionToken = generateSessionToken()
    const session = {
      token: sessionToken,
      userId: user.id,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session))
    
    // Remove password from returned user
    const { password: _, ...userWithoutPassword } = user
    
    // Send OTP
    await mockAuthService.sendOTP(email)
    
    return {
      user: userWithoutPassword,
      sessionToken
    }
  },

  // Signup new user
  signup: async (email, password, name) => {
    await delay(400)
    
    const users = getUsers()
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      throw new Error('User with this email already exists')
    }
    
    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      password, // TODO: Hash password when backend is ready
      name,
      role: null,
      facilityId: null,
      onboardingCompleted: false,
      createdAt: new Date().toISOString()
    }
    
    users.push(newUser)
    saveUsers(users)
    
    // Create session
    const sessionToken = generateSessionToken()
    const session = {
      token: sessionToken,
      userId: newUser.id,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    }
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session))
    
    // Send OTP
    await mockAuthService.sendOTP(email)
    
    // Remove password from returned user
    const { password: _, ...userWithoutPassword } = newUser
    
    return {
      user: userWithoutPassword,
      sessionToken
    }
  },

  // Send OTP code to email
  sendOTP: async (email) => {
    await delay(200)
    
    const otpCode = generateOTP()
    // For testing: also accept "123456" as a valid OTP
    const otp = {
      email,
      code: otpCode,
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    }
    
    localStorage.setItem(STORAGE_KEYS.OTP, JSON.stringify(otp))
    
    // In a real app, this would send an email
    // For development, log to console
    console.log(`[Mock] OTP sent to ${email}: ${otpCode}`)
    console.log(`[Mock] For testing, you can also use: 123456`)
    
    return { success: true }
  },

  // Verify OTP code
  verifyOTP: async (email, otpCode) => {
    await delay(250)
    
    const otpJson = localStorage.getItem(STORAGE_KEYS.OTP)
    
    if (!otpJson) {
      throw new Error('OTP code expired or not found')
    }
    
    const otp = JSON.parse(otpJson)
    
    // Check if OTP is expired
    if (Date.now() > otp.expiresAt) {
      localStorage.removeItem(STORAGE_KEYS.OTP)
      throw new Error('OTP code has expired. Please request a new one.')
    }
    
    // Check if email matches
    if (otp.email !== email) {
      throw new Error('Invalid OTP code')
    }
    
    // Check if code matches (accept test code 123456)
    if (otp.code !== otpCode && otpCode !== '123456') {
      throw new Error('Invalid OTP code')
    }
    
    // OTP verified, remove it
    localStorage.removeItem(STORAGE_KEYS.OTP)
    
    // Get user from session
    const sessionJson = localStorage.getItem(STORAGE_KEYS.SESSION)
    if (!sessionJson) {
      throw new Error('Session not found')
    }
    
    const session = JSON.parse(sessionJson)
    const users = getUsers()
    const user = users.find(u => u.id === session.userId)
    
    if (!user) {
      throw new Error('User not found')
    }
    
    // Remove password from returned user
    const { password: _, ...userWithoutPassword } = user
    
    return {
      user: userWithoutPassword,
      verified: true
    }
  },

  // Complete onboarding
  completeOnboarding: async (userId, onboardingData) => {
    await delay(350)
    
    const users = getUsers()
    const user = users.find(u => u.id === userId)
    
    if (!user) {
      throw new Error('User not found')
    }
    
    // Create or update facility
    const facilities = getFacilities()
    let facility = facilities.find(f => f.licenseNumber === onboardingData.facilityLicenseNumber)
    
    if (!facility) {
      // Create new facility
      facility = {
        id: `facility-${Date.now()}`,
        name: onboardingData.facilityName,
        address: onboardingData.facilityAddress,
        city: onboardingData.facilityCity,
        zipCode: onboardingData.facilityZipCode,
        state: onboardingData.facilityState || 'Florida', // Use selected state
        phone: onboardingData.facilityPhone || '',
        licenseNumber: onboardingData.facilityLicenseNumber,
        capacity: onboardingData.facilityCapacity,
        createdAt: new Date().toISOString()
      }
      facilities.push(facility)
      saveFacilities(facilities)
    }
    
    // Update user with onboarding data
    user.role = onboardingData.role
    user.facilityId = facility.id
    user.onboardingCompleted = true
    
    saveUsers(users)
    
    // Remove password from returned user
    const { password: _, ...userWithoutPassword } = user
    
    return {
      user: userWithoutPassword,
      facility
    }
  },

  // Get current user from session
  getCurrentUser: async () => {
    await delay(100)
    
    const sessionJson = localStorage.getItem(STORAGE_KEYS.SESSION)
    
    if (!sessionJson) {
      return null
    }
    
    const session = JSON.parse(sessionJson)
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(STORAGE_KEYS.SESSION)
      return null
    }
    
    const users = getUsers()
    const user = users.find(u => u.id === session.userId)
    
    if (!user) {
      return null
    }
    
    // Remove password from returned user
    const { password: _, ...userWithoutPassword } = user
    
    return userWithoutPassword
  },

  // Refresh session
  refreshSession: async () => {
    await delay(150)
    
    const sessionJson = localStorage.getItem(STORAGE_KEYS.SESSION)
    
    if (!sessionJson) {
      return null
    }
    
    const session = JSON.parse(sessionJson)
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(STORAGE_KEYS.SESSION)
      return null
    }
    
    // Extend session expiration
    session.expiresAt = Date.now() + (24 * 60 * 60 * 1000)
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session))
    
    return mockAuthService.getCurrentUser()
  },

  // Logout
  logout: async () => {
    await delay(100)
    
    localStorage.removeItem(STORAGE_KEYS.SESSION)
    localStorage.removeItem(STORAGE_KEYS.OTP)
    
    return { success: true }
  },

  // Get all roles (for onboarding)
  getRoles: () => {
    return mockRolesData.roles
  },

  // Get role by ID
  getRoleById: (roleId) => {
    return mockRolesData.roles.find(r => r.id === roleId)
  },

  // Get facility by ID
  getFacilityById: (facilityId) => {
    const facilities = getFacilities()
    return facilities.find(f => f.id === facilityId)
  },

  // Get all facilities
  getAllFacilities: () => {
    return getFacilities()
  },

  // Get users by facility ID
  getUsersByFacility: (facilityId) => {
    const users = getUsers()
    return users.filter(u => u.facilityId === facilityId && u.onboardingCompleted)
  },

  // Get all users (for admin purposes)
  getAllUsers: () => {
    const users = getUsers()
    // Remove passwords from returned users
    return users.map(({ password: _, ...user }) => user)
  }
}

export default mockAuthService

