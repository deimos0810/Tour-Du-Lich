import 'package:flutter/foundation.dart';

abstract final class ApiConfig {
  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
  );

  static String get baseUrl {
    final configured = _configuredBaseUrl.trim();
    if (configured.isNotEmpty) {
      return configured.replaceFirst(RegExp(r'/+$'), '');
    }
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:4000/api';
    }
    return 'http://localhost:4000/api';
  }

  static String get tours => '$baseUrl/tours';
  static String tourById(int id) => '$tours/$id';
  static String get tourCategories => '$tours/categories';
  static String get departures => '$baseUrl/departures';

  static String get login => '$baseUrl/auth/login';
  static String get quickSwitch => '$baseUrl/auth/quick-switch';
  static String get quickAccounts => '$baseUrl/auth/quick-accounts';
  static String get register => '$baseUrl/auth/register';
  static String get refresh => '$baseUrl/auth/refresh';
  static String get logout => '$baseUrl/auth/logout';
  static String get currentUser => '$baseUrl/auth/me';
  static String get profile => '$baseUrl/auth/profile';
  static String get changePassword => '$baseUrl/auth/change-password';
  static String get forgotPassword => '$baseUrl/auth/forgot-password';
  static String get resetPassword => '$baseUrl/auth/reset-password';
  static String get customerBooking => '$baseUrl/auth/customer-booking';
  static String get myBookings => '$baseUrl/portal/my-bookings';

  static String get bookings => '$baseUrl/bookings';
  static String get validateVoucher => '$bookings/voucher/validate';
  static String bookingCancel(int bookingId) => '$bookings/$bookingId/cancel';
  static String bookingRequestCash(int bookingId) =>
      '$bookings/$bookingId/request-cash';
  static String bookingReview(int bookingId) => '$bookings/$bookingId/review';
  static String ticketByOrderCode(String code) =>
      '$bookings/ticket/${Uri.encodeComponent(code)}';
  static String get checkInByQr => '$bookings/checkin-by-qr';
  static String get savedQr => '$bookings/saved-qr';
  static String get savedQrList => '$bookings/saved-qr/list';
  static String vnpayPaymentUrl(int bookingId) =>
      '$baseUrl/vnpay/bookings/$bookingId/payment-url';

  // Endpoints dành cho Hướng dẫn viên (HDV)
  static String get guideMySchedule => '$baseUrl/guide/my-schedule';
  static String assignmentRespond(int id) => '$baseUrl/assignments/$id/respond';
  static String get guideCheckinQr => '$baseUrl/guide/checkin-qr';
  static String guideCheckinToggle(int paxId) =>
      '$baseUrl/guide/checkin-toggle/$paxId';

  /// Chuẩn hóa đường dẫn ảnh: tự động trỏ về origin backend tĩnh (10.0.2.2 trên Android Emulator, localhost trên Web)
  static String resolveImageUrl(String? rawUrl) {
    if (rawUrl == null || rawUrl.trim().isEmpty) return '';
    final url = rawUrl.trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android && url.contains('localhost:4000')) {
        return url.replaceFirst('localhost:4000', '10.0.2.2:4000');
      }
      return url;
    }
    final origin = baseUrl.replaceFirst(RegExp(r'/api/?$'), '');
    final cleanPath = url.startsWith('/') ? url : '/$url';
    return '$origin$cleanPath';
  }
  static String vnpayPaymentStatus(int bookingId) =>
      '$baseUrl/vnpay/bookings/$bookingId/status';
}
