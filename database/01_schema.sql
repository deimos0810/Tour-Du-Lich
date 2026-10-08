-- =============================================================================
-- HỆ THỐNG QUẢN LÝ TOUR DU LỊCH
-- SQL DDL - PostgreSQL
-- Tác giả: Khóa luận tốt nghiệp
-- Mô tả: Script tạo toàn bộ 22 bảng CSDL chuẩn hóa 3NF
--        Bao gồm PRIMARY KEY, FOREIGN KEY, CHECK, DEFAULT, UNIQUE
-- Hướng dẫn: Paste toàn bộ script này vào pgAdmin 4 > Query Tool
--             rồi nhấn F5 hoặc nút Execute (▶)
-- =============================================================================

-- Bước 1: Tạo database (chạy riêng nếu chưa có)
-- CREATE DATABASE quanlytourdulich
--     WITH ENCODING = 'UTF8'
--          TEMPLATE = template0;

-- =============================================================================
-- BẢNG 1: TAIKHOAN - Tài khoản người dùng hệ thống
-- =============================================================================
CREATE TABLE IF NOT EXISTS TaiKhoan (
    TaiKhoanID        SERIAL         PRIMARY KEY,
    Email             VARCHAR(100)   NOT NULL UNIQUE,
    MatKhauHash       VARCHAR(255)   NOT NULL,
    SoDienThoai       VARCHAR(20)    UNIQUE,
    TrangThai         SMALLINT       NOT NULL DEFAULT 1
                                     CHECK (TrangThai IN (0, 1)),
    NgayTao           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email_verified_at TIMESTAMP      NULL,
    remember_token    VARCHAR(100)   NULL
);

COMMENT ON TABLE  TaiKhoan IS 'Tài khoản đăng nhập của tất cả người dùng hệ thống';
COMMENT ON COLUMN TaiKhoan.TrangThai IS '1 = Hoạt động | 0 = Đã khóa';

-- =============================================================================
-- BẢNG 2: VAITRO - Vai trò / quyền hạn
-- =============================================================================
CREATE TABLE IF NOT EXISTS VaiTro (
    VaiTroID  SERIAL        PRIMARY KEY,
    TenVaiTro VARCHAR(50)   NOT NULL UNIQUE,
    MoTa      VARCHAR(255)  NULL
);

COMMENT ON TABLE VaiTro IS 'Danh sách vai trò: Admin, Điều hành, Kế toán, HDV, Khách hàng';

-- =============================================================================
-- BẢNG 3: PHANQUYEN - Bảng liên kết TaiKhoan <-> VaiTro (nhiều - nhiều)
-- =============================================================================
CREATE TABLE IF NOT EXISTS PhanQuyen (
    TaiKhoanID  INT       NOT NULL REFERENCES TaiKhoan(TaiKhoanID) ON DELETE CASCADE,
    VaiTroID    INT       NOT NULL REFERENCES VaiTro(VaiTroID)     ON DELETE CASCADE,
    NgayGan     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (TaiKhoanID, VaiTroID)
);

COMMENT ON TABLE PhanQuyen IS 'Gán vai trò cho tài khoản (1 tài khoản có thể có nhiều vai trò)';

-- =============================================================================
-- BẢNG 4: KHACHHANG - Thông tin khách du lịch
-- =============================================================================
CREATE TABLE IF NOT EXISTS KhachHang (
    KhachHangID    SERIAL        PRIMARY KEY,
    TaiKhoanID     INT           NOT NULL UNIQUE
                                  REFERENCES TaiKhoan(TaiKhoanID) ON DELETE CASCADE,
    HoTen          VARCHAR(100)  NOT NULL,
    DiaChiGiaoHang VARCHAR(255)  NULL,
    SoDienThoai    VARCHAR(20)   NOT NULL,
    Email          VARCHAR(100)  NOT NULL,
    CCCD           VARCHAR(12)   NULL,
    NgaySinh       DATE          NULL,
    GioiTinh       VARCHAR(10)   NULL CHECK (GioiTinh IN ('Nam', 'Nu', 'Khac'))
);

