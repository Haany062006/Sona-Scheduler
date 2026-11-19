import { SMSProvider, EmailProvider, NotificationResult } from './types';
import { ConsoleSMSProvider, ConsoleEmailProvider } from './providers/console-provider';
import { LiveSMSProvider } from './providers/sms-provider';
import { LiveEmailProvider } from './providers/email-provider';

class NotificationServiceManager {
  private smsProvider: SMSProvider;
  private emailProvider: EmailProvider;

  constructor() {
    const smsType = (process.env.SMS_PROVIDER || 'console').toLowerCase();
    const emailType = (process.env.EMAIL_PROVIDER || 'console').toLowerCase();

    this.smsProvider = smsType === 'console' ? new ConsoleSMSProvider() : new LiveSMSProvider();
    this.emailProvider = emailType === 'console' ? new ConsoleEmailProvider() : new LiveEmailProvider();
  }

  getSMSProviderName(): string {
    return this.smsProvider.name;
  }

  getEmailProviderName(): string {
    return this.emailProvider.name;
  }

  // 1. Class Schedule Notification to Faculty
  async notifyFacultySchedule(params: {
    facultyName: string;
    facultyPhone: string;
    facultyEmail: string;
    subjectCode: string;
    subjectName: string;
    classDate: string;
    startTime: string;
    endTime: string;
    venue?: string;
    studentCount: number;
    assignedStudents: { name: string; register_number: string; section: string }[];
  }): Promise<{ smsResult: NotificationResult; emailResult: NotificationResult }> {
    const smsMessage = `Sona Remedial: Class scheduled for ${params.subjectCode} (${params.subjectName.slice(0, 30)}) on ${params.classDate} at ${params.startTime}. Venue: ${params.venue || 'TBA'}. Assigned Students: ${params.studentCount}.`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; line-height: 1.6;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          Sona College of Technology • Remedial Class Schedule
        </h2>
        <p>Dear <strong>${params.facultyName}</strong>,</p>
        <p>A remedial class has been scheduled for your subject. Details are outlined below:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f8fafc;">
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; width: 35%;">Subject:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${params.subjectCode} - ${params.subjectName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Date & Timing:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${params.classDate} (${params.startTime} to ${params.endTime})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Venue:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${params.venue || 'Designated Hall'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Enrolled Arrear Candidates:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>${params.studentCount} Students</strong></td>
          </tr>
        </table>
        
        <h3 style="color: #334155; margin-top: 20px;">Assigned Student List:</h3>
        <ol style="padding-left: 20px;">
          ${params.assignedStudents.map((s) => `<li><strong>${s.name}</strong> (${s.register_number}, Sec ${s.section})</li>`).join('')}
        </ol>

        <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
          Regards,<br/>
          <strong>Remedial Coordinator</strong><br/>
          Sona College of Technology, Salem
        </p>
      </div>
    `;

    const [smsResult, emailResult] = await Promise.all([
      this.smsProvider.sendSMS({ to: params.facultyPhone, message: smsMessage }),
      this.emailProvider.sendEmail({
        to: params.facultyEmail,
        subject: `Remedial Class Schedule: ${params.subjectCode} - ${params.classDate}`,
        html: emailHtml,
      }),
    ]);

    return { smsResult, emailResult };
  }

  // 2. Peer Tutor Attendance Form Link Notification
  async notifyPeerTutorAttendanceLink(params: {
    tutorName: string;
    tutorPhone: string;
    tutorEmail: string;
    subjectCode: string;
    subjectName: string;
    classDate: string;
    startTime: string;
    venue?: string;
    attendanceUrl: string;
  }): Promise<{ smsResult: NotificationResult; emailResult: NotificationResult }> {
    const smsMessage = `Sona Remedial Tutor: You are assigned to assist ${params.subjectCode} on ${params.classDate} at ${params.startTime}. Open this link to mark attendance: ${params.attendanceUrl}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; line-height: 1.6;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          Sona College of Technology • Peer Tutor Assignment
        </h2>
        <p>Dear <strong>${params.tutorName}</strong>,</p>
        <p>You have been assigned as Senior Peer Tutor for the following remedial class session:</p>
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Subject:</strong> ${params.subjectCode} - ${params.subjectName}</p>
          <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${params.classDate} at ${params.startTime}</p>
          <p style="margin: 4px 0;"><strong>Venue:</strong> ${params.venue || 'TBA'}</p>
        </div>
        <p>Please use the secure button below on your phone or computer to record student attendance during or immediately after the class:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.attendanceUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
            Open Attendance Form
          </a>
        </div>
        <p style="font-size: 12px; color: #64748b;">Or copy this URL directly into your browser: <br/>${params.attendanceUrl}</p>
      </div>
    `;

    const [smsResult, emailResult] = await Promise.all([
      this.smsProvider.sendSMS({ to: params.tutorPhone, message: smsMessage }),
      this.emailProvider.sendEmail({
        to: params.tutorEmail,
        subject: `Peer Tutor Allocation: ${params.subjectCode} Attendance Link`,
        html: emailHtml,
      }),
    ]);

    return { smsResult, emailResult };
  }

  // 3. Post-Attendance Absentee Digest to Faculty and CC
  async notifyAbsenteeDigest(params: {
    facultyName: string;
    facultyPhone: string;
    facultyEmail: string;
    ccEmails?: string[];
    subjectCode: string;
    subjectName: string;
    classDate: string;
    totalEnrolled: number;
    presentCount: number;
    absentCount: number;
    tutorIdentifier: string;
    absentStudents: { name: string; register_number: string; section: string }[];
  }): Promise<{ smsResult: NotificationResult; emailResult: NotificationResult }> {
    const absentRegs = params.absentStudents.map((s) => `${s.name} (${s.register_number})`).join(', ');

    const smsMessage = `Sona Remedial: Attendance submitted for ${params.subjectCode} on ${params.classDate}. Total: ${params.totalEnrolled}, Present: ${params.presentCount}, Absent: ${params.absentCount}. Absentees: ${absentRegs.slice(0, 80)}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; line-height: 1.6;">
        <h2 style="color: #b91c1c; border-bottom: 2px solid #fee2e2; padding-bottom: 8px;">
          Remedial Attendance Report & Absentee Notice
        </h2>
        <p>Dear <strong>${params.facultyName}</strong>,</p>
        <p>Attendance has been verified and submitted by Peer Tutor <strong>${params.tutorIdentifier}</strong> for the session conducted on <strong>${params.classDate}</strong>.</p>
        
        <div style="display: flex; gap: 12px; margin: 16px 0;">
          <div style="flex: 1; background-color: #f1f5f9; padding: 12px; border-radius: 8px; text-align: center;">
            <span style="font-size: 11px; color: #64748b; text-transform: uppercase;">Total</span>
            <div style="font-size: 20px; font-weight: bold; color: #0f172a;">${params.totalEnrolled}</div>
          </div>
          <div style="flex: 1; background-color: #ecfdf5; padding: 12px; border-radius: 8px; text-align: center;">
            <span style="font-size: 11px; color: #047857; text-transform: uppercase;">Present</span>
            <div style="font-size: 20px; font-weight: bold; color: #065f46;">${params.presentCount}</div>
          </div>
          <div style="flex: 1; background-color: #fef2f2; padding: 12px; border-radius: 8px; text-align: center;">
            <span style="font-size: 11px; color: #b91c1c; text-transform: uppercase;">Absent</span>
            <div style="font-size: 20px; font-weight: bold; color: #991b1b;">${params.absentCount}</div>
          </div>
        </div>

        <h3 style="color: #991b1b; margin-top: 20px;">Absent Students:</h3>
        ${
          params.absentStudents.length > 0
            ? `<ul style="color: #991b1b; padding-left: 20px;">
                ${params.absentStudents.map((s) => `<li><strong>${s.name}</strong> (Register No: <code>${s.register_number}</code>, Section ${s.section})</li>`).join('')}
              </ul>`
            : '<p style="color: #047857; font-weight: bold;">Nil — 100% Student Attendance Recorded!</p>'
        }

        <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
          Sona College Remedial Notification System<br/>
          <em>Designated CC: Head of Department & Remedial Incharge</em>
        </p>
      </div>
    `;

    const [smsResult, emailResult] = await Promise.all([
      this.smsProvider.sendSMS({ to: params.facultyPhone, message: smsMessage }),
      this.emailProvider.sendEmail({
        to: params.facultyEmail,
        cc: params.ccEmails,
        subject: `Remedial Attendance Report: ${params.subjectCode} - ${params.classDate} (${params.absentCount} Absent)`,
        html: emailHtml,
      }),
    ]);

    return { smsResult, emailResult };
  }

  // 4. Class Coordinator (CC) Absence Alert
  async notifyClassCoordinatorAbsentees(params: {
    ccName: string;
    ccPhone?: string | null;
    ccEmail?: string | null;
    academicYear?: string | null;
    section: string;
    departmentName?: string;
    subjectCode: string;
    subjectName: string;
    classDate: string;
    tutorName: string;
    absentStudents: { name: string; register_number: string }[];
  }): Promise<{ smsResult?: NotificationResult; emailResult?: NotificationResult }> {
    const studentCount = params.absentStudents.length;
    const studentListSummary = params.absentStudents
      .map((s) => `${s.name} (${s.register_number})`)
      .join(', ');

    const classLabel = `${params.academicYear ? params.academicYear + ' ' : ''}${params.departmentName || 'ADS'} Sec ${params.section}`;

    const smsMessage = `Sona Remedial: Absence Alert to CC ${params.ccName}! ${studentCount} student(s) from your class (${classLabel}) were ABSENT for ${params.subjectCode} remedial class on ${params.classDate} taken by Peer Tutor ${params.tutorName}: ${studentListSummary.slice(0, 80)}. Please follow up.`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; line-height: 1.6;">
        <h2 style="color: #b91c1c; border-bottom: 2px solid #fee2e2; padding-bottom: 8px;">
          Sona College of Technology â€¢ Class Coordinator Absence Alert
        </h2>
        <p>Dear Class Coordinator <strong>${params.ccName}</strong>,</p>
        <p>The following student(s) from your class (<strong>${classLabel}</strong>) were marked <strong>ABSENT</strong> during today's remedial class session:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f8fafc;">
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; width: 35%;">Subject:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${params.subjectCode} - ${params.subjectName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Date:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${params.classDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Conducted by:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">Peer Tutor ${params.tutorName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Total Absentees:</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; color: #b91c1c; font-weight: bold;">${studentCount} Students</td>
          </tr>
        </table>

        <h3 style="color: #991b1b; margin-top: 20px;">Absent Students from Your Section:</h3>
        <ul style="color: #991b1b; padding-left: 20px;">
          ${params.absentStudents.map((s) => `<li><strong>${s.name}</strong> (Register Number: <code>${s.register_number}</code>)</li>`).join('')}
        </ul>

        <p style="margin-top: 16px; font-size: 13px;">
          Please counsel these students and intimate parents if repeated absence occurs.
        </p>

        <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
          Regards,<br/>
          <strong>Remedial Cell</strong><br/>
          Sona College of Technology, Salem
        </p>
      </div>
    `;

    let smsResult: NotificationResult | undefined;
    let emailResult: NotificationResult | undefined;

    if (params.ccPhone) {
      smsResult = await this.smsProvider.sendSMS({ to: params.ccPhone, message: smsMessage });
    }
    if (params.ccEmail) {
      emailResult = await this.emailProvider.sendEmail({
        to: params.ccEmail,
        subject: `Absence Alert: ${studentCount} Student(s) Absent in Remedial Class (${params.subjectCode}) - Section ${params.section}`,
        html: emailHtml,
      });
    }

    return { smsResult, emailResult };
  }

  // 5. Test Notification Trigger (for admin diagnostic check)
  async sendTestSMS(to: string, message: string): Promise<NotificationResult> {
    return this.smsProvider.sendSMS({ to, message });
  }

  async sendTestEmail(to: string, subject: string, html: string): Promise<NotificationResult> {
    return this.emailProvider.sendEmail({ to, subject, html });
  }
}

export const NotificationService = new NotificationServiceManager();
