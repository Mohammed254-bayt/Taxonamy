import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Briefcase, 
  Tag, 
  GitBranch, 
  Database, 
  ExternalLink,
  TreePine,
  Merge,
  FileSearch
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, current: true },
];

const dataManagement = [
  { name: "Occupations", href: "/occupations", icon: Briefcase, count: null },
  { name: "Synonyms", href: "/synonyms", icon: Tag, count: null },
  { name: "Tree Structure", href: "/tree", icon: TreePine, count: null },
  { name: "Data Sources", href: "/sources", icon: ExternalLink, count: null },
];

const tools: Array<{ name: string; href: string; icon: any }> = [
  { name: "Merge Occupations", href: "/merge", icon: Merge },
];

const system: Array<{ name: string; href: string; icon: any }> = [
  { name: "Audit Logs", href: "/audit-logs", icon: FileSearch },
];

export function Sidebar() {
  const [location, navigate] = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white shadow-lg flex-shrink-0">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-medium text-gray-900">OTMS Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Taxonomy Management</p>
      </div>

      <nav className="mt-6">
        <div className="px-3">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.href);
              }}
              className={cn(
                isActive(item.href)
                  ? "text-gray-900 bg-blue-50"
                  : "text-gray-700 hover:bg-gray-100",
                "flex items-center px-3 py-2 rounded-lg mb-1"
              )}
            >
              <item.icon className={cn(
                isActive(item.href) ? "text-blue-500" : "text-gray-400",
                "mr-3 h-5 w-5"
              )} />
              <span className="font-medium">{item.name}</span>
            </a>
          ))}

          <div className="mt-6">
            <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Data Management
            </h3>

            {dataManagement.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.href !== "#") {
                    navigate(item.href);
                  }
                }}
                className={cn(
                  isActive(item.href)
                    ? "text-gray-900 bg-blue-50"
                    : "text-gray-700 hover:bg-gray-100",
                  "flex items-center px-3 py-2 rounded-lg mb-1",
                  item.href === "#" && "cursor-not-allowed opacity-50"
                )}
              >
                <item.icon className="text-gray-400 mr-3 h-5 w-5" />
                <span>{item.name}</span>
                {item.count && (
                  <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                )}
              </a>
            ))}
          </div>

          {tools.length > 0 && (
            <div className="mt-6">
              <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Tools
              </h3>

              {tools.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                  }}
                  className={cn(
                    isActive(item.href)
                      ? "text-gray-900 bg-blue-50"
                      : "text-gray-700 hover:bg-gray-100",
                    "flex items-center px-3 py-2 rounded-lg mb-1"
                  )}
                >
                  <item.icon className="text-gray-400 mr-3 h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              ))}
            </div>
          )}

          {system.length > 0 && (
            <div className="mt-6">
              <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                System
              </h3>

              {system.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                  }}
                  className={cn(
                    isActive(item.href)
                      ? "text-gray-900 bg-blue-50"
                      : "text-gray-700 hover:bg-gray-100",
                    "flex items-center px-3 py-2 rounded-lg mb-1"
                  )}
                >
                  <item.icon className="text-gray-400 mr-3 h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              ))}
            </div>
          )}

        </div>
      </nav>
    </aside>
  );
}
