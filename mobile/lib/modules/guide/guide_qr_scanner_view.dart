import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:sizer/sizer.dart';

import '../../core/utils/responsive.dart';
import '../../data/models/guide_schedule_model.dart';
import 'guide_schedule_controller.dart';

class GuideQrScannerView extends StatefulWidget {
  final GuideScheduleItemModel? schedule;

  const GuideQrScannerView({super.key, this.schedule});

  @override
  State<GuideQrScannerView> createState() => _GuideQrScannerViewState();
}

class _GuideQrScannerViewState extends State<GuideQrScannerView>
    with SingleTickerProviderStateMixin {
  late final MobileScannerController _scannerController;
  late final AnimationController _animController;
  late final Animation<double> _laserAnimation;

  final TextEditingController _manualInputController = TextEditingController();
  final GuideScheduleController _guideController = Get.find<GuideScheduleController>();

  bool _isProcessing = false;
  bool _torchOn = false;

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      facing: CameraFacing.back,
      torchEnabled: false,
    );

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);

    _laserAnimation = Tween<double>(begin: 0.05, end: 0.95).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _scannerController.dispose();
    _animController.dispose();
    _manualInputController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_isProcessing) return;
    final barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      final code = barcode.rawValue ?? barcode.displayValue;
      if (code != null && code.trim().isNotEmpty) {
        _handleCode(code.trim());
        break;
      }
    }
  }

  Future<void> _handleCode(String code) async {
    setState(() => _isProcessing = true);
    HapticFeedback.mediumImpact();

    final result = await _guideController.checkinWithCode(
      code,
      lichId: widget.schedule?.scheduleId,
    );

    if (!mounted) return;

    if (result != null && result['success'] == true) {
      _showSuccessDialog(result, code);
    } else {
      _showErrorDialog(result?['message'] ?? 'Vé không hợp lệ hoặc đã quét trước đó');
    }
  }

  void _showSuccessDialog(Map<String, dynamic> result, String code) {
    HapticFeedback.heavyImpact();
    final hanhKhachList = result['hanhKhach'] as List<dynamic>? ?? [];
    final maDon = result['maDon']?.toString() ?? code;

    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.all(5.w),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 14.w,
              height: 14.w,
              decoration: const BoxDecoration(
                color: Color(0xFFDCFCE7),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_rounded, color: Color(0xFF10B981), size: 32),
            ),
            SizedBox(height: 1.5.h),
            Text(
              'VÉ HỢP LỆ — ĐIỂM DANH THÀNH CÔNG',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: Responsive.font(12.5),
                fontWeight: FontWeight.w800,
                color: const Color(0xFF0F172A),
                letterSpacing: 0.3,
              ),
            ),
            SizedBox(height: 0.8.h),
            Text(
              'Đơn hàng: $maDon',
              style: TextStyle(
                fontSize: Responsive.font(11),
                fontWeight: FontWeight.w700,
                color: const Color(0xFF2563EB),
              ),
            ),
            if (widget.schedule != null) ...[
              SizedBox(height: 0.4.h),
              Text(
                widget.schedule!.tourName,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: Responsive.font(9.5),
                  color: const Color(0xFF64748B),
                ),
              ),
            ],
            SizedBox(height: 1.5.h),
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(3.w),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Danh sách khách đã soát vé:',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  SizedBox(height: 0.5.h),
                  if (hanhKhachList.isNotEmpty)
                    ...hanhKhachList.map((name) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_rounded,
                                  size: 15, color: Color(0xFF10B981)),
                              SizedBox(width: 1.5.w),
                              Text(
                                name.toString(),
                                style: TextStyle(
                                  fontSize: Responsive.font(10.5),
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                            ],
                          ),
                        ))
                  else
                    Text(
                      'Đã cập nhật trạng thái đoàn',
                      style: TextStyle(
                        fontSize: Responsive.font(10),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ),
            SizedBox(height: 2.5.h),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pop(context);
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      padding: EdgeInsets.symmetric(vertical: 1.4.h),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Đóng'),
                  ),
                ),
                SizedBox(width: 3.w),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      setState(() => _isProcessing = false);
                    },
                    icon: const Icon(Icons.qr_code_scanner, size: 18),
                    label: const Text('Quét khách tiếp'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 1.4.h),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showErrorDialog(String message) {
    HapticFeedback.vibrate();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Row(
          children: [
            Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 24),
            SizedBox(width: 8),
            Text('Vé không hợp lệ', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          ],
        ),
        content: Text(
          message,
          style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              setState(() => _isProcessing = false);
            },
            child: const Text('Thử lại', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scanSize = 68.w;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. Live Camera Preview with MobileScanner
          MobileScanner(
            controller: _scannerController,
            onDetect: _onDetect,
            errorBuilder: (context, error) {
              return Container(
                color: const Color(0xFF0F172A),
                alignment: Alignment.center,
                padding: EdgeInsets.all(6.w),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.videocam_off_outlined, size: 48, color: Colors.white70),
                    SizedBox(height: 1.5.h),
                    Text(
                      'Camera mô phỏng trên thiết bị này chưa khả dụng',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: Responsive.font(12),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 1.h),
                    Text(
                      'Bạn có thể nhập mã vé QR thủ công hoặc chọn nhanh khách trong đoàn bên dưới.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: Responsive.font(10),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),

          // 2. High-Tech Viewfinder Overlay
          CustomPaint(
            size: Size.infinite,
            painter: _ScannerOverlayPainter(
              scanBoxSize: scanSize,
              borderColor: const Color(0xFF10B981),
            ),
          ),

          // 3. Animated Laser Beam
          Center(
            child: SizedBox(
              width: scanSize - 20,
              height: scanSize - 20,
              child: AnimatedBuilder(
                animation: _laserAnimation,
                builder: (context, child) {
                  return Stack(
                    children: [
                      Positioned(
                        top: (scanSize - 20) * _laserAnimation.value,
                        left: 0,
                        right: 0,
                        child: Container(
                          height: 3,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [
                                Colors.transparent,
                                Color(0xFF10B981),
                                Color(0xFF34D399),
                                Color(0xFF10B981),
                                Colors.transparent,
                              ],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF10B981).withAlpha((255 * 0.8).round()),
                                blurRadius: 10,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),

          // 4. Top Action Bar
          SafeArea(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.h),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  CircleAvatar(
                    backgroundColor: Colors.black45,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 3.5.w, vertical: 0.8.h),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.qr_code_scanner, color: Color(0xFF10B981), size: 16),
                        SizedBox(width: 1.5.w),
                        Text(
                          widget.schedule != null
                              ? widget.schedule!.departureCode
                              : 'Soát vé QR VietTour',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: Responsive.font(10),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: Colors.black45,
                        child: IconButton(
                          icon: Icon(
                            _torchOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
                            color: _torchOn ? const Color(0xFFFBBF24) : Colors.white,
                          ),
                          onPressed: () async {
                            await _scannerController.toggleTorch();
                            setState(() => _torchOn = !_torchOn);
                          },
                        ),
                      ),
                      SizedBox(width: 2.w),
                      CircleAvatar(
                        backgroundColor: Colors.black45,
                        child: IconButton(
                          icon: const Icon(Icons.flip_camera_ios_rounded, color: Colors.white),
                          onPressed: () => _scannerController.switchCamera(),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // 5. Instruction text
          Positioned(
            top: 22.h,
            left: 5.w,
            right: 5.w,
            child: Text(
              'Hướng camera vào mã QR vé điện tử của khách hàng',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: Responsive.font(10.5),
                fontWeight: FontWeight.w600,
                shadows: const [
                  Shadow(color: Colors.black87, blurRadius: 8),
                ],
              ),
            ),
          ),

          // 6. Bottom Manual Fallback Sheet
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.fromLTRB(5.w, 2.h, 5.w, 3.h),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Nhập mã vé thủ công',
                        style: TextStyle(
                          fontSize: Responsive.font(11.5),
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      if (widget.schedule != null)
                        Text(
                          'Còn ${widget.schedule!.totalGuests - widget.schedule!.checkedInGuests} khách chưa điểm danh',
                          style: TextStyle(
                            fontSize: Responsive.font(9),
                            color: const Color(0xFF64748B),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                    ],
                  ),
                  SizedBox(height: 1.2.h),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _manualInputController,
                          decoration: InputDecoration(
                            hintText: 'Nhập mã QR vé (VD: VT-BK-...) hoặc mã đơn',
                            hintStyle: TextStyle(
                              fontSize: Responsive.font(10),
                              color: const Color(0xFF94A3B8),
                            ),
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 3.5.w,
                              vertical: 1.2.h,
                            ),
                            filled: true,
                            fillColor: const Color(0xFFF8FAFC),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: Color(0xFF0F172A),
                                width: 1.5,
                              ),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(width: 2.5.w),
                      ElevatedButton(
                        onPressed: () {
                          final text = _manualInputController.text.trim();
                          if (text.isNotEmpty) {
                            _handleCode(text);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(
                            horizontal: 4.w,
                            vertical: 1.4.h,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Soát vé', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                  if (widget.schedule != null &&
                      widget.schedule!.passengers.isNotEmpty) ...[
                    SizedBox(height: 1.5.h),
                    const Text(
                      'Khách chưa điểm danh (chạm để chọn nhanh):',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    SizedBox(height: 0.8.h),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: widget.schedule!.passengers
                            .where((p) => !p.isCheckedIn)
                            .map((p) => Padding(
                                  padding: EdgeInsets.only(right: 2.w),
                                  child: ActionChip(
                                    avatar: const Icon(
                                      Icons.person_outline_rounded,
                                      size: 14,
                                      color: Color(0xFF2563EB),
                                    ),
                                    label: Text(p.fullName),
                                    labelStyle: TextStyle(
                                      fontSize: Responsive.font(9),
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF1E293B),
                                    ),
                                    backgroundColor: const Color(0xFFEFF6FF),
                                    side: const BorderSide(color: Color(0xFFBFDBFE)),
                                    onPressed: () {
                                      final code = p.ticketQrCode.isNotEmpty
                                          ? p.ticketQrCode
                                          : p.orderCode;
                                      _manualInputController.text = code;
                                      _handleCode(code);
                                    },
                                  ),
                                ))
                            .toList(),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ScannerOverlayPainter extends CustomPainter {
  final double scanBoxSize;
  final Color borderColor;

  _ScannerOverlayPainter({
    required this.scanBoxSize,
    required this.borderColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()..color = Colors.black.withAlpha((255 * 0.6).round());

    final center = Offset(size.width / 2, size.height / 2 - 30);
    final rect = Rect.fromCenter(
      center: center,
      width: scanBoxSize,
      height: scanBoxSize,
    );

    final bgPath = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(rect, const Radius.circular(16)))
      ..fillType = PathFillType.evenOdd;

    canvas.drawPath(bgPath, bgPaint);

    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round;

    const cornerLength = 28.0;

    // Top Left
    canvas.drawLine(rect.topLeft, rect.topLeft + const Offset(cornerLength, 0), borderPaint);
    canvas.drawLine(rect.topLeft, rect.topLeft + const Offset(0, cornerLength), borderPaint);

    // Top Right
    canvas.drawLine(rect.topRight, rect.topRight + const Offset(-cornerLength, 0), borderPaint);
    canvas.drawLine(rect.topRight, rect.topRight + const Offset(0, cornerLength), borderPaint);

    // Bottom Left
    canvas.drawLine(rect.bottomLeft, rect.bottomLeft + const Offset(cornerLength, 0), borderPaint);
    canvas.drawLine(rect.bottomLeft, rect.bottomLeft + const Offset(0, -cornerLength), borderPaint);

    // Bottom Right
    canvas.drawLine(rect.bottomRight, rect.bottomRight + const Offset(-cornerLength, 0), borderPaint);
    canvas.drawLine(rect.bottomRight, rect.bottomRight + const Offset(0, -cornerLength), borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
