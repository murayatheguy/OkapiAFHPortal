/**
 * DSHS 27-076 Abuse and Neglect Form Data (1 page)
 */
export interface AbuseNeglect27076Data {
  facilityInfo: {
    facilityName: string;
    licenseNumber: string;
    phone: string;
    date: string;
  };
  victimInfo: {
    victimName: string;
    dateOfBirth: string;
    address: string;
  };
  allegationInfo: {
    allegationDate: string;
    allegationType: 'physical' | 'sexual' | 'emotional' | 'neglect' | 'financial' | '';
    description: string;
    witnessInfo: string;
  };
  reporterInfo: {
    reporterName: string;
    reporterTitle: string;
    reporterPhone: string;
    relationship: string;
  };
  signatures: {
    reporterSignature: string;
    reporterDate: string;
  };
}

export function getInitialAbuseNeglect27076Data(): AbuseNeglect27076Data {
  return {
    facilityInfo: {
      facilityName: '',
      licenseNumber: '',
      phone: '',
      date: ''
    },
    victimInfo: {
      victimName: '',
      dateOfBirth: '',
      address: ''
    },
    allegationInfo: {
      allegationDate: '',
      allegationType: '',
      description: '',
      witnessInfo: ''
    },
    reporterInfo: {
      reporterName: '',
      reporterTitle: '',
      reporterPhone: '',
      relationship: ''
    },
    signatures: {
      reporterSignature: '',
      reporterDate: ''
    }
  };
}
