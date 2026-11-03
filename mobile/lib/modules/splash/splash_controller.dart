import 'package:get/get.dart';
import '../../core/constants/app_routes.dart';
import '../../core/controllers/app_controller.dart';
import '../../core/network/auth_session.dart';
import '../../data/services/auth_service.dart';

class SplashController extends GetxController {
  final restoring = false.obs;
  final AuthService _authService = AuthService();

  @override
  void onInit() {
    super.onInit();
    restoreSession();
  }

  void start() => Get.toNamed(AppRoutes.onboarding);

  Future<void> restoreSession() async {
    final session = AuthSession.instance;
    final accessToken = await session.accessToken;
    final refreshToken = await session.refreshToken;
    final cachedUser = await session.readUser();
    if (accessToken == null && refreshToken == null) return;

    restoring.value = true;
    if (cachedUser != null) {
      Get.find<AppController>().currentUser.value = cachedUser;
    }
    try {
      final user = await _authService.getCurrentUser();
      final renewedAccessToken = await session.accessToken;
      final renewedRefreshToken = await session.refreshToken;
      if (renewedAccessToken == null || renewedRefreshToken == null) {
        throw StateError('Máy chủ chưa khôi phục được phiên đăng nhập.');
      }
      await session.save(
        accessToken: renewedAccessToken,
        refreshToken: renewedRefreshToken,
        user: user,
      );
      Get.find<AppController>().currentUser.value = user;
      Get.offAllNamed(AppRoutes.home);
    } on ApiAuthException catch (error) {
      if (cachedUser != null && error.statusCode == 0) {
        Get.find<AppController>().currentUser.value = cachedUser;
        Get.offAllNamed(AppRoutes.home);
        Get.snackbar(
          'Đang ngoại tuyến',
          'Không xác minh được phiên với máy chủ; một số chức năng cần kết nối mạng.',
        );
      } else {
        await session.clear();
        Get.find<AppController>().currentUser.value = null;
      }
    } finally {
      restoring.value = false;
    }
  }
}

class SplashBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<SplashController>(SplashController.new);
  }
}
