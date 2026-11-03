import 'dart:convert';
import 'departure_model.dart';

/// Chi tiết một ngày trong lịch trình tour.
class ItineraryDay {
  const ItineraryDay({
    required this.day,
    required this.title,
    required this.detail,
    this.image,
    this.highlights = const [],
    this.meals,
  });

  final int day;
  final String title;
  final String detail;
  final String? image;
  final List<String> highlights;
  final String? meals;

  factory ItineraryDay.fromJson(Map<String, dynamic> json, int fallbackDay) {
    final rawHighlights = json['highlights'];
    final List<String> highlights;
    if (rawHighlights is List) {
      highlights = rawHighlights.map((e) => e.toString()).toList();
    } else {
      highlights = const [];
    }

    final rawDay = json['day'] ?? json['ngay'] ?? fallbackDay;
    final int day = rawDay is num ? rawDay.toInt() : (int.tryParse(rawDay.toString()) ?? fallbackDay);

    var title = (json['title'] ?? json['tieuDe'] ?? 'Ngày $day').toString().trim();
    // Loại bỏ tiền tố "Ngày X: " nếu đã có sẵn trong title để giao diện không bị lặp "Ngày 1: Ngày 1:"
    title = title.replaceFirst(RegExp(r'^(?:Ngày|Day)\s*\d+[:\.\-]\s*', caseSensitive: false), '').trim();
    if (title.isEmpty) title = 'Ngày $day';

    return ItineraryDay(
      day: day,
      title: title,
      detail: (json['detail'] ?? json['chiTiet'] ?? json['noiDung'] ?? '').toString().trim(),
      image: json['image']?.toString(),
      highlights: highlights,
      meals: json['meals']?.toString() ?? json['buaAn']?.toString(),
    );
  }
}

/// Đánh giá của khách hàng từ cơ sở dữ liệu.
class ReviewModel {
  const ReviewModel({
    required this.id,
    required this.rating,
    required this.comment,
    required this.author,
    required this.date,
  });

  final int id;
  final int rating;
  final String comment;
  final String author;
  final DateTime date;

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    final rawStar = json['SoSao'] ?? json['sosao'] ?? json['SaoXepHang'] ?? json['diemDanhGia'] ?? 5;
    final rating = rawStar is num ? rawStar.toInt() : (int.tryParse(rawStar.toString()) ?? 5);

    final kh = json['KhachHang'] as Map<String, dynamic>?;
    final author = (kh?['HoTen'] ?? json['HoTen'] ?? json['author'] ?? 'Khách hàng VietTour').toString();

    final dateStr = json['NgayDanhGia'] ?? json['ngaydanhgia'] ?? json['createdAt'];
    final date = dateStr != null ? DateTime.tryParse(dateStr.toString()) ?? DateTime.now() : DateTime.now();

    return ReviewModel(
      id: (json['DanhGiaID'] ?? json['danhgiaid'] ?? 0) as int? ?? 0,
      rating: rating.clamp(1, 5),
      comment: (json['BinhLuan'] ?? json['binhluan'] ?? json['comment'] ?? '').toString().trim(),
      author: author,
      date: date,
    );
  }
}

/// Typed model for a tour record returned by the NestJS backend.
class TourModel {
  const TourModel({
    required this.id,
    required this.title,
    required this.destination,
    required this.region,
    required this.duration,
    required this.price,
    required this.originalPrice,
    required this.rating,
    required this.reviewCount,
    required this.departure,
    required this.imageUrl,
    required this.category,
    required this.itinerary,
    this.itineraryDays = const [],
    this.includesAirfare = true,
    this.isInternational = false,
    this.childPrice = 0,
    this.departures = const [],
    this.reviews = const [],
  });

  final String id;
  final String title;
  final String destination;
  final String region;
  final String duration;
  final int price;
  final int originalPrice;
  final double rating;
  final int reviewCount;
  final String departure;
  final String imageUrl;
  final String category;
  final List<String> itinerary;
  final List<ItineraryDay> itineraryDays;
  final bool includesAirfare;
  final bool isInternational;
  final int childPrice;
  final List<DepartureModel> departures;
  final List<ReviewModel> reviews;

  // ── JSON deserialization from the NestJS /api/tours response ──────────────

