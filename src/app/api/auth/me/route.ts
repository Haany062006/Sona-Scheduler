import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';

export async function GET() {
  const user = await AuthService.getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user });
}