COMMENT ON TABLE  KhachHang IS 'Thông tin cá nhân của khách du lịch đăng ký tài khoản';
COMMENT ON COLUMN KhachHang.CCCD IS 'Số Căn cước công dân (12 số)';

-- =============================================================================
-- BẢNG 5: NHANVIEN - Thông tin nhân viên công ty
-- =============================================================================
CREATE TABLE IF NOT EXISTS NhanVien (
    NhanVienID  SERIAL        PRIMARY KEY,
    TaiKhoanID  INT           NOT NULL UNIQUE
                               REFERENCES TaiKhoan(TaiKhoanID) ON DELETE CASCADE,
    HoTen       VARCHAR(100)  NOT NULL,
    DiaChi      VARCHAR(255)  NULL,
    SoDienThoai VARCHAR(20)   NOT NULL,
    Email       VARCHAR(100)  NOT NULL,
    ChucVu      VARCHAR(50)   NOT NULL,
    NgayVaoLam  DATE          NULL
);

COMMENT ON TABLE NhanVien IS 'Nhân viên công ty: Điều hành, Kế toán, Quản lý';

-- =============================================================================
-- BẢNG 6: HUONGDANVIEN - Hướng dẫn viên du lịch
-- =============================================================================
CREATE TABLE IF NOT EXISTS HuongDanVien (
    HDVID      SERIAL        PRIMARY KEY,
    NhanVienID INT           NOT NULL UNIQUE
                              REFERENCES NhanVien(NhanVienID) ON DELETE CASCADE,
    SoTheHDV   VARCHAR(50)   NOT NULL UNIQUE,
    NgonNgu    VARCHAR(100)  NOT NULL,
    KinhNghiem VARCHAR(100)  NULL,
    TrangThai  VARCHAR(30)   NOT NULL DEFAULT 'San sang'
                              CHECK (TrangThai IN ('San sang', 'Dang di tour', 'Nghi phep', 'Nghi viec'))
);

COMMENT ON TABLE HuongDanVien IS 'Thông tin chuyên biệt của HDV: thẻ hành nghề, ngôn ngữ, trạng thái';

-- =============================================================================
-- BẢNG 7: DANHMUCTOUR - Phân loại chương trình tour
-- =============================================================================
CREATE TABLE IF NOT EXISTS DanhMucTour (
    DanhMucID  SERIAL        PRIMARY KEY,
    TenDanhMuc VARCHAR(100)  NOT NULL UNIQUE,
    MoTa       TEXT          NULL
);

COMMENT ON TABLE DanhMucTour IS 'Phân loại tour: Trong Nước, Quốc Tế, Mạo Hiểm, Nghỉ Dưỡng...';

-- =============================================================================
-- BẢNG 8: TOUR - Chương trình tour du lịch
-- =============================================================================
CREATE TABLE IF NOT EXISTS Tour (
    TourID          SERIAL          PRIMARY KEY,
    DanhMucID       INT             NOT NULL REFERENCES DanhMucTour(DanhMucID),
    NhanVienTaoID   INT             NOT NULL REFERENCES NhanVien(NhanVienID),
    MaTour          VARCHAR(20)     NOT NULL UNIQUE,
    TenTour         VARCHAR(255)    NOT NULL,
    ThoiGian        VARCHAR(50)     NOT NULL,
    DiemKhoiHanh    VARCHAR(100)    NOT NULL,
    DiemDen         VARCHAR(100)    NOT NULL,
    MoTaChiTiet     TEXT            NULL,
    LichTrinh       TEXT            NULL,
    PhongCachTour   VARCHAR(50)     NULL,
    PhuongTien      VARCHAR(100)    NULL,
    GiaNguoiLon     NUMERIC(15,2)   NOT NULL CHECK (GiaNguoiLon >= 0),
    GiaTreEm        NUMERIC(15,2)   NOT NULL CHECK (GiaTreEm >= 0),
    PhuThuPhongDon  NUMERIC(15,2)   NOT NULL DEFAULT 0,
    HinhAnhURL      VARCHAR(500)    NULL,
    TrangThaiDuyet  VARCHAR(20)     NOT NULL DEFAULT 'Nhap'
                                     CHECK (TrangThaiDuyet IN ('Nhap','Cho duyet','Da duyet','Dang mo ban','Dong ban','Huy')),
    NgayTao         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat     TIMESTAMP       NULL
);

