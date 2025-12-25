import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Disclosure of Charges (DSHS 15-449) PDF Filler
 * Uses coordinate-based text placement on the official PDF template
 * PDF is 5 pages, Letter size (612 x 792 points)
 */

export interface DisclosureFormData {
  homeInfo: {
    homeName: string;
    licenseNumber: string;
    date: string;
  };
  medicaid: {
    isPrivatePay: boolean;
    acceptsMedicaid: boolean;
    medicaidConditions: string;
    additionalComments: string;
  };
  admissionFee: {
    amount: string;
    comments: string;
  };
  deposits: {
    items: Array<{ purpose: string; amount: string }>;
    comments: string;
  };
  prepaidCharges: {
    items: Array<{ purpose: string; amount: string }>;
    comments: string;
  };
  otherFees: {
    items: Array<{ purpose: string; amount: string }>;
    comments: string;
    minimumStayFees: string;
  };
  refundPolicy: {
    deathPolicy: string;
    hospitalizationPolicy: string;
    transferPolicy: string;
    dischargePolicy: string;
    retainedAmount: string;
    additionalTerms: string;
  };
  rates: {
    chargesMonthly: boolean;
    chargesDaily: boolean;
    monthlyLow: string;
    monthlyHigh: string;
    dailyLow: string;
    dailyHigh: string;
    rateComments: string;
  };
  personalCare: {
    eating: { includedInRate: boolean; low: string; high: string };
    toileting: { includedInRate: boolean; low: string; high: string };
    transferring: { includedInRate: boolean; low: string; high: string };
    personalHygiene: { includedInRate: boolean; low: string; high: string };
    dressing: { includedInRate: boolean; low: string; high: string };
    bathing: { includedInRate: boolean; low: string; high: string };
    behaviors: { includedInRate: boolean; low: string; high: string };
  };
  medicationServices: {
    medicationServices: { includedInRate: boolean; low: string; high: string };
    nurseDelegation: { includedInRate: boolean; low: string; high: string };
    assessments: { includedInRate: boolean; low: string; high: string };
  };
  otherServices: {
    services: string;
    items: string;
    activities: string;
    otherCharges: string;
  };
  signatures: {
    residentAcknowledged: boolean;
    residentSignature: string;
    residentDate: string;
    residentPrintedName: string;
    providerSignature: string;
    providerDate: string;
    providerPrintedName: string;
  };
}

/**
 * Fill the DSHS 15-449 Disclosure of Charges PDF with form data
 */
