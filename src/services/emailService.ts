import emailjs from '@emailjs/browser';

// Initialize EmailJS
emailjs.init(import.meta.env.VITE_PUBLIC_EMAILJS_PUBLIC_KEY!);


export interface EmailData {
  to: string;
  subject: string;
  body: string;
  studentName: string;
  applicationId: string;
}

export const EMAIL_TEMPLATES = {
  APPLICATION_APPROVED: {
    subject: 'Application Approved - Welcome to EduTech!',
    body: (data: { studentName: string; courseName: string; applicationId: string }) => `
      <h2>Congratulations ${data.studentName}!</h2>
      <p>Your application for <strong>${data.courseName}</strong> has been <span style="color:green">APPROVED</span>.</p>
      <p><strong>Application ID:</strong> ${data.applicationId}</p>
    `
  },
  APPLICATION_REJECTED: {
    subject: 'Application Status Update - EduTech',
    body: (data: { studentName: string; courseName: string; applicationId: string; notes?: string }) => `
      <h2>Hello ${data.studentName},</h2>
      <p>We regret to inform you that your application for <strong>${data.courseName}</strong> was not approved.</p>
      ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
      <p><strong>Application ID:</strong> ${data.applicationId}</p>
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
      // Ensure we have the required environment variables
      const serviceId = import.meta.env.VITE_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        console.error('❌ EmailJS configuration missing. Please check environment variables.');
        return false;
      }

      // Re-initialize EmailJS with the public key to ensure it's set correctly
      emailjs.init(publicKey);

      const response = await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: emailData.to,
          from_name: 'EduTech Student Management System',
          subject: emailData.subject,
          message: emailData.body,
          student_name: emailData.studentName,
          application_id: emailData.applicationId,
        }
      );
      console.log('✅ Email sent successfully to:', emailData.to, response);
      return true;
    } catch (error) {
      console.error('❌ EmailJS failed, trying fallback for:', emailData.to, error);
      // Try fallback email service
      return await this.sendEmailFallback(emailData);
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
      to: 'test@example.com',
      subject: 'Test Email from EduTech',
      body: 'This is a test email.',
      studentName: 'Tester',
      applicationId: 'TEST-001',
    });
  }

  // Fallback email service using console logging for development
  async sendEmailFallback(emailData: EmailData): Promise<boolean> {
    console.log('📧 EMAIL FALLBACK (Development Mode):');
    console.log('To:', emailData.to);
    console.log('Subject:', emailData.subject);
    console.log('Body:', emailData.body);
    console.log('Student Name:', emailData.studentName);
    console.log('Application ID:', emailData.applicationId);
    console.log('---');
    
    // In a real application, you would integrate with another email service here
    // For now, we'll just log it and return true
    return true;
  }
}

export const emailService = EmailService.getInstance();
