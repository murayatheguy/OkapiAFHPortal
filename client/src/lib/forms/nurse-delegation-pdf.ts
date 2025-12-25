import { PDFDocument } from 'pdf-lib';
import type { NurseDelegationFormData } from './nurse-delegation-types';

/**
 * Fill the DSHS 01-212 Nurse Delegation PDF with form data
 * Uses exact field names from the official PDF template
 */
export async function fillNurseDelegationPDF(
  formData: NurseDelegationFormData
): Promise<Uint8Array> {
  // Load the template
  const templateUrl = '/forms/templates/01-212 Nurse delegation.pdf';
  const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  // Helper to safely set text fields
  const setText = (fieldName: string, value: string | undefined) => {
    try {
      if (value !== undefined && value !== null) {
        const field = form.getTextField(fieldName);
        field.setText(value);
      }
    } catch (e) {
      console.warn(`Text field not found: ${fieldName}`);
    }
  };

  // Helper to safely set checkboxes
  const setCheckbox = (fieldName: string, checked: boolean | undefined) => {
    try {
      const checkbox = form.getCheckBox(fieldName);
      if (checked) {
        checkbox.check();
      } else {
        checkbox.uncheck();
      }
    } catch (e) {
      console.warn(`Checkbox not found: ${fieldName}`);
    }
  };

  // ============================================
  // SECTION 1: REFERRAL SOURCE
  // ============================================

  // Office type checkboxes
  setCheckbox('1.  Office:  HCS', formData.referralSource.officeType === 'HCS');
  setCheckbox('1.  Office:  AAA', formData.referralSource.officeType === 'AAA');
  setCheckbox('1.  Office:  DDA', formData.referralSource.officeType === 'DDA');
  setCheckbox('1.  Office:  Other', formData.referralSource.officeType === 'Other');
  setText('1.  If other checked, specify office', formData.referralSource.otherOfficeSpecify);

  setText('2 AUTHORIZATION NUMBER FOR NURSE DELEGATION', formData.referralSource.authorizationNumber);
  setText('3  RN PROVIDERONE ID', formData.referralSource.rnProviderOneId);
  setText('4  DATE OF REFERRAL', formData.referralSource.dateOfReferral);

  // ============================================
  // SECTION 2: REFERRAL ROUTING
  // ============================================

  // Referral method (these appear to be text fields based on inspection, not checkboxes)
  setText('5.  Referral method:  Email', formData.referralRouting.referralMethod.email ? 'X' : '');
  setText('5.  Referral method:  Telephone', formData.referralRouting.referralMethod.telephone ? 'X' : '');
  setText('5.  Referral method:  Fax', formData.referralRouting.referralMethod.fax ? 'X' : '');

  // To fields
  setText('6 To:  NURSE DELEGATOR  AGENCY', formData.referralRouting.to.nurseDelegatorAgency);
  setText('7 To:  TELEPHONE NUMBER', formData.referralRouting.to.telephone);
  setText('8 To:  FAX NUMBER', formData.referralRouting.to.fax);
  setText('9 To:  EMAIL ADDRESS', formData.referralRouting.to.email);

  // From fields
  setText('10 From:  CRM NAME  OFFICE', formData.referralRouting.from.crmNameOffice);
  setText('11. From:  Email', formData.referralRouting.from.email);
  setText('12 From:  TELEPHONE NUMBER', formData.referralRouting.from.telephone);
  setText('13 From:  FAX NUMBER', formData.referralRouting.from.fax);

  // ============================================
  // SECTION 3: CLIENT INFORMATION
  // ============================================

  // Attachment checkboxes
  setCheckbox('14 CARE  DDA Assessment', formData.clientInfo.attachments.careDdaAssessment);
  setCheckbox('14 PCSP  DDA', formData.clientInfo.attachments.pcspDda);
  setCheckbox('14 PBSP', formData.clientInfo.attachments.pbsp);
  setCheckbox('14 Service Summary Plan', formData.clientInfo.attachments.serviceSummaryPlan);
  setCheckbox('14 Consent DSHS 14012', formData.clientInfo.attachments.consentDshs14012);

  setText('15 CLIENTS NAME', formData.clientInfo.clientName);
  setText('16 GUARDIANS NAME', formData.clientInfo.guardianName);
  setText('17 ACES ID', formData.clientInfo.acesId);
  setText('18 CLIENTS DATE OF BIRTH', formData.clientInfo.dateOfBirth);
  setText('19 TELEPHONE NUMBER', formData.clientInfo.telephone);
  setText('20 ADDRESS CITY STATE ZIP CODE', formData.clientInfo.addressCityStateZip);
  setText('21 LONG TERM CARE WORKERS ANDOR RESIDENTIAL PROVIDERS NAME', formData.clientInfo.careWorkerProviderName);
  setText('22 TELEPHONE NUMBER', formData.clientInfo.careWorkerTelephone);
  setText('23 FAX NUMBER', formData.clientInfo.careWorkerFax);
  setText('24 CLIENTS  GUARDIANS EMAIL ADDRESS', formData.clientInfo.clientGuardianEmail);

  // Interpreter checkboxes
  setCheckbox('25 This client needs an interpreter', formData.clientInfo.needsInterpreter);
  setCheckbox('25 Primary language needed is', formData.clientInfo.primaryLanguageNeeded);
  setText('25 Specify Primary Language Needed', formData.clientInfo.primaryLanguage);
  setCheckbox('25 Deaf  HOH', formData.clientInfo.deafHoh);

  setText('26 PRIMARY DIAGNOSIS RELATED TO DELEGATION', formData.clientInfo.primaryDiagnosis);
  setText('27 REASON FOR RND REFERRAL', formData.clientInfo.reasonForReferral);

  // ============================================
  // SECTION 4: CASE MANAGER SIGNATURE
  // ============================================

  setText('PRINTED NAME', formData.caseManagerSignature.printedName);
  setText('29 DATE', formData.caseManagerSignature.date);
  // Note: Signature field (28) cannot be filled programmatically

  // ============================================
  // SECTION 5: CONFIRMATION OF RECEIPT
  // ============================================

  setText('30 DATE RECEIVED', formData.confirmationOfReceipt.dateReceived);
  setText('30 Name of nurse assigned', formData.confirmationOfReceipt.nurseAssignedName);
  setText('30 Additional comments', formData.confirmationOfReceipt.additionalComments);
  setText('30 Confirmation of Receipt Phone Number', formData.confirmationOfReceipt.telephone);
  setText('30 Confirmation of Receipt Email', formData.confirmationOfReceipt.email);

  setCheckbox('30 Referral accepted', formData.confirmationOfReceipt.referralAccepted);
  setCheckbox('30 Referral Not accepted', formData.confirmationOfReceipt.referralNotAccepted);
  setCheckbox('30 Nurse assigned', formData.confirmationOfReceipt.nurseAssigned);
  setCheckbox('30 There are additional comments', formData.confirmationOfReceipt.hasAdditionalComments);

  // ============================================
  // SECTION 6: CRM INFORMATION
  // ============================================

  setText('31  CRM NAME', formData.crmInfo.crmName);
  setText('32 EMAIL ADDRESS', formData.crmInfo.email);
  setText('33 TELEPHONE NUMBER', formData.crmInfo.telephone);
  setText('34 FAX NUMBER', formData.crmInfo.fax);

  // ============================================
  // SECTION 7: RND INFORMATION
  // ============================================

  setText('35  RND NAME', formData.rndInfo.rndName);
  setText('36 PROVIDERONE ID', formData.rndInfo.providerOneId);
  setText('37 EMAIL ADDRESS', formData.rndInfo.email);
  setText('38 TELEPHONE NUMBER', formData.rndInfo.telephone);
  setText('39 FAX NUMBER', formData.rndInfo.fax);

  // ============================================
  // SECTION 8: NURSE ASSESSMENT
  // ============================================

  setText('40  CLIENTS NAME', formData.nurseAssessment.clientName);

  // Delegation implemented Yes/No
  setCheckbox('41.  Yes', formData.nurseAssessment.delegationImplemented === 'yes');
  setCheckbox('41.  No', formData.nurseAssessment.delegationImplemented === 'no');

  setText('42  ASSESSMENT DATE', formData.nurseAssessment.assessmentDate);
  setText('43  List the tasks that were delegated', formData.nurseAssessment.tasksDeleted);
  setText('44.  Indicate reason and any other action', formData.nurseAssessment.reasonNotImplemented);
  setText('45.  RND other options for care suggestions', formData.nurseAssessment.otherOptionsForCare);
  setText('46  RND ADDITIONAL COMMENTS', formData.nurseAssessment.rndAdditionalComments);
  setText('48  DATE', formData.nurseAssessment.rndSignatureDate);

  // ============================================
  // FLATTEN AND RETURN
  // ============================================

  // Flatten makes the form non-editable (like printed)
  form.flatten();

  return await pdfDoc.save();
}

/**
 * Download the filled PDF
 */
export function downloadNurseDelegationPDF(pdfBytes: Uint8Array, clientName: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '-') || 'Client';
  link.download = `Nurse-Delegation-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open PDF in new tab for printing
 */
export function openNurseDelegationPDFForPrint(pdfBytes: Uint8Array) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
