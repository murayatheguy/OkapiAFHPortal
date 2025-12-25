import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Form02516Data } from './form-02-516-types';

export async function fillForm02516PDF(formData: Form02516Data): Promise<Uint8Array> {
  const templateUrl = '/forms/templates/02-516.pdf';
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

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Header / Facility Info
  drawText(formData.facilityInfo.facilityName, 150, 720);
  drawText(formData.facilityInfo.licenseNumber, 450, 720);
  drawText(formatDate(formData.facilityInfo.date), 500, 750);

  // Client Info
  drawText(formData.clientInfo.clientName, 150, 650);
  drawText(formatDate(formData.clientInfo.dateOfBirth), 400, 650);
  drawText(formData.clientInfo.caseNumber, 150, 620);

  // Service Info
  drawText(formData.serviceInfo.serviceType, 150, 550);
  drawText(formatDate(formData.serviceInfo.startDate), 150, 520);
  drawText(formatDate(formData.serviceInfo.endDate), 350, 520);
  drawText(formData.serviceInfo.comments, 50, 450, { size: smallFontSize, maxWidth: 500 });

  // Signatures
  drawText(formData.signatures.clientSignature, 100, 200);
  drawText(formatDate(formData.signatures.clientDate), 400, 200);
  drawText(formData.signatures.providerSignature, 100, 120);
  drawText(formatDate(formData.signatures.providerDate), 400, 120);

  return await pdfDoc.save();
}

export function downloadForm02516PDF(pdfBytes: Uint8Array, clientName: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '-') || 'Client';
  link.download = `02-516-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openForm02516PDFForPrint(pdfBytes: Uint8Array) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
