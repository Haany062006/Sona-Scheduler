import { EmailProvider, EmailPayload, NotificationResult } from '../types';

export class LiveEmailProvider implements EmailProvider {
  name: string;
  private providerType: string;
  private apiKey?: string;
  private fromEmail: string;

  constructor() {
    this.providerType = (process.env.EMAIL_PROVIDER || 'console').toLowerCase();
    this.apiKey = process.env.EMAIL_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'remedial@sonatech.ac.in';
    this.name = `Live Email (${this.providerType.toUpperCase()})`;
  }

  async sendEmail(payload: EmailPayload): Promise<NotificationResult> {
    const timestamp = new Date().toISOString();

    // If Resend (modern popular email provider)
    if (this.providerType === 'resend') {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Resend API key not configured in EMAIL_API_KEY.',
          timestamp,
        };
      }

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: this.fromEmail,
            to: [payload.to],
            cc: payload.cc,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          return {
            success: true,
            messageId: data.id,
            timestamp,
          };
        } else {
          return {
            success: false,
            error: data.message || 'Resend dispatch failed',
            timestamp,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          error: err.message,
          timestamp,
        };
      }
    }

    // If SendGrid
    if (this.providerType === 'sendgrid') {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'SendGrid API key not configured in EMAIL_API_KEY.',
          timestamp,
        };
      }

      try {
        const personalizations: any = [{ to: [{ email: payload.to }] }];
        if (payload.cc?.length) {
          personalizations[0].cc = payload.cc.map((email) => ({ email }));
        }

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations,
            from: { email: this.fromEmail, name: 'Sona Remedial Coordinator' },
            subject: payload.subject,
            content: [
              {
                type: 'text/html',
                value: payload.html,
              },
            ],
          }),
        });

        if (response.ok) {
          return {
            success: true,
            messageId: response.headers.get('x-message-id') || `sg_${Date.now()}`,
            timestamp,
          };
        } else {
          const text = await response.text();
          return {
            success: false,
            error: text || 'SendGrid dispatch failed',
            timestamp,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          error: err.message,
          timestamp,
        };
      }
    }

    // Default simulated success
    return {
      success: true,
      messageId: `email_live_mock_${Date.now()}`,
      timestamp,
    };
  }
}
