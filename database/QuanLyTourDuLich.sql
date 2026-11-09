-- =============================================================================
-- HỆ THỐNG QUẢN LÝ TOUR DU LỊCH (VIETTOUR)
-- CƠ SỞ DỮ LIỆU POSTGRESQL (27 BẢNG)
-- Khóa luận tốt nghiệp ngành Công nghệ Thông tin - HUIT
-- =============================================================================

BEGIN;

-- =============================================================================
-- PHẦN 1: KHỞI TẠO CẤU TRÚC 27 BẢNG DỮ LIỆU CHUẨN HÓA (DDL)
-- =============================================================================

-- 1. BẢNG TAIKHOAN: Tài khoản người dùng (Khách hàng, Nhân viên, HDV, Quản trị)
CREATE TABLE IF NOT EXISTS TaiKhoan (
    TaiKhoanID        SERIAL         PRIMARY KEY,
    Email             VARCHAR(100)   NOT NULL UNIQUE,
    MatKhauHash       VARCHAR(255)   NOT NULL,
    SoDienThoai       VARCHAR(20)    UNIQUE,
    TrangThai         SMALLINT       NOT NULL DEFAULT 1 CHECK (TrangThai IN (0, 1)),
    NgayTao           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email_verified_at TIMESTAMP      NULL,
    remember_token    VARCHAR(100)   NULL
);
COMMENT ON TABLE TaiKhoan IS 'Lưu trữ thông tin xác thực tài khoản đăng nhập cho toàn bộ hệ thống';

-- 2. BẢNG VAITRO: Danh mục các vai trò trong hệ thống RBAC
CREATE TABLE IF NOT EXISTS VaiTro (
    VaiTroID  SERIAL        PRIMARY KEY,
    TenVaiTro VARCHAR(50)   NOT NULL UNIQUE,
    MoTa      VARCHAR(255)  NULL
);
COMMENT ON TABLE VaiTro IS 'Danh mục vai trò phân quyền: Admin, Dieu hanh, Ke toan, HDV, Khach hang';

-- 3. BẢNG PHANQUYEN: Bảng liên kết nhiều - nhiều giữa Tài khoản và Vai trò
CREATE TABLE IF NOT EXISTS PhanQuyen (
    TaiKhoanID  INT       NOT NULL REFERENCES TaiKhoan(TaiKhoanID) ON DELETE CASCADE,
    VaiTroID    INT       NOT NULL REFERENCES VaiTro(VaiTroID)     ON DELETE CASCADE,
    NgayGan     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (TaiKhoanID, VaiTroID)
);

-- 4. BẢNG KHACHHANG: Hồ sơ khách du lịch
CREATE TABLE IF NOT EXISTS KhachHang (
    KhachHangID    SERIAL        PRIMARY KEY,
    TaiKhoanID     INT           NOT NULL UNIQUE REFERENCES TaiKhoan(TaiKhoanID) ON DELETE CASCADE,
    HoTen          VARCHAR(100)  NOT NULL,
    DiaChiGiaoHang VARCHAR(255)  NULL,
    SoDienThoai    VARCHAR(20)   NOT NULL,
    Email          VARCHAR(100)  NOT NULL,
    CCCD           VARCHAR(12)   NULL,
    NgaySinh       DATE          NULL,
    GioiTinh       VARCHAR(10)   NULL CHECK (GioiTinh IN ('Nam', 'Nu', 'Khac'))
);

-- 5. BẢNG NHANVIEN: Hồ sơ nhân viên công ty lữ hành
CREATE TABLE IF NOT EXISTS NhanVien (
    NhanVienID  SERIAL        PRIMARY KEY,
    TaiKhoanID  INT           NOT NULL UNIQUE REFERENCES TaiKhoan(TaiKhoanID) ON DELETE CASCADE,
    HoTen       VARCHAR(100)  NOT NULL,
    DiaChi      VARCHAR(255)  NULL,
    SoDienThoai VARCHAR(20)   NOT NULL,
    Email       VARCHAR(100)  NOT NULL,
    ChucVu      VARCHAR(50)   NOT NULL,
    NgayVaoLam  DATE          NULL
);

-- 6. BẢNG HUONGDANVIEN: Thông tin chi tiết hướng dẫn viên dẫn đoàn
CREATE TABLE IF NOT EXISTS HuongDanVien (
    HDVID       SERIAL        PRIMARY KEY,
    NhanVienID  INT           NOT NULL UNIQUE REFERENCES NhanVien(NhanVienID) ON DELETE CASCADE,
    SoTheHDV    VARCHAR(50)   NOT NULL UNIQUE,
    NgonNgu     VARCHAR(100)  NOT NULL,
    KinhNghiem  VARCHAR(100)  NULL,
    TrangThai   VARCHAR(30)   NOT NULL DEFAULT 'San sang'
                              CHECK (TrangThai IN ('San sang', 'Dang di tour', 'Nghi phep', 'Nghi viec'))
);

-- 7. BẢNG DANHMUCTOUR: Danh mục phân loại tour du lịch
CREATE TABLE IF NOT EXISTS DanhMucTour (
    DanhMucID  SERIAL        PRIMARY KEY,
    TenDanhMuc VARCHAR(100)  NOT NULL,
    MoTa       VARCHAR(255)  NULL
);

-- 8. BẢNG TOUR: Thông tin sản phẩm tour du lịch
CREATE TABLE IF NOT EXISTS Tour (
    TourID         SERIAL          PRIMARY KEY,
    DanhMucID      INT             NOT NULL REFERENCES DanhMucTour(DanhMucID),
    NhanVienTaoID  INT             NOT NULL REFERENCES NhanVien(NhanVienID),
    MaTour         VARCHAR(30)     NOT NULL UNIQUE,
    TenTour        VARCHAR(200)    NOT NULL,
    ThoiGian       VARCHAR(50)     NOT NULL,
    DiemKhoiHanh   VARCHAR(100)    NOT NULL,
    DiemDen        VARCHAR(100)    NOT NULL,
    MoTaChiTiet    TEXT            NULL,
    LichTrinh      TEXT            NULL,
    GiaNguoiLon    NUMERIC(15,2)   NOT NULL CHECK (GiaNguoiLon >= 0),
    GiaTreEm       NUMERIC(15,2)   NOT NULL DEFAULT 0 CHECK (GiaTreEm >= 0),
    HinhAnhURL     VARCHAR(500)    NULL,
    PhuongTien     VARCHAR(100)    NULL DEFAULT 'Xe du lịch đời mới / Máy bay',
    DichVuDiKem    TEXT            NULL,
    TrangThaiDuyet VARCHAR(20)     NOT NULL DEFAULT 'Cho duyet'
                                   CHECK (TrangThaiDuyet IN ('Cho duyet', 'Dang mo ban', 'Tam dung', 'Da huy')),
    NgayTao        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat    TIMESTAMP       NULL
);

