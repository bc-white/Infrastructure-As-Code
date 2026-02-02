const axios = require("axios");
const XLSX = require("xlsx");

async function extractResidentsFromExcel(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const workbook = XLSX.read(response.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet);
    
    // Debug: Show first few rows to understand structure
    console.log("Available columns:", Object.keys(rows[0] || {}));
    console.log("First 3 rows full data:", rows.slice(0, 3));
    
    // Skip header rows and filter out non-resident data
    const dataRows = rows.filter((row, index) => {
      // Skip rows that contain header information
      const name = row["Date Completed:"];
      const room = row["__EMPTY_1"];
      const admissionDate = row["__EMPTY_2"];
      
      // Skip if it's a header row or contains header text
      if (!name || 
          String(name).includes("MATRIX") || 
          String(name).includes("GUIDE") ||
          String(room).includes("Resident Room Number") ||
          room === "0000" ||
          String(admissionDate).includes("Date of Admission") ||
          String(admissionDate).includes("mm/dd/yyyy") ||
          String(admissionDate).includes("Resident(s) admitted")) {
        console.log(`Skipping row ${index}: name="${name}", room="${room}"`);
        return false;
      }
      
      // Only include rows with actual resident names that have room numbers starting with "Rm"
      if (String(room).startsWith("Rm")) {
        console.log(`Including row ${index}: name="${name}", room="${room}"`);
        return true;
      }
      
      return false;
    });
    
    console.log(`Found ${dataRows.length} actual resident records`);
    if (dataRows.length > 0) {
      console.log("Sample resident data:", dataRows[0]);
    }

    const residents = dataRows.map((row) => ({
      name: row["Date Completed:"] || "Unknown",
      room: row["__EMPTY_1"] || "",
      admissionDate: row["__EMPTY_2"] ? formatExcelDate(row["__EMPTY_2"]) : "",
      patientNeeds: extractPatientNeeds(row),
    }));

    return residents;
  } catch (error) {
    console.error("Error:", error.message);
    return [];
  }
}

function extractPatientNeeds(row) {
  const patientNeeds = [];
  
  // Column mapping based on the Excel structure (columns start from __EMPTY_3)
  const columnMapping = {
    "__EMPTY_3": "Alzheimer's / Dementia",
    "__EMPTY_4": "MD, ID or RC & No PASRR Level II", 
    "__EMPTY_5": "Medications: Insulin (I), Anticoagulant (AC), Antibiotic (ABX), Diuretic (D), Opioid (O), Hypnotic (H), Antianxiety (AA), Antipsychotic (AP), Antidepressant (AD), Respiratory (RESP)",
    "__EMPTY_6": "Pressure Ulcers",
    "__EMPTY_7": "Excessive Weight Loss",
    "__EMPTY_8": "Tube Feeding",
    "__EMPTY_9": "Dehydration", 
    "__EMPTY_10": "Physical Restraints",
    "__EMPTY_11": "Fall (F), Fall with Injury (FI), Fall w/Major Injury (FMI)",
    "__EMPTY_12": "Indwelling Catheter",
    "__EMPTY_13": "Dialysis",
    "__EMPTY_14": "Hospice",
    "__EMPTY_15": "End of Life Care",
    "__EMPTY_16": "Tracheostomy",
    "__EMPTY_17": "Ventilator", 
    "__EMPTY_18": "Transmission-Based Precautions",
    "__EMPTY_19": "Intravenous therapy",
    "__EMPTY_20": "Infections (M, WI, P, TB, VH, C, UTI, SEP, SCA, GI, COVID, O)",
    "__EMPTY_21": "PTSD/Trauma"
  };
  
  // Check each column for positive markers
  Object.keys(columnMapping).forEach(columnKey => {
    const value = row[columnKey];
    const headerName = columnMapping[columnKey];
    
    if (hasPositiveMarker(value)) {
      // For medications column, parse specific medications
      if (columnKey === "__EMPTY_5" && typeof value === 'string') {
        const medications = parseSpecificMedications(value);
        patientNeeds.push(...medications);
      }
      // For infections column, parse specific infections  
      else if (columnKey === "__EMPTY_20" && typeof value === 'string') {
        const infections = parseSpecificInfections(value);
        patientNeeds.push(...infections);
      }
      // For falls column, parse specific fall types
      else if (columnKey === "__EMPTY_11" && typeof value === 'string') {
        const falls = parseSpecificFalls(value);
        patientNeeds.push(...falls);
      }
      // For other columns, use the header name
      else {
        patientNeeds.push(headerName);
      }
    }
  });
  
  return patientNeeds;
}

function hasPositiveMarker(value) {
  if (!value) return false;
  
  const stringValue = String(value).trim().toLowerCase();
  
  // Check for positive markers
  return stringValue === '✓' || 
         stringValue === 'x' || 
         stringValue === '1' || 
         stringValue === 'yes' || 
         stringValue === 'present' ||
         stringValue.includes('✓') ||
         stringValue.includes('x') ||
         // Check for specific values like medication codes, infection types
         (stringValue.length > 1 && stringValue !== 'no' && stringValue !== '0' && stringValue !== '-');
}

function parseSpecificMedications(value) {
  const medications = [];
  const medicationCodes = {
    'i': 'Medications: Insulin (I)',
    'ac': 'Medications: Anticoagulant (AC)', 
    'abx': 'Medications: Antibiotic (ABX)',
    'd': 'Medications: Diuretic (D)',
    'o': 'Medications: Opioid (O)',
    'h': 'Medications: Hypnotic (H)',
    'aa': 'Medications: Antianxiety (AA)',
    'ap': 'Medications: Antipsychotic (AP)',
    'ad': 'Medications: Antidepressant (AD)',
    'resp': 'Medications: Respiratory (RESP)'
  };
  
  const codes = String(value).toLowerCase().split(/[,\s]+/);
  codes.forEach(code => {
    const cleanCode = code.trim();
    if (medicationCodes[cleanCode]) {
      medications.push(medicationCodes[cleanCode]);
    }
  });
  
  return medications.length > 0 ? medications : ['Medications: Antipsychotic (AP)']; // Default if checkmark but no specific codes
}

function parseSpecificInfections(value) {
  const infections = [];
  const stringValue = String(value).toLowerCase().trim();
  
  if (stringValue.includes('uti')) {
    infections.push('UTI');
  }
  if (stringValue.includes('covid')) {
    infections.push('COVID');
  }
  // Add other specific infection types as needed
  
  return infections.length > 0 ? infections : ['Infections'];
}

function parseSpecificFalls(value) {
  const falls = [];
  const stringValue = String(value).toLowerCase().trim();
  
  if (stringValue.includes('fmi') || stringValue.includes('major')) {
    falls.push('Fall w/Major Injury');
  } else if (stringValue.includes('fi') || stringValue.includes('injury')) {
    falls.push('Fall with Injury');
  } else if (stringValue.includes('f') || stringValue === '✓') {
    falls.push('Fall');
  }
  
  return falls.length > 0 ? falls : ['Fall'];
}

function formatExcelDate(value) {
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    return `${String(date.d).padStart(2, "0")}/${String(date.m).padStart(
      2,
      "0"
    )}/${date.y}`;
  }
  return value;
}

// Run it directly:
const url =
  "https://mocksurvey.s3.amazonaws.com/uploads/capitol_hill_1760228953845.xlsx";

extractResidentsFromExcel(url).then((res) =>
  console.log(JSON.stringify(res, null, 2))
);