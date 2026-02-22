import { Role } from "@prisma/client";

export function requireRole(userRole: Role, allowed: Role[]) {
  if (!allowed.includes(userRole)) {
    throw new Error("FORBIDDEN");
  }
}
