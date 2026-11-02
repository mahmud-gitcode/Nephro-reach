/* Reads the agent's local SMTP sink (integration-tools/smtp-sink.mjs:30): each
   message is <run>/mail/NNNN.eml, first line `X-Sink-Rcpt: a@x,b@y`, then the
   raw RFC 822 message. Nothing is relayed; the .test addresses never resolve. */
import fs from "node:fs";
import path from "node:path";
import { mailDir } from "./env";

export type SinkMail = {
  file: string;
  rcpt: string[];
  subject: string;
  text: string;
  mtimeMs: number;
};

/** Remember where the sink is before an action, so we only read newer mail. */
export function mailMark(): number {
  return Date.now() - 1000;
}

export async function waitForMail(
  to: string,
  opts: { since: number; subject?: RegExp; timeoutMs?: number },
): Promise<SinkMail> {
  const deadline = Date.now() + (opts.timeoutMs ?? 20_000);
  const want = to.toLowerCase();
  while (Date.now() < deadline) {
    const hit = listMail(opts.since).find(
      (m) =>
        m.rcpt.includes(want) &&
        (!opts.subject || opts.subject.test(m.subject)),
    );
    if (hit) return hit;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(
    `no mail to ${to} in ${mailDir()} since ${new Date(opts.since).toISOString()}`,
  );
}

export function listMail(since = 0): SinkMail[] {
  const dir = mailDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".eml"))
    .map((f) => path.join(dir, f))
    .map((file) => ({ file, st: fs.statSync(file) }))
    .filter(({ st }) => st.mtimeMs >= since)
    .sort((a, b) => a.st.mtimeMs - b.st.mtimeMs)
    .map(({ file, st }) => parse(file, st.mtimeMs));
}

function parse(file: string, mtimeMs: number): SinkMail {
  const raw = fs.readFileSync(file, "utf8");
  const rcptLine = /^X-Sink-Rcpt: (.*)$/m.exec(raw)?.[1] ?? "";
  const rcpt = rcptLine
    .split(",")
    .map((s) => s.trim().replace(/^<|>$/g, "").toLowerCase())
    .filter(Boolean);
  const subject = decodeHeader(
    /^Subject: (.*(?:\r?\n[ \t].*)*)$/m.exec(raw)?.[1] ?? "",
  );
  return { file, rcpt, subject, text: decodeBodies(raw), mtimeMs };
}

/* Minimal MIME: decodes quoted-printable and base64 text parts; good enough
   for nodemailer output. Not a general parser. */
function decodeBodies(raw: string): string {
  const parts = raw.split(/\r?\n--[^\r\n]+\r?\n/);
  return parts
    .map((p) => {
      const [head, ...rest] = p.split(/\r?\n\r?\n/);
      const body = rest.join("\n\n");
      if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(head))
        return qp(body);
      if (
        /Content-Transfer-Encoding:\s*base64/i.test(head) &&
        /Content-Type:\s*text\//i.test(head)
      ) {
        return Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8");
      }
      return body;
    })
    .join("\n");
}

function qp(s: string): string {
  const bytes = s
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-F]{2})/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );
  return Buffer.from(bytes, "latin1").toString("utf8");
}

function decodeHeader(h: string): string {
  return h
    .replace(/\r?\n[ \t]/g, " ")
    .replace(/=\?utf-8\?([BQ])\?([^?]*)\?=/gi, (_, enc, txt) =>
      enc.toUpperCase() === "B"
        ? Buffer.from(txt, "base64").toString("utf8")
        : qp(txt.replace(/_/g, " ")),
    );
}

/** First link to the frontend matching a path, e.g. /invitations/<token>
 *  (backend src/modules/invitations/helpers/invitation-email.util.ts:6). */
export function extractLink(mail: SinkMail, pathPattern: RegExp): URL {
  const urls = mail.text.match(/https?:\/\/[^\s"'<>)\]]+/g) ?? [];
  const hit = urls
    .map((u) => new URL(u.replace(/&amp;/g, "&")))
    .find((u) => pathPattern.test(u.pathname));
  if (!hit) throw new Error(`no link matching ${pathPattern} in ${mail.file}`);
  return hit;
}

/** 6-digit OTP in a mail body (email-2FA, email verify). */
export function extractOtp(mail: SinkMail): string {
  const m = /\b(\d{6})\b/.exec(mail.text);
  if (!m) throw new Error(`no 6-digit code in ${mail.file}`);
  return m[1];
}
