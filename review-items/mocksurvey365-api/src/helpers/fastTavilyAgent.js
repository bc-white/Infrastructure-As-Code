const { OpenAI } = require("openai");
const CONSTANTS = require("../constants/constants");
const CriticalElement = require("../models/configs/critical_elements.model");
const axios = require("axios");

/**
 * Fast Tavily-Powered Ask Mocky365 Agent
 * Uses Tavily's extract feature to directly process PDFs and web content
 * Eliminates the need for chunking, embeddings, and similarity calculations
 */
class FastTavilyAgent {
  constructor() {
    this.tavilyClient = null; // Will be initialized dynamically
    this.tavilyInitialized = false;

    this.openai = new OpenAI({
      apiKey: CONSTANTS.OPENAI_API_KEY,
    });

    this.chatModel = "gpt-4o-mini";
    this.debug = true;
    this.cache = new Map();
    this.CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    // Your local PDF URLs (can be S3 URLs or local paths)
    this.localPDFs = {
      ftags: [
        "https://mocksurvey.s3.amazonaws.com/uploads/list-of-revised-ftags-04282025_1764384212059.pdf",
        "https://mocksurvey.s3.amazonaws.com/uploads/state_operations_manual_2025_%281%29_1764384248769.pdf",
      ],
    };
  }

  /**
   * Initialize Tavily client using dynamic import
   */
  async initializeTavily() {
    if (this.tavilyInitialized) return;
    
    try {
      const { TavilySearchAPIClient } = await import("tavily");
      this.tavilyClient = new TavilySearchAPIClient({
        apiKey: CONSTANTS.TAVILY_API_KEY,
      });
      this.tavilyInitialized = true;
      console.log("✅ Tavily client initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Tavily:", error.message);
      throw error;
    }
  }

