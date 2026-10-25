import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { isValidEmail } from "~/lib/support";

/**
 * Everyone who should get a copy of each support message: one address per line in
 * support-recipients.txt (project root). Blank lines and lines starting with # are ignored.
 * To add a teammate, add a line; no code change needed.
 */
export async function getSupportRecipients(): Promise<string[]> {
  try {
    const text = await readFile(path.join(process.cwd(), "support-recipients.txt"), "utf8");
    const addresses = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && isValidEmail(line));
    return [...new Set(addresses.map((address) => address.toLowerCase()))];
  } catch (error) {
    console.error("Couldn't read support-recipients.txt:", error);
    return [];
  }
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 465);
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

/** Strips line breaks so user-supplied text can never inject extra mail headers. */
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

export type SupportEmail = {
  name: string | null;
  email: string;
  topic: string;
  message: string;
  signedIn: boolean;
};

/**
 * Emails a support message to everyone in support-recipients.txt. Replying goes to
 * the sender. Returns false (and logs) when mail isn't configured or sending fails;
 * the message is already saved in the admin support inbox either way.
 */
export async function sendSupportEmail(support: SupportEmail): Promise<boolean> {
  const transport = createTransport();
  const recipients = await getSupportRecipients();
  if (!transport || recipients.length === 0) {
    console.warn("Support email not sent: SMTP is not configured or support-recipients.txt is empty.");
    return false;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER!;
  const sender = support.name ? `${oneLine(support.name)} <${support.email}>` : support.email;

  try {
    await transport.sendMail({
      from,
      to: recipients,
      replyTo: support.email,
      subject: `[kvelpo support] ${oneLine(support.topic)}`,
      text: [
        `From: ${sender}`,
        `Topic: ${oneLine(support.topic)}`,
        `Signed in: ${support.signedIn ? "yes" : "no"}`,
        "",
        support.message,
        "",
        "Reply to this email to answer them directly. It is also in the admin support inbox.",
      ].join("\n"),
    });
    return true;
  } catch (error) {
    console.error("Failed to send support email:", error);
    return false;
  }
}
