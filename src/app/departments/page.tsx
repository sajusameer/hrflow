"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Building2,
  FolderTree,
  Plus,
  Users,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Briefcase,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";

interface Employee {
  id: string;
  fullName: string;
  position: string;
}

interface DepartmentNode {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  head?: Employee | null;
  employees: Employee[];
  children?: DepartmentNode[];
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentNode[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [headId, setHeadId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      const [deptRes, empRes, authRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/employees"),
        fetch("/api/auth/me"),
      ]);

      const deptData = await deptRes.json();
      const empData = await empRes.json();
      const authData = await authRes.json();

      if (authData.user) {
        setCurrentUserRole(authData.user.role);
      }

      if (deptData.departments) {
        setDepartments(deptData.departments);
      }

      if (empData.employees) {
        setEmployeesList(empData.employees);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDepartment = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          parentId: parentId || undefined,
          headId: headId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Failed to create department");
        return;
      }

      setShowModal(false);
      setName("");
      setDescription("");
      setParentId("");
      setHeadId("");
      fetchData();
    } catch {
      setFormError("Unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Build recursive tree from flat department array
  const buildTree = (
    items: DepartmentNode[],
    parentId: string | null = null
  ): DepartmentNode[] => {
    return items
      .filter((item) => (item.parentId || null) === parentId)
      .map((item) => ({
        ...item,
        children: buildTree(items, item.id),
      }));
  };

  const departmentTree = buildTree(departments);
  const canManage = currentUserRole === "ADMIN" || currentUserRole === "HR_MANAGER";

  return (
    <AppShell>
      <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Department Hierarchy
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Organizational structure, department heads, and reporting units
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Plus size={18} />
                Add Department
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Total Departments</p>
                  <p className="text-2xl font-bold text-slate-900">{departments.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FolderTree size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Top-Level Units</p>
                  <p className="text-2xl font-bold text-blue-600">{departmentTree.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Assigned Heads</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {departments.filter((d) => d.head).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hierarchy Organogram View */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-semibold text-slate-900">Organizational Chart</h2>
                <p className="text-xs text-slate-400">Parent to child department reporting relationships</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading organizational tree...</div>
            ) : departmentTree.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No departments found. Create the root organization department first.
              </div>
            ) : (
              <div className="space-y-3">
                {departmentTree.map((node) => (
                  <DepartmentTreeItem key={node.id} node={node} level={0} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Department Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add Department</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-600">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateDepartment} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Human Resources"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Parent Department (Optional)
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">No Parent (Root Unit)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Department Head (Optional)
                </label>
                <select
                  value={headId}
                  onChange={(e) => setHeadId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">Select an active employee...</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief role and responsibilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// Tree Node Component
function DepartmentTreeItem({ node, level }: { node: DepartmentNode; level: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="space-y-2">
      <div
        style={{ marginLeft: `${level * 24}px` }}
        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-emerald-300 hover:bg-white"
      >
        <div className="flex items-center gap-3">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-slate-600"
            >
              {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <div className="w-4" />
          )}

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Building2 size={18} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800">{node.name}</h3>
            {node.description && (
              <p className="text-xs text-slate-400">{node.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          {node.head ? (
            <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 border border-slate-200">
              <UserCheck size={13} className="text-emerald-600" />
              <span>
                Head: <strong className="text-slate-700">{node.head.fullName}</strong>
              </span>
            </div>
          ) : (
            <span className="hidden sm:inline text-slate-400">No Head Assigned</span>
          )}

          <div className="flex items-center gap-1 rounded-md bg-white px-2.5 py-1 border border-slate-200">
            <Users size={13} className="text-slate-400" />
            <span>{node.employees ? node.employees.length : 0} Members</span>
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="space-y-2">
          {node.children!.map((child) => (
            <DepartmentTreeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}