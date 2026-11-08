import * as nodemailer from 'nodemailer';

/** Cấu hình Email dùng chung (Resend HTTP API ưu tiên trên Render / Gmail SMTP). */
export function getMailUser() {
  return (process.env.MAIL_USER || 'luongthanh1152011@gmail.com').trim();
}

export type AppMailOptions = {
  from?: string;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer; cid?: string }>;
};

export type QueuedRelayMail = {
  id: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; contentBase64: string; cid?: string }>;
  createdAt: string;
};

/** Hàng đợi chuyển tiếp Email khi chạy trên Render Free Tier (do Render chặn cổng SMTP 587) */
export const pendingMailRelayQueue: QueuedRelayMail[] = [];

export function enqueueRelayMail(opts: AppMailOptions) {
  const item: QueuedRelayMail = {
    id: `mail_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    from: opts.from || `"VietTour" <${getMailUser()}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: (opts.attachments || []).map((a) => ({
      filename: a.filename,
      contentBase64: a.content.toString('base64'),
      cid: a.cid,
    })),
    createdAt: new Date().toISOString(),
  };
  pendingMailRelayQueue.push(item);
  if (pendingMailRelayQueue.length > 100) {
    pendingMailRelayQueue.shift();
  }
  return item;
}

async function sendViaResend(opts: AppMailOptions): Promise<boolean> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) return false;

  const fromAddr = (process.env.RESEND_FROM || 'VietTour <onboarding@resend.dev>').trim();
  const payload: Record<string, unknown> = {
    from: fromAddr,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
  };

  if (opts.attachments && opts.attachments.length > 0) {
    payload.attachments = opts.attachments.map((a) => ({
      filename: a.filename,
      content: a.content.toString('base64'),
      ...(a.cid ? { content_id: a.cid } : {}),
    }));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Resend HTTP ${res.status}: ${errText}`);
    }
    return true;
  } finally {
    clearTimeout(timer);
  }
}

async function sendViaWebhook(opts: AppMailOptions): Promise<boolean> {
  const webhookUrl = (process.env.MAIL_WEBHOOK_URL || '').trim();
  if (!webhookUrl) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        fromName: 'VietTour',
        attachments: (opts.attachments || []).map((a) => ({
          filename: a.filename,
          contentBase64: a.content.toString('base64'),
          cid: a.cid,
        })),
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Mail Webhook HTTP ${res.status}: ${errText}`);
    }
    return true;
  } finally {
    clearTimeout(timer);
  }
}

export function createMailTransporter() {
  const mailPass = (process.env.MAIL_PASS || 'dvrjdhcvhqrymsvs').replace(/\s+/g, '');
  const isRenderCloud = Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL || process.env.NODE_ENV === 'production');
  const smtpTransporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT || 587),
    secure: Number(process.env.MAIL_PORT) === 465,
    auth: { user: getMailUser(), pass: mailPass },
    connectionTimeout: isRenderCloud ? 2500 : 7000,
    greetingTimeout: isRenderCloud ? 2500 : 5000,
    socketTimeout: isRenderCloud ? 3500 : 10000,
  });

  return {
    async sendMail(opts: AppMailOptions) {
      // 1. Ưu tiên gửi qua Resend HTTP API (Port 443 - tốc độ < 0.5s)
      if (process.env.RESEND_API_KEY) {
        try {
          await sendViaResend(opts);
          return { accepted: [opts.to], provider: 'resend' };
        } catch {
          // Chuyển sang phương thức kế tiếp
        }
      }

      // 2. Dự phòng qua Mail HTTP Webhook (Google Apps Script / Relay qua cổng 443)
      if (process.env.MAIL_WEBHOOK_URL) {
        try {
          await sendViaWebhook(opts);
          return { accepted: [opts.to], provider: 'webhook' };
        } catch {
          // Chuyển sang phương thức kế tiếp
        }
      }

      // 3. Nếu đang chạy trên Render Free Tier (chặn cổng 587), đưa ngay vào hàng đợi Relay (< 10ms) để Worker gửi qua Gmail SMTP
      if (isRenderCloud && !process.env.FORCE_DIRECT_SMTP) {
        enqueueRelayMail(opts);
        return { accepted: [opts.to], provider: 'relay-queue' };
      }

      // 4. Gửi qua Gmail SMTP truyền thống (Localhost / VPS mở cổng 587), nếu lỗi cũng đưa vào Relay Queue
      try {
        return await smtpTransporter.sendMail({
          from: opts.from || `"VietTour" <${getMailUser()}>`,
          to: opts.to,
          subject: opts.subject,
          html: opts.html,
          attachments: opts.attachments,
        });
      } catch {
        enqueueRelayMail(opts);
        return { accepted: [opts.to], provider: 'relay-queue' };
      }
    },
  };
}
