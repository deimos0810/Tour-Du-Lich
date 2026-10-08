import { BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module.js';

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
  @Post() create(@Body() b: Prisma.LichKhoiHanhUncheckedCreateInput) { return this.service.create(b); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() b: Prisma.LichKhoiHanhUncheckedUpdateInput) { return this.service.update(id, b); }
}

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

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
  async addPayment(id: number, body: { SoTien: number; HinhThucTT: string; NhanVienID?: number }) {
    return this.prisma.$transaction(async (tx) => {
      const don = await tx.donDatTour.findUniqueOrThrow({ where: { DonHangID: id } });
      if (don.TrangThaiDon === 'Da huy') throw new BadRequestException('Đơn đã hủy');
      const daThu = Number(don.TienCoc) + body.SoTien;
      const phaiThu = Number(don.TongTien) - Number(don.GiamGia);
      await tx.thanhToan.create({
        data: { DonHangID: id, SoTien: body.SoTien, HinhThucTT: body.HinhThucTT, NhanVienID: body.NhanVienID, TrangThai: 'Thanh cong' },
      });
      return tx.donDatTour.update({
        where: { DonHangID: id },
        data: {
          TienCoc: daThu,
          TienConLai: Math.max(phaiThu - daThu, 0),
          TrangThaiDon: daThu >= phaiThu ? 'Da thanh toan' : 'Da dat coc',
          PhuongThucTT: body.HinhThucTT,
        },
      });
    });
  }

  /** Xác nhận thanh toán VietQR chuyển khoản ngân hàng 24/7 tức thì */
  async confirmPayment(id: number, body: { hinhThucTT?: string; maGiaoDich?: string; ghiChu?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const don = await tx.donDatTour.findUniqueOrThrow({
        where: { DonHangID: id },
        include: { LichKhoiHanh: { include: { Tour: true } } },
      });
      if (don.TrangThaiDon === 'Da huy') throw new BadRequestException('Đơn hàng này đã bị hủy');

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
  async validateVoucher(maKM: string, tongTienDon: number) {
    const km = await this.prisma.khuyenMai.findUnique({
      where: { MaKhuyenMai: maKM },
    });

    if (!km || km.TrangThai === 0) {
      throw new BadRequestException('Mã ưu đãi không tồn tại hoặc đã tạm dừng áp dụng!');
    }

    const now = new Date();
    // Bắt buộc kiểm tra NgayKetThucKM và NgayBatDau theo ràng buộc toàn vẹn của Đề tài
    if (now < km.NgayBatDau || now > km.NgayKetThucKM) {
      throw new BadRequestException('Mã ưu đãi đã hết hạn sử dụng!');
    }

    if (tongTienDon < Number(km.GiaTriDonToiThieu)) {
      throw new BadRequestException(
        `Đơn hàng cần đạt tối thiểu ${Number(km.GiaTriDonToiThieu).toLocaleString('vi-VN')} đ để dùng mã này!`,
      );
    }

    let giamGia = Math.round((tongTienDon * Number(km.PhanTramGiam)) / 100);
    if (giamGia > Number(km.GiamToiDa)) {
      giamGia = Number(km.GiamToiDa);
    }

    return {
      valid: true,
      khuyenMaiId: km.KhuyenMaiID,
      maKhuyenMai: km.MaKhuyenMai,
      tenChuongTrinh: km.TenChuongTrinh,
      phanTramGiam: Number(km.PhanTramGiam),
      giamGia,
      tongTienSauGiam: Math.max(tongTienDon - giamGia, 0),
    };
  }

  /** Tra cứu vé điện tử (E-Ticket) công khai theo Mã Đơn hoặc Mã QR */
  async getTicket(maDon: string) {
    const don = await this.prisma.donDatTour.findUnique({
      where: { MaDon: maDon },
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
      throw new NotFoundException(`Không tìm thấy vé điện tử cho mã đơn: ${maDon}`);
    }

    return don;
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

    const updated = await this.prisma.chiTietHanhKhach.update({
      where: { ChiTietID: chiTietId },
      data: { TrangThaiDiemDanh: 1 },
    });

    return {
      message: `Điểm danh thành công cho hành khách ${hk.HoTen}!`,
      hanhKhach: updated,
    };
  }

  /** Hủy đơn: hoàn lại số chỗ cho lịch khởi hành. */
  async cancel(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const don = await tx.donDatTour.update({ where: { DonHangID: id }, data: { TrangThaiDon: 'Da huy' } });
      await tx.lichKhoiHanh.update({
        where: { LichID: don.LichID },
        data: { SoChoDaDat: { decrement: don.SoLuongNguoiLon + don.SoLuongTreEm } },
      });
      return don;
    });
  }

  updateStatus(id: number, TrangThaiDon: string) {
    return this.prisma.donDatTour.update({ where: { DonHangID: id }, data: { TrangThaiDon } });
  }
}

@Controller('bookings')
export class BookingsController {
  constructor(private service: BookingsService) {}

  @Get() findAll(@Query() q: Record<string, string>) { return this.service.findAll(q); }
  @Get('ticket/:maDon') getTicket(@Param('maDon') maDon: string) { return this.service.getTicket(maDon); }
  @Post('voucher/validate') validateVoucher(@Body() b: { maKhuyenMai: string; tongTien: number }) {
    return this.service.validateVoucher(b.maKhuyenMai, b.tongTien);
  }
  @Post('checkin/:chiTietId') checkInPassenger(@Param('chiTietId', ParseIntPipe) chiTietId: number) {
    return this.service.checkInPassenger(chiTietId);
  }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post(':id/payments') pay(@Param('id', ParseIntPipe) id: number, @Body() b: { SoTien: number; HinhThucTT: string; NhanVienID?: number }) {
    return this.service.addPayment(id, b);
  }
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
  @Post(':id/cancel') cancel(@Param('id', ParseIntPipe) id: number) { return this.service.cancel(id); }
  @Patch(':id/status') status(@Param('id', ParseIntPipe) id: number, @Body('TrangThaiDon') s: string) { return this.service.updateStatus(id, s); }
}

@Module({ controllers: [DeparturesController, BookingsController], providers: [DeparturesService, BookingsService] })
export class BookingsModule {}
