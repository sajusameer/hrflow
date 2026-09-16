import { z } from "zod";

export const createEmployeeSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters"),

  email: z
    .string()
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  phone: z.string().optional(),

  position: z
    .string()
    .min(2, "Position is required"),

  departmentId: z
    .string()
    .optional(),

  employmentStatus: z
    .enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"])
    .default("ACTIVE"),

  dateJoined: z
    .string()
    .optional(),
});

export type CreateEmployeeInput = z.infer<
  typeof createEmployeeSchema
>;