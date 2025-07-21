import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { LoginForm } from "@/components/login-form";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import Dashboard from "@/pages/dashboard";
import Occupations from "@/pages/occupations";
import Synonyms from "@/pages/synonyms";
import Taxonomy from "@/pages/taxonomy";
import Tree from "@/pages/tree";
import Sources from "@/pages/sources";
import Merge from "@/pages/merge";
import AuditLogs from "@/pages/audit-logs";

import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/occupations" component={Occupations} />
      <Route path="/synonyms" component={Synonyms} />
      <Route path="/taxonomy" component={Taxonomy} />
      <Route path="/tree" component={Tree} />
      <Route path="/sources" component={Sources} />
      <Route path="/merge" component={Merge} />
      <Route path="/audit-logs" component={AuditLogs} />

      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          <Router />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthenticatedApp />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
