import nodemailer from 'nodemailer';

// Create a transporter using environment variables
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.error('Email credentials not configured in .env file');
    console.error('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
    console.error('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'SET' : 'NOT SET');
    throw new Error('Email credentials not configured');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Elective'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #666;">You requested a password reset for your account.</p>
          <p style="color: #666;">Click the link below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
          <p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
          <p style="color: #666;">If you didn't request this password reset, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send password reset confirmation email
 */
export const sendPasswordResetConfirmationEmail = async (email) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Elective'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Password Reset Successful</h2>
          <p style="color: #666;">Your password has been successfully reset.</p>
          <p style="color: #666;">You can now log in with your new password.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Go to Login</a>
          <p style="color: #666;">If you didn't request this change, please contact support immediately.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset confirmation email:', error);
    throw error;
  }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email, username) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Elective'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Our App!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome, ${username}!</h2>
          <p style="color: #666;">Thank you for registering with us.</p>
          <p style="color: #666;">We're excited to have you on board!</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Get Started</a>
          <p style="color: #666;">If you have any questions, feel free to reach out to our support team.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

/**
 * Send email verification code
 */
export const sendVerificationCode = async (email, verificationCode) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Elective'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Your Verification Code</h2>
          <p style="color: #666;">Thank you for registering! Please use the following verification code to complete your signup:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #333;">${verificationCode}</span>
          </div>
          <p style="color: #999; font-size: 12px;">This code will expire in 10 minutes.</p>
          <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification code sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};
