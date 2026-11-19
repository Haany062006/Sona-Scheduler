import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';
import { AuthService } from '@/lib/auth/auth-service';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const department_id = searchParams.get('department_id') || undefined;
    const status = searchParams.get('status') || undefined;
    const date = searchParams.get('date') || undefined;

    const classes = DataStore.getRemedialClasses({ department_id, status, date });
    return NextResponse.json(classes);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      department_id,
      batch_id,
      regulation_id,
      subject_id,
      faculty_id,
      peer_tutor_id,
      conductor_type,
      academic_year,
      section,
      class_date,
      start_time,
      end_time,
      venue,
      venue_id,
      notes,
      student_ids,
      allow_override,
      override_reason,
    } = body;

    if (
      !department_id ||
      !batch_id ||
      !regulation_id ||
      !subject_id ||
      (!faculty_id && !peer_tutor_id) ||
      !class_date ||
      !start_time ||
      !end_time ||
      !student_ids?.length
    ) {
      return NextResponse.json(
        { error: 'All fields including subject, assigned conductor (peer tutor or faculty), date, timings, and student roster are required.' },
        { status: 400 }
      );
    }

    const currentUser = await AuthService.getCurrentUser();

    const newClass = DataStore.createRemedialClass({
      department_id,
      batch_id,
      regulation_id,
      subject_id,
      faculty_id: faculty_id || null,
      peer_tutor_id: peer_tutor_id || null,
      conductor_type: conductor_type || (peer_tutor_id ? 'peer_tutor' : 'faculty'),
      academic_year,
      section,
      class_date,
      start_time,
      end_time,
      venue,
      venue_id,
      notes,
      student_ids,
      allow_override: Boolean(allow_override),
      override_reason,
      user_email: currentUser?.email || 'admin@sonatech.ac.in',
    });

    // Dispatch pending notifications asynchronously
    try {
      const allNotifs = DataStore.getNotifications();
      const classNotifs = allNotifs.filter(
        (n) => n.remedial_class_id === newClass.id && n.status === 'pending'
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
    } catch {}

    return NextResponse.json(newClass, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
