import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';
import '../../core/constants/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import 'splash_controller.dart';

class SplashView extends GetView<SplashController> {
  const SplashView({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.navy, AppColors.primaryDark],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
          child: Column(
            children: [
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 24.w,
                        height: 24.w,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          'VT',
                          style: TextStyle(
                            color: AppColors.blue,
                            fontSize: Responsive.font(24),
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      SizedBox(height: 4.h),
                      SizedBox(
                        width: double.infinity,
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            AppStrings.appName,
                            maxLines: 1,
                            softWrap: false,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: Responsive.font(28),
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: 0.6.h),
                      Text(
                        AppStrings.tagline,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: Responsive.font(14),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Obx(
                () => AppButton(
                  label: controller.restoring.value
                      ? 'Đang khôi phục phiên...'
                      : 'Bắt đầu khám phá',
                  icon: controller.restoring.value
                      ? Icons.sync_rounded
                      : Icons.arrow_forward_rounded,
                  onPressed: controller.restoring.value
                      ? null
                      : controller.start,
                ),
              ),
              SizedBox(height: 1.h),
            ],
          ),
        ),
      ),
    ),
  );
}
