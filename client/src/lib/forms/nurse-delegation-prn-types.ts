/**
 * DSHS 13-678a Nurse Delegation PRN Form Data (2 pages)
 */
export interface NurseDelegationPRNData {
  clientInfo: {
    clientName: string;
    dateOfBirth: string;
    providerOneId: string;
  };
  nurseInfo: {
    nurseName: string;
    nurseCredentials: string;
    nursePhone: string;
    delegationDate: string;
  };
  prnMedication: {
    medicationName: string;
    dosage: string;
    route: string;
    frequency: string;
    indication: string;
    parameters: string;
    precautions: string;
  };
  caregiverTraining: {
    caregiverName: string;
    trainingDate: string;
    competencyVerified: boolean;
  };
  signatures: {
    nurseSignature: string;
    nurseDate: string;
    caregiverSignature: string;
    caregiverDate: string;
  };
}

export function getInitialNurseDelegationPRNData(): NurseDelegationPRNData {
  return {
    clientInfo: {
      clientName: '',
      dateOfBirth: '',
      providerOneId: ''
    },
    nurseInfo: {
      nurseName: '',
      nurseCredentials: '',
      nursePhone: '',
      delegationDate: ''
    },
    prnMedication: {
      medicationName: '',
      dosage: '',
      route: '',
      frequency: '',
      indication: '',
      parameters: '',
      precautions: ''
    },
    caregiverTraining: {
      caregiverName: '',
      trainingDate: '',
      competencyVerified: false
    },
    signatures: {
      nurseSignature: '',
      nurseDate: '',
      caregiverSignature: '',
      caregiverDate: ''
    }
  };
}
