import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/session";
import { createDepartmentSchema } from "@/lib/validations/department";

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);

  if (!session) {
    return null;
  }

  return session;
}

// GET /api/departments
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedUser(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const departments = await prisma.department.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },

        head: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employmentStatus: true,
          },
        },

        _count: {
          select: {
            employees: true,
            children: true,
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch departments",
      },
      { status: 500 }
    );
  }
}

// POST /api/departments
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedUser(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    if (
      session.role !== "ADMIN" &&
      session.role !== "HR_MANAGER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to create departments",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const result = createDepartmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, description, parentId } = result.data;

    if (parentId) {
      const parentDepartment = await prisma.department.findUnique({
        where: {
          id: parentId,
        },
      });

      if (!parentDepartment) {
        return NextResponse.json(
          {
            success: false,
            message: "Parent department not found",
          },
          { status: 404 }
        );
      }
    }

    const existingDepartment = await prisma.department.findFirst({
      where: {
        name: {
          equals: name.trim(),
        },
      },
    });

    if (existingDepartment) {
      return NextResponse.json(
        {
          success: false,
          message: "Department with this name already exists",
        },
        { status: 409 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        parentId: parentId || null,
      },

      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },

        head: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employmentStatus: true,
          },
        },

        _count: {
          select: {
            employees: true,
            children: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Department created successfully",
        department,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create department error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create department",
      },
      { status: 500 }
    );
  }
}