"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck2,
  Clock3,
  Calendar,
  AlertCircle,
  CheckCircle2,
  LogIn,
  LogOut,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";

interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  status: "PRESENT" | "LATE" | "HALF_DAY";
  employee: {
    fullName: string;
    position: string;
  };
}

export default function AttendancePage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          startTransition(() => {
            router.push("/login");
          });
          return;
        }
        const authData = await authRes.json();
        const empId = authData.user?.employee?.id;
        const role = authData.user?.role;
        setCurrentUser({ id: empId, role });

        // Fetch records: Regular employees see own; Admin/HR sees organization history
        const url =
          role === "EMPLOYEE" && empId
            ? `/api/attendance?employeeId=${empId}`
            : "/api/attendance";
        const res = await fetch(url);
        const resData = await res.json();

        // API returns resData.data
        if (resData.success && Array.isArray(resData.data)) {
          setRecords(resData.data);
        }
      } catch (err) {
        console.error("Attendance fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  // Metric computations
  const totalDays = records.length;
  const onTimeDays = records.filter((r) => r.status === "PRESENT").length;
  const lateDays = records.filter((r) => r.status === "LATE").length;

  const calculateHours = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return "In Progress";
    const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // নাইজেরিয়ান টাইমজোন (WAT / Africa/Lagos) অনুযায়ী সময় প্রদর্শন
  const formatTimeWAT = (timeStr: string | null) => {
    if (!timeStr) return "--:--";
    return new Date(timeStr).toLocaleTimeString("en-US", {
      timeZone: "Africa/Lagos",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // নাইজেরিয়ান ক্যালেন্ডার ডেট ফরম্যাটার
  const formatDateWAT = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      timeZone: "Africa/Lagos",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AppShell>
      <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Attendance History
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {currentUser?.role === "EMPLOYEE"
                ? "View your logs, shift hours, and punctuality records (WAT Timezone)"
                : "Organization-wide daily attendance and work hour tracking (WAT Timezone)"}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CalendarCheck2 size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Recorded Shifts</p>
                  <p className="text-2xl font-bold text-slate-900">{totalDays}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">On Time</p>
                  <p className="text-2xl font-bold text-blue-600">{onTimeDays}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Late Arrivals</p>
                  <p className="text-2xl font-bold text-amber-600">{lateDays}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900">Shift Logs</h2>
              <p className="text-xs text-slate-400">Detailed punch-in and punch-out history in West Africa Time (WAT)</p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading attendance logs...</div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-400">
                No attendance logs found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Clock In (WAT)</th>
                      <th className="px-6 py-4">Clock Out (WAT)</th>
                      <th className="px-6 py-4">Work Duration</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-800">{row.employee.fullName}</p>
                            <p className="text-xs text-slate-400">{row.employee.position}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-xs text-slate-600">
                            <Calendar size={13} className="text-slate-400" />
                            {formatDateWAT(row.date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <LogIn size={13} className="text-emerald-600" />
                            {formatTimeWAT(row.clockIn)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-700">
                          {row.clockOut ? (
                            <div className="flex items-center gap-1.5">
                              <LogOut size={13} className="text-rose-600" />
                              {formatTimeWAT(row.clockOut)}
                            </div>
                          ) : (
                            <span className="text-slate-400">--:--</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock3 size={13} className="text-slate-400" />
                            {calculateHours(row.clockIn, row.clockOut)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              row.status === "PRESENT"
                                ? "bg-emerald-50 text-emerald-700"
                                : row.status === "LATE"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}