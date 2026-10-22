import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Tự động nhận diện nền tảng:
  // - Android Emulator: 10.0.2.2:4000
  // - Web / Windows Desktop / iOS Simulator: localhost:4000
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:4000/api';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:4000/api';
    }
    return 'http://localhost:4000/api';
  }

  static Future<Map<String, String>> _headers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // 1. Đăng nhập
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final url = Uri.parse('$baseUrl/auth/login');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    final data = jsonDecode(utf8.decode(response.bodyBytes));
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final prefs = await SharedPreferences.getInstance();
      if (data['token'] != null) {
        await prefs.setString('auth_token', data['token']);
      }
      if (data['user'] != null) {
        await prefs.setString('user_data', jsonEncode(data['user']));
      }
      return data;
    } else {
      throw Exception(data['message'] ?? 'Đăng nhập không thành công');
    }
  }

  // 2. Đăng ký tài khoản
  static Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String hoTen,
    required String phone,
    String? cccd,
  }) async {
    final url = Uri.parse('$baseUrl/auth/register');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'hoTen': hoTen,
        'phone': phone,
        'cccd': cccd,
      }),
    );

    final data = jsonDecode(utf8.decode(response.bodyBytes));
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Đăng ký thất bại');
    }
  }

  // 3. Danh sách Tour du lịch
  static Future<List<dynamic>> getTours({String? search}) async {
    var uri = '$baseUrl/tours';
    if (search != null && search.isNotEmpty) {
      uri += '?search=${Uri.encodeComponent(search)}';
    }
    final response = await http.get(Uri.parse(uri));
    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    }
    throw Exception('Không thể tải danh sách tour');
  }

  // 4. Chi tiết Tour
  static Future<Map<String, dynamic>> getTourDetail(dynamic id) async {
    final response = await http.get(Uri.parse('$baseUrl/tours/$id'));
    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    }
    throw Exception('Không thể tải thông tin tour');
  }

  // 5. Đặt Tour
  static Future<Map<String, dynamic>> bookTour({
    required int khachHangId,
    required int lichId,
    required int soLuongNguoiLon,
    required int soLuongTreEm,
    String? ghiChu,
    String? maKhuyenMai,
    required List<Map<String, dynamic>> hanhKhach,
  }) async {
    final url = Uri.parse('$baseUrl/auth/customer-booking');
    final response = await http.post(
      url,
      headers: await _headers(),
      body: jsonEncode({
        'khachHangId': khachHangId,
        'lichId': lichId,
        'soLuongNguoiLon': soLuongNguoiLon,
        'soLuongTreEm': soLuongTreEm,
        'ghiChu': ghiChu,
        'maKhuyenMai': maKhuyenMai,
        'hanhKhach': hanhKhach,
      }),
    );

    final data = jsonDecode(utf8.decode(response.bodyBytes));
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }
    throw Exception(data['message'] ?? 'Đặt tour thất bại');
  }

  // 6. Đơn đặt tour của tôi
  static Future<List<dynamic>> getMyBookings(int customerId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/portal/my-bookings?customerId=$customerId'),
      headers: await _headers(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    }
    return [];
  }

  // 7. Hủy đơn đặt tour
  static Future<Map<String, dynamic>> cancelBooking(int donHangId, String lyDoHuy) async {
    final response = await http.post(
      Uri.parse('$baseUrl/portal/bookings/$donHangId/cancel'),
      headers: await _headers(),
      body: jsonEncode({'lyDoHuy': lyDoHuy}),
    );
    final data = jsonDecode(utf8.decode(response.bodyBytes));
    if (response.statusCode == 200 || response.statusCode == 201) {
      return data;
    }
    throw Exception(data['message'] ?? 'Không thể hủy đơn');
  }

  // 8. Đánh giá tour
  static Future<Map<String, dynamic>> submitReview({
    required int donHangId,
    required int tourId,
    required int soSao,
    required String binhLuan,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/portal/reviews'),
      headers: await _headers(),
      body: jsonEncode({
        'donHangId': donHangId,
        'tourId': tourId,
        'soSao': soSao,
        'binhLuan': binhLuan,
      }),
    );
    final data = jsonDecode(utf8.decode(response.bodyBytes));
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }
    throw Exception(data['message'] ?? 'Không thể gửi đánh giá');
  }

  // 9. Lịch dẫn đoàn cho Hướng Dẫn Viên
  static Future<List<dynamic>> getGuideSchedule(int taiKhoanId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/guide/my-schedule?taiKhoanId=$taiKhoanId'),
      headers: await _headers(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    }
    return [];
  }

  // 10. Điểm danh / Soát vé QR cho Hướng Dẫn Viên
  static Future<Map<String, dynamic>> checkinQR({
    String? maDon,
    String? maQRVe,
    int? taiKhoanId,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/guide/checkin-qr'),
      headers: await _headers(),
      body: jsonEncode({
        'maDon': maDon,
        'maQRVe': maQRVe,
        'taiKhoanId': taiKhoanId,
      }),
    );
    final data = jsonDecode(utf8.decode(response.bodyBytes));
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }
    throw Exception(data['message'] ?? 'Điểm danh không thành công');
  }
}
