import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/session";
import { canAccessConversation } from "@/lib/messaging-visibility";

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

// GET /api/conversations/[id]/messages - Get message history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: conversationId } = await params;

    // Strict Authorization check (Private Direct vs Upward Hierarchy)
    const hasAccess = await canAccessConversation(employee.id, conversationId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: "Access denied. You are not authorized to view this conversation." },
        { status: 403 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
            imageUrl: true,
          },
        },
        attachments: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: messages }, { status: 200 });
  } catch (error) {
    console.error("Get Messages Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST /api/conversations/[id]/messages - Send a message with optional attachments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: conversationId } = await params;

    // Verify access
    const hasAccess = await canAccessConversation(employee.id, conversationId);
    if (!hasAccess) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { content, attachments } = body;

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { success: false, message: "Message cannot be empty." },
        { status: 400 }
      );
    }

    // Create message with relation to conversation & attachments
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: employee.id,
        content: content || "",
        attachments: attachments && attachments.length > 0
          ? {
              create: attachments.map((att: { fileName: string; fileUrl: string; fileKey: string; mimeType: string; fileSize: number }) => ({
                fileName: att.fileName,
                fileUrl: att.fileUrl,
                fileKey: att.fileKey,
                mimeType: att.mimeType,
                fileSize: att.fileSize,
              })),
            }
          : undefined,
      },
      include: {
        sender: { select: { id: true, fullName: true, email: true } },
        attachments: true,
      },
    });

    // Bump conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Message sent", data: message }, { status: 201 });
  } catch (error) {
    console.error("Send Message Error:", error);
    return NextResponse.json({ success: false, message: "Failed to send message" }, { status: 500 });
  }
}