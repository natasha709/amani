import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: process.env.SMTP_PORT === '465', // SSL/TLS
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export const sendOnboardingEmail = async (email: string, firstName: string, temporaryPassword: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Amani School System" <no-reply@amani.edu.ug>',
    to: email,
    subject: 'Welcome to Amani School System - Your Account Details',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4f46e5;">Welcome, ${firstName}!</h2>
        <p>A staff account has been created for you in the Amani School System.</p>
        <p>Your temporary login credentials are:</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 10px 0 0 0;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        </div>
        <p>For security reasons, you will be required to change this password when you first log in.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Login to Your Account</a>
        <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">If you did not expect this email, please ignore it.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Onboarding email sent to ${email}`);
  } catch (error) {
    console.error('Error sending onboarding email:', error);
  }
};
