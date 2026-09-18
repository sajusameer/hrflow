import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();

    // Nigerian Calendar Date (YYYY-MM-DD in Africa/Lagos - WAT, UTC+1)
    const lagosDateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayStr = lagosDateFormatter.format(now); // e.g., "2026-09-18"

    // Nigerian Day Window (Boundary timestamps in UTC)
    const startOfToday = new Date(`${todayStr}T00:00:00.000+01:00`);
    const endOfToday = new Date(`${todayStr}T23:59:59.999+01:00`);

    // Normalized UTC Midnight Date (Fallback matching)
    const [year, month, day] = todayStr.split("-").map(Number);
    const todayUtcMidnight = new Date(Date.UTC(year, month - 1, day));

    // Active Employees Count
    const totalActiveEmployees = await prisma.employee.count({
      where: { employmentStatus: "ACTIVE" },
    });

    // Fetch Today's Attendances using Date Range and UTC Midnight check
    const todayRecords = await prisma.attendance.findMany({
      where: {
        OR: [
          { date: todayUtcMidnight },
          { date: { gte: startOfToday, lte: endOfToday } },
          { clockIn: { gte: startOfToday, lte: endOfToday } },
        ],
      },
      select: {
        id: true,
        employeeId: true,
        clockIn: true,
        clockOut: true,
        status: true,
      },
    });

    // Remove duplicates if the same employee has multiple matched records today
    const uniqueEmployeeAttendanceMap = new Map<string, typeof todayRecords[0]>();
    todayRecords.forEach((record) => {
      if (!uniqueEmployeeAttendanceMap.has(record.employeeId)) {
        uniqueEmployeeAttendanceMap.set(record.employeeId, record);
      }
    });

    const uniqueRecords = Array.from(uniqueEmployeeAttendanceMap.values());

    const presentCount = uniqueRecords.length;
    const notClockedOutCount = uniqueRecords.filter((r) => r.clockOut === null).length;
    const lateCount = uniqueRecords.filter((r) => r.status === "LATE").length;
    const onTimeCount = uniqueRecords.filter((r) => r.status === "PRESENT").length;
    const absentCount = Math.max(0, totalActiveEmployees - presentCount);

    return NextResponse.json(
      {
        success: true,
        data: {
          totalActiveEmployees,
          presentCount,
          onTimeCount,
          absentCount,
          notClockedOutCount,
          lateCount,
          date: todayStr,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Attendance Summary GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load attendance summary." },
      { status: 500 }
    );
  }
}