import { db } from "../db";
import { activityLog } from "../../shared/schema";
import type { Request } from "express";

export type ActivityAction =
  | 'create' | 'update' | 'delete' | 'view'
  | 'login' | 'logout' | 'login_failed'
  | 'print' | 'submit'
  | 'give' | 'miss' | 'refuse'
  | 'expire' | 'renew' | 'resolve' | 'discharge';

export type ActivityCategory =
  | 'auth' | 'resident' | 'staff' | 'medication'
  | 'incident' | 'form' | 'credential' | 'settings'
  | 'transport' | 'inquiry' | 'facility';

interface LogActivityParams {
  req?: Request;
  userId?: string;
  userType?: 'owner' | 'staff' | 'admin' | 'system';
  userName?: string;
  action: ActivityAction;
  category: ActivityCategory;
  description: string;
  facilityId?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, any>;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const {
      req,
      userId,
      userType,
      userName,
      action,
      category,
      description,
      facilityId,
      entityType,
      entityId,
      entityName,
      metadata,
    } = params;

    await db.insert(activityLog).values({
      userId,
      userType,
      userName,
      action,
      category,
      description,
      facilityId,
      entityType,
      entityId,
      entityName,
      metadata,
      ipAddress: req?.ip || req?.headers['x-forwarded-for']?.toString() || null,
      userAgent: req?.headers['user-agent'] || null,
    });
  } catch (error) {
    // Don't let logging errors break the main flow
    console.error('Failed to log activity:', error);
  }
}

