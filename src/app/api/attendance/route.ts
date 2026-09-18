import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to get normalized UTC midnight date
function getTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// GET: Fetch attendance records
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const dateParam = searchParams.get("date");
    const status = searchParams.get("status");

    const whereClause: Record<string, unknown> = {};

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (dateParam) {
      const parsedDate = new Date(dateParam);
      const utcDate = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));
      whereClause.date = utcDate;
    }

    if (status) {
      whereClause.status = status;
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ success: true, data: attendances }, { status: 200 });
  } catch (error) {
    console.error("Attendance GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Handles Clock-In & Clock-Out action
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, notes, action } = body;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "Employee ID is required." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, employmentStatus: true },
    });

    if (!employee || employee.employmentStatus !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "Employee not found or is inactive." },
        { status: 403 }
      );
    }

    const todayUtc = getTodayUtc();
    const now = new Date();

    // Clock-Out Logic
    if (action === "CLOCK_OUT") {
      const record = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date: todayUtc,
          },
        },
      });

      if (!record) {
        return NextResponse.json(
          { success: false, message: "No clock-in record found for today. You must clock in first." },
          { status: 400 }
        );
      }

      if (record.clockOut) {
        return NextResponse.json(
          { success: false, message: "Already clocked out for today." },
          { status: 400 }
        );
      }

      const updated = await prisma.attendance.update({
        where: { id: record.id },
        data: { clockOut: now },
      });

      return NextResponse.json(
        { success: true, message: "Clocked out successfully.", data: updated },
        { status: 200 }
      );
    }

    // Clock-In Logic
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: todayUtc,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Attendance already clocked in for today." },
        { status: 400 }
      );
    }

    // Calculate Late status using Nigerian Time (Africa/Lagos)
    const lagosTimeParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Lagos",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(now);

    const lagosHour = parseInt(lagosTimeParts.find((p) => p.type === "hour")?.value || "0", 10);
    const lagosMinute = parseInt(lagosTimeParts.find((p) => p.type === "minute")?.value || "0", 10);
    const isLate = lagosHour > 9 || (lagosHour === 9 && lagosMinute > 15);

    const record = await prisma.attendance.create({
      data: {
        employeeId,
        date: todayUtc,
        clockIn: now,
        status: isLate ? "LATE" : "PRESENT",
        notes: notes || null,
      },
      include: {
        employee: { select: { fullName: true } },
      },
    });

    return NextResponse.json(
      { success: true, message: "Clocked in successfully.", data: record },
      { status: 201 }
    );
  } catch (error) {
    console.error("Attendance POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Fallback Clock-out
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "Employee ID is required." },
        { status: 400 }
      );
    }

    const todayUtc = getTodayUtc();
    const record = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: todayUtc,
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, message: "No clock-in record found for today. You must clock in first." },
        { status: 400 }
      );
    }

    if (record.clockOut) {
      return NextResponse.json(
        { success: false, message: "Already clocked out for today." },
        { status: 400 }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: { clockOut: new Date() },
    });

    return NextResponse.json(
      { success: true, message: "Clocked out successfully.", data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Attendance PATCH Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}