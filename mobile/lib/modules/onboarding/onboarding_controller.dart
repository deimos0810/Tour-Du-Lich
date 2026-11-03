import 'package:get/get.dart';
import '../../core/constants/app_routes.dart';

class OnboardingController extends GetxController {
  final page = 0.obs;
  void continueFlow() {
    if (page.value < 2) {
      page.value++;
    } else {
      Get.offNamed(AppRoutes.login);
    }
  }
}

class OnboardingBinding extends Bindings {
  @override
  void dependencies() =>
      Get.lazyPut<OnboardingController>(OnboardingController.new);
}
