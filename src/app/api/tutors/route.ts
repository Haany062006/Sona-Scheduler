import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const department_id = searchParams.get('department_id') || undefined;
    const tutors = DataStore.getPeerTutors(department_id);
    return NextResponse.json(tutors);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { register_number, name, department_id, email, phone } = body;

    if (!register_number || !name || !department_id || !email || !phone) {
      return NextResponse.json(
        { error: 'Register number, name, department, email, and phone are required.' },
        { status: 400 }
      );
    }

    const tutor = DataStore.addPeerTutor(register_number, name, department_id, email, phone);
    return NextResponse.json(tutor, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
