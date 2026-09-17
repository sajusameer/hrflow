import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });
    }

    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Get employee profile linked to user
    const employee = await prisma.employee.findUnique({
      where: { userId: session.userId },
      include: { department: true },
    });

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee profile not found" }, { status: 404 });
    }

    // Today's attendance record of the logged-in user
    const myTodayAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: todayUtc,
        },
      },
    });

    // Stats for regular EMPLOYEE role
    if (session.role === "EMPLOYEE") {
      const myPendingLeaves = await prisma.leaveRequest.count({
        where: { employeeId: employee.id, status: "PENDING" },
      });

      const myTotalLeaves = await prisma.leaveRequest.count({
        where: { employeeId: employee.id },
      });

      return NextResponse.json({
        success: true,
        role: session.role,
        data: {
          employee,
          myTodayAttendance,
          myPendingLeaves,
          myTotalLeaves,
        },
      });
    }

    // Organization-wide stats for ADMIN / HR_MANAGER
    const totalEmployees = await prisma.employee.count({
      where: { employmentStatus: "ACTIVE" },
    });

    const totalDepartments = await prisma.department.count();

    const todayAttendances = await prisma.attendance.findMany({
      where: { date: todayUtc },
    });

    const presentToday = todayAttendances.length;
    const notClockedOut = todayAttendances.filter((a) => !a.clockOut).length;
    const absentToday = Math.max(0, totalEmployees - presentToday);

    const pendingLeaves = await prisma.leaveRequest.count({
      where: { status: "PENDING" },
    });

    const recentLeaves = await prisma.leaveRequest.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        employee: { select: { fullName: true, position: true } },
      },
    });

    return NextResponse.json({
      success: true,
      role: session.role,
      data: {
        employee,
        myTodayAttendance,
        totalEmployees,
        totalDepartments,
        presentToday,
        absentToday,
        notClockedOut,
        pendingLeaves,
        recentLeaves,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats API Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}