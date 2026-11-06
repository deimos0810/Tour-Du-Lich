import { BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { JwtPayload } from '../common/jwt.config.js';
import { createMailTransporter } from '../common/mailer.js';
import { Prisma } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import * as os from 'os';
import { PrismaService } from '../prisma/prisma.module.js';
import { hashPassword, isHashed, validatePasswordStrength, verifyPassword } from '../common/password.js';
import { evaluateVoucher } from '../common/promotion.js';

function getLocalLanIp(): string | null {
  try {
    const nets = os.networkInterfaces();
    const candidates: string[] = [];
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          candidates.push(net.address);
        }
      }
    }
    const preferred = candidates.find((ip) => ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.'));
    return preferred || candidates[0] || null;
  } catch {
    return null;
  }
}

// In-memory store cho mã OTP lấy lại mật khẩu: Key là Email, Value là { code, expiresAt, attempts }
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();
const MAX_OTP_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService, private jwt: JwtService) {
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
    const pwErr = validatePasswordStrength(dto.password);
    if (pwErr) throw new BadRequestException(pwErr);

    return this.prisma.$transaction(async (tx) => {
      const tk = await tx.taiKhoan.create({
        data: {
          Email: dto.email,
          MatKhauHash: hashPassword(dto.password),
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
        NhanVien: { include: { HuongDanVien: true } },
      },
    });

    if (!tk || !verifyPassword(dto.password, tk.MatKhauHash)) {
      throw new BadRequestException('Email hoặc mật khẩu không chính xác!');
    }

    if (tk.TrangThai === 0) {
      throw new BadRequestException('Tài khoản của bạn đã bị tạm khóa!');
    }

    // Nâng cấp mật khẩu plaintext (dữ liệu seed cũ) sang dạng băm scrypt
    if (!isHashed(tk.MatKhauHash)) {
      await this.prisma.taiKhoan.update({ where: { TaiKhoanID: tk.TaiKhoanID }, data: { MatKhauHash: hashPassword(dto.password) } });
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
      redirectUrl = '/my-schedule';
    }

    const payload: JwtPayload = {
      sub: tk.TaiKhoanID,
      email: tk.Email,
      roles,
      primaryRole,
      customerId: tk.KhachHang?.KhachHangID || null,
      employeeId: tk.NhanVien?.NhanVienID || null,
    };

    const signedToken = await this.jwt.signAsync(payload);
    return {
      token: signedToken,
      accessToken: signedToken,
      refreshToken: signedToken,
      user: {
        id: tk.TaiKhoanID,
        email: tk.Email,
        phone: tk.SoDienThoai,
        roles,
        primaryRole,
        name: tk.KhachHang?.HoTen || tk.NhanVien?.HoTen || tk.Email.split('@')[0],
        customerId: tk.KhachHang?.KhachHangID || null,
        employeeId: tk.NhanVien?.NhanVienID || null,
        hdvId: tk.NhanVien?.HuongDanVien?.HDVID || null,
        soTheHdv: tk.NhanVien?.HuongDanVien?.SoTheHDV || null,
        redirectUrl,
      },
    };
  }

  /**
   * Chuyển đổi nhanh giữa các tài khoản đã lưu trên thiết bị (Khách hàng ⇄ Hướng dẫn viên ⇄ Admin).
   * Chỉ kích hoạt ở môi trường Development/Sandbox để phục vụ chạy Demo bảo vệ khóa luận;
   * tự động vô hiệu hóa trên môi trường Production.
   */
  async quickSwitchAccount(email: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Tính năng chuyển nhanh tài khoản Demo đã bị khóa trên môi trường Production!');
    }
    if (!email || !email.trim()) {
      throw new BadRequestException('Vui lòng chọn tài khoản cần chuyển đổi');
    }
    const tk = await this.prisma.taiKhoan.findUnique({
      where: { Email: email.trim() },
      include: {
        PhanQuyen: { include: { VaiTro: true } },
        KhachHang: true,
        NhanVien: { include: { HuongDanVien: true } },
      },
    });
    if (!tk) {
      throw new NotFoundException(`Không tìm thấy tài khoản với email: ${email}`);
    }
    if (tk.TrangThai === 0) {
      throw new BadRequestException('Tài khoản này đang bị khóa!');
    }

    const roles = tk.PhanQuyen.map((p) => p.VaiTro.TenVaiTro);
    const primaryRole = roles[0] || 'Khach hang';
    let redirectUrl = '/portal';
    if (primaryRole === 'Admin') redirectUrl = '/';
    else if (primaryRole === 'Dieu hanh') redirectUrl = '/tours';
    else if (primaryRole === 'Ke toan') redirectUrl = '/bookings';
    else if (primaryRole === 'HDV') redirectUrl = '/my-schedule';

    const payload: JwtPayload = {
      sub: tk.TaiKhoanID,
      email: tk.Email,
      roles,
      primaryRole,
      customerId: tk.KhachHang?.KhachHangID || null,
      employeeId: tk.NhanVien?.NhanVienID || null,
    };
    const signedToken = await this.jwt.signAsync(payload);
    return {
      token: signedToken,
      accessToken: signedToken,
      refreshToken: signedToken,
      user: {
        id: tk.TaiKhoanID,
        email: tk.Email,
        phone: tk.SoDienThoai,
        roles,
        primaryRole,
        name: tk.KhachHang?.HoTen || tk.NhanVien?.HoTen || tk.Email.split('@')[0],
        hoTen: tk.KhachHang?.HoTen || tk.NhanVien?.HoTen || tk.Email.split('@')[0],
        customerId: tk.KhachHang?.KhachHangID || null,
        employeeId: tk.NhanVien?.NhanVienID || null,
        hdvId: tk.NhanVien?.HuongDanVien?.HDVID || null,
        soTheHdv: tk.NhanVien?.HuongDanVien?.SoTheHDV || null,
        redirectUrl,
      },
    };
  }

  /** Lấy danh sách các tài khoản mẫu / gần đây để phục vụ chuyển đổi nhanh khi demo nghiệp vụ */
  async getQuickAccounts() {
    const accounts = await this.prisma.taiKhoan.findMany({
      where: { TrangThai: 1 },
      include: {
        PhanQuyen: { include: { VaiTro: true } },
        KhachHang: true,
        NhanVien: { include: { HuongDanVien: true } },
      },
      orderBy: { TaiKhoanID: 'asc' },
      take: 15,
    });
    return accounts.map((tk) => {
      const roles = tk.PhanQuyen.map((p) => p.VaiTro.TenVaiTro);
      const primaryRole = roles[0] || 'Khach hang';
      return {
        id: tk.TaiKhoanID,
        email: tk.Email,
        phone: tk.SoDienThoai,
        name: tk.KhachHang?.HoTen || tk.NhanVien?.HoTen || tk.Email.split('@')[0],
        primaryRole,
        roles,
        customerId: tk.KhachHang?.KhachHangID || null,
        employeeId: tk.NhanVien?.NhanVienID || null,
        hdvId: tk.NhanVien?.HuongDanVien?.HDVID || null,
      };
    });
  }

  async getMe(userId: number) {
    const tk = await this.prisma.taiKhoan.findUnique({
      where: { TaiKhoanID: userId },
      include: {
        PhanQuyen: { include: { VaiTro: true } },
        KhachHang: true,
        NhanVien: { include: { HuongDanVien: true } },
      },
    });
    if (!tk) throw new NotFoundException('Không tìm thấy tài khoản');
    const roles = tk.PhanQuyen.map((p) => p.VaiTro.TenVaiTro);
    const primaryRole = roles[0] || 'Khach hang';
    return {
      id: tk.TaiKhoanID,
      email: tk.Email,
      phone: tk.SoDienThoai,
      roles,
      primaryRole,
      name: tk.KhachHang?.HoTen || tk.NhanVien?.HoTen || tk.Email.split('@')[0],
      hoTen: tk.KhachHang?.HoTen || tk.NhanVien?.HoTen || tk.Email.split('@')[0],
      customerId: tk.KhachHang?.KhachHangID || null,
      employeeId: tk.NhanVien?.NhanVienID || null,
      hdvId: tk.NhanVien?.HuongDanVien?.HDVID || null,
      soTheHdv: tk.NhanVien?.HuongDanVien?.SoTheHDV || null,
    };
  }

  async updateProfile(userId: number, dto: { hoTen?: string; phone?: string; email?: string; ngaySinh?: string }) {
    const tk = await this.prisma.taiKhoan.findUnique({
      where: { TaiKhoanID: userId },
      include: { KhachHang: true, NhanVien: true },
    });
    if (!tk) throw new NotFoundException('Không tìm thấy tài khoản');
    if (dto.phone) {
      await this.prisma.taiKhoan.update({
        where: { TaiKhoanID: userId },
        data: { SoDienThoai: dto.phone },
      });
    }
    if (tk.KhachHang) {
      await this.prisma.khachHang.update({
        where: { KhachHangID: tk.KhachHang.KhachHangID },
        data: {
          HoTen: dto.hoTen || tk.KhachHang.HoTen,
          SoDienThoai: dto.phone || tk.KhachHang.SoDienThoai,
          NgaySinh: dto.ngaySinh ? new Date(dto.ngaySinh) : tk.KhachHang.NgaySinh,
        },
      });
    }
    return this.getMe(userId);
  }

  private getTransporter() {
    return createMailTransporter();
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

    otpStore.set(email, { code: otpCode, expiresAt, attempts: 0 });

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
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #ffffff; color: #111111; border: 1px solid #e5e7eb; border-radius: 6px; padding: 28px 32px; line-height: 1.6;">
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 14px; margin-bottom: 20px;">
              <div style="font-size: 16px; font-weight: 700; color: #111111; letter-spacing: 0.5px;">VIETTOUR</div>
              <div style="font-size: 13px; color: #4b5563; margin-top: 2px;">Xác thực khôi phục mật khẩu tài khoản</div>
            </div>
            
            <p style="color: #111111; font-size: 14px; margin: 0 0 12px;">Xin chào <strong>${email}</strong>,</p>
            <p style="color: #374151; font-size: 14px; margin: 0 0 18px;">Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác thực (OTP) gồm 6 chữ số dưới đây:</p>
            
            <div style="font-size: 26px; font-weight: 700; letter-spacing: 6px; color: #111111; background: #ffffff; border: 1px solid #d1d5db; padding: 14px 20px; text-align: center; border-radius: 6px; margin: 20px 0; font-family: monospace;">
              ${otpCode}
            </div>

            <p style="font-size: 13px; color: #4b5563; margin: 0 0 20px;">
              Mã xác thực có hiệu lực trong vòng <strong>5 phút</strong>. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
            </p>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 14px; font-size: 12px; color: #6b7280;">
              <div>Công ty Cổ phần Du lịch &amp; Lữ hành VietTour</div>
              <div>Quầy giao dịch: Ga Quốc Nội, Sân bay Quốc tế Tân Sơn Nhất, TP.HCM • Hotline: 1900 1234</div>
            </div>
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
      record.attempts += 1;
      if (record.attempts >= MAX_OTP_ATTEMPTS) {
        otpStore.delete(dto.email);
        throw new BadRequestException('Bạn đã nhập sai OTP quá 5 lần! Mã OTP đã bị hủy để bảo mật, vui lòng yêu cầu mã mới.');
      }
      otpStore.set(dto.email, record);
      throw new BadRequestException(`Mã OTP không chính xác! Bạn còn ${MAX_OTP_ATTEMPTS - record.attempts} lần thử.`);
    }

    const pwErr = validatePasswordStrength(dto.newPassword);
    if (pwErr) throw new BadRequestException(pwErr);

    // Cập nhật mật khẩu trong CSDL (đã băm)
    await this.prisma.taiKhoan.update({
      where: { Email: dto.email },
      data: { MatKhauHash: hashPassword(dto.newPassword) },
    });

    // Xóa OTP đã sử dụng
    otpStore.delete(dto.email);

    return { message: 'Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.' };
  }

  /** Đổi mật khẩu khi đang đăng nhập (yêu cầu mật khẩu cũ) */
  async changePassword(dto: { email: string; oldPassword: string; newPassword: string }) {
    const tk = await this.prisma.taiKhoan.findUnique({ where: { Email: dto.email } });
    if (!tk || !verifyPassword(dto.oldPassword, tk.MatKhauHash)) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác!');
    }
    const pwErr = validatePasswordStrength(dto.newPassword);
    if (pwErr) throw new BadRequestException(pwErr);
    if (dto.oldPassword === dto.newPassword) throw new BadRequestException('Mật khẩu mới phải khác mật khẩu cũ');
    await this.prisma.taiKhoan.update({ where: { TaiKhoanID: tk.TaiKhoanID }, data: { MatKhauHash: hashPassword(dto.newPassword) } });
    return { message: 'Đổi mật khẩu thành công!' };
  }

  async createBookingCustomer(dto: {
    khachHangId: number;
    lichId: number;
    soLuongNguoiLon: number;
    soLuongTreEm: number;
    soPhongDon?: number;
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
    if (!dto.khachHangId) throw new BadRequestException('Vui lòng đăng nhập tài khoản khách hàng trước khi đặt tour!');
    if (!dto.soLuongNguoiLon || dto.soLuongNguoiLon < 1 || dto.soLuongTreEm < 0) {
      throw new BadRequestException('Đơn đặt tour cần ít nhất 1 người lớn');
    }
    return this.prisma.$transaction(async (tx) => {
      // Khóa hàng (row-level lock) của lịch khởi hành: các giao dịch đặt tour đồng thời sẽ xếp hàng chờ,
      // đảm bảo kiểm tra số chỗ + cập nhật SoChoDaDat là tuần tự (chống overbooking / race condition).
      const locked = await tx.$queryRaw<Array<{ lichid: number }>>`SELECT lichid FROM lichkhoihanh WHERE lichid = ${dto.lichId} FOR UPDATE`;
      if (locked.length === 0) throw new NotFoundException('Không tìm thấy lịch khởi hành!');

      const lich = await tx.lichKhoiHanh.findUniqueOrThrow({
        where: { LichID: dto.lichId },
        include: { Tour: true },
      });

      if (lich.TrangThai !== 'Cho khoi hanh' || lich.NgayKhoiHanh <= new Date()) {
        throw new BadRequestException('Lịch khởi hành này đã đóng hoặc đã khởi hành, vui lòng chọn ngày khác!');
      }

      if (lich.SoChoDaDat + dto.soLuongNguoiLon + dto.soLuongTreEm > lich.SoChoToiDa) {
        throw new BadRequestException('Lịch khởi hành này đã không còn đủ số chỗ yêu cầu!');
      }

      const giaNL = Number(lich.GiaTourKhuyenMai || lich.Tour.GiaNguoiLon);
      const giaTE = Number(lich.Tour.GiaTreEm);
      const soPhongDon = Math.max(0, Number(dto.soPhongDon || 0));
      const tienPhuThuPhongDon = soPhongDon * Number(lich.Tour.PhuThuPhongDon || 0);
      const tongTien = giaNL * dto.soLuongNguoiLon + giaTE * dto.soLuongTreEm + tienPhuThuPhongDon;
      const maDon = `BK-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;

      // 1. Kiểm tra Khuyến mãi tour (CTKM) đang diễn ra theo thời gian thực
      const now = new Date();
      const activeCTKMs = await tx.chuongTrinhKhuyenMai.findMany({
        where: {
          TrangThai: 1,
          NgayBatDau: { lte: now },
          NgayKetThuc: { gte: now },
          ApDung: { some: { TourID: lich.TourID } },
        },
        orderBy: { PhanTramGiam: 'desc' },
      });
      const ctkm = activeCTKMs[0] || null;
      let giamGiaKM = 0;
      let ctkmId: number | null = null;
      if (ctkm) {
        ctkmId = ctkm.CTKMID;
        giamGiaKM = Math.round((tongTien * Number(ctkm.PhanTramGiam)) / 100);
      }

      // 2. Kiểm tra và áp dụng mã Voucher nhập tay nếu có (khóa dòng Voucher chống vượt SoLuongToiDa)
      let giamGiaVoucher = 0;
      let voucherId: number | null = null;
      const tienSauKM = Math.max(tongTien - giamGiaKM, 0);
      if (dto.maKhuyenMai && dto.maKhuyenMai.trim()) {
        const cleanCode = dto.maKhuyenMai.trim().toUpperCase();
        await tx.$queryRaw`SELECT voucherid FROM voucher WHERE UPPER(mavoucher) = ${cleanCode} FOR UPDATE`;
        const vcRes = await evaluateVoucher(tx, cleanCode, tienSauKM, lich.TourID, now);
        giamGiaVoucher = vcRes.giamGia;
        voucherId = vcRes.voucherId;
      }

      const tongGiamGia = giamGiaKM + giamGiaVoucher;
      const tienConLai = Math.max(tongTien - tongGiamGia, 0);

      const don = await tx.donDatTour.create({
        data: {
          KhachHangID: dto.khachHangId,
          LichID: dto.lichId,
          VoucherID: voucherId,
          CTKMID: ctkmId,
          MaDon: maDon,
          SoLuongNguoiLon: dto.soLuongNguoiLon,
          SoLuongTreEm: dto.soLuongTreEm,
          TongTien: tongTien,
          GiamGia: tongGiamGia,
          GiamGiaKhuyenMai: giamGiaKM,
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

  @Post('quick-switch')
  quickSwitch(@Body() body: { email: string }) {
    return this.service.quickSwitchAccount(body.email);
  }

  @Get('quick-accounts')
  quickAccounts() {
    return this.service.getQuickAccounts();
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return {
      token: refreshToken,
      accessToken: refreshToken,
      refreshToken,
    };
  }

  @Post('logout')
  logout() {
    return { success: true, message: 'Đã đăng xuất thành công' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: JwtPayload }) {
    return this.service.getMe(req.user.sub);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: { user: JwtPayload }) {
    return this.service.getMe(req.user.sub);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Req() req: { user: JwtPayload },
    @Body() body: { hoTen?: string; phone?: string; email?: string; ngaySinh?: string },
  ) {
    return this.service.updateProfile(req.user.sub, body);
  }

  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.service.sendForgotPasswordOTP(email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
    return this.service.resetPasswordWithOTP(body);
  }

  @Post('change-password')
  changePassword(@Body() body: { email: string; oldPassword: string; newPassword: string }) {
    return this.service.changePassword(body);
  }

  @Post('customer-booking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Khach hang')
  createBooking(@Req() req: { user: JwtPayload }, @Body() body: {
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
    return this.service.createBookingCustomer({ ...body, khachHangId: req.user.customerId ?? body.khachHangId });
  }
}

@Controller('portal')
export class PortalController {
  constructor(private prisma: PrismaService, private jwt: JwtService) { }

  @Get('my-bookings')
  async getMyBookings(@Query('customerId') customerId?: string, @Req() req?: any) {
    let cid = customerId && !Number.isNaN(Number(customerId)) ? Number(customerId) : null;
    let isStaffOrGuide = false;
    let decodedToken: JwtPayload | null = null;
    if (!cid && req?.headers?.authorization) {
      const authHeader = String(req.headers.authorization);
      if (authHeader.startsWith('Bearer ')) {
        try {
          decodedToken = await this.jwt.verifyAsync<JwtPayload>(authHeader.slice(7));
          if (decodedToken?.customerId) {
            cid = Number(decodedToken.customerId);
          } else if (
            decodedToken?.employeeId ||
            (decodedToken?.roles && decodedToken.roles.some((r) => ['HDV', 'Admin', 'Dieu hanh', 'Ke toan'].includes(r)))
          ) {
            isStaffOrGuide = true;
          }
        } catch {
          // ignore invalid token
        }
      }
    }
    if (!cid && !isStaffOrGuide) cid = 1;
    let whereClause: any = { KhachHangID: cid ?? -1 };
    if (isStaffOrGuide && decodedToken) {
      const roles: string[] = decodedToken?.roles || [];
      const sub = Number(decodedToken?.sub);
      if (roles.includes('HDV') && !roles.includes('Admin') && !roles.includes('Dieu hanh')) {
        const hdv = await this.prisma.huongDanVien.findFirst({
          where: { NhanVien: { TaiKhoanID: sub } },
          select: { HDVID: true },
        });
        if (hdv) {
          const dispatches = await this.prisma.dieuPhoiTour.findMany({
            where: { HDVID: hdv.HDVID, TrangThai: { not: 'Tu choi' } },
            select: { LichID: true },
          });
          const lichIds = dispatches.map((d) => d.LichID);
          whereClause = { LichID: { in: lichIds.length ? lichIds : [-1] } };
        } else {
          whereClause = { DonHangID: -1 };
        }
      } else {
        whereClause = {};
      }
    }

    const rows = await this.prisma.donDatTour.findMany({
      where: whereClause,
      include: {
        KhachHang: true,
        LichKhoiHanh: {
          include: {
            Tour: true,
          },
        },
        ChiTietHanhKhach: true,
        ThanhToan: {
          orderBy: { NgayThanhToan: 'desc' },
        },
        Voucher: true,
        ChuongTrinhKM: true,
        DanhGia: {
          select: {
            DanhGiaID: true,
            SoSao: true,
            BinhLuan: true,
            NgayDanhGia: true,
          },
        },
      },
      orderBy: { NgayDat: 'desc' },
    });
    const lanIp = getLocalLanIp();
    return rows.map((r) => ({ ...r, lanIp }));
  }

  @Get('cancellation-notices')
  async getCancellationNotices(@Query('customerId') customerId?: string) {
    const cid = customerId && !Number.isNaN(Number(customerId)) ? Number(customerId) : null;
    if (!cid) return [];

    const cancelledBookings = await this.prisma.donDatTour.findMany({
      where: {
        KhachHangID: cid,
        TrangThaiDon: 'Da huy',
      },
      include: {
        LichKhoiHanh: {
          include: {
            Tour: {
              select: {
                TourID: true,
                TenTour: true,
                MaTour: true,
                HinhAnhURL: true,
                ThoiGian: true,
              },
            },
          },
        },
      },
      orderBy: { NgayDat: 'desc' },
    });

    return cancelledBookings.map((b) => {
      let adminReason = '';
      let cancelTime = '';
      const rawNote = b.GhiChu || '';

      if (rawNote.includes('[QUẢN TRỊ VIÊN HỦY]')) {
        const parts = rawNote.split('[QUẢN TRỊ VIÊN HỦY]');
        const latestPart = parts[parts.length - 1];
        const reasonMatch = latestPart.match(/-\s*Lý do:\s*([\s\S]*)/i);
        adminReason = reasonMatch ? reasonMatch[1].trim() : latestPart.trim();
        const timeMatch = latestPart.match(/(\d{2}:\d{2}\s+\d{1,2}\/\d{1,2}\/\d{4})/);
        cancelTime = timeMatch ? timeMatch[1] : '';
      } else if (rawNote.includes('Khách hủy')) {
        adminReason = rawNote;
      } else {
        adminReason = rawNote || 'Đơn hàng đã bị hủy bởi quản trị viên';
      }

      return {
        donHangId: b.DonHangID,
        maDon: b.MaDon,
        tenTour: b.LichKhoiHanh?.Tour?.TenTour || 'Tour du lịch',
        maTour: b.LichKhoiHanh?.Tour?.MaTour || '',
        hinhAnhUrl: b.LichKhoiHanh?.Tour?.HinhAnhURL || null,
        thoiGian: b.LichKhoiHanh?.Tour?.ThoiGian || '',
        ngayKhoiHanh: b.LichKhoiHanh?.NgayKhoiHanh,
        tongTien: b.TongTien,
        ghiChu: b.GhiChu,
        lyDoHuy: adminReason,
        cancelTime: cancelTime,
        isAdminCancelled: rawNote.includes('[QUẢN TRỊ VIÊN HỦY]'),
      };
    });
  }
}

@Module({
  controllers: [AuthController, PortalController],
  providers: [AuthService],
})
export class AuthModule { }
