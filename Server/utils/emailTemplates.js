// utils/emailTemplates.js

exports.generateOTPEmail = (otp) => {
  return `
  <div style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
      <h2 style="color: #4A90E2; text-align: center;">🔐 SecureDocs Login OTP</h2>
      <p>Hello 👋,</p>
      <p>Here is your One-Time Password (OTP) to login to <strong>SecureDocs</strong>:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 24px; letter-spacing: 4px; color: #ffffff; background: #4A90E2; padding: 10px 20px; border-radius: 8px; font-weight: bold;">
          ${otp}
        </span>
      </div>
      <p style="color: #888;">This OTP will expire in 10 minutes. Please do not share it with anyone.</p>
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #aaa; text-align: center;">If you didn’t request this, please ignore this email.</p>
      <p style="font-size: 12px; color: #aaa; text-align: center;">SecureDocs © ${new Date().getFullYear()}</p>
    </div>
  </div>`;
};
