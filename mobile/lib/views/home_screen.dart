import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/tour_model.dart';
import '../services/api_service.dart';
import 'guide_schedule_screen.dart';
import 'login_screen.dart';
import 'ticket_qr_screen.dart';
import 'tour_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  final Map<String, dynamic>? user;

  const HomeScreen({super.key, this.user});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentTab = 0;
  late final bool _isGuide;

  @override
  void initState() {
    super.initState();
    final roles = widget.user?['roles'] as List? ?? [];
    _isGuide = roles.any((r) => r.toString().toUpperCase().contains('HDV') || r.toString().toUpperCase().contains('GUIDE'));
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF005BAA);

    final tabs = [
      ExploreToursTab(user: widget.user),
      MyBookingsTab(user: widget.user),
      if (_isGuide)
        GuideScheduleScreen(user: widget.user),
      ProfileTab(user: widget.user),
    ];

    final navItems = [
      const BottomNavigationBarItem(icon: Icon(Icons.explore_outlined), activeIcon: Icon(Icons.explore), label: 'Khám Phá'),
      const BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined), activeIcon: Icon(Icons.receipt_long), label: 'Đơn Của Tôi'),
      if (_isGuide)
        const BottomNavigationBarItem(icon: Icon(Icons.badge_outlined), activeIcon: Icon(Icons.badge), label: 'Lịch HDV'),
      const BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Tài Khoản'),
    ];

    return Scaffold(
      body: tabs[_currentTab],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentTab,
        onTap: (idx) => setState(() => _currentTab = idx),
        selectedItemColor: primaryColor,
        unselectedItemColor: const Color(0xFF64748B),
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
        items: navItems,
      ),
    );
  }
}

// ============================================================================
// TAB 1: KHÁM PHÁ TOUR DU LỊCH
// ============================================================================
class ExploreToursTab extends StatefulWidget {
  final Map<String, dynamic>? user;
  const ExploreToursTab({super.key, this.user});

  @override
  State<ExploreToursTab> createState() => _ExploreToursTabState();
}

