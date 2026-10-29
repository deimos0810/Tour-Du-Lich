class TourModel {
  final int tourId;
  final String maTour;
  final String tenTour;
  final String? diemKhoiHanh;
  final String diemDen;
  final String thoiGian;
  final double giaNguoiLon;
  final double giaTreEm;
  final String? phuongTien;
  final String? hinhAnhUrl;
  final String? moTaChiTiet;
  final String? lichTrinh;
  final String? danhMuc;
  final List<DepartureScheduleModel> lichKhoiHanh;

  TourModel({
    required this.tourId,
    required this.maTour,
    required this.tenTour,
    this.diemKhoiHanh,
    required this.diemDen,
    required this.thoiGian,
    required this.giaNguoiLon,
    required this.giaTreEm,
    this.phuongTien,
    this.hinhAnhUrl,
    this.moTaChiTiet,
    this.lichTrinh,
    this.danhMuc,
    this.lichKhoiHanh = const [],
  });

  factory TourModel.fromJson(Map<String, dynamic> json) {
    return TourModel(
      tourId: json['TourID'] ?? 0,
      maTour: json['MaTour'] ?? '',
      tenTour: json['TenTour'] ?? '',
      diemKhoiHanh: json['DiemKhoiHanh'],
      diemDen: json['DiemDen'] ?? '',
      thoiGian: json['ThoiGian'] ?? '',
      giaNguoiLon: double.tryParse(json['GiaNguoiLon']?.toString() ?? '0') ?? 0,
      giaTreEm: double.tryParse(json['GiaTreEm']?.toString() ?? '0') ?? 0,
      phuongTien: json['PhuongTien'],
      hinhAnhUrl: json['HinhAnhURL'],
      moTaChiTiet: json['MoTaChiTiet'],
      lichTrinh: json['LichTrinh'],
      danhMuc: json['DanhMuc'] != null ? json['DanhMuc']['TenDanhMuc'] : null,
      lichKhoiHanh: json['LichKhoiHanh'] != null
          ? (json['LichKhoiHanh'] as List)
              .map((i) => DepartureScheduleModel.fromJson(i))
              .toList()
          : [],
    );
  }
}

class DepartureScheduleModel {
  final int lichId;
  final String maLich;
  final String ngayKhoiHanh;
  final String? ngayKetThuc;
  final int soChoToiDa;
  final int soChoDaDat;

  DepartureScheduleModel({
    required this.lichId,
    required this.maLich,
    required this.ngayKhoiHanh,
    this.ngayKetThuc,
    required this.soChoToiDa,
    required this.soChoDaDat,
  });

  factory DepartureScheduleModel.fromJson(Map<String, dynamic> json) {
    return DepartureScheduleModel(
      lichId: json['LichID'] ?? 0,
      maLich: json['MaLich'] ?? '',
      ngayKhoiHanh: json['NgayKhoiHanh'] ?? '',
      ngayKetThuc: json['NgayKetThuc'],
      soChoToiDa: json['SoChoToiDa'] ?? 0,
      soChoDaDat: json['SoChoDaDat'] ?? 0,
    );
  }
}

class BookingModel {
  final int donHangId;
  final String maDon;
  final String ngayDat;
  final int soLuongNguoiLon;
  final int soLuongTreEm;
  final double tongTien;
  final double? giamGia;
  final String trangThaiDon;
  final String? phuongThucTT;
  final String tenTour;
  final String? hinhAnhTour;
  final String ngayKhoiHanh;
  final int tourId;
  final List<PassengerModel> hanhKhach;

