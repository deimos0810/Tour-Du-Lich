import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_routes.dart';
import '../../core/network/api_client.dart';
import '../../data/models/customer_booking_model.dart';
import '../../data/services/orders_service.dart';
import '../../data/services/payment_service.dart';
import 'ticket_controller.dart';

class OrdersController extends GetxController with WidgetsBindingObserver {
  OrdersController({
    OrdersService? ordersService,
    PaymentService? paymentService,
  }) : _ordersService = ordersService ?? OrdersService(),
       _paymentService = paymentService ?? PaymentService();

  final OrdersService _ordersService;
  final PaymentService _paymentService;
  final selectedStatus = 'Tất cả'.obs;
  final allOrders = <CustomerBookingModel>[].obs;
  final loading = false.obs;
  final errorMessage = ''.obs;
  StreamSubscription<Uri>? _linkSubscription;
  int? _pendingPaymentOrderId;
  bool _openingPayment = false;

  static const statuses = [
    'Tất cả',
    'Chờ thanh toán',
    'Đã thanh toán',
    'Hoàn thành',
    'Đã hủy',
  ];

  List<CustomerBookingModel> get orders {
    if (selectedStatus.value == 'Tất cả') return allOrders.toList();
    return allOrders
        .where((order) => order.statusLabel == selectedStatus.value)
        .toList();
  }

  @override
  void onInit() {
    super.onInit();
    WidgetsBinding.instance.addObserver(this);
    _linkSubscription = AppLinks().uriLinkStream.listen(
      (uri) => unawaited(_handlePaymentReturn(uri)),
      onError: (_) {},
    );
    unawaited(loadOrders());
  }

  Future<void> loadOrders() async {
    loading.value = true;
    errorMessage.value = '';
    try {
      allOrders.assignAll(await _ordersService.getMyBookings());
    } on ApiClientException catch (error) {
      errorMessage.value = error.message;
    } finally {
      loading.value = false;
    }
  }

  Future<void> cancelBooking(CustomerBookingModel order) async {
    try {
      await _ordersService.cancelBooking(order.id);
      Get.snackbar('Đã hủy đơn', 'Mã đơn ${order.code} đã được hủy.');
      await loadOrders();
    } on ApiClientException catch (error) {
      Get.snackbar('Không thể hủy đơn', error.message);
    }
  }

  Future<void> requestCashPayment(CustomerBookingModel order) async {
    try {
      await _ordersService.requestCashPayment(
        order.id,
        note: 'Khách xác nhận nộp tiền mặt tại quầy giao dịch VietTour (App Mobile)',
      );
      Get.snackbar(
        'Đã đăng ký nộp tiền mặt tại quầy',
        'Đơn ${order.code} đã chuyển sang chờ thu tiền mặt tại quầy. Admin sẽ xác nhận khi thu tiền.',
        backgroundColor: const Color(0xFF0F172A),
        colorText: const Color(0xFFFFFFFF),
        snackPosition: SnackPosition.BOTTOM,
      );
      await loadOrders();
    } on ApiClientException catch (error) {
      Get.snackbar('Không thể đăng ký tiền mặt', error.message);
    }
  }

  Future<void> payAgain(CustomerBookingModel order) async {
    if (_openingPayment) return;
    _openingPayment = true;
    _pendingPaymentOrderId = order.id;
    try {
      final paymentUrl = await _paymentService.createVnpayUrl(order.id);
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
      // Khi đóng trình duyệt quay về, kiểm tra lại trạng thái đơn hàng một cách êm ái
      await _checkPendingPayment(silent: true);
    } on ApiClientException catch (error) {
      _pendingPaymentOrderId = null;
      Get.snackbar('Không thể tạo thanh toán', error.message);
    } on PlatformException catch (error) {
      _pendingPaymentOrderId = null;
      Get.snackbar(
        'Không thể mở thanh toán',
        error.message ?? 'Vui lòng kiểm tra trình duyệt trên thiết bị.',
      );
    } finally {
      _openingPayment = false;
    }
  }

  Future<void> submitReview(
    CustomerBookingModel order, {
    required int stars,
    required String comment,
  }) async {
    try {
      await _ordersService.submitReview(
        order.id,
        stars: stars,
        comment: comment,
      );
      Get.snackbar('Đã gửi đánh giá', 'Cảm ơn bạn đã chia sẻ trải nghiệm.');
      await loadOrders();
    } on ApiClientException catch (error) {
      Get.snackbar('Không thể gửi đánh giá', error.message);
    }
  }

  void openTicket(CustomerBookingModel order) {
    if (!order.isPaid) {
      Get.snackbar(
        'Chưa phát hành vé điện tử',
        'Đơn hàng đang ở trạng thái Chờ thanh toán. Vé điện tử & Mã QR chỉ được kích hoạt sau khi hoàn tất thanh toán.',
      );
      return;
    }
    TicketController.pendingBookingCode = order.code;
    if (Get.isRegistered<TicketController>()) {
      Get.delete<TicketController>(force: true);
    }
    Get.toNamed(
      AppRoutes.ticket,
      arguments: order.code,
      parameters: {'code': order.code},
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Tránh pop snackbar làm giật màn hình khi người dùng đổi qua lại giữa trình duyệt và app
  }

  Future<void> _handlePaymentReturn(Uri uri) async {
    if (uri.scheme != 'viettour' || uri.host != 'payment-result') return;
    final bookingId = int.tryParse(uri.queryParameters['donHangId'] ?? '');
    if (bookingId == null || bookingId != _pendingPaymentOrderId) return;
    await _checkPendingPayment(
      unverified: uri.queryParameters['result'] == 'unverified',
    );
  }

  Future<void> _checkPendingPayment({
    bool unverified = false,
    bool silent = false,
  }) async {
    final bookingId = _pendingPaymentOrderId;
    if (bookingId == null) return;
    _pendingPaymentOrderId = null;
    try {
      final status = await _paymentService.getPaymentStatus(bookingId);
      await loadOrders();
      if (status['trangThaiDon'] == 'Da thanh toan') {
        Get.snackbar(
          'Thanh toán thành công',
          'Đơn của bạn đã được xác nhận thanh toán thành công.',
          backgroundColor: const Color(0xFF10B981),
          colorText: const Color(0xFFFFFFFF),
          snackPosition: SnackPosition.BOTTOM,
        );
      } else if (!silent) {
        if (unverified) {
          Get.snackbar(
            'Chưa xác minh được giao dịch',
            'Trạng thái đơn vẫn được lấy từ máy chủ.',
            snackPosition: SnackPosition.BOTTOM,
          );
        } else {
          Get.snackbar(
            'Thanh toán chưa hoàn tất',
            'Đơn vẫn chưa được ghi nhận thanh toán.',
            snackPosition: SnackPosition.BOTTOM,
          );
        }
      }
    } on ApiClientException catch (error) {
      if (!silent) Get.snackbar('Không kiểm tra được thanh toán', error.message);
    }
  }

  @override
  void onClose() {
    WidgetsBinding.instance.removeObserver(this);
    unawaited(_linkSubscription?.cancel());
    super.onClose();
  }
}

class OrdersBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<OrdersController>(OrdersController.new);
  }
}
