import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DataStore } from '@/lib/db/data-store';

const SESSION_COOKIE = 'sona_admin_session';
const SECURITY_FILE = path.join(process.cwd(), '.data', 'admin_security.json');

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

interface StoredSecurity {
  password_hash: string;
  salt: string;
  updated_at: string;
}

function getStoredSecurity(): StoredSecurity | null {
  try {
    if (fs.existsSync(SECURITY_FILE)) {
      const content = fs.readFileSync(SECURITY_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading admin security file:', err);
  }
  return null;
}

function saveStoredSecurity(data: StoredSecurity): void {
  const dir = path.dirname(SECURITY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SECURITY_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Strict retrieval of admin credentials from environment without hardcoded fallback strings
const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_DEFAULT_EMAIL || '').replace(/['"]/g, '').trim();
const DEFAULT_ADMIN_PASSWORD = (process.env.ADMIN_DEFAULT_PASSWORD || '').replace(/['"]/g, '').trim();

export const AuthService = {
  /**
   * Authenticate admin using Supabase Auth when available,
   * with secure environment fallback for local deployment.
   */
  async authenticate(email: string, password: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // Check if Supabase Auth is connected to a real instance (not mock)
    const isMockSupabase =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mock-sona-supabase');

    if (!isMockSupabase) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const user: AdminUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: data.user.user_metadata?.full_name || 'Remedial Coordinator',
            role: 'admin',
          };

          const cookieStore = await cookies();
          cookieStore.set(SESSION_COOKIE, JSON.stringify({ user, expires: Date.now() + 86400000 }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 86400, // 24 hours
          });

          DataStore.logAction('ADMIN_LOGIN_SUCCESS', 'auth', user.id, { method: 'supabase_auth' }, user.email);

          return { success: true, user };
        }
      } catch (err: any) {
        console.warn('Supabase Auth error, checking secure env configuration:', err.message);
      }
    }

    // Check custom updated admin credentials in .data/admin_security.json first
    const storedSecurity = getStoredSecurity();
    let isPasswordValid = false;

    if (storedSecurity) {
      const computedHash = hashPassword(password, storedSecurity.salt);
      isPasswordValid = crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(storedSecurity.password_hash, 'hex')
      );
    } else if (DEFAULT_ADMIN_PASSWORD) {
      // Direct comparison with strictly environment-loaded secret
      isPasswordValid = password === DEFAULT_ADMIN_PASSWORD;
    }

    if (DEFAULT_ADMIN_EMAIL && cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() && isPasswordValid) {
      const user: AdminUser = {
        id: 'admin-master-001',
        email: DEFAULT_ADMIN_EMAIL,
        name: 'Remedial Coordinator (Admin)',
        role: 'admin',
      };

      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, JSON.stringify({ user, expires: Date.now() + 86400000 }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400, // 24 hours
      });

      DataStore.logAction(
        'ADMIN_LOGIN_SUCCESS',
        'auth',
        user.id,
        { method: storedSecurity ? 'custom_hashed_auth' : 'environment_auth' },
        user.email
      );

      return { success: true, user };
    }

    DataStore.logAction('ADMIN_LOGIN_FAILED', 'auth', 'unknown', { attemptedEmail: cleanEmail }, cleanEmail);

    return {
      success: false,
      error: 'Invalid administrative credentials. Default insecure credentials have been disabled.',
    };
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();

    const isMockSupabase =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mock-sona-supabase');

    if (!isMockSupabase) {
      try {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login?reset=success`,
        });
        if (error) {
          return { success: false, message: error.message };
        }
        return {
          success: true,
          message: 'Password reset link has been dispatched to your institutional email.',
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    }

    // In local development / mock mode: log the reset request into audit logs and return instructions
    DataStore.logAction('PASSWORD_RESET_REQUESTED', 'auth', 'admin-master-001', { email: cleanEmail }, cleanEmail);

    return {
      success: true,
      message: `Password reset request registered for ${cleanEmail}. In local mode, update ADMIN_DEFAULT_PASSWORD in .env.local to update credentials.`,
    };
  },

  async getCurrentUser(): Promise<AdminUser | null> {
    try {
      const cookieStore = await cookies();
      const session = cookieStore.get(SESSION_COOKIE);
      if (!session?.value) return null;

      const parsed = JSON.parse(session.value);
      if (parsed.expires < Date.now()) {
        return null;
      }
      return parsed.user;
    } catch {
      return null;
    }
  },

  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized. You must be signed in to change password.' };
    }

    // Verify old password
    const storedSecurity = getStoredSecurity();
    let isOldValid = false;

    if (storedSecurity) {
      const computedHash = hashPassword(oldPassword, storedSecurity.salt);
      isOldValid = crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(storedSecurity.password_hash, 'hex')
      );
    } else if (DEFAULT_ADMIN_PASSWORD) {
      isOldValid = oldPassword === DEFAULT_ADMIN_PASSWORD;
    }

    if (!isOldValid) {
      return { success: false, error: 'Current password provided is incorrect.' };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    // Generate random salt and scrypt hash
    const salt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(newPassword, salt);

    saveStoredSecurity({
      password_hash: newHash,
      salt,
      updated_at: new Date().toISOString(),
    });

    DataStore.logAction(
      'ADMIN_PASSWORD_CHANGED',
      'auth',
      user.id,
      { changed_at: new Date().toISOString() },
      user.email
    );

    return {
      success: true,
      message: 'Password updated successfully. Please use your new password for future logins.',
    };
  },

  async logout(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  },
};
