import 'package:sizer/sizer.dart';

abstract final class Responsive {
  static double font(num size) => size * (Device.width / 390).clamp(0.85, 1.15);

  static double radius(num size) {
    if (size >= 48) return 999;
    return (size * (Device.width / 390).clamp(0.9, 1.1)).clamp(6, 24);
  }
}
