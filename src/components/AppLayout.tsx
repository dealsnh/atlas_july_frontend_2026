// Atlas AppLayout — Premium dark intelligence dashboard
// Sidebar: County Scraper + Property Condition AI only
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/store";
import {
  Map,
  Building2,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "County Scraper", icon: Map, href: "/county-scraper" },
  { label: "Property Condition AI", icon: Building2, href: "/property-condition" },
];

const SIDEBAR_COLLAPSED_KEY = "atlas-sidebar-collapsed";

interface AppLayoutProps {
  children: React.ReactNode;
  companyName: string;
  accentColor: string;
}

function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

export default function AppLayout({ children, companyName, accentColor }: AppLayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const userEmail = user?.email ?? "";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  const activeNavStyle = {
    backgroundColor: `${accentColor}1a`,
    color: accentColor,
    boxShadow: `inset 0 0 0 1px ${accentColor}25`,
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div
        className={`border-b border-white/[0.07] ${
          collapsed ? "px-1.5 py-3 flex flex-col items-center gap-2" : "px-2.5 py-3"
        }`}
      >
        <div className={`flex items-center w-full ${collapsed ? "justify-center" : "gap-2"}`}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg shrink-0"
            style={{ backgroundColor: accentColor, boxShadow: `0 2px 12px ${accentColor}50` }}
            title="Atlas"
          >
            A
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-white font-bold text-xs leading-tight tracking-wide">Atlas</div>
              <div className="text-white/35 text-[10px] leading-tight truncate">{companyName}</div>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden md:flex items-center justify-center w-7 h-7 rounded-md border border-white/10 text-white/45 hover:text-white hover:bg-white/[0.04] transition-colors shrink-0"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-md border border-white/10 text-white/45 hover:text-white hover:bg-white/[0.04] transition-colors"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-3 space-y-0.5 overflow-y-auto ${collapsed ? "px-1.5" : "px-2"}`}>
        {!collapsed && (
          <div className="text-white/25 text-[9px] font-bold uppercase tracking-[0.16em] px-2 mb-2">
            Modules
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-md text-xs font-medium transition-all group relative ${
                  collapsed ? "justify-center px-1.5 py-2" : "gap-2 px-2 py-2"
                } ${
                  isActive ? "text-white" : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
                }`}
                style={isActive ? activeNavStyle : {}}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && <ChevronRight className="w-3 h-3 opacity-60 shrink-0" />}
                  </>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`py-3 border-t border-white/[0.07] space-y-0.5 ${collapsed ? "px-1.5" : "px-2"}`}>
        <Link href="/settings">
          <a
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Settings" : undefined}
            className={`flex items-center rounded-md text-xs font-medium transition-all ${
              collapsed ? "justify-center px-1.5 py-2" : "gap-2 px-2 py-2"
            } ${
              location === "/settings"
                ? "text-white"
                : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
            }`}
            style={location === "/settings" ? activeNavStyle : {}}
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span className="truncate">Settings</span>}
          </a>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Sign Out" : undefined}
          className={`w-full flex items-center rounded-md text-xs font-medium text-white/35 hover:text-red-400 hover:bg-red-400/[0.06] transition-all ${
            collapsed ? "justify-center px-1.5 py-2" : "gap-2 px-2 py-2"
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        {!collapsed && (
          <div className="px-2 pt-2">
            <div className="text-white/20 text-[10px] truncate">{userEmail}</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#080810] overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex shrink-0 flex-col transition-[width] duration-300 ease-in-out ${
          sidebarCollapsed ? "w-14" : "w-48"
        }`}
        style={{ background: "#0c0c18", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-[min(12rem,82vw)] flex flex-col"
            style={{ background: "#0c0c18", borderRight: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <span className="text-white font-bold text-sm">Atlas</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div
          className="md:hidden flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.07]"
          style={{ background: "#0c0c18" }}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-white/50 hover:text-white transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs"
            style={{ backgroundColor: accentColor }}
          >
            A
          </div>
          <span className="text-white font-bold text-sm">Atlas</span>
        </div>
        <main className="flex-1 overflow-y-auto bg-[#080810]">
          {children}
        </main>
      </div>
    </div>
  );
}
