import 'package:get/get.dart';
import '../../data/models/tour_model.dart';
import '../home/home_controller.dart';

/// Search/filter controller that works on the tours already loaded by
/// [HomeController]. When [HomeController] has real API data those are used;
/// otherwise the in-memory list (which may be the mock fallback) is filtered.
///
/// This means there is a single source of truth for tour data: [HomeController].
class SearchController extends GetxController {
  final query = ''.obs;
  final region = 'Tất cả'.obs;
  final duration = 'Tất cả'.obs;
  final departure = 'Tất cả'.obs;
  final departureDate = Rxn<DateTime>();
  final minPrice = 0.0.obs;
  final maxPrice = 35000000.0.obs;
  final minRating = 0.0.obs;
  final airfareOnly = false.obs;
  final gridView = false.obs;
  final sortBy = 'Phổ biến'.obs;
  final isLoading = false.obs;

  List<TourModel> get results {
    // Source from HomeController which holds the real API data (or mock fallback).
    final HomeController home = Get.find<HomeController>();
    final source = home.allTours;

    final normalized = query.value.trim().toLowerCase();
    final targetDate = departureDate.value;

    final found = source.where((tour) {
      final matchesQuery =
          normalized.isEmpty ||
          '${tour.title} ${tour.destination} ${tour.region}'
              .toLowerCase()
              .contains(normalized);
      final matchesRegion =
          region.value == 'Tất cả' || tour.region == region.value;
      final dayCount = int.tryParse(tour.duration.split(' ').first) ?? 0;
      final matchesDuration =
          duration.value == 'Tất cả' ||
          (duration.value == '3 ngày trở xuống'
              ? dayCount <= 3
              : dayCount >= 4);
      final matchesDeparture =
          departure.value == 'Tất cả' || tour.departure == departure.value;

      // Lọc theo ngày khởi hành nếu có chọn ngày
      bool matchesDate = true;
      if (targetDate != null) {
        if (tour.departures.isEmpty) {
          matchesDate = false;
        } else {
          // Khớp ngày khởi hành chính xác hoặc chuyến đi trong tương lai gần
          matchesDate = tour.departures.any((dep) {
            final d = dep.startDate;
            final isExactDay = d.year == targetDate.year &&
                d.month == targetDate.month &&
                d.day == targetDate.day;
            final isNearby = (d.year == targetDate.year &&
                d.month == targetDate.month &&
                (d.day - targetDate.day).abs() <= 3);
            return isExactDay || isNearby;
          });
        }
      }

      return matchesQuery &&
          matchesRegion &&
          matchesDuration &&
          matchesDeparture &&
          matchesDate &&
          tour.price >= minPrice.value &&
          tour.price <= maxPrice.value &&
          tour.rating >= minRating.value &&
          (!airfareOnly.value || tour.includesAirfare);
    }).toList();

    if (sortBy.value == 'Giá thấp đến cao') {
      found.sort((a, b) => a.price.compareTo(b.price));
    }
    if (sortBy.value == 'Đánh giá cao') {
      found.sort((a, b) => b.rating.compareTo(a.rating));
    }
    if (sortBy.value == 'Phổ biến') {
      found.sort((a, b) => b.reviewCount.compareTo(a.reviewCount));
    }
    return found;
  }

  void applyQuery(String value) {
    query.value = value;
  }

  void loadResults() {
    // Không cần fake timer, dữ liệu lọc trực tiếp tức thì
  }

  void clearDateFilter() {
    departureDate.value = null;
  }

  void resetFilters() {
    region.value = 'Tất cả';
    duration.value = 'Tất cả';
    departure.value = 'Tất cả';
    departureDate.value = null;
    minPrice.value = 0;
    maxPrice.value = 35000000;
    minRating.value = 0;
    airfareOnly.value = false;
    sortBy.value = 'Phổ biến';
  }
}

class SearchBinding extends Bindings {
  @override
  void dependencies() => Get.lazyPut<SearchController>(SearchController.new);
}
