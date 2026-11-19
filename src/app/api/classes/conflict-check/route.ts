import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function POST(req: Request) {
  try {
    const {
      class_date,
      start_time,
      end_time,
      faculty_id,
      peer_tutor_id,
      venue,
      venue_id,
      department_id,
      student_ids,
      exclude_class_id,
    } = await req.json();

    if (!class_date || !start_time || !end_time || (!faculty_id && !peer_tutor_id)) {
      return NextResponse.json(
        { error: 'Date, start time, end time, and assigned conductor (peer tutor or faculty) are required.' },
        { status: 400 }
      );
    }

    const conflicts = DataStore.checkScheduleConflicts({
      class_date,
      start_time,
      end_time,
      faculty_id: faculty_id || undefined,
      peer_tutor_id: peer_tutor_id || undefined,
      venue,
      venue_id,
      department_id,
      student_ids: student_ids || [],
      exclude_class_id,
    });

    return NextResponse.json({ hasConflicts: conflicts.length > 0, conflicts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
