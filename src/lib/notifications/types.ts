// Notification Service Interface & Type Definitions

export interface SMSPayload {
  to: string; // Phone number e.g. +919443311221
  message: string;
  senderId?: string;
}

export interface EmailPayload {
  to: string; // Email address
  cc?: string[]; // CC recipients
  subject: string;
  html: string;
  text?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

export interface SMSProvider {
  name: string;
  sendSMS(payload: SMSPayload): Promise<NotificationResult>;
}

export interface EmailProvider {
  name: string;
  sendEmail(payload: EmailPayload): Promise<NotificationResult>;
}
