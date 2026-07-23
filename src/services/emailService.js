import nodemailer from "nodemailer";
import mailConfig from "../config/mail.js";

const sendConfirmationEmail = async (userEmail, username) => {
  const { host, port, auth, from } = mailConfig;

  if (!host || !auth.user || !auth.pass) {
    console.warn(
      `[EmailService] SMTP credentials not fully configured in config. Skipping confirmation email to ${userEmail}.`
    );
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      auth,
    });

    const mailOptions = {
      from: `"Task Management System" <${from}>`,
      to: userEmail,
      subject: "Welcome to Task Management System - Registration Confirmed",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #4A90E2;">Registration Successful!</h2>
          <p>Dear <strong>${username}</strong>,</p>
          <p>Thank you for registering on our Task Management System. Your account has been successfully created.</p>
          <p>You can now log in and manage your tasks, assign tasks, and collaborate with your team.</p>
          <br />
          <p>Best regards,</p>
          <p><strong>Task Management Team</strong></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Confirmation email sent successfully to ${userEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EmailService] Failed to send confirmation email to ${userEmail}:`, error.message);
    return false;
  }
};

const sendOtpEmail = async (userEmail, otpCode) => {
  const { host, port, auth, from } = mailConfig;

  if (!host || !auth.user || !auth.pass) {
    console.warn(
      `[EmailService] SMTP credentials not fully configured in config. Skipping OTP email to ${userEmail}.`
    );
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      auth,
    });

    const mailOptions = {
      from: `"Task Management System" <${from}>`,
      to: userEmail,
      subject: "Your OTP Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #4A90E2; text-align: center;">Verify Your Email</h2>
          <p>Hello,</p>
          <p>You have registered or requested an OTP code to verify your email address. Please use the following One-Time Password (OTP) to complete the verification process:</p>
          <div style="background-color: #f9f9f9; border: 1px dashed #ccc; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0;">
            ${otpCode}
          </div>
          <p style="color: #666; font-size: 12px; text-align: center;">This OTP is valid for 5 minutes. If you did not request this code, please ignore this email.</p>
          <br />
          <p>Best regards,</p>
          <p><strong>Task Management Team</strong></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] OTP email sent successfully to ${userEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EmailService] Failed to send OTP email to ${userEmail}:`, error.message);
    return false;
  }
};

export { sendConfirmationEmail, sendOtpEmail };
