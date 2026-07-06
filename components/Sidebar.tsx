"use client";

import { BarChart3, Database, TrendingUp, Settings, LogOut, Home } from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  badge?: string;
  isActive?: boolean;
}

export function Sidebar() {
  const navItems: NavItem[] = [
    { icon: <Home className="h-5 w-5" />, label: "Dashboard", isActive: true },
    { icon: <BarChart3 className="h-5 w-5" />, label: "Analysis" },
    { icon: <Database className="h-5 w-5" />, label: "Data Quality" },
    { icon: <TrendingUp className="h-5 w-5" />, label: "Trends" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border/40 bg-card/50 backdrop-blur flex flex-col">
      {/* Logo */}
      <div className="border-b border-border/40 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Billing EDA</h2>
            <p className="text-xs text-muted-foreground">Analytics</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 py-6">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
              item.isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-surface/50"
            }`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/40 space-y-2 px-3 py-6">
        <button className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-surface/50 transition">
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-surface/50 transition">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