// Convenience functions for common actions
export const ActivityLogger = {
  // ============== Auth ==============
  login: (req: Request, userId: string, userName: string, userType: 'owner' | 'staff', facilityId?: string) =>
    logActivity({
      req, userId, userName, userType,
      action: 'login',
      category: 'auth',
      description: `${userName} logged in`,
      facilityId
    }),

  logout: (req: Request, userId: string, userName: string, userType: 'owner' | 'staff', facilityId?: string) =>
    logActivity({
      req, userId, userName, userType,
      action: 'logout',
      category: 'auth',
      description: `${userName} logged out`,
      facilityId
    }),

  loginFailed: (req: Request, email: string) =>
    logActivity({
      req,
      userType: 'system',
      action: 'login_failed',
      category: 'auth',
      description: `Failed login attempt for ${email}`,
      metadata: { email }
    }),

  // ============== Residents ==============
  residentCreated: (req: Request, userId: string, userName: string, facilityId: string, residentId: string, residentName: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'create',
      category: 'resident',
      description: `Added resident: ${residentName}`,
      facilityId,
      entityType: 'resident',
      entityId: residentId,
      entityName: residentName
    }),

  residentUpdated: (req: Request, userId: string, userName: string, facilityId: string, residentId: string, residentName: string, changes?: Record<string, any>) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'update',
      category: 'resident',
      description: `Updated resident: ${residentName}`,
      facilityId,
      entityType: 'resident',
      entityId: residentId,
      entityName: residentName,
      metadata: changes
    }),

  residentDischarged: (req: Request, userId: string, userName: string, facilityId: string, residentId: string, residentName: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'discharge',
      category: 'resident',
      description: `Discharged resident: ${residentName}`,
      facilityId,
      entityType: 'resident',
      entityId: residentId,
      entityName: residentName
    }),

  // ============== Staff ==============
  staffCreated: (req: Request, userId: string, userName: string, facilityId: string, staffId: string, staffName: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'create',
      category: 'staff',
      description: `Added staff member: ${staffName}`,
      facilityId,
      entityType: 'staff',
      entityId: staffId,
      entityName: staffName
    }),

  staffUpdated: (req: Request, userId: string, userName: string, facilityId: string, staffId: string, staffName: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'update',
      category: 'staff',
      description: `Updated staff member: ${staffName}`,
      facilityId,
      entityType: 'staff',
      entityId: staffId,
      entityName: staffName
    }),

  staffRemoved: (req: Request, userId: string, userName: string, facilityId: string, staffId: string, staffName: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'delete',
      category: 'staff',
      description: `Removed staff member: ${staffName}`,
      facilityId,
      entityType: 'staff',
      entityId: staffId,
      entityName: staffName
    }),

  // ============== Medications ==============
  medicationGiven: (req: Request, userId: string, userName: string, facilityId: string, residentId: string, residentName: string, medicationName: string) =>
    logActivity({
      req, userId, userName, userType: 'staff',
      action: 'give',
      category: 'medication',
      description: `Gave ${medicationName} to ${residentName}`,
      facilityId,
      entityType: 'medication',
      entityId: residentId,
      entityName: residentName,
      metadata: { medication: medicationName }
    }),

  medicationMissed: (req: Request, userId: string, userName: string, facilityId: string, residentId: string, residentName: string, medicationName: string, reason: string) =>
    logActivity({
      req, userId, userName, userType: 'staff',
      action: 'miss',
      category: 'medication',
      description: `Missed ${medicationName} for ${residentName}: ${reason}`,
      facilityId,
      entityType: 'medication',
      entityId: residentId,
      entityName: residentName,
      metadata: { medication: medicationName, reason }
    }),

  medicationRefused: (req: Request, userId: string, userName: string, facilityId: string, residentId: string, residentName: string, medicationName: string) =>
    logActivity({
      req, userId, userName, userType: 'staff',
      action: 'refuse',
      category: 'medication',
      description: `${residentName} refused ${medicationName}`,
      facilityId,
      entityType: 'medication',
      entityId: residentId,
      entityName: residentName,
      metadata: { medication: medicationName }
    }),

  // ============== Incidents ==============
  incidentFiled: (req: Request, userId: string, userName: string, facilityId: string, incidentId: string, incidentType: string, residentName?: string) =>
    logActivity({
      req, userId, userName, userType: 'staff',
      action: 'create',
      category: 'incident',
      description: `Filed ${incidentType} incident${residentName ? ` for ${residentName}` : ''}`,
      facilityId,
      entityType: 'incident',
      entityId: incidentId,
      metadata: { type: incidentType, residentName }
    }),

  incidentUpdated: (req: Request, userId: string, userName: string, facilityId: string, incidentId: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'update',
      category: 'incident',
      description: `Updated incident #${incidentId}`,
      facilityId,
      entityType: 'incident',
      entityId: incidentId
    }),

  incidentResolved: (req: Request, userId: string, userName: string, facilityId: string, incidentId: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'resolve',
      category: 'incident',
      description: `Resolved incident #${incidentId}`,
      facilityId,
      entityType: 'incident',
      entityId: incidentId
    }),

  // ============== Forms ==============
  formStarted: (req: Request, userId: string, userName: string, facilityId: string, formType: string, formId: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'create',
      category: 'form',
      description: `Started ${formType} form`,
      facilityId,
      entityType: 'form',
      entityId: formId,
      metadata: { formType }
    }),

  formSubmitted: (req: Request, userId: string, userName: string, facilityId: string, formType: string, formId: string, residentName?: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'submit',
      category: 'form',
      description: `Submitted ${formType}${residentName ? ` for ${residentName}` : ''}`,
      facilityId,
      entityType: 'form',
      entityId: formId,
      metadata: { formType, residentName }
    }),

  formPrinted: (req: Request, userId: string, userName: string, facilityId: string, formType: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'print',
      category: 'form',
      description: `Printed ${formType}`,
      facilityId,
      entityType: 'form',
      metadata: { formType }
    }),

  // ============== Credentials ==============
  credentialAdded: (req: Request, userId: string, userName: string, facilityId: string, credentialId: string, credentialName: string, staffName: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'create',
      category: 'credential',
      description: `Added credential "${credentialName}" for ${staffName}`,
      facilityId,
      entityType: 'credential',
      entityId: credentialId,
      entityName: credentialName,
      metadata: { staffName }
    }),

  credentialExpired: (facilityId: string, credentialId: string, credentialName: string, staffName: string) =>
    logActivity({
      userType: 'system',
      action: 'expire',
      category: 'credential',
      description: `Credential "${credentialName}" expired for ${staffName}`,
      facilityId,
      entityType: 'credential',
      entityId: credentialId,
      entityName: credentialName,
      metadata: { staffName }
    }),

  credentialRenewed: (req: Request, userId: string, userName: string, facilityId: string, credentialId: string, credentialName: string, staffName: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'renew',
      category: 'credential',
      description: `Renewed credential "${credentialName}" for ${staffName}`,
      facilityId,
      entityType: 'credential',
      entityId: credentialId,
      entityName: credentialName,
      metadata: { staffName }
    }),

  // ============== Settings ==============
  settingsUpdated: (req: Request, userId: string, userName: string, facilityId: string, settingName: string, changes?: Record<string, any>) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'update',
      category: 'settings',
      description: `Updated ${settingName}`,
      facilityId,
      entityType: 'settings',
      metadata: { setting: settingName, ...changes }
    }),

  // ============== Facility ==============
  facilityUpdated: (req: Request, userId: string, userName: string, facilityId: string, facilityName: string, changes?: Record<string, any>) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'update',
      category: 'facility',
      description: `Updated facility: ${facilityName}`,
      facilityId,
      entityType: 'facility',
      entityId: facilityId,
      entityName: facilityName,
      metadata: changes
    }),

  // ============== Transport ==============
  transportBooked: (req: Request, userId: string, userName: string, facilityId: string, bookingId: string, providerName: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'create',
      category: 'transport',
      description: `Booked transport with ${providerName}`,
      facilityId,
      entityType: 'transport_booking',
      entityId: bookingId,
      metadata: { provider: providerName }
    }),

  // ============== Inquiries ==============
  inquiryReceived: (facilityId: string, inquiryId: string, inquirerName: string) =>
    logActivity({
      userType: 'system',
      action: 'create',
      category: 'inquiry',
      description: `New inquiry from ${inquirerName}`,
      facilityId,
      entityType: 'inquiry',
      entityId: inquiryId,
      entityName: inquirerName
    }),

  inquiryResponded: (req: Request, userId: string, userName: string, facilityId: string, inquiryId: string, inquirerName: string) =>
    logActivity({
      req, userId, userName, userType: 'owner',
      action: 'update',
      category: 'inquiry',
      description: `Responded to inquiry from ${inquirerName}`,
      facilityId,
      entityType: 'inquiry',
      entityId: inquiryId,
      entityName: inquirerName
    }),
};
