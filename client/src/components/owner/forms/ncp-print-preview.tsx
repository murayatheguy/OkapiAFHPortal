import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";

// DSHS Official Color Palette
const NCP_COLORS = {
  tableBorder: '#A6A6A6',
  sectionHeaderBg: '#7F7F7F',
  sectionHeaderText: '#FFFFFF',
  alternateRowBg: '#F2F2F2',
  lightGrayBg: '#EDEDED',
  linkText: '#C00000',
  hyperlink: '#0563C1',
  mainText: '#000000',
  background: '#FFFFFF',
};

// Define the type inline to avoid circular dependency
interface NCPFormDataType {
  residentInfo: {
    providerName: string;
    ncpStartDate: string;
    movedInDate: string;
    dateCompleted: string;
    dateDischarge: string;
    firstName: string;
    lastName: string;
    preferredName: string;
    pronouns: string;
    dateOfBirth: string;
    primaryLanguage: string;
    speaksEnglish: boolean;
    interpreterNeeded: boolean;
    allergies: string;
    ssn: string;
    admissionDate: string;
    roomNumber: string;
    medicaidId: string;
    diagnosisCodes: string[];
    legalDocuments: {
      powerOfAttorney: boolean;
      guardian: boolean;
      healthcareDirective: boolean;
      polst: boolean;
      dnr: boolean;
      other: boolean;
      otherText: string;
    };
    specialtyNeeds: {
      dialysis: boolean;
      hospice: boolean;
      behavioralHealth: boolean;
      memoryCare: boolean;
      other: boolean;
      otherText: string;
    };
  };
  emergencyContacts: {
    contacts: Array<{
      name: string;
      relationship: string;
      homePhone: string;
      cellPhone: string;
      fax: string;
      email: string;
      address: string;
      preferredContact: string;
    }>;
  };
  evacuation: {
    evacuationAssistance: string;
    independentDescription: string;
    assistanceDescription: string;
    evacuationInstructions: string;
    mobilityAids: {
      wheelchair: boolean;
      walker: boolean;
      cane: boolean;
      none: boolean;
    };
    evacuationNotes: string;
  };
  communication: {
    expressionProblems: string;
    expressionDescription: string;
    expressionEquipment: string;
    hearingProblems: string;
    hearingDescription: string;
    hearingEquipment: string;
    visionProblems: string;
    visionDescription: string;
    visionEquipment: string;
    phoneAbility: string;
    hasOwnPhone: boolean;
    phoneNumber: string;
    preferredLanguage: string;
    communicationNotes: string;
    communicationStrengths: string;
    communicationAssistance: string;
  };
  medication: {
    hasMedicationAllergies: boolean;
    medicationAllergies: string;
    needsMultipleMedAssistance: boolean;
    hasPsychMedications: boolean;
    medsOrderedBy: string;
    medsDeliveredBy: string;
    medsPharmacyPacked: boolean;
    pharmacyName: string;
    medicationLevel: string;
    medicationLevelReason: string;
    medTypes: {
      oral: boolean;
      topical: boolean;
      eyeDrops: boolean;
      inhalers: boolean;
      sprays: boolean;
      injections: boolean;
      allergyKits: boolean;
      suppositories: boolean;
      other: boolean;
    };
    injectionAdministeredBy: string;
    medTypeOtherText: string;
    requiresNurseDelegation: boolean;
    rnDelegatorName: string;
    rnDelegatorPhone: string;
    rnDelegatorFax: string;
    rnDelegatorEmail: string;
    medicationPlanWhenAway: string;
    medicationRefusalPlan: string;
  };
  healthIndicators: {
    painIssues: boolean;
    painDescription: string;
    painImpact: string;
    weightIssues: boolean;
    currentWeight: string;
    currentHeight: string;
    vitalSignsMonitoring: boolean;
    vitalSignsFrequency: string;
    recentHospitalization: boolean;
    hospitalizationDetails: string;
    otherHealthIndicators: string;
    allergies: Array<{ substance: string; reaction: string }>;
    healthMonitoringStrengths: string;
    healthMonitoringAssistance: string;
  };
  treatments: {
    oxygenUse: boolean;
    oxygenVendor: string;
    dialysis: boolean;
    dialysisProvider: string;
    bloodThinners: boolean;
    inrLabProvider: string;
    easilyBruised: boolean;
    bloodGlucoseMonitoring: boolean;
    injections: boolean;
    cpapBipap: boolean;
    nebulizer: boolean;
    rangeOfMotion: boolean;
    ptOtSt: boolean;
    nurseDelegationTreatments: boolean;
    nurseDelegationTasks: string;
    otherTreatments: string;
    homeHealth: boolean;
    homeHealthAgency: string;
    adultDayHealth: boolean;
    hospice: boolean;
    hospiceAgency: string;
    hospicePlan: boolean;
    otherPrograms: string;
    physicalEnablers: string;
    enablersAssistance: string;
    treatmentRefusalPlan: string;
  };
  psychSocial: {
    sleepDisturbance: boolean;
    sleepDescription: string;
    nighttimeAssistance: boolean;
    nighttimeAssistanceDescription: string;
    shortTermMemoryIssues: boolean;
    longTermMemoryIssues: boolean;
    orientedToPerson: boolean;
    behaviors: Record<string, boolean>;
    behaviorDescriptions: Record<string, string>;
    otherBehaviors: string;
    requiresPsychMedications: boolean;
    psychMedicationSymptoms: string;
    behavioralHealthCrisisPlan: boolean;
    counseling: boolean;
    mentalHealthProvider: string;
    pastBehaviors: string;
    meaningfulDay: boolean;
    expandedCommunityServices: boolean;
    specializedBehaviorServices: boolean;
    mhProviderProgram: boolean;
    mhProviderContact: string;
    typicalDayNarrative: string;
    psychSocialStrengths: string;
    psychSocialAssistance: string;
  };
  adls: {
    functionalLimitations: string;
    ambulation: {
      inRoomLevel: string;
      outsideLevel: string;
      fallRisk: boolean;
      fallPreventionPlan: string;
      bedroomDoorLock: boolean;
      equipment: string;
      vendor: string;
      strengths: string;
      assistance: string;
    };
    bedMobility: {
      level: string;
      skinCareNeeded: boolean;
      turningRepositioning: boolean;
      turningFrequency: string;
      bedFallRisk: boolean;
      safetyPlan: string;
      devices: { hoyerLift: boolean; transferPole: boolean; other: boolean };
      devicesOther: string;
      nighttimeCareNeeds: boolean;
      strengths: string;
      assistance: string;
    };
    eating: {
      level: string;
      specialDiet: string;
      eatingHabits: string;
      foodAllergies: string;
      equipment: string;
      strengths: string;
      assistance: string;
    };
    toileting: {
      level: string;
      frequency: string;
      bladderIncontinence: boolean;
      bowelIncontinence: boolean;
      incontinenceSkinCare: boolean;
      equipment: string;
      strengths: string;
      assistance: string;
    };
    dressing: {
      level: string;
      equipment: string;
      strengths: string;
      assistance: string;
    };
    hygiene: {
      level: string;
      teethType: string;
      oralHygiene: { flossing: boolean; brushing: boolean; soaking: boolean };
      hairCare: boolean;
      mensesCare: boolean;
      frequency: string;
      equipment: string;
      strengths: string;
      assistance: string;
    };
    bathing: {
      level: string;
      frequency: string;
      equipment: string;
      strengths: string;
      assistance: string;
    };
    footCare: {
      level: string;
      frequency: string;
      diabeticFootCare: boolean;
      nailCare: boolean;
      homeHealth: string;
      equipment: string;
      strengths: string;
      assistance: string;
    };
    skinCare: {
      level: string;
      frequency: string;
      skinProblems: boolean;
      skinProblemsDescription: string;
      pressureInjuries: boolean;
      pressureInjuriesDescription: string;
      dressingChanges: boolean;
      dressingChangesFrequency: string;
      dressingNurseDelegated: boolean;
      homeHealth: string;
      equipment: string;
      strengths: string;
      assistance: string;
    };
  };
  iadls: {
    finances: {
      level: string;
      whoManagesFinances: string;
      whoManagesRecords: string;
      payeeName: string;
      payeeContact: string;
      strengths: string;
      assistance: string;
    };
    shopping: {
      level: string;
      transportNeeds: string;
      frequency: string;
      equipment: string;
      strengths: string;
      assistance: string;
    };
    transportation: {
      level: string;
      medicalTransportNeeds: string;
      specialTransportNeeds: string;
      escortRequired: boolean;
      frequency: string;
      equipment: string;
      strengths: string;
      assistance: string;
    };
    activities: {
      level: string;
      interests: string;
      socialCulturalPreferences: string;
      familyFriendsRelationships: string;
      employmentSupport: string;
      clubsGroupsDayHealth: string;
      specialArrangements: string;
      participationIssues: string;
      strengths: string;
      assistance: string;
    };
    activityPreferences: Record<string, boolean>;
    activityPreferencesOther: string;
    activityNarrative: string;
    smoking: {
      residentSmokes: boolean;
      safetyConcerns: string;
      policyReviewed: boolean;
      cigaretteLighterStorage: string;
    };
    caseManagement: {
      receivesCaseManagement: boolean;
      caseManagerName: string;
      caseManagerAgency: string;
      caseManagerPhone: string;
      caseManagerEmail: string;
      caseManagerFax: string;
    };
    otherIssuesConcerns: string;
  };
  signatures: {
    ncpReviewInfo: string;
    residentParticipation: string;
    involved: {
      resident: boolean;
      residentRep: boolean;
      parent: boolean;
      healthProfessional: boolean;
      other1: boolean;
      other1Name: string;
      other2: boolean;
      other2Name: string;
      other3: boolean;
      other3Name: string;
    };
    dateOfOriginalPlan: string;
    reviewDates: string;
    ncpSentToCM: boolean;
    ncpSentToCMDate: string;
    residentVerballyAgreed: boolean;
    residentVerballyAgreedDate: string;
    residentRecommendations: string;
  };
}