COMMENT ON TABLE Tour IS 'Chương trình tour du lịch do nhân viên điều hành thiết kế và trình duyệt';

-- =============================================================================
-- BẢNG 9: LICHKHOIHANH - Đợt khởi hành cụ thể của tour
-- =============================================================================
CREATE TABLE IF NOT EXISTS LichKhoiHanh (
    LichID            SERIAL          PRIMARY KEY,
    TourID            INT             NOT NULL REFERENCES Tour(TourID),
    MaLich            VARCHAR(30)     NOT NULL UNIQUE,
    NgayKhoiHanh      TIMESTAMP       NOT NULL,
    NgayKetThuc       TIMESTAMP       NOT NULL,
    SoChoToiDa        INT             NOT NULL CHECK (SoChoToiDa > 0),
    SoChoDaDat        INT             NOT NULL DEFAULT 0 CHECK (SoChoDaDat >= 0),
    GiaTourKhuyenMai  NUMERIC(15,2)   NULL,
    TrangThai         VARCHAR(20)     NOT NULL DEFAULT 'Cho khoi hanh'
                                       CHECK (TrangThai IN ('Cho khoi hanh','Dang di','Hoan thanh','Huy')),
    CONSTRAINT chk_ngay_lich  CHECK (NgayKetThuc > NgayKhoiHanh),
    CONSTRAINT chk_cho_dat    CHECK (SoChoDaDat <= SoChoToiDa)
);

COMMENT ON TABLE LichKhoiHanh IS 'Từng đợt đi cụ thể của một tour (số chỗ, ngày đi, ngày về, trạng thái)';

-- =============================================================================
-- BẢNG 10: KHUYENMAI - Chương trình khuyến mãi / mã voucher
-- =============================================================================
CREATE TABLE IF NOT EXISTS KhuyenMai (
    KhuyenMaiID       SERIAL          PRIMARY KEY,
    MaKhuyenMai       VARCHAR(50)     NOT NULL UNIQUE,
    TenChuongTrinh    VARCHAR(200)    NOT NULL,
    PhanTramGiam      NUMERIC(5,2)    NOT NULL CHECK (PhanTramGiam > 0 AND PhanTramGiam <= 100),
    GiamToiDa         NUMERIC(15,2)   NOT NULL CHECK (GiamToiDa > 0),
    GiaTriDonToiThieu NUMERIC(15,2)   NOT NULL DEFAULT 0,
    NgayBatDau        DATE            NOT NULL,
    NgayKetThucKM     DATE            NOT NULL,
    TrangThai         SMALLINT        NOT NULL DEFAULT 1 CHECK (TrangThai IN (0, 1)),
    CONSTRAINT chk_km_ngay CHECK (NgayKetThucKM >= NgayBatDau)
);

COMMENT ON TABLE  KhuyenMai IS 'Chương trình khuyến mãi: mã voucher, % giảm, giảm tối đa, thời hạn (NgayBatDau - NgayKetThucKM)';
COMMENT ON COLUMN KhuyenMai.NgayKetThucKM IS 'Ngày hết hạn khuyến mãi - Hệ thống từ chối áp dụng mã nếu CURRENT_DATE > NgayKetThucKM (ngăn mã dùng vĩnh viễn)';

