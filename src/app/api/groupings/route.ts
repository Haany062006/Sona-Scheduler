import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const department_id = searchParams.get('department_id') || undefined;
    const batch_id = searchParams.get('batch_id') || undefined;

    const groupings = DataStore.getSubjectWiseGroupings(department_id, batch_id);
    return NextResponse.json(groupings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
