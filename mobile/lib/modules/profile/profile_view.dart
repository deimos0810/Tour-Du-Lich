import '../../core/widgets/app_widgets.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/controllers/app_controller.dart';
import 'profile_controller.dart';

class ProfileView extends GetView<ProfileController> {
  const ProfileView({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(
        'profile_title'.tr,
        style: TextStyle(
          fontSize: Responsive.font(18),
          fontWeight: FontWeight.w800,
        ),
      ),
      actions: [
        IconButton(
          onPressed: controller.loadProfile,
          icon: const Icon(Icons.refresh_rounded),
          tooltip: 'Tải lại hồ sơ',
        ),
      ],
    ),
    body: Obx(
      () => ListView(
        padding: EdgeInsets.fromLTRB(5.w, 1.h, 5.w, 4.h),
        children: [
          if (controller.loading.value && controller.profile.value == null)
            const LinearProgressIndicator(),
          if (controller.errorMessage.value.isNotEmpty &&
              controller.profile.value == null)
            Padding(
              padding: EdgeInsets.only(bottom: 1.h),
              child: Text(
                controller.errorMessage.value,
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: Responsive.font(10),
                ),
              ),
            ),
          Container(
            padding: EdgeInsets.all(4.w),
            decoration: BoxDecoration(
              color: AppColors.navy,
              borderRadius: BorderRadius.circular(Responsive.radius(16)),
            ),
            child: Row(
              children: [
                Container(
                  width: 15.w,
                  height: 15.w,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: AppColors.blue,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    controller.initials,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: Responsive.font(14),
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                SizedBox(width: 3.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        controller.fullName.isEmpty
                            ? 'customer'.tr
                            : controller.fullName,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: Responsive.font(14),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(height: 0.5.h),
                      Text(
                        controller.email,
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: Responsive.font(10),
                        ),
                      ),
                      if (controller.phone.isNotEmpty) ...[
                        SizedBox(height: 0.4.h),
                        Text(
                          controller.phone,
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: Responsive.font(9.5),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => _editProfile(context),
                  icon: const Icon(Icons.edit_outlined, color: Colors.white),
                  tooltip: 'Sửa hồ sơ',
                ),
              ],
            ),
          ),
          SizedBox(height: 2.5.h),
          _group('my_account'.tr, [
            _item(
              Icons.swap_horiz_rounded,
              'switch_account'.tr,
              () => Get.find<AppController>().showAccountSwitcherSheet(context),
            ),
            _item(
              Icons.person_outline_rounded,
              'personal_info'.tr,
              () => _editProfile(context),
            ),
            _item(
              Icons.lock_outline_rounded,
              'change_password'.tr,
              () => _changePassword(context),
            ),
            _item(
              Icons.language_rounded,
              'language'.tr,
              () => _showLanguageDialog(context),
            ),
          ]),
          SizedBox(height: 2.h),
          _group('support'.tr, [
            _item(
              Icons.support_agent_rounded,
              'help_center'.tr,
              () => controller.showFeature(
                'Hỗ trợ VietTour · ${controller.hotline}',
              ),
            ),
            _item(
              Icons.call_outlined,
              '${'hotline'.tr} ${controller.hotline}',
              () => controller.showFeature('Hotline VietTour'),
            ),
          ]),
          SizedBox(height: 2.h),
          _item(
            Icons.logout_rounded,
            'logout'.tr,
            controller.logout,
            color: AppColors.primary,
          ),
          SizedBox(height: 2.h),
          Center(
            child: Text(
              'version'.tr,
              style: TextStyle(
                color: AppColors.muted,
                fontSize: Responsive.font(9),
              ),
            ),
          ),
        ],
      ),
    ),
  );

  Future<void> _editProfile(BuildContext context) async {
    final formKey = GlobalKey<FormState>();
    final name = TextEditingController(text: controller.fullName);
    final email = TextEditingController(text: controller.email);
    final phone = TextEditingController(text: controller.phone);
    final existingDate = DateTime.tryParse(controller.birthDate);
    DateTime? birthDate = existingDate;
    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Responsive.radius(16)),
          ),
          title: Text(
            'personal_info'.tr,
            style: TextStyle(
              fontSize: Responsive.font(16),
              fontWeight: FontWeight.w800,
              color: AppColors.navy,
            ),
          ),
          content: SizedBox(
            width: 85.w,
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AppTextField(
                      label: 'full_name'.tr,
                      hint: 'Nhập họ và tên đầy đủ',
                      prefixIcon: Icons.person_outline_rounded,
                      controller: name,
                      validator: (value) => value == null || value.trim().isEmpty
                          ? 'Vui lòng nhập họ tên'
                          : null,
                    ),
                    SizedBox(height: 1.8.h),
                    AppTextField(
                      label: 'Email',
                      hint: 'email@example.com',
                      prefixIcon: Icons.email_outlined,
                      controller: email,
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) =>
                          value == null || !GetUtils.isEmail(value.trim())
                          ? 'Vui lòng nhập email hợp lệ'
                          : null,
                    ),
                    SizedBox(height: 1.8.h),
                    AppTextField(
                      label: 'phone_number'.tr,
                      hint: '0901234567',
                      prefixIcon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                      controller: phone,
                      validator: (value) =>
                          value == null ||
                              !RegExp(r'^[0-9+().\-\s]{9,20}$').hasMatch(value.trim())
                          ? 'Vui lòng nhập số điện thoại hợp lệ'
                          : null,
                    ),
                    SizedBox(height: 1.8.h),
                    Material(
                      color: AppColors.card,
                      shape: RoundedRectangleBorder(
                        side: const BorderSide(color: AppColors.border),
                        borderRadius: BorderRadius.circular(Responsive.radius(12)),
                      ),
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 0.5.h),
                        child: ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            birthDate == null
                                ? 'birth_date'.tr
                                : "${'birth_date'.tr}: ${Formatters.date(birthDate!)}",
                            style: TextStyle(
                              fontSize: Responsive.font(11),
                              color: AppColors.text,
                            ),
                          ),
                          trailing: const Icon(Icons.calendar_month_outlined, color: AppColors.primary),
                          onTap: () async {
                            final selected = await showDatePicker(
                            context: context,
                            initialDate:
                                birthDate ?? DateTime(DateTime.now().year - 18),
                            firstDate: DateTime(1900),
                            lastDate: DateTime.now(),
                          );
                          if (selected != null) {
                            setState(() => birthDate = selected);
                          }
                        },
                      ),
                    ),
                  ),
                  ],
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('close'.tr),
            ),
            Obx(
              () => FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.navy,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(Responsive.radius(8)),
                  ),
                ),
                onPressed: controller.saving.value
                    ? null
                    : () async {
                        if (!(formKey.currentState?.validate() ?? false)) {
                          return;
                        }
                        final saved = await controller.updateProfile(
                          name: name.text,
                          emailAddress: email.text,
                          phoneNumber: phone.text,
                          dateOfBirth: birthDate,
                        );
                        if (saved && context.mounted) {
                          Navigator.pop(context);
                        }
                      },
                child: controller.saving.value
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text('save'.tr),
              ),
            ),
          ],
        ),
      ),
    );
    name.dispose();
    email.dispose();
    phone.dispose();
  }

  Future<void> _changePassword(BuildContext context) async {
    final formKey = GlobalKey<FormState>();
    final currentPassword = TextEditingController();
    final newPassword = TextEditingController();
    final confirmation = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Responsive.radius(16)),
        ),
        title: Text(
          'change_password'.tr,
          style: TextStyle(
            fontSize: Responsive.font(16),
            fontWeight: FontWeight.w800,
            color: AppColors.navy,
          ),
        ),
        content: SizedBox(
          width: 85.w,
          child: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AppTextField(
                    label: 'Mật khẩu hiện tại',
                    hint: 'Nhập mật khẩu hiện tại',
                    prefixIcon: Icons.lock_outline_rounded,
                    controller: currentPassword,
                    obscureText: true,
                    validator: (value) => value == null || value.isEmpty
                        ? 'Vui lòng nhập mật khẩu hiện tại'
                        : null,
                  ),
                  SizedBox(height: 1.8.h),
                  AppTextField(
                    label: 'Mật khẩu mới',
                    hint: 'Ít nhất 8 ký tự',
                    prefixIcon: Icons.lock_reset_rounded,
                    controller: newPassword,
                    obscureText: true,
                    validator: (value) => value == null || value.length < 8
                        ? 'Mật khẩu mới cần ít nhất 8 ký tự'
                        : null,
                  ),
                  SizedBox(height: 1.8.h),
                  AppTextField(
                    label: 'Xác nhận mật khẩu mới',
                    hint: 'Nhập lại mật khẩu mới',
                    prefixIcon: Icons.check_circle_outline_rounded,
                    controller: confirmation,
                    obscureText: true,
                    validator: (value) => value != newPassword.text
                        ? 'Mật khẩu xác nhận không khớp'
                        : null,
                  ),
                ],
              ),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('close'.tr),
          ),
          Obx(
            () => FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.navy,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(Responsive.radius(8)),
                ),
              ),
              onPressed: controller.saving.value
                  ? null
                  : () async {
                      if (!(formKey.currentState?.validate() ?? false)) return;
                      final changed = await controller.changePassword(
                        currentPassword: currentPassword.text,
                        newPassword: newPassword.text,
                      );
                      if (changed && context.mounted) {
                        Navigator.pop(context);
                      }
                    },
              child: controller.saving.value
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text('save'.tr),
            ),
          ),
        ],
      ),
    );
    currentPassword.dispose();
    newPassword.dispose();
    confirmation.dispose();
  }

  Future<void> _showLanguageDialog(BuildContext context) async {
    final app = Get.find<AppController>();
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(Responsive.radius(20)),
        ),
      ),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(6.w, 3.h, 6.w, 3.h),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'choose_language'.tr,
                style: TextStyle(
                  fontSize: Responsive.font(16),
                  fontWeight: FontWeight.w800,
                  color: AppColors.navy,
                ),
              ),
              SizedBox(height: 2.h),
              Obx(() {
                final isVi = app.currentLocale.value.languageCode == 'vi';
                return Column(
                  children: [
                    ListTile(
                      leading: const Text('🇻🇳', style: TextStyle(fontSize: 24)),
                      title: const Text('Tiếng Việt', style: TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: const Text('Mặc định hệ thống'),
                      trailing: isVi ? const Icon(Icons.check_circle_rounded, color: AppColors.primary) : null,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: isVi ? AppColors.primary : AppColors.border,
                          width: isVi ? 1.5 : 1,
                        ),
                      ),
                      onTap: () async {
                        await app.setLocale('vi', 'VN');
                        if (sheetContext.mounted) Navigator.pop(sheetContext);
                      },
                    ),
                    SizedBox(height: 1.5.h),
                    ListTile(
                      leading: const Text('🇬🇧', style: TextStyle(fontSize: 24)),
                      title: const Text('English', style: TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: const Text('International travelers'),
                      trailing: !isVi ? const Icon(Icons.check_circle_rounded, color: AppColors.primary) : null,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: !isVi ? AppColors.primary : AppColors.border,
                          width: !isVi ? 1.5 : 1,
                        ),
                      ),
                      onTap: () async {
                        await app.setLocale('en', 'US');
                        if (sheetContext.mounted) Navigator.pop(sheetContext);
                      },
                    ),
                  ],
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _group(String label, List<Widget> children) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Padding(
        padding: EdgeInsets.only(left: 1.w, bottom: 1.h),
        child: Text(
          label,
          style: TextStyle(
            color: AppColors.primary,
            fontSize: Responsive.font(9),
            fontWeight: FontWeight.w800,
            letterSpacing: 0.5,
          ),
        ),
      ),
      Material(
        color: Colors.white,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: AppColors.border),
          borderRadius: BorderRadius.circular(Responsive.radius(14)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(children: children),
      ),
    ],
  );

  Widget _item(
    IconData icon,
    String title,
    VoidCallback onTap, {
    Color color = AppColors.text,
  }) => ListTile(
    onTap: onTap,
    leading: Icon(icon, color: color, size: 5.w),
    title: Text(
      title,
      style: TextStyle(
        color: color,
        fontSize: Responsive.font(11.5),
        fontWeight: FontWeight.w600,
      ),
    ),
    trailing: Icon(
      Icons.chevron_right_rounded,
      size: 5.w,
      color: AppColors.muted,
    ),
    dense: true,
  );
}
