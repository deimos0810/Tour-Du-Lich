import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/constants/app_routes.dart';
import '../../core/controllers/app_controller.dart';
import '../../core/network/api_client.dart';
import '../../data/models/departure_model.dart';
import '../../data/models/tour_model.dart';
import '../../data/services/booking_service.dart';

/// Form dữ liệu của từng hành khách trong đoàn
class PassengerFormItem {
  PassengerFormItem({
    String name = '',
    String gender = 'Nam',
    String cccd = '',
    bool isAdult = true,
  })  : nameController = TextEditingController(text: name),
        cccdController = TextEditingController(text: cccd),
        gender = gender.obs,
        isAdult = isAdult.obs,
        nameValue = name.obs,
        cccdValue = cccd.obs {
    nameController.addListener(() {
      nameValue.value = nameController.text;
    });
    cccdController.addListener(() {
      cccdValue.value = cccdController.text;
    });
  }

  final TextEditingController nameController;
  final TextEditingController cccdController;
  final RxString gender;
  final RxBool isAdult;
  final RxString nameValue;
  final RxString cccdValue;

  String get name => nameValue.value.trim();
  String get cccd => cccdValue.value.trim();

  bool get isValid =>
      name.length >= 2 && RegExp(r'^\d{12}$').hasMatch(cccd);

  void dispose() {
    nameController.dispose();
    cccdController.dispose();
  }
}

class BookingController extends GetxController {
  BookingController({BookingService? bookingService})
      : _bookingService = bookingService ?? BookingService();

  final BookingService _bookingService;
  late final TourModel tour;
  final selectedDeparture = Rxn<DepartureModel>();
  final adults = 1.obs;
  final children = 0.obs;
  final loading = false.obs;

  final contactName = TextEditingController();
  final contactEmail = TextEditingController();
  final contactPhone = TextEditingController();

  final voucherCode = TextEditingController();
  final voucherLoading = false.obs;
  final voucherDiscount = 0.obs;
  final appliedVoucher = RxnString();
  final formKey = GlobalKey<FormState>();

  final passengers = <PassengerFormItem>[].obs;

  int get total {
    final adultPrice = selectedDeparture.value?.price ?? tour.price;
    return adultPrice * adults.value + tour.childPrice * children.value;
  }

  int get availableSeats => selectedDeparture.value?.remainingSeats ?? 0;
  int get totalGuests => adults.value + children.value;
  int get totalAfterDiscount =>
      (total - voucherDiscount.value).clamp(0, total).toInt();

  bool get isPassengersIncomplete =>
      passengers.any((p) => !p.isValid);

  int get missingPassengersCount =>
      passengers.where((p) => !p.isValid).length;

  @override
  void onInit() {
    super.onInit();
    final arguments = Get.arguments;
    if (arguments is! Map ||
        arguments['tour'] is! TourModel ||
        arguments['departure'] is! DepartureModel) {
      throw StateError('Thiếu thông tin tour hoặc lịch khởi hành.');
    }
    tour = arguments['tour'] as TourModel;
    selectedDeparture.value = arguments['departure'] as DepartureModel;

    final user = Get.find<AppController>().currentUser.value;
    contactName.text = (user?['name'] ?? user?['hoTen'] ?? '').toString();
    contactEmail.text = (user?['email'] ?? '').toString();
    contactPhone.text = (user?['phone'] ?? '').toString();

    // Khởi tạo hành khách đầu tiên (Trưởng đoàn)
    final initialCccd = (user?['cccd'] ?? '').toString();
    passengers.add(
      PassengerFormItem(
        name: contactName.text,
        gender: (user?['gioiTinh'] ?? 'Nam').toString(),
        cccd: initialCccd,
        isAdult: true,
      ),
    );
    _syncPassengers();
  }

  void _syncPassengers() {
    final targetTotal = totalGuests;
    while (passengers.length < targetTotal) {
      final isAdult = passengers.length < adults.value;
      passengers.add(
        PassengerFormItem(
          isAdult: isAdult,
        ),
      );
    }
    while (passengers.length > targetTotal && passengers.length > 1) {
      final last = passengers.removeLast();
      last.dispose();
    }
    for (int i = 0; i < passengers.length; i++) {
      passengers[i].isAdult.value = (i < adults.value);
    }
  }

  void setDeparture(DepartureModel? departure) {
    selectedDeparture.value = departure;
    _clearVoucher();
    if (departure != null &&
        adults.value + children.value > departure.remainingSeats) {
      if (adults.value > departure.remainingSeats) {
        adults.value = departure.remainingSeats > 0
            ? departure.remainingSeats
            : 1;
      }
      children.value = (departure.remainingSeats - adults.value)
          .clamp(0, 20)
          .toInt();
    }
    _syncPassengers();
  }

