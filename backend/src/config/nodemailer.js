const nodemailer = require("nodemailer");
const env = require("./env");

let transporter;

const timeoutOptions = {
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
};

if (process.env.EMAIL_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
    ...timeoutOptions,
  });
} else {
  transporter = nodemailer.createTransport({
    service: env.email.service || "gmail",
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
    ...timeoutOptions,
  });
}

module.exports = transporter;

