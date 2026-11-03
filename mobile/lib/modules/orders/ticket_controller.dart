import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:get/get.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/constants/api_config.dart';
import '../../core/controllers/app_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/network/auth_session.dart';
import '../../data/services/orders_service.dart';

class TicketController extends GetxController {
  TicketController({OrdersService? ordersService, ApiClient? apiClient})
    : _ordersService = ordersService ?? OrdersService(),
      _api = apiClient ?? ApiClient();

  static String? pendingBookingCode;

  final OrdersService _ordersService;
  final ApiClient _api;
  final ticket = Rxn<Map<String, dynamic>>();
  final loading = false.obs;
  final savingQr = false.obs;
  final checkingInId = RxnInt();
  final errorMessage = ''.obs;
  final qrBoundaryKey = GlobalKey();

  /// Danh sách ảnh Vé QR đã lưu trong máy / đồng bộ từ server
  final savedQrList = <Map<String, dynamic>>[].obs;

  /// Ảnh Vé QR vừa được Hướng dẫn viên tải lên để quét điểm danh
  final uploadedQrTicket = Rxn<Map<String, dynamic>>();

  String bookingCode = '';

  bool get isGuideOrStaff {
    if (!Get.isRegistered<AppController>()) return false;
    return Get.find<AppController>().isGuideOrStaff;
  }

  String get currentUserName {
    if (!Get.isRegistered<AppController>()) return '';
    return Get.find<AppController>().displayName;
  }

  @override
  void onInit() {
    super.onInit();
    final arg = Get.arguments;
    final paramCode = Get.parameters['code'];
    if (arg is String && arg.trim().isNotEmpty) {
      bookingCode = arg.trim();
    } else if (paramCode != null && paramCode.trim().isNotEmpty) {
      bookingCode = paramCode.trim();
    } else if (pendingBookingCode != null &&
        pendingBookingCode!.trim().isNotEmpty) {
      bookingCode = pendingBookingCode!.trim();
    }

    if (bookingCode.isEmpty) {
      errorMessage.value =
          'Không tìm thấy mã đơn đặt tour để hiển thị vé điện tử.';
      return;
    }
    loadTicket();
    refreshSavedQrList();
  }

  Future<void> loadTicket() async {
    if (bookingCode.isEmpty) return;
    loading.value = true;
    errorMessage.value = '';
    try {
      ticket.value = await _ordersService.getTicket(bookingCode);
    } on ApiClientException catch (error) {
      errorMessage.value = error.message;
    } catch (_) {
      errorMessage.value =
          'Không thể tải thông tin vé điện tử. Vui lòng thử lại.';
    } finally {
      loading.value = false;
    }
  }

  Future<void> refreshSavedQrList() async {
    final local = await AuthSession.instance.getSavedQrTicketsLocal();
    final remote = await _ordersService.getSavedQrFromServer();
    final merged = <Map<String, dynamic>>[...local];
    for (final item in remote) {
      final id = item['id']?.toString() ??
          '${item['maDon']}_${item['chiTietId']}';
      final idx = merged.indexWhere((x) => x['id'] == id);
      if (idx >= 0) {
        merged[idx] = {
          ...merged[idx],
          ...item,
          if (merged[idx]['imageBase64'] != null &&
              (item['imageBase64'] == null ||
                  item['imageBase64'].toString().isEmpty))
            'imageBase64': merged[idx]['imageBase64'],
        };
      } else {
        merged.add(item);
      }
    }
    savedQrList.assignAll(merged);
  }

  /// Tạo ảnh PNG từ vùng thẻ QR hoặc vẽ trực tiếp từ QrPainter
  Future<Uint8List?> _captureQrPngBytes(String qrDataUrl) async {
    try {
      final boundaryContext = qrBoundaryKey.currentContext;
      if (boundaryContext != null) {
        final renderObject = boundaryContext.findRenderObject();
        if (renderObject is RenderRepaintBoundary) {
          final image = await renderObject.toImage(pixelRatio: 2.0);
          final byteData = await image.toByteData(
            format: ui.ImageByteFormat.png,
          );
          if (byteData != null) {
            return byteData.buffer.asUint8List();
          }
        }
      }
    } catch (_) {
      // Fallback to QrPainter below
    }

    try {
      final painter = QrPainter(
        data: qrDataUrl,
        version: QrVersions.auto,
        errorCorrectionLevel: QrErrorCorrectLevel.M,
        gapless: true,
      );
      final byteData = await painter.toImageData(
        360,
        format: ui.ImageByteFormat.png,
      );
      return byteData?.buffer.asUint8List();
    } catch (_) {
      return null;
    }
  }

