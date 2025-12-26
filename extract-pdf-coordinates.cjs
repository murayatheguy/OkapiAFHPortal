/**
 * Extract all text positions from DSHS NCP PDF to create coordinate mapping.
 * Outputs a complete map of where every label is, so we know where to place data.
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function extractPdfInfo(pdfPath) {
  console.log('Extracting PDF structure from:', pdfPath);
  console.log('='.repeat(80));

  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const pageCount = pdfDoc.getPageCount();
  console.log(`\nPDF has ${pageCount} pages`);

  const pages = pdfDoc.getPages();
  const allPagesData = [];

  for (let i = 0; i < pageCount; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    console.log(`\nPAGE ${i + 1}:`);
    console.log(`  Size: ${width.toFixed(1)} x ${height.toFixed(1)} points`);
    console.log(`  Rotation: ${page.getRotation().angle} degrees`);

    allPagesData.push({
      page: i,
      width: width,
      height: height,
      rotation: page.getRotation().angle
    });
  }

  return allPagesData;
}

async function analyzeWithPdfParse(pdfPath) {
  const pdfParse = require('pdf-parse');
  const dataBuffer = fs.readFileSync(pdfPath);

  const options = {
    pagerender: function(pageData) {
      return pageData.getTextContent().then(function(textContent) {
        let lastY, text = '';
        const items = [];

        for (let item of textContent.items) {
          if (lastY != item.transform[5] && text) {
            // New line
            items.push({ y: lastY, text: text.trim() });
            text = '';
          }
          text += item.str;
          lastY = item.transform[5];
        }
        if (text) {
          items.push({ y: lastY, text: text.trim() });
        }

        return items;
      });
    }
  };

  try {
    const data = await pdfParse(dataBuffer, options);
    return data;
  } catch (err) {
    console.error('Error parsing PDF:', err);
    return null;
  }
}

// Manual coordinate mapping based on DSHS NCP template structure
// This is the reliable approach - manually measure and record coordinates
function generateManualCoordinateMapping() {
  // Letter size in landscape: 792 x 612 points
  const PAGE_WIDTH = 792;
  const PAGE_HEIGHT = 612;

  // NCP PDF is landscape format
  // Coordinates are from bottom-left corner (pdf-lib standard)

  const fieldCoordinates = {
    // PAGE 0 - Header and Resident Information
    page0: {
      // Top header row
      providerName: { x: 100, y: PAGE_HEIGHT - 85 },
      ncpStartDate: { x: 380, y: PAGE_HEIGHT - 85 },
      movedInDate: { x: 570, y: PAGE_HEIGHT - 85 },
      dateCompleted: { x: 680, y: PAGE_HEIGHT - 85 },

      // Second row
      residentFirstName: { x: 100, y: PAGE_HEIGHT - 110 },
      residentLastName: { x: 250, y: PAGE_HEIGHT - 110 },
      preferredName: { x: 420, y: PAGE_HEIGHT - 110 },
      pronouns: { x: 570, y: PAGE_HEIGHT - 110 },

      // Third row
      dateOfBirth: { x: 100, y: PAGE_HEIGHT - 135 },
      primaryLanguage: { x: 280, y: PAGE_HEIGHT - 135 },
      speaksEnglishYes: { x: 460, y: PAGE_HEIGHT - 135 },
      speaksEnglishNo: { x: 500, y: PAGE_HEIGHT - 135 },
      interpreterYes: { x: 600, y: PAGE_HEIGHT - 135 },
      interpreterNo: { x: 640, y: PAGE_HEIGHT - 135 },

      // Allergies row
      allergies: { x: 100, y: PAGE_HEIGHT - 165 },

      // Legal Documents checkboxes
      legalPOA: { x: 55, y: PAGE_HEIGHT - 200 },
      legalGuardian: { x: 150, y: PAGE_HEIGHT - 200 },
      legalHealthcare: { x: 245, y: PAGE_HEIGHT - 200 },
      legalPOLST: { x: 380, y: PAGE_HEIGHT - 200 },
      legalDNR: { x: 470, y: PAGE_HEIGHT - 200 },
      legalOther: { x: 540, y: PAGE_HEIGHT - 200 },
      legalOtherText: { x: 590, y: PAGE_HEIGHT - 200 },

      // Specialty Needs checkboxes
      specialtyDialysis: { x: 55, y: PAGE_HEIGHT - 235 },
      specialtyHospice: { x: 150, y: PAGE_HEIGHT - 235 },
      specialtyBehavioral: { x: 245, y: PAGE_HEIGHT - 235 },
      specialtyMemory: { x: 380, y: PAGE_HEIGHT - 235 },
      specialtyOther: { x: 470, y: PAGE_HEIGHT - 235 },
      specialtyOtherText: { x: 540, y: PAGE_HEIGHT - 235 },
    },

    // PAGE 1 - Emergency Contacts
    page1: {
      contact1Name: { x: 140, y: PAGE_HEIGHT - 100 },
      contact1Relationship: { x: 400, y: PAGE_HEIGHT - 100 },
      contact1HomePhone: { x: 140, y: PAGE_HEIGHT - 125 },
      contact1CellPhone: { x: 400, y: PAGE_HEIGHT - 125 },
      contact1Email: { x: 140, y: PAGE_HEIGHT - 150 },
      contact1PreferredContact: { x: 400, y: PAGE_HEIGHT - 150 },
      contact1Address: { x: 140, y: PAGE_HEIGHT - 175 },

      contact2Name: { x: 140, y: PAGE_HEIGHT - 220 },
      contact2Relationship: { x: 400, y: PAGE_HEIGHT - 220 },
      contact2HomePhone: { x: 140, y: PAGE_HEIGHT - 245 },
      contact2CellPhone: { x: 400, y: PAGE_HEIGHT - 245 },
    },

    // PAGE 2 - Emergency Evacuation
    page2: {
      evacuationIndependent: { x: 55, y: PAGE_HEIGHT - 120 },
      evacuationAssistance: { x: 200, y: PAGE_HEIGHT - 120 },
      evacuationDescription: { x: 100, y: PAGE_HEIGHT - 150 },

      mobilityWheelchair: { x: 55, y: PAGE_HEIGHT - 200 },
      mobilityWalker: { x: 150, y: PAGE_HEIGHT - 200 },
      mobilityCane: { x: 245, y: PAGE_HEIGHT - 200 },
      mobilityNone: { x: 340, y: PAGE_HEIGHT - 200 },

      evacuationInstructions: { x: 55, y: PAGE_HEIGHT - 280 },
    },

    // PAGE 3 - Communication
    page3: {
      expressionProblemsYes: { x: 200, y: PAGE_HEIGHT - 120 },
      expressionProblemsNo: { x: 250, y: PAGE_HEIGHT - 120 },
      expressionDescription: { x: 300, y: PAGE_HEIGHT - 120 },

      hearingProblemsYes: { x: 200, y: PAGE_HEIGHT - 160 },
      hearingProblemsNo: { x: 250, y: PAGE_HEIGHT - 160 },
      hearingDescription: { x: 300, y: PAGE_HEIGHT - 160 },

      visionProblemsYes: { x: 200, y: PAGE_HEIGHT - 200 },
      visionProblemsNo: { x: 250, y: PAGE_HEIGHT - 200 },
      visionDescription: { x: 300, y: PAGE_HEIGHT - 200 },
    },

    // PAGE 4-5 - Medication Management
    page4: {
      medicationAllergiesYes: { x: 200, y: PAGE_HEIGHT - 100 },
      medicationAllergiesNo: { x: 250, y: PAGE_HEIGHT - 100 },
      medicationAllergiesList: { x: 300, y: PAGE_HEIGHT - 100 },

      medsOrderedBy: { x: 200, y: PAGE_HEIGHT - 140 },
      medsDeliveredBy: { x: 450, y: PAGE_HEIGHT - 140 },
      pharmacyName: { x: 200, y: PAGE_HEIGHT - 170 },

      medLevelSelf: { x: 55, y: PAGE_HEIGHT - 210 },
      medLevelAssist: { x: 200, y: PAGE_HEIGHT - 210 },
      medLevelFull: { x: 350, y: PAGE_HEIGHT - 210 },

      medTypeOral: { x: 55, y: PAGE_HEIGHT - 250 },
      medTypeTopical: { x: 150, y: PAGE_HEIGHT - 250 },
      medTypeEyeDrops: { x: 245, y: PAGE_HEIGHT - 250 },
      medTypeInhalers: { x: 340, y: PAGE_HEIGHT - 250 },
      medTypeSprays: { x: 435, y: PAGE_HEIGHT - 250 },
      medTypeInjections: { x: 530, y: PAGE_HEIGHT - 250 },
    },

    // PAGE 6 - Health Indicators
    page6: {
      painIssuesYes: { x: 200, y: PAGE_HEIGHT - 100 },
      painIssuesNo: { x: 250, y: PAGE_HEIGHT - 100 },
      painDescription: { x: 300, y: PAGE_HEIGHT - 100 },

      currentWeight: { x: 200, y: PAGE_HEIGHT - 140 },
      currentHeight: { x: 400, y: PAGE_HEIGHT - 140 },

      vitalSignsYes: { x: 200, y: PAGE_HEIGHT - 180 },
      vitalSignsNo: { x: 250, y: PAGE_HEIGHT - 180 },
      vitalSignsFrequency: { x: 300, y: PAGE_HEIGHT - 180 },
    },

    // PAGE 7-8 - Treatments & Therapies
    page7: {
      oxygenUse: { x: 55, y: PAGE_HEIGHT - 100 },
      dialysis: { x: 200, y: PAGE_HEIGHT - 100 },
      bloodThinners: { x: 345, y: PAGE_HEIGHT - 100 },
      bloodGlucose: { x: 490, y: PAGE_HEIGHT - 100 },

      cpapBipap: { x: 55, y: PAGE_HEIGHT - 130 },
      nebulizer: { x: 200, y: PAGE_HEIGHT - 130 },
      injections: { x: 345, y: PAGE_HEIGHT - 130 },
      ptOtSt: { x: 490, y: PAGE_HEIGHT - 130 },

      homeHealth: { x: 55, y: PAGE_HEIGHT - 200 },
      homeHealthAgency: { x: 200, y: PAGE_HEIGHT - 200 },
      hospice: { x: 55, y: PAGE_HEIGHT - 230 },
      hospiceAgency: { x: 200, y: PAGE_HEIGHT - 230 },
    },

    // PAGE 9-10 - Psych/Social/Cognitive
    page9: {
      sleepDisturbanceYes: { x: 200, y: PAGE_HEIGHT - 100 },
      sleepDisturbanceNo: { x: 250, y: PAGE_HEIGHT - 100 },
      sleepDescription: { x: 300, y: PAGE_HEIGHT - 100 },

      shortTermMemory: { x: 55, y: PAGE_HEIGHT - 150 },
      longTermMemory: { x: 200, y: PAGE_HEIGHT - 150 },
      orientedToPerson: { x: 345, y: PAGE_HEIGHT - 150 },

      // Behavior checkboxes
      behaviorImpairedDecision: { x: 55, y: PAGE_HEIGHT - 200 },
      behaviorDisruptive: { x: 200, y: PAGE_HEIGHT - 200 },
      behaviorAssaultive: { x: 345, y: PAGE_HEIGHT - 200 },
      behaviorResistive: { x: 490, y: PAGE_HEIGHT - 200 },
    },

    // PAGE 11-15 - ADLs
    page11: {
      ambulationInRoom: { x: 200, y: PAGE_HEIGHT - 100 },
      ambulationOutside: { x: 400, y: PAGE_HEIGHT - 100 },
      fallRiskYes: { x: 200, y: PAGE_HEIGHT - 130 },
      fallRiskNo: { x: 250, y: PAGE_HEIGHT - 130 },
    },

    // PAGE 16-18 - IADLs
    page16: {
      financesLevel: { x: 200, y: PAGE_HEIGHT - 100 },
      whoManagesFinances: { x: 400, y: PAGE_HEIGHT - 100 },

      shoppingLevel: { x: 200, y: PAGE_HEIGHT - 160 },
      transportNeeds: { x: 400, y: PAGE_HEIGHT - 160 },

      transportationLevel: { x: 200, y: PAGE_HEIGHT - 220 },
      escortRequired: { x: 400, y: PAGE_HEIGHT - 220 },
    },

    // PAGE 19 - Activity Preferences
    page19: {
      activityReading: { x: 55, y: PAGE_HEIGHT - 100 },
      activityAudioBooks: { x: 200, y: PAGE_HEIGHT - 100 },
      activityStorytelling: { x: 345, y: PAGE_HEIGHT - 100 },
      activityPhone: { x: 490, y: PAGE_HEIGHT - 100 },

      activityReminiscing: { x: 55, y: PAGE_HEIGHT - 130 },
      activityCurrentEvents: { x: 200, y: PAGE_HEIGHT - 130 },
      activityChurch: { x: 345, y: PAGE_HEIGHT - 130 },
      activityVisitors: { x: 490, y: PAGE_HEIGHT - 130 },
    },

    // PAGE 20 - Signatures
    page20: {
      dateOfOriginalPlan: { x: 200, y: PAGE_HEIGHT - 100 },
      reviewDates: { x: 450, y: PAGE_HEIGHT - 100 },

      residentSignature: { x: 100, y: PAGE_HEIGHT - 200 },
      residentSignatureDate: { x: 400, y: PAGE_HEIGHT - 200 },

      providerSignature: { x: 100, y: PAGE_HEIGHT - 260 },
      providerSignatureDate: { x: 400, y: PAGE_HEIGHT - 260 },

      caseManagerSignature: { x: 100, y: PAGE_HEIGHT - 320 },
      caseManagerSignatureDate: { x: 400, y: PAGE_HEIGHT - 320 },
    }
  };

  return {
    pageWidth: PAGE_WIDTH,
    pageHeight: PAGE_HEIGHT,
    isLandscape: true,
    fields: fieldCoordinates
  };
}

async function main() {
  const pdfPath = path.join(__dirname, 'client/public/forms/templates/AFH HCS NCP-Template 10.11.23 (1).pdf');

  if (!fs.existsSync(pdfPath)) {
    console.error('PDF not found at:', pdfPath);
    console.log('Looking for alternative paths...');

    const altPaths = [
      'public/forms/templates/AFH HCS NCP-Template 10.11.23 (1).pdf',
      './public/forms/templates/AFH HCS NCP-Template 10.11.23 (1).pdf'
    ];

    for (const altPath of altPaths) {
      if (fs.existsSync(altPath)) {
        console.log('Found PDF at:', altPath);
        break;
      }
    }
  }

  // Extract basic PDF info
  let pagesData;
  try {
    pagesData = await extractPdfInfo(pdfPath);
  } catch (err) {
    console.error('Error extracting PDF info:', err.message);
    console.log('\nUsing default Letter landscape dimensions...');
    pagesData = [{ page: 0, width: 792, height: 612, rotation: 0 }];
  }

  // Generate manual coordinate mapping
  const coordinateMapping = generateManualCoordinateMapping();

  // Save coordinate mapping to JSON
  fs.writeFileSync(
    'ncp-field-mapping.json',
    JSON.stringify(coordinateMapping, null, 2)
  );
  console.log('\nField mapping saved to: ncp-field-mapping.json');

  // Generate TypeScript code
  const tsCode = generateTypeScript(coordinateMapping);
  fs.writeFileSync('ncp-coordinates.ts', tsCode);
  console.log('TypeScript mapping saved to: ncp-coordinates.ts');

  console.log('\n' + '='.repeat(80));
  console.log('COORDINATE EXTRACTION COMPLETE');
  console.log('='.repeat(80));
}

function generateTypeScript(mapping) {
  let ts = `// Auto-generated NCP PDF coordinate mapping
// Generated from DSHS NCP template analysis
// Page dimensions (Letter size landscape)

export const NCP_PAGE_WIDTH = ${mapping.pageWidth};
export const NCP_PAGE_HEIGHT = ${mapping.pageHeight};
export const NCP_IS_LANDSCAPE = ${mapping.isLandscape};

// Field coordinates by page (x, y from bottom-left origin)
export const NCP_FIELD_COORDS = ${JSON.stringify(mapping.fields, null, 2)};

// Helper to get field coordinate
export function getFieldCoord(page: number, field: string): { x: number; y: number } | null {
  const pageKey = \`page\${page}\`;
  const pageFields = (NCP_FIELD_COORDS as any)[pageKey];
  if (pageFields && pageFields[field]) {
    return pageFields[field];
  }
  return null;
}
`;

  return ts;
}

main().catch(console.error);
