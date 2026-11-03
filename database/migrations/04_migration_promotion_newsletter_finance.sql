-- =============================================================================
-- MIGRATION 04: Khuyến mãi tour (CTKM) ≠ Mã giảm giá (Voucher), Quản lý nhận tin (email),
--               Quyết toán chuẩn kế toán, Chi phí phát sinh, Quản lý NCC.
-- Có thể chạy lại nhiều lần (idempotent).
-- Chạy: docker exec -i viettour-db psql -U viettour -d quanlytourdulich < database/04_migration_promotion_newsletter_finance.sql
-- Sau đó: cd backend && npx prisma generate
-- =============================================================================
BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Đổi tên "KhuyenMai" (thực chất là mã voucher) -> "Voucher" cho đúng thiết kế
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.khuyenmai') IS NOT NULL AND to_regclass('public.voucher') IS NULL THEN
    ALTER TABLE khuyenmai RENAME TO voucher;
    ALTER TABLE voucher RENAME COLUMN khuyenmaiid   TO voucherid;
    ALTER TABLE voucher RENAME COLUMN makhuyenmai   TO mavoucher;
    ALTER TABLE voucher RENAME COLUMN ngayketthuckm TO ngayketthuc;
  END IF;

  IF to_regclass('public.apdungkhuyenmai') IS NOT NULL AND to_regclass('public.apdungvoucher') IS NULL THEN
    ALTER TABLE apdungkhuyenmai RENAME TO apdungvoucher;
    ALTER TABLE apdungvoucher RENAME COLUMN apdungkmid  TO apdungvoucherid;
    ALTER TABLE apdungvoucher RENAME COLUMN khuyenmaiid TO voucherid;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'dondattour' AND column_name = 'khuyenmaiid') THEN
    ALTER TABLE dondattour RENAME COLUMN khuyenmaiid TO voucherid;
  END IF;
END $$;

ALTER TABLE voucher ADD COLUMN IF NOT EXISTS soluongtoida INT NULL CHECK (soluongtoida IS NULL OR soluongtoida > 0);
COMMENT ON TABLE voucher IS 'Mã giảm giá (voucher): khách nhập mã khi đặt tour. Khác với Khuyến mãi tour (ChuongTrinhKhuyenMai) là giảm giá tự động theo tour';

DROP FUNCTION IF EXISTS fn_kiemtrahieuluckhuyenmai(INT);
CREATE OR REPLACE FUNCTION fn_KiemTraHieuLucVoucher(p_VoucherID INT)
RETURNS BOOLEAN AS $$
DECLARE
    v_ngaybatdau DATE; v_ngayketthuc DATE; v_trangthai SMALLINT;
BEGIN
    SELECT ngaybatdau, ngayketthuc, trangthai INTO v_ngaybatdau, v_ngayketthuc, v_trangthai
    FROM voucher WHERE voucherid = p_VoucherID;
    IF NOT FOUND THEN RETURN FALSE; END IF;
    RETURN v_trangthai = 1 AND CURRENT_DATE BETWEEN v_ngaybatdau AND v_ngayketthuc;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. Khuyến mãi tour: giảm x% cho tour trong khoảng thời gian, tự hết hạn
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ChuongTrinhKhuyenMai (
    CTKMID         SERIAL        PRIMARY KEY,
    TenChuongTrinh VARCHAR(200)  NOT NULL,
    MoTa           TEXT          NULL,
    PhanTramGiam   NUMERIC(5,2)  NOT NULL CHECK (PhanTramGiam > 0 AND PhanTramGiam <= 100),
    NgayBatDau     TIMESTAMP     NOT NULL,
    NgayKetThuc    TIMESTAMP     NOT NULL,
    TrangThai      SMALLINT      NOT NULL DEFAULT 1 CHECK (TrangThai IN (0, 1)),
    NhanVienTaoID  INT           NOT NULL REFERENCES NhanVien(NhanVienID),
    NgayTao        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat    TIMESTAMP     NULL,
    CONSTRAINT chk_ctkm_ngay CHECK (NgayKetThuc > NgayBatDau)
);
CREATE INDEX IF NOT EXISTS idx_ctkm_thoigian ON ChuongTrinhKhuyenMai(NgayBatDau, NgayKetThuc);
COMMENT ON TABLE ChuongTrinhKhuyenMai IS 'Khuyến mãi tour: giảm x% cho các tour được gán, chỉ có hiệu lực trong [NgayBatDau, NgayKetThuc]; hết hạn thì giá về như cũ (không cần job)';

CREATE TABLE IF NOT EXISTS ApDungCTKM (
    ApDungCTKMID SERIAL PRIMARY KEY,
    CTKMID       INT NOT NULL REFERENCES ChuongTrinhKhuyenMai(CTKMID) ON DELETE CASCADE,
    TourID       INT NOT NULL REFERENCES Tour(TourID) ON DELETE CASCADE,
    UNIQUE (CTKMID, TourID)
);

