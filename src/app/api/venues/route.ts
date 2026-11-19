import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function GET(req: Request) {
  try {
    const venues = DataStore.getVenues();
    return NextResponse.json(venues);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, building, room_number, capacity } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Venue name is required.' }, { status: 400 });
    }

    const venueCode = (room_number || name.split(' ')[0] || `V-${Date.now().toString().slice(-4)}`).trim().toUpperCase();
    const venue = DataStore.addVenue(
      venueCode,
      name.trim(),
      building?.trim(),
      capacity ? Number(capacity) : 40
    );

    return NextResponse.json(venue, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
