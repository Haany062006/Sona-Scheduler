import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications/notification-service';
import { DataStore } from '@/lib/db/data-store';

export async function POST(req: Request) {
  try {
    const { channel, recipient, message } = await req.json();

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient contact is required.' }, { status: 400 });
    }

    const isSms = channel === 'sms';
    const msgText = message || (isSms ? 'Test SMS from Sona Scheduler Notification System.' : 'Test notification confirming your email gateway is active.');

    let result;
    if (isSms) {
      result = await NotificationService.sendTestSMS(recipient, msgText);
    } else {
      result = await NotificationService.sendTestEmail(
        recipient,
        'Test Email — Sona Scheduler Remedial Portal',
        `<p>${msgText}</p>`
      );
    }

    const providerType = isSms 
      ? (process.env.SMS_PROVIDER || 'console').toLowerCase()
      : (process.env.EMAIL_PROVIDER || 'console').toLowerCase();
    const isSimulated = providerType === 'console';
    const notifStatus = result.success ? (isSimulated ? 'simulated' : 'sent') : 'failed';

    const savedNotif = DataStore.addNotification({
      recipient_type: 'faculty',
      recipient_name: 'Test Recipient',
      recipient_contact: recipient,
      channel: isSms ? 'sms' : 'email',
      notification_type: 'test',
      subject: isSms ? null : 'Test Email — Sona Scheduler Remedial Portal',
      message_body: msgText,
      status: notifStatus,
      provider_message_id: result.messageId || null,
      error_message: result.error || null,
    });

    return NextResponse.json({
      ...result,
      isSimulated,
      provider: isSms ? NotificationService.getSMSProviderName() : NotificationService.getEmailProviderName(),
      notification: savedNotif,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
