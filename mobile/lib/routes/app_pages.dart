import 'package:get/get.dart';
import '../core/constants/app_routes.dart';
import '../modules/auth/auth_controller.dart';
import '../modules/auth/auth_view.dart';
import '../modules/booking/booking_controller.dart';
import '../modules/booking/booking_success_controller.dart';
import '../modules/booking/booking_success_view.dart';
import '../modules/booking/booking_view.dart';
import '../modules/main_shell/main_shell_controller.dart';
import '../modules/main_shell/main_shell_view.dart';
import '../modules/onboarding/onboarding_controller.dart';
import '../modules/onboarding/onboarding_view.dart';
import '../modules/orders/ticket_controller.dart';
import '../modules/orders/ticket_view.dart';
import '../modules/splash/splash_view.dart';
import '../modules/splash/splash_controller.dart';
import '../modules/tour_detail/tour_detail_controller.dart';
import '../modules/tour_detail/tour_detail_view.dart';

abstract final class AppPages {
  static final pages = <GetPage<dynamic>>[
    GetPage(
      name: AppRoutes.splash,
      page: () => const SplashView(),
      binding: SplashBinding(),
      transition: Transition.fadeIn,
      transitionDuration: const Duration(milliseconds: 100),
    ),
    GetPage(
      name: AppRoutes.onboarding,
      page: () => const OnboardingView(),
      binding: OnboardingBinding(),
      transition: Transition.fadeIn,
      transitionDuration: const Duration(milliseconds: 100),
    ),
    GetPage(
      name: AppRoutes.login,
      page: () => const AuthView(),
      binding: AuthBinding(),
      transition: Transition.fadeIn,
      transitionDuration: const Duration(milliseconds: 100),
    ),
    GetPage(
      name: AppRoutes.register,
      page: () => const AuthView(),
      binding: AuthBinding(),
      transition: Transition.fadeIn,
      transitionDuration: const Duration(milliseconds: 100),
    ),
    GetPage(
      name: AppRoutes.forgotPassword,
      page: () => const AuthView(),
      binding: AuthBinding(),
      transition: Transition.fadeIn,
      transitionDuration: const Duration(milliseconds: 100),
    ),
    GetPage(
      name: AppRoutes.home,
      page: () => const MainShellView(),
      binding: MainShellBinding(),
      transition: Transition.fadeIn,
      transitionDuration: const Duration(milliseconds: 100),
    ),
    GetPage(
      name: AppRoutes.detail,
      page: () => const TourDetailView(),
      binding: TourDetailBinding(),
      transition: Transition.fadeIn,
      transitionDuration: const Duration(milliseconds: 120),
    ),
    GetPage(
      name: AppRoutes.booking,
      page: () => const BookingView(),
      binding: BookingBinding(),
      transition: Transition.fadeIn,
      transitionDuration: const Duration(milliseconds: 120),
    ),
    GetPage(
      name: AppRoutes.bookingSuccess,
      page: () => const BookingSuccessView(),
      binding: BookingSuccessBinding(),
      transition: Transition.fadeIn,
      transitionDuration: const Duration(milliseconds: 120),
    ),
    GetPage(
      name: AppRoutes.ticket,
      page: () => const TicketView(),
      binding: TicketBinding(),
      transition: Transition.fadeIn,
      transitionDuration: const Duration(milliseconds: 100),
    ),
  ];
}
