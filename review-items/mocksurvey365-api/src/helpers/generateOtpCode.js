const User = require("../models/user-model/user.model");
const generateUniqueOtp = async () => {
  let otp;
  let isUnique = false;

  // Repeat until a unique OTP is found
  while (!isUnique) {
    otp = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit OTP

    // Check if OTP exists in the database
    const existingUser = await User.findOne({ otp });
    if (!existingUser) {
      isUnique = true; // OTP is unique
    }
  }

  return otp;
};

// generate refferal code
const generateUniqueReferralCode = async (organization) => {
  // Get the first two letters of the organization, uppercase
  const initial = organization.trim().substring(0, 2).toUpperCase();
  let uniqueCode;
  let isUnique = false;

  while (!isUnique) {
    // Generate a 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    uniqueCode = `${initial}${code}`;

    // Check if uniqueCode exists in the database
    const existingUser = await User.findOne({ uniqueCode });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return uniqueCode;
};




const generateUniquePassword = async () => {
  let password;
  let isUnique = false;

  // Repeat until a unique password is found
  while (!isUnique) {
    password = Math.floor(10000000 + Math.random() * 90000000); // Generate an 8-digit password

    // Check if password exists in the database
    const existingUser = await User.findOne({ password: password.toString() });
    if (!existingUser) {
      isUnique = true; // Password is unique
    }
  }

  return password.toString(); // Convert to string before returning
};

module.exports = {
  generateUniqueOtp,
  generateUniqueReferralCode,
  generateUniquePassword,
};
