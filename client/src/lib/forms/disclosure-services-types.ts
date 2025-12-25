/**
 * Disclosure of Services Form Data
 * 4 pages, Letter size (612 x 792 points)
 */
export interface DisclosureServicesFormData {
  // Page 1 - Facility Info & Services Overview
  facilityInfo: {
    facilityName: string;
    licenseNumber: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
    date: string;
  };
  servicesOverview: {
    description: string;
    hoursOfOperation: string;
    capacityLicensed: string;
    caregiverToResidentRatio: string;
  };

  // Page 2 - Services Provided
  servicesProvided: {
    personalCare: boolean;
    personalCareDetails: string;
    medicationManagement: boolean;
    medicationDetails: string;
    mealServices: boolean;
    mealDetails: string;
    laundry: boolean;
    laundryDetails: string;
    housekeeping: boolean;
    housekeepingDetails: string;
    transportation: boolean;
    transportationDetails: string;
    activities: boolean;
    activitiesDetails: string;
    supervision: boolean;
    supervisionDetails: string;
  };

  // Page 3 - Additional Services & Fees
  additionalServices: {
    services: string;
    fees: string;
    specialDiets: boolean;
    specialDietsDetails: string;
    incontinenceCare: boolean;
    incontinenceCareDetails: string;
    behaviorSupport: boolean;
    behaviorSupportDetails: string;
    nursingServices: boolean;
    nursingServicesDetails: string;
  };

  // Page 4 - Signatures
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
  };
}

export function getInitialDisclosureServicesData(): DisclosureServicesFormData {
  return {
    facilityInfo: {
      facilityName: '',
      licenseNumber: '',
      address: '',
      city: '',
      state: 'WA',
      zipCode: '',
      phone: '',
      email: '',
      date: '',
    },
    servicesOverview: {
      description: '',
      hoursOfOperation: '',
      capacityLicensed: '',
      caregiverToResidentRatio: '',
    },
    servicesProvided: {
      personalCare: false,
      personalCareDetails: '',
      medicationManagement: false,
      medicationDetails: '',
      mealServices: false,
      mealDetails: '',
      laundry: false,
      laundryDetails: '',
      housekeeping: false,
      housekeepingDetails: '',
      transportation: false,
      transportationDetails: '',
      activities: false,
      activitiesDetails: '',
      supervision: false,
      supervisionDetails: '',
    },
    additionalServices: {
      services: '',
      fees: '',
      specialDiets: false,
      specialDietsDetails: '',
      incontinenceCare: false,
      incontinenceCareDetails: '',
      behaviorSupport: false,
      behaviorSupportDetails: '',
      nursingServices: false,
      nursingServicesDetails: '',
    },
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
    },
  };
}
