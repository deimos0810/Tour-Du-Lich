import {
  BadRequestException, Body, Controller, Get, Global, Injectable, Logger, Module, NotFoundException, OnModuleDestroy, OnModuleInit,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { createMailTransporter, getMailUser } from '../common/mailer.js';
import { applyPercent, endOfDay } from '../common/promotion.js';

/* =============================================================================
 * QUẢN LÝ NHẬN TIN (EMAIL / GMAIL)
 *
 * Hai nhóm email:
 *  - GIAO DỊCH (transactional): gửi cho chính người đặt tour, KHÔNG cần đăng ký nhận tin
 *    (xác nhận đặt tour, vé điện tử, hủy tour, nhắc thanh toán, nhắc khởi hành, mời đánh giá, phân công HDV).
 *  - MARKETING: chỉ gửi cho người ĐÃ ĐĂNG KÝ NHẬN TIN và còn trạng thái "đang nhận"
 *    (chào mừng + voucher, khuyến mãi mới, khuyến mãi sắp hết hạn, voucher mới). Mỗi mail có link "Hủy đăng ký".
 *
 * Mọi email đều được ghi vào NhatKyGuiMail (thành công/thất bại + lỗi) -> chống gửi trùng (dedupe) và cho phép tra cứu.
 * Gửi mail KHÔNG BAO GIỜ làm hỏng nghiệp vụ chính (try/catch, chạy nền).
 * ===========================================================================*/

export const MAIL_FLOWS = [
  { ma: 'WELCOME', ten: 'Chào mừng + tặng voucher', suKien: 'Khách đăng ký nhận tin (footer website)', nguoiNhan: 'Người đăng ký', loai: 'Marketing', cachGui: 'Tự động ngay khi đăng ký', chongTrung: 'Mỗi email 1 lần (đăng ký lại sau khi hủy mới gửi lại)' },
  { ma: 'PROMO_NEW', ten: 'Khuyến mãi tour mới', suKien: 'Admin/Điều hành tạo khuyến mãi (tick "gửi thông báo") hoặc bấm "Gửi bản tin"', nguoiNhan: 'Tất cả người đang nhận tin', loai: 'Marketing', cachGui: 'Tự động khi tạo + thủ công', chongTrung: 'Mỗi (khuyến mãi, email) 1 lần' },
  { ma: 'PROMO_ENDING', ten: 'Khuyến mãi sắp hết hạn (≤ 48 giờ)', suKien: 'Hệ thống quét định kỳ 15 phút', nguoiNhan: 'Tất cả người đang nhận tin', loai: 'Marketing', cachGui: 'Tự động (scheduler)', chongTrung: 'Mỗi (khuyến mãi, email) 1 lần' },
  { ma: 'VOUCHER_NEW', ten: 'Phát hành mã giảm giá', suKien: 'Admin bấm "Gửi voucher" ở trang Mã giảm giá', nguoiNhan: 'Tất cả người đang nhận tin', loai: 'Marketing', cachGui: 'Thủ công', chongTrung: 'Mỗi (voucher, email) 1 lần' },
  { ma: 'BOOKING_CREATED', ten: 'Xác nhận đặt tour', suKien: 'Khách đặt tour thành công (trạng thái Chờ thanh toán)', nguoiNhan: 'Khách đặt tour', loai: 'Giao dịch', cachGui: 'Tự động', chongTrung: 'Mỗi đơn 1 lần' },
  { ma: 'TICKET', ten: 'Xác nhận thanh toán + vé điện tử QR', suKien: 'Thanh toán thành công (VNPay / ZaloPay / chuyển khoản / tiền mặt)', nguoiNhan: 'Khách đặt tour', loai: 'Giao dịch', cachGui: 'Tự động', chongTrung: 'Theo từng lần thanh toán đủ' },
  { ma: 'BOOKING_CANCELLED', ten: 'Xác nhận hủy tour + hoàn tiền', suKien: 'Khách hoặc nhân viên hủy đơn', nguoiNhan: 'Khách đặt tour', loai: 'Giao dịch', cachGui: 'Tự động', chongTrung: 'Mỗi đơn 1 lần' },
  { ma: 'REMIND_PAYMENT', ten: 'Nhắc thanh toán giữ chỗ', suKien: 'Đơn Chờ thanh toán quá 2 giờ, tour chưa khởi hành', nguoiNhan: 'Khách đặt tour', loai: 'Giao dịch', cachGui: 'Tự động (scheduler)', chongTrung: 'Mỗi đơn 1 lần' },
  { ma: 'REMIND_DEPARTURE', ten: 'Nhắc lịch khởi hành (D-3, D-1)', suKien: 'Còn ≤ 72 giờ và ≤ 24 giờ trước giờ khởi hành', nguoiNhan: 'Khách đã thanh toán/đặt cọc', loai: 'Giao dịch', cachGui: 'Tự động (scheduler)', chongTrung: 'Mỗi (đơn, mốc) 1 lần' },
  { ma: 'REVIEW_INVITE', ten: 'Mời đánh giá sau tour', suKien: 'Sau khi tour kết thúc ≥ 1 ngày (trong 14 ngày), chưa đánh giá', nguoiNhan: 'Khách đã đi tour', loai: 'Giao dịch', cachGui: 'Tự động (scheduler)', chongTrung: 'Mỗi đơn 1 lần' },
  { ma: 'GUIDE_ASSIGNED', ten: 'Thông báo phân công HDV', suKien: 'Điều hành phân công HDV vào một chuyến', nguoiNhan: 'Hướng dẫn viên được phân công', loai: 'Giao dịch', cachGui: 'Tự động', chongTrung: 'Mỗi phân công 1 lần' },
  { ma: 'OTP', ten: 'Mã OTP khôi phục mật khẩu', suKien: 'Người dùng chọn "Quên mật khẩu"', nguoiNhan: 'Chủ tài khoản', loai: 'Giao dịch', cachGui: 'Tự động', chongTrung: 'Không (mỗi yêu cầu 1 mã)' },
] as const;

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const vnd = (v: unknown) => `${Number(v ?? 0).toLocaleString('vi-VN')} đ`;
const dt = (d: Date | string | null | undefined) => (d ? new Date(d).toLocaleString('vi-VN') : '');
const d0 = (d: Date | string | null | undefined) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SendOpts = {
  loai: string;
  to: string;
  subject: string;
  html: string;
  thamChieu?: string;
  dedupe?: boolean;
  attachments?: Array<{ filename: string; content: Buffer; cid?: string }>;
};

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Notifications');
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.MAIL_SCHEDULER === 'off') return;
    setTimeout(() => void this.runJobs(), 45_000).unref();
    this.timer = setInterval(() => void this.runJobs(), 15 * 60 * 1000);
    this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  /* ---------------------------------------------------------------- URL helpers */
  private web = () =>
    (
      process.env.FRONTEND_URL ||
      process.env.CORS_ORIGIN ||
      (process.env.NODE_ENV === 'production' ? 'https://viettour-frontend.onrender.com' : 'http://localhost:3000')
    ).replace(/\/$/, '');
  private api = () =>
    (
      process.env.API_PUBLIC_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://viettour-backend.onrender.com/api'
        : `http://localhost:${process.env.PORT || 4000}/api`)
    ).replace(/\/$/, '');
  unsubscribeUrl = (token: string) => `${this.api()}/portal/newsletter/unsubscribe?token=${token}`;

  /* ---------------------------------------------------------------- Layout + gửi + nhật ký */
  layout(title: string, body: string, unsubscribeToken?: string) {
    const unsub = unsubscribeToken
      ? `<div style="margin-top:8px;font-size:11.5px"><a href="${this.unsubscribeUrl(unsubscribeToken)}" style="color:#6b7280;text-decoration:underline">Hủy đăng ký nhận bản tin</a></div>`
      : '';
    return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;padding:28px 32px;color:#111111">
      <div style="border-bottom:1px solid #e5e7eb;padding-bottom:14px;margin-bottom:20px">
        <div style="font-size:16px;font-weight:700;letter-spacing:0.5px;color:#111111">VIETTOUR</div>
        <div style="font-size:13.5px;font-weight:600;color:#374151;margin-top:4px">${esc(title)}</div>
      </div>
      <div style="font-size:14px;line-height:1.65;color:#111111">${body}</div>
      <div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:14px;font-size:12px;color:#6b7280;line-height:1.5">
        <div style="font-weight:600;color:#374151">Công ty Cổ phần Du lịch &amp; Lữ hành VietTour</div>
        <div>Quầy giao dịch: Ga Quốc Nội, Sân bay Quốc tế Tân Sơn Nhất, Q. Tân Bình, TP.HCM</div>
        <div>Tổng đài: 1900 1234 • Email: cskh@viettour.vn</div>
        ${unsub}
      </div></div>`;
  }

  private async log(o: SendOpts, trangThai: 'Thanh cong' | 'That bai' | 'Bo qua', loi?: string) {
    try {
      await this.prisma.nhatKyGuiMail.create({
        data: { LoaiMail: o.loai, EmailNhan: o.to.slice(0, 100), TieuDe: o.subject.slice(0, 255), TrangThai: trangThai, ChiTietLoi: loi?.slice(0, 1000) ?? null, ThamChieu: o.thamChieu?.slice(0, 100) ?? null },
      });
    } catch (e) {
      this.logger.warn(`Không ghi được nhật ký mail: ${e instanceof Error ? e.message : e}`);
    }
  }

  /** Gửi 1 email. Trả về true nếu thành công. Không bao giờ ném lỗi. */
  async send(o: SendOpts, transporter = createMailTransporter()): Promise<boolean> {
    try {
      if (!EMAIL_RE.test(o.to)) { await this.log(o, 'Bo qua', 'Email không hợp lệ'); return false; }
      if (o.dedupe && o.thamChieu) {
        const dup = await this.prisma.nhatKyGuiMail.findFirst({ where: { LoaiMail: o.loai, ThamChieu: o.thamChieu, EmailNhan: o.to, TrangThai: 'Thanh cong' }, select: { NhatKyID: true } });
        if (dup) return false;
      }
      await transporter.sendMail({ from: `"VietTour" <${getMailUser()}>`, to: o.to, subject: o.subject, html: o.html, attachments: o.attachments });
      await this.log(o, 'Thanh cong');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Gửi mail ${o.loai} tới ${o.to} thất bại: ${msg}`);
      await this.log(o, 'That bai', msg);
      return false;
    }
  }

  /** Ghi nhận 1 email đã được gửi bởi module khác (vé điện tử, OTP) vào nhật ký. */
  async record(loai: string, to: string, subject: string, ok: boolean, thamChieu?: string, loi?: string) {
    await this.log({ loai, to, subject, html: '', thamChieu }, ok ? 'Thanh cong' : 'That bai', loi);
  }

  /* ---------------------------------------------------------------- 1. ĐĂNG KÝ / HỦY ĐĂNG KÝ NHẬN TIN */
  async subscribe(emailRaw: string, opts: { khachHangId?: number | null; nguon?: string } = {}) {
    const email = String(emailRaw || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 100) throw new BadRequestException('Vui lòng cung cấp địa chỉ email hợp lệ!');

    const now = new Date();
    const welcomeCode = (process.env.WELCOME_VOUCHER || 'VIETTOUR2026').toUpperCase();
    const voucher = await this.prisma.voucher.findUnique({ where: { MaVoucher: welcomeCode } });
    const voucherOk = !!voucher && voucher.TrangThai === 1 && now <= endOfDay(voucher.NgayKetThuc);
    const discountInfo = voucher ? `Giảm ${Number(voucher.PhanTramGiam)}% (tối đa ${vnd(voucher.GiamToiDa)})` : '';

    const existing = await this.prisma.dangKyNhanTin.findUnique({ where: { Email: email } });
    const alreadyActive = !!existing && existing.TrangThai === 1;

    const sub = existing
      ? await this.prisma.dangKyNhanTin.update({ where: { DangKyID: existing.DangKyID }, data: { TrangThai: 1, NgayHuy: null, NgayDangKy: new Date(), KhachHangID: opts.khachHangId ?? existing.KhachHangID } })
      : await this.prisma.dangKyNhanTin.create({ data: { Email: email, KhachHangID: opts.khachHangId ?? null, Token: randomBytes(24).toString('hex'), NguonDangKy: opts.nguon || 'Website' } });

    // Lấy thêm các chương trình khuyến mãi tour đang diễn ra để đính kèm luôn trong email
    const activePromos = await this.prisma.chuongTrinhKhuyenMai.findMany({
      where: { TrangThai: 1, NgayBatDau: { lte: now }, NgayKetThuc: { gte: now } },
      include: { ApDung: { include: { Tour: true } } },
      orderBy: { NgayKetThuc: 'asc' },
      take: 3,
    });

    const voucherBlock = voucherOk
      ? `<div style="background:#ffffff;border:1px solid #d1d5db;border-radius:6px;padding:16px 20px;margin:18px 0;text-align:center">
           <div style="font-size:11.5px;font-weight:600;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px">Mã giảm giá đặt tour trực tuyến</div>
           <div style="font-size:22px;font-weight:700;color:#111111;letter-spacing:2px;margin:6px 0;font-family:monospace">${esc(welcomeCode)}</div>
           <div style="font-weight:600;color:#111111;font-size:13.5px">${esc(discountInfo)} • Đơn tối thiểu ${vnd(voucher!.GiaTriDonToiThieu)}</div>
           <div style="font-size:12px;color:#6b7280;margin-top:4px">Hiệu lực đến hết ngày ${d0(voucher!.NgayKetThuc)}</div>
         </div>`
      : '';

    const activePromosHtml = activePromos.length > 0
      ? `<div style="margin-top:18px">
           <div style="font-size:13px;font-weight:700;color:#111111;margin-bottom:8px">Chương trình khuyến mãi tour đang áp dụng:</div>
           ${activePromos.map((km) => {
             const pct = Number(km.PhanTramGiam);
             const tourList = km.ApDung.map(({ Tour: t }) => `
               <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:13px">
                 <span><b>${esc(t.TenTour)}</b> (${esc(t.ThoiGian)})</span>
                 <span style="white-space:nowrap;margin-left:12px"><s style="color:#9ca3af;font-size:12px">${vnd(t.GiaNguoiLon)}</s> <b style="color:#111111">${vnd(applyPercent(Number(t.GiaNguoiLon), pct))}</b></span>
               </div>`).join('');
             return `<div style="border:1px solid #e5e7eb;border-radius:6px;padding:12px 14px;margin-bottom:10px;background:#ffffff">
               <div style="font-weight:700;color:#111111;font-size:13.5px">Giảm ${pct}% — ${esc(km.TenChuongTrinh)}</div>
               <div style="font-size:12px;color:#6b7280;margin-bottom:6px">Áp dụng đến: ${dt(km.NgayKetThuc)}</div>
               ${tourList}
             </div>`;
           }).join('')}
         </div>`
      : '';

    const html = this.layout(
      alreadyActive ? 'Cập nhật mã giảm giá & chương trình ưu đãi hiện hành' : 'Xác nhận đăng ký nhận bản tin ưu đãi VietTour',
      `<p style="margin-top:0">Xin chào quý khách,</p>
       <p>${alreadyActive
         ? 'Dưới đây là thông tin mã giảm giá và các chương trình ưu đãi tour đang có hiệu lực dành cho quý khách tại <b>VietTour</b>:'
         : 'Cảm ơn quý khách đã đăng ký nhận thông tin từ <b>VietTour</b>. Khi có chương trình khuyến mãi tour mới hoặc mã giảm giá mới, hệ thống sẽ gửi thông báo tới địa chỉ email này.'
       }</p>
       ${voucherBlock}
       ${activePromosHtml}
       <div style="margin-top:20px">
         <a href="${this.web()}/portal" style="background:#111111;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:6px;display:inline-block">Xem danh sách tour trên VietTour</a>
       </div>`,
      sub.Token,
    );

    const sent = await this.send({
      loai: 'WELCOME',
      to: email,
      subject: alreadyActive
        ? '[VietTour] Mã giảm giá & Ưu đãi tour đang diễn ra dành cho bạn'
        : '[VietTour] Chào mừng bạn đăng ký nhận tin — Tặng mã ưu đãi đặt tour',
      html,
      thamChieu: `SUB:${sub.DangKyID}:${Date.now()}`,
      dedupe: false,
    });

    return {
      success: true,
      alreadySubscribed: alreadyActive,
      message: sent
        ? `Đã gửi mã ưu đãi${voucherOk ? ` ${welcomeCode}` : ''} và thông tin khuyến mãi vào hộp thư ${email}! Mỗi khi có khuyến mãi tour mới, hệ thống sẽ tự động báo về email này.`
        : `Đã lưu đăng ký nhận tin cho ${email}!${voucherOk ? ` Mã ưu đãi của bạn là ${welcomeCode}.` : ''}`,
      email,
      voucherCode: voucherOk ? welcomeCode : null,
      discountInfo,
    };
  }

  async unsubscribe(token: string) {
    const sub = token ? await this.prisma.dangKyNhanTin.findUnique({ where: { Token: token } }) : null;
    if (!sub) throw new NotFoundException('Liên kết hủy đăng ký không hợp lệ');
    if (sub.TrangThai === 1) await this.prisma.dangKyNhanTin.update({ where: { DangKyID: sub.DangKyID }, data: { TrangThai: 0, NgayHuy: new Date() } });
    return sub.Email;
  }

  /* ---------------------------------------------------------------- 2. MARKETING (broadcast) */
  private activeSubscribers() { return this.prisma.dangKyNhanTin.findMany({ where: { TrangThai: 1 } }); }

  /** Gửi bản tin khuyến mãi tour cho toàn bộ người đang nhận tin. */
  async broadcastPromotion(ctkmId: number, loai: 'PROMO_NEW' | 'PROMO_ENDING' = 'PROMO_NEW', forceResend = false) {
    const km = await this.prisma.chuongTrinhKhuyenMai.findUnique({ where: { CTKMID: ctkmId }, include: { ApDung: { include: { Tour: true } } } });
    if (!km) throw new NotFoundException('Không tìm thấy khuyến mãi');
    const pct = Number(km.PhanTramGiam);
    const rows = km.ApDung.map(({ Tour: t }) => `<tr>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb">
        <b style="color:#111111;font-size:13.5px">${esc(t.TenTour)}</b><br/>
        <span style="color:#6b7280;font-size:12px">${esc(t.ThoiGian)} • Khởi hành: ${esc(t.DiemKhoiHanh || 'TP.HCM')} → ${esc(t.DiemDen)}</span>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap">
        <s style="color:#9ca3af;font-size:12px">${vnd(t.GiaNguoiLon)}</s><br/>
        <b style="color:#111111;font-size:14.5px">${vnd(applyPercent(Number(t.GiaNguoiLon), pct))}</b>
      </td>
      <td style="padding:10px 0 10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap">
        <a href="${this.web()}/portal/tours/${t.TourID}" style="color:#111111;text-decoration:underline;font-size:12.5px;font-weight:600">Chi tiết</a>
      </td></tr>`).join('');
    const ending = loai === 'PROMO_ENDING';
    const title = ending ? 'Thông báo chương trình ưu đãi tour sắp kết thúc' : 'Thông báo chương trình ưu đãi giá tour mới';
    const subs = await this.activeSubscribers();
    const transporter = createMailTransporter();
    let ok = 0, fail = 0, skip = 0;
    for (const s of subs) {
      const html = this.layout(title, `
        <div style="border:1px solid #d1d5db;border-radius:6px;padding:16px 18px;margin-bottom:16px;background:#ffffff">
          <div style="font-size:16px;font-weight:700;color:#111111;margin-bottom:4px">${esc(km.TenChuongTrinh)} — Giảm ${pct}%</div>
          <div style="font-size:13px;color:#374151">Thời gian áp dụng: <b>${dt(km.NgayBatDau)}</b> đến <b>${dt(km.NgayKetThuc)}</b></div>
          ${ending ? '<div style="color:#111111;font-size:12.5px;font-weight:600;margin-top:6px">Lưu ý: Chương trình ưu đãi sẽ kết thúc trong vòng 48 giờ tới.</div>' : ''}
        </div>
        ${km.MoTa ? `<p style="color:#374151;margin:0 0 12px">${esc(km.MoTa)}</p>` : ''}
        <div style="font-size:13px;font-weight:700;color:#111111;margin-bottom:6px">Danh sách tour áp dụng:</div>
        <table style="width:100%;border-collapse:collapse">${rows}</table>
        <div style="margin-top:20px">
          <a href="${this.web()}/portal?category=KHUYEN_MAI#tour-list-section" style="background:#111111;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:6px;display:inline-block">Xem các tour ưu đãi</a>
        </div>`, s.Token);
      const ref = forceResend ? `CTKM:${km.CTKMID}:${Date.now()}` : `CTKM:${km.CTKMID}`;
      const r = await this.send({ loai, to: s.Email, subject: `${ending ? '[Sắp kết thúc] ' : '[VietTour] '}${km.TenChuongTrinh} — Giảm ${pct}% giá tour`, html, thamChieu: ref, dedupe: !forceResend }, transporter);
      if (r) ok++; else { const dup = await this.prisma.nhatKyGuiMail.findFirst({ where: { LoaiMail: loai, ThamChieu: `CTKM:${km.CTKMID}`, EmailNhan: s.Email, TrangThai: 'Thanh cong' } }); if (dup) skip++; else fail++; }
    }
    return { tongNguoiNhan: subs.length, thanhCong: ok, thatBai: fail, daGuiTruocDo: skip };
  }

  async broadcastVoucher(voucherId: number, forceResend = false) {
    const v = await this.prisma.voucher.findUnique({ where: { VoucherID: voucherId } });
    if (!v) throw new NotFoundException('Không tìm thấy mã giảm giá');
    if (v.TrangThai !== 1 || new Date() > endOfDay(v.NgayKetThuc)) throw new BadRequestException('Mã giảm giá đã tạm dừng hoặc hết hạn, không thể gửi');
    const subs = await this.activeSubscribers();
    const transporter = createMailTransporter();
    let ok = 0, fail = 0, skip = 0;
    for (const s of subs) {
      const html = this.layout('Thông báo phát hành mã giảm giá đặt tour', `
        <p style="margin-top:0">Xin chào quý khách,</p>
        <p><b>VietTour</b> gửi đến quý khách mã giảm giá thuộc chương trình <b>${esc(v.TenChuongTrinh)}</b>:</p>
        <div style="background:#ffffff;border:1px solid #d1d5db;border-radius:6px;padding:16px 20px;margin:18px 0;text-align:center">
          <div style="font-size:11.5px;font-weight:600;color:#4b5563;text-transform:uppercase">Mã giảm giá</div>
          <div style="font-size:22px;font-weight:700;color:#111111;letter-spacing:2px;margin:6px 0;font-family:monospace">${esc(v.MaVoucher)}</div>
          <div style="font-weight:600;color:#111111;margin-top:4px;font-size:13.5px">Giảm ${Number(v.PhanTramGiam)}% (Tối đa ${vnd(v.GiamToiDa)})</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px">Đơn tối thiểu ${vnd(v.GiaTriDonToiThieu)} • Hạn dùng đến hết ${d0(v.NgayKetThuc)}</div>
        </div>
        <div style="margin-top:20px">
          <a href="${this.web()}/portal" style="background:#111111;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:6px;display:inline-block">Đặt tour tại VietTour</a>
        </div>`, s.Token);
      const ref = forceResend ? `VOUCHER:${v.VoucherID}:${Date.now()}` : `VOUCHER:${v.VoucherID}`;
      const r = await this.send({ loai: 'VOUCHER_NEW', to: s.Email, subject: `[VietTour] Mã giảm giá ${v.MaVoucher} — Giảm ${Number(v.PhanTramGiam)}%`, html, thamChieu: ref, dedupe: !forceResend }, transporter);
      if (r) ok++; else { const dup = await this.prisma.nhatKyGuiMail.findFirst({ where: { LoaiMail: 'VOUCHER_NEW', ThamChieu: `VOUCHER:${v.VoucherID}`, EmailNhan: s.Email, TrangThai: 'Thanh cong' } }); if (dup) skip++; else fail++; }
    }
    return { tongNguoiNhan: subs.length, thanhCong: ok, thatBai: fail, daGuiTruocDo: skip };
  }

  /* ---------------------------------------------------------------- 3. GIAO DỊCH */
  private async loadOrder(maDon: string) {
    return this.prisma.donDatTour.findUnique({
      where: { MaDon: maDon },
      include: { KhachHang: true, Voucher: true, ChuongTrinhKM: true, LichKhoiHanh: { include: { Tour: true } } },
    });
  }

  private orderSummary(don: NonNullable<Awaited<ReturnType<NotificationsService['loadOrder']>>>) {
    const tour = don.LichKhoiHanh.Tour;
    const phaiTra = Number(don.TongTien) - Number(don.GiamGia);
    const gKM = Number(don.GiamGiaKhuyenMai);
    const gVC = Number(don.GiamGia) - gKM;
    return `<table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:4px 0">Mã đơn</td><td style="text-align:right"><b>${esc(don.MaDon)}</b></td></tr>
      <tr><td style="padding:4px 0">Tour</td><td style="text-align:right"><b>${esc(tour.TenTour)}</b></td></tr>
      <tr><td style="padding:4px 0">Khởi hành</td><td style="text-align:right">${dt(don.LichKhoiHanh.NgayKhoiHanh)}</td></tr>
      <tr><td style="padding:4px 0">Điểm tập trung</td><td style="text-align:right">${esc(tour.DiemKhoiHanh)}</td></tr>
      <tr><td style="padding:4px 0">Số khách</td><td style="text-align:right">${don.SoLuongNguoiLon} người lớn, ${don.SoLuongTreEm} trẻ em</td></tr>
      <tr><td style="padding:4px 0">Tạm tính</td><td style="text-align:right">${vnd(don.TongTien)}</td></tr>
      ${gKM > 0 ? `<tr><td style="padding:4px 0;color:#374151">Khuyến mãi${don.ChuongTrinhKM ? ` (${esc(don.ChuongTrinhKM.TenChuongTrinh)})` : ''}</td><td style="text-align:right;color:#111111">-${vnd(gKM)}</td></tr>` : ''}
      ${gVC > 0 ? `<tr><td style="padding:4px 0;color:#374151">Mã giảm giá${don.Voucher ? ` (${esc(don.Voucher.MaVoucher)})` : ''}</td><td style="text-align:right;color:#111111">-${vnd(gVC)}</td></tr>` : ''}
      <tr><td style="padding:8px 0;border-top:1px solid #e5e7eb"><b>Tổng thanh toán</b></td><td style="text-align:right;border-top:1px solid #e5e7eb"><b style="font-size:15px;color:#111111">${vnd(phaiTra)}</b></td></tr></table>`;
  }

  /** Luồng 6: đặt tour thành công -> email xác nhận đơn + hướng dẫn thanh toán. */
  async sendBookingCreated(maDon: string) {
    try {
      const don = await this.loadOrder(maDon);
      if (!don?.KhachHang.Email) return;
      const html = this.layout('Xác nhận giữ chỗ đặt tour', `<p style="margin-top:0">Xin chào <b>${esc(don.KhachHang.HoTen)}</b>,</p>
        <p>VietTour đã tiếp nhận yêu cầu đặt tour của quý khách. Quý khách vui lòng hoàn tất thanh toán để hệ thống phát hành Vé điện tử (E-Ticket) và Mã QR soát vé.</p>
        ${this.orderSummary(don)}
        <div style="margin-top:20px"><a href="${this.web()}/portal/my-bookings" style="background:#111111;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:6px;display:inline-block">Quản lý đơn &amp; Thanh toán</a></div>`);
      await this.send({ loai: 'BOOKING_CREATED', to: don.KhachHang.Email, subject: `[VietTour] Xác nhận giữ chỗ ${don.MaDon} — ${don.LichKhoiHanh.Tour.TenTour}`, html, thamChieu: don.MaDon, dedupe: true });
    } catch (e) { this.logger.warn(`sendBookingCreated(${maDon}): ${e instanceof Error ? e.message : e}`); }
  }

  /** Luồng 8: hủy đơn -> email xác nhận hủy + số tiền hoàn. */
  async sendBookingCancelled(maDon: string, info: { hoanTien?: number; lyDo?: string } = {}) {
    try {
      const don = await this.loadOrder(maDon);
      if (!don?.KhachHang.Email) return;
      const html = this.layout('Xác nhận hủy đơn đặt tour', `<p style="margin-top:0">Xin chào <b>${esc(don.KhachHang.HoTen)}</b>,</p>
        <p>Đơn đặt tour <b>${esc(don.MaDon)}</b> đã được hủy${info.lyDo ? ` (Lý do: ${esc(info.lyDo)})` : ''}.</p>
        ${info.hoanTien ? `<p>Số tiền hoàn lại dự kiến: <b>${vnd(info.hoanTien)}</b> (hoàn về tài khoản trong 3–7 ngày làm việc theo chính sách hoàn hủy).</p>` : '<p>Đơn này chưa phát sinh khoản thanh toán cần hoàn trả.</p>'}
        ${this.orderSummary(don)}`);
      await this.send({ loai: 'BOOKING_CANCELLED', to: don.KhachHang.Email, subject: `[VietTour] Xác nhận hủy đơn ${don.MaDon}`, html, thamChieu: don.MaDon, dedupe: true });
    } catch (e) { this.logger.warn(`sendBookingCancelled(${maDon}): ${e instanceof Error ? e.message : e}`); }
  }

  /** Luồng 13: phân công HDV -> email cho HDV. */
  async sendGuideAssigned(dieuPhoiId: number) {
    try {
      const dp = await this.prisma.dieuPhoiTour.findUnique({
        where: { DieuPhoiID: dieuPhoiId },
        include: { HuongDanVien: { include: { NhanVien: true } }, LichKhoiHanh: { include: { Tour: true } } },
      });
      const to = dp?.HuongDanVien.NhanVien.Email;
      if (!dp || !to) return;
      const l = dp.LichKhoiHanh;
      const html = this.layout('Thông báo phân công dẫn tour', `<p style="margin-top:0">Xin chào <b>${esc(dp.HuongDanVien.NhanVien.HoTen)}</b>,</p>
        <p>Bạn vừa được phân công phụ trách dẫn đoàn:</p>
        <table style="width:100%;font-size:14px"><tr><td>Tour</td><td style="text-align:right"><b>${esc(l.Tour.TenTour)}</b></td></tr>
        <tr><td>Mã lịch</td><td style="text-align:right">${esc(l.MaLich)}</td></tr>
        <tr><td>Thời gian</td><td style="text-align:right">${dt(l.NgayKhoiHanh)} → ${dt(l.NgayKetThuc)}</td></tr>
        <tr><td>Điểm tập trung</td><td style="text-align:right">${esc(l.Tour.DiemKhoiHanh)}</td></tr></table>
        <p>Vui lòng đăng nhập hệ thống để xác nhận hoặc phản hồi lịch phân công.</p>
        <div style="margin-top:18px"><a href="${this.web()}/my-schedule" style="background:#111111;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:6px;display:inline-block">Mở lịch dẫn tour</a></div>`);
      await this.send({ loai: 'GUIDE_ASSIGNED', to, subject: `[VietTour] Phân công dẫn tour ${l.MaLich} — ${l.Tour.TenTour}`, html, thamChieu: `DP:${dp.DieuPhoiID}`, dedupe: true });
    } catch (e) { this.logger.warn(`sendGuideAssigned(${dieuPhoiId}): ${e instanceof Error ? e.message : e}`); }
  }

  /* ---------------------------------------------------------------- 4. SCHEDULER (nhắc lịch / thanh toán / đánh giá / KM sắp hết hạn) */
  async runJobs() {
    if (this.running) return { skipped: true };
    this.running = true;
    const result = { nhacThanhToan: 0, nhacKhoiHanh: 0, moiDanhGia: 0, kmSapHetHan: 0 };
    try {
      const now = new Date();
      const transporter = createMailTransporter();
      const H = 3600 * 1000;
      const include = { KhachHang: true, LichKhoiHanh: { include: { Tour: true } } } as const;

      // 4.1 Nhắc thanh toán: đơn chờ thanh toán > 2 giờ, tour chưa khởi hành
      const unpaid = await this.prisma.donDatTour.findMany({
        where: { TrangThaiDon: 'Cho thanh toan', NgayDat: { lte: new Date(now.getTime() - 2 * H) }, LichKhoiHanh: { NgayKhoiHanh: { gt: now } } }, include, take: 200,
      });
      for (const d of unpaid) {
        const html = this.layout('Nhắc hoàn tất thanh toán giữ chỗ', `<p style="margin-top:0">Xin chào <b>${esc(d.KhachHang.HoTen)}</b>,</p><p>Đơn đặt tour <b>${esc(d.MaDon)}</b> (${esc(d.LichKhoiHanh.Tour.TenTour)}) hiện đang ở trạng thái chờ thanh toán. Quý khách vui lòng hoàn tất thanh toán để hệ thống xuất vé điện tử.</p>
          <div style="margin-top:18px"><a href="${this.web()}/portal/my-bookings" style="background:#111111;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:6px;display:inline-block">Xem đơn &amp; Thanh toán</a></div>`);
        if (await this.send({ loai: 'REMIND_PAYMENT', to: d.KhachHang.Email, subject: `[VietTour] Nhắc thanh toán đơn ${d.MaDon}`, html, thamChieu: d.MaDon, dedupe: true }, transporter)) result.nhacThanhToan++;
      }

      // 4.2 Nhắc khởi hành: mốc D-3 (≤72h) và D-1 (≤24h)
      const upcoming = await this.prisma.donDatTour.findMany({
        where: { TrangThaiDon: { in: ['Da dat coc', 'Da thanh toan', 'Da xac nhan'] }, LichKhoiHanh: { NgayKhoiHanh: { gt: now, lte: new Date(now.getTime() + 72 * H) } } }, include, take: 500,
      });
      for (const d of upcoming) {
        const hours = (d.LichKhoiHanh.NgayKhoiHanh.getTime() - now.getTime()) / H;
        const moc = hours <= 24 ? 'D1' : 'D3';
        const html = this.layout(moc === 'D1' ? 'Thông báo khởi hành vào ngày mai' : 'Nhắc lịch khởi hành sau 3 ngày', `<p style="margin-top:0">Xin chào <b>${esc(d.KhachHang.HoTen)}</b>,</p>
          <p>Hành trình <b>${esc(d.LichKhoiHanh.Tour.TenTour)}</b> sẽ khởi hành lúc <b>${dt(d.LichKhoiHanh.NgayKhoiHanh)}</b> tại điểm tập trung: <b>${esc(d.LichKhoiHanh.Tour.DiemKhoiHanh)}</b>.</p>
          <p>Quý khách vui lòng mang theo CCCD/Hộ chiếu bản gốc và chuẩn bị sẵn mã QR vé điện tử để Hướng dẫn viên làm thủ tục đón đoàn.</p>
          <div style="margin-top:18px"><a href="${this.web()}/portal/ticket/${encodeURIComponent(d.MaDon)}" style="background:#111111;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:6px;display:inline-block">Mở vé điện tử</a></div>`);
        if (await this.send({ loai: 'REMIND_DEPARTURE', to: d.KhachHang.Email, subject: `[VietTour] ${moc === 'D1' ? 'Ngày mai' : 'Còn 3 ngày'} khởi hành — ${d.LichKhoiHanh.Tour.TenTour}`, html, thamChieu: `${d.MaDon}:${moc}`, dedupe: true }, transporter)) result.nhacKhoiHanh++;
      }

      // 4.3 Mời đánh giá: tour kết thúc ≥ 1 ngày (trong 14 ngày), chưa đánh giá
      const done = await this.prisma.donDatTour.findMany({
        where: { TrangThaiDon: { in: ['Da thanh toan', 'Da xac nhan', 'Dang thuc hien', 'Hoan thanh'] }, DanhGia: { none: {} }, LichKhoiHanh: { NgayKetThuc: { lte: new Date(now.getTime() - 24 * H), gte: new Date(now.getTime() - 14 * 24 * H) } } }, include, take: 300,
      });
      for (const d of done) {
        const html = this.layout('Gửi đánh giá chất lượng hành trình', `<p style="margin-top:0">Xin chào <b>${esc(d.KhachHang.HoTen)}</b>,</p><p>Cảm ơn quý khách đã đồng hành cùng VietTour trong chuyến đi <b>${esc(d.LichKhoiHanh.Tour.TenTour)}</b>. Mời quý khách chia sẻ đánh giá để VietTour nâng cao chất lượng dịch vụ.</p>
          <div style="margin-top:18px"><a href="${this.web()}/portal/my-bookings" style="background:#111111;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:6px;display:inline-block">Gửi đánh giá chuyến đi</a></div>`);
        if (await this.send({ loai: 'REVIEW_INVITE', to: d.KhachHang.Email, subject: `[VietTour] Đánh giá chuyến đi ${d.LichKhoiHanh.Tour.TenTour}`, html, thamChieu: d.MaDon, dedupe: true }, transporter)) result.moiDanhGia++;
      }

      // 4.4 Khuyến mãi sắp hết hạn (≤ 48h)
      const ending = await this.prisma.chuongTrinhKhuyenMai.findMany({ where: { TrangThai: 1, NgayBatDau: { lte: now }, NgayKetThuc: { gt: now, lte: new Date(now.getTime() + 48 * H) } } });
      for (const km of ending) { const r = await this.broadcastPromotion(km.CTKMID, 'PROMO_ENDING'); result.kmSapHetHan += r.thanhCong; }
    } catch (e) {
      this.logger.error(`Scheduler lỗi: ${e instanceof Error ? e.message : e}`);
    } finally {
      this.running = false;
    }
    if (Object.values(result).some(Boolean)) this.logger.log(`Scheduler: ${JSON.stringify(result)}`);
    return result;
  }

  /* ---------------------------------------------------------------- 5. QUẢN TRỊ */
  async overview() {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const [dangNhan, daHuy, byStatus, byType] = await Promise.all([
      this.prisma.dangKyNhanTin.count({ where: { TrangThai: 1 } }),
      this.prisma.dangKyNhanTin.count({ where: { TrangThai: 0 } }),
      this.prisma.nhatKyGuiMail.groupBy({ by: ['TrangThai'], where: { NgayGui: { gte: since } }, _count: { _all: true } }),
      this.prisma.nhatKyGuiMail.groupBy({ by: ['LoaiMail'], where: { NgayGui: { gte: since } }, _count: { _all: true } }),
    ]);
    const count = (s: string) => byStatus.find((x) => x.TrangThai === s)?._count._all ?? 0;
    const typeMap = new Map(byType.map((x) => [x.LoaiMail, x._count._all]));
    return {
      subscribers: { dangNhan, daHuy },
      mail30Ngay: { thanhCong: count('Thanh cong'), thatBai: count('That bai'), boQua: count('Bo qua') },
      flows: MAIL_FLOWS.map((f) => ({ ...f, daGui30Ngay: typeMap.get(f.ma) ?? 0 })),
    };
  }

  subscribers(q: { search?: string; trangThai?: string }) {
    return this.prisma.dangKyNhanTin.findMany({
      where: { ...(q.search && { Email: { contains: q.search, mode: 'insensitive' } }), ...(q.trangThai !== undefined && q.trangThai !== '' && { TrangThai: Number(q.trangThai) }) },
      orderBy: { DangKyID: 'desc' }, take: 500,
      select: { DangKyID: true, Email: true, KhachHangID: true, TrangThai: true, NguonDangKy: true, NgayDangKy: true, NgayHuy: true },
    });
  }

  async toggleSubscriber(id: number) {
    const s = await this.prisma.dangKyNhanTin.findUnique({ where: { DangKyID: id } });
    if (!s) throw new NotFoundException('Không tìm thấy người đăng ký');
    return this.prisma.dangKyNhanTin.update({ where: { DangKyID: id }, data: s.TrangThai === 1 ? { TrangThai: 0, NgayHuy: new Date() } : { TrangThai: 1, NgayHuy: null } });
  }

  logs(q: { loai?: string; trangThai?: string; search?: string; limit?: string }) {
    return this.prisma.nhatKyGuiMail.findMany({
      where: { ...(q.loai && { LoaiMail: q.loai }), ...(q.trangThai && { TrangThai: q.trangThai }), ...(q.search && { EmailNhan: { contains: q.search, mode: 'insensitive' } }) },
      orderBy: { NhatKyID: 'desc' }, take: Math.min(Number(q.limit) || 200, 1000),
    });
  }
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Dieu hanh')
export class NotificationsController {
  constructor(private s: NotificationsService) {}
  @Get('overview') overview() { return this.s.overview(); }
  @Get('subscribers') subscribers(@Query() q: Record<string, string>) { return this.s.subscribers(q); }
  @Patch('subscribers/:id/toggle') toggle(@Param('id', ParseIntPipe) id: number) { return this.s.toggleSubscriber(id); }
  @Get('logs') logs(@Query() q: Record<string, string>) { return this.s.logs(q); }
  @Post('broadcast/promotion/:id') promo(@Param('id', ParseIntPipe) id: number) { return this.s.broadcastPromotion(id); }
  @Post('broadcast/voucher/:id') voucher(@Param('id', ParseIntPipe) id: number) { return this.s.broadcastVoucher(id); }
  @Post('run-jobs') run() { return this.s.runJobs(); }
  /** Thêm thủ công một email vào danh sách nhận tin (nhân viên nhập theo yêu cầu khách). */
  @Post('subscribers') add(@Body() b: { email: string }) { return this.s.subscribe(b.email, { nguon: 'Nhan vien nhap' }); }
}

@Global()
@Module({ controllers: [NotificationsController], providers: [NotificationsService], exports: [NotificationsService] })
export class NotificationsModule {}

