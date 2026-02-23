import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createJobSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  status: z.string().default('PLANNED'),
  locationId: z.string(),
  templateId: z.string().optional()
});

export async function GET() {
  const jobs = await prisma.job.findMany({ include: { template: true, location: true } });
  return NextResponse.json({ data: jobs });
}

export async function POST(req: NextRequest) {
  try {
    const data = createJobSchema.parse(await req.json());
    const job = await prisma.job.create({ data });
    return NextResponse.json({ data: job }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
