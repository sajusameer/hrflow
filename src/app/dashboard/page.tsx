import {
  ArrowUpRight,
  CalendarCheck,
  ClipboardList,
  Users,
  Building2,
  Clock3,
  MessageSquare,
  UserPlus,
} from "lucide-react";

import AppShell from "@/components/layout/app-shell";

const stats = [
  {
    label: "Total Employees",
    value: "24",
    change: "+8.2%",
    description: "from last month",
    icon: Users,
  },
  {
    label: "Present Today",
    value: "18",
    change: "75%",
    description: "attendance rate",
    icon: CalendarCheck,
  },
  {
    label: "Pending Leave",
    value: "06",
    change: "Needs review",
    description: "leave requests",
    icon: ClipboardList,
  },
  {
    label: "Departments",
    value: "08",
    change: "+2",
    description: "active departments",
    icon: Building2,
  },
];

const activities = [
  {
    title: "New employee added",
    description: "Daniel Okoye joined Engineering",
    time: "10 minutes ago",
    icon: UserPlus,
  },
  {
    title: "Leave request submitted",
    description: "Fatima Bello requested annual leave",
    time: "35 minutes ago",
    icon: ClipboardList,
  },
  {
    title: "Department updated",
    description: "Frontend Engineering details updated",
    time: "1 hour ago",
    icon: Building2,
  },
  {
    title: "New message received",
    description: "You received a message from HR",
    time: "2 hours ago",
    icon: MessageSquare,
  },
];

const departments = [
  {
    name: "Engineering",
    employees: 12,
    percentage: 75,
  },
  {
    name: "People Operations",
    employees: 6,
    percentage: 45,
  },
  {
    name: "Recruitment",
    employees: 4,
    percentage: 30,
  },
  {
    name: "Finance",
    employees: 2,
    percentage: 18,
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Page heading */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-emerald-600">
                Thursday, September 17, 2026
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Good morning, Amina
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Here is what is happening across your organization today.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <UserPlus size={17} />
              Add employee
            </button>
          </div>

          {/* Statistics */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

                    <ArrowUpRight
                      size={18}
                      className="text-slate-300"
                    />
                  </div>

                  <p className="mt-5 text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>

                  <div className="mt-2 flex items-end gap-2">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                      {stat.value}
                    </h2>

                    <span className="mb-1 text-xs font-semibold text-emerald-600">
                      {stat.change}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </section>

          {/* Main dashboard content */}
          <section className="grid gap-6 xl:grid-cols-3">
            {/* Attendance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Attendance overview
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Today&apos;s employee attendance summary
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Clock3 size={20} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">
                    Present
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-900">
                    18
                  </p>

                  <p className="mt-1 text-xs text-emerald-700">
                    Employees checked in
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-sm text-amber-700">
                    Late
                  </p>

                  <p className="mt-2 text-2xl font-bold text-amber-900">
                    03
                  </p>

                  <p className="mt-1 text-xs text-amber-700">
                    Arrived after 9:00 AM
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 p-4">
                  <p className="text-sm text-slate-600">
                    Absent
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    06
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Not checked in yet
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">
                    Attendance rate
                  </span>

                  <span className="font-semibold text-slate-900">
                    75%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: "75%" }}
                  />
                </div>
              </div>
            </div>

            {/* Pending leave */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Pending leave
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Requests awaiting review
                  </p>
                </div>

                <ClipboardList
                  size={20}
                  className="text-amber-600"
                />
              </div>

              <div className="mt-6 space-y-4">
                {[
                  {
                    name: "Fatima Bello",
                    type: "Annual leave",
                    days: "3 days",
                  },
                  {
                    name: "Daniel Okoye",
                    type: "Sick leave",
                    days: "1 day",
                  },
                  {
                    name: "Tunde Adeyemi",
                    type: "Personal leave",
                    days: "2 days",
                  },
                ].map((request) => (
                  <div
                    key={request.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {request.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {request.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          {request.type}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                      {request.days}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="mt-6 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                View all requests
              </button>
            </div>
          </section>

          {/* Lower dashboard content */}
          <section className="grid gap-6 lg:grid-cols-2">
            {/* Departments */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Department overview
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Employee distribution by department
                  </p>
                </div>

                <Building2
                  size={20}
                  className="text-emerald-600"
                />
              </div>

              <div className="mt-6 space-y-5">
                {departments.map((department) => (
                  <div key={department.name}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-700">
                        {department.name}
                      </span>

                      <span className="text-xs text-slate-500">
                        {department.employees} employees
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{
                          width: `${department.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Recent activity
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Latest updates from your workspace
                  </p>
                </div>

                <MessageSquare
                  size={20}
                  className="text-emerald-600"
                />
              </div>

              <div className="mt-6 space-y-5">
                {activities.map((activity) => {
                  const Icon = activity.icon;

                  return (
                    <div
                      key={`${activity.title}-${activity.time}`}
                      className="flex gap-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <Icon size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {activity.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {activity.description}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}