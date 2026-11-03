import 'package:http/http.dart' as http;
import '../models/tour_model.dart';
import '../../core/constants/api_config.dart';
import '../../core/network/api_client.dart';

class TourService {
  TourService({http.Client? client}) : _api = ApiClient(client: client);

  final ApiClient _api;

  Future<List<TourModel>> fetchTours({
    String? search,
    String? diemDen,
    String? trangThai,
  }) async {
    final uri = Uri.parse(ApiConfig.tours).replace(
      queryParameters: {
        if (search != null && search.isNotEmpty) 'search': search,
        if (diemDen != null && diemDen.isNotEmpty) 'diemDen': diemDen,
        'trangThai': ?trangThai,
      },
    );

    try {
      final response = await _api.getJson(uri.toString(), authenticated: false);
      if (response is! List<dynamic>) {
        throw const ApiException(
          statusCode: 502,
          message: 'Danh sách tour từ máy chủ không hợp lệ.',
        );
      }
      return response
          .map((e) => TourModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on ApiClientException catch (error) {
      throw ApiException(statusCode: error.statusCode, message: error.message);
    }
  }

  Future<TourModel> fetchTourById(int id) async {
    try {
      final response = await _api.getJson(
        ApiConfig.tourById(id),
        authenticated: false,
      );
      if (response is! Map<String, dynamic>) {
        throw const ApiException(
          statusCode: 502,
          message: 'Thông tin tour từ máy chủ không hợp lệ.',
        );
      }
      return TourModel.fromJson(response);
    } on ApiClientException catch (error) {
      throw ApiException(statusCode: error.statusCode, message: error.message);
    }
  }
}

class ApiException implements Exception {
  const ApiException({required this.statusCode, required this.message});
  final int statusCode;
  final String message;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
