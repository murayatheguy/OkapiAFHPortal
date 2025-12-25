/**
 * NCP PDF Generator - Fills the official DSHS NCP template
 * Coordinates extracted from AFH HCS NCP-Template using pdf extraction
 *
 * PDF Specifications:
 * - Format: Letter Landscape (792 x 612 points)
 * - Origin: Bottom-left (0, 0)
 * - Y increases going UP the page
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { NCP_FIELD_COORDS, NCP_PAGE_WIDTH, NCP_PAGE_HEIGHT } from './ncp-coordinates';

// Re-export the type from ncp-wizard for convenience
export type { NCPFormData } from '@/components/owner/forms/ncp-wizard';

// Import type for use in this file
import type { NCPFormData } from '@/components/owner/forms/ncp-wizard';

// Helper to format dates
function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Get coordinate from page-organized structure
function getCoord(pageKey: string, fieldName: string): { x: number; y: number } | null {
  const pageData = (NCP_FIELD_COORDS as any)[pageKey];
  if (pageData && pageData[fieldName]) {
    return pageData[fieldName];
  }
  return null;
}

/**
 * Fill the official DSHS NCP PDF template with form data
 */
export async function fillNCPPdf(formData: NCPFormData): Promise<Uint8Array> {
  // Load the official DSHS NCP template
  const templateUrl = '/forms/templates/AFH HCS NCP-Template 10.11.23 (1).pdf';
  const templateResponse = await fetch(templateUrl);
  if (!templateResponse.ok) {
    throw new Error(`Failed to load NCP template: ${templateResponse.status}`);
  }
  const templateBytes = await templateResponse.arrayBuffer();

  // Load the PDF
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();

  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Default text options
  const defaultFontSize = 9;
  const textColor = rgb(0, 0, 0);

  /**
   * Draw text at specific coordinates
   */
  const drawText = (
    pageIndex: number,
    text: string | undefined | null,
    x: number,
    y: number,
    options: { maxWidth?: number; fontSize?: number; bold?: boolean } = {}
  ) => {
    if (!text || pageIndex >= pages.length) return;

    const page = pages[pageIndex];
    const { maxWidth = 200, fontSize = defaultFontSize, bold = false } = options;
    const font = bold ? helveticaBold : helvetica;

    // Truncate text if too wide
    let displayText = String(text);
    const textWidth = font.widthOfTextAtSize(displayText, fontSize);
    if (textWidth > maxWidth && displayText.length > 3) {
      while (font.widthOfTextAtSize(displayText + '...', fontSize) > maxWidth && displayText.length > 3) {
        displayText = displayText.slice(0, -1);
      }
      displayText += '...';
    }

    page.drawText(displayText, {
      x,
      y,
      size: fontSize,
      font,
      color: textColor,
    });
  };

  /**
   * Draw multiline text with word wrapping
   */
  const drawMultiline = (
    pageIndex: number,
    text: string | undefined | null,
    x: number,
    y: number,
    options: { maxWidth?: number; lineHeight?: number; fontSize?: number; maxLines?: number } = {}
  ) => {
    if (!text || pageIndex >= pages.length) return;

    const { maxWidth = 200, lineHeight = 11, fontSize = defaultFontSize, maxLines = 10 } = options;
    const words = String(text).split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = helvetica.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Draw each line (Y decreases as we go down)
    const linesToDraw = lines.slice(0, maxLines);
    linesToDraw.forEach((line, index) => {
      drawText(pageIndex, line, x, y - (index * lineHeight), { maxWidth, fontSize });
    });
  };

  /**
   * Draw checkbox (X if checked)
   */
  const drawCheck = (pageIndex: number, checked: boolean | undefined, x: number, y: number) => {
    if (!checked || pageIndex >= pages.length) return;
    pages[pageIndex].drawText('X', {
      x: x + 2,
      y: y - 2,
      size: 10,
      font: helveticaBold,
      color: textColor,
    });
  };

  // ============================================
  // PAGE 0: RESIDENT INFORMATION
  // ============================================
  const ri = formData.residentInfo || {};
  const legalDocs = ri.legalDocuments || {};
  const specialNeeds = ri.specialtyNeeds || {};
  const residentFullName = `${ri.firstName || ''} ${ri.lastName || ''}`.trim();

  // Provider name and dates row
  let coord = getCoord('page0', 'providerName');
  if (coord) drawText(0, ri.providerName, coord.x, coord.y, { maxWidth: 150 });

  coord = getCoord('page0', 'ncpStartDate');
  if (coord) drawText(0, formatDate(ri.ncpStartDate), coord.x, coord.y, { maxWidth: 80 });

  coord = getCoord('page0', 'movedInDate');
  if (coord) drawText(0, formatDate(ri.movedInDate), coord.x, coord.y, { maxWidth: 80 });

  coord = getCoord('page0', 'dateCompleted');
  if (coord) drawText(0, formatDate(ri.dateCompleted), coord.x, coord.y, { maxWidth: 80 });

  // Resident name row
  coord = getCoord('page0', 'residentFirstName');
  if (coord) drawText(0, ri.firstName, coord.x, coord.y, { maxWidth: 120 });

  coord = getCoord('page0', 'residentLastName');
  if (coord) drawText(0, ri.lastName, coord.x, coord.y, { maxWidth: 140 });

  coord = getCoord('page0', 'preferredName');
  if (coord) drawText(0, ri.preferredName, coord.x, coord.y, { maxWidth: 120 });

  coord = getCoord('page0', 'pronouns');
  if (coord) drawText(0, ri.pronouns, coord.x, coord.y, { maxWidth: 80 });

  // DOB and language row
  coord = getCoord('page0', 'dateOfBirth');
  if (coord) drawText(0, formatDate(ri.dateOfBirth), coord.x, coord.y, { maxWidth: 100 });

  coord = getCoord('page0', 'primaryLanguage');
  if (coord) drawText(0, ri.primaryLanguage, coord.x, coord.y, { maxWidth: 120 });

  coord = getCoord('page0', 'speaksEnglishYes');
  if (coord) drawCheck(0, ri.speaksEnglish === true, coord.x, coord.y);

  coord = getCoord('page0', 'speaksEnglishNo');
  if (coord) drawCheck(0, ri.speaksEnglish === false, coord.x, coord.y);

  coord = getCoord('page0', 'interpreterYes');
  if (coord) drawCheck(0, ri.interpreterNeeded === true, coord.x, coord.y);

  coord = getCoord('page0', 'interpreterNo');
  if (coord) drawCheck(0, ri.interpreterNeeded === false, coord.x, coord.y);

  // Allergies
  coord = getCoord('page0', 'allergies');
  if (coord) drawMultiline(0, ri.allergies, coord.x, coord.y, { maxWidth: 600, maxLines: 2 });

  // Legal Documents checkboxes
  coord = getCoord('page0', 'legalPOA');
  if (coord) drawCheck(0, legalDocs.powerOfAttorney, coord.x, coord.y);

  coord = getCoord('page0', 'legalGuardian');
  if (coord) drawCheck(0, legalDocs.guardian, coord.x, coord.y);

  coord = getCoord('page0', 'legalHealthcare');
  if (coord) drawCheck(0, legalDocs.healthcareDirective, coord.x, coord.y);

  coord = getCoord('page0', 'legalPOLST');
  if (coord) drawCheck(0, legalDocs.polst, coord.x, coord.y);

  coord = getCoord('page0', 'legalDNR');
  if (coord) drawCheck(0, legalDocs.dnr, coord.x, coord.y);

  coord = getCoord('page0', 'legalOther');
  if (coord) drawCheck(0, legalDocs.other, coord.x, coord.y);

  coord = getCoord('page0', 'legalOtherText');
  if (coord && legalDocs.otherText) drawText(0, legalDocs.otherText, coord.x, coord.y, { maxWidth: 150 });

  // Specialty Needs checkboxes
  coord = getCoord('page0', 'specialtyDialysis');
  if (coord) drawCheck(0, specialNeeds.dialysis, coord.x, coord.y);

  coord = getCoord('page0', 'specialtyHospice');
  if (coord) drawCheck(0, specialNeeds.hospice, coord.x, coord.y);

  coord = getCoord('page0', 'specialtyBehavioral');
  if (coord) drawCheck(0, specialNeeds.behavioralHealth, coord.x, coord.y);

  coord = getCoord('page0', 'specialtyMemory');
  if (coord) drawCheck(0, specialNeeds.memoryCare, coord.x, coord.y);

  coord = getCoord('page0', 'specialtyOther');
  if (coord) drawCheck(0, specialNeeds.other, coord.x, coord.y);

  coord = getCoord('page0', 'specialtyOtherText');
  if (coord && specialNeeds.otherText) drawText(0, specialNeeds.otherText, coord.x, coord.y, { maxWidth: 150 });

  // ============================================
  // PAGE 1: EMERGENCY CONTACTS
  // ============================================
  const contacts = formData.emergencyContacts?.contacts || [];

  if (contacts.length > 0) {
    const c1 = contacts[0];
    coord = getCoord('page1', 'contact1Name');
    if (coord) drawText(1, c1.name, coord.x, coord.y, { maxWidth: 200 });

    coord = getCoord('page1', 'contact1Relationship');
    if (coord) drawText(1, c1.relationship, coord.x, coord.y, { maxWidth: 150 });

    coord = getCoord('page1', 'contact1HomePhone');
    if (coord) drawText(1, c1.homePhone, coord.x, coord.y, { maxWidth: 120 });

    coord = getCoord('page1', 'contact1CellPhone');
    if (coord) drawText(1, c1.cellPhone, coord.x, coord.y, { maxWidth: 120 });

    coord = getCoord('page1', 'contact1Email');
    if (coord) drawText(1, c1.email, coord.x, coord.y, { maxWidth: 200 });

    coord = getCoord('page1', 'contact1PreferredContact');
    if (coord) drawText(1, c1.preferredContact, coord.x, coord.y, { maxWidth: 100 });

    coord = getCoord('page1', 'contact1Address');
    if (coord) drawText(1, c1.address, coord.x, coord.y, { maxWidth: 300 });
  }

  if (contacts.length > 1) {
    const c2 = contacts[1];
    coord = getCoord('page1', 'contact2Name');
    if (coord) drawText(1, c2.name, coord.x, coord.y, { maxWidth: 200 });

    coord = getCoord('page1', 'contact2Relationship');
    if (coord) drawText(1, c2.relationship, coord.x, coord.y, { maxWidth: 150 });

    coord = getCoord('page1', 'contact2HomePhone');
    if (coord) drawText(1, c2.homePhone, coord.x, coord.y, { maxWidth: 120 });

    coord = getCoord('page1', 'contact2CellPhone');
    if (coord) drawText(1, c2.cellPhone, coord.x, coord.y, { maxWidth: 120 });
  }

  // ============================================
  // PAGE 2: EMERGENCY EVACUATION
  // ============================================
  const evac = formData.evacuation || {};
  const mobilityAids = evac.mobilityAids || {};

  coord = getCoord('page2', 'evacuationIndependent');
  if (coord) drawCheck(2, evac.evacuationAssistance === 'independent', coord.x, coord.y);

  coord = getCoord('page2', 'evacuationAssistance');
  if (coord) drawCheck(2, evac.evacuationAssistance === 'assistance_required', coord.x, coord.y);

  coord = getCoord('page2', 'evacuationDescription');
  if (coord) {
    const desc = evac.evacuationAssistance === 'independent' ? evac.independentDescription : evac.assistanceDescription;
    drawMultiline(2, desc, coord.x, coord.y, { maxWidth: 500, maxLines: 3 });
  }

  coord = getCoord('page2', 'mobilityWheelchair');
  if (coord) drawCheck(2, mobilityAids.wheelchair, coord.x, coord.y);

  coord = getCoord('page2', 'mobilityWalker');
  if (coord) drawCheck(2, mobilityAids.walker, coord.x, coord.y);

  coord = getCoord('page2', 'mobilityCane');
  if (coord) drawCheck(2, mobilityAids.cane, coord.x, coord.y);

  coord = getCoord('page2', 'mobilityNone');
  if (coord) drawCheck(2, mobilityAids.none, coord.x, coord.y);

  coord = getCoord('page2', 'evacuationInstructions');
  if (coord) drawMultiline(2, evac.evacuationInstructions, coord.x, coord.y, { maxWidth: 600, maxLines: 4 });

  // ============================================
  // PAGE 3: COMMUNICATION
  // ============================================
  const comm = formData.communication || {};

  coord = getCoord('page3', 'expressionProblemsYes');
  if (coord) drawCheck(3, comm.expressionProblems === 'yes', coord.x, coord.y);

  coord = getCoord('page3', 'expressionProblemsNo');
  if (coord) drawCheck(3, comm.expressionProblems === 'no', coord.x, coord.y);

  coord = getCoord('page3', 'expressionDescription');
  if (coord) drawText(3, comm.expressionDescription, coord.x, coord.y, { maxWidth: 350 });

  coord = getCoord('page3', 'hearingProblemsYes');
  if (coord) drawCheck(3, comm.hearingProblems === 'yes', coord.x, coord.y);

  coord = getCoord('page3', 'hearingProblemsNo');
  if (coord) drawCheck(3, comm.hearingProblems === 'no', coord.x, coord.y);

  coord = getCoord('page3', 'hearingDescription');
  if (coord) drawText(3, comm.hearingDescription, coord.x, coord.y, { maxWidth: 350 });

  coord = getCoord('page3', 'visionProblemsYes');
  if (coord) drawCheck(3, comm.visionProblems === 'yes', coord.x, coord.y);

  coord = getCoord('page3', 'visionProblemsNo');
  if (coord) drawCheck(3, comm.visionProblems === 'no', coord.x, coord.y);

  coord = getCoord('page3', 'visionDescription');
  if (coord) drawText(3, comm.visionDescription, coord.x, coord.y, { maxWidth: 350 });

  // ============================================
  // PAGE 4: MEDICATION MANAGEMENT
  // ============================================
  const med = formData.medication || {};
  const medTypes = med.medTypes || {};

  coord = getCoord('page4', 'medicationAllergiesYes');
  if (coord) drawCheck(4, med.hasMedicationAllergies === true, coord.x, coord.y);

  coord = getCoord('page4', 'medicationAllergiesNo');
  if (coord) drawCheck(4, med.hasMedicationAllergies === false, coord.x, coord.y);

  coord = getCoord('page4', 'medicationAllergiesList');
  if (coord) drawText(4, med.medicationAllergies, coord.x, coord.y, { maxWidth: 400 });

  coord = getCoord('page4', 'medsOrderedBy');
  if (coord) drawText(4, med.medsOrderedBy, coord.x, coord.y, { maxWidth: 180 });

  coord = getCoord('page4', 'medsDeliveredBy');
  if (coord) drawText(4, med.medsDeliveredBy, coord.x, coord.y, { maxWidth: 180 });

  coord = getCoord('page4', 'pharmacyName');
  if (coord) drawText(4, med.pharmacyName, coord.x, coord.y, { maxWidth: 200 });

  coord = getCoord('page4', 'medLevelSelf');
  if (coord) drawCheck(4, med.medicationLevel === 'self_administration', coord.x, coord.y);

  coord = getCoord('page4', 'medLevelAssist');
  if (coord) drawCheck(4, med.medicationLevel === 'self_with_assistance', coord.x, coord.y);

  coord = getCoord('page4', 'medLevelFull');
  if (coord) drawCheck(4, med.medicationLevel === 'full_administration', coord.x, coord.y);

  // Medication types
  coord = getCoord('page4', 'medTypeOral');
  if (coord) drawCheck(4, medTypes.oral, coord.x, coord.y);

  coord = getCoord('page4', 'medTypeTopical');
  if (coord) drawCheck(4, medTypes.topical, coord.x, coord.y);

  coord = getCoord('page4', 'medTypeEyeDrops');
  if (coord) drawCheck(4, medTypes.eyeDrops, coord.x, coord.y);

  coord = getCoord('page4', 'medTypeInhalers');
  if (coord) drawCheck(4, medTypes.inhalers, coord.x, coord.y);

  coord = getCoord('page4', 'medTypeSprays');
  if (coord) drawCheck(4, medTypes.sprays, coord.x, coord.y);

  coord = getCoord('page4', 'medTypeInjections');
  if (coord) drawCheck(4, medTypes.injections, coord.x, coord.y);

  // ============================================
  // PAGE 6: HEALTH INDICATORS
  // ============================================
  const hi = formData.healthIndicators || {};

  coord = getCoord('page6', 'painIssuesYes');
  if (coord) drawCheck(6, hi.painIssues === true, coord.x, coord.y);

  coord = getCoord('page6', 'painIssuesNo');
  if (coord) drawCheck(6, hi.painIssues === false, coord.x, coord.y);

  coord = getCoord('page6', 'painDescription');
  if (coord) drawText(6, hi.painDescription, coord.x, coord.y, { maxWidth: 350 });

  coord = getCoord('page6', 'currentWeight');
  if (coord) drawText(6, hi.currentWeight, coord.x, coord.y, { maxWidth: 80 });

  coord = getCoord('page6', 'currentHeight');
  if (coord) drawText(6, hi.currentHeight, coord.x, coord.y, { maxWidth: 80 });

  coord = getCoord('page6', 'vitalSignsYes');
  if (coord) drawCheck(6, hi.vitalSignsMonitoring === true, coord.x, coord.y);

  coord = getCoord('page6', 'vitalSignsNo');
  if (coord) drawCheck(6, hi.vitalSignsMonitoring === false, coord.x, coord.y);

  coord = getCoord('page6', 'vitalSignsFrequency');
  if (coord) drawText(6, hi.vitalSignsFrequency, coord.x, coord.y, { maxWidth: 200 });

  // ============================================
  // PAGE 7: TREATMENTS
  // ============================================
  const treat = formData.treatments || {};

  coord = getCoord('page7', 'oxygenUse');
  if (coord) drawCheck(7, treat.oxygenUse, coord.x, coord.y);

  coord = getCoord('page7', 'dialysis');
  if (coord) drawCheck(7, treat.dialysis, coord.x, coord.y);

  coord = getCoord('page7', 'bloodThinners');
  if (coord) drawCheck(7, treat.bloodThinners, coord.x, coord.y);

  coord = getCoord('page7', 'bloodGlucose');
  if (coord) drawCheck(7, treat.bloodGlucoseMonitoring, coord.x, coord.y);

  coord = getCoord('page7', 'cpapBipap');
  if (coord) drawCheck(7, treat.cpapBipap, coord.x, coord.y);

  coord = getCoord('page7', 'nebulizer');
  if (coord) drawCheck(7, treat.nebulizer, coord.x, coord.y);

  coord = getCoord('page7', 'injections');
  if (coord) drawCheck(7, treat.injections, coord.x, coord.y);

  coord = getCoord('page7', 'ptOtSt');
  if (coord) drawCheck(7, treat.ptOtSt, coord.x, coord.y);

  coord = getCoord('page7', 'homeHealth');
  if (coord) drawCheck(7, treat.homeHealth, coord.x, coord.y);

  coord = getCoord('page7', 'homeHealthAgency');
  if (coord) drawText(7, treat.homeHealthAgency, coord.x, coord.y, { maxWidth: 200 });

  coord = getCoord('page7', 'hospice');
  if (coord) drawCheck(7, treat.hospice, coord.x, coord.y);

  coord = getCoord('page7', 'hospiceAgency');
  if (coord) drawText(7, treat.hospiceAgency, coord.x, coord.y, { maxWidth: 200 });

  // ============================================
  // PAGE 9: PSYCH/SOCIAL/COGNITIVE
  // ============================================
  const psc = formData.psychSocial || {};
  const behaviors = psc.behaviors || {};

  coord = getCoord('page9', 'sleepDisturbanceYes');
  if (coord) drawCheck(9, psc.sleepDisturbance === true, coord.x, coord.y);

  coord = getCoord('page9', 'sleepDisturbanceNo');
  if (coord) drawCheck(9, psc.sleepDisturbance === false, coord.x, coord.y);

  coord = getCoord('page9', 'sleepDescription');
  if (coord) drawText(9, psc.sleepDescription, coord.x, coord.y, { maxWidth: 350 });

  coord = getCoord('page9', 'shortTermMemory');
  if (coord) drawCheck(9, psc.shortTermMemoryIssues, coord.x, coord.y);

  coord = getCoord('page9', 'longTermMemory');
  if (coord) drawCheck(9, psc.longTermMemoryIssues, coord.x, coord.y);

  coord = getCoord('page9', 'orientedToPerson');
  if (coord) drawCheck(9, psc.orientedToPerson, coord.x, coord.y);

  coord = getCoord('page9', 'behaviorImpairedDecision');
  if (coord) drawCheck(9, behaviors.impairedDecisionMaking, coord.x, coord.y);

  coord = getCoord('page9', 'behaviorDisruptive');
  if (coord) drawCheck(9, behaviors.disruptiveBehavior, coord.x, coord.y);

  coord = getCoord('page9', 'behaviorAssaultive');
  if (coord) drawCheck(9, behaviors.assaultive, coord.x, coord.y);

  coord = getCoord('page9', 'behaviorResistive');
  if (coord) drawCheck(9, behaviors.resistiveToCare, coord.x, coord.y);

  // ============================================
  // PAGE 11: ADLs - AMBULATION
  // ============================================
  const adls = formData.adls || {};
  const amb = adls.ambulation || {};

  coord = getCoord('page11', 'ambulationInRoom');
  if (coord) drawText(11, amb.inRoomLevel, coord.x, coord.y, { maxWidth: 150 });

  coord = getCoord('page11', 'ambulationOutside');
  if (coord) drawText(11, amb.outsideLevel, coord.x, coord.y, { maxWidth: 150 });

  coord = getCoord('page11', 'fallRiskYes');
  if (coord) drawCheck(11, amb.fallRisk === true, coord.x, coord.y);

  coord = getCoord('page11', 'fallRiskNo');
  if (coord) drawCheck(11, amb.fallRisk === false, coord.x, coord.y);

  // ============================================
  // PAGE 16: IADLs
  // ============================================
  const iadls = formData.iadls || {};
  const finances = iadls.finances || {};
  const shopping = iadls.shopping || {};
  const transportation = iadls.transportation || {};

  coord = getCoord('page16', 'financesLevel');
  if (coord) drawText(16, finances.level, coord.x, coord.y, { maxWidth: 150 });

  coord = getCoord('page16', 'whoManagesFinances');
  if (coord) drawText(16, finances.whoManagesFinances, coord.x, coord.y, { maxWidth: 200 });

  coord = getCoord('page16', 'shoppingLevel');
  if (coord) drawText(16, shopping.level, coord.x, coord.y, { maxWidth: 150 });

  coord = getCoord('page16', 'transportNeeds');
  if (coord) drawText(16, shopping.transportNeeds, coord.x, coord.y, { maxWidth: 200 });

  coord = getCoord('page16', 'transportationLevel');
  if (coord) drawText(16, transportation.level, coord.x, coord.y, { maxWidth: 150 });

  coord = getCoord('page16', 'escortRequired');
  if (coord) drawCheck(16, transportation.escortRequired, coord.x, coord.y);

  // ============================================
  // PAGE 19: ACTIVITY PREFERENCES
  // ============================================
  const activityPrefs = iadls.activityPreferences || {};

  coord = getCoord('page19', 'activityReading');
  if (coord) drawCheck(19, activityPrefs.reading, coord.x, coord.y);

  coord = getCoord('page19', 'activityAudioBooks');
  if (coord) drawCheck(19, activityPrefs.audioBooks, coord.x, coord.y);

  coord = getCoord('page19', 'activityStorytelling');
  if (coord) drawCheck(19, activityPrefs.storytelling, coord.x, coord.y);

  coord = getCoord('page19', 'activityPhone');
  if (coord) drawCheck(19, activityPrefs.phoneConversations, coord.x, coord.y);

  coord = getCoord('page19', 'activityReminiscing');
  if (coord) drawCheck(19, activityPrefs.reminiscing, coord.x, coord.y);

  coord = getCoord('page19', 'activityCurrentEvents');
  if (coord) drawCheck(19, activityPrefs.currentEvents, coord.x, coord.y);

  coord = getCoord('page19', 'activityChurch');
  if (coord) drawCheck(19, activityPrefs.bibleStudyChurch, coord.x, coord.y);

  coord = getCoord('page19', 'activityVisitors');
  if (coord) drawCheck(19, activityPrefs.visitors, coord.x, coord.y);

  // ============================================
  // PAGE 19/20: SIGNATURES
  // ============================================
  const sig = formData.signatures || {};

  coord = getCoord('page20', 'dateOfOriginalPlan');
  if (coord) drawText(19, formatDate(sig.dateOfOriginalPlan), coord.x, coord.y, { maxWidth: 100 });

  coord = getCoord('page20', 'reviewDates');
  if (coord) drawText(19, sig.reviewDates, coord.x, coord.y, { maxWidth: 250 });

  // Add resident name to header of each page (after page 0)
  for (let i = 1; i < pages.length; i++) {
    // Draw resident name at top of each page
    drawText(i, `Resident: ${residentFullName}`, 50, NCP_PAGE_HEIGHT - 30, { maxWidth: 300, fontSize: 8 });
  }

  // Save the filled PDF
  return await pdfDoc.save();
}

/**
 * Download the filled NCP PDF
 */
export function downloadNCPPdf(pdfBytes: Uint8Array, residentName: string): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `NCP-${residentName || 'Resident'}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open filled NCP PDF in new tab for printing
 */
export function openNCPPdfForPrint(pdfBytes: Uint8Array): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
