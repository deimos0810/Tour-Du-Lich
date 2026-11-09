import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sizer/sizer.dart';

import '../constants/api_config.dart';
import '../constants/app_routes.dart';
import '../network/api_client.dart';
import '../network/auth_session.dart';
import '../theme/app_colors.dart';
import '../utils/formatters.dart';
import '../utils/responsive.dart';
import '../../data/mock/mock_data.dart';
import '../../data/models/customer_booking_model.dart';
import '../../data/models/tour_model.dart';
import '../../data/services/guide_service.dart';
import '../../data/services/orders_service.dart';
import '../../data/services/payment_service.dart';
import '../../modules/guide/guide_schedule_controller.dart';
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
  final notifications = <Map<String, dynamic>>[].obs;
  final loadingNotifications = false.obs;

  int get notificationCount => notifications.length;

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
    ever(currentUser, (_) => unawaited(loadNotifications()));
    Future.delayed(
      const Duration(milliseconds: 800),
      () => unawaited(loadNotifications()),
    );
  }

  /// Đưa ứng dụng về trạng thái sạch khi đăng nhập / đăng xuất
  /// (về tab Trang chủ, xóa thông báo của phiên cũ) để chuyển màn hình mượt.
  void resetSessionState() {
    selectedTab.value = 0;
    notifications.clear();
  }

  /// Chờ bottom sheet / dialog đóng hẳn (hết animation) rồi mới thực hiện
  /// hành động tiếp theo, tránh giật khung hình hoặc mở chồng màn hình.
  void runAfterSheetClosed(VoidCallback action) {
    Future<void>.delayed(const Duration(milliseconds: 260), action);
  }

  /// Mở màn hình Vé điện tử QR của một đơn hàng (dùng chung cho mọi nơi).
  void openTicketByCode(String code) {
    TicketController.pendingBookingCode = code;
    if (Get.isRegistered<TicketController>()) {
      Get.delete<TicketController>(force: true);
    }
    Get.toNamed(
      AppRoutes.ticket,
      arguments: code,
      parameters: {'code': code},
    );
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

      // Tự động làm mới dữ liệu ở màn hình hiện tại (Đơn của tôi, Vé điện tử, Hồ sơ, Lịch HDV)
      if (Get.isRegistered<OrdersController>()) {
        unawaited(Get.find<OrdersController>().loadOrders());
      }
      if (Get.isRegistered<TicketController>()) {
        unawaited(Get.find<TicketController>().loadTicket());
      }
      if (Get.isRegistered<ProfileController>()) {
        unawaited(Get.find<ProfileController>().loadProfile());
      }
      if (Get.isRegistered<GuideScheduleController>()) {
        unawaited(Get.find<GuideScheduleController>().loadSchedule());
      }
      unawaited(loadNotifications());

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

  // ===========================================================================
  // TRUNG TÂM THÔNG BÁO MOBILE: NHẮC LỊCH KHỞI HÀNH, ĐÁNH GIÁ & PHẢN HỒI SAU TOUR, HÓA ĐƠN
  // ===========================================================================
  Future<void> loadNotifications() async {
    if (loadingNotifications.value) return;
    loadingNotifications.value = true;
    try {
      final items = <Map<String, dynamic>>[];
      final ordersSvc = OrdersService();

      if (isGuideOrStaff) {
        try {
          final guideData = await GuideService().fetchMySchedule();
          for (final s in guideData.schedules) {
            if (s.isPending) {
              items.add({
                'id': 'HDV_PENDING_${s.dispatchId}',
                'loai': 'HDV_PHAN_CONG',
                'tieuDe': 'Phân công dẫn đoàn mới cần xác nhận',
                'noiDung':
                    'Mã lịch ${s.departureCode} • ${s.tourName}\nKhởi hành: ${Formatters.date(s.departureDate)} tại ${s.departurePoint}. Tổng khách: ${s.totalGuests} hành khách.',
                'thoiGian': s.departureDate,
                'schedule': s,
              });
            } else if (s.isConfirmed) {
              final days = s.departureDate.difference(DateTime.now()).inDays;
              items.add({
                'id': 'HDV_SCHED_${s.scheduleId}',
                'loai': 'HDV_NHAC_LICH',
                'tieuDe': days <= 0
                    ? 'Đoàn đang khởi hành: ${s.departureCode}'
                    : 'Nhắc lịch dẫn đoàn (Còn $days ngày)',
                'noiDung':
                    '${s.tourName}\nĐã điểm danh: ${s.checkedInGuests}/${s.totalGuests} khách • Dịch vụ đi kèm (Nhà xe/KS): ${s.attachedServices.length} phiếu.',
                'thoiGian': s.departureDate,
                'schedule': s,
              });
            }
          }
        } catch (_) {}
      }

      List<CustomerBookingModel> bookings = [];
      try {
        bookings = await ordersSvc.getMyBookings();
      } catch (_) {}

      final now = DateTime.now();
      for (final b in bookings) {
        final days = b.departureDate.difference(now).inDays;

        // 1. Thông báo nhắc lịch khởi hành (cho đơn chưa hủy, sắp khởi hành hoặc hôm nay khởi hành)
        if (b.status != 'Da huy' && days >= -1 && days <= 60) {
          final countdownText = days <= 0
              ? 'Hôm nay khởi hành!'
              : 'Còn $days ngày nữa khởi hành';
          items.add({
            'id': 'NHAC_LICH_${b.id}',
            'loai': 'NHAC_LICH',
            'tieuDe': 'Nhắc lịch khởi hành: $countdownText',
            'noiDung':
                'Đơn ${b.code} — ${b.tour.title}\nKhởi hành: ${Formatters.date(b.departureDate)} tại ${b.departurePoint}. Quý khách vui lòng mang CCCD và mở sẵn Vé điện tử QR để soát vé nhanh.',
            'maDon': b.code,
            'donHangId': b.id,
            'thoiGian': b.departureDate,
            'booking': b,
          });
        }

        // 2. Thông báo mời đánh giá & phản hồi sau khi kết thúc tour (hoặc đã hoàn tất thanh toán/điểm danh)
        if (b.canReview) {
          items.add({
            'id': 'DANH_GIA_${b.id}',
            'loai': 'DANH_GIA',
            'tieuDe': 'Đánh giá & Phản hồi sau chuyến đi',
            'noiDung':
                'Cảm ơn bạn đã tham gia tour "${b.tour.title}" (Đơn ${b.code}). Hãy chấm sao (1–5 ⭐) và gửi phản hồi về lịch trình, Hướng dẫn viên, nhà xe & khách sạn!',
            'maDon': b.code,
            'donHangId': b.id,
            'thoiGian': b.returnDate,
            'booking': b,
          });
        } else if (b.hasReviewed) {
          items.add({
            'id': 'DA_DANH_GIA_${b.id}',
            'loai': 'DA_DANH_GIA',
            'tieuDe':
                'Đã ghi nhận đánh giá ${b.reviewStars ?? 5} ⭐ — Đơn ${b.code}',
            'noiDung':
                '${b.tour.title}\nPhản hồi của bạn: "${(b.reviewComment ?? "Chuyến đi tuyệt vời, dịch vụ chu đáo!").trim()}"',
            'maDon': b.code,
            'donHangId': b.id,
            'thoiGian': b.reviewDate ?? b.returnDate,
            'booking': b,
          });
        }

        // 3. Thông báo Hóa đơn điện tử & Vé QR Code
        if (b.isPaid) {
          items.add({
            'id': 'HOA_DON_${b.id}',
            'loai': 'HOA_DON',
            'tieuDe': 'Hóa đơn ${b.invoiceCode} & Vé điện tử QR',
            'noiDung':
                'Đơn ${b.code} (${Formatters.currency(b.total)}) đã thanh toán qua ${b.paymentMethod}. Quý khách có thể lưu trữ hóa đơn và mã QR soát vé trên điện thoại.',
            'maDon': b.code,
            'donHangId': b.id,
            'thoiGian': b.bookingDate,
            'booking': b,
          });
        } else if (b.canPay) {
          items.add({
            'id': 'THANH_TOAN_${b.id}',
            'loai': 'THANH_TOAN',
            'tieuDe': 'Nhắc hoàn tất thanh toán đơn ${b.code}',
            'noiDung':
                '${b.tour.title} — Cần thanh toán ${Formatters.currency(b.amountDue)} qua VNPAY để hệ thống xuất Hóa đơn và Vé điện tử QR.',
            'maDon': b.code,
            'donHangId': b.id,
            'thoiGian': b.bookingDate,
            'booking': b,
          });
        } else if (b.status == 'Da huy') {
          items.add({
            'id': 'HUY_DON_${b.id}',
            'loai': 'HUY_DON',
            'tieuDe': 'Thông báo hủy đơn ${b.code}',
            'noiDung':
                '${b.tour.title}${b.note.isNotEmpty ? "\nChi tiết: ${b.note}" : ""}',
            'maDon': b.code,
            'donHangId': b.id,
            'thoiGian': b.bookingDate,
            'booking': b,
          });
        }
      }

      if (items.isEmpty) {
        items.add({
          'id': 'WELCOME_PROMO',
          'loai': 'KHUYEN_MAI',
          'tieuDe': 'Ưu đãi VietTour — Nhập mã VIETTOUR2026',
          'noiDung':
              'Nhận thông báo nhắc lịch khởi hành tự động, quản lý hóa đơn vé điện tử QR và gửi đánh giá phản hồi trực tiếp sau mỗi chuyến đi.',
          'thoiGian': DateTime.now(),
        });
      }

      notifications.assignAll(items);
    } finally {
      loadingNotifications.value = false;
    }
  }

  /// Nút Chuông thông báo có Badge đếm số lượng dùng chung cho HomeView, OrdersView, GuideScheduleView
  Widget buildNotificationBellButton(
    BuildContext context, {
    Color iconColor = const Color(0xFF0F172A),
  }) {
    return Obx(() {
      final count = notificationCount;
      return Stack(
        clipBehavior: Clip.none,
        children: [
          IconButton(
            tooltip: 'Thông báo nhắc lịch & Đánh giá tour',
            onPressed: () => showNotificationsSheet(context),
            icon: Icon(
              count > 0
                  ? Icons.notifications_active_outlined
                  : Icons.notifications_none_rounded,
              color: iconColor,
            ),
          ),
          if (count > 0)
            Positioned(
              right: 6,
              top: 6,
              child: IgnorePointer(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 5,
                    vertical: 1.5,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE11D48),
                    borderRadius: BorderRadius.circular(99),
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                  child: Text(
                    count > 9 ? '9+' : '$count',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ),
        ],
      );
    });
  }

  /// Mở Trung tâm Thông báo: Nhắc lịch khởi hành, Đánh giá & Phản hồi sau tour, Quản lý Hóa đơn
  Future<void> showNotificationsSheet(BuildContext context) async {
    unawaited(loadNotifications());
    if (!context.mounted) return;
    final selectedFilter = 'TAT_CA'.obs;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(Responsive.radius(20)),
        ),
      ),
      builder: (sheetCtx) => SafeArea(
        child: DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.78,
          minChildSize: 0.5,
          maxChildSize: 0.94,
          builder: (_, scrollController) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: EdgeInsets.fromLTRB(5.w, 1.5.h, 3.w, 0.8.h),
                child: Column(
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
                    SizedBox(height: 1.2.h),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.notifications_active_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                        SizedBox(width: 3.w),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Thông báo & Nhắc lịch VietTour',
                                style: TextStyle(
                                  fontSize: Responsive.font(14.5),
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              Text(
                                'Nhắc lịch khởi hành • Đánh giá & Phản hồi sau tour • Hóa đơn QR',
                                style: TextStyle(
                                  fontSize: Responsive.font(9),
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: loadNotifications,
                          icon: const Icon(Icons.refresh_rounded, size: 20),
                          tooltip: 'Làm mới thông báo',
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(sheetCtx).pop(),
                          icon: const Icon(Icons.close_rounded, size: 20),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Thanh lọc nhanh theo nhóm thông báo
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 0.6.h),
                child: Obx(() {
                  final filters = [
                    ('TAT_CA', 'Tất cả (${notifications.length})'),
                    ('NHAC_LICH', 'Nhắc khởi hành'),
                    ('DANH_GIA', 'Đánh giá & Phản hồi'),
                    ('HOA_DON', 'Hóa đơn & Vé QR'),
                  ];
                  return Row(
                    children: filters.map((f) {
                      final active = selectedFilter.value == f.$1;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(f.$2),
                          selected: active,
                          onSelected: (_) => selectedFilter.value = f.$1,
                          selectedColor: const Color(0xFF0F172A),
                          backgroundColor: const Color(0xFFF1F5F9),
                          labelStyle: TextStyle(
                            fontSize: Responsive.font(9.2),
                            fontWeight: FontWeight.w700,
                            color: active
                                ? Colors.white
                                : const Color(0xFF334155),
                          ),
                          showCheckmark: false,
                        ),
                      );
                    }).toList(),
                  );
                }),
              ),
              const Divider(height: 12),
              Expanded(
                child: Obx(() {
                  if (loadingNotifications.value && notifications.isEmpty) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  final filter = selectedFilter.value;
                  final list = notifications.where((n) {
                    if (filter == 'TAT_CA') return true;
                    final loai = (n['loai'] ?? '').toString();
                    if (filter == 'NHAC_LICH') {
                      return loai == 'NHAC_LICH' ||
                          loai == 'HDV_NHAC_LICH' ||
                          loai == 'HDV_PHAN_CONG';
                    }
                    if (filter == 'DANH_GIA') {
                      return loai == 'DANH_GIA' || loai == 'DA_DANH_GIA';
                    }
                    if (filter == 'HOA_DON') {
                      return loai == 'HOA_DON' ||
                          loai == 'THANH_TOAN' ||
                          loai == 'HUY_DON';
                    }
                    return true;
                  }).toList();

                  if (list.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: EdgeInsets.all(6.w),
                        child: Text(
                          'Chưa có thông báo nào trong mục này.',
                          style: TextStyle(
                            fontSize: Responsive.font(11),
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    );
                  }

                  return ListView.separated(
                    controller: scrollController,
                    padding: EdgeInsets.fromLTRB(4.w, 1.h, 4.w, 3.h),
                    itemCount: list.length,
                    separatorBuilder: (_, _) => SizedBox(height: 1.2.h),
                    itemBuilder: (_, idx) {
                      final item = list[idx];
                      final loai = (item['loai'] ?? '').toString();
                      final booking = item['booking'] as CustomerBookingModel?;

                      IconData icon = Icons.notifications_outlined;
                      Color badgeColor = const Color(0xFF0284C7);
                      Color cardBg = const Color(0xFFF8FAFC);
                      Color borderColor = const Color(0xFFE2E8F0);
                      String tagLabel = 'THÔNG BÁO';

                      if (loai == 'NHAC_LICH' ||
                          loai == 'HDV_NHAC_LICH' ||
                          loai == 'HDV_PHAN_CONG') {
                        icon = Icons.alarm_on_rounded;
                        badgeColor = const Color(0xFF0284C7);
                        cardBg = const Color(0xFFF0F9FF);
                        borderColor = const Color(0xFFBAE6FD);
                        tagLabel = 'NHẮC LỊCH KHỞI HÀNH';
                      } else if (loai == 'DANH_GIA') {
                        icon = Icons.rate_review_outlined;
                        badgeColor = const Color(0xFFD97706);
                        cardBg = const Color(0xFFFFFBEB);
                        borderColor = const Color(0xFFFDE68A);
                        tagLabel = 'MỜI ĐÁNH GIÁ & PHẢN HỒI';
                      } else if (loai == 'DA_DANH_GIA') {
                        icon = Icons.stars_rounded;
                        badgeColor = const Color(0xFF15803D);
                        cardBg = const Color(0xFFF0FDF4);
                        borderColor = const Color(0xFFBBF7D0);
                        tagLabel = 'ĐÃ ĐÁNH GIÁ SAU TOUR';
                      } else if (loai == 'HOA_DON') {
                        icon = Icons.receipt_long_rounded;
                        badgeColor = const Color(0xFF0F172A);
                        cardBg = const Color(0xFFF8FAFC);
                        borderColor = const Color(0xFFCBD5E1);
                        tagLabel = 'HÓA ĐƠN & VÉ ĐIỆN TỬ QR';
                      } else if (loai == 'HUY_DON') {
                        icon = Icons.cancel_outlined;
                        badgeColor = const Color(0xFFBE123C);
                        cardBg = const Color(0xFFFFF1F2);
                        borderColor = const Color(0xFFFECDD3);
                        tagLabel = 'THÔNG BÁO HỦY ĐƠN';
                      }

                      return Container(
                        padding: EdgeInsets.all(3.8.w),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: borderColor),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: badgeColor.withAlpha(30),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(icon, size: 17, color: badgeColor),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 7,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: badgeColor,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    tagLabel,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 8.5,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 0.9.h),
                            Text(
                              (item['tieuDe'] ?? '').toString(),
                              style: TextStyle(
                                fontSize: Responsive.font(11.5),
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                            SizedBox(height: 0.5.h),
                            Text(
                              (item['noiDung'] ?? '').toString(),
                              style: TextStyle(
                                fontSize: Responsive.font(9.8),
                                height: 1.4,
                                color: const Color(0xFF334155),
                              ),
                            ),
                            if (booking != null) ...[
                              SizedBox(height: 1.2.h),
                              Wrap(
                                spacing: 8,
                                runSpacing: 6,
                                children: [
                                  if (loai == 'DANH_GIA')
                                    FilledButton.icon(
                                      style: FilledButton.styleFrom(
                                        backgroundColor: const Color(0xFFD97706),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 7,
                                        ),
                                        minimumSize: Size.zero,
                                        tapTargetSize:
                                            MaterialTapTargetSize.shrinkWrap,
                                      ),
                                      onPressed: () {
                                        Navigator.of(sheetCtx).pop();
                                        runAfterSheetClosed(() {
                                          if (context.mounted) {
                                            showReviewDialogForBooking(
                                              context,
                                              booking,
                                            );
                                          }
                                        });
                                      },
                                      icon: const Icon(
                                        Icons.star_rounded,
                                        size: 15,
                                      ),
                                      label: Text(
                                        'Đánh giá & Phản hồi ngay',
                                        style: TextStyle(
                                          fontSize: Responsive.font(9.5),
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  if (booking.isPaid) ...[
                                    FilledButton.icon(
                                      style: FilledButton.styleFrom(
                                        backgroundColor: const Color(0xFF15803D),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 11,
                                          vertical: 7,
                                        ),
                                        minimumSize: Size.zero,
                                        tapTargetSize:
                                            MaterialTapTargetSize.shrinkWrap,
                                      ),
                                      onPressed: () {
                                        Navigator.of(sheetCtx).pop();
                                        runAfterSheetClosed(
                                          () => openTicketByCode(booking.code),
                                        );
                                      },
                                      icon: const Icon(
                                        Icons.qr_code_2_rounded,
                                        size: 15,
                                      ),
                                      label: Text(
                                        'Vé điện tử QR',
                                        style: TextStyle(
                                          fontSize: Responsive.font(9.5),
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                    OutlinedButton.icon(
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: const Color(0xFF0F172A),
                                        backgroundColor: Colors.white,
                                        side: const BorderSide(
                                          color: Color(0xFFCBD5E1),
                                        ),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 11,
                                          vertical: 7,
                                        ),
                                        minimumSize: Size.zero,
                                        tapTargetSize:
                                            MaterialTapTargetSize.shrinkWrap,
                                      ),
                                      onPressed: () {
                                        Navigator.of(sheetCtx).pop();
                                        runAfterSheetClosed(() {
                                          if (context.mounted) {
                                            showInvoiceSheet(context, booking);
                                          }
                                        });
                                      },
                                      icon: const Icon(
                                        Icons.receipt_long_outlined,
                                        size: 14,
                                      ),
                                      label: Text(
                                        'Hóa đơn ${booking.invoiceCode}',
                                        style: TextStyle(
                                          fontSize: Responsive.font(9.5),
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  );
                }),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Hộp thoại Đánh giá (1-5 Sao) & Phản hồi chất lượng dịch vụ sau khi kết thúc tour
  Future<void> showReviewDialogForBooking(
    BuildContext context,
    CustomerBookingModel booking,
  ) async {
    var stars = booking.reviewStars ?? 5;
    final comment = TextEditingController(
      text: booking.reviewComment ?? '',
    );
    final quickTags = <String>[
      'Lịch trình hợp lý, đúng giờ',
      'Hướng dẫn viên nhiệt tình, chu đáo',
      'Xe đưa đón & Khách sạn sạch đẹp',
      'Ẩm thực đặc sắc, đáng tiền',
    ];
    final selectedTags = <String>{};
    var submitted = false;

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (dialogCtx, setState) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.rate_review_rounded,
                    color: Color(0xFFD97706),
                    size: 22,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Đánh giá & Phản hồi sau tour',
                      style: TextStyle(
                        fontSize: Responsive.font(13.5),
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '${booking.tour.title} (${booking.code})',
                style: TextStyle(
                  fontSize: Responsive.font(9.5),
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      5,
                      (index) => IconButton(
                        onPressed: () => setState(() => stars = index + 1),
                        icon: Icon(
                          index < stars
                              ? Icons.star_rounded
                              : Icons.star_outline_rounded,
                          color: const Color(0xFFF59E0B),
                          size: 32,
                        ),
                      ),
                    ),
                  ),
                ),
                Center(
                  child: Text(
                    stars == 5
                        ? 'Tuyệt vời (5/5 sao)'
                        : stars == 4
                        ? 'Rất hài lòng (4/5 sao)'
                        : stars == 3
                        ? 'Bình thường (3/5 sao)'
                        : 'Cần cải thiện ($stars/5 sao)',
                    style: TextStyle(
                      fontSize: Responsive.font(10),
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFFB45309),
                    ),
                  ),
                ),
                SizedBox(height: 1.2.h),
                Text(
                  'Chọn nhanh phản hồi dịch vụ:',
                  style: TextStyle(
                    fontSize: Responsive.font(9.5),
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF334155),
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: quickTags.map((tag) {
                    final isSelected = selectedTags.contains(tag);
                    return FilterChip(
                      label: Text(tag),
                      selected: isSelected,
                      onSelected: (val) {
                        setState(() {
                          if (val) {
                            selectedTags.add(tag);
                          } else {
                            selectedTags.remove(tag);
                          }
                        });
                      },
                      selectedColor: const Color(0xFFFEF3C7),
                      backgroundColor: const Color(0xFFF8FAFC),
                      labelStyle: TextStyle(
                        fontSize: Responsive.font(8.8),
                        fontWeight: FontWeight.w600,
                        color: isSelected
                            ? const Color(0xFF92400E)
                            : const Color(0xFF475569),
                      ),
                    );
                  }).toList(),
                ),
                SizedBox(height: 1.2.h),
                TextField(
                  controller: comment,
                  maxLength: 1000,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText:
                        'Nhập nhận xét, góp ý của bạn về chuyến đi, HDV, khách sạn, nhà xe...',
                    hintStyle: TextStyle(fontSize: Responsive.font(9.5)),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: const Text('Để sau'),
            ),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF0F172A),
              ),
              onPressed: () {
                submitted = true;
                Navigator.pop(dialogCtx);
              },
              icon: const Icon(Icons.send_rounded, size: 15),
              label: const Text('Gửi đánh giá & Phản hồi'),
            ),
          ],
        ),
      ),
    );

    if (submitted) {
      final parts = <String>[
        ...selectedTags,
        if (comment.text.trim().isNotEmpty) comment.text.trim(),
      ];
      final fullComment = parts.isEmpty
          ? 'Chuyến đi tuyệt vời, dịch vụ chu đáo!'
          : parts.join(' • ');
      try {
        final cid = (currentUser.value?['customerId'] as num?)?.toInt();
        await OrdersService().submitReview(
          booking.id,
          stars: stars,
          comment: fullComment,
          customerId: cid,
        );
        Get.snackbar(
          'Đã gửi đánh giá & phản hồi ⭐',
          'Cảm ơn bạn đã đánh giá $stars sao cho chuyến đi ${booking.tour.title}!',
          backgroundColor: const Color(0xFF15803D),
          colorText: Colors.white,
          snackPosition: SnackPosition.BOTTOM,
          margin: const EdgeInsets.all(14),
        );
        if (Get.isRegistered<OrdersController>()) {
          await Get.find<OrdersController>().loadOrders();
        }
        await loadNotifications();
      } on ApiClientException catch (e) {
        Get.snackbar(
          'Thông báo đánh giá',
          e.message,
          backgroundColor: const Color(0xFF0F172A),
          colorText: Colors.white,
          snackPosition: SnackPosition.BOTTOM,
        );
      }
    }
    // Chờ dialog đóng hẳn rồi mới giải phóng TextEditingController
    // (tránh lỗi "used after being disposed" trong lúc animation đóng).
    Future<void>.delayed(const Duration(milliseconds: 400), comment.dispose);
  }

  /// Hộp thoại Lưu trữ & Quản lý Hóa đơn điện tử (E-Invoice) kèm truy cập nhanh Vé QR
  Future<void> showInvoiceSheet(
    BuildContext context,
    CustomerBookingModel booking,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(Responsive.radius(20)),
        ),
      ),
      builder: (sheetCtx) => SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(5.w, 1.8.h, 5.w, 3.h),
          child: Column(
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
              SizedBox(height: 1.5.h),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'HÓA ĐƠN ĐIỆN TỬ (E-INVOICE)',
                        style: TextStyle(
                          fontSize: Responsive.font(13.5),
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      Text(
                        'Số hóa đơn: ${booking.invoiceCode} • Mã đơn: ${booking.code}',
                        style: TextStyle(
                          fontSize: Responsive.font(9.5),
                          color: const Color(0xFF64748B),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: booking.isPaid
                          ? const Color(0xFFF0FDF4)
                          : const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: booking.isPaid
                            ? const Color(0xFFBBF7D0)
                            : const Color(0xFFFDE68A),
                      ),
                    ),
                    child: Text(
                      booking.isPaid ? 'ĐÃ THANH TOÁN' : booking.statusLabel,
                      style: TextStyle(
                        fontSize: Responsive.font(8.8),
                        fontWeight: FontWeight.w800,
                        color: booking.isPaid
                            ? const Color(0xFF15803D)
                            : const Color(0xFFB45309),
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 22),
              Container(
                padding: EdgeInsets.all(3.8.w),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Đơn vị phát hành: Công ty Cổ phần Du lịch & Lữ hành VietTour',
                      style: TextStyle(
                        fontSize: Responsive.font(9.5),
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF334155),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Khách hàng: $displayName (${currentEmail.isNotEmpty ? currentEmail : "Khách hàng VietTour"})',
                      style: TextStyle(
                        fontSize: Responsive.font(9.5),
                        color: const Color(0xFF475569),
                      ),
                    ),
                    const Divider(height: 18),
                    Text(
                      booking.tour.title,
                      style: TextStyle(
                        fontSize: Responsive.font(11.5),
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    SizedBox(height: 0.6.h),
                    _invoiceRow(
                      'Ngày khởi hành',
                      '${Formatters.date(booking.departureDate)} (${booking.departurePoint})',
                    ),
                    _invoiceRow(
                      'Số lượng hành khách',
                      '${booking.adults} người lớn${booking.children > 0 ? ", ${booking.children} trẻ em" : ""}',
                    ),
                    _invoiceRow(
                      'Phương thức thanh toán',
                      booking.paymentMethod,
                    ),
                    _invoiceRow('Mã giao dịch', booking.transactionCode),
                    const Divider(height: 18),
                    _invoiceRow(
                      'Tổng tiền dịch vụ tạm tính',
                      Formatters.currency(booking.subtotal),
                    ),
                    if (booking.discountAmount > 0)
                      _invoiceRow(
                        'Khuyến mãi / Mã giảm giá (Voucher)',
                        '-${Formatters.currency(booking.discountAmount)}',
                        valueColor: const Color(0xFF15803D),
                      ),
                    const Divider(height: 18),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'TỔNG THANH TOÁN (ĐÃ GỒM VAT)',
                          style: TextStyle(
                            fontSize: Responsive.font(10.5),
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          Formatters.currency(booking.total),
                          style: TextStyle(
                            fontSize: Responsive.font(13),
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF15803D),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(height: 1.8.h),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF0F172A),
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () {
                        Navigator.of(sheetCtx).pop();
                        Get.snackbar(
                          'Đã lưu trữ Hóa đơn ${booking.invoiceCode}',
                          'Hóa đơn điện tử đơn ${booking.code} đã được lưu trong mục Đơn của tôi.',
                          backgroundColor: const Color(0xFF0F172A),
                          colorText: Colors.white,
                          snackPosition: SnackPosition.BOTTOM,
                        );
                      },
                      icon: const Icon(Icons.bookmark_added_outlined, size: 17),
                      label: Text(
                        'Lưu trữ Hóa đơn',
                        style: TextStyle(
                          fontSize: Responsive.font(10),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  if (booking.isPaid)
                    Expanded(
                      child: FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF15803D),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        onPressed: () {
                          Navigator.of(sheetCtx).pop();
                          runAfterSheetClosed(
                            () => openTicketByCode(booking.code),
                          );
                        },
                        icon: const Icon(Icons.qr_code_2_rounded, size: 17),
                        label: Text(
                          'Mở Vé điện tử QR',
                          style: TextStyle(
                            fontSize: Responsive.font(10),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _invoiceRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: Responsive.font(9.5),
              color: const Color(0xFF64748B),
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: Responsive.font(9.8),
                fontWeight: FontWeight.w700,
                color: valueColor ?? const Color(0xFF0F172A),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AppBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(AppController(), permanent: true);
  }
}
