import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Email service for sending transactional emails
 */

// Email configuration from environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  from: process.env.SMTP_FROM || 'noreply@hms.com',
};

// Create reusable transporter
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
  }
  return transporter;
}

/**
 * Email templates
 */

interface BookingConfirmationData {
  customerName: string;
  customerEmail: string;
  hotelName: string;
  roomName: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  bookingId: string;
}

interface BookingCancellationData {
  customerName: string;
  customerEmail: string;
  hotelName: string;
  roomName: string;
  checkIn: Date;
  checkOut: Date;
  bookingId: string;
  cancellationFee?: number;
}

interface WelcomeEmailData {
  name: string;
  email: string;
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation(
  data: BookingConfirmationData
): Promise<void> {
  const checkInDate = new Date(data.checkIn).toLocaleDateString();
  const checkOutDate = new Date(data.checkOut).toLocaleDateString();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .booking-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${data.customerName},</p>
          <p>Thank you for your booking! Your reservation has been confirmed.</p>

          <div class="booking-details">
            <h3>Booking Details</h3>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p><strong>Hotel:</strong> ${data.hotelName}</p>
            <p><strong>Room:</strong> ${data.roomName}</p>
            <p><strong>Check-in:</strong> ${checkInDate}</p>
            <p><strong>Check-out:</strong> ${checkOutDate}</p>
            <p><strong>Total Price:</strong> $${data.totalPrice.toFixed(2)}</p>
          </div>

          <p>We look forward to welcoming you!</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Hotel Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Booking Confirmed!

    Dear ${data.customerName},

    Thank you for your booking! Your reservation has been confirmed.

    Booking Details:
    Booking ID: ${data.bookingId}
    Hotel: ${data.hotelName}
    Room: ${data.roomName}
    Check-in: ${checkInDate}
    Check-out: ${checkOutDate}
    Total Price: $${data.totalPrice.toFixed(2)}

    We look forward to welcoming you!
    If you have any questions, please don't hesitate to contact us.
  `;

  try {
    await getTransporter().sendMail({
      from: EMAIL_CONFIG.from,
      to: data.customerEmail,
      subject: `Booking Confirmation - ${data.hotelName}`,
      text,
      html,
    });
    console.log(`Booking confirmation email sent to ${data.customerEmail}`);
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    throw error;
  }
}

/**
 * Send booking cancellation email
 */
export async function sendBookingCancellation(
  data: BookingCancellationData
): Promise<void> {
  const checkInDate = new Date(data.checkIn).toLocaleDateString();
  const checkOutDate = new Date(data.checkOut).toLocaleDateString();
  const feeInfo = data.cancellationFee
    ? `<p><strong>Cancellation Fee:</strong> $${data.cancellationFee.toFixed(2)}</p>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .booking-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #DC2626; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Cancelled</h1>
        </div>
        <div class="content">
          <p>Dear ${data.customerName},</p>
          <p>Your booking has been cancelled as requested.</p>

          <div class="booking-details">
            <h3>Cancelled Booking Details</h3>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p><strong>Hotel:</strong> ${data.hotelName}</p>
            <p><strong>Room:</strong> ${data.roomName}</p>
            <p><strong>Check-in:</strong> ${checkInDate}</p>
            <p><strong>Check-out:</strong> ${checkOutDate}</p>
            ${feeInfo}
          </div>

          <p>We hope to welcome you in the future!</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Hotel Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await getTransporter().sendMail({
      from: EMAIL_CONFIG.from,
      to: data.customerEmail,
      subject: `Booking Cancellation - ${data.hotelName}`,
      html,
    });
    console.log(`Booking cancellation email sent to ${data.customerEmail}`);
  } catch (error) {
    console.error('Failed to send booking cancellation email:', error);
    throw error;
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Hotel Management System!</h1>
        </div>
        <div class="content">
          <p>Dear ${data.name},</p>
          <p>Welcome! Your account has been created successfully.</p>
          <p>You can now start booking rooms at our partner hotels.</p>
          <p>Thank you for joining us!</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Hotel Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await getTransporter().sendMail({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: 'Welcome to Hotel Management System',
      html,
    });
    console.log(`Welcome email sent to ${data.email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw - welcome email failure shouldn't block registration
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await getTransporter().verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service configuration error:', error);
    return false;
  }
}

/**
 * Generic email sending interface
 */
export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  html?: string;
  data?: Record<string, any>;
}

/**
 * Generic send email function
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const transporter = getTransporter();

    // If template is specified and it's a booking confirmation
    if (options.template === 'bookingConfirmation' && options.data) {
      await sendBookingConfirmation({
        customerName: options.data.guestName || options.data.customerName,
        customerEmail: options.to,
        hotelName: options.data.hotelName,
        roomName: options.data.roomName,
        checkIn: new Date(options.data.checkIn),
        checkOut: new Date(options.data.checkOut),
        totalPrice: options.data.totalPrice,
        bookingId: options.data.bookingId,
      });
      return;
    }

    // Otherwise, send generic email
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: options.to,
      subject: options.subject,
      html: options.html || '<p>No content</p>',
    });

    console.log(`Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
