import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_widgets.dart';
import 'booking_controller.dart';

class BookingView extends GetView<BookingController> {
  const BookingView({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(
        'booking_title'.tr,
        style: TextStyle(
          fontSize: Responsive.font(18),
          fontWeight: FontWeight.w800,
        ),
      ),
    ),
    body: Form(
      key: controller.formKey,
      child: ListView(
        padding: EdgeInsets.fromLTRB(5.w, 1.h, 5.w, 3.h),
        children: [
          _heading('booking_schedule_info'.tr),
          Container(
            padding: EdgeInsets.all(3.w),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(Responsive.radius(14)),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 27.w,
                  height: 19.w,
                  child: AppNetworkImage(
                    url: controller.tour.imageUrl,
                    borderRadius: 10,
                  ),
                ),
                SizedBox(width: 3.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        controller.tour.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: Responsive.font(11.5),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(height: 0.7.h),
                      Text(
                        '${controller.tour.duration} · ${controller.tour.destination}',
                        style: TextStyle(
                          color: AppColors.muted,
                          fontSize: Responsive.font(9.5),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 2.5.h),
          _heading('tour_departures'.tr),
          Container(
            padding: EdgeInsets.all(3.w),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(Responsive.radius(12)),
              border: Border.all(color: AppColors.border),
            ),
            child: Obx(() {
              final departure = controller.selectedDeparture.value;
              if (departure == null) {
                return Text('tour_select_date'.tr);
              }
              return Row(
                children: [
                  const Icon(
                    Icons.calendar_month_outlined,
                    color: AppColors.primary,
                  ),
                  SizedBox(width: 3.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${Formatters.date(departure.startDate)} - ${Formatters.date(departure.endDate)}',
                          style: TextStyle(
                            fontSize: Responsive.font(11.5),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        SizedBox(height: 0.5.h),
                        Text(
                          'tour_seats_left'.trParams({'count': '${departure.remainingSeats}'}),
                          style: TextStyle(
                            fontSize: Responsive.font(9.5),
                            fontWeight: FontWeight.w600,
                            color: AppColors.green,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            }),
          ),
          SizedBox(height: 2.5.h),
          _heading('booking_passenger_count'.tr),
          _stepper(
            'booking_adult'.tr,
            'booking_adult_sub'.tr,
            controller.adults,
            canDecrease: (value) => value > 1,
            canIncrease: () =>
                controller.adults.value + controller.children.value <
                controller.availableSeats,
            onDecrease: controller.decrementAdults,
            onIncrease: controller.incrementAdults,
          ),
          SizedBox(height: 1.h),
          _stepper(
            'booking_child'.tr,
            'booking_child_sub'.tr,
            controller.children,
            canDecrease: (value) => value > 0,
            canIncrease: () =>
                controller.adults.value + controller.children.value <
                controller.availableSeats,
            onDecrease: controller.decrementChildren,
            onIncrease: controller.incrementChildren,
          ),
          SizedBox(height: 2.5.h),
          _heading('booking_contact_info'.tr),
          Text(
            'booking_contact_note'.tr,
            style: TextStyle(
              color: AppColors.muted,
              fontSize: Responsive.font(9.5),
            ),
          ),
          SizedBox(height: 1.h),
          AppTextField(
            label: 'booking_name'.tr,
            controller: controller.contactName,
            prefixIcon: Icons.person_outline_rounded,
            validator: (value) => value == null || value.trim().isEmpty
                ? 'Vui lòng nhập họ tên'
                : null,
          ),
          SizedBox(height: 1.5.h),
          AppTextField(
            label: 'booking_email'.tr,
            hint: 'ban@email.com',
            controller: controller.contactEmail,
            keyboardType: TextInputType.emailAddress,
            prefixIcon: Icons.mail_outline_rounded,
            validator: (value) =>
                value == null || !GetUtils.isEmail(value.trim())
                    ? 'Vui lòng nhập email hợp lệ'
                    : null,
          ),
          SizedBox(height: 1.5.h),
          AppTextField(
            label: 'booking_phone'.tr,
            hint: '09xx xxx xxx',
            controller: controller.contactPhone,
            keyboardType: TextInputType.phone,
            prefixIcon: Icons.call_outlined,
            validator: (value) => value == null || value.trim().length < 9
                ? 'Vui lòng nhập số điện thoại hợp lệ'
                : null,
          ),
          SizedBox(height: 2.5.h),

          // THÔNG TIN HÀNH KHÁCH RÀNG BUỘC THEO SỐ LƯỢNG KHÁCH (GIỐNG BẢN WEB)
          Obx(() => _passengersSection()),

          SizedBox(height: 2.5.h),
          _heading('booking_voucher'.tr),
          Obx(
            () => controller.appliedVoucher.value == null
                ? Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: controller.voucherCode,
                          textCapitalization: TextCapitalization.characters,
                          decoration: InputDecoration(
                            hintText: 'Nhập mã giảm giá (VD: TRIAN500K)',
                            prefixIcon: const Icon(Icons.local_offer_outlined),
                          ),
                        ),
                      ),
                      SizedBox(width: 2.w),
                      TextButton(
                        onPressed: controller.voucherLoading.value
                            ? null
                            : controller.applyVoucher,
                        child: controller.voucherLoading.value
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : Text('booking_apply'.tr),
                      ),
                    ],
                  )
                : Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${'booking_voucher_applied'.tr}: ${controller.appliedVoucher.value}',
                          style: TextStyle(
                            color: AppColors.green,
                            fontSize: Responsive.font(10.5),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      TextButton(
                        onPressed: controller.removeVoucher,
                        child: Text('booking_remove_voucher'.tr),
                      ),
                    ],
                  ),
          ),
          SizedBox(height: 2.5.h),
          _heading('booking_payment_title'.tr),
          Text('booking_payment_sub'.tr),
          SizedBox(height: 2.h),
          Container(
            padding: EdgeInsets.all(4.w),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(Responsive.radius(14)),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                Obx(
                  () => _priceRow(
                    'Người lớn × ${controller.adults.value}',
                    (controller.selectedDeparture.value?.price ??
                            controller.tour.price) *
                        controller.adults.value,
                  ),
                ),
                Obx(
                  () => controller.children.value == 0
                      ? const SizedBox.shrink()
                      : _priceRow(
                          'Trẻ em × ${controller.children.value}',
                          controller.tour.childPrice *
                              controller.children.value,
                        ),
                ),
                Obx(
                  () => controller.voucherDiscount.value == 0
                      ? const SizedBox.shrink()
                      : _priceRow(
                          'Ưu đãi voucher',
                          -controller.voucherDiscount.value,
                        ),
                ),
                Divider(height: 2.5.h),
                Obx(
                  () => _priceRow(
                    'Tổng thanh toán',
                    controller.totalAfterDiscount,
                    bold: true,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 2.h),
          Obx(() {
            final isIncomplete = controller.isPassengersIncomplete;
            final missing = controller.missingPassengersCount;

            return AppButton(
              label: isIncomplete
                  ? 'VUI LÒNG ĐIỀN ĐỦ CCCD ($missing KHÁCH)'
                  : 'booking_confirm_btn'.tr,
              icon: isIncomplete
                  ? Icons.info_outline_rounded
                  : Icons.lock_outline_rounded,
              loading: controller.loading.value,
              onPressed: controller.confirm,
            );
          }),
          SizedBox(height: 1.h),
          Center(
            child: Text(
              'Thông tin cá nhân & CCCD được mã hóa bảo mật theo tiêu chuẩn du lịch',
              style: TextStyle(
                fontSize: Responsive.font(9),
                color: AppColors.muted,
              ),
            ),
          ),
        ],
      ),
    ),
  );

  /// Widget danh sách hành khách với ràng buộc Họ tên và CCCD 12 số giống bản Web
  Widget _passengersSection() {
    final list = controller.passengers;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _heading('${'booking_passengers_list'.tr} (${list.length})'),
            Text(
              'booking_passengers_sub'.tr,
              style: TextStyle(
                fontSize: Responsive.font(9.5),
                color: const Color(0xFF64748B),
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        ...list.asMap().entries.map((entry) {
          final index = entry.key;
          final p = entry.value;

          return Obx(() {
            final isAdult = p.isAdult.value;
            final hasName = p.name.length >= 2;
            final hasCccd = RegExp(r'^\d{12}$').hasMatch(p.cccd);
            final isValid = hasName && hasCccd;

            return Container(
              margin: EdgeInsets.only(bottom: 1.5.h),
              padding: EdgeInsets.all(3.5.w),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(Responsive.radius(12)),
                border: Border.all(
                  color: isValid ? const Color(0xFFE2E8F0) : const Color(0xFFCBD5E1),
                  width: isValid ? 1.0 : 1.2,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hàng tiêu đề hành khách + Badge trạng thái
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'booking_passenger_index'.trParams({
                          'index': '${index + 1}',
                          'type': isAdult ? 'booking_adult'.tr : 'booking_child'.tr,
                        }),
                        style: TextStyle(
                          fontSize: Responsive.font(11),
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      if (isValid)
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 2.w, vertical: 0.3.h),
                          decoration: BoxDecoration(
                            color: const Color(0xFFD1FAE5),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_rounded, size: 13, color: Color(0xFF047857)),
                              SizedBox(width: 1.w),
                              Text(
                                'booking_passenger_ready'.tr,
                                style: TextStyle(
                                  fontSize: Responsive.font(9),
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF047857),
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 2.w, vertical: 0.3.h),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'booking_passenger_need_info'.tr,
                            style: TextStyle(
                              fontSize: Responsive.font(9),
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFFB45309),
                            ),
                          ),
                        ),
                    ],
                  ),
                  SizedBox(height: 1.h),

                  // Họ và tên hành khách
                  TextFormField(
                    controller: p.nameController,
                    decoration: InputDecoration(
                      hintText: '${'booking_name'.tr} #${index + 1}',
                      filled: true,
                      fillColor: Colors.white,
                      prefixIcon: const Icon(Icons.badge_outlined, size: 20),
                      contentPadding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.2.h),
                    ),
                    validator: (v) => (v == null || v.trim().length < 2)
                        ? 'Vui lòng nhập họ và tên'
                        : null,
                  ),
                  SizedBox(height: 1.h),

                  // Giới tính
                  Row(
                    children: [
                      Text(
                        'Giới tính: ',
                        style: TextStyle(
                          fontSize: Responsive.font(10),
                          color: AppColors.muted,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      SizedBox(width: 2.w),
                      _genderChip(p, 'Nam'),
                      SizedBox(width: 2.w),
                      _genderChip(p, 'Nữ'),
                    ],
                  ),
                  SizedBox(height: 1.h),

                  // Số CCCD / Mã định danh 12 số
                  TextFormField(
                    controller: p.cccdController,
                    keyboardType: TextInputType.number,
                    maxLength: 12,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: InputDecoration(
                      hintText: 'Số CCCD / Mã định danh (đủ 12 chữ số)',
                      filled: true,
                      fillColor: Colors.white,
                      counterText: '',
                      prefixIcon: const Icon(Icons.credit_card_outlined, size: 20),
                      contentPadding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.2.h),
                    ),
                    validator: (v) => (v == null || v.trim().length != 12)
                        ? 'CCCD phải gồm đúng 12 chữ số'
                        : null,
                  ),

                  // Gợi ý số chữ số đã nhập
                  if (p.cccd.isNotEmpty && p.cccd.length < 12)
                    Padding(
                      padding: EdgeInsets.only(top: 0.5.h, left: 1.w),
                      child: Text(
                        'Đã nhập ${p.cccd.length}/12 chữ số (cần thêm ${12 - p.cccd.length} số)',
                        style: TextStyle(
                          fontSize: Responsive.font(9),
                          color: const Color(0xFFB45309),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
            );
          });
        }),
      ],
    );
  }

  Widget _genderChip(PassengerFormItem item, String label) {
    return Obx(() {
      final isSelected = item.gender.value == label;
      return InkWell(
        onTap: () => item.gender.value = label,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 0.5.h),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.navy : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppColors.navy : const Color(0xFFCBD5E1),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: Responsive.font(9.5),
              fontWeight: FontWeight.w700,
              color: isSelected ? Colors.white : const Color(0xFF475569),
            ),
          ),
        ),
      );
    });
  }

  Widget _heading(String text) => Padding(
    padding: EdgeInsets.only(bottom: 1.2.h),
    child: Text(
      text,
      style: TextStyle(
        color: AppColors.primary,
        fontSize: Responsive.font(10),
        fontWeight: FontWeight.w800,
        letterSpacing: 0.5,
      ),
    ),
  );

  Widget _stepper(
    String title,
    String subtitle,
    RxInt value, {
    required bool Function(int) canDecrease,
    required bool Function() canIncrease,
    required VoidCallback onDecrease,
    required VoidCallback onIncrease,
  }) => Obx(
    () => Container(
      padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.h),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(Responsive.radius(12)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: Responsive.font(12),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: AppColors.muted,
                    fontSize: Responsive.font(9),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: canDecrease(value.value) ? onDecrease : null,
            icon: const Icon(
              Icons.remove_circle_outline_rounded,
              color: AppColors.muted,
            ),
          ),
          Text(
            '${value.value}',
            style: TextStyle(
              fontSize: Responsive.font(13),
              fontWeight: FontWeight.w700,
            ),
          ),
          IconButton(
            onPressed: canIncrease() ? onIncrease : null,
            icon: const Icon(
              Icons.add_circle_outline_rounded,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    ),
  );

  Widget _priceRow(String label, int value, {bool bold = false}) => Padding(
    padding: EdgeInsets.symmetric(vertical: 0.5.h),
    child: Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: bold ? Responsive.font(12) : Responsive.font(10.5),
              fontWeight: bold ? FontWeight.w800 : FontWeight.w500,
            ),
          ),
        ),
        Text(
          Formatters.currency(value),
          style: TextStyle(
            fontSize: bold ? Responsive.font(13) : Responsive.font(10.5),
            color: bold ? AppColors.primary : AppColors.text,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    ),
  );
}
