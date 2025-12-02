import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeamMembers, getFacility, createTeamMember } from "@/lib/api";
import { 
  User, Briefcase, GraduationCap, ShieldCheck, AlertCircle, CheckCircle2, 
  Clock, FileText, Upload, Mail, X, Plus, Users, Loader2, Home, Settings,
  MessageSquare, BarChart3, Star
} from "lucide-react";

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState("team");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteType, setInviteType] = useState<"invite" | "manual">("invite");
  const queryClient = useQueryClient();
  
  const FACILITY_ID = "3c173ee5-0573-4979-8686-f21f5beb8778";
  
  const { data: facility, isLoading: facilityLoading } = useQuery({
    queryKey: ["facility", FACILITY_ID],
    queryFn: async () => {
      const facilities = await getFacility(FACILITY_ID);
      return facilities;
    },
    retry: false,
  });

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ["team-members", FACILITY_ID],
    queryFn: async () => {
      const members = await getTeamMembers(FACILITY_ID);
      return members;
    },
    retry: false,
  });

  const createMemberMutation = useMutation({
    mutationFn: createTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", FACILITY_ID] });
      setShowInviteModal(false);
    },
  });
  
  const isLoading = facilityLoading || teamLoading;

  const expiringCount = teamMembers.reduce((count, member) => {
    const expiring = member.credentials?.filter(c => c.status === "Expiring Soon").length || 0;
    return count + expiring;
  }, 0);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "facility", label: "My Facility", icon: Home },
    { id: "team", label: "Team & Credentials", icon: Users },
    { id: "inquiries", label: "Inquiries", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen" style={{ 
      fontFamily: "'Cormorant', serif",
      backgroundColor: '#0d1a14'
    }}>
      {/* Texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="relative z-50 px-6 md:px-12 py-6 flex items-center justify-between border-b border-amber-900/20">
        <Link href="/" className="flex items-center gap-2">
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, color: '#c9a962', letterSpacing: '0.12em', fontSize: '1.5rem' }}>
            OKAPI
          </span>
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 300, fontStyle: 'italic', color: '#e8e4dc', fontSize: '1.5rem' }}>
            Care
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#9a978f' }}>
            Owner Portal
          </span>
          <div className="h-8 w-8 rounded-full bg-amber-900/30 border border-amber-700/30 flex items-center justify-center">
            <User className="h-4 w-4 text-amber-200" />
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="relative z-10 flex">
          {/* Sidebar */}
          <aside className="w-72 min-h-[calc(100vh-88px)] border-r border-amber-900/20 p-6">
            {/* Facility Info */}
            <div className="mb-8 p-4 rounded border border-amber-900/30 bg-amber-900/10">
              <h3 style={{ fontFamily: "'Cormorant', serif", fontSize: '1.25rem', fontWeight: 500, color: '#e8e4dc' }}>
                {facility?.name || "Your Facility"}
              </h3>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#9a978f', marginTop: '0.25rem' }}>
                {facility?.city}, WA
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#9a978f' }}>
                  License Active
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-300"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '0.85rem',
                    fontWeight: 400,
                    backgroundColor: activeTab === item.id ? 'rgba(201, 169, 98, 0.15)' : 'transparent',
                    color: activeTab === item.id ? '#c9a962' : '#9a978f',
                    border: activeTab === item.id ? '1px solid rgba(201, 169, 98, 0.3)' : '1px solid transparent'
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Okapi Academy Card */}
            <div className="mt-8 p-4 rounded border border-blue-800/30 bg-blue-900/10">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-blue-400" />
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', fontWeight: 500, color: '#60a5fa', letterSpacing: '0.1em' }}>
                  OKAPI ACADEMY
                </span>
              </div>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#9a978f', lineHeight: 1.6 }}>
                Your team has completed 12 courses this month.
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-blue-900/50 overflow-hidden">
                <div className="h-full w-3/4 bg-blue-500 rounded-full" />
              </div>
              <button 
                className="mt-4 w-full py-2 rounded border border-blue-700/50 text-blue-300 hover:bg-blue-900/30 transition-all"
                style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.1em' }}
              >
                GO TO ACADEMY
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8">
            {/* Page Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 style={{ fontFamily: "'Cormorant', serif", fontSize: '2rem', fontWeight: 400, color: '#e8e4dc' }}>
                  Team & Credentials
                </h1>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: '#9a978f', marginTop: '0.5rem' }}>
                  Manage your staff, invitations, and compliance tracking.
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-6 py-3 transition-all duration-300 hover:bg-amber-700"
                style={{ 
                  fontFamily: "'Jost', sans-serif", 
                  fontWeight: 400, 
                  letterSpacing: '0.1em', 
                  fontSize: '0.8rem', 
                  color: '#0d1a14', 
                  backgroundColor: '#c9a962' 
                }}
              >
                <Plus className="h-4 w-4" />
                ADD TEAM MEMBER
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 rounded border border-amber-900/30 bg-amber-900/5">
                <div className="flex justify-between items-start">
                  <div>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9a978f', letterSpacing: '0.1em' }}>
                      TOTAL STAFF
                    </p>
                    <p style={{ fontFamily: "'Cormorant', serif", fontSize: '2.5rem', fontWeight: 400, color: '#c9a962', marginTop: '0.5rem' }}>
                      {teamMembers.length}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded bg-amber-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded border border-green-800/30 bg-green-900/5">
                <div className="flex justify-between items-start">
                  <div>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9a978f', letterSpacing: '0.1em' }}>
                      COMPLIANCE RATE
                    </p>
                    <p style={{ fontFamily: "'Cormorant', serif", fontSize: '2.5rem', fontWeight: 400, color: '#4ade80', marginTop: '0.5rem' }}>
                      100%
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded bg-green-900/30 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded border border-amber-700/30 bg-amber-800/10">
                <div className="flex justify-between items-start">
                  <div>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#fbbf24', letterSpacing: '0.1em' }}>
                      EXPIRING SOON
                    </p>
                    <p style={{ fontFamily: "'Cormorant', serif", fontSize: '2.5rem', fontWeight: 400, color: '#fbbf24', marginTop: '0.5rem' }}>
                      {expiringCount}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded bg-amber-800/30 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Roster */}
            <div className="rounded border border-amber-900/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-900/20 flex justify-between items-center" style={{ backgroundColor: 'rgba(201, 169, 98, 0.05)' }}>
                <h3 style={{ fontFamily: "'Cormorant', serif", fontSize: '1.25rem', fontWeight: 500, color: '#e8e4dc' }}>
                  Staff Roster
                </h3>
                <input
                  type="text"
                  placeholder="Search staff..."
                  className="px-4 py-2 rounded bg-black/30 border border-amber-900/30 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-700/50"
                  style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', width: '200px' }}
                />
              </div>

              <div className="divide-y divide-amber-900/10">
                {teamMembers.map((member) => {
                  const getCredentialStatus = () => {
                    if (member.status === "Invited") return "Pending";
                    if (!member.credentials || member.credentials.length === 0) return "Pending";
                    const hasExpiring = member.credentials.some(c => c.status === "Expiring Soon");
                    if (hasExpiring) return "Expiring Soon";
                    return "Current";
                  };
                  
                  const credStatus = getCredentialStatus();
                  
                  return (
                    <div key={member.id} className="p-6 hover:bg-amber-900/5 transition-colors">
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-amber-900/30 border border-amber-700/30 flex items-center justify-center">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              <span style={{ fontFamily: "'Cormorant', serif", fontSize: '1rem', color: '#c9a962' }}>
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 style={{ fontFamily: "'Cormorant', serif", fontSize: '1.1rem', fontWeight: 500, color: '#e8e4dc' }}>
                              {member.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#9a978f' }}>
                                {member.role}
                              </span>
                              {member.status === "Invited" && (
                                <span 
                                  className="px-2 py-0.5 rounded text-xs"
                                  style={{ backgroundColor: 'rgba(201, 169, 98, 0.2)', color: '#c9a962', fontFamily: "'Jost', sans-serif" }}
                                >
                                  Invited
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#6b7c72', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                              CREDENTIALS
                            </p>
                            {credStatus === "Current" && (
                              <span 
                                className="px-3 py-1 rounded text-xs"
                                style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)', fontFamily: "'Jost', sans-serif" }}
                              >
                                Current
                              </span>
                            )}
                            {credStatus === "Expiring Soon" && (
                              <span 
                                className="px-3 py-1 rounded text-xs"
                                style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', fontFamily: "'Jost', sans-serif" }}
                              >
                                Expiring Soon
                              </span>
                            )}
                            {credStatus === "Pending" && (
                              <span 
                                className="px-3 py-1 rounded text-xs"
                                style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)', color: '#9a978f', border: '1px solid rgba(156, 163, 175, 0.3)', fontFamily: "'Jost', sans-serif" }}
                              >
                                Pending Setup
                              </span>
                            )}
                          </div>
                          
                          <button
                            className="px-4 py-2 rounded border border-amber-700/30 text-amber-200 hover:bg-amber-900/20 transition-all"
                            style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.05em' }}
                          >
                            Manage
                          </button>
                        </div>
                      </div>

                      {/* Credentials List */}
                      {member.credentials && member.credentials.length > 0 && (
                        <div className="mt-4 ml-16 space-y-2">
                          {member.credentials.map((cred) => (
                            <div 
                              key={cred.id} 
                              className="flex items-center justify-between p-3 rounded"
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(201, 169, 98, 0.1)' }}
                            >
                              <div className="flex items-center gap-3">
                                {cred.source === "Okapi Academy" ? (
                                  <Star className="h-4 w-4 text-blue-400" />
                                ) : (
                                  <FileText className="h-4 w-4 text-stone-500" />
                                )}
                                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#e8e4dc' }}>
                                  {cred.name}
                                </span>
                                <span 
                                  className="px-2 py-0.5 rounded text-xs"
                                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#9a978f', fontFamily: "'Jost', sans-serif" }}
                                >
                                  {cred.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                {cred.expiryDate && (
                                  <span style={{ 
                                    fontFamily: "'Jost', sans-serif", 
                                    fontSize: '0.75rem', 
                                    color: cred.status === "Expiring Soon" ? '#fbbf24' : '#6b7c72'
                                  }}>
                                    Expires: {new Date(cred.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                  </span>
                                )}
                                {cred.source === "Okapi Academy" && (
                                  <span 
                                    className="px-2 py-0.5 rounded text-xs"
                                    style={{ backgroundColor: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', fontFamily: "'Jost', sans-serif" }}
                                  >
                                    Okapi Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-3">
                            <button
                              className="flex items-center gap-1 px-3 py-2 rounded border border-amber-900/30 text-stone-400 hover:text-amber-200 hover:border-amber-700/50 transition-all"
                              style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.05em' }}
                            >
                              <Plus className="h-3 w-3" /> Add Credential
                            </button>
                            <button
                              className="flex items-center gap-1 px-3 py-2 rounded border border-amber-900/30 text-stone-400 hover:text-amber-200 hover:border-amber-700/50 transition-all"
                              style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.05em' }}
                            >
                              <GraduationCap className="h-3 w-3" /> Assign Training
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {member.status === "Invited" && member.email && (
                        <div className="mt-4 ml-16 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-stone-500" />
                          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#6b7c72' }}>
                            Invitation sent to {member.email}
                          </span>
                          <button 
                            className="text-amber-500 hover:text-amber-400 transition-colors"
                            style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem' }}
                          >
                            Resend
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowInviteModal(false)} />
          <div 
            className="relative w-full max-w-lg mx-4 rounded p-6"
            style={{ backgroundColor: '#0d1a14', border: '1px solid rgba(201, 169, 98, 0.3)' }}
          >
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-300"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 style={{ fontFamily: "'Cormorant', serif", fontSize: '1.5rem', fontWeight: 400, color: '#e8e4dc', marginBottom: '0.5rem' }}>
              Add Team Member
            </h2>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#9a978f', marginBottom: '1.5rem' }}>
              Add a new staff member to your facility roster.
            </p>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setInviteType("invite")}
                className="flex-1 py-2 rounded transition-all"
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '0.85rem',
                  backgroundColor: inviteType === "invite" ? 'rgba(201, 169, 98, 0.2)' : 'transparent',
                  color: inviteType === "invite" ? '#c9a962' : '#9a978f',
                  border: `1px solid ${inviteType === "invite" ? 'rgba(201, 169, 98, 0.5)' : 'rgba(201, 169, 98, 0.2)'}`
                }}
              >
                Invite via Email
              </button>
              <button
                onClick={() => setInviteType("manual")}
                className="flex-1 py-2 rounded transition-all"
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '0.85rem',
                  backgroundColor: inviteType === "manual" ? 'rgba(201, 169, 98, 0.2)' : 'transparent',
                  color: inviteType === "manual" ? '#c9a962' : '#9a978f',
                  border: `1px solid ${inviteType === "manual" ? 'rgba(201, 169, 98, 0.5)' : 'rgba(201, 169, 98, 0.2)'}`
                }}
              >
                Manual Entry
              </button>
            </div>

            {inviteType === "invite" && (
              <div className="space-y-4">
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#4ade80' }}>
                      Invited caregivers can manage their own credentials.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#4ade80' }}>
                      Okapi Academy certificates auto-sync to your dashboard.
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#9a978f', display: 'block', marginBottom: '0.5rem' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Doe"
                    className="w-full px-4 py-3 rounded bg-black/30 border border-amber-900/30 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-700/50"
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#9a978f', display: 'block', marginBottom: '0.5rem' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    className="w-full px-4 py-3 rounded bg-black/30 border border-amber-900/30 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-700/50"
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#9a978f', display: 'block', marginBottom: '0.5rem' }}>
                    Role
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded bg-black/30 border border-amber-900/30 text-stone-200 focus:outline-none focus:border-amber-700/50"
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem' }}
                  >
                    <option value="">Select role</option>
                    <option value="caregiver">Caregiver (HCA/CNA)</option>
                    <option value="manager">Resident Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
            )}

            {inviteType === "manual" && (
              <div className="space-y-4">
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#fbbf24' }}>
                      You will need to manually upload and track certificates for this user.
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#9a978f', display: 'block', marginBottom: '0.5rem' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded bg-black/30 border border-amber-900/30 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-700/50"
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#9a978f', display: 'block', marginBottom: '0.5rem' }}>
                    Role
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded bg-black/30 border border-amber-900/30 text-stone-200 focus:outline-none focus:border-amber-700/50"
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem' }}
                  >
                    <option value="">Select role</option>
                    <option value="caregiver">Caregiver (HCA/CNA)</option>
                    <option value="manager">Resident Manager</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-3 rounded border border-amber-900/30 text-stone-400 hover:text-stone-200 hover:border-amber-700/50 transition-all"
                style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-3 rounded transition-all hover:bg-amber-700"
                style={{ 
                  fontFamily: "'Jost', sans-serif", 
                  fontSize: '0.85rem', 
                  backgroundColor: '#c9a962', 
                  color: '#0d1a14' 
                }}
              >
                {inviteType === "invite" ? "Send Invitation" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
