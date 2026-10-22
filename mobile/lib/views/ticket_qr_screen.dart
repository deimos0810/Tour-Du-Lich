import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/tour_model.dart';

class TicketQrScreen extends StatelessWidget {
  final BookingModel booking;
  final PassengerModel? passenger;

  const TicketQrScreen({
    super.key,
    required this.booking,
    this.passenger,
  });

  @override
  Widget build(BuildContext context) {
    final p = passenger ?? (booking.hanhKhach.isNotEmpty ? booking.hanhKhach.first : null);
    final qrData = p?.maQRVe ?? 'VT-${booking.maDon}';

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('Thẻ Lên Tàu & Vé Điện Tử QR', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              color: Colors.white,
              elevation: 8,
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // HEADER
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF005BAA),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'VIETTOUR',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'BOARDING PASS',
                              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, letterSpacing: 1),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            '✓ HỢP LỆ',
                            style: TextStyle(color: Color(0xFF16A34A), fontWeight: FontWeight.w800, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // TOUR NAME
                    Text(
                      booking.tenTour,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // QR CODE
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(color: const Color(0xFF005BAA), width: 2),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: const [
                          BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4)),
                        ],
                      ),
                      child: QrImageView(
                        data: qrData,
                        version: QrVersions.auto,
                        size: 200.0,
                        dataModuleStyle: const QrDataModuleStyle(
                          dataModuleShape: QrDataModuleShape.square,
                          color: Color(0xFF0F172A),
                        ),
                        eyeStyle: const QrEyeStyle(
                          eyeShape: QrEyeShape.square,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      qrData,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF005BAA),
                        letterSpacing: 1,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Dùng Camera/Máy quét của HDV để điểm danh',
                      style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                    ),

                    const SizedBox(height: 20),
                    // DASHED LINE
                    Row(
                      children: List.generate(
                        25,
                        (index) => Expanded(
                          child: Container(
                            color: index % 2 == 0 ? Colors.transparent : Colors.grey[300],
                            height: 2,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // PASSENGER INFO
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        children: [
                          _buildRow('Hành khách:', p?.hoTen ?? 'Khách hàng VietTour', isBold: true),
                          const SizedBox(height: 8),
                          _buildRow('Loại vé:', p?.loaiKhach ?? 'Người lớn'),
                          const SizedBox(height: 8),
                          _buildRow('CCCD / Mã ĐD:', p?.cccd ?? 'Chưa cập nhật'),
                          const SizedBox(height: 8),
                          _buildRow('Mã đơn hàng:', booking.maDon, isBlue: true),
                          const SizedBox(height: 8),
                          _buildRow('Khởi hành:', booking.ngayKhoiHanh.isNotEmpty ? booking.ngayKhoiHanh.split('T').first : '15/10/2026'),
                          const SizedBox(height: 8),
                          _buildRow('Trạng thái điểm danh:', (p?.trangThaiDiemDanh ?? 0) == 1 ? '✓ ĐÃ LÊN XE' : 'Chưa điểm danh', isGreen: (p?.trangThaiDiemDanh ?? 0) == 1),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    ElevatedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back),
                      label: const Text('Quay Lại Đơn Hàng'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF005BAA),
                        foregroundColor: Colors.white,
                        minimumSize: const Size(double.infinity, 44),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value, {bool isBold = false, bool isBlue = false, bool isGreen = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B))),
        Text(
          value,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
            color: isGreen
                ? const Color(0xFF16A34A)
                : isBlue
                    ? const Color(0xFF005BAA)
                    : const Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }
}
