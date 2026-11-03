import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class AuthSession {
  AuthSession._();

  static final AuthSession instance = AuthSession._();

  static const _accessTokenKey = 'viettour_access_token_v2';
  static const _refreshTokenKey = 'viettour_refresh_token_v2';
  static const _userKey = 'viettour_user_v2';
  static const _savedAccountsKey = 'viettour_saved_accounts_v2';
  static const _savedQrTicketsKey = 'viettour_saved_qr_tickets_v2';

  String? _cachedAccessToken;
  String? _cachedRefreshToken;
  Map<String, dynamic>? _cachedUser;
  bool _initialized = false;

  /// Danh sách tài khoản nghiệp vụ mặc định luôn sẵn sàng để chuyển nhanh 1 chạm
  static const List<Map<String, dynamic>> defaultPresetAccounts = [
    {
      'email': 'luongviendong1152011@gmail.com',
      'name': 'Lương Viễn Đông',
      'primaryRole': 'Khach hang',
      'roleLabel': 'Khách hàng',
    },
    {
      'email': 'hdv.nam@viettour.vn',
      'name': 'Lê Hoàng Nam (HDV)',
      'primaryRole': 'HDV',
      'roleLabel': 'Hướng dẫn viên',
    },
    {
      'email': 'khach.hung@gmail.com',
      'name': 'Nguyễn Văn Hùng',
      'primaryRole': 'Khach hang',
      'roleLabel': 'Khách hàng',
    },
    {
      'email': 'admin@viettour.vn',
      'name': 'Quản trị viên Admin',
      'primaryRole': 'Admin',
      'roleLabel': 'Admin hệ thống',
    },
    {
      'email': 'dieuhanh@viettour.vn',
      'name': 'Phạm Thu Hà (Điều hành)',
      'primaryRole': 'Dieu hanh',
      'roleLabel': 'Nhân viên Điều hành',
    },
  ];

  Future<void> _ensureInitialized() async {
    if (_initialized) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      _cachedAccessToken = prefs.getString(_accessTokenKey);
      _cachedRefreshToken = prefs.getString(_refreshTokenKey);
      final encodedUser = prefs.getString(_userKey);
      if (encodedUser != null && encodedUser.isNotEmpty) {
        final decoded = jsonDecode(encodedUser);
        if (decoded is Map<String, dynamic>) {
          _cachedUser = decoded;
        }
      }
    } catch (_) {
      // Ignore storage error and keep in-memory state
    } finally {
      _initialized = true;
    }
  }

  Future<String?> get accessToken async {
    await _ensureInitialized();
    return _cachedAccessToken;
  }

  Future<String?> get refreshToken async {
    await _ensureInitialized();
    return _cachedRefreshToken;
  }

  Future<Map<String, dynamic>?> readUser() async {
    await _ensureInitialized();
    return _cachedUser;
  }

  Future<void> save({
    required String accessToken,
    required String refreshToken,
    required Map<String, dynamic> user,
  }) async {
    _initialized = true;
    _cachedAccessToken = accessToken;
    _cachedRefreshToken = refreshToken;
    _cachedUser = Map<String, dynamic>.from(user);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_accessTokenKey, accessToken);
      await prefs.setString(_refreshTokenKey, refreshToken);
      await prefs.setString(_userKey, jsonEncode(user));
      await _saveAccountToHistory(
        prefs,
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: user,
      );
    } catch (_) {
      // Ignore persistence error
    }
  }

  Future<void> saveUser(Map<String, dynamic> user) async {
    _initialized = true;
    _cachedUser = Map<String, dynamic>.from(user);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_userKey, jsonEncode(user));
    } catch (_) {
      // Ignore
    }
  }

  Future<void> clear() async {
    _initialized = true;
    _cachedAccessToken = null;
    _cachedRefreshToken = null;
    _cachedUser = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_accessTokenKey);
      await prefs.remove(_refreshTokenKey);
      await prefs.remove(_userKey);
    } catch (_) {
      // Ignore
    }
  }

  Future<void> _saveAccountToHistory(
    SharedPreferences prefs, {
    required String accessToken,
    required String refreshToken,
    required Map<String, dynamic> user,
  }) async {
    final email = (user['email'] ?? '').toString().trim();
    if (email.isEmpty) return;
    final list = await getSavedAccounts();
    final primaryRole = (user['primaryRole'] ?? 'Khach hang').toString();
    final entry = <String, dynamic>{
      'email': email,
      'name': (user['name'] ?? user['hoTen'] ?? email.split('@').first)
          .toString(),
      'primaryRole': primaryRole,
      'roleLabel': _roleLabel(primaryRole),
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'user': user,
      'updatedAt': DateTime.now().toIso8601String(),
    };
    final updated = <Map<String, dynamic>>[
      entry,
      ...list.where(
        (item) =>
            (item['email'] ?? '').toString().toLowerCase() !=
            email.toLowerCase(),
      ),
    ];
    await prefs.setString(_savedAccountsKey, jsonEncode(updated));
  }

  Future<List<Map<String, dynamic>>> getSavedAccounts() async {
    final result = <Map<String, dynamic>>[];
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_savedAccountsKey);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          for (final item in decoded) {
            if (item is Map<String, dynamic>) {
              result.add(item);
            }
          }
        }
      }
    } catch (_) {
      // Ignore
    }

    // Luôn bổ sung các tài khoản mặc định (Khách hàng, HDV, Admin) nếu chưa có trong danh sách
    for (final preset in defaultPresetAccounts) {
      final email = (preset['email'] ?? '').toString().toLowerCase();
      final exists = result.any(
        (item) => (item['email'] ?? '').toString().toLowerCase() == email,
      );
      if (!exists) {
        result.add(Map<String, dynamic>.from(preset));
      }
    }
    return result;
  }

  static String _roleLabel(String role) {
    switch (role) {
      case 'HDV':
      case 'Huong dan vien':
        return 'Hướng dẫn viên';
      case 'Admin':
        return 'Admin hệ thống';
      case 'Dieu hanh':
        return 'Nhân viên Điều hành';
      case 'Ke toan':
        return 'Nhân viên Kế toán';
      default:
        return 'Khách hàng';
    }
  }

  /// Lưu ảnh Vé QR đã chụp/tải về vào bộ nhớ thiết bị để Hướng dẫn viên có thể chọn và quét ngay
  Future<void> saveQrTicketLocal(Map<String, dynamic> qrTicket) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final current = await getSavedQrTicketsLocal();
      final id = '${qrTicket['maDon']}_${qrTicket['chiTietId']}';
      final entry = <String, dynamic>{
        ...qrTicket,
        'id': id,
        'savedAt': DateTime.now().toIso8601String(),
      };
      final updated = <Map<String, dynamic>>[
        entry,
        ...current.where((item) => item['id'] != id),
      ].take(20).toList();
      await prefs.setString(_savedQrTicketsKey, jsonEncode(updated));
    } catch (_) {
      // Ignore
    }
  }

  Future<List<Map<String, dynamic>>> getSavedQrTicketsLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_savedQrTicketsKey);
      if (raw == null || raw.isEmpty) return [];
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        return decoded.whereType<Map<String, dynamic>>().toList();
      }
    } catch (_) {
      // Ignore
    }
    return [];
  }
}