  /**
   * Main entry point - Fast answer generation
   */
  async answerQuestion(question, userId) {
    const startTime = Date.now();

    try {
      console.log(`🚀 Fast Question: "${question}"`);

      // Step 0: Initialize Tavily if needed
      await this.initializeTavily();

      // Step 1: Classify question type
      const questionType = this.classifyQuestion(question);
      console.log(`📋 Question Type: ${questionType}`);

      // Step 2: Get relevant content using Tavily extract + search
      const contentSources = await this.getRelevantContent(
        question,
        questionType,
        userId
      );

      if (!contentSources || contentSources.length === 0) {
        return {
          answer:
            "I don't have sufficient information to answer your question.",
          confidence: "low",
          sources: [],
          processing_time_ms: Date.now() - startTime,
        };
      }

      // Step 3: Generate answer using OpenAI with combined content
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
        })),
        processing_time_ms: totalTime,
      };
    } catch (error) {
      console.error("❌ Fast agent error:", error.message);
      throw error;
    }
  }

  /**
   * Get relevant content using Tavily's extract and search features
   */
  async getRelevantContent(question, questionType, userId) {
    const contentSources = [];

    try {
      // For F-tag questions: Extract from local PDFs + web search
      if (questionType === "ftag") {
        const ftagMatch = question.match(/f[\s-]?(\d{3,4})/i);
        const ftagNumber = ftagMatch ? ftagMatch[1] : null;

        if (ftagNumber) {
          // Extract from local F-tag PDFs
          const localContent = await this.extractFromLocalPDFs(
            question,
            this.localPDFs.ftags
          );
          contentSources.push(...localContent);

          // Supplement with web search for updates
          const webContent = await this.searchWeb(
            `CMS F-tag F${ftagNumber} nursing home regulation 42 CFR 483 updates`
          );
          contentSources.push(...webContent);
        }
      }

      // For pathway questions: Extract from pathway PDFs
      else if (questionType === "pathway") {
        const pathwayPDFs = await this.getPathwayPDFs(userId);
        const localContent = await this.extractFromLocalPDFs(
          question,
          pathwayPDFs
        );
        contentSources.push(...localContent);
      }

      // For current events: Web search only
      else if (questionType === "current_events") {
        const webContent = await this.searchWeb(
          `${question}`
        );
        contentSources.push(...webContent);
      }

      // For best practices: Hybrid approach
      else if (questionType === "best_practices") {
        // Quick local extract
        const localContent = await this.extractFromLocalPDFs(
          question,
          this.localPDFs.ftags.slice(0, 1)
        );
        contentSources.push(...localContent);

        // Web search for current practices
        const webContent = await this.searchWeb(
          `${question}`
        );
        contentSources.push(...webContent);
      }

      // For general questions: Smart hybrid
      else {
        const webContent = await this.searchWeb(
          `${question}`
        );
        contentSources.push(...webContent);
      }

      return contentSources;
    } catch (error) {
      console.error("❌ Content retrieval error:", error.message);
      return [];
    }
  }

  /**
   * Extract content from local PDFs using Tavily
   */
  async extractFromLocalPDFs(question, pdfUrls) {
    const extractedContent = [];

    for (const pdfUrl of pdfUrls) {
      try {
        const cacheKey = `extract_${pdfUrl}_${question}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
          const cached = this.cache.get(cacheKey);
          if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
            console.log(`📄 Using cached extract for ${pdfUrl}`);
            extractedContent.push(cached.data);
            continue;
          }
        }

        console.log(`📄 Extracting from ${pdfUrl}...`);

        // Use Tavily's extract feature
        const extractResult = await this.tavilyClient.extract({
          urls: [pdfUrl],
          query: question,
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
          };

          // Cache the result
          this.cache.set(cacheKey, {
            data: content,
            timestamp: Date.now(),
          });

          extractedContent.push(content);
        }
      } catch (error) {
        console.error(`❌ PDF extraction error for ${pdfUrl}:`, error.message);
      }
    }

    return extractedContent;
  }

  /**
   * Search web using Tavily
   */
  async searchWeb(query) {
    try {
      const cacheKey = `web_${query}`;

      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
          console.log(`🌐 Using cached web search for: ${query}`);
          return cached.data;
        }
      }

      console.log(`🌐 Web searching: ${query}`);

      const searchResult = await this.tavilyClient.search({
        query: query,
        search_depth: "advanced",
        include_answer: true,
        include_raw_content: true,
        max_results: 4,
        include_images: true,
        include_domains: [
          "cms.gov",
          "medicare.gov",
          "cdc.gov",
          "hhs.gov",
          "ahcancal.org",
        ],
      });

      const webContent = [];

      if (searchResult && searchResult.results) {
        for (const result of searchResult.results) {
          webContent.push({
            type: "web",
            name: result.title,
            url: result.url,
            content: result.raw_content || result.content,
            relevance_score: result.score || 0.5,
          });
        }
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
   * Generate answer using OpenAI with combined content
   */
  async generateAnswer(question, contentSources, questionType) {
    try {
      // Build context from all sources
      const context = contentSources
        .map((source, idx) => {
          const sourceLabel =
            source.type === "local_pdf"
              ? `[PDF: ${source.name}]`
              : `[Web: ${source.name}]`;
          return `${sourceLabel}\n${source.content}`;
        })
        .join("\n\n---\n\n");

      // Determine answer strategy
      const useStrictRAG =
        questionType === "ftag" || questionType === "pathway";

      const systemPrompt = useStrictRAG
        ? `You are Mocky365, a healthcare regulatory assistant. Provide accurate, comprehensive answers using the provided content.

For F-tag questions, include:
- F-tag number and title
- Regulatory citation (42 CFR)
- Intent and purpose
- Guidance and procedures
- Examples when available

Use only the provided content. Be thorough and professional.`
        : `You are Mocky365, a healthcare expert. Provide comprehensive answers combining the provided sources.

Guidelines:
- Synthesize information from multiple sources
- Prioritize official regulatory content
- Include current best practices
- Be practical and actionable
- Present information clearly`;

      const userPrompt = `Question: ${question}\n\nContent:\n${context}\n\nProvide a comprehensive answer using the information above.`;

      const response = await this.openai.chat.completions.create({
        model: this.chatModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: useStrictRAG ? 0.0 : 0.2,
        max_tokens: 8000,
      });

      const answerText = response.choices[0].message.content.trim();

      // Determine confidence based on source quality
      const hasLocalPDF = contentSources.some((s) => s.type === "local_pdf");
      const avgRelevance =
        contentSources.reduce((sum, s) => sum + s.relevance_score, 0) /
        contentSources.length;

      const confidence =
        hasLocalPDF && avgRelevance > 0.7
          ? "high"
          : avgRelevance > 0.5
          ? "medium"
          : "low";

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
   * Get pathway PDFs from database
   */
  async getPathwayPDFs(userId) {
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
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = { FastTavilyAgent };
