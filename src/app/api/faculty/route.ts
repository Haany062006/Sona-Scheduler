import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const department_id = searchParams.get('department_id') || undefined;
    const academic_year = searchParams.get('academic_year') || undefined;
    const section = searchParams.get('section') || undefined;
    const subject_id = searchParams.get('subject_id') || undefined;

    const faculty = DataStore.getFaculty({
      department_id,
      academic_year,
      section,
      subject_id,
    });
    return NextResponse.json(faculty);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, department_id, academic_year, section, email, phone, faculty_id_code, assigned_subject_ids } = body;

    if (!name || !name.trim() || !department_id) {
      return NextResponse.json(
        { error: 'Faculty name and department are required.' },
        { status: 400 }
      );
    }

    const fac = DataStore.addFaculty({
      name: name.trim(),
      department_id,
      academic_year: academic_year || null,
      section: section || null,
      email: email || null,
      phone: phone || null,
      faculty_id_code: faculty_id_code || null,
      assigned_subject_ids: Array.isArray(assigned_subject_ids) ? assigned_subject_ids : [],
    });
    return NextResponse.json(fac, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, department_id, academic_year, section, email, phone, faculty_id_code, assigned_subject_ids } = body;

    if (!id) {
      return NextResponse.json({ error: 'Faculty ID is required for updating.' }, { status: 400 });
    }

    const updated = DataStore.updateFaculty(id, {
      name,
      department_id,
      academic_year,
      section,
      email,
      phone,
      faculty_id_code,
      assigned_subject_ids,
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

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Faculty ID is required for deletion.' }, { status: 400 });
    }

    DataStore.deleteFaculty(id);
    return NextResponse.json({ success: true, message: 'Faculty member removed successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
