"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Employees",
    href: "/employees",
    icon: Users,
  },
  {
    label: "Departments",
    href: "/departments",
    icon: Building2,
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: CalendarCheck,
  },
  {
    label: "Leave",
    href: "/leave",
    icon: ClipboardList,
  },
  {
    label: "Messages",
    href: "/messages",
    icon: MessageSquare,
  },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const sidebarWidth = collapsed ? "lg:w-20" : "lg:w-64";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-all duration-300 ${sidebarWidth} ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-slate-100 px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
              H
            </div>

            {!collapsed && (
              <div className="hidden lg:block">
                <p className="text-lg font-bold tracking-tight text-slate-900">
                  HRFlow
                </p>

                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  People platform
                </p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={19} />

                <span className="hidden lg:block">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom navigation */}
        <div className="border-t border-slate-100 p-3">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <Settings size={19} />

            <span className="hidden lg:block">Settings</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} />

            <span className="hidden lg:block">Sign out</span>
          </button>
        </div>

        {/* Collapse button */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900 lg:flex"
        >
          {collapsed ? (
            <ChevronRight size={14} />
          ) : (
            <ChevronLeft size={14} />
          )}
        </button>
      </aside>

      {/* Main area */}
      <div
        className={`transition-all duration-300 ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">
                HRFlow
              </p>

              <p className="text-xs text-slate-400">
                Internal HR Management
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <Bell size={19} />

              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </button>

            <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                AR
              </div>

              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-800">
                  Amina Rahman
                </p>

                <p className="text-[11px] text-slate-400">
                  HR Officer
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
}