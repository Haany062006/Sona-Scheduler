import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Rate Limiting on public token lookups
    const ip = req.headers.get('x-forwarded-for') || 'local-peer';
    const rateCheck = checkRateLimit(`att_get_${ip}`, 60, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    const details = DataStore.getAttendanceFormByToken(token);

    if (!details) {
      return NextResponse.json(
        { error: 'Attendance session not found, expired, or link has been revoked.' },
        { status: 404 }
      );
    }

    return NextResponse.json(details);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Strict rate limiting on submissions
    const ip = req.headers.get('x-forwarded-for') || 'local-peer';
    const rateCheck = checkRateLimit(`att_post_${ip}`, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many submission attempts. Please wait.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { submitted_by_identifier, tutor_remarks, marks } = body;

    if (!submitted_by_identifier || !Array.isArray(marks) || marks.length === 0) {
      return NextResponse.json(
        { error: 'Tutor identifier (name or register number) and student attendance marks are required.' },
        { status: 400 }
      );
    }

    const result = DataStore.submitAttendance(token, {
      submitted_by_identifier,
      tutor_remarks,
      marks,
    });

    // Trigger instant SMS dispatch for Class Coordinator (CC) Absence Alerts & Staff Notices
    try {
      const allNotifs = DataStore.getNotifications();
      const classNotifs = allNotifs.filter(
        (n) => n.remedial_class_id === result.remedial_class_id && n.status === 'pending'
      );
      for (const n of classNotifs) {
        if (n.channel === 'sms' && n.recipient_contact) {
          NotificationService.sendTestSMS(n.recipient_contact, n.message_body)
            .then((res) => {
              const isSim = (process.env.SMS_PROVIDER || 'console').toLowerCase() === 'console';
              n.status = res.success ? (isSim ? 'simulated' : 'sent') : 'failed';
              n.provider_message_id = res.messageId || null;
              n.error_message = res.error || null;
              n.sent_at = res.success ? new Date().toISOString() : null;
              n.attempt_count += 1;
            })
            .catch(() => {});
        }
      }
    } catch (notifErr) {
      console.warn('Asynchronous CC notification dispatch error:', notifErr);
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
