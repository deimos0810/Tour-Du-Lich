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
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    final tour = json['LichKhoiHanh']?['Tour'];
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
      ngayKhoiHanh: json['LichKhoiHanh']?['NgayKhoiHanh'] ?? '',
      tourId: tour?['TourID'] ?? 0,
      hanhKhach: json['ChiTietHanhKhach'] != null
          ? (json['ChiTietHanhKhach'] as List)
              .map((p) => PassengerModel.fromJson(p))
              .toList()
          : [],
    );
  }
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
