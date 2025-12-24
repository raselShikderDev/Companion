/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
/** biome-ignore-all assist/source/organizeImports: > */
/** biome-ignore-all lint/style/useNodejsImportProtocol: <> */

import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url"
import { envVars } from "../configs/envVars";
import customError from "../shared/customError";

const transporter = nodemailer.createTransport({
  port: Number(envVars.SMTP.SMTP_PORT),
  host: envVars.SMTP.SMTP_HOST as string,
  auth: {
    user: envVars.SMTP.SMTP_USER as string,
    pass: envVars.SMTP.SMTP_PASS as string,
  },
  secure: true,
});

interface sendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData?: Record<string, any>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[] | undefined;
}

export const sendEmail = async ({
  to,
  subject,
  templateName,
  templateData,
  attachments,
}: sendEmailOptions) => {
  console.log({
    to,
    subject,
    templateName,
    templateData,
    attachments,
  });

  try {
    if (envVars.NODE_ENV === "Development") console.log("started sending email");
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const templatePath = path.join(
      __dirname,
      "templates",
      `${templateName}.ejs`
    )

    console.log({ templatePath });

if (envVars.NODE_ENV === "Development")
      console.log(`\u2709\uFE0F Email send to ${to}: ${templateData}`);
    const html = await ejs.renderFile(templatePath, templateData);

    console.log({ html });


    const info = await transporter.sendMail({
      from: envVars.SMTP.SMTP_FROM,
      to,
      subject,
      html: html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });
    if (envVars.NODE_ENV === "Development")
      console.log(`\u2709\uFE0F Email send to ${to}: ${info.messageId}`);
  } catch (error) {
    if (envVars.NODE_ENV === "Development") console.log(error);
    throw new customError(401, "Sending email error");
  }
};

