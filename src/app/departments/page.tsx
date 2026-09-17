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
  Edit2,
  X,
  AlertCircle,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";

interface Employee {
  id: string;
  fullName: string;
  position?: string;
  email?: string;
}

interface DepartmentNode {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  head?: Employee | null;
  _count?: {
    employees: number;
    children: number;
  };
  children?: DepartmentNode[];
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentNode[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [headId, setHeadId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Edit Modal State
  const [editingDept, setEditingDept] = useState<DepartmentNode | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [editHeadId, setEditHeadId] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

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

  const openEditModal = (dept: DepartmentNode) => {
    setEditingDept(dept);
    setEditName(dept.name);
    setEditDescription(dept.description || "");
    setEditParentId(dept.parentId || "");
    setEditHeadId(dept.head?.id || "");
    setEditError("");
  };

  const handleUpdateDepartment = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setEditSubmitting(true);
    setEditError("");

    try {
      const res = await fetch(`/api/departments/${editingDept.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription || undefined,
          parentId: editParentId || null,
          headId: editHeadId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.message || "Failed to update department");
        return;
      }

      setEditingDept(null);
      fetchData();
    } catch {
      setEditError("Unexpected error occurred while updating");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Recursive tree builder
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
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                Department Hierarchy
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                Organizational structure, department heads, and reporting units
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Plus size={18} />
                Add Department
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400 dark:text-zinc-500">
                    Total Departments
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {departments.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <FolderTree size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400 dark:text-zinc-500">
                    Top-Level Units
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {departmentTree.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400 dark:text-zinc-500">
                    Assigned Heads
                  </p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {departments.filter((d) => d.head).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hierarchy Organogram View */}
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">Organizational Chart</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  Parent to child department reporting relationships
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400 dark:text-zinc-500">
                Loading organizational tree...
              </div>
            ) : departmentTree.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400 dark:text-zinc-500">
                No departments found. Create the root organization department first.
              </div>
            ) : (
              <div className="space-y-3">
                {departmentTree.map((node) => (
                  <DepartmentTreeItem
                    key={node.id}
                    node={node}
                    level={0}
                    canManage={canManage}
                    onEdit={openEditModal}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Department Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Department</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDepartment} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Human Resources"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-transparent p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">
                  Parent Department (Optional)
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
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
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">
                  Department Head (Optional)
                </label>
                <select
                  value={headId}
                  onChange={(e) => setHeadId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                >
                  <option value="">Select an active employee...</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} {emp.position ? `(${emp.position})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief role and responsibilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-transparent p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
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

      {/* Edit / Move Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Department</h2>
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle size={15} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateDepartment} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-transparent p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">
                  Parent Department (Cycle Protected)
                </label>
                <select
                  value={editParentId}
                  onChange={(e) => setEditParentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                >
                  <option value="">No Parent (Root Unit)</option>
                  {departments
                    .filter((d) => d.id !== editingDept.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">
                  Department Head
                </label>
                <select
                  value={editHeadId}
                  onChange={(e) => setEditHeadId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                >
                  <option value="">No Head Assigned</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} {emp.position ? `(${emp.position})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-transparent p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="rounded-lg border border-slate-200 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {editSubmitting ? "Updating..." : "Update Department"}
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
function DepartmentTreeItem({
  node,
  level,
  canManage,
  onEdit,
}: {
  node: DepartmentNode;
  level: number;
  canManage: boolean;
  onEdit: (dept: DepartmentNode) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const memberCount = node._count?.employees ?? 0;

  return (
    <div className="space-y-2">
      <div
        style={{ marginLeft: `${level * 24}px` }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 p-3.5 transition hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-white dark:hover:bg-zinc-800/80"
      >
        <div className="flex items-center gap-3">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <div className="w-4" />
          )}

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <Building2 size={18} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{node.name}</h3>
            {node.description && (
              <p className="text-xs text-slate-400 dark:text-zinc-500">{node.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-slate-500 dark:text-zinc-400">
          {node.head ? (
            <div className="flex items-center gap-1.5 rounded-md bg-white dark:bg-zinc-800 px-2.5 py-1 border border-slate-200 dark:border-zinc-700">
              <UserCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>
                Head: <strong className="text-slate-700 dark:text-zinc-200">{node.head.fullName}</strong>
              </span>
            </div>
          ) : (
            <span className="hidden sm:inline text-slate-400 dark:text-zinc-500">No Head Assigned</span>
          )}

          <div className="flex items-center gap-1 rounded-md bg-white dark:bg-zinc-800 px-2.5 py-1 border border-slate-200 dark:border-zinc-700">
            <Users size={13} className="text-slate-400 dark:text-zinc-500" />
            <span>{memberCount} Members</span>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => onEdit(node)}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
              title="Edit Department or Change Hierarchy"
            >
              <Edit2 size={12} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="space-y-2">
          {node.children!.map((child) => (
            <DepartmentTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              canManage={canManage}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}