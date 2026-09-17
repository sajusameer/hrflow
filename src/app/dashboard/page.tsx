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
  CheckCircle2,
  AlertCircle,
  PlusCircle,
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

  // Admin Specific States
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
        // Fetch Attendance for today
        if (empId) {
          const attRes = await fetch(`/api/attendance?employeeId=${empId}`);
          const attData = await attRes.json();
          if (attData.success && Array.isArray(attData.data)) {
            const todayStr = new Date().toISOString().split("T")[0];
            const foundToday = attData.data.find((r: any) =>
              r.date.startsWith(todayStr)
            );
            if (foundToday) {
              setTodayAttendance({
                clockIn: foundToday.clockIn,
                clockOut: foundToday.clockOut,
                status: foundToday.status,
              });
            } else {
              setTodayAttendance(null);
            }
          }

          // Fetch Leaves for employee
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
        // Admin / HR Manager Overview
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

        const todayStr = new Date().toISOString().split("T")[0];
        const presentCount = (atts.data || []).filter((r: any) =>
          r.date.startsWith(todayStr)
        ).length;

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

  const handleClockToggle = async () => {
    if (!user?.employee?.id) return;
    setClockLoading(true);
    try {
      const isClockingOut = todayAttendance?.clockIn && !todayAttendance?.clockOut;
      const endpoint = isClockingOut ? "/api/attendance/clock-out" : "/api/attendance/clock-in";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: user.employee.id }),
      });

      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Clock action error:", err);
    } finally {
      setClockLoading(false);
    }
  };

  const currentDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "--:--";
    return new Date(timeStr).toLocaleTimeString([], {
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
  const hasClockedIn = Boolean(todayAttendance?.clockIn);
  const hasClockedOut = Boolean(todayAttendance?.clockOut);

  return (
    <AppShell>
      <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Welcome Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                {currentDate}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Welcome back, {user?.employee?.fullName || "Colleague"}
              </h1>
              <p className="text-xs font-medium text-slate-500">
                {user?.employee?.position} &bull;{" "}
                <span className="font-semibold text-emerald-600">{user?.role}</span>
              </p>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-3">
              {isEmployee ? (
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
              ) : (
                <Link
                  href="/employees"
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Users size={18} />
                  Manage Employees
                </Link>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          {isEmployee ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Card 1: Attendance Today */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Clock3 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Attendance Status</p>
                    <p className="text-lg font-bold text-slate-900">
                      {hasClockedOut
                        ? "Shift Completed"
                        : hasClockedIn
                        ? "Clocked In"
                        : "Not Clocked In"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Pending Leaves */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Pending Leaves</p>
                    <p className="text-lg font-bold text-slate-900">
                      {leaveSummary.pendingCount}{" "}
                      <span className="text-xs font-normal text-slate-400">awaiting</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Total Leaves Applied */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <CalendarCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Total Leaves</p>
                    <p className="text-lg font-bold text-slate-900">
                      {leaveSummary.totalCount}{" "}
                      <span className="text-xs font-normal text-slate-400">records</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Admin & HR Manager Metric Grid */
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-400">Total Workforce</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{adminStats.totalEmployees}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-400">Present Today</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{adminStats.presentToday}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-400">Pending Leaves</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{adminStats.pendingLeaves}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-400">Departments</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{adminStats.departmentsCount}</p>
              </div>
            </div>
          )}

          {/* Lower Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Box 1: Today's Shift Logs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-semibold text-slate-900">Today&apos;s Attendance Record</h3>
                <Clock3 size={18} className="text-slate-400" />
              </div>

              <div className="grid grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4 text-center">
                <div>
                  <p className="text-xs text-slate-400">CLOCK IN</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatTime(todayAttendance?.clockIn ?? null)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">CLOCK OUT</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatTime(todayAttendance?.clockOut ?? null)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">STATUS</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      todayAttendance?.status === "PRESENT"
                        ? "bg-emerald-100 text-emerald-700"
                        : todayAttendance?.status === "LATE"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {todayAttendance?.status || (hasClockedIn ? "PRESENT" : "ABSENT")}
                  </span>
                </div>
              </div>

              <div className="mt-5 text-right">
                <Link
                  href="/attendance"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  View full attendance logs &rarr;
                </Link>
              </div>
            </div>

            {/* Box 2: Leave Summary & Quick Action */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-semibold text-slate-900">
                  {isEmployee ? "Recent Leave Applications" : "Leave Review Workflow"}
                </h3>
                {isEmployee && (
                  <Link
                    href="/leave"
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    <PlusCircle size={14} />
                    Apply Leave
                  </Link>
                )}
              </div>

              {isEmployee ? (
                leaveSummary.recentLeaves.length === 0 ? (
                  <div className="flex h-28 items-center justify-center text-xs text-slate-400">
                    No leave requests found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaveSummary.recentLeaves.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{item.leaveType}</span>
                          <p className="text-[11px] text-slate-400">
                            {new Date(item.startDate).toLocaleDateString()} -{" "}
                            {new Date(item.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            item.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "REJECTED"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
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
                  <p className="text-sm font-semibold text-slate-700">
                    {adminStats.pendingLeaves} pending approvals awaiting
                  </p>
                  <Link
                    href="/leave"
                    className="mt-3 inline-block rounded-lg bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Review All Requests
                  </Link>
                </div>
              )}

              <div className="mt-4 border-t border-slate-100 pt-3 text-right">
                <Link
                  href="/leave"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
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