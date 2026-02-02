const { tavily } = require("@tavily/core");
const { OpenAI } = require("openai");
const CONSTANTS = require("../constants/constants");
const CriticalElement = require("../models/configs/critical_elements.model");
const axios = require("axios");

/**
 * Enhanced Fast Agent - Uses @tavily/core for advanced search and PDF extraction
 * Comprehensive agent that can answer any question with web search + PDF processing
 */
class SimpleFastAgent {
  constructor() {
    // Initialize Tavily client directly with @tavily/core
    this.tavilyClient = tavily({
      apiKey: CONSTANTS.TAVILY_API_KEY,
    });
    this.tavilyInitialized = !!CONSTANTS.TAVILY_API_KEY;

    this.openai = new OpenAI({
      apiKey: CONSTANTS.OPENAI_API_KEY,
    });

    this.chatModel = "gpt-4o-mini";
    this.debug = true;
    this.cache = new Map();
    this.CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    // Healthcare-specific domains for targeted search
    this.healthcareDomains = [
      "cms.gov",
      "medicare.gov",
      "cdc.gov",
      "hhs.gov",
      "ahcancal.org",
      "nursinghome411.org",
      "leadingage.org",
    ];

    // Local PDF resources for extraction
    this.localPDFs = {
      ftags: [
        "https://mocksurvey.s3.amazonaws.com/uploads/list-of-revised-ftags-04282025_1764384212059.pdf",
        "https://mocksurvey.s3.amazonaws.com/uploads/state_operations_manual_2025_%281%29_1764384248769.pdf",
      ],
    };
  }

  /**
   * Check Tavily initialization status
   */
  checkTavilyStatus() {
    if (!CONSTANTS.TAVILY_API_KEY) {
      console.log("⚠️ No Tavily API key found");
      this.tavilyInitialized = false;
      return false;
    }

    if (this.tavilyInitialized) {
      console.log("✅ Tavily client ready");
      return true;
    }

    return false;
  }

