import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/tour_model.dart';
import '../services/api_service.dart';

class TourDetailScreen extends StatefulWidget {
  final int tourId;
  final Map<String, dynamic>? user;

  const TourDetailScreen({super.key, required this.tourId, this.user});

  @override
  State<TourDetailScreen> createState() => _TourDetailScreenState();
}

class _TourDetailScreenState extends State<TourDetailScreen> {
  TourModel? _tour;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchDetail();
  }

  Future<void> _fetchDetail() async {
    try {
      final data = await ApiService.getTourDetail(widget.tourId);
      setState(() {
        _tour = TourModel.fromJson(data);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  void _openBookingSheet() {
    if (_tour == null) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BookingModal(tour: _tour!, user: widget.user),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chi Tiết Tour')),
        body: const Center(child: CircularProgressIndicator(color: Color(0xFF005BAA))),
      );
    }

    if (_error != null || _tour == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chi Tiết Tour')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 12),
              Text(_error ?? 'Không thể tải tour'),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _fetchDetail, child: const Text('Thử Lại')),
            ],
          ),
        ),
      );
    }

    final t = _tour!;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          // SLIVER APP BAR VỚI HÌNH ẢNH BANNER
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            backgroundColor: const Color(0xFF005BAA),
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    t.hinhAnhUrl ?? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(color: const Color(0xFF005BAA)),
                  ),
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.black54, Colors.transparent, Colors.black87],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF005BAA),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            t.danhMuc ?? 'TOUR DU LỊCH',
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          t.tenTour,
                          style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // NỘI DUNG CHI TIẾT
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // THÔNG TIN TỔNG QUAN
                  Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildMiniInfo(Icons.schedule, 'Thời gian', t.thoiGian),
                          _buildMiniInfo(Icons.location_on_outlined, 'Điểm đến', t.diemDen),
                          _buildMiniInfo(Icons.flight_takeoff, 'Khởi hành', t.diemKhoiHanh ?? 'TP.HCM'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ĐIỂM NỔI BẬT
                  const Text('Điểm Nổi Bật', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          _buildHighlightItem('✈️', 'Vé máy bay khứ hồi gồm 20kg ký gửi'),
                          const Divider(),
                          _buildHighlightItem('🏨', 'Khách sạn 4 sao cao cấp kèm buffet sáng'),
                          const Divider(),
                          _buildHighlightItem('🍲', 'Thưởng thức ẩm thực đặc sản phong phú'),
                          const Divider(),
                          _buildHighlightItem('🛡️', 'Bảo hiểm du lịch trọn gói 120.000.000đ'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // LỊCH TRÌNH CHI TIẾT
                  const Text('Lịch Trình Từng Ngày', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text(
                        t.lichTrinh ?? 'Lịch trình chi tiết tham quan đang được cập nhật...',
                        style: const TextStyle(fontSize: 13.5, height: 1.6, color: Color(0xFF334155)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // CHÍNH SÁCH HỦY TOUR
                  const Text('Chính Sách Hoàn Hủy Tour', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          _buildPolicyRow('Hủy trước >= 15 ngày:', 'Hoàn 100% tiền cọc', Colors.green),
                          const Divider(),
                          _buildPolicyRow('Hủy từ 8 - 14 ngày:', 'Phạt 30% giá tour', Colors.orange),
                          const Divider(),
                          _buildPolicyRow('Hủy từ 4 - 7 ngày:', 'Phạt 50% giá tour', Colors.deepOrange),
                          const Divider(),
                          _buildPolicyRow('Dưới 4 ngày / Vắng mặt:', 'Phạt 100% không hoàn', Colors.red),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 100), // Khoảng trống cho bottom bar
                ],
              ),
            ),
          ),
        ],
      ),

      // BOTTOM BAR ĐẶT TOUR
      bottomSheet: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -2))],
        ),
        child: SafeArea(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Giá trọn gói từ:', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                  Text(
                    currencyFormatter.format(t.giaNguoiLon),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF005BAA),
                    ),
                  ),
                ],
              ),
              ElevatedButton.icon(
                onPressed: _openBookingSheet,
                icon: const Icon(Icons.confirmation_num_outlined, size: 18),
                label: const Text('ĐẶT TOUR NGAY'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF005BAA),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMiniInfo(IconData icon, String label, String value) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFF005BAA), size: 22),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
      ],
    );
  }

  Widget _buildHighlightItem(String icon, String text) {
    return Row(
      children: [
        Text(icon, style: const TextStyle(fontSize: 18)),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
      ],
    );
  }

  Widget _buildPolicyRow(String time, String penalty, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(time, style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B))),
        Text(penalty, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: color)),
      ],
    );
  }
}

// MODAL ĐẶT TOUR DI ĐỘNG
class BookingModal extends StatefulWidget {
  final TourModel tour;
  final Map<String, dynamic>? user;

  const BookingModal({super.key, required this.tour, this.user});

