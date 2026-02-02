const axios = require("axios");
const pdf = require("pdf-parse");

async function extractResidentsFromPDF(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const pdfData = await pdf(response.data);
    
    console.log("PDF extracted successfully");
    console.log("Total pages:", pdfData.numpages);
    console.log("Text length:", pdfData.text.length);
    
    // Debug: Show first 1000 characters to understand structure
    console.log("First 1000 characters:", pdfData.text.substring(0, 1000));
    
    // Parse the PDF text to extract resident data
    const residents = parsePDFText(pdfData.text);
    
    return residents;
  } catch (error) {
    console.error("Error:", error.message);
    return [];
  }
}

function parsePDFText(text) {
  const residents = [];
  
  // Split text into lines for processing
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log("Total lines:", lines.length);
  console.log("First 20 lines:", lines.slice(0, 20));
  
  // Look for lines that match resident pattern directly
  console.log("Looking for resident data lines...");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines or lines that look like headers/footers
    if (line.length < 20 || line.includes("Page") || line.includes("This Centers for Medicare")) {
      continue;
    }
    
    // Only process lines that match resident pattern: NAME + ID + DATE + indicators
    if (line.match(/^[A-Z]+,\s*[A-Z]+\d{8,10}\d{2}\/\d{2}\/\d{2}/)) {
      const resident = parseTableRow(line);
      if (resident && resident.name) {
        residents.push(resident);
        console.log(`Parsed resident: ${resident.name}`);
      }
    }
  }
  
  console.log(`Extracted ${residents.length} residents`);
  return residents;
}

function parseTableRow(line) {
  // The PDF data is concatenated without spaces. Based on actual structure:
  // Pattern: "ACAMPORA, OLGA6675878603/99/99bbbbbbbbbbbbXbbb1"
  // Format: [Name][ResidentID][Date][16 diagnosis indicators][Quality Count]
  
  console.log("Parsing line:", line);
  
  // Look for resident name pattern at the start
  const nameMatch = line.match(/^([A-Z]+,\s*[A-Z]+)/);
  if (!nameMatch) {
    return null; // Not a resident row
  }
  
  const resident = {
    name: nameMatch[1],
    residentId: "",
    room: "",
    admissionDate: "", // A0310A/B/F field
    patientNeeds: []
  };
  
  // Extract the rest after the name
  let remainingText = line.substring(nameMatch[0].length);
  
  // Extract Resident ID (8-10 digits typically)
  const idMatch = remainingText.match(/^(\d{8,10})/);
  if (idMatch) {
    resident.residentId = idMatch[1];
    remainingText = remainingText.substring(idMatch[0].length);
  }
  
  // Extract A0310A/B/F date - looking for patterns like "03/99/99"
  const dateMatch = remainingText.match(/(\d{2})\/(\d{2})\/(\d{2})/);
  if (dateMatch) {
    const [fullMatch, month, day, year] = dateMatch;
    // Keep the original format since 99/99 seems to be placeholder
    resident.admissionDate = fullMatch;
    remainingText = remainingText.substring(remainingText.indexOf(fullMatch) + fullMatch.length);
  }
  
  // Remove any remaining date fragments like "/99/99" at the start
  remainingText = remainingText.replace(/^\/\d{2}\/\d{2}/, '');
  
  // Now remainingText should contain exactly 16 diagnosis indicators + quality count
  // Remove trailing quality count (1-2 digits at the end)
  const qualityCountMatch = remainingText.match(/(\d{1,2})$/);
  let indicators = remainingText;
  if (qualityCountMatch) {
    indicators = remainingText.substring(0, remainingText.length - qualityCountMatch[0].length);
  }
  
  console.log(`Indicators for ${resident.name}: "${indicators}" (length: ${indicators.length})`);
  
  // Diagnosis mapping based on the MDS QM report structure (from the image)
  const diagnosisMapping = [
    "Pressure Ulcers (L)",           // Position 0
    "Phys restraints (L)",           // Position 1  
    "Falls (L)",                     // Position 2
    "Falls w/Maj Injury (L)",        // Position 3
    "Antipsych Med (S)",             // Position 4
    "Antipsych Med (L)",             // Position 5
    "Antianxiety/Hypnotic Prev (L)", // Position 6
    "Antianxiety/Hypnotic % (L)",    // Position 7
    "Behav Sx affect Others (L)",    // Position 8
    "Depress Sx (L)",                // Position 9
    "UTI (L)",                       // Position 10
    "Cath Insert/Left Bladder (L)",  // Position 11
    "New or Worsened B/B (L)",       // Position 12
    "Excess Wt Loss (L)",            // Position 13
    "Incr ADL Help (L)",             // Position 14
    "Move Indep Worsens (L)"         // Position 15
  ];
  
  // Parse each character in indicators for X markers
  // Should be exactly 16 characters for the 16 diagnosis columns
  const maxIndicators = Math.min(indicators.length, diagnosisMapping.length);
  
  for (let i = 0; i < maxIndicators; i++) {
    const char = indicators[i];
    
    if (char === 'X' || char === 'x') {
      resident.patientNeeds.push(diagnosisMapping[i]);
      console.log(`Found X at position ${i}, mapped to: ${diagnosisMapping[i]}`);
    } else if (char === 'C') {
      // 'C' also indicates a condition in some MDS reports
      resident.patientNeeds.push(diagnosisMapping[i]);
      console.log(`Found C at position ${i}, mapped to: ${diagnosisMapping[i]}`);
    }
    // 'b' means not triggered/excluded, so we skip it
  }
  
  console.log(`Parsed resident: ${resident.name}, ID: ${resident.residentId}, admission: ${resident.admissionDate}, diagnoses: ${resident.patientNeeds.length}`);
  if (resident.patientNeeds.length > 0) {
    console.log(`Patient needs: ${resident.patientNeeds.join(', ')}`);
  }
  
  return resident;
}

