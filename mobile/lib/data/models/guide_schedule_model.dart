class GuideInfoModel {
  final int id;
  final String fullName;
  final String cardCode;
  final String languages;

  const GuideInfoModel({
    required this.id,
    required this.fullName,
    required this.cardCode,
    required this.languages,
  });

  factory GuideInfoModel.fromJson(Map<String, dynamic> json) {
    return GuideInfoModel(
      id: (json['HDVID'] as num?)?.toInt() ?? 0,
      fullName: (json['HoTen'] as String?) ?? 'Hướng dẫn viên',
      cardCode: (json['SoTheHDV'] as String?) ?? 'HDV-VIETTOUR',
      languages: (json['NgonNgu'] as String?) ?? 'Tiếng Việt',
    );
  }
}

class GuidePassengerModel {
  final int id;
  final int orderId;
  final String orderCode;
  final String customerName;
  final String customerPhone;
  final String fullName;
  final String identityCode;
  final String guestType;
  final String ticketQrCode;
  final bool isCheckedIn;
  final String note;

  const GuidePassengerModel({
    required this.id,
    required this.orderId,
    required this.orderCode,
    required this.customerName,
    required this.customerPhone,
    required this.fullName,
    required this.identityCode,
    required this.guestType,
    required this.ticketQrCode,
    required this.isCheckedIn,
    required this.note,
  });

  factory GuidePassengerModel.fromJson(
    Map<String, dynamic> json, {
    String orderCode = '',
    String customerName = '',
    String customerPhone = '',
  }) {
    return GuidePassengerModel(
      id: (json['ChiTietID'] as num?)?.toInt() ?? 0,
      orderId: (json['DonHangID'] as num?)?.toInt() ?? 0,
      orderCode: orderCode,
      customerName: customerName,
      customerPhone: customerPhone,
      fullName: (json['HoTen'] as String?) ?? 'Hành khách',
      identityCode: (json['CCCD'] as String?) ?? '',
      guestType: (json['LoaiKhach'] as String?) ?? 'Người lớn',
      ticketQrCode: (json['MaQRVe'] as String?) ?? '',
      isCheckedIn: (json['TrangThaiDiemDanh'] as num?)?.toInt() == 1,
      note: (json['GhiChu'] as String?) ?? '',
    );
  }

  GuidePassengerModel copyWith({bool? isCheckedIn}) {
    return GuidePassengerModel(
      id: id,
      orderId: orderId,
      orderCode: orderCode,
      customerName: customerName,
      customerPhone: customerPhone,
      fullName: fullName,
      identityCode: identityCode,
      guestType: guestType,
      ticketQrCode: ticketQrCode,
      isCheckedIn: isCheckedIn ?? this.isCheckedIn,
      note: note,
    );
  }
}

class GuideAttachedServiceModel {
  final int id;
  final String code;
  final String supplierName;
  final String supplierType;
  final String supplierPhone;
  final String supplierEmail;
  final String supplierAddress;
  final String status;
  final List<String> serviceDetails;

  const GuideAttachedServiceModel({
    required this.id,
    required this.code,
    required this.supplierName,
    required this.supplierType,
    required this.supplierPhone,
    required this.supplierEmail,
    required this.supplierAddress,
    required this.status,
    required this.serviceDetails,
  });

  factory GuideAttachedServiceModel.fromJson(Map<String, dynamic> json) {
    final ncc = json['NhaCungCap'] as Map<String, dynamic>? ?? {};
    final chiTietList = json['ChiTiet'] as List<dynamic>? ?? [];
    final details = <String>[];
    for (final ct in chiTietList) {
      if (ct is Map<String, dynamic>) {
        final dv = ct['DichVu'] as Map<String, dynamic>? ?? {};
        final ten = (dv['TenDichVu'] as String?) ??
            (ct['TenDichVu'] as String?) ??
            '';
        final sl = ct['SoLuong'] ?? 1;
        final dvt = dv['DonViTinh'] ?? '';
        if (ten.isNotEmpty) {
          details.add('$ten (SL: $sl $dvt)'.trim());
        }
      }
    }
    return GuideAttachedServiceModel(
      id: (json['PhieuID'] as num?)?.toInt() ?? 0,
      code: (json['MaPhieu'] as String?) ?? '',
      supplierName: (ncc['TenNCC'] as String?) ?? 'Đối tác VietTour',
      supplierType: (ncc['LoaiDichVu'] as String?) ?? 'Dịch vụ đối tác',
      supplierPhone: (ncc['SoDienThoai'] as String?) ?? '',
      supplierEmail: (ncc['Email'] as String?) ?? '',
      supplierAddress: (ncc['DiaChi'] as String?) ?? '',
      status: (json['TrangThai'] as String?) ?? 'Da xac nhan',
      serviceDetails: details,
    );
  }
}

