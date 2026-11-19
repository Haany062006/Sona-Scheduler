import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
import { DataStore } from '@/lib/db/data-store';

export async function POST() {
  const user = await AuthService.getCurrentUser();
  if (user) {
    DataStore.logAction('ADMIN_LOGOUT', 'auth', user.id, { email: user.email }, user.email);
  }
  await AuthService.logout();
  return NextResponse.json({ success: true });
}