-- Hàm kiểm tra hiệu lực khuyến mãi (còn trong thời hạn NgayBatDau .. NgayKetThucKM và TrangThai = 1)
CREATE OR REPLACE FUNCTION fn_KiemTraHieuLucKhuyenMai(p_KhuyenMaiID INT)
RETURNS BOOLEAN AS $$
DECLARE
    v_NgayBatDau DATE;
    v_NgayKetThucKM DATE;
    v_TrangThai SMALLINT;
BEGIN
    SELECT NgayBatDau, NgayKetThucKM, TrangThai
    INTO v_NgayBatDau, v_NgayKetThucKM, v_TrangThai
    FROM KhuyenMai
    WHERE KhuyenMaiID = p_KhuyenMaiID;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_TrangThai = 1 AND CURRENT_DATE >= v_NgayBatDau AND CURRENT_DATE <= v_NgayKetThucKM THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- BẢNG 11: APDUNGKHUYENMAI - Tour được áp dụng mã khuyến mãi
-- =============================================================================
CREATE TABLE IF NOT EXISTS ApDungKhuyenMai (
    ApDungKMID  SERIAL  PRIMARY KEY,
    KhuyenMaiID INT     NOT NULL REFERENCES KhuyenMai(KhuyenMaiID) ON DELETE CASCADE,
    TourID      INT     NOT NULL REFERENCES Tour(TourID)            ON DELETE CASCADE,
    NgayApDung  DATE    NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (KhuyenMaiID, TourID)
);

COMMENT ON TABLE ApDungKhuyenMai IS 'Bảng liên kết: khuyến mãi nào áp dụng cho tour nào';

-- =============================================================================
-- BẢNG 12: DONDATTOUR - Đơn đặt tour
-- =============================================================================
CREATE TABLE IF NOT EXISTS DonDatTour (
    DonHangID        SERIAL          PRIMARY KEY,
    KhachHangID      INT             NOT NULL REFERENCES KhachHang(KhachHangID),
    LichID           INT             NOT NULL REFERENCES LichKhoiHanh(LichID),
    NhanVienXuLyID   INT             NULL     REFERENCES NhanVien(NhanVienID),
    KhuyenMaiID      INT             NULL     REFERENCES KhuyenMai(KhuyenMaiID),
    MaDon            VARCHAR(30)     NOT NULL UNIQUE,
    NgayDat          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    SoLuongNguoiLon  INT             NOT NULL DEFAULT 1 CHECK (SoLuongNguoiLon >= 0),
    SoLuongTreEm     INT             NOT NULL DEFAULT 0 CHECK (SoLuongTreEm >= 0),
    TongTien         NUMERIC(15,2)   NOT NULL CHECK (TongTien >= 0),
    GiamGia          NUMERIC(15,2)   NOT NULL DEFAULT 0,
    TienCoc          NUMERIC(15,2)   NOT NULL DEFAULT 0,
    TienConLai       NUMERIC(15,2)   NOT NULL DEFAULT 0,
    TrangThaiDon     VARCHAR(20)     NOT NULL DEFAULT 'Cho thanh toan'
                                      CHECK (TrangThaiDon IN ('Cho thanh toan','Da dat coc','Da thanh toan','Da xac nhan','Dang thuc hien','Hoan thanh','Da huy')),
    PhuongThucTT     VARCHAR(20)     NULL
                                      CHECK (PhuongThucTT IN ('VNPay','Chuyen khoan','Tien mat','MoMo')),
    GhiChu           TEXT            NULL,
    CONSTRAINT chk_sl_khach CHECK (SoLuongNguoiLon + SoLuongTreEm > 0)
);

COMMENT ON TABLE DonDatTour IS 'Đơn đặt tour: khách đặt, lịch chọn, mã giảm giá, tổng tiền, trạng thái';