  @override
  State<BookingModal> createState() => _BookingModalState();
}

class _BookingModalState extends State<BookingModal> {
  int? _selectedLichId;
  int _adults = 1;
  int _children = 0;
  final _voucherController = TextEditingController();
  final _nameController = TextEditingController();
  final _cccdController = TextEditingController();

  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.tour.lichKhoiHanh.isNotEmpty) {
      _selectedLichId = widget.tour.lichKhoiHanh.first.lichId;
    }
    _nameController.text = widget.user?['name'] ?? 'Nguyễn Văn A';
    _cccdController.text = '079201001234';
  }

  Future<void> _submitBooking() async {
    if (_selectedLichId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng chọn ngày khởi hành')));
      return;
    }

    setState(() => _submitting = true);
    try {
      final customerId = widget.user?['customerId'] ?? 1;
      final res = await ApiService.bookTour(
        khachHangId: customerId,
        lichId: _selectedLichId!,
        soLuongNguoiLon: _adults,
        soLuongTreEm: _children,
        ghiChu: 'Đặt tour từ ứng dụng VietTour Mobile',
        maKhuyenMai: _voucherController.text.trim().isNotEmpty ? _voucherController.text.trim().toUpperCase() : null,
        hanhKhach: [
          {
            'hoTen': _nameController.text.trim().isNotEmpty ? _nameController.text.trim() : 'Hành khách chính',
            'cccd': _cccdController.text.trim(),
            'loaiKhach': 'Nguoi lon',
          }
        ],
      );

      if (mounted) {
        Navigator.pop(context); // đóng modal
        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('🎉 Đặt Tour Thành Công!'),
            content: Text('Mã đơn hàng của bạn là: ${res['MaDon']}.\nVé điện tử QR đã được kích hoạt trong mục Đơn Của Tôi.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Đóng')),
            ],
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi: ${e.toString().replaceAll('Exception: ', '')}')),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
    final total = (_adults * widget.tour.giaNguoiLon) + (_children * widget.tour.giaTreEm);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Đặt Tour Trực Tuyến', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 12),

            // CHỌN NGÀY KHỞI HÀNH
            const Text('Chọn Ngày Khởi Hành:', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            DropdownButtonFormField<int>(
              initialValue: _selectedLichId,
              decoration: InputDecoration(
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              items: widget.tour.lichKhoiHanh.isNotEmpty
                  ? widget.tour.lichKhoiHanh.map((l) {
                      return DropdownMenuItem<int>(
                        value: l.lichId,
                        child: Text('${l.maLich} (${l.ngayKhoiHanh.split('T').first}) - Còn ${l.soChoToiDa - l.soChoDaDat} chỗ'),
                      );
                    }).toList()
                  : [
                      const DropdownMenuItem<int>(
                        value: 1,
                        child: Text('LICH-DEFAULT (15/10/2026) - Còn 25 chỗ'),
                      ),
                    ],
              onChanged: (val) => setState(() => _selectedLichId = val),
            ),
            const SizedBox(height: 14),

            // SỐ LƯỢNG KHÁCH
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Người lớn', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                        Row(
                          children: [
                            InkWell(
                              onTap: () => setState(() => _adults = _adults > 1 ? _adults - 1 : 1),
                              child: const CircleAvatar(radius: 12, child: Icon(Icons.remove, size: 14)),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              child: Text('$_adults', style: const TextStyle(fontWeight: FontWeight.w900)),
                            ),
                            InkWell(
                              onTap: () => setState(() => _adults++),
                              child: const CircleAvatar(radius: 12, child: Icon(Icons.add, size: 14)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Trẻ em', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                        Row(
                          children: [
                            InkWell(
                              onTap: () => setState(() => _children = _children > 0 ? _children - 1 : 0),
                              child: const CircleAvatar(radius: 12, child: Icon(Icons.remove, size: 14)),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              child: Text('$_children', style: const TextStyle(fontWeight: FontWeight.w900)),
                            ),
                            InkWell(
                              onTap: () => setState(() => _children++),
                              child: const CircleAvatar(radius: 12, child: Icon(Icons.add, size: 14)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // THÔNG TIN HÀNH KHÁCH & CCCD
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: 'Họ và tên hành khách chính',
                prefixIcon: const Icon(Icons.person),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _cccdController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Số CCCD (12 số)',
                prefixIcon: const Icon(Icons.badge),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _voucherController,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                labelText: 'Mã voucher (VIETTOUR2026)',
                prefixIcon: const Icon(Icons.local_offer_outlined),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 16),

            // TỔNG TIỀN VÀ NÚT XÁC NHẬN
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Tổng tiền tạm tính:', style: TextStyle(fontWeight: FontWeight.w700)),
                  Text(
                    currencyFormatter.format(total),
                    style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF005BAA), fontSize: 18),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submitBooking,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF005BAA),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _submitting
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('XÁC NHẬN & NHẬN VÉ ĐIỆN TỬ QR', style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
