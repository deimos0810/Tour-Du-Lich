import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';

import '../../core/constants/app_routes.dart';
import '../../core/controllers/app_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_widgets.dart';
import '../../data/models/customer_booking_model.dart';
import 'orders_controller.dart';
import 'ticket_controller.dart';
import 'ticket_view.dart';

class OrdersView extends GetView<OrdersController> {
  const OrdersView({super.key});

  @override
  Widget build(BuildContext context) {
    final app = Get.find<AppController>();
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        surfaceTintColor: Colors.white,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE2E8F0)),
        ),
        title: Obx(
          () => Text(
            app.isGuideOrStaff
                ? 'Danh sách đơn & Điểm danh đoàn'
                : 'Đơn đặt tour của tôi',
            style: TextStyle(
              fontSize: Responsive.font(14),
              fontWeight: FontWeight.w800,
              color: const Color(0xFF0F172A),
            ),
          ),
        ),
        actions: [
          app.buildNotificationBellButton(context),
          IconButton(
            onPressed: controller.loadOrders,
            icon: const Icon(Icons.refresh_rounded, size: 20),
            tooltip: 'Tải lại đơn hàng',
          ),
        ],
      ),
      body: Column(
        children: [
          // Banner Tải ảnh QR Điểm danh khi đang ở tài khoản Hướng dẫn viên (HDV)
          Obx(() {
            if (!app.isGuideOrStaff) return const SizedBox.shrink();
            return Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.2.h),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Chế độ Hướng dẫn viên: ${app.displayName}',
                          style: TextStyle(
                            fontSize: Responsive.font(10.5),
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          'Tải ảnh Vé QR khách đã lưu lên để quét điểm danh ngay',
                          style: TextStyle(
                            fontSize: Responsive.font(9),
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                    ),
                    onPressed: () async {
                      await TicketView.showUploadQrSheet(context);
                      if (TicketController.pendingBookingCode != null &&
                          TicketController.pendingBookingCode!.isNotEmpty) {
                        Get.toNamed(
                          AppRoutes.ticket,
                          arguments: TicketController.pendingBookingCode,
                          parameters: {
                            'code': TicketController.pendingBookingCode!,
                          },
                        );
                      }
                    },
                    icon: const Icon(Icons.upload_file_rounded, size: 16),
                    label: Text(
                      'Tải ảnh QR & Quét',
                      style: TextStyle(
                        fontSize: Responsive.font(9.5),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),

          Container(
            color: Colors.white,
            padding: EdgeInsets.symmetric(vertical: 1.h),
            height: 6.2.h,
            child: Obx(
              () => ListView(
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.symmetric(horizontal: 4.w),
                children: OrdersController.statuses
                    .map(
                      (status) {
                        String translatedLabel = status;
                        if (status == 'Tất cả') {
                          translatedLabel = 'orders_tab_all'.tr;
                        } else if (status == 'Chờ thanh toán') {
                          translatedLabel = 'orders_tab_pending'.tr;
                        } else if (status == 'Đã thanh toán') {
                          translatedLabel = 'orders_tab_paid'.tr;
                        } else if (status == 'Hoàn thành') {
                          translatedLabel = 'orders_tab_completed'.tr;
                        } else if (status == 'Đã hủy') {
                          translatedLabel = 'orders_tab_cancelled'.tr;
                        }

                        return CategoryChip(
                          label: translatedLabel,
                          selected: controller.selectedStatus.value == status,
                          onTap: () => controller.selectedStatus.value = status,
                        );
                      },
                    )
                    .toList(),
              ),
            ),
          ),
          Expanded(
            child: Obx(() {
              final orders = controller.orders;
              if (controller.loading.value && controller.allOrders.isEmpty) {
                return const Center(child: CircularProgressIndicator());
              }
              if (orders.isEmpty) {
                return RefreshIndicator(
                  onRefresh: controller.loadOrders,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      SizedBox(height: 18.h),
                      EmptyState(
                        title: controller.errorMessage.value.isNotEmpty
                            ? 'Không tải được đơn hàng'
                            : 'Chưa có đơn đặt tour',
                        message: controller.errorMessage.value.isNotEmpty
                            ? controller.errorMessage.value
                            : 'Các chuyến đi của bạn sẽ được hiển thị tại đây.',
                        icon: controller.errorMessage.value.isNotEmpty
                            ? Icons.cloud_off_outlined
                            : Icons.confirmation_number_outlined,
                        action: controller.errorMessage.value.isNotEmpty
                            ? 'Thử lại'
                            : null,
                        onAction: controller.loadOrders,
                      ),
                    ],
                  ),
                );
              }
              return RefreshIndicator(
                onRefresh: controller.loadOrders,
                child: ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: EdgeInsets.fromLTRB(4.w, 1.5.h, 4.w, 3.h),
                  itemCount: orders.length,
                  separatorBuilder: (_, _) => SizedBox(height: 1.4.h),
                  itemBuilder: (_, index) {
                    final booking = orders[index];
                    return _OrderCard(
                      booking: booking,
                      onTap: () => _showOrder(context, booking),
                      onOpenTicket: () => controller.openTicket(booking),
                      onOpenInvoice: () => app.showInvoiceSheet(context, booking),
                      onReview: () =>
                          app.showReviewDialogForBooking(context, booking),
                      onPayVnpay: () => controller.payAgain(booking),
                    );
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  void _showOrder(BuildContext context, CustomerBookingModel booking) {
    final app = Get.find<AppController>();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(Responsive.radius(18)),
        ),
      ),
      builder: (sheetContext) => SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(5.5.w),
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
                    borderRadius: BorderRadius.circular(Responsive.radius(99)),
                  ),
                ),
              ),
              SizedBox(height: 1.8.h),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Chi tiết đơn ${booking.code}',
                    style: TextStyle(
                      fontSize: Responsive.font(15.5),
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(sheetContext).pop(),
                    icon: const Icon(Icons.close_rounded, size: 20),
                  ),
                ],
              ),
              const Divider(height: 16),
              Text(
                booking.tour.title,
                style: TextStyle(
                  fontSize: Responsive.font(13),
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                ),
              ),
              SizedBox(height: 0.8.h),
              Text(
                'Khởi hành: ${Formatters.date(booking.departureDate)}  •  ${booking.adults} người lớn${booking.children > 0 ? ', ${booking.children} trẻ em' : ''}',
                style: TextStyle(
                  fontSize: Responsive.font(10.5),
                  color: AppColors.muted,
                ),
              ),
              SizedBox(height: 0.8.h),
              Text(
                'Trạng thái đơn: ${booking.statusLabel}',
                style: TextStyle(
                  fontSize: Responsive.font(10.5),
                  fontWeight: FontWeight.w700,
                  color: booking.isPaid
                      ? const Color(0xFF15803D)
                      : const Color(0xFFB45309),
                ),
              ),
              SizedBox(height: 0.4.h),
              Text(
                'Tình trạng vé: ${booking.paymentStatus}',
                style: TextStyle(
                  fontSize: Responsive.font(10.5),
                  color: AppColors.muted,
                ),
              ),
              SizedBox(height: 1.h),
              Text(
                'Tổng thanh toán: ${Formatters.currency(booking.total)}',
                style: TextStyle(
                  fontSize: Responsive.font(13),
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w800,
                ),
              ),

              if (booking.canPay) ...[
                SizedBox(height: 1.5.h),
                AppButton(
                  label: 'Thanh toán trực tuyến qua Cổng VNPAY',
                  icon: Icons.credit_card_rounded,
                  onPressed: () {
                    Navigator.of(sheetContext).pop();
                    app.runAfterSheetClosed(() => controller.payAgain(booking));
                  },
                ),
              ],

              if (booking.isPaid) ...[
                SizedBox(height: 1.5.h),
                AppButton(
                  label: 'Xem Vé Điện Tử & Mã QR Cá Nhân',
                  icon: Icons.qr_code_rounded,
                  onPressed: () {
                    Navigator.of(sheetContext).pop();
                    app.runAfterSheetClosed(() => controller.openTicket(booking));
                  },
                ),
                SizedBox(height: 1.h),
                AppButton(
                  label: 'Quản lý & Lưu trữ Hóa đơn (${booking.invoiceCode})',
                  icon: Icons.receipt_long_rounded,
                  outlined: true,
                  onPressed: () {
                    Navigator.of(sheetContext).pop();
                    app.runAfterSheetClosed(() {
                      if (context.mounted) app.showInvoiceSheet(context, booking);
                    });
                  },
                ),
              ],

              if (booking.canReview) ...[
                SizedBox(height: 1.h),
                AppButton(
                  label: 'Đánh giá & Phản hồi sau chuyến đi',
                  icon: Icons.star_outline_rounded,
                  outlined: true,
                  onPressed: () {
                    Navigator.of(sheetContext).pop();
                    app.runAfterSheetClosed(() {
                      if (context.mounted) {
                        app.showReviewDialogForBooking(context, booking);
                      }
                    });
                  },
                ),
              ],

              if (booking.canCancel) ...[
                SizedBox(height: 1.h),
                AppButton(
                  label: 'Hủy đơn đặt chỗ',
                  outlined: true,
                  onPressed: () {
                    Navigator.of(sheetContext).pop();
                    app.runAfterSheetClosed(() {
                      if (context.mounted) _confirmCancellation(context, booking);
                    });
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirmCancellation(
    BuildContext context,
    CustomerBookingModel booking,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hủy đơn đặt tour?'),
        content: const Text(
          'Đơn chưa thanh toán sẽ bị hủy và số chỗ được hoàn lại.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Giữ đơn'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Xác nhận hủy'),
          ),
        ],
      ),
    );
    if (confirmed == true) await controller.cancelBooking(booking);
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({
    required this.booking,
    required this.onTap,
    required this.onOpenTicket,
    required this.onOpenInvoice,
    required this.onReview,
    required this.onPayVnpay,
  });

  final CustomerBookingModel booking;
  final VoidCallback onTap;
  final VoidCallback onOpenTicket;
  final VoidCallback onOpenInvoice;
  final VoidCallback onReview;
  final VoidCallback onPayVnpay;

  @override
  Widget build(BuildContext context) {
    final isPaid = booking.isPaid;
    final isCancelled = booking.status == 'Da huy';
    final badgeBg = isPaid
        ? const Color(0xFFF0FDF4)
        : isCancelled
        ? const Color(0xFFFFF1F2)
        : const Color(0xFFFFFBEB);
    final badgeBorder = isPaid
        ? const Color(0xFFBBF7D0)
        : isCancelled
        ? const Color(0xFFFECDD3)
        : const Color(0xFFFDE68A);
    final badgeText = isPaid
        ? const Color(0xFF15803D)
        : isCancelled
        ? const Color(0xFFBE123C)
        : const Color(0xFFB45309);
    final daysUntil = booking.daysUntilDeparture;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: EdgeInsets.all(3.8.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'Mã đơn: ${booking.code}${isPaid ? " • HĐ: ${booking.invoiceCode}" : ""}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: Responsive.font(10),
                        color: const Color(0xFF0F172A),
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: badgeBg,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: badgeBorder),
                    ),
                    child: Text(
                      booking.statusLabel,
                      style: TextStyle(
                        color: badgeText,
                        fontSize: Responsive.font(9),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 18, color: Color(0xFFF1F5F9)),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 24.w,
                    height: 18.w,
                    child: AppNetworkImage(
                      url: booking.tour.imageUrl,
                      borderRadius: 8,
                    ),
                  ),
                  SizedBox(width: 3.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          booking.tour.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: Responsive.font(11.5),
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        SizedBox(height: 0.5.h),
                        Text(
                          'Khởi hành: ${Formatters.date(booking.departureDate)} • ${booking.adults} NL${booking.children > 0 ? ', ${booking.children} TE' : ''}',
                          style: TextStyle(
                            fontSize: Responsive.font(9.5),
                            color: const Color(0xFF64748B),
                          ),
                        ),
                        SizedBox(height: 0.5.h),
                        Text(
                          Formatters.currency(booking.total),
                          style: TextStyle(
                            fontSize: Responsive.font(12),
                            color: const Color(0xFF0F172A),
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              // Banner nhắc lịch khởi hành trực tiếp trên thẻ đơn
              if (!isCancelled && daysUntil >= 0 && daysUntil <= 60) ...[
                SizedBox(height: 1.h),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F9FF),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFBAE6FD)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.alarm_on_rounded,
                        size: 14,
                        color: Color(0xFF0284C7),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          daysUntil == 0
                              ? 'Nhắc lịch: Hôm nay khởi hành tại ${booking.departurePoint}'
                              : 'Nhắc lịch: Còn $daysUntil ngày khởi hành (${booking.departurePoint})',
                          style: TextStyle(
                            fontSize: Responsive.font(8.8),
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0369A1),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // Hiển thị đánh giá & phản hồi đã gửi
              if (booking.hasReviewed) ...[
                SizedBox(height: 1.h),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.stars_rounded,
                        size: 15,
                        color: Color(0xFFD97706),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Đã đánh giá ${booking.reviewStars ?? 5}/5 ⭐: "${(booking.reviewComment ?? "Chuyến đi tuyệt vời!").trim()}"',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: Responsive.font(8.8),
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF92400E),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              SizedBox(height: 1.2.h),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                alignment: WrapAlignment.end,
                children: [
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF0F172A),
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    onPressed: onTap,
                    child: Text(
                      'Chi tiết',
                      style: TextStyle(
                        fontSize: Responsive.font(9.5),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  if (isPaid)
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF0F172A),
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      onPressed: onOpenInvoice,
                      icon: const Icon(Icons.receipt_long_outlined, size: 14),
                      label: Text(
                        'Hóa đơn',
                        style: TextStyle(
                          fontSize: Responsive.font(9.5),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  if (booking.canReview)
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFB45309),
                        backgroundColor: const Color(0xFFFFFBEB),
                        side: const BorderSide(color: Color(0xFFF59E0B)),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      onPressed: onReview,
                      icon: const Icon(Icons.star_rounded, size: 14),
                      label: Text(
                        'Đánh giá',
                        style: TextStyle(
                          fontSize: Responsive.font(9.5),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  if (isPaid)
                    FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF15803D),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 11,
                          vertical: 6,
                        ),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      onPressed: onOpenTicket,
                      icon: const Icon(Icons.qr_code_2_rounded, size: 15),
                      label: Text(
                        'Vé điện tử QR',
                        style: TextStyle(
                          fontSize: Responsive.font(9.5),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    )
                  else if (booking.canPay)
                    FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 11,
                          vertical: 6,
                        ),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      onPressed: onPayVnpay,
                      icon: const Icon(Icons.payment_rounded, size: 15),
                      label: Text(
                        'Thanh toán VNPAY',
                        style: TextStyle(
                          fontSize: Responsive.font(9.5),
                          fontWeight: FontWeight.w700,
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
}
