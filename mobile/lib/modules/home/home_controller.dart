import 'package:get/get.dart';
import '../../data/mock/mock_data.dart';
import '../../data/models/tour_model.dart';
import '../../data/services/tour_service.dart';

/// Load state for async data fetched from the backend.
enum LoadState { idle, loading, success, error, empty }

class HomeController extends GetxController {
  HomeController({TourService? tourService})
      : _tourService = tourService ?? TourService();

  final TourService _tourService;

  final selectedFilter = 'Tất cả Tour'.obs;
  final bannerIndex = 0.obs;

  /// Current load state for the tour list.
  final loadState = LoadState.idle.obs;
  bool get isLoading => loadState.value == LoadState.loading;

  /// Human-readable error message shown when [loadState] == [LoadState.error].
  final errorMessage = ''.obs;

  /// Tours fetched from the backend (may be empty if API unavailable).
  final _apiTours = <TourModel>[].obs;

  /// Whether the tour list is coming from the backend (true) or mock data (false).
  bool get _usingApi => _apiTours.isNotEmpty;

  final filters = const [
    'Tất cả Tour',
    'Tour Miền Trung',
    'Tour Miền Bắc',
    'Tour Miền Nam',
    'Tour Quốc Tế',
  ];

  @override
  void onInit() {
    super.onInit();
    fetchTours();
  }

  /// Fetches all tours from the NestJS backend.
  ///
  /// Falls back gracefully to [MockData] when the backend is unreachable so the
  /// UI still renders during development without the backend running.
  Future<void> fetchTours() async {
    loadState.value = LoadState.loading;
    errorMessage.value = '';
    try {
      final tours = await _tourService.fetchTours();
      _apiTours.assignAll(tours);
      loadState.value = tours.isEmpty ? LoadState.empty : LoadState.success;
    } catch (e) {
      // Backend unreachable — surface the error but let the UI fall back to
      // mock data so the rest of the app is still usable.
      errorMessage.value = _friendlyError(e);
      loadState.value = LoadState.error;
      // Keep any previously loaded tours; if none, use mock as fallback.
      if (_apiTours.isEmpty) {
        _apiTours.assignAll(MockData.tours);
      }
    }
  }

  /// All visible tours filtered by the currently selected tab.
  List<TourModel> get visibleTours {
    final source = _usingApi ? _apiTours : MockData.tours;
    final filter = selectedFilter.value.trim();
    if (filter == 'Tất cả Tour' || filter == 'Tất cả' || filter.isEmpty) {
      return source;
    }
    final target = filter.replaceFirst('Tour ', '').toLowerCase();
    final matched = source.where((tour) {
      final r = tour.region.toLowerCase();
      final d = tour.destination.toLowerCase();
      final t = tour.title.toLowerCase();
      if (target.contains('trung')) {
        return r.contains('trung') ||
            d.contains('đà nẵng') ||
            d.contains('hội an') ||
            d.contains('huế') ||
            d.contains('nha trang') ||
            t.contains('đà nẵng') ||
            t.contains('hội an') ||
            t.contains('miền trung');
      }
      if (target.contains('bắc')) {
        return r.contains('bắc') ||
            d.contains('sapa') ||
            d.contains('hạ long') ||
            d.contains('lào cai') ||
            d.contains('quảng ninh') ||
            d.contains('hà nội') ||
            t.contains('sapa') ||
            t.contains('hạ long') ||
            t.contains('miền bắc');
      }
      if (target.contains('nam')) {
        return r.contains('nam') ||
            d.contains('phú quốc') ||
            d.contains('đà lạt') ||
            d.contains('cần thơ') ||
            d.contains('miền tây') ||
            d.contains('hồ chí minh') ||
            t.contains('phú quốc') ||
            t.contains('đà lạt') ||
            t.contains('miền nam');
      }
      if (target.contains('quốc tế') || target.contains('quoc te')) {
        return tour.isInternational ||
            r.contains('quốc tế') ||
            d.contains('nhật') ||
            d.contains('tokyo') ||
            t.contains('nhật') ||
            t.contains('quốc tế');
      }
      return r.contains(target) || d.contains(target) || t.contains(target);
    }).toList();
    return matched.isNotEmpty ? matched : source;
  }

  /// All tours (unfiltered) — used by search screen.
  List<TourModel> get allTours =>
      _usingApi ? List<TourModel>.unmodifiable(_apiTours) : MockData.tours;

  void selectFilter(String value) => selectedFilter.value = value;

  String _friendlyError(Object e) {
    final msg = e.toString();
    if (msg.contains('SocketException') ||
        msg.contains('Connection refused') ||
        msg.contains('Failed host lookup')) {
      return 'Không kết nối được backend. Đảm bảo backend đang chạy tại http://localhost:4000';
    }
    return msg;
  }
}

class HomeBinding extends Bindings {
  @override
  void dependencies() => Get.lazyPut<HomeController>(HomeController.new);
}
