import { BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
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

  /** Chỉ nhận các trường hợp lệ từ form, ép kiểu số và kiểm tra ràng buộc nghiệp vụ. */
  private sanitize(body: Record<string, unknown>, isCreate: boolean) {
    const str = (k: string) => (body[k] === undefined ? undefined : body[k] === null || body[k] === '' ? null : String(body[k]).trim());
    const num = (k: string) => (body[k] === undefined || body[k] === '' ? undefined : Number(body[k]));
    const data: Record<string, unknown> = {
      TenTour: str('TenTour'),
      DanhMucID: num('DanhMucID'),
      ThoiGian: str('ThoiGian'),
      DiemKhoiHanh: str('DiemKhoiHanh'),
      DiemDen: str('DiemDen'),
      MoTaChiTiet: str('MoTaChiTiet'),
      LichTrinh: str('LichTrinh'),
      DichVuDiKem: str('DichVuDiKem'),
      PhongCachTour: str('PhongCachTour'),
      PhuongTien: str('PhuongTien'),
      HinhAnhURL: str('HinhAnhURL'),
      TrangThaiDuyet: str('TrangThaiDuyet'),
      GiaNguoiLon: num('GiaNguoiLon'),
      GiaTreEm: num('GiaTreEm'),
      PhuThuPhongDon: num('PhuThuPhongDon'),
    };
    if (isCreate) data.NhanVienTaoID = num('NhanVienTaoID');
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    if (isCreate) {
      for (const k of ['TenTour', 'DanhMucID', 'ThoiGian', 'DiemKhoiHanh', 'DiemDen', 'GiaNguoiLon', 'GiaTreEm', 'NhanVienTaoID']) {
        if (data[k] === undefined || data[k] === null || Number.isNaN(data[k])) throw new BadRequestException(`Thiếu hoặc sai trường bắt buộc: ${k}`);
      }
    }
    for (const k of ['GiaNguoiLon', 'GiaTreEm', 'PhuThuPhongDon']) {
      if (data[k] !== undefined && (Number.isNaN(data[k]) || (data[k] as number) < 0)) throw new BadRequestException(`${k} phải là số không âm`);
    }
    if (data.GiaNguoiLon !== undefined && data.GiaTreEm !== undefined && (data.GiaTreEm as number) > (data.GiaNguoiLon as number)) {
      throw new BadRequestException('Giá trẻ em không được lớn hơn giá người lớn');
    }
    const validStatus = ['Nhap', 'Cho duyet', 'Da duyet', 'Dang mo ban', 'Dong ban', 'Huy'];
    if (data.TrangThaiDuyet && !validStatus.includes(data.TrangThaiDuyet as string)) throw new BadRequestException('Trạng thái tour không hợp lệ');
    return data;
  }

  async create(body: Record<string, unknown>) {
    const data = this.sanitize(body, true);
    let maTour = body.MaTour ? String(body.MaTour).trim().toUpperCase() : '';
    if (!maTour) {
      const count = await this.prisma.tour.count();
      maTour = `VT${String(count + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
    }
    if (await this.prisma.tour.findUnique({ where: { MaTour: maTour } })) throw new BadRequestException(`Mã tour ${maTour} đã tồn tại`);
    return this.prisma.tour.create({ data: { ...(data as Prisma.TourUncheckedCreateInput), MaTour: maTour } });
  }

  async update(id: number, body: Record<string, unknown>) {
    const data = this.sanitize(body, false);
    return this.prisma.tour.update({ where: { TourID: id }, data: { ...(data as Prisma.TourUncheckedUpdateInput), NgayCapNhat: new Date() } });
  }

  async remove(id: number) {
    const soLich = await this.prisma.lichKhoiHanh.count({ where: { TourID: id } });
    if (soLich > 0) {
      throw new BadRequestException(`Tour đã có ${soLich} lịch khởi hành — không thể xóa. Hãy chuyển trạng thái sang "Đóng bán".`);
    }
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
  @Post() create(@Body() body: Record<string, unknown>) { return this.service.create(body); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}

@Module({ controllers: [ToursController], providers: [ToursService] })
export class ToursModule {}
