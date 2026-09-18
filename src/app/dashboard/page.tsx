"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogIn,
  LogOut,
  CalendarCheck,
  ClipboardList,
  Users,
  Building2,
  Clock3,
  PlusCircle,
  ShieldCheck,
  Network,
  FileCheck,
  UserCheck,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";

interface UserData {
  id: string;
  role: "EMPLOYEE" | "HR_MANAGER" | "ADMIN";
  employee?: {
    id: string;
    fullName: string;
    position: string;
  };
}

interface AttendanceToday {
  id?: string;
  clockIn: string | null;
  clockOut: string | null;
  status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT";
}

interface LeaveSummary {
  pendingCount: number;
  totalCount: number;
  recentLeaves: Array<{
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
  }>;
}

// নাইজেরিয়ান ক্যালেন্ডার ডেট (YYYY-MM-DD) বের করার হেল্পার
const getNigerianDateString = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
};

export default function DashboardPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Employee Specific States
  const [todayAttendance, setTodayAttendance] = useState<AttendanceToday | null>(null);
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary>({
    pendingCount: 0,
    totalCount: 0,
    recentLeaves: [],
  });

  // Admin / HR Specific States
  const [adminStats, setAdminStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    departmentsCount: 0,
  });

  const [clockLoading, setClockLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        startTransition(() => router.push("/login"));
        return;
      }
      const authData = await authRes.json();
      const currentUser = authData.user;
      setUser(currentUser);

      const empId = currentUser?.employee?.id;

      if (currentUser.role === "EMPLOYEE") {
        if (empId) {
          const attRes = await fetch(`/api/attendance?employeeId=${empId}`);
          const attData = await attRes.json();
          if (attData.success && Array.isArray(attData.data)) {
            const todayStr = getNigerianDateString();
            
            // ফিল্ড নামের সব ধরনের ভেরিয়েশন সাপোর্ট (date, clockIn, clockInTime, createdAt)
            const foundToday = attData.data.find((r: any) => {
              const d = r.date || r.clockIn || r.clockInTime || r.createdAt;
              return d && String(d).startsWith(todayStr);
            });

            if (foundToday) {
              setTodayAttendance({
                id: foundToday.id,
                clockIn: foundToday.clockIn || foundToday.clockInTime || null,
                clockOut: foundToday.clockOut || foundToday.clockOutTime || null,
                status: foundToday.status || "PRESENT",
              });
            } else {
              setTodayAttendance(null);
            }
          }

          const leaveRes = await fetch(`/api/leave?employeeId=${empId}`);
          const leaveData = await leaveRes.json();
          if (leaveData.success && Array.isArray(leaveData.data)) {
            const leaves = leaveData.data;
            setLeaveSummary({
              pendingCount: leaves.filter((l: any) => l.status === "PENDING").length,
              totalCount: leaves.length,
              recentLeaves: leaves.slice(0, 4),
            });
          }
        }
      } else {
        const [empRes, attRes, leaveRes, deptRes] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/attendance"),
          fetch("/api/leave"),
          fetch("/api/departments"),
        ]);

        const emps = await empRes.json();
        const atts = await attRes.json();
        const leaves = await leaveRes.json();
        const depts = await deptRes.json();

        const todayStr = getNigerianDateString();
        const presentCount = (atts.data || []).filter((r: any) => {
          const d = r.date || r.clockIn || r.clockInTime || r.createdAt;
          return d && String(d).startsWith(todayStr);
        }).length;

        const pendingLeaves = (leaves.data || []).filter(
          (l: any) => l.status === "PENDING"
        ).length;

        setAdminStats({
          totalEmployees: (emps.employees || emps.data || []).length,
          presentToday: presentCount,
          pendingLeaves: pendingLeaves,
          departmentsCount: (depts.departments || []).length,
        });
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const hasClockedIn = Boolean(todayAttendance?.clockIn);
  const hasClockedOut = Boolean(todayAttendance?.clockOut);

  // // ক্লক-ইন এবং ক্লক-আউট হ্যান্ডলার
  // const handleClockToggle = async () => {
  //   if (!user?.employee?.id) return;
  //   setClockLoading(true);

  //   try {
  //     // বাটন স্টেটের ওপর ভিত্তি করে সিদ্ধান্ত নেওয়া
  //     const isClockingOut = hasClockedIn && !hasClockedOut;
  //     const primaryEndpoint = isClockingOut
  //       ? "/api/attendance/clock-out"
  //       : "/api/attendance/clock-in";

  //     let res = await fetch(primaryEndpoint, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         employeeId: user.employee.id,
  //         attendanceId: todayAttendance?.id,
  //       }),
  //     });

  //     // সাব-রুট না থাকলে ফলব্যাক রুট
  //     if (!res.ok && (res.status === 404 || res.status === 405)) {
  //       res = await fetch("/api/attendance", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           employeeId: user.employee.id,
  //           action: isClockingOut ? "CLOCK_OUT" : "CLOCK_IN",
  //           attendanceId: todayAttendance?.id,
  //         }),
  //       });
  //     }

  //     const result = await res.json().catch(() => ({}));

  //     if (res.ok && result.success !== false) {
  //       await fetchDashboardData();
  //     } else {
  //       alert(result.message || "Failed to update attendance");
  //     }
  //   } catch (err) {
  //     console.error("Clock action error:", err);
  //     alert("Network error while recording attendance");
  //   } finally {
  //     setClockLoading(false);
  //   }
  // };
