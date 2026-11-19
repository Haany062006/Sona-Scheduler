import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';

export async function GET() {
  try {
    const regulations = DataStore.getRegulations();
    const batches = DataStore.getBatches();
    const regulationBatches = DataStore.getRegulationBatches();
    return NextResponse.json({ regulations, batches, regulationBatches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.type === 'regulation') {
      const reg = DataStore.addRegulation(body.code, body.start_year, body.description);
      return NextResponse.json(reg, { status: 201 });
    } else if (body.type === 'batch') {
      const batch = DataStore.addBatch(
        body.name,
        Number(body.start_year),
        Number(body.end_year),
        body.regulation_id,
        body.department_id
      );
      return NextResponse.json(batch, { status: 201 });
    } else if (body.type === 'link') {
      const link = DataStore.linkRegulationBatch(body.regulation_id, body.batch_id, body.department_id);
      return NextResponse.json(link, { status: 201 });
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
