import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:sizer/sizer.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/controllers/app_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/app_network_image.dart';
import '../../data/models/guide_schedule_model.dart';
import 'guide_qr_scanner_view.dart';
import 'guide_schedule_controller.dart';

class GuideScheduleView extends StatelessWidget {
  const GuideScheduleView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(GuideScheduleController());

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context, controller),
            _buildFilterTabs(controller),
            Expanded(
              child: Obx(() {
                if (controller.loading.value && controller.allSchedules.isEmpty) {
                  return const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  );
                }
                if (controller.errorMessage.value.isNotEmpty &&
                    controller.allSchedules.isEmpty) {
                  return _buildErrorView(controller);
                }
                final list = controller.filteredSchedules;
                if (list.isEmpty) {
                  return _buildEmptyView(controller);
                }
                return RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: controller.loadSchedule,
                  child: ListView.builder(
                    padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.5.h),
                    itemCount: list.length,
                    itemBuilder: (context, index) =>
                        _buildScheduleCard(context, controller, list[index]),
                  ),
                );
              }),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(
    BuildContext context,
    GuideScheduleController controller,
  ) {
    final app = Get.find<AppController>();
    return Container(
      padding: EdgeInsets.fromLTRB(4.w, 1.5.h, 4.w, 1.5.h),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 12.w,
                height: 12.w,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                  ),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.badge_outlined,
                  color: Colors.white,
                  size: 22,
                ),
              ),
              SizedBox(width: 3.w),
              Expanded(
                child: Obx(() {
                  final guide = controller.guideInfo.value;
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              guide?.fullName ?? 'Hướng dẫn viên',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: Responsive.font(13),
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          SizedBox(width: 1.5.w),
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: 2.w,
                              vertical: 0.3.h,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: const Color(0xFFBFDBFE)),
                            ),
                            child: const Text(
                              'HDV',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF1D4ED8),
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 0.3.h),
                      Text(
                        'Số thẻ: ${guide?.cardCode ?? "HDV-VIETTOUR"} • ${guide?.languages ?? "Tiếng Việt"}',
                        style: TextStyle(
                          fontSize: Responsive.font(9.5),
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  );
                }),
              ),
              app.buildNotificationBellButton(context),
              IconButton(
                onPressed: () async {
                  await Get.to(() => const GuideQrScannerView());
                  // Quay lại từ màn quét → tải lại tiến độ điểm danh ngay
                  if (Get.isRegistered<GuideScheduleController>()) {
                    Get.find<GuideScheduleController>().loadSchedule();
                  }
                },
                tooltip: 'Quét QR soát vé',
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.qr_code_scanner_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTabs(GuideScheduleController controller) {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.h),
      child: Obx(() {
        return Row(
          children: GuideScheduleController.filterTabs.map((tab) {
            final isSelected = controller.selectedFilter.value == tab;
            int count = 0;
            if (tab == 'Tất cả') {
              count = controller.allSchedules.length;
            } else if (tab == 'Chờ xác nhận') {
              count = controller.allSchedules.where((s) => s.isPending).length;
            } else if (tab == 'Đã xác nhận') {
              count = controller.allSchedules.where((s) => s.isConfirmed).length;
            }

            return Padding(
              padding: EdgeInsets.only(right: 2.w),
              child: FilterChip(
                label: Text('$tab ($count)'),
                selected: isSelected,
                onSelected: (_) => controller.selectedFilter.value = tab,
                selectedColor: const Color(0xFF0F172A),
                backgroundColor: const Color(0xFFF1F5F9),
                labelStyle: TextStyle(
                  fontSize: Responsive.font(9.5),
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? Colors.white : const Color(0xFF475569),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: BorderSide.none,
                ),
                showCheckmark: false,
              ),
            );
          }).toList(),
        );
      }),
    );
  }

  Widget _buildScheduleCard(
    BuildContext context,
    GuideScheduleController controller,
    GuideScheduleItemModel item,
  ) {
    final dateFormat = DateFormat('dd/MM/yyyy');
    final timeFormat = DateFormat('HH:mm');

    return Container(
      margin: EdgeInsets.only(bottom: 2.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha((255 * 0.03).round()),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Card Header
          Container(
            padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.2.h),
            decoration: const BoxDecoration(
              color: Color(0xFFF8FAFC),
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
              border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.confirmation_number_outlined,
                      size: 16,
                      color: Color(0xFF64748B),
                    ),
                    SizedBox(width: 1.5.w),
                    Text(
                      item.departureCode,
                      style: TextStyle(
                        fontSize: Responsive.font(10),
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF334155),
                      ),
                    ),
                  ],
                ),
                _buildStatusBadge(item.status),
              ],
            ),
          ),

          // Tour info row
          Padding(
            padding: EdgeInsets.all(4.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: SizedBox(
                        width: 22.w,
                        height: 22.w,
                        child: AppNetworkImage(
                          url: item.imageUrl,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    SizedBox(width: 3.5.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.tourName,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: Responsive.font(11.5),
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                              height: 1.3,
                            ),
                          ),
                          SizedBox(height: 0.8.h),
                          Row(
                            children: [
                              const Icon(
                                Icons.timelapse_outlined,
                                size: 14,
                                color: Color(0xFF64748B),
                              ),
                              SizedBox(width: 1.w),
                              Text(
                                item.duration,
                                style: TextStyle(
                                  fontSize: Responsive.font(9.5),
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                              SizedBox(width: 2.w),
                              const Icon(
                                Icons.location_on_outlined,
                                size: 14,
                                color: Color(0xFF64748B),
                              ),
                              SizedBox(width: 1.w),
                              Flexible(
                                child: Text(
                                  item.destination,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: Responsive.font(9.5),
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                SizedBox(height: 1.8.h),
                Container(
                  padding: EdgeInsets.all(3.w),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFEDF2F7)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Khởi hành',
                            style: TextStyle(
                              fontSize: 10,
                              color: Color(0xFF94A3B8),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          SizedBox(height: 0.3.h),
                          Text(
                            '${timeFormat.format(item.departureDate)} - ${dateFormat.format(item.departureDate)}',
                            style: TextStyle(
                              fontSize: Responsive.font(9.5),
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                      const Icon(
                        Icons.arrow_forward_rounded,
                        size: 16,
                        color: Color(0xFF94A3B8),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text(
                            'Kết thúc',
                            style: TextStyle(
                              fontSize: 10,
                              color: Color(0xFF94A3B8),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          SizedBox(height: 0.3.h),
                          Text(
                            dateFormat.format(item.returnDate),
                            style: TextStyle(
                              fontSize: Responsive.font(9.5),
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                SizedBox(height: 1.5.h),
                // Guest stats
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.group_outlined,
                          size: 16,
                          color: Color(0xFF0284C7),
                        ),
                        SizedBox(width: 1.5.w),
                        Text(
                          'Tổng đoàn: ${item.totalGuests} khách',
                          style: TextStyle(
                            fontSize: Responsive.font(10),
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0284C7),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      'Đã điểm danh: ${item.checkedInGuests}/${item.totalGuests}',
                      style: TextStyle(
                        fontSize: Responsive.font(10),
                        fontWeight: FontWeight.w600,
                        color: item.checkedInGuests == item.totalGuests && item.totalGuests > 0
                            ? const Color(0xFF10B981)
                            : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Action Buttons: 3 Modern Distinct Buttons
          Container(
            padding: EdgeInsets.fromLTRB(3.5.w, 0, 3.5.w, 1.8.h),
            child: Column(
              children: [
                if (item.isPending) ...[
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => controller.confirmAssignment(item),
                      icon: const Icon(Icons.check_circle_outline, size: 16),
                      label: const Text('Xác Nhận Nhận Chuyến Tour'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: EdgeInsets.symmetric(vertical: 1.2.h),
                      ),
                    ),
                  ),
                  SizedBox(height: 1.h),
                ],
                Row(
                  children: [
                    // Button 1: Danh sách đoàn
                    Expanded(
                      flex: 10,
                      child: OutlinedButton.icon(
                        onPressed: () => _openPassengerSheet(context, controller, item),
                        icon: const Icon(Icons.people_alt_outlined, size: 14),
                        label: Text(
                          'Đoàn (${item.totalGuests})',
                          style: TextStyle(
                            fontSize: Responsive.font(8.8),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF0F172A),
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          padding: EdgeInsets.symmetric(vertical: 1.1.h, horizontal: 1.w),
                        ),
                      ),
                    ),
                    SizedBox(width: 1.5.w),
                    // Button 2: Dịch vụ NCC
                    Expanded(
                      flex: 11,
                      child: OutlinedButton.icon(
                        onPressed: () => _openAttachedServicesSheet(context, item),
                        icon: const Icon(Icons.hotel_outlined, size: 14),
                        label: Text(
                          'Dịch vụ (${item.attachedServices.length})',
                          style: TextStyle(
                            fontSize: Responsive.font(8.8),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF0F172A),
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          padding: EdgeInsets.symmetric(vertical: 1.1.h, horizontal: 1.w),
                        ),
                      ),
                    ),
                    SizedBox(width: 1.5.w),
                    // Button 3: Quét vé QR
                    Expanded(
                      flex: 10,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          await Get.to(() => GuideQrScannerView(schedule: item));
                          if (Get.isRegistered<GuideScheduleController>()) {
                            Get.find<GuideScheduleController>().loadSchedule();
                          }
                        },
                        icon: const Icon(Icons.qr_code_scanner_rounded, size: 14),
                        label: Text(
                          'Soát vé',
                          style: TextStyle(
                            fontSize: Responsive.font(8.8),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          padding: EdgeInsets.symmetric(vertical: 1.1.h, horizontal: 1.w),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg = const Color(0xFFFEF3C7);
    Color text = const Color(0xFFD97706);
    String label = 'Chờ xác nhận';

    if (status == 'Da xac nhan') {
      bg = const Color(0xFFD1FAE5);
      text = const Color(0xFF059669);
      label = 'Đã nhận đoàn';
    } else if (status == 'Tu choi') {
      bg = const Color(0xFFFEE2E2);
      text = const Color(0xFFDC2626);
      label = 'Đã từ chối';
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 2.5.w, vertical: 0.4.h),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: text,
        ),
      ),
    );
  }

  void _openPassengerSheet(
    BuildContext context,
    GuideScheduleController controller,
    GuideScheduleItemModel item,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        height: 80.h,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.all(4.w),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Danh sách đoàn (${item.passengers.length} khách)',
                        style: TextStyle(
                          fontSize: Responsive.font(13),
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      SizedBox(height: 0.3.h),
                      Text(
                        'Mã lịch: ${item.departureCode}',
                        style: TextStyle(
                          fontSize: Responsive.font(9.5),
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
            ),
            Expanded(
              child: item.passengers.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.person_off_outlined,
                              size: 40, color: Color(0xFF94A3B8)),
                          SizedBox(height: 1.h),
                          const Text('Chưa có hành khách đặt lịch này'),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: EdgeInsets.all(4.w),
                      itemCount: item.passengers.length,
                      separatorBuilder: (_, _) => const Divider(height: 1),
                      itemBuilder: (context, idx) {
                        final pax = item.passengers[idx];
                        return Padding(
                          padding: EdgeInsets.symmetric(vertical: 1.2.h),
                          child: Row(
                            children: [
                              Checkbox(
                                value: pax.isCheckedIn,
                                activeColor: const Color(0xFF10B981),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                onChanged: pax.isCheckedIn
                                    ? null
                                    : (_) {
                                        controller.togglePax(item, pax);
                                        Navigator.pop(context);
                                      },
                              ),
                              SizedBox(width: 1.w),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          pax.fullName,
                                          style: TextStyle(
                                            fontSize: Responsive.font(11),
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF0F172A),
                                          ),
                                        ),
                                        SizedBox(width: 2.w),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 6,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF1F5F9),
                                            borderRadius:
                                                BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            pax.guestType,
                                            style: const TextStyle(
                                              fontSize: 9,
                                              color: Color(0xFF475569),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: 0.4.h),
                                    Text(
                                      'CCCD: ${pax.identityCode.isNotEmpty ? pax.identityCode : "Chưa cập nhật"} • Đơn: ${pax.orderCode}',
                                      style: TextStyle(
                                        fontSize: Responsive.font(9),
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (pax.customerPhone.isNotEmpty)
                                IconButton(
                                  onPressed: () => launchUrl(
                                    Uri.parse('tel:${pax.customerPhone}'),
                                  ),
                                  icon: Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFEFF6FF),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.phone,
                                      size: 16,
                                      color: Color(0xFF2563EB),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _openAttachedServicesSheet(
    BuildContext context,
    GuideScheduleItemModel item,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        height: 75.h,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.all(4.w),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Dịch vụ đi kèm đoàn (Nhà xe, KS)',
                          style: TextStyle(
                            fontSize: Responsive.font(13),
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        SizedBox(height: 0.3.h),
                        Text(
                          '${item.departureCode} • ${item.tourName}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: Responsive.font(9.5),
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
            ),
            Expanded(
              child: item.attachedServices.isEmpty
                  ? Center(
                      child: Padding(
                        padding: EdgeInsets.all(6.w),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.room_service_outlined,
                              size: 48,
                              color: Color(0xFF94A3B8),
                            ),
                            SizedBox(height: 1.5.h),
                            const Text(
                              'Chưa có phiếu đặt dịch vụ riêng lẻ',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF475569),
                              ),
                            ),
                            SizedBox(height: 0.8.h),
                            Text(
                              'Dịch vụ trọn gói tiêu chuẩn theo tour:\n• Khởi hành: ${item.departurePoint}\n• Điểm đến: ${item.destination}\n• Phương tiện: Xe du lịch đưa đón & HDV suốt tuyến.',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF64748B),
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: EdgeInsets.all(4.w),
                      itemCount: item.attachedServices.length,
                      itemBuilder: (context, idx) {
                        final svc = item.attachedServices[idx];
                        IconData iconData = Icons.business_outlined;
                        Color iconBg = const Color(0xFFEFF6FF);
                        Color iconColor = const Color(0xFF2563EB);

                        final typeLower = svc.supplierType.toLowerCase();
                        if (typeLower.contains('khách sạn') || typeLower.contains('lưu trú')) {
                          iconData = Icons.hotel_rounded;
                          iconBg = const Color(0xFFF3E8FF);
                          iconColor = const Color(0xFF9333EA);
                        } else if (typeLower.contains('xe') || typeLower.contains('vận chuyển')) {
                          iconData = Icons.directions_bus_rounded;
                          iconBg = const Color(0xFFFEF3C7);
                          iconColor = const Color(0xFFD97706);
                        } else if (typeLower.contains('nhà hàng') || typeLower.contains('ăn')) {
                          iconData = Icons.restaurant_rounded;
                          iconBg = const Color(0xFFDCFCE7);
                          iconColor = const Color(0xFF10B981);
                        }

                        return Container(
                          margin: EdgeInsets.only(bottom: 1.8.h),
                          padding: EdgeInsets.all(3.5.w),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 10.w,
                                    height: 10.w,
                                    decoration: BoxDecoration(
                                      color: iconBg,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(iconData, color: iconColor, size: 20),
                                  ),
                                  SizedBox(width: 3.w),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          svc.supplierName,
                                          style: TextStyle(
                                            fontSize: Responsive.font(11.5),
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF0F172A),
                                          ),
                                        ),
                                        SizedBox(height: 0.3.h),
                                        Text(
                                          '${svc.supplierType} • Phiếu: ${svc.code}',
                                          style: TextStyle(
                                            fontSize: Responsive.font(9),
                                            color: const Color(0xFF64748B),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (svc.supplierPhone.isNotEmpty)
                                    IconButton(
                                      onPressed: () => launchUrl(
                                        Uri.parse('tel:${svc.supplierPhone}'),
                                      ),
                                      icon: Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: const BoxDecoration(
                                          color: Color(0xFFDCFCE7),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.phone,
                                          size: 16,
                                          color: Color(0xFF10B981),
                                        ),
                                      ),
                                      tooltip: 'Gọi nhà cung cấp',
                                    ),
                                ],
                              ),
                              if (svc.supplierAddress.isNotEmpty) ...[
                                SizedBox(height: 1.2.h),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(
                                      Icons.location_on_outlined,
                                      size: 15,
                                      color: Color(0xFF64748B),
                                    ),
                                    SizedBox(width: 1.5.w),
                                    Expanded(
                                      child: Text(
                                        svc.supplierAddress,
                                        style: TextStyle(
                                          fontSize: Responsive.font(9.5),
                                          color: const Color(0xFF475569),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                              if (svc.serviceDetails.isNotEmpty) ...[
                                SizedBox(height: 1.h),
                                Container(
                                  width: double.infinity,
                                  padding: EdgeInsets.all(2.5.w),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: svc.serviceDetails
                                        .map((d) => Padding(
                                              padding: const EdgeInsets.symmetric(vertical: 2),
                                              child: Row(
                                                children: [
                                                  const Icon(
                                                    Icons.check_circle_outline,
                                                    size: 13,
                                                    color: Color(0xFF0284C7),
                                                  ),
                                                  SizedBox(width: 1.5.w),
                                                  Expanded(
                                                    child: Text(
                                                      d,
                                                      style: TextStyle(
                                                        fontSize: Responsive.font(9.5),
                                                        fontWeight: FontWeight.w600,
                                                        color: const Color(0xFF1E293B),
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ))
                                        .toList(),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyView(GuideScheduleController controller) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.assignment_turned_in_outlined,
            size: 56,
            color: Color(0xFF94A3B8),
          ),
          SizedBox(height: 1.5.h),
          const Text(
            'Chưa có lịch phân công nào',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Color(0xFF475569),
            ),
          ),
          SizedBox(height: 0.8.h),
          const Text(
            'Admin trên Web sẽ phân công tour cho bạn khi có đoàn khởi hành.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
          ),
          SizedBox(height: 2.h),
          ElevatedButton.icon(
            onPressed: controller.loadSchedule,
            icon: const Icon(Icons.refresh, size: 16),
            label: const Text('Tải lại lịch'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView(GuideScheduleController controller) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          SizedBox(height: 1.5.h),
          Text(
            controller.errorMessage.value,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
          ),
          SizedBox(height: 2.h),
          ElevatedButton(
            onPressed: controller.loadSchedule,
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }
}
