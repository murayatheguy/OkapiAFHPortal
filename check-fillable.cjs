const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function checkPDFs() {
  const templatesDir = './client/public/forms/templates';
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.pdf'));

  console.log('\n📋 PDF FORM ANALYSIS\n');
  console.log('='.repeat(60));

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      if (fields.length > 0) {
        console.log(`\n✅ FILLABLE: ${file}`);
        console.log(`   ${fields.length} form fields found`);
        console.log(`   First 5 fields: ${fields.slice(0, 5).map(f => f.getName()).join(', ')}`);
      } else {
        console.log(`\n📄 REGULAR: ${file} (no form fields - will use coordinates)`);
      }
    } catch (e) {
      console.log(`\n📄 REGULAR: ${file} (no form fields - will use coordinates)`);
    }

    console.log(`   Pages: ${pdfDoc.getPageCount()}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Done!\n');
}

checkPDFs().catch(console.error);
