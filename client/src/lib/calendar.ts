export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
}

function formatDateForGoogle(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function formatDateForOutlook(date: Date): string {
  return date.toISOString();
}

function formatDateForICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDateForGoogle(event.startDate)}/${formatDateForGoogle(event.endDate)}`,
    details: event.description,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: formatDateForOutlook(event.startDate),
    enddt: formatDateForOutlook(event.endDate),
    body: event.description,
    location: event.location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function generateOutlook365CalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: formatDateForOutlook(event.startDate),
    enddt: formatDateForOutlook(event.endDate),
    body: event.description,
    location: event.location,
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function generateICSContent(event: CalendarEvent): string {
  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@okapicare.com`;
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Okapi Care Network//Calendar//EN
BEGIN:VEVENT
UID:${uid}
DTSTART:${formatDateForICS(event.startDate)}
DTEND:${formatDateForICS(event.endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;
}

export function downloadICSFile(event: CalendarEvent, filename: string = 'event.ics'): void {
  const icsContent = generateICSContent(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function createTourEvent(
  facilityName: string,
  facilityAddress: string,
  tourDate: Date,
  durationMinutes: number = 60
): CalendarEvent {
  const endDate = new Date(tourDate.getTime() + durationMinutes * 60 * 1000);
  
  return {
    title: `Facility Tour - ${facilityName}`,
    description: `Scheduled tour at ${facilityName}.\n\nPlease arrive a few minutes early. Bring any questions you have about care services, pricing, or availability.\n\nBooked via Okapi Care Network`,
    location: facilityAddress,
    startDate: tourDate,
    endDate: endDate,
  };
}

export function createAppointmentEvent(
  title: string,
  description: string,
  location: string,
  appointmentDate: Date,
  durationMinutes: number = 60
): CalendarEvent {
  const endDate = new Date(appointmentDate.getTime() + durationMinutes * 60 * 1000);
  
  return {
    title,
    description: `${description}\n\nBooked via Okapi Care Network`,
    location,
    startDate: appointmentDate,
    endDate: endDate,
  };
}
