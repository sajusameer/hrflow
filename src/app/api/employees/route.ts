import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/session";
import { createEmployeeSchema } from "@/lib/validations/employee";

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

// GET /api/employees
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

    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get("search")?.trim() || "";
    const departmentId = searchParams.get("departmentId") || "";
    const status = searchParams.get("status") || "";

    const employees = await prisma.employee.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  fullName: {
                    contains: search,
                  },
                },
                {
                  email: {
                    contains: search,
                  },
                },
                {
                  position: {
                    contains: search,
                  },
                },
              ],
            }
          : {}),

        ...(departmentId
          ? {
              departmentId,
            }
          : {}),

        ...(status
          ? {
              employmentStatus: status as
                | "ACTIVE"
                | "INACTIVE"
                | "ON_LEAVE"
                | "TERMINATED",
            }
          : {}),
      },

      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error("Get employees error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch employees",
      },
      { status: 500 }
    );
  }
}

// POST /api/employees
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
          message: "You are not authorized to create employees",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const result = createEmployeeSchema.safeParse(body);

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

    const {
      fullName,
      email,
      password,
      phone,
      position,
      departmentId,
      employmentStatus,
      dateJoined,
    } = result.data;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is already registered",
        },
        { status: 409 }
      );
    }

    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: {
          id: departmentId,
        },
      });

      if (!department) {
        return NextResponse.json(
          {
            success: false,
            message: "Department not found",
          },
          { status: 404 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: "EMPLOYEE",

        employee: {
          create: {
            fullName,
            email: normalizedEmail,
            phone,
            position,
            employmentStatus,
            dateJoined: dateJoined
              ? new Date(dateJoined)
              : new Date(),
            departmentId: departmentId || null,
          },
        },
      },

      include: {
        employee: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Employee created successfully",
        employee: user.employee,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create employee error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create employee",
      },
      { status: 500 }
    );
  }
}