"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Radar, Home } from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
}

export function Sidebar() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { icon: <Home className="h-5 w-5" />, label: "Dashboard", href: "/dashboard" },
    { icon: <Radar className="h-5 w-5" />, label: "Detector", href: "/detector" },
  ];

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-border/40 bg-card/50 backdrop-blur flex flex-col">
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
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
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
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
