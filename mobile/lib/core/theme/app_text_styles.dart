import 'package:flutter/material.dart';
import '../utils/responsive.dart';
import 'app_colors.dart';

abstract final class AppTextStyles {
  static TextStyle get h1 => TextStyle(
    fontSize: Responsive.font(28),
    fontWeight: FontWeight.w800,
    color: AppColors.text,
  );
  static TextStyle get h2 => TextStyle(
    fontSize: Responsive.font(20),
    fontWeight: FontWeight.w700,
    color: AppColors.text,
  );
  static TextStyle get title => TextStyle(
    fontSize: Responsive.font(16),
    fontWeight: FontWeight.w600,
    color: AppColors.text,
  );
  static TextStyle get body => TextStyle(
    fontSize: Responsive.font(14),
    fontWeight: FontWeight.w400,
    color: AppColors.text,
  );
  static TextStyle get caption => TextStyle(
    fontSize: Responsive.font(12),
    fontWeight: FontWeight.w500,
    color: AppColors.muted,
  );
}
