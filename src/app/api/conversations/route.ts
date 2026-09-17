import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/session";
import { getVisibleDepartmentIdsForEmployee } from "@/lib/messaging-visibility";
import { ConversationType } from "@prisma/client";

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

// GET /api/conversations - List conversations accessible by the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee profile not found" }, { status: 404 });
    }

    const visibleDeptIds = await getVisibleDepartmentIdsForEmployee(employee.id);

    // Fetch conversations where user is a direct participant OR has departmental hierarchy visibility
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          {
            type: ConversationType.DIRECT,
            participants: { some: { employeeId: employee.id } },
          },
          {
            type: ConversationType.DEPARTMENT,
            departmentId: { in: visibleDeptIds },
          },
        ],
      },
      include: {
        department: { select: { id: true, name: true } },
        participants: {
          include: {
            employee: { select: { id: true, fullName: true, email: true, position: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: conversations }, { status: 200 });
  } catch (error) {
    console.error("Fetch Conversations Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch conversations" }, { status: 500 });
  }
}

// POST /api/conversations - Initiate a DIRECT or DEPARTMENT conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { type, recipientEmployeeId, departmentId, title } = body;

    // DIRECT Conversation: Check if already exists
    if (type === ConversationType.DIRECT) {
      if (!recipientEmployeeId) {
        return NextResponse.json({ success: false, message: "Recipient employee ID is required" }, { status: 400 });
      }

      if (recipientEmployeeId === employee.id) {
        return NextResponse.json({ success: false, message: "Cannot start conversation with yourself" }, { status: 400 });
      }

      const existing = await prisma.conversation.findFirst({
        where: {
          type: ConversationType.DIRECT,
          AND: [
            { participants: { some: { employeeId: employee.id } } },
            { participants: { some: { employeeId: recipientEmployeeId } } },
          ],
        },
      });

      if (existing) {
        return NextResponse.json({ success: true, data: existing }, { status: 200 });
      }

      const newConversation = await prisma.conversation.create({
        data: {
          type: ConversationType.DIRECT,
          participants: {
            create: [
              { employeeId: employee.id },
              { employeeId: recipientEmployeeId },
            ],
          },
        },
      });

      return NextResponse.json({ success: true, data: newConversation }, { status: 201 });
    }

    // DEPARTMENT Conversation
    if (type === ConversationType.DEPARTMENT) {
      if (!departmentId) {
        return NextResponse.json({ success: false, message: "Department ID is required" }, { status: 400 });
      }

      const newDeptConv = await prisma.conversation.create({
        data: {
          type: ConversationType.DEPARTMENT,
          title: title || "Department Communication",
          departmentId,
          participants: {
            create: [{ employeeId: employee.id }],
          },
        },
      });

      return NextResponse.json({ success: true, data: newDeptConv }, { status: 201 });
    }

    return NextResponse.json({ success: false, message: "Invalid conversation type" }, { status: 400 });
  } catch (error) {
    console.error("Create Conversation Error:", error);
    return NextResponse.json({ success: false, message: "Failed to create conversation" }, { status: 500 });
  }
}