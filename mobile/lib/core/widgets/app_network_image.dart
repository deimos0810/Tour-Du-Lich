import 'package:flutter/material.dart';
import 'package:viet_tour/core/constants/api_config.dart';
import 'package:viet_tour/core/utils/responsive.dart';
import '../theme/app_colors.dart';

class AppNetworkImage extends StatelessWidget {
  const AppNetworkImage({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.borderRadius = 0,
  });

  final String url;
  final BoxFit fit;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final resolved = ApiConfig.resolveImageUrl(url);
    if (resolved.isEmpty) {
      return _fallback();
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(Responsive.radius(borderRadius)),
      child: Image.network(
        resolved,
        fit: fit,
        cacheWidth: 500,
        filterQuality: FilterQuality.low,
        gaplessPlayback: true,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            color: const Color(0xFFF1F5F9),
            alignment: Alignment.center,
            child: const Icon(
              Icons.landscape_outlined,
              color: Color(0xFF94A3B8),
              size: 24,
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) => _fallback(),
      ),
    );
  }

  Widget _fallback() => ClipRRect(
    borderRadius: BorderRadius.circular(Responsive.radius(borderRadius)),
    child: Container(
      color: AppColors.border,
      alignment: Alignment.center,
      child: const Icon(
        Icons.image_not_supported_outlined,
        color: AppColors.muted,
      ),
    ),
  );
}
