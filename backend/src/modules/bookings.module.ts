import { BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { networkInterfaces } from 'node:os';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ExportModule, TicketMailService } from './export.module.js';
import { evaluateVoucher } from '../common/promotion.js';

// PHÂN HỆ 3: Lịch khởi hành  |  PHÂN HỆ 4: Booking & đặt cọc
@Injectable()
export class DeparturesService {
  constructor(private prisma: PrismaService) {}

  findAll(trangThai?: string) {
    return this.prisma.lichKhoiHanh.findMany({
      where: trangThai ? { TrangThai: trangThai } : undefined,
      include: {
        Tour: { select: { TourID: true, MaTour: true, TenTour: true } },
        DieuPhoiTour: { include: { HuongDanVien: { include: { NhanVien: { select: { HoTen: true } } } } } },
      },
      orderBy: { NgayKhoiHanh: 'asc' },
    });
  }

  create(data: Prisma.LichKhoiHanhUncheckedCreateInput) {
    return this.prisma.lichKhoiHanh.create({ data });
  }

  update(id: number, data: Prisma.LichKhoiHanhUncheckedUpdateInput) {
    return this.prisma.lichKhoiHanh.update({ where: { LichID: id }, data });
  }
}

@Controller('departures')
export class DeparturesController {
  constructor(private service: DeparturesService) {}
  @Get() findAll(@Query('trangThai') t?: string) { return this.service.findAll(t); }
  @Post() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('Admin', 'Dieu hanh')
  create(@Body() b: Prisma.LichKhoiHanhUncheckedCreateInput) { return this.service.create(b); }
  @Patch(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('Admin', 'Dieu hanh')
  update(@Param('id', ParseIntPipe) id: number, @Body() b: Prisma.LichKhoiHanhUncheckedUpdateInput) { return this.service.update(id, b); }
}

@Injectable()
export class BookingsService {
  private savedQrList: Array<{
    id: string;
    maDon: string;
    chiTietId: number;
    hoTen: string;
    cccd: string | null;
    maQRVe: string;
    tenTour: string;
    ngayKhoiHanh: string;
    qrDataUrl: string;
    imageBase64?: string;
    savedAt: string;
  }> = [];

  constructor(private prisma: PrismaService, private mail: TicketMailService) {}

  async saveQrTicket(body: {
    maDon: string;
    chiTietId: number;
    hoTen?: string;
    cccd?: string;
    maQRVe?: string;
    tenTour?: string;
    ngayKhoiHanh?: string;
    qrDataUrl?: string;
    imageBase64?: string;
  }) {
    const id = `${body.maDon}_${body.chiTietId}`;
    const item = {
      id,
      maDon: body.maDon,
      chiTietId: Number(body.chiTietId),
      hoTen: body.hoTen || 'Hành khách',
      cccd: body.cccd || null,
      maQRVe: body.maQRVe || `VT-${body.maDon}-${body.chiTietId}`,
      tenTour: body.tenTour || 'Tour du lịch VietTour',
      ngayKhoiHanh: body.ngayKhoiHanh || '',
      qrDataUrl: body.qrDataUrl || '',
      imageBase64: body.imageBase64,
      savedAt: new Date().toISOString(),
    };
    this.savedQrList = [item, ...this.savedQrList.filter((x) => x.id !== id)].slice(0, 30);
    return item;
  }

  async getSavedQrTickets() {
    // Cập nhật trạng thái điểm danh thực tế từ CSDL cho danh sách ảnh QR đã lưu
    const ids = this.savedQrList.map((x) => x.chiTietId).filter((id) => id > 0);
    const rows = ids.length > 0
      ? await this.prisma.chiTietHanhKhach.findMany({
          where: { ChiTietID: { in: ids } },
          select: { ChiTietID: true, TrangThaiDiemDanh: true, HoTen: true, CCCD: true, MaQRVe: true },
        })
      : [];
    const map = new Map(rows.map((r) => [r.ChiTietID, r]));
    return this.savedQrList.map((item) => {
      const dbRow = map.get(item.chiTietId);
      return {
        ...item,
        hoTen: dbRow?.HoTen || item.hoTen,
        cccd: dbRow?.CCCD || item.cccd,
        maQRVe: dbRow?.MaQRVe || item.maQRVe,
        trangThaiDiemDanh: dbRow?.TrangThaiDiemDanh ?? 0,
      };
    });
  }