-- =============================================================================
-- BẢNG 13: CHITIETHANHKHACH - Danh sách hành khách trong đơn
-- =============================================================================
CREATE TABLE IF NOT EXISTS ChiTietHanhKhach (
    ChiTietID         SERIAL        PRIMARY KEY,
    DonHangID         INT           NOT NULL REFERENCES DonDatTour(DonHangID) ON DELETE CASCADE,
    HoTen             VARCHAR(100)  NOT NULL,
    NgaySinh          DATE          NULL,
    LoaiKhach         VARCHAR(20)   NOT NULL DEFAULT 'Nguoi lon'
                                     CHECK (LoaiKhach IN ('Nguoi lon', 'Tre em', 'Em be')),
    CCCD              VARCHAR(12)   NULL,
    MaQRVe            VARCHAR(255)  NULL UNIQUE,
    TrangThaiDiemDanh SMALLINT      NOT NULL DEFAULT 0 CHECK (TrangThaiDiemDanh IN (0, 1)),
    GhiChu            TEXT          NULL
);

COMMENT ON TABLE  ChiTietHanhKhach IS 'Từng hành khách trong đơn đặt tour (kèm mã QR vé điện tử)';
COMMENT ON COLUMN ChiTietHanhKhach.CCCD IS 'Số Căn cước công dân (12 số)';
COMMENT ON COLUMN ChiTietHanhKhach.TrangThaiDiemDanh IS '0 = Chưa điểm danh | 1 = Đã điểm danh';

-- =============================================================================
-- BẢNG 14: THANHTOAN - Giao dịch thanh toán
-- =============================================================================
CREATE TABLE IF NOT EXISTS ThanhToan (
    ThanhToanID   SERIAL          PRIMARY KEY,
    DonHangID     INT             NOT NULL REFERENCES DonDatTour(DonHangID),
    NhanVienID    INT             NULL     REFERENCES NhanVien(NhanVienID),
    MaGiaoDich    VARCHAR(100)    NULL UNIQUE,
    SoTien        NUMERIC(15,2)   NOT NULL CHECK (SoTien > 0),
    HinhThucTT    VARCHAR(20)     NOT NULL
                                   CHECK (HinhThucTT IN ('VNPay','Chuyen khoan','Tien mat','MoMo')),
    NgayThanhToan TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThai     VARCHAR(20)     NOT NULL DEFAULT 'Cho xu ly'
                                   CHECK (TrangThai IN ('Cho xu ly','Thanh cong','That bai','Da hoan tien')),
    GhiChu        TEXT            NULL
);

COMMENT ON TABLE ThanhToan IS 'Lịch sử từng giao dịch: đặt cọc, thanh toán đủ, hoàn tiền';

-- =============================================================================
-- BẢNG 15: HOADON - Hóa đơn giá trị gia tăng (VAT)
-- =============================================================================
CREATE TABLE IF NOT EXISTS HoaDon (
    HoaDonID      SERIAL          PRIMARY KEY,
    DonHangID     INT             NOT NULL REFERENCES DonDatTour(DonHangID),
    ThanhToanID   INT             NULL     REFERENCES ThanhToan(ThanhToanID),
    SoHoaDon      VARCHAR(50)     NOT NULL UNIQUE,
    TenCongTy     VARCHAR(200)    NULL,
    MaSoThue      VARCHAR(20)     NULL,
    DiaChiCongTy  VARCHAR(255)    NULL,
    NgayXuat      DATE            NOT NULL DEFAULT CURRENT_DATE,
    TongTienVat   NUMERIC(15,2)   NOT NULL CHECK (TongTienVat >= 0),
    FileHoaDonURL VARCHAR(500)    NULL
);

COMMENT ON TABLE HoaDon IS 'Hóa đơn điện tử VAT xuất cho khách hàng doanh nghiệp';

