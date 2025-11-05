const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendEmail(to, subject, html) {
  const info = await transporter.sendMail({
    from: `"Stock App" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  return info.messageId;
}

module.exports = { sendEmail };
