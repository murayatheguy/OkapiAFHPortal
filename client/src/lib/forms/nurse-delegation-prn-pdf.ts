import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { NurseDelegationPRNData } from './nurse-delegation-prn-types';

export async function fillNurseDelegationPRNPDF(formData: NurseDelegationPRNData): Promise<Uint8Array> {
  const templateUrl = '/forms/templates/13-678a Nurse delegation PRN.pdf';
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

  // PAGE 1 - Client & Nurse Info
  drawText(0, formData.clientInfo.clientName, 150, 700);
  drawText(0, formatDate(formData.clientInfo.dateOfBirth), 450, 700);
  drawText(0, formData.clientInfo.providerOneId, 150, 670);

  drawText(0, formData.nurseInfo.nurseName, 150, 620);
  drawText(0, formData.nurseInfo.nurseCredentials, 400, 620);
  drawText(0, formData.nurseInfo.nursePhone, 150, 590);
  drawText(0, formatDate(formData.nurseInfo.delegationDate), 400, 590);

  // PRN Medication details
  drawText(0, formData.prnMedication.medicationName, 150, 520);
  drawText(0, formData.prnMedication.dosage, 400, 520);
  drawText(0, formData.prnMedication.route, 150, 490);
  drawText(0, formData.prnMedication.frequency, 400, 490);
  drawMultilineText(0, formData.prnMedication.indication, 50, 430, 500);
  drawMultilineText(0, formData.prnMedication.parameters, 50, 350, 500);
  drawMultilineText(0, formData.prnMedication.precautions, 50, 270, 500);

  // PAGE 2 - Caregiver Training & Signatures
  drawText(1, formData.caregiverTraining.caregiverName, 150, 700);
  drawText(1, formatDate(formData.caregiverTraining.trainingDate), 400, 700);
  drawCheckbox(1, formData.caregiverTraining.competencyVerified, 50, 650);

  // Signatures
  drawText(1, formatDate(formData.signatures.nurseDate), 400, 300);
  drawText(1, formatDate(formData.signatures.caregiverDate), 400, 200);

  return await pdfDoc.save();
}

export function downloadNurseDelegationPRNPDF(pdfBytes: Uint8Array, clientName: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '-') || 'Client';
  link.download = `Nurse-Delegation-PRN-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openNurseDelegationPRNPDFForPrint(pdfBytes: Uint8Array) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
