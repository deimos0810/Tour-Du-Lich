import 'dart:async';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../core/constants/app_routes.dart';
import '../../core/constants/api_config.dart';
import '../../core/controllers/app_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/network/auth_session.dart';
import '../../data/services/auth_service.dart';

class AuthController extends GetxController {
  AuthController({AuthService? authService})
      : _authService = authService ?? AuthService();

  final AuthService _authService;

  final formKey = GlobalKey<FormState>();
  final email = TextEditingController();
  final password = TextEditingController();
  final name = TextEditingController();
  final phone = TextEditingController();
  final obscurePassword = true.obs;
  final loading = false.obs;

  // OTP reset-password flow
  final otpStep = false.obs;
  final otp = TextEditingController();
  final newPassword = TextEditingController();

  // Đếm ngược gửi lại OTP (5 phút = 300 giây)
  final resendSeconds = 0.obs;
  Timer? _resendTimer;

  String get resendCountdownText {
    final m = resendSeconds.value ~/ 60;
    final s = resendSeconds.value % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  bool get canResendOtp => resendSeconds.value == 0;

  void _startResendTimer() {
    _resendTimer?.cancel();
    resendSeconds.value = 300; // 5 phút đúng theo yêu cầu
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (resendSeconds.value > 0) {
        resendSeconds.value--;
      } else {
        timer.cancel();
      }
    });
  }

  Future<void> resendOtp() async {
    if (!canResendOtp) return;
    final effEmail = email.text.trim();
    if (effEmail.isEmpty || !GetUtils.isEmail(effEmail)) {
      Get.snackbar('Lỗi', 'Vui lòng nhập địa chỉ email hợp lệ trước');
      return;
    }
    loading.value = true;
    try {
      await _authService.forgotPassword(email: effEmail);
      _startResendTimer();
      Get.snackbar(
        'Đã gửi lại OTP',
        'Mã OTP mới đã được gửi tới $effEmail. Bạn có thể gửi lại sau 5 phút.',
        backgroundColor: const Color(0xFF059669),
        colorText: const Color(0xFFFFFFFF),
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
      );
    } catch (e) {
      _showError(e);
    } finally {
      loading.value = false;
    }
  }

  @override
  void onClose() {
    _resendTimer?.cancel();
    super.onClose();
  }

  String? validateEmail(String? value) {
    if (value == null || !GetUtils.isEmail(value.trim())) {
      return 'Vui lòng nhập email hợp lệ';
    }
    return null;
  }

  String? validatePassword(String? value) {
    final minimum = Get.currentRoute == AppRoutes.login ? 6 : 8;
    if (value == null || value.length < minimum) {
      return 'Mật khẩu cần ít nhất $minimum ký tự';
    }
    return null;
  }

  String? validateName(String? value) {
    if (value == null || value.trim().isEmpty) return 'Vui lòng nhập họ tên';
    return null;
  }

  Future<void> submit({
    GlobalKey<FormState>? currentFormKey,
    String? targetRoute,
    String? emailVal,
    String? passwordVal,
    String? nameVal,
    String? phoneVal,
    String? otpVal,
    String? newPasswordVal,
  }) async {
    final activeForm = currentFormKey ?? formKey;
    if (!(activeForm.currentState?.validate() ?? false)) return;

    final route = targetRoute ?? Get.currentRoute;
    final effEmail = emailVal ?? email.text.trim();
    final effPassword = passwordVal ?? password.text;
    final effName = nameVal ?? name.text.trim();
    final effPhone = phoneVal ?? phone.text.trim();
    final effOtp = otpVal ?? otp.text.trim();
    final effNewPassword = newPasswordVal ?? newPassword.text;

    // ── Forgot-password (step 1: request OTP) ───────────────────────────────
    if (route == AppRoutes.forgotPassword && !otpStep.value) {
      loading.value = true;
      try {
        await _authService.forgotPassword(email: effEmail);
        otpStep.value = true;
        _startResendTimer();
        Get.snackbar(
          'Đã gửi OTP',
          'Mã OTP đã được gửi tới $effEmail (Thời gian chờ gửi lại: 5 phút)',
          backgroundColor: const Color(0xFF059669),
          colorText: const Color(0xFFFFFFFF),
          snackPosition: SnackPosition.BOTTOM,
          margin: const EdgeInsets.all(16),
        );
      } catch (e) {
        _showError(e);
      } finally {
        loading.value = false;
      }
      return;
    }

    // ── Forgot-password (step 2: reset with OTP) ────────────────────────────
    if (route == AppRoutes.forgotPassword && otpStep.value) {
      loading.value = true;
      try {
        await _authService.resetPassword(
          email: effEmail,
          otp: effOtp,
          newPassword: effNewPassword,
        );
        otpStep.value = false;
        Get.snackbar(
          'Thành công',
          'Đổi mật khẩu thành công! Hãy đăng nhập lại.',
          backgroundColor: const Color(0xFF059669),
          colorText: const Color(0xFFFFFFFF),
          snackPosition: SnackPosition.BOTTOM,
          margin: const EdgeInsets.all(16),
        );
        Get.offAllNamed(AppRoutes.login);
      } catch (e) {
        _showError(e);
      } finally {
        loading.value = false;
      }
      return;
    }

    // ── Register ─────────────────────────────────────────────────────────────
    if (route == AppRoutes.register) {
      loading.value = true;
      try {
        await _authService.register(
          email: effEmail,
          password: effPassword,
          hoTen: effName,
          phone: effPhone.isEmpty ? '0901234567' : effPhone,
        );
        Get.snackbar(
          'Đăng ký thành công',
          'Chào mừng bạn đến VietTour! Hãy đăng nhập để tiếp tục.',
          backgroundColor: const Color(0xFF059669),
          colorText: const Color(0xFFFFFFFF),
          snackPosition: SnackPosition.BOTTOM,
          margin: const EdgeInsets.all(16),
        );
        Get.offAllNamed(AppRoutes.login);
      } catch (e) {
        _showError(e);
      } finally {
        loading.value = false;
      }
      return;
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    loading.value = true;
    try {
      final result = await _authService.login(
        email: effEmail,
        password: effPassword,
      );
      final user = result['user'] as Map<String, dynamic>?;
      final accessToken = (result['accessToken'] ?? result['token'])?.toString();
      final refreshToken = (result['refreshToken'] ?? accessToken)?.toString();
      if (user == null || accessToken == null || accessToken.isEmpty || refreshToken == null) {
        throw const ApiAuthException(
          statusCode: 502,
          message: 'Máy chủ chưa trả về phiên đăng nhập hợp lệ.',
        );
      }
      await AuthSession.instance.save(
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: user,
      );
      if (Get.isRegistered<AppController>()) {
        Get.find<AppController>().currentUser.value = user;
      }
      Get.snackbar(
        'Đăng nhập thành công',
        'Chào mừng ${user['name'] ?? effEmail.split('@').first}!',
        backgroundColor: const Color(0xFF059669),
        colorText: const Color(0xFFFFFFFF),
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
      );
      Get.offAllNamed(AppRoutes.home);
    } catch (e) {
      _showError(e);
    } finally {
      loading.value = false;
    }
  }

  void _showError(Object e) {
    final message = e is ApiAuthException
        ? e.message
        : e is ApiClientException
        ? e.message
        : 'Không kết nối được máy chủ tại ${ApiConfig.baseUrl}.';
    Get.snackbar(
      'Thông báo lỗi',
      message,
      backgroundColor: const Color(0xFFDC2626),
      colorText: const Color(0xFFFFFFFF),
      snackPosition: SnackPosition.BOTTOM,
      margin: const EdgeInsets.all(16),
      duration: const Duration(seconds: 4),
    );
  }
}

class AuthBinding extends Bindings {
  @override
  void dependencies() => Get.lazyPut<AuthController>(
        AuthController.new,
        fenix: true,
      );
}