class _ExploreToursTabState extends State<ExploreToursTab> {
  List<TourModel> _tours = [];
  bool _loading = true;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchTours();
  }

  Future<void> _fetchTours([String? search]) async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.getTours(search: search);
      setState(() {
        _tours = data.map((j) => TourModel.fromJson(j)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6)),
              child: const Text('VT', style: TextStyle(color: Color(0xFF005BAA), fontWeight: FontWeight.w900, fontSize: 14)),
            ),
            const SizedBox(width: 8),
            const Text('VietTour Travel', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
          ],
        ),
        backgroundColor: const Color(0xFF005BAA),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          // SEARCH HEADER
          Container(
            padding: const EdgeInsets.all(16),
            color: const Color(0xFF005BAA),
            child: TextField(
              controller: _searchController,
              onSubmitted: (val) => _fetchTours(val),
              decoration: InputDecoration(
                hintText: 'Tìm tour Đà Nẵng, Phú Quốc, Hà Nội...',
                prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B)),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    _fetchTours();
                  },
                ),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),

          // DANH SÁCH TOUR
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF005BAA)))
                : _tours.isEmpty
                    ? const Center(child: Text('Không tìm thấy tour phù hợp'))
                    : RefreshIndicator(
                        onRefresh: () => _fetchTours(),
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _tours.length,
                          itemBuilder: (context, idx) {
                            final t = _tours[idx];
                            return GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => TourDetailScreen(tourId: t.tourId, user: widget.user),
                                  ),
                                );
                              },
                              child: Card(
                                margin: const EdgeInsets.only(bottom: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                clipBehavior: Clip.antiAlias,
                                elevation: 3,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // ẢNH TOUR
                                    Stack(
                                      children: [
                                        Image.network(
                                          t.hinhAnhUrl ?? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
                                          height: 180,
                                          width: double.infinity,
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) => Container(height: 180, color: const Color(0xFFE2E8F0)),
                                        ),
                                        Positioned(
                                          top: 12,
                                          left: 12,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF005BAA).withValues(alpha: 0.9),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              t.danhMuc ?? 'TOUR HOT',
                                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                                            ),
                                          ),
                                        ),
                                        Positioned(
                                          bottom: 12,
                                          right: 12,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: Colors.black.withValues(alpha: 0.7),
                                              borderRadius: BorderRadius.circular(20),
                                            ),
                                            child: Row(
                                              children: [
                                                const Icon(Icons.schedule, color: Colors.white, size: 14),
                                                const SizedBox(width: 4),
                                                Text(t.thoiGian, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),

                                    // THÔNG TIN
                                    Padding(
                                      padding: const EdgeInsets.all(14.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            t.tenTour,
                                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              const Icon(Icons.location_on_outlined, size: 15, color: Color(0xFF64748B)),
                                              const SizedBox(width: 4),
                                              Text(t.diemDen, style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                                              const Spacer(),
                                              Text(
                                                currencyFormatter.format(t.giaNguoiLon),
                                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF005BAA)),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// TAB 2: ĐƠN CỦA TÔI & VÉ QR CODE
// ============================================================================
class MyBookingsTab extends StatefulWidget {
  final Map<String, dynamic>? user;
  const MyBookingsTab({super.key, this.user});

  @override
  State<MyBookingsTab> createState() => _MyBookingsTabState();
}

class _MyBookingsTabState extends State<MyBookingsTab> {
  List<BookingModel> _bookings = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchBookings();
  }

  Future<void> _fetchBookings() async {
    setState(() => _loading = true);
    try {
      final customerId = widget.user?['customerId'] ?? 1;
      final data = await ApiService.getMyBookings(customerId);
      setState(() {
        _bookings = data.map((j) => BookingModel.fromJson(j)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  void _openReviewDialog(BookingModel b) {
    int stars = 5;
    final commentCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: const Text('Đánh Giá Tour', style: TextStyle(fontWeight: FontWeight.w800)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(b.tenTour, style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [1, 2, 3, 4, 5].map((s) {
                  return IconButton(
                    icon: Icon(s <= stars ? Icons.star : Icons.star_border, color: Colors.amber, size: 28),
                    onPressed: () => setSt(() => stars = s),
                  );
                }).toList(),
              ),
              TextField(
                controller: commentCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Nhận xét về chuyến đi...',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy')),
            ElevatedButton(
              onPressed: () async {
                if (commentCtrl.text.trim().isEmpty) return;
                await ApiService.submitReview(
                  donHangId: b.donHangId,
                  tourId: b.tourId,
                  soSao: stars,
                  binhLuan: commentCtrl.text.trim(),
                );
                if (!ctx.mounted) return;
                Navigator.pop(ctx);
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Cảm ơn bạn đã gửi đánh giá!')),
                );
              },
              child: const Text('Gửi Đánh Giá'),
            ),
          ],
        ),
      ),
    );
  }

  void _openCancelDialog(BookingModel b) {
    final reasonCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Hủy Đơn Tour', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.red)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Bạn có chắc chắn muốn hủy đơn hàng ${b.maDon}?'),
            const SizedBox(height: 8),
            const Text('Chính sách hoàn hủy sẽ được áp dụng theo quy định của VietTour.', style: TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              decoration: const InputDecoration(
                labelText: 'Lý do hủy đơn *',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Đóng')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () async {
              if (reasonCtrl.text.trim().isEmpty) return;
              try {
                await ApiService.cancelBooking(b.donHangId, reasonCtrl.text.trim());
                if (!mounted) return;
                Navigator.pop(context);
                _fetchBookings();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Hủy đơn thành công!')),
                );
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(e.toString())),
                );
              }
            },
            child: const Text('Xác Nhận Hủy'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Đơn Đặt Tour Của Tôi', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
        backgroundColor: const Color(0xFF005BAA),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchBookings),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF005BAA)))
          : _bookings.isEmpty
              ? const Center(child: Text('Bạn chưa có đơn đặt tour nào'))
              : RefreshIndicator(
                  onRefresh: _fetchBookings,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _bookings.length,
                    itemBuilder: (context, idx) {
                      final b = _bookings[idx];
                      final isPaid = b.trangThaiDon == 'Da thanh toan';

                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Mã: ${b.maDon}', style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF005BAA))),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: isPaid ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      b.trangThaiDon,
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: isPaid ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(b.tenTour, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Khởi hành: ${b.ngayKhoiHanh.isNotEmpty ? b.ngayKhoiHanh.split('T').first : ''}',
                                      style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B))),
                                  Text(currencyFormatter.format(b.tongTien),
                                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF005BAA))),
                                ],
                              ),
                              const Divider(height: 20),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  if (b.trangThaiDon != 'Da huy')
                                    TextButton(
                                      onPressed: () => _openCancelDialog(b),
                                      child: const Text('Hủy đơn', style: TextStyle(color: Colors.red, fontSize: 13)),
                                    ),
                                  if (isPaid) ...[
                                    TextButton(
                                      onPressed: () => _openReviewDialog(b),
                                      child: const Text('⭐ Đánh giá', style: TextStyle(color: Color(0xFFD97706), fontSize: 13, fontWeight: FontWeight.w700)),
                                    ),
                                    ElevatedButton.icon(
                                      onPressed: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => TicketQrScreen(booking: b),
                                          ),
                                        );
                                      },
                                      icon: const Icon(Icons.qr_code, size: 16),
                                      label: const Text('Vé QR'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF16A34A),
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

// ============================================================================
// TAB 4: TÀI KHOẢN & ĐĂNG XUẤT
// ============================================================================
class ProfileTab extends StatelessWidget {
  final Map<String, dynamic>? user;
  const ProfileTab({super.key, this.user});

  @override
  Widget build(BuildContext context) {
    final name = user?['name'] ?? 'Khách Hàng VietTour';
    final email = user?['email'] ?? 'khach1@gmail.com';
    final phone = user?['phone'] ?? '0901234567';
    final roles = (user?['roles'] as List? ?? ['KhachHang']).join(', ');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Tài Khoản', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
        backgroundColor: const Color(0xFF005BAA),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            // PROFILE CARD
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: const Color(0xFF005BAA),
                      child: Text(
                        name.isNotEmpty ? name[0].toUpperCase() : 'V',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900)),
                          const SizedBox(height: 4),
                          Text(email, style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(6)),
                            child: Text(roles, style: const TextStyle(color: Color(0xFF005BAA), fontSize: 11, fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // MENU OPTIONS
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.phone_outlined, color: Color(0xFF005BAA)),
                    title: const Text('Số điện thoại'),
                    subtitle: Text(phone),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.security, color: Color(0xFF005BAA)),
                    title: const Text('Bảo mật & Đổi mật khẩu'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Vui lòng đổi mật khẩu trên cổng Web VietTour')),
                      );
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.info_outline, color: Color(0xFF005BAA)),
                    title: const Text('Về đồ án Khóa Luận Tốt Nghiệp'),
                    subtitle: const Text('ĐH Công Thương TP.HCM (HUIT) - 2026'),
                  ),
                ],
              ),
            ),
            const Spacer(),

            // NÚT ĐĂNG XUẤT
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () async {
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.clear();
                  if (context.mounted) {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  }
                },
                icon: const Icon(Icons.logout, color: Colors.red),
                label: const Text('ĐĂNG XUẤT', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w800)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.red),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
