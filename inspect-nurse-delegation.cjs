const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function inspectPDF() {
  const pdfPath = './client/public/forms/templates/01-212 Nurse delegation.pdf';
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log('\n📋 NURSE DELEGATION FORM FIELDS (01-212)\n');
  console.log('Total fields:', fields.length);
  console.log('='.repeat(70));

  // Group by type
  const textFields = [];
  const checkboxes = [];
  const dropdowns = [];
  const radioGroups = [];
  const other = [];

  fields.forEach(field => {
    const name = field.getName();
    const type = field.constructor.name;

    const info = { name, type };

    switch(type) {
      case 'PDFTextField':
        textFields.push(info);
        break;
      case 'PDFCheckBox':
        checkboxes.push(info);
        break;
      case 'PDFDropdown':
        dropdowns.push(info);
        break;
      case 'PDFRadioGroup':
        radioGroups.push(info);
        break;
      default:
        other.push(info);
    }
  });

  console.log('\n📝 TEXT FIELDS (' + textFields.length + '):\n');
  textFields.forEach(f => console.log('  - ' + f.name));

  console.log('\n☑️ CHECKBOXES (' + checkboxes.length + '):\n');
  checkboxes.forEach(f => console.log('  - ' + f.name));

  console.log('\n📋 DROPDOWNS (' + dropdowns.length + '):\n');
  dropdowns.forEach(f => console.log('  - ' + f.name));

  console.log('\n🔘 RADIO GROUPS (' + radioGroups.length + '):\n');
  radioGroups.forEach(f => console.log('  - ' + f.name));

  if (other.length > 0) {
    console.log('\n❓ OTHER (' + other.length + '):\n');
    other.forEach(f => console.log('  - ' + f.name + ' (' + f.type + ')'));
  }

  console.log('\n' + '='.repeat(70));

  // Output as JSON for easy use
  const allFields = {
    textFields: textFields.map(f => f.name),
    checkboxes: checkboxes.map(f => f.name),
    dropdowns: dropdowns.map(f => f.name),
    radioGroups: radioGroups.map(f => f.name),
  };

  fs.writeFileSync('nurse-delegation-fields.json', JSON.stringify(allFields, null, 2));
  console.log('\n✅ Field names saved to nurse-delegation-fields.json\n');
}

inspectPDF().catch(console.error);