-- 9. BẢNG LICHKHOIHANH: Các đợt khởi hành theo tour
CREATE TABLE IF NOT EXISTS LichKhoiHanh (
    LichID       SERIAL        PRIMARY KEY,
    TourID       INT           NOT NULL REFERENCES Tour(TourID) ON DELETE CASCADE,
    MaLich       VARCHAR(30)   NOT NULL UNIQUE,
    NgayKhoiHanh TIMESTAMP     NOT NULL,
    NgayKetThuc  TIMESTAMP     NOT NULL,
    SoChoToiDa   INT           NOT NULL CHECK (SoChoToiDa > 0),
    SoChoDaDat   INT           NOT NULL DEFAULT 0 CHECK (SoChoDaDat >= 0),
    TrangThai    VARCHAR(20)   NOT NULL DEFAULT 'Cho khoi hanh'
                               CHECK (TrangThai IN ('Cho khoi hanh', 'Dang di', 'Hoan thanh', 'Da huy')),
    CONSTRAINT chk_ngay_khoihanh CHECK (NgayKetThuc >= NgayKhoiHanh),
    CONSTRAINT chk_socho CHECK (SoChoDaDat <= SoChoToiDa)
);

-- 10. BẢNG VOUCHER: Mã giảm giá áp dụng khi khách đặt tour
CREATE TABLE IF NOT EXISTS Voucher (
    VoucherID           SERIAL        PRIMARY KEY,
    MaVoucher           VARCHAR(30)   NOT NULL UNIQUE,
    TenChuongTrinh      VARCHAR(200)  NOT NULL,
    PhanTramGiam        NUMERIC(5,2)  NULL CHECK (PhanTramGiam IS NULL OR (PhanTramGiam > 0 AND PhanTramGiam <= 100)),
    GiamToiDa           NUMERIC(15,2) NULL CHECK (GiamToiDa IS NULL OR GiamToiDa > 0),
    GiaTriDonToiThieu   NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (GiaTriDonToiThieu >= 0),
    SoLuongToiDa        INT           NULL CHECK (SoLuongToiDa IS NULL OR SoLuongToiDa > 0),
    NgayBatDau          DATE          NOT NULL,
    NgayKetThuc         DATE          NOT NULL,
    TrangThai           SMALLINT      NOT NULL DEFAULT 1 CHECK (TrangThai IN (0, 1)),
    CONSTRAINT chk_voucher_ngay CHECK (NgayKetThuc >= NgayBatDau)
);

-- 11. BẢNG APDUNGVOUCHER: Giới hạn voucher theo chương trình tour
CREATE TABLE IF NOT EXISTS ApDungVoucher (
    ApDungVoucherID SERIAL PRIMARY KEY,
    VoucherID       INT    NOT NULL REFERENCES Voucher(VoucherID) ON DELETE CASCADE,
    TourID          INT    NOT NULL REFERENCES Tour(TourID) ON DELETE CASCADE,
    NgayApDung      DATE   NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (VoucherID, TourID)
);

-- 12. BẢNG CHUONGTRINHKHUYENMAI (CTKM): Giảm giá tự động theo tour theo khoảng thời gian
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

-- 13. BẢNG APDUNGCTKM: Gán tour vào chương trình khuyến mãi tự động
CREATE TABLE IF NOT EXISTS ApDungCTKM (
    ApDungCTKMID SERIAL PRIMARY KEY,
    CTKMID       INT    NOT NULL REFERENCES ChuongTrinhKhuyenMai(CTKMID) ON DELETE CASCADE,
    TourID       INT    NOT NULL REFERENCES Tour(TourID) ON DELETE CASCADE,
    UNIQUE (CTKMID, TourID)
);

-- 14. BẢNG DANGKYNHANTIN: Đăng ký nhận bản tin khuyến mãi qua Email
CREATE TABLE IF NOT EXISTS DangKyNhanTin (
    DangKyID    SERIAL       PRIMARY KEY,
    Email       VARCHAR(100) NOT NULL UNIQUE,
    KhachHangID INT          NULL REFERENCES KhachHang(KhachHangID) ON DELETE SET NULL,
    Token       VARCHAR(64)  NOT NULL UNIQUE,
    TrangThai   SMALLINT     NOT NULL DEFAULT 1 CHECK (TrangThai IN (0, 1)),
    NguonDangKy VARCHAR(30)  NOT NULL DEFAULT 'Website',
    NgayDangKy  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    NgayHuy     TIMESTAMP    NULL
);

