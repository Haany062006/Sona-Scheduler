import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function POST(req: Request) {
  try {
    const { faculty_id, subject_id } = await req.json();
    if (!faculty_id || !subject_id) {
      return NextResponse.json({ error: 'Faculty ID and Subject ID are required.' }, { status: 400 });
    }

    DataStore.mapFacultySubject(faculty_id, subject_id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let faculty_id = searchParams.get('faculty_id');
    let subject_id = searchParams.get('subject_id');

    if (!faculty_id || !subject_id) {
      try {
        const body = await req.json();
        faculty_id = body.faculty_id || faculty_id;
        subject_id = body.subject_id || subject_id;
      } catch {}
    }

    if (!faculty_id || !subject_id) {
      return NextResponse.json(
        { error: 'Both faculty_id and subject_id are required to unassign.' },
        { status: 400 }
      );
    }

    const removed = DataStore.unmapFacultySubject(faculty_id, subject_id);
    return NextResponse.json({ success: true, removed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
