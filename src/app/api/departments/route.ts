import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function GET() {
  try {
    const departments = DataStore.getDepartments();
    return NextResponse.json(departments);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { code, name } = await req.json();
    if (!code || !name) {
      return NextResponse.json({ error: 'Department code and name are required.' }, { status: 400 });
    }
    const dept = DataStore.addDepartment(code, name);
    return NextResponse.json(dept, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Department ID is required.' }, { status: 400 });
    }
    const dept = DataStore.toggleDepartment(id);
    return NextResponse.json(dept);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