-- =============================================================================
-- BẢNG 16: NHACUNGCAP - Đối tác nhà cung cấp dịch vụ
-- =============================================================================
CREATE TABLE IF NOT EXISTS NhaCungCap (
    NhaCungCapID SERIAL        PRIMARY KEY,
    TenNCC       VARCHAR(200)  NOT NULL,
    LoaiNCC      VARCHAR(50)   NOT NULL
                                CHECK (LoaiNCC IN ('Khach san','Nha hang','Xe van chuyen','Cong ty bay','Khu du lich','Khac')),
    NguoiLienHe VARCHAR(100)   NULL,
    SoDienThoai  VARCHAR(20)   NOT NULL,
    Email        VARCHAR(100)  NULL,
    DiaChi       VARCHAR(255)  NULL,
    DanhGia      NUMERIC(3,2)  NULL CHECK (DanhGia BETWEEN 0 AND 5)
);

COMMENT ON TABLE NhaCungCap IS 'Đối tác cung cấp dịch vụ cho đoàn tour: khách sạn, xe, nhà hàng...';

-- =============================================================================
-- BẢNG 17: DICHVUNHACUNGCAP - Danh mục dịch vụ của nhà cung cấp
-- =============================================================================
CREATE TABLE IF NOT EXISTS DichVuNhaCungCap (
    DichVuNCCID  SERIAL          PRIMARY KEY,
    NhaCungCapID INT             NOT NULL REFERENCES NhaCungCap(NhaCungCapID) ON DELETE CASCADE,
    TenDichVu    VARCHAR(200)    NOT NULL,
    LoaiDichVu   VARCHAR(100)    NULL,
    DonGia       NUMERIC(15,2)   NOT NULL CHECK (DonGia >= 0),
    DonViTinh    VARCHAR(50)     NOT NULL,
    MoTa         TEXT            NULL
);

COMMENT ON TABLE DichVuNhaCungCap IS 'Từng loại dịch vụ cụ thể của mỗi NCC (phòng đôi, xe 45 chỗ, set bữa ăn...)';

-- =============================================================================
-- BẢNG 18: PHIEUDATDICHVU - Phiếu đặt dịch vụ gửi nhà cung cấp
-- =============================================================================
CREATE TABLE IF NOT EXISTS PhieuDatDichVu (
    PhieuDatID     SERIAL          PRIMARY KEY,
    LichID         INT             NOT NULL REFERENCES LichKhoiHanh(LichID),
    NhanVienID     INT             NOT NULL REFERENCES NhanVien(NhanVienID),
    NhaCungCapID   INT             NOT NULL REFERENCES NhaCungCap(NhaCungCapID),
    MaPhieu        VARCHAR(30)     NOT NULL UNIQUE,
    NgayDat        DATE            NOT NULL DEFAULT CURRENT_DATE,
    TongTienDichVu NUMERIC(15,2)   NOT NULL DEFAULT 0,
    TienDaCoc      NUMERIC(15,2)   NOT NULL DEFAULT 0,
    TrangThai      VARCHAR(20)     NOT NULL DEFAULT 'Moi tao'
                                    CHECK (TrangThai IN ('Moi tao','Da gui NCC','NCC xac nhan','NCC tu choi','Da huy')),
    GhiChu         TEXT            NULL
);

COMMENT ON TABLE PhieuDatDichVu IS 'Phiếu đặt dịch vụ từ nhân viên điều hành gửi NCC cho một đợt khởi hành';

-- =============================================================================
-- BẢNG 19: CHITIETDATDICHVU - Chi tiết từng dịch vụ trong phiếu đặt
-- =============================================================================
CREATE TABLE IF NOT EXISTS ChiTietDatDichVu (
    ChiTietPhieuID SERIAL          PRIMARY KEY,
    PhieuDatID     INT             NOT NULL REFERENCES PhieuDatDichVu(PhieuDatID) ON DELETE CASCADE,
    DichVuNCCID    INT             NOT NULL REFERENCES DichVuNhaCungCap(DichVuNCCID),
    SoLuong        INT             NOT NULL CHECK (SoLuong > 0),
    DonGia         NUMERIC(15,2)   NOT NULL CHECK (DonGia >= 0),
    ThanhTien      NUMERIC(15,2)   NOT NULL CHECK (ThanhTien >= 0),
    NgaySuDung     DATE            NOT NULL
);

