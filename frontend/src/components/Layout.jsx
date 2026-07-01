import { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Database, GraduationCap, ScrollText, Sun, Moon, Zap, HelpCircle } from "lucide-react";
import useTheme from "../hooks/useTheme";
import { cn } from "../lib/utils";
import HelpModal from "./HelpModal";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/repository", label: "Repository", icon: Database },
  { to: "/practice", label: "Practice", icon: GraduationCap },
  { to: "/mocks", label: "Mocks", icon: ScrollText },
];

export default function Layout() {
  const { theme, toggle } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if (e.key.toLowerCase() === "t") toggle();
      if (e.key === "?" || (e.key.toLowerCase() === "h" && e.ctrlKey)) {
        e.preventDefault();
        setHelpOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 px-4 py-3 flex items-center justify-between bg-white dark:bg-surface-dark">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-accent-500" aria-hidden="true" />
          <span className="font-bold text-lg font-sans tracking-tight">
            BYOP Studio <span className="text-accent-500">·</span> IBPS SO
          </span>
          <span className="text-xs text-gray-500 font-mono hidden sm:inline" aria-label="Version 1.0">v1.0</span>
        </div>

        <nav className="hidden sm:flex items-center gap-1" aria-label="Main navigation">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )
              }
              aria-label={label}
            >
              <Icon className="w-4 h-4 inline mr-1.5 -mt-0.5" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setHelpOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Help"
            title="Keyboard shortcuts & help (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={toggle}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="sm:hidden flex border-b-2 overflow-x-auto" aria-label="Mobile navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex-1 px-3 py-2 text-xs font-medium text-center border-b-2 transition-colors",
                isActive
                  ? "border-accent-500 text-accent-600 dark:text-accent-400"
                  : "border-transparent text-gray-500 dark:text-gray-400"
              )
            }
            aria-label={label}
          >
            <Icon className="w-4 h-4 mx-auto mb-0.5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full" role="main">
        <Outlet />
      </main>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
