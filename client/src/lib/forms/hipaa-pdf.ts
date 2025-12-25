import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { HIPAAFormData } from './hipaa-types';

export async function fillHIPAAPDF(formData: HIPAAFormData): Promise<Uint8Array> {
  const templateUrl = '/forms/templates/03-387a HIPAA.pdf';
  const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const fontSize = 10;
  const smallFontSize = 9;

  const drawText = (pageIndex: number, text: string | undefined, x: number, y: number, options?: { size?: number; bold?: boolean; maxWidth?: number }) => {
    if (!text || !pages[pageIndex]) return;
    pages[pageIndex].drawText(text, {
      x, y,
      size: options?.size || fontSize,
      font: options?.bold ? helveticaBold : helvetica,
      color: rgb(0, 0, 0),
      maxWidth: options?.maxWidth,
    });
  };

  const drawCheckbox = (pageIndex: number, checked: boolean | undefined, x: number, y: number) => {
    if (!checked || !pages[pageIndex]) return;
    pages[pageIndex].drawText('X', { x: x + 2, y: y - 2, size: 11, font: helveticaBold, color: rgb(0, 0, 0) });
  };

  const drawMultilineText = (pageIndex: number, text: string | undefined, x: number, y: number, maxWidth: number, lineHeight: number = 12) => {
    if (!text || !pages[pageIndex]) return;
    const page = pages[pageIndex];
    const words = text.split(' ');
    let currentLine = '';
    let currentY = y;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = helvetica.widthOfTextAtSize(testLine, smallFontSize);

      if (textWidth > maxWidth && currentLine) {
        page.drawText(currentLine, { x, y: currentY, size: smallFontSize, font: helvetica, color: rgb(0, 0, 0) });
        currentLine = word;
        currentY -= lineHeight;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, { x, y: currentY, size: smallFontSize, font: helvetica, color: rgb(0, 0, 0) });
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // PAGE 1 - Patient Info
  drawText(0, formData.patientInfo.patientName, 150, 680);
  drawText(0, formatDate(formData.patientInfo.dateOfBirth), 450, 680);
  drawText(0, formData.patientInfo.address, 150, 650);
  drawText(0, formData.patientInfo.phone, 450, 650);
  drawText(0, formData.patientInfo.socialSecurityNumber, 150, 620);

  // PAGE 2 - Authorization Details
  drawMultilineText(1, formData.authorizationDetails.authorizedParties, 50, 700, 500);
  drawMultilineText(1, formData.authorizationDetails.purposeOfDisclosure, 50, 550, 500);

  // Information to disclose checkboxes
  const infoTypes = ['medical', 'mental', 'substance', 'hiv', 'other'];
  infoTypes.forEach((type, index) => {
    drawCheckbox(1, formData.authorizationDetails.informationToDisclose.includes(type), 50, 400 - (index * 25));
  });

  drawText(1, formData.authorizationDetails.otherInformation, 150, 300, { size: smallFontSize });

  // PAGE 3 - Restrictions
  drawCheckbox(2, formData.restrictions.hasRestrictions, 50, 700);
  drawMultilineText(2, formData.restrictions.restrictionDetails, 50, 600, 500);

  // PAGE 4 - Expiration
  drawText(3, formatDate(formData.expiration.expirationDate), 200, 650);
  drawText(3, formData.expiration.expirationEvent, 200, 600);

  // PAGE 5 - Signatures
  drawText(4, formData.signatures.patientPrintedName, 350, 500);
  drawText(4, formatDate(formData.signatures.patientDate), 200, 500);
  drawText(4, formData.signatures.witnessPrintedName, 350, 350);
  drawText(4, formatDate(formData.signatures.witnessDate), 200, 350);

  return await pdfDoc.save();
}

export function downloadHIPAAPDF(pdfBytes: Uint8Array, patientName: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = patientName.replace(/[^a-zA-Z0-9]/g, '-') || 'Patient';
  link.download = `HIPAA-Authorization-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openHIPAAPDFForPrint(pdfBytes: Uint8Array) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
