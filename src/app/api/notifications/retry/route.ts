import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/data-store';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Notification ID is required.' }, { status: 400 });

    const notif = DataStore.getNotifications().find((n) => n.id === id);
    if (!notif) return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });

    let dispatchRes;
    if (notif.channel === 'sms') {
      dispatchRes = await NotificationService.sendTestSMS(notif.recipient_contact, notif.message_body);
    } else {
      dispatchRes = await NotificationService.sendTestEmail(
        notif.recipient_contact,
        notif.subject || 'Sona Remedial Notification',
        `<p>${notif.message_body}</p>`
      );
    }

    const isConsole = (process.env.SMS_PROVIDER || 'console').toLowerCase() === 'console';
    notif.attempt_count += 1;
    notif.retry_count += 1;
    notif.last_attempt_at = new Date().toISOString();
    notif.status = dispatchRes.success ? (isConsole ? 'simulated' : 'sent') : 'failed';
    notif.provider_message_id = dispatchRes.messageId || notif.provider_message_id;
    notif.error_message = dispatchRes.error || null;
    notif.sent_at = dispatchRes.success ? new Date().toISOString() : null;

    return NextResponse.json(notif);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
