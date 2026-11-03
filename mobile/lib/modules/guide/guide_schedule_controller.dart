import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/guide_schedule_model.dart';
import '../../data/services/guide_service.dart';

class GuideScheduleController extends GetxController {
  GuideScheduleController({GuideService? guideService})
      : _guideService = guideService ?? GuideService();

  final GuideService _guideService;

  final loading = false.obs;
  final errorMessage = ''.obs;
  final guideInfo = Rxn<GuideInfoModel>();
  final allSchedules = <GuideScheduleItemModel>[].obs;
  final selectedFilter = 'Tất cả'.obs;
  final qrInputController = TextEditingController();

  static const filterTabs = ['Tất cả', 'Chờ xác nhận', 'Đã xác nhận'];

  List<GuideScheduleItemModel> get filteredSchedules {
    final filter = selectedFilter.value;
    if (filter == 'Chờ xác nhận') {
      return allSchedules.where((s) => s.isPending).toList();
    }
    if (filter == 'Đã xác nhận') {
      return allSchedules.where((s) => s.isConfirmed).toList();
    }
    return allSchedules.toList();
  }

  @override
  void onInit() {
    super.onInit();
    loadSchedule();
  }

  @override
  void onClose() {
    qrInputController.dispose();
    super.onClose();
  }

  Future<void> loadSchedule() async {
    loading.value = true;
    errorMessage.value = '';
    try {
      final res = await _guideService.fetchMySchedule();
      guideInfo.value = res.guide;
      allSchedules.assignAll(res.schedules);
    } on ApiClientException catch (e) {
      errorMessage.value = e.message;
    } catch (e) {
      errorMessage.value = 'Không thể tải lịch dẫn đoàn: $e';
    } finally {
      loading.value = false;
    }
  }

  Future<void> confirmAssignment(GuideScheduleItemModel item) async {
    try {
      await _guideService.respondAssignment(item.dispatchId, 'Da xac nhan');
      Get.snackbar(
        'Đã nhận tour thành công',
        'Bạn đã xác nhận phụ trách đoàn ${item.tourName} (${item.departureCode}).',
        backgroundColor: const Color(0xFF10B981),
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
      );
      await loadSchedule();
    } on ApiClientException catch (e) {
      Get.snackbar('Không thể nhận tour', e.message);
    }
  }

  Future<void> togglePax(GuideScheduleItemModel schedule, GuidePassengerModel pax) async {
    try {
      await _guideService.togglePaxCheckin(pax.id);
      await loadSchedule();
    } on ApiClientException catch (e) {
      Get.snackbar('Lỗi điểm danh', e.message);
    }
  }

  Future<Map<String, dynamic>?> checkinWithCode(String code, {int? lichId}) async {
    final clean = code.trim();
    if (clean.isEmpty) {
      Get.snackbar('Thiếu thông tin', 'Vui lòng nhập mã vé hoặc quét QR');
      return null;
    }
    try {
      final res = await _guideService.checkinByQr(clean, lichId: lichId);
      final msg = res['message']?.toString() ?? 'Điểm danh khách thành công';
      qrInputController.clear();
      await loadSchedule();
      return {
        'success': true,
        'message': msg,
        'maDon': res['maDon'],
        'hanhKhach': res['hanhKhach'],
      };
    } on ApiClientException catch (e) {
      Get.snackbar('Không thể điểm danh', e.message);
      return {
        'success': false,
        'message': e.message,
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Lỗi điểm danh: $e',
      };
    }
  }
}

