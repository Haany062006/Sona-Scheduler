import { SMSProvider, SMSPayload, NotificationResult } from '../types';

export class LiveSMSProvider implements SMSProvider {
  name: string;
  private providerType: string;
  private apiKey?: string;
  private senderId?: string;

  constructor() {
    this.providerType = (process.env.SMS_PROVIDER || 'console').toLowerCase();
    this.apiKey = process.env.SMS_API_KEY;
    this.senderId = process.env.SMS_SENDER_ID || 'SONASCH';
    this.name = `Live Gateway (${this.providerType.toUpperCase()})`;
  }

  async sendSMS(payload: SMSPayload): Promise<NotificationResult> {
    const timestamp = new Date().toISOString();

    // If Fast2SMS (popular Indian academic SMS gateway)
    if (this.providerType === 'fast2sms') {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Fast2SMS API key not configured in SMS_API_KEY.',
          timestamp,
        };
      }

      try {
        const cleanNumber = payload.to.replace(/\D/g, '').slice(-10); // Extract 10-digit Indian mobile
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'q',
            message: payload.message,
            numbers: cleanNumber,
          }),
        });

        const data = await response.json();
        if (data.return) {
          return {
            success: true,
            messageId: data.request_id || `f2s_${Date.now()}`,
            timestamp,
          };
        } else {
          return {
            success: false,
            error: data.message || 'Fast2SMS dispatch failed',
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

    // If Twilio
    if (this.providerType === 'twilio') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_FROM_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        return {
          success: false,
          error: 'Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)',
          timestamp,
        };
      }

      try {
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const formParams = new URLSearchParams();
        formParams.append('To', payload.to);
        formParams.append('From', fromNumber);
        formParams.append('Body', payload.message);

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formParams.toString(),
          }
        );

        const data = await response.json();
        if (response.ok) {
          return {
            success: true,
            messageId: data.sid,
            timestamp,
          };
        } else {
          return {
            success: false,
            error: data.message || 'Twilio SMS failed',
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

    // Default fallback mock
    return {
      success: true,
      messageId: `sms_live_mock_${Date.now()}`,
      timestamp,
    };
  }
}
