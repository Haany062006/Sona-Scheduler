import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function POST(req: Request) {
  try {
    const { students } = await req.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No student records provided for import.' }, { status: 400 });
    }

    const result = DataStore.importStudents(students);

    return NextResponse.json({
      success: true,
      importedCount: result.imported.length,
      skippedCount: result.skipped.length,
      skipped: result.skipped,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