const handleClockToggle = async () => {
    if (!user?.employee?.id) return;
    setClockLoading(true);

    try {
      const isClockingOut = Boolean(todayAttendance?.clockIn && !todayAttendance?.clockOut);

      // মেথড নির্ধারণ: ক্লক আউটের জন্য PATCH ও POST (action সহ) দুটিই সমর্থিত
      const res = await fetch("/api/attendance", {
        method: isClockingOut ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: user.employee.id,
          action: isClockingOut ? "CLOCK_OUT" : "CLOCK_IN",
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success) {
        await fetchDashboardData();
      } else {
        alert(result.message || "Failed to update attendance");
      }
    } catch (err) {
      console.error("Clock action error:", err);
      alert("Network error while updating attendance");
    } finally {
      setClockLoading(false);
    }
  };
  // নাইজেরিয়ান টাইমজোন অনুযায়ী তারিখ প্রদর্শন
  const currentDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  // নাইজেরিয়ান টাইমজোন অনুযায়ী সময় প্রদর্শন (WAT)
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "--:--";
    return new Date(timeStr).toLocaleTimeString("en-US", {
      timeZone: "Africa/Lagos",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  const isEmployee = user?.role === "EMPLOYEE";
  const isAdmin = user?.role === "ADMIN";
  const isHR = user?.role === "HR_MANAGER";

  return (
    <AppShell>
      <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Welcome Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                {currentDate} (WAT)
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl dark:text-white">
                Welcome back, {user?.employee?.fullName || "Colleague"}
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                {user?.employee?.position || "Staff Member"} &bull;{" "}
                <span
                  className={`font-semibold ${
                    isAdmin
                      ? "text-rose-600 dark:text-rose-400"
                      : isHR
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {user?.role}
                </span>
              </p>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {isEmployee && (
                <button
                  type="button"
                  disabled={clockLoading || hasClockedOut}
                  onClick={handleClockToggle}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${
                    hasClockedOut
                      ? "bg-slate-400"
                      : hasClockedIn
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {hasClockedIn && !hasClockedOut ? (
                    <>
                      <LogOut size={18} />
                      {clockLoading ? "Clocking Out..." : "Clock Out"}
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      {hasClockedOut
                        ? "Shift Completed"
                        : clockLoading
                        ? "Clocking In..."
                        : "Clock In"}
                    </>
                  )}
                </button>
              )}

              {isAdmin && (
                <>
                  <Link
                    href="/departments"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition shadow-sm"
                  >
                    <Building2 size={17} className="text-slate-500 dark:text-zinc-400" />
                    Manage Hierarchy
                  </Link>
                  <Link
                    href="/employees"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
                  >
                    <Users size={17} />
                    System Directory
                  </Link>
                </>
              )}

              {isHR && (
                <>
                  <Link
                    href="/leave"
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50/70 dark:bg-emerald-950/40 px-3.5 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition shadow-sm"
                  >
                    <FileCheck size={17} />
                    Review Leaves
                  </Link>
                  <Link
                    href="/employees"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
                  >
                    <UserCheck size={17} />
                    Manage Staff
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          {isEmployee ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <Clock3 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400 dark:text-zinc-500">Attendance Status</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {hasClockedOut
                        ? "Shift Completed"
                        : hasClockedIn
                        ? "Clocked In"
                        : "Not Clocked In"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400 dark:text-zinc-500">Pending Leaves</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {leaveSummary.pendingCount}{" "}
                      <span className="text-xs font-normal text-slate-400 dark:text-zinc-500">awaiting</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                    <CalendarCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400 dark:text-zinc-500">Total Leaves</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {leaveSummary.totalCount}{" "}
                      <span className="text-xs font-normal text-slate-400 dark:text-zinc-500">records</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-400 dark:text-zinc-500">Total Workforce</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{adminStats.totalEmployees}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-400 dark:text-zinc-500">Present Today</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{adminStats.presentToday}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-400 dark:text-zinc-500">Pending Leaves</p>
                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{adminStats.pendingLeaves}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-400 dark:text-zinc-500">Departments</p>
                <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{adminStats.departmentsCount}</p>
              </div>
            </div>
          )}

          {/* Lower Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">Today&apos;s Attendance Record</h3>
                <Clock3 size={18} className="text-slate-400 dark:text-zinc-500" />
              </div>

              <div className="grid grid-cols-3 gap-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 p-4 text-center">
                <div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">CLOCK IN (WAT)</p>
                  <p className="mt-1 text-sm font-bold text-slate-800 dark:text-zinc-200">
                    {formatTime(todayAttendance?.clockIn ?? null)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">CLOCK OUT (WAT)</p>
                  <p className="mt-1 text-sm font-bold text-slate-800 dark:text-zinc-200">
                    {formatTime(todayAttendance?.clockOut ?? null)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">STATUS</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      todayAttendance?.status === "PRESENT"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : todayAttendance?.status === "LATE"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                        : "bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {todayAttendance?.status || (hasClockedIn ? "PRESENT" : "ABSENT")}
                  </span>
                </div>
              </div>

              <div className="mt-5 text-right">
                <Link
                  href="/attendance"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  View full attendance logs &rarr;
                </Link>
              </div>
            </div>

            {/* Leave Box */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {isEmployee ? "Recent Leave Applications" : "Leave Review Workflow"}
                </h3>
                {isEmployee && (
                  <Link
                    href="/leave"
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    <PlusCircle size={14} />
                    Apply Leave
                  </Link>
                )}
              </div>

              {isEmployee ? (
                leaveSummary.recentLeaves.length === 0 ? (
                  <div className="flex h-28 items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
                    No leave requests found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaveSummary.recentLeaves.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 p-2.5 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-zinc-200">{item.leaveType}</span>
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                            {new Date(item.startDate).toLocaleDateString()} -{" "}
                            {new Date(item.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            item.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : item.status === "REJECTED"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    {adminStats.pendingLeaves} pending approvals awaiting
                  </p>
                  <Link
                    href="/leave"
                    className="mt-3 inline-block rounded-lg bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
                  >
                    Review All Requests
                  </Link>
                </div>
              )}

              <div className="mt-4 border-t border-slate-100 dark:border-zinc-800 pt-3 text-right">
                <Link
                  href="/leave"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  Go to leave center &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}