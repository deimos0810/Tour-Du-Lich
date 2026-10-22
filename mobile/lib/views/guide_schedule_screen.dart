import 'package:flutter/material.dart';
import '../services/api_service.dart';

class GuideScheduleScreen extends StatefulWidget {
  final Map<String, dynamic>? user;

  const GuideScheduleScreen({super.key, this.user});

  @override
  State<GuideScheduleScreen> createState() => _GuideScheduleScreenState();
}

class _GuideScheduleScreenState extends State<GuideScheduleScreen> {
  List<dynamic> _schedules = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchSchedule();
  }

  Future<void> _fetchSchedule() async {
    setState(() => _loading = true);
    try {
      final taiKhoanId = widget.user?['id'] ?? 4; // default HDV 1
      final data = await ApiService.getGuideSchedule(taiKhoanId);
      setState(() {
        _schedules = data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  void _openPassengerList(dynamic schedule) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PassengerCheckinModal(schedule: schedule, user: widget.user),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Lịch Dẫn Đoàn Của Tôi', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
        backgroundColor: const Color(0xFF005BAA),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchSchedule),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF005BAA)))
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 12),
                      Text(_error!, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _fetchSchedule, child: const Text('Thử Lại')),
                    ],
                  ),
                )
              : _schedules.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.event_busy, size: 56, color: Color(0xFF94A3B8)),
                          const SizedBox(height: 12),
                          const Text('Bạn chưa có lịch phân công dẫn đoàn nào', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                          const SizedBox(height: 12),
                          ElevatedButton(onPressed: _fetchSchedule, child: const Text('Làm mới')),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _schedules.length,
                      itemBuilder: (context, idx) {
                        final item = _schedules[idx];
                        final lich = item['LichKhoiHanh'] ?? {};
                        final tour = lich['Tour'] ?? {};
                        final ngayDi = lich['NgayKhoiHanh'] != null ? lich['NgayKhoiHanh'].toString().split('T').first : '';
                        final vaiTro = item['VaiTro'] ?? 'HDV Chính';

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
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    vaiTro,
                                    style: const TextStyle(color: Color(0xFF005BAA), fontWeight: FontWeight.w800, fontSize: 11),
                                  ),
                                ),
                                Text(
                                  'Mã lịch: ${lich['MaLich'] ?? ''}',
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              tour['TenTour'] ?? 'Tour Du Lịch',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                const Icon(Icons.calendar_today, size: 14, color: Color(0xFF64748B)),
                                const SizedBox(width: 4),
                                Text('Khởi hành: $ngayDi', style: const TextStyle(fontSize: 13, color: Color(0xFF475569))),
                                const Spacer(),
                                const Icon(Icons.group, size: 16, color: Color(0xFF005BAA)),
                                const SizedBox(width: 4),
                                Text(
                                  'Đoàn: ${lich['SoChoDaDat'] ?? 0}/${lich['SoChoToiDa'] ?? 0} khách',
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF005BAA)),
                                ),
                              ],
                            ),
                            const Divider(height: 24),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: () => _openPassengerList(item),
                                icon: const Icon(Icons.qr_code_scanner, size: 18),
                                label: const Text('DANH SÁCH ĐOÀN & ĐIỂM DANH QR'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF005BAA),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

// MODAL ĐIỂM DANH ĐOÀN KHÁCH & QUÉT MÃ QR
class PassengerCheckinModal extends StatefulWidget {
  final dynamic schedule;
  final Map<String, dynamic>? user;

  const PassengerCheckinModal({super.key, required this.schedule, this.user});

  @override
  State<PassengerCheckinModal> createState() => _PassengerCheckinModalState();
}

class _PassengerCheckinModalState extends State<PassengerCheckinModal> {
  final _qrInputController = TextEditingController();
  bool _submitting = false;

  Future<void> _checkinCode(String code) async {
    if (code.trim().isEmpty) return;
    setState(() => _submitting = true);
    try {
      final taiKhoanId = widget.user?['id'] ?? 4;
      final res = await ApiService.checkinQR(
        maQRVe: code.trim(),
        taiKhoanId: taiKhoanId,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF16A34A),
            content: Text(res['message'] ?? 'Điểm danh thành công!'),
          ),
        );
        _qrInputController.clear();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text(e.toString().replaceAll('Exception: ', '')),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lich = widget.schedule['LichKhoiHanh'] ?? {};
    final tour = lich['Tour'] ?? {};
    final bookings = lich['DonDatTour'] as List? ?? [];

    // Tập hợp toàn bộ hành khách từ các đơn hàng
    final List<Map<String, dynamic>> allPassengers = [];
    for (var b in bookings) {
      final passengers = b['ChiTietHanhKhach'] as List? ?? [];
      for (var p in passengers) {
        allPassengers.add({
          'hoTen': p['HoTen'] ?? 'Hành khách',
          'cccd': p['CCCD'] ?? '',
          'maQRVe': p['MaQRVe'] ?? 'VT-${b['MaDon']}',
          'maDon': b['MaDon'] ?? '',
          'diemDanh': p['TrangThaiDiemDanh'] == 1,
        });
      }
    }

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Danh Sách Đoàn & Điểm Danh', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                    Text(tour['TenTour'] ?? '', style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B))),
                  ],
                ),
              ),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const SizedBox(height: 14),

          // Ô NHẬP HOẶC QUÉT MÃ QR NHANH
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFBFDBFE)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _qrInputController,
                    decoration: const InputDecoration(
                      hintText: 'Nhập mã QR vé (VT-...) để điểm danh',
                      isDense: true,
                      border: InputBorder.none,
                      hintStyle: TextStyle(fontSize: 13),
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: _submitting ? null : () => _checkinCode(_qrInputController.text),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF005BAA),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: _submitting
                      ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Soát Vé'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // TỔNG SỐ KHÁCH
          Text(
            'Tổng danh sách: ${allPassengers.length} hành khách trong đoàn',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 10),

          // DANH SÁCH HÀNH KHÁCH
          Expanded(
            child: allPassengers.isEmpty
                ? const Center(child: Text('Chưa có khách đặt tour trong đợt này'))
                : ListView.builder(
                    itemCount: allPassengers.length,
                    itemBuilder: (context, idx) {
                      final p = allPassengers[idx];
                      final isCheckedIn = p['diemDanh'] == true;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: isCheckedIn ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: isCheckedIn ? const Color(0xFFBBF7D0) : const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 16,
                              backgroundColor: isCheckedIn ? const Color(0xFF16A34A) : const Color(0xFF94A3B8),
                              child: Text('${idx + 1}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(p['hoTen'], style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                                  Text('CCCD: ${p['cccd'].isNotEmpty ? p['cccd'] : 'Chưa nhập'} • Đơn: ${p['maDon']}',
                                      style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                                  Text('Mã vé: ${p['maQRVe']}',
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF005BAA))),
                                ],
                              ),
                            ),
                            if (isCheckedIn)
                              const Chip(
                                label: Text('✓ Đã Lên Xe', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)),
                                backgroundColor: Color(0xFF16A34A),
                                padding: EdgeInsets.zero,
                              )
                            else
                              OutlinedButton(
                                onPressed: () => _checkinCode(p['maQRVe']),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: const Text('Điểm danh', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
