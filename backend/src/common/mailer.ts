import * as nodemailer from 'nodemailer';

/** Cấu hình SMTP dùng chung (OTP, vé điện tử...). Ưu tiên biến môi trường MAIL_*. */
export function getMailUser() {
  return (process.env.MAIL_USER || 'luongthanh1152011@gmail.com').trim();
}

export function createMailTransporter() {
  const mailPass = (process.env.MAIL_PASS || 'dvrjdhcvhqrymsvs').replace(/\s+/g, '');
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT || 587),
    secure: false, // 587 dùng STARTTLS
    auth: { user: getMailUser(), pass: mailPass },
  });
}
