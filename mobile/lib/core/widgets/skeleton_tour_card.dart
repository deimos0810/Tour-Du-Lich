import 'package:flutter/material.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';
import '../theme/app_colors.dart';

class SkeletonTourCard extends StatelessWidget {
  const SkeletonTourCard({super.key});

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(Responsive.radius(16)),
      border: Border.all(color: AppColors.border),
    ),
    clipBehavior: Clip.hardEdge,
    child: SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 17.h,
            color: const Color(0xFFF1F5F9),
          ),
          Padding(
            padding: EdgeInsets.all(3.w),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 24.w,
                  height: 1.4.h,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                SizedBox(height: 0.8.h),
                Container(
                  width: 68.w,
                  height: 1.6.h,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                SizedBox(height: 0.6.h),
                Container(
                  width: 48.w,
                  height: 1.4.h,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
