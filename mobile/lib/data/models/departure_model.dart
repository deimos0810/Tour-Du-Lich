class DepartureModel {
  const DepartureModel({
    required this.id,
    required this.startDate,
    required this.endDate,
    required this.remainingSeats,
    required this.price,
    required this.status,
  });

  final int id;
  final DateTime startDate;
  final DateTime endDate;
  final int remainingSeats;
  final int price;
  final String status;

  bool get isBookable =>
      status == 'Cho khoi hanh' &&
      startDate.isAfter(DateTime.now()) &&
      remainingSeats > 0;

  factory DepartureModel.fromJson(
    Map<String, dynamic> json, {
    required int fallbackPrice,
  }) {
    final capacity = (json['SoChoToiDa'] as num?)?.toInt() ?? 0;
    final booked = (json['SoChoDaDat'] as num?)?.toInt() ?? 0;
    return DepartureModel(
      id: (json['LichID'] as num).toInt(),
      startDate: DateTime.parse(json['NgayKhoiHanh'] as String),
      endDate: DateTime.parse(json['NgayKetThuc'] as String),
      remainingSeats: (capacity - booked).clamp(0, capacity).toInt(),
      price: _parsePrice(json['GiaTourKhuyenMai'], fallbackPrice),
      status: json['TrangThai'] as String? ?? '',
    );
  }

  static int _parsePrice(dynamic value, int fallback) {
    if (value == null) return fallback;
    final price = value is num
        ? value.toInt()
        : int.tryParse(value.toString()) ?? fallback;
    return price > 0 ? price : fallback;
  }
}
