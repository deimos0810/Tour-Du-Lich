import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/tour_model.dart';
import 'ticket_qr_screen.dart';

class InvoiceScreen extends StatelessWidget {
  final BookingModel booking;
  final Map<String, dynamic>? user;

  const InvoiceScreen({
    super.key,
    required this.booking,
    this.user,
  });

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
    final invoiceNumber = 'HD-2026-${booking.maDon.replaceAll(RegExp(r'[^0-9]'), '')}';
    final dateStr = booking.ngayDat.isNotEmpty
        ? booking.ngayDat.split('T').first
        : DateFormat('yyyy-MM-dd').format(DateTime.now());

    final phaiThu = booking.tongTien - (booking.giamGia ?? 0);
    final vat = phaiThu * 0.08 / 1.08; // 8% VAT
    final tienChuaThue = phaiThu - vat;

    final customerName = user?['name'] ?? (booking.hanhKhach.isNotEmpty ? booking.hanhKhach.first.hoTen : 'Khách Hàng VietTour');
    final customerPhone = user?['phone'] ?? '0901234567';
    final customerEmail = user?['email'] ?? 'khachhang@viettour.vn';

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('Hóa Đơn Điện Tử (E-Invoice)', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        backgroundColor: const Color(0xFF005BAA),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            tooltip: 'Chia sẻ hóa đơn',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đã sao chép liên kết hóa đơn điện tử')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // LOGO & TIÊU ĐỀ
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF005BAA),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'VIETTOUR',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13),
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'CÔNG TY CỔ PHẦN LỮ HÀNH VIETTOUR',
                              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
                            ),
                            const Text(
                              'MST: 0317892026 • Hotline: 1900 1800',
                              style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                            ),
                            const Text(
                              '140 Lê Trọng Tấn, P. Tây Thạnh, Q. Tân Phú, TP.HCM',
                              style: TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFF86EFAC)),
                          ),
                          child: const Text(
                            'HÓA ĐƠN ĐÃ KÝ',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF16A34A)),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),

                    // TÊN HÓA ĐƠN & KÝ HIỆU
                    Center(
                      child: Column(
                        children: [
                          const Text(
                            'HÓA ĐƠN GIÁ TRỊ GIA TĂNG (VAT)',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF005BAA)),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Ký hiệu: VT/26E • Số: $invoiceNumber',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF64748B)),
                          ),
                          Text(
                            'Ngày lập: $dateStr',
                            style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // KHÁCH HÀNG
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'THÔNG TIN NGƯỜI MUA HÀNG',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF005BAA)),
                          ),
                          const SizedBox(height: 6),
                          Text('Khách hàng: $customerName', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                          Text('Số điện thoại: $customerPhone • Email: $customerEmail', style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                          Text('Đơn đặt tour: ${booking.maDon}', style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // BẢNG KÊ DỊCH VỤ
                    const Text('Chi tiết dịch vụ tour:', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 8),

                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  booking.tenTour,
                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                                ),
                              ),
                              Text(
                                currencyFormatter.format(booking.tongTien),
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '• Khách người lớn: ${booking.soLuongNguoiLon} | Trẻ em: ${booking.soLuongTreEm}',
                                style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                              ),
                              Text(
                                'Khởi hành: ${booking.ngayKhoiHanh.isNotEmpty ? booking.ngayKhoiHanh.split('T').first : ''}',
                                style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // TỔNG KẾT TIỀN
                    _buildSummaryRow('Tiền dịch vụ (chưa thuế):', currencyFormatter.format(tienChuaThue)),
                    _buildSummaryRow('Thuế GTGT (VAT 8%):', currencyFormatter.format(vat)),
                    if ((booking.giamGia ?? 0) > 0)
                      _buildSummaryRow('Chiết khấu voucher:', '-${currencyFormatter.format(booking.giamGia)}', isDiscount: true),
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'TỔNG TIỀN THANH TOÁN:',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A)),
                        ),
                        Text(
                          currencyFormatter.format(phaiThu),
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: Color(0xFF005BAA)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // HÌNH THỨC THANH TOÁN
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.verified, color: Color(0xFF005BAA), size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Đã thanh toán qua ${booking.phuongThucTT ?? 'ZaloPay / VNPAY'} • Trạng thái: Hợp lệ',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF005BAA)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // CÁC NÚT THAO TÁC
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('✓ Đã lưu hóa đơn điện tử định dạng PDF về máy')),
                              );
                            },
                            icon: const Icon(Icons.download, size: 16),
                            label: const Text('Tải Hóa Đơn'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF005BAA),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => TicketQrScreen(booking: booking),
                                ),
                              );
                            },
                            icon: const Icon(Icons.qr_code, size: 16),
                            label: const Text('Xem Vé QR'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF16A34A),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ],
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

  Widget _buildSummaryRow(String title, String val, {bool isDiscount = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: TextStyle(fontSize: 12.5, color: isDiscount ? const Color(0xFF16A34A) : const Color(0xFF64748B))),
          Text(
            val,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: isDiscount ? const Color(0xFF16A34A) : const Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }
}
