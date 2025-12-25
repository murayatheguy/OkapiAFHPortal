import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * NCP (Negotiated Care Plan) PDF Filler
 * Uses coordinate-based text placement on the official DSHS template
 * PDF is 20 pages, LANDSCAPE orientation (792 x 612 points)
 */

// Re-export the type from ncp-wizard for convenience
export type { NCPFormData } from '@/components/owner/forms/ncp-wizard';

// Import type for use in this file
import type { NCPFormData } from '@/components/owner/forms/ncp-wizard';

/**
 * Fill the official NCP PDF template with form data
 */
export async function fillNCPPdf(formData: NCPFormData): Promise<Uint8Array> {
  // Load the blank template
  const templateUrl = '/forms/templates/AFH HCS NCP-Template 10.11.23 (1).pdf';
  const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const fontSize = 9;
  const smallFont = 8;
  const textColor = rgb(0, 0, 0);

  // Helper: Draw text at coordinates
  const drawText = (
    pageIndex: number,
    text: string | undefined | null,
    x: number,
    y: number,
    options?: { size?: number; bold?: boolean; maxWidth?: number }
  ) => {
    if (!text) return;
    const page = pages[pageIndex];
    if (!page) return;

    const size = options?.size || fontSize;
    const font = options?.bold ? helveticaBold : helvetica;

    // Truncate if needed
    let displayText = String(text);
    if (options?.maxWidth) {
      const textWidth = font.widthOfTextAtSize(displayText, size);
      if (textWidth > options.maxWidth) {
        while (font.widthOfTextAtSize(displayText + '...', size) > options.maxWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '...';
      }
    }

    page.drawText(displayText, {
      x,
      y,
      size,
      font,
      color: textColor,
    });
  };

  // Helper: Draw checkbox (X mark)
  const drawCheck = (pageIndex: number, checked: boolean | undefined, x: number, y: number) => {
    if (!checked) return;
    const page = pages[pageIndex];
    if (!page) return;

    page.drawText('X', {
      x: x + 2,
      y: y - 2,
      size: 10,
      font: helveticaBold,
      color: textColor,
    });
  };

  // Helper: Draw multiline text
  const drawMultiline = (
    pageIndex: number,
    text: string | undefined,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number = 11
  ) => {
    if (!text) return;
    const page = pages[pageIndex];
    if (!page) return;

    const words = text.split(' ');
    let currentLine = '';
    let currentY = y;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = helvetica.widthOfTextAtSize(testLine, smallFont);

      if (textWidth > maxWidth && currentLine) {
        page.drawText(currentLine, {
          x,
          y: currentY,
          size: smallFont,
          font: helvetica,
          color: textColor,
        });
        currentLine = word;
        currentY -= lineHeight;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, {
        x,
        y: currentY,
        size: smallFont,
        font: helvetica,
        color: textColor,
      });
    }
  };

  // Format date for display
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // ============================================
  // PAGE 1 (index 0) - Header & Provider Info
  // Note: Landscape orientation (792 x 612)
  // ============================================

  // Provider Name (top left area)
  drawText(0, formData.residentInfo.providerName, 120, 560, { maxWidth: 200 });

  // NCP Start Date
  drawText(0, formatDate(formData.residentInfo.ncpStartDate), 400, 560, { maxWidth: 100 });

  // Moved In Date
  drawText(0, formatDate(formData.residentInfo.movedInDate), 550, 560, { maxWidth: 100 });

  // Date Completed
  drawText(0, formatDate(formData.residentInfo.dateCompleted), 700, 560, { maxWidth: 80 });

  // Resident First Name
  drawText(0, formData.residentInfo.firstName, 120, 520, { maxWidth: 150 });

  // Resident Last Name
  drawText(0, formData.residentInfo.lastName, 300, 520, { maxWidth: 150 });

  // Preferred Name
  drawText(0, formData.residentInfo.preferredName, 480, 520, { maxWidth: 100 });

  // Pronouns
  drawText(0, formData.residentInfo.pronouns, 620, 520, { maxWidth: 80 });

  // Date of Birth
  drawText(0, formatDate(formData.residentInfo.dateOfBirth), 720, 520, { maxWidth: 60 });

  // Primary Language
  drawText(0, formData.residentInfo.primaryLanguage, 120, 480, { maxWidth: 150 });

  // Speaks English checkbox
  drawCheck(0, formData.residentInfo.speaksEnglish, 300, 480);

  // Interpreter Needed checkbox
  drawCheck(0, formData.residentInfo.interpreterNeeded, 400, 480);

  // Allergies
  drawMultiline(0, formData.residentInfo.allergies, 120, 440, 650);

  // Legal Documents checkboxes
  const legalDocs = formData.residentInfo.legalDocuments;
  drawCheck(0, legalDocs.powerOfAttorney, 120, 380);
  drawCheck(0, legalDocs.guardian, 220, 380);
  drawCheck(0, legalDocs.healthcareDirective, 320, 380);
  drawCheck(0, legalDocs.polst, 440, 380);
  drawCheck(0, legalDocs.dnr, 520, 380);
  drawCheck(0, legalDocs.other, 580, 380);
  if (legalDocs.other && legalDocs.otherText) {
    drawText(0, legalDocs.otherText, 620, 380, { maxWidth: 150 });
  }

  // Specialty Needs checkboxes
  const specialtyNeeds = formData.residentInfo.specialtyNeeds;
  drawCheck(0, specialtyNeeds.dialysis, 120, 340);
  drawCheck(0, specialtyNeeds.hospice, 220, 340);
  drawCheck(0, specialtyNeeds.behavioralHealth, 320, 340);
  drawCheck(0, specialtyNeeds.memoryCare, 450, 340);
  drawCheck(0, specialtyNeeds.other, 560, 340);
  if (specialtyNeeds.other && specialtyNeeds.otherText) {
    drawText(0, specialtyNeeds.otherText, 600, 340, { maxWidth: 170 });
  }

  // ============================================
  // PAGE 2 (index 1) - Emergency Contacts
  // ============================================

  const contacts = formData.emergencyContacts.contacts;
  let contactY = 520;

  contacts.slice(0, 3).forEach((contact, idx) => {
    const baseY = contactY - (idx * 120);

    drawText(1, contact.name, 120, baseY, { maxWidth: 200 });
    drawText(1, contact.relationship, 350, baseY, { maxWidth: 100 });
    drawText(1, contact.homePhone, 480, baseY, { maxWidth: 100 });
    drawText(1, contact.cellPhone, 600, baseY, { maxWidth: 100 });
    drawText(1, contact.email, 120, baseY - 20, { maxWidth: 250 });
    drawText(1, contact.address, 400, baseY - 20, { maxWidth: 370 });

    // Preferred contact checkboxes
    drawCheck(1, contact.preferredContact === 'home', 120, baseY - 40);
    drawCheck(1, contact.preferredContact === 'cell', 200, baseY - 40);
    drawCheck(1, contact.preferredContact === 'email', 280, baseY - 40);
  });

  // ============================================
  // PAGE 3 (index 2) - Emergency Evacuation
  // ============================================

  const evac = formData.evacuation;

  // Evacuation assistance level
  drawCheck(2, evac.evacuationAssistance === 'independent', 120, 520);
  drawCheck(2, evac.evacuationAssistance === 'assistance_required', 120, 480);

  // Descriptions
  if (evac.evacuationAssistance === 'independent') {
    drawMultiline(2, evac.independentDescription, 200, 520, 550);
  } else {
    drawMultiline(2, evac.assistanceDescription, 200, 480, 550);
  }

  // Evacuation instructions
  drawMultiline(2, evac.evacuationInstructions, 120, 400, 650);

  // Mobility aids checkboxes
  const mobility = evac.mobilityAids;
  drawCheck(2, mobility.wheelchair, 120, 320);
  drawCheck(2, mobility.walker, 220, 320);
  drawCheck(2, mobility.cane, 320, 320);
  drawCheck(2, mobility.none, 420, 320);

  // Evacuation notes
  drawMultiline(2, evac.evacuationNotes, 120, 280, 650);

  // ============================================
  // PAGE 4 (index 3) - Communication
  // ============================================

  const comm = formData.communication;

  // Expression problems
  drawCheck(3, comm.expressionProblems === 'yes', 120, 520);
  drawCheck(3, comm.expressionProblems === 'no', 180, 520);
  drawMultiline(3, comm.expressionDescription, 250, 520, 500);
  drawText(3, comm.expressionEquipment, 120, 480, { maxWidth: 300 });

  // Hearing problems
  drawCheck(3, comm.hearingProblems === 'yes', 120, 440);
  drawCheck(3, comm.hearingProblems === 'no', 180, 440);
  drawMultiline(3, comm.hearingDescription, 250, 440, 500);
  drawText(3, comm.hearingEquipment, 120, 400, { maxWidth: 300 });

  // Vision problems
  drawCheck(3, comm.visionProblems === 'yes', 120, 360);
  drawCheck(3, comm.visionProblems === 'no', 180, 360);
  drawMultiline(3, comm.visionDescription, 250, 360, 500);
  drawText(3, comm.visionEquipment, 120, 320, { maxWidth: 300 });

  // Phone ability
  drawCheck(3, comm.phoneAbility === 'independent', 120, 280);
  drawCheck(3, comm.phoneAbility === 'assistance', 220, 280);
  drawCheck(3, comm.phoneAbility === 'dependent', 320, 280);
  drawCheck(3, comm.hasOwnPhone, 450, 280);
  drawText(3, comm.phoneNumber, 550, 280, { maxWidth: 150 });

  // Communication strengths/assistance
  drawMultiline(3, comm.communicationStrengths, 120, 220, 300);
  drawMultiline(3, comm.communicationAssistance, 450, 220, 300);

  // ============================================
  // PAGE 5-6 (index 4-5) - Medication Management
  // ============================================

  const meds = formData.medication;

  // Page 5 - Medication overview
  drawCheck(4, meds.hasMedicationAllergies, 120, 520);
  drawMultiline(4, meds.medicationAllergies, 200, 520, 550);

  drawCheck(4, meds.needsMultipleMedAssistance, 120, 460);
  drawCheck(4, meds.hasPsychMedications, 350, 460);

  drawText(4, meds.medsOrderedBy, 120, 420, { maxWidth: 200 });
  drawText(4, meds.medsDeliveredBy, 350, 420, { maxWidth: 200 });
  drawCheck(4, meds.medsPharmacyPacked, 580, 420);
  drawText(4, meds.pharmacyName, 650, 420, { maxWidth: 120 });

  // Medication level
  drawCheck(4, meds.medicationLevel === 'self_administration', 120, 380);
  drawCheck(4, meds.medicationLevel === 'self_with_assistance', 280, 380);
  drawCheck(4, meds.medicationLevel === 'full_administration', 480, 380);
  drawMultiline(4, meds.medicationLevelReason, 120, 340, 650);

  // Med types
  const medTypes = meds.medTypes;
  drawCheck(4, medTypes.oral, 120, 280);
  drawCheck(4, medTypes.topical, 200, 280);
  drawCheck(4, medTypes.eyeDrops, 280, 280);
  drawCheck(4, medTypes.inhalers, 360, 280);
  drawCheck(4, medTypes.sprays, 440, 280);
  drawCheck(4, medTypes.injections, 520, 280);
  drawCheck(4, medTypes.allergyKits, 600, 280);
  drawCheck(4, medTypes.suppositories, 680, 280);
  drawCheck(4, medTypes.other, 120, 250);
  drawText(4, meds.medTypeOtherText, 180, 250, { maxWidth: 200 });

  // Page 6 - Nurse delegation
  drawCheck(5, meds.requiresNurseDelegation, 120, 520);
  drawText(5, meds.rnDelegatorName, 120, 480, { maxWidth: 200 });
  drawText(5, meds.rnDelegatorPhone, 350, 480, { maxWidth: 150 });
  drawText(5, meds.rnDelegatorEmail, 530, 480, { maxWidth: 200 });

  // Plans
  drawMultiline(5, meds.medicationPlanWhenAway, 120, 400, 650);
  drawMultiline(5, meds.medicationRefusalPlan, 120, 300, 650);

  // ============================================
  // PAGE 7-8 (index 6-7) - Health Indicators
  // ============================================

  const health = formData.healthIndicators;

  // Pain
  drawCheck(6, health.painIssues, 120, 520);
  drawMultiline(6, health.painDescription, 200, 520, 550);
  drawMultiline(6, health.painImpact, 120, 460, 650);

  // Weight
  drawCheck(6, health.weightIssues, 120, 400);
  drawText(6, health.currentWeight, 200, 400, { maxWidth: 80 });
  drawText(6, health.currentHeight, 320, 400, { maxWidth: 80 });

  // Vitals
  drawCheck(6, health.vitalSignsMonitoring, 120, 360);
  drawText(6, health.vitalSignsFrequency, 200, 360, { maxWidth: 200 });

  // Hospitalization
  drawCheck(6, health.recentHospitalization, 120, 320);
  drawMultiline(6, health.hospitalizationDetails, 200, 320, 550);

  // Other health indicators
  drawMultiline(6, health.otherHealthIndicators, 120, 260, 650);

  // Allergies table (page 7)
  let allergyY = 520;
  health.allergies.slice(0, 5).forEach((allergy, idx) => {
    drawText(7, allergy.substance, 120, allergyY - (idx * 30), { maxWidth: 300 });
    drawText(7, allergy.reaction, 450, allergyY - (idx * 30), { maxWidth: 300 });
  });

  // Health monitoring strengths/assistance
  drawMultiline(7, health.healthMonitoringStrengths, 120, 320, 300);
  drawMultiline(7, health.healthMonitoringAssistance, 450, 320, 300);

  // ============================================
  // PAGE 9-10 (index 8-9) - Treatments & Therapies
  // ============================================

  const treat = formData.treatments;

  // Treatments checkboxes
  drawCheck(8, treat.oxygenUse, 120, 520);
  drawText(8, treat.oxygenVendor, 200, 520, { maxWidth: 150 });
  drawCheck(8, treat.dialysis, 380, 520);
  drawText(8, treat.dialysisProvider, 460, 520, { maxWidth: 150 });

  drawCheck(8, treat.bloodThinners, 120, 480);
  drawText(8, treat.inrLabProvider, 200, 480, { maxWidth: 150 });
  drawCheck(8, treat.easilyBruised, 380, 480);

  drawCheck(8, treat.bloodGlucoseMonitoring, 120, 440);
  drawCheck(8, treat.injections, 280, 440);
  drawCheck(8, treat.cpapBipap, 400, 440);
  drawCheck(8, treat.nebulizer, 520, 440);
  drawCheck(8, treat.rangeOfMotion, 640, 440);

  drawCheck(8, treat.ptOtSt, 120, 400);
  drawCheck(8, treat.nurseDelegationTreatments, 280, 400);
  drawMultiline(8, treat.nurseDelegationTasks, 450, 400, 300);

  drawMultiline(8, treat.otherTreatments, 120, 340, 650);

  // Programs (page 9)
  drawCheck(9, treat.homeHealth, 120, 520);
  drawText(9, treat.homeHealthAgency, 200, 520, { maxWidth: 200 });
  drawCheck(9, treat.adultDayHealth, 430, 520);

  drawCheck(9, treat.hospice, 120, 480);
  drawText(9, treat.hospiceAgency, 200, 480, { maxWidth: 200 });
  drawCheck(9, treat.hospicePlan, 430, 480);

  drawMultiline(9, treat.otherPrograms, 120, 420, 650);

  // Enablers
  drawMultiline(9, treat.physicalEnablers, 120, 360, 300);
  drawMultiline(9, treat.enablersAssistance, 450, 360, 300);

  // Refusal plan
  drawMultiline(9, treat.treatmentRefusalPlan, 120, 260, 650);

  // ============================================
  // PAGE 11-12 (index 10-11) - Psych/Social/Cognitive
  // ============================================

  const psych = formData.psychSocial;

  // Sleep
  drawCheck(10, psych.sleepDisturbance, 120, 520);
  drawMultiline(10, psych.sleepDescription, 200, 520, 550);
  drawCheck(10, psych.nighttimeAssistance, 120, 460);
  drawMultiline(10, psych.nighttimeAssistanceDescription, 200, 460, 550);

  // Memory
  drawCheck(10, psych.shortTermMemoryIssues, 120, 400);
  drawCheck(10, psych.longTermMemoryIssues, 280, 400);
  drawCheck(10, psych.orientedToPerson, 450, 400);

  // Behaviors checkboxes (first row)
  const behaviors = psych.behaviors;
  drawCheck(10, behaviors.impairedDecisionMaking, 120, 360);
  drawCheck(10, behaviors.disruptiveBehavior, 280, 360);
  drawCheck(10, behaviors.assaultive, 440, 360);
  drawCheck(10, behaviors.resistiveToCare, 560, 360);

  // Behaviors (second row)
  drawCheck(10, behaviors.depression, 120, 330);
  drawCheck(10, behaviors.anxiety, 220, 330);
  drawCheck(10, behaviors.irritability, 320, 330);
  drawCheck(10, behaviors.disorientation, 440, 330);
  drawCheck(10, behaviors.wanderingPacing, 580, 330);

  // Behaviors (third row)
  drawCheck(10, behaviors.exitSeeking, 120, 300);
  drawCheck(10, behaviors.hallucinations, 240, 300);
  drawCheck(10, behaviors.delusions, 380, 300);
  drawCheck(10, behaviors.verballyAgitated, 500, 300);
  drawCheck(10, behaviors.physicallyAgitated, 660, 300);

  // More behaviors (page 11)
  drawCheck(11, behaviors.inappropriateBehavior, 120, 520);
  drawCheck(11, behaviors.suicidalIdeation, 280, 520);
  drawCheck(11, behaviors.difficultyNewSituations, 440, 520);
  drawCheck(11, behaviors.disrobing, 640, 520);

  drawCheck(11, behaviors.weepingCrying, 120, 490);
  drawCheck(11, behaviors.unawareOfConsequences, 280, 490);
  drawCheck(11, behaviors.unrealisticFears, 480, 490);
  drawCheck(11, behaviors.inappropriateSpitting, 640, 490);
  drawCheck(11, behaviors.breaksThrowsThings, 120, 460);

  drawMultiline(11, psych.otherBehaviors, 120, 420, 650);

  // Psych medications
  drawCheck(11, psych.requiresPsychMedications, 120, 360);
  drawMultiline(11, psych.psychMedicationSymptoms, 280, 360, 470);

  drawCheck(11, psych.behavioralHealthCrisisPlan, 120, 300);
  drawCheck(11, psych.counseling, 350, 300);
  drawText(11, psych.mentalHealthProvider, 500, 300, { maxWidth: 250 });

  drawMultiline(11, psych.pastBehaviors, 120, 240, 650);

  // ============================================
  // PAGE 13-16 (index 12-15) - ADLs
  // ============================================

  const adls = formData.adls;

  // Functional limitations (page 13)
  drawMultiline(12, adls.functionalLimitations, 120, 520, 650);

  // Ambulation/Mobility
  const amb = adls.ambulation;
  drawCheck(12, amb.inRoomLevel === 'independent', 120, 460);
  drawCheck(12, amb.inRoomLevel === 'supervision', 200, 460);
  drawCheck(12, amb.inRoomLevel === 'assistance', 280, 460);
  drawCheck(12, amb.inRoomLevel === 'dependent', 360, 460);

  drawCheck(12, amb.outsideLevel === 'independent', 480, 460);
  drawCheck(12, amb.outsideLevel === 'supervision', 560, 460);
  drawCheck(12, amb.outsideLevel === 'assistance', 640, 460);
  drawCheck(12, amb.outsideLevel === 'dependent', 720, 460);

  drawCheck(12, amb.fallRisk, 120, 420);
  drawMultiline(12, amb.fallPreventionPlan, 200, 420, 550);
  drawCheck(12, amb.bedroomDoorLock, 120, 360);

  drawText(12, amb.equipment, 120, 320, { maxWidth: 300 });
  drawText(12, amb.vendor, 450, 320, { maxWidth: 300 });
  drawMultiline(12, amb.strengths, 120, 280, 300);
  drawMultiline(12, amb.assistance, 450, 280, 300);

  // Bed Mobility (page 14)
  const bed = adls.bedMobility;
  drawCheck(13, bed.level === 'independent', 120, 520);
  drawCheck(13, bed.level === 'supervision', 200, 520);
  drawCheck(13, bed.level === 'assistance', 280, 520);
  drawCheck(13, bed.level === 'dependent', 360, 520);

  drawCheck(13, bed.skinCareNeeded, 120, 480);
  drawCheck(13, bed.turningRepositioning, 280, 480);
  drawText(13, bed.turningFrequency, 450, 480, { maxWidth: 150 });
  drawCheck(13, bed.bedFallRisk, 630, 480);

  drawMultiline(13, bed.safetyPlan, 120, 440, 650);

  drawCheck(13, bed.devices.hoyerLift, 120, 380);
  drawCheck(13, bed.devices.transferPole, 240, 380);
  drawCheck(13, bed.devices.other, 380, 380);
  drawText(13, bed.devicesOther, 440, 380, { maxWidth: 200 });

  drawCheck(13, bed.nighttimeCareNeeds, 120, 340);
  drawMultiline(13, bed.strengths, 120, 300, 300);
  drawMultiline(13, bed.assistance, 450, 300, 300);

  // Eating (page 14 continued)
  const eating = adls.eating;
  drawCheck(13, eating.level === 'independent', 120, 220);
  drawCheck(13, eating.level === 'supervision', 200, 220);
  drawCheck(13, eating.level === 'assistance', 280, 220);
  drawCheck(13, eating.level === 'dependent', 360, 220);

  drawText(13, eating.specialDiet, 450, 220, { maxWidth: 300 });
  drawMultiline(13, eating.eatingHabits, 120, 180, 320);
  drawText(13, eating.foodAllergies, 460, 180, { maxWidth: 300 });
  drawText(13, eating.equipment, 120, 140, { maxWidth: 300 });

  // Toileting (page 15)
  const toilet = adls.toileting;
  drawCheck(14, toilet.level === 'independent', 120, 520);
  drawCheck(14, toilet.level === 'supervision', 200, 520);
  drawCheck(14, toilet.level === 'assistance', 280, 520);
  drawCheck(14, toilet.level === 'dependent', 360, 520);

  drawText(14, toilet.frequency, 450, 520, { maxWidth: 150 });
  drawCheck(14, toilet.bladderIncontinence, 120, 480);
  drawCheck(14, toilet.bowelIncontinence, 280, 480);
  drawCheck(14, toilet.incontinenceSkinCare, 440, 480);
  drawText(14, toilet.equipment, 120, 440, { maxWidth: 300 });
  drawMultiline(14, toilet.strengths, 120, 400, 300);
  drawMultiline(14, toilet.assistance, 450, 400, 300);

  // Dressing
  const dressing = adls.dressing;
  drawCheck(14, dressing.level === 'independent', 120, 320);
  drawCheck(14, dressing.level === 'supervision', 200, 320);
  drawCheck(14, dressing.level === 'assistance', 280, 320);
  drawCheck(14, dressing.level === 'dependent', 360, 320);
  drawText(14, dressing.equipment, 450, 320, { maxWidth: 300 });
  drawMultiline(14, dressing.strengths, 120, 280, 300);
  drawMultiline(14, dressing.assistance, 450, 280, 300);

  // Hygiene (page 15)
  const hygiene = adls.hygiene;
  drawCheck(14, hygiene.level === 'independent', 120, 200);
  drawCheck(14, hygiene.level === 'supervision', 200, 200);
  drawCheck(14, hygiene.level === 'assistance', 280, 200);
  drawCheck(14, hygiene.level === 'dependent', 360, 200);

  // Bathing (page 16)
  const bathing = adls.bathing;
  drawCheck(15, bathing.level === 'independent', 120, 520);
  drawCheck(15, bathing.level === 'supervision', 200, 520);
  drawCheck(15, bathing.level === 'assistance', 280, 520);
  drawCheck(15, bathing.level === 'dependent', 360, 520);
  drawText(15, bathing.frequency, 450, 520, { maxWidth: 150 });
  drawText(15, bathing.equipment, 620, 520, { maxWidth: 150 });
  drawMultiline(15, bathing.strengths, 120, 480, 300);
  drawMultiline(15, bathing.assistance, 450, 480, 300);

  // ============================================
  // PAGE 17-18 (index 16-17) - IADLs
  // ============================================

  const iadls = formData.iadls;

  // Finances
  const fin = iadls.finances;
  drawCheck(16, fin.level === 'independent', 120, 520);
  drawCheck(16, fin.level === 'assistance', 200, 520);
  drawCheck(16, fin.level === 'dependent', 280, 520);
  drawText(16, fin.whoManagesFinances, 380, 520, { maxWidth: 200 });
  drawText(16, fin.whoManagesRecords, 600, 520, { maxWidth: 170 });
  drawText(16, fin.payeeName, 120, 480, { maxWidth: 200 });
  drawText(16, fin.payeeContact, 350, 480, { maxWidth: 200 });
  drawMultiline(16, fin.strengths, 120, 440, 300);
  drawMultiline(16, fin.assistance, 450, 440, 300);

  // Shopping
  const shop = iadls.shopping;
  drawCheck(16, shop.level === 'independent', 120, 360);
  drawCheck(16, shop.level === 'assistance', 200, 360);
  drawCheck(16, shop.level === 'dependent', 280, 360);
  drawText(16, shop.transportNeeds, 380, 360, { maxWidth: 200 });
  drawText(16, shop.frequency, 600, 360, { maxWidth: 170 });

  // Transportation
  const trans = iadls.transportation;
  drawCheck(16, trans.level === 'independent', 120, 300);
  drawCheck(16, trans.level === 'assistance', 200, 300);
  drawCheck(16, trans.level === 'dependent', 280, 300);
  drawText(16, trans.medicalTransportNeeds, 380, 300, { maxWidth: 200 });
  drawCheck(16, trans.escortRequired, 600, 300);

  // Activities/Social (page 17)
  const activities = iadls.activities;
  drawCheck(17, activities.level === 'independent', 120, 520);
  drawCheck(17, activities.level === 'assistance', 200, 520);
  drawCheck(17, activities.level === 'dependent', 280, 520);
  drawMultiline(17, activities.interests, 380, 520, 380);
  drawMultiline(17, activities.socialCulturalPreferences, 120, 460, 650);
  drawMultiline(17, activities.familyFriendsRelationships, 120, 400, 650);

  // Activity preferences checkboxes
  const prefs = iadls.activityPreferences;
  drawCheck(17, prefs.reading, 120, 340);
  drawCheck(17, prefs.audioBooks, 200, 340);
  drawCheck(17, prefs.storytelling, 300, 340);
  drawCheck(17, prefs.phoneConversations, 420, 340);
  drawCheck(17, prefs.reminiscing, 560, 340);
  drawCheck(17, prefs.currentEvents, 680, 340);

  drawCheck(17, prefs.discussionGroup, 120, 310);
  drawCheck(17, prefs.bibleStudyChurch, 240, 310);
  drawCheck(17, prefs.visitors, 380, 310);
  drawCheck(17, prefs.gardening, 480, 310);
  drawCheck(17, prefs.outingsWithFamily, 580, 310);
  drawCheck(17, prefs.visitingZoosParks, 720, 310);

  drawCheck(17, prefs.petsAnimals, 120, 280);
  drawCheck(17, prefs.exercisesROM, 240, 280);
  drawCheck(17, prefs.therapeuticWalking, 380, 280);
  drawCheck(17, prefs.cookingBaking, 540, 280);
  drawCheck(17, prefs.houseChores, 660, 280);

  drawCheck(17, prefs.watchingTVMovies, 120, 250);
  drawCheck(17, prefs.partiesGatherings, 280, 250);
  drawCheck(17, prefs.artsCrafts, 440, 250);
  drawCheck(17, prefs.tableGamesBingoCardsPuzzles, 560, 250);

  drawCheck(17, prefs.beautyTime, 120, 220);
  drawCheck(17, prefs.musicSinging, 240, 220);
  drawCheck(17, prefs.employmentSupportActivity, 380, 220);
  drawCheck(17, prefs.communityIntegration, 560, 220);
  drawCheck(17, prefs.other, 720, 220);

  if (prefs.other) {
    drawText(17, iadls.activityPreferencesOther, 120, 190, { maxWidth: 650 });
  }

  drawMultiline(17, iadls.activityNarrative, 120, 150, 650);

  // ============================================
  // PAGE 19 (index 18) - Case Management & Smoking
  // ============================================

  // Smoking
  const smoking = iadls.smoking;
  drawCheck(18, smoking.residentSmokes, 120, 520);
  drawMultiline(18, smoking.safetyConcerns, 200, 520, 550);
  drawCheck(18, smoking.policyReviewed, 120, 460);
  drawText(18, smoking.cigaretteLighterStorage, 280, 460, { maxWidth: 300 });

  // Case Management
  const cm = iadls.caseManagement;
  drawCheck(18, cm.receivesCaseManagement, 120, 400);
  drawText(18, cm.caseManagerName, 280, 400, { maxWidth: 200 });
  drawText(18, cm.caseManagerAgency, 500, 400, { maxWidth: 200 });
  drawText(18, cm.caseManagerPhone, 120, 360, { maxWidth: 150 });
  drawText(18, cm.caseManagerEmail, 300, 360, { maxWidth: 200 });
  drawText(18, cm.caseManagerFax, 530, 360, { maxWidth: 150 });

  // Other issues
  drawMultiline(18, iadls.otherIssuesConcerns, 120, 300, 650);

  // ============================================
  // PAGE 20 (index 19) - Signatures
  // ============================================

  const sigs = formData.signatures;

  // NCP Development participants
  const involved = sigs.involved;
  drawCheck(19, involved.resident, 120, 520);
  drawCheck(19, involved.residentRep, 220, 520);
  drawCheck(19, involved.parent, 340, 520);
  drawCheck(19, involved.healthProfessional, 440, 520);

  drawCheck(19, involved.other1, 120, 490);
  drawText(19, involved.other1Name, 170, 490, { maxWidth: 150 });
  drawCheck(19, involved.other2, 350, 490);
  drawText(19, involved.other2Name, 400, 490, { maxWidth: 150 });
  drawCheck(19, involved.other3, 580, 490);
  drawText(19, involved.other3Name, 630, 490, { maxWidth: 140 });

  // Dates
  drawText(19, formatDate(sigs.dateOfOriginalPlan), 120, 440, { maxWidth: 100 });
  drawText(19, sigs.reviewDates, 280, 440, { maxWidth: 300 });

  // NCP sent to CM
  drawCheck(19, sigs.ncpSentToCM, 120, 400);
  drawText(19, formatDate(sigs.ncpSentToCMDate), 200, 400, { maxWidth: 100 });

  // Resident verbally agreed
  drawCheck(19, sigs.residentVerballyAgreed, 350, 400);
  drawText(19, formatDate(sigs.residentVerballyAgreedDate), 450, 400, { maxWidth: 100 });

  // Resident recommendations
  drawMultiline(19, sigs.residentRecommendations, 120, 340, 650);

  // Resident participation
  drawMultiline(19, sigs.residentParticipation, 120, 260, 650);

  return await pdfDoc.save();
}

/**
 * Download the filled NCP PDF
 */
export function downloadNCPPdf(pdfBytes: Uint8Array, residentName: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = residentName?.replace(/[^a-zA-Z0-9]/g, '-') || 'Resident';
  link.download = `NCP-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open NCP PDF in new tab for printing
 */
export function openNCPPdfForPrint(pdfBytes: Uint8Array) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
