const nodemailer = require('nodemailer');
require('dotenv').config();

// Create Nodemailer SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // True for 465, false for 587
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// Reusable HTML Templates
const templates = {
  registration: (name) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">Welcome to SmartCity Portal!</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for registering on the <strong>Smart City Citizen Service Portal</strong>. Your account has been successfully created and configured with role-based JWT security.</p>
      <p>You can now log in to:</p>
      <ul>
        <li>Report local civic issues (potholes, water leaks, drainage, etc.)</li>
        <li>Pin precise GPS locations on our interactive OpenStreetMap Leaflet map</li>
        <li>Track the real-time resolution timeline of your reports</li>
        <li>Communicate directly with assigned Department Officers</li>
      </ul>
      <a href="http://localhost:5173" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">Access Citizen Portal</a>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #64748b; text-align: center;">This is an automated notification. Please do not reply directly to this email.</p>
    </div>
  `,
  
  submission: (name, complaintId, title, category) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">Grievance Submission Recorded</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Your civic grievance has been successfully submitted and indexed in the SmartCity municipal database.</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Complaint ID:</strong> <span style="font-family: monospace; font-weight: bold;">${complaintId}</span></p>
        <p style="margin: 4px 0;"><strong>Category:</strong> ${category}</p>
        <p style="margin: 4px 0;"><strong>Subject:</strong> ${title}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #64748b; font-weight: bold;">Submitted</span></p>
      </div>
      <p>A specialized Department Officer will review the incident, coordinate coordinates, inspect evidence, and assign field maintenance crews. You will receive real-time updates as progress is made.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #64748b; text-align: center;">SmartCity Civil Operations Department</p>
    </div>
  `,

  statusUpdate: (name, complaintId, title, newStatus, remarks) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-top: 0;">Civic Grievance Status Update</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>There has been an update regarding your reported civic issue.</p>
      <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-left: 4px solid #0d9488; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Complaint ID:</strong> <span style="font-family: monospace; font-weight: bold;">${complaintId}</span></p>
        <p style="margin: 4px 0;"><strong>Subject:</strong> ${title}</p>
        <p style="margin: 4px 0;"><strong>New Workflow Status:</strong> <span style="color: #0d9488; font-weight: bold; text-transform: uppercase;">${newStatus}</span></p>
      </div>
      ${remarks ? `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-top: 15px;">
        <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Official Remarks:</strong></p>
        <p style="margin: 5px 0 0 0; font-style: italic; color: #334155;">"${remarks}"</p>
      </div>` : ''}
      <p style="margin-top: 20px;">You can review the full field assessment details and chat with the team on your dashboard.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #64748b; text-align: center;">This is an automated notification. Please do not reply.</p>
    </div>
  `,

  passwordReset: (name, resetLink) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #dc2626; border-bottom: 2px solid #f87171; padding-bottom: 10px; margin-top: 0;">Password Reset Request</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>We received a request to reset the password for your Smart City Portal account. Click the secure link below to proceed:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">Reset My Password</a>
      <p style="font-size: 12px; color: #64748b; margin-top: 15px;">This secure link will expire in 1 hour. If you did not make this request, you can safely ignore this email; your password will remain secure.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #64748b; text-align: center;">SmartCity Cybersecurity Operations</p>
    </div>
  `
};

/**
 * Send email dispatch
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML body content
 */
const sendMail = async (to, subject, htmlContent) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email Simulator] SMTP credentials missing in .env. Logging email payload:`);
    console.log(`[Email Simulator] To: ${to} | Subject: ${subject}`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Smart City Portal" <no-reply@smartcity.gov>',
    to: to,
    subject: subject,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Dispatch] Success: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    console.error(`[Email Error] Failed sending to ${to}:`, error.message);
    throw error;
  }
};

module.exports = {
  templates,
  sendMail
};
