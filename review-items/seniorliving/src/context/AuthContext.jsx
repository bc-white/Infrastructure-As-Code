import { createContext, useContext, useState, useEffect } from 'react'
import { mockAuthService } from '../services/mockAuthService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [])

  // Check if user has valid session
  const checkSession = async () => {
    try {
      setIsLoading(true)
      const currentUser = await mockAuthService.getCurrentUser()
      
      if (currentUser) {
        setUser(currentUser)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Error checking session:', error)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Login function
  const login = async (email, password) => {
    try {
      setIsLoading(true)
      const response = await mockAuthService.login(email, password)
      
      // User is set after OTP verification, not here
      // But we store the session token
      return {
        success: true,
        user: response.user,
        requiresOTP: true
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error.message || 'Login failed. Please check your credentials.'
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Signup function
  const signup = async (email, password, name) => {
    try {
      setIsLoading(true)
      const response = await mockAuthService.signup(email, password, name)
      
      // User is set after OTP verification, not here
      return {
        success: true,
        user: response.user,
        requiresOTP: true
      }
    } catch (error) {
      console.error('Signup error:', error)
      return {
        success: false,
        error: error.message || 'Signup failed. Please try again.'
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Verify OTP and set user session
  const verifyOTP = async (email, otpCode) => {
    try {
      setIsLoading(true)
      const response = await mockAuthService.verifyOTP(email, otpCode)
      
      if (response.user) {
        setUser(response.user)
        setIsAuthenticated(true)
        return {
          success: true,
          user: response.user,
          onboardingCompleted: response.user.onboardingCompleted || false
        }
      }
      
      return {
        success: false,
        error: 'OTP verification failed'
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      return {
        success: false,
        error: error.message || 'Invalid OTP code. Please try again.'
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Complete onboarding
  const completeOnboarding = async (onboardingData) => {
    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      setIsLoading(true)
      const response = await mockAuthService.completeOnboarding(user.id, onboardingData)
      
      if (response.user) {
        setUser(response.user)
        return {
          success: true,
          user: response.user,
          facility: response.facility
        }
      }
      
      return {
        success: false,
        error: 'Onboarding completion failed'
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      return {
        success: false,
        error: error.message || 'Failed to complete onboarding. Please try again.'
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true)
      await mockAuthService.logout()
      setUser(null)
      setIsAuthenticated(false)
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, clear local state
      setUser(null)
      setIsAuthenticated(false)
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    try {
      const currentUser = await mockAuthService.getCurrentUser()
      
      if (currentUser) {
        setUser(currentUser)
        setIsAuthenticated(true)
        return currentUser
      } else {
        setUser(null)
        setIsAuthenticated(false)
        return null
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
      setIsAuthenticated(false)
      return null
    }
  }

  // Send OTP
  const sendOTP = async (email) => {
    try {
      await mockAuthService.sendOTP(email)
      return { success: true }
    } catch (error) {
      console.error('Send OTP error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send OTP. Please try again.'
      }
    }
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    verifyOTP,
    completeOnboarding,
    logout,
    refreshUser,
    sendOTP,
    checkSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

export default AuthContext