interface NCPPrintPreviewProps {
  formData: NCPFormDataType;
  facility: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
  onClose: () => void;
}

// Checkbox display component
const Checkbox = ({ checked }: { checked: boolean }) => (
  <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
    {checked ? '[X]' : '[ ]'}
  </span>
);

// Format level for display
const formatLevel = (level: string): string => {
  switch (level) {
    case 'independent': return 'Independent';
    case 'supervision': return 'Supervision';
    case 'assistance': return 'Assistance Required';
    case 'dependent': return 'Dependent';
    default: return level || '—';
  }
};

export function NCPPrintPreview({ formData, facility, onClose }: NCPPrintPreviewProps) {
  const [currentPage] = useState(1);
  const totalPages = 11; // Approximate based on sections

  const residentName = `${formData.residentInfo.firstName || ''} ${formData.residentInfo.lastName || ''}`.trim() || 'Resident Name';

  // Print styles
  const printStyles = `
    @media print {
      @page {
        size: letter;
        margin: 0.5in;
      }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-family: Arial, Calibri, sans-serif !important;
        font-size: 10pt !important;
        line-height: 1.3 !important;
      }
      .ncp-print-preview {
        position: static !important;
        overflow: visible !important;
        height: auto !important;
      }
      .ncp-print-content {
        overflow: visible !important;
        height: auto !important;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
      }
      .ncp-header {
        position: running(header);
      }
      .ncp-footer {
        position: running(footer);
      }
      table {
        page-break-inside: avoid;
      }
      tr {
        page-break-inside: avoid;
      }
    }

    @media screen {
      .print-only-footer {
        display: none;
      }
    }

    @media print {
      .print-only-footer {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        font-size: 9pt;
        border-top: 1px solid ${NCP_COLORS.tableBorder};
        padding-top: 4px;
        background: white;
      }
    }
  `;

  // Table styles
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '16px',
    fontSize: '10pt',
  };

  const thStyle: React.CSSProperties = {
    border: `1px solid ${NCP_COLORS.tableBorder}`,
    padding: '4px 8px',
    textAlign: 'left',
    verticalAlign: 'top',
    fontWeight: 'bold',
    backgroundColor: NCP_COLORS.alternateRowBg,
  };

  const tdStyle: React.CSSProperties = {
    border: `1px solid ${NCP_COLORS.tableBorder}`,
    padding: '4px 8px',
    textAlign: 'left',
    verticalAlign: 'top',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    backgroundColor: NCP_COLORS.sectionHeaderBg,
    color: NCP_COLORS.sectionHeaderText,
    fontWeight: 'bold',
    fontSize: '11pt',
    padding: '6px 8px',
    border: `1px solid ${NCP_COLORS.tableBorder}`,
  };

  const altRowStyle: React.CSSProperties = {
    ...tdStyle,
    backgroundColor: NCP_COLORS.alternateRowBg,
  };

  return (
    <div
      className="ncp-print-preview fixed inset-0 z-[100] bg-gray-100 overflow-hidden flex flex-col"
      style={{ fontFamily: 'Arial, Calibri, sans-serif' }}
    >
      <style>{printStyles}</style>

      {/* Toolbar - hidden on print */}
      <div className="no-print bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Close Preview
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <span className="font-semibold text-gray-900">
            NCP Print Preview - DSHS Format
          </span>
        </div>
        <Button
          onClick={() => window.print()}
          className="gap-2 bg-teal-600 hover:bg-teal-500"
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Print Content */}
      <div className="ncp-print-content flex-1 overflow-auto bg-gray-100 p-8">
        <div
          className="max-w-[8.5in] mx-auto bg-white shadow-lg"
          style={{
            padding: '0.5in',
            fontFamily: 'Arial, Calibri, sans-serif',
            fontSize: '10pt',
            lineHeight: '1.3',
            color: NCP_COLORS.mainText,
          }}
        >
          {/* Page Header */}
          <div className="text-center mb-4">
            <h1 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '4px' }}>
              ADULT FAMILY HOME RESIDENT NEGOTIATED CARE PLAN
            </h1>
            <p style={{ color: NCP_COLORS.linkText, fontSize: '10pt', marginBottom: '8px' }}>
              (NCP) WAC 388-76-10355
            </p>
            <p style={{ fontSize: '8pt', color: '#666', marginBottom: '4px' }}>
              NOTE: Place an X in the bracket [ ] - [x] - to indicate/select your choice
            </p>
            <p style={{ fontSize: '8pt', color: '#666' }}>
              Form Version: 3.12.2024
            </p>
          </div>

          {/* Section 1: Resident Information */}
          <div className="page-break-inside-avoid mb-6">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={sectionHeaderStyle}>
                    SECTION 1: RESIDENT INFORMATION
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...thStyle, width: '25%' }}>Provider Name:</td>
                  <td style={{ ...tdStyle, width: '25%' }}>{formData.residentInfo.providerName || '—'}</td>
                  <td style={{ ...thStyle, width: '25%' }}>NCP Start Date:</td>
                  <td style={{ ...tdStyle, width: '25%' }}>{formData.residentInfo.ncpStartDate || '—'}</td>
                </tr>
                <tr>
                  <td style={thStyle}>Resident Name:</td>
                  <td style={tdStyle}>{residentName}</td>
                  <td style={thStyle}>Preferred Name:</td>
                  <td style={tdStyle}>{formData.residentInfo.preferredName || '—'}</td>
                </tr>
                <tr>
                  <td style={thStyle}>Date of Birth:</td>
                  <td style={tdStyle}>{formData.residentInfo.dateOfBirth || '—'}</td>
                  <td style={thStyle}>Pronouns:</td>
                  <td style={tdStyle}>{formData.residentInfo.pronouns || '—'}</td>
                </tr>
                <tr>
                  <td style={thStyle}>Primary Language:</td>
                  <td style={tdStyle}>{formData.residentInfo.primaryLanguage || '—'}</td>
                  <td style={thStyle}>Speaks English:</td>
                  <td style={tdStyle}><Checkbox checked={formData.residentInfo.speaksEnglish} /> Yes</td>
                </tr>
                <tr>
                  <td style={thStyle}>Move-in Date:</td>
                  <td style={tdStyle}>{formData.residentInfo.movedInDate || '—'}</td>
                  <td style={thStyle}>Interpreter Needed:</td>
                  <td style={tdStyle}><Checkbox checked={formData.residentInfo.interpreterNeeded} /> Yes</td>
                </tr>
              </tbody>
            </table>

            {/* Legal Documents */}
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={{ ...sectionHeaderStyle, backgroundColor: NCP_COLORS.alternateRowBg, color: NCP_COLORS.mainText }}>
                    Legal Documents on File
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}><Checkbox checked={formData.residentInfo.legalDocuments.powerOfAttorney} /> Power of Attorney</td>
                  <td style={tdStyle}><Checkbox checked={formData.residentInfo.legalDocuments.guardian} /> Guardian</td>
                  <td style={tdStyle}><Checkbox checked={formData.residentInfo.legalDocuments.healthcareDirective} /> Healthcare Directive</td>
                  <td style={tdStyle}><Checkbox checked={formData.residentInfo.legalDocuments.polst} /> POLST</td>
                </tr>
                <tr>
                  <td style={altRowStyle}><Checkbox checked={formData.residentInfo.legalDocuments.dnr} /> DNR</td>
                  <td colSpan={3} style={altRowStyle}>
                    <Checkbox checked={formData.residentInfo.legalDocuments.other} /> Other: {formData.residentInfo.legalDocuments.otherText || '—'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Specialty Needs */}
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={{ ...sectionHeaderStyle, backgroundColor: NCP_COLORS.alternateRowBg, color: NCP_COLORS.mainText }}>
                    Specialty Needs
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}><Checkbox checked={formData.residentInfo.specialtyNeeds.dialysis} /> Dialysis</td>
                  <td style={tdStyle}><Checkbox checked={formData.residentInfo.specialtyNeeds.hospice} /> Hospice</td>
                  <td style={tdStyle}><Checkbox checked={formData.residentInfo.specialtyNeeds.behavioralHealth} /> Behavioral Health</td>
                  <td style={tdStyle}><Checkbox checked={formData.residentInfo.specialtyNeeds.memoryCare} /> Memory Care</td>
                </tr>
                <tr>
                  <td colSpan={4} style={altRowStyle}>
                    <Checkbox checked={formData.residentInfo.specialtyNeeds.other} /> Other: {formData.residentInfo.specialtyNeeds.otherText || '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Emergency Contacts */}
          <div className="page-break mb-6">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={sectionHeaderStyle}>
                    SECTION 2: EMERGENCY CONTACTS
                  </td>
                </tr>
              </thead>
              <tbody>
                {formData.emergencyContacts.contacts.map((contact, index) => (
                  <>
                    <tr key={`contact-${index}-header`}>
                      <td colSpan={4} style={{ ...thStyle, backgroundColor: NCP_COLORS.lightGrayBg }}>
                        Emergency Contact {index + 1}
                      </td>
                    </tr>
                    <tr key={`contact-${index}-row1`}>
                      <td style={thStyle}>Name:</td>
                      <td style={tdStyle}>{contact.name || '—'}</td>
                      <td style={thStyle}>Relationship:</td>
                      <td style={tdStyle}>{contact.relationship || '—'}</td>
                    </tr>
                    <tr key={`contact-${index}-row2`}>
                      <td style={thStyle}>Home Phone:</td>
                      <td style={tdStyle}>{contact.homePhone || '—'}</td>
                      <td style={thStyle}>Cell Phone:</td>
                      <td style={tdStyle}>{contact.cellPhone || '—'}</td>
                    </tr>
                    <tr key={`contact-${index}-row3`}>
                      <td style={thStyle}>Email:</td>
                      <td style={tdStyle}>{contact.email || '—'}</td>
                      <td style={thStyle}>Preferred Contact:</td>
                      <td style={tdStyle}>{contact.preferredContact || '—'}</td>
                    </tr>
                    <tr key={`contact-${index}-row4`}>
                      <td style={thStyle}>Address:</td>
                      <td colSpan={3} style={tdStyle}>{contact.address || '—'}</td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Emergency Evacuation */}
          <div className="mb-6">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={2} style={sectionHeaderStyle}>
                    SECTION 3: EMERGENCY EVACUATION
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...thStyle, width: '30%' }}>Evacuation Assistance Level:</td>
                  <td style={tdStyle}>
                    <Checkbox checked={formData.evacuation.evacuationAssistance === 'independent'} /> Independent
                    {' '}
                    <Checkbox checked={formData.evacuation.evacuationAssistance === 'assistance_required'} /> Assistance Required
                  </td>
                </tr>
                {formData.evacuation.evacuationAssistance === 'independent' && (
                  <tr>
                    <td style={thStyle}>Independent Description:</td>
                    <td style={tdStyle}>{formData.evacuation.independentDescription || '—'}</td>
                  </tr>
                )}
                {formData.evacuation.evacuationAssistance === 'assistance_required' && (
                  <tr>
                    <td style={thStyle}>Assistance Description:</td>
                    <td style={tdStyle}>{formData.evacuation.assistanceDescription || '—'}</td>
                  </tr>
                )}
                <tr>
                  <td style={thStyle}>Mobility Aids:</td>
                  <td style={altRowStyle}>
                    <Checkbox checked={formData.evacuation.mobilityAids.wheelchair} /> Wheelchair
                    {' '}
                    <Checkbox checked={formData.evacuation.mobilityAids.walker} /> Walker
                    {' '}
                    <Checkbox checked={formData.evacuation.mobilityAids.cane} /> Cane
                    {' '}
                    <Checkbox checked={formData.evacuation.mobilityAids.none} /> None
                  </td>
                </tr>
                <tr>
                  <td style={thStyle}>Evacuation Instructions:</td>
                  <td style={tdStyle}>{formData.evacuation.evacuationInstructions || '—'}</td>
                </tr>
                <tr>
                  <td style={thStyle}>Additional Notes:</td>
                  <td style={altRowStyle}>{formData.evacuation.evacuationNotes || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 4: Communication */}
          <div className="page-break mb-6">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={3} style={sectionHeaderStyle}>
                    SECTION 4: COMMUNICATION
                  </td>
                </tr>
                <tr>
                  <th style={{ ...thStyle, width: '30%' }}>Area/Topic</th>
                  <th style={{ ...thStyle, width: '35%' }}>Resident Strengths & Abilities</th>
                  <th style={{ ...thStyle, width: '35%' }}>Assistance Required</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={thStyle}>Expression/Speech</td>
                  <td style={tdStyle}>
                    Problems: <Checkbox checked={formData.communication.expressionProblems === 'yes'} /> Yes <Checkbox checked={formData.communication.expressionProblems === 'no'} /> No
                    <br />{formData.communication.expressionDescription || '—'}
                  </td>
                  <td style={tdStyle}>Equipment: {formData.communication.expressionEquipment || '—'}</td>
                </tr>
                <tr>
                  <td style={altRowStyle}>Hearing</td>
                  <td style={altRowStyle}>
                    Problems: <Checkbox checked={formData.communication.hearingProblems === 'yes'} /> Yes <Checkbox checked={formData.communication.hearingProblems === 'no'} /> No
                    <br />{formData.communication.hearingDescription || '—'}
                  </td>
                  <td style={altRowStyle}>Equipment: {formData.communication.hearingEquipment || '—'}</td>
                </tr>
                <tr>
                  <td style={thStyle}>Vision</td>
                  <td style={tdStyle}>
                    Problems: <Checkbox checked={formData.communication.visionProblems === 'yes'} /> Yes <Checkbox checked={formData.communication.visionProblems === 'no'} /> No
                    <br />{formData.communication.visionDescription || '—'}
                  </td>
                  <td style={tdStyle}>Equipment: {formData.communication.visionEquipment || '—'}</td>
                </tr>
                <tr>
                  <td style={altRowStyle}>Phone Use</td>
                  <td style={altRowStyle}>
                    Ability: {formatLevel(formData.communication.phoneAbility)}
                    <br />Has Own Phone: <Checkbox checked={formData.communication.hasOwnPhone} />
                    {formData.communication.hasOwnPhone && ` Phone: ${formData.communication.phoneNumber || '—'}`}
                  </td>
                  <td style={altRowStyle}>{formData.communication.communicationAssistance || '—'}</td>
                </tr>
                <tr>
                  <td style={thStyle}>Language Preference</td>
                  <td style={tdStyle}>{formData.communication.preferredLanguage || '—'}</td>
                  <td style={tdStyle}>Notes: {formData.communication.communicationNotes || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 5: Medication Management */}
          <div className="page-break mb-6">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={sectionHeaderStyle}>
                    SECTION 5: MEDICATION MANAGEMENT
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...thStyle, width: '25%' }}>Medication Allergies:</td>
                  <td style={tdStyle}>
                    <Checkbox checked={formData.medication.hasMedicationAllergies} /> Yes
                    {formData.medication.hasMedicationAllergies && `: ${formData.medication.medicationAllergies || '—'}`}
                  </td>
                  <td style={thStyle}>Psych Medications:</td>
                  <td style={tdStyle}><Checkbox checked={formData.medication.hasPsychMedications} /> Yes</td>
                </tr>
                <tr>
                  <td style={thStyle}>Medications Ordered By:</td>
                  <td style={altRowStyle}>{formData.medication.medsOrderedBy || '—'}</td>
                  <td style={thStyle}>Delivered By:</td>
                  <td style={altRowStyle}>{formData.medication.medsDeliveredBy || '—'}</td>
                </tr>
                <tr>
                  <td style={thStyle}>Pharmacy Packed:</td>
                  <td style={tdStyle}><Checkbox checked={formData.medication.medsPharmacyPacked} /> Yes</td>
                  <td style={thStyle}>Pharmacy Name:</td>
                  <td style={tdStyle}>{formData.medication.pharmacyName || '—'}</td>
                </tr>
                <tr>
                  <td style={thStyle}>Medication Level:</td>
                  <td colSpan={3} style={altRowStyle}>
                    <Checkbox checked={formData.medication.medicationLevel === 'self_administration'} /> Self-Administration
                    {' '}
                    <Checkbox checked={formData.medication.medicationLevel === 'self_with_assistance'} /> Self w/Assistance
                    {' '}
                    <Checkbox checked={formData.medication.medicationLevel === 'full_administration'} /> Full Administration
                    <br />Reason: {formData.medication.medicationLevelReason || '—'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Medication Types */}
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={{ ...sectionHeaderStyle, backgroundColor: NCP_COLORS.alternateRowBg, color: NCP_COLORS.mainText }}>
                    Medication Types
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}><Checkbox checked={formData.medication.medTypes.oral} /> Oral</td>
                  <td style={tdStyle}><Checkbox checked={formData.medication.medTypes.topical} /> Topical</td>
                  <td style={tdStyle}><Checkbox checked={formData.medication.medTypes.eyeDrops} /> Eye Drops</td>
                  <td style={tdStyle}><Checkbox checked={formData.medication.medTypes.inhalers} /> Inhalers</td>
                </tr>
                <tr>
                  <td style={altRowStyle}><Checkbox checked={formData.medication.medTypes.sprays} /> Sprays</td>
                  <td style={altRowStyle}><Checkbox checked={formData.medication.medTypes.injections} /> Injections</td>
                  <td style={altRowStyle}><Checkbox checked={formData.medication.medTypes.allergyKits} /> Allergy Kits</td>
                  <td style={altRowStyle}><Checkbox checked={formData.medication.medTypes.suppositories} /> Suppositories</td>
                </tr>
                <tr>
                  <td colSpan={4} style={tdStyle}>
                    <Checkbox checked={formData.medication.medTypes.other} /> Other: {formData.medication.medTypeOtherText || '—'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Nurse Delegation */}
            {formData.medication.requiresNurseDelegation && (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <td colSpan={2} style={{ ...sectionHeaderStyle, backgroundColor: NCP_COLORS.alternateRowBg, color: NCP_COLORS.mainText }}>
                      Nurse Delegation
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...thStyle, width: '30%' }}>RN Delegator Name:</td>
                    <td style={tdStyle}>{formData.medication.rnDelegatorName || '—'}</td>
                  </tr>
                  <tr>
                    <td style={thStyle}>Phone:</td>
                    <td style={altRowStyle}>{formData.medication.rnDelegatorPhone || '—'}</td>
                  </tr>
                  <tr>
                    <td style={thStyle}>Email:</td>
                    <td style={tdStyle}>{formData.medication.rnDelegatorEmail || '—'}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Section 6: Health Indicators */}
          <div className="page-break mb-6">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={sectionHeaderStyle}>
                    SECTION 6: HEALTH INDICATORS
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...thStyle, width: '25%' }}>Pain Issues:</td>
                  <td style={tdStyle}>
                    <Checkbox checked={formData.healthIndicators.painIssues} /> Yes
                    {formData.healthIndicators.painIssues && <><br />Description: {formData.healthIndicators.painDescription || '—'}</>}
                  </td>
                  <td style={thStyle}>Pain Impact:</td>
                  <td style={tdStyle}>{formData.healthIndicators.painImpact || '—'}</td>
                </tr>
                <tr>
                  <td style={thStyle}>Current Weight:</td>
                  <td style={altRowStyle}>{formData.healthIndicators.currentWeight || '—'}</td>
                  <td style={thStyle}>Current Height:</td>
                  <td style={altRowStyle}>{formData.healthIndicators.currentHeight || '—'}</td>
                </tr>
                <tr>
                  <td style={thStyle}>Vital Signs Monitoring:</td>
                  <td style={tdStyle}>
                    <Checkbox checked={formData.healthIndicators.vitalSignsMonitoring} /> Yes
                    {formData.healthIndicators.vitalSignsMonitoring && <><br />Frequency: {formData.healthIndicators.vitalSignsFrequency || '—'}</>}
                  </td>
                  <td style={thStyle}>Recent Hospitalization:</td>
                  <td style={tdStyle}>
                    <Checkbox checked={formData.healthIndicators.recentHospitalization} /> Yes
                    {formData.healthIndicators.recentHospitalization && <><br />{formData.healthIndicators.hospitalizationDetails || '—'}</>}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Allergies Table */}
            {formData.healthIndicators.allergies && formData.healthIndicators.allergies.length > 0 && (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <td colSpan={2} style={{ ...sectionHeaderStyle, backgroundColor: NCP_COLORS.alternateRowBg, color: NCP_COLORS.mainText }}>
                      Allergies
                    </td>
                  </tr>
                  <tr>
                    <th style={{ ...thStyle, width: '40%' }}>Substance</th>
                    <th style={thStyle}>Reaction</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.healthIndicators.allergies.map((allergy, index) => (
                    <tr key={index}>
                      <td style={index % 2 === 0 ? tdStyle : altRowStyle}>{allergy.substance || '—'}</td>
                      <td style={index % 2 === 0 ? tdStyle : altRowStyle}>{allergy.reaction || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 7: Treatments & Therapies */}
          <div className="page-break mb-6">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={sectionHeaderStyle}>
                    SECTION 7: TREATMENTS & THERAPIES
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}><Checkbox checked={formData.treatments.oxygenUse} /> Oxygen Use</td>
                  <td style={tdStyle}><Checkbox checked={formData.treatments.dialysis} /> Dialysis</td>
                  <td style={tdStyle}><Checkbox checked={formData.treatments.bloodThinners} /> Blood Thinners</td>
                  <td style={tdStyle}><Checkbox checked={formData.treatments.bloodGlucoseMonitoring} /> Blood Glucose</td>
                </tr>
                <tr>
                  <td style={altRowStyle}><Checkbox checked={formData.treatments.cpapBipap} /> CPAP/BiPAP</td>
                  <td style={altRowStyle}><Checkbox checked={formData.treatments.nebulizer} /> Nebulizer</td>
                  <td style={altRowStyle}><Checkbox checked={formData.treatments.injections} /> Injections</td>
                  <td style={altRowStyle}><Checkbox checked={formData.treatments.ptOtSt} /> PT/OT/ST</td>
                </tr>
                <tr>
                  <td colSpan={4} style={tdStyle}>
                    <Checkbox checked={formData.treatments.nurseDelegationTreatments} /> Nurse Delegation Required
                    {formData.treatments.nurseDelegationTreatments && `: ${formData.treatments.nurseDelegationTasks || '—'}`}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Programs */}
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={2} style={{ ...sectionHeaderStyle, backgroundColor: NCP_COLORS.alternateRowBg, color: NCP_COLORS.mainText }}>
                    Programs
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...tdStyle, width: '50%' }}>
                    <Checkbox checked={formData.treatments.homeHealth} /> Home Health
                    {formData.treatments.homeHealth && `: ${formData.treatments.homeHealthAgency || '—'}`}
                  </td>
                  <td style={tdStyle}>
                    <Checkbox checked={formData.treatments.adultDayHealth} /> Adult Day Health
                  </td>
                </tr>
                <tr>
                  <td style={altRowStyle}>
                    <Checkbox checked={formData.treatments.hospice} /> Hospice
                    {formData.treatments.hospice && `: ${formData.treatments.hospiceAgency || '—'}`}
                  </td>
                  <td style={altRowStyle}>Other: {formData.treatments.otherPrograms || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 8: Psych/Social/Cognitive */}
          <div className="page-break mb-6">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={sectionHeaderStyle}>
                    SECTION 8: PSYCHOLOGICAL / SOCIAL / COGNITIVE
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...thStyle, width: '25%' }}>Sleep Disturbance:</td>
                  <td style={tdStyle}>
                    <Checkbox checked={formData.psychSocial.sleepDisturbance} /> Yes
                    {formData.psychSocial.sleepDisturbance && <><br />{formData.psychSocial.sleepDescription || '—'}</>}
                  </td>
                  <td style={thStyle}>Nighttime Assistance:</td>
                  <td style={tdStyle}>
                    <Checkbox checked={formData.psychSocial.nighttimeAssistance} /> Yes
                    {formData.psychSocial.nighttimeAssistance && <><br />{formData.psychSocial.nighttimeAssistanceDescription || '—'}</>}
                  </td>
                </tr>
                <tr>
                  <td style={thStyle}>Memory Issues:</td>
                  <td colSpan={3} style={altRowStyle}>
                    <Checkbox checked={formData.psychSocial.shortTermMemoryIssues} /> Short-term
                    {' '}
                    <Checkbox checked={formData.psychSocial.longTermMemoryIssues} /> Long-term
                    {' '}
                    <Checkbox checked={formData.psychSocial.orientedToPerson} /> Oriented to Person
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Behaviors */}
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={{ ...sectionHeaderStyle, backgroundColor: NCP_COLORS.alternateRowBg, color: NCP_COLORS.mainText }}>
                    Behaviors
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}><Checkbox checked={formData.psychSocial.behaviors.impairedDecisionMaking} /> Impaired Decision Making</td>
                  <td style={tdStyle}><Checkbox checked={formData.psychSocial.behaviors.disruptiveBehavior} /> Disruptive Behavior</td>
                  <td style={tdStyle}><Checkbox checked={formData.psychSocial.behaviors.assaultive} /> Assaultive</td>
                  <td style={tdStyle}><Checkbox checked={formData.psychSocial.behaviors.resistiveToCare} /> Resistive to Care</td>
                </tr>
                <tr>
                  <td style={altRowStyle}><Checkbox checked={formData.psychSocial.behaviors.depression} /> Depression</td>
                  <td style={altRowStyle}><Checkbox checked={formData.psychSocial.behaviors.anxiety} /> Anxiety</td>
                  <td style={altRowStyle}><Checkbox checked={formData.psychSocial.behaviors.irritability} /> Irritability</td>
                  <td style={altRowStyle}><Checkbox checked={formData.psychSocial.behaviors.disorientation} /> Disorientation</td>
                </tr>
                <tr>
                  <td style={tdStyle}><Checkbox checked={formData.psychSocial.behaviors.wanderingPacing} /> Wandering/Pacing</td>
                  <td style={tdStyle}><Checkbox checked={formData.psychSocial.behaviors.exitSeeking} /> Exit Seeking</td>
                  <td style={tdStyle}><Checkbox checked={formData.psychSocial.behaviors.hallucinations} /> Hallucinations</td>
                  <td style={tdStyle}><Checkbox checked={formData.psychSocial.behaviors.delusions} /> Delusions</td>
                </tr>
                <tr>
                  <td style={altRowStyle}><Checkbox checked={formData.psychSocial.behaviors.verballyAgitated} /> Verbally Agitated</td>
                  <td style={altRowStyle}><Checkbox checked={formData.psychSocial.behaviors.physicallyAgitated} /> Physically Agitated</td>
                  <td style={altRowStyle}><Checkbox checked={formData.psychSocial.behaviors.suicidalIdeation} /> Suicidal Ideation</td>
                  <td style={altRowStyle}><Checkbox checked={formData.psychSocial.behaviors.inappropriateBehavior} /> Inappropriate Behavior</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 9: Activities of Daily Living (ADLs) */}
          <div className="page-break mb-6">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={3} style={sectionHeaderStyle}>
                    SECTION 9: ACTIVITIES OF DAILY LIVING (ADLs)
                  </td>
                </tr>
                <tr>
                  <th style={{ ...thStyle, width: '30%' }}>Area/Topic</th>
                  <th style={{ ...thStyle, width: '35%' }}>Resident Strengths & Abilities</th>
                  <th style={{ ...thStyle, width: '35%' }}>Assistance Required</th>
                </tr>
              </thead>
              <tbody>
                {/* Ambulation */}
                <tr>
                  <td style={tdStyle}>
                    <strong>Ambulation/Mobility</strong>
                    <br />In Room: {formatLevel(formData.adls.ambulation.inRoomLevel)}
                    <br />Outside: {formatLevel(formData.adls.ambulation.outsideLevel)}
                    <br /><Checkbox checked={formData.adls.ambulation.fallRisk} /> Fall Risk
                  </td>
                  <td style={tdStyle}>
                    {formData.adls.ambulation.strengths || '—'}
                    <br />Equipment: {formData.adls.ambulation.equipment || '—'}
                  </td>
                  <td style={tdStyle}>
                    {formData.adls.ambulation.assistance || '—'}
                    {formData.adls.ambulation.fallRisk && formData.adls.ambulation.fallPreventionPlan && (
                      <><br />Fall Prevention: {formData.adls.ambulation.fallPreventionPlan}</>
                    )}
                  </td>
                </tr>
                {/* Bed Mobility */}
                <tr>
                  <td style={altRowStyle}>
                    <strong>Bed Mobility/Transfer</strong>
                    <br />Level: {formatLevel(formData.adls.bedMobility.level)}
                    <br /><Checkbox checked={formData.adls.bedMobility.skinCareNeeded} /> Skin Care
                    <br /><Checkbox checked={formData.adls.bedMobility.bedFallRisk} /> Fall Risk
                  </td>
                  <td style={altRowStyle}>
                    {formData.adls.bedMobility.strengths || '—'}
                    <br />Devices: {formData.adls.bedMobility.devices.hoyerLift ? 'Hoyer Lift ' : ''}{formData.adls.bedMobility.devices.transferPole ? 'Transfer Pole ' : ''}
                  </td>
                  <td style={altRowStyle}>
                    {formData.adls.bedMobility.assistance || '—'}
                    {formData.adls.bedMobility.turningRepositioning && (
                      <><br />Turning: {formData.adls.bedMobility.turningFrequency || '—'}</>
                    )}
                  </td>
                </tr>
                {/* Eating */}
                <tr>
                  <td style={tdStyle}>
                    <strong>Eating</strong>
                    <br />Level: {formatLevel(formData.adls.eating.level)}
                  </td>
                  <td style={tdStyle}>
                    {formData.adls.eating.strengths || '—'}
                    <br />Diet: {formData.adls.eating.specialDiet || '—'}
                    <br />Allergies: {formData.adls.eating.foodAllergies || '—'}
                  </td>
                  <td style={tdStyle}>
                    {formData.adls.eating.assistance || '—'}
                    <br />Equipment: {formData.adls.eating.equipment || '—'}
                  </td>
                </tr>
                {/* Toileting */}
                <tr>
                  <td style={altRowStyle}>
                    <strong>Toileting/Continence</strong>
                    <br />Level: {formatLevel(formData.adls.toileting.level)}
                    <br /><Checkbox checked={formData.adls.toileting.bladderIncontinence} /> Bladder
                    <br /><Checkbox checked={formData.adls.toileting.bowelIncontinence} /> Bowel
                  </td>
                  <td style={altRowStyle}>
                    {formData.adls.toileting.strengths || '—'}
                    <br />Frequency: {formData.adls.toileting.frequency || '—'}
                  </td>
                  <td style={altRowStyle}>
                    {formData.adls.toileting.assistance || '—'}
                    <br />Equipment: {formData.adls.toileting.equipment || '—'}
                  </td>
                </tr>
                {/* Dressing */}
                <tr>
                  <td style={tdStyle}>
                    <strong>Dressing</strong>
                    <br />Level: {formatLevel(formData.adls.dressing.level)}
                  </td>
                  <td style={tdStyle}>{formData.adls.dressing.strengths || '—'}</td>
                  <td style={tdStyle}>
                    {formData.adls.dressing.assistance || '—'}
                    <br />Equipment: {formData.adls.dressing.equipment || '—'}
                  </td>
                </tr>
                {/* Personal Hygiene */}
                <tr>
                  <td style={altRowStyle}>
                    <strong>Personal Hygiene</strong>
                    <br />Level: {formatLevel(formData.adls.hygiene.level)}
                    <br />Teeth: {formData.adls.hygiene.teethType || '—'}
                  </td>
                  <td style={altRowStyle}>
                    {formData.adls.hygiene.strengths || '—'}
                    <br />Oral: <Checkbox checked={formData.adls.hygiene.oralHygiene.brushing} /> Brush <Checkbox checked={formData.adls.hygiene.oralHygiene.flossing} /> Floss
                  </td>
                  <td style={altRowStyle}>
                    {formData.adls.hygiene.assistance || '—'}
                    <br />Frequency: {formData.adls.hygiene.frequency || '—'}
                  </td>
                </tr>
                {/* Bathing */}
                <tr>
                  <td style={tdStyle}>
                    <strong>Bathing</strong>
                    <br />Level: {formatLevel(formData.adls.bathing.level)}
                  </td>
                  <td style={tdStyle}>
                    {formData.adls.bathing.strengths || '—'}
                    <br />Frequency: {formData.adls.bathing.frequency || '—'}
                  </td>
                  <td style={tdStyle}>
                    {formData.adls.bathing.assistance || '—'}
                    <br />Equipment: {formData.adls.bathing.equipment || '—'}
                  </td>
                </tr>
                {/* Foot Care */}
                <tr>
                  <td style={altRowStyle}>
                    <strong>Foot Care</strong>
                    <br />Level: {formatLevel(formData.adls.footCare.level)}
                    <br /><Checkbox checked={formData.adls.footCare.diabeticFootCare} /> Diabetic Care
                  </td>
                  <td style={altRowStyle}>
                    {formData.adls.footCare.strengths || '—'}
                    <br />Frequency: {formData.adls.footCare.frequency || '—'}
                  </td>
                  <td style={altRowStyle}>
                    {formData.adls.footCare.assistance || '—'}
                    <br />Home Health: {formData.adls.footCare.homeHealth || '—'}
                  </td>
                </tr>
                {/* Skin Care */}
                <tr>
                  <td style={tdStyle}>
                    <strong>Skin Care</strong>
                    <br />Level: {formatLevel(formData.adls.skinCare.level)}
                    <br /><Checkbox checked={formData.adls.skinCare.skinProblems} /> Skin Problems
                    <br /><Checkbox checked={formData.adls.skinCare.pressureInjuries} /> Pressure Injuries
                  </td>
                  <td style={tdStyle}>
                    {formData.adls.skinCare.strengths || '—'}
                    {formData.adls.skinCare.skinProblems && <><br />Issues: {formData.adls.skinCare.skinProblemsDescription || '—'}</>}
                  </td>
                  <td style={tdStyle}>
                    {formData.adls.skinCare.assistance || '—'}
                    <br /><Checkbox checked={formData.adls.skinCare.dressingChanges} /> Dressing Changes: {formData.adls.skinCare.dressingChangesFrequency || '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 10: Instrumental ADLs */}
          <div className="page-break mb-6">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={3} style={sectionHeaderStyle}>
                    SECTION 10: INSTRUMENTAL ACTIVITIES OF DAILY LIVING (IADLs)
                  </td>
                </tr>
                <tr>
                  <th style={{ ...thStyle, width: '30%' }}>Area/Topic</th>
                  <th style={{ ...thStyle, width: '35%' }}>Resident Strengths & Abilities</th>
                  <th style={{ ...thStyle, width: '35%' }}>Assistance Required</th>
                </tr>
              </thead>
              <tbody>
                {/* Finances */}
                <tr>
                  <td style={tdStyle}>
                    <strong>Managing Finances</strong>
                    <br />Level: {formatLevel(formData.iadls.finances.level)}
                  </td>
                  <td style={tdStyle}>
                    {formData.iadls.finances.strengths || '—'}
                    <br />Managed by: {formData.iadls.finances.whoManagesFinances || '—'}
                  </td>
                  <td style={tdStyle}>
                    {formData.iadls.finances.assistance || '—'}
                    <br />Payee: {formData.iadls.finances.payeeName || '—'}
                  </td>
                </tr>
                {/* Shopping */}
                <tr>
                  <td style={altRowStyle}>
                    <strong>Shopping</strong>
                    <br />Level: {formatLevel(formData.iadls.shopping.level)}
                  </td>
                  <td style={altRowStyle}>
                    {formData.iadls.shopping.strengths || '—'}
                    <br />Transport: {formData.iadls.shopping.transportNeeds || '—'}
                  </td>
                  <td style={altRowStyle}>
                    {formData.iadls.shopping.assistance || '—'}
                    <br />Frequency: {formData.iadls.shopping.frequency || '—'}
                  </td>
                </tr>
                {/* Transportation */}
                <tr>
                  <td style={tdStyle}>
                    <strong>Transportation</strong>
                    <br />Level: {formatLevel(formData.iadls.transportation.level)}
                    <br /><Checkbox checked={formData.iadls.transportation.escortRequired} /> Escort Required
                  </td>
                  <td style={tdStyle}>
                    {formData.iadls.transportation.strengths || '—'}
                    <br />Medical Transport: {formData.iadls.transportation.medicalTransportNeeds || '—'}
                  </td>
                  <td style={tdStyle}>
                    {formData.iadls.transportation.assistance || '—'}
                    <br />Special Needs: {formData.iadls.transportation.specialTransportNeeds || '—'}
                  </td>
                </tr>
                {/* Activities/Social */}
                <tr>
                  <td style={altRowStyle}>
                    <strong>Activities/Social</strong>
                    <br />Level: {formatLevel(formData.iadls.activities.level)}
                  </td>
                  <td style={altRowStyle}>
                    {formData.iadls.activities.strengths || '—'}
                    <br />Interests: {formData.iadls.activities.interests || '—'}
                  </td>
                  <td style={altRowStyle}>
                    {formData.iadls.activities.assistance || '—'}
                    <br />Clubs/Groups: {formData.iadls.activities.clubsGroupsDayHealth || '—'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Activity Preferences */}
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={{ ...sectionHeaderStyle, backgroundColor: NCP_COLORS.alternateRowBg, color: NCP_COLORS.mainText }}>
                    Activity Preferences
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}><Checkbox checked={formData.iadls.activityPreferences.reading} /> Reading</td>
                  <td style={tdStyle}><Checkbox checked={formData.iadls.activityPreferences.audioBooks} /> Audio Books</td>
                  <td style={tdStyle}><Checkbox checked={formData.iadls.activityPreferences.storytelling} /> Storytelling</td>
                  <td style={tdStyle}><Checkbox checked={formData.iadls.activityPreferences.phoneConversations} /> Phone Conversations</td>
                </tr>
                <tr>
                  <td style={altRowStyle}><Checkbox checked={formData.iadls.activityPreferences.reminiscing} /> Reminiscing</td>
                  <td style={altRowStyle}><Checkbox checked={formData.iadls.activityPreferences.currentEvents} /> Current Events</td>
                  <td style={altRowStyle}><Checkbox checked={formData.iadls.activityPreferences.bibleStudyChurch} /> Bible Study/Church</td>
                  <td style={altRowStyle}><Checkbox checked={formData.iadls.activityPreferences.visitors} /> Visitors</td>
                </tr>
                <tr>
                  <td style={tdStyle}><Checkbox checked={formData.iadls.activityPreferences.gardening} /> Gardening</td>
                  <td style={tdStyle}><Checkbox checked={formData.iadls.activityPreferences.outingsWithFamily} /> Outings w/Family</td>
                  <td style={tdStyle}><Checkbox checked={formData.iadls.activityPreferences.petsAnimals} /> Pets/Animals</td>
                  <td style={tdStyle}><Checkbox checked={formData.iadls.activityPreferences.exercisesROM} /> Exercises/ROM</td>
                </tr>
                <tr>
                  <td style={altRowStyle}><Checkbox checked={formData.iadls.activityPreferences.watchingTVMovies} /> TV/Movies</td>
                  <td style={altRowStyle}><Checkbox checked={formData.iadls.activityPreferences.artsCrafts} /> Arts & Crafts</td>
                  <td style={altRowStyle}><Checkbox checked={formData.iadls.activityPreferences.musicSinging} /> Music/Singing</td>
                  <td style={altRowStyle}><Checkbox checked={formData.iadls.activityPreferences.tableGamesBingoCardsPuzzles} /> Games/Bingo/Puzzles</td>
                </tr>
              </tbody>
            </table>

            {/* Case Management */}
            {formData.iadls.caseManagement.receivesCaseManagement && (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <td colSpan={2} style={{ ...sectionHeaderStyle, backgroundColor: NCP_COLORS.alternateRowBg, color: NCP_COLORS.mainText }}>
                      Case Management
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...thStyle, width: '30%' }}>Case Manager:</td>
                    <td style={tdStyle}>{formData.iadls.caseManagement.caseManagerName || '—'}</td>
                  </tr>
                  <tr>
                    <td style={thStyle}>Agency:</td>
                    <td style={altRowStyle}>{formData.iadls.caseManagement.caseManagerAgency || '—'}</td>
                  </tr>
                  <tr>
                    <td style={thStyle}>Phone:</td>
                    <td style={tdStyle}>{formData.iadls.caseManagement.caseManagerPhone || '—'}</td>
                  </tr>
                  <tr>
                    <td style={thStyle}>Email:</td>
                    <td style={altRowStyle}>{formData.iadls.caseManagement.caseManagerEmail || '—'}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Section 11: Review & Signatures */}
          <div className="page-break mb-6">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={sectionHeaderStyle}>
                    SECTION 11: REVIEW & SIGNATURES
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} style={tdStyle}>
                    <strong>NCP Review Information:</strong>
                    <br />{formData.signatures.ncpReviewInfo || 'The NCP will be reviewed and updated at least annually, or when there is a significant change in the resident\'s condition.'}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} style={altRowStyle}>
                    <strong>Resident Participation:</strong> {formData.signatures.residentParticipation || '—'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Involved in NCP Development */}
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={{ ...sectionHeaderStyle, backgroundColor: NCP_COLORS.alternateRowBg, color: NCP_COLORS.mainText }}>
                    Involved in NCP Development
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}><Checkbox checked={formData.signatures.involved.resident} /> Resident</td>
                  <td style={tdStyle}><Checkbox checked={formData.signatures.involved.residentRep} /> Resident Representative</td>
                  <td style={tdStyle}><Checkbox checked={formData.signatures.involved.parent} /> Parent</td>
                  <td style={tdStyle}><Checkbox checked={formData.signatures.involved.healthProfessional} /> Health Professional</td>
                </tr>
                <tr>
                  <td style={altRowStyle}><Checkbox checked={formData.signatures.involved.other1} /> Other: {formData.signatures.involved.other1Name || '—'}</td>
                  <td style={altRowStyle}><Checkbox checked={formData.signatures.involved.other2} /> Other: {formData.signatures.involved.other2Name || '—'}</td>
                  <td colSpan={2} style={altRowStyle}><Checkbox checked={formData.signatures.involved.other3} /> Other: {formData.signatures.involved.other3Name || '—'}</td>
                </tr>
              </tbody>
            </table>

            {/* Dates and Agreements */}
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={{ ...thStyle, width: '30%' }}>Date of Original Plan:</td>
                  <td style={{ ...tdStyle, width: '20%' }}>{formData.signatures.dateOfOriginalPlan || '—'}</td>
                  <td style={{ ...thStyle, width: '25%' }}>Review Dates:</td>
                  <td style={tdStyle}>{formData.signatures.reviewDates || '—'}</td>
                </tr>
                <tr>
                  <td style={thStyle}>NCP Sent to Case Manager:</td>
                  <td style={altRowStyle}>
                    <Checkbox checked={formData.signatures.ncpSentToCM} /> Yes
                    {formData.signatures.ncpSentToCM && ` Date: ${formData.signatures.ncpSentToCMDate || '—'}`}
                  </td>
                  <td style={thStyle}>Resident Verbally Agreed:</td>
                  <td style={altRowStyle}>
                    <Checkbox checked={formData.signatures.residentVerballyAgreed} /> Yes
                    {formData.signatures.residentVerballyAgreed && ` Date: ${formData.signatures.residentVerballyAgreedDate || '—'}`}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Signature Lines */}
            <table style={{ ...tableStyle, marginTop: '24px' }}>
              <thead>
                <tr>
                  <td colSpan={3} style={{ ...sectionHeaderStyle, backgroundColor: NCP_COLORS.alternateRowBg, color: NCP_COLORS.mainText }}>
                    Signatures
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...tdStyle, width: '35%' }}>
                    <strong>Resident/Representative:</strong>
                    <div style={{ borderBottom: `1px solid ${NCP_COLORS.mainText}`, height: '30px', marginTop: '8px' }}></div>
                  </td>
                  <td style={{ ...tdStyle, width: '35%' }}>
                    <strong>Signature:</strong>
                    <div style={{ borderBottom: `1px solid ${NCP_COLORS.mainText}`, height: '30px', marginTop: '8px' }}></div>
                  </td>
                  <td style={tdStyle}>
                    <strong>Date:</strong>
                    <div style={{ borderBottom: `1px solid ${NCP_COLORS.mainText}`, height: '30px', marginTop: '8px' }}></div>
                  </td>
                </tr>
                <tr>
                  <td style={altRowStyle}>
                    <strong>AFH Provider:</strong>
                    <div style={{ borderBottom: `1px solid ${NCP_COLORS.mainText}`, height: '30px', marginTop: '8px' }}></div>
                  </td>
                  <td style={altRowStyle}>
                    <strong>Signature:</strong>
                    <div style={{ borderBottom: `1px solid ${NCP_COLORS.mainText}`, height: '30px', marginTop: '8px' }}></div>
                  </td>
                  <td style={altRowStyle}>
                    <strong>Date:</strong>
                    <div style={{ borderBottom: `1px solid ${NCP_COLORS.mainText}`, height: '30px', marginTop: '8px' }}></div>
                  </td>
                </tr>
                <tr>
                  <td style={tdStyle}>
                    <strong>Case Manager (if applicable):</strong>
                    <div style={{ borderBottom: `1px solid ${NCP_COLORS.mainText}`, height: '30px', marginTop: '8px' }}></div>
                  </td>
                  <td style={tdStyle}>
                    <strong>Signature:</strong>
                    <div style={{ borderBottom: `1px solid ${NCP_COLORS.mainText}`, height: '30px', marginTop: '8px' }}></div>
                  </td>
                  <td style={tdStyle}>
                    <strong>Date:</strong>
                    <div style={{ borderBottom: `1px solid ${NCP_COLORS.mainText}`, height: '30px', marginTop: '8px' }}></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Abbreviations Table (Last Page) */}
          <div className="page-break mt-8">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <td colSpan={4} style={sectionHeaderStyle}>
                    ABBREVIATIONS
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}><strong>ADL</strong> = Activities of Daily Living</td>
                  <td style={tdStyle}><strong>DPOA</strong> = Durable Power of Attorney</td>
                  <td style={tdStyle}><strong>MD</strong> = Medical Doctor</td>
                  <td style={tdStyle}><strong>PCP</strong> = Primary Care Physician</td>
                </tr>
                <tr>
                  <td style={altRowStyle}><strong>AFH</strong> = Adult Family Home</td>
                  <td style={altRowStyle}><strong>CG</strong> = Caregiver</td>
                  <td style={altRowStyle}><strong>MAR</strong> = Medication Assistance Record</td>
                  <td style={altRowStyle}><strong>W/c</strong> = Wheelchair</td>
                </tr>
                <tr>
                  <td style={tdStyle}><strong>iADL</strong> = Instrumental ADL</td>
                  <td style={tdStyle}><strong>DNR</strong> = Do Not Resuscitate</td>
                  <td style={tdStyle}><strong>POLST</strong> = Physician Orders for Life-Sustaining Treatment</td>
                  <td style={tdStyle}><strong>RN</strong> = Registered Nurse</td>
                </tr>
                <tr>
                  <td style={altRowStyle}><strong>NCP</strong> = Negotiated Care Plan</td>
                  <td style={altRowStyle}><strong>PT/OT/ST</strong> = Physical/Occupational/Speech Therapy</td>
                  <td style={altRowStyle}><strong>ROM</strong> = Range of Motion</td>
                  <td style={altRowStyle}><strong>WAC</strong> = Washington Administrative Code</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Print Footer - visible only when printing */}
          <div className="print-only-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt' }}>
              <span>Resident's Name: {residentName}</span>
              <span>Page ___ of ___</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
