const axios = require("axios");
const pdf = require("pdf-parse");


async function extractCriticalElementsFromPDF(url) {
  try {
    console.log("Starting Critical Elements PDF extraction from:", url);
    
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const pdfData = await pdf(response.data);
    
    console.log("PDF extracted successfully");
    console.log("Total pages:", pdfData.numpages);
    console.log("Text length:", pdfData.text.length);
    
    // Parse the PDF text to extract pathway content
    const pathwayContent = parseCriticalElementsText(pdfData.text);
    
    return pathwayContent;
  } catch (error) {
    console.error("Error extracting Critical Elements PDF:", error.message);
    return {
      reviewInAdvance: [],
      observations: [],
      residentInterviews: [],
      staffInterviews: [],
      recordReview: [],
      metadata: {
        error: error.message,
        extractedAt: new Date().toISOString()
      }
    };
  }
}


function parseCriticalElementsText(text) {
  console.log("Parsing Critical Elements text...");
  
  // Clean and normalize the text
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log("Total lines to process:", lines.length);
  
  // Initialize result structure
  const result = {
    reviewInAdvance: [],
    observations: [],
    residentInterviews: [],
    staffInterviews: [],
    recordReview: [],
    metadata: {
      extractedAt: new Date().toISOString(),
      totalLines: lines.length,
      sectionsFound: []
    }
  };
  
  // Define section headers to look for (more specific patterns)
  const sectionHeaders = {
    reviewInAdvance: [
      "Review the Following in Advance to Guide Observations and Interviews",
      "Review the Following in Advance to Guide Observations and Interviews:",
      "Review the following in advance to guide record review and interviews:",
      "Review the following in Advance to Guide Observations and Interviews"
    ],
    observations: [
      "Observations:",
      "OBSERVATIONS:",
      "Observations",
      "Observations Across Various Shifts:",
      "Observations Across Various Shifts"
    ],
    residentInterviews: [
      "Resident, Resident Representative, or Family Interview:",
      "Resident, Resident Representative, or Family Interview",
      "Resident Interview:",
      "Resident Interviews:",
      "Family Interview:",
      "Resident/Family Interview:"
    ],
    staffInterviews: [
      "Staff Interviews (Nursing Aides, Nurse, DON, Attending Practitioner)",
      "Staff Interviews (Nursing Aides, Nurse, DON, Attending Practitioner):",
      "Staff Interviews:",
      "Staff Interviews",
      "Nurse Aide or Restorative Nurse Aide Interviews",
      "Licensed Nurse and DON Interviews as appropriate:",
      "PT, OT, or Restorative Staff Interviews",
      "PT, OT, or Restorative Staff Interviews as appropriate:"
    ],
    recordReview: [
      "Record Review:",
      "Record Review",
      "Record Review determine, as appropriate:",
      "Record Review determine"
    ]
  };
  
  let currentSection = null;
  let currentSubsection = null;
  let i = 0;
  let lastSectionLine = -10; // Track last section to avoid duplicates
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Skip Critical Element Decisions section - these are regulatory compliance questions
    if (/Critical Element Decisions?:/i.test(line)) {
      console.log(`Skipping Critical Element Decisions section at line ${i}: "${line}"`);
      // Skip until we find the next main section or end of document
      while (i < lines.length) {
        i++;
        if (i >= lines.length) break;
        const nextLine = lines[i];
        const nextSectionMatch = findSectionMatch(nextLine, sectionHeaders);
        if (nextSectionMatch) {
          i--; // Back up one line so the section header gets processed
          break;
        }
        // Also break if we hit another known section pattern
        if (/^(Other Tags|Form CMS|DEPARTMENT OF HEALTH)/i.test(nextLine)) {
          break;
        }
      }
      i++;
      continue;
    }
    
    // Check if this line is a main section header
    const sectionMatch = findSectionMatch(line, sectionHeaders);
    if (sectionMatch && (i - lastSectionLine) > 5) { // Avoid duplicate sections too close together
      currentSection = sectionMatch;
      currentSubsection = null;
      result.metadata.sectionsFound.push(sectionMatch);
      lastSectionLine = i;
      console.log(`Found section: ${sectionMatch} at line ${i}: "${line}"`);
      i++;
      continue;
    }
    
    // Check for inline section headers (like "Staff Interviews:" within text)
    if (currentSection && checkForInlineSectionHeader(line)) {
      const inlineSection = checkForInlineSectionHeader(line);
      if (inlineSection && inlineSection !== currentSection) {
        currentSection = inlineSection;
        result.metadata.sectionsFound.push(inlineSection);
        console.log(`Found inline section: ${inlineSection} at line ${i}: "${line}"`);
        i++;
        continue;
      }
    }
    
    // If we're in a section, extract content (but skip Critical Element Decisions)
    if (currentSection) {
      const content = extractSectionContent(lines, i, currentSection);
      if (content.items.length > 0) {
        result[currentSection] = result[currentSection].concat(content.items);
        i = content.nextIndex;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
  
  // Log extraction results
  console.log("Extraction completed:");
  Object.keys(result).forEach(key => {
    if (key !== 'metadata' && Array.isArray(result[key])) {
      console.log(`${key}: ${result[key].length} items extracted`);
    }
  });
  
  return result;
}


function findSectionMatch(line, sectionHeaders) {
  // Only match if the line is likely a header (short, contains key words, etc.)
  if (line.length > 100) return null; // Headers shouldn't be too long
  
  for (const [sectionKey, headers] of Object.entries(sectionHeaders)) {
    for (const header of headers) {
      // Exact match or very close match
      if (line.toLowerCase().trim() === header.toLowerCase().trim() ||
          isStrongHeaderMatch(line, header)) {
        return sectionKey;
      }
    }
  }
  return null;
}


function isStrongHeaderMatch(line, header) {
  const cleanLine = line.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().trim();
  const cleanHeader = header.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().trim();
  
  // Must contain most of the key words and be reasonably short
  if (cleanLine.length > cleanHeader.length * 2) return false;
  
  const headerWords = cleanHeader.split(/\s+/).filter(word => word.length > 2);
  const lineWords = cleanLine.split(/\s+/);
  
  let matchCount = 0;
  for (const headerWord of headerWords) {
    if (lineWords.some(lineWord => 
      lineWord === headerWord || 
      (lineWord.length > 3 && headerWord.length > 3 && 
       (lineWord.includes(headerWord) || headerWord.includes(lineWord)))
    )) {
      matchCount++;
    }
  }
  
  return matchCount >= Math.ceil(headerWords.length * 0.8); // 80% of words must match
}


function checkForInlineSectionHeader(line) {
  const inlinePatterns = {
    staffInterviews: /Staff Interviews:/i,
    observations: /\bObservations:/i,
    recordReview: /Record Review:/i
  };
  
  for (const [sectionKey, pattern] of Object.entries(inlinePatterns)) {
    if (pattern.test(line)) {
      return sectionKey;
    }
  }
  
  return null;
}



function extractSectionContent(lines, startIndex, sectionType) {
  const items = [];
  let i = startIndex;
  let currentItem = null;
  let inBulletPoint = false;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Stop if we hit another main section
    if (isMainSectionHeader(line)) {
      break;
    }
    
    // Skip Critical Element Decisions content
    if (/Critical Element Decisions?:/i.test(line)) {
      console.log(`Skipping Critical Element Decisions content at line ${i}: "${line}"`);
      break;
    }
    
    // Skip numbered regulatory questions (1), 2), 3), etc.) that are part of Critical Element Decisions
    if (/^\s*\d+\)\s*(A\.|B\.)?.*?(cite F\d+|If No|If A or B|comprehensive assessment|person-centered care plan|baseline care plan)/i.test(line)) {
      console.log(`Skipping regulatory question at line ${i}: "${line.substring(0, 100)}..."`);
      i++;
      continue;
    }
    
    // Skip lines that contain F-tag citations (regulatory compliance indicators)
    if (/cite F\d+|If No, cite|NA, the (resident|comprehensive|initial)/i.test(line)) {
      console.log(`Skipping F-tag citation at line ${i}: "${line.substring(0, 100)}..."`);
      i++;
      continue;
    }
    
    // Skip any content that looks like regulatory compliance questions
    if (/^\s*\d+\)\s*(A\.|B\.)?.*?(did the facility|comprehensive assessment|person-centered care plan|baseline care plan|significant change|skills and qualifications|reassess the effectiveness)/i.test(line)) {
      console.log(`Skipping regulatory compliance content at line ${i}: "${line.substring(0, 100)}..."`);
      i++;
      continue;
    }
    
    // Skip lines that are clearly part of Critical Element Decisions section
    if (/(Other Tags, Care Areas|Form CMS 20120|Page \d+).*?(comprehensive assessment|person-centered care plan|resident's goals|desired outcomes)/i.test(line)) {
      console.log(`Skipping Critical Element Decision fragment at line ${i}: "${line.substring(0, 100)}..."`);
      i++;
      continue;
    }
    
    // Skip empty lines
    if (line.trim().length === 0) {
      i++;
      continue;
    }
    
    // Check if this is a question or bullet point
    if (isQuestionOrBullet(line)) {
      // Check if this might be a continuation of the previous item
      if (currentItem && inBulletPoint && isLineContinuation(line)) {
        // This is likely a continuation of the previous item
        currentItem.content += " " + line.trim();
      } else {
        // Save previous item if exists
        if (currentItem && currentItem.content.trim().length > 0) {
          items.push(currentItem);
        }
        
        // Start new item
        currentItem = {
          type: determineItemType(line),
          content: cleanQuestionText(line),
          subItems: [],
          lineNumber: i + 1
        };
        inBulletPoint = true;
      }
    } else if (inBulletPoint && currentItem) {
      // Continue previous item or add sub-item
      if (isSubItem(line)) {
        currentItem.subItems.push({
          content: cleanQuestionText(line),
          lineNumber: i + 1
        });
      } else {
        // Continue the current item content
        currentItem.content += " " + line.trim();
      }
    } else if (line.trim().length > 5 && !isMainSectionHeader(line)) {
      // Skip page headers, footers, and form identifiers
      if (/^(DEPARTMENT OF HEALTH|CENTERS FOR MEDICARE|Form CMS|Page \d+)/i.test(line)) {
        i++;
        continue;
      }
      
      // Check for inline section transitions
      const inlineSection = checkForInlineSectionHeader(line);
      if (inlineSection) {
        // This line contains a section header, break here
        break;
      }
      
      // Capture more content - be less restrictive
      if (currentItem && currentItem.content.trim().length > 0) {
        items.push(currentItem);
      }
      
      currentItem = {
        type: determineItemType(line),
        content: cleanQuestionText(line),
        subItems: [],
        lineNumber: i + 1
      };
      inBulletPoint = true; // Treat as bullet point for continuation
    }
    
    i++;
  }
  
  // Add the last item
  if (currentItem && currentItem.content.trim().length > 0) {
    items.push(currentItem);
  }
  
  return {
    items: items,
    nextIndex: i
  };
}

