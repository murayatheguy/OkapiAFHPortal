import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { AbuseNeglect10403Data } from './abuse-neglect-10403-types';

export async function fillAbuseNeglect10403PDF(formData: AbuseNeglect10403Data): Promise<Uint8Array> {
  const templateUrl = '/forms/templates/10-403 abuse and neglect.pdf';
  const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.getPages()[0];
  const fontSize = 10;
  const smallFontSize = 9;

  const drawText = (text: string | undefined, x: number, y: number, options?: { size?: number; bold?: boolean; maxWidth?: number }) => {
    if (!text) return;
    page.drawText(text, {
      x, y,
      size: options?.size || fontSize,
      font: options?.bold ? helveticaBold : helvetica,
      color: rgb(0, 0, 0),
      maxWidth: options?.maxWidth,
    });
  };

  const drawCheckbox = (checked: boolean, x: number, y: number) => {
    if (checked) {
      page.drawText('X', { x: x + 2, y: y - 2, size: 11, font: helveticaBold, color: rgb(0, 0, 0) });
    }
  };

  const drawMultilineText = (text: string | undefined, x: number, y: number, maxWidth: number, lineHeight: number = 12) => {
    if (!text) return;
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

  // Facility Info
  drawText(formData.facilityInfo.facilityName, 150, 730);
  drawText(formData.facilityInfo.licenseNumber, 450, 730);
  drawText(formatDate(formData.facilityInfo.date), 500, 760);
  drawText(formData.facilityInfo.address, 150, 705);
  drawText(formData.facilityInfo.phone, 450, 705);

  // Resident Info
  drawText(formData.residentInfo.residentName, 150, 660);
  drawText(formatDate(formData.residentInfo.dateOfBirth), 400, 660);
  drawText(formData.residentInfo.roomNumber, 520, 660);

  // Incident Info
  drawText(formatDate(formData.incidentInfo.incidentDate), 150, 615);
  drawText(formData.incidentInfo.incidentTime, 350, 615);

  // Incident type checkboxes
  drawCheckbox(formData.incidentInfo.incidentType === 'abuse', 50, 580);
  drawCheckbox(formData.incidentInfo.incidentType === 'neglect', 150, 580);
  drawCheckbox(formData.incidentInfo.incidentType === 'exploitation', 250, 580);
  drawCheckbox(formData.incidentInfo.incidentType === 'abandonment', 380, 580);

  drawMultilineText(formData.incidentInfo.description, 50, 520, 500);
  drawMultilineText(formData.incidentInfo.actionsTaken, 50, 380, 500);
  drawText(formData.incidentInfo.reportedTo, 150, 280);
  drawText(formatDate(formData.incidentInfo.reportedDate), 400, 280);

  // Signatures
  drawText(formData.signatures.reporterPrintedName, 150, 150);
  drawText(formData.signatures.reporterTitle, 400, 150);
  drawText(formatDate(formData.signatures.reporterDate), 500, 100);

  return await pdfDoc.save();
}

export function downloadAbuseNeglect10403PDF(pdfBytes: Uint8Array, residentName: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = residentName.replace(/[^a-zA-Z0-9]/g, '-') || 'Resident';
  link.download = `Abuse-Neglect-10403-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openAbuseNeglect10403PDFForPrint(pdfBytes: Uint8Array) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
