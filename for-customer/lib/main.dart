import 'package:device_preview_plus/device_preview_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'core/constants/app_routes.dart';
import 'core/controllers/app_controller.dart';
import 'core/theme/app_theme.dart';
import 'routes/app_pages.dart';

void main() {
  runApp(const VietTourApp());
}

class VietTourApp extends StatelessWidget {
  const VietTourApp({super.key});

  @override
  Widget build(BuildContext context) => DevicePreview(
    enabled: !kReleaseMode,
    builder: (previewContext) => Sizer(
      builder: (context, orientation, deviceType) => GetMaterialApp(
        title: 'VietTour',
        debugShowCheckedModeBanner: false,
        useInheritedMediaQuery: true,
        locale: DevicePreview.locale(previewContext),
        builder: DevicePreview.appBuilder,
        theme: AppTheme.light,
        initialRoute: AppRoutes.splash,
        getPages: AppPages.pages,
        initialBinding: AppBinding(),
        defaultTransition: Transition.cupertino,
      ),
    ),
  );
}
