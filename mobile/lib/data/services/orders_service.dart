import '../../core/constants/api_config.dart';
import '../../core/network/api_client.dart';
import '../models/customer_booking_model.dart';

class OrdersService {
  OrdersService({ApiClient? apiClient}) : _api = apiClient ?? ApiClient();

  final ApiClient _api;

  Future<List<CustomerBookingModel>> getMyBookings() async {
    final response = await _api.getJson(ApiConfig.myBookings);
    if (response is! List<dynamic>) {
      throw const ApiClientException(
        statusCode: 502,
        message: 'Danh sách đơn hàng từ máy chủ không hợp lệ.',
      );
    }
    return response
        .map(
          (entry) =>
              CustomerBookingModel.fromJson(entry as Map<String, dynamic>),
        )
        .toList();
  }

  Future<void> cancelBooking(int bookingId, {String? reason}) async {
    await _api.postJson(
      ApiConfig.bookingCancel(bookingId),
      body: {
        'lyDoHuy': reason ?? 'Khách hàng hủy đơn trực tuyến trên ứng dụng',
      },
    );
  }

  Future<void> requestCashPayment(int bookingId, {String? note}) async {
    await _api.postJson(
      ApiConfig.bookingRequestCash(bookingId),
      authenticated: false,
      body: {if (note != null && note.isNotEmpty) 'ghiChu': note},
    );
  }

  Future<void> submitReview(
    int bookingId, {
    required int stars,
    required String comment,
  }) async {
    await _api.postJson(
      ApiConfig.bookingReview(bookingId),
      body: {
        'soSao': stars,
        if (comment.trim().isNotEmpty) 'binhLuan': comment.trim(),
      },
    );
  }

  Future<Map<String, dynamic>> getTicket(String bookingCode) async {
    final response = await _api.getJson(
      ApiConfig.ticketByOrderCode(bookingCode),
      authenticated: false,
    );
    if (response is! Map<String, dynamic>) {
      throw const ApiClientException(
        statusCode: 502,
        message: 'Thông tin vé điện tử từ máy chủ không hợp lệ.',
      );
    }
    return response;
  }

  Future<Map<String, dynamic>> checkInByQr(String qrContent) async {
    final response = await _api.postJson(
      ApiConfig.checkInByQr,
      authenticated: false,
      body: {'qrContent': qrContent},
    );
    if (response is Map<String, dynamic>) return response;
    return <String, dynamic>{};
  }

  Future<void> saveQrToServer(Map<String, dynamic> payload) async {
    try {
      await _api.postJson(
        ApiConfig.savedQr,
        authenticated: false,
        body: payload,
      );
    } catch (_) {
      // Ignore if offline
    }
  }

  Future<List<Map<String, dynamic>>> getSavedQrFromServer() async {
    try {
      final res = await _api.getJson(
        ApiConfig.savedQrList,
        authenticated: false,
      );
      if (res is List) {
        return res.whereType<Map<String, dynamic>>().toList();
      }
    } catch (_) {
      // Ignore
    }
    return [];
  }
}
