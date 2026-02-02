const { OpenAI } = require("openai");
const axios = require("axios");
const pdf = require("pdf-parse");
const CONSTANTS = require("../constants/constants");

const openai = new OpenAI({ apiKey: CONSTANTS.OPENAI_API_KEY });

class PlanOfCorrectionService {
  static normalizeFtag(ftag) {
    if (!ftag || typeof ftag !== "string") return "";
    const match = ftag.match(/f\D*(\d{3,4})/i);
    if (match && match[1]) return `F${match[1]}`;
    return ftag.trim().toUpperCase();
  }
  static getFtagNumber(ftag) {
    const normalized = this.normalizeFtag(ftag);
    const match = normalized.match(/F(\d{3,4})/i);
    if (!match || !match[1]) return Number.POSITIVE_INFINITY;
    return parseInt(match[1], 10);
  }

  static async extractPDFContent(pdfUrl) {
    try {
      console.log(`Extracting content from PDF: ${pdfUrl}`);

      const response = await axios.get(pdfUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
      });

      const pdfBuffer = Buffer.from(response.data);
      const pdfData = await pdf(pdfBuffer);

      return {
        text: pdfData.text,
        pages: pdfData.numpages,
        info: pdfData.info,
      };
    } catch (error) {
      console.error("Error extracting PDF content:", error.message);
      throw new Error(`Failed to extract PDF content: ${error.message}`);
    }
  }


  static splitTextIntoChunks(text, maxChunkSize = 6000) {
    const chunks = [];

    // First, try to split by F-tag sections to keep citations together
    const ftagSections = this.splitByFTagSections(text);

    let currentChunk = "";

    for (const section of ftagSections) {
      // If adding this section would exceed chunk size and we have content
      if (
        (currentChunk + section).length > maxChunkSize &&
        currentChunk.length > 0
      ) {
        // If the section itself is too large, split it by lines as fallback
        if (section.length > maxChunkSize) {
          // Save current chunk first
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
          }

          // Split large section by lines
          const lineChunks = this.splitLargeSection(section, maxChunkSize);
          chunks.push(...lineChunks);
          currentChunk = "";
        } else {
          // Save current chunk and start new one with this section
          chunks.push(currentChunk.trim());
          currentChunk = section;
        }
      } else {
        // Add section to current chunk
        currentChunk += (currentChunk ? "\n\n" : "") + section;
      }
    }

    // Add final chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // Safety check: Force-split any chunks that are still too large
    const finalChunks = [];
    for (const chunk of chunks) {
      if (chunk.length > maxChunkSize) {
        console.warn(
          `Force-splitting oversized chunk of ${chunk.length} characters`
        );
        const splitChunks = this.splitLargeSection(chunk, maxChunkSize);
        finalChunks.push(...splitChunks);
      } else {
        finalChunks.push(chunk);
      }
    }

    return finalChunks;
  }

  /**
   * Split text by F-tag sections to keep citations together
   */
  static splitByFTagSections(text) {
    const sections = [];

    // Try multiple F-tag patterns to catch different formats
    const ftagPatterns = [
      /(?=F\d{3,4}\s*[–-])/g, // F123 – or F123 -
      /(?=F\d{3,4}\s*[-–—])/g, // F123 with various dashes
      /(?=F\d{3,4}\s)/g, // F123 followed by space
      /(?=F\d{3,4}[^\d])/g, // F123 not followed by digit
      /(?=\bF\d{3,4}\b)/g, // F123 as word boundary
    ];

    let bestSplit = null;
    let maxSections = 0;

    // Try each pattern and use the one that creates the most sections
    for (const pattern of ftagPatterns) {
      const parts = text.split(pattern);
      if (parts.length > maxSections) {
        maxSections = parts.length;
        bestSplit = parts;
      }
    }

    if (bestSplit && bestSplit.length > 1) {
      // The first part might be table of contents or intro
      if (bestSplit[0] && bestSplit[0].trim()) {
        sections.push(bestSplit[0].trim());
      }

      // Process remaining parts (each should start with an F-tag)
      for (let i = 1; i < bestSplit.length; i++) {
        const part = bestSplit[i].trim();
        if (part) {
          sections.push(part);
        }
      }

      console.log(
        `Found ${sections.length} F-tag sections using pattern matching`
      );
      return sections;
    }

    // If no F-tag sections found, use intelligent fallback chunking
    console.log("No F-tag sections found, using intelligent fallback chunking");
    return this.intelligentFallbackChunking(text);
  }

  /**
   * Intelligent fallback chunking when F-tag patterns don't work
   */
  static intelligentFallbackChunking(text, maxChunkSize = 6000) {
    const chunks = [];

    // Try to split by common section markers first
    const sectionMarkers = [
      /\n\s*Page \d+/g, // Page breaks
      /\n\s*STATEMENT OF DEFICIENCIES/g, // Statement sections
      /\n\s*PLAN OF CORRECTION/g, // POC sections
      /\n\s*PROVIDER'S PLAN/g, // Provider sections
      /\n\s*SURVEY INFORMATION/g, // Survey info
      /\n\s*FACILITY INFORMATION/g, // Facility info
      /\n\s*\d+\.\s/g, // Numbered sections
      /\n\s*[A-Z][A-Z\s]{10,}/g, // All caps headers
    ];

    let bestSections = [text]; // Default to whole text

    for (const marker of sectionMarkers) {
      const sections = text.split(marker);
      if (sections.length > bestSections.length) {
        bestSections = sections;
      }
    }

    // Now chunk the sections to stay under maxChunkSize
    let currentChunk = "";

    for (const section of bestSections) {
      const trimmedSection = section.trim();
      if (!trimmedSection) continue;

      // If adding this section would exceed chunk size
      if (
        (currentChunk + trimmedSection).length > maxChunkSize &&
        currentChunk.length > 0
      ) {
        // If the section itself is too large, split it by lines
        if (trimmedSection.length > maxChunkSize) {
          // Save current chunk first
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
          }

          // Split large section by lines
          const lineChunks = this.splitLargeSection(
            trimmedSection,
            maxChunkSize
          );
          chunks.push(...lineChunks);
          currentChunk = "";
        } else {
          // Save current chunk and start new one with this section
          chunks.push(currentChunk.trim());
          currentChunk = trimmedSection;
        }
      } else {
        // Add section to current chunk
        currentChunk += (currentChunk ? "\n\n" : "") + trimmedSection;
      }
    }

    // Add final chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    console.log(`Created ${chunks.length} chunks using intelligent fallback`);
    return chunks.length > 0 ? chunks : [text]; // Ensure we always return at least one chunk
  }

  /**
   * Split large section by lines as fallback
   */
  static splitLargeSection(section, maxChunkSize) {
    const chunks = [];
    const lines = section.split("\n");
    let currentChunk = "";

    for (const line of lines) {
      // If this single line is too large, split it by words
      if (line.length > maxChunkSize) {
        // Save current chunk first if it has content
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = "";
        }

        // Split the large line by words
        const words = line.split(" ");
        let wordChunk = "";

        for (const word of words) {
          if (
            (wordChunk + " " + word).length > maxChunkSize &&
            wordChunk.length > 0
          ) {
            chunks.push(wordChunk.trim());
            wordChunk = word;
          } else {
            wordChunk += (wordChunk ? " " : "") + word;
          }
        }

        if (wordChunk.trim()) {
          currentChunk = wordChunk;
        }
        continue;
      }

      // Normal line processing
      if (
        (currentChunk + "\n" + line).length > maxChunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk.trim());
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? "\n" : "") + line;
      }
    }

    // Add final chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // Ensure we never return empty chunks array
    return chunks.length > 0 ? chunks : [section.substring(0, maxChunkSize)];
  }

  static async parseCitationData(pdfText) {
    try {
      console.log("Parsing citation data from PDF text...");
      console.log(`PDF text length: ${pdfText.length} characters`);

      // Split text into manageable chunks
      const chunks = this.splitTextIntoChunks(pdfText, 6000);
      console.log(`Split PDF into ${chunks.length} chunks for processing`);

      // Debug: Log chunk sizes to identify any that are too large
      chunks.forEach((chunk, index) => {
        const chunkSize = chunk.length;
        console.log(`Chunk ${index + 1}: ${chunkSize} characters`);
        if (chunkSize > 10000) {
          console.warn(
            `WARNING: Chunk ${
              index + 1
            } is very large (${chunkSize} chars) - may exceed token limits`
          );
        }
      });

      const systemPrompt = `You are an expert healthcare compliance analyst specializing in CMS survey reports and citation analysis.

Your task is to extract structured citation information from CMS-2567 survey reports or similar healthcare facility citation documents.

IMPORTANT: This text may contain either:
1. A table of contents listing F-tags with brief descriptions
2. Complete citation details with regulatory requirements and deficiencies
3. A mix of both

For each F-tag found, extract the following information:
1. F-Tag number (e.g., F580, F686, F812, F700, F757, F838, F840, F865, F880)
2. Regulation/Standard violated (if available)
3. Deficiency description/finding (if available)
4. Resident information (if applicable)
5. Dates mentioned (if applicable)
6. Specific violations or non-compliance issues (if available)
7. Severity level (if mentioned)
8. Scope (if mentioned)

CRITICAL INSTRUCTIONS:
- EXTRACT ALL F-tags found, even if they only appear in a table of contents
- If an F-tag appears in table of contents without full details, still extract it with available information
- For regulation extraction, capture the COMPLETE regulation text as it appears in the PDF:
  * "Right to be Informed/Make Treatment Decisions CFR(s): 483.10(c)(1)(4)(5)"
  * "Quality of care CFR(s): 483.25(b)(1)(i)(ii)"
  * "Emergency Preparedness Program CFR(s): 483.73(a)"
- If only F-tag number and title are available (table of contents), extract those
- DO NOT skip F-tags just because they don't have complete citation details
- Look for patterns like "F700 – Bed Rails" or "F838 – Emergency Preparedness Program"

Return the data as a JSON array where each citation is an object with these fields:
- ftag: string (F-tag number - REQUIRED)
- regulation: string (regulation text if available, or empty string if not found)
- deficiency: string (deficiency description if available, or empty string if not found)
- residentInfo: string (resident details if applicable, or empty string)
- dates: array of strings (relevant dates, or empty array)
- violations: array of strings (specific violations, or empty array)
- severity: string (if mentioned, or empty string)
- scope: string (if mentioned, or empty string)
- rawText: string (original text section for this citation)

EXTRACT ALL F-tags found, regardless of whether they have complete information.
If no F-tags are found at all, return an empty array.`;

      let allCitations = [];
      const failedChunks = [];
      const MAX_RETRIES_PER_CHUNK = 3;

      // Process chunks sequentially to avoid rate limiting
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        // Add delay to avoid rate limiting
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const userPrompt = `Extract citation information from this CMS survey report text:

${chunk}

CRITICAL: Extract ALL F-tags found in this text, including:
- F700, F757, F812, F838, F840, F865, F880 (if present)
- Any other F-tags you find

For each F-tag found:
1. Extract the F-tag number (e.g., F700, F757, F812, F838, F840, F865, F880)
2. Look for regulation title/description (e.g., "Bed Rails", "Emergency Preparedness Program")
3. Look for CFR or regulatory code if available
4. Extract any deficiency description if available
5. If only table of contents entry, extract what's available

Examples of what to extract:
- Table of contents: "F700 – Bed Rails (F Level)" → Extract F700 with title "Bed Rails"
- Full citation: "F838 – Emergency Preparedness Program\nRegulatory Requirement: 42 CFR §483.73(a)" → Extract complete info
- Brief mention: "F880 – Infection Prevention and Control" → Extract F880 with title

DO NOT skip F-tags just because they lack complete citation details.
EXTRACT ALL F-tags found, even from table of contents sections.

Return only valid JSON array format with all F-tags found.`;

        let chunkProcessed = false;
        for (let attempt = 1; attempt <= MAX_RETRIES_PER_CHUNK; attempt++) {
          try {
            console.log(
              `Processing chunk ${i + 1}/${chunks.length} (attempt ${attempt}/${MAX_RETRIES_PER_CHUNK})`
            );

            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini", // Use mini model for better rate limits
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.1,
              max_tokens: 2000, // Reduced token limit
            });

            let chunkCitations;
            try {
              chunkCitations = JSON.parse(completion.choices[0].message.content);
            } catch (parseError) {
              const cleanedContent = completion.choices[0].message.content
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();
              chunkCitations = JSON.parse(cleanedContent);
            }

            // Add citations from this chunk
            if (Array.isArray(chunkCitations)) {
              for (const citation of chunkCitations) {
                const normalizedFtag = this.normalizeFtag(citation.ftag);
                if (!normalizedFtag) continue;

                const normalizedCitation = {
                  ...citation,
                  ftag: normalizedFtag,
                };

                // Only check for exact duplicates (same F-tag and same raw text)
                // Allow different instances of same F-tag (table of contents vs full details)
                const isDuplicate = allCitations.some(
                  (existing) =>
                    this.normalizeFtag(existing.ftag) === normalizedFtag &&
                    existing.rawText === normalizedCitation.rawText
                );

                if (!isDuplicate) {
                  allCitations.push(normalizedCitation);
                  console.log(`Added citation: ${normalizedFtag}`);
                } else {
                  console.log(`Skipped duplicate citation: ${normalizedFtag}`);
                }
              }
            }

            chunkProcessed = true;
            break;
          } catch (error) {
            console.error(
              `Error processing chunk ${i + 1} (attempt ${attempt}):`,
              error.message
            );

            if (attempt < MAX_RETRIES_PER_CHUNK) {
              const backoffMs = 500 * Math.pow(2, attempt - 1);
              await new Promise((resolve) => setTimeout(resolve, backoffMs));
            }
          }
        }

        if (!chunkProcessed) {
          failedChunks.push(i + 1);
          console.error(
            `FAILED chunk ${i + 1}/${chunks.length} after ${MAX_RETRIES_PER_CHUNK} attempts - extraction may be incomplete`
          );
        }
      }

      console.log(
        `Extracted ${allCitations.length} citations from PDF before merging`
      );

      // Merge citations that appear multiple times (e.g., table of contents + full details)
      const mergedCitations = this.mergeDuplicateCitations(allCitations);

      if (failedChunks.length > 0) {
        console.warn(
          `WARNING: ${failedChunks.length}/${chunks.length} chunks failed after retries. Missing F-tags are possible. Failed chunks: ${failedChunks.join(
            ", "
          )}`
        );
      }

      console.log(
        `Final result: ${mergedCitations.length} unique citations after merging`
      );
      mergedCitations._extractionMeta = {
        totalChunks: chunks.length,
        failedChunks,
        incompleteExtraction: failedChunks.length > 0,
      };

      return mergedCitations;
    } catch (error) {
      console.error("Error parsing citation data:", error.message);
      throw new Error(`Failed to parse citation data: ${error.message}`);
    }
  }

  /**
   * Merge duplicate citations that appear multiple times (e.g., table of contents + full details)
   */
  static mergeDuplicateCitations(citations) {
    const citationMap = new Map();

    const extractionMeta = citations?._extractionMeta;

    for (const citation of citations) {
      const ftag = this.normalizeFtag(citation.ftag);
      if (!ftag) continue;

      if (citationMap.has(ftag)) {
        // Merge with existing citation, preferring non-empty values
        const existing = citationMap.get(ftag);
        const merged = {
          ftag: ftag,
          regulation: citation.regulation || existing.regulation || "",
          deficiency: citation.deficiency || existing.deficiency || "",
          residentInfo: citation.residentInfo || existing.residentInfo || "",
          dates: [...(existing.dates || []), ...(citation.dates || [])],
          violations: [
            ...(existing.violations || []),
            ...(citation.violations || []),
          ],
          severity: citation.severity || existing.severity || "",
          scope: citation.scope || existing.scope || "",
          rawText: (existing.rawText || "") + "\n\n" + (citation.rawText || ""),
        };

        // Remove duplicates from arrays
        merged.dates = [...new Set(merged.dates)];
        merged.violations = [...new Set(merged.violations)];

        citationMap.set(ftag, merged);
      } else {
        citationMap.set(ftag, citation);
      }
    }

    const merged = Array.from(citationMap.values());
    if (extractionMeta) {
      merged._extractionMeta = extractionMeta;
    }
    return merged;
  }

  /**
   * Group citations by F-tag number
   */
  static groupCitationsByFTag(citations) {
    const groupedCitations = {};
    // console.log("citations", citations.length)
    // console.log("citations", citations)

    for (const citation of citations) {
      const ftag = this.normalizeFtag(citation.ftag);
      if (!ftag) continue;
      if (!groupedCitations[ftag]) {
        groupedCitations[ftag] = [];
      }
      groupedCitations[ftag].push({ ...citation, ftag });
    }

    console.log(
      `Grouped ${citations.length} citations into ${
        Object.keys(groupedCitations).length
      } F-tag groups`
    );
    return groupedCitations;
  }

  /**
   * Generate Plan of Correction for grouped citations with the same F-tag
   */
  static async generatePOCForCitation(citationGroup) {
    try {
      // Handle both single citation and array of citations
      const citations = Array.isArray(citationGroup)
        ? citationGroup
        : [citationGroup];
      const primaryCitation = citations[0];
      const ftag = primaryCitation.ftag;

      console.log(
        `Generating combined POC for F-tag: ${ftag} (${citations.length} citations)`
      );

      const systemPrompt = `You are an expert healthcare compliance consultant specializing in creating comprehensive Plans of Correction (POC) for CMS survey deficiencies.

Your task is to create a detailed, professional Plan of Correction that follows the required structure:
1. IDENTIFICATION - Clear statement of what went wrong (combine all related deficiencies)
2. CORRECTIVE ACTION - Immediate actions taken to fix the specific issues (address all instances)
3. SYSTEMS CHANGE - Long-term changes to prevent recurrence (comprehensive approach)
4. RESPONSIBLE PERSON - Specific titles/roles responsible

When multiple citations exist for the same F-tag:
- COMBINE all deficiencies into a comprehensive identification statement
- Address ALL specific instances in corrective actions
- Create unified systems changes that address the root cause
- Use the most appropriate compliance date considering all issues
- Ensure responsible persons can oversee all aspects

Guidelines for creating comprehensive, professional POCs:
- Include specific incident details when available (resident numbers, dates, times, injuries)
- Separate corrective actions for affected residents vs. potentially affected residents
- Provide detailed systemic changes with specific policy revisions
- Include measurable monitoring plans with audit percentages and frequencies
- Specify compliance thresholds and consequences for non-compliance
- Reference QAPI processes and reporting mechanisms
- Use professional healthcare terminology and regulatory language
- Include staff training with competency validation requirements
- Provide realistic but specific timelines

Return the POC as a JSON object with these exact fields:
- identification: string (detailed problem identification)
- correctiveActionAffected: string (specific actions for affected residents)
- correctiveActionPotential: string (actions for potentially affected residents)
- systemsChange: string (comprehensive systemic changes with policy specifics)
- monitoringPlan: string (detailed QAPI monitoring with specific metrics)
- responsiblePerson: string (specific title and responsibilities)
- ftag: string (the F-tag number)
- regulatoryReference: string (the complete regulation reference)
- regulation: string (the regulation violated)`;

      // Combine all citation information for the same F-tag
      const combinedDeficiencies = citations
        .map(
          (cit, index) =>
            `Citation ${index + 1}:\nDeficiency: ${
              cit.deficiency
            }\nResident Info: ${cit.residentInfo || "N/A"}\nViolations: ${
              cit.violations?.join("; ") || "N/A"
            }\nDates: ${cit.dates?.join("; ") || "N/A"}`
        )
        .join("\n\n");

      const userPrompt = `Create a comprehensive Plan of Correction for these related citations with the same F-tag:

F-Tag: ${ftag}
Regulation: ${primaryCitation.regulation}
Number of Related Citations: ${citations.length}

COMBINED DEFICIENCIES:
${combinedDeficiencies}

Generate a comprehensive, professional Plan of Correction following this enhanced structure:

1. IDENTIFICATION: Combine all deficiencies with specific details (residents, dates, incidents)
2. CORRECTIVE ACTION - AFFECTED RESIDENTS: Detail immediate actions taken for specific residents mentioned
3. CORRECTIVE ACTION - POTENTIALLY AFFECTED: Actions for residents with similar risk factors
4. SYSTEMS CHANGE: Comprehensive policy revisions, staff training, environmental changes
5. MONITORING & QAPI: Specific audit percentages, frequencies, compliance thresholds, reporting
6. RESPONSIBLE PERSON: Specific title with clear accountability

Make it as detailed and specific as this example structure:
- Include exact percentages for audits (e.g., "10% of high-risk residents")
- Specify monitoring frequencies (e.g., "weekly for 4 weeks, then monthly for 3 months")
- Set compliance thresholds (e.g., "rates below 90% trigger immediate review")
- Detail policy revision specifics
- Include staff competency validation requirements
- Reference QAPI meeting reporting

Return only valid JSON format.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use mini model for better rate limits
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 1500, // Reduced token limit
      });

      let pocData;
      try {
        pocData = JSON.parse(completion.choices[0].message.content);
      } catch (parseError) {
        console.error(
          "Error parsing POC response as JSON:",
          parseError.message
        );
        // Try to clean and parse again
        const cleanedContent = completion.choices[0].message.content
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        pocData = JSON.parse(cleanedContent);
      }

      if (pocData && Object.prototype.hasOwnProperty.call(pocData, "complianceDate")) {
        delete pocData.complianceDate;
      }

      return pocData;
    } catch (error) {
      const ftag = Array.isArray(citationGroup)
        ? citationGroup[0]?.ftag
        : citationGroup.ftag;
      console.error(`Error generating POC for ${ftag}:`, error.message);
      throw new Error(`Failed to generate POC for ${ftag}: ${error.message}`);
    }
  }

  static async generatePOCSummary(citations, pocs) {
    try {
      console.log("Generating POC summary and recommendations...");

      const systemPrompt = `You are an expert healthcare compliance consultant creating an executive summary for a comprehensive Plan of Correction package.

Analyze the citations and POCs to provide:
1. Executive Summary - High-level overview of deficiencies and corrections
2. Priority Assessment - Risk-based prioritization of citations
3. Resource Requirements - Staff, training, and system needs
4. Timeline Overview - Master implementation schedule
5. Monitoring Plan - Ongoing compliance monitoring strategy
6. Success Metrics - How to measure POC effectiveness

Return as JSON object with these fields:
- executiveSummary: string`;

      const citationSummary = citations
        .map((c) => `${c.ftag}: ${c.deficiency.substring(0, 200)}...`)
        .join("\n");
      const userPrompt = `Create an executive summary for this Plan of Correction package:

CITATIONS SUMMARY:
${citationSummary}

Total Citations: ${citations.length}

Provide comprehensive analysis and recommendations for successful implementation.

Return only valid JSON format.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use mini model for better rate limits
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1500, // Reduced token limit
      });

      let summaryData;
      try {
        summaryData = JSON.parse(completion.choices[0].message.content);
      } catch (parseError) {
        console.error(
          "Error parsing summary response as JSON:",
          parseError.message
        );
        const cleanedContent = completion.choices[0].message.content
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        summaryData = JSON.parse(cleanedContent);
      }

      if (
        summaryData &&
        Object.prototype.hasOwnProperty.call(summaryData, "estimatedCompletionDate")
      ) {
        delete summaryData.estimatedCompletionDate;
      }

      return summaryData;
    } catch (error) {
      console.error("Error generating POC summary:", error.message);
      throw new Error(`Failed to generate POC summary: ${error.message}`);
    }
  }

  /**
   * Main function to process citation PDF and generate complete POC package
   */
  static async processCitationPDF(pdfUrl) {
    try {
      console.log("Starting Plan of Correction generation process...");
      const startTime = Date.now();

      // Step 1: Extract PDF content
      const pdfContent = await this.extractPDFContent(pdfUrl);
      console.log(`Extracted ${pdfContent.pages} pages from PDF`);

      // Check if PDF is too large and truncate if necessary
      let processedText = pdfContent.text;
      //   if (processedText.length > 80000) {
      //     console.log(`PDF text is very large (${processedText.length} chars), truncating to first 80,000 characters`);
      //     processedText = processedText.substring(0, 80000) + "\n\n[Text truncated due to size limits]";
      //   }

      // Step 2: Parse citation data
      let citations = await this.parseCitationData(processedText);
      // const extractionMeta = citations?._extractionMeta;

      // Exclude placeholder/invalid F-tag
      citations = (citations || []).filter(
        (c) => this.normalizeFtag(c?.ftag) && this.normalizeFtag(c?.ftag) !== "F000" && this.normalizeFtag(c?.ftag) !== "F0000"
      );

      if (!citations || citations.length === 0) {
        return {
          success: false,
          message: "No citations found in the provided PDF",
          data: null,
        };
      }

      // Step 3: Group citations by F-tag
      const groupedCitations = this.groupCitationsByFTag(citations);

      // Step 4: Generate POC for each F-tag group
      console.log(
        `Generating POCs for ${
          Object.keys(groupedCitations).length
        } F-tag groups...`
      );
      const pocPromises = Object.values(groupedCitations).map((citationGroup) =>
        this.generatePOCForCitation(citationGroup)
      );

      const pocs = await Promise.all(pocPromises);

      // Sort final response from lowest F-tag to highest F-tag
      pocs.sort((a, b) => this.getFtagNumber(a?.ftag) - this.getFtagNumber(b?.ftag));

      // Step 5: Generate summary and recommendations
      const summary = await this.generatePOCSummary(citations, pocs);

      const processingTime = (Date.now() - startTime) / 1000;
      console.log(`POC generation completed in ${processingTime} seconds`);

      return {
        success: true,
        message: `Successfully generated Plan of Correction for ${citations.length} citations`,
        data: {
          summary,
          // citations,
          plansOfCorrection: pocs,
         // extractionMeta,
        },
      };
    } catch (error) {
      console.error("Error in POC generation process:", error.message);
      return {
        success: false,
        message: `Failed to generate Plan of Correction: ${error.message}`,
        data: null,
      };
    }
  }

  static async generatePlanOfCorrection(surveyId, pdfurlfromsurvey) {
    try {
      return await this.processCitationPDF(pdfurlfromsurvey);
    } catch (error) {
      console.error("Error in planofCorrection:", error.message);
      return {
        success: false,
        message: `Error processing Plan of Correction: ${error.message}`,
        data: null,
      };
    }
  }
}

module.exports = PlanOfCorrectionService;
