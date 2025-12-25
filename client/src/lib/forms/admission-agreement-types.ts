/**
 * DSHS 10-270 Admission Agreement Form Data
 * 6 pages, Letter size (612 x 792 points)
 */
export interface AdmissionAgreementFormData {
  // Page 1 - Facility & Resident Info
  facilityInfo: {
    facilityName: string;
    licenseNumber: string;
    address: string;
    phone: string;
    date: string;
  };
  residentInfo: {
    residentName: string;
    dateOfBirth: string;
    ssn: string;
    admissionDate: string;
  };
  responsibleParty: {
    name: string;
    relationship: string;
    address: string;
    phone: string;
    email: string;
  };

  // Page 2 - Services & Rates
  services: {
    roomType: string;
    baseMonthlyRate: string;
    additionalServices: string;
    totalMonthlyRate: string;
    rateEffectiveDate: string;
  };

  // Page 3 - Payment Terms
  paymentTerms: {
    paymentDueDate: string;
    depositAmount: string;
    depositPurpose: string;
    lateFee: string;
    lateFeeGracePeriod: string;
    paymentMethods: string;
    nsfFee: string;
  };

  // Page 4 - Policies
  policies: {
    dischargePolicies: string;
    voluntaryDischargeNotice: string;
    involuntaryDischargeReasons: string;
    refundPolicy: string;
    personalPropertyPolicy: string;
    valuablesPolicy: string;
  };

  // Page 5 - Rights & Responsibilities
  rightsAcknowledged: boolean;
  responsibilitiesAcknowledged: boolean;
  grievanceProcedureAcknowledged: boolean;

  // Page 6 - Signatures
  signatures: {
    residentSignature: string;
    residentDate: string;
    residentPrintedName: string;
    responsiblePartySignature: string;
    responsiblePartyDate: string;
    responsiblePartyPrintedName: string;
    providerSignature: string;
    providerDate: string;
    providerPrintedName: string;
    providerTitle: string;
  };
}

export function getInitialAdmissionAgreementData(): AdmissionAgreementFormData {
  return {
    facilityInfo: {
      facilityName: '',
      licenseNumber: '',
      address: '',
      phone: '',
      date: '',
    },
    residentInfo: {
      residentName: '',
      dateOfBirth: '',
      ssn: '',
      admissionDate: '',
    },
    responsibleParty: {
      name: '',
      relationship: '',
      address: '',
      phone: '',
      email: '',
    },
    services: {
      roomType: '',
      baseMonthlyRate: '',
      additionalServices: '',
      totalMonthlyRate: '',
      rateEffectiveDate: '',
    },
    paymentTerms: {
      paymentDueDate: '',
      depositAmount: '',
      depositPurpose: '',
      lateFee: '',
      lateFeeGracePeriod: '',
      paymentMethods: '',
      nsfFee: '',
    },
    policies: {
      dischargePolicies: '',
      voluntaryDischargeNotice: '',
      involuntaryDischargeReasons: '',
      refundPolicy: '',
      personalPropertyPolicy: '',
      valuablesPolicy: '',
    },
    rightsAcknowledged: false,
    responsibilitiesAcknowledged: false,
    grievanceProcedureAcknowledged: false,
    signatures: {
      residentSignature: '',
      residentDate: '',
      residentPrintedName: '',
      responsiblePartySignature: '',
      responsiblePartyDate: '',
      responsiblePartyPrintedName: '',
      providerSignature: '',
      providerDate: '',
      providerPrintedName: '',
      providerTitle: '',
    },
  };
}