  /**
   * Main entry point - Fast answer generation
   */
  async answerQuestion(question, userId) {
    const startTime = Date.now();

    try {
      console.log(`🚀 Enhanced Fast Question: "${question}"`);

      // Check Tavily status
      this.checkTavilyStatus();

      // Classify question type
      const questionType = this.classifyQuestion(question);
      console.log(`📋 Question Type: ${questionType}`);

      // Get relevant content
      const contentSources = await this.getRelevantContent(
        question,
        questionType
      );

      if (!contentSources || contentSources.length === 0) {
        return {
          answer:
            "I don't have sufficient information to answer your question. Please try a more specific question about CMS nursing home regulations.",
          confidence: "low",
          sources: [],
          processing_time_ms: Date.now() - startTime,
        };
      }

      // Generate answer
      const answer = await this.generateAnswer(
        question,
        contentSources,
        questionType
      );

      const totalTime = Date.now() - startTime;
      console.log(`⚡ Total processing time: ${totalTime}ms`);

      return {
        answer: answer.text,
        confidence: answer.confidence,
        sources: contentSources.map((s) => ({
          type: s.type,
          name: s.name,
          url: s.url,
          relevance_score: s.relevance_score,
          extracted_at: s.extractedAt,
        })),
        processing_time_ms: totalTime,
        method: "enhanced_tavily_core",
        metadata: {
          total_sources: contentSources.length,
          pdf_sources: contentSources.filter((s) => s.type === "local_pdf")
            .length,
          web_sources: contentSources.filter((s) => s.type === "web").length,
          avg_relevance:
            contentSources.length > 0
              ? (
                  contentSources.reduce(
                    (sum, s) => sum + s.relevance_score,
                    0
                  ) / contentSources.length
                ).toFixed(2)
              : 0,
        },
      };
    } catch (error) {
      console.error("❌ Simple fast agent error:", error.message);

      // Fallback to basic response
      return {
        answer:
          "I encountered an error processing your question. For F-tag questions, please specify the F-tag number (e.g., 'What is F686?'). For general questions, please be more specific about CMS nursing home regulations.",
        confidence: "low",
        sources: [],
        processing_time_ms: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Get relevant content using PDF extraction + web search
   */
  async getRelevantContent(question, questionType) {
    const contentSources = [];
   

    try {
      // For F-tag questions: Extract from PDFs + web search
      if (questionType === "ftag") {
        const ftagMatch = question.match(/f[\s-]?(\d{3,4})/i);
        const ftagNumber = ftagMatch ? ftagMatch[1] : null;

        // Extract from local F-tag PDFs first
        const pdfContent = await this.extractFromPDFs(
          question,
          this.localPDFs.ftags
        );
        contentSources.push(...pdfContent);

        // Supplement with web search
        if (ftagNumber) {
          const webContent = await this.searchWeb(`CMS F-tag F${ftagNumber} `);
          contentSources.push(...webContent);
        } else {
          // Generic F-tag search
          const webContent = await this.searchWeb(`${question}`);
          contentSources.push(...webContent);
        }
      }

      // For pathway questions: Extract from pathway PDFs + web search
      else if (questionType === "pathway") {
        // Extract from pathway PDFs
        const pathwayPDFs = await this.getPathwayPDFs();
        const pdfContent = await this.extractFromPDFs(question, pathwayPDFs);
        contentSources.push(...pdfContent);

        // Supplement with web search
        const webContent = await this.searchWeb(`${question}`);
        contentSources.push(...webContent);
      }

      // For current events: Search for recent updates
      else if (questionType === "current_events") {
        const webContent = await this.searchWeb(`${question}`);
        contentSources.push(...webContent);
      }

      // For best practices: Search for guidance
      else if (questionType === "best_practices") {
        const webContent = await this.searchWeb(` ${question}`);
        contentSources.push(...webContent);
      }

      // For general questions: Broad search
      else {
        const webContent = await this.searchWeb(` ${question}`);
        contentSources.push(...webContent);
      }

      return contentSources;
    } catch (error) {
      console.error("❌ Content retrieval error:", error.message);
      return [];
    }
  }

  /**
   * Advanced web search using @tavily/core
   */
  async searchWeb(query, options = {}) {
    try {
      const cacheKey = `web_${query}_${JSON.stringify(options)}`;

      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
          console.log(`🌐 Using cached web search for: ${query}`);
          return cached.data;
        }
      }

      console.log(`🌐 Advanced web search: ${query}`);

      let webContent = [];

      // Use Tavily if available
      if (this.tavilyInitialized && this.tavilyClient) {
        try {
          const searchParams = {
            search_depth: options.searchDepth || "advanced",
            include_answer: options.includeAnswer !== false,
            include_raw_content: true,
            max_results: options.maxResults || 4,
            include_images: true,
            include_domains: options.includeDomains || this.healthcareDomains,
            ...options,
          };

          const searchResult = await this.tavilyClient.search(query, searchParams);

          if (searchResult && searchResult.results) {
            for (const result of searchResult.results) {
              webContent.push({
                type: "web",
                name: result.title,
                url: result.url,
                content: result.raw_content || result.content,
                relevance_score: result.score || 0.5,
                published_date: result.published_date,
                answer: searchResult.answer, // Include Tavily's generated answer
              });
            }
          }
        } catch (tavilyError) {
          console.error("❌ Tavily search error:", tavilyError.message);
          // Continue with fallback
        }
      }

      // If no Tavily results, provide more specific fallback content
      if (webContent.length === 0) {
        console.log(
          "⚠️ No web search results available, providing knowledge-based response"
        );

        // Provide more specific content based on question type
        let fallbackContent = "";
        const lowerQuery = query.toLowerCase();

        if (
          lowerQuery.includes("f686") ||
          lowerQuery.includes("pressure ulcer")
        ) {
          fallbackContent = `F686 - Pressure Ulcer Prevention and Treatment

**Regulatory Requirement (42 CFR 483.25(c)):**
The facility must ensure that a resident who is at risk of developing pressure ulcers receives preventive care and services to promote healing, prevent infection, and prevent new ulcers from developing.

**Key Requirements:**
- Comprehensive assessment of pressure ulcer risk factors
- Implementation of interventions to prevent pressure ulcers
- Proper treatment of existing pressure ulcers
- Staff training on pressure ulcer prevention
- Documentation of care provided

**Prevention Strategies:**
- Regular repositioning and mobility
- Appropriate support surfaces
- Skin inspection and care
- Nutritional support
- Management of moisture and incontinence`;
        } else if (
          lowerQuery.includes("ftag") ||
          lowerQuery.includes("f-tag")
        ) {
          fallbackContent = `CMS F-Tags are regulatory requirements for nursing homes under 42 CFR 483. Each F-tag represents a specific requirement that facilities must meet to maintain compliance with federal regulations.

**Common F-Tags:**
- F686: Pressure Ulcer Prevention
- F558: Infection Prevention and Control
- F880: Quality Assurance and Performance Improvement
- F689: Medication Management
- F656: Activities Program

**Key Components of F-Tag Compliance:**
1. Regulatory citation (42 CFR reference)
2. Intent and scope of the requirement
3. Definitions of key terms
4. Guidance for implementation
5. Survey procedures for assessment
6. Examples of compliance and noncompliance

For specific F-tag information, refer to the State Operations Manual and 42 CFR 483 regulations.`;
        } else if (
          lowerQuery.includes("pathway") ||
          lowerQuery.includes("investigation")
        ) {
          fallbackContent = `CMS Critical Element Pathways guide surveyors in conducting thorough investigations of potential regulatory violations.

**Investigation Components:**
1. **Review in Advance:** Preparation and planning
2. **Observations:** Direct observation of care and services
3. **Resident Interviews:** Speaking with residents and families
4. **Staff Interviews:** Discussions with nursing staff, administrators
5. **Record Review:** Medical records, policies, documentation

**Key Investigation Areas:**
- Quality of care issues
- Resident rights violations
- Safety concerns
- Infection control practices
- Medication management
- Activities and social services

Each pathway provides specific questions and procedures tailored to the regulatory requirement being investigated.`;
        } else {
          fallbackContent = `CMS nursing home regulations are found in 42 CFR 483 and cover comprehensive requirements for:

**Quality of Care (483.25):**
- Medical and nursing services
- Specialized care needs
- Pressure ulcer prevention
- Medication management

**Resident Rights (483.10-483.15):**
- Dignity and respect
- Self-determination
- Privacy and confidentiality
- Voice grievances

**Quality of Life (483.24):**
- Activities program
- Social services
- Environment

**Administration (483.75):**
- Governing body responsibilities
- Administrator qualifications
- Quality assurance programs

For current updates and specific guidance, refer to cms.gov and the State Operations Manual.`;
        }

        webContent.push({
          type: "knowledge_base",
          name: "CMS Regulatory Knowledge",
          url: "https://cms.gov",
          content: fallbackContent,
          relevance_score: 0.7,
        });
      }

      // Cache the results
      this.cache.set(cacheKey, {
        data: webContent,
        timestamp: Date.now(),
      });

      return webContent;
    } catch (error) {
      console.error("❌ Web search error:", error.message);
      return [];
    }
  }

  /**
   * Extract content from PDFs using Tavily
   */
  async extractFromPDFs(question, pdfUrls) {
    const extractedContent = [];

    if (!this.tavilyInitialized || !this.tavilyClient) {
      console.log("⚠️ Tavily not available for PDF extraction");
      return extractedContent;
    }

    for (const pdfUrl of pdfUrls) {
      try {
        const cacheKey = `extract_${pdfUrl}_${question}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
          const cached = this.cache.get(cacheKey);
          if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
            console.log(
              `📄 Using cached PDF extract for ${this.getPDFName(pdfUrl)}`
            );
            extractedContent.push(cached.data);
            continue;
          }
        }

        console.log(`📄 Extracting from ${this.getPDFName(pdfUrl)}...`);

        // Use Tavily's extract feature
        const extractResult = await this.tavilyClient.extract(question, {
          urls: [pdfUrl],
        });

        if (
          extractResult &&
          extractResult.results &&
          extractResult.results.length > 0
        ) {
          const result = extractResult.results[0];
          const content = {
            type: "local_pdf",
            name: this.getPDFName(pdfUrl),
            url: pdfUrl,
            content: result.raw_content || result.content,
            relevance_score: result.score || 0.8,
            extractedAt: new Date().toISOString(),
          };

          // Cache the result
          this.cache.set(cacheKey, {
            data: content,
            timestamp: Date.now(),
          });

          extractedContent.push(content);
        }
      } catch (error) {
        console.error(
          `❌ PDF extraction error for ${this.getPDFName(pdfUrl)}:`,
          error.message
        );
      }
    }

    return extractedContent;
  }

  /**
   * Get pathway PDFs from database
   */
  async getPathwayPDFs() {
    try {
      const pathways = await CriticalElement.find({
        type: "Resident CE Pathways",
        status: true,
      });

      return pathways.map((p) => p.pdfUrl).filter(Boolean);
    } catch (error) {
      console.error("❌ Error getting pathway PDFs:", error.message);
      return [];
    }
  }

  /**
   * Extract PDF name from URL
   */
  getPDFName(url) {
    try {
      return url.split("/").pop().replace(".pdf", "");
    } catch {
      return "Unknown PDF";
    }
  }

  /**
   * Generate answer using OpenAI
   */
  async generateAnswer(question, contentSources, questionType) {
    try {
      // Build context from sources
      const context = contentSources
        .map((source, idx) => {
          return `[Source: ${source.name}]\n${source.content}`;
        })
        .join("\n\n---\n\n");

      const useStrictRAG =
        questionType === "ftag" || questionType === "pathway";

      const systemPrompt = useStrictRAG
        ? `You are Mocky365, an expert healthcare regulatory assistant with access to official CMS documents and current web information.

For F-tag questions, provide comprehensive information including:
- F-tag number and complete title
- Regulatory citation (42 CFR section with full text)
- Intent and purpose of the regulation
- Detailed guidance and procedures
- Examples of compliance and noncompliance
- Current updates and interpretations

For pathway questions, provide:
- Complete investigation procedures
- All interview questions organized by category
- Observation requirements
- Documentation needs
- Compliance indicators

Use both PDF sources and web information to provide the most complete and current answer possible.`
        : `You are Mocky365, a comprehensive healthcare expert that can answer any question using official regulatory documents and current information.

Provide detailed, practical answers that:
- Synthesize information from multiple authoritative sources
- Include current best practices and updates
- Offer actionable guidance for healthcare professionals
- Address both regulatory requirements and practical implementation

You have access to official CMS documents and current web information to provide accurate, up-to-date responses.`;

      const userPrompt = `Question: ${question}\n\nAvailable Information:\n${context}\n\nProvide a comprehensive answer using the information above and your knowledge of CMS nursing home regulations.`;

      const response = await this.openai.chat.completions.create({
        model: this.chatModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: useStrictRAG ? 0.0 : 0.2,
        max_tokens: 4000,
      });

      const answerText = response.choices[0].message.content.trim();

      // Determine confidence based on source quality and relevance
      const hasLocalPDF = contentSources.some((s) => s.type === "local_pdf");
      const hasWebSources = contentSources.some((s) => s.type === "web");
      const avgRelevance =
        contentSources.reduce((sum, s) => sum + s.relevance_score, 0) /
        contentSources.length;

      let confidence = "low";
      if (hasLocalPDF && avgRelevance > 0.7) {
        confidence = "high";
      } else if ((hasLocalPDF || hasWebSources) && avgRelevance > 0.5) {
        confidence = "medium";
      } else if (avgRelevance > 0.3) {
        confidence = "medium";
      }

      return {
        text: answerText,
        confidence,
      };
    } catch (error) {
      console.error("❌ Answer generation error:", error.message);
      throw error;
    }
  }

  /**
   * Simple question classification
   */
  classifyQuestion(question) {
    const lowerQuestion = question.toLowerCase();

    if (
      /f[\s-]?\d{3,4}/.test(lowerQuestion) ||
      lowerQuestion.includes("f-tag")
    ) {
      return "ftag";
    }

    if (
      ["questions", "interview", "investigate", "pathway"].some((kw) =>
        lowerQuestion.includes(kw)
      )
    ) {
      return "pathway";
    }

    if (
      ["recent", "latest", "new", "updated", "2024", "2025"].some((kw) =>
        lowerQuestion.includes(kw)
      )
    ) {
      return "current_events";
    }

    if (
      ["best practice", "how to", "should", "approach"].some((kw) =>
        lowerQuestion.includes(kw)
      )
    ) {
      return "best_practices";
    }

    return "general";
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = { SimpleFastAgent };
