const { SimpleFastAgent } = require("./simpleFastAgent");

/**
 * Fast Ask Mocky365 Agent - Direct replacement for the chunked approach
 * Uses Tavily's extract feature to process PDFs directly
 * No chunking, no embeddings, no similarity calculations needed!
 */
class FastAskMocky365Agent {
  constructor() {
    this.fastAgent = new SimpleFastAgent();
    this.debug = true;
  }

  /**
   * Main entry point - Fast answer generation
   * Compatible with existing API but much faster
   */
  async answerQuestion(question, userId) {
    try {
      if (this.debug) {
        console.log(`\n🚀 Fast Ask Mocky365: "${question}"`);
      }
      
      const result = await this.fastAgent.answerQuestion(question, userId);
      
      // Format response to match existing API
      return {
        answer: result.answer,
        // confidence: result.confidence,
        // sources: result.sources,
        // processing_time_ms: result.processing_time_ms,
        // method: "fast_tavily_extract" // Identifier for the new method
      };
      
    } catch (error) {
      console.error("❌ Fast agent error:", error.message);
      
      // Fallback response
      return {
        answer: "I encountered an error processing your question. Please try again.",
        confidence: "low",
        sources: [],
        error: error.message
      };
    }
  }

  /**
   * Performance comparison method
   */
  async comparePerformance(question, userId) {
    console.log(`\n⚡ Performance Comparison for: "${question}"`);
    console.log("=".repeat(50));
    
    // Test fast method
    const fastStart = Date.now();
    const fastResult = await this.answerQuestion(question, userId);
    const fastTime = Date.now() - fastStart;
    
    console.log(`🚀 Fast Method: ${fastTime}ms`);
    console.log(`📊 Sources: ${fastResult.sources?.length || 0}`);
    console.log(`🎯 Confidence: ${fastResult.confidence}`);
    
    return {
      fast_time_ms: fastTime,
      fast_sources: fastResult.sources?.length || 0,
      fast_confidence: fastResult.confidence,
      answer: fastResult.answer
    };
  }
}

// Export singleton instance for compatibility
const fastAskMocky365Agent = new FastAskMocky365Agent();

module.exports = {
  answerQuestion: (question, userId) => fastAskMocky365Agent.answerQuestion(question, userId),
  comparePerformance: (question, userId) => fastAskMocky365Agent.comparePerformance(question, userId),
  FastAskMocky365Agent
};
