import 'dart:async';

import 'package:get/get.dart';
import '../../core/controllers/app_controller.dart';
import '../home/home_controller.dart';
import '../search/search_controller.dart';
import '../orders/orders_controller.dart';
import '../profile/profile_controller.dart';
import '../wishlist/wishlist_controller.dart';

class MainShellController extends GetxController {
  @override
  void onInit() {
    final arguments = Get.arguments;
    if (arguments is Map && arguments['tab'] is int) {
      Get.find<AppController>().selectedTab.value = arguments['tab'] as int;
    }
    super.onInit();
    unawaited(Get.find<AppController>().processInitialPaymentReturn());
  }
}

class MainShellBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<MainShellController>(MainShellController.new);
    Get.lazyPut<HomeController>(HomeController.new);
    Get.lazyPut<SearchController>(SearchController.new);
    OrdersBinding().dependencies();
    ProfileBinding().dependencies();
    WishlistBinding().dependencies();
  }
}
