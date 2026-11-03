import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_routes.dart';
import '../../core/network/api_client.dart';
import '../../data/services/payment_service.dart';

class BookingSuccessController extends GetxController
    with WidgetsBindingObserver {
  BookingSuccessController({PaymentService? paymentService})
    : _paymentService = paymentService ?? PaymentService();

  final PaymentService _paymentService;
  final paid = false.obs;
  final paymentLoading = false.obs;
  final paymentMessage = ''.obs;
  late final Map<String, dynamic> booking;
  StreamSubscription<Uri>? _linkSubscription;

  int get bookingId => (booking['DonHangID'] as num).toInt();
  String get bookingCode => booking['MaDon'] as String;

  @override
  void onInit() {
    super.onInit();
    final arguments = Get.arguments;
    if (arguments is! Map<String, dynamic> ||
        arguments['DonHangID'] is! num ||
        arguments['MaDon'] is! String) {
      throw StateError('Máy chủ chưa trả về thông tin đơn đặt tour hợp lệ.');
    }
    booking = arguments;
    WidgetsBinding.instance.addObserver(this);
    _linkSubscription = AppLinks().uriLinkStream.listen(
      (uri) => unawaited(_handlePaymentReturn(uri)),
      onError: (Object error) {
        Get.snackbar('Không nhận được kết quả', error.toString());
      },
    );
  }

  Future<void> payWithVnpay() async {
    if (paymentLoading.value) return;
    paymentLoading.value = true;
    try {
      final paymentUrl = await _paymentService.createVnpayUrl(bookingId);
      final launched = await launchUrl(
        paymentUrl,
        mode: LaunchMode.inAppBrowserView,
      );
      if (!launched) {
        await launchUrl(
          paymentUrl,
          mode: LaunchMode.externalApplication,
        );
      }
      await _refreshPaymentStatus(silent: true);
      if (!launched) {
        Get.snackbar(
          'Không thể mở thanh toán',
          'Vui lòng thử lại hoặc kiểm tra trình duyệt trên thiết bị.',
        );
      }
    } on ApiClientException catch (error) {
      Get.snackbar('Không thể tạo thanh toán', error.message);
    } on PlatformException catch (error) {
      Get.snackbar(
        'Không thể mở thanh toán',
        error.message ?? 'Vui lòng kiểm tra trình duyệt trên thiết bị.',
      );
    } finally {
      paymentLoading.value = false;
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Không tự động kiểm tra giật màn hình khi đổi focus tạm thời để tránh làm phiền lúc nhập thẻ
  }

  Future<void> refreshPaymentStatusManually() async {
    if (paymentLoading.value) return;
    paymentLoading.value = true;
    try {
      await _refreshPaymentStatus();
      if (paid.value) {
        Get.snackbar(
          'Thanh toán thành công',
          'Đơn hàng $bookingCode đã được ghi nhận thanh toán.',
          backgroundColor: const Color(0xFF10B981),
          colorText: const Color(0xFFFFFFFF),
          snackPosition: SnackPosition.BOTTOM,
        );
      } else {
        Get.snackbar(
          'Chưa ghi nhận thanh toán',
          paymentMessage.value.isNotEmpty
              ? paymentMessage.value
              : 'Giao dịch chưa hoàn tất hoặc đang được ngân hàng xử lý.',
          snackPosition: SnackPosition.BOTTOM,
        );
      }
    } finally {
      paymentLoading.value = false;
    }
  }

  Future<void> _handlePaymentReturn(Uri uri) async {
    if (uri.scheme != 'viettour' || uri.host != 'payment-result') return;
    final returnedBookingId = int.tryParse(
      uri.queryParameters['donHangId'] ?? '',
    );
    if (returnedBookingId == null || returnedBookingId != bookingId) return;
    await _refreshPaymentStatus(
      unverified: uri.queryParameters['result'] == 'unverified',
    );
  }

  Future<void> _refreshPaymentStatus({
    bool unverified = false,
    bool silent = false,
  }) async {
    try {
      final status = await _paymentService.getPaymentStatus(bookingId);
      if (status['trangThaiDon'] == 'Da thanh toan') {
        paid.value = true;
        paymentMessage.value = 'Thanh toán đã được xác nhận từ máy chủ.';
      } else if (unverified) {
        paymentMessage.value =
            'Không xác minh được kết quả trả về. Đơn vẫn chưa được ghi nhận thanh toán.';
      } else if (status['latestPayment'] is Map &&
          (status['latestPayment'] as Map)['TrangThai'] == 'That bai') {
        paymentMessage.value =
            'Giao dịch chưa thành công. Bạn có thể thử thanh toán lại.';
      } else {
        paymentMessage.value = 'Máy chủ chưa ghi nhận thanh toán cho đơn này.';
      }
    } on ApiClientException catch (error) {
      if (!silent) paymentMessage.value = error.message;
    }
  }

  void openOrders() => Get.offAllNamed(AppRoutes.home, arguments: {'tab': 3});
  void openHome() => Get.offAllNamed(AppRoutes.home);

  @override
  void onClose() {
    WidgetsBinding.instance.removeObserver(this);
    unawaited(_linkSubscription?.cancel());
    super.onClose();
  }
}

class BookingSuccessBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<BookingSuccessController>(BookingSuccessController.new);
  }
}
