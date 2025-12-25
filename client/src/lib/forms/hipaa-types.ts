/**
 * DSHS 03-387a HIPAA Authorization Form Data (5 pages)
 */
export interface HIPAAFormData {
  patientInfo: {
    patientName: string;
    dateOfBirth: string;
    address: string;
    phone: string;
    socialSecurityNumber: string;
  };
  authorizationDetails: {
    authorizedParties: string;
    purposeOfDisclosure: string;
    informationToDisclose: string[];
    otherInformation: string;
  };
  restrictions: {
    hasRestrictions: boolean;
    restrictionDetails: string;
  };
  expiration: {
    expirationDate: string;
    expirationEvent: string;
  };
  signatures: {
    patientSignature: string;
    patientDate: string;
    patientPrintedName: string;
    witnessSignature: string;
    witnessDate: string;
    witnessPrintedName: string;
  };
}

export function getInitialHIPAAData(): HIPAAFormData {
  return {
    patientInfo: {
      patientName: '',
      dateOfBirth: '',
      address: '',
      phone: '',
      socialSecurityNumber: ''
    },
    authorizationDetails: {
      authorizedParties: '',
      purposeOfDisclosure: '',
      informationToDisclose: [],
      otherInformation: ''
    },
    restrictions: {
      hasRestrictions: false,
      restrictionDetails: ''
    },
    expiration: {
      expirationDate: '',
      expirationEvent: ''
    },
    signatures: {
      patientSignature: '',
      patientDate: '',
      patientPrintedName: '',
      witnessSignature: '',
      witnessDate: '',
      witnessPrintedName: ''
    }
  };
}
