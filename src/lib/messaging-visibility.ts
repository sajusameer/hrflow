import { prisma } from "@/lib/prisma";

/**
 * Returns all department IDs where an employee has visibility rights.
 * Includes:
 * 1. The employee's own department.
 * 2. If the employee is a Department Head, all descendant (child) departments
 *    (since hierarchy resolves upward, higher-ups see messages from below).
 */
export async function getVisibleDepartmentIdsForEmployee(employeeId: string): Promise<string[]> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      departmentId: true,
      headedDepartments: { select: { id: true } },
    },
  });

  if (!employee) return [];

  const accessibleDeptIds = new Set<string>();

  if (employee.departmentId) {
    accessibleDeptIds.add(employee.departmentId);
  }

  // If the employee heads one or more departments, collect all child/descendant departments
  const queue: string[] = employee.headedDepartments.map((d) => d.id);
  for (const id of queue) {
    accessibleDeptIds.add(id);
  }

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = await prisma.department.findMany({
      where: { parentId: currentId },
      select: { id: true },
    });

    for (const child of children) {
      if (!accessibleDeptIds.has(child.id)) {
        accessibleDeptIds.add(child.id);
        queue.push(child.id);
      }
    }
  }

  return Array.from(accessibleDeptIds);
}

/**
 * Verifies if an employee has access to a specific conversation.
 * Respects strict privacy for DIRECT messages and Upward Hierarchy for DEPARTMENT messages.
 */
export async function canAccessConversation(
  employeeId: string,
  conversationId: string
): Promise<boolean> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: { select: { employeeId: true } },
    },
  });

  if (!conversation) return false;

  // Rule 1: Employee-to-Employee (DIRECT) is strictly private
  if (conversation.type === "DIRECT") {
    return conversation.participants.some((p) => p.employeeId === employeeId);
  }

  // Rule 2: Department communication respects Upward Hierarchy
  if (conversation.type === "DEPARTMENT" && conversation.departmentId) {
    const accessibleDepts = await getVisibleDepartmentIdsForEmployee(employeeId);
    return accessibleDepts.includes(conversation.departmentId);
  }

  return false;
}