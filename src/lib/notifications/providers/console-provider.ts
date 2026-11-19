import { SMSProvider, EmailProvider, SMSPayload, EmailPayload, NotificationResult } from '../types';

export class ConsoleSMSProvider implements SMSProvider {
  name = 'Console / Simulated SMS';

  async sendSMS(payload: SMSPayload): Promise<NotificationResult> {
    const timestamp = new Date().toISOString();
    console.log('\n======================================================');
    console.log('📱 [SIMULATED SMS DISPATCH - SONA SCHEDULER]');
    console.log(`⏰ Time: ${timestamp}`);
    console.log(`📤 Sender: ${payload.senderId || 'SONASCH'}`);
    console.log(`📥 To: ${payload.to}`);
    console.log('------------------------------------------------------');
    console.log(`💬 Message: \n${payload.message}`);
    console.log('======================================================\n');

    return {
      success: true,
      messageId: `sms_mock_${Date.now()}`,
      timestamp,
    };
  }
}

export class ConsoleEmailProvider implements EmailProvider {
  name = 'Console / Simulated Email';

  async sendEmail(payload: EmailPayload): Promise<NotificationResult> {
    const timestamp = new Date().toISOString();
    console.log('\n======================================================');
    console.log('📧 [SIMULATED EMAIL DISPATCH - SONA SCHEDULER]');
    console.log(`⏰ Time: ${timestamp}`);
    console.log(`📥 To: ${payload.to}`);
    if (payload.cc?.length) {
      console.log(`👥 CC: ${payload.cc.join(', ')}`);
    }
    console.log(`📌 Subject: ${payload.subject}`);
    console.log('------------------------------------------------------');
    console.log(`📄 Content:\n${payload.text || payload.html}`);
    console.log('======================================================\n');

    return {
      success: true,
      messageId: `email_mock_${Date.now()}`,
      timestamp,
    };
  }
}
