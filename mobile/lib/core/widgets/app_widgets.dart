import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';
import '../../core/constants/app_routes.dart';
import '../../core/controllers/app_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/tour_model.dart';
import 'app_network_image.dart';

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.outlined = false,
    this.loading = false,
    this.height = 6,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool outlined;
  final bool loading;
  final double height;

  @override
  Widget build(BuildContext context) {
    final child = loading
        ? SizedBox.square(
            dimension: 4.w,
            child: const CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.primary,
            ),
          )
        : Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 4.5.w),
                SizedBox(width: 2.w),
              ],
              Text(
                label,
                style: TextStyle(
                  fontSize: Responsive.font(13),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          );
    return SizedBox(
      width: double.infinity,
      height: height.h.clamp(44.0, 56.0),
      child: outlined
          ? OutlinedButton(
              onPressed: loading ? null : onPressed,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(Responsive.radius(12)),
                ),
              ),
              child: child,
            )
          : FilledButton(
              onPressed: loading ? null : onPressed,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(Responsive.radius(12)),
                ),
              ),
              child: child,
            ),
    );
  }
}

class AppTextField extends StatelessWidget {
  const AppTextField({
    super.key,
    required this.label,
    this.hint,
    this.prefixIcon,
    this.controller,
    this.keyboardType,
    this.obscureText = false,
    this.validator,
    this.readOnly = false,
    this.onTap,
    this.onChanged,
    this.suffix,
  });

  final String label;
  final String? hint;
  final IconData? prefixIcon;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final bool obscureText;
  final String? Function(String?)? validator;
  final bool readOnly;
  final VoidCallback? onTap;
  final ValueChanged<String>? onChanged;
  final Widget? suffix;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        label.toUpperCase(),
        style: TextStyle(
          color: AppColors.primary,
          fontSize: Responsive.font(10),
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
      SizedBox(height: 1.h),
      TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscureText,
        validator: validator,
        readOnly: readOnly,
        onTap: onTap,
        onChanged: onChanged,
        style: TextStyle(fontSize: Responsive.font(13), color: AppColors.text),
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: prefixIcon == null
              ? null
              : Icon(prefixIcon, size: 5.w, color: AppColors.muted),
          suffixIcon: suffix,
        ),
      ),
    ],
  );
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.label,
    required this.title,
    this.action,
    this.onAction,
  });
  final String label;
  final String title;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.end,
    children: [
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label.toUpperCase(),
              style: TextStyle(
                color: AppColors.primary,
                fontSize: Responsive.font(10),
                fontWeight: FontWeight.w800,
                letterSpacing: 0.7,
              ),
            ),
            SizedBox(height: 0.5.h),
            Text(
              title.toUpperCase(),
              style: TextStyle(
                color: AppColors.navy,
                fontSize: Responsive.font(17),
                fontWeight: FontWeight.w800,
                height: 1.18,
              ),
            ),
          ],
        ),
      ),
      if (action != null)
        TextButton(
          onPressed: onAction,
          child: Text(
            action!,
            style: TextStyle(
              fontSize: Responsive.font(11),
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
    ],
  );
}

class RatingBadge extends StatelessWidget {
  const RatingBadge({
    super.key,
    required this.rating,
    required this.reviewCount,
  });
  final double rating;
  final int reviewCount;

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.symmetric(horizontal: 2.2.w, vertical: 0.7.h),
    decoration: BoxDecoration(
      color: AppColors.starBackground,
      borderRadius: BorderRadius.circular(Responsive.radius(99)),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.star_rounded, size: 3.8.w, color: AppColors.star),
        SizedBox(width: 0.6.w),
        Text(
          '${rating.toStringAsFixed(1)} sao ($reviewCount)',
          style: TextStyle(
            color: AppColors.text,
            fontSize: Responsive.font(10),
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    ),
  );
}

class PriceText extends StatelessWidget {
  const PriceText({
    super.key,
    required this.price,
    this.originalPrice,
    this.compact = false,
  });
  final int price;
  final int? originalPrice;
  final bool compact;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisSize: MainAxisSize.min,
    children: [
      Text(
        'từ ${Formatters.currency(price)}',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          color: AppColors.primary,
          fontSize: compact ? Responsive.font(13) : Responsive.font(16),
          fontWeight: FontWeight.w800,
        ),
      ),
      if (originalPrice != null)
        Text(
          Formatters.currency(originalPrice!),
          style: TextStyle(
            color: AppColors.muted,
            fontSize: compact ? Responsive.font(9) : Responsive.font(10),
            decoration: TextDecoration.lineThrough,
          ),
        ),
    ],
  );
}

class TourCard extends StatelessWidget {
  const TourCard({super.key, required this.tour, this.horizontal = false});
  final TourModel tour;
  final bool horizontal;

  @override
  Widget build(BuildContext context) {
    final card = Material(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(Responsive.radius(16)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Get.toNamed(AppRoutes.detail, arguments: tour),
        child: horizontal ? _horizontalContent() : _verticalContent(),
      ),
    );
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(Responsive.radius(16)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha((255 * 0.06).round()),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: card,
    );
  }

