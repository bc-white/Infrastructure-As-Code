const { OpenAI } = require("openai");
const CONSTANTS = require("../constants/constants");
const axios = require("axios");
const pdf = require("pdf-parse");
const mongoose = require("mongoose");
const PQueue = require('p-queue').default
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { extractCriticalElementsFromPDF, formatPathwayContent } = require("./cEpathwayExtraction");

const openai = new OpenAI({
  apiKey: CONSTANTS.OPENAI_API_KEY,
});

class PathwayChunker {
  constructor() {
    // Create text splitter for chunking - larger chunks to capture more content
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1500,
      chunkOverlap: 300,
    });
  }

  async processAndStorePathways(criticalElementPathWays) {
    console.log("🚀 Processing pathways for fast chunking...");
    const startTime = Date.now();
    
    const processedPathways = [];
    
    for (const pathway of criticalElementPathWays) {
      try {
        if (!pathway.pdflink) {
          console.warn(`⚠️ Skipping pathway ${pathway.name}: No PDF link`);
          continue;
        }

        console.log(`📖 Processing: ${pathway.name}`);
        
        // Check if already processed and cached, and if PDF has been updated
        const cached = await this.getCachedPathway(pathway._id);
        const needsReprocessing = await this.needsReprocessing(cached, pathway);
        
        if (cached && !needsReprocessing) {
          console.log(`✅ Using cached data for ${pathway.name}`);
          processedPathways.push(cached);
          continue;
        }
        
        if (needsReprocessing) {
          console.log(`🔄 PDF updated, reprocessing: ${pathway.name}`);
        } else {
          console.log(`🆕 New PDF, processing: ${pathway.name}`);
        }

        // Download and extract PDF
        const pdfContent = await this.extractPDFContent(pathway.pdflink);
        
        // Create chunks
        const chunks = await this.textSplitter.splitText(pdfContent);
        console.log(`📄 PDF Content for ${pathway.name}: ${pdfContent.length} characters, ${chunks.length} chunks`);
        console.log(`📝 First chunk preview: ${chunks[0]?.substring(0, 200)}...`);
        
        // Extract structured data using rule-based extraction (cleaner and more reliable)
        const structuredData = await this.extractPathwayStructure(pathway.pdflink, pathway.name);
        
        const processedPathway = {
          id: pathway._id,
          name: pathway.name,
          chunks: chunks,
          structured: structuredData,
          processedAt: new Date(),
          pdflink: pathway.pdflink,
          pathwayUpdatedAt: pathway.updatedAt || pathway.createdAt || new Date(),
          userId: pathway.userId
        };

        // Cache the processed pathway
        await this.cachePathway(processedPathway);
        processedPathways.push(processedPathway);
        
      } catch (error) {
        console.error(`❌ Error processing ${pathway.name}:`, error.message);
        // Add minimal pathway data to continue processing
        processedPathways.push({
          id: pathway._id,
          name: pathway.name,
          chunks: [],
          structured: this.getDefaultStructure(),
          error: error.message
        });
      }
    }
    
    // Clean up old cached pathways that are no longer in the current list
    await this.cleanupOldCachedPathways(criticalElementPathWays);
    
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Processed ${processedPathways.length} pathways in ${processingTime}s`);
    
    return processedPathways;
  }

  async extractPDFContent(pdfUrl) {
    try {
      const response = await axios.get(pdfUrl, { 
        responseType: "arraybuffer",
        timeout: 15000 // Reduced timeout
      });
      const fileBuffer = Buffer.from(response.data);
      const data = await pdf(fileBuffer);
      return data.text;
    } catch (error) {
      console.error(`PDF extraction error for ${pdfUrl}:`, error.message);
      throw error;
    }
  }

  async extractPathwayStructure(pdfUrl, pathwayName) {
    try {
      console.log(`📝 Extracting pathway structure for: ${pathwayName}`);
      
      // Use rule-based extraction from cEpathwayExtraction.js (more reliable)
      const extractedContent = await extractCriticalElementsFromPDF(pdfUrl);
      
      if (!extractedContent || Object.keys(extractedContent).length === 0) {
        console.log(`⚠️ No content extracted from ${pathwayName}, using default structure`);
        return this.getDefaultStructure();
      }
      
      // Format the extracted content to get summary metadata
      const formattedContent = formatPathwayContent(extractedContent);
      
      // Extract metadata using AI-powered analysis for better accuracy
      console.log(`🤖 Using AI to extract clinical focus areas for ${pathwayName}...`);
      const clinicalFocusAreas = await this.aiExtractClinicalFocusAreas(pathwayName, extractedContent);
      const ftags = this.extractFTags(extractedContent);
      const investigationTriggers = this.extractInvestigationTriggers(pathwayName, extractedContent);
      const keyTerms = this.extractKeyTerms(extractedContent);
      
      // Convert to the expected structure format with enhanced metadata
      const structuredData = {
        clinicalFocusAreas: clinicalFocusAreas,
        ftags: ftags,
        investigationTriggers: investigationTriggers,
        keyTerms: keyTerms,
        structuredQuestions: {
          reviewInAdvance: extractedContent.reviewInAdvance?.map(item => item.content || item) || [],
          observations: extractedContent.observations?.map(item => item.content || item) || [],
          residentInterviews: extractedContent.residentInterviews?.map(item => item.content || item) || [],
          staffInterviews: extractedContent.staffInterviews?.map(item => item.content || item) || [],
          recordReview: extractedContent.recordReview?.map(item => item.content || item) || []
        },
        extractionMetadata: formattedContent.summary
      };
      
      console.log(`📊 Extracted structured questions for ${pathwayName}:`, {
        reviewInAdvance: structuredData.structuredQuestions.reviewInAdvance.length,
        observations: structuredData.structuredQuestions.observations.length,
        residentInterviews: structuredData.structuredQuestions.residentInterviews.length,
        staffInterviews: structuredData.structuredQuestions.staffInterviews.length,
        recordReview: structuredData.structuredQuestions.recordReview.length,
        clinicalFocusAreas: structuredData.clinicalFocusAreas.length,
        ftags: structuredData.ftags.length
      });
      
      // Log sample extracted questions to verify quality
      if (structuredData.structuredQuestions) {
        console.log(`📝 Sample extracted questions from ${pathwayName}:`);
        Object.entries(structuredData.structuredQuestions).forEach(([section, questions]) => {
          if (questions && questions.length > 0) {
            console.log(`  ${section}: "${questions[0].substring(0, 100)}..." (${questions.length} total)`);
          }
        });
      }

      return structuredData;
      
    } catch (error) {
      console.error(`Structure extraction error for ${pathwayName}:`, error.message);
      return this.getDefaultStructure();
    }
  }


  // Helper methods to extract metadata from pathway content
  async aiExtractClinicalFocusAreas(pathwayName, extractedContent) {
    try {
      // Get sample content from pathway
      const sampleContent = [];
      ['reviewInAdvance', 'observations', 'residentInterviews', 'staffInterviews', 'recordReview'].forEach(section => {
        if (extractedContent[section] && Array.isArray(extractedContent[section])) {
          const items = extractedContent[section].slice(0, 3).map(item => item.content || item);
          if (items.length > 0) {
            sampleContent.push(`${section}: ${items.join(' | ')}`);
          }
        }
      });

      const prompt = `Analyze this CMS Critical Element pathway and identify the specific clinical focus areas it covers.

PATHWAY NAME: ${pathwayName}

SAMPLE CONTENT:
${sampleContent.join('\n\n')}

INSTRUCTIONS:
1. Based on the pathway name and sample questions, identify the PRIMARY clinical focus areas
2. Be SPECIFIC and PRECISE - avoid generic terms
3. Consider what patient conditions or needs this pathway would investigate
4. Return 3-6 focused clinical areas

EXAMPLES:
- "Pain Recognition and Management" → ["pain assessment", "pain management", "pain interventions", "comfort care"]
- "Dialysis" → ["dialysis", "renal care", "kidney disease", "hemodialysis"]
- "Positioning, Mobility and Range of Motion" → ["positioning", "mobility", "range of motion", "fall prevention"]

RESPOND IN JSON FORMAT:
{
  "focusAreas": ["specific area 1", "specific area 2", "specific area 3"],
  "reasoning": "Brief explanation of why these areas were selected"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a CMS nursing home survey expert analyzing Critical Element pathways." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);
      console.log(`🤖 AI extracted focus areas for ${pathwayName}:`, result.focusAreas);
      console.log(`   Reasoning: ${result.reasoning}`);
      
      return result.focusAreas || [];

    } catch (error) {
      console.error(`❌ AI focus area extraction error for ${pathwayName}:`, error.message);
      // Fallback to rule-based extraction
      return this.extractClinicalFocusAreas(pathwayName, extractedContent);
    }
  }

  extractClinicalFocusAreas(pathwayName, extractedContent) {
    const focusAreas = [];
    const pathwayNameLower = pathwayName.toLowerCase();
    const allContent = this.getAllContentText(extractedContent).toLowerCase();
    
    // PRECISE clinical focus areas - only match based on pathway name to avoid false positives
    // We prioritize pathway name over content to ensure accurate matching
    
    // Pressure Ulcer/Wound Care pathways
    if (pathwayNameLower.includes('pressure ulcer') || pathwayNameLower.includes('wound')) {
      focusAreas.push('pressure ulcers', 'wound care', 'skin integrity', 'ulcer prevention');
    }
    
    // Fall/Accident pathways
    if (pathwayNameLower.includes('fall') || pathwayNameLower.includes('accident')) {
      focusAreas.push('falls', 'fall prevention', 'accident investigation', 'injury prevention');
    }
    
    // Positioning/Mobility/ROM pathways
    if (pathwayNameLower.includes('positioning') || pathwayNameLower.includes('mobility') || 
        pathwayNameLower.includes('rom') || pathwayNameLower.includes('range of motion')) {
      focusAreas.push('positioning', 'mobility', 'range of motion', 'rom', 'fall prevention', 'movement');
    }
    
    // Medication pathways (SPECIFIC - not pain management)
    if (pathwayNameLower.includes('medication') || pathwayNameLower.includes('psychotropic') ||
        pathwayNameLower.includes('unnecessary medications') || pathwayNameLower.includes('antipsychotic')) {
      focusAreas.push('medication management', 'psychotropic medications', 'antipsychotic medications', 
                      'medication review', 'pharmacy services', 'unnecessary medications');
    }
    
    // Pain Management pathways (SPECIFIC - only for pain, not general medications)
    if (pathwayNameLower.includes('pain recognition') || pathwayNameLower.includes('pain management')) {
      focusAreas.push('pain management', 'pain assessment', 'pain recognition', 'comfort care', 'pain interventions');
    }
    
    // Restraint pathways
    if (pathwayNameLower.includes('restraint')) {
      focusAreas.push('restraints', 'physical restraints', 'behavioral interventions', 'restraint alternatives');
    }
    
    // Nutrition/Hydration pathways
    if (pathwayNameLower.includes('nutrition') || pathwayNameLower.includes('hydration') ||
        pathwayNameLower.includes('weight loss') || pathwayNameLower.includes('tube feeding')) {
      focusAreas.push('nutrition', 'dietary services', 'hydration', 'weight management', 'nutritional assessment');
    }
    
    // Dementia/Behavioral pathways
    if (pathwayNameLower.includes('dementia') || pathwayNameLower.includes('behavioral')) {
      focusAreas.push('dementia care', 'behavioral health', 'cognitive impairment', 'behavioral interventions');
    }
    
    // Infection Control pathways
    if (pathwayNameLower.includes('infection') || pathwayNameLower.includes('antibiotic')) {
      focusAreas.push('infection control', 'infection prevention', 'antibiotic stewardship', 'uti prevention');
    }
    
    // Dialysis pathways (VERY SPECIFIC)
    if (pathwayNameLower.includes('dialysis') || pathwayNameLower.includes('renal')) {
      focusAreas.push('dialysis', 'renal care', 'kidney disease', 'hemodialysis', 'peritoneal dialysis');
    }
    
    // Quality/QAPI pathways
    if (pathwayNameLower.includes('quality') || pathwayNameLower.includes('qapi')) {
      focusAreas.push('quality assurance', 'performance improvement', 'qapi', 'quality measures');
    }
    
    // Discharge Planning pathways
    if (pathwayNameLower.includes('discharge') || pathwayNameLower.includes('transition')) {
      focusAreas.push('discharge planning', 'transition of care', 'care transitions');
    }
    
    // Respiratory pathways
    if (pathwayNameLower.includes('respiratory') || pathwayNameLower.includes('oxygen')) {
      focusAreas.push('respiratory care', 'oxygen therapy', 'breathing treatments');
    }
    
    return [...new Set(focusAreas)]; // Remove duplicates
  }
  
  getAllContentText(extractedContent) {
    let allText = '';
    
    // Combine all content from all sections
    ['reviewInAdvance', 'observations', 'residentInterviews', 'staffInterviews', 'recordReview'].forEach(section => {
      if (extractedContent[section] && Array.isArray(extractedContent[section])) {
        extractedContent[section].forEach(item => {
          allText += (item.content || item) + ' ';
        });
      }
    });
    
    return allText;
  }
  
  extractFTags(extractedContent) {
    const ftags = [];
    const allContent = this.getAllContentText(extractedContent);
    
    // Extract F-tag patterns (F followed by numbers)
    const ftagMatches = allContent.match(/F\d{3,4}/g);
    if (ftagMatches) {
      ftags.push(...ftagMatches);
    }
    
    return [...new Set(ftags)]; // Remove duplicates
  }
  
  extractInvestigationTriggers(pathwayName, extractedContent) {
    const triggers = [];
    const pathwayNameLower = pathwayName.toLowerCase();
    const allContent = this.getAllContentText(extractedContent).toLowerCase();
    
    // Common investigation triggers
    const triggerKeywords = [
      'pressure ulcer', 'wound', 'fall', 'medication error', 'restraint use',
      'pain management', 'infection', 'weight loss', 'dehydration',
      'behavioral issue', 'dementia care', 'discharge planning'
    ];
    
    triggerKeywords.forEach(trigger => {
      if (pathwayNameLower.includes(trigger) || allContent.includes(trigger)) {
        triggers.push(trigger);
      }
    });
    
    return triggers;
  }
  
  extractKeyTerms(extractedContent) {
    const keyTerms = [];
    const allContent = this.getAllContentText(extractedContent).toLowerCase();
    
    // Common healthcare terms to extract
    const healthcareTerms = [
      'wound', 'ulcer', 'fall', 'medication', 'restraint', 'pain',
      'nutrition', 'behavior', 'dementia', 'infection', 'assessment',
      'care plan', 'intervention', 'treatment', 'resident', 'facility',
      'staff', 'nurse', 'physician', 'documentation', 'review'
    ];
    
    healthcareTerms.forEach(term => {
      if (allContent.includes(term)) {
        keyTerms.push(term);
      }
    });
    
    return keyTerms;
  }
  
  getAllContentText(extractedContent) {
    let allText = '';
    
    // Combine all content from all sections
    ['reviewInAdvance', 'observations', 'residentInterviews', 'staffInterviews', 'recordReview'].forEach(section => {
      if (extractedContent[section] && Array.isArray(extractedContent[section])) {
        extractedContent[section].forEach(item => {
          allText += (item.content || item) + ' ';
        });
      }
    });
    
    return allText;
  }

  getDefaultStructure() {
    return {
      clinicalFocusAreas: [],
      ftags: [],
      investigationTriggers: [],
      keyTerms: [],
      structuredQuestions: {
        reviewInAdvance: [],
        observations: [],
        residentInterviews: [],
        staffInterviews: [],
        recordReview: []
      },
      extractionMetadata: {
        totalQuestions: 0,
        totalInstructions: 0,
        sectionBreakdown: {},
        error: "Failed to extract pathway structure"
      }
    };
  }

  async getCachedPathway(pathwayId) {
    try {
      const collection = mongoose.connection.collection("pathway_chunks");
      const cached = await collection.findOne({ pathwayId: pathwayId.toString() });
      
      if (cached && cached.processedAt) {
        // Check if cache is less than 7 days old (extended from 24 hours since we now check updatedAt)
        const cacheAge = Date.now() - new Date(cached.processedAt).getTime();
        if (cacheAge < 7 * 24 * 60 * 60 * 1000) { // 7 days
          return cached;
        }
      }
      return null;
    } catch (error) {
      console.error("Cache retrieval error:", error.message);
      return null;
    }
  }

  async needsReprocessing(cachedPathway, currentPathway) {
    try {
      // If no cached data, needs processing
      if (!cachedPathway) {
        return false; // Will be handled as new processing
      }

      // Check if pathway has been updated since last processing
      const currentUpdatedAt = currentPathway.updatedAt || currentPathway.createdAt;
      const cachedUpdatedAt = cachedPathway.pathwayUpdatedAt;

      if (!currentUpdatedAt || !cachedUpdatedAt) {
        // If we can't determine update times, reprocess to be safe
        console.log(`⚠️ Cannot determine update times for ${currentPathway.name}, reprocessing`);
        return true;
      }

      const currentTime = new Date(currentUpdatedAt).getTime();
      const cachedTime = new Date(cachedUpdatedAt).getTime();

      // If current pathway is newer than cached version, needs reprocessing
      if (currentTime > cachedTime) {
        console.log(`📅 Pathway ${currentPathway.name} updated: ${new Date(currentUpdatedAt).toISOString()} > ${new Date(cachedUpdatedAt).toISOString()}`);
        return true;
      }

      // Check if PDF link has changed
      if (cachedPathway.pdflink !== currentPathway.pdflink) {
        console.log(`🔗 PDF link changed for ${currentPathway.name}`);
        return true;
      }

      // Check if user has changed (different user might have different access/version)
      if (cachedPathway.userId && currentPathway.userId && 
          cachedPathway.userId.toString() !== currentPathway.userId.toString()) {
        console.log(`👤 User changed for ${currentPathway.name}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error checking reprocessing need for ${currentPathway.name}:`, error.message);
      // If we can't determine, err on the side of reprocessing
      return true;
    }
  }

  async cachePathway(pathwayData) {
    try {
      const collection = mongoose.connection.collection("pathway_chunks");
      await collection.replaceOne(
        { pathwayId: pathwayData.id.toString() },
        { ...pathwayData, pathwayId: pathwayData.id.toString() },
        { upsert: true }
      );
      console.log(`💾 Cached pathway: ${pathwayData.name}`);
    } catch (error) {
      console.error("Cache storage error:", error.message);
    }
  }

  async cleanupOldCachedPathways(currentPathways) {
    try {
      const collection = mongoose.connection.collection("pathway_chunks");
      
      // Get current pathway IDs
      const currentPathwayIds = currentPathways.map(p => p._id.toString());
      
      // Find cached pathways that are no longer in the current list
      const cachedPathways = await collection.find({}).toArray();
      const pathwaysToDelete = cachedPathways.filter(cached => 
        !currentPathwayIds.includes(cached.pathwayId)
      );

      if (pathwaysToDelete.length > 0) {
        console.log(`🧹 Cleaning up ${pathwaysToDelete.length} old cached pathways`);
        
        const idsToDelete = pathwaysToDelete.map(p => p.pathwayId);
        await collection.deleteMany({ pathwayId: { $in: idsToDelete } });
        
        pathwaysToDelete.forEach(p => {
          console.log(`🗑️ Removed cached pathway: ${p.name || p.pathwayId}`);
        });
      }
    } catch (error) {
      console.error("Cache cleanup error:", error.message);
    }
  }
}

module.exports = {
  PathwayChunker
};
