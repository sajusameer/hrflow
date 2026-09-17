import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/session";
import { wouldCreateCycle } from "@/lib/department-hierarchy";

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

// GET /api/departments/[id] - Get department details with hierarchy & employees
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        head: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employmentStatus: true,
          },
        },
        employees: {
          select: {
            id: true,
            fullName: true,
            position: true,
            employmentStatus: true,
            email: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, message: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, department }, { status: 200 });
  } catch (error) {
    console.error("Get department detail error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch department" },
      { status: 500 }
    );
  }
}

// PUT /api/departments/[id] - Update department, change parent, or assign head
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN" && session.role !== "HR_MANAGER") {
      return NextResponse.json(
        { success: false, message: "You are not authorized to edit departments" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, parentId, headId } = body;

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Department not found" },
        { status: 404 }
      );
    }

    // Hierarchy cycle validation
    if (parentId !== undefined && parentId !== null) {
      const isCycle = await wouldCreateCycle(id, parentId);
      if (isCycle) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid hierarchy: Department cannot be its own parent or a descendant of itself",
          },
          { status: 400 }
        );
      }
    }

    // Department head validation (Must be an ACTIVE employee)
    if (headId) {
      const headEmployee = await prisma.employee.findUnique({
        where: { id: headId },
        select: { id: true, employmentStatus: true },
      });

      if (!headEmployee) {
        return NextResponse.json(
          { success: false, message: "Specified department head does not exist" },
          { status: 404 }
        );
      }

      if (headEmployee.employmentStatus !== "ACTIVE") {
        return NextResponse.json(
          { success: false, message: "Department head must be an active employee" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: name ? name.trim() : existing.name,
        description: description !== undefined ? description : existing.description,
        parentId: parentId !== undefined ? parentId : existing.parentId,
        headId: headId !== undefined ? headId : existing.headId,
      },
      include: {
        parent: { select: { id: true, name: true } },
        head: { select: { id: true, fullName: true } },
        children: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { success: true, message: "Department updated successfully", department: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update department error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update department" },
      { status: 500 }
    );
  }
}