  /// Khách hàng bấm "Lưu / Tải ảnh Vé QR về máy"
  Future<Map<String, dynamic>?> savePassengerQrImage({
    required String maDon,
    required Map<String, dynamic> passenger,
    required String tenTour,
    required String ngayKhoiHanh,
    required String qrDataUrl,
    required String ticketCode,
  }) async {
    if (savingQr.value) return null;
    savingQr.value = true;
    try {
      final pngBytes = await _captureQrPngBytes(qrDataUrl);
      final base64Img = pngBytes != null ? base64Encode(pngBytes) : '';
      final chiTietId = (passenger['ChiTietID'] as num?)?.toInt() ?? 0;
      final hoTen = (passenger['HoTen'] ?? 'Hành khách').toString();
      final cccd = passenger['CCCD']?.toString();

      final payload = <String, dynamic>{
        'id': '${maDon}_$chiTietId',
        'maDon': maDon,
        'chiTietId': chiTietId,
        'hoTen': hoTen,
        'cccd': cccd,
        'maQRVe': ticketCode,
        'tenTour': tenTour,
        'ngayKhoiHanh': ngayKhoiHanh,
        'qrDataUrl': qrDataUrl,
        'imageBase64': base64Img,
        'fileName': 'VT_QR_${maDon}_$chiTietId.png',
        'trangThaiDiemDanh': passenger['TrangThaiDiemDanh'] ?? 0,
        'savedAt': DateTime.now().toIso8601String(),
      };

      await AuthSession.instance.saveQrTicketLocal(payload);
      await _ordersService.saveQrToServer(payload);
      await refreshSavedQrList();
      return payload;
    } finally {
      savingQr.value = false;
    }
  }

  /// Hướng dẫn viên chọn 1 ảnh Vé QR để tải lên và tự động điểm danh
  Future<void> loadAndCheckInFromSavedQr(Map<String, dynamic> qrItem) async {
    uploadedQrTicket.value = qrItem;
    final targetMaDon = (qrItem['maDon'] ?? '').toString().trim();
    final chiTietId = (qrItem['chiTietId'] as num?)?.toInt() ?? 0;
    final qrDataUrl = (qrItem['qrDataUrl'] ?? qrItem['maQRVe'] ?? '').toString();

    if (targetMaDon.isNotEmpty && targetMaDon != bookingCode) {
      bookingCode = targetMaDon;
      pendingBookingCode = targetMaDon;
    }

    checkingInId.value = chiTietId;
    try {
      if (chiTietId > 0) {
        await _api.postJson(
          '${ApiConfig.bookings}/checkin/$chiTietId',
          authenticated: false,
          body: const {},
        );
      } else if (qrDataUrl.isNotEmpty) {
        await _ordersService.checkInByQr(qrDataUrl);
      }
      uploadedQrTicket.value = {
        ...qrItem,
        'trangThaiDiemDanh': 1,
      };
      await AuthSession.instance.saveQrTicketLocal(uploadedQrTicket.value!);
      await loadTicket();
      await refreshSavedQrList();
      Get.snackbar(
        'Quét ảnh QR & Điểm danh thành công',
        'Đã xác nhận hành khách ${qrItem['hoTen'] ?? ''} (${qrItem['maQRVe'] ?? ''}) lên đoàn!',
        backgroundColor: const Color(0xFF15803D),
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(14),
        duration: const Duration(seconds: 3),
      );
    } on ApiClientException catch (error) {
      Get.snackbar(
        'Điểm danh thất bại',
        error.message,
        backgroundColor: const Color(0xFFBE123C),
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      checkingInId.value = null;
    }
  }

  Future<void> checkInPassenger(int chiTietId) async {
    checkingInId.value = chiTietId;
    try {
      await _api.postJson(
        '${ApiConfig.bookings}/checkin/$chiTietId',
        authenticated: false,
        body: const {},
      );
      Get.snackbar(
        'Điểm danh thành công',
        'Đã xác nhận hành khách lên đoàn.',
        backgroundColor: const Color(0xFF15803D),
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(14),
      );
      await loadTicket();
      await refreshSavedQrList();
    } on ApiClientException catch (error) {
      Get.snackbar('Điểm danh thất bại', error.message);
    } finally {
      checkingInId.value = null;
    }
  }
}

class TicketBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<TicketController>(TicketController.new, fenix: true);
  }
}
