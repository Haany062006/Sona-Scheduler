import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function POST(req: Request) {
  try {
    const { remedial_class_id, peer_tutor_id } = await req.json();

    if (!remedial_class_id || !peer_tutor_id) {
      return NextResponse.json({ error: 'Remedial class ID and Peer tutor ID are required.' }, { status: 400 });
    }

    const allocation = DataStore.allocatePeerTutor(remedial_class_id, peer_tutor_id);
    return NextResponse.json(allocation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