  factory TourModel.fromJson(Map<String, dynamic> json) {
    // 1. Đồng bộ đánh giá & số sao từ cơ sở dữ liệu (Bảng danhgia -> SoSao)
    final reviewsRaw = json['DanhGia'] as List<dynamic>? ?? [];
    final List<ReviewModel> parsedReviews = reviewsRaw
        .map((r) => ReviewModel.fromJson(r as Map<String, dynamic>))
        .toList();

    double rating = 5.0; // Mặc định 5 sao khi chưa có đánh giá
    if (parsedReviews.isNotEmpty) {
      final sum = parsedReviews.fold<num>(0, (prev, r) => prev + r.rating);
      rating = sum / parsedReviews.length;
    }

    // 2. Thời lượng tour
    final thoiGian = (json['ThoiGian'] as String?) ?? '';
    final soNgay = (json['SoNgay'] as num?)?.toInt() ?? 0;
    final soDem = (json['SoDem'] as num?)?.toInt() ?? 0;
    final duration = thoiGian.isNotEmpty
        ? thoiGian
        : (soNgay > 0 ? '$soNgay Ngày $soDem Đêm' : 'N/A');

    // 3. Hình ảnh đại diện
    final diemDen = (json['DiemDen'] as String?) ?? '';
    final hinhAnh =
        (json['HinhAnhURL'] as String?) ??
        (json['AnhDaiDien'] as String?) ??
        '';
    String fallbackImage = '/uploads/tours/phuquoc.jpg';
    final dLower = diemDen.toLowerCase();
    if (dLower.contains('đà nẵng') || dLower.contains('da nang')) {
      fallbackImage = '/uploads/tours/danang.jpg';
    } else if (dLower.contains('sapa') || dLower.contains('fansipan')) {
      fallbackImage = '/uploads/tours/sapa.jpg';
    } else if (dLower.contains('hạ long') || dLower.contains('ha long')) {
      fallbackImage = '/uploads/tours/halong.jpg';
    } else if (dLower.contains('nhật') || dLower.contains('tokyo') || dLower.contains('japan')) {
      fallbackImage = '/uploads/tours/tokyo.jpg';
    } else if (dLower.contains('nha trang') || dLower.contains('khánh hòa')) {
      fallbackImage = '/uploads/tours/nhatrang.jpg';
    } else if (dLower.contains('đà lạt') || dLower.contains('da lat') || dLower.contains('lâm đồng')) {
      fallbackImage = '/uploads/tours/dalat.jpg';
    } else if (dLower.contains('miền tây') || dLower.contains('cần thơ') || dLower.contains('an giang')) {
      fallbackImage = '/uploads/tours/mientay.jpg';
    } else if (dLower.contains('hà giang') || dLower.contains('đồng văn')) {
      fallbackImage = '/uploads/tours/hagiang.jpg';
    } else if (dLower.contains('hàn quốc') || dLower.contains('seoul') || dLower.contains('korea')) {
      fallbackImage = '/uploads/tours/seoul.jpg';
    } else if (dLower.contains('thái lan') || dLower.contains('bangkok') || dLower.contains('thailand')) {
      fallbackImage = '/uploads/tours/thailand.jpg';
    }
    final imageUrl = hinhAnh.isNotEmpty ? hinhAnh : fallbackImage;

    // 4. Danh mục & Giá
    final danhMuc = json['DanhMuc'] as Map<String, dynamic>?;
    final category = (danhMuc?['TenDanhMuc'] as String?) ?? 'Tour';
    final adultPrice = _parseInt(json['GiaNguoiLon']);
    final departuresRaw = json['LichKhoiHanh'] as List<dynamic>? ?? const [];
    final departures = departuresRaw
        .map(
          (entry) => DepartureModel.fromJson(
            entry as Map<String, dynamic>,
            fallbackPrice: adultPrice,
          ),
        )
        .toList();

    // 5. Quốc tế / Trong nước
    final categoryLower = category.toLowerCase();
    final isInternational =
        categoryLower.contains('quoc te') ||
        categoryLower.contains('quốc tế') ||
        (!diemDen.toLowerCase().contains('việt nam') &&
            diemDen.isNotEmpty &&
            (categoryLower.contains('quốc tế') ||
                (json['LoaiTour'] as String? ?? '').toLowerCase().contains(
                  'quoc te',
                )));

    // 6. Xử lý Lịch trình chuẩn xác: Hỗ trợ cả JSON mảng đối tượng và Plain text
    final List<ItineraryDay> parsedDays = _parseItinerary(
      rawLichTrinh: json['LichTrinh'] as String?,
      rawLichTrinhTour: json['LichTrinhTour'] as List<dynamic>?,
      rawMoTa: (json['MoTaChiTiet'] ?? json['MoTa']) as String?,
      durationStr: duration,
    );

    final List<String> itineraryTextList = parsedDays.map((d) => d.title).toList();

    return TourModel(
      id: (json['TourID'] ?? '').toString(),
      title: (json['TenTour'] as String?) ?? 'Tour',
      destination: diemDen,
      region:
          (json['KhuVuc'] as String?) ??
          (diemDen.isNotEmpty ? diemDen : category),
      duration: duration,
      price: adultPrice,
      originalPrice: _parseInt(json['GiaGoc'] ?? json['GiaNguoiLon']),
      childPrice: _parseInt(json['GiaTreEm']),
      departures: departures,
      rating: double.parse(rating.toStringAsFixed(1)),
      reviewCount: parsedReviews.isNotEmpty ? parsedReviews.length : 0,
      reviews: parsedReviews,
      departure: (json['DiemKhoiHanh'] as String?) ?? '',
      imageUrl: imageUrl,
      category: category,
      itinerary: itineraryTextList,
      itineraryDays: parsedDays,
      includesAirfare:
          (json['BaoGomVeMayBay'] as bool?) ??
          category.toLowerCase().contains('quốc tế'),
      isInternational: isInternational,
    );
  }

