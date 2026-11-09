import 'tour_model.dart';

class CustomerBookingModel {
  const CustomerBookingModel({
    required this.id,
    required this.code,
    required this.status,
    required this.paymentStatus,
    required this.total,
    required this.subtotal,
    required this.discountAmount,
    required this.paidAmount,
    required this.amountDue,
    required this.departureDate,
    required this.returnDate,
    required this.bookingDate,
    required this.departurePoint,
    required this.adults,
    required this.children,
    required this.tour,
    this.hasReviewed = false,
    this.hasCheckedIn = false,
    this.reviewStars,
    this.reviewComment,
    this.reviewDate,
    this.paymentMethod = 'VNPay',
    this.transactionCode = '',
    this.invoiceCode = '',
    this.note = '',
  });

  final int id;
  final String code;
  final String status;
  final String paymentStatus;
  final int total;
  final int subtotal;
  final int discountAmount;
  final int paidAmount;
  final int amountDue;
  final DateTime departureDate;
  final DateTime returnDate;
  final DateTime bookingDate;
  final String departurePoint;
  final int adults;
  final int children;
  final TourModel tour;
  final bool hasReviewed;
  final bool hasCheckedIn;
  final int? reviewStars;
  final String? reviewComment;
  final DateTime? reviewDate;
  final String paymentMethod;
  final String transactionCode;
  final String invoiceCode;
  final String note;

  bool get isPaid => status == 'Da thanh toan' || status == 'Hoan thanh';
  bool get canPay =>
      (status == 'Cho thanh toan' || status == 'Da dat coc') && !isPaid;
  bool get canCancel =>
      status != 'Da huy' &&
      status != 'Hoan thanh' &&
      !hasReviewed &&
      !hasCheckedIn &&
      (status == 'Cho thanh toan' || departureDate.isAfter(DateTime.now()));
  bool get canReview =>
      (status == 'Da thanh toan' || status == 'Hoan thanh') && !hasReviewed;

  int get daysUntilDeparture =>
      departureDate.difference(DateTime.now()).inDays;

  bool get isUpcomingDeparture =>
      status != 'Da huy' &&
      departureDate.isAfter(DateTime.now().subtract(const Duration(hours: 12)));

  String get statusLabel => switch (status) {
    'Cho thanh toan' => 'Chờ thanh toán',
    'Da dat coc' => 'Đã đặt cọc',
    'Da thanh toan' => 'Đã thanh toán',
    'Da xac nhan' => 'Đã xác nhận',
    'Hoan thanh' => 'Hoàn thành',
    'Da huy' => 'Đã hủy',
    _ => status,
  };

  factory CustomerBookingModel.fromJson(Map<String, dynamic> json) {
    final schedule = json['LichKhoiHanh'] as Map<String, dynamic>;
    final tourJson = schedule['Tour'] as Map<String, dynamic>;
    final payments = json['ThanhToan'] as List<dynamic>? ?? const [];
    final latestPayment = payments.isEmpty
        ? null
        : payments.first as Map<String, dynamic>;
    final rawStatus = json['TrangThaiDon'] as String? ?? '';
    final reviews = json['DanhGia'] as List<dynamic>? ?? const [];
    final firstReview = reviews.isNotEmpty && reviews.first is Map<String, dynamic>
        ? reviews.first as Map<String, dynamic>
        : null;
    final passengers = json['ChiTietHanhKhach'] as List<dynamic>? ?? const [];
    final hasReviewed = reviews.isNotEmpty;
    final hasCheckedIn = passengers.any(
      (p) => p is Map && (p['TrangThaiDiemDanh'] == 1 || p['TrangThaiDiemDanh'] == '1'),
    );
    final departDate = DateTime.parse(schedule['NgayKhoiHanh'] as String);
    final returnDate = schedule['NgayKetThuc'] != null
        ? DateTime.tryParse(schedule['NgayKetThuc'].toString()) ?? departDate
        : departDate;
    final bookingDate = json['NgayDat'] != null
        ? DateTime.tryParse(json['NgayDat'].toString()) ?? DateTime.now()
        : DateTime.now();
    final isPastReturn = returnDate.isBefore(DateTime.now());
    final effectiveStatus = (rawStatus != 'Da huy' &&
            (hasReviewed ||
                hasCheckedIn ||
                (isPastReturn &&
                    (rawStatus == 'Da thanh toan' || rawStatus == 'Da xac nhan'))))
        ? 'Hoan thanh'
        : rawStatus;
    final subtotal = _toInt(json['TongTien']);
    final discountAmount = _toInt(json['GiamGia']);
    final netTotal = (subtotal - discountAmount).clamp(0, subtotal);
    final isOrderPaid = effectiveStatus == 'Da thanh toan' || effectiveStatus == 'Hoan thanh';
    final paidAmount = isOrderPaid ? netTotal : _toInt(json['TienCoc']);
    final amountDue = isOrderPaid
        ? 0
        : (json['TienConLai'] != null
              ? _toInt(json['TienConLai'])
              : (netTotal - paidAmount).clamp(0, netTotal));
    final paymentStatus = isOrderPaid
        ? 'Đã thanh toán — Đã cấp vé điện tử & Hóa đơn'
        : latestPayment?['TrangThai'] == 'That bai'
        ? 'Thanh toán thất bại'
        : latestPayment?['TrangThai'] == 'Thanh cong'
        ? 'Đang ghi nhận thanh toán'
        : 'Chờ thanh toán (Chưa xuất vé)';

    final code = json['MaDon'] as String? ?? '';
    final id = (json['DonHangID'] as num).toInt();

    return CustomerBookingModel(
      id: id,
      code: code,
      status: effectiveStatus,
      paymentStatus: paymentStatus,
      total: netTotal,
      subtotal: subtotal,
      discountAmount: discountAmount,
      paidAmount: paidAmount,
      amountDue: amountDue,
      departureDate: departDate,
      returnDate: returnDate,
      bookingDate: bookingDate,
      departurePoint: (tourJson['DiemKhoiHanh'] ?? 'TP. Hồ Chí Minh').toString(),
      adults: (json['SoLuongNguoiLon'] as num?)?.toInt() ?? 0,
      children: (json['SoLuongTreEm'] as num?)?.toInt() ?? 0,
      tour: TourModel.fromJson(tourJson),
      hasReviewed: hasReviewed,
      hasCheckedIn: hasCheckedIn,
      reviewStars: firstReview != null ? _toInt(firstReview['SoSao']) : null,
      reviewComment: firstReview?['BinhLuan']?.toString(),
      reviewDate: firstReview?['NgayDanhGia'] != null
          ? DateTime.tryParse(firstReview!['NgayDanhGia'].toString())
          : null,
      paymentMethod: (json['PhuongThucTT'] ?? latestPayment?['HinhThucTT'] ?? 'VNPay').toString(),
      transactionCode: (latestPayment?['MaGiaoDich'] ?? 'VNP-${code.replaceAll('BK-', '')}').toString(),
      invoiceCode: 'INV-${code.isNotEmpty ? code.replaceAll('BK-', '') : id}',
      note: (json['GhiChu'] ?? '').toString(),
    );
  }

  static int _toInt(dynamic value) {
    if (value is num) return value.round();
    return num.tryParse(value?.toString() ?? '')?.round() ?? 0;
  }
}

