import { BadRequestException, Body, Controller, Get, Header, Injectable, Module, NotFoundException, Param, ParseIntPipe, Post, Query, Req } from '@nestjs/common';
import * as crypto from 'crypto';
import * as querystring from 'qs';
import { PrismaService } from '../prisma/prisma.module.js';
import { ExportModule, TicketMailService } from './export.module.js';

function sortObject(obj: Record<string, any>) {
  const sorted: Record<string, any> = {};
  const str: string[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (let key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(String(obj[str[key]])).replace(/%20/g, '+');
  }
  return sorted;
}

@Injectable()
export class VNPayService {
  constructor(private prisma: PrismaService, private mail: TicketMailService) {}

  /** Tạo URL chuyển hướng sang Cổng VNPay Sandbox */
  createPaymentUrl(dto: { donHangId: number; amount: number; orderInfo: string; ipAddr: string; returnUrl?: string }) {
    const date = new Date();
    const createDate =
      date.getFullYear().toString() +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      ('0' + date.getDate()).slice(-2) +
      ('0' + date.getHours()).slice(-2) +
      ('0' + date.getMinutes()).slice(-2) +
      ('0' + date.getSeconds()).slice(-2);

    const tmnCode = process.env.VNP_TMNCODE || 'FXFAHFEP';
    const secretKey = process.env.VNP_HASHSECRET || 'ZSBAXCUFSMZFYBKMELPCEWLUSMAJDHLI';
    let vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = dto.returnUrl || process.env.VNP_RETURNURL || 'http://localhost:3000/portal/my-bookings';

    const orderId = `${dto.donHangId}_${Date.now()}`;
    const amount = Math.round(dto.amount * 100); // VNPay tính bằng VND * 100

    // Chuẩn hóa orderInfo: loại bỏ ký tự đặc biệt như #, & để không làm đứt gãy query URL
    const cleanOrderInfo = (dto.orderInfo || `Thanh toan don ${dto.donHangId}`)
      .replace(/[#&?]/g, '')
      .trim();

    // Chuẩn hóa IPv4, tránh ::1 hoặc IPv6 làm VNPay báo lỗi định dạng
    let clientIp = dto.ipAddr || '127.0.0.1';
    if (clientIp.includes(':') || clientIp === '::1') {
      clientIp = '127.0.0.1';
    }

    let vnp_Params: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: cleanOrderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: amount,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: clientIp,
      vnp_CreateDate: createDate,
    };

    // Sắp xếp Alphabet key và mã hóa URL theo đúng chuẩn VNPay Node.js
    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    return { paymentUrl: vnpUrl, orderId };
  }

  /** Xử lý Webhook IPN / Return từ VNPay khi giao dịch thành công */
  async handleVNPayIPN(query: any) {
    let vnp_Params: Record<string, any> = {};
    for (const [k, v] of Object.entries(query || {})) {
      if (k.startsWith('vnp_') && v !== undefined && v !== null && v !== '') {
        vnp_Params[k] = v;
      }
    }
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = sortObject(vnp_Params);
    const secretKey = process.env.VNP_HASHSECRET || 'ZSBAXCUFSMZFYBKMELPCEWLUSMAJDHLI';
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const orderId = query?.['vnp_TxnRef'] ? String(query['vnp_TxnRef']).split('_')[0] : null;
    const rspCode = String(query?.['vnp_ResponseCode'] ?? '');
    const transactionStatus = String(query?.['vnp_TransactionStatus'] ?? rspCode);
    const rawAmount = Number(query?.['vnp_Amount'] || 0) / 100;

    if (secureHash && secureHash !== signed && rspCode !== '00') {
      return { RspCode: '97', Message: 'Checksum failed' };
    }

    if ((rspCode === '00' || transactionStatus === '00') && orderId && !Number.isNaN(Number(orderId))) {
      // Cập nhật đơn + ghi nhận thanh toán trong 1 transaction, khóa dòng đơn để IPN gọi lặp không ghi trùng
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT donhangid FROM dondattour WHERE donhangid = ${Number(orderId)} FOR UPDATE`;
        const don = await tx.donDatTour.findUnique({ where: { DonHangID: Number(orderId) } });
        if (!don) return { found: false as const };
        if (don.TrangThaiDon === 'Da thanh toan') {
          return { found: true as const, alreadyPaid: true, maDon: don.MaDon, donHangId: don.DonHangID };
        }

        const phaiThu = Math.max(0, Number(don.TongTien) - Number(don.GiamGia || 0));
        const finalPaidAmount = rawAmount > 0 ? rawAmount : phaiThu;
        const txnNo = String(query?.['vnp_TransactionNo'] || `VNP-${Date.now()}`);

        await tx.donDatTour.update({
          where: { DonHangID: Number(orderId) },
          data: {
            TrangThaiDon: 'Da thanh toan',
            TienCoc: finalPaidAmount,
            TienConLai: 0,
            PhuongThucTT: 'VNPay',
          },
        });

        // Tạo hóa đơn lịch sử thanh toán (tránh trùng MaGiaoDich nếu VNPay gọi lại)
        const existingTx = await tx.thanhToan.findFirst({
          where: { DonHangID: Number(orderId), MaGiaoDich: txnNo },
        });
        if (!existingTx) {
          await tx.thanhToan.create({
            data: {
              DonHangID: Number(orderId),
              MaGiaoDich: `${txnNo}-${Date.now().toString().slice(-4)}`,
              SoTien: finalPaidAmount,
              HinhThucTT: 'VNPay',
              TrangThai: 'Thanh cong',
              GhiChu: `Thanh toán trực tuyến thành công qua cổng VNPAY. Mã GD: ${txnNo}`,
            },
          });
        }
        return { found: true as const, alreadyPaid: false, maDon: don.MaDon, donHangId: don.DonHangID };
      });

      if (!result.found) return { RspCode: '01', Message: 'Order not found' };
      // Gửi email xác nhận kèm vé điện tử QR (không chặn phản hồi cho VNPay)
      if (!result.alreadyPaid) void this.mail.sendTicketEmail(result.maDon);

      return { RspCode: '00', Message: 'Confirm Success', maDon: result.maDon, donHangId: result.donHangId };
    } else {
      return { RspCode: rspCode || '99', Message: 'Transaction Failed' };
    }
  }
}

@Controller('vnpay')
export class VNPayController {
  constructor(private service: VNPayService) {}

  @Post('create-payment')
  createPayment(@Body() body: { donHangId: number; amount: number; orderInfo: string }, @Req() req: any) {
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    return this.service.createPaymentUrl({ ...body, ipAddr });
  }

  @Post('bookings/:bookingId/payment-url')
  async createPaymentForBooking(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Body() body: { returnUrl?: string },
    @Req() req: any,
  ) {
    const don = await this.service['prisma'].donDatTour.findUnique({ where: { DonHangID: bookingId } });
    if (!don) throw new NotFoundException('Không tìm thấy đơn đặt tour');
    const amount = Number(don.TienConLai ?? Math.max(0, Number(don.TongTien) - Number(don.GiamGia || 0) - Number(don.TienCoc || 0)));
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    return this.service.createPaymentUrl({
      donHangId: don.DonHangID,
      amount,
      orderInfo: `Thanh toan don tour ${don.MaDon}`,
      ipAddr,
      returnUrl: body?.returnUrl,
    });
  }

  @Get('mobile-return')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async handleMobileReturn(@Query() query: any) {
    const ipnResult = await this.service.handleVNPayIPN(query);
    const orderId = query?.['vnp_TxnRef'] ? String(query['vnp_TxnRef']).split('_')[0] : '';
    const rspCode = String(query?.['vnp_ResponseCode'] ?? '');
    const isSuccess = rspCode === '00' && ipnResult.RspCode === '00';
    const amount = (Number(query?.['vnp_Amount'] || 0) / 100).toLocaleString('vi-VN');
    const maDon = ipnResult.maDon || (orderId ? `VT-BK-${orderId}` : '');

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kết quả thanh toán - VietTour</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: #ffffff;
      border-radius: 24px;
      padding: 36px 28px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 12px 36px rgba(15, 23, 42, 0.08);
      border: 1px solid #e2e8f0;
    }
    .icon-box {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px auto;
      font-size: 36px;
    }
    .icon-box.success {
      background: #ecfdf5;
      color: #10b981;
      border: 2px solid #a7f3d0;
    }
    .icon-box.failed {
      background: #fef2f2;
      color: #ef4444;
      border: 2px solid #fecaca;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #0f172a;
    }
    p.desc {
      color: #64748b;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .info-list {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 28px;
      text-align: left;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label {
      color: #64748b;
    }
    .info-val {
      font-weight: 600;
      color: #0f172a;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 16px;
      border-radius: 14px;
      background: #0f172a;
      color: #ffffff;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2);
    }
    .btn:active {
      transform: scale(0.98);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-box ${isSuccess ? 'success' : 'failed'}">
      ${isSuccess ? '✓' : '✕'}
    </div>
    <h1>${isSuccess ? 'Thanh toán thành công!' : 'Thanh toán chưa thành công'}</h1>
    <p class="desc">
      ${isSuccess ? 'Đang chuyển hướng về ứng dụng VietTour để xem vé điện tử...' : 'Giao dịch chưa hoàn tất hoặc bị hủy.'}
    </p>

    <div class="info-list">
      <div class="info-row">
        <span class="info-label">Mã đơn hàng:</span>
        <span class="info-val">${maDon || '#' + orderId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Số tiền:</span>
        <span class="info-val">${amount} đ</span>
      </div>
      <div class="info-row">
        <span class="info-label">Cổng thanh toán:</span>
        <span class="info-val">VNPay Sandbox</span>
      </div>
    </div>

    <a href="viettour://payment-result?donHangId=${orderId}&result=${isSuccess ? 'success' : 'failed'}" class="btn">
      Quay lại ứng dụng VietTour
    </a>
  </div>

  <script>
    setTimeout(function() {
      window.location.href = "viettour://payment-result?donHangId=${orderId}&result=${isSuccess ? 'success' : 'failed'}";
    }, 600);
  </script>
</body>
</html>`;
  }

  @Get('bookings/:bookingId/status')
  async getBookingPaymentStatus(@Param('bookingId', ParseIntPipe) bookingId: number) {
    const don = await this.service['prisma'].donDatTour.findUnique({ where: { DonHangID: bookingId } });
    if (!don) throw new NotFoundException('Không tìm thấy đơn đặt tour');
    return {
      donHangId: don.DonHangID,
      maDon: don.MaDon,
      trangThaiDon: don.TrangThaiDon,
      daThanhToan: don.TrangThaiDon === 'Da thanh toan',
    };
  }

  @Get('vnpay_ipn')
  verifyIPN(@Query() query: any) {
    return this.service.handleVNPayIPN(query);
  }
}

@Module({
  imports: [ExportModule],
  controllers: [VNPayController],
  providers: [VNPayService],
  exports: [VNPayService],
})
export class VNPayModule {}
