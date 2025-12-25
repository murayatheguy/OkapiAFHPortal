import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { AdmissionAgreementFormData } from './admission-agreement-types';

/**
 * DSHS 10-270 Admission Agreement PDF Filler
 * 6 pages, Letter size (612 x 792 points)
 */

export async function fillAdmissionAgreementPDF(
  formData: AdmissionAgreementFormData
): Promise<Uint8Array> {
  const templateUrl = '/forms/templates/10-270 Admission agreement.pdf';
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

  // Format currency
  const formatCurrency = (amount: string): string => {
    if (!amount) return '';
    const num = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return amount;
    return `$${num.toFixed(2)}`;
  };

  // ============================================
  // PAGE 1 (index 0) - Facility & Resident Info
  // ============================================

  // Facility Information - top of form
  drawText(0, formData.facilityInfo.facilityName, 150, 710, { maxWidth: 250 });
  drawText(0, formData.facilityInfo.licenseNumber, 480, 710, { maxWidth: 100 });
  drawText(0, formData.facilityInfo.address, 150, 685, { maxWidth: 350 });
  drawText(0, formData.facilityInfo.phone, 480, 685, { maxWidth: 100 });
  drawText(0, formatDate(formData.facilityInfo.date), 520, 735, { maxWidth: 80 });

  // Resident Information
  drawText(0, formData.residentInfo.residentName, 150, 620, { maxWidth: 200 });
  drawText(0, formatDate(formData.residentInfo.dateOfBirth), 420, 620, { maxWidth: 80 });
  drawText(0, formData.residentInfo.ssn, 520, 620, { maxWidth: 80 });
  drawText(0, formatDate(formData.residentInfo.admissionDate), 150, 595, { maxWidth: 100 });

  // Responsible Party
  drawText(0, formData.responsibleParty.name, 150, 530, { maxWidth: 200 });
  drawText(0, formData.responsibleParty.relationship, 420, 530, { maxWidth: 150 });
  drawText(0, formData.responsibleParty.address, 150, 505, { maxWidth: 350 });
  drawText(0, formData.responsibleParty.phone, 150, 480, { maxWidth: 150 });
  drawText(0, formData.responsibleParty.email, 350, 480, { maxWidth: 200 });

  // ============================================
  // PAGE 2 (index 1) - Services & Rates
  // ============================================

  // Room Type
  drawText(1, formData.services.roomType, 150, 700, { maxWidth: 200 });

  // Base Monthly Rate
  drawText(1, formatCurrency(formData.services.baseMonthlyRate), 420, 700, { maxWidth: 100 });

  // Additional Services
  drawMultilineText(1, formData.services.additionalServices, 80, 620, 450);

  // Total Monthly Rate
  drawText(1, formatCurrency(formData.services.totalMonthlyRate), 420, 480, { maxWidth: 100 });

  // Rate Effective Date
  drawText(1, formatDate(formData.services.rateEffectiveDate), 420, 450, { maxWidth: 100 });

  // ============================================
  // PAGE 3 (index 2) - Payment Terms
  // ============================================

  // Payment Due Date
  drawText(2, formData.paymentTerms.paymentDueDate, 200, 700, { maxWidth: 150 });

  // Deposit Amount
  drawText(2, formatCurrency(formData.paymentTerms.depositAmount), 200, 660, { maxWidth: 100 });

  // Deposit Purpose
  drawText(2, formData.paymentTerms.depositPurpose, 350, 660, { maxWidth: 200 });

  // Late Fee
  drawText(2, formatCurrency(formData.paymentTerms.lateFee), 200, 620, { maxWidth: 100 });

  // Grace Period
  drawText(2, formData.paymentTerms.lateFeeGracePeriod, 400, 620, { maxWidth: 100 });

  // Payment Methods
  drawText(2, formData.paymentTerms.paymentMethods, 200, 580, { maxWidth: 350 });

  // NSF Fee
  drawText(2, formatCurrency(formData.paymentTerms.nsfFee), 200, 540, { maxWidth: 100 });

  // ============================================
  // PAGE 4 (index 3) - Policies
  // ============================================

  // Discharge Policies
  drawMultilineText(3, formData.policies.dischargePolicies, 80, 700, 450);

  // Voluntary Discharge Notice
  drawText(3, formData.policies.voluntaryDischargeNotice, 200, 600, { maxWidth: 100 });

  // Involuntary Discharge Reasons
  drawMultilineText(3, formData.policies.involuntaryDischargeReasons, 80, 550, 450);

  // Refund Policy
  drawMultilineText(3, formData.policies.refundPolicy, 80, 450, 450);

  // Personal Property Policy
  drawMultilineText(3, formData.policies.personalPropertyPolicy, 80, 350, 450);

  // Valuables Policy
  drawMultilineText(3, formData.policies.valuablesPolicy, 80, 250, 450);

  // ============================================
  // PAGE 5 (index 4) - Rights & Responsibilities
  // ============================================

  // Rights Acknowledged
  drawCheckbox(4, formData.rightsAcknowledged, 72, 650);

  // Responsibilities Acknowledged
  drawCheckbox(4, formData.responsibilitiesAcknowledged, 72, 450);

  // Grievance Procedure Acknowledged
  drawCheckbox(4, formData.grievanceProcedureAcknowledged, 72, 250);

  // ============================================
  // PAGE 6 (index 5) - Signatures
  // ============================================

  // Resident Signature Section
  drawText(5, formData.signatures.residentPrintedName, 100, 620, { maxWidth: 200 });
  drawText(5, formatDate(formData.signatures.residentDate), 400, 620, { maxWidth: 100 });

  // Responsible Party Signature Section
  drawText(5, formData.signatures.responsiblePartyPrintedName, 100, 500, { maxWidth: 200 });
  drawText(5, formatDate(formData.signatures.responsiblePartyDate), 400, 500, { maxWidth: 100 });

  // Provider Signature Section
  drawText(5, formData.signatures.providerPrintedName, 100, 380, { maxWidth: 200 });
  drawText(5, formData.signatures.providerTitle, 350, 380, { maxWidth: 100 });
  drawText(5, formatDate(formData.signatures.providerDate), 480, 380, { maxWidth: 100 });

  return await pdfDoc.save();
}

export function downloadAdmissionAgreementPDF(pdfBytes: Uint8Array, residentName: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = residentName.replace(/[^a-zA-Z0-9]/g, '-') || 'Resident';
  link.download = `Admission-Agreement-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openAdmissionAgreementPDFForPrint(pdfBytes: Uint8Array) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
