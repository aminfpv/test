import { headers } from "next/headers";
import { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  role: Role;
};

export function getSessionUser(): SessionUser {
  const h = headers();
  const id = h.get("x-user-id") ?? "dev-admin";
  const role = (h.get("x-user-role") as Role) ?? Role.ADMIN;
  return { id, role };
}