function parseAlternativeFormat(lines) {
  // Fallback parsing method for different PDF structures
  const residents = [];
  let currentResident = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for resident names
    if (isResidentName(line)) {
      if (currentResident) {
        residents.push(currentResident);
      }
      
      currentResident = {
        name: line,
        room: "",
        admissionDate: "",
        patientNeeds: []
      };
      
      // Look for room and date in next few lines
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (isRoomNumber(lines[j])) {
          currentResident.room = lines[j];
        }
        if (isAdmissionDate(lines[j])) {
          currentResident.admissionDate = formatPDFDate(lines[j]);
        }
      }
    }
    
    // Look for patient needs
    if (currentResident) {
      const patientNeed = extractPatientNeedFromLine(line);
      if (patientNeed && !currentResident.patientNeeds.includes(patientNeed)) {
        currentResident.patientNeeds.push(patientNeed);
      }
    }
  }
  
  if (currentResident) {
    residents.push(currentResident);
  }
  
  return residents;
}

function isResidentName(line) {
  // Look for patterns like "LASTNAME, FIRSTNAME" or similar
  // Adjust this pattern based on actual PDF format
  const namePattern = /^[A-Z]+,\s*[A-Z]+/;
  return namePattern.test(line) && 
         !line.includes("Room") && 
         !line.includes("Date") &&
         !line.includes("MDS") &&
         line.length < 50; // Names shouldn't be too long
}

function isRoomNumber(line) {
  // Look for room number patterns
  return /^(Rm|Room)\s*\d+/.test(line) || 
         /^\d+[A-Z]?$/.test(line) || 
         /^[A-Z]\d+/.test(line);
}

function isAdmissionDate(line) {
  // Look for date patterns
  return /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(line) ||
         /\d{1,2}-\d{1,2}-\d{2,4}/.test(line) ||
         line.includes("Admission");
}

function formatPDFDate(line) {
  // Extract and format date from line
  const dateMatch = line.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dateMatch) {
    const [, month, day, year] = dateMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${fullYear}`;
  }
  return "";
}

function extractPatientNeedFromLine(line) {
  // Define patterns for different patient needs based on exact MDS PDF headers from the image
  const patientNeedPatterns = {
    "Pressure Ulcers (L)": /pressure\s*ulcer/i,
    "Phys restraints (L)": /phys\s*restraint|physical\s*restraint/i,
    "Falls (L)": /\bfalls?\b(?!\s*w\/)/i,
    "Falls w/Maj Injury (L)": /falls?\s*w\/maj\s*injury|falls?\s*with\s*major\s*injury/i,
    "Antipsych Med (S)": /antipsych\s*med\s*\(s\)|antipsychotic.*short/i,
    "Antipsych Med (L)": /antipsych\s*med\s*\(l\)|antipsychotic.*long/i,
    "Antianxiety/Hypnotic Prev (L)": /antianxiety.*hypnotic.*prev|anxiolytic.*hypnotic.*prev/i,
    "Antianxiety/Hypnotic % (L)": /antianxiety.*hypnotic.*%|anxiolytic.*hypnotic.*%/i,
    "Behav Sx affect Others (L)": /behav\s*sx\s*affect\s*others|behavior.*affect.*others/i,
    "Depress Sx (L)": /depress\s*sx|depression|depressive\s*symptoms/i,
    "UTI (L)": /\buti\b|urinary\s*tract\s*infection/i,
    "Cath Insert/Left Bladder (L)": /cath\s*insert.*left\s*bladder|catheter.*insert.*bladder/i,
    "New or Worsened B/B (L)": /new\s*or\s*worsened\s*b\/b|bowel.*bladder/i,
    "Excess Wt Loss (L)": /excess\s*wt\s*loss|excessive\s*weight\s*loss/i,
    "Incr ADL Help (L)": /incr\s*adl\s*help|increased\s*adl\s*help/i,
    "Move Indep Worsens (L)": /move\s*indep\s*worsens|mobility.*independence.*worsens/i,
    "Quality Measure Count": /quality\s*measure\s*count/i
  };
  
  // Check if line contains indicators for any patient needs
  for (const [needName, pattern] of Object.entries(patientNeedPatterns)) {
    if (pattern.test(line)) {
      // Look for positive indicators (X, checkmark, Yes, etc.)
      if (hasPositiveIndicator(line)) {
        return needName;
      }
    }
  }
  
  return null;
}

function hasPositiveIndicator(line) {
  // Look for positive markers in the line
  return /\bx\b|✓|yes|present|positive|\b1\b/i.test(line) &&
         !/\bno\b|negative|absent|\b0\b/i.test(line);
}

// Run it directly:
const url = "https://mocksurvey.s3.amazonaws.com/uploads/mds_3_1760228981986.pdf";

extractResidentsFromPDF(url).then((res) =>
  console.log(JSON.stringify(res, null, 2))
);