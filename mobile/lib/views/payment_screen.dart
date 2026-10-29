import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/tour_model.dart';
import '../services/api_service.dart';
import 'ticket_qr_screen.dart';

class PaymentScreen extends StatefulWidget {
  final BookingModel booking;
  final Map<String, dynamic>? user;
  final VoidCallback? onPaymentSuccess;

  const PaymentScreen({
    super.key,
    required this.booking,
    this.user,
    this.onPaymentSuccess,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String _selectedMethod = 'ZaloPay';
  bool _processing = false;

  final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');

  Future<void> _handlePayment() async {
    setState(() => _processing = true);
    try {
      await ApiService.confirmPayment(
        maDon: widget.booking.maDon,
        method: _selectedMethod,
        amount: widget.booking.tongTien - (widget.booking.giamGia ?? 0),
      );

      widget.onPaymentSuccess?.call();

      if (!mounted) return;

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Column(
            children: [
              Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 64),
              SizedBox(height: 12),
              Text(
                'Thanh Toán Thành Công!',
                textAlign: TextAlign.center,
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Đơn hàng ${widget.booking.maDon} đã được thanh toán qua $_selectedMethod.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
              ),
              const SizedBox(height: 8),
              const Text(
                'Vé điện tử QR và thông báo nhắc lịch khởi hành đã được kích hoạt!',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF005BAA)),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(ctx); // Close dialog
                Navigator.pop(context); // Close PaymentScreen
              },
              child: const Text('Về Đơn Hàng'),
            ),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (_) => TicketQrScreen(booking: widget.booking),
                  ),
                );
              },
              icon: const Icon(Icons.qr_code, size: 16),
              label: const Text('Xem Vé QR Ngay'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFFDC2626),
          content: Text('Lỗi thanh toán: ${e.toString().replaceAll('Exception: ', '')}'),
        ),
      );
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final phaiThu = widget.booking.tongTien - (widget.booking.giamGia ?? 0);
    final qrData = 'VIETTOUR|${widget.booking.maDon}|$phaiThu|$_selectedMethod';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Thanh Toán Đơn Tour', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
        backgroundColor: const Color(0xFF005BAA),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // CARD THÔNG TIN ĐƠN HÀNG
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Mã đơn: ${widget.booking.maDon}',
                          style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF005BAA), fontSize: 14),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'Chờ thanh toán',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFFD97706)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.booking.tenTour,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Số lượng khách:', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                        Text(
                          '${widget.booking.soLuongNguoiLon} người lớn${widget.booking.soLuongTreEm > 0 ? ', ${widget.booking.soLuongTreEm} trẻ em' : ''}',
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                        ),
                      ],
                    ),
                    if ((widget.booking.giamGia ?? 0) > 0) ...[
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Giảm giá khuyến mãi:', style: TextStyle(color: Color(0xFF16A34A), fontSize: 13)),
                          Text('-${currencyFormatter.format(widget.booking.giamGia)}', style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF16A34A))),
                        ],
                      ),
                    ],
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Cần thanh toán:', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                        Text(
                          currencyFormatter.format(phaiThu),
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF005BAA)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // PHƯƠNG THỨC THANH TOÁN
            const Text(
              'Chọn phương thức thanh toán:',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 10),

            _buildMethodTile(
              id: 'ZaloPay',
              title: 'Ví Điện Tử ZaloPay',
              subtitle: 'Thanh toán tức thì qua ZaloPay QR / Ứng dụng',
              icon: Icons.account_balance_wallet,
              color: const Color(0xFF0068FF),
            ),
            _buildMethodTile(
              id: 'VNPay',
              title: 'Cổng Thanh Toán VNPAY',
              subtitle: 'Hỗ trợ quét mã QR từ hơn 40 ứng dụng ngân hàng',
              icon: Icons.qr_code_2,
              color: const Color(0xFFED1C24),
            ),
            _buildMethodTile(
              id: 'ChuyenKhoan',
              title: 'Chuyển Khoản Ngân Hàng (VietQR)',
              subtitle: 'Ngân hàng Quân Đội (MB Bank) - STK: 0378890133',
              icon: Icons.account_balance,
              color: const Color(0xFF16A34A),
            ),
            _buildMethodTile(
              id: 'TienMat',
              title: 'Thanh Toán Tiền Mặt Tại Quầy',
              subtitle: 'Nộp tiền trực tiếp tại phòng vé hoặc cho HDV',
              icon: Icons.payments_outlined,
              color: const Color(0xFFD97706),
            ),

            const SizedBox(height: 20),

            // KHỐI HIỂN THỊ MÃ QR THANH TOÁN ĐỘNG
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 2))],
                ),
                child: Column(
                  children: [
                    Text(
                      'Quét mã để thanh toán ($_selectedMethod)',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 12),
                    QrImageView(
                      data: qrData,
                      version: QrVersions.auto,
                      size: 160.0,
                      dataModuleStyle: const QrDataModuleStyle(
                        dataModuleShape: QrDataModuleShape.square,
                        color: Color(0xFF0F172A),
                      ),
                      eyeStyle: const QrEyeStyle(
                        eyeShape: QrEyeShape.square,
                        color: Color(0xFF005BAA),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Nội dung: ${widget.booking.maDon}',
                      style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF005BAA), fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Số tiền: ${currencyFormatter.format(phaiThu)}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // NÚT XÁC NHẬN THANH TOÁN
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _processing ? null : _handlePayment,
                icon: _processing
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.check_circle_outline),
                label: Text(
                  _processing ? 'Đang Xử Lý Giao Dịch...' : 'XÁC NHẬN THANH TOÁN & NHẬN VÉ QR',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF005BAA),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildMethodTile({
    required String id,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    final isSelected = _selectedMethod == id;

    return GestureDetector(
      onTap: () => setState(() => _selectedMethod = id),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF005BAA) : const Color(0xFFE2E8F0),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                ],
              ),
            ),
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? const Color(0xFF005BAA) : const Color(0xFF94A3B8),
            ),
          ],
        ),
      ),
    );
  }
}
