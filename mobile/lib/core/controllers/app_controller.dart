import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sizer/sizer.dart';

import '../constants/api_config.dart';
import '../network/api_client.dart';
import '../network/auth_session.dart';
import '../theme/app_colors.dart';
import '../utils/responsive.dart';
import '../../data/mock/mock_data.dart';
import '../../data/models/tour_model.dart';
import '../../data/services/payment_service.dart';
import '../../modules/home/home_controller.dart';
import '../../modules/orders/orders_controller.dart';
import '../../modules/orders/ticket_controller.dart';
import '../../modules/profile/profile_controller.dart';

class AppController extends GetxController {
  final selectedTab = 0.obs;

  final favoriteIds = <String>[].obs;
  final Map<String, bool> _pendingFavoriteChanges = {};
  final Completer<void> _favoritesReady = Completer<void>();
  final Completer<void> _initialPaymentLinkReady = Completer<void>();
  Future<void> _favoriteWrites = Future<void>.value();
  Uri? _initialPaymentLink;
  static const _favoriteStorageKey = 'viettour_favorite_tour_ids';
  static const _localeStorageKey = 'viettour_app_locale';
  final currentLocale = const Locale('vi', 'VN').obs;

  final currentUser = Rxn<Map<String, dynamic>>();
  final savedAccounts = <Map<String, dynamic>>[].obs;
  final switchingAccount = false.obs;

  String get displayName {
    final user = currentUser.value;
    if (user == null) return 'Khách hàng';
    return (user['name'] ?? user['hoTen'] ?? user['email'] ?? 'Khách hàng')
        .toString();
  }

  String get currentEmail {
    final user = currentUser.value;
    return (user?['email'] ?? '').toString();
  }

  String get currentRoleLabel {
    final user = currentUser.value;
    if (user == null) return 'Khách hàng';
    final primaryRole = (user['primaryRole'] ?? '').toString();
    final roles = (user['roles'] as List<dynamic>? ?? const [])
        .map((e) => e.toString())
        .toList();
    if (primaryRole == 'HDV' || roles.contains('HDV')) {
      return 'Hướng dẫn viên';
    }
    if (primaryRole == 'Admin' || roles.contains('Admin')) {
      return 'Admin';
    }
    if (primaryRole == 'Dieu hanh' || roles.contains('Dieu hanh')) {
      return 'Điều hành';
    }
    if (primaryRole == 'Ke toan' || roles.contains('Ke toan')) {
      return 'Kế toán';
    }
    return 'Khách hàng';
  }

  bool get isGuideOrStaff {
    final user = currentUser.value;
    if (user == null) return false;
    final roles = (user['roles'] as List<dynamic>? ?? const [])
        .map((e) => e.toString())
        .toList();
    final primaryRole = user['primaryRole']?.toString() ?? '';
    return roles.any(
          (r) => ['HDV', 'Huong dan vien', 'Admin', 'Dieu hanh'].contains(r),
        ) ||
        ['HDV', 'Huong dan vien', 'Admin', 'Dieu hanh'].contains(primaryRole) ||
        user['employeeId'] != null;
  }

  String get userInitials {
    final name = displayName.trim();
    if (name.isEmpty) return 'VT';
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase();
  }

  final searchQuery = ''.obs;
  final departureDate = Rxn<DateTime>();
  final guestCount = 2.obs;

  @override
  void onInit() {
    super.onInit();
    unawaited(_restoreLocale());
    unawaited(_restoreFavorites());
    unawaited(_captureInitialPaymentLink());
    unawaited(refreshSavedAccounts());
  }

