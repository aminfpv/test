import { Prisma, Role, TxnType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/rbac";

export type LedgerBalance = Record<string, number>;

export function applyLedgerDelta(balance: LedgerBalance, txns: Array<{ txnType: TxnType; fromLocationId?: string | null; toLocationId?: string | null; qty: number; }>) {
  for (const t of txns) {
    if (t.fromLocationId) {
      balance[t.fromLocationId] = (balance[t.fromLocationId] ?? 0) - t.qty;
    }
    if (t.toLocationId) {
      balance[t.toLocationId] = (balance[t.toLocationId] ?? 0) + t.qty;
    }
  }
  return balance;
}

export async function createLedgerTransaction(
  user: { id: string; role: Role },
  input: {
    txnType: TxnType;
    itemId: string;
    fromLocationId?: string;
    toLocationId?: string;
    qty: number;
    unitCost?: number;
    jobId?: string;
    note?: string;
  }
) {
  requireRole(user.role, [Role.ADMIN, Role.WAREHOUSE, Role.PROJECT_MANAGER]);

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.inventoryLedger.create({
      data: {
        ...input,
        createdById: user.id
      }
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "ledger.create",
        entityType: "InventoryLedger",
        entityId: created.id,
        metadata: input as Prisma.JsonObject
      }
    });

    return created;
  });

  return row;
}
