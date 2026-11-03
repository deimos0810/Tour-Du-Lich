import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import 'booking_success_controller.dart';

class BookingSuccessView extends GetView<BookingSuccessController> {
  const BookingSuccessView({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Padding(
        padding: EdgeInsets.all(7.w),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 28.w,
              height: 28.w,
              decoration: const BoxDecoration(
                color: Color(0xFFDCFCE7),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.check_rounded,
                size: 15.w,
                color: AppColors.green,
              ),
            ),
            SizedBox(height: 3.h),
            Text(
              'Đặt tour thành công!',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.navy,
                fontSize: Responsive.font(23),
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 1.h),
            Text(
              'Mã đơn đặt tour của bạn:',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.muted,
                fontSize: Responsive.font(12),
                height: 1.5,
              ),
            ),
            SizedBox(height: 1.h),
            SelectableText(
              controller.bookingCode,
              style: TextStyle(
                color: AppColors.primary,
                fontSize: Responsive.font(17),
                fontWeight: FontWeight.w800,
                letterSpacing: 0.6,
              ),
            ),
            SizedBox(height: 1.h),
            Text(
              'Đơn đã được tạo thành công. Bạn có thể theo dõi trạng thái trong mục Đơn của tôi.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.muted,
                fontSize: Responsive.font(11),
                height: 1.5,
              ),
            ),
            Obx(
              () => controller.paymentMessage.value.isEmpty
                  ? const SizedBox.shrink()
                  : Padding(
                      padding: EdgeInsets.only(top: 1.5.h),
                      child: Text(
                        controller.paymentMessage.value,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: controller.paid.value
                              ? AppColors.green
                              : AppColors.muted,
                          fontSize: Responsive.font(10.5),
                        ),
                      ),
                    ),
            ),
            SizedBox(height: 4.h),
            Obx(
              () => Column(
                children: [
                  AppButton(
                    label: controller.paid.value
                        ? 'ĐÃ THANH TOÁN THÀNH CÔNG'
                        : 'THANH TOÁN VỚI VNPAY',
                    icon: Icons.credit_card_rounded,
                    loading: controller.paymentLoading.value,
                    onPressed: controller.paid.value
                        ? null
                        : controller.payWithVnpay,
                  ),
                  if (!controller.paid.value) ...[
                    SizedBox(height: 1.2.h),
                    OutlinedButton.icon(
                      onPressed: controller.paymentLoading.value
                          ? null
                          : controller.refreshPaymentStatusManually,
                      icon: const Icon(Icons.sync_rounded, size: 18),
                      label: const Text('Kiểm tra kết quả thanh toán'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        minimumSize: Size(double.infinity, 5.2.h),
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(Responsive.radius(10)),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            SizedBox(height: 1.5.h),
            AppButton(
              label: 'Xem đơn của tôi',
              icon: Icons.confirmation_number_outlined,
              onPressed: controller.openOrders,
            ),
            SizedBox(height: 1.5.h),
            TextButton(
              onPressed: controller.openHome,
              child: const Text('Về trang chủ'),
            ),
          ],
        ),
      ),
    ),
  );
}
