// import { prisma } from "@/lib/prisma";

// /**
//  * Checks if setting `targetParentId` as parent of `departmentId` causes a circular dependency.
//  * Traverses upwards from `targetParentId` to verify it never reaches `departmentId`.
//  */
// export async function wouldCreateCycle(
//   departmentId: string,
//   targetParentId: string
// ): Promise<boolean> {
//   if (departmentId === targetParentId) {
//     return true; // Self-parenting is an immediate cycle
//   }

//   let currentId: string | null = targetParentId;
//   const visited = new Set<string>();

//   while (currentId) {
//     if (currentId === departmentId) {
//       return true; // Cycle detected: target parent is a descendant of this department
//     }

//     if (visited.has(currentId)) {
//       return true; // Malformed hierarchy loop safeguard
//     }

//     visited.add(currentId);

//     const dept = await prisma.department.findUnique({
//       where: { id: currentId },
//       select: { parentId: true },
//     });

//     currentId = dept ? dept.parentId : null;
//   }

//   return false;
// }

import { prisma } from "@/lib/prisma";

/**
 * Checks if setting `targetParentId` as parent of `departmentId` causes a circular dependency.
 * Traverses upwards from `targetParentId` to verify it never reaches `departmentId`.
 */
export async function wouldCreateCycle(
  departmentId: string,
  targetParentId: string
): Promise<boolean> {
  if (departmentId === targetParentId) {
    return true;
  }

  let currentId: string | null = targetParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === departmentId) {
      return true;
    }

    if (visited.has(currentId)) {
      return true;
    }

    visited.add(currentId);

    const checkId: string = currentId;
    const dept: { parentId: string | null } | null = await prisma.department.findUnique({
      where: { id: checkId },
      select: { parentId: true },
    });

    currentId = dept ? dept.parentId : null;
  }

  return false;
}