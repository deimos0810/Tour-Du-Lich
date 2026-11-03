import 'package:device_preview_plus/device_preview_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'core/constants/app_routes.dart';
import 'core/controllers/app_controller.dart';
import 'core/localization/app_translations.dart';
import 'core/theme/app_theme.dart';
import 'routes/app_pages.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const VietTourApp());
}

class VietTourApp extends StatelessWidget {
  const VietTourApp({super.key});

  @override
  Widget build(BuildContext context) {
    final usePreview =
        !kReleaseMode &&
        defaultTargetPlatform != TargetPlatform.android &&
        defaultTargetPlatform != TargetPlatform.iOS;

    if (!usePreview) {
      return Sizer(
        builder: (context, orientation, deviceType) => GetMaterialApp(
          title: 'VietTour',
          debugShowCheckedModeBanner: false,
          translations: AppTranslations(),
          locale: const Locale('vi', 'VN'),
          fallbackLocale: const Locale('vi', 'VN'),
          theme: AppTheme.light,
          initialRoute: AppRoutes.splash,
          getPages: AppPages.pages,
          initialBinding: AppBinding(),
          defaultTransition: Transition.fadeIn,
          transitionDuration: const Duration(milliseconds: 120),
        ),
      );
    }

    return DevicePreview(
      enabled: true,
      builder: (previewContext) => Sizer(
        builder: (context, orientation, deviceType) => GetMaterialApp(
          title: 'VietTour',
          debugShowCheckedModeBanner: false,
          translations: AppTranslations(),
          locale: const Locale('vi', 'VN'),
          fallbackLocale: const Locale('vi', 'VN'),
          useInheritedMediaQuery: true,
          builder: DevicePreview.appBuilder,
          theme: AppTheme.light,
          initialRoute: AppRoutes.splash,
          getPages: AppPages.pages,
          initialBinding: AppBinding(),
          defaultTransition: Transition.fadeIn,
          transitionDuration: const Duration(milliseconds: 120),
        ),
      ),
    );
  }
}