class GuideScheduleItemModel {
  final int dispatchId;
  final int scheduleId;
  final int guideId;
  final String role;
  final String status;
  final String? note;
  final DateTime? assignedDate;

  final int tourId;
  final String tourCode;
  final String tourName;
  final String departurePoint;
  final String destination;
  final String duration;
  final String imageUrl;

  final String departureCode;
  final DateTime departureDate;
  final DateTime returnDate;

  final int totalGuests;
  final int checkedInGuests;
  final List<GuidePassengerModel> passengers;
  final List<GuideAttachedServiceModel> attachedServices;

  const GuideScheduleItemModel({
    required this.dispatchId,
    required this.scheduleId,
    required this.guideId,
    required this.role,
    required this.status,
    this.note,
    this.assignedDate,
    required this.tourId,
    required this.tourCode,
    required this.tourName,
    required this.departurePoint,
    required this.destination,
    required this.duration,
    required this.imageUrl,
    required this.departureCode,
    required this.departureDate,
    required this.returnDate,
    required this.totalGuests,
    required this.checkedInGuests,
    required this.passengers,
    required this.attachedServices,
  });

  factory GuideScheduleItemModel.fromJson(Map<String, dynamic> json) {
    final lkh = json['LichKhoiHanh'] as Map<String, dynamic>? ?? {};
    final tour = lkh['Tour'] as Map<String, dynamic>? ?? {};
    final donList = lkh['DonDatTour'] as List<dynamic>? ?? [];
    final phieuList = lkh['PhieuDatDichVu'] as List<dynamic>? ?? [];

    final List<GuidePassengerModel> paxList = [];
    for (final don in donList) {
      if (don is Map<String, dynamic>) {
        final code = (don['MaDon'] as String?) ?? '';
        final kh = don['KhachHang'] as Map<String, dynamic>? ?? {};
        final cName = (kh['HoTen'] as String?) ?? '';
        final cPhone = (kh['SoDienThoai'] as String?) ?? '';

        final rawPax = don['ChiTietHanhKhach'] as List<dynamic>? ?? [];
        for (final p in rawPax) {
          if (p is Map<String, dynamic>) {
            paxList.add(
              GuidePassengerModel.fromJson(
                p,
                orderCode: code,
                customerName: cName,
                customerPhone: cPhone,
              ),
            );
          }
        }
      }
    }

    final List<GuideAttachedServiceModel> serviceList = [];
    for (final p in phieuList) {
      if (p is Map<String, dynamic>) {
        serviceList.add(GuideAttachedServiceModel.fromJson(p));
      }
    }

    final depDate = DateTime.tryParse(lkh['NgayKhoiHanh']?.toString() ?? '') ??
        DateTime.now();
    final retDate = DateTime.tryParse(lkh['NgayKetThuc']?.toString() ?? '') ??
        DateTime.now().add(const Duration(days: 3));

    return GuideScheduleItemModel(
      dispatchId: (json['DieuPhoiID'] as num?)?.toInt() ?? 0,
      scheduleId: (json['LichID'] as num?)?.toInt() ?? 0,
      guideId: (json['HDVID'] as num?)?.toInt() ?? 0,
      role: (json['VaiTro'] as String?) ?? 'HDV Chính',
      status: (json['TrangThai'] as String?) ?? 'Chờ xác nhận',
      note: json['GhiChu'] as String?,
      assignedDate: DateTime.tryParse(json['NgayPhanCong']?.toString() ?? ''),
      tourId: (tour['TourID'] as num?)?.toInt() ?? 0,
      tourCode: (tour['MaTour'] as String?) ?? '',
      tourName: (tour['TenTour'] as String?) ?? 'Tour du lịch',
      departurePoint: (tour['DiemKhoiHanh'] as String?) ?? 'TP.HCM',
      destination: (tour['DiemDen'] as String?) ?? '',
      duration: (tour['ThoiGian'] as String?) ?? '4 Ngày 3 Đêm',
      imageUrl: (tour['HinhAnhURL'] as String?) ?? '/uploads/tours/phuquoc.jpg',
      departureCode: (lkh['MaLich'] as String?) ?? '',
      departureDate: depDate,
      returnDate: retDate,
      totalGuests: (json['tongKhach'] as num?)?.toInt() ?? paxList.length,
      checkedInGuests: (json['daDiemDanh'] as num?)?.toInt() ??
          paxList.where((p) => p.isCheckedIn).length,
      passengers: paxList,
      attachedServices: serviceList,
    );
  }

  bool get isConfirmed => status == 'Da xac nhan';
  bool get isPending => status == 'Cho xac nhan';
}