COMMENT ON TABLE ChiTietDatDichVu IS 'Dòng chi tiết trong phiếu đặt NCC: loại dịch vụ, số lượng, đơn giá';

-- =============================================================================
-- BẢNG 20: DIEUPHOITOUR - Phân công HDV cho đoàn tour
-- =============================================================================
CREATE TABLE IF NOT EXISTS DieuPhoiTour (
    DieuPhoiID   SERIAL        PRIMARY KEY,
    LichID       INT           NOT NULL REFERENCES LichKhoiHanh(LichID),
    HDVID        INT           NOT NULL REFERENCES HuongDanVien(HDVID),
    NhanVienID   INT           NOT NULL REFERENCES NhanVien(NhanVienID),
    NgayPhanCong TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThai    VARCHAR(20)   NOT NULL DEFAULT 'Cho xac nhan'
                                CHECK (TrangThai IN ('Cho xac nhan','Da xac nhan','Tu choi','Hoan thanh')),
    GhiChu       TEXT          NULL,
    UNIQUE (LichID, HDVID)
);

COMMENT ON TABLE DieuPhoiTour IS 'Phân công HDV phụ trách từng đợt lịch khởi hành';

-- =============================================================================
-- BẢNG 21: DANHGIA - Đánh giá & phản hồi tour
-- =============================================================================
CREATE TABLE IF NOT EXISTS DanhGia (
    DanhGiaID      SERIAL      PRIMARY KEY,
    KhachHangID    INT         NOT NULL REFERENCES KhachHang(KhachHangID),
    TourID         INT         NOT NULL REFERENCES Tour(TourID),
    DonHangID      INT         NOT NULL REFERENCES DonDatTour(DonHangID),
    SoSao          SMALLINT    NOT NULL CHECK (SoSao BETWEEN 1 AND 5),
    BinhLuan       TEXT        NULL,
    NgayDanhGia    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThaiDuyet VARCHAR(20) NOT NULL DEFAULT 'Cho duyet'
                                CHECK (TrangThaiDuyet IN ('Cho duyet','Da hien thi','An/Vi pham')),
    UNIQUE (KhachHangID, DonHangID)
);

COMMENT ON TABLE DanhGia IS 'Đánh giá sao + nhận xét của khách sau tour (mỗi đơn chỉ được đánh giá 1 lần)';

-- =============================================================================
-- BẢNG 22: BAOCAOQUYETTOAN - Quyết toán tài chính đoàn tour
-- =============================================================================
CREATE TABLE IF NOT EXISTS BaoCaoQuyetToan (
    QuyetToanID    SERIAL          PRIMARY KEY,
    LichID         INT             NOT NULL UNIQUE REFERENCES LichKhoiHanh(LichID),
    NhanVienLapID  INT             NOT NULL REFERENCES NhanVien(NhanVienID),
    TongThu        NUMERIC(15,2)   NOT NULL DEFAULT 0 CHECK (TongThu >= 0),
    TongChi        NUMERIC(15,2)   NOT NULL DEFAULT 0 CHECK (TongChi >= 0),
    LoiNhuan       NUMERIC(15,2)   GENERATED ALWAYS AS (TongThu - TongChi) STORED,
    NgayLap        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThaiDuyet VARCHAR(20)     NOT NULL DEFAULT 'Nhap'
                                    CHECK (TrangThaiDuyet IN ('Nhap','Da trinh duyet','Da phe duyet','Yeu cau chinh sua')),
    GhiChu         TEXT            NULL
);

