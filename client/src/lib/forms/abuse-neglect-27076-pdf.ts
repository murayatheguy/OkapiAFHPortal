import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { AbuseNeglect27076Data } from './abuse-neglect-27076-types';

export async function fillAbuseNeglect27076PDF(formData: AbuseNeglect27076Data): Promise<Uint8Array> {
  const templateUrl = '/forms/templates/27-076 abuse and neglect.pdf';
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
  drawText(formData.facilityInfo.phone, 150, 705);

  // Victim Info
  drawText(formData.victimInfo.victimName, 150, 660);
  drawText(formatDate(formData.victimInfo.dateOfBirth), 400, 660);
  drawText(formData.victimInfo.address, 150, 635);

  // Allegation Info
  drawText(formatDate(formData.allegationInfo.allegationDate), 150, 590);

  // Allegation type checkboxes
  drawCheckbox(formData.allegationInfo.allegationType === 'physical', 50, 555);
  drawCheckbox(formData.allegationInfo.allegationType === 'sexual', 150, 555);
  drawCheckbox(formData.allegationInfo.allegationType === 'emotional', 250, 555);
  drawCheckbox(formData.allegationInfo.allegationType === 'neglect', 350, 555);
  drawCheckbox(formData.allegationInfo.allegationType === 'financial', 450, 555);

  drawMultilineText(formData.allegationInfo.description, 50, 480, 500);
  drawMultilineText(formData.allegationInfo.witnessInfo, 50, 350, 500);

  // Reporter Info
  drawText(formData.reporterInfo.reporterName, 150, 250);
  drawText(formData.reporterInfo.reporterTitle, 400, 250);
  drawText(formData.reporterInfo.reporterPhone, 150, 220);
  drawText(formData.reporterInfo.relationship, 400, 220);

  // Signature
  drawText(formatDate(formData.signatures.reporterDate), 400, 100);

  return await pdfDoc.save();
}

export function downloadAbuseNeglect27076PDF(pdfBytes: Uint8Array, victimName: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = victimName.replace(/[^a-zA-Z0-9]/g, '-') || 'Victim';
  link.download = `Abuse-Neglect-27076-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openAbuseNeglect27076PDFForPrint(pdfBytes: Uint8Array) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
