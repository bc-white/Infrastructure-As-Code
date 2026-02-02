// Validation utilities

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation (minimum 6 characters for mock)
export const isValidPassword = (password) => {
  return password && password.length >= 6
}

// OTP validation (6 digits)
export const isValidOTP = (otp) => {
  const otpRegex = /^\d{6}$/
  return otpRegex.test(otp)
}

// Phone number validation (basic US format)
export const isValidPhone = (phone) => {
  if (!phone) return true // Optional field
  const phoneRegex = /^[\d\s\(\)\-]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

// Zip code validation (US format)
export const isValidZipCode = (zipCode) => {
  const zipRegex = /^\d{5}(-\d{4})?$/
  return zipRegex.test(zipCode)
}

// License number validation (alphanumeric, at least 3 characters)
export const isValidLicenseNumber = (licenseNumber) => {
  if (!licenseNumber) return false
  const licenseRegex = /^[A-Z0-9-]{3,}$/i
  return licenseRegex.test(licenseNumber.trim())
}

// Capacity validation (positive integer)
export const isValidCapacity = (capacity) => {
  const num = parseInt(capacity, 10)
  return !isNaN(num) && num > 0 && num <= 10000
}

// Required field validation
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return value !== null && value !== undefined && value !== ''
}

// Validate facility name
export const validateFacilityName = (name) => {
  if (!isRequired(name)) {
    return 'Facility name is required'
  }
  if (name.trim().length < 2) {
    return 'Facility name must be at least 2 characters'
  }
  return null
}

// Validate facility address
export const validateFacilityAddress = (address) => {
  if (!isRequired(address)) {
    return 'Facility address is required'
  }
  if (address.trim().length < 5) {
    return 'Please enter a valid address'
  }
  return null
}

// Validate facility city
export const validateFacilityCity = (city) => {
  if (!isRequired(city)) {
    return 'City is required'
  }
  if (city.trim().length < 2) {
    return 'Please enter a valid city'
  }
  return null
}

// Validate facility zip code
export const validateFacilityZipCode = (zipCode) => {
  if (!isRequired(zipCode)) {
    return 'Zip code is required'
  }
  if (!isValidZipCode(zipCode)) {
    return 'Please enter a valid zip code (e.g., 12345 or 12345-6789)'
  }
  return null
}

// Validate facility license number
export const validateFacilityLicenseNumber = (licenseNumber) => {
  if (!isRequired(licenseNumber)) {
    return 'Facility license number is required'
  }
  if (!isValidLicenseNumber(licenseNumber)) {
    return 'License number must be at least 3 alphanumeric characters'
  }
  return null
}

// Validate facility capacity
export const validateFacilityCapacity = (capacity) => {
  if (!isRequired(capacity)) {
    return 'Facility capacity is required'
  }
  if (!isValidCapacity(capacity)) {
    return 'Capacity must be a positive number (1-10,000)'
  }
  return null
}

// Validate email field
export const validateEmail = (email) => {
  if (!isRequired(email)) {
    return 'Email is required'
  }
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address'
  }
  return null
}

// Validate password field
export const validatePassword = (password) => {
  if (!isRequired(password)) {
    return 'Password is required'
  }
  if (!isValidPassword(password)) {
    return 'Password must be at least 6 characters'
  }
  return null
}

// Validate confirm password
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!isRequired(confirmPassword)) {
    return 'Please confirm your password'
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match'
  }
  return null
}

// Validate OTP
export const validateOTP = (otp) => {
  if (!isRequired(otp)) {
    return 'OTP code is required'
  }
  if (!isValidOTP(otp)) {
    return 'OTP must be 6 digits'
  }
  return null
}

// Validate name field
export const validateName = (name) => {
  if (!isRequired(name)) {
    return 'Name is required'
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters'
  }
  return null
}

// Validate role selection
export const validateRole = (role) => {
  if (!isRequired(role)) {
    return 'Please select a role'
  }
  return null
}

// Validate state selection
export const validateState = (state) => {
  if (!isRequired(state)) {
    return 'Please select a state'
  }
  return null
}

