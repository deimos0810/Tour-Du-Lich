import type { PrismaClient } from '@prisma/client';
import { hashPassword } from '../common/password.js';

/**
 * Tự động nạp dữ liệu mẫu (Seed Data) chuẩn UTF-8 nếu Database trên Cloud mới khởi tạo còn trống.
 * Giúp quá trình Deploy lên Render / Supabase / Neon hoàn toàn tự động 100% không cần chạy SQL tay.
 */
export async function autoSeedIfEmpty(prisma: PrismaClient): Promise<boolean> {
  const roleCount = await prisma.vaiTro.count();
  if (roleCount > 0) {
    return false;
  }

  const defaultHash = hashPassword('123456');

  // 1. VaiTro
  await prisma.vaiTro.createMany({
    data: [
      { VaiTroID: 1, TenVaiTro: 'Admin', MoTa: 'Quản trị viên toàn quyền hệ thống' },
      { VaiTroID: 2, TenVaiTro: 'Dieu hanh', MoTa: 'Trưởng phòng / Nhân viên điều hành tour' },
      { VaiTroID: 3, TenVaiTro: 'Ke toan', MoTa: 'Kế toán trưởng / Tài chính doanh nghiệp' },
      { VaiTroID: 4, TenVaiTro: 'HDV', MoTa: 'Hướng dẫn viên du lịch dẫn đoàn' },
      { VaiTroID: 5, TenVaiTro: 'Khach hang', MoTa: 'Khách du lịch đặt tour' },
    ],
    skipDuplicates: true,
  });

  // 2. TaiKhoan
  await prisma.taiKhoan.createMany({
    data: [
      { TaiKhoanID: 1, Email: 'admin@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0901000001', TrangThai: 1 },
      { TaiKhoanID: 2, Email: 'dieuhanh@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0901000002', TrangThai: 1 },
      { TaiKhoanID: 3, Email: 'ketoan@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0901000003', TrangThai: 1 },
      { TaiKhoanID: 4, Email: 'hdv1@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0903112233', TrangThai: 1 },
      { TaiKhoanID: 5, Email: 'khach1@gmail.com', MatKhauHash: defaultHash, SoDienThoai: '0908123456', TrangThai: 1 },
      { TaiKhoanID: 6, Email: 'khach.thao@yahoo.com', MatKhauHash: defaultHash, SoDienThoai: '0912987654', TrangThai: 1 },
      { TaiKhoanID: 7, Email: 'hdv.mai@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0903223344', TrangThai: 1 },
      { TaiKhoanID: 8, Email: 'hdv.khoa@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0903334455', TrangThai: 1 },
      { TaiKhoanID: 9, Email: 'hdv.huong@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0903445566', TrangThai: 1 },
      { TaiKhoanID: 10, Email: 'hdv.tuan@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0903556677', TrangThai: 1 },
    ],
    skipDuplicates: true,
  });

  // 3. PhanQuyen
  await prisma.phanQuyen.createMany({
    data: [
      { TaiKhoanID: 1, VaiTroID: 1 },
      { TaiKhoanID: 2, VaiTroID: 2 },
      { TaiKhoanID: 3, VaiTroID: 3 },
      { TaiKhoanID: 4, VaiTroID: 4 },
      { TaiKhoanID: 5, VaiTroID: 5 },
      { TaiKhoanID: 6, VaiTroID: 5 },
      { TaiKhoanID: 7, VaiTroID: 4 },
      { TaiKhoanID: 8, VaiTroID: 4 },
      { TaiKhoanID: 9, VaiTroID: 4 },
      { TaiKhoanID: 10, VaiTroID: 4 },
    ],
    skipDuplicates: true,
  });

  // 4. NhanVien
  await prisma.nhanVien.createMany({
    data: [
      { NhanVienID: 1, TaiKhoanID: 1, HoTen: 'Nguyễn Văn Quản Trị', SoDienThoai: '0901000001', Email: 'admin@viettour.vn', ChucVu: 'Tổng Giám Đốc', NgayVaoLam: new Date('2023-01-01') },
      { NhanVienID: 2, TaiKhoanID: 2, HoTen: 'Phạm Thu Hà', SoDienThoai: '0901000002', Email: 'dieuhanh@viettour.vn', ChucVu: 'Trưởng phòng Điều hành', NgayVaoLam: new Date('2023-03-15') },
      { NhanVienID: 3, TaiKhoanID: 3, HoTen: 'Trần Minh Đức', SoDienThoai: '0901000003', Email: 'ketoan@viettour.vn', ChucVu: 'Kế toán trưởng', NgayVaoLam: new Date('2023-05-10') },
      { NhanVienID: 4, TaiKhoanID: 4, HoTen: 'Lê Hoàng Nam', SoDienThoai: '0903112233', Email: 'hdv1@viettour.vn', ChucVu: 'Hướng dẫn viên Quốc tế', NgayVaoLam: new Date('2023-06-01') },
      { NhanVienID: 5, TaiKhoanID: 7, HoTen: 'Trần Thị Tuyết Mai', SoDienThoai: '0903223344', Email: 'hdv.mai@viettour.vn', ChucVu: 'Hướng dẫn viên Quốc tế', NgayVaoLam: new Date('2023-08-01') },
      { NhanVienID: 6, TaiKhoanID: 8, HoTen: 'Nguyễn Đăng Khoa', SoDienThoai: '0903334455', Email: 'hdv.khoa@viettour.vn', ChucVu: 'Hướng dẫn viên Nội địa', NgayVaoLam: new Date('2023-08-01') },
      { NhanVienID: 7, TaiKhoanID: 9, HoTen: 'Đỗ Lan Hương', SoDienThoai: '0903445566', Email: 'hdv.huong@viettour.vn', ChucVu: 'Hướng dẫn viên Quốc tế', NgayVaoLam: new Date('2023-08-01') },
      { NhanVienID: 8, TaiKhoanID: 10, HoTen: 'Vũ Minh Tuấn', SoDienThoai: '0903556677', Email: 'hdv.tuan@viettour.vn', ChucVu: 'Hướng dẫn viên Nội địa', NgayVaoLam: new Date('2023-08-01') },
    ],
    skipDuplicates: true,
  });

  // 5. HuongDanVien
  await prisma.huongDanVien.createMany({
    data: [
      { HDVID: 1, NhanVienID: 4, SoTheHDV: 'HDV-QUOCTE-8891', NgonNgu: 'Anh, Trung', KinhNghiem: '5 năm kinh nghiệm dẫn tour Cao cấp & Di sản', TrangThai: 'San sang' },
      { HDVID: 2, NhanVienID: 5, SoTheHDV: 'HDV-QUOCTE-5542', NgonNgu: 'Nhật, Anh', KinhNghiem: '6 năm chuyên tour Nhật Bản & Đông Bắc Á', TrangThai: 'San sang' },
      { HDVID: 3, NhanVienID: 6, SoTheHDV: 'HDV-NOIDIA-3319', NgonNgu: 'Việt, Anh', KinhNghiem: '4 năm chuyên tour Miền Trung & Tây Bắc', TrangThai: 'Dang di tour' },
      { HDVID: 4, NhanVienID: 7, SoTheHDV: 'HDV-QUOCTE-9921', NgonNgu: 'Pháp, Anh', KinhNghiem: '7 năm dẫn tour Di sản & Biển đảo cao cấp', TrangThai: 'San sang' },
      { HDVID: 5, NhanVienID: 8, SoTheHDV: 'HDV-NOIDIA-4488', NgonNgu: 'Việt', KinhNghiem: '3 năm chuyên tour Phú Quốc & Miền Tây', TrangThai: 'San sang' },
    ],
    skipDuplicates: true,
  });

  // 6. KhachHang
  await prisma.khachHang.createMany({
    data: [
      { KhachHangID: 1, TaiKhoanID: 5, HoTen: 'Nguyễn Văn Hùng', SoDienThoai: '0908123456', Email: 'khach1@gmail.com', CCCD: '031092008761', NgaySinh: new Date('1992-05-15'), GioiTinh: 'Nam' },
      { KhachHangID: 2, TaiKhoanID: 6, HoTen: 'Trần Thị Thu Thảo', SoDienThoai: '0912987654', Email: 'khach.thao@yahoo.com', CCCD: '079188004321', NgaySinh: new Date('1988-11-20'), GioiTinh: 'Nu' },
    ],
    skipDuplicates: true,
  });

  // 7. DanhMucTour
  await prisma.danhMucTour.createMany({
    data: [
      { DanhMucID: 1, TenDanhMuc: 'Tour Trong Nuoc', MoTa: 'Các chương trình du lịch di sản và danh lam thắng cảnh Việt Nam' },
      { DanhMucID: 2, TenDanhMuc: 'Tour Quoc Te', MoTa: 'Các chương trình tham quan khám phá các quốc gia trên thế giới' },
      { DanhMucID: 3, TenDanhMuc: 'Tour Nghi Duong', MoTa: 'Nghỉ dưỡng biển, du thuyền 5 sao, resort cao cấp' },
      { DanhMucID: 4, TenDanhMuc: 'Tour Van Hoa Di San', MoTa: 'Khám phá văn hóa, di tích lịch sử và ẩm thực địa phương' },
    ],
    skipDuplicates: true,
  });

  // 8. Tour
  await prisma.tour.createMany({
    data: [
      {
        TourID: 1,
        DanhMucID: 1,
        NhanVienTaoID: 2,
        MaTour: 'TOUR-DN-01',
        TenTour: 'Đà Nẵng - Hội An - Bà Nà Hills - Cầu Vàng',
        ThoiGian: '4 Ngày 3 Đêm',
        DiemKhoiHanh: 'TP.HCM',
        DiemDen: 'Đà Nẵng',
        MoTaChiTiet: 'Hành trình di sản miền Trung hấp dẫn, khám phá phố cổ Hội An rực rỡ đèn lồng và đỉnh Bà Nà tiên cảnh.',
        LichTrinh: 'Ngày 1: Bay TP.HCM - Đà Nẵng, viếng Chùa Linh Ứng bán đảo Sơn Trà.\nNgày 2: Chinh phục đỉnh Bà Nà Hills, check-in Cầu Vàng bàn tay khổng lồ, vui chơi Fantasy Park.\nNgày 3: Khám phá Rừng dừa Bảy Mẫu, tham quan phố cổ Hội An, thưởng thức cao lầu.\nNgày 4: Tự do tắm biển Mỹ Khê, mua sắm đặc sản chợ Hàn, tiễn sân bay về lại TP.HCM.',
        GiaNguoiLon: 5890000,
        GiaTreEm: 3200000,
        PhuThuPhongDon: 1200000,
        HinhAnhURL: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
        PhuongTien: 'Máy bay khứ hồi Vietjet / Xe du lịch Universe 45 chỗ đời mới',
        DichVuDiKem: 'Vé máy bay khứ hồi có 20kg ký gửi\nKhách sạn Novotel 4 sao tiêu chuẩn quốc tế\nĂn uống trọn gói các bữa theo lịch trình\nVé cáp treo Bà Nà Hills và vé tham quan Hội An\nBảo hiểm du lịch mức 120.000.000 VNĐ/vụ',
        TrangThaiDuyet: 'Dang mo ban',
      },
      {
        TourID: 2,
        DanhMucID: 1,
        NhanVienTaoID: 2,
        MaTour: 'TOUR-SP-02',
        TenTour: 'Sapa - Chinh Phục Nóc Nhà Đông Dương Fansipan - Bản Cát Cát',
        ThoiGian: '3 Ngày 2 Đêm',
        DiemKhoiHanh: 'Hà Nội',
        DiemDen: 'Lào Cai',
        MoTaChiTiet: 'Trải nghiệm mây ngàn Tây Bắc, đi cáp treo Fansipan vượt thung lũng Mường Hoa kỳ vĩ.',
        LichTrinh: 'Ngày 1: Hà Nội - Cao tốc Nội Bài Lào Cai - Sapa - Bản Cát Cát.\nNgày 2: Cáp treo Fansipan 3.143m - Đèo Ô Quy Hồ - Cầu Kính Rồng Mây.\nNgày 3: Nhà thờ đá Sapa - Chợ phiên vùng cao - Khởi hành về lại Hà Nội.',
        GiaNguoiLon: 4250000,
        GiaTreEm: 2100000,
        PhuThuPhongDon: 900000,
        HinhAnhURL: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
        PhuongTien: 'Xe Limousine VIP 18 chỗ ngả lưng cao cấp',
        DichVuDiKem: 'Xe Limousine đưa đón tận nơi\nKhách sạn 4 sao view núi Hàm Rồng\nVé cáp treo Fansipan khứ hồi\nĂn lẩu cá hồi đặc sản Sapa',
        TrangThaiDuyet: 'Dang mo ban',
      },
      {
        TourID: 3,
        DanhMucID: 2,
        NhanVienTaoID: 2,
        MaTour: 'TOUR-TYO-01',
        TenTour: 'Nhật Bản Cung Đường Vàng: Tokyo - Núi Phú Sĩ - Kyoto - Osaka',
        ThoiGian: '6 Ngày 5 Đêm',
        DiemKhoiHanh: 'TP.HCM',
        DiemDen: 'Tokyo',
        MoTaChiTiet: 'Khám phá xứ sở hoa anh đào, trải nghiệm tàu siêu tốc Shinkansen và ẩm thực Nhật Bản tinh tế.',
        LichTrinh: 'Ngày 1: TP.HCM - Bay thẳng Tokyo - Khách sạn Asakusa.\nNgày 2: Đền Asakusa Kannon - Tháp Tokyo Skytree - Núi Phú Sĩ trạm 5 - Tắm suối Onsen.\nNgày 3: Làng cổ Oshino Hakkai - Trải nghiệm tàu Shinkansen đến Nagoya.\nNgày 4: Cố đô Kyoto - Chùa Vàng Kinkakuji - Rừng trúc Sagano Arashiyama.\nNgày 5: Lâu đài Osaka hùng vĩ - Mua sắm tại thiên đường Shinsaibashi Dotonbori.\nNgày 6: Sân bay quốc tế Kansai - Bay về TP.HCM.',
        GiaNguoiLon: 32900000,
        GiaTreEm: 24500000,
        PhuThuPhongDon: 5500000,
        HinhAnhURL: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
        PhuongTien: 'Hàng không All Nippon Airways (ANA) 5 sao / Tàu Shinkansen',
        DichVuDiKem: 'Vé máy bay quốc tế khứ hồi\nVisa nhập cảnh Nhật Bản trọn gói\nKhách sạn 4 sao trung tâm, 1 đêm Onsen truyền thống\nTrải nghiệm bò Wagyu nướng và Sushi tươi sống',
        TrangThaiDuyet: 'Dang mo ban',
      },
      {
        TourID: 4,
        DanhMucID: 3,
        NhanVienTaoID: 2,
        MaTour: 'TOUR-HL-03',
        TenTour: 'Hạ Long - Du Thuyền 5 Sao Heritage - Hang Sửng Sốt',
        ThoiGian: '3 Ngày 2 Đêm',
        DiemKhoiHanh: 'Hà Nội',
        DiemDen: 'Quảng Ninh',
        MoTaChiTiet: 'Nghỉ dưỡng thượng lưu trên vịnh kỳ quan thiên nhiên thế giới, chèo kayak khám phá Hang Sửng Sốt.',
        LichTrinh: 'Ngày 1: Hà Nội - Cảng quốc tế Tuần Châu - Lên du thuyền 5 sao - Tiệc hoàng hôn Sunset.\nNgày 2: Thăm Hang Sửng Sốt - Đảo Ti Tốp tắm biển - Câu mực đêm.\nNgày 3: Thái Cực Quyền trên boong tàu - Thăm Hang Luồn - Trở về Hà Nội.',
        GiaNguoiLon: 4890000,
        GiaTreEm: 2500000,
        PhuThuPhongDon: 1500000,
        HinhAnhURL: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
        PhuongTien: 'Du thuyền Heritage Cruises 5 sao / Xe đón tiễn Limousine',
        DichVuDiKem: 'Cabin ban công riêng view trọn vịnh\nTrọn gói 4 bữa ăn cao cấp trên du thuyền\nVé tham quan vịnh và chèo kayak miễn phí',
        TrangThaiDuyet: 'Dang mo ban',
      },
      {
        TourID: 5,
        DanhMucID: 3,
        NhanVienTaoID: 2,
        MaTour: 'TOUR-PQ-04',
        TenTour: 'Phú Quốc Đảo Ngọc - Grand World - Cáp Treo Hòn Thơm',
        ThoiGian: '4 Ngày 3 Đêm',
        DiemKhoiHanh: 'TP.HCM',
        DiemDen: 'Phú Quốc',
        MoTaChiTiet: 'Nghỉ dưỡng thiên đường biển đảo nhiệt đới, cáp treo vượt biển dài nhất thế giới và thành phố không ngủ Grand World.',
        LichTrinh: 'Ngày 1: Bay TP.HCM - Phú Quốc - Sunset Sanato ngắm hoàng hôn rực rỡ.\nNgày 2: Tour cano 4 đảo - Công viên nước Aquatopia - Cáp treo Hòn Thơm.\nNgày 3: VinWonders - Safari bán hoang dã - Show nhạc nước Grand World.\nNgày 4: Chợ Dương Đông mua ngọc trai và nước mắm truyền thống - Tiễn sân bay.',
        GiaNguoiLon: 6290000,
        GiaTreEm: 3400000,
        PhuThuPhongDon: 1400000,
        HinhAnhURL: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
        PhuongTien: 'Máy bay khứ hồi Vietnam Airlines / Xe du lịch đời mới',
        DichVuDiKem: 'Resort 5 sao có bãi biển riêng\nVé cáp treo Hòn Thơm & buffet trưa\nVé tham quan Grand World và show Tinh hoa Việt Nam',
        TrangThaiDuyet: 'Dang mo ban',
      },
    ],
    skipDuplicates: true,
  });

  // 9. LichKhoiHanh
  await prisma.lichKhoiHanh.createMany({
    data: [
      { LichID: 1, TourID: 1, MaLich: 'LICH-DN-20261215', NgayKhoiHanh: new Date('2026-12-15T07:00:00Z'), NgayKetThuc: new Date('2026-12-18T18:00:00Z'), SoChoToiDa: 30, SoChoDaDat: 2, TrangThai: 'Cho khoi hanh' },
      { LichID: 2, TourID: 2, MaLich: 'LICH-SP-20261220', NgayKhoiHanh: new Date('2026-12-20T06:00:00Z'), NgayKetThuc: new Date('2026-12-22T17:00:00Z'), SoChoToiDa: 25, SoChoDaDat: 1, TrangThai: 'Cho khoi hanh' },
      { LichID: 3, TourID: 3, MaLich: 'LICH-TYO-20261225', NgayKhoiHanh: new Date('2026-12-25T01:00:00Z'), NgayKetThuc: new Date('2026-12-30T22:00:00Z'), SoChoToiDa: 20, SoChoDaDat: 1, TrangThai: 'Cho khoi hanh' },
      { LichID: 4, TourID: 4, MaLich: 'LICH-HL-20261222', NgayKhoiHanh: new Date('2026-12-22T07:00:00Z'), NgayKetThuc: new Date('2026-12-24T17:00:00Z'), SoChoToiDa: 25, SoChoDaDat: 2, TrangThai: 'Cho khoi hanh' },
      { LichID: 5, TourID: 5, MaLich: 'LICH-PQ-20261228', NgayKhoiHanh: new Date('2026-12-28T06:00:00Z'), NgayKetThuc: new Date('2026-12-31T18:00:00Z'), SoChoToiDa: 28, SoChoDaDat: 4, TrangThai: 'Cho khoi hanh' },
    ],
    skipDuplicates: true,
  });

  // 10. Voucher
  await prisma.voucher.createMany({
    data: [
      { VoucherID: 1, MaVoucher: 'VIETTOUR2026', TenChuongTrinh: 'Ưu đãi Khách hàng Thân thiết VietTour 2026', PhanTramGiam: 10, GiamToiDa: 1000000, GiaTriDonToiThieu: 3000000, SoLuongToiDa: 500, NgayBatDau: new Date('2026-01-01'), NgayKetThuc: new Date('2026-12-31'), TrangThai: 1 },
      { VoucherID: 2, MaVoucher: 'BAYHE2026', TenChuongTrinh: 'Khuyến mãi Tour Máy bay Trọn Gói 2026', PhanTramGiam: 15, GiamToiDa: 1500000, GiaTriDonToiThieu: 5000000, SoLuongToiDa: 200, NgayBatDau: new Date('2026-05-01'), NgayKetThuc: new Date('2026-12-31'), TrangThai: 1 },
      { VoucherID: 3, MaVoucher: 'WELCOME10', TenChuongTrinh: 'Mã Chào Mừng Thành Viên Mới Giảm 10%', PhanTramGiam: 10, GiamToiDa: 500000, GiaTriDonToiThieu: 2000000, SoLuongToiDa: 300, NgayBatDau: new Date('2026-01-01'), NgayKetThuc: new Date('2026-12-31'), TrangThai: 1 },
    ],
    skipDuplicates: true,
  });

  // 11. NhaCungCap & DichVuNhaCungCap
  await prisma.nhaCungCap.createMany({
    data: [
      { NhaCungCapID: 1, TenNCC: 'Khách sạn Novotel Danang Premier', LoaiNCC: 'Khach san', NguoiLienHe: 'Nguyễn Thị Thu Hương', SoDienThoai: '02363929999', Email: 'novotel@danang.com', DiaChi: '36 Bạch Đằng, Hải Châu, Đà Nẵng', DanhGia: 4.9, TrangThai: 1 },
      { NhaCungCapID: 2, TenNCC: 'Công ty Vận Tải Du Lịch Việt Thanh', LoaiNCC: 'Xe van chuyen', NguoiLienHe: 'Trần Văn Bình', SoDienThoai: '0905888999', Email: 'vietthanh@transport.vn', DiaChi: '120 Nguyễn Văn Linh, Đà Nẵng', DanhGia: 4.8, TrangThai: 1 },
      { NhaCungCapID: 3, TenNCC: 'Nhà Hàng Ẩm Thực Cung Đình Huế', LoaiNCC: 'Nha hang', NguoiLienHe: 'Lê Thị Ngọc Mai', SoDienThoai: '02343888777', Email: 'cungdinh@huecuisine.vn', DiaChi: '38 Nguyễn Sinh Cung, TP Huế', DanhGia: 4.7, TrangThai: 1 },
    ],
    skipDuplicates: true,
  });

  await prisma.dichVuNhaCungCap.createMany({
    data: [
      { DichVuNCCID: 1, NhaCungCapID: 1, TenDichVu: 'Phòng Deluxe Hướng Sông Hàn (2 người)', LoaiDichVu: 'Luu tru', DonGia: 1650000, DonViTinh: 'Đêm/Phòng', MoTa: 'Bao gồm buffet sáng tiêu chuẩn quốc tế', TrangThai: 1 },
      { DichVuNCCID: 2, NhaCungCapID: 2, TenDichVu: 'Xe Universe 45 chỗ đời mới 2024', LoaiDichVu: 'Van chuyen', DonGia: 3500000, DonViTinh: 'Ngày/Xe', MoTa: 'Tài xế chuyên nghiệp, máy lạnh mát sâu', TrangThai: 1 },
      { DichVuNCCID: 3, NhaCungCapID: 3, TenDichVu: 'Set Menu Đặc Sản Cung Đình 8 món', LoaiDichVu: 'An uong', DonGia: 250000, DonViTinh: 'Suất/Khách', MoTa: 'Gồm nem công, chả phượng, cơm sen', TrangThai: 1 },
    ],
    skipDuplicates: true,
  });

  // 12. DonDatTour, ChiTietHanhKhach, ThanhToan, HoaDon, DieuPhoiTour, PhieuDatDichVu, DanhGia
  await prisma.donDatTour.createMany({
    data: [
      { DonHangID: 1, KhachHangID: 1, LichID: 1, NhanVienXuLyID: 2, VoucherID: 1, MaDon: 'BK-9821', SoLuongNguoiLon: 2, SoLuongTreEm: 0, TongTien: 11780000, GiamGia: 1000000, TienCoc: 10780000, TienConLai: 0, TrangThaiDon: 'Da thanh toan', PhuongThucTT: 'ZaloPay' },
      { DonHangID: 2, KhachHangID: 2, LichID: 3, NhanVienXuLyID: 2, VoucherID: null, MaDon: 'BK-9822', SoLuongNguoiLon: 1, SoLuongTreEm: 0, TongTien: 32900000, GiamGia: 0, TienCoc: 32900000, TienConLai: 0, TrangThaiDon: 'Da thanh toan', PhuongThucTT: 'VNPay' },
    ],
    skipDuplicates: true,
  });

  await prisma.chiTietHanhKhach.createMany({
    data: [
      { ChiTietID: 1, DonHangID: 1, HoTen: 'Nguyễn Văn Hùng', LoaiKhach: 'Nguoi lon', CCCD: '031092008761', MaQRVe: 'VT-BK-9821-P1', TrangThaiDiemDanh: 1 },
      { ChiTietID: 2, DonHangID: 1, HoTen: 'Lê Thị Mai Trang', LoaiKhach: 'Nguoi lon', CCCD: '031195009872', MaQRVe: 'VT-BK-9821-P2', TrangThaiDiemDanh: 0 },
      { ChiTietID: 3, DonHangID: 2, HoTen: 'Trần Thị Thu Thảo', LoaiKhach: 'Nguoi lon', CCCD: '079188004321', MaQRVe: 'VT-BK-9822-P1', TrangThaiDiemDanh: 0 },
    ],
    skipDuplicates: true,
  });

  await prisma.thanhToan.createMany({
    data: [
      { ThanhToanID: 1, DonHangID: 1, SoTien: 10780000, HinhThucTT: 'ZaloPay', MaGiaoDich: 'ZP-20261015-8831', TrangThai: 'Thanh cong' },
      { ThanhToanID: 2, DonHangID: 2, SoTien: 32900000, HinhThucTT: 'VNPay', MaGiaoDich: 'VNP-20261101-9921', TrangThai: 'Thanh cong' },
    ],
    skipDuplicates: true,
  });

  await prisma.hoaDon.createMany({
    data: [
      { HoaDonID: 1, DonHangID: 1, ThanhToanID: 1, SoHoaDon: 'HD-2026-9821', TenCongTy: 'CÔNG TY CP TẬP ĐOÀN HÙNG VƯƠNG', MaSoThue: '0315889922', TongTienVat: 10780000 },
    ],
    skipDuplicates: true,
  });

  await prisma.dieuPhoiTour.createMany({
    data: [
      { DieuPhoiID: 1, LichID: 1, HDVID: 1, NhanVienID: 2, TrangThai: 'Da xac nhan' },
      { DieuPhoiID: 2, LichID: 2, HDVID: 3, NhanVienID: 2, TrangThai: 'Da xac nhan' },
      { DieuPhoiID: 3, LichID: 3, HDVID: 2, NhanVienID: 2, TrangThai: 'Da xac nhan' },
    ],
    skipDuplicates: true,
  });

  await prisma.phieuDatDichVu.createMany({
    data: [
      { PhieuDatID: 1, LichID: 1, NhanVienID: 2, NhaCungCapID: 1, MaPhieu: 'PO-2026-NOV01', TongTienDichVu: 9900000, TienDaCoc: 5000000, TrangThai: 'Da xac nhan' },
      { PhieuDatID: 2, LichID: 1, NhanVienID: 2, NhaCungCapID: 2, MaPhieu: 'PO-2026-CAR01', TongTienDichVu: 14000000, TienDaCoc: 14000000, TrangThai: 'Hoan thanh' },
    ],
    skipDuplicates: true,
  });

  await prisma.danhGia.createMany({
    data: [
      { DanhGiaID: 1, KhachHangID: 1, TourID: 1, DonHangID: 1, SoSao: 5, BinhLuan: 'Tour Đà Nẵng - Hội An đi rất đúng giờ, xe sạch sẽ, HDV nhiệt tình và chu đáo!', TrangThaiDuyet: 'Da hien thi' },
    ],
    skipDuplicates: true,
  });

  // Đồng bộ lại các PostgreSQL sequences sau khi insert ID cố định
  const seqQueries = [
    `SELECT setval(pg_get_serial_sequence('taikhoan', 'taikhoanid'), (SELECT COALESCE(MAX(taikhoanid), 1) FROM taikhoan))`,
    `SELECT setval(pg_get_serial_sequence('vaitro', 'vaitroid'), (SELECT COALESCE(MAX(vaitroid), 1) FROM vaitro))`,
    `SELECT setval(pg_get_serial_sequence('khachhang', 'khachhangid'), (SELECT COALESCE(MAX(khachhangid), 1) FROM khachhang))`,
    `SELECT setval(pg_get_serial_sequence('nhanvien', 'nhanvienid'), (SELECT COALESCE(MAX(nhanvienid), 1) FROM nhanvien))`,
    `SELECT setval(pg_get_serial_sequence('huongdanvien', 'hdvid'), (SELECT COALESCE(MAX(hdvid), 1) FROM huongdanvien))`,
    `SELECT setval(pg_get_serial_sequence('danhmuctour', 'danhmucid'), (SELECT COALESCE(MAX(danhmucid), 1) FROM danhmuctour))`,
    `SELECT setval(pg_get_serial_sequence('tour', 'tourid'), (SELECT COALESCE(MAX(tourid), 1) FROM tour))`,
    `SELECT setval(pg_get_serial_sequence('lichkhoihanh', 'lichid'), (SELECT COALESCE(MAX(lichid), 1) FROM lichkhoihanh))`,
    `SELECT setval(pg_get_serial_sequence('voucher', 'voucherid'), (SELECT COALESCE(MAX(voucherid), 1) FROM voucher))`,
    `SELECT setval(pg_get_serial_sequence('dondattour', 'donhangid'), (SELECT COALESCE(MAX(donhangid), 1) FROM dondattour))`,
    `SELECT setval(pg_get_serial_sequence('chitiethanhkhach', 'chitietid'), (SELECT COALESCE(MAX(chitietid), 1) FROM chitiethanhkhach))`,
    `SELECT setval(pg_get_serial_sequence('thanhtoan', 'thanhtoanid'), (SELECT COALESCE(MAX(thanhtoanid), 1) FROM thanhtoan))`,
    `SELECT setval(pg_get_serial_sequence('hoadon', 'hoadonid'), (SELECT COALESCE(MAX(hoadonid), 1) FROM hoadon))`,
    `SELECT setval(pg_get_serial_sequence('nhacungcap', 'nhacungcapid'), (SELECT COALESCE(MAX(nhacungcapid), 1) FROM nhacungcap))`,
    `SELECT setval(pg_get_serial_sequence('dichvunhacungcap', 'dichvunccid'), (SELECT COALESCE(MAX(dichvunccid), 1) FROM dichvunhacungcap))`,
    `SELECT setval(pg_get_serial_sequence('phieudatdichvu', 'phieudatid'), (SELECT COALESCE(MAX(phieudatid), 1) FROM phieudatdichvu))`,
    `SELECT setval(pg_get_serial_sequence('dieuphoitour', 'dieuphoiid'), (SELECT COALESCE(MAX(dieuphoiid), 1) FROM dieuphoitour))`,
    `SELECT setval(pg_get_serial_sequence('danhgia', 'danhgiaid'), (SELECT COALESCE(MAX(danhgiaid), 1) FROM danhgia))`,
  ];

  for (const q of seqQueries) {
    try {
      await prisma.$executeRawUnsafe(q);
    } catch {}
  }

  return true;
}