  Widget _image({required double width, required double height}) => SizedBox(
    width: width,
    height: height,
    child: Stack(
      fit: StackFit.expand,
      children: [
        AppNetworkImage(url: tour.imageUrl),
        Positioned(
          left: 2.5.w,
          top: 1.2.h,
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 2.5.w, vertical: 0.7.h),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(Responsive.radius(99)),
            ),
            child: Text(
              tour.isInternational ? 'TOUR QUỐC TẾ' : 'TOUR TRONG NƯỚC',
              style: TextStyle(
                color: Colors.white,
                fontSize: Responsive.font(8.5),
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),
        Positioned(right: 2.w, top: 1.h, child: _favoriteButton()),
        Positioned(
          right: 2.5.w,
          bottom: 1.h,
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 2.5.w, vertical: 0.6.h),
            decoration: BoxDecoration(
              color: AppColors.navy.withAlpha((255 * 0.78).round()),
              borderRadius: BorderRadius.circular(Responsive.radius(99)),
            ),
            child: Text(
              'Thời gian: ${tour.duration}',
              style: TextStyle(
                color: Colors.white,
                fontSize: Responsive.font(9),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    ),
  );

  Widget _favoriteButton() => GetX<AppController>(
    builder: (controller) {
      final active = controller.isFavorite(tour.id);
      return Material(
        color: Colors.white.withAlpha((255 * 0.95).round()),
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: () => controller.toggleFavorite(tour),
          child: Padding(
            padding: EdgeInsets.all(2.w),
            child: Icon(
              active ? Icons.favorite_rounded : Icons.favorite_border_rounded,
              size: 4.5.w,
              color: active ? AppColors.primary : AppColors.navy,
            ),
          ),
        ),
      );
    },
  );

  Widget _verticalContent() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      _image(width: double.infinity, height: 23.h),
      Padding(
        padding: EdgeInsets.all(3.5.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (tour.includesAirfare)
              Padding(
                padding: EdgeInsets.only(bottom: 1.h),
                child: Text(
                  '✓ Bao gồm vé máy bay & Khách sạn 4 sao',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppColors.green,
                    fontSize: Responsive.font(10),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            RatingBadge(rating: tour.rating, reviewCount: tour.reviewCount),
            SizedBox(height: 1.h),
            Text(
              tour.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: AppColors.navy,
                fontSize: Responsive.font(14),
                fontWeight: FontWeight.w700,
                height: 1.3,
              ),
            ),
            SizedBox(height: 0.7.h),
            Row(
              children: [
                Icon(
                  Icons.location_on_outlined,
                  size: 3.6.w,
                  color: AppColors.muted,
                ),
                SizedBox(width: 1.w),
                Expanded(
                  child: Text(
                    'Khởi hành: ${tour.departure}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: AppColors.muted,
                      fontSize: Responsive.font(10),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 1.h),
            PriceText(price: tour.price, originalPrice: tour.originalPrice),
          ],
        ),
      ),
    ],
  );

  Widget _horizontalContent() => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      _image(width: 38.w, height: 25.h),
      Expanded(
        child: Padding(
          padding: EdgeInsets.all(3.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              RatingBadge(rating: tour.rating, reviewCount: tour.reviewCount),
              SizedBox(height: 1.h),
              Text(
                tour.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: Responsive.font(12),
                  height: 1.3,
                ),
              ),
              SizedBox(height: 0.8.h),
              Text(
                '${tour.destination} · ${tour.duration}',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: AppColors.muted,
                  fontSize: Responsive.font(9.5),
                ),
              ),
              const Spacer(),
              PriceText(
                price: tour.price,
                originalPrice: tour.originalPrice,
                compact: true,
              ),
            ],
          ),
        ),
      ),
    ],
  );
}

class CategoryChip extends StatelessWidget {
  const CategoryChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.only(right: 2.w),
    child: ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: AppColors.primary,
      backgroundColor: Colors.white,
      side: BorderSide(color: selected ? AppColors.primary : AppColors.border),
      labelStyle: TextStyle(
        color: selected ? Colors.white : AppColors.muted,
        fontSize: Responsive.font(10),
        fontWeight: FontWeight.w600,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Responsive.radius(99)),
      ),
    ),
  );
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    required this.message,
    this.icon = Icons.travel_explore_rounded,
    this.action,
    this.onAction,
  });
  final String title;
  final String message;
  final IconData icon;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: EdgeInsets.all(8.w),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 20.w,
            height: 20.w,
            decoration: const BoxDecoration(
              color: AppColors.starBackground,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.orange, size: 9.w),
          ),
          SizedBox(height: 2.h),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: Responsive.font(16),
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: 0.8.h),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.muted,
              fontSize: Responsive.font(12),
            ),
          ),
          if (action != null) ...[
            SizedBox(height: 2.h),
            SizedBox(
              width: 60.w,
              child: AppButton(label: action!, onPressed: onAction),
            ),
          ],
        ],
      ),
    ),
  );
}
