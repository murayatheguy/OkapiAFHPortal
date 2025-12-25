import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OwnerAuthProvider } from "@/lib/owner-auth";
import { StaffAuthProvider, useStaffAuth } from "@/lib/staff-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import SearchResults from "@/pages/search-results";
import FacilityDetails from "@/pages/facility-details";
import OwnerPortal from "@/pages/owner-portal";
import OwnerLogin from "@/pages/owner-login";
import OwnerSetup from "@/pages/owner-setup";
import OwnerDashboard from "@/pages/owner-dashboard";
import AdminPage from "@/pages/admin";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import StaffLogin from "@/pages/staff/staff-login";
import StaffDashboard from "@/pages/staff/staff-dashboard";
import StaffMAR from "@/pages/staff/staff-mar";
import StaffVitals from "@/pages/staff/staff-vitals";
import StaffIncidents from "@/pages/staff/staff-incidents";
import { Loader2 } from "lucide-react";

// Protected route wrapper for staff pages
function ProtectedStaffRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useStaffAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/staff/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={SearchResults} />
      <Route path="/homes" component={SearchResults} />
      <Route path="/facility/:id" component={FacilityDetails} />
      <Route path="/homes/:id" component={FacilityDetails} />
      <Route path="/owner" component={OwnerPortal} />
      <Route path="/owner/login" component={OwnerLogin} />
      <Route path="/owner/setup" component={OwnerSetup} />
      <Route path="/owner/dashboard" component={OwnerDashboard} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      {/* Staff EHR Routes */}
      <Route path="/staff/login" component={StaffLogin} />
      <Route path="/staff/dashboard">
        {() => <ProtectedStaffRoute component={StaffDashboard} />}
      </Route>
      <Route path="/staff/mar">
        {() => <ProtectedStaffRoute component={StaffMAR} />}
      </Route>
      <Route path="/staff/vitals">
        {() => <ProtectedStaffRoute component={StaffVitals} />}
      </Route>
      <Route path="/staff/incidents">
        {() => <ProtectedStaffRoute component={StaffIncidents} />}
      </Route>
      <Route path="/staff/:rest*">
        {() => <ProtectedStaffRoute component={StaffDashboard} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OwnerAuthProvider>
        <StaffAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </StaffAuthProvider>
      </OwnerAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
