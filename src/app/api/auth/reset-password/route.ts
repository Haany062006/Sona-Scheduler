import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid institutional email address.' }, { status: 400 });
    }

    const result = await AuthService.requestPasswordReset(email);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
