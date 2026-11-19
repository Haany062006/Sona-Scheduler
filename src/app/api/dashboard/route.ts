import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function GET() {
  try {
    const metrics = DataStore.getDashboardMetrics();
    return NextResponse.json(metrics);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
