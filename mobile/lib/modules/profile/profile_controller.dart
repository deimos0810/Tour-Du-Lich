import 'dart:async';

import 'package:get/get.dart';

import '../../core/constants/app_routes.dart';
import '../../core/controllers/app_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/network/auth_session.dart';
import '../../data/services/auth_service.dart';

class ProfileController extends GetxController {
  ProfileController({AuthService? authService})
    : _authService = authService ?? AuthService();

  AppController get _app => Get.find<AppController>();
  final AuthService _authService;
  final profile = Rxn<Map<String, dynamic>>();
  final loading = false.obs;
  final saving = false.obs;
  final errorMessage = ''.obs;

  String get fullName =>
      (profile.value?['HoTen'] ?? _app.currentUser.value?['name'] ?? '')
          .toString();
  String get email =>
      (profile.value?['Email'] ?? _app.currentUser.value?['email'] ?? '')
          .toString();
  String get phone =>
      (profile.value?['SoDienThoai'] ?? _app.currentUser.value?['phone'] ?? '')
          .toString();
  String get birthDate => (profile.value?['NgaySinh'] ?? '').toString();
  String get initials => _app.userInitials;
  final hotline = '1900 1234';

  @override
  void onInit() {
    super.onInit();
    unawaited(loadProfile());
  }

  Future<void> loadProfile() async {
    loading.value = true;
    errorMessage.value = '';
    try {
      profile.value = await _authService.getProfile();
    } on ApiAuthException catch (error) {
      errorMessage.value = error.message;
    } finally {
      loading.value = false;
    }
  }

  Future<bool> updateProfile({
    required String name,
    required String emailAddress,
    required String phoneNumber,
    DateTime? dateOfBirth,
  }) async {
    saving.value = true;
    try {
      final updated = await _authService.updateProfile(
        hoTen: name.trim(),
        email: emailAddress.trim(),
        phone: phoneNumber.trim(),
        ngaySinh: dateOfBirth == null
            ? null
            : '${dateOfBirth.year.toString().padLeft(4, '0')}-'
                  '${dateOfBirth.month.toString().padLeft(2, '0')}-'
                  '${dateOfBirth.day.toString().padLeft(2, '0')}',
      );
      profile.value = updated;
      final updatedUser = {
        ...?_app.currentUser.value,
        'name': updated['HoTen'],
        'email': updated['Email'],
        'phone': updated['SoDienThoai'],
      };
      _app.currentUser.value = updatedUser;
      await AuthSession.instance.saveUser(updatedUser);
      Get.snackbar('Đã cập nhật', 'Hồ sơ của bạn đã được lưu.');
      return true;
    } on ApiAuthException catch (error) {
      Get.snackbar('Không thể cập nhật hồ sơ', error.message);
      return false;
    } on ApiClientException catch (error) {
      Get.snackbar('Không thể cập nhật hồ sơ', error.message);
      return false;
    } finally {
      saving.value = false;
    }
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    saving.value = true;
    try {
      final result = await _authService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      Get.snackbar(
        'Đã đổi mật khẩu',
        result['message']?.toString() ?? 'Mật khẩu mới đã được lưu.',
      );
      return true;
    } on ApiAuthException catch (error) {
      Get.snackbar('Không thể đổi mật khẩu', error.message);
      return false;
    } on ApiClientException catch (error) {
      Get.snackbar('Không thể đổi mật khẩu', error.message);
      return false;
    } finally {
      saving.value = false;
    }
  }

  Future<void> logout() async {
    String? logoutError;
    try {
      await _authService.logout();
    } on ApiAuthException catch (error) {
      logoutError = error.message;
    } on ApiClientException catch (error) {
      logoutError = error.message;
    }
    await AuthSession.instance.clear();
    _app.currentUser.value = null;
    Get.offAllNamed(AppRoutes.login);
    if (logoutError != null) {
      Get.snackbar(
        'Đã đăng xuất',
        'Không thể thu hồi phiên trên máy chủ: $logoutError',
      );
    }
  }

  void showFeature(String title) =>
      Get.snackbar(title, 'Tính năng sẽ sớm có mặt.');
}

class ProfileBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<ProfileController>(ProfileController.new);
  }
}