  BookingModel({
    required this.donHangId,
    required this.maDon,
    required this.ngayDat,
    required this.soLuongNguoiLon,
    required this.soLuongTreEm,
    required this.tongTien,
    this.giamGia,
    required this.trangThaiDon,
    this.phuongThucTT,
    required this.tenTour,
    this.hinhAnhTour,
    required this.ngayKhoiHanh,
    required this.tourId,
    this.hanhKhach = const [],
    this.diemKhoiHanh,
    this.diemDen,
    this.ngayKetThuc,
    this.tienCoc = 0,
    this.tienConLai = 0,
    this.rawJson,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    final lich = json['LichKhoiHanh'];
    final tour = lich?['Tour'];
    return BookingModel(
      donHangId: json['DonHangID'] ?? 0,
      maDon: json['MaDon'] ?? '',
      ngayDat: json['NgayDat'] ?? '',
      soLuongNguoiLon: json['SoLuongNguoiLon'] ?? 0,
      soLuongTreEm: json['SoLuongTreEm'] ?? 0,
      tongTien: double.tryParse(json['TongTien']?.toString() ?? '0') ?? 0,
      giamGia: double.tryParse(json['GiamGia']?.toString() ?? '0'),
      trangThaiDon: json['TrangThaiDon'] ?? '',
      phuongThucTT: json['PhuongThucTT'],
      tenTour: tour?['TenTour'] ?? 'Tour Du Lịch',
      hinhAnhTour: tour?['HinhAnhURL'],
      ngayKhoiHanh: lich?['NgayKhoiHanh'] ?? '',
      tourId: tour?['TourID'] ?? 0,
      diemKhoiHanh: tour?['DiemKhoiHanh'] ?? 'TP. Hồ Chí Minh',
      diemDen: tour?['DiemDen'] ?? '',
      ngayKetThuc: lich?['NgayKetThuc'],
      tienCoc: double.tryParse(json['TienCoc']?.toString() ?? '0') ?? 0,
      tienConLai: double.tryParse(json['TienConLai']?.toString() ?? '0') ?? 0,
      rawJson: json,
      hanhKhach: json['ChiTietHanhKhach'] != null
          ? (json['ChiTietHanhKhach'] as List)
              .map((p) => PassengerModel.fromJson(p))
              .toList()
          : [],
    );
  }

  final String? diemKhoiHanh;
  final String? diemDen;
  final String? ngayKetThuc;
  final double tienCoc;
  final double tienConLai;
  final Map<String, dynamic>? rawJson;
}

class PassengerModel {
  final int chiTietId;
  final String hoTen;
  final String loaiKhach;
  final String? cccd;
  final String? maQRVe;
  final int trangThaiDiemDanh;

  PassengerModel({
    required this.chiTietId,
    required this.hoTen,
    required this.loaiKhach,
    this.cccd,
    this.maQRVe,
    required this.trangThaiDiemDanh,
  });

  factory PassengerModel.fromJson(Map<String, dynamic> json) {
    return PassengerModel(
      chiTietId: json['ChiTietID'] ?? 0,
      hoTen: json['HoTen'] ?? '',
      loaiKhach: json['LoaiKhach'] ?? '',
      cccd: json['CCCD'],
      maQRVe: json['MaQRVe'],
      trangThaiDiemDanh: json['TrangThaiDiemDanh'] ?? 0,
    );
  }
}

// Model cho Thông báo (Nhắc lịch khởi hành, nhắc thanh toán, đánh giá)
class NotificationModel {
  final String loai; // NHAC_LICH, THANH_TOAN, DANH_GIA
  final String tieuDe;
  final String noiDung;
  final String maDon;
  final int donHangId;
  final DateTime thoiGian;

  NotificationModel({
    required this.loai,
    required this.tieuDe,
    required this.noiDung,
    required this.maDon,
    required this.donHangId,
    required this.thoiGian,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      loai: json['loai'] ?? 'NHAC_LICH',
      tieuDe: json['tieuDe'] ?? '',
      noiDung: json['noiDung'] ?? '',
      maDon: json['maDon'] ?? '',
      donHangId: json['donHangId'] ?? 0,
      thoiGian: json['thoiGian'] != null
          ? DateTime.tryParse(json['thoiGian'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

// Model dịch vụ đi kèm (Nhà xe, khách sạn) cho Hướng Dẫn Viên
class SupplierServiceModel {
  final int nccId;
  final String tenNCC;
  final String loaiNCC; // Khach san, Xe van chuyen, Nha hang
  final String soDienThoai;
  final String? diaChi;
  final String? email;
  final String? maPhieu;
  final String? tenDichVu;
  final double? tongTien;

  SupplierServiceModel({
    required this.nccId,
    required this.tenNCC,
    required this.loaiNCC,
    required this.soDienThoai,
    this.diaChi,
    this.email,
    this.maPhieu,
    this.tenDichVu,
    this.tongTien,
  });

  factory SupplierServiceModel.fromJson(Map<String, dynamic> json) {
    final ncc = json['NhaCungCap'] ?? {};
    final chiTietList = json['ChiTiet'] as List? ?? [];
    String tenDV = '';
    if (chiTietList.isNotEmpty && chiTietList.first['DichVu'] != null) {
      tenDV = chiTietList.first['DichVu']['TenDichVu'] ?? '';
    }

    return SupplierServiceModel(
      nccId: ncc['NhaCungCapID'] ?? json['NhaCungCapID'] ?? 0,
      tenNCC: ncc['TenNCC'] ?? json['TenNCC'] ?? 'Nhà cung cấp',
      loaiNCC: ncc['LoaiNCC'] ?? json['LoaiNCC'] ?? 'Dịch vụ đi kèm',
      soDienThoai: ncc['SoDienThoai'] ?? json['SoDienThoai'] ?? '0901234567',
      diaChi: ncc['DiaChi'] ?? json['DiaChi'],
      email: ncc['Email'] ?? json['Email'],
      maPhieu: json['MaPhieu'],
      tenDichVu: tenDV.isNotEmpty ? tenDV : null,
      tongTien: double.tryParse(json['TongTienDichVu']?.toString() ?? '0'),
    );
  }
}