COMMENT ON TABLE BaoCaoQuyetToan IS 'Quyết toán tài chính sau tour: tổng thu, tổng chi, lợi nhuận tự tính (GENERATED)';

-- =============================================================================
-- INDEX - Tối ưu hiệu năng truy vấn thường xuyên
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_taikhoan_email       ON TaiKhoan(Email);
CREATE INDEX IF NOT EXISTS idx_tour_danhmuc         ON Tour(DanhMucID);
CREATE INDEX IF NOT EXISTS idx_tour_trangthai       ON Tour(TrangThaiDuyet);
CREATE INDEX IF NOT EXISTS idx_lich_tourid          ON LichKhoiHanh(TourID);
CREATE INDEX IF NOT EXISTS idx_lich_ngaykhoihanh    ON LichKhoiHanh(NgayKhoiHanh);
CREATE INDEX IF NOT EXISTS idx_don_khachhang        ON DonDatTour(KhachHangID);
CREATE INDEX IF NOT EXISTS idx_don_lich             ON DonDatTour(LichID);
CREATE INDEX IF NOT EXISTS idx_don_trangthai        ON DonDatTour(TrangThaiDon);
CREATE INDEX IF NOT EXISTS idx_chitiethk_don        ON ChiTietHanhKhach(DonHangID);
CREATE INDEX IF NOT EXISTS idx_thanhtoan_don        ON ThanhToan(DonHangID);
CREATE INDEX IF NOT EXISTS idx_phieu_lich           ON PhieuDatDichVu(LichID);
CREATE INDEX IF NOT EXISTS idx_phieu_ncc            ON PhieuDatDichVu(NhaCungCapID);
CREATE INDEX IF NOT EXISTS idx_dieupho_lich         ON DieuPhoiTour(LichID);
CREATE INDEX IF NOT EXISTS idx_dieupho_hdv          ON DieuPhoiTour(HDVID);
CREATE INDEX IF NOT EXISTS idx_danhgia_tour         ON DanhGia(TourID);

-- =============================================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- =============================================================================
INSERT INTO VaiTro (TenVaiTro, MoTa) VALUES
    ('Admin',        'Quản trị viên hệ thống - toàn quyền'),
    ('Dieu hanh',    'Nhân viên điều hành tour'),
    ('Ke toan',      'Nhân viên kế toán'),
    ('HDV',          'Hướng dẫn viên du lịch'),
    ('Khach hang',   'Khách du lịch')
ON CONFLICT DO NOTHING;

INSERT INTO DanhMucTour (TenDanhMuc, MoTa) VALUES
    ('Tour Trong Nuoc',       'Các chương trình du lịch trong lãnh thổ Việt Nam'),
    ('Tour Quoc Te',          'Các chương trình du lịch nước ngoài'),
    ('Tour Mao Hiem',         'Tour leo núi, chèo thuyền, camping, dã ngoại'),
    ('Tour Nghi Duong',       'Tour nghỉ dưỡng biển, spa, resort cao cấp'),
    ('Tour Van Hoa Lich Su',  'Tham quan di tích, bảo tàng, lễ hội truyền thống')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- THÔNG BÁO KẾT QUẢ
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TẠO CSDL QUẢN LÝ TOUR DU LỊCH THÀNH CÔNG ===';
    RAISE NOTICE 'Tổng số bảng  : 22';
    RAISE NOTICE 'Tổng số index : 15';
    RAISE NOTICE '';
    RAISE NOTICE '--- Cách vẽ ERD trong pgAdmin 4 ---';
    RAISE NOTICE 'Cách 1: Chuột phải vào database > ERD For Database';
    RAISE NOTICE 'Cách 2: Menu trên > Tools > ERD Tool';
    RAISE NOTICE 'Sau đó: Click "Generate ERD" để vẽ tự động tất cả bảng';
    RAISE NOTICE 'Export: File > Save as Image (PNG/SVG) để chèn vào báo cáo';
    RAISE NOTICE '================================================';
END $$;
