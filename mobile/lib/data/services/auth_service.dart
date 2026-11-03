import 'package:http/http.dart' as http;

import '../../core/constants/api_config.dart';
import '../../core/network/api_client.dart';

class AuthService {
  AuthService({ApiClient? apiClient, http.Client? client})
    : _api = apiClient ?? ApiClient(client: client);

  final ApiClient _api;

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) => _mapResponse(
    _api.postJson(
      ApiConfig.login,
      authenticated: false,
      body: {'email': email, 'password': password},
    ),
  );

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String hoTen,
    required String phone,
    String? cccd,
  }) => _mapResponse(
    _api.postJson(
      ApiConfig.register,
      authenticated: false,
      body: {
        'email': email,
        'password': password,
        'hoTen': hoTen,
        'phone': phone,
        if (cccd != null && cccd.isNotEmpty) 'cccd': cccd,
      },
    ),
  );

  Future<Map<String, dynamic>> forgotPassword({required String email}) =>
      _mapResponse(
        _api.postJson(
          ApiConfig.forgotPassword,
          authenticated: false,
          body: {'email': email},
        ),
      );

  Future<Map<String, dynamic>> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) => _mapResponse(
    _api.postJson(
      ApiConfig.resetPassword,
      authenticated: false,
      body: {'email': email, 'otp': otp, 'newPassword': newPassword},
    ),
  );

  Future<Map<String, dynamic>> getProfile() =>
      _mapResponse(_api.getJson(ApiConfig.profile));

  Future<Map<String, dynamic>> getCurrentUser() =>
      _mapResponse(_api.getJson(ApiConfig.currentUser));

  Future<Map<String, dynamic>> updateProfile({
    required String hoTen,
    required String phone,
    required String email,
    String? ngaySinh,
  }) => _mapResponse(
    _api.patchJson(
      ApiConfig.profile,
      body: {
        'hoTen': hoTen,
        'phone': phone,
        'email': email,
        'ngaySinh': ?ngaySinh,
      },
    ),
  );

  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) => _mapResponse(
    _api.postJson(
      ApiConfig.changePassword,
      body: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
    ),
  );

  Future<void> logout() async {
    await _api.postJson(ApiConfig.logout);
  }

  Future<Map<String, dynamic>> _mapResponse(Future<dynamic> future) async {
    try {
      final response = await future;
      if (response is Map<String, dynamic>) return response;
      throw const ApiAuthException(
        statusCode: 502,
        message: 'Phản hồi từ máy chủ không hợp lệ.',
      );
    } on ApiClientException catch (error) {
      throw ApiAuthException(
        statusCode: error.statusCode,
        message: error.message,
      );
    }
  }
}

class ApiAuthException implements Exception {
  const ApiAuthException({required this.statusCode, required this.message});

  final int statusCode;
  final String message;

  @override
  String toString() => 'ApiAuthException($statusCode): $message';
}