function isMainSectionHeader(line) {
  if (line.length > 100) return false; // Headers shouldn't be too long
  
  const mainHeaders = [
    "Review the Following in Advance to Guide Observations and Interviews",
    "Review the following in advance to guide record review and interviews:",
    "Review the following in Advance to Guide Observations and Interviews:",
    "Observations:",
    "Observations",
    "Observations Across Various Shifts:",
    "Resident, Resident Representative, or Family Interview:",
    "Staff Interviews (Nursing Aides, Nurse, DON, Attending Practitioner)",
    "Staff Interviews:",
    "Nurse Aide or Restorative Nurse Aide Interviews",
    "Licensed Nurse and DON Interviews as appropriate:",
    "PT, OT, or Restorative Staff Interviews as appropriate:",
    "Record Review:",
    "Record Review",
    "Record Review determine, as appropriate:"
  ];
  
  return mainHeaders.some(header => 
    line.toLowerCase().trim() === header.toLowerCase().trim() ||
    isStrongHeaderMatch(line, header)
  );
}

function isQuestionOrBullet(line) {
  // Skip very short lines or lines that look like headers
  if (line.length < 5 || isMainSectionHeader(line)) return false;
  
  // Skip page headers, footers, and form identifiers
  if (/^(DEPARTMENT OF HEALTH|CENTERS FOR MEDICARE|Form CMS|Page \d+)/i.test(line)) return false;
  
  const questionIndicators = [
    /^\s*[•·▪▫-]\s+/, // Bullet points
    /^\s*☐\s*/, // Checkbox items
    /^\s*□\s*/, // Alternative checkbox
    /^\s*\[\s*\]\s*/, // Square bracket checkboxes
    /^\s*\d+\.\s+/, // Numbered lists
    /^\s*[a-zA-Z]\)\s+/, // Lettered lists
    /^\s*o\s+/i, // "o " style bullets
    /\?\s*$/, // Ends with question mark
    /^\s*(What|How|When|Where|Why|Who|Is|Are|Does|Do|Did|Can|Could|Should|Would|Will)\b/i, // Question words
    /^\s*(Review|Check|Verify|Confirm|Determine|Assess|Evaluate|Examine|Investigate|Document|Observe|Interview|Whether|If)\b/i, // Action words
    /^\s*(The|For|During|While|In|At|On|With|Without|Before|After)\s+/i, // Common content starters
    /^\s*[A-Z].*[a-z]/, // Lines starting with capital letter (likely content)
    /care plan|assessment|resident|facility|staff|intervention|treatment/i // Healthcare-specific terms
  ];
  
  return questionIndicators.some(pattern => pattern.test(line));
}

