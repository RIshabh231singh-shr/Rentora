const nodemailer = require("nodemailer");
const env = require("./env");

let transporter;

if (process.env.EMAIL_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
  });
} else {
  transporter = nodemailer.createTransport({
    service: env.email.service,
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
  });
}

module.exports = transporter;

