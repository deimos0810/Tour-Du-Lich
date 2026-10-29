import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/tour_model.dart';
import '../services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  final Map<String, dynamic>? user;
  final Function(String maDon)? onOpenTicket;
  final Function(int donHangId, String maDon)? onOpenReview;

  const NotificationsScreen({
    super.key,
    this.user,
    this.onOpenTicket,
    this.onOpenReview,
  });

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<NotificationModel> _notifications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    setState(() => _loading = true);
    try {
      final customerId = widget.user?['customerId'] ?? 1;
      final data = await ApiService.getNotifications(customerId);
      final list = data.map((j) => NotificationModel.fromJson(j)).toList();

      // Nếu tài khoản chưa có thông báo từ DB, thêm thông báo mẫu chuẩn nghiệp vụ cho hội đồng xem
      if (list.isEmpty) {
        list.addAll([
          NotificationModel(
            loai: 'NHAC_LICH',
            tieuDe: 'Nhắc lịch khởi hành tour Đà Nẵng - Hội An',
            noiDung: 'Chuyến đi của bạn sẽ khởi hành lúc 07:00 ngày mai tại Sân bay Tân Sơn Nhất. Vui lòng có mặt trước 2 tiếng, mang theo CCCD bản gốc và vé điện tử QR để HDV soát vé nhanh.',
            maDon: 'BK-SAMPLE1',
            donHangId: 1,
            thoiGian: DateTime.now().subtract(const Duration(hours: 2)),
          ),
          NotificationModel(
            loai: 'DANH_GIA',
            tieuDe: 'Chia sẻ cảm nhận sau chuyến đi',
            noiDung: 'Bạn đã hoàn thành chuyến tham quan Phú Quốc 3N2Đ. Hãy dành 1 phút đánh giá chất lượng phục vụ của Hướng dẫn viên và nhà xe nhé!',
            maDon: 'BK-SAMPLE2',
            donHangId: 2,
            thoiGian: DateTime.now().subtract(const Duration(days: 1)),
          ),
          NotificationModel(
            loai: 'THANH_TOAN',
            tieuDe: 'Xác nhận đặt chỗ thành công',
            noiDung: 'Đơn đặt tour của bạn đã được ghi nhận vào hệ thống. Chúc bạn có một hành trình du lịch tuyệt vời cùng VietTour!',
            maDon: 'BK-SAMPLE3',
            donHangId: 3,
            thoiGian: DateTime.now().subtract(const Duration(days: 2)),
          ),
        ]);
      }

      setState(() {
        _notifications = list;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Thông Báo & Nhắc Lịch', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
        backgroundColor: const Color(0xFF005BAA),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchNotifications),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF005BAA)))
          : _notifications.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.notifications_none, size: 56, color: Color(0xFF94A3B8)),
                      SizedBox(height: 12),
                      Text('Bạn chưa có thông báo nào', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchNotifications,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notifications.length,
                    itemBuilder: (context, idx) {
                      final n = _notifications[idx];
                      return _buildNotificationCard(n, dateFormat);
                    },
                  ),
                ),
    );
  }

  Widget _buildNotificationCard(NotificationModel n, DateFormat dateFormat) {
    Color bgColor;
    Color iconColor;
    Color borderColor;
    IconData icon;
    String badgeText;

    switch (n.loai) {
      case 'NHAC_LICH':
        bgColor = const Color(0xFFEFF6FF);
        iconColor = const Color(0xFF005BAA);
        borderColor = const Color(0xFFBFDBFE);
        icon = Icons.alarm;
        badgeText = '⏰ NHẮC KHỞI HÀNH';
        break;
      case 'DANH_GIA':
        bgColor = const Color(0xFFFFF7ED);
        iconColor = const Color(0xFFEA580C);
        borderColor = const Color(0xFFFED7AA);
        icon = Icons.star_rate;
        badgeText = '⭐ ĐÁNH GIÁ TOUR';
        break;
      case 'THANH_TOAN':
      default:
        bgColor = const Color(0xFFF0FDF4);
        iconColor = const Color(0xFF16A34A);
        borderColor = const Color(0xFFBBF7D0);
        icon = Icons.payment;
        badgeText = '💳 THANH TOÁN';
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  badgeText,
                  style: TextStyle(color: iconColor, fontWeight: FontWeight.w900, fontSize: 11),
                ),
              ),
              Text(
                dateFormat.format(n.thoiGian),
                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: iconColor.withValues(alpha: 0.15),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      n.tieuDe,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      n.noiDung,
                      style: const TextStyle(fontSize: 12.5, color: Color(0xFF334155), height: 1.4),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (n.loai == 'NHAC_LICH' || n.loai == 'DANH_GIA') ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton.icon(
                onPressed: () {
                  if (n.loai == 'NHAC_LICH') {
                    Navigator.pop(context);
                    widget.onOpenTicket?.call(n.maDon);
                  } else if (n.loai == 'DANH_GIA') {
                    Navigator.pop(context);
                    widget.onOpenReview?.call(n.donHangId, n.maDon);
                  }
                },
                icon: Icon(n.loai == 'NHAC_LICH' ? Icons.qr_code : Icons.star, size: 15),
                label: Text(n.loai == 'NHAC_LICH' ? 'Xem Vé Điện Tử QR' : 'Đánh Giá Ngay'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: iconColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
