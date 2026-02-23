import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generatePickList } from '@/lib/inventory/service';

export async function POST(req: NextRequest) {
  try {
    const { jobId, createdById } = await req.json();
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { template: { include: { lines: true } } }
    });

    if (!job?.template) return NextResponse.json({ error: 'Job template missing' }, { status: 404 });

    const lines = await Promise.all(
      job.template.lines.map(async (line) => {
        const balances = await prisma.inventoryBalance.findMany({ where: { itemId: line.itemId } });
        return {
          itemId: line.itemId,
          plannedQty: Math.ceil(line.quantity * (1 + line.wastePct)),
          availabilityByLocation: balances.map((b) => ({ locationId: b.locationId, quantity: b.quantity }))
        };
      })
    );

    const generated = generatePickList(lines);

    const pickList = await prisma.pickList.create({
      data: {
        jobId,
        createdById,
        status: 'DRAFT',
        lines: { create: generated }
      },
      include: { lines: true }
    });

    return NextResponse.json({ data: pickList }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
