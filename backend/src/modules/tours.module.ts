import { BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module.js';
import { decorateToursWithPromo } from '../common/promotion.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

// PHÂN HỆ 2: Quản lý danh mục tour & lịch trình
@Injectable()
export class ToursService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: { search?: string; danhMucId?: string; trangThai?: string; diemDen?: string }) {
    const where: Prisma.TourWhereInput = {
      ...(q.search && {
        OR: [
          { TenTour: { contains: q.search, mode: 'insensitive' } },
          { MaTour: { contains: q.search, mode: 'insensitive' } },
        ],
      }),
      ...(q.danhMucId && { DanhMucID: Number(q.danhMucId) }),
      TrangThaiDuyet: q.trangThai ? q.trangThai : { not: 'Da xoa' },
      ...(q.diemDen && { DiemDen: { contains: q.diemDen, mode: 'insensitive' } }),
    };
    const rows = await this.prisma.tour.findMany({
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
    return decorateToursWithPromo(this.prisma, rows);
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
    const [decorated] = await decorateToursWithPromo(this.prisma, [tour]);
    return decorated;
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
    if (await this.prisma.tour.findUnique({ where: { MaTour: maTour } })) {
      throw new BadRequestException(`Mã tour ${maTour} đã tồn tại`);
    }
    try {
      return await this.prisma.tour.create({
        data: { ...(data as Prisma.TourUncheckedCreateInput), MaTour: maTour },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error?.code === 'P2002') {
        throw new BadRequestException(`Mã tour ${maTour} đã tồn tại trong hệ thống`);
      }
      throw new BadRequestException(`Không thể tạo tour: ${error?.message || 'Lỗi CSDL'}`);
    }
  }

  async update(id: number, body: Record<string, unknown>) {
    const data = this.sanitize(body, false);
    if (body.MaTour) {
      const maTour = String(body.MaTour).trim().toUpperCase();
      const exist = await this.prisma.tour.findFirst({
        where: { MaTour: maTour, NOT: { TourID: id } },
      });
      if (exist) {
        throw new BadRequestException(`Mã tour ${maTour} đã được sử dụng bởi một tour khác`);
      }
      data.MaTour = maTour;
    }

    try {
      return await this.prisma.tour.update({
        where: { TourID: id },
        data: { ...(data as Prisma.TourUncheckedUpdateInput), NgayCapNhat: new Date() },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error?.code === 'P2002') {
        throw new BadRequestException('Mã tour đã tồn tại trong hệ thống');
      }
      if (error?.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy tour cần cập nhật');
      }
      throw new BadRequestException(`Không thể cập nhật tour: ${error?.message || 'Lỗi CSDL'}`);
    }
  }

  async remove(id: number) {
    const tour = await this.prisma.tour.findUnique({
      where: { TourID: id },
      include: {
        LichKhoiHanh: {
          include: {
            _count: {
              select: {
                DonDatTour: true,
                PhieuDatDichVu: true,
              },
            },
            BaoCaoQuyetToan: { select: { QuyetToanID: true } },
          },
        },
      },
    });
    if (!tour) throw new NotFoundException('Không tìm thấy tour cần xóa');

    const soDon = tour.LichKhoiHanh.reduce((sum, l) => sum + l._count.DonDatTour, 0);
    const soPhieuNCC = tour.LichKhoiHanh.reduce((sum, l) => sum + l._count.PhieuDatDichVu, 0);
    const soQuyetToan = tour.LichKhoiHanh.filter((l) => Boolean(l.BaoCaoQuyetToan)).length;

    // Trường hợp 1: Tour đã phát sinh đơn đặt tour của khách hàng hoặc chứng từ tài chính
    // -> Lưu trữ an toàn (Archive) để xóa khỏi danh sách mở bán nhưng BẢO TOÀN 100%
    //    thông tin Tên tour, Mã tour, Lịch khởi hành cho các khách hàng đã đăng ký trước đó.
    if (soDon > 0 || soPhieuNCC > 0 || soQuyetToan > 0) {
      return this.prisma.$transaction(async (tx) => {
        const lichIds = tour.LichKhoiHanh.map((l) => l.LichID);
        if (lichIds.length > 0) {
          await tx.lichKhoiHanh.updateMany({
            where: { LichID: { in: lichIds }, SoChoDaDat: 0, TrangThai: 'Cho khoi hanh' },
            data: { TrangThai: 'Dong' },
          });
        }
        const archived = await tx.tour.update({
          where: { TourID: id },
          data: { TrangThaiDuyet: 'Da xoa', NgayCapNhat: new Date() },
        });
        return {
          ...archived,
          deleted: true,
          mode: 'ARCHIVE_PROTECTED',
          soDonBaoLuu: soDon,
          message: `Đã xóa tour "${tour.TenTour}" (${tour.MaTour}) khỏi danh sách mở bán. Dữ liệu lịch sử của ${soDon} đơn đặt tour khách hàng đã đăng ký trước đó (Tên tour, Mã tour, Lịch khởi hành, Vé điện tử) vẫn được bảo toàn 100%!`,
        };
      });
    }

    // Trường hợp 2: Tour mẫu / Tour mới tạo chưa có bất kỳ khách hàng nào đặt -> Xóa vật lý (Hard Delete)
    return this.prisma.$transaction(async (tx) => {
      const lichIds = tour.LichKhoiHanh.map((l) => l.LichID);
      if (lichIds.length > 0) {
        await tx.dieuPhoiTour.deleteMany({ where: { LichID: { in: lichIds } } });
        await tx.chiPhiPhatSinh.deleteMany({ where: { LichID: { in: lichIds } } });
        await tx.lichKhoiHanh.deleteMany({ where: { TourID: id } });
      }
      await tx.danhGia.deleteMany({ where: { TourID: id } });
      await tx.apDungVoucher.deleteMany({ where: { TourID: id } });
      await tx.apDungChuongTrinhKM.deleteMany({ where: { TourID: id } });
      const deleted = await tx.tour.delete({ where: { TourID: id } });
      return {
        ...deleted,
        deleted: true,
        mode: 'HARD_DELETE',
        soDonBaoLuu: 0,
        message: `Đã xóa hoàn toàn tour "${tour.TenTour}" (${tour.MaTour}) khỏi hệ thống!`,
      };
    });
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

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Dieu hanh')
  create(@Body() body: Record<string, unknown>) { return this.service.create(body); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Dieu hanh')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) { return this.service.update(id, body); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Dieu hanh')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}

@Module({ controllers: [ToursController], providers: [ToursService] })
export class ToursModule {}
