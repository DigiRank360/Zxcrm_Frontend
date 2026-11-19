import { useMemo, useState } from "react";
import {
  UserCheck,
  Timer,
  Search,
  Users,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import WorkTimerCard from "../components/WorkTimerCard";
import useNow from "../utils/useNow";
import { Person } from "../components/Avatar";
import { useCrm } from "../utils/CrmContext";
import { useAuth } from "../utils/AuthContext";
import { fmtDuration, istDate, workedSeconds } from "../utils/helpers";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import StatCard from "../components/StatCard";
import { Clock } from "lucide-react";
import HolidayCalendar from "../components/HolidayCalendar";

export default function Attendance() {
  const { attendance, holidays, users } = useCrm();
  const { user } = useAuth();
  const isAdmin = ["admin", "hr"].includes(user.role);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [month, setMonth] = useState(() => istDate().slice(0, 7));
  const [search, setSearch] = useState("");
  const now = useNow();
  const rows = isAdmin
    ? attendance
    : attendance.filter((row) =>
        row.userId ? row.userId === user.id : row.employee === user.name,
      );
  const todayRows = rows.filter((row) => row.date === istDate());
  const today = istDate();
  const todayHoliday = holidays.find((item) => item.date === today);
  const isSunday = new Date(`${today}T00:00:00Z`).getUTCDay() === 0;
  const attendanceByDate = isAdmin
    ? undefined
    : Object.fromEntries(rows.map((row) => [row.date, row.status]));
  const monthRows = rows.filter((row) =>
    row.date?.startsWith(today.slice(0, 7)),
  );
  const presentDays = new Set(
    monthRows
      .filter((r) => ["Present", "On-field"].includes(r.status))
      .map((r) => r.date),
  ).size;
  const monthHolidays = holidays.filter((item) =>
    item.date.startsWith(today.slice(0, 7)),
  ).length;
  const total = todayRows.reduce((s, a) => s + workedSeconds(a, now) / 3600, 0);
  const todayStaff = new Set(
    todayRows.map((row) => row.userId || row.employee),
  );
  const presentStaff = new Set(
    todayRows
      .filter((row) => ["Present", "On-field"].includes(row.status))
      .map((row) => row.userId || row.employee),
  );

  const employeeList = useMemo(() => {
    const accounts = users.filter(
      (item) => item.role === "employee" && item.active !== false,
    );
    const known = new Map(accounts.map((item) => [item.id || item.name, item]));
    attendance.forEach((row) => {
      const key = row.userId || row.employee;
      if (!known.has(key))
        known.set(key, {
          id: key,
          name: row.employee || key,
          role: "employee",
        });
    });
    return Array.from(known.entries())
      .map(([key, employee]) => ({
        key,
        id: employee.id || key,
        name: employee.name || key,
      }))
      .filter((employee) =>
        employee.name.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [attendance, search, users]);

  const selected = selectedEmployee
    ? employeeList.find((employee) => employee.key === selectedEmployee) || null
    : null;
  const selectedKey = selected?.key;
  const selectedRows = isAdmin
    ? attendance
        .filter((row) => (row.userId || row.employee) === selectedKey)
        .filter((row) => !month || row.date?.startsWith(month))
        .slice()
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            (b.checkIn || "").localeCompare(a.checkIn || ""),
        )
    : [];
  const selectedAttendanceByDate = Object.fromEntries(
    selectedRows.map((row) => [row.date, row.status]),
  );
  const presentCount = new Set(
    selectedRows
      .filter((row) => ["Present", "On-field"].includes(row.status))
      .map((row) => row.date),
  ).size;
  const halfDayCount = new Set(
    selectedRows
      .filter((row) => row.status === "Half-day")
      .map((row) => row.date),
  ).size;
  const sessionCount = selectedRows.length;
  const selectedHours = selectedRows.reduce(
    (total, row) => total + workedSeconds(row, now) / 3600,
    0,
  );

  const columns = [
    {
      key: "employee",
      label: "Employee",
      render: (r) => <Person name={r.employee} />,
    },
    { key: "date", label: "Date" },
    {
      key: "checkIn",
      label: "Check-in",
      render: (r) => (
        <span className="font-medium tabular-nums">{r.checkIn || "—"}</span>
      ),
    },
    {
      key: "checkOut",
      label: "Check-out",
      render: (r) => (
        <span className="font-medium tabular-nums">{r.checkOut || "—"}</span>
      ),
    },
    {
      key: "hours",
      label: "Hours",
      render: (r) => (
        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">
          {fmtDuration(workedSeconds(r, now))}
        </span>
      ),
    },
    {
      key: "photo",
      label: "Check-in photo",
      render: (r) =>
        r.photoUrl ? (
          <a
            href={r.photoUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-700 underline"
          >
            View photo
          </a>
        ) : (
          "—"
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge>{r.status}</Badge>,
    },
  ];

  if (isAdmin) {
    return (
      <>
        <PageHeader
          eyebrow={user.role === "hr" ? "Human resources" : "Administration"}
          title="Employee attendance"
          subtitle="Select an employee to review all attendance sessions and monthly totals."
        />
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Employees"
            value={employeeList.length}
            icon={Users}
          />
          <StatCard
            label="Present / On-field today"
            value={presentStaff.size}
            icon={UserCheck}
            tone="green"
          />
          <StatCard
            label="Total hours today"
            value={total.toFixed(1)}
            icon={Clock}
          />
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Present days"
            value={presentCount}
            icon={UserCheck}
            tone="green"
          />
          <StatCard
            label="Attendance sessions"
            value={sessionCount}
            icon={Timer}
          />
          <StatCard
            label="Half days"
            value={halfDayCount}
            icon={Clock}
            tone="amber"
          />
          <StatCard
            label="Worked hours"
            value={selectedHours.toFixed(1)}
            icon={Clock}
            tone="green"
          />
        </div>

        <section className="mb-5">
          <div className="card mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <label className="relative block w-full lg:max-w-sm">
              <span className="sr-only">Search employee</span>
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="input !pl-9"
                placeholder="Search employee..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Attendance month
              <input
                type="month"
                className="input mt-1 w-full lg:w-48"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {employeeList.map((employee) => {
              const employeeRows = attendance.filter(
                (row) =>
                  (row.userId || row.employee) === employee.key &&
                  (!month || row.date?.startsWith(month)),
              );
              const employeePresentDays = new Set(
                employeeRows
                  .filter((row) => ["Present", "On-field"].includes(row.status))
                  .map((row) => row.date),
              ).size;
              const employeeHours = employeeRows.reduce(
                (total, row) => total + workedSeconds(row, now) / 3600,
                0,
              );
              const active = selectedKey === employee.key;
              return (
                <button
                  type="button"
                  key={employee.key}
                  onClick={() => setSelectedEmployee(employee.key)}
                  className={`card card-hover group !p-4 text-left ${
                    active
                      ? "border-brand-300 ring-2 ring-brand-200"
                      : "border-white/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Person name={employee.name} sub={month} />
                    <ChevronRight
                      size={18}
                      className={`mt-1 transition ${active ? "text-brand-600" : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-brand-500"}`}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50/80 px-2 py-3">
                    <div className="px-2 text-center">
                      <p className="text-lg font-extrabold text-emerald-700">
                        {employeePresentDays}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Present
                      </p>
                    </div>
                    <div className="px-2 text-center">
                      <p className="text-lg font-extrabold text-slate-800">
                        {employeeRows.length}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Sessions
                      </p>
                    </div>
                    <div className="px-2 text-center">
                      <p className="text-lg font-extrabold text-brand-700">
                        {employeeHours.toFixed(1)}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Hours
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <CalendarDays size={14} className="text-brand-500" />
                    Open monthly record
                  </div>
                </button>
              );
            })}
          </div>
          {!employeeList.length && (
            <p className="py-6 text-center text-sm text-slate-400">
              No employee attendance found.
            </p>
          )}
        </section>

        {!selected && employeeList.length > 0 && (
          <section className="card mb-5 flex min-h-36 flex-col items-center justify-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <CalendarDays size={22} />
            </span>
            <h2 className="font-bold text-slate-900">Select an employee</h2>
            <p className="mt-1 text-sm text-slate-500">
              Click an employee card to view the calendar and monthly attendance
              record.
            </p>
          </section>
        )}

        {selected && (
          <>
            <HolidayCalendar
              key={`${selectedKey}-${month}`}
              canManage={isAdmin}
              attendanceByDate={selectedAttendanceByDate}
              initialMonth={month}
              onMonthChange={setMonth}
            />

            <section className="card mb-5 !p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <h2 className="section-title">{selected.name}</h2>
                  <p className="text-xs text-slate-500">
                    {month ? `Attendance for ${month}` : "All attendance dates"}
                  </p>
                </div>
                <Badge>{presentCount} present days</Badge>
              </div>
              <DataTable
                columns={[
                  {
                    key: "date",
                    label: "Date",
                    render: (row) => (
                      <span className="font-semibold text-slate-800">
                        {row.date}
                      </span>
                    ),
                  },
                  {
                    key: "checkIn",
                    label: "Check-in",
                    render: (row) => (
                      <span className="font-medium tabular-nums">
                        {row.checkIn || "—"}
                      </span>
                    ),
                  },
                  {
                    key: "checkOut",
                    label: "Check-out",
                    render: (row) => (
                      <span className="font-medium tabular-nums">
                        {row.checkOut || "—"}
                      </span>
                    ),
                  },
                  {
                    key: "hours",
                    label: "Hours",
                    render: (row) => (
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">
                        {fmtDuration(workedSeconds(row, now))}
                      </span>
                    ),
                  },
                  {
                    key: "photo",
                    label: "Photo",
                    render: (row) =>
                      row.photoUrl ? (
                        <a
                          href={row.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-brand-700 underline"
                        >
                          View photo
                        </a>
                      ) : (
                        "—"
                      ),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (row) => <Badge>{row.status}</Badge>,
                  },
                ]}
                rows={selectedRows}
                empty={`No attendance records for ${month}.`}
              />
            </section>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={user.role === "hr" ? "Human resources" : "Employee"}
        title="Attendance"
        subtitle={isAdmin ? "All employees" : `Signed in as ${user.name}`}
      />
      {(todayHoliday || isSunday) && (
        <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
          Today is{" "}
          {todayHoliday
            ? `a holiday: ${todayHoliday.name}`
            : "a weekly off (Sunday)"}
          . It is not counted as an absence.
        </p>
      )}
      {!isAdmin && <WorkTimerCard employee={user.name} userId={user.id} />}
      {!isAdmin && (
        <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Attendance is not yet restricted to a 10 m location radius. Configure
          the office or site coordinates before enabling location verification.
        </p>
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total hours today"
          value={total.toFixed(1)}
          icon={Clock}
        />
        <StatCard
          label="Present / On-field"
          value={presentStaff.size}
          icon={UserCheck}
          tone="green"
        />
        <StatCard
          label="Avg hours"
          value={(todayStaff.size ? total / todayStaff.size : 0).toFixed(1)}
          icon={Timer}
          tone="amber"
        />
      </div>
      {!isAdmin && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Days present this month"
            value={presentDays}
            icon={UserCheck}
            tone="green"
          />
          <StatCard
            label="Holidays this month"
            value={monthHolidays}
            icon={Clock}
            tone="amber"
          />
          <StatCard
            label="Today"
            value={
              todayHoliday
                ? "Holiday"
                : isSunday
                  ? "Weekly off"
                  : todayRows[0]?.status || "Not checked in"
            }
            icon={Timer}
          />
        </div>
      )}
      <HolidayCalendar
        canManage={isAdmin}
        attendanceByDate={attendanceByDate}
      />
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
