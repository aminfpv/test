import { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/rbac";

export async function createJobWithTemplate(
  user: { id: string; role: Role },
  input: {
    code: string;
    name: string;
    type: string;
    siteLocationId: string;
    templateId: string;
  }
) {
  requireRole(user.role, [Role.ADMIN, Role.PROJECT_MANAGER]);

  return prisma.$transaction(async (tx) => {
    const template = await tx.bomTemplate.findUnique({
      where: { id: input.templateId },
      include: { lines: true }
    });

    if (!template) {
      throw new Error("TEMPLATE_NOT_FOUND");
    }

    const job = await tx.job.create({
      data: {
        code: input.code,
        name: input.name,
        type: input.type,
        siteLocationId: input.siteLocationId,
        status: "ACTIVE"
      }
    });

    if (template.lines.length > 0) {
      await tx.jobMaterialPlan.createMany({
        data: template.lines.map((line) => ({
          jobId: job.id,
          itemId: line.itemId,
          plannedQty: line.qtyPerUnit,
          issuedQty: 0
        }))
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "job.create",
        entityType: "Job",
        entityId: job.id,
        metadata: { templateId: input.templateId }
      }
    });

    return tx.job.findUniqueOrThrow({
      where: { id: job.id },
      include: { plans: { include: { item: true } } }
    });
  });
}

export type PickListRow = {
  itemId: string;
  sku: string;
  itemName: string;
  plannedQty: number;
  issuedQty: number;
  availableQty: number;
  shortageQty: number;
};

export function buildPickList(plans: Array<{ itemId: string; plannedQty: number; issuedQty: number; item: { sku: string; name: string } }>, onHandByItem: Record<string, number>) {
  return plans.map((p) => {
    const remaining = Math.max(0, p.plannedQty - p.issuedQty);
    const available = Math.max(0, onHandByItem[p.itemId] ?? 0);
    const shortage = Math.max(0, remaining - available);
    return {
      itemId: p.itemId,
      sku: p.item.sku,
      itemName: p.item.name,
      plannedQty: p.plannedQty,
      issuedQty: p.issuedQty,
      availableQty: available,
      shortageQty: shortage
    } satisfies PickListRow;
  });
}

export async function getJobPickList(jobId: string) {
  const plans = await prisma.jobMaterialPlan.findMany({
    where: { jobId },
    include: { item: true }
  });

  const grouped = await prisma.inventoryLedger.groupBy({
    by: ["itemId"],
    _sum: { qty: true },
    where: {}
  });

  const onHandByItem = Object.fromEntries(grouped.map((g) => [g.itemId, g._sum.qty ?? 0]));
  return buildPickList(plans, onHandByItem);
}