  void incrementAdults() {
    if (adults.value + children.value < availableSeats) {
      adults.value++;
      _clearVoucher();
      _syncPassengers();
    }
  }

  void decrementAdults() {
    if (adults.value > 1) {
      adults.value--;
      _clearVoucher();
      _syncPassengers();
    }
  }

  void incrementChildren() {
    if (adults.value + children.value < availableSeats) {
      children.value++;
      _clearVoucher();
      _syncPassengers();
    }
  }

  void decrementChildren() {
    if (children.value > 0) {
      children.value--;
      _clearVoucher();
      _syncPassengers();
    }
  }

  Future<void> applyVoucher() async {
    final departure = selectedDeparture.value;
    final code = voucherCode.text.trim().toUpperCase();
    if (code.isEmpty) {
      Get.snackbar('Mã ưu đãi', 'Vui lòng nhập mã ưu đãi.');
      return;
    }
    if (departure == null || !departure.isBookable) {
      Get.snackbar('Mã ưu đãi', 'Vui lòng chọn lịch khởi hành còn chỗ.');
      return;
    }
    voucherLoading.value = true;
    try {
      final result = await _bookingService.validateVoucher(
        code: code,
        departureId: departure.id,
        adults: adults.value,
        children: children.value,
      );
      voucherDiscount.value = (result['giamGia'] as num).round();
      appliedVoucher.value = result['maKhuyenMai']?.toString() ?? code;
      Get.snackbar('Đã áp dụng mã', 'Mã ưu đãi đã được xác nhận từ máy chủ.');
    } on ApiClientException catch (error) {
      _clearVoucher();
      Get.snackbar('Mã ưu đãi không hợp lệ', error.message);
    } finally {
      voucherLoading.value = false;
    }
  }

  void _clearVoucher() {
    voucherDiscount.value = 0;
    appliedVoucher.value = null;
  }

  void removeVoucher() {
    voucherCode.clear();
    _clearVoucher();
  }

  Future<void> confirm() async {
    if (!(formKey.currentState?.validate() ?? false)) return;

    final departure = selectedDeparture.value;
    if (departure == null || !departure.isBookable) {
      Get.snackbar(
        'Không thể đặt tour',
        'Vui lòng chọn lịch khởi hành còn chỗ.',
      );
      return;
    }
    if (adults.value + children.value > departure.remainingSeats) {
      Get.snackbar('Không đủ chỗ', 'Số khách vượt quá số chỗ còn lại.');
      return;
    }

    // Ràng buộc thông tin hành khách giống bản Web
    if (isPassengersIncomplete) {
      Get.snackbar(
        'Thiếu thông tin hành khách',
        'Vui lòng điền đủ Họ và tên (tối thiểu 2 ký tự) và số CCCD 12 chữ số cho tất cả $missingPassengersCount hành khách còn lại.',
        backgroundColor: const Color(0xFFFEF3C7),
        colorText: const Color(0xFFB45309),
        duration: const Duration(seconds: 4),
      );
      return;
    }

    loading.value = true;
    try {
      final hanhKhachList = passengers.asMap().entries.map((entry) {
        final idx = entry.key;
        final p = entry.value;
        return {
          'hoTen': p.name.isNotEmpty ? p.name : 'Hành khách ${idx + 1}',
          'gioiTinh': p.gender.value,
          'cccd': p.cccd,
          'loaiKhach': p.isAdult.value ? 'Nguoi lon' : 'Tre em',
        };
      }).toList();

      final booking = await _bookingService.createBooking(
        departureId: departure.id,
        adults: adults.value,
        children: children.value,
        contactName: contactName.text.trim(),
        contactEmail: contactEmail.text.trim(),
        contactPhone: contactPhone.text.trim(),
        hanhKhach: hanhKhachList,
        voucherCode: appliedVoucher.value,
      );
      Get.offNamed(AppRoutes.bookingSuccess, arguments: booking);
    } on ApiClientException catch (error) {
      Get.snackbar('Không thể tạo đơn', error.message);
    } finally {
      loading.value = false;
    }
  }

  @override
  void onClose() {
    contactName.dispose();
    contactEmail.dispose();
    contactPhone.dispose();
    voucherCode.dispose();
    for (final p in passengers) {
      p.dispose();
    }
    super.onClose();
  }
}

class BookingBinding extends Bindings {
  @override
  void dependencies() => Get.lazyPut<BookingController>(BookingController.new);
}
