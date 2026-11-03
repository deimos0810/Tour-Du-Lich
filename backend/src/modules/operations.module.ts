import { BadRequestException, Body, Controller, Get, Injectable, Module, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

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
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Dieu hanh', 'Ke toan')
export class OperationsController {
  constructor(private s: OperationsService) {}

  @Get('customers') customers(@Query('search') q?: string) { return this.s.customers(q); }
  @Get('customers/:id/history') history(@Param('id', ParseIntPipe) id: number) { return this.s.customerHistory(id); }

  @Get('guides') guides(@Query('trangThai') t?: string) { return this.s.guides(t); }
  @Post('guides/assign') assign(@Body() b: Prisma.DieuPhoiTourUncheckedCreateInput) { return this.s.assignGuide(b); }
}

@Module({ controllers: [OperationsController], providers: [OperationsService] })
export class OperationsModule {}
