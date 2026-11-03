import '../../core/constants/api_config.dart';
import '../../core/network/api_client.dart';

class BookingService {
  BookingService({ApiClient? apiClient}) : _api = apiClient ?? ApiClient();

  final ApiClient _api;

  Future<Map<String, dynamic>> createBooking({
    required int departureId,
    required int adults,
    required int children,
    required String contactName,
    required String contactEmail,
    required String contactPhone,
    List<Map<String, dynamic>>? hanhKhach,
    String? voucherCode,
    String? note,
  }) async {
    final result = await _api.postJson(
      ApiConfig.customerBooking,
      body: {
        'lichId': departureId,
        'soLuongNguoiLon': adults,
        'soLuongTreEm': children,
        'contactName': contactName,
        'contactEmail': contactEmail,
        'contactPhone': contactPhone,
        if (hanhKhach != null && hanhKhach.isNotEmpty) 'hanhKhach': hanhKhach,
        if (voucherCode != null && voucherCode.isNotEmpty)
          'maKhuyenMai': voucherCode,
        if (note != null && note.trim().isNotEmpty) 'ghiChu': note.trim(),
      },
    );
    if (result is! Map<String, dynamic> ||
        result['DonHangID'] is! num ||
        result['MaDon'] is! String) {
      throw const ApiClientException(
        statusCode: 502,
        message: 'Máy chủ chưa trả về mã đơn đặt tour hợp lệ.',
      );
    }
    return result;
  }

  Future<Map<String, dynamic>> validateVoucher({
    required String code,
    required int departureId,
    required int adults,
    required int children,
  }) async {
    final response = await _api.postJson(
      ApiConfig.validateVoucher,
      body: {
        'maKhuyenMai': code,
        'lichId': departureId,
        'soLuongNguoiLon': adults,
        'soLuongTreEm': children,
      },
    );
    if (response is! Map<String, dynamic> ||
        response['valid'] != true ||
        response['giamGia'] is! num ||
        response['tongTienSauGiam'] is! num) {
      throw const ApiClientException(
        statusCode: 502,
        message: 'Máy chủ chưa trả về kết quả mã ưu đãi hợp lệ.',
      );
    }
    return response;
  }
}
