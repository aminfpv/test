import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { computeReorderSuggestion } from "@/lib/services/reorder";

export async function GET() {
  try {
    const items = await prisma.item.findMany();
    const grouped = await prisma.inventoryLedger.groupBy({
      by: ["itemId"],
      _sum: { qty: true }
    });
    const onHandByItem = Object.fromEntries(grouped.map((g) => [g.itemId, g._sum.qty ?? 0]));

    const suggestions = items
      .map((item) =>
        computeReorderSuggestion({
          itemId: item.id,
          sku: item.sku,
          name: item.name,
          onHand: onHandByItem[item.id] ?? 0,
          avgDailyUsage30d: item.reorderMin / 30,
          leadTimeDays: item.leadTimeDays,
          safetyStock: item.reorderMin,
          reorderQty: item.reorderQty
        })
      )
      .filter(Boolean);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
