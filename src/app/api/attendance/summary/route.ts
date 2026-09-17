import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Total active employees
    const totalActiveEmployees = await prisma.employee.count({
      where: { employmentStatus: "ACTIVE" },
    });

    // Today's attendances
    const todayRecords = await prisma.attendance.findMany({
      where: { date: todayUtc },
    });

    const presentCount = todayRecords.length;
    const notClockedOutCount = todayRecords.filter((r) => r.clockOut === null).length;
    const lateCount = todayRecords.filter((r) => r.status === "LATE").length;
    const absentCount = Math.max(0, totalActiveEmployees - presentCount);

    return NextResponse.json({
      success: true,
      data: {
        totalActiveEmployees,
        presentCount,
        absentCount,
        notClockedOutCount,
        lateCount,
      },
    });
  } catch (error) {
    console.error("Attendance Summary Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}