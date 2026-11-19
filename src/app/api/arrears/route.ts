import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const department_id = searchParams.get('department_id') || undefined;
    const batch_id = searchParams.get('batch_id') || undefined;
    const subject_id = searchParams.get('subject_id') || undefined;

    const arrears = DataStore.getArrearRecords({ department_id, batch_id, subject_id });
    return NextResponse.json(arrears);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { records, auto_create_missing, department_id } = await req.json();

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No arrear records provided.' }, { status: 400 });
    }

    const result = DataStore.importArrearRecords(records, {
      auto_create_missing: auto_create_missing !== false,
      department_id,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
