import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/constants/app_routes.dart';
import '../../data/models/departure_model.dart';
import '../../data/models/tour_model.dart';
import '../../data/services/tour_service.dart';

class TourDetailController extends GetxController {
  TourDetailController({TourService? tourService})
      : _tourService = tourService ?? TourService();

  final TourService _tourService;
  late final Rx<TourModel> tour;
  final pageController = PageController();
  final selectedImage = 0.obs;
  final departures = <DepartureModel>[].obs;
  final selectedDepartureId = RxnInt();
  final loadingDepartures = false.obs;

  @override
  void onInit() {
    super.onInit();
    final initialTour = Get.arguments as TourModel;
    tour = Rx<TourModel>(initialTour);
    departures.assignAll(initialTour.departures);
    _loadTourDetail();
  }

  @override
  void onClose() {
    pageController.dispose();
    super.onClose();
  }

  TourModel get currentTour => tour.value;

  /// Danh sách ảnh chuẩn xác theo điểm đến và lịch trình từng ngày (loại bỏ ảnh rác, ảnh không liên quan)
  List<String> get tourImages {
    final t = tour.value;
    final List<String> list = [t.imageUrl];

    // Bổ sung ảnh từ từng ngày trong lịch trình nếu có
    for (final day in t.itineraryDays) {
      if (day.image != null && day.image!.isNotEmpty && !list.contains(day.image)) {
        list.add(day.image!);
      }
    }

    // Nếu chưa đủ 3 ảnh, bổ sung ảnh danh lam thắng cảnh thực tế của địa danh đó
    if (list.length < 3) {
      final dest = t.destination.toLowerCase();
      if (dest.contains('phú quốc') || dest.contains('phu quoc')) {
        list.addAll(['/uploads/tours/pq_day1.jpg', '/uploads/tours/pq_day2.jpg', '/uploads/tours/pq_day3.jpg', '/uploads/tours/pq_day4.jpg']);
      } else if (dest.contains('đà nẵng') || dest.contains('da nang')) {
        list.addAll(['/uploads/tours/dn_day1.jpg', '/uploads/tours/dn_day2.jpg', '/uploads/tours/dn_day3.jpg', '/uploads/tours/dn_day4.jpg']);
      } else if (dest.contains('sapa')) {
        list.addAll(['/uploads/tours/sp_day1.jpg', '/uploads/tours/sp_day2.jpg', '/uploads/tours/sp_day3.jpg']);
      } else if (dest.contains('hạ long') || dest.contains('ha long')) {
        list.addAll(['/uploads/tours/hl_day1.jpg', '/uploads/tours/hl_day2.jpg']);
      } else if (dest.contains('nhật') || dest.contains('tokyo') || dest.contains('japan')) {
        list.addAll(['/uploads/tours/jp_day1.jpg', '/uploads/tours/jp_day2.jpg', '/uploads/tours/jp_day3.jpg', '/uploads/tours/jp_day4.jpg']);
      }
    }

    return list.toSet().toList();
  }

  DepartureModel? get selectedDeparture {
    final id = selectedDepartureId.value;
    if (id == null) {
      for (final departure in departures) {
        if (departure.isBookable) return departure;
      }
      return departures.isNotEmpty ? departures.first : null;
    }
    for (final departure in departures) {
      if (departure.id == id) return departure;
    }
    return null;
  }

  Future<void> _loadTourDetail() async {
    final id = int.tryParse(tour.value.id);
    if (id == null) return;
    loadingDepartures.value = true;
    try {
      final detail = await _tourService.fetchTourById(id);
      tour.value = detail;
      departures.assignAll(detail.departures);
      if (selectedDepartureId.value == null && detail.departures.isNotEmpty) {
        final firstBookable = detail.departures.firstWhereOrNull((d) => d.isBookable);
        if (firstBookable != null) {
          selectedDepartureId.value = firstBookable.id;
        }
      }
    } on ApiException catch (error) {
      Get.snackbar('Không tải được thông tin chi tiết', error.message);
    } finally {
      loadingDepartures.value = false;
    }
  }

  void bookSelectedDeparture() {
    final departure = selectedDeparture;
    if (departure == null || !departure.isBookable) {
      Get.snackbar('Chọn lịch khởi hành', 'Vui lòng chọn lịch còn chỗ trống.');
      return;
    }
    Get.toNamed(
      AppRoutes.booking,
      arguments: {'tour': tour.value, 'departure': departure},
    );
  }
}

class TourDetailBinding extends Bindings {
  @override
  void dependencies() =>
      Get.lazyPut<TourDetailController>(TourDetailController.new);
}
