import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';
import '../../core/widgets/app_widgets.dart';
import 'wishlist_controller.dart';

class WishlistView extends GetView<WishlistController> {
  const WishlistView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Tour yêu thích',
          style: TextStyle(
            fontSize: Responsive.font(18),
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      body: Obx(() {
        final tours = controller.tours;
        if (tours.isEmpty) {
          return const EmptyState(
            title: 'Chưa có tour yêu thích',
            message:
                'Chạm vào biểu tượng trái tim trên tour để lưu hành trình bạn quan tâm.',
            icon: Icons.favorite_border_rounded,
          );
        }
        return ListView.separated(
          padding: EdgeInsets.fromLTRB(5.w, 1.h, 5.w, 3.h),
          itemCount: tours.length,
          separatorBuilder: (_, _) => SizedBox(height: 1.5.h),
          itemBuilder: (_, index) => SizedBox(
            height: 25.h,
            child: TourCard(tour: tours[index], horizontal: true),
          ),
        );
      }),
    );
  }
}
