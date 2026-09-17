import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeaveType, LeaveStatus } from "@prisma/client";

// GET: Fetch leave requests with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status") as LeaveStatus | null;

    const whereClause: Record<string, unknown> = {};

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (status && Object.values(LeaveStatus).includes(status)) {
      whereClause.status = status;
    }

    const leaves = await prisma.leaveRequest.findMany({
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
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: leaves }, { status: 200 });
  } catch (error) {
    console.error("Leave GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Submit a new leave request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, leaveType, startDate, endDate, reason } = body;

    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, message: "All required fields must be provided." },
        { status: 400 }
      );
    }

    if (!Object.values(LeaveType).includes(leaveType)) {
      return NextResponse.json(
        { success: false, message: "Invalid leave type." },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date ordering
    if (start > end) {
      return NextResponse.json(
        { success: false, message: "Start date cannot be after end date." },
        { status: 400 }
      );
    }

    // Verify employee is active
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, employmentStatus: true },
    });

    if (!employee || employee.employmentStatus !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "Employee not found or inactive." },
        { status: 403 }
      );
    }

    // Overlapping Leave Check (checks existing PENDING or APPROVED requests)
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have a pending or approved leave request for this date range.",
        },
        { status: 400 }
      );
    }

    const newLeave = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType,
        startDate: start,
        endDate: end,
        reason,
        status: LeaveStatus.PENDING,
      },
      include: {
        employee: { select: { fullName: true } },
      },
    });

    return NextResponse.json(
      { success: true, message: "Leave request submitted successfully.", data: newLeave },
      { status: 201 }
    );
  } catch (error) {
    console.error("Leave POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}