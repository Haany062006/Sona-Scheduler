import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
import { DataStore } from '@/lib/db/data-store';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const result = await AuthService.authenticate(email, password);

    if (!result.success) {
      DataStore.logAction('FAILED_LOGIN_ATTEMPT', 'auth', null, { email });
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    DataStore.logAction('ADMIN_LOGIN_SUCCESS', 'auth', result.user?.id || null, { email }, result.user?.email);

    return NextResponse.json({ success: true, user: result.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
