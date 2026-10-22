import { BadRequestException, Body, Controller, Get, Injectable, Module, Post, Query } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.module.js';
import { ExportModule, TicketMailService } from './export.module.js';

@Injectable()
export class ZaloPayService {
  constructor(private prisma: PrismaService, private mail: TicketMailService) {}

  /**
   * Tạo phiên thanh toán ZaloPay Gateway.
   * Tạo URL dẫn tới trang Cổng ZaloPay Sandbox VietTour (hoặc Cổng thanh toán ZaloPay trực tuyến)
   */
  async createPayment(dto: { donHangId: number; amount: number; orderInfo?: string }) {
    const don = await this.prisma.donDatTour.findUnique({
      where: { DonHangID: dto.donHangId },
      include: { LichKhoiHanh: { include: { Tour: true } }, KhachHang: true },
    });

    if (!don) throw new BadRequestException('Không tìm thấy đơn hàng');
    if (don.TrangThaiDon === 'Da huy') throw new BadRequestException('Đơn hàng đã bị hủy');

    const appId = process.env.ZALOPAY_APP_ID || '2553';
    const key1 = process.env.ZALOPAY_KEY1 || 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL';
    const appTransId = `${new Date().toISOString().slice(2, 10).replace(/-/g, '')}_${don.MaDon}_${Date.now().toString().slice(-4)}`;
    const appTime = Date.now();
    const amount = Math.round(dto.amount);

    // Tính mã MAC HMAC-SHA256 theo chuẩn ZaloPay
    const data = `${appId}|${appTransId}|user_${don.KhachHangID}|${amount}|${appTime}|{}|`;
    const mac = crypto.createHmac('sha256', key1).update(data).digest('hex');

    // Chuyển hướng tới trang thanh toán ZaloPay Gateway của hệ thống
    const gatewayUrl = `http://localhost:3000/portal/sandbox-pay/${don.MaDon}?method=ZaloPay&appTransId=${appTransId}&amount=${amount}&mac=${mac}`;

    return {
      return_code: 1,
      return_message: 'Giao dịch khởi tạo thành công',
      order_url: gatewayUrl,
      paymentUrl: gatewayUrl,
      app_trans_id: appTransId,
      amount,
      maDon: don.MaDon,
    };
  }

  /**
   * Callback xác nhận thanh toán thành công từ ZaloPay
   */
  async confirmPayment(body: { maDon: string; appTransId?: string; amount?: number }) {
    const don = await this.prisma.donDatTour.findUnique({
      where: { MaDon: body.maDon },
    });
    if (!don) throw new BadRequestException('Không tìm thấy đơn hàng');

    const phaiThu = Number(don.TongTien) - Number(don.GiamGia);
    const transId = body.appTransId || `ZP-${Date.now().toString().slice(-8)}`;

    const result = await this.prisma.$transaction(async (tx) => {
      // Khóa dòng đơn để callback gọi lặp không ghi nhận thanh toán trùng
      await tx.$queryRaw`SELECT donhangid FROM dondattour WHERE donhangid = ${don.DonHangID} FOR UPDATE`;
      const current = await tx.donDatTour.findUniqueOrThrow({ where: { DonHangID: don.DonHangID } });
      if (current.TrangThaiDon === 'Da thanh toan') return { updated: current, alreadyPaid: true };
      if (current.TrangThaiDon === 'Da huy') throw new BadRequestException('Đơn hàng đã bị hủy');

      // Ghi nhận thanh toán
      await tx.thanhToan.create({
        data: {
          DonHangID: don.DonHangID,
          SoTien: phaiThu,
          HinhThucTT: 'ZaloPay',
          MaGiaoDich: transId,
          TrangThai: 'Thanh cong',
          GhiChu: `Thanh toán qua Ví điện tử ZaloPay (Mã GD: ${transId})`,
        },
      });

      // Cập nhật trạng thái đơn
      const updated = await tx.donDatTour.update({
        where: { DonHangID: don.DonHangID },
        data: {
          TienCoc: phaiThu,
          TienConLai: 0,
          TrangThaiDon: 'Da thanh toan',
          PhuongThucTT: 'ZaloPay',
        },
      });

      return { updated, alreadyPaid: false };
    });

    // Gửi email xác nhận kèm vé điện tử QR (không chặn phản hồi)
    if (!result.alreadyPaid) void this.mail.sendTicketEmail(don.MaDon);

    return {
      return_code: 1,
      return_message: 'Xác nhận thanh toán ZaloPay thành công!',
      don: result.updated,
    };
  }
}

@Controller('zalopay')
export class ZaloPayController {
  constructor(private service: ZaloPayService) {}

  @Post('create-payment')
  createPayment(@Body() body: { donHangId: number; amount: number; orderInfo?: string }) {
    return this.service.createPayment(body);
  }

  @Post('confirm')
  confirm(@Body() body: { maDon: string; appTransId?: string; amount?: number }) {
    return this.service.confirmPayment(body);
  }
}

@Module({
  imports: [ExportModule],
  controllers: [ZaloPayController],
  providers: [ZaloPayService],
  exports: [ZaloPayService],
})
export class ZaloPayModule {}
