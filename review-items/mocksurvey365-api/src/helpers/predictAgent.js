const { OpenAI } = require("openai");
const CONSTANTS = require("../constants/constants");
const { PredictAgentChunker } = require("./predictAgentChunker");

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: CONSTANTS.OPENAI_API_KEY });

// Initialize chunker
const chunker = new PredictAgentChunker();

// Cache for processed documents
let processedDocs = null;
let lastProcessed = null;

async function loadAndChunkDocs() {
  // Check if we need to reload (cache for 1 hour in memory)
  const now = Date.now();
  if (processedDocs && lastProcessed && (now - lastProcessed) < 60 * 60 * 1000) {
    return processedDocs;
  }

  console.log("🔄 Loading and processing predict agent documents...");
  processedDocs = await chunker.processAndStorePredictDocs();
  lastProcessed = now;
  
  return processedDocs;
}

// Retrieve top-k relevant chunks using enhanced scoring
function retrieveRelevantChunks(question, docs, k = 10) {
  if (!docs || docs.length === 0) return [];
  
  const relevantChunks = chunker.retrieveRelevantChunks(question, docs, k);
  return relevantChunks.map(chunk => chunk.text);
}

// Predict the applicable FTag and citation with compliance determination.
async function predictAgent(question, answer) {
  // Load docs & build context
  const docs = await loadAndChunkDocs();
  const contextChunks = retrieveRelevantChunks(question, docs, 12);
  const context = contextChunks.join("\n\n---\n\n");
  
  // Get structured F-tag information for enhanced prediction
  const structuredInfo = chunker.getStructuredFtagInfo(docs);
  
  // Build enhanced context with structured data
  let enhancedContext = context;
  if (structuredInfo.ftags.length > 0) {
    const relevantFtags = structuredInfo.ftags
      .filter(ftag => {
        const q = question.toLowerCase();
        return ftag.keywords && ftag.keywords.some(keyword => 
          q.includes(keyword.toLowerCase())
        );
      })
      .slice(0, 5);
    
    if (relevantFtags.length > 0) {
      enhancedContext += "\n\n=== RELEVANT F-TAGS ===\n";
      relevantFtags.forEach(ftag => {
        enhancedContext += `${ftag.number}: ${ftag.title}\n`;
      });
    }
  }

  const systemPrompt = `
 You are an expert CMS nursing home survey inspector with deep knowledge of F-tags and regulations.
 You are given context from:
 - List of Revised FTags (with tag numbers and titles)
 - State Operations Manual (interpretive guidance)
 - Structured F-tag information with keywords and categories

 Task:
 - Based ONLY on the provided context, determine the most relevant FTag for the user's issue.
 - Provide the exact FTag number (e.g., "F812") and complete title if available.
 - Include a brief but specific citation from the manual that explains why this F-tag applies.
 - Consider the compliance context: if the answer indicates non-compliance, focus on violation aspects.
 - Be precise and deterministic in your F-tag selection.
 - If multiple F-tags could apply, choose the most specific one.
 - If uncertain, select the closest match and indicate "closest match" in explanation.

 Output JSON with keys: ftag (string), citation (string), explanation (string).
 `;

  const compliance = String(answer).toLowerCase() === "yes";
  const complianceContext = compliance ? "compliant" : "non-compliant";

  // Ask model using small temperature and JSON mode
  const completion = await openai.chat.completions
    .create({
      model: "gpt-4o",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `User Question: ${question}\nAnswer: ${answer} (${complianceContext})\n\nContext:\n${enhancedContext}`,
        },
      ],
      max_tokens: 800,
    })
    .catch(async (e) => {
      // Fallback model
      return openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `User Question: ${question}\nAnswer: ${answer} (${complianceContext})\n\nContext:\n${enhancedContext}`,
          },
        ],
        max_tokens: 800,
      });
    });

  let ftag = "";
  let citation = "";
  let explanation = "";
  try {
    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    ftag = parsed.ftag || "";
    citation = parsed.citation || "";
    explanation = parsed.explanation || "";
  } catch (_) {
    // Keep minimal graceful handling
    ftag = "";
    citation = "";
    explanation = "Unable to parse model response.";
  }

  return { ftag, citation, compliant: compliance, explanation };
}

module.exports = { predictAgent };
