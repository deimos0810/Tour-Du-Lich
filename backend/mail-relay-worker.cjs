const nodemailer = require('nodemailer');

const BACKEND_API = process.env.BACKEND_API || 'https://viettour-backend.onrender.com/api';
const RELAY_KEY = 'viettour-relay-2026';
const MAIL_USER = process.env.MAIL_USER || 'luongthanh1152011@gmail.com';
const MAIL_PASS = (process.env.MAIL_PASS || 'dvrjdhcvhqrymsvs').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: MAIL_USER, pass: MAIL_PASS },
});

async function sendImmediateWelcomeToUser() {
  const targetEmail = 'luongviendong1152011@gmail.com';
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;padding:28px 32px;color:#111111">
    <div style="border-bottom:1px solid #e5e7eb;padding-bottom:14px;margin-bottom:20px">
      <div style="font-size:16px;font-weight:700;letter-spacing:0.5px;color:#111111">VIETTOUR</div>
      <div style="font-size:13.5px;font-weight:600;color:#374151;margin-top:4px">Xác nhận đăng ký nhận bản tin ưu đãi VietTour</div>
    </div>
    <div style="font-size:14px;line-height:1.65;color:#111111">
      <p style="margin-top:0">Xin chào quý khách,</p>
      <p>Cảm ơn quý khách đã đăng ký nhận thông tin từ <b>VietTour</b>. Dưới đây là mã giảm giá đặt tour trực tuyến dành riêng cho quý khách:</p>
      <div style="background:#ffffff;border:1px solid #d1d5db;border-radius:6px;padding:16px 20px;margin:18px 0;text-align:center">
        <div style="font-size:11.5px;font-weight:600;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px">Mã giảm giá đặt tour trực tuyến</div>
        <div style="font-size:22px;font-weight:700;color:#111111;letter-spacing:2px;margin:6px 0;font-family:monospace">VIETTOUR2026</div>
        <div style="font-weight:600;color:#111111;font-size:13.5px">Giảm 10% (tối đa 2.000.000 đ) • Đơn tối thiểu 3.000.000 đ</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">Áp dụng cho tất cả các tour trên hệ thống VietTour</div>
      </div>
      <div style="margin-top:20px">
        <a href="https://viettour-frontend.onrender.com/portal" style="background:#111111;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:6px;display:inline-block">Xem danh sách tour trên VietTour</a>
      </div>
    </div>
    <div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:14px;font-size:12px;color:#6b7280;line-height:1.5">
      <div style="font-weight:600;color:#374151">Công ty Cổ phần Du lịch &amp; Lữ hành VietTour</div>
      <div>Quầy giao dịch: Ga Quốc Nội, Sân bay Quốc tế Tân Sơn Nhất, Q. Tân Bình, TP.HCM</div>
      <div>Tổng đài: 1900 1234 • Email: cskh@viettour.vn</div>
    </div>
  </div>`;

  try {
    await transporter.sendMail({
      from: `"VietTour" <${MAIL_USER}>`,
      to: targetEmail,
      subject: '[VietTour] Chào mừng bạn đăng ký nhận tin — Tặng mã ưu đãi đặt tour',
      html,
    });
    console.log(`[Relay] Đã gửi ngay email mã ưu đãi tới ${targetEmail}!`);
  } catch (err) {
    console.error(`[Relay] Lỗi gửi email khởi tạo:`, err.message);
  }
}

async function pollAndFlush() {
  try {
    const res = await fetch(`${BACKEND_API}/portal/mail-relay/pending?key=${RELAY_KEY}`);
    if (!res.ok) return;
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    if (items.length === 0) return;

    const sentIds = [];
    for (const item of items) {
      try {
        const attachments = Array.isArray(item.attachments)
          ? item.attachments.map((a) => ({
              filename: a.filename,
              content: Buffer.from(a.contentBase64, 'base64'),
              ...(a.cid ? { cid: a.cid } : {}),
            }))
          : undefined;

        await transporter.sendMail({
          from: item.from || `"VietTour" <${MAIL_USER}>`,
          to: item.to,
          subject: item.subject,
          html: item.html,
          attachments,
        });
        console.log(`[Relay] Đã chuyển tiếp email "${item.subject}" tới ${item.to}`);
        sentIds.push(item.id);
      } catch (e) {
        console.error(`[Relay] Lỗi gửi tới ${item.to}:`, e.message);
      }
    }

    if (sentIds.length > 0) {
      await fetch(`${BACKEND_API}/portal/mail-relay/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: RELAY_KEY, ids: sentIds }),
      });
    }
  } catch {
    // Bỏ qua lỗi mạng tạm thời
  }
}

async function main() {
  const once = process.argv.includes('--once');
  if (process.argv.includes('--send-initial')) {
    await sendImmediateWelcomeToUser();
  }
  await pollAndFlush();
  if (!once) {
    console.log('[Relay] Đang lắng nghe hàng đợi email từ Render mỗi 2.5 giây...');
    setInterval(pollAndFlush, 2500);
  }
}

main();

