import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { reorderSuggestions } from '@/lib/inventory/service';

export async function GET() {
  const items = await prisma.item.findMany({ include: { balances: true } });

  const rows = items.map((item) => {
    const onHand = item.balances.reduce((sum, b) => sum + b.quantity, 0);
    return {
      itemId: item.id,
      itemName: item.name,
      onHand,
      minStockLevel: item.minStockLevel,
      reorderMultiple: item.reorderMultiple,
      avgDailyUsage: Math.max(1, Math.round(item.minStockLevel / 7)),
      leadTimeDays: item.leadTimeDays,
      safetyDays: 3
    };
  });

  return NextResponse.json({ data: reorderSuggestions(rows) });
}