  static List<ItineraryDay> _parseItinerary({
    String? rawLichTrinh,
    List<dynamic>? rawLichTrinhTour,
    String? rawMoTa,
    required String durationStr,
  }) {
    // 1. Kiểm tra rawLichTrinhTour (nếu có từ quan hệ bảng LichTrinhTour)
    if (rawLichTrinhTour != null && rawLichTrinhTour.isNotEmpty) {
      return rawLichTrinhTour.asMap().entries.map((entry) {
        final idx = entry.key;
        final item = entry.value as Map<String, dynamic>;
        final dayNum = item['NgaySo'] ?? (idx + 1);
        final title = (item['TieuDe'] ?? 'Ngày $dayNum').toString();
        final detail = (item['NoiDung'] ?? '').toString();
        return ItineraryDay(
          day: dayNum is num ? dayNum.toInt() : (int.tryParse(dayNum.toString()) ?? (idx + 1)),
          title: title,
          detail: detail,
        );
      }).toList();
    }

    // 2. Kiểm tra chuỗi LichTrinh (JSON mảng đối tượng)
    final raw = rawLichTrinh?.trim() ?? '';
    if (raw.isNotEmpty) {
      final jsonStart = raw.indexOf('[');
      final jsonEnd = raw.lastIndexOf(']');
      if (jsonStart != -1 && jsonEnd > jsonStart) {
        try {
          final jsonSub = raw.substring(jsonStart, jsonEnd + 1);
          final decoded = jsonDecode(jsonSub);
          if (decoded is List && decoded.isNotEmpty) {
            return decoded.asMap().entries.map((entry) {
              final idx = entry.key;
              final item = entry.value as Map<String, dynamic>;
              return ItineraryDay.fromJson(item, idx + 1);
            }).toList();
          }
        } catch (_) {
          // Bỏ qua lỗi JSON decode, chạy xuống fallback text
        }
      }

      // 3. Fallback: Parse chuỗi plain text theo "Ngày X:"
      final dayRegex = RegExp(r'(?:Ngày|Day)\s*(\d+)[:\.\-]\s*([^\n\r]+)', caseSensitive: false);
      final matches = dayRegex.allMatches(raw).toList();
      if (matches.isNotEmpty) {
        final List<ItineraryDay> result = [];
        for (int i = 0; i < matches.length; i++) {
          final m = matches[i];
          final dayNum = int.tryParse(m.group(1) ?? '') ?? (i + 1);
          final title = (m.group(2) ?? '').trim();
          final startIdx = m.end;
          final endIdx = (i + 1 < matches.length) ? matches[i + 1].start : raw.length;
          final detail = raw.substring(startIdx, endIdx).trim();
          result.add(ItineraryDay(
            day: dayNum,
            title: title.isNotEmpty ? title : 'Khám phá điểm đến',
            detail: detail,
          ));
        }
        return result;
      }

      // 4. Nếu không khớp regex Ngày X: tách theo dòng hoặc dấu chấm
      final lines = raw.split(RegExp(r'\r?\n|•')).map((l) => l.trim()).where((l) => l.isNotEmpty).toList();
      if (lines.isNotEmpty) {
        return lines.asMap().entries.map((entry) {
          final idx = entry.key;
          final line = entry.value;
          final parts = line.split(':');
          if (parts.length >= 2) {
            return ItineraryDay(
              day: idx + 1,
              title: parts[0].trim(),
              detail: parts.sublist(1).join(':').trim(),
            );
          }
          return ItineraryDay(
            day: idx + 1,
            title: 'Ngày ${idx + 1}',
            detail: line,
          );
        }).toList();
      }
    }

    // 5. Fallback cuối cùng từ MoTaChiTiet
    final mota = (rawMoTa ?? '').trim();
    if (mota.isNotEmpty) {
      return [
        ItineraryDay(
          day: 1,
          title: 'Hành trình trọn gói',
          detail: mota,
        ),
      ];
    }

    return const [];
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is num) return value.toInt();
    final str = value.toString();
    final asDouble = double.tryParse(str);
    return asDouble?.toInt() ?? 0;
  }
}
