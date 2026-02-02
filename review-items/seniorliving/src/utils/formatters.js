// Data formatting utilities

// Format date to readable string
export const formatDate = (date) => {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return ''
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format date and time
export const formatDateTime = (date) => {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return ''
  
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Format date to YYYY-MM-DD for input fields
export const formatDateForInput = (date) => {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return ''
  
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// Format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Format as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  
  return phone
}

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Format currency
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return ''
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Format number with commas
export const formatNumber = (number) => {
  if (number === null || number === undefined) return ''
  
  return new Intl.NumberFormat('en-US').format(number)
}

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  
  return text.slice(0, maxLength) + '...'
}

// Capitalize first letter
export const capitalize = (text) => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Capitalize each word
export const capitalizeWords = (text) => {
  if (!text) return ''
  return text.split(' ').map(word => capitalize(word)).join(' ')
}

// Get initials from name
export const getInitials = (name) => {
  if (!name) return ''
  
  const words = name.trim().split(' ')
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

// Format role name for display
export const formatRoleName = (roleId) => {
  const roleNames = {
    system_admin: 'System Administrator',
    facility_admin: 'Facility Administrator',
    survey_admin: 'Survey Administrator',
    don: 'Director of Health Services / DON',
    compliance_officer: 'Compliance Officer',
    survey_coordinator: 'Survey Coordinator',
    clinical_staff: 'Clinical Staff',
    viewer: 'Viewer'
  }
  
  return roleNames[roleId] || roleId
}

