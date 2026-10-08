import { BadRequestException, Body, Controller, Get, Injectable, Module, Post, Query, Req } from '@nestjs/common';
import * as crypto from 'crypto';
import * as querystring from 'qs';
import { PrismaService } from '../prisma/prisma.module.js';

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
  constructor(private prisma: PrismaService) {}

  /** Tạo URL chuyển hướng sang Cổng VNPay Sandbox */
  createPaymentUrl(dto: { donHangId: number; amount: number; orderInfo: string; ipAddr: string }) {
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
    const returnUrl = process.env.VNP_RETURNURL || 'http://localhost:3000/portal/my-bookings';

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
    let vnp_Params = { ...query };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = Object.keys(vnp_Params)
      .sort()
      .reduce((acc: Record<string, any>, key: string) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {});

    const secretKey = process.env.VNP_HASHSECRET || 'ZSBAXCUFSMZFYBKMELPCEWLUSMAJDHLI';
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      return { RspCode: '97', Message: 'Checksum failed' };
    }

    const orderId = vnp_Params['vnp_TxnRef'] ? vnp_Params['vnp_TxnRef'].split('_')[0] : null;
    const rspCode = vnp_Params['vnp_ResponseCode'];
    const amount = Number(vnp_Params['vnp_Amount'] || 0) / 100;

    if (rspCode === '00' && orderId) {
      // Cập nhật trạng thái đơn đặt tour trong CSDL PostgreSQL
      await this.prisma.donDatTour.update({
        where: { DonHangID: Number(orderId) },
        data: {
          TrangThaiDon: 'Da thanh toan',
          TienCoc: amount,
          TienConLai: 0,
          PhuongThucTT: 'VNPay',
        },
      });

      // Tạo hóa đơn lịch sử thanh toán
      await this.prisma.thanhToan.create({
        data: {
          DonHangID: Number(orderId),
          MaGiaoDich: vnp_Params['vnp_TransactionNo'] || `VNP-${Date.now()}`,
          SoTien: amount,
          HinhThucTT: 'VNPay Sandbox',
          TrangThai: 'Thanh cong',
          GhiChu: `Thanh toán thành công cổng VNPay. Mã giao dịch: ${vnp_Params['vnp_TransactionNo']}`,
        },
      });

      return { RspCode: '00', Message: 'Confirm Success' };
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

  @Get('vnpay_ipn')
  verifyIPN(@Query() query: any) {
    return this.service.handleVNPayIPN(query);
  }
}

@Module({
  controllers: [VNPayController],
  providers: [VNPayService],
  exports: [VNPayService],
})
export class VNPayModule {}
