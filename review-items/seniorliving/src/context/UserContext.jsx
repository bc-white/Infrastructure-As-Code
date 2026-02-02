import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { mockAuthService } from '../services/mockAuthService'

const UserContext = createContext(null)

export const UserProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [facility, setFacility] = useState(null)
  const [role, setRole] = useState(null)
  const [permissions, setPermissions] = useState([])

  // Load facility and role data when user changes
  useEffect(() => {
    if (user && isAuthenticated) {
      loadUserData()
    } else {
      setFacility(null)
      setRole(null)
      setPermissions([])
    }
  }, [user, isAuthenticated])

  // Load facility and role information
  const loadUserData = async () => {
    if (!user) return

    // Load facility if user has facilityId
    if (user.facilityId) {
      const facilityData = mockAuthService.getFacilityById(user.facilityId)
      setFacility(facilityData || null)
    } else {
      setFacility(null)
    }

    // Load role if user has role
    if (user.role) {
      const roles = mockAuthService.getRoles()
      const roleData = roles.find(r => r.id === user.role)
      setRole(roleData || null)
      setPermissions(roleData?.permissions || [])
    } else {
      setRole(null)
      setPermissions([])
    }
  }

  // Check if user has specific permission
  const hasPermission = (permission) => {
    return permissions.includes(permission)
  }

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissionList) => {
    return permissionList.some(permission => permissions.includes(permission))
  }

  // Check if user has all of the specified permissions
  const hasAllPermissions = (permissionList) => {
    return permissionList.every(permission => permissions.includes(permission))
  }

  // Check if user has specific role
  const hasRole = (roleId) => {
    return user?.role === roleId
  }

  // Check if user has any of the specified roles
  const hasAnyRole = (roleList) => {
    return roleList.includes(user?.role)
  }

  // Check if user can access a resource (basic implementation)
  const canAccess = (resource, action) => {
    const requiredPermission = `${action}_${resource}`
    return hasPermission(requiredPermission) || hasRole('system_admin')
  }

  // Get role name for display
  const getRoleName = () => {
    if (!role) return 'No Role Assigned'
    return role.name
  }

  // Get role description
  const getRoleDescription = () => {
    if (!role) return ''
    return role.description
  }

  // Refresh user data (including facility and role)
  const refreshUserData = async () => {
    await loadUserData()
  }

  const value = {
    user,
    facility,
    role,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    canAccess,
    getRoleName,
    getRoleDescription,
    refreshUserData
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

// Custom hook to use user context
export const useUser = () => {
  const context = useContext(UserContext)
  
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  
  return context
}

export default UserContext