function isLineContinuation(line) {
  // Check if this line is likely a continuation of the previous line
  // Continuation lines typically:
  // 1. Start with lowercase letter
  // 2. Are short fragments
  // 3. Don't have strong question/bullet indicators
  // 4. Don't end with punctuation that suggests completion
  
  if (line.length < 3) return false;
  
  // If line starts with lowercase, it's likely a continuation
  if (/^\s*[a-z]/.test(line)) return true;
  
  // If line is very short and doesn't have strong indicators, it's likely a continuation
  if (line.length < 20 && !/^\s*[•·▪▫-☐□]/.test(line) && !/\?\s*$/.test(line)) {
    return true;
  }
  
  // If line doesn't start with capital letter or strong indicators, likely continuation
  if (!/^\s*[A-Z•·▪▫-☐□\d]/.test(line)) {
    return true;
  }
  
  return false;
}

function isSubItem(line) {
  return /^\s{2,}[•·▪▫-]\s+/.test(line) || // Indented bullet
         /^\s{2,}☐\s*/.test(line) || // Indented checkbox
         /^\s{2,}o\s+/.test(line) || // Indented "o " bullets
         /^\s{4,}\w/.test(line) || // Deeply indented text (4+ spaces)
         /^\s{2,}[a-z]/.test(line); // Indented lowercase text (likely continuation)
}

