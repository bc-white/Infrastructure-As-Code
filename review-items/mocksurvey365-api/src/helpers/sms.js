const axios = require("axios");
const CONSTANTS = require("../constants/constants");

const sendSMS = async (

) => {
  try {
    
  } catch (error) {
    console.error("SMS sending failed:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

module.exports = {
  sendSMS,
};
