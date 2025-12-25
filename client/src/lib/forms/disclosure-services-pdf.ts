import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { DisclosureServicesFormData } from './disclosure-services-types';

/**
 * Disclosure of Services PDF Filler
 * 4 pages, Letter size (612 x 792 points)
 */

export async function fillDisclosureServicesPDF(
  formData: DisclosureServicesFormData
): Promise<Uint8Array> {
  const templateUrl = '/forms/templates/Disclosure of Services.pdf';
  const templateBytes = await fetch(templateUrl).then((res) => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const fontSize = 10;
  const smallFontSize = 9;
  const textColor = rgb(0, 0, 0);

  // Helper to draw text at coordinates
  const drawText = (
    pageIndex: number,
    text: string | undefined,
    x: number,
    y: number,
    options?: { size?: number; bold?: boolean; maxWidth?: number }
  ) => {
    if (!text || !pages[pageIndex]) return;
    const page = pages[pageIndex];
    const size = options?.size || fontSize;
    const font = options?.bold ? helveticaBold : helvetica;

    let displayText = text;
    if (options?.maxWidth) {
      const textWidth = font.widthOfTextAtSize(text, size);
      if (textWidth > options.maxWidth) {
        while (
          font.widthOfTextAtSize(displayText + '...', size) > options.maxWidth &&
          displayText.length > 0
        ) {
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

  // Helper to draw a checkmark
  const drawCheckbox = (pageIndex: number, checked: boolean | undefined, x: number, y: number) => {
    if (!checked || !pages[pageIndex]) return;
    pages[pageIndex].drawText('X', {
      x: x + 2,
      y: y - 2,
      size: 11,
      font: helveticaBold,
      color: textColor,
    });
  };

  // Helper to draw multiline text
  const drawMultilineText = (
    pageIndex: number,
    text: string | undefined,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number = 12
  ) => {
    if (!text || !pages[pageIndex]) return;
    const page = pages[pageIndex];
    const words = text.split(' ');
    let currentLine = '';
    let currentY = y;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = helvetica.widthOfTextAtSize(testLine, smallFontSize);

      if (textWidth > maxWidth && currentLine) {
        page.drawText(currentLine, {
          x,
          y: currentY,
          size: smallFontSize,
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
        size: smallFontSize,
        font: helvetica,
        color: textColor,
      });
    }
  };

  // Format date for display
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // ============================================
  // PAGE 1 (index 0) - Facility Info
  // ============================================

  // Facility Name
  drawText(0, formData.facilityInfo.facilityName, 150, 710, { maxWidth: 250 });

  // License Number
  drawText(0, formData.facilityInfo.licenseNumber, 480, 710, { maxWidth: 100 });

  // Address
  drawText(0, formData.facilityInfo.address, 150, 685, { maxWidth: 350 });

  // City, State, Zip
  const cityStateZip = [
    formData.facilityInfo.city,
    formData.facilityInfo.state,
    formData.facilityInfo.zipCode,
  ]
    .filter(Boolean)
    .join(', ');
  drawText(0, cityStateZip, 150, 660, { maxWidth: 250 });

  // Phone
  drawText(0, formData.facilityInfo.phone, 450, 660, { maxWidth: 120 });

  // Email
  drawText(0, formData.facilityInfo.email, 150, 635, { maxWidth: 300 });

  // Date
  drawText(0, formatDate(formData.facilityInfo.date), 520, 735, { maxWidth: 80 });

  // Services Overview Description
  drawMultilineText(0, formData.servicesOverview.description, 80, 550, 450);

  // Hours of Operation
  drawText(0, formData.servicesOverview.hoursOfOperation, 200, 450, { maxWidth: 250 });

  // Capacity Licensed
  drawText(0, formData.servicesOverview.capacityLicensed, 200, 420, { maxWidth: 100 });

  // Caregiver to Resident Ratio
  drawText(0, formData.servicesOverview.caregiverToResidentRatio, 280, 390, { maxWidth: 150 });

  // ============================================
  // PAGE 2 (index 1) - Services Provided
  // ============================================

  // Personal Care
  drawCheckbox(1, formData.servicesProvided.personalCare, 72, 710);
  drawText(1, formData.servicesProvided.personalCareDetails, 200, 710, {
    size: smallFontSize,
    maxWidth: 380,
  });

  // Medication Management
  drawCheckbox(1, formData.servicesProvided.medicationManagement, 72, 650);
  drawText(1, formData.servicesProvided.medicationDetails, 200, 650, {
    size: smallFontSize,
    maxWidth: 380,
  });

  // Meal Services
  drawCheckbox(1, formData.servicesProvided.mealServices, 72, 590);
  drawText(1, formData.servicesProvided.mealDetails, 200, 590, {
    size: smallFontSize,
    maxWidth: 380,
  });

  // Laundry
  drawCheckbox(1, formData.servicesProvided.laundry, 72, 530);
  drawText(1, formData.servicesProvided.laundryDetails, 200, 530, {
    size: smallFontSize,
    maxWidth: 380,
  });

  // Housekeeping
  drawCheckbox(1, formData.servicesProvided.housekeeping, 72, 470);
  drawText(1, formData.servicesProvided.housekeepingDetails, 200, 470, {
    size: smallFontSize,
    maxWidth: 380,
  });

  // Transportation
  drawCheckbox(1, formData.servicesProvided.transportation, 72, 410);
  drawText(1, formData.servicesProvided.transportationDetails, 200, 410, {
    size: smallFontSize,
    maxWidth: 380,
  });

  // Activities
  drawCheckbox(1, formData.servicesProvided.activities, 72, 350);
  drawText(1, formData.servicesProvided.activitiesDetails, 200, 350, {
    size: smallFontSize,
    maxWidth: 380,
  });

  // Supervision
  drawCheckbox(1, formData.servicesProvided.supervision, 72, 290);
  drawText(1, formData.servicesProvided.supervisionDetails, 200, 290, {
    size: smallFontSize,
    maxWidth: 380,
  });

  // ============================================
  // PAGE 3 (index 2) - Additional Services & Fees
  // ============================================

  // Additional Services Description
  drawMultilineText(2, formData.additionalServices.services, 80, 700, 450);

  // Fees
  drawMultilineText(2, formData.additionalServices.fees, 80, 580, 450);

  // Special Diets
  drawCheckbox(2, formData.additionalServices.specialDiets, 72, 480);
  drawText(2, formData.additionalServices.specialDietsDetails, 200, 480, {
    size: smallFontSize,
    maxWidth: 380,
  });

  // Incontinence Care
  drawCheckbox(2, formData.additionalServices.incontinenceCare, 72, 420);
  drawText(2, formData.additionalServices.incontinenceCareDetails, 200, 420, {
    size: smallFontSize,
    maxWidth: 380,
  });

  // Behavior Support
  drawCheckbox(2, formData.additionalServices.behaviorSupport, 72, 360);
  drawText(2, formData.additionalServices.behaviorSupportDetails, 200, 360, {
    size: smallFontSize,
    maxWidth: 380,
  });

  // Nursing Services
  drawCheckbox(2, formData.additionalServices.nursingServices, 72, 300);
  drawText(2, formData.additionalServices.nursingServicesDetails, 200, 300, {
    size: smallFontSize,
    maxWidth: 380,
  });

  // ============================================
  // PAGE 4 (index 3) - Signatures
  // ============================================

  // Resident Signature Section
  drawText(3, formData.signatures.residentPrintedName, 100, 600, { maxWidth: 200 });
  drawText(3, formatDate(formData.signatures.residentDate), 400, 600, { maxWidth: 100 });

  // Responsible Party Signature Section
  drawText(3, formData.signatures.responsiblePartyPrintedName, 100, 480, { maxWidth: 200 });
  drawText(3, formatDate(formData.signatures.responsiblePartyDate), 400, 480, { maxWidth: 100 });

  // Provider Signature Section
  drawText(3, formData.signatures.providerPrintedName, 100, 360, { maxWidth: 200 });
  drawText(3, formatDate(formData.signatures.providerDate), 400, 360, { maxWidth: 100 });

  return await pdfDoc.save();
}

export function downloadDisclosureServicesPDF(pdfBytes: Uint8Array, facilityName: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = facilityName.replace(/[^a-zA-Z0-9]/g, '-') || 'Facility';
  link.download = `Disclosure-of-Services-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openDisclosureServicesPDFForPrint(pdfBytes: Uint8Array) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
