import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { reviewerId, status, reviewNotes } = body;

    if (!reviewerId || !status) {
      return NextResponse.json(
        { success: false, message: "Reviewer ID and target status are required." },
        { status: 400 }
      );
    }

    if (status !== LeaveStatus.APPROVED && status !== LeaveStatus.REJECTED) {
      return NextResponse.json(
        { success: false, message: "Status must be either APPROVED or REJECTED." },
        { status: 400 }
      );
    }

    // Verify leave request exists and is in PENDING state
    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leave) {
      return NextResponse.json(
        { success: false, message: "Leave request not found." },
        { status: 404 }
      );
    }

    if (leave.status !== LeaveStatus.PENDING) {
      return NextResponse.json(
        { success: false, message: `Cannot update a leave request that is already ${leave.status}.` },
        { status: 400 }
      );
    }

    // Verify reviewer employee exists
    const reviewer = await prisma.employee.findUnique({
      where: { id: reviewerId },
    });

    if (!reviewer) {
      return NextResponse.json(
        { success: false, message: "Reviewer employee not found." },
        { status: 404 }
      );
    }

    // Update with complete audit trail
    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewerId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
      include: {
        employee: { select: { fullName: true, email: true } },
        reviewer: { select: { fullName: true, email: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Leave request has been marked as ${status}.`,
        data: updatedLeave,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Leave Review PATCH Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}