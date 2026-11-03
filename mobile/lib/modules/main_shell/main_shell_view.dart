import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';
import '../../core/controllers/app_controller.dart';
import '../../core/theme/app_colors.dart';
import '../guide/guide_schedule_controller.dart';
import '../guide/guide_schedule_view.dart';
import '../home/home_view.dart';
import '../orders/orders_controller.dart';
import '../orders/orders_view.dart';
import '../profile/profile_controller.dart';
import '../profile/profile_view.dart';
import '../search/search_controller.dart' as search;
import '../search/search_view.dart';
import '../wishlist/wishlist_view.dart';
import 'main_shell_controller.dart';

class MainShellView extends GetView<MainShellController> {
  const MainShellView({super.key});

  Widget _buildActivePage(int index, bool isGuide) {
    switch (index) {
      case 0:
        return const HomeView();
      case 1:
        return const SearchView();
      case 2:
        return const WishlistView();
      case 3:
        return isGuide ? const GuideScheduleView() : const OrdersView();
      case 4:
        return const ProfileView();
      default:
        return const HomeView();
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = Get.find<AppController>();

    return Obx(() {
      final isGuide = app.isGuideOrStaff;
      final labels = [
        'nav_home'.tr,
        'nav_explore'.tr,
        'nav_wishlist'.tr,
        isGuide ? 'nav_guide_schedule'.tr : 'nav_orders'.tr,
        'nav_account'.tr,
      ];
      final icons = [
        Icons.home_outlined,
        Icons.travel_explore_rounded,
        Icons.favorite_border_rounded,
        isGuide ? Icons.assignment_outlined : Icons.confirmation_number_outlined,
        Icons.person_outline_rounded,
      ];

      return Scaffold(
        body: _buildActivePage(app.selectedTab.value, isGuide),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha((255 * 0.06).round()),
                blurRadius: 18,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: SizedBox(
              height: 8.h,
              child: Row(
                children: List.generate(labels.length, (index) {
                  final selected = app.selectedTab.value == index;
                  return Expanded(
                    child: InkWell(
                      onTap: () {
                        app.selectedTab.value = index;
                        if (index == 1 && Get.isRegistered<search.SearchController>()) {
                          Get.find<search.SearchController>().loadResults();
                        } else if (index == 3) {
                          if (isGuide && Get.isRegistered<GuideScheduleController>()) {
                            Get.find<GuideScheduleController>().loadSchedule();
                          } else if (!isGuide && Get.isRegistered<OrdersController>()) {
                            Get.find<OrdersController>().loadOrders();
                          }
                        } else if (index == 4 && Get.isRegistered<ProfileController>()) {
                          Get.find<ProfileController>().loadProfile();
                        }
                      },
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            icons[index],
                            size: 5.w,
                            color: selected
                                ? AppColors.primary
                                : AppColors.muted,
                          ),
                          SizedBox(height: 0.5.h),
                          Text(
                            labels[index],
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: Responsive.font(8.5),
                              color: selected
                                  ? AppColors.primary
                                  : AppColors.muted,
                              fontWeight: selected
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        ),
      );
    });
  }
}
