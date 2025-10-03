import emailjs from '@emailjs/browser';

// Initialize EmailJS
emailjs.init(import.meta.env.VITE_PUBLIC_EMAILJS_PUBLIC_KEY!);


export interface EmailData {
  to: string;
  subject: string;
  body: string;
  studentName: string;
  applicationId: string;
  from?: string;
}

export const EMAIL_TEMPLATES = {
  APPLICATION_APPROVED: {
    subject: 'Application Approved - Welcome to EduTech!',
    body: (data: { studentName: string; courseName: string; applicationId: string }) => `
      Congratulations ${data.studentName}!
      Your application for ${data.courseName} has been APPROVED 
      Application ID: ${data.applicationId}
    `
  },
  APPLICATION_REJECTED: {
    subject: 'Application Status Update - EduTech',
    body: (data: { studentName: string; courseName: string; applicationId: string; notes?: string }) => `
      Hello ${data.studentName},
      We regret to inform you that your application for ${data.courseName} was not approved.
      ${data.notes ? `Notes:${data.notes}` : ''}
      Application ID: ${data.applicationId}
    `
  }
};

class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const response = await emailjs.send(
        import.meta.env.VITE_PUBLIC_EMAILJS_SERVICE_ID!,
        import.meta.env.VITE_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          to: emailData.to,
          subject: emailData.subject,
          message: emailData.body,
          from: emailData.from,
        }
      );
      console.log('✅ Email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendApplicationApprovedNotification(
    studentEmail: string, studentName: string, courseName: string, applicationId: string
  ) {
    const template = EMAIL_TEMPLATES.APPLICATION_APPROVED;
    return this.sendEmail({
      to: studentEmail,
      subject: template.subject,
      body: template.body({ studentName, courseName, applicationId }),
      studentName,
      applicationId,
    });
  }

  async sendApplicationRejectedNotification(
    studentEmail: string, studentName: string, courseName: string, applicationId: string, notes?: string
  ) {
    const template = EMAIL_TEMPLATES.APPLICATION_REJECTED;
    return this.sendEmail({
      to: studentEmail,
      subject: template.subject,
      body: template.body({ studentName, courseName, applicationId, notes }),
      studentName,
      applicationId,
    });
  }

  async testEmailService() {
    return this.sendEmail({
      to: 'alwande.nhlapho@integrove.com',
      subject: 'Test Email from EduTech',
      body: 'This is a test email.',
      studentName: 'Tester',
      applicationId: 'TEST-001',
    });
  }
}

export const emailService = EmailService.getInstance();
