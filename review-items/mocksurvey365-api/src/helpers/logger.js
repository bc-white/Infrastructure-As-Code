const AuditLog = require("../models/user-model/audit.model");
const axios = require("axios");

const auditLogger = async (action, activity, auditType, userId = null) => {
    try {
        // Get IP information
        const ipResponse = await axios.get("https://api.db-ip.com/v2/free/self");
        const ipData = ipResponse?.data || {};

        // Prepare log data
        const logData = {
            ipAddress: ipData.ipAddress,
            continentCode: ipData.continentCode,
            continentName: ipData.continentName,
            countryCode: ipData.countryCode,
            countryName: ipData.countryName,
            stateProv: ipData.stateProv,
            city: ipData.city,
            auditType,
            activity,
            action,
            dateTime: Date.now(),
            ...(userId && { userId }) // Only add userId if it exists
        };

        // Create and save log
        const newLogger = new AuditLog(logData);
        await newLogger.save();
        
        return { success: true, message: 'Audit log created successfully' };
    } catch (error) {
        console.error('Audit logging failed:', error.message);
        return { 
            success: false, 
            message: 'Failed to create audit log',
            error: error.message 
        };
    }
};

module.exports = auditLogger;
