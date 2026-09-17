"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Search,
  Users,
  UserPlus,
  SlidersHorizontal,
  MoreHorizontal,
  X,
  Shield,
  Edit2,
  UserX,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";

type Employee = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  position: string;
  employmentStatus: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
  dateJoined: string;
  imageUrl: string | null;
  department: { id: string; name: string } | null;
  user?: {
    role: "EMPLOYEE" | "HR_MANAGER" | "ADMIN";
  } | null;
};

type Department = {
  id: string;
  name: string;
};

const statusStyles = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  ON_LEAVE: "bg-amber-50 text-amber-700",
  TERMINATED: "bg-red-50 text-red-700",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("EMPLOYEE");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // Modals & Menus
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Add Employee Form State
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    position: "",
    departmentId: "",
    employmentStatus: "ACTIVE",
    role: "EMPLOYEE",
    dateJoined: "",
  });

  // Edit Employee Form State
  const [editingEmployeeId, setEditingEmployeeId] = useState<string>("");
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    position: "",
    departmentId: "",
    employmentStatus: "ACTIVE",
    role: "EMPLOYEE",
  });

  // Fetch Current Logged-in User Session for RBAC
  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.role) {
            setCurrentUserRole(data.user.role);
          }
        }
      } catch (err) {
        console.error("Failed to load user role:", err);
      }
    }
    loadCurrentUser();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);

      const query = params.toString();
      const response = await fetch(`/api/employees${query ? `?${query}` : ""}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch employees");
      }

      setEmployees(data.employees || data.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load employees. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      const data = await response.json();
      if (response.ok) {
        setDepartments(data.departments || data.data || []);
      }
    } catch (err) {
      console.error("Department fetch error:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, status]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Add Employee Handler
  const handleAddEmployee = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setFormError("");

      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          departmentId: form.departmentId || undefined,
          dateJoined: form.dateJoined || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || "Failed to create employee");
        return;
      }

      setShowAddModal(false);
      setForm({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        position: "",
        departmentId: "",
        employmentStatus: "ACTIVE",
        role: "EMPLOYEE",
        dateJoined: "",
      });
      await fetchEmployees();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setEditForm({
      fullName: emp.fullName,
      phone: emp.phone || "",
      position: emp.position,
      departmentId: emp.department?.id || "",
      employmentStatus: emp.employmentStatus,
      role: emp.user?.role || "EMPLOYEE",
    });
    setActiveMenuId(null);
    setShowEditModal(true);
  };

  // Save Edit Changes Handler
  const handleEditEmployee = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setFormError("");

      const response = await fetch(`/api/employees/${editingEmployeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || "Failed to update employee");
        return;
      }

      setShowEditModal(false);
      await fetchEmployees();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Quick Deactivate Handler
  const handleQuickDeactivate = async (empId: string) => {
    if (!confirm("Are you sure you want to deactivate this employee? Historical attendance, leaves, and records will remain safely preserved.")) return;
    try {
      const response = await fetch(`/api/employees/${empId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employmentStatus: "INACTIVE" }),
      });
      if (response.ok) {
        await fetchEmployees();
      }
    } catch (err) {
      console.error("Deactivate error:", err);
    } finally {
      setActiveMenuId(null);
    }
  };

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));

  const initials = (name: string) =>
    name
      .split(" ")
      .map((item) => item[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  // RBAC Permission Check
  const canManage = currentUserRole === "ADMIN" || currentUserRole === "HR_MANAGER";

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-emerald-600">
                <Users size={20} />
                <span className="text-sm font-semibold">People</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                Employees
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage organization personnel, roles, profile details, and department allocations.
              </p>
            </div>

            {/* ONLY visible to ADMIN and HR_MANAGER */}
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setShowAddModal(true);
                }}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
              >
                <UserPlus size={18} />
                Add Employee
              </button>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search by name, email or position..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="relative">
                <SlidersHorizontal
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-700 outline-none focus:border-emerald-500 md:w-48"
                >
                  <option value="">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_LEAVE">On leave</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex min-h-64 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
                  <p className="text-sm text-slate-500">Loading employees...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex min-h-64 items-center justify-center px-6 text-center">
                <div>
                  <p className="text-sm font-medium text-red-600">{error}</p>
                  <button
                    type="button"
                    onClick={fetchEmployees}
                    className="mt-3 text-sm font-semibold text-emerald-600"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : employees.length === 0 ? (
              <div className="flex min-h-64 items-center justify-center px-6 text-center">
                <div>
                  <Users size={32} className="mx-auto mb-3 text-slate-300" />
                  <h3 className="text-sm font-semibold text-slate-700">
                    No employees found
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Try changing your search or filter.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Role & Position</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4">Status</th>
                      {/* Action Column visible ONLY to ADMIN and HR_MANAGER */}
                      {canManage && <th className="px-6 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                              {initials(employee.fullName)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {employee.fullName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {employee.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-700">{employee.position}</div>
                          {employee.user?.role && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              <Shield size={10} />
                              {employee.user.role}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {employee.department?.name ? (
                            <span className="font-medium text-slate-700">{employee.department.name}</span>
                          ) : (
                            <span className="text-xs text-slate-400">Unassigned</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDate(employee.dateJoined)}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[employee.employmentStatus]}`}
                          >
                            {employee.employmentStatus.replace("_", " ")}
                          </span>
                        </td>

                        {/* Action Cell visible ONLY to ADMIN and HR_MANAGER */}
                        {canManage && (
                          <td className="relative px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(activeMenuId === employee.id ? null : employee.id)
                              }
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {activeMenuId === employee.id && (
                              <div className="absolute right-6 top-12 z-20 w-44 rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg text-left">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(employee)}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  <Edit2 size={14} className="text-emerald-600" />
                                  Edit Details
                                </button>
                                {employee.employmentStatus !== "INACTIVE" && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickDeactivate(employee.id)}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                                  >
                                    <UserX size={14} />
                                    Deactivate
                                  </button>
                                )}
                              </div>
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
      </main>

      {/* Edit Employee Modal */}
      {showEditModal && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Employee</h2>
                <p className="text-xs text-slate-500">Update employee profile and departmental assignment</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditEmployee} className="space-y-4 p-6">
              {formError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Full Name
                </label>
                <input
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Position
                  </label>
                  <input
                    required
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Phone
                  </label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    placeholder="+8801..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Department
                  </label>
                  <select
                    value={editForm.departmentId}
                    onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    System Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value as "EMPLOYEE" | "HR_MANAGER" | "ADMIN" })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Employment Status
                </label>
                <select
                  value={editForm.employmentStatus}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      employmentStatus: e.target.value as "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED",
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive (Deactivated)</option>
                  <option value="ON_LEAVE">On leave</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add Employee</h2>
                <p className="text-sm text-slate-500">Create a new employee account with credentials.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-5 p-6">
              {formError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name *</label>
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Password *</label>
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                    placeholder="+8801..."
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Position *</label>
                  <input
                    required
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                    placeholder="Frontend Developer"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Department</label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="">Unassigned</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Employment Status</label>
                  <select
                    value={form.employmentStatus}
                    onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On leave</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Date Joined</label>
                  <input
                    type="date"
                    value={form.dateJoined}
                    onChange={(e) => setForm({ ...form, dateJoined: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}