ALTER TABLE dondattour ADD COLUMN IF NOT EXISTS ctkmid INT NULL REFERENCES ChuongTrinhKhuyenMai(CTKMID);
ALTER TABLE dondattour ADD COLUMN IF NOT EXISTS giamgiakhuyenmai NUMERIC(15,2) NOT NULL DEFAULT 0;
COMMENT ON COLUMN dondattour.giamgia IS 'Tổng giảm giá = giamgiakhuyenmai (CTKM tour) + giảm giá voucher';

-- -----------------------------------------------------------------------------
-- 3. Quản lý nhận tin (email)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS DangKyNhanTin (
    DangKyID    SERIAL       PRIMARY KEY,
    Email       VARCHAR(100) NOT NULL UNIQUE,
    KhachHangID INT          NULL,
    Token       VARCHAR(64)  NOT NULL UNIQUE,
    TrangThai   SMALLINT     NOT NULL DEFAULT 1 CHECK (TrangThai IN (0, 1)),
    NguonDangKy VARCHAR(30)  NOT NULL DEFAULT 'Website',
    NgayDangKy  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    NgayHuy     TIMESTAMP    NULL
);

CREATE TABLE IF NOT EXISTS NhatKyGuiMail (
    NhatKyID   SERIAL       PRIMARY KEY,
    LoaiMail   VARCHAR(40)  NOT NULL,
    EmailNhan  VARCHAR(100) NOT NULL,
    TieuDe     VARCHAR(255) NOT NULL,
    TrangThai  VARCHAR(20)  NOT NULL CHECK (TrangThai IN ('Thanh cong','That bai','Bo qua')),
    ChiTietLoi TEXT         NULL,
    ThamChieu  VARCHAR(100) NULL,
    NgayGui    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_nhatkymail_dedupe ON NhatKyGuiMail(LoaiMail, ThamChieu, EmailNhan);
CREATE INDEX IF NOT EXISTS idx_nhatkymail_ngay   ON NhatKyGuiMail(NgayGui);

-- -----------------------------------------------------------------------------
-- 4. Nhà cung cấp: trạng thái hợp tác, MST; phiếu đặt: hạn thanh toán, số hóa đơn NCC
-- -----------------------------------------------------------------------------
ALTER TABLE nhacungcap ADD COLUMN IF NOT EXISTS masothue VARCHAR(20) NULL;
ALTER TABLE nhacungcap ADD COLUMN IF NOT EXISTS trangthai SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE dichvunhacungcap ADD COLUMN IF NOT EXISTS trangthai SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE phieudatdichvu ADD COLUMN IF NOT EXISTS hanthanhtoan DATE NULL;
ALTER TABLE phieudatdichvu ADD COLUMN IF NOT EXISTS sohoadonncc VARCHAR(50) NULL;
COMMENT ON COLUMN phieudatdichvu.tiendacoc IS 'Tổng tiền đã trả NCC (cọc + các lần thanh toán sau). Công nợ phải trả = tongtiendichvu - tiendacoc';

-- -----------------------------------------------------------------------------
-- 5. Chi phí phát sinh + Quyết toán chuẩn kế toán
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ChiPhiPhatSinh (
    ChiPhiID   SERIAL        PRIMARY KEY,
    LichID     INT           NOT NULL REFERENCES LichKhoiHanh(LichID),
    NhanVienID INT           NOT NULL REFERENCES NhanVien(NhanVienID),
    LoaiChiPhi VARCHAR(40)   NOT NULL,
    NoiDung    VARCHAR(255)  NOT NULL,
    SoTien     NUMERIC(15,2) NOT NULL CHECK (SoTien > 0),
    NgayChi    DATE          NOT NULL DEFAULT CURRENT_DATE,
    SoChungTu  VARCHAR(50)   NULL,
    GhiChu     TEXT          NULL
);
CREATE INDEX IF NOT EXISTS idx_chiphi_lich ON ChiPhiPhatSinh(LichID);

ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS thucthu        NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS congnophaithu  NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS chiphincc      NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS chiphihdv      NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS chiphikhac     NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS congnophaitra  NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS nhanvienduyetid INT NULL REFERENCES NhanVien(NhanVienID);
ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS ngayduyet      TIMESTAMP NULL;
ALTER TABLE baocaoquyettoan ADD COLUMN IF NOT EXISTS lydotralai     TEXT NULL;

-- Dữ liệu quyết toán cũ: coi toàn bộ chi phí là chi phí NCC, thực thu = doanh thu
UPDATE baocaoquyettoan
   SET chiphincc = tongchi, thucthu = tongthu
 WHERE chiphincc = 0 AND chiphihdv = 0 AND chiphikhac = 0 AND thucthu = 0 AND (tongchi > 0 OR tongthu > 0);

COMMIT;
