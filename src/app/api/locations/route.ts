import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { locationSchema } from '@/lib/validation/schemas';

export async function GET() {
  const locations = await prisma.location.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ data: locations });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = locationSchema.parse(body);
    const location = await prisma.location.create({ data });
    return NextResponse.json({ data: location }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
