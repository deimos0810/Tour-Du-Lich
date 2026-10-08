import { BadRequestException, Body, Controller, Get, Injectable, Module, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module.js';

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  customers(search?: string) {
    return this.prisma.khachHang.findMany({
      where: search ? { OR: [{ HoTen: { contains: search, mode: 'insensitive' } }, { SoDienThoai: { contains: search } }, { CCCD: { contains: search } }] } : undefined,
      include: { _count: { select: { DonDatTour: true } } },
      orderBy: { KhachHangID: 'desc' },
    });
  }

  customerHistory(id: number) {
    return this.prisma.donDatTour.findMany({
      where: { KhachHangID: id },
      include: { LichKhoiHanh: { include: { Tour: { select: { TenTour: true, MaTour: true } } } } },
      orderBy: { NgayDat: 'desc' },
    });
  }

  guides(trangThai?: string) {
    return this.prisma.huongDanVien.findMany({
      where: trangThai ? { TrangThai: trangThai } : undefined,
      include: { NhanVien: { select: { HoTen: true, SoDienThoai: true, Email: true } } },
    });
  }

  /** Phân công Hướng dẫn viên kèm kiểm tra trùng lịch dẫn đoàn */
  async assignGuide(data: Prisma.DieuPhoiTourUncheckedCreateInput) {
    const targetLich = await this.prisma.lichKhoiHanh.findUniqueOrThrow({
      where: { LichID: data.LichID },
    });

    // Kiểm tra HDV có bị trùng lịch dẫn tour khác trong cùng khoảng thời gian không
    const conflict = await this.prisma.dieuPhoiTour.findFirst({
      where: {
        HDVID: data.HDVID,
        LichKhoiHanh: {
          OR: [
            {
              NgayKhoiHanh: { lte: targetLich.NgayKetThuc },
              NgayKetThuc: { gte: targetLich.NgayKhoiHanh },
            },
          ],
        },
      },
    });

    if (conflict) {
      throw new BadRequestException('Hướng dẫn viên này đã được phân công dẫn đoàn khác trong cùng khoảng thời gian!');
    }

    return this.prisma.dieuPhoiTour.create({ data });
  }

  suppliers(loai?: string) {
    return this.prisma.nhaCungCap.findMany({ where: loai ? { LoaiNCC: loai } : undefined, include: { DichVu: true } });
  }

  createSupplier(data: Prisma.NhaCungCapCreateInput) {
    return this.prisma.nhaCungCap.create({ data });
  }

  serviceOrders(lichId?: number) {
    return this.prisma.phieuDatDichVu.findMany({
      where: lichId ? { LichID: lichId } : undefined,
      include: { NhaCungCap: true, ChiTiet: { include: { DichVu: true } } },
    });
  }

  settlements() {
    return this.prisma.baoCaoQuyetToan.findMany({
      include: { LichKhoiHanh: { include: { Tour: { select: { TenTour: true } } } }, NhanVienLap: { select: { HoTen: true } } },
      orderBy: { NgayLap: 'desc' },
    });
  }

  /** Lập quyết toán tự động trong Database Transaction: TongThu - TongChi = LoiNhuan */
  async createSettlement(lichId: number, nhanVienLapId: number) {
    return this.prisma.$transaction(async (tx) => {
      const [thu, chi] = await Promise.all([
        tx.donDatTour.aggregate({ where: { LichID: lichId, TrangThaiDon: { not: 'Da huy' } }, _sum: { TongTien: true } }),
        tx.phieuDatDichVu.aggregate({ where: { LichID: lichId }, _sum: { TongTienDichVu: true } }),
      ]);

      const tongThu = Number(thu._sum.TongTien ?? 0);
      const tongChi = Number(chi._sum.TongTienDichVu ?? 0);

      return tx.baoCaoQuyetToan.create({
        data: {
          LichID: lichId,
          NhanVienLapID: nhanVienLapId,
          TongThu: tongThu,
          TongChi: tongChi,
          TrangThaiDuyet: 'Da trinh duyet',
        },
      });
    });
  }

  /** Phê duyệt quyết toán và cập nhật khóa chỉnh sửa sổ sách kế toán */
  async approveSettlement(id: number, trangThaiDuyet: string) {
    return this.prisma.baoCaoQuyetToan.update({
      where: { QuyetToanID: id },
      data: { TrangThaiDuyet: trangThaiDuyet ?? 'Da phe duyet' },
    });
  }
}

@Controller()
export class OperationsController {
  constructor(private s: OperationsService) {}

  @Get('customers') customers(@Query('search') q?: string) { return this.s.customers(q); }
  @Get('customers/:id/history') history(@Param('id', ParseIntPipe) id: number) { return this.s.customerHistory(id); }

  @Get('guides') guides(@Query('trangThai') t?: string) { return this.s.guides(t); }
  @Post('guides/assign') assign(@Body() b: Prisma.DieuPhoiTourUncheckedCreateInput) { return this.s.assignGuide(b); }

  @Get('suppliers') suppliers(@Query('loai') l?: string) { return this.s.suppliers(l); }
  @Post('suppliers') createSupplier(@Body() b: Prisma.NhaCungCapCreateInput) { return this.s.createSupplier(b); }
  @Get('service-orders') orders(@Query('lichId') l?: string) { return this.s.serviceOrders(l ? Number(l) : undefined); }

  @Get('settlements') settlements() { return this.s.settlements(); }
  @Post('settlements') createSettlement(@Body() b: { LichID: number; NhanVienLapID: number }) { return this.s.createSettlement(b.LichID, b.NhanVienLapID); }
  @Patch('settlements/:id/approve') approve(@Param('id', ParseIntPipe) id: number, @Body('TrangThaiDuyet') t: string) { return this.s.approveSettlement(id, t ?? 'Da phe duyet'); }
}

@Module({ controllers: [OperationsController], providers: [OperationsService] })
export class OperationsModule {}
