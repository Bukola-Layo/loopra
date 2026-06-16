import nodemailer from "nodemailer";

const globalForMail = globalThis as unknown as {
  transporter: nodemailer.Transporter | undefined;
};

function createTransporter(): nodemailer.Transporter {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: "localhost",
    port: 1025,
    secure: false,
  });
}

export const transporter =
  globalForMail.transporter ?? createTransporter();

if (process.env.NODE_ENV !== "production")
  globalForMail.transporter = transporter;

export const fromEmail =
  process.env.SMTP_FROM ?? "noreply@loopra.com";
