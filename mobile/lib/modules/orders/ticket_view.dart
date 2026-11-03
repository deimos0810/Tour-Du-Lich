import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';

import '../../core/controllers/app_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import 'ticket_controller.dart';

class TicketView extends GetView<TicketController> {
  const TicketView({super.key});

  String _norm(String? s) => (s ?? '').trim().toLowerCase();

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
        title: Text(
          'Vé điện tử & Thẻ lên đoàn',
          style: TextStyle(
            fontSize: Responsive.font(13.5),
            fontWeight: FontWeight.w800,
            color: const Color(0xFF0F172A),
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF0F172A),
                side: const BorderSide(color: Color(0xFFCBD5E1)),
                padding: const EdgeInsets.symmetric(horizontal: 10),
                minimumSize: Size.zero,
              ),
              onPressed: () => app.showAccountSwitcherSheet(context),
              icon: const Icon(Icons.swap_horiz_rounded, size: 15),
              label: Obx(
                () => Text(
                  '${app.currentRoleLabel} ⇄ Đổi TK',
                  style: TextStyle(
                    fontSize: Responsive.font(8.8),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ),
          IconButton(
            onPressed: controller.loadTicket,
            icon: const Icon(Icons.refresh_rounded, size: 20),
            tooltip: 'Tải lại vé',
          ),
        ],
      ),
      body: Obx(() {
        if (controller.loading.value && controller.ticket.value == null) {
          return const Center(child: CircularProgressIndicator());
        }
        final order = controller.ticket.value;
        if (order == null) {
          return Center(
            child: Padding(
              padding: EdgeInsets.all(8.w),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.warning_amber_rounded,
                    size: 36,
                    color: Color(0xFFBE123C),
                  ),
                  SizedBox(height: 1.5.h),
                  Text(
                    controller.errorMessage.value.isNotEmpty
                        ? controller.errorMessage.value
                        : 'Không tìm thấy thông tin vé điện tử.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.muted,
                      fontSize: Responsive.font(12),
                    ),
                  ),
                  SizedBox(height: 2.h),
                  FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                    ),
                    onPressed: controller.loadTicket,
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            ),
          );
        }

        final schedule =
            (order['LichKhoiHanh'] as Map<String, dynamic>?) ?? const {};
        final tour = (schedule['Tour'] as Map<String, dynamic>?) ?? const {};
        final customer =
            (order['KhachHang'] as Map<String, dynamic>?) ?? const {};
        final passengers =
            (order['ChiTietHanhKhach'] as List<dynamic>? ?? const [])
                .cast<Map<String, dynamic>>();

        final dptList = schedule['DieuPhoiTour'] as List<dynamic>? ?? const [];
        Map<String, dynamic>? hdvInfo;
        if (dptList.isNotEmpty) {
          final firstDpt = dptList.first as Map<String, dynamic>?;
          final hdv = firstDpt?['HuongDanVien'] as Map<String, dynamic>?;
          hdvInfo = hdv?['NhanVien'] as Map<String, dynamic>?;
        }

        final maDon = order['MaDon']?.toString() ?? controller.bookingCode;
        final trangThaiDon = order['TrangThaiDon']?.toString() ?? '';
        final isPaid =
            trangThaiDon == 'Da thanh toan' || trangThaiDon == 'Hoan thanh';
        final isCancelled = trangThaiDon == 'Da huy';
        final isGuideOrStaff = controller.isGuideOrStaff;

        final departDate =
            DateTime.tryParse(schedule['NgayKhoiHanh']?.toString() ?? '') ??
            DateTime.now();
        final endDate =
            DateTime.tryParse(schedule['NgayKetThuc']?.toString() ?? '') ??
            departDate;

        final tongTien =
            num.tryParse(order['TongTien']?.toString() ?? '0')?.round() ?? 0;
        final giamGia =
            num.tryParse(order['GiamGia']?.toString() ?? '0')?.round() ?? 0;
        final netPayable = (tongTien - giamGia).clamp(0, tongTien);

        final userNorm = _norm(controller.currentUserName);
        final khachHangNorm = _norm(customer['HoTen']?.toString());
        final targetNorm = userNorm.isNotEmpty ? userNorm : khachHangNorm;

        var myIdx = passengers.indexWhere((p) {
          final pNorm = _norm(p['HoTen']?.toString());
          return targetNorm.isNotEmpty &&
              (pNorm == targetNorm ||
                  pNorm.contains(targetNorm) ||
                  targetNorm.contains(pNorm));
        });
        if (myIdx < 0) myIdx = 0;

        final myPassenger = passengers.isNotEmpty ? passengers[myIdx] : null;
        final lanIp = order['lanIp']?.toString();
        final hostForQr = (lanIp != null && lanIp.isNotEmpty)
            ? 'http://$lanIp:3000'
            : 'http://localhost:3000';
        final qrDataUrl = myPassenger != null
            ? '$hostForQr/portal/ticket/$maDon?khach=${myPassenger['ChiTietID']}'
            : '$hostForQr/portal/ticket/$maDon';
        final myTicketCode =
            myPassenger?['MaQRVe']?.toString() ?? 'VT-$maDon-${myIdx + 1}';

        return RefreshIndicator(
          onRefresh: controller.loadTicket,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.fromLTRB(4.w, 1.5.h, 4.w, 4.h),
            children: [
              // ===============================================================
              // KHU VỰC DÀNH CHO HƯỚNG DẪN VIÊN: TẢI ẢNH VÉ QR LÊN ĐỂ ĐIỂM DANH
              // ===============================================================
              if (isGuideOrStaff)
                Container(
                  margin: EdgeInsets.only(bottom: 1.8.h),
                  padding: EdgeInsets.all(4.w),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: const Color(0xFF0F172A),
                      width: 1.5,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Icon(
                              Icons.qr_code_scanner_rounded,
                              color: Colors.white,
                              size: 18,
                            ),
                          ),
                          SizedBox(width: 2.5.w),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'CHẾ ĐỘ HƯỚNG DẪN VIÊN ĐÓN ĐOÀN',
                                  style: TextStyle(
                                    fontSize: Responsive.font(10.5),
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                Text(
                                  'Tải ảnh Vé QR khách hàng đã lưu lên để quét điểm danh tự động',
                                  style: TextStyle(
                                    fontSize: Responsive.font(9),
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 1.2.h),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF0F172A),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          onPressed: () => showUploadQrSheet(context),
                          icon: const Icon(
                            Icons.upload_file_rounded,
                            size: 18,
                          ),
                          label: Text(
                            'Tải ảnh Vé QR lên để quét điểm danh',
                            style: TextStyle(
                              fontSize: Responsive.font(11),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                      if (controller.uploadedQrTicket.value != null) ...[
                        SizedBox(height: 1.2.h),
                        _buildUploadedQrPreview(
                          controller.uploadedQrTicket.value!,
                        ),
                      ],
                    ],
                  ),
                ),

              // ===============================================================
              // THẺ CHỨNG TỪ VÉ ĐIỆN TỬ (ĐỒNG BỘ FORMAT BẢN WEB)
              // ===============================================================
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. HEADER CHỨNG TỪ TỐI GIẢN
                    Container(
                      padding: EdgeInsets.all(4.5.w),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        border: Border(
                          bottom: BorderSide(color: Color(0xFF0F172A), width: 2),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'VIETTOUR  |  BOARDING PASS',
                                style: TextStyle(
                                  fontSize: Responsive.font(10),
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.6,
                                  color: const Color(0xFF475569),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: isPaid
                                      ? const Color(0xFFF0FDF4)
                                      : isCancelled
                                      ? const Color(0xFFFFF1F2)
                                      : const Color(0xFFFFFBEB),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: isPaid
                                        ? const Color(0xFFBBF7D0)
                                        : isCancelled
                                        ? const Color(0xFFFECDD3)
                                        : const Color(0xFFFDE68A),
                                  ),
                                ),
                                child: Text(
                                  isPaid
                                      ? '✓ ĐÃ THANH TOÁN — VÉ HỢP LỆ'
                                      : isCancelled
                                      ? 'ĐÃ HỦY ĐƠN'
                                      : 'CHỜ THANH TOÁN (CHƯA XUẤT VÉ)',
                                  style: TextStyle(
                                    fontSize: Responsive.font(9),
                                    fontWeight: FontWeight.w800,
                                    color: isPaid
                                        ? const Color(0xFF15803D)
                                        : isCancelled
                                        ? const Color(0xFFBE123C)
                                        : const Color(0xFFB45309),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 1.h),
                          Text(
                            isPaid
                                ? 'VÉ ĐIỆN TỬ & THẺ LÊN ĐOÀN DU LỊCH'
                                : 'PHIẾU XÁC NHẬN GIỮ CHỖ TẠM THỜI',
                            style: TextStyle(
                              fontSize: Responsive.font(14.5),
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          SizedBox(height: 0.5.h),
                          Text(
                            'Mã đặt chỗ: $maDon',
                            style: TextStyle(
                              fontSize: Responsive.font(11),
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF334155),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // 2. THÔNG TIN TUYẾN HÀNH TRÌNH
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 4.5.w,
                        vertical: 2.h,
                      ),
                      decoration: const BoxDecoration(
                        color: Color(0xFFF8FAFC),
                        border: Border(
                          bottom: BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'ĐIỂM KHỞI HÀNH',
                                  style: TextStyle(
                                    fontSize: Responsive.font(9),
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                                SizedBox(height: 0.3.h),
                                Text(
                                  tour['DiemKhoiHanh']?.toString() ?? 'TP.HCM',
                                  style: TextStyle(
                                    fontSize: Responsive.font(13.5),
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                SizedBox(height: 0.3.h),
                                Text(
                                  'Đi: ${Formatters.date(departDate)}',
                                  style: TextStyle(
                                    fontSize: Responsive.font(10),
                                    color: const Color(0xFF475569),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 2.w),
                            child: Column(
                              children: [
                                Text(
                                  tour['ThoiGian']?.toString() ?? 'Trọn gói',
                                  style: TextStyle(
                                    fontSize: Responsive.font(9.5),
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                Container(
                                  width: 16.w,
                                  height: 1,
                                  margin:
                                      const EdgeInsets.symmetric(vertical: 4),
                                  color: const Color(0xFF94A3B8),
                                ),
                                Text(
                                  tour['PhuongTien']?.toString() ?? 'Máy bay',
                                  style: TextStyle(
                                    fontSize: Responsive.font(9),
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  'ĐIỂM ĐẾN',
                                  style: TextStyle(
                                    fontSize: Responsive.font(9),
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                                SizedBox(height: 0.3.h),
                                Text(
                                  tour['DiemDen']?.toString() ?? '',
                                  textAlign: TextAlign.right,
                                  style: TextStyle(
                                    fontSize: Responsive.font(13.5),
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                SizedBox(height: 0.3.h),
                                Text(
                                  'Về: ${Formatters.date(endDate)}',
                                  style: TextStyle(
                                    fontSize: Responsive.font(10),
                                    color: const Color(0xFF475569),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // 3. CHI TIẾT TOUR & NGƯỜI ĐẶT / HƯỚNG DẪN VIÊN
                    Padding(
                      padding: EdgeInsets.all(4.5.w),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tour['TenTour']?.toString() ?? 'Hành trình VietTour',
                            style: TextStyle(
                              fontSize: Responsive.font(14),
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          SizedBox(height: 0.6.h),
                          Text(
                            'Mã tour: ${tour['MaTour'] ?? ''}  •  Mã lịch: ${schedule['MaLich'] ?? ''}  •  Tổng khách: ${passengers.length}',
                            style: TextStyle(
                              fontSize: Responsive.font(10),
                              color: const Color(0xFF475569),
                            ),
                          ),
                          SizedBox(height: 1.5.h),

                          Container(
                            padding: EdgeInsets.all(3.5.w),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'TRƯỞNG ĐOÀN / NGƯỜI ĐẶT',
                                  style: TextStyle(
                                    fontSize: Responsive.font(9),
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                                SizedBox(height: 0.3.h),
                                Text(
                                  '${customer['HoTen'] ?? controller.currentUserName}  •  SĐT: ${customer['SoDienThoai'] ?? ''}',
                                  style: TextStyle(
                                    fontSize: Responsive.font(11),
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                const Divider(height: 18),
                                Text(
                                  'HƯỚNG DẪN VIÊN PHỤ TRÁCH ĐÓN ĐOÀN',
                                  style: TextStyle(
                                    fontSize: Responsive.font(9),
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                                SizedBox(height: 0.3.h),
                                Text(
                                  '${hdvInfo?['HoTen'] ?? 'Lê Hoàng Nam'}  •  Hotline: ${hdvInfo?['SoDienThoai'] ?? '0903 112 233'}',
                                  style: TextStyle(
                                    fontSize: Responsive.font(11),
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                SizedBox(height: 0.3.h),
                                Text(
                                  'Điểm tập trung: Ga Quốc Nội, Sân bay Quốc tế Tân Sơn Nhất, TP.HCM',
                                  style: TextStyle(
                                    fontSize: Responsive.font(10),
                                    color: const Color(0xFF475569),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          SizedBox(height: 1.5.h),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Tổng thanh toán: ${Formatters.currency(netPayable)}',
                                style: TextStyle(
                                  fontSize: Responsive.font(11.5),
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              Text(
                                isPaid
                                    ? 'Hình thức: ${order['PhuongThucTT'] ?? 'VNPay'}'
                                    : 'Chưa thanh toán',
                                style: TextStyle(
                                  fontSize: Responsive.font(10.5),
                                  fontWeight: FontWeight.w600,
                                  color: isPaid
                                      ? const Color(0xFF15803D)
                                      : const Color(0xFFB45309),
                                ),
                              ),
                            ],
                          ),

                          SizedBox(height: 2.h),

                          // 4. KHU VỰC MÃ QR CÁ NHÂN CỦA KHÁCH HÀNG + NÚT LƯU / TẢI ẢNH VÉ QR
                          if (isPaid && myPassenger != null)
                            Column(
                              children: [
                                RepaintBoundary(
                                  key: controller.qrBoundaryKey,
                                  child: Container(
                                    width: double.infinity,
                                    padding: EdgeInsets.all(4.w),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: const Color(0xFF0F172A),
                                        width: 1.4,
                                      ),
                                    ),
                                    child: Column(
                                      children: [
                                        Text(
                                          'MÃ QR VÉ ĐIỆN TỬ CÁ NHÂN CỦA BẠN',
                                          style: TextStyle(
                                            fontSize: Responsive.font(10.5),
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: 0.4,
                                            color: const Color(0xFF0F172A),
                                          ),
                                        ),
                                        SizedBox(height: 1.2.h),
                                        Container(
                                          padding: const EdgeInsets.all(10),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius:
                                                BorderRadius.circular(8),
                                            border: Border.all(
                                              color: const Color(0xFFE2E8F0),
                                            ),
                                          ),
                                          child: QrImageView(
                                            data: qrDataUrl,
                                            size: 46.w,
                                            backgroundColor: Colors.white,
                                            errorCorrectionLevel:
                                                QrErrorCorrectLevel.M,
                                          ),
                                        ),
                                        SizedBox(height: 1.h),
                                        Text(
                                          'Hành khách: ${myPassenger['HoTen'] ?? ''}',
                                          style: TextStyle(
                                            fontSize: Responsive.font(12.5),
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFF0F172A),
                                          ),
                                        ),
                                        SizedBox(height: 0.3.h),
                                        Text(
                                          'Mã vé: $myTicketCode${myPassenger['CCCD'] != null ? ' • CCCD: ${myPassenger['CCCD']}' : ''}',
                                          style: TextStyle(
                                            fontSize: Responsive.font(10.5),
                                            fontWeight: FontWeight.w600,
                                            color: const Color(0xFF334155),
                                          ),
                                        ),
                                        SizedBox(height: 0.8.h),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 10,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color:
                                                (myPassenger['TrangThaiDiemDanh'] ==
                                                    1)
                                                ? const Color(0xFFF0FDF4)
                                                : const Color(0xFFF1F5F9),
                                            borderRadius:
                                                BorderRadius.circular(6),
                                            border: Border.all(
                                              color:
                                                  (myPassenger['TrangThaiDiemDanh'] ==
                                                      1)
                                                  ? const Color(0xFFBBF7D0)
                                                  : const Color(0xFFCBD5E1),
                                            ),
                                          ),
                                          child: Text(
                                            (myPassenger['TrangThaiDiemDanh'] ==
                                                    1)
                                                ? '✓ Đã điểm danh lên đoàn'
                                                : 'Chưa điểm danh',
                                            style: TextStyle(
                                              fontSize: Responsive.font(10),
                                              fontWeight: FontWeight.w700,
                                              color:
                                                  (myPassenger['TrangThaiDiemDanh'] ==
                                                      1)
                                                  ? const Color(0xFF15803D)
                                                  : const Color(0xFF475569),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                SizedBox(height: 1.2.h),

                                // NÚT LƯU / TẢI ẢNH VÉ QR VỀ MÁY
                                SizedBox(
                                  width: double.infinity,
                                  child: FilledButton.icon(
                                    style: FilledButton.styleFrom(
                                      backgroundColor: const Color(0xFF0F172A),
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 12,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    onPressed: controller.savingQr.value
                                        ? null
                                        : () async {
                                            final saved = await controller
                                                .savePassengerQrImage(
                                                  maDon: maDon,
                                                  passenger: myPassenger,
                                                  tenTour:
                                                      tour['TenTour']
                                                          ?.toString() ??
                                                      'Tour VietTour',
                                                  ngayKhoiHanh: Formatters.date(
                                                    departDate,
                                                  ),
                                                  qrDataUrl: qrDataUrl,
                                                  ticketCode: myTicketCode,
                                                );
                                            if (saved != null &&
                                                context.mounted) {
                                              _showSavedQrDialog(
                                                context,
                                                saved,
                                                app,
                                              );
                                            }
                                          },
                                    icon: const Icon(
                                      Icons.download_rounded,
                                      size: 18,
                                    ),
                                    label: Text(
                                      controller.savingQr.value
                                          ? 'Đang lưu ảnh Vé QR...'
                                          : 'Lưu / Tải ảnh Vé QR về máy',
                                      style: TextStyle(
                                        fontSize: Responsive.font(11),
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                ),
                                SizedBox(height: 0.8.h),
                                Text(
                                  'Sau khi lưu ảnh Vé QR, bạn có thể bấm "Đổi TK" ở góc trên bên phải sang tài khoản Hướng dẫn viên để tải ảnh lên và quét điểm danh.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: Responsive.font(9.2),
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            )
                          else if (!isPaid)
                            Container(
                              width: double.infinity,
                              padding: EdgeInsets.all(4.w),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: const Color(0xFFCBD5E1),
                                ),
                              ),
                              child: Column(
                                children: [
                                  const Icon(
                                    Icons.lock_outline_rounded,
                                    color: Color(0xFF475569),
                                  ),
                                  SizedBox(height: 0.8.h),
                                  Text(
                                    'Chưa cấp Mã QR Vé Điện Tử',
                                    style: TextStyle(
                                      fontSize: Responsive.font(12),
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                  SizedBox(height: 0.4.h),
                                  Text(
                                    'Đơn đặt chỗ đang ở trạng thái Chờ thanh toán. Vé điện tử và mã QR chỉ được kích hoạt sau khi thanh toán thành công.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: Responsive.font(10),
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),

                    // 5. DANH SÁCH HÀNH KHÁCH TRONG ĐƠN
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(4.5.w),
                      decoration: const BoxDecoration(
                        color: Color(0xFFF8FAFC),
                        border: Border(
                          top: BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Danh sách hành khách đăng ký (${passengers.length} khách)',
                            style: TextStyle(
                              fontSize: Responsive.font(12),
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          SizedBox(height: 0.4.h),
                          Text(
                            isGuideOrStaff
                                ? 'Chế độ Hướng dẫn viên: Tải ảnh QR hoặc bấm xác nhận điểm danh trực tiếp'
                                : 'Vé của hành khách đi cùng đã được khóa mã QR để chống điểm danh hộ',
                            style: TextStyle(
                              fontSize: Responsive.font(9.5),
                              color: const Color(0xFF64748B),
                            ),
                          ),
                          SizedBox(height: 1.2.h),
                          ...List.generate(passengers.length, (idx) {
                            final p = passengers[idx];
                            final isMe = idx == myIdx;
                            final canViewTicket = isGuideOrStaff || isMe;
                            final checkedIn = p['TrangThaiDiemDanh'] == 1;
                            final chiTietId =
                                (p['ChiTietID'] as num?)?.toInt() ?? 0;

                            return Container(
                              margin: EdgeInsets.only(bottom: 1.h),
                              padding: EdgeInsets.all(3.2.w),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isMe
                                      ? const Color(0xFF0F172A)
                                      : const Color(0xFFE2E8F0),
                                  width: isMe ? 1.4 : 1,
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          '${idx + 1}. ${p['HoTen'] ?? 'Hành khách'} (${p['LoaiKhach'] == 'Nguoi lon' ? 'Người lớn' : 'Trẻ em'})',
                                          style: TextStyle(
                                            fontSize: Responsive.font(11.5),
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF0F172A),
                                          ),
                                        ),
                                      ),
                                      if (isMe)
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 6,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF0F172A),
                                            borderRadius: BorderRadius.circular(
                                              4,
                                            ),
                                          ),
                                          child: Text(
                                            'Vé của bạn',
                                            style: TextStyle(
                                              fontSize: Responsive.font(8.5),
                                              fontWeight: FontWeight.w700,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                  SizedBox(height: 0.5.h),
                                  if (canViewTicket)
                                    Text(
                                      'Mã vé: ${p['MaQRVe'] ?? 'VT-$maDon-${idx + 1}'}${p['CCCD'] != null ? ' • CCCD: ${p['CCCD']}' : ''}',
                                      style: TextStyle(
                                        fontSize: Responsive.font(10),
                                        color: const Color(0xFF334155),
                                      ),
                                    )
                                  else
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.lock_outline_rounded,
                                          size: 13,
                                          color: Color(0xFF64748B),
                                        ),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            'Mã QR cá nhân đã khóa (Chống điểm danh hộ)',
                                            style: TextStyle(
                                              fontSize: Responsive.font(9.5),
                                              color: const Color(0xFF64748B),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  SizedBox(height: 0.8.h),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      if (checkedIn)
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF0FDF4),
                                            borderRadius: BorderRadius.circular(
                                              6,
                                            ),
                                            border: Border.all(
                                              color: const Color(0xFFBBF7D0),
                                            ),
                                          ),
                                          child: Text(
                                            '✓ Đã điểm danh lên đoàn',
                                            style: TextStyle(
                                              fontSize: Responsive.font(9.5),
                                              fontWeight: FontWeight.w700,
                                              color: const Color(0xFF15803D),
                                            ),
                                          ),
                                        )
                                      else if (isGuideOrStaff && isPaid)
                                        FilledButton.icon(
                                          style: FilledButton.styleFrom(
                                            backgroundColor: const Color(
                                              0xFF0F172A,
                                            ),
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 6,
                                            ),
                                          ),
                                          onPressed:
                                              controller.checkingInId.value ==
                                                  chiTietId
                                              ? null
                                              : () =>
                                                    controller.checkInPassenger(
                                                      chiTietId,
                                                    ),
                                          icon: const Icon(
                                            Icons.verified_user_outlined,
                                            size: 14,
                                          ),
                                          label: Text(
                                            controller.checkingInId.value ==
                                                    chiTietId
                                                ? 'Đang xử lý...'
                                                : 'Điểm danh khách này',
                                            style: TextStyle(
                                              fontSize: Responsive.font(9.5),
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        )
                                      else
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF1F5F9),
                                            borderRadius: BorderRadius.circular(
                                              6,
                                            ),
                                          ),
                                          child: Text(
                                            'Chưa điểm danh',
                                            style: TextStyle(
                                              fontSize: Responsive.font(9.5),
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF475569),
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildUploadedQrPreview(Map<String, dynamic> qr) {
    final imgBase64 = (qr['imageBase64'] ?? '').toString();
    return Container(
      padding: EdgeInsets.all(3.w),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Row(
        children: [
          if (imgBase64.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: Image.memory(
                base64Decode(imgBase64),
                width: 16.w,
                height: 16.w,
                fit: BoxFit.contain,
              ),
            )
          else
            const Icon(
              Icons.qr_code_2_rounded,
              size: 44,
              color: Color(0xFF15803D),
            ),
          SizedBox(width: 3.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '✓ ĐÃ ĐỌC ẢNH VÉ QR & ĐIỂM DANH',
                  style: TextStyle(
                    fontSize: Responsive.font(9.5),
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF15803D),
                  ),
                ),
                SizedBox(height: 0.3.h),
                Text(
                  'Khách: ${qr['hoTen'] ?? ''} (${qr['maDon'] ?? ''})',
                  style: TextStyle(
                    fontSize: Responsive.font(10.5),
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                Text(
                  'Mã vé: ${qr['maQRVe'] ?? ''}',
                  style: TextStyle(
                    fontSize: Responsive.font(9.2),
                    color: const Color(0xFF334155),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showSavedQrDialog(
    BuildContext context,
    Map<String, dynamic> saved,
    AppController app,
  ) {
    final imgBase64 = (saved['imageBase64'] ?? '').toString();
    showDialog<void>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Row(
          children: [
            const Icon(
              Icons.check_circle_rounded,
              color: Color(0xFF15803D),
              size: 22,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Đã lưu ảnh Vé QR vào máy',
                style: TextStyle(
                  fontSize: Responsive.font(13.5),
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (imgBase64.isNotEmpty)
              Container(
                constraints: BoxConstraints(maxHeight: 28.h),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Image.memory(
                  base64Decode(imgBase64),
                  fit: BoxFit.contain,
                ),
              ),
            SizedBox(height: 1.2.h),
            Text(
              'Tệp đã lưu: ${saved['fileName'] ?? 'VT_QR.png'}',
              style: TextStyle(
                fontSize: Responsive.font(10.5),
                fontWeight: FontWeight.w700,
                color: const Color(0xFF0F172A),
              ),
            ),
            SizedBox(height: 0.4.h),
            Text(
              'Hành khách: ${saved['hoTen'] ?? ''} • Mã đơn: ${saved['maDon'] ?? ''}',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: Responsive.font(9.5),
                color: const Color(0xFF475569),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('Đóng'),
          ),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
            ),
            onPressed: () async {
              Navigator.of(dialogCtx).pop();
              await app.switchToAccount('hdv.nam@viettour.vn');
            },
            icon: const Icon(Icons.swap_horiz_rounded, size: 16),
            label: Text(
              'Chuyển sang TK HDV để quét ngay',
              style: TextStyle(
                fontSize: Responsive.font(9.8),
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Future<void> showUploadQrSheet(BuildContext context) async {
    final ctrl = Get.isRegistered<TicketController>()
        ? Get.find<TicketController>()
        : Get.put(TicketController());
    await ctrl.refreshSavedQrList();
    if (!context.mounted) return;

    final manualInput = TextEditingController();

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
          padding: EdgeInsets.only(
            left: 5.w,
            right: 5.w,
            top: 1.8.h,
            bottom: MediaQuery.of(sheetCtx).viewInsets.bottom + 2.5.h,
          ),
          child: Obx(() {
            final list = ctrl.savedQrList;
            return SingleChildScrollView(
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
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Tải ảnh Vé QR lên để Điểm danh',
                              style: TextStyle(
                                fontSize: Responsive.font(14.5),
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                            SizedBox(height: 0.3.h),
                            Text(
                              'Chọn ảnh Vé QR khách hàng đã lưu trên thiết bị để xác thực & điểm danh lên đoàn',
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

                  if (list.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(4.w),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        children: [
                          const Icon(
                            Icons.photo_library_outlined,
                            color: Color(0xFF64748B),
                            size: 32,
                          ),
                          SizedBox(height: 0.8.h),
                          Text(
                            'Chưa có ảnh Vé QR nào được lưu trên thiết bị',
                            style: TextStyle(
                              fontSize: Responsive.font(11),
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          SizedBox(height: 0.4.h),
                          Text(
                            'Hãy mở vé ở tài khoản Khách hàng và bấm "Lưu / Tải ảnh Vé QR về máy", hoặc nhập mã vé / mã đơn bên dưới.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: Responsive.font(9.5),
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    )
                  else ...[
                    Text(
                      'ẢNH VÉ QR ĐÃ LƯU TRÊN THIẾT BỊ (${list.length} ẢNH):',
                      style: TextStyle(
                        fontSize: Responsive.font(9.5),
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF475569),
                      ),
                    ),
                    SizedBox(height: 1.h),
                    ConstrainedBox(
                      constraints: BoxConstraints(maxHeight: 40.h),
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: list.length,
                        separatorBuilder: (_, _) => SizedBox(height: 1.h),
                        itemBuilder: (_, idx) {
                          final item = list[idx];
                          final imgBase64 =
                              (item['imageBase64'] ?? '').toString();
                          final checked = item['trangThaiDiemDanh'] == 1;
                          return Container(
                            padding: EdgeInsets.all(3.w),
                            decoration: BoxDecoration(
                              color: checked
                                  ? const Color(0xFFF0FDF4)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: checked
                                    ? const Color(0xFFBBF7D0)
                                    : const Color(0xFFCBD5E1),
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 15.w,
                                  height: 15.w,
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                      color: const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: imgBase64.isNotEmpty
                                      ? Image.memory(
                                          base64Decode(imgBase64),
                                          fit: BoxFit.contain,
                                        )
                                      : const Icon(
                                          Icons.qr_code_2_rounded,
                                          size: 32,
                                          color: Color(0xFF0F172A),
                                        ),
                                ),
                                SizedBox(width: 3.w),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${item['hoTen'] ?? 'Hành khách'}',
                                        style: TextStyle(
                                          fontSize: Responsive.font(11.5),
                                          fontWeight: FontWeight.w800,
                                          color: const Color(0xFF0F172A),
                                        ),
                                      ),
                                      Text(
                                        'Mã đơn: ${item['maDon'] ?? ''} • ${item['fileName'] ?? 'VT_QR.png'}',
                                        style: TextStyle(
                                          fontSize: Responsive.font(9.2),
                                          color: const Color(0xFF475569),
                                        ),
                                      ),
                                      Text(
                                        'Mã vé: ${item['maQRVe'] ?? ''}',
                                        style: TextStyle(
                                          fontSize: Responsive.font(9.2),
                                          color: const Color(0xFF64748B),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                FilledButton(
                                  style: FilledButton.styleFrom(
                                    backgroundColor: checked
                                        ? const Color(0xFF15803D)
                                        : const Color(0xFF0F172A),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 8,
                                    ),
                                    minimumSize: Size.zero,
                                  ),
                                  onPressed: () async {
                                    Navigator.of(sheetCtx).pop();
                                    await ctrl.loadAndCheckInFromSavedQr(item);
                                  },
                                  child: Text(
                                    checked
                                        ? '✓ Đã điểm danh'
                                        : 'Tải lên & Quét',
                                    style: TextStyle(
                                      fontSize: Responsive.font(9.2),
                                      fontWeight: FontWeight.w700,
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

                  SizedBox(height: 1.8.h),
                  Text(
                    'HOẶC NHẬP MÃ VÉ QR / ĐƯỜNG DẪN QR:',
                    style: TextStyle(
                      fontSize: Responsive.font(9.2),
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF475569),
                    ),
                  ),
                  SizedBox(height: 0.8.h),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: manualInput,
                          decoration: const InputDecoration(
                            hintText: 'VD: VT-BK-24235665-3-2369 hoặc BK-...',
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      FilledButton(
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                        ),
                        onPressed: () async {
                          final val = manualInput.text.trim();
                          if (val.isEmpty) return;
                          Navigator.of(sheetCtx).pop();
                          await ctrl.loadAndCheckInFromSavedQr({
                            'qrDataUrl': val,
                            'maQRVe': val,
                            'hoTen': 'Hành khách',
                          });
                        },
                        child: const Text('Quét'),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ),
      ),
    );
  }
}
