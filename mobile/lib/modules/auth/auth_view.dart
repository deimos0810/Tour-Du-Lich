import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';
import '../../core/constants/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_widgets.dart';
import 'auth_controller.dart';

class AuthView extends StatefulWidget {
  const AuthView({super.key});

  @override
  State<AuthView> createState() => _AuthViewState();
}

class _AuthViewState extends State<AuthView> {
  final _formKey = GlobalKey<FormState>();
  late final AuthController controller;

  @override
  void initState() {
    super.initState();
    controller = Get.find<AuthController>();
  }

  void _handleBack(bool register, bool forgot) {
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    } else if (register || forgot) {
      Get.offNamed(AppRoutes.login);
    } else {
      Get.offAllNamed(AppRoutes.home);
    }
  }

  @override
  Widget build(BuildContext context) {
    final route = Get.currentRoute;
    final register = route == AppRoutes.register;
    final forgot = route == AppRoutes.forgotPassword;
    final title = forgot
        ? 'Khôi phục mật khẩu'
        : register
        ? 'Tạo tài khoản'
        : 'Chào mừng trở lại';
    final subtitle = forgot
        ? 'Nhập email để nhận mã OTP khôi phục mật khẩu.'
        : register
        ? 'Bắt đầu hành trình cùng VietTour.'
        : 'Đăng nhập để tiếp tục hành trình của bạn.';

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(7.w, 3.h, 7.w, 4.h),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              IconButton(
                onPressed: () => _handleBack(register, forgot),
                icon: const Icon(Icons.arrow_back_rounded),
              ),
              SizedBox(height: 2.h),
              Container(
                width: 15.w,
                height: 15.w,
                decoration: const BoxDecoration(
                  color: AppColors.blue,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  'VT',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: Responsive.font(16),
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              SizedBox(height: 3.h),
              Text(
                title,
                style: TextStyle(
                  fontSize: Responsive.font(24),
                  fontWeight: FontWeight.w800,
                  color: AppColors.navy,
                ),
              ),
              SizedBox(height: 0.7.h),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: Responsive.font(12),
                  color: AppColors.muted,
                ),
              ),
              SizedBox(height: 3.h),
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    if (register) ...[
                      AppTextField(
                        label: 'Họ và tên',
                        hint: 'Tên của bạn',
                        prefixIcon: Icons.person_outline_rounded,
                        controller: controller.name,
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? 'Vui lòng nhập họ tên'
                            : null,
                      ),
                      SizedBox(height: 2.h),
                      AppTextField(
                        label: 'Số điện thoại',
                        hint: '0901234567',
                        prefixIcon: Icons.phone_outlined,
                        keyboardType: TextInputType.phone,
                        controller: controller.phone,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Vui lòng nhập số điện thoại';
                          }
                          if (value.trim().length < 9) {
                            return 'Số điện thoại không hợp lệ';
                          }
                          return null;
                        },
                      ),
                      SizedBox(height: 2.h),
                    ],
                    AppTextField(
                      label: 'Email',
                      hint: 'ban@email.com',
                      prefixIcon: Icons.mail_outline_rounded,
                      keyboardType: TextInputType.emailAddress,
                      controller: controller.email,
                      validator: controller.validateEmail,
                    ),
                    if (!forgot) ...[
                      SizedBox(height: 2.h),
                      Obx(
                        () => AppTextField(
                          label: 'Mật khẩu',
                          hint: 'Ít nhất 6 ký tự',
                          prefixIcon: Icons.lock_outline_rounded,
                          controller: controller.password,
                          obscureText: controller.obscurePassword.value,
                          validator: controller.validatePassword,
                          suffix: IconButton(
                            onPressed: () =>
                                controller.obscurePassword.toggle(),
                            icon: Icon(
                              controller.obscurePassword.value
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                            ),
                          ),
                        ),
                      ),
                    ],
                    if (forgot) ...[
                      Obx(() {
                        if (!controller.otpStep.value) {
                          return const SizedBox.shrink();
                        }
                        return Column(
                          children: [
                            SizedBox(height: 2.h),
                            AppTextField(
                              label: 'Mã xác thực OTP',
                              hint: 'Nhập mã 6 chữ số',
                              prefixIcon: Icons.pin_outlined,
                              controller: controller.otp,
                              validator: (v) => v == null || v.trim().isEmpty
                                  ? 'Vui lòng nhập OTP'
                                  : null,
                            ),
                            SizedBox(height: 2.h),
                            AppTextField(
                              label: 'Mật khẩu mới',
                              hint: 'Ít nhất 6 ký tự',
                              prefixIcon: Icons.lock_reset_rounded,
                              controller: controller.newPassword,
                              validator: controller.validatePassword,
                            ),
                            SizedBox(height: 1.h),
                            Align(
                              alignment: Alignment.centerRight,
                              child: Obx(() {
                                final canResend = controller.canResendOtp;
                                return TextButton.icon(
                                  onPressed: canResend && !controller.loading.value
                                      ? () => controller.resendOtp()
                                      : null,
                                  icon: Icon(
                                    Icons.refresh_rounded,
                                    size: 4.w,
                                    color: canResend
                                        ? AppColors.primary
                                        : AppColors.muted,
                                  ),
                                  label: Text(
                                    canResend
                                        ? 'Gửi lại mã OTP'
                                        : 'Gửi lại mã sau ${controller.resendCountdownText}',
                                    style: TextStyle(
                                      color: canResend
                                          ? AppColors.primary
                                          : AppColors.muted,
                                      fontWeight: FontWeight.w600,
                                      fontSize: Responsive.font(10),
                                    ),
                                  ),
                                );
                              }),
                            ),
                          ],
                        );
                      }),
                    ],
                  ],
                ),
              ),
              if (!register && !forgot)
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => Get.toNamed(AppRoutes.forgotPassword),
                    child: const Text('Quên mật khẩu?'),
                  ),
                ),
              SizedBox(height: 1.h),
              Obx(
                () => AppButton(
                  label: forgot
                      ? (controller.otpStep.value
                            ? 'Đặt lại mật khẩu'
                            : 'Gửi mã OTP')
                      : register
                      ? 'Tạo tài khoản'
                      : 'Đăng nhập',
                  loading: controller.loading.value,
                  onPressed: () => controller.submit(
                    currentFormKey: _formKey,
                    targetRoute: route,
                  ),
                ),
              ),
              if (!forgot) ...[
                SizedBox(height: 2.h),
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 3.w),
                      child: Text(
                        'hoặc tiếp tục với',
                        style: TextStyle(
                          color: AppColors.muted,
                          fontSize: Responsive.font(10),
                        ),
                      ),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),
                SizedBox(height: 2.h),
                AppButton(
                  label: 'Đăng nhập với Google',
                  outlined: true,
                  onPressed: () => Get.snackbar(
                    'Google',
                    'Đăng nhập Google sẽ được tích hợp trong phiên bản tới.',
                  ),
                ),
              ],
              SizedBox(height: 3.h),
              Center(
                child: TextButton(
                  onPressed: () => Get.offNamed(
                    register ? AppRoutes.login : AppRoutes.register,
                  ),
                  child: RichText(
                    text: TextSpan(
                      text: register
                          ? 'Đã có tài khoản? '
                          : 'Chưa có tài khoản? ',
                      style: TextStyle(
                        color: AppColors.muted,
                        fontSize: Responsive.font(11),
                      ),
                      children: [
                        TextSpan(
                          text: register ? 'Đăng nhập' : 'Đăng ký ngay',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
