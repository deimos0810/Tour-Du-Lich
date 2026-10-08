import { Controller, Post, Body, BadRequestException, Injectable, Module } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.module.js';

@Injectable()
export class PortalService {
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT || 587),
      secure: false,
      auth: {
        user: (process.env.MAIL_USER || '').trim(),
        pass: (process.env.MAIL_PASS || '').trim(),
      },
    });
  }

  async subscribeNewsletter(email: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Vui lòng cung cấp địa chỉ email hợp lệ!');
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Nội dung Email HTML trang trọng và thẩm mỹ cao từ VietTour
    const mailOptions = {
      from: `"VietTour Lữ Hành & Hàng Không" <${process.env.MAIL_USER || 'no-reply@viettour.vn'}>`,
      to: trimmedEmail,
      subject: '✈️ Chào mừng bạn đến với VietTour - Tặng bạn Mã Ưu Đãi Tour 2026',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; color: #1e293b;">
          <div style="background: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff;">
            <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; background: #0284c7; font-weight: 900; font-size: 20px; color: #fff; margin-bottom: 8px;">VT</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">VIETTOUR LỮ HÀNH VIỆT NAM</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">Hệ thống đặt vé tour & hàng không cao cấp</p>
          </div>

          <div style="padding: 32px 24px; background: #ffffff;">
            <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">Xin chào Quý khách,</p>
            <p style="font-size: 14.5px; line-height: 1.6; color: #334155;">
              Cảm ơn bạn đã đăng ký nhận thông tin hành trình & ưu đãi mới nhất tại <strong>VietTour</strong>. Chúng tôi rất vinh hạnh được đồng hành cùng bạn trên mọi nẻo đường khám phá di sản và các kỳ nghỉ tuyệt vời.
            </p>

            <div style="background: #f8fafc; border: 2px dashed #0284c7; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
              <span style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">MÃ GIẢM GIÁ ĐỘC QUYỀN CỦA BẠN</span>
              <div style="font-size: 26px; font-weight: 900; color: #0284c7; letter-spacing: 2px; margin: 10px 0;">VIETTOUR2026</div>
              <p style="margin: 0; font-size: 13.5px; color: #0f172a; font-weight: 600;">Giảm ngay 10% (Tối đa 1.000.000 VNĐ) cho mọi chuyến đi</p>
              <div style="font-size: 11.5px; color: #64748b; margin-top: 6px;">Hạn sử dụng: Đến hết ngày 31/12/2026</div>
            </div>

            <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">🌟 Các đặc quyền khi đồng hành cùng VietTour:</h3>
            <ul style="padding-left: 20px; font-size: 13.5px; color: #475569; line-height: 1.8;">
              <li>Bao trọn gói vé máy bay khứ hồi & khách sạn 4 - 5 sao tiêu chuẩn.</li>
              <li>Bảo hiểm du lịch trách nhiệm cao tới 100.000.000 VNĐ/khách.</li>
              <li>Điểm danh và xuất thẻ lên tàu (Boarding Pass E-Ticket) tức thì qua mã QR.</li>
              <li>Hỗ trợ tư vấn hành trình 24/7 qua hotline 1900 1234.</li>
            </ul>

            <div style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:3000/portal" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
                Khám Phá Các Chuyến Đi Mới Nhất
              </a>
            </div>
          </div>

          <div style="background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 6px;">CÔNG TY CỔ PHẦN DU LỊCH & LỮ HÀNH VIETTOUR</p>
            <p style="margin: 0;">Hotline: 1900 1234 — Email: cskh@viettour.vn</p>
            <p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8;">Email này được gửi tự động khi bạn đăng ký nhận bản tin trên hệ thống VietTour.</p>
          </div>
        </div>
      `,
    };

    let emailSent = false;
    try {
      if (process.env.MAIL_USER && process.env.MAIL_PASS) {
        await this.transporter.sendMail(mailOptions);
        emailSent = true;
      }
    } catch (err: any) {
      console.warn('Gửi newsletter email cảnh báo (không chặn luồng người dùng):', err?.message || err);
    }

    return {
      success: true,
      message: emailSent
        ? `Đã gửi mã ưu đãi đến hòm thư ${trimmedEmail}! Vui lòng kiểm tra hộp thư của bạn.`
        : `Đăng ký thành công cho ${trimmedEmail}! Mã ưu đãi của bạn là VIETTOUR2026.`,
      email: trimmedEmail,
      voucherCode: 'VIETTOUR2026',
      discountInfo: 'Giảm 10% (Tối đa 1.000.000 VNĐ)',
    };
  }
}

@Controller('portal')
export class PortalController {
  constructor(private service: PortalService) {}

  @Post('newsletter')
  subscribe(@Body() body: { email: string }) {
    return this.service.subscribeNewsletter(body.email);
  }
}

@Module({
  controllers: [PortalController],
  providers: [PortalService],
  exports: [PortalService],
})
export class PortalModule {}
