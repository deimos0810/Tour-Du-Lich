import 'package:get/get.dart';
import '../../core/controllers/app_controller.dart';
import '../../data/models/tour_model.dart';

class WishlistController extends GetxController {
  AppController get app => Get.find<AppController>();
  List<TourModel> get tours => app.favorites;
}

class WishlistBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<WishlistController>(WishlistController.new);
  }
}