  Future<void> _restoreLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_localeStorageKey);
      if (saved != null && saved.contains('_')) {
        final parts = saved.split('_');
        final loc = Locale(parts[0], parts[1]);
        currentLocale.value = loc;
        await Get.updateLocale(loc);
      }
    } catch (_) {}
  }

  Future<void> setLocale(String langCode, String countryCode) async {
    final newLocale = Locale(langCode, countryCode);
    currentLocale.value = newLocale;
    await Get.updateLocale(newLocale);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_localeStorageKey, '${langCode}_$countryCode');
    } catch (_) {}
  }

  Future<void> refreshSavedAccounts() async {
    final local = await AuthSession.instance.getSavedAccounts();
    savedAccounts.assignAll(local);
  }

  /// Chuyển đổi tài khoản đã lưu nhanh 1 chạm (Khách hàng ⇄ Hướng dẫn viên ⇄ Admin)
  Future<bool> switchToAccount(String email) async {
    if (switchingAccount.value) return false;
    final targetEmail = email.trim();
    if (targetEmail.isEmpty) return false;
    switchingAccount.value = true;
    try {
      final api = ApiClient();
      final res = await api.postJson(
        ApiConfig.quickSwitch,
        authenticated: false,
        body: {'email': targetEmail},
      );
      if (res is! Map<String, dynamic> || res['user'] is! Map<String, dynamic>) {
        throw const ApiClientException(
          statusCode: 500,
          message: 'Không nhận được thông tin phiên tài khoản.',
        );
      }
      final user = res['user'] as Map<String, dynamic>;
      final token = (res['accessToken'] ?? res['token'] ?? '').toString();
      final refresh = (res['refreshToken'] ?? token).toString();
      await AuthSession.instance.save(
        accessToken: token,
        refreshToken: refresh,
        user: user,
      );
      currentUser.value = user;
      await refreshSavedAccounts();

      // Tự động làm mới dữ liệu ở màn hình hiện tại (Đơn của tôi, Vé điện tử, Hồ sơ)
      if (Get.isRegistered<OrdersController>()) {
        unawaited(Get.find<OrdersController>().loadOrders());
      }
      if (Get.isRegistered<TicketController>()) {
        unawaited(Get.find<TicketController>().loadTicket());
      }
      if (Get.isRegistered<ProfileController>()) {
        unawaited(Get.find<ProfileController>().loadProfile());
      }

      Get.snackbar(
        'Đã chuyển tài khoản',
        'Đang sử dụng: ${user['name'] ?? targetEmail} ($currentRoleLabel)',
        backgroundColor: const Color(0xFF0F172A),
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(14),
        duration: const Duration(seconds: 2),
      );
      return true;
    } on ApiClientException catch (error) {
      Get.snackbar(
        'Không thể chuyển tài khoản',
        error.message,
        backgroundColor: const Color(0xFFBE123C),
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
      );
      return false;
    } catch (_) {
      Get.snackbar(
        'Không thể chuyển tài khoản',
        'Vui lòng kiểm tra kết nối máy chủ.',
        backgroundColor: const Color(0xFFBE123C),
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
      );
      return false;
    } finally {
      switchingAccount.value = false;
    }
  }

  /// Mở hộp thoại chuyển đổi nhanh tài khoản đã lưu ở bất kỳ màn hình nào
  Future<void> showAccountSwitcherSheet(BuildContext context) async {
    await refreshSavedAccounts();
    if (!context.mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(Responsive.radius(18)),
        ),
      ),
      builder: (sheetCtx) => SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(5.w, 1.8.h, 5.w, 3.h),
          child: Obx(() {
            final accounts = savedAccounts;
            final activeEmail = currentEmail.toLowerCase();
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 12.w,
                    height: 0.5.h,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
                ),
                SizedBox(height: 1.6.h),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Chuyển đổi tài khoản đã lưu',
                            style: TextStyle(
                              fontSize: Responsive.font(15),
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          SizedBox(height: 0.3.h),
                          Text(
                            'Chạm vào tài khoản để chuyển nhanh giữa Khách hàng và Hướng dẫn viên',
                            style: TextStyle(
                              fontSize: Responsive.font(9.5),
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(sheetCtx).pop(),
                      icon: const Icon(Icons.close_rounded, size: 20),
                    ),
                  ],
                ),
                const Divider(height: 20),
                ConstrainedBox(
                  constraints: BoxConstraints(maxHeight: 52.h),
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: accounts.length,
                    separatorBuilder: (_, _) => SizedBox(height: 1.h),
                    itemBuilder: (_, idx) {
                      final acc = accounts[idx];
                      final email = (acc['email'] ?? '').toString();
                      final name = (acc['name'] ?? email).toString();
                      final primaryRole =
                          (acc['primaryRole'] ?? 'Khach hang').toString();
                      final roleLabel =
                          (acc['roleLabel'] ?? primaryRole).toString();
                      final isCurrent = email.toLowerCase() == activeEmail;
                      final isHdv =
                          primaryRole == 'HDV' ||
                          primaryRole == 'Huong dan vien';
                      final isAdmin =
                          primaryRole == 'Admin' || primaryRole == 'Dieu hanh';

                      return InkWell(
                        borderRadius: BorderRadius.circular(10),
                        onTap: switchingAccount.value
                            ? null
                            : () async {
                                Navigator.of(sheetCtx).pop();
                                if (!isCurrent) {
                                  await switchToAccount(email);
                                }
                              },
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 3.5.w,
                            vertical: 1.2.h,
                          ),
                          decoration: BoxDecoration(
                            color: isCurrent
                                ? const Color(0xFFF0FDF4)
                                : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isCurrent
                                  ? const Color(0xFF15803D)
                                  : const Color(0xFFE2E8F0),
                              width: isCurrent ? 1.5 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 10.w,
                                height: 10.w,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: isHdv
                                      ? const Color(0xFF0F172A)
                                      : isAdmin
                                      ? const Color(0xFF1E3A8A)
                                      : const Color(0xFF0284C7),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  isHdv
                                      ? Icons.badge_outlined
                                      : isAdmin
                                      ? Icons.admin_panel_settings_outlined
                                      : Icons.person_outline_rounded,
                                  color: Colors.white,
                                  size: 18,
                                ),
                              ),
                              SizedBox(width: 3.w),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Flexible(
                                          child: Text(
                                            name,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(
                                              fontSize: Responsive.font(11.5),
                                              fontWeight: FontWeight.w800,
                                              color: const Color(0xFF0F172A),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 6,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: isHdv
                                                ? const Color(0xFFFEF3C7)
                                                : isAdmin
                                                ? const Color(0xFFE0E7FF)
                                                : const Color(0xFFE0F2FE),
                                            borderRadius: BorderRadius.circular(
                                              4,
                                            ),
                                          ),
                                          child: Text(
                                            roleLabel,
                                            style: TextStyle(
                                              fontSize: Responsive.font(8.5),
                                              fontWeight: FontWeight.w700,
                                              color: isHdv
                                                  ? const Color(0xFF92400E)
                                                  : isAdmin
                                                  ? const Color(0xFF1E40AF)
                                                  : const Color(0xFF0369A1),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: 0.3.h),
                                    Text(
                                      email,
                                      style: TextStyle(
                                        fontSize: Responsive.font(9.5),
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (isCurrent)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF15803D),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'Đang dùng',
                                    style: TextStyle(
                                      fontSize: Responsive.font(8.5),
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),
                                )
                              else
                                Text(
                                  'Chuyển →',
                                  style: TextStyle(
                                    fontSize: Responsive.font(10),
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            );
          }),
        ),
      ),
    );
  }

  Future<void> _captureInitialPaymentLink() async {
    try {
      _initialPaymentLink = await AppLinks().getInitialLink();
    } catch (_) {
      // Ignore deep link error
    } finally {
      if (!_initialPaymentLinkReady.isCompleted) {
        _initialPaymentLinkReady.complete();
      }
    }
  }

  Future<void> processInitialPaymentReturn() async {
    await _initialPaymentLinkReady.future;
    final uri = _initialPaymentLink;
    _initialPaymentLink = null;
    if (uri == null ||
        uri.scheme != 'viettour' ||
        uri.host != 'payment-result') {
      return;
    }
    final bookingId = int.tryParse(uri.queryParameters['donHangId'] ?? '');
    if (bookingId == null) return;
    try {
      final status = await PaymentService().getPaymentStatus(bookingId);
      Get.snackbar(
        status['trangThaiDon'] == 'Da thanh toan'
            ? 'Thanh toán thành công'
            : 'Thanh toán chưa hoàn tất',
        status['trangThaiDon'] == 'Da thanh toan'
            ? 'Đơn ${status['donHangId']} đã được xác nhận từ máy chủ.'
            : 'Đơn vẫn chưa được ghi nhận thanh toán.',
      );
    } on ApiClientException catch (error) {
      Get.snackbar('Không kiểm tra được thanh toán', error.message);
    }
  }

  List<TourModel> get favorites {
    List<TourModel> source;
    try {
      source = Get.find<HomeController>().allTours;
    } catch (_) {
      source = MockData.tours;
    }
    if (source.isEmpty) source = MockData.tours;
    return source.where((tour) => favoriteIds.contains(tour.id)).toList();
  }

  bool isFavorite(String tourId) => favoriteIds.contains(tourId);

  void toggleFavorite(TourModel tour) {
    final shouldAdd = !favoriteIds.contains(tour.id);
    if (shouldAdd) {
      favoriteIds.add(tour.id);
      Get.snackbar(
        'Đã thêm vào yêu thích ❤️',
        tour.title,
        backgroundColor: const Color(0xFF0F172A),
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(14),
        duration: const Duration(seconds: 2),
      );
    } else {
      favoriteIds.remove(tour.id);
      Get.snackbar(
        'Đã bỏ yêu thích',
        tour.title,
        backgroundColor: const Color(0xFF475569),
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(14),
        duration: const Duration(seconds: 2),
      );
    }
    if (!_favoritesReady.isCompleted) {
      _pendingFavoriteChanges[tour.id] = shouldAdd;
      return;
    }
    unawaited(_queueFavoritePersistence());
  }

  Future<void> _restoreFavorites() async {
    var restored = false;
    try {
      final preferences = await SharedPreferences.getInstance();
      favoriteIds.assignAll(
        preferences.getStringList(_favoriteStorageKey) ?? const [],
      );
      restored = true;
    } catch (_) {
      // Ignore
    } finally {
      final pendingChanges = Map<String, bool>.from(_pendingFavoriteChanges);
      for (final entry in pendingChanges.entries) {
        if (entry.value) {
          if (!favoriteIds.contains(entry.key)) favoriteIds.add(entry.key);
        } else {
          favoriteIds.remove(entry.key);
        }
      }
      _pendingFavoriteChanges.clear();
      if (!_favoritesReady.isCompleted) {
        _favoritesReady.complete();
      }
      if (restored || pendingChanges.isNotEmpty) {
        await _queueFavoritePersistence();
      }
    }
  }

  Future<void> _queueFavoritePersistence() {
    _favoriteWrites = _favoriteWrites.then((_) => _persistFavorites());
    return _favoriteWrites;
  }

  Future<void> _persistFavorites() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.setStringList(
        _favoriteStorageKey,
        favoriteIds.toList(),
      );
    } catch (_) {
      // Ignore
    }
  }
}

class AppBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(AppController(), permanent: true);
  }
}
