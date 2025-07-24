// Shirt Size Mapping System for Smart Recommendations

// Slim Fit Mapping (Current GitHub shirts)
export const SLIM_FIT_MAPPING = {
  // Suit size -> Shirt size
  '36R': { size: 'XS', neck: 14, sleeve: 33 },
  '36S': { size: 'XS', neck: 14, sleeve: 33 },
  '38R': { size: 'S', neck: 14.5, sleeve: 33 },
  '38S': { size: 'S', neck: 14.5, sleeve: 33 },
  '40R': { size: 'M', neck: 15.5, sleeve: 33 },
  '40S': { size: 'M', neck: 15.5, sleeve: 33 },
  '40L': { size: 'L', neck: 16, sleeve: 35 },
  '42S': { size: 'L', neck: 16, sleeve: 35 },
  '42R': { size: 'XL', neck: 16.5, sleeve: 35 },
  '42L': { size: 'XL', neck: 16.5, sleeve: 35 },
  '44R': { size: 'XXL', neck: 17.5, sleeve: 35 },
  '44L': { size: 'XXL', neck: 17.5, sleeve: 35 },
  '46R': { size: 'XXL', neck: 17.5, sleeve: 35 },
  '46L': { size: 'XXL', neck: 17.5, sleeve: 35 },
};

// Classic Fit Mapping (Neck x Sleeve)
export const CLASSIC_FIT_MAPPING = {
  // Suit chest size -> Neck size
  '36': 14.5,
  '38': 15,
  '40': 15.5,
  '42': 16,
  '44': 16.5,
  '46': 17,
  '48': 17.5,
  '50': 18,
  '52': 18.5,
  '54': 19,
  '56': 19.5,
  '58': 20,
  '60': 20.5,
  
  // Suit length -> Sleeve length
  'S': '32-33',
  'R': '34-35',
  'L': '36-37'
};

// Function to get shirt recommendation
export function getShirtRecommendation(suitSize: string, fitPreference: 'slim' | 'classic' = 'slim') {
  if (fitPreference === 'slim' && SLIM_FIT_MAPPING[suitSize as keyof typeof SLIM_FIT_MAPPING]) {
    return SLIM_FIT_MAPPING[suitSize as keyof typeof SLIM_FIT_MAPPING];
  }
  
  // Parse suit size for classic fit
  const sizeMatch = suitSize.match(/^(\d+)([SRLT])$/);
  if (!sizeMatch) return null;
  
  const [, chest, length] = sizeMatch;
  const neckSize = CLASSIC_FIT_MAPPING[chest as keyof typeof CLASSIC_FIT_MAPPING];
  const sleeveLength = CLASSIC_FIT_MAPPING[length as keyof typeof CLASSIC_FIT_MAPPING];
  
  if (neckSize && sleeveLength) {
    return {
      size: `${neckSize} x ${sleeveLength}`,
      neck: neckSize,
      sleeve: sleeveLength
    };
  }
  
  return null;
}

// Generate all classic fit sizes for database
export function generateClassicFitSizes() {
  const neckSizes = [14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5, 22];
  const sleeveLengths = ['32-33', '34-35', '36-37'];
  const sizes = [];
  
  for (const neck of neckSizes) {
    for (const sleeve of sleeveLengths) {
      sizes.push({
        sku: `KCT-DS-CLASSIC-${neck}-${sleeve.replace('-', '')}`,
        size: `${neck} x ${sleeve}`,
        neck,
        sleeve,
        displayName: `Classic Fit - ${neck}" x ${sleeve}"`
      });
    }
  }
  
  return sizes;
}

// Smart attributes for shirt sizing
export const SHIRT_SIZE_ATTRIBUTES = {
  slimFit: {
    cutDescription: "Modern slim cut through body and arms",
    bestForBodyType: ["athletic", "slim"],
    fitNotes: "Runs smaller than traditional sizing - size up if between sizes",
    chestReduction: 2, // 2" less than classic fit
  },
  classicFit: {
    cutDescription: "Traditional generous cut",
    bestForBodyType: ["all"],
    fitNotes: "True to size with comfortable room",
    chestReduction: 0,
  }
};

// Size correlation for outfit builder
export const SIZE_CORRELATIONS = {
  // When customer buys this suit size, recommend these shirt sizes
  '42R': {
    slim: ['XL'],
    classic: ['16 x 34-35', '16.5 x 34-35'], // Give options
    preferred: 'XL (Slim) or 16.5 x 34-35 (Classic)'
  },
  '44R': {
    slim: ['XXL'],
    classic: ['16.5 x 34-35', '17 x 34-35'],
    preferred: 'XXL (Slim) or 17 x 34-35 (Classic)'
  },
  // Add more mappings as needed
};

// For database migration
export const SHIRT_SMART_ATTRIBUTES = {
  sizingSystem: {
    slimSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    classicFormat: 'neck x sleeve',
    measurementType: 'inches',
    sizeChart: {
      slim: SLIM_FIT_MAPPING,
      classic: 'generated' // Will be generated from function
    }
  },
  
  // Pairing intelligence
  suitCompatibility: {
    sizeMapping: SIZE_CORRELATIONS,
    fitGuidance: "Slim shirts pair best with slim/modern fit suits",
    layeringNotes: "Classic fit recommended when wearing vest"
  },
  
  // Customer guidance
  sizingHelp: {
    betweenSizes: "Size up for comfort, size down for fitted look",
    neckMeasurement: "Two fingers should fit comfortably in buttoned collar",
    sleeveMeasurement: "Cuff should reach wrist bone when arms relaxed"
  }
};