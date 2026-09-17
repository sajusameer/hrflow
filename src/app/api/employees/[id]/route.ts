import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session || (session.role !== "ADMIN" && session.role !== "HR_MANAGER")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { fullName, phone, position, departmentId, employmentStatus, role } = body;

    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingEmployee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    // Update Employee record
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        fullName: fullName ?? existingEmployee.fullName,
        phone: phone !== undefined ? phone : existingEmployee.phone,
        position: position ?? existingEmployee.position,
        departmentId: departmentId === "" ? null : departmentId ?? existingEmployee.departmentId,
        employmentStatus: employmentStatus ?? existingEmployee.employmentStatus,
      },
      include: {
        department: { select: { id: true, name: true } },
        user: { select: { role: true } },
      },
    });

    // If role changed and employee has an associated user account
    if (role && existingEmployee.userId) {
      await prisma.user.update({
        where: { id: existingEmployee.userId },
        data: { role },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}