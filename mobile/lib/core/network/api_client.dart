import 'dart:async';
import 'dart:convert';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;

import '../constants/api_config.dart';
import '../constants/app_routes.dart';
import '../controllers/app_controller.dart';
import 'auth_session.dart';

class ApiClientException implements Exception {
  const ApiClientException({required this.statusCode, required this.message});

  final int statusCode;
  final String message;

  @override
  String toString() => 'ApiClientException($statusCode): $message';
}

class ApiClient {
  ApiClient({http.Client? client, AuthSession? session})
    : _client = client ?? _sharedClient,
      _session = session ?? AuthSession.instance;

  static final http.Client _sharedClient = http.Client();

  final http.Client _client;
  final AuthSession _session;
  static const _timeout = Duration(seconds: 8);

  Future<dynamic> getJson(String url, {bool authenticated = true}) =>
      requestJson('GET', url, authenticated: authenticated);

  Future<dynamic> postJson(
    String url, {
    Object? body,
    bool authenticated = true,
  }) => requestJson('POST', url, body: body, authenticated: authenticated);

  Future<dynamic> patchJson(
    String url, {
    Object? body,
    bool authenticated = true,
  }) => requestJson('PATCH', url, body: body, authenticated: authenticated);

  Future<dynamic> requestJson(
    String method,
    String url, {
    Object? body,
    bool authenticated = true,
  }) async {
    final uri = Uri.parse(url);
    var response = await _send(
      method,
      uri,
      body: body,
      authenticated: authenticated,
    );

    if (response.statusCode == 401 && authenticated) {
      if (await _refreshSession()) {
        response = await _send(method, uri, body: body, authenticated: true);
      } else {
        await _expireSession();
      }
      if (response.statusCode == 401) await _expireSession();
    }

    final decoded = _decode(response);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = decoded is Map<String, dynamic>
          ? decoded['message']
          : null;
      throw ApiClientException(
        statusCode: response.statusCode,
        message: message is List
            ? message.join(', ')
            : message?.toString() ?? 'Máy chủ trả về lỗi ${response.statusCode}.',
      );
    }
    return decoded;
  }

  Future<http.Response> _send(
    String method,
    Uri uri, {
    Object? body,
    required bool authenticated,
  }) async {
    final request = http.Request(method, uri);
    request.headers['Accept'] = 'application/json';
    if (body != null) {
      request.headers['Content-Type'] = 'application/json; charset=utf-8';
      request.body = jsonEncode(body);
    }
    if (authenticated) {
      final token = await _session.accessToken;
      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }
    }
    try {
      final streamed = await _client.send(request).timeout(_timeout);
      return await http.Response.fromStream(streamed).timeout(_timeout);
    } on TimeoutException {
      throw const ApiClientException(
        statusCode: 0,
        message: 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.',
      );
    } on http.ClientException {
      throw const ApiClientException(
        statusCode: 0,
        message: 'Không thể kết nối máy chủ. Kiểm tra mạng và địa chỉ API.',
      );
    } catch (_) {
      throw const ApiClientException(
        statusCode: 0,
        message: 'Không thể kết nối tới máy chủ.',
      );
    }
  }

  dynamic _decode(http.Response response) {
    if (response.bodyBytes.isEmpty) return null;
    try {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } on FormatException {
      throw const ApiClientException(
        statusCode: 502,
        message: 'Phản hồi từ máy chủ không đúng định dạng.',
      );
    }
  }

  Future<bool> _refreshSession() async {
    final refreshToken = await _session.refreshToken;
    if (refreshToken == null || refreshToken.isEmpty) return false;
    try {
      final response = await _send(
        'POST',
        Uri.parse(ApiConfig.refresh),
        body: {'refreshToken': refreshToken},
        authenticated: false,
      );
      final decoded = _decode(response);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        if (response.statusCode == 401 || response.statusCode == 403) {
          await _expireSession();
          return false;
        }
        return false;
      }
      if (decoded is! Map<String, dynamic> ||
          decoded['accessToken'] is! String ||
          decoded['refreshToken'] is! String) {
        return false;
      }
      final existingUser = await _session.readUser() ?? <String, dynamic>{};
      final user = (decoded['user'] is Map<String, dynamic>)
          ? decoded['user'] as Map<String, dynamic>
          : existingUser;
      await _session.save(
        accessToken: decoded['accessToken'] as String,
        refreshToken: decoded['refreshToken'] as String,
        user: user,
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> _expireSession() async {
    await _session.clear();
    if (Get.isRegistered<AppController>()) {
      Get.find<AppController>().currentUser.value = null;
      if (Get.currentRoute != AppRoutes.login &&
          Get.currentRoute != AppRoutes.splash) {
        Get.offAllNamed(AppRoutes.login);
      }
    }
  }
}
