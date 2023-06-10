import nodemailer from "nodemailer";
import { EmailOptions } from "@/types/EmailOptions";
import { ErrorHandler } from "./ErrorHandler";

export async function sendEmailWithDocumentLink(
  options: EmailOptions,
  documentLink: string
) {
  const { to, documentType, documentId, pdfStream, message, email } = options;

  // Create a Nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SENDGRID_USER,
      pass: process.env.SENDGRID_PASSWORD,
    },
  });

  // Prepare the email content
  const emailOptions = {
    from: process.env.EMAIL_GRID_FROM,
    to,
    subject: `Your ${
      documentType.charAt(0).toUpperCase() + documentType.slice(1)
    } ${documentId}`,
    text: message,
    html: email,
  };

  try {
    // Send the email
    const info = await transporter.sendMail(emailOptions);
    // return a response object with the status and messageId
    return {
      status: "success",
      messageId: info.messageId,
    };
  } catch (error: unknown) {
    return ErrorHandler(error);
  }
}
