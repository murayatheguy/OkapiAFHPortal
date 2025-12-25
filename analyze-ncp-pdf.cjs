const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function analyzeNCP() {
  const pdfPath = './client/public/forms/templates/AFH HCS NCP-Template 10.11.23 (1).pdf';
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  console.log('\n📋 NCP FORM STRUCTURE\n');
  console.log('Total pages:', pages.length);
  console.log('='.repeat(60));

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    console.log(`Page ${index + 1}: ${width} x ${height} points`);
  });

  // Create a version with coordinate grid for mapping
  pages.forEach((page, pageIndex) => {
    const { width, height } = page.getSize();

    // Draw light grid every 50 points
    for (let x = 0; x <= width; x += 50) {
      page.drawLine({
        start: { x, y: 0 },
        end: { x, y: height },
        thickness: 0.3,
        color: rgb(0.85, 0.85, 0.85),
      });
      page.drawText(String(x), {
        x: x + 1,
        y: 5,
        size: 5,
        font: helvetica,
        color: rgb(0.6, 0.6, 0.6),
      });
    }

    for (let y = 0; y <= height; y += 50) {
      page.drawLine({
        start: { x: 0, y },
        end: { x: width, y },
        thickness: 0.3,
        color: rgb(0.85, 0.85, 0.85),
      });
      page.drawText(String(y), {
        x: 2,
        y: y + 1,
        size: 5,
        font: helvetica,
        color: rgb(0.6, 0.6, 0.6),
      });
    }

    // Add page number label
    page.drawText(`PAGE ${pageIndex + 1}`, {
      x: width - 60,
      y: height - 15,
      size: 8,
      font: helvetica,
      color: rgb(1, 0, 0),
    });
  });

  const outputBytes = await pdfDoc.save();
  fs.writeFileSync('./ncp-with-grid.pdf', outputBytes);
  console.log('\n✅ Created ncp-with-grid.pdf - open to find field coordinates');
  console.log('Use this to map x,y positions for each form field\n');
}

analyzeNCP().catch(console.error);
