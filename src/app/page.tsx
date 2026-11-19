import { redirect } from 'next/navigation';
import { AuthService } from '@/lib/auth/auth-service';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await AuthService.getCurrentUser();
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
