import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ExportService } from './export.module.js';

const jwt = new JwtService({ secret: 'test-secret' });

function ctx(headers: Record<string, string>, handler: object = () => undefined, user?: unknown): ExecutionContext {
  const req: Record<string, unknown> = { headers, user };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => handler,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard(jwt);

  it('rejects requests without a Bearer token (401)', async () => {
    await expect(guard.canActivate(ctx({}))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects fake/invalid tokens (401)', async () => {
    await expect(guard.canActivate(ctx({ authorization: 'Bearer jwt-session-1-123' }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts a valid token and attaches the payload', async () => {
    const token = await jwt.signAsync({ sub: 1, email: 'a@b.c', roles: ['Ke toan'] });
    const c = ctx({ authorization: `Bearer ${token}` });
    await expect(guard.canActivate(c)).resolves.toBe(true);
    expect((c.switchToHttp().getRequest() as { user: { sub: number } }).user.sub).toBe(1);
  });
});

describe('RolesGuard', () => {
  class Dummy {
    @Roles('Ke toan')
    m() {}
  }
  const guard = new RolesGuard(new Reflector());
  const handler = Dummy.prototype.m;

  it('allows a matching role', () => {
    expect(guard.canActivate(ctx({}, handler, { roles: ['Ke toan'] }))).toBe(true);
  });

  it('always allows Admin', () => {
    expect(guard.canActivate(ctx({}, handler, { roles: ['Admin'] }))).toBe(true);
  });

  it('forbids other roles (403)', () => {
    expect(() => guard.canActivate(ctx({}, handler, { roles: ['Khach hang'] }))).toThrow(ForbiddenException);
  });
});

describe('ExportService documents', () => {
  const settlement = {
    QuyetToanID: 1, TongThu: 30_000_000, TongChi: 12_000_000, LoiNhuan: 18_000_000, NgayLap: new Date(), TrangThaiDuyet: 'Da trinh duyet',
    NhanVienLap: { HoTen: 'Trần Minh Đức', ChucVu: 'Kế toán' },
    LichKhoiHanh: {
      MaLich: 'L-001', NgayKhoiHanh: new Date(), NgayKetThuc: new Date(),
      Tour: { TenTour: 'Đà Nẵng - Hội An 4N3Đ' },
      DonDatTour: [{ MaDon: 'BK-1', SoLuongNguoiLon: 2, SoLuongTreEm: 0, GiamGia: 0, TongTien: 30_000_000, KhachHang: { HoTen: 'Nguyễn Văn Hùng' } }],
      PhieuDatDichVu: [{ MaPhieu: 'PD-1', TongTienDichVu: 12_000_000, TrangThai: 'Da xac nhan', NhaCungCap: { TenNCC: 'Khách sạn Mường Thanh', LoaiNCC: 'Khach san' } }],
    },
  };
  const ticket = {
    MaDon: 'BK-1', TrangThaiDon: 'Da thanh toan', SoLuongNguoiLon: 1, SoLuongTreEm: 0, TongTien: 5_000_000, GiamGia: 0,
    KhachHang: { HoTen: 'Nguyễn Văn Hùng', SoDienThoai: '0908123456', Email: 'a@b.c' },
    ChiTietHanhKhach: [{ ChiTietID: 1, HoTen: 'Nguyễn Văn Hùng', LoaiKhach: 'Nguoi lon', CCCD: '012345678901', MaQRVe: 'VT-BK-1-1-0001' }],
    LichKhoiHanh: { MaLich: 'L-001', NgayKhoiHanh: new Date(), NgayKetThuc: new Date(), Tour: { TenTour: 'Đà Nẵng', DiemKhoiHanh: 'TP.HCM', DiemDen: 'Đà Nẵng', PhuongTien: 'Máy bay' } },
  };
  const prisma = {
    baoCaoQuyetToan: { findUnique: async () => settlement, findMany: async () => [{ ...settlement, LichKhoiHanh: { ...settlement.LichKhoiHanh } }] },
    donDatTour: { findUnique: async () => ticket },
  };
  const service = new ExportService(prisma as never);

  it('builds a valid .xlsx settlement workbook', async () => {
    const buf = await service.exportSettlementExcel(1);
    expect(buf.subarray(0, 2).toString()).toBe('PK');
  });

  it('builds a valid .xlsx financial report', async () => {
    const buf = await service.exportFinancialReportExcel();
    expect(buf.subarray(0, 2).toString()).toBe('PK');
  });

  it('builds a settlement PDF', async () => {
    const buf = await service.generateSettlementPDF(1);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('builds a ticket PDF with QR codes', async () => {
    const buf = await service.generateTicketPDF('BK-1');
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
    expect(buf.length).toBeGreaterThan(3000);
  });
});