function determineItemType(line) {
  if (/\?\s*$/.test(line)) {
    return 'question';
  }
  if (/^\s*[•·▪▫-]\s+/.test(line)) {
    return 'bullet';
  }
  if (/^\s*☐\s*/.test(line) || /^\s*□\s*/.test(line) || /^\s*\[\s*\]\s*/.test(line)) {
    return 'checkbox';
  }
  if (/^\s*\d+\.\s+/.test(line)) {
    return 'numbered';
  }
  if (/^\s*o\s+/i.test(line)) {
    return 'bullet';
  }
  if (/^\s*(Review|Check|Verify|Confirm|Determine|Assess|Evaluate|Examine|Investigate|Whether|If)\b/i.test(line)) {
    return 'instruction';
  }
  if (/^\s*(What|How|When|Where|Why|Who|Is|Are|Does|Do|Did|Can|Could|Should|Would|Will)\b/i.test(line)) {
    return 'question';
  }
  return 'content';
}

function cleanQuestionText(text) {
  return text
    .replace(/^\s*[•·▪▫-]\s+/, '') // Remove bullet points
    .replace(/^\s*☐\s*/, '') // Remove checkboxes
    .replace(/^\s*□\s*/, '') // Remove alternative checkboxes
    .replace(/^\s*\[\s*\]\s*/, '') // Remove square bracket checkboxes
    .replace(/^\s*\d+\.\s+/, '') // Remove numbers
    .replace(/^\s*[a-zA-Z]\)\s+/, '') // Remove letters
    .replace(/^\s*o\s+/i, '') // Remove "o " bullet style
    .replace(/Staff Interviews:/i, '') // Remove inline section headers
    .replace(/Observations:/i, '') // Remove inline section headers
    .replace(/Record Review:/i, '') // Remove inline section headers
    .replace(/Resident.*Interview:/i, '') // Remove resident interview headers
    .trim();
}

function formatPathwayContent(pathwayContent) {
  const formatted = {
    ...pathwayContent,
    summary: {
      totalQuestions: 0,
      totalInstructions: 0,
      sectionBreakdown: {}
    }
  };
  
  // Count items by type and section
  Object.keys(formatted).forEach(sectionKey => {
    if (Array.isArray(formatted[sectionKey])) {
      const section = formatted[sectionKey];
      formatted.summary.sectionBreakdown[sectionKey] = {
        total: section.length,
        questions: section.filter(item => item.type === 'question').length,
        instructions: section.filter(item => item.type === 'instruction').length,
        bullets: section.filter(item => item.type === 'bullet').length
      };
      
      formatted.summary.totalQuestions += formatted.summary.sectionBreakdown[sectionKey].questions;
      formatted.summary.totalInstructions += formatted.summary.sectionBreakdown[sectionKey].instructions;
    }
  });
  
  return formatted;
}

module.exports = {
  extractCriticalElementsFromPDF,
  formatPathwayContent
};