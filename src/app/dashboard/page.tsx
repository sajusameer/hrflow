"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarCheck,
  ClipboardList,
  Users,
  Building2,
  Clock3,
  MessageSquare,
  UserPlus,
  LogIn,
  LogOut,
} from "lucide-react";

import AppShell from "@/components/layout/app-shell";

interface DashboardData {
  employee: {
    id: string;
    fullName: string;
    position: string;
  };
  myTodayAttendance: {
    id: string;
    clockIn: string;
    clockOut: string | null;
    status: "PRESENT" | "LATE" | "HALF_DAY";
  } | null;
  // Admin / HR stats
  totalEmployees?: number;
  totalDepartments?: number;
  presentToday?: number;
  absentToday?: number;
  notClockedOut?: number;
  pendingLeaves?: number;
  recentLeaves?: Array<{
    id: string;
    leaveType: string;
    employee: { fullName: string; position: string };
  }>;
  // Employee stats
  myPendingLeaves?: number;
  myTotalLeaves?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData.data);
        setRole(resData.role);
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleClockIn = async () => {
    if (!data?.employee.id) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: data.employee.id }),
      });
      const result = await res.json();
      setActionMessage(result.message);
      await fetchStats();
    } catch {
      setActionMessage("Failed to clock in");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!data?.employee.id) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: data.employee.id }),
      });
      const result = await res.json();
      setActionMessage(result.message);
      await fetchStats();
    } catch {
      setActionMessage("Failed to clock out");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center">
          <div className="text-sm font-medium text-slate-500">Loading workspace dashboard...</div>
        </div>
      </AppShell>
    );
  }

  const attendance = data?.myTodayAttendance;
  const isEmployeeOnly = role === "EMPLOYEE";

  // Calculations for attendance rate
  const totalEmp = data?.totalEmployees || 0;
  const present = data?.presentToday || 0;
  const rate = totalEmp > 0 ? Math.round((present / totalEmp) * 100) : 0;

  const stats = isEmployeeOnly
    ? [
        {
          label: "Attendance Status",
          value: attendance ? attendance.status : "Not Clocked In",
          change: attendance?.clockOut ? "Shift ended" : attendance ? "In progress" : "Pending",
          description: "Today's shift record",
          icon: Clock3,
        },
        {
          label: "Pending Leaves",
          value: String(data?.myPendingLeaves ?? 0).padStart(2, "0"),
          change: "Under review",
          description: "Awaiting approval",
          icon: ClipboardList,
        },
        {
          label: "Total Leaves",
          value: String(data?.myTotalLeaves ?? 0).padStart(2, "0"),
          change: "History",
          description: "Total submissions",
          icon: CalendarCheck,
        },
      ]
    : [
        {
          label: "Total Employees",
          value: String(data?.totalEmployees ?? 0).padStart(2, "0"),
          change: "Active",
          description: "in organization",
          icon: Users,
        },
        {
          label: "Present Today",
          value: String(data?.presentToday ?? 0).padStart(2, "0"),
          change: `${rate}%`,
          description: "attendance rate",
          icon: CalendarCheck,
        },
        {
          label: "Pending Leave",
          value: String(data?.pendingLeaves ?? 0).padStart(2, "0"),
          change: "Needs review",
          description: "leave requests",
          icon: ClipboardList,
        },
        {
          label: "Departments",
          value: String(data?.totalDepartments ?? 0).padStart(2, "0"),
          change: "Active",
          description: "hierarchy units",
          icon: Building2,
        },
      ];

  return (
    <AppShell>
      <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Page heading */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-emerald-600">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Welcome back, {data?.employee.fullName}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {data?.employee.position} &bull; <span className="font-semibold text-emerald-700">{role}</span>
              </p>
            </div>

            {/* Shift Clock-In / Clock-Out Interaction */}
            <div className="flex items-center gap-3">
              {!attendance ? (
                <button
                  type="button"
                  onClick={handleClockIn}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  <LogIn size={17} />
                  {actionLoading ? "Processing..." : "Clock In"}
                </button>
              ) : !attendance.clockOut ? (
                <button
                  type="button"
                  onClick={handleClockOut}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
                >
                  <LogOut size={17} />
                  {actionLoading ? "Processing..." : "Clock Out"}
                </button>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600">
                  <Clock3 size={16} /> Completed for Today
                </span>
              )}

              {!isEmployeeOnly && (
                <button
                  type="button"
                  onClick={() => router.push("/employees")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <UserPlus size={17} />
                  Manage Employees
                </button>
              )}
            </div>
          </div>

          {actionMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {actionMessage}
            </div>
          )}

          {/* Statistics Grid */}
          <section className={`grid gap-4 sm:grid-cols-2 ${isEmployeeOnly ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Icon size={21} />
                    </div>

                    <ArrowUpRight size={18} className="text-slate-300" />
                  </div>

                  <p className="mt-5 text-sm font-medium text-slate-500">{stat.label}</p>

                  <div className="mt-2 flex items-end gap-2">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                      {stat.value}
                    </h2>

                    <span className="mb-1 text-xs font-semibold text-emerald-600">
                      {stat.change}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-400">{stat.description}</p>
                </div>
              );
            })}
          </section>

          {/* Detailed Content (Attendance & Leaves) */}
          <section className="grid gap-6 xl:grid-cols-3">
            {/* Attendance Overview Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">Attendance Overview</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {isEmployeeOnly ? "Your attendance details for today" : "Today's employee attendance summary"}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Clock3 size={20} />
                </div>
              </div>

              {!isEmployeeOnly ? (
                <>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-sm text-emerald-700">Present</p>
                      <p className="mt-2 text-2xl font-bold text-emerald-900">
                        {String(data?.presentToday ?? 0).padStart(2, "0")}
                      </p>
                      <p className="mt-1 text-xs text-emerald-700">Employees checked in</p>
                    </div>

                    <div className="rounded-xl bg-amber-50 p-4">
                      <p className="text-sm text-amber-700">Pending Out</p>
                      <p className="mt-2 text-2xl font-bold text-amber-900">
                        {String(data?.notClockedOut ?? 0).padStart(2, "0")}
                      </p>
                      <p className="mt-1 text-xs text-amber-700">Not clocked out yet</p>
                    </div>

                    <div className="rounded-xl bg-slate-100 p-4">
                      <p className="text-sm text-slate-600">Absent</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {String(data?.absentToday ?? 0).padStart(2, "0")}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Not checked in today</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600">Organization attendance rate</span>
                      <span className="font-semibold text-slate-900">{rate}%</span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">Clock In Time</p>
                      <p className="mt-1 text-base font-medium text-slate-800">
                        {attendance?.clockIn ? new Date(attendance.clockIn).toLocaleTimeString() : "--:--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">Clock Out Time</p>
                      <p className="mt-1 text-base font-medium text-slate-800">
                        {attendance?.clockOut ? new Date(attendance.clockOut).toLocaleTimeString() : "--:--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">Status</p>
                      <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        {attendance ? attendance.status : "ABSENT"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pending Leave Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">Leave Workflow</h2>
                  <p className="mt-1 text-sm text-slate-500">Requests awaiting review</p>
                </div>

                <ClipboardList size={20} className="text-amber-600" />
              </div>

              <div className="mt-6 space-y-4">
                {data?.recentLeaves && data.recentLeaves.length > 0 ? (
                  data.recentLeaves.map((leave) => (
                    <div key={leave.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                          {leave.employee.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{leave.employee.fullName}</p>
                          <p className="text-xs text-slate-400">{leave.employee.position}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        {leave.leaveType}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-slate-400">No pending leave requests</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => router.push("/leave")}
                className="mt-6 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                View leave requests
              </button>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}