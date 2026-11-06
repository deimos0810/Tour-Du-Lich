import { Global, Injectable, Logger, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { autoSeedIfEmpty } from './auto-seed.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.ensureUpgradeSchema();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Tự động kiểm tra và khởi tạo các bảng/cột nâng cấp (CTKM, Nhận tin, Nhật ký Mail, Chi phí phát sinh...)
   * nếu CSDL hiện tại mới chỉ chạy bản SQL cũ. Đảm bảo Backend không bao giờ bị lỗi P2021.
   */
  private async ensureUpgradeSchema() {
    try {
      await this.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF to_regclass('public.khuyenmai') IS NOT NULL AND to_regclass('public.voucher') IS NULL THEN
            ALTER TABLE khuyenmai RENAME TO voucher;
            ALTER TABLE voucher RENAME COLUMN khuyenmaiid TO voucherid;
            ALTER TABLE voucher RENAME COLUMN makhuyenmai TO mavoucher;
            ALTER TABLE voucher RENAME COLUMN ngayketthuckm TO ngayketthuc;
          END IF;

          IF to_regclass('public.apdungkhuyenmai') IS NOT NULL AND to_regclass('public.apdungvoucher') IS NULL THEN
            ALTER TABLE apdungkhuyenmai RENAME TO apdungvoucher;
            ALTER TABLE apdungvoucher RENAME COLUMN apdungkmid TO apdungvoucherid;
            ALTER TABLE apdungvoucher RENAME COLUMN khuyenmaiid TO voucherid;
          END IF;

          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name = 'dondattour' AND column_name = 'khuyenmaiid') THEN
            ALTER TABLE dondattour RENAME COLUMN khuyenmaiid TO voucherid;
          END IF;
        END $$;
      `);

      await this.$executeRawUnsafe(`ALTER TABLE voucher ADD COLUMN IF NOT EXISTS soluongtoida INT NULL;`);
      await this.$executeRawUnsafe(`ALTER TABLE dichvunhacungcap ADD COLUMN IF NOT EXISTS trangthai SMALLINT NOT NULL DEFAULT 1;`);

      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS chuongtrinhkhuyenmai (
          ctkmid SERIAL PRIMARY KEY,
          tenchuongtrinh VARCHAR(200) NOT NULL,
          mota TEXT,
          phantramgiam DECIMAL(5,2) NOT NULL DEFAULT 10,
          ngaybatdau TIMESTAMP(6) NOT NULL DEFAULT NOW(),
          ngayketthuc TIMESTAMP(6) NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
          trangthai SMALLINT NOT NULL DEFAULT 1,
          nhanvientaoid INT NOT NULL DEFAULT 1 REFERENCES nhanvien(nhanvienid) ON DELETE CASCADE,
          ngaytao TIMESTAMP(6) NOT NULL DEFAULT NOW(),
          ngaycapnhat TIMESTAMP(6)
        );
      `);

      await this.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_ctkm_thoigian ON chuongtrinhkhuyenmai (ngaybatdau, ngayketthuc);
      `);

      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS apdungctkm (
          apdungctkmid SERIAL PRIMARY KEY,
          ctkmid INT NOT NULL REFERENCES chuongtrinhkhuyenmai(ctkmid) ON DELETE CASCADE,
          tourid INT NOT NULL REFERENCES tour(tourid) ON DELETE CASCADE,
          UNIQUE(ctkmid, tourid)
        );
      `);

      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS dangkynhantin (
          dangkyid SERIAL PRIMARY KEY,
          email VARCHAR(100) NOT NULL UNIQUE,
          khachhangid INT,
          token VARCHAR(64) NOT NULL UNIQUE,
          trangthai SMALLINT NOT NULL DEFAULT 1,
          nguondangky VARCHAR(30) NOT NULL DEFAULT 'Website',
          ngaydangky TIMESTAMP(6) NOT NULL DEFAULT NOW(),
          ngayhuy TIMESTAMP(6)
        );
      `);

      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS nhatkyguimail (
          nhatkyid SERIAL PRIMARY KEY,
          loaimail VARCHAR(40) NOT NULL,
          emailnhan VARCHAR(100) NOT NULL,
          tieude VARCHAR(255) NOT NULL,
          trangthai VARCHAR(20) NOT NULL,
          chitietloi TEXT,
          thamchieu VARCHAR(100),
          ngaygui TIMESTAMP(6) NOT NULL DEFAULT NOW()
        );
      `);

      await this.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_nhatkymail_dedupe ON nhatkyguimail (loaimail, thamchieu, emailnhan);
      `);
      await this.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_nhatkymail_ngay ON nhatkyguimail (ngaygui);
      `);

      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS chiphiphatsinh (
          chiphiid SERIAL PRIMARY KEY,
          lichid INT NOT NULL REFERENCES lichkhoihanh(lichid) ON DELETE CASCADE,
          nhanvienid INT NOT NULL REFERENCES nhanvien(nhanvienid) ON DELETE CASCADE,
          loaichiphi VARCHAR(40) NOT NULL,
          noidung VARCHAR(255) NOT NULL,
          sotien DECIMAL(15,2) NOT NULL DEFAULT 0,
          ngaychi DATE NOT NULL DEFAULT CURRENT_DATE,
          sochungtu VARCHAR(50),
          ghichu TEXT
        );
      `);

      await this.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_chiphi_lich ON chiphiphatsinh (lichid);
      `);

      // Bổ sung các cột nâng cấp vào bảng sẵn có nếu chưa tồn tại
      const alterStatements = [
        `ALTER TABLE dondattour ADD COLUMN IF NOT EXISTS ctkmid INT REFERENCES chuongtrinhkhuyenmai(ctkmid)`,
        `ALTER TABLE dondattour ADD COLUMN IF NOT EXISTS giamgiakhuyenmai DECIMAL(15,2) NOT NULL DEFAULT 0`,
        `ALTER TABLE nhacungcap ADD COLUMN IF NOT EXISTS masothue VARCHAR(20)`,
        `ALTER TABLE nhacungcap ADD COLUMN IF NOT EXISTS trangthai SMALLINT NOT NULL DEFAULT 1`,
        `ALTER TABLE phieudatdichvu ADD COLUMN IF NOT EXISTS hanthanhtoan DATE`,
        `ALTER TABLE phieudatdichvu ADD COLUMN IF NOT EXISTS sohoadonncc VARCHAR(50)`,
        `ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS thucthu DECIMAL(15,2) NOT NULL DEFAULT 0`,
        `ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS congnophaithu DECIMAL(15,2) NOT NULL DEFAULT 0`,
        `ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS chiphincc DECIMAL(15,2) NOT NULL DEFAULT 0`,
        `ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS chiphihdv DECIMAL(15,2) NOT NULL DEFAULT 0`,
        `ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS chiphikhac DECIMAL(15,2) NOT NULL DEFAULT 0`,
        `ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS congnophaitra DECIMAL(15,2) NOT NULL DEFAULT 0`,
        `ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS nhanvienduyetid INT REFERENCES nhanvien(nhanvienid)`,
        `ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS ngayduyet TIMESTAMP(6)`,
        `ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS lydotralai TEXT`,
      ];
      for (const stmt of alterStatements) {
        await this.$executeRawUnsafe(stmt);
      }

      // Tự động nạp dữ liệu mẫu 27 bảng nếu Database trên Cloud mới khởi tạo còn trống
      const seeded = await autoSeedIfEmpty(this);
      if (seeded) {
        this.logger.log('Auto-seeded initial VietTour demo data into fresh PostgreSQL database.');
      }

      // Tạo hoặc sửa lỗi font dữ liệu mẫu CTKM mặc định bằng Prisma Client (chuẩn UTF-8 100%)
      const existingPromo = await this.chuongTrinhKhuyenMai.findUnique({ where: { CTKMID: 1 } });
      if (!existingPromo) {
        const firstStaff = await this.nhanVien.findFirst({ select: { NhanVienID: true } });
        if (firstStaff) {
          await this.chuongTrinhKhuyenMai.create({
            data: {
              CTKMID: 1,
              TenChuongTrinh: 'Ưu Đãi Mùa Thu Vàng 2026',
              MoTa: 'Giảm trực tiếp 10% cho toàn bộ tour biển đảo miền Trung và Phú Quốc',
              PhanTramGiam: 10,
              NgayBatDau: new Date('2026-09-01T00:00:00Z'),
              NgayKetThuc: new Date('2026-12-31T23:59:59Z'),
              TrangThai: 1,
              NhanVienTaoID: firstStaff.NhanVienID,
            },
          });
        }
      } else if (existingPromo.TenChuongTrinh.includes('?') || (existingPromo.MoTa && existingPromo.MoTa.includes('?'))) {
        await this.chuongTrinhKhuyenMai.update({
          where: { CTKMID: 1 },
          data: {
            TenChuongTrinh: 'Ưu Đãi Mùa Thu Vàng 2026',
            MoTa: 'Giảm trực tiếp 10% cho toàn bộ tour biển đảo miền Trung và Phú Quốc',
          },
        });
      }

      // Sửa lỗi font cho toàn bộ các CTKM hoặc Voucher nếu có dấu '?' do encoding terminal cũ
      const corruptedPromos = await this.chuongTrinhKhuyenMai.findMany({
        where: { OR: [{ TenChuongTrinh: { contains: '?' } }, { MoTa: { contains: '?' } }] },
      });
      for (const cp of corruptedPromos) {
        await this.chuongTrinhKhuyenMai.update({
          where: { CTKMID: cp.CTKMID },
          data: {
            TenChuongTrinh: cp.TenChuongTrinh.includes('?') ? 'Chương Trình Ưu Đãi Đặc Biệt 2026' : cp.TenChuongTrinh,
            MoTa: cp.MoTa?.includes('?') ? 'Chương trình ưu đãi giảm giá trực tiếp khi đặt tour trực tuyến tại VietTour' : cp.MoTa,
          },
        });
      }

      const defaultVoucherNames: Record<string, string> = {
        VIETTOUR2026: 'Ưu đãi Khách hàng Thân thiết VietTour 2026',
        BAYHE2026: 'Khuyến mãi Tour Máy bay Trọn Gói 2026',
        TRIAN500K: 'Voucher Tri ân Khách hàng Đặt tour sớm',
        WELCOME10: 'Mã Chào Mừng Thành Viên Mới Giảm 10%',
      };
      for (const [code, cleanName] of Object.entries(defaultVoucherNames)) {
        await this.voucher.updateMany({
          where: { MaVoucher: code, TenChuongTrinh: { contains: '?' } },
          data: { TenChuongTrinh: cleanName },
        });
      }

      await this.$executeRawUnsafe(`
        INSERT INTO apdungctkm (ctkmid, tourid)
        SELECT 1, t.tourid
        FROM tour t
        WHERE t.tourid IN (1, 5)
          AND EXISTS (SELECT 1 FROM chuongtrinhkhuyenmai WHERE ctkmid = 1)
        ON CONFLICT (ctkmid, tourid) DO NOTHING;
      `);

      this.logger.log('Database upgrade schema verified and synchronized.');
    } catch (err) {
      this.logger.warn(`Schema auto-check warning: ${(err as Error).message}`);
    }
  }
}

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
