

require('dotenv').config();
const mongoose = require('mongoose');
const { CONSTANTS } = require('../constants/constants');
const { processFacilityEntranceDocuments } = require('../helpers/createChunks');

// Sample test data
const TEST_DOCUMENTS = {
     form802: {
        docUrl: "https://mocksurvey.s3.amazonaws.com/uploads/skilled_nursing_cms_802-completed_2_%281%29_1758879442440.xlsx", // Replace with actual URL
        name: "Form 802"
      },
      form671: {
        docUrl: "https://mocksurvey.s3.amazonaws.com/uploads/cms-671_508_enabled_1758924985504.pdf", // Replace with actual URL
        name: "Form 671"
      },
      casperQmIqies: {
        docUrl: "https://mocksurvey.s3.amazonaws.com/uploads/mds_3_1758879708445.pdf", // Replace with actual URL
        name: "Casper QM IQIES"
      }
};

// Sample resident data
const TEST_RESIDENTS = [
  {
    id: 1758173366638,
    name: "Jackie Chen",
    room: "111",
    admissionDate: "01/09/2025",
    diagnosis: "falls",
    specialTypes: ["Wound Care", "IV Therapy", "Dialysis"],
    included: true,
    isNewAdmission: true,
    fiFlagged: false,
    ijHarm: false,
    surveyorNotes: "Patient has multiple falls in the past month."
  },
  {
    id: 1758173366639,
    name: "Michael Smith",
    room: "112",
    admissionDate: "02/15/2025",
    diagnosis: "diabetes, hypertension",
    specialTypes: ["Diabetes Management", "Physical Therapy"],
    included: true,
    isNewAdmission: false,
    fiFlagged: true,
    ijHarm: false,
    surveyorNotes: "Blood sugar levels unstable last week."
  }
];

/**
 * Simple function to test document and resident processing
 */
async function runTest() {
  try {
    console.log('Starting simple test of processFacilityEntranceDocuments...');

    
    // Create test survey ID
    const testSurveyId = `test_survey_${Date.now()}`;
    console.log(`Using test survey ID: ${testSurveyId}`);
    
    // Process test data
    console.log('Processing test documents and residents...');
    const result = await processFacilityEntranceDocuments(
      TEST_DOCUMENTS,
      testSurveyId,
      TEST_RESIDENTS
    );
    
    console.log('Processing result:', result);
    
    // Verify the chunks in database
    if (result.success) {
    //   const collection = mongoose.connection.collection("document_chunks");
    //   const chunkCount = await collection.countDocuments({ 'metadata.surveyId': testSurveyId });
      //console.log(`Found ${chunkCount} chunks in database for survey ${testSurveyId}`);
      
      // Print a sample chunk
     // const sampleChunk = await collection.findOne({ 'metadata.surveyId': testSurveyId });
      //console.log('Sample chunk:', JSON.stringify(sampleChunk, null, 2));
      
      // Clean up test data
      console.log('Cleaning up test data...');
     // const deleteResult = await collection.deleteMany({ 'metadata.surveyId': testSurveyId });
     //console.log(`Deleted ${deleteResult.deletedCount} test chunks`);
    }
    
    
  } catch (error) {
    console.error('Error in test:', error);
    
  }
}

// Run the test if script is executed directly
if (require.main === module) {
  runTest()
    .then(() => {
      console.log('Test script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { runTest };
