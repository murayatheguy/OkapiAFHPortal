/**
 * DSHS 10-403 Abuse and Neglect Reporting Form Data (1 page)
 */
export interface AbuseNeglect10403Data {
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
    roomNumber: string;
  };
  incidentInfo: {
    incidentDate: string;
    incidentTime: string;
    incidentType: 'abuse' | 'neglect' | 'exploitation' | 'abandonment' | '';
    description: string;
    actionsTaken: string;
    reportedTo: string;
    reportedDate: string;
  };
  signatures: {
    reporterSignature: string;
    reporterDate: string;
    reporterPrintedName: string;
    reporterTitle: string;
  };
}

export function getInitialAbuseNeglect10403Data(): AbuseNeglect10403Data {
  return {
    facilityInfo: {
      facilityName: '',
      licenseNumber: '',
      address: '',
      phone: '',
      date: ''
    },
    residentInfo: {
      residentName: '',
      dateOfBirth: '',
      roomNumber: ''
    },
    incidentInfo: {
      incidentDate: '',
      incidentTime: '',
      incidentType: '',
      description: '',
      actionsTaken: '',
      reportedTo: '',
      reportedDate: ''
    },
    signatures: {
      reporterSignature: '',
      reporterDate: '',
      reporterPrintedName: '',
      reporterTitle: ''
    }
  };
}
