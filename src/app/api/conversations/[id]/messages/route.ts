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

// GET /api/conversations/[id]/messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    const employee = await prisma.employee.findUnique({
      where: { userId: session.userId },
      select: { id: true, departmentId: true },
    });

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee profile not found" }, { status: 404 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { select: { employeeId: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ success: false, message: "Conversation not found" }, { status: 404 });
    }

    if (session.role !== "ADMIN") {
      if (conversation.type === ConversationType.DIRECT) {
        const isParticipant = conversation.participants.some(
          (p) => p.employeeId === employee.id
        );
        if (!isParticipant) {
          return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
        }
      } else if (conversation.type === ConversationType.DEPARTMENT && conversation.departmentId) {
        const visibleDeptIds = await getVisibleDepartmentIdsForEmployee(employee.id);
        const isOwnDept = employee.departmentId === conversation.departmentId;
        if (!visibleDeptIds.includes(conversation.departmentId) && !isOwnDept) {
          return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
        }
      }
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        attachments: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: messages }, { status: 200 });
  } catch (error) {
    console.error("Fetch Messages Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST /api/conversations/[id]/messages
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    const employee = await prisma.employee.findUnique({
      where: { userId: session.userId },
      select: { id: true, departmentId: true },
    });

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee profile not found" }, { status: 404 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { select: { employeeId: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ success: false, message: "Conversation not found" }, { status: 404 });
    }

    if (session.role !== "ADMIN") {
      if (conversation.type === ConversationType.DIRECT) {
        const isParticipant = conversation.participants.some(
          (p) => p.employeeId === employee.id
        );
        if (!isParticipant) {
          return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
        }
      } else if (conversation.type === ConversationType.DEPARTMENT && conversation.departmentId) {
        const visibleDeptIds = await getVisibleDepartmentIdsForEmployee(employee.id);
        const isOwnDept = employee.departmentId === conversation.departmentId;
        if (!visibleDeptIds.includes(conversation.departmentId) && !isOwnDept) {
          return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
        }
      }
    }

    const body = await request.json();
    const { content, attachments } = body;

    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { success: false, message: "Message content or attachment is required" },
        { status: 400 }
      );
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: employee.id,
          content: content?.trim() || "",
          attachments:
            attachments && attachments.length > 0
              ? {
                  create: attachments.map((att: any) => {
                    const key = att.fileKey || att.storageKey || `${Date.now()}-${att.fileName}`;
                    return {
                      fileName: att.fileName,
                      fileSize: Number(att.fileSize) || 0,
                      mimeType: att.mimeType,
                      fileKey: key, // আপনার স্কিমার আসল ফিল্ড
                      fileUrl: att.fileUrl || `/uploads/${key}`,
                    };
                  }),
                }
              : undefined,
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          attachments: true,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.error("Send Message Error:", error);
    return NextResponse.json({ success: false, message: "Failed to send message" }, { status: 500 });
  }
}