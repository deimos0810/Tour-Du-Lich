import 'tour_model.dart';

class CustomerBookingModel {
  const CustomerBookingModel({
    required this.id,
    required this.code,
    required this.status,
    required this.paymentStatus,
    required this.total,
    required this.paidAmount,
    required this.amountDue,
    required this.departureDate,
    required this.adults,
    required this.children,
    required this.tour,
  });

  final int id;
  final String code;
  final String status;
  final String paymentStatus;
  final int total;
  final int paidAmount;
  final int amountDue;
  final DateTime departureDate;
  final int adults;
  final int children;
  final TourModel tour;

  bool get isPaid => status == 'Da thanh toan' || status == 'Hoan thanh';
  bool get canPay =>
      (status == 'Cho thanh toan' || status == 'Da dat coc') && !isPaid;
  bool get canCancel => status == 'Cho thanh toan' && !isPaid;
  bool get canReview => status == 'Da thanh toan' || status == 'Hoan thanh';

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
    final netTotal = _toInt(json['TongTien']) - _toInt(json['GiamGia']);
    final isOrderPaid = rawStatus == 'Da thanh toan' || rawStatus == 'Hoan thanh';
    final paidAmount = isOrderPaid ? netTotal : _toInt(json['TienCoc']);
    final amountDue = isOrderPaid
        ? 0
        : (json['TienConLai'] != null
              ? _toInt(json['TienConLai'])
              : (netTotal - paidAmount).clamp(0, netTotal));
    final paymentStatus = isOrderPaid
        ? 'Đã thanh toán — Đã cấp vé điện tử'
        : latestPayment?['TrangThai'] == 'That bai'
        ? 'Thanh toán thất bại'
        : latestPayment?['TrangThai'] == 'Thanh cong'
        ? 'Đang ghi nhận thanh toán'
        : 'Chờ thanh toán (Chưa xuất vé)';

    return CustomerBookingModel(
      id: (json['DonHangID'] as num).toInt(),
      code: json['MaDon'] as String? ?? '',
      status: rawStatus,
      paymentStatus: paymentStatus,
      total: netTotal,
      paidAmount: paidAmount,
      amountDue: amountDue,
      departureDate: DateTime.parse(schedule['NgayKhoiHanh'] as String),
      adults: (json['SoLuongNguoiLon'] as num?)?.toInt() ?? 0,
      children: (json['SoLuongTreEm'] as num?)?.toInt() ?? 0,
      tour: TourModel.fromJson(tourJson),
    );
  }

  static int _toInt(dynamic value) {
    if (value is num) return value.round();
    return num.tryParse(value?.toString() ?? '')?.round() ?? 0;
  }
}
