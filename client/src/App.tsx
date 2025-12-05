import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OwnerAuthProvider } from "@/lib/owner-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import SearchResults from "@/pages/search-results";
import FacilityDetails from "@/pages/facility-details";
import OwnerPortal from "@/pages/owner-portal";
import OwnerLogin from "@/pages/owner-login";
import OwnerSetup from "@/pages/owner-setup";
import OwnerDashboard from "@/pages/owner-dashboard";
import AdminPage from "@/pages/admin";

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OwnerAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </OwnerAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
