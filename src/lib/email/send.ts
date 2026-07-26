import "server-only";
import { getEmailClient } from "./client";
import { serverEnv } from "@/lib/env/server";
import type { EmailContent } from "./templates";

export interface SendEmailParams {
  to: string;
  content: EmailContent;
}

/** Minimal slice of the Resend SDK this module needs — lets tests pass a fake client instead of constructing a real one (which requires EMAIL_API_KEY). */
export interface EmailSendingClient {
  emails: {
    send: (params: {
      from: string;
      to: string;
      subject: string;
      html: string;
      text: string;
    }) => Promise<unknown>;
  };
}

export async function sendEmail(
  params: SendEmailParams,
  client: EmailSendingClient = getEmailClient(),
): Promise<void> {
  if (!serverEnv.EMAIL_FROM) {
    throw new Error("Email is not configured: EMAIL_FROM must be set.");
  }
  await client.emails.send({
    from: serverEnv.EMAIL_FROM,
    to: params.to,
    subject: params.content.subject,
    html: params.content.html,
    text: params.content.text,
  });
}
