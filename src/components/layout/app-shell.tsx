"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  ClipboardList,
  MessageSquare,
  LogOut,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  CheckCircle2,
  Clock,
  Check,
} from "lucide-react";

interface AppShellProps {
  children: ReactNode;
}

interface UserProfile {
  fullName: string;
  position: string;
  role: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "leave" | "system" | "message";
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Notifications state
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [user, setUser] = useState<UserProfile>({
    fullName: "User",
    position: "Employee",
    role: "EMPLOYEE",
  });

  // Dark Mode Init
  useEffect(() => {
    const savedTheme = localStorage.getItem("hrflow_theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("hrflow_theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Fetch Current User & Generate Real Contextual Notifications
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;

        const data = await res.json();
        if (data.user?.employee) {
          const role = data.user.role;
          const empId = data.user.employee.id;

          setUser({
            fullName: data.user.employee.fullName,
            position: data.user.employee.position || "Staff",
            role: role,
          });

          // ডাইনামিক নোটিফিকেশন লোড করা
          if (role === "EMPLOYEE") {
            // শুধুমাত্র লগইন করা ইউজারের লিভ রিকোয়েস্ট চেক করা
            const leaveRes = await fetch(`/api/leave?employeeId=${empId}`);
            const leaveData = await leaveRes.json();

            const realNotifications: NotificationItem[] = [];

            if (leaveData.success && Array.isArray(leaveData.data) && leaveData.data.length > 0) {
              // ইউজারের লেটেস্ট লিভ রিকোয়েস্ট থেকে নোটিফিকেশন তৈরি
              const latestLeave = leaveData.data[0];
              if (latestLeave.status === "PENDING") {
                realNotifications.push({
                  id: latestLeave.id,
                  title: "Leave Status",
                  message: `Your ${latestLeave.leaveType.toLowerCase()} leave application is currently under review.`,
                  time: "Recent",
                  read: false,
                  type: "leave",
                });
              } else if (latestLeave.status === "APPROVED") {
                realNotifications.push({
                  id: latestLeave.id,
                  title: "Leave Approved",
                  message: `Your ${latestLeave.leaveType.toLowerCase()} leave request has been approved.`,
                  time: "Recent",
                  read: false,
                  type: "leave",
                });
              } else if (latestLeave.status === "REJECTED") {
                realNotifications.push({
                  id: latestLeave.id,
                  title: "Leave Rejected",
                  message: `Your ${latestLeave.leaveType.toLowerCase()} leave request was rejected.`,
                  time: "Recent",
                  read: false,
                  type: "leave",
                });
              }
            }

            setNotifications(realNotifications);
          } else {
            // Admin বা HR এর জন্য পেন্ডিং রিকোয়েস্ট লোড করা
            const leaveRes = await fetch("/api/leave");
            const leaveData = await leaveRes.json();

            const pendingList = (leaveData.data || []).filter((l: any) => l.status === "PENDING");
            const hrNotifications: NotificationItem[] = [];

            if (pendingList.length > 0) {
              hrNotifications.push({
                id: pendingList[0].id,
                title: "Pending Leave Review",
                message: `${pendingList[0].employee?.fullName || "An employee"} submitted a leave request awaiting approval.`,
                time: "Recent",
                read: false,
                type: "leave",
              });
            }

            setNotifications(hrNotifications);
          }
        }
      } catch (err) {
        console.error("Failed to load user profile or notifications:", err);
      }
    }
    fetchCurrentUser();
  }, []);

  // Close notifications dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Employees", href: "/employees", icon: Users },
    { label: "Departments", href: "/departments", icon: Building2 },
    { label: "Attendance", href: "/attendance", icon: CalendarCheck },
    { label: "Leave", href: "/leave", icon: ClipboardList },
    { label: "Messages", href: "/messages", icon: MessageSquare },
  ];

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50/60 transition-colors duration-200 dark:bg-slate-950">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-sm">
              H
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white">HRFlow</span>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                People Platform
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:hidden dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900/80 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">HRFlow</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Internal HR Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {theme === "dark" ? (
                <Sun size={17} className="text-amber-400" />
              ) : (
                <Moon size={17} className="text-slate-600" />
              )}
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
                className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:w-88">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-2 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                      >
                        <Check size={12} /> Mark read
                      </button>
                    )}
                  </div>

                  <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-400">No notifications</p>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 rounded-xl p-2.5 transition ${
                            item.read
                              ? "opacity-75 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                              : "bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30"
                          }`}
                        >
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                            {item.type === "leave" ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                              {item.title}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                              {item.message}
                            </p>
                            <span className="mt-1 block text-[10px] text-slate-400 dark:text-slate-500">
                              {item.time}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic User Badge */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-3 dark:border-slate-800 sm:pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                {initials || "U"}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {user.fullName}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {user.position} &bull; {user.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}