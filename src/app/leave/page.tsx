"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Send,
  XCircle,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";

interface LeaveItem {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  employee: {
    id: string;
    fullName: string;
    email: string;
    position: string;
    department?: { name: string };
  };
  reviewer?: {
    fullName: string;
  };
  reviewNotes?: string;
}

export default function LeavePage() {
  const router = useRouter();
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [leaveType, setLeaveType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const fetchData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/login");
        return;
      }
      const authData = await authRes.json();
      const empId = authData.user.employee?.id;
      const role = authData.user.role;
      setCurrentUser({ id: empId, role });

      // If regular employee, fetch only their leaves. If Admin/HR, fetch all.
      const url = role === "EMPLOYEE" ? `/api/leave?employeeId=${empId}` : "/api/leave";
      const res = await fetch(url);
      const resData = await res.json();
      if (resData.success) {
        setLeaves(resData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyLeave = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: currentUser.id,
          leaveType,
          startDate,
          endDate,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Failed to submit request");
        return;
      }

      setFormSuccess("Leave request submitted successfully!");
      setShowModal(false);
      setReason("");
      setStartDate("");
      setEndDate("");
      fetchData();
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/leave/${leaveId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: currentUser.id,
          status,
          reviewNotes: `Marked as ${status} by ${currentUser.role}`,
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Review action error:", err);
    }
  };

  const canReview = currentUser?.role === "ADMIN" || currentUser?.role === "HR_MANAGER";

  return (
    <AppShell>
      <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Leave Management
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Submit time-off requests and monitor review workflows
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Plus size={18} />
              Apply for Leave
            </button>
          </div>

          {formSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {formSuccess}
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900">Leave Requests</h2>
              <p className="text-xs text-slate-500">
                {canReview ? "All organization submissions" : "Your submitted leave applications"}
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading requests...</div>
            ) : leaves.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">No leave requests found</p>
                <p className="text-xs text-slate-400">Click &quot;Apply for Leave&quot; to create one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Leave Type</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Status</th>
                      {canReview && <th className="px-6 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaves.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-800">{item.employee.fullName}</p>
                            <p className="text-xs text-slate-400">{item.employee.position}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {item.leaveType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-xs">
                            <CalendarDays size={14} className="text-slate-400" />
                            <span>
                              {new Date(item.startDate).toLocaleDateString()} -{" "}
                              {new Date(item.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="max-w-xs truncate px-6 py-4 text-xs text-slate-500">
                          {item.reason}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700"
                                : item.status === "REJECTED"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {item.status === "APPROVED" ? (
                              <CheckCircle2 size={13} />
                            ) : item.status === "REJECTED" ? (
                              <XCircle size={13} />
                            ) : (
                              <Clock3 size={13} />
                            )}
                            {item.status}
                          </span>
                        </td>
                        {canReview && (
                          <td className="px-6 py-4 text-right">
                            {item.status === "PENDING" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleReview(item.id, "APPROVED")}
                                  className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReview(item.id, "REJECTED")}
                                  className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">Reviewed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Submit Leave Request</h2>
            <p className="mt-1 text-xs text-slate-500">Provide dates and valid reason for time off</p>

            {formError && (
              <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-600">
                {formError}
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                  Reason for Request
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain the reason for taking leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Send size={15} />
                  {submitting ? "Submitting..." : "Apply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}