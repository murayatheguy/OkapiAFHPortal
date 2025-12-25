const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function createCoordinateGrid() {
  const pdfPath = './client/public/forms/templates/15-449 Disclosure of charges.pdf';
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  pages.forEach((page, pageIndex) => {
    const { width, height } = page.getSize();
    console.log(`Page ${pageIndex + 1}: ${width} x ${height} points`);

    // Draw coordinate grid every 50 points
    for (let x = 0; x <= width; x += 50) {
      page.drawLine({
        start: { x, y: 0 },
        end: { x, y: height },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      // Label X coordinates at bottom
      page.drawText(String(x), {
        x: x + 2,
        y: 5,
        size: 6,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    for (let y = 0; y <= height; y += 50) {
      page.drawLine({
        start: { x: 0, y },
        end: { x: width, y },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      // Label Y coordinates on left
      page.drawText(String(y), {
        x: 2,
        y: y + 2,
        size: 6,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
  });

  const outputBytes = await pdfDoc.save();
  fs.writeFileSync('./disclosure-with-grid.pdf', outputBytes);
  console.log('\n✅ Created disclosure-with-grid.pdf - open this to find coordinates for each field');
}

createCoordinateGrid().catch(console.error);