-- 15. BẢNG NHATKYGUIMAIL: Lưu nhật ký gửi email hệ thống (vé QR, thông báo, hoàn tiền)
CREATE TABLE IF NOT EXISTS NhatKyGuiMail (
    NhatKyID   SERIAL       PRIMARY KEY,
    LoaiMail   VARCHAR(40)  NOT NULL,
    EmailNhan  VARCHAR(100) NOT NULL,
    TieuDe     VARCHAR(255) NOT NULL,
    TrangThai  VARCHAR(20)  NOT NULL CHECK (TrangThai IN ('Thanh cong', 'That bai', 'Bo qua')),
    ChiTietLoi TEXT         NULL,
    ThamChieu  VARCHAR(100) NULL,
    NgayGui    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. BẢNG DONDATTOUR: Đơn đặt tour của khách hàng
CREATE TABLE IF NOT EXISTS DonDatTour (
    DonHangID        SERIAL          PRIMARY KEY,
    KhachHangID      INT             NOT NULL REFERENCES KhachHang(KhachHangID),
    LichID           INT             NOT NULL REFERENCES LichKhoiHanh(LichID),
    NhanVienXuLyID   INT             NULL REFERENCES NhanVien(NhanVienID),
    VoucherID        INT             NULL REFERENCES Voucher(VoucherID),
    CTKMID           INT             NULL REFERENCES ChuongTrinhKhuyenMai(CTKMID),
    MaDon            VARCHAR(30)     NOT NULL UNIQUE,
    NgayDat          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    SoLuongNguoiLon  INT             NOT NULL DEFAULT 1 CHECK (SoLuongNguoiLon >= 1),
    SoLuongTreEm     INT             NOT NULL DEFAULT 0 CHECK (SoLuongTreEm >= 0),
    TongTien         NUMERIC(15,2)   NOT NULL CHECK (TongTien >= 0),
    GiamGia          NUMERIC(15,2)   NOT NULL DEFAULT 0 CHECK (GiamGia >= 0),
    GiamGiaKhuyenMai NUMERIC(15,2)   NOT NULL DEFAULT 0 CHECK (GiamGiaKhuyenMai >= 0),
    TienCoc          NUMERIC(15,2)   NOT NULL DEFAULT 0 CHECK (TienCoc >= 0),
    TienConLai       NUMERIC(15,2)   NOT NULL DEFAULT 0 CHECK (TienConLai >= 0),
    TrangThaiDon     VARCHAR(20)     NOT NULL DEFAULT 'Cho thanh toan'
                                     CHECK (TrangThaiDon IN ('Cho thanh toan', 'Da dat coc', 'Da thanh toan', 'Da xac nhan', 'Dang thuc hien', 'Hoan thanh', 'Da huy')),
    PhuongThucTT     VARCHAR(20)     NULL CHECK (PhuongThucTT IN ('VNPay', 'ZaloPay', 'Chuyen khoan', 'Tien mat', 'MoMo', 'VNPAY')),
    GhiChu           TEXT            NULL
);

-- 17. BẢNG CHITIETHANHKHACH: Danh sách hành khách trong đoàn, tích hợp mã QR vé
CREATE TABLE IF NOT EXISTS ChiTietHanhKhach (
    ChiTietID         SERIAL       PRIMARY KEY,
    DonHangID         INT          NOT NULL REFERENCES DonDatTour(DonHangID) ON DELETE CASCADE,
    HoTen             VARCHAR(100) NOT NULL,
    NgaySinh          DATE         NULL,
    LoaiKhach         VARCHAR(20)  NOT NULL DEFAULT 'Nguoi lon' CHECK (LoaiKhach IN ('Nguoi lon', 'Tre em', 'Em be')),
    CCCD              VARCHAR(12)  NULL,
    MaQRVe            VARCHAR(255) NULL UNIQUE,
    TrangThaiDiemDanh SMALLINT     NOT NULL DEFAULT 0 CHECK (TrangThaiDiemDanh IN (0, 1)),
    GhiChu            TEXT         NULL
);

-- 18. BẢNG THANHTOAN: Lịch sử các giao dịch thanh toán
CREATE TABLE IF NOT EXISTS ThanhToan (
    ThanhToanID   SERIAL        PRIMARY KEY,
    DonHangID     INT           NOT NULL REFERENCES DonDatTour(DonHangID),
    NhanVienID    INT           NULL REFERENCES NhanVien(NhanVienID),
    MaGiaoDich    VARCHAR(100)  NULL UNIQUE,
    SoTien        NUMERIC(15,2) NOT NULL CHECK (SoTien > 0),
    HinhThucTT    VARCHAR(20)   NOT NULL CHECK (HinhThucTT IN ('VNPay', 'ZaloPay', 'Chuyen khoan', 'Tien mat', 'MoMo', 'VNPAY', 'VietQR')),
    NgayThanhToan TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThai     VARCHAR(20)   NOT NULL DEFAULT 'Cho xu ly'
                                CHECK (TrangThai IN ('Cho xu ly', 'Thanh cong', 'That bai', 'Da hoan tien')),
    GhiChu        TEXT          NULL
);

-- 19. BẢNG HOADON: Hóa đơn điện tử e-Invoice
CREATE TABLE IF NOT EXISTS HoaDon (
    HoaDonID      SERIAL        PRIMARY KEY,
    DonHangID     INT           NOT NULL REFERENCES DonDatTour(DonHangID),
    ThanhToanID   INT           NULL REFERENCES ThanhToan(ThanhToanID),
    SoHoaDon      VARCHAR(50)   NOT NULL UNIQUE,
    TenCongTy     VARCHAR(200)  NULL,
    MaSoThue      VARCHAR(20)   NULL,
    DiaChiCongTy  VARCHAR(255)  NULL,
    NgayXuat      DATE          NOT NULL DEFAULT CURRENT_DATE,
    TongTienVat   NUMERIC(15,2) NOT NULL CHECK (TongTienVat >= 0),
    FileHoaDonURL VARCHAR(500)  NULL
);

-- 20. BẢNG NHACUNGCAP: Danh bạ đối tác cung cấp dịch vụ du lịch (xe, khách sạn, nhà hàng)
CREATE TABLE IF NOT EXISTS NhaCungCap (
    NhaCungCapID SERIAL        PRIMARY KEY,
    TenNCC       VARCHAR(200)  NOT NULL,
    LoaiNCC      VARCHAR(50)   NOT NULL CHECK (LoaiNCC IN ('Khach san', 'Nha hang', 'Xe van chuyen', 'Ve tham quan', 'Huong dan vien ngoai', 'Bao hiem', 'Dich vu khac')),
    NguoiLienHe  VARCHAR(100)  NULL,
    SoDienThoai  VARCHAR(20)   NOT NULL,
    Email        VARCHAR(100)  NULL,
    DiaChi       VARCHAR(255)  NULL,
    MaSoThue     VARCHAR(20)   NULL,
    DanhGia      NUMERIC(3,2)  NULL CHECK (DanhGia BETWEEN 1 AND 5),
    TrangThai    SMALLINT      NOT NULL DEFAULT 1 CHECK (TrangThai IN (0, 1))
);

-- 21. BẢNG DICHVUNHACUNGCAP: Chi tiết bảng giá dịch vụ từng đối tác
CREATE TABLE IF NOT EXISTS DichVuNhaCungCap (
    DichVuNCCID  SERIAL        PRIMARY KEY,
    NhaCungCapID INT           NOT NULL REFERENCES NhaCungCap(NhaCungCapID) ON DELETE CASCADE,
    TenDichVu    VARCHAR(200)  NOT NULL,
    LoaiDichVu   VARCHAR(100)  NULL,
    DonGia       NUMERIC(15,2) NOT NULL CHECK (DonGia >= 0),
    DonViTinh    VARCHAR(50)   NOT NULL,
    MoTa         TEXT          NULL,
    TrangThai    SMALLINT      NOT NULL DEFAULT 1 CHECK (TrangThai IN (0, 1))
);

-- 22. BẢNG PHIEUDATDICHVU: Phiếu đặt cọc / đặt dịch vụ với nhà cung cấp
CREATE TABLE IF NOT EXISTS PhieuDatDichVu (
    PhieuDatID     SERIAL        PRIMARY KEY,
    LichID         INT           NOT NULL REFERENCES LichKhoiHanh(LichID),
    NhanVienID     INT           NOT NULL REFERENCES NhanVien(NhanVienID),
    NhaCungCapID   INT           NOT NULL REFERENCES NhaCungCap(NhaCungCapID),
    MaPhieu        VARCHAR(30)   NOT NULL UNIQUE,
    NgayDat        DATE          NOT NULL DEFAULT CURRENT_DATE,
    TongTienDichVu NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (TongTienDichVu >= 0),
    TienDaCoc      NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (TienDaCoc >= 0),
    TrangThai      VARCHAR(20)   NOT NULL DEFAULT 'Moi tao'
                                 CHECK (TrangThai IN ('Moi tao', 'Da xac nhan', 'NCC tu choi', 'Hoan thanh', 'Da thanh toan', 'Da huy')),
    GhiChu         TEXT          NULL,
    HanThanhToan   DATE          NULL,
    SoHoaDonNCC    VARCHAR(50)   NULL
);

-- 23. BẢNG CHITIETDATDICHVU: Chi tiết dịch vụ cụ thể trên phiếu đặt
CREATE TABLE IF NOT EXISTS ChiTietDatDichVu (
    ChiTietPhieuID SERIAL        PRIMARY KEY,
    PhieuDatID     INT           NOT NULL REFERENCES PhieuDatDichVu(PhieuDatID) ON DELETE CASCADE,
    DichVuNCCID    INT           NOT NULL REFERENCES DichVuNhaCungCap(DichVuNCCID),
    SoLuong        INT           NOT NULL DEFAULT 1 CHECK (SoLuong > 0),
    DonGia         NUMERIC(15,2) NOT NULL CHECK (DonGia >= 0),
    ThanhTien      NUMERIC(15,2) NOT NULL CHECK (ThanhTien >= 0),
    NgaySuDung     DATE          NOT NULL DEFAULT CURRENT_DATE
);

-- 24. BẢNG DIEUPHOITOUR: Phân công nhiệm vụ Hướng dẫn viên cho đợt khởi hành
CREATE TABLE IF NOT EXISTS DieuPhoiTour (
    DieuPhoiID SERIAL       PRIMARY KEY,
    LichID     INT          NOT NULL REFERENCES LichKhoiHanh(LichID) ON DELETE CASCADE,
    HDVID      INT          NOT NULL REFERENCES HuongDanVien(HDVID),
    NhanVienID INT          NOT NULL REFERENCES NhanVien(NhanVienID),
    NgayPhanCong TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    VaiTro     VARCHAR(50)  NOT NULL DEFAULT 'HDV Chinh' CHECK (VaiTro IN ('HDV Chinh', 'HDV Phu', 'Thuc tap')),
    TrangThai  VARCHAR(20)  NOT NULL DEFAULT 'Cho xac nhan'
                            CHECK (TrangThai IN ('Cho xac nhan', 'Da xac nhan', 'Tu choi', 'Dang dan tour', 'Hoan thanh')),
    GhiChu     TEXT         NULL,
    UNIQUE (LichID, HDVID)
);

-- 25. BẢNG BAOCAOQUYETTOAN: Quyết toán doanh thu, chi phí 3 tầng, lợi nhuận sau chuyến đi
CREATE TABLE IF NOT EXISTS BaoCaoQuyetToan (
    QuyetToanID     SERIAL        PRIMARY KEY,
    LichID          INT           NOT NULL UNIQUE REFERENCES LichKhoiHanh(LichID),
    NhanVienLapID   INT           NOT NULL REFERENCES NhanVien(NhanVienID),
    TongThu         NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (TongThu >= 0),
    TongChi         NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (TongChi >= 0),
    LoiNhuan        NUMERIC(15,2) GENERATED ALWAYS AS (TongThu - TongChi) STORED,
    ThucThu         NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (ThucThu >= 0),
    CongNoPhaiThu   NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (CongNoPhaiThu >= 0),
    ChiPhiNCC       NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (ChiPhiNCC >= 0),
    ChiPhiHDV       NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (ChiPhiHDV >= 0),
    ChiPhiKhac      NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (ChiPhiKhac >= 0),
    CongNoPhaiTra   NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (CongNoPhaiTra >= 0),
    NgayLap         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThaiDuyet  VARCHAR(20)   NOT NULL DEFAULT 'Nhap'
                                  CHECK (TrangThaiDuyet IN ('Nhap', 'Da trinh duyet', 'Da phe duyet', 'Yeu cau chinh sua')),
    NhanVienDuyetID INT           NULL REFERENCES NhanVien(NhanVienID),
    NgayDuyet       TIMESTAMP     NULL,
    LyDoTraLai      TEXT          NULL,
    GhiChu          TEXT          NULL
);

-- 26. BẢNG CHIPHIPHATSINH: Chi phí phát sinh thực tế của đoàn khởi hành
CREATE TABLE IF NOT EXISTS ChiPhiPhatSinh (
    ChiPhiID      SERIAL        PRIMARY KEY,
    LichID        INT           NOT NULL REFERENCES LichKhoiHanh(LichID) ON DELETE CASCADE,
    NhanVienID    INT           NOT NULL REFERENCES NhanVien(NhanVienID) ON DELETE CASCADE,
    LoaiChiPhi    VARCHAR(40)   NOT NULL,
    NoiDung       VARCHAR(255)  NOT NULL,
    SoTien        NUMERIC(15,2) NOT NULL CHECK (SoTien > 0),
    NgayChi       DATE          NOT NULL DEFAULT CURRENT_DATE,
    SoChungTu     VARCHAR(50)   NULL,
    GhiChu        TEXT          NULL
);

-- 27. BẢNG DANHGIA: Nhận xét và đánh giá sao từ khách hàng sau tour
CREATE TABLE IF NOT EXISTS DanhGia (
    DanhGiaID      SERIAL      PRIMARY KEY,
    KhachHangID    INT         NOT NULL REFERENCES KhachHang(KhachHangID),
    TourID         INT         NOT NULL REFERENCES Tour(TourID),
    DonHangID      INT         NOT NULL REFERENCES DonDatTour(DonHangID),
    SoSao          SMALLINT    NOT NULL CHECK (SoSao BETWEEN 1 AND 5),
    BinhLuan       TEXT        NULL,
    NgayDanhGia    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThaiDuyet VARCHAR(20) NOT NULL DEFAULT 'Cho duyet'
                               CHECK (TrangThaiDuyet IN ('Cho duyet', 'Da hien thi', 'An/Vi pham')),
    UNIQUE (KhachHangID, DonHangID)
);

-- =============================================================================
-- PHẦN 2: TỐI ƯU HỆ THỐNG INDEX (INDEXING)
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
CREATE INDEX IF NOT EXISTS idx_chitiethk_qr         ON ChiTietHanhKhach(MaQRVe);
CREATE INDEX IF NOT EXISTS idx_thanhtoan_don        ON ThanhToan(DonHangID);
CREATE INDEX IF NOT EXISTS idx_phieu_lich           ON PhieuDatDichVu(LichID);
CREATE INDEX IF NOT EXISTS idx_phieu_ncc            ON PhieuDatDichVu(NhaCungCapID);
CREATE INDEX IF NOT EXISTS idx_dieupho_lich         ON DieuPhoiTour(LichID);
CREATE INDEX IF NOT EXISTS idx_dieupho_hdv          ON DieuPhoiTour(HDVID);
CREATE INDEX IF NOT EXISTS idx_danhgia_tour         ON DanhGia(TourID);
CREATE INDEX IF NOT EXISTS idx_ctkm_thoigian        ON ChuongTrinhKhuyenMai(NgayBatDau, NgayKetThuc);
CREATE INDEX IF NOT EXISTS idx_nhatkymail_ngay      ON NhatKyGuiMail(NgayGui);

-- =============================================================================
-- PHẦN 3: STORED PROCEDURES & BUSINESS FUNCTIONS
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_KiemTraHieuLucVoucher(p_VoucherID INT)
RETURNS BOOLEAN AS $$
DECLARE
    v_ngaybatdau DATE;
    v_ngayketthuc DATE;
    v_trangthai SMALLINT;
BEGIN
    SELECT NgayBatDau, NgayKetThuc, TrangThai INTO v_ngaybatdau, v_ngayketthuc, v_trangthai
    FROM Voucher WHERE VoucherID = p_VoucherID;
    IF NOT FOUND THEN RETURN FALSE; END IF;
    RETURN v_trangthai = 1 AND CURRENT_DATE BETWEEN v_ngaybatdau AND v_ngayketthuc;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PHẦN 4: DỮ LIỆU MẪU CHUẨN KIỂM THỬ KHÓA LUẬN (SEED DATA)
-- =============================================================================

-- 1. Vai trò hệ thống
INSERT INTO VaiTro (VaiTroID, TenVaiTro, MoTa) VALUES
    (1, 'Admin',        'Quản trị viên toàn quyền hệ thống'),
    (2, 'Dieu hanh',    'Trưởng phòng / Nhân viên điều hành tour'),
    (3, 'Ke toan',      'Kế toán trưởng / Tài chính doanh nghiệp'),
    (4, 'HDV',          'Hướng dẫn viên du lịch dẫn đoàn'),
    (5, 'Khach hang',   'Khách du lịch đặt tour')
ON CONFLICT (VaiTroID) DO NOTHING;

-- 2. Tài khoản người dùng (Mật khẩu mặc định: 123456)
INSERT INTO TaiKhoan (TaiKhoanID, Email, MatKhauHash, SoDienThoai, TrangThai) VALUES
    (1,  'admin@viettour.vn',      'scrypt$cf757da0c56adef20fcdbbaf0b9d333b$ae6d2549ad250b20fefd1f66b8156222c8244763beb4933d63ef5e4f2098affbfd7942d10e09d53868e1fbb04beae1f1aa36fb5bdb0e101436a85bbce0071c93', '0901000001', 1),
    (2,  'dieuhanh@viettour.vn',   'scrypt$8f61b07cf83d3d7ecc8611eb1d079071$d46510ca221a74a94450dc0280739e76a9d0ffae27ea3273dcfc6fa8deddb9914c6f2f38e14d5b6f48399c99f8b1cd5bc916870e0f2bd342fa959e2c22fed753', '0901000002', 1),
    (3,  'ketoan@viettour.vn',     'scrypt$1ae8282be32ac999126da2d506b49748$eb2d71b46e3b9082e6f021c050ace641b4133d920a13f98a63124e08815d413e4620f78f7551bdec5c12897a4999c2fb7b28da14b142a1fe1274b16f01b51b86', '0901000003', 1),
    (4,  'hdv1@viettour.vn',       'scrypt$fd7df96f9bdddb93887bca4518204483$031528fa84ce2d2422eb694fbe75565aa1621ea780993adaa9f3aa91414813e3a3dd2fc43076088eb5c46e64a8354ff36ac120d70322fae3b2b2da59a37aee7e', '0903112233', 1),
    (5,  'khach1@gmail.com',       'scrypt$109932f047e1d9545c8615e03cbe72a6$0961d507264d8dc3ee3fc38dc50f87d72098042192bc6b4cde3cc07b02465ee8e692da160c2c5d25d405765bca0998c48a2bf82e23af3939e1e48dd0a245002f', '0908123456', 1),
    (6,  'khach.thao@yahoo.com',   'scrypt$ccde9ca315c8150602d6f6b5eab5ab60$4be1597c95763ad16bd08cd91774a6e348f1ef8a3d0ef65f647f113335fab2dc940afe39865af178fd7c1d7b3b5091d5e65621cd929d44028af8b2218c1ce5f6', '0912987654', 1),
    (7,  'hdv.mai@viettour.vn',    'scrypt$e9539dc5b02e997029f7862da0aa9e30$726580c77874d05aa9099c545663a0eef645662e0e65853e1541b1b44b5a913cc812bb433c63a4c25d43d115c2a5087fb9e3116f328b9cb10505a5cd154b22ba', '0903223344', 1),
    (8,  'hdv.khoa@viettour.vn',   'scrypt$e3e6e31f006a9db54cc59e34e7187225$7c25285783eaead88451b278d067ec1f078acb67ec26810260e2ff5ffc1dc2e030c4b5eff73a893d4b9718027cbf32fcd5b428238e6c4cd7837639cb1d9f1aee', '0903334455', 1),
    (9,  'hdv.huong@viettour.vn',  'scrypt$aaeadc0c7abe5189581770cdc5e3bf9b$ffead0b954aac23decac98028a08d42855a410354ce254dd327e27c030625879e3134808925aeb388cfd013f3bbd4232675582edcb8b38901dcd55c9f8122eb1', '0903445566', 1),
    (10, 'hdv.tuan@viettour.vn',   'scrypt$13ce04a68026579afa3bd4342c00d936$f6390d9e1cd8dc308aeffdccf2d9a9a8eca16096b776413c6b4d8a52401365f6241dcd74dad9fe50618b63758690c64ba297fcbe8941e47eaed49e19b1ad4cca', '0903556677', 1),
    (11, 'dong@gmail.com',         'scrypt$5d8fd22ec6e10c1d636ae87a6fb8b425$ad917ce02d6c9fadd58fe994ef6f7ba2898a9349083898fc58cd0ae590e21970925ce579d8d3db60f858ac1f2adf00c98ac34c865ecc6a59892fbef440016ffe', '0901230180', 1),
    (12, 'tu@gmail.com',           'scrypt$cca59d1c011409c514542bc5ccd3a2d0$f5127d39ff9671a05850fec7abdbef6447a2ab74de560166eca4a87aadabd6897f5fe6f334fd2291ee0b28334816df83669c65fce8994c6cb58085fece2451b9', '0901230844', 1)
ON CONFLICT (TaiKhoanID) DO NOTHING;

-- 3. Gán phân quyền vai trò
INSERT INTO PhanQuyen (TaiKhoanID, VaiTroID) VALUES
    (1, 1), -- Admin
    (2, 2), -- Dieu hanh
    (3, 3), -- Ke toan
    (4, 4), -- HDV Le Hoang Nam (hdv1)
    (5, 5), -- Khach hang Nguyen Van Hung (khach1)
    (6, 5), -- Khach hang Tran Thi Thu Thao
    (7, 4), -- HDV Tran Thi Tuyet Mai
    (8, 4), -- HDV Nguyen Dang Khoa
    (9, 4), -- HDV Do Lan Huong
    (10, 4) -- HDV Vu Minh Tuan
ON CONFLICT DO NOTHING;

-- 4. Nhân viên công ty
INSERT INTO NhanVien (NhanVienID, TaiKhoanID, HoTen, SoDienThoai, Email, ChucVu, NgayVaoLam) VALUES
    (1, 1,  'Nguyễn Văn Quản Trị',   '0901000001', 'admin@viettour.vn',     'Tổng Giám Đốc',          '2023-01-01'),
    (2, 2,  'Phạm Thu Hà',           '0901000002', 'dieuhanh@viettour.vn',  'Trưởng phòng Điều hành', '2023-03-15'),
    (3, 3,  'Trần Minh Đức',         '0901000003', 'ketoan@viettour.vn',    'Kế toán trưởng',         '2023-05-10'),
    (4, 4,  'Lê Hoàng Nam',          '0903112233', 'hdv1@viettour.vn',      'Hướng dẫn viên Quốc tế', '2023-06-01'),
    (5, 7,  'Trần Thị Tuyết Mai',    '0903223344', 'hdv.mai@viettour.vn',   'Hướng dẫn viên Quốc tế', '2023-08-01'),
    (6, 8,  'Nguyễn Đăng Khoa',      '0903334455', 'hdv.khoa@viettour.vn',  'Hướng dẫn viên Nội địa', '2023-08-01'),
    (7, 9,  'Đỗ Lan Hương',          '0903445566', 'hdv.huong@viettour.vn', 'Hướng dẫn viên Quốc tế', '2023-08-01'),
    (8, 10, 'Vũ Minh Tuấn',          '0903556677', 'hdv.tuan@viettour.vn',  'Hướng dẫn viên Nội địa', '2023-08-01')
ON CONFLICT (NhanVienID) DO NOTHING;

-- 5. Hướng dẫn viên
INSERT INTO HuongDanVien (HDVID, NhanVienID, SoTheHDV, NgonNgu, KinhNghiem, TrangThai) VALUES
    (1, 4, 'HDV-QUOCTE-8891', 'Anh, Trung', '5 năm kinh nghiệm dẫn tour Cao cấp & Di sản', 'San sang'),
    (2, 5, 'HDV-QUOCTE-5542', 'Nhật, Anh',   '6 năm chuyên tour Nhật Bản & Đông Bắc Á',    'San sang'),
    (3, 6, 'HDV-NOIDIA-3319', 'Việt, Anh',   '4 năm chuyên tour Miền Trung & Tây Bắc',     'Dang di tour'),
    (4, 7, 'HDV-QUOCTE-9921', 'Pháp, Anh',   '7 năm dẫn tour Di sản & Biển đảo cao cấp',   'San sang'),
    (5, 8, 'HDV-NOIDIA-4488', 'Việt',        '3 năm chuyên tour Phú Quốc & Miền Tây',       'San sang')
ON CONFLICT (HDVID) DO NOTHING;

-- 6. Khách hàng
INSERT INTO KhachHang (KhachHangID, TaiKhoanID, HoTen, SoDienThoai, Email, CCCD, NgaySinh, GioiTinh) VALUES
    (1, 5, 'Nguyễn Văn Hùng',   '0908123456', 'khach1@gmail.com',     '031092008761', '1992-05-15', 'Nam'),
    (2, 6, 'Trần Thị Thu Thảo', '0912987654', 'khach.thao@yahoo.com', '079188004321', '1988-11-20', 'Nu')
ON CONFLICT (KhachHangID) DO NOTHING;

-- 7. Danh mục tour
INSERT INTO DanhMucTour (DanhMucID, TenDanhMuc, MoTa) VALUES
    (1, 'Tour Trong Nuoc',      'Các chương trình du lịch di sản và danh lam thắng cảnh Việt Nam'),
    (2, 'Tour Quoc Te',         'Các chương trình tham quan khám phá các quốc gia trên thế giới'),
    (3, 'Tour Nghi Duong',      'Nghỉ dưỡng biển, du thuyền 5 sao, resort cao cấp'),
    (4, 'Tour Van Hoa Di San',  'Khám phá văn hóa, di tích lịch sử và ẩm thực địa phương')
ON CONFLICT (DanhMucID) DO NOTHING;

-- 8. Sản phẩm tour du lịch
INSERT INTO Tour (TourID, DanhMucID, NhanVienTaoID, MaTour, TenTour, ThoiGian, DiemKhoiHanh, DiemDen, MoTaChiTiet, LichTrinh, GiaNguoiLon, GiaTreEm, HinhAnhURL, PhuongTien, DichVuDiKem, TrangThaiDuyet) VALUES
    (1, 1, 2, 'TOUR-DN-01', 'Đà Nẵng - Hội An - Bà Nà Hills - Cầu Vàng', '4 Ngày 3 Đêm', 'TP.HCM', 'Đà Nẵng',
     'Hành trình di sản miền Trung hấp dẫn, khám phá phố cổ Hội An rực rỡ đèn lồng và đỉnh Bà Nà tiên cảnh.',
     'Ngày 1: Bay TP.HCM - Đà Nẵng, viếng Chùa Linh Ứng bán đảo Sơn Trà.
Ngày 2: Chinh phục đỉnh Bà Nà Hills, check-in Cầu Vàng bàn tay khổng lồ, vui chơi Fantasy Park.
Ngày 3: Khám phá Rừng dừa Bảy Mẫu, tham quan phố cổ Hội An, thưởng thức cao lầu.
Ngày 4: Tự do tắm biển Mỹ Khê, mua sắm đặc sản chợ Hàn, tiễn sân bay về lại TP.HCM.',
     5890000, 3200000, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
     'Máy bay khứ hồi Vietjet / Xe du lịch Universe 45 chỗ đời mới',
     'Vé máy bay khứ hồi có 20kg ký gửi
Khách sạn Novotel 4 sao tiêu chuẩn quốc tế
Ăn uống trọn gói các bữa theo lịch trình
Vé cáp treo Bà Nà Hills và vé tham quan Hội An
Bảo hiểm du lịch mức 120.000.000 VNĐ/vụ', 'Dang mo ban'),

    (2, 1, 2, 'TOUR-SP-02', 'Sapa - Chinh Phục Nóc Nhà Đông Dương Fansipan - Bản Cát Cát', '3 Ngày 2 Đêm', 'Hà Nội', 'Lào Cai',
     'Trải nghiệm mây ngàn Tây Bắc, đi cáp treo Fansipan vượt thung lũng Mường Hoa kỳ vĩ.',
     'Ngày 1: Hà Nội - Cao tốc Nội Bài Lào Cai - Sapa - Bản Cát Cát.
Ngày 2: Cáp treo Fansipan 3.143m - Đèo Ô Quy Hồ - Cầu Kính Rồng Mây.
Ngày 3: Nhà thờ đá Sapa - Chợ phiên vùng cao - Khởi hành về lại Hà Nội.',
     4250000, 2100000, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
     'Xe Limousine VIP 18 chỗ ngả lưng cao cấp',
     'Xe Limousine đưa đón tận nơi
Khách sạn 4 sao view núi Hàm Rồng
Vé cáp treo Fansipan khứ hồi
Ăn lẩu cá hồi đặc sản Sapa', 'Dang mo ban'),

    (3, 2, 2, 'TOUR-TYO-01', 'Nhật Bản Cung Đường Vàng: Tokyo - Núi Phú Sĩ - Kyoto - Osaka', '6 Ngày 5 Đêm', 'TP.HCM', 'Tokyo',
     'Khám phá xứ sở hoa anh đào, trải nghiệm tàu siêu tốc Shinkansen và ẩm thực Nhật Bản tinh tế.',
     'Ngày 1: TP.HCM - Bay thẳng Tokyo - Khách sạn Asakusa.
Ngày 2: Đền Asakusa Kannon - Tháp Tokyo Skytree - Núi Phú Sĩ trạm 5 - Tắm suối Onsen.
Ngày 3: Làng cổ Oshino Hakkai - Trải nghiệm tàu Shinkansen đến Nagoya.
Ngày 4: Cố đô Kyoto - Chùa Vàng Kinkakuji - Rừng trúc Sagano Arashiyama.
Ngày 5: Lâu đài Osaka hùng vĩ - Mua sắm tại thiên đường Shinsaibashi Dotonbori.
Ngày 6: Sân bay quốc tế Kansai - Bay về TP.HCM.',
     32900000, 24500000, 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
     'Hàng không All Nippon Airways (ANA) 5 sao / Tàu Shinkansen',
     'Vé máy bay quốc tế khứ hồi
Visa nhập cảnh Nhật Bản trọn gói
Khách sạn 4 sao trung tâm, 1 đêm Onsen truyền thống
Trải nghiệm bò Wagyu nướng và Sushi tươi sống', 'Dang mo ban'),

    (4, 3, 2, 'TOUR-HL-03', 'Hạ Long - Du Thuyền 5 Sao Heritage - Hang Sửng Sốt', '3 Ngày 2 Đêm', 'Hà Nội', 'Quảng Ninh',
     'Nghỉ dưỡng thượng lưu trên vịnh kỳ quan thiên nhiên thế giới, chèo kayak khám phá Hang Sửng Sốt.',
     'Ngày 1: Hà Nội - Cảng quốc tế Tuần Châu - Lên du thuyền 5 sao - Tiệc hoàng hôn Sunset.
Ngày 2: Thăm Hang Sửng Sốt - Đảo Ti Tốp tắm biển - Câu mực đêm.
Ngày 3: Thái Cực Quyền trên boong tàu - Thăm Hang Luồn - Trở về Hà Nội.',
     4890000, 2500000, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
     'Du thuyền Heritage Cruises 5 sao / Xe đón tiễn Limousine',
     'Cabin ban công riêng view trọn vịnh
Trọn gói 4 bữa ăn cao cấp trên du thuyền
Vé tham quan vịnh và chèo kayak miễn phí', 'Dang mo ban'),

    (5, 3, 2, 'TOUR-PQ-04', 'Phú Quốc Đảo Ngọc - Grand World - Cáp Treo Hòn Thơm', '4 Ngày 3 Đêm', 'TP.HCM', 'Phú Quốc',
     'Nghỉ dưỡng thiên đường biển đảo nhiệt đới, cáp treo vượt biển dài nhất thế giới và thành phố không ngủ Grand World.',
     'Ngày 1: Bay TP.HCM - Phú Quốc - Sunset Sanato ngắm hoàng hôn rực rỡ.
Ngày 2: Tour cano 4 đảo - Công viên nước Aquatopia - Cáp treo Hòn Thơm.
Ngày 3: VinWonders - Safari bán hoang dã - Show nhạc nước Grand World.
Ngày 4: Chợ Dương Đông mua ngọc trai và nước mắm truyền thống - Tiễn sân bay.',
     6290000, 3400000, 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
     'Máy bay khứ hồi Vietnam Airlines / Xe du lịch đời mới',
     'Resort 5 sao có bãi biển riêng
Vé cáp treo Hòn Thơm & buffet trưa
Vé tham quan Grand World và show Tinh hoa Việt Nam', 'Dang mo ban')
ON CONFLICT (TourID) DO NOTHING;

-- 9. Lịch khởi hành
INSERT INTO LichKhoiHanh (LichID, TourID, MaLich, NgayKhoiHanh, NgayKetThuc, SoChoToiDa, SoChoDaDat, TrangThai) VALUES
    (1, 1, 'LICH-DN-20261015', '2026-10-15 07:00:00', '2026-10-18 18:00:00', 30, 2, 'Cho khoi hanh'),
    (2, 2, 'LICH-SP-20261020', '2026-10-20 06:00:00', '2026-10-22 17:00:00', 25, 1, 'Cho khoi hanh'),
    (3, 3, 'LICH-TYO-20261101', '2026-11-01 01:00:00', '2026-11-06 22:00:00', 20, 1, 'Cho khoi hanh'),
    (4, 4, 'LICH-HL-20261025', '2026-10-25 07:00:00', '2026-10-27 17:00:00', 25, 2, 'Cho khoi hanh'),
    (5, 5, 'LICH-PQ-20261105', '2026-11-05 06:00:00', '2026-11-08 18:00:00', 28, 4, 'Cho khoi hanh')
ON CONFLICT (LichID) DO NOTHING;

-- 10. Voucher giảm giá
INSERT INTO Voucher (VoucherID, MaVoucher, TenChuongTrinh, PhanTramGiam, GiamToiDa, GiaTriDonToiThieu, SoLuongToiDa, NgayBatDau, NgayKetThuc, TrangThai) VALUES
    (1, 'VIETTOUR2026', 'Ưu đãi Khách hàng Thân thiết VietTour 2026', 10, 1000000, 3000000, 500, '2026-01-01', '2026-12-31', 1),
    (2, 'BAYHE2026',    'Khuyến mãi Tour Máy bay Hè Rực Rỡ',        15, 1500000, 5000000, 200, '2026-05-01', '2026-12-31', 1),
    (3, 'TRIAN500K',    'Voucher Tri ân Khách hàng Đặt tour sớm',     NULL, 500000,  2000000, 300, '2026-01-01', '2026-12-31', 1)
ON CONFLICT (VoucherID) DO NOTHING;

-- 11. Chương trình khuyến mãi tour tự động
INSERT INTO ChuongTrinhKhuyenMai (CTKMID, TenChuongTrinh, MoTa, PhanTramGiam, NgayBatDau, NgayKetThuc, TrangThai, NhanVienTaoID) VALUES
    (1, 'Mùa Thu Vàng Rực Rỡ 2026', 'Giảm trực tiếp 10% cho toàn bộ tour biển đảo miền Trung và Phú Quốc', 10, '2026-09-01 00:00:00', '2026-11-30 23:59:59', 1, 2)
ON CONFLICT (CTKMID) DO NOTHING;

INSERT INTO ApDungCTKM (CTKMID, TourID) VALUES
    (1, 1),
    (1, 5)
ON CONFLICT DO NOTHING;

-- 12. Nhà cung cấp đối tác
INSERT INTO NhaCungCap (NhaCungCapID, TenNCC, LoaiNCC, NguoiLienHe, SoDienThoai, Email, DiaChi, DanhGia, TrangThai) VALUES
    (1, 'Khách sạn Novotel Danang Premier',   'Khach san',     'Nguyễn Thị Thu Hương', '02363929999', 'novotel@danang.com',    '36 Bạch Đằng, Hải Châu, Đà Nẵng', 4.9, 1),
    (2, 'Công ty Vận Tải Du Lịch Việt Thanh', 'Xe van chuyen', 'Trần Văn Bình',         '0905888999', 'vietthanh@transport.vn', '120 Nguyễn Văn Linh, Đà Nẵng',    4.8, 1),
    (3, 'Nhà Hàng Ẩm Thực Cung Đình Huế',     'Nha hang',      'Lê Thị Ngọc Mai',      '02343888777', 'cungdinh@huecuisine.vn','38 Nguyễn Sinh Cung, TP Huế',     4.7, 1)
ON CONFLICT (NhaCungCapID) DO NOTHING;

-- 13. Dịch vụ chi tiết nhà cung cấp
INSERT INTO DichVuNhaCungCap (DichVuNCCID, NhaCungCapID, TenDichVu, LoaiDichVu, DonGia, DonViTinh, MoTa, TrangThai) VALUES
    (1, 1, 'Phòng Deluxe Hướng Sông Hàn (2 người)', 'Luu tru', 1650000, 'Đêm/Phòng', 'Bao gồm buffet sáng tiêu chuẩn quốc tế', 1),
    (2, 2, 'Xe Universe 45 chỗ đời mới 2024',       'Van chuyen', 3500000, 'Ngày/Xe', 'Tài xế chuyên nghiệp, máy lạnh mát sâu', 1),
    (3, 3, 'Set Menu Đặc Sản Cung Đình 8 món',     'An uong',     250000, 'Suất/Khách', 'Gồm nem công, chả phượng, cơm sen', 1)
ON CONFLICT (DichVuNCCID) DO NOTHING;

-- 14. Đơn đặt tour
INSERT INTO DonDatTour (DonHangID, KhachHangID, LichID, NhanVienXuLyID, VoucherID, MaDon, SoLuongNguoiLon, SoLuongTreEm, TongTien, GiamGia, TienCoc, TienConLai, TrangThaiDon, PhuongThucTT) VALUES
    (1, 1, 1, 2, 1, 'BK-9821', 2, 0, 11780000, 1000000, 10780000, 0, 'Da thanh toan', 'ZaloPay'),
    (2, 2, 3, 2, NULL, 'BK-9822', 1, 0, 32900000, 0, 32900000, 0, 'Da thanh toan', 'VNPay')
ON CONFLICT (DonHangID) DO NOTHING;

-- 15. Hành khách đoàn kèm mã QR vé
INSERT INTO ChiTietHanhKhach (ChiTietID, DonHangID, HoTen, LoaiKhach, CCCD, MaQRVe, TrangThaiDiemDanh) VALUES
    (1, 1, 'Nguyễn Văn Hùng', 'Nguoi lon', '031092008761', 'VT-BK-9821-P1', 1),
    (2, 1, 'Lê Thị Mai Trang', 'Nguoi lon', '031195009872', 'VT-BK-9821-P2', 0),
    (3, 2, 'Trần Thị Thu Thảo', 'Nguoi lon', '079188004321', 'VT-BK-9822-P1', 0)
ON CONFLICT (ChiTietID) DO NOTHING;

-- 16. Thanh toán
INSERT INTO ThanhToan (ThanhToanID, DonHangID, SoTien, HinhThucTT, MaGiaoDich, TrangThai) VALUES
    (1, 1, 10780000, 'ZaloPay', 'ZP-20261015-8831', 'Thanh cong'),
    (2, 2, 32900000, 'VNPay',   'VNP-20261101-9921', 'Thanh cong')
ON CONFLICT (ThanhToanID) DO NOTHING;

-- 17. Hóa đơn điện tử
INSERT INTO HoaDon (HoaDonID, DonHangID, ThanhToanID, SoHoaDon, TenCongTy, MaSoThue, TongTienVat) VALUES
    (1, 1, 1, 'HD-2026-9821', 'CÔNG TY CP TẬP ĐOÀN HÙNG VƯƠNG', '0315889922', 10780000)
ON CONFLICT (HoaDonID) DO NOTHING;

-- 18. Phân công Hướng dẫn viên (DieuPhoiTour)
INSERT INTO DieuPhoiTour (DieuPhoiID, LichID, HDVID, NhanVienID, VaiTro, TrangThai) VALUES
    (1, 1, 1, 2, 'HDV Chinh', 'Da xac nhan'),
    (2, 2, 3, 2, 'HDV Chinh', 'Dang dan tour'),
    (3, 3, 2, 2, 'HDV Chinh', 'Da xac nhan')
ON CONFLICT (DieuPhoiID) DO NOTHING;

-- 19. Phiếu đặt dịch vụ nhà cung cấp
INSERT INTO PhieuDatDichVu (PhieuDatID, LichID, NhanVienID, NhaCungCapID, MaPhieu, TongTienDichVu, TienDaCoc, TrangThai) VALUES
    (1, 1, 2, 1, 'PO-2026-NOV01', 9900000, 5000000, 'Da xac nhan'),
    (2, 1, 2, 2, 'PO-2026-CAR01', 14000000, 14000000, 'Hoan thanh')
ON CONFLICT (PhieuDatID) DO NOTHING;

-- 20. Đánh giá tour
INSERT INTO DanhGia (DanhGiaID, KhachHangID, TourID, DonHangID, SoSao, BinhLuan, TrangThaiDuyet) VALUES
    (1, 1, 1, 1, 5, 'Tour Đà Nẵng - Hội An đi rất đúng giờ, xe sạch sẽ, HDV nhiệt tình và chu đáo!', 'Da hien thi')
ON CONFLICT (DanhGiaID) DO NOTHING;

-- Đồng bộ lại các sequence khóa chính trong PostgreSQL
DO $$
BEGIN
    IF pg_get_serial_sequence('taikhoan', 'taikhoanid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('taikhoan', 'taikhoanid'), (SELECT COALESCE(MAX(taikhoanid), 1) FROM taikhoan));
    END IF;
    IF pg_get_serial_sequence('vaitro', 'vaitroid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('vaitro', 'vaitroid'), (SELECT COALESCE(MAX(vaitroid), 1) FROM vaitro));
    END IF;
    IF pg_get_serial_sequence('khachhang', 'khachhangid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('khachhang', 'khachhangid'), (SELECT COALESCE(MAX(khachhangid), 1) FROM khachhang));
    END IF;
    IF pg_get_serial_sequence('nhanvien', 'nhanvienid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('nhanvien', 'nhanvienid'), (SELECT COALESCE(MAX(nhanvienid), 1) FROM nhanvien));
    END IF;
    IF pg_get_serial_sequence('huongdanvien', 'hdvid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('huongdanvien', 'hdvid'), (SELECT COALESCE(MAX(hdvid), 1) FROM huongdanvien));
    END IF;
    IF pg_get_serial_sequence('danhmuctour', 'danhmucid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('danhmuctour', 'danhmucid'), (SELECT COALESCE(MAX(danhmucid), 1) FROM danhmuctour));
    END IF;
    IF pg_get_serial_sequence('tour', 'tourid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('tour', 'tourid'), (SELECT COALESCE(MAX(tourid), 1) FROM tour));
    END IF;
    IF pg_get_serial_sequence('lichkhoihanh', 'lichid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('lichkhoihanh', 'lichid'), (SELECT COALESCE(MAX(lichid), 1) FROM lichkhoihanh));
    END IF;
    IF pg_get_serial_sequence('voucher', 'voucherid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('voucher', 'voucherid'), (SELECT COALESCE(MAX(voucherid), 1) FROM voucher));
    END IF;
    IF pg_get_serial_sequence('dondattour', 'donhangid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('dondattour', 'donhangid'), (SELECT COALESCE(MAX(donhangid), 1) FROM dondattour));
    END IF;
    IF pg_get_serial_sequence('chitiethanhkhach', 'chitietid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('chitiethanhkhach', 'chitietid'), (SELECT COALESCE(MAX(chitietid), 1) FROM chitiethanhkhach));
    END IF;
    IF pg_get_serial_sequence('thanhtoan', 'thanhtoanid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('thanhtoan', 'thanhtoanid'), (SELECT COALESCE(MAX(thanhtoanid), 1) FROM thanhtoan));
    END IF;
    IF pg_get_serial_sequence('hoadon', 'hoadonid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('hoadon', 'hoadonid'), (SELECT COALESCE(MAX(hoadonid), 1) FROM hoadon));
    END IF;
    IF pg_get_serial_sequence('nhacungcap', 'nhacungcapid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('nhacungcap', 'nhacungcapid'), (SELECT COALESCE(MAX(nhacungcapid), 1) FROM nhacungcap));
    END IF;
    IF pg_get_serial_sequence('phieudatdichvu', 'phieudatid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('phieudatdichvu', 'phieudatid'), (SELECT COALESCE(MAX(phieudatid), 1) FROM phieudatdichvu));
    END IF;
    IF pg_get_serial_sequence('dieuphoitour', 'dieuphoiid') IS NOT NULL THEN
        PERFORM setval(pg_get_serial_sequence('dieuphoitour', 'dieuphoiid'), (SELECT COALESCE(MAX(dieuphoiid), 1) FROM dieuphoitour));
    END IF;
END $$;

COMMIT;

-- Thông báo hoàn thành
DO $$
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'KHỞI TẠO CSDL QUẢN LÝ TOUR DU LỊCH THÀNH CÔNG';
    RAISE NOTICE '• Tổng số bảng DDL: 27 bảng chuẩn hóa 3NF';
    RAISE NOTICE '• Đã nạp đầy đủ dữ liệu mẫu (Seed Data) chuẩn kiểm thử';
    RAISE NOTICE '• Sẵn sàng cho Demo Hội đồng chấm Khóa luận tốt nghiệp';
    RAISE NOTICE '=======================================================';
END $$;
