import { BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException, Post, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.module.js';

// In-memory store cho mã OTP lấy lại mật khẩu: Key là Email, Value là { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    // Cấu hình Nodemailer cho Gmail SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT || 587),
      secure: false, // true cho port 465, false cho 587
      auth: {
        user: process.env.MAIL_USER || '', // Email Gmail của bạn (VD: address@gmail.com)
        pass: process.env.MAIL_PASS || '', // App Password (Mật khẩu ứng dụng 16 ký tự từ Google)
      },
    });
  }

  async registerCustomer(dto: { email: string; password: string; hoTen: string; phone: string; cccd?: string }) {
    const existing = await this.prisma.taiKhoan.findUnique({ where: { Email: dto.email } });
    if (existing) throw new BadRequestException('Email này đã được đăng ký tài khoản!');

    return this.prisma.$transaction(async (tx) => {
      const tk = await tx.taiKhoan.create({
        data: {
          Email: dto.email,
          MatKhauHash: dto.password,
          SoDienThoai: dto.phone,
          TrangThai: 1,
        },
      });

      const vaiTroKH = await tx.vaiTro.findFirst({ where: { TenVaiTro: 'Khach hang' } });
      const vaiTroId = vaiTroKH ? vaiTroKH.VaiTroID : 5;

      await tx.phanQuyen.create({
        data: { TaiKhoanID: tk.TaiKhoanID, VaiTroID: vaiTroId },
      });

      const kh = await tx.khachHang.create({
        data: {
          TaiKhoanID: tk.TaiKhoanID,
          HoTen: dto.hoTen,
          SoDienThoai: dto.phone,
          Email: dto.email,
          CCCD: dto.cccd || null,
        },
      });

      return {
        user: { id: tk.TaiKhoanID, email: tk.Email, role: 'Khach hang' },
        customer: kh,
      };
    });
  }

  async login(dto: { email: string; password: string }) {
    const tk = await this.prisma.taiKhoan.findUnique({
      where: { Email: dto.email },
      include: {
        PhanQuyen: { include: { VaiTro: true } },
        KhachHang: true,
        NhanVien: true,
      },
    });

    if (!tk || tk.MatKhauHash !== dto.password) {
      throw new BadRequestException('Email hoặc mật khẩu không chính xác!');
    }

    if (tk.TrangThai === 0) {
      throw new BadRequestException('Tài khoản của bạn đã bị tạm khóa!');
    }

    const roles = tk.PhanQuyen.map((p) => p.VaiTro.TenVaiTro);
    const primaryRole = roles[0] || 'Khach hang';

    // Xác định trang điều hướng (Redirect URL) theo đúng vai trò & chức danh
    let redirectUrl = '/portal'; // Mặc định cho Khách hàng
    if (primaryRole === 'Admin') {
      redirectUrl = '/';
    } else if (primaryRole === 'Dieu hanh') {
      redirectUrl = '/tours';
    } else if (primaryRole === 'Ke toan') {
      redirectUrl = '/bookings';
    } else if (primaryRole === 'HDV') {
      redirectUrl = '/departures';
    }

    return {
      token: `jwt-session-${tk.TaiKhoanID}-${Date.now()}`,
      user: {
        id: tk.TaiKhoanID,
        email: tk.Email,
        phone: tk.SoDienThoai,
        roles,
        primaryRole,
        name: tk.KhachHang?.HoTen || tk.NhanVien?.HoTen || tk.Email.split('@')[0],
        customerId: tk.KhachHang?.KhachHangID || null,
        employeeId: tk.NhanVien?.NhanVienID || null,
        redirectUrl,
      },
    };
  }

  private getTransporter() {
    const mailUser = (process.env.MAIL_USER || 'luongthanh1152011@gmail.com').trim();
    const mailPass = (process.env.MAIL_PASS || 'dvrjdhcvhqrymsvs').replace(/\s+/g, '');
    return nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT || 587),
      secure: false, // 587 uses STARTTLS
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    });
  }

  /** Gửi mã OTP xác thực khôi phục mật khẩu qua Gmail */
  async sendForgotPasswordOTP(email: string) {
    const tk = await this.prisma.taiKhoan.findUnique({ where: { Email: email } });
    if (!tk) {
      throw new NotFoundException('Email này chưa được đăng ký tài khoản trong hệ thống!');
    }

    // Tạo mã OTP 6 chữ số ngẫu nhiên
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // Mã có hiệu lực trong 5 phút

    otpStore.set(email, { code: otpCode, expiresAt });

    const mailUser = (process.env.MAIL_USER || 'luongthanh1152011@gmail.com').trim();
    const fromName = process.env.MAIL_FROM_NAME || 'VietTour Security';

    let mailSent = false;
    let mailError: string | null = null;

    try {
      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: `"${fromName}" <${mailUser}>`,
        to: email,
        subject: '[VietTour] Mã OTP Khôi Phục Mật Khẩu',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 28px; border: 1px solid #e2e8f0; border-radius: 14px; max-width: 520px; background-color: #ffffff; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #0d6efd 0%, #1d4ed8 100%); color: #ffffff; width: 50px; height: 50px; line-height: 50px; border-radius: 12px; font-weight: 900; font-size: 22px; text-align: center;">VT</div>
              <h2 style="color: #0f172a; margin-top: 14px; margin-bottom: 4px; font-size: 22px; font-weight: 800;">Khôi Phục Mật Khẩu VietTour</h2>
              <p style="color: #64748b; font-size: 13px; margin: 0;">Hệ thống Quản lý & Đặt tour Du lịch VietTour</p>
            </div>
            
            <p style="color: #334155; font-size: 14.5px; line-height: 1.6; margin-bottom: 12px;">Xin chào <strong>${email}</strong>,</p>
            <p style="color: #334155; font-size: 14.5px; line-height: 1.6; margin-bottom: 20px;">Bạn vừa gửi yêu cầu mã OTP xác thực để thiết lập lại mật khẩu tài khoản VietTour. Mã xác thực 6 số của bạn là:</p>
            
            <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0d6efd; background: #f8fafc; border: 2px dashed #cbd5e1; padding: 18px 24px; text-align: center; border-radius: 10px; margin: 24px 0;">
              ${otpCode}
            </div>

            <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 16px;">
              • Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>.<br/>
              • Tuyệt đối không chia sẻ mã xác thực này cho bất kỳ ai khác để bảo vệ tài khoản của bạn.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
              © 2026 VietTour System. Đây là email tự động từ hệ thống, vui lòng không phản hồi lại thư này.
            </p>
          </div>
        `,
      });
      mailSent = true;
      console.log(`[SMTP SUCCESS] Mã OTP ${otpCode} đã được gửi tới ${email} qua Gmail SMTP!`);
    } catch (err) {
      mailError = err instanceof Error ? err.message : String(err);
      console.error(`[SMTP ERROR] Không thể gửi Gmail tới ${email}:`, mailError);
    }

    return {
      message: mailSent
        ? `Mã OTP đã được gửi thành công tới email ${email}. Vui lòng kiểm tra hộp thư.`
        : `Mã OTP đã khởi tạo. Lỗi gửi SMTP: ${mailError}`,
    };
  }

  /** Xác nhận mã OTP và Cập nhật Mật khẩu mới */
  async resetPasswordWithOTP(dto: { email: string; otp: string; newPassword: string }) {
    const record = otpStore.get(dto.email);

    if (!record) {
      throw new BadRequestException('Vui lòng yêu cầu mã OTP trước khi đổi mật khẩu!');
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(dto.email);
      throw new BadRequestException('Mã OTP đã hết hạn! Vui lòng yêu cầu mã mới.');
    }

    if (record.code !== dto.otp) {
      throw new BadRequestException('Mã OTP không chính xác!');
    }

    // Cập nhật mật khẩu trong CSDL
    await this.prisma.taiKhoan.update({
      where: { Email: dto.email },
      data: { MatKhauHash: dto.newPassword },
    });

    // Xóa OTP đã sử dụng
    otpStore.delete(dto.email);

    return { message: 'Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.' };
  }

  async createBookingCustomer(dto: {
    khachHangId: number;
    lichId: number;
    soLuongNguoiLon: number;
    soLuongTreEm: number;
    ghiChu?: string;
    maKhuyenMai?: string;
    hanhKhach?: Array<{
      hoTen: string;
      gioiTinh?: string;
      ngaySinh?: string;
      cccd?: string;
      loaiKhach?: string;
    }>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const lich = await tx.lichKhoiHanh.findUniqueOrThrow({
        where: { LichID: dto.lichId },
        include: { Tour: true },
      });

      if (lich.SoChoDaDat + dto.soLuongNguoiLon + dto.soLuongTreEm > lich.SoChoToiDa) {
        throw new BadRequestException('Lịch khởi hành này đã không còn đủ số chỗ yêu cầu!');
      }

      const giaNL = Number(lich.GiaTourKhuyenMai || lich.Tour.GiaNguoiLon);
      const giaTE = Number(lich.Tour.GiaTreEm);
      const tongTien = giaNL * dto.soLuongNguoiLon + giaTE * dto.soLuongTreEm;
      const maDon = `BK-${Date.now().toString().slice(-6)}`;

      // Kiểm tra và áp dụng mã khuyến mãi nếu có
      let giamGia = 0;
      let khuyenMaiId: number | null = null;
      if (dto.maKhuyenMai) {
        const km = await tx.khuyenMai.findUnique({ where: { MaKhuyenMai: dto.maKhuyenMai } });
        const now = new Date();
        if (
          km &&
          km.TrangThai === 1 &&
          now >= km.NgayBatDau &&
          now <= km.NgayKetThucKM &&
          tongTien >= Number(km.GiaTriDonToiThieu)
        ) {
          giamGia = Math.min(
            Math.round((tongTien * Number(km.PhanTramGiam)) / 100),
            Number(km.GiamToiDa),
          );
          khuyenMaiId = km.KhuyenMaiID;
        }
      }

      const tienConLai = Math.max(tongTien - giamGia, 0);

      const don = await tx.donDatTour.create({
        data: {
          KhachHangID: dto.khachHangId,
          LichID: dto.lichId,
          KhuyenMaiID: khuyenMaiId,
          MaDon: maDon,
          SoLuongNguoiLon: dto.soLuongNguoiLon,
          SoLuongTreEm: dto.soLuongTreEm,
          TongTien: tongTien,
          GiamGia: giamGia,
          TienCoc: 0,
          TienConLai: tienConLai,
          TrangThaiDon: 'Cho thanh toan',
          GhiChu: dto.ghiChu || null,
        },
      });

      // Tạo danh sách hành khách trong bảng ChiTietHanhKhach (Bảng 3.11 trong Báo cáo)
      const khachHang = await tx.khachHang.findUnique({ where: { KhachHangID: dto.khachHangId } });
      const rawList = dto.hanhKhach && dto.hanhKhach.length > 0 ? dto.hanhKhach : [];
      const totalGuests = dto.soLuongNguoiLon + dto.soLuongTreEm;
      const passengersToCreate: Array<Prisma.ChiTietHanhKhachCreateManyInput> = [];

      for (let i = 0; i < totalGuests; i++) {
        const p = rawList[i];
        const isAdult = i < dto.soLuongNguoiLon;
        const defaultName = i === 0 && khachHang ? khachHang.HoTen : `Hành khách ${i + 1}`;
        const hoTen = p?.hoTen?.trim() || defaultName;
        const loaiKhach = p?.loaiKhach || (isAdult ? 'Nguoi lon' : 'Tre em');
        const cccd = p?.cccd?.trim() || (i === 0 && khachHang?.CCCD ? khachHang.CCCD : null);
        const gioiTinh = p?.gioiTinh || (i === 0 && khachHang?.GioiTinh ? khachHang.GioiTinh : 'Nam');
        const ngaySinh = p?.ngaySinh ? new Date(p.ngaySinh) : (i === 0 && khachHang?.NgaySinh ? khachHang.NgaySinh : null);
        const maQRVe = `VT-${maDon}-${i + 1}-${Date.now().toString().slice(-4)}`;

        passengersToCreate.push({
          DonHangID: don.DonHangID,
          HoTen: hoTen,
          LoaiKhach: loaiKhach,
          CCCD: cccd,
          NgaySinh: ngaySinh,
          MaQRVe: maQRVe,
          TrangThaiDiemDanh: 0,
          GhiChu: gioiTinh ? `Giới tính: ${gioiTinh}` : null,
        });
      }

      if (passengersToCreate.length > 0) {
        await tx.chiTietHanhKhach.createMany({ data: passengersToCreate });
      }

      await tx.lichKhoiHanh.update({
        where: { LichID: dto.lichId },
        data: { SoChoDaDat: { increment: dto.soLuongNguoiLon + dto.soLuongTreEm } },
      });

      return don;
    });
  }
}

@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) { }

  @Post('register')
  register(@Body() body: { email: string; password: string; hoTen: string; phone: string; cccd?: string }) {
    return this.service.registerCustomer(body);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.service.login(body);
  }

  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.service.sendForgotPasswordOTP(email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
    return this.service.resetPasswordWithOTP(body);
  }

  @Post('customer-booking')
  createBooking(@Body() body: {
    khachHangId: number;
    lichId: number;
    soLuongNguoiLon: number;
    soLuongTreEm: number;
    ghiChu?: string;
    maKhuyenMai?: string;
    hanhKhach?: Array<{
      hoTen: string;
      gioiTinh?: string;
      ngaySinh?: string;
      cccd?: string;
      loaiKhach?: string;
    }>;
  }) {
    return this.service.createBookingCustomer(body);
  }
}

@Controller('portal')
export class PortalController {
  constructor(private prisma: PrismaService) {}

  @Get('my-bookings')
  async getMyBookings(@Query('customerId') customerId?: string) {
    return this.prisma.donDatTour.findMany({
      where: customerId ? { KhachHangID: Number(customerId) } : undefined,
      include: {
        LichKhoiHanh: {
          include: {
            Tour: true,
          },
        },
        ChiTietHanhKhach: true,
        ThanhToan: {
          orderBy: { NgayThanhToan: 'desc' },
        },
        KhuyenMai: true,
      },
      orderBy: { NgayDat: 'desc' },
    });
  }
}

@Module({
  controllers: [AuthController, PortalController],
  providers: [AuthService],
})
export class AuthModule { }
