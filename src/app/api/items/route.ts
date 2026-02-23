import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { itemSchema } from '@/lib/validation/schemas';

export async function GET() {
  const items = await prisma.item.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = itemSchema.parse(body);
    const item = await prisma.item.create({ data });
    await prisma.auditLog.create({
      data: {
        actorId: body.actorId,
        action: 'ITEM_CREATE',
        entity: 'Item',
        entityId: item.id,
        payload: data
      }
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
