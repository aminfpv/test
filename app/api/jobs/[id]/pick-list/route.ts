import { NextResponse } from "next/server";
import { getJobPickList } from "@/lib/services/jobs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const rows = await getJobPickList(params.id);
    return NextResponse.json({ rows });
  } catch {
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
