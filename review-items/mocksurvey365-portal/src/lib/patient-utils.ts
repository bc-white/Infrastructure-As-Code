// Utility functions for patient-related operations

// Map relationship codes to full names
export const getRelationshipName = (code: string): string => {
  const relationshipMap: Record<string, string> = {
    'MTH': 'Mother',
    'FTH': 'Father',
    'SPS': 'Spouse',
    'CHILD': 'Child',
    'SIBIL': 'Sibling',
    'SIS': 'Sister',
    'BRO': 'Brother',
    'FRND': 'Friend',
    'GUARD': 'Guardian',
    'OTHER': 'Other',
    'GRPRN': 'Grandparent',
    'GRFTH': 'Grandfather',
    'GRMTH': 'Grandmother',
    'AUNT': 'Aunt',
    'UNCLE': 'Uncle',
    'NPRN': 'Parent',
    'SIGOTHR': 'Significant Other',
    'DOMPART': 'Domestic Partner',
    'NBOR': 'Neighbor',
    'ROOM': 'Roommate',
  };
  
  return relationshipMap[code.toUpperCase()] || code;
};

// Get relationship options for dropdowns
export const relationshipOptions = [
  { value: 'MTH', label: 'Mother' },
  { value: 'FTH', label: 'Father' },
  { value: 'SPS', label: 'Spouse' },
  { value: 'CHILD', label: 'Child' },
  { value: 'SIBIL', label: 'Sibling' },
  { value: 'FRND', label: 'Friend' },
  { value: 'GUARD', label: 'Guardian' },
  { value: 'GRPRN', label: 'Grandparent' },
  { value: 'OTHER', label: 'Other' },
];
