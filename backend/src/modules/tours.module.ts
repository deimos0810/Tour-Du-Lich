import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module.js';

// PHÃ‚N Há»† 2: Quáº£n lÃ½ danh má»¥c tour & lá»‹ch trÃ¬nh
@Injectable()
export class ToursService {
  constructor(private prisma: PrismaService) {}

  findAll(q: { search?: string; danhMucId?: string; trangThai?: string; diemDen?: string }) {
    const where: Prisma.TourWhereInput = {
      ...(q.search && {
        OR: [
          { TenTour: { contains: q.search, mode: 'insensitive' } },
          { MaTour: { contains: q.search, mode: 'insensitive' } },
        ],
      }),
      ...(q.danhMucId && { DanhMucID: Number(q.danhMucId) }),
      ...(q.trangThai && { TrangThaiDuyet: q.trangThai }),
      ...(q.diemDen && { DiemDen: { contains: q.diemDen, mode: 'insensitive' } }),
    };
    return this.prisma.tour.findMany({
      where,
      include: {
        DanhMuc: true,
        LichKhoiHanh: {
          orderBy: { NgayKhoiHanh: 'asc' },
        },
        DanhGia: {
          include: {
            KhachHang: { select: { HoTen: true } },
          },
          orderBy: { NgayDanhGia: 'desc' },
        },
      },
      orderBy: { NgayTao: 'desc' },
    });
  }

  async findOne(id: number) {
    const tour = await this.prisma.tour.findUnique({
      where: { TourID: id },
      include: {
        DanhMuc: true,
        LichKhoiHanh: { orderBy: { NgayKhoiHanh: 'asc' } },
        DanhGia: {
          include: {
            KhachHang: { select: { HoTen: true } },
          },
          orderBy: { NgayDanhGia: 'desc' },
        },
      },
    });
    if (!tour) throw new NotFoundException('Không tìm thấy tour');
    return tour;
  }

  create(data: Prisma.TourUncheckedCreateInput) {
    return this.prisma.tour.create({ data });
  }

  update(id: number, data: Prisma.TourUncheckedUpdateInput) {
    return this.prisma.tour.update({ where: { TourID: id }, data: { ...data, NgayCapNhat: new Date() } });
  }

  remove(id: number) {
    return this.prisma.tour.delete({ where: { TourID: id } });
  }

  categories() {
    return this.prisma.danhMucTour.findMany({ orderBy: { DanhMucID: 'asc' } });
  }
}

@Controller('tours')
export class ToursController {
  constructor(private service: ToursService) {}

  @Get('categories') categories() { return this.service.categories(); }
  @Get() findAll(@Query() q: Record<string, string>) { return this.service.findAll(q); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Post() create(@Body() body: Prisma.TourUncheckedCreateInput) { return this.service.create(body); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() body: Prisma.TourUncheckedUpdateInput) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}

@Module({ controllers: [ToursController], providers: [ToursService] })
export class ToursModule {}
