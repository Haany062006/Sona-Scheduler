import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const department_id = searchParams.get('department_id') || undefined;
    const regulation_id = searchParams.get('regulation_id') || undefined;

    const subjects = DataStore.getSubjects(department_id, regulation_id);
    return NextResponse.json(subjects);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name, regulation_id, semester_number, department_ids, is_common } = body;

    if (!code || !name || !regulation_id || !semester_number || !department_ids?.length) {
      return NextResponse.json(
        { error: 'Code, name, regulation, semester, and at least one department are required.' },
        { status: 400 }
      );
    }

    const subject = DataStore.addSubject(
      code,
      name,
      regulation_id,
      Number(semester_number),
      department_ids,
      Boolean(is_common)
    );

    return NextResponse.json(subject, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
