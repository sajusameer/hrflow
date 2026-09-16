import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, "Department name must be at least 2 characters")
    .max(100, "Department name is too long"),

  description: z
    .string()
    .max(500, "Description is too long")
    .optional(),

  parentId: z
    .string()
    .optional(),
});

export type CreateDepartmentInput = z.infer<
  typeof createDepartmentSchema
>;