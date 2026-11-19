import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const department_id = searchParams.get('department_id') || undefined;
    const batch_id = searchParams.get('batch_id') || undefined;
    const section = searchParams.get('section') || undefined;
    const search = searchParams.get('search') || undefined;

    const students = DataStore.getStudents({ department_id, batch_id, section, search });
    return NextResponse.json(students);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { register_number, name, department_id, batch_id, section, email, phone } = body;

    if (!register_number || !name || !department_id || !batch_id || !section) {
      return NextResponse.json(
        { error: 'Register number, name, department, batch, and section are mandatory.' },
        { status: 400 }
      );
    }

    const result = DataStore.importStudents([
      {
        register_number: String(register_number).trim(),
        name,
        department_id,
        batch_id,
        section,
        email,
        phone,
      },
    ]);

    if (result.skipped.length > 0) {
      return NextResponse.json({ error: result.skipped[0].reason }, { status: 400 });
    }

    return NextResponse.json(result.imported[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, register_number, name, department_id, batch_id, section, email, phone } = body;

    if (!id) {
      return NextResponse.json({ error: 'Student ID is required for updating.' }, { status: 400 });
    }

    const updated = DataStore.updateStudent(id, {
      register_number,
      name,
      department_id,
      batch_id,
      section,
      email,
      phone,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    let ids: string[] = [];

    try {
      const body = await req.json();
      if (body.id) id = body.id;
      if (Array.isArray(body.ids)) ids = body.ids;
    } catch {}

    if (ids.length > 0) {
      const result = DataStore.deleteStudentsBatch(ids);
      return NextResponse.json({ success: true, deletedCount: result.deletedCount });
    }

    if (!id) {
      return NextResponse.json({ error: 'Student ID or array of IDs is required for deletion.' }, { status: 400 });
    }

    DataStore.deleteStudent(id);
    return NextResponse.json({ success: true, message: 'Student deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
