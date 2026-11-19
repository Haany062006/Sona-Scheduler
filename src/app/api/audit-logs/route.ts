import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function GET() {
  try {
    const logs = DataStore.getAuditLogs();
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