export async function fillDisclosurePDF(
  formData: DisclosureFormData
): Promise<Uint8Array> {
  // Load the template
  const templateUrl = '/forms/templates/15-449 Disclosure of charges.pdf';
  const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);

  // Embed fonts
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
    options?: { size?: number; font?: typeof helvetica; maxWidth?: number }
  ) => {
    if (!text) return;
    const page = pages[pageIndex];
    const size = options?.size || fontSize;
    const font = options?.font || helvetica;

    // Handle text that might be too long
    let displayText = text;
    if (options?.maxWidth) {
      const textWidth = font.widthOfTextAtSize(text, size);
      if (textWidth > options.maxWidth) {
        // Truncate with ellipsis
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

  // Helper to draw a checkmark
  const drawCheck = (pageIndex: number, x: number, y: number, checked: boolean) => {
    if (!checked) return;
    const page = pages[pageIndex];
    page.drawText('X', {
      x: x + 2,
      y: y - 2,
      size: 12,
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
    if (!text) return;
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
        year: 'numeric'
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
  // PAGE 1: Home Info, Medicaid, Admission Fee
  // ============================================

  // Home/Provider Name (top of form)
  drawText(0, formData.homeInfo.homeName, 180, 715, { maxWidth: 300 });

  // License Number
  drawText(0, formData.homeInfo.licenseNumber, 480, 715, { maxWidth: 100 });

  // Date
  drawText(0, formatDate(formData.homeInfo.date), 520, 695, { maxWidth: 80 });

  // Medicaid Section (around y=620)
  // Private Pay checkbox
  drawCheck(0, 72, 595, formData.medicaid.isPrivatePay);

  // Accepts Medicaid checkbox
  drawCheck(0, 72, 560, formData.medicaid.acceptsMedicaid);

  // Medicaid conditions text
  if (formData.medicaid.acceptsMedicaid && formData.medicaid.medicaidConditions) {
    drawMultilineText(0, formData.medicaid.medicaidConditions, 90, 530, 480);
  }

  // Additional Medicaid comments
  if (formData.medicaid.additionalComments) {
    drawMultilineText(0, formData.medicaid.additionalComments, 90, 480, 480);
  }

  // Admission Fee Section (around y=400)
  drawText(0, formatCurrency(formData.admissionFee.amount), 200, 380, { maxWidth: 100 });

  if (formData.admissionFee.comments) {
    drawMultilineText(0, formData.admissionFee.comments, 90, 350, 480);
  }

  // Deposits Section (around y=280)
  let depositY = 260;
  formData.deposits.items.forEach((item, index) => {
    if (index < 4) { // Limit to 4 rows
      drawText(0, item.purpose, 90, depositY, { maxWidth: 300 });
      drawText(0, formatCurrency(item.amount), 450, depositY, { maxWidth: 100 });
      depositY -= 18;
    }
  });

  if (formData.deposits.comments) {
    drawMultilineText(0, formData.deposits.comments, 90, 180, 480);
  }

  // Prepaid Charges Section (around y=130)
  let prepaidY = 120;
  formData.prepaidCharges.items.forEach((item, index) => {
    if (index < 3) { // Limit to 3 rows
      drawText(0, item.purpose, 90, prepaidY, { maxWidth: 300 });
      drawText(0, formatCurrency(item.amount), 450, prepaidY, { maxWidth: 100 });
      prepaidY -= 18;
    }
  });

  // ============================================
  // PAGE 2: Other Fees, Refund Policy
  // ============================================

  // Other Fees Section
  let otherFeesY = 720;
  formData.otherFees.items.forEach((item, index) => {
    if (index < 5) { // Limit to 5 rows
      drawText(1, item.purpose, 90, otherFeesY, { maxWidth: 300 });
      drawText(1, formatCurrency(item.amount), 450, otherFeesY, { maxWidth: 100 });
      otherFeesY -= 18;
    }
  });

  if (formData.otherFees.comments) {
    drawMultilineText(1, formData.otherFees.comments, 90, 600, 480);
  }

  if (formData.otherFees.minimumStayFees) {
    drawMultilineText(1, formData.otherFees.minimumStayFees, 90, 550, 480);
  }

  // Refund Policy Section
  // Death policy
  drawMultilineText(1, formData.refundPolicy.deathPolicy, 90, 480, 480);

  // Hospitalization policy
  drawMultilineText(1, formData.refundPolicy.hospitalizationPolicy, 90, 420, 480);

  // Transfer policy
  drawMultilineText(1, formData.refundPolicy.transferPolicy, 90, 360, 480);

  // Discharge policy
  drawMultilineText(1, formData.refundPolicy.dischargePolicy, 90, 300, 480);

  // Retained amount
  drawText(1, formatCurrency(formData.refundPolicy.retainedAmount), 200, 240, { maxWidth: 100 });

  // Additional terms
  if (formData.refundPolicy.additionalTerms) {
    drawMultilineText(1, formData.refundPolicy.additionalTerms, 90, 200, 480);
  }

  // ============================================
  // PAGE 3: Daily/Monthly Rates, Personal Care
  // ============================================

  // Rate type checkboxes
  drawCheck(2, 72, 720, formData.rates.chargesMonthly);
  drawCheck(2, 200, 720, formData.rates.chargesDaily);

  // Monthly rates
  if (formData.rates.chargesMonthly) {
    drawText(2, formatCurrency(formData.rates.monthlyLow), 150, 690, { maxWidth: 80 });
    drawText(2, formatCurrency(formData.rates.monthlyHigh), 280, 690, { maxWidth: 80 });
  }

  // Daily rates
  if (formData.rates.chargesDaily) {
    drawText(2, formatCurrency(formData.rates.dailyLow), 400, 690, { maxWidth: 80 });
    drawText(2, formatCurrency(formData.rates.dailyHigh), 500, 690, { maxWidth: 80 });
  }

  // Rate comments
  if (formData.rates.rateComments) {
    drawMultilineText(2, formData.rates.rateComments, 90, 640, 480);
  }

  // Personal Care Services (table format)
  const personalCareServices = [
    { key: 'eating', y: 550 },
    { key: 'toileting', y: 520 },
    { key: 'transferring', y: 490 },
    { key: 'personalHygiene', y: 460 },
    { key: 'dressing', y: 430 },
    { key: 'bathing', y: 400 },
    { key: 'behaviors', y: 370 },
  ] as const;

  personalCareServices.forEach(({ key, y }) => {
    const service = formData.personalCare[key];
    // Included checkbox
    drawCheck(2, 300, y, service.includedInRate);
    // Low/High amounts if not included
    if (!service.includedInRate) {
      drawText(2, formatCurrency(service.low), 380, y, { maxWidth: 80 });
      drawText(2, formatCurrency(service.high), 480, y, { maxWidth: 80 });
    }
  });

  // ============================================
  // PAGE 4: Medication Services, Other Services
  // ============================================

  // Medication Services
  const medServices = [
    { key: 'medicationServices', y: 700 },
    { key: 'nurseDelegation', y: 660 },
    { key: 'assessments', y: 620 },
  ] as const;

  medServices.forEach(({ key, y }) => {
    const service = formData.medicationServices[key];
    // Included checkbox
    drawCheck(3, 300, y, service.includedInRate);
    // Low/High amounts if not included
    if (!service.includedInRate) {
      drawText(3, formatCurrency(service.low), 380, y, { maxWidth: 80 });
      drawText(3, formatCurrency(service.high), 480, y, { maxWidth: 80 });
    }
  });

  // Other Services
  drawMultilineText(3, formData.otherServices.services, 90, 520, 480);

  // Items
  drawMultilineText(3, formData.otherServices.items, 90, 420, 480);

  // Activities
  drawMultilineText(3, formData.otherServices.activities, 90, 320, 480);

  // Other charges
  drawMultilineText(3, formData.otherServices.otherCharges, 90, 220, 480);

  // ============================================
  // PAGE 5: Signatures
  // ============================================

  // Resident acknowledgement checkbox
  drawCheck(4, 72, 650, formData.signatures.residentAcknowledged);

  // Resident signature section
  drawText(4, formData.signatures.residentSignature, 90, 550, { maxWidth: 200 });
  drawText(4, formatDate(formData.signatures.residentDate), 350, 550, { maxWidth: 100 });
  drawText(4, formData.signatures.residentPrintedName, 90, 510, { maxWidth: 200 });

  // Provider signature section
  drawText(4, formData.signatures.providerSignature, 90, 400, { maxWidth: 200 });
  drawText(4, formatDate(formData.signatures.providerDate), 350, 400, { maxWidth: 100 });
  drawText(4, formData.signatures.providerPrintedName, 90, 360, { maxWidth: 200 });

  return await pdfDoc.save();
}

/**
 * Download the filled PDF
 */
export function downloadDisclosurePDF(pdfBytes: Uint8Array, homeName: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = homeName.replace(/[^a-zA-Z0-9]/g, '-') || 'Disclosure';
  link.download = `Disclosure-of-Charges-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open PDF in new tab for printing
 */
export function openDisclosurePDFForPrint(pdfBytes: Uint8Array) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