  findAll(q: { trangThai?: string; search?: string }) {
    return this.prisma.donDatTour.findMany({
      where: {
        ...(q.trangThai && { TrangThaiDon: q.trangThai }),
        ...(q.search && {
          OR: [
            { MaDon: { contains: q.search, mode: 'insensitive' } },
            { KhachHang: { HoTen: { contains: q.search, mode: 'insensitive' } } },
            { KhachHang: { SoDienThoai: { contains: q.search } } },
          ],
        }),
      },
      include: {
        KhachHang: { select: { HoTen: true, SoDienThoai: true, Email: true } },
        LichKhoiHanh: { select: { MaLich: true, NgayKhoiHanh: true, Tour: { select: { TenTour: true } } } },
        ThanhToan: { orderBy: { NgayThanhToan: 'desc' } },
      },
      orderBy: { NgayDat: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.donDatTour.findUniqueOrThrow({
      where: { DonHangID: id },
      include: { KhachHang: true, LichKhoiHanh: { include: { Tour: true } }, ChiTietHanhKhach: true, ThanhToan: true, HoaDon: true },
    });
  }

  /** Ghi nhận giao dịch thanh toán/đặt cọc và cập nhật trạng thái đơn trong 1 transaction. */
  async addPayment(id: number, body: { SoTien: number; HinhThucTT: string; NhanVienID?: number; GhiChu?: string }) {
    const amount = Number(body.SoTien);
    if (Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Số tiền thu phải lớn hơn 0');
    }
    const validMethods = ['VNPay', 'Chuyen khoan', 'Tien mat', 'MoMo'];
    const hinhThuc = validMethods.includes(body.HinhThucTT) ? body.HinhThucTT : 'Tien mat';

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT donhangid FROM dondattour WHERE donhangid = ${id} FOR UPDATE`;
      const don = await tx.donDatTour.findUniqueOrThrow({ where: { DonHangID: id } });
      if (don.TrangThaiDon === 'Da huy') throw new BadRequestException('Đơn đã hủy, không thể thu tiền');
      const daThu = Number(don.TienCoc) + amount;
      const phaiThu = Math.max(0, Number(don.TongTien) - Number(don.GiamGia || 0));
      const now = new Date();
      const timeLabel = `${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${now.toLocaleDateString('vi-VN')}`;

      await tx.thanhToan.create({
        data: {
          DonHangID: id,
          MaGiaoDich: `PT-${Date.now().toString().slice(-8)}`,
          SoTien: amount,
          HinhThucTT: hinhThuc,
          NhanVienID: body.NhanVienID,
          TrangThai: 'Thanh cong',
          GhiChu: body.GhiChu?.trim() || `Xác nhận thu ${hinhThuc === 'Tien mat' ? 'tiền mặt tại quầy' : 'chuyển khoản'} lúc ${timeLabel}`,
        },
      });
      return tx.donDatTour.update({
        where: { DonHangID: id },
        data: {
          TienCoc: daThu,
          TienConLai: Math.max(phaiThu - daThu, 0),
          TrangThaiDon: daThu >= phaiThu ? 'Da thanh toan' : 'Da dat coc',
          PhuongThucTT: hinhThuc,
        },
      });
    });

    if (updated.TrangThaiDon === 'Da thanh toan') {
      void this.mail.sendTicketEmail(updated.MaDon);
    }
    return updated;
  }

  /** Khách hàng xác nhận chọn hình thức Thanh toán tiền mặt tại quầy (chờ Admin xác nhận thu tiền) */
  async requestCashPayment(id: number, body?: { ghiChu?: string }) {
    const don = await this.prisma.donDatTour.findUnique({ where: { DonHangID: id } });
    if (!don) throw new NotFoundException('Không tìm thấy đơn đặt tour');
    if (don.TrangThaiDon === 'Da huy') throw new BadRequestException('Đơn đặt tour đã bị hủy');
    if (don.TrangThaiDon === 'Da thanh toan') return don;

    const now = new Date();
    const timeStr = `${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${now.toLocaleDateString('vi-VN')}`;
    const noteLine = `[ĐĂNG KÝ TIỀN MẶT TẠI QUẦY] ${timeStr} - ${body?.ghiChu || 'Khách xác nhận nộp tiền mặt tại quầy giao dịch VietTour (Chờ Admin thu tiền)'}`;
    const cleanedOld = (don.GhiChu || '')
      .split('\n')
      .filter((line) => !line.includes('[ĐĂNG KÝ TIỀN MẶT TẠI QUẦY]'))
      .join('\n')
      .trim();

    return this.prisma.donDatTour.update({
      where: { DonHangID: id },
      data: {
        PhuongThucTT: 'Tien mat',
        GhiChu: cleanedOld ? `${cleanedOld}\n${noteLine}` : noteLine,
      },
    });
  }

  /** Xác nhận thanh toán VietQR chuyển khoản ngân hàng 24/7 tức thì (kèm gửi email vé điện tử QR) */
  async confirmPayment(id: number, body: { hinhThucTT?: string; maGiaoDich?: string; ghiChu?: string }) {
    const result = await this.applyPayment(id, body);
    if (!result.alreadyPaid) void this.mail.sendTicketEmail(result.don.MaDon);
    return { message: result.message, don: result.don };
  }

  private async applyPayment(id: number, body: { hinhThucTT?: string; maGiaoDich?: string; ghiChu?: string }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT donhangid FROM dondattour WHERE donhangid = ${id} FOR UPDATE`;
      const don = await tx.donDatTour.findUniqueOrThrow({
        where: { DonHangID: id },
        include: { LichKhoiHanh: { include: { Tour: true } } },
      });
      if (don.TrangThaiDon === 'Da huy') throw new BadRequestException('Đơn hàng này đã bị hủy');
      if (don.TrangThaiDon === 'Da thanh toan') {
        return { message: 'Đơn hàng đã được thanh toán trước đó', don, alreadyPaid: true };
      }

      const phaiThu = Number(don.TongTien) - Number(don.GiamGia);
      const validMethods = ['VNPay', 'Chuyen khoan', 'Tien mat', 'MoMo'];
      const rawMethod = body.hinhThucTT || 'Chuyen khoan';
      const hinhThuc = validMethods.includes(rawMethod) ? rawMethod : 'Chuyen khoan';
      const maGiaoDich = body.maGiaoDich || `VQR-${Date.now().toString().slice(-8)}`;

      // Tạo giao dịch thanh toán (tuân thủ CHECK CONSTRAINT CSDL)
      await tx.thanhToan.create({
        data: {
          DonHangID: id,
          SoTien: phaiThu,
          HinhThucTT: hinhThuc,
          MaGiaoDich: maGiaoDich,
          TrangThai: 'Thanh cong',
          GhiChu: body.ghiChu || 'Thanh toán VietQR Napas 24/7',
        },
      });

      // Cập nhật đơn hàng thành đã thanh toán
      const updatedDon = await tx.donDatTour.update({
        where: { DonHangID: id },
        data: {
          TienCoc: phaiThu,
          TienConLai: 0,
          TrangThaiDon: 'Da thanh toan',
          PhuongThucTT: hinhThuc,
        },
        include: { ChiTietHanhKhach: true, KhachHang: true, LichKhoiHanh: { include: { Tour: true } } },
      });

      return {
        message: 'Xác nhận thanh toán thành công!',
        don: updatedDon,
        alreadyPaid: false,
      };
    });
  }

  /** Xác nhận thanh toán trực tiếp qua Mã Đơn (dành cho Mobile Sandbox QR Checkout) */
  async confirmByMaDon(maDon: string, body: { hinhThucTT?: string; maGiaoDich?: string; ghiChu?: string }) {
    const don = await this.prisma.donDatTour.findUnique({
      where: { MaDon: maDon },
    });
    if (!don) throw new NotFoundException(`Không tìm thấy đơn hàng có mã: ${maDon}`);
    return this.confirmPayment(don.DonHangID, body);
  }

  /** Kiểm tra hiệu lực và tính số tiền giảm giá của Mã Khuyến Mãi (Voucher) */
  async validateVoucher(
    maKM: string,
    tongTienDon?: number,
    tourId?: number,
    lichId?: number,
    adults?: number,
    children?: number,
  ) {
    let resolvedTongTien = Number(tongTienDon || 0);
    let resolvedTourId = tourId;
    if ((!resolvedTongTien || resolvedTongTien <= 0) && lichId) {
      const lich = await this.prisma.lichKhoiHanh.findUnique({
        where: { LichID: Number(lichId) },
        include: { Tour: true },
      });
      if (lich?.Tour) {
        resolvedTourId = lich.TourID;
        const nl = Number(adults ?? 1);
        const te = Number(children ?? 0);
        resolvedTongTien = nl * Number(lich.Tour.GiaNguoiLon) + te * Number(lich.Tour.GiaTreEm);
      }
    }
    const res = await evaluateVoucher(this.prisma, maKM, resolvedTongTien, resolvedTourId);
    return {
      valid: true,
      voucherId: res.voucherId,
      khuyenMaiId: res.voucherId,
      maVoucher: res.maVoucher,
      maKhuyenMai: res.maVoucher,
      tenChuongTrinh: res.tenChuongTrinh,
      phanTramGiam: res.phanTramGiam,
      giamGia: res.giamGia,
      tongTienSauGiam: res.tongTienSauGiam,
    };
  }

  private getLocalLanIp(): string | null {
    try {
      const nets = networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
          if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.')) {
            return net.address;
          }
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  /** Tra cứu vé điện tử (E-Ticket) công khai theo Mã Đơn hoặc Mã QR */
  async getTicket(codeOrMaDon: string) {
    let targetMaDon = codeOrMaDon.trim();
    // Hỗ trợ khi quét mã QR định dạng VT-BK-xxxxxx-1-xxxx
    const matchBk = targetMaDon.match(/(BK-[A-Z0-9-]+)/i);
    if (targetMaDon.startsWith('VT-') && matchBk) {
      const parts = targetMaDon.split('-');
      if (parts.length >= 3 && parts[1] === 'BK') {
        targetMaDon = `BK-${parts[2]}`;
      }
    }

    const don = await this.prisma.donDatTour.findUnique({
      where: { MaDon: targetMaDon },
      include: {
        KhachHang: true,
        ChiTietHanhKhach: true,
        ThanhToan: { orderBy: { NgayThanhToan: 'desc' } },
        LichKhoiHanh: {
          include: {
            Tour: true,
            DieuPhoiTour: {
              include: {
                HuongDanVien: {
                  include: {
                    NhanVien: { select: { HoTen: true, SoDienThoai: true, Email: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!don) {
      throw new NotFoundException(`Không tìm thấy thông tin đặt chỗ cho mã: ${codeOrMaDon}`);
    }

    return {
      ...don,
      lanIp: this.getLocalLanIp(),
    };
  }

  /** Hướng dẫn viên điểm danh hành khách bằng quét mã QR (Check-in) */
  async checkInPassenger(chiTietId: number) {
    const hk = await this.prisma.chiTietHanhKhach.findUnique({
      where: { ChiTietID: chiTietId },
      include: { DonDatTour: true },
    });

    if (!hk) {
      throw new NotFoundException('Không tìm thấy thông tin hành khách này');
    }

    if (hk.DonDatTour.TrangThaiDon !== 'Da thanh toan' && hk.DonDatTour.TrangThaiDon !== 'Hoan thanh') {
      throw new BadRequestException('Đơn đặt tour chưa hoàn tất thanh toán nên chưa phát hành vé điện tử và không thể điểm danh!');
    }

    const alreadyCheckedIn = hk.TrangThaiDiemDanh === 1;
    const updated = alreadyCheckedIn
      ? hk
      : await this.prisma.chiTietHanhKhach.update({
          where: { ChiTietID: chiTietId },
          data: { TrangThaiDiemDanh: 1 },
        });

    return {
      message: alreadyCheckedIn
        ? `Hành khách ${hk.HoTen} đã được điểm danh trước đó!`
        : `Điểm danh thành công cho hành khách ${hk.HoTen}!`,
      alreadyCheckedIn,
      hanhKhach: updated,
      maDon: hk.DonDatTour.MaDon,
    };
  }

  /** Hướng dẫn viên tải ảnh QR lên hoặc quét chuỗi mã QR để điểm danh tự động */
  async checkInByQrContent(rawInput: string) {
    const text = (rawInput || '').trim();
    if (!text) {
      throw new BadRequestException('Không đọc được dữ liệu mã QR từ ảnh tải lên!');
    }

    // 1. Kiểm tra nếu chuỗi có chứa tham số ?khach=123 hoặc chiTietId
    const khachParamMatch = text.match(/[?&]khach=(\d+)/i) || text.match(/chiTietId[=:_"']+(\d+)/i) || text.match(/VT_QR_BK-[A-Z0-9-]+_(\d+)/i);
    if (khachParamMatch) {
      const cid = Number(khachParamMatch[1]);
      if (cid > 0) {
        const res = await this.checkInPassenger(cid);
        const ticket = await this.getTicket(res.maDon);
        return { ...res, ticket };
      }
    }

    // 2. Kiểm tra nếu chuỗi là Mã QR Vé (VD: VT-BK-24235665-1-2369)
    const vtMatch = text.match(/(VT-BK-[A-Z0-9-]+)/i);
    if (vtMatch) {
      const hkByQr = await this.prisma.chiTietHanhKhach.findFirst({
        where: { MaQRVe: { equals: vtMatch[1], mode: 'insensitive' } },
      });
      if (hkByQr) {
        const res = await this.checkInPassenger(hkByQr.ChiTietID);
        const ticket = await this.getTicket(res.maDon);
        return { ...res, ticket };
      }
    }

    // 3. Kiểm tra nếu chuỗi có chứa Mã Đơn (VD: BK-24235665)
    const bkMatch = text.match(/(BK-[A-Z0-9]+)/i);
    if (bkMatch) {
      const maDon = bkMatch[1].toUpperCase();
      const don = await this.prisma.donDatTour.findUnique({
        where: { MaDon: maDon },
        include: { ChiTietHanhKhach: true },
      });
      if (!don) {
        throw new NotFoundException(`Không tìm thấy đơn đặt tour có mã ${maDon}`);
      }
      const targetPassenger =
        don.ChiTietHanhKhach.find((p) => p.TrangThaiDiemDanh !== 1) ||
        don.ChiTietHanhKhach[0];
      if (!targetPassenger) {
        throw new BadRequestException(`Đơn ${maDon} chưa có danh sách hành khách`);
      }
      const res = await this.checkInPassenger(targetPassenger.ChiTietID);
      const ticket = await this.getTicket(maDon);
      return { ...res, ticket };
    }

    // 4. Nếu là số nguyên dương (ChiTietID trực tiếp)
    if (/^\d+$/.test(text)) {
      const res = await this.checkInPassenger(Number(text));
      const ticket = await this.getTicket(res.maDon);
      return { ...res, ticket };
    }

    throw new BadRequestException('Không tìm thấy thông tin vé hợp lệ từ ảnh QR đã tải lên!');
  }

  /**
   * Hủy đơn đặt tour:
   * - Khóa hàng DonDatTour & LichKhoiHanh bằng SELECT ... FOR UPDATE.
   * - Hoàn trả số chỗ về LichKhoiHanh.SoChoDaDat.
   * - Tính mức phí phạt hủy tour theo mốc thời gian trước ngày khởi hành (diffDays):
   *   + Trước >= 15 ngày: Miễn phí (0%), hoàn 100% số tiền đã đóng.
   *   + Từ 7 đến 14 ngày: Phạt 30% giá trị đơn sau giảm, hoàn phần còn lại.
   *   + Từ 3 đến 6 ngày: Phạt 60% giá trị đơn sau giảm.
   *   + Dưới 3 ngày: Phạt 100% giá trị đơn.
   *   + Nếu Quản trị viên/Điều hành hủy do lý do bất khả kháng của công ty: Phạt 0%, hoàn 100%.
   */
  async cancel(id: number, lyDoHuy?: string, actorEmail?: string, actorRoles?: string[]) {
    const reason = String(lyDoHuy || '').trim() || 'Khách hàng hủy đơn trực tuyến';
    const isStaffCancel = Array.isArray(actorRoles) && actorRoles.some((r) => ['Admin', 'Dieu hanh', 'Ke toan'].includes(r));

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT donhangid FROM dondattour WHERE donhangid = ${id} FOR UPDATE`;
      const current = await tx.donDatTour.findUniqueOrThrow({
        where: { DonHangID: id },
        include: { LichKhoiHanh: true, ThanhToan: true },
      });
      if (current.TrangThaiDon === 'Da huy') throw new BadRequestException('Đơn đã được hủy trước đó');
      await tx.$queryRaw`SELECT lichid FROM lichkhoihanh WHERE lichid = ${current.LichID} FOR UPDATE`;

      const now = new Date();
      const diffMs = current.LichKhoiHanh.NgayKhoiHanh.getTime() - now.getTime();
      const diffDays = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));

      // Xác định tỷ lệ phạt hủy theo chính sách hợp đồng lữ hành
      let tyLePhat = 0;
      if (!isStaffCancel) {
        if (diffDays >= 15) tyLePhat = 0;
        else if (diffDays >= 7) tyLePhat = 30;
        else if (diffDays >= 3) tyLePhat = 60;
        else tyLePhat = 100;
      }

      const giaTriDonSauGiam = Math.max(0, Number(current.TongTien) - Number(current.GiamGia || 0));
      const daThu = Math.max(
        current.ThanhToan.filter((t) => t.TrangThai === 'Thanh cong').reduce((s, t) => s + Number(t.SoTien), 0),
        Number(current.TienCoc || 0),
      );
      const phiPhatTheoChinhSach = Math.round((giaTriDonSauGiam * tyLePhat) / 100);
      const phiPhatThucTe = daThu > 0 ? Math.min(daThu, phiPhatTheoChinhSach) : 0;
      const soTienHoan = Math.max(0, daThu - phiPhatThucTe);

      // Nếu khách đã đóng tiền và có số tiền được hoàn trả -> tự động ghi nhận giao dịch Hoàn tiền
      if (soTienHoan > 0) {
        await tx.thanhToan.create({
          data: {
            DonHangID: id,
            MaGiaoDich: `RF-${Date.now().toString().slice(-8)}`,
            SoTien: soTienHoan,
            HinhThucTT: current.PhuongThucTT || 'Chuyen khoan',
            TrangThai: 'Da hoan tien',
            GhiChu: `Hoàn tiền hủy tour (${100 - tyLePhat}% - hủy trước ${diffDays} ngày). Phí phạt giữ lại: ${phiPhatThucTe.toLocaleString('vi-VN')} đ`,
          },
        });
      }

      const dateStr = now.toLocaleDateString('vi-VN');
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const actorInfo = actorEmail ? ` (bởi ${actorEmail})` : '';
      const policyNote = daThu > 0
        ? ` | Chính sách hủy (trước ${diffDays} ngày, phạt ${tyLePhat}%): Phí giữ lại ${phiPhatThucTe.toLocaleString('vi-VN')}đ, Hoàn trả ${soTienHoan.toLocaleString('vi-VN')}đ`
        : '';
      const prefixTag = isStaffCancel ? '[QUẢN TRỊ VIÊN HỦY]' : '[KHÁCH HÀNG HỦY]';
      const cancelNote = `${prefixTag} ${timeStr} ${dateStr}${actorInfo} - Lý do: ${reason}${policyNote}`;
      const newGhiChu = current.GhiChu ? `${current.GhiChu}\n${cancelNote}` : cancelNote;

      const don = await tx.donDatTour.update({
        where: { DonHangID: id },
        data: {
          TrangThaiDon: 'Da huy',
          GhiChu: newGhiChu,
        },
      });
      await tx.lichKhoiHanh.update({
        where: { LichID: don.LichID },
        data: { SoChoDaDat: { decrement: don.SoLuongNguoiLon + don.SoLuongTreEm } },
      });
      return {
        ...don,
        chinhSachHuy: {
          soNgayTruocKhoiHanh: diffDays,
          tyLePhatPhanTram: tyLePhat,
          daThu,
          phiPhatGiuLai: phiPhatThucTe,
          soTienHoanTra: soTienHoan,
        },
      };
    });
  }

  updateStatus(id: number, TrangThaiDon: string) {
    return this.prisma.donDatTour.update({ where: { DonHangID: id }, data: { TrangThaiDon } });
  }
}

const STAFF = ['Admin', 'Dieu hanh', 'Ke toan'] as const;

@Controller('bookings')
export class BookingsController {
  constructor(private service: BookingsService) {}

  @Get() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(...STAFF)
  findAll(@Query() q: Record<string, string>) { return this.service.findAll(q); }
  // Công khai: mã đơn đóng vai trò mã tra cứu vé
  @Get('ticket/:maDon') getTicket(@Param('maDon') maDon: string) { return this.service.getTicket(maDon); }
  // Công khai: khách xem trước mã giảm giá
  @Post('voucher/validate') validateVoucher(
    @Body() b: { maKhuyenMai: string; tongTien?: number; tourId?: number; lichId?: number; soLuongNguoiLon?: number; soLuongTreEm?: number },
  ) {
    return this.service.validateVoucher(
      b.maKhuyenMai,
      b.tongTien ? Number(b.tongTien) : undefined,
      b.tourId ? Number(b.tourId) : undefined,
      b.lichId ? Number(b.lichId) : undefined,
      b.soLuongNguoiLon,
      b.soLuongTreEm,
    );
  }
  // Cho phép điểm danh từ trang xác thực vé QR (chỉ cho phép khi đơn đã thanh toán đủ)
  @Post('checkin/:chiTietId')
  checkInPassenger(@Param('chiTietId', ParseIntPipe) chiTietId: number) {
    return this.service.checkInPassenger(chiTietId);
  }
  // Điểm danh tự động bằng nội dung hoặc ảnh QR tải lên
  @Post('checkin-by-qr')
  checkInByQr(@Body() body: { qrContent: string }) {
    return this.service.checkInByQrContent(body.qrContent);
  }
  // Lưu & lấy danh sách ảnh Vé QR đã tải về máy để Hướng dẫn viên chọn nhanh khi demo
  @Post('saved-qr')
  saveQr(@Body() body: {
    maDon: string;
    chiTietId: number;
    hoTen?: string;
    cccd?: string;
    maQRVe?: string;
    tenTour?: string;
    ngayKhoiHanh?: string;
    qrDataUrl?: string;
    imageBase64?: string;
  }) {
    return this.service.saveQrTicket(body);
  }
  @Get('saved-qr/list')
  getSavedQrList() {
    return this.service.getSavedQrTickets();
  }
  @Get(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(...STAFF)
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post(':id/payments') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(...STAFF)
  pay(@Param('id', ParseIntPipe) id: number, @Body() b: { SoTien: number; HinhThucTT: string; NhanVienID?: number; GhiChu?: string }) {
    return this.service.addPayment(id, b);
  }
  // Khách hàng xác nhận chọn hình thức nộp tiền mặt tại quầy (chờ Admin xác nhận thu)
  @Post(':id/request-cash')
  requestCash(@Param('id', ParseIntPipe) id: number, @Body() b?: { ghiChu?: string }) {
    return this.service.requestCashPayment(id, b);
  }
  // Luồng thanh toán sandbox/VietQR của khách (chưa có webhook ngân hàng) nên giữ công khai
  @Post(':id/confirm-payment') confirmPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: { hinhThucTT?: string; maGiaoDich?: string; ghiChu?: string },
  ) {
    return this.service.confirmPayment(id, b);
  }
  @Post('confirm-by-madon/:maDon') confirmByMaDon(
    @Param('maDon') maDon: string,
    @Body() b: { hinhThucTT?: string; maGiaoDich?: string; ghiChu?: string },
  ) {
    return this.service.confirmByMaDon(maDon, b);
  }
  @Post(':id/cancel') @UseGuards(JwtAuthGuard)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body('lyDoHuy') lyDoHuy?: string,
    @Req() req?: { user?: { email?: string; roles?: string[] } },
  ) {
    return this.service.cancel(id, lyDoHuy, req?.user?.email, req?.user?.roles);
  }
  @Patch(':id/status') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(...STAFF)
  status(@Param('id', ParseIntPipe) id: number, @Body('TrangThaiDon') s: string) { return this.service.updateStatus(id, s); }
}

@Module({ imports: [ExportModule], controllers: [DeparturesController, BookingsController], providers: [DeparturesService, BookingsService] })
export class BookingsModule {}
