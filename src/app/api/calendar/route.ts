import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function GET() {
  try {
    const blackouts = DataStore.getCalendarBlackouts();
    return NextResponse.json(blackouts);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { date_val, reason, event_type, department_id } = await req.json();

    if (!date_val || !reason) {
      return NextResponse.json({ error: 'Date and reason are required.' }, { status: 400 });
    }

    const entry = DataStore.addCalendarBlackout(date_val, reason, event_type || 'holiday', department_id);
    return NextResponse.json(entry, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 });

    DataStore.deleteCalendarBlackout(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
