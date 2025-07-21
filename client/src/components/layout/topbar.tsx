import { useLocation } from "wouter";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/occupations": "Occupations Management",
  "/synonyms": "Synonyms Management",
  "/taxonomy": "Taxonomy Hierarchy",
  "/sources": "Data Sources",
};

export function Topbar() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const currentPageTitle = pageTitles[location] || "OTMS Admin";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-medium text-gray-900">{currentPageTitle}</h2>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-400" />
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">P</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
