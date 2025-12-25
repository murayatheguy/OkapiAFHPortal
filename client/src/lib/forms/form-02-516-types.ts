/**
 * DSHS 02-516 Form Data (1 page)
 */
export interface Form02516Data {
  facilityInfo: {
    facilityName: string;
    licenseNumber: string;
    date: string;
  };
  clientInfo: {
    clientName: string;
    dateOfBirth: string;
    caseNumber: string;
  };
  serviceInfo: {
    serviceType: string;
    startDate: string;
    endDate: string;
    comments: string;
  };
  signatures: {
    clientSignature: string;
    clientDate: string;
    providerSignature: string;
    providerDate: string;
  };
}

export function getInitialForm02516Data(): Form02516Data {
  return {
    facilityInfo: { facilityName: '', licenseNumber: '', date: '' },
    clientInfo: { clientName: '', dateOfBirth: '', caseNumber: '' },
    serviceInfo: { serviceType: '', startDate: '', endDate: '', comments: '' },
    signatures: { clientSignature: '', clientDate: '', providerSignature: '', providerDate: '' }
  };
}
