const { OpenAI } = require("openai");
const CONSTANTS = require("../constants/constants");
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const mongoose = require("mongoose");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");

const openai = new OpenAI({
  apiKey: CONSTANTS.OPENAI_API_KEY,
});

class PredictAgentChunker {
  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1500,
      chunkOverlap: 300,
    });
    
    // Paths to the two source PDFs
    this.DOCS_DIR = path.resolve(__dirname, "..", "docs");
    this.PDF_FILES = [
      {
        filename: "List-of-Revised-FTags-04282025.pdf",
        type: "ftags",
        description: "F-Tag Reference Document"
      },
      {
        filename: "State Operations Manual 2025 (1).pdf", 
        type: "manual",
        description: "State Operations Manual"
      }
    ];
  }

  async processAndStorePredictDocs() {
    console.log("🚀 Processing predict agent documents for chunking...");
    const startTime = Date.now();
    
    const processedDocs = [];
    
    for (const pdfFile of this.PDF_FILES) {
      try {
        const fullPath = path.join(this.DOCS_DIR, pdfFile.filename);
        
        if (!fs.existsSync(fullPath)) {
          console.warn(`⚠️ Skipping ${pdfFile.filename}: File not found`);
          continue;
        }

        console.log(`📖 Processing: ${pdfFile.filename}`);
        
        // Check if already processed and cached
        const cached = await this.getCachedDocument(pdfFile.filename);
        const needsReprocessing = await this.needsReprocessing(cached, fullPath);
        
        if (cached && !needsReprocessing) {
          console.log(`✅ Using cached data for ${pdfFile.filename}`);
          processedDocs.push(cached);
          continue;
        }
        
        if (needsReprocessing) {
          console.log(`🔄 File updated, reprocessing: ${pdfFile.filename}`);
        } else {
          console.log(`🆕 New file, processing: ${pdfFile.filename}`);
        }

        // Extract PDF content
        const pdfContent = await this.extractPDFContent(fullPath);
        
        // Create chunks
        const chunks = await this.textSplitter.splitText(pdfContent);
        
        // Extract structured data using AI
        const structuredData = await this.extractDocumentStructure(chunks, pdfFile);
        
        const processedDoc = {
          filename: pdfFile.filename,
          type: pdfFile.type,
          description: pdfFile.description,
          chunks: chunks,
          structured: structuredData,
          processedAt: new Date(),
          fileStats: fs.statSync(fullPath),
          lastModified: fs.statSync(fullPath).mtime
        };

        // Cache the processed document
        await this.cacheDocument(processedDoc);
        processedDocs.push(processedDoc);
        
      } catch (error) {
        console.error(`❌ Error processing ${pdfFile.filename}:`, error.message);
        // Add minimal document data to continue processing
        processedDocs.push({
          filename: pdfFile.filename,
          type: pdfFile.type,
          description: pdfFile.description,
          chunks: [],
          structured: this.getDefaultStructure(pdfFile.type),
          error: error.message
        });
      }
    }
    
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Processed ${processedDocs.length} documents in ${processingTime}s`);
    
    return processedDocs;
  }

  async extractPDFContent(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error(`PDF extraction error for ${filePath}:`, error.message);
      throw error;
    }
  }

  async extractDocumentStructure(chunks, pdfFile) {
    try {
      // Use first few chunks for structure extraction
      const relevantContent = chunks.slice(0, 4).join('\n\n');
      
      let systemPrompt;
      
      if (pdfFile.type === 'ftags') {
        systemPrompt = `
          You are a CMS nursing home survey expert analyzing the F-Tag reference document.
          
          Extract and return ONLY a valid JSON object with this structure:
          {
            "ftags": [
              {
                "number": "F123",
                "title": "Full F-tag title",
                "category": "category name",
                "keywords": ["keyword1", "keyword2"]
              }
            ],
            "categories": ["category1", "category2"],
            "keyTerms": ["term1", "term2", "term3"],
            "commonIssues": ["issue1", "issue2"]
          }
          
          Focus on:
          - F-tag numbers (F followed by numbers)
          - Complete F-tag titles and descriptions
          - Categories of F-tags (e.g., "Food Service", "Nursing Services")
          - Keywords that help identify when each F-tag applies
          - Common compliance issues mentioned
        `;
      } else {
        systemPrompt = `
          You are a CMS nursing home survey expert analyzing the State Operations Manual.
          
          Extract and return ONLY a valid JSON object with this structure:
          {
            "interpretiveGuidance": [
              {
                "ftag": "F123",
                "guidance": "key interpretive guidance",
                "keywords": ["keyword1", "keyword2"]
              }
            ],
            "surveyProcedures": ["procedure1", "procedure2"],
            "keyTerms": ["term1", "term2", "term3"],
            "complianceIndicators": ["indicator1", "indicator2"]
          }
          
          Focus on:
          - Interpretive guidance for F-tags
          - Survey procedures and methodologies
          - Key compliance indicators
          - Important regulatory terms and definitions
        `;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract from "${pdfFile.description}":\n\n${relevantContent.substring(0, 6000)}` }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const content = response.choices[0].message.content.trim();
      
      // Clean the response to ensure valid JSON
      let jsonString = content;
      if (content.includes('```json')) {
        jsonString = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        jsonString = content.split('```')[1].trim();
      }

      return JSON.parse(jsonString);
      
    } catch (error) {
      console.error(`Structure extraction error for ${pdfFile.filename}:`, error.message);
      return this.getDefaultStructure(pdfFile.type);
    }
  }

  getDefaultStructure(type) {
    if (type === 'ftags') {
      return {
        ftags: [],
        categories: [],
        keyTerms: [],
        commonIssues: []
      };
    } else {
      return {
        interpretiveGuidance: [],
        surveyProcedures: [],
        keyTerms: [],
        complianceIndicators: []
      };
    }
  }

  async getCachedDocument(filename) {
    try {
      const collection = mongoose.connection.collection("predict_agent_chunks");
      const cached = await collection.findOne({ filename: filename });
      
      if (cached && cached.processedAt) {
        // Check if cache is less than 30 days old (these are static reference docs)
        const cacheAge = Date.now() - new Date(cached.processedAt).getTime();
        if (cacheAge < 30 * 24 * 60 * 60 * 1000) { // 30 days
          return cached;
        }
      }
      return null;
    } catch (error) {
      console.error("Cache retrieval error:", error.message);
      return null;
    }
  }

  async needsReprocessing(cachedDoc, filePath) {
    try {
      // If no cached data, needs processing
      if (!cachedDoc) {
        return false; // Will be handled as new processing
      }

      // Check if file has been modified since last processing
      const currentStats = fs.statSync(filePath);
      const cachedModified = cachedDoc.lastModified;

      if (!cachedModified) {
        console.log(`⚠️ Cannot determine modification time for ${path.basename(filePath)}, reprocessing`);
        return true;
      }

      const currentTime = new Date(currentStats.mtime).getTime();
      const cachedTime = new Date(cachedModified).getTime();

      // If current file is newer than cached version, needs reprocessing
      if (currentTime > cachedTime) {
        console.log(`📅 File ${path.basename(filePath)} modified: ${new Date(currentStats.mtime).toISOString()} > ${new Date(cachedModified).toISOString()}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error checking reprocessing need for ${path.basename(filePath)}:`, error.message);
      // If we can't determine, err on the side of reprocessing
      return true;
    }
  }

  async cacheDocument(docData) {
    try {
      const collection = mongoose.connection.collection("predict_agent_chunks");
      await collection.replaceOne(
        { filename: docData.filename },
        docData,
        { upsert: true }
      );
      console.log(`💾 Cached document: ${docData.filename}`);
    } catch (error) {
      console.error("Cache storage error:", error.message);
    }
  }

  // Enhanced retrieval method that uses structured data for better F-tag matching
  retrieveRelevantChunks(question, processedDocs, k = 10) {
    if (!processedDocs || processedDocs.length === 0) return [];
    
    const q = (question || "").toLowerCase();
    if (!q) {
      // Return top chunks from both documents
      const allChunks = [];
      processedDocs.forEach(doc => {
        if (doc.chunks && doc.chunks.length > 0) {
          allChunks.push(...doc.chunks.slice(0, Math.ceil(k/2)).map(chunk => ({
            text: chunk,
            source: doc.description,
            type: doc.type
          })));
        }
      });
      return allChunks.slice(0, k);
    }

    const terms = q
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .filter((t) => t.length > 2);

    const allScoredChunks = [];

    processedDocs.forEach(doc => {
      if (!doc.chunks || doc.chunks.length === 0) return;

      // Score chunks using both text matching and structured data
      doc.chunks.forEach((chunk, idx) => {
        const text = (chunk || "").toLowerCase();
        let score = 0;

        // Basic keyword matching
        for (const term of terms) {
          const matches = text.split(term).length - 1;
          score += matches;
        }

        // Boost based on document type and structured data
        if (doc.structured) {
          if (doc.type === 'ftags' && doc.structured.ftags) {
            // Boost if question relates to specific F-tags
            doc.structured.ftags.forEach(ftag => {
              if (ftag.keywords) {
                ftag.keywords.forEach(keyword => {
                  if (q.includes(keyword.toLowerCase())) {
                    score += 2;
                  }
                });
              }
            });
          }

          // Boost for key terms
          if (doc.structured.keyTerms) {
            doc.structured.keyTerms.forEach(term => {
              if (q.includes(term.toLowerCase())) {
                score += 1.5;
              }
            });
          }
        }

        // Domain-specific boosts
        const boosts = [
          "ftag", "f-tag", "483", "label", "food", "date", "use-by", 
          "expiration", "storage", "kitchen", "nursing", "medication",
          "infection", "control", "safety", "quality", "care"
        ];
        
        for (const b of boosts) {
          if (text.includes(b)) score += 0.5;
        }

        allScoredChunks.push({
          text: chunk,
          score: score,
          source: doc.description,
          type: doc.type,
          idx: idx
        });
      });
    });

    // Sort by score and return top k
    allScoredChunks.sort((a, b) => b.score - a.score);
    return allScoredChunks.slice(0, k);
  }

  // Get structured F-tag information for enhanced prediction
  getStructuredFtagInfo(processedDocs) {
    const ftagInfo = {
      ftags: [],
      categories: [],
      interpretiveGuidance: []
    };

    processedDocs.forEach(doc => {
      if (doc.structured) {
        if (doc.type === 'ftags' && doc.structured.ftags) {
          ftagInfo.ftags.push(...doc.structured.ftags);
        }
        if (doc.type === 'ftags' && doc.structured.categories) {
          ftagInfo.categories.push(...doc.structured.categories);
        }
        if (doc.type === 'manual' && doc.structured.interpretiveGuidance) {
          ftagInfo.interpretiveGuidance.push(...doc.structured.interpretiveGuidance);
        }
      }
    });

    return ftagInfo;
  }
}

module.exports = {
  PredictAgentChunker
};
