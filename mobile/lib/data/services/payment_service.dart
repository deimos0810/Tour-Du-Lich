import '../../core/constants/api_config.dart';
import '../../core/network/api_client.dart';

class PaymentService {
  PaymentService({ApiClient? apiClient}) : _api = apiClient ?? ApiClient();

  final ApiClient _api;

  Future<Uri> createVnpayUrl(int bookingId) async {
    final response = await _api.postJson(
      ApiConfig.vnpayPaymentUrl(bookingId),
      body: {
        'returnUrl': '${ApiConfig.baseUrl}/vnpay/mobile-return',
      },
    );
    if (response is! Map<String, dynamic> ||
        response['paymentUrl'] is! String) {
      throw const ApiClientException(
        statusCode: 502,
        message: 'Máy chủ chưa trả về liên kết thanh toán hợp lệ.',
      );
    }
    final uri = Uri.tryParse(response['paymentUrl'] as String);
    if (uri == null || uri.scheme != 'https' || uri.host.isEmpty) {
      throw const ApiClientException(
        statusCode: 502,
        message: 'Liên kết thanh toán từ máy chủ không an toàn.',
      );
    }
    return uri;
  }

  Future<Map<String, dynamic>> getPaymentStatus(int bookingId) async {
    final response = await _api.getJson(
      ApiConfig.vnpayPaymentStatus(bookingId),
    );
    if (response is! Map<String, dynamic> ||
        response['donHangId'] is! num ||
        response['trangThaiDon'] is! String) {
      throw const ApiClientException(
        statusCode: 502,
        message: 'Trạng thái thanh toán từ máy chủ không hợp lệ.',
      );
    }
    return response;
  }
}
