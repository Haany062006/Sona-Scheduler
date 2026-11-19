import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function GET() {
  try {
    const notifications = DataStore.getNotifications();
    return NextResponse.json(notifications);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
