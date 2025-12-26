import { useState } from "react";
import { useStaffAuth } from "@/lib/staff-auth";
import { StaffLayout } from "@/components/staff/staff-layout";
import { CarePortalHome } from "@/components/staff/care-portal-home";
import { AddNoteDialog } from "@/components/staff/add-note-dialog";
import { FileIncidentDialog } from "@/components/staff/file-incident-dialog";
import { useLocation } from "wouter";

export default function StaffDashboard() {
  const { staff } = useStaffAuth();
  const [, navigate] = useLocation();
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [addNoteResidentId, setAddNoteResidentId] = useState<string | undefined>();
  const [fileIncidentOpen, setFileIncidentOpen] = useState(false);
  const [fileIncidentResidentId, setFileIncidentResidentId] = useState<string | undefined>();

  const facilityId = staff?.facilityId;

  const handleLogMedication = (residentId?: string) => {
    if (residentId) {
      navigate(`/staff/mar?residentId=${residentId}`);
    } else {
      navigate("/staff/mar");
    }
  };

  const handleAddNote = (residentId?: string) => {
    setAddNoteResidentId(residentId);
    setAddNoteOpen(true);
  };

  const handleFileIncident = (residentId?: string) => {
    setFileIncidentResidentId(residentId);
    setFileIncidentOpen(true);
  };

  const handleViewSchedule = () => {
    navigate("/staff/mar");
  };

  return (
    <StaffLayout>
      <CarePortalHome
        staffName={staff?.firstName || "Staff"}
        facilityId={facilityId || ""}
        onLogMedication={handleLogMedication}
        onAddNote={handleAddNote}
        onFileIncident={handleFileIncident}
        onViewSchedule={handleViewSchedule}
      />

      {/* Add Note Dialog */}
      <AddNoteDialog
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
        preselectedResidentId={addNoteResidentId}
      />

      {/* File Incident Dialog */}
      <FileIncidentDialog
        open={fileIncidentOpen}
        onOpenChange={setFileIncidentOpen}
        preselectedResidentId={fileIncidentResidentId}
      />
    </StaffLayout>
  );
}
