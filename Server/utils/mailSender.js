const axios = require("axios");
require("dotenv").config();

const mailSender = async (email, subject, htmlContent) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "SecureDocs",
          email: "khanmdmonis45@gmail.com",
        },
        to: [{ email }],
        subject,
        htmlContent, // Accepts full HTML (no <p> wrapping here)
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Email Sent:", response.data);
    return true;
  } catch (error) {
    console.error(
      "❌ Error sending email:",
      error.response ? error.response.data : error.message
    );
    return false;
  }
};

module.exports = mailSender;
