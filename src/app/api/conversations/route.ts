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
      select: { id: true, departmentId: true },
    });

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee profile not found" }, { status: 404 });
    }

    // ADMIN হলে সব ডিপার্টমেন্ট চ্যানেল এক্সেসযোগ্য, অন্যথায় হায়ারার্কি অনুযায়ী
    let visibleDeptIds: string[] = [];
    if (session.role === "ADMIN") {
      const allDepts = await prisma.department.findMany({ select: { id: true } });
      visibleDeptIds = allDepts.map((d) => d.id);
    } else {
      visibleDeptIds = await getVisibleDepartmentIdsForEmployee(employee.id);
      if (employee.departmentId && !visibleDeptIds.includes(employee.departmentId)) {
        visibleDeptIds.push(employee.departmentId);
      }
    }

    // Fetch conversations where user is a direct participant OR has departmental visibility
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

    // ডুপ্লিকেট ডিপার্টমেন্ট চ্যানেল ফিল্টারিং (প্রতিটি ডিপার্টমেন্টের ১টি চ্যানেল দেখাবে)
    const seenDeptIds = new Set<string>();
    const uniqueConversations = conversations.filter((conv) => {
      if (conv.type === ConversationType.DEPARTMENT && conv.departmentId) {
        if (seenDeptIds.has(conv.departmentId)) {
          return false;
        }
        seenDeptIds.add(conv.departmentId);
      }
      return true;
    });

    return NextResponse.json({ success: true, data: uniqueConversations }, { status: 200 });
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
      select: { id: true, departmentId: true },
    });

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { type, recipientEmployeeId, departmentId, title } = body;

    // DIRECT Conversation
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
        include: {
          participants: {
            include: {
              employee: { select: { id: true, fullName: true, email: true, position: true } },
            },
          },
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
        include: {
          participants: {
            include: {
              employee: { select: { id: true, fullName: true, email: true, position: true } },
            },
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

      // 1. পারমিশন ভ্যালিডেশন (Admin বাইপাস ও Own Department এক্সেস)
      if (session.role !== "ADMIN") {
        const visibleDeptIds = await getVisibleDepartmentIdsForEmployee(employee.id);
        const isOwnDept = employee.departmentId === departmentId;

        if (!visibleDeptIds.includes(departmentId) && !isOwnDept) {
          return NextResponse.json({ 
            success: false, 
            message: "You are not authorized to access or initiate this department channel" 
          }, { status: 403 });
        }
      }

      // 2. এই ডিপার্টমেন্টের কনভারসেশন আগে থেকেই আছে কি না চেক করা
      let deptConv = await prisma.conversation.findFirst({
        where: {
          type: ConversationType.DEPARTMENT,
          departmentId: departmentId,
        },
        include: {
          department: { select: { id: true, name: true } },
          participants: {
            include: {
              employee: { select: { id: true, fullName: true } },
            },
          },
        },
      });

      // 3. না থাকলে নতুন চ্যানেল তৈরি করা
      if (!deptConv) {
        const deptInfo = await prisma.department.findUnique({
          where: { id: departmentId },
          select: { name: true },
        });

        deptConv = await prisma.conversation.create({
          data: {
            type: ConversationType.DEPARTMENT,
            title: title || `${deptInfo?.name || "Department"} Channel`,
            departmentId,
            participants: {
              create: [{ employeeId: employee.id }],
            },
          },
          include: {
            department: { select: { id: true, name: true } },
            participants: {
              include: {
                employee: { select: { id: true, fullName: true } },
              },
            },
          },
        });
      } else {
        // যদি চ্যানেল থাকে কিন্তু বর্তমান ইউজার এখনও participant না থাকে, যুক্ত করা
        const isParticipant = deptConv.participants.some(p => p.employee.id === employee.id);
        if (!isParticipant) {
          await prisma.conversationParticipant.create({
            data: {
              conversationId: deptConv.id,
              employeeId: employee.id,
            },
          });
        }
      }

      return NextResponse.json({ success: true, data: deptConv }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: "Invalid conversation type" }, { status: 400 });
  } catch (error) {
    console.error("Create Conversation Error:", error);
    return NextResponse.json({ success: false, message: "Failed to create conversation" }, { status: 500 });
  }
}