/**
 * DSHS 01-212 Nurse Delegation Form Data Types
 * Field names correspond to the official PDF form fields
 */

export interface NurseDelegationFormData {
  // Section 1: Referral Source Information
  referralSource: {
    officeType: 'HCS' | 'AAA' | 'DDA' | 'Other' | '';
    otherOfficeSpecify: string;
    authorizationNumber: string;
    rnProviderOneId: string;
    dateOfReferral: string;
  };

  // Section 2: Referral Routing (To/From)
  referralRouting: {
    referralMethod: {
      email: boolean;
      telephone: boolean;
      fax: boolean;
    };
    to: {
      nurseDelegatorAgency: string;
      telephone: string;
      fax: string;
      email: string;
    };
    from: {
      crmNameOffice: string;
      email: string;
      telephone: string;
      fax: string;
    };
  };

  // Section 3: Client Information
  clientInfo: {
    clientName: string;
    guardianName: string;
    acesId: string;
    dateOfBirth: string;
    telephone: string;
    addressCityStateZip: string;
    careWorkerProviderName: string;
    careWorkerTelephone: string;
    careWorkerFax: string;
    clientGuardianEmail: string;
    // Attachments checkboxes
    attachments: {
      careDdaAssessment: boolean;
      pcspDda: boolean;
      pbsp: boolean;
      serviceSummaryPlan: boolean;
      consentDshs14012: boolean;
    };
    // Interpreter needs
    needsInterpreter: boolean;
    primaryLanguageNeeded: boolean;
    primaryLanguage: string;
    deafHoh: boolean;
    // Medical info
    primaryDiagnosis: string;
    reasonForReferral: string;
  };

  // Section 4: Case Manager Signature
  caseManagerSignature: {
    printedName: string;
    date: string;
    // Note: Actual signature will be handled differently
  };

  // Section 5: Confirmation of Receipt
  confirmationOfReceipt: {
    dateReceived: string;
    nurseAssignedName: string;
    additionalComments: string;
    telephone: string;
    email: string;
    referralAccepted: boolean;
    referralNotAccepted: boolean;
    nurseAssigned: boolean;
    hasAdditionalComments: boolean;
  };

  // Section 6: CRM Information
  crmInfo: {
    crmName: string;
    email: string;
    telephone: string;
    fax: string;
  };

  // Section 7: RND (Registered Nurse Delegator) Information
  rndInfo: {
    rndName: string;
    providerOneId: string;
    email: string;
    telephone: string;
    fax: string;
  };

  // Section 8: Nurse Assessment/Delegation
  nurseAssessment: {
    clientName: string;
    delegationImplemented: 'yes' | 'no' | '';
    assessmentDate: string;
    tasksDeleted: string;
    reasonNotImplemented: string;
    otherOptionsForCare: string;
    rndAdditionalComments: string;
    rndSignatureDate: string;
  };
}

export function getInitialNurseDelegationData(): NurseDelegationFormData {
  return {
    referralSource: {
      officeType: '',
      otherOfficeSpecify: '',
      authorizationNumber: '',
      rnProviderOneId: '',
      dateOfReferral: new Date().toISOString().split('T')[0],
    },
    referralRouting: {
      referralMethod: {
        email: false,
        telephone: false,
        fax: false,
      },
      to: {
        nurseDelegatorAgency: '',
        telephone: '',
        fax: '',
        email: '',
      },
      from: {
        crmNameOffice: '',
        email: '',
        telephone: '',
        fax: '',
      },
    },
    clientInfo: {
      clientName: '',
      guardianName: '',
      acesId: '',
      dateOfBirth: '',
      telephone: '',
      addressCityStateZip: '',
      careWorkerProviderName: '',
      careWorkerTelephone: '',
      careWorkerFax: '',
      clientGuardianEmail: '',
      attachments: {
        careDdaAssessment: false,
        pcspDda: false,
        pbsp: false,
        serviceSummaryPlan: false,
        consentDshs14012: false,
      },
      needsInterpreter: false,
      primaryLanguageNeeded: false,
      primaryLanguage: '',
      deafHoh: false,
      primaryDiagnosis: '',
      reasonForReferral: '',
    },
    caseManagerSignature: {
      printedName: '',
      date: new Date().toISOString().split('T')[0],
    },
    confirmationOfReceipt: {
      dateReceived: '',
      nurseAssignedName: '',
      additionalComments: '',
      telephone: '',
      email: '',
      referralAccepted: false,
      referralNotAccepted: false,
      nurseAssigned: false,
      hasAdditionalComments: false,
    },
    crmInfo: {
      crmName: '',
      email: '',
      telephone: '',
      fax: '',
    },
    rndInfo: {
      rndName: '',
      providerOneId: '',
      email: '',
      telephone: '',
      fax: '',
    },
    nurseAssessment: {
      clientName: '',
      delegationImplemented: '',
      assessmentDate: '',
      tasksDeleted: '',
      reasonNotImplemented: '',
      otherOptionsForCare: '',
      rndAdditionalComments: '',
      rndSignatureDate: '',
    },
  };
}

// Section definitions for the wizard
export const NURSE_DELEGATION_SECTIONS = [
  { id: 'referralSource', title: 'Referral Source', icon: 'Building2' },
  { id: 'referralRouting', title: 'Referral Routing', icon: 'Send' },
  { id: 'clientInfo', title: 'Client Information', icon: 'User' },
  { id: 'caseManager', title: 'Case Manager', icon: 'UserCheck' },
  { id: 'confirmation', title: 'Confirmation', icon: 'CheckCircle' },
  { id: 'crmInfo', title: 'CRM Info', icon: 'Briefcase' },
  { id: 'rndInfo', title: 'RND Info', icon: 'Stethoscope' },
  { id: 'assessment', title: 'Assessment', icon: 'ClipboardList' },
] as const;

export type NurseDelegationSection = typeof NURSE_DELEGATION_SECTIONS[number]['id'];
