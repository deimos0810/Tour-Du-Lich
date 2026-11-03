import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/controllers/app_controller.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/departure_model.dart';
import '../../data/models/tour_model.dart';
import 'tour_detail_controller.dart';

class TourDetailView extends GetView<TourDetailController> {
  const TourDetailView({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final tour = controller.currentTour;
      final images = controller.tourImages;

      return Scaffold(
        body: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 38.h,
              pinned: true,
              leading: _circleAction(Icons.arrow_back_rounded, Get.back),
              actions: [
                _circleAction(
                  Icons.share_outlined,
                  () => Get.snackbar(
                    'share'.tr,
                    'share_ready'.tr,
                  ),
                ),
                Obx(() {
                  final favorite =
                      Get.find<AppController>().isFavorite(tour.id);
                  return _circleAction(
                    favorite
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    () => Get.find<AppController>().toggleFavorite(tour),
                    color: favorite ? AppColors.primary : AppColors.navy,
                  );
                }),
                SizedBox(width: 3.w),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Slider ảnh tour chuẩn xác theo địa danh, vuốt mượt mà
                    PageView.builder(
                      controller: controller.pageController,
                      itemCount: images.length,
                      onPageChanged: (index) =>
                          controller.selectedImage.value = index,
                      itemBuilder: (context, index) =>
                          AppNetworkImage(url: images[index]),
                    ),

                    // Lớp gradient phủ nhẹ - bọc IgnorePointer để không chặn cử chỉ vuốt
                    const IgnorePointer(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Color(0x44000000),
                              Colors.transparent,
                              Color(0x66000000),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Badge loại tour (Trong nước / Quốc tế)
                    Positioned(
                      left: 5.w,
                      bottom: 2.h,
                      child: IgnorePointer(
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 3.w,
                            vertical: 0.8.h,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(
                              Responsive.radius(99),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withAlpha(50),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                          child: Text(
                            tour.isInternational
                                ? 'international_tour'.tr
                                : 'domestic_tour'.tr,
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: Responsive.font(9),
                            ),
                          ),
                        ),
                      ),
                    ),

                    // Bộ đếm số ảnh thực tế
                    Positioned(
                      right: 5.w,
                      bottom: 2.h,
                      child: IgnorePointer(
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 3.w,
                            vertical: 0.8.h,
                          ),
                          decoration: BoxDecoration(
                            color:
                                AppColors.navy.withAlpha((255 * 0.75).round()),
                            borderRadius: BorderRadius.circular(
                              Responsive.radius(99),
                            ),
                          ),
                          child: Obx(
                            () => Text(
                              '${controller.selectedImage.value + 1} / ${images.length}',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: Responsive.font(9),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(5.w, 2.5.h, 5.w, 14.h),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Badge xếp hạng đồng bộ với Web
                    RatingBadge(
                      rating: tour.rating,
                      reviewCount: tour.reviewCount,
                    ),
                    SizedBox(height: 1.2.h),
                    Text(
                      tour.title,
                      style: TextStyle(
                        fontSize: Responsive.font(20),
                        fontWeight: FontWeight.w800,
                        color: AppColors.navy,
                        height: 1.25,
                      ),
                    ),
                    SizedBox(height: 1.2.h),
                    Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          size: 4.w,
                          color: AppColors.primary,
                        ),
                        SizedBox(width: 1.w),
                        Expanded(
                          child: Text(
                            tour.destination,
                            style: TextStyle(
                              color: AppColors.muted,
                              fontSize: Responsive.font(11),
                            ),
                          ),
                        ),
                        Icon(
                          Icons.schedule_rounded,
                          size: 4.w,
                          color: AppColors.primary,
                        ),
                        SizedBox(width: 1.w),
                        Text(
                          tour.duration,
                          style: TextStyle(
                            color: AppColors.muted,
                            fontSize: Responsive.font(10.5),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 2.5.h),
                    _section('overview'.tr, _overview(tour)),
                    _section('departure_schedule'.tr, _departureChoices()),
                    _section('daily_itinerary'.tr, _itinerary(context, tour)),
                    _section(
                      'included_services'.tr,
                      Column(
                        children: [
                          _bullet('Phương tiện di chuyển đời mới theo chương trình'),
                          _bullet('Khách sạn tiêu chuẩn tiện nghi cao cấp'),
                          _bullet('Các bữa ăn và vé tham quan theo đúng lịch trình'),
                          _bullet('Bảo hiểm du lịch trách nhiệm cao'),
                          _bullet(
                            'Chi phí cá nhân và dịch vụ ngoài chương trình chưa bao gồm',
                          ),
                        ],
                      ),
                    ),
                    _section(
                      'cancellation_policy'.tr,
                      Text(
                        'Hủy trước ngày khởi hành 15 ngày: phí 30%. Hủy từ 7 đến 14 ngày: phí 50%. Hủy trong vòng 7 ngày: phí 100%. Điều kiện có thể thay đổi theo chương trình tour.',
                        style: TextStyle(
                          color: AppColors.muted,
                          fontSize: Responsive.font(10.5),
                          height: 1.55,
                        ),
                      ),
                    ),
                    _section('customer_reviews'.tr, _reviewsSection(tour)),
                  ],
                ),
              ),
            ),
          ],
        ),
        bottomNavigationBar: SafeArea(
          top: false,
          child: Container(
            padding: EdgeInsets.fromLTRB(5.w, 1.2.h, 5.w, 1.h),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha((255 * 0.08).round()),
                  blurRadius: 12,
                  offset: const Offset(0, -3),
                ),
              ],
            ),
            child: Obx(
              () => Row(
                children: [
                  Expanded(
                    child: PriceText(
                      price: controller.selectedDeparture?.price ?? tour.price,
                      originalPrice: tour.originalPrice,
                    ),
                  ),
                  SizedBox(width: 4.w),
                  SizedBox(
                    width: 45.w,
                    child: AppButton(
                      label: controller.selectedDeparture == null
                          ? 'select_schedule'.tr
                          : 'book_now'.tr,
                      icon: Icons.arrow_forward_rounded,
                      onPressed: controller.bookSelectedDeparture,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    });
  }

  Widget _overview(TourModel tour) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        tour.category,
        style: TextStyle(
          color: AppColors.primary,
          fontSize: Responsive.font(11),
          fontWeight: FontWeight.w700,
        ),
      ),
      SizedBox(height: 1.5.h),
      _bullet('Khởi hành từ: ${tour.departure.isNotEmpty ? tour.departure : "TP. Hồ Chí Minh"}'),
      _bullet('Hướng dẫn viên chuyên nghiệp đồng hành suốt tuyến'),
      _bullet(
        tour.includesAirfare
            ? 'airfare_hotel_included'.tr
            : 'Dịch vụ lưu trú và xe du lịch chất lượng cao',
      ),
    ],
  );

  Widget _departureChoices() => Obx(() {
    if (controller.loadingDepartures.value && controller.departures.isEmpty) {
      return const Center(child: Padding(
        padding: EdgeInsets.all(16.0),
        child: CircularProgressIndicator(),
      ));
    }
    if (controller.departures.isEmpty) {
      return Text(
        'no_schedule_available'.tr,
        style: TextStyle(color: AppColors.muted, fontSize: Responsive.font(11)),
      );
    }
    return Column(
      children: controller.departures.map(_departureOption).toList(),
    );
  });

  Widget _departureOption(DepartureModel departure) {
    return Obx(() {
      final selected = controller.selectedDepartureId.value == departure.id;
      final bookable = departure.isBookable;
      return InkWell(
        onTap: bookable
            ? () => controller.selectedDepartureId.value = departure.id
            : null,
        borderRadius: BorderRadius.circular(Responsive.radius(12)),
        child: Container(
          width: double.infinity,
          margin: EdgeInsets.only(bottom: 1.h),
          padding: EdgeInsets.all(3.w),
          decoration: BoxDecoration(
            color: selected ? AppColors.starBackground : Colors.white,
            borderRadius: BorderRadius.circular(Responsive.radius(12)),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.border,
              width: selected ? 1.5 : 1.0,
            ),
          ),
          child: Row(
            children: [
              Icon(
                selected
                    ? Icons.radio_button_checked
                    : Icons.radio_button_unchecked,
                color: selected ? AppColors.primary : AppColors.muted,
              ),
              SizedBox(width: 2.5.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${Formatters.date(departure.startDate)} - ${Formatters.date(departure.endDate)}',
                      style: TextStyle(
                        fontSize: Responsive.font(11),
                        fontWeight: FontWeight.w700,
                        color: bookable ? AppColors.navy : AppColors.muted,
                      ),
                    ),
                    SizedBox(height: 0.4.h),
                    Text(
                      bookable
                          ? 'remaining_seats'.trParams({'count': '${departure.remainingSeats}'})
                          : departure.remainingSeats == 0
                              ? 'sold_out'.tr
                              : 'Không nhận đặt chỗ',
                      style: TextStyle(
                        fontSize: Responsive.font(9.5),
                        fontWeight: FontWeight.w600,
                        color: bookable ? AppColors.green : AppColors.muted,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                Formatters.currency(departure.price),
                style: TextStyle(
                  fontSize: Responsive.font(11),
                  fontWeight: FontWeight.w700,
                  color: selected ? AppColors.primary : AppColors.navy,
                ),
              ),
            ],
          ),
        ),
      );
    });
  }

  /// Lịch trình theo ngày hiển thị sạch sẽ và có ảnh thực tế của từng ngày
  Widget _itinerary(BuildContext context, TourModel tour) {
    final days = tour.itineraryDays;
    if (days.isEmpty) {
      return Text(
        'Lịch trình chi tiết đang được cập nhật.',
        style: TextStyle(color: AppColors.muted, fontSize: Responsive.font(11)),
      );
    }

    return Column(
      children: List.generate(
        days.length,
        (index) {
          final item = days[index];
          return Container(
            margin: EdgeInsets.only(bottom: 1.2.h),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(Responsive.radius(12)),
              border: Border.all(color: AppColors.border),
            ),
            child: Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                initiallyExpanded: index == 0,
                tilePadding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 0.5.h),
                childrenPadding: EdgeInsets.fromLTRB(4.w, 0, 4.w, 2.h),
                leading: CircleAvatar(
                  radius: 4.5.w,
                  backgroundColor: AppColors.starBackground,
                  child: Text(
                    '${item.day}',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: Responsive.font(11),
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                title: Text(
                  'Ngày ${item.day}: ${item.title}',
                  style: TextStyle(
                    fontSize: Responsive.font(11.5),
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
                children: [
                  // Ảnh minh họa thực tế của ngày tham quan nếu có
                  if (item.image != null && item.image!.trim().isNotEmpty) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(Responsive.radius(10)),
                      child: Container(
                        margin: EdgeInsets.only(bottom: 1.2.h),
                        width: double.infinity,
                        height: 19.h,
                        child: AppNetworkImage(
                          url: item.image!,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ],
                  if (item.detail.isNotEmpty)
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        item.detail,
                        style: TextStyle(
                          color: const Color(0xFF475569),
                          fontSize: Responsive.font(10.5),
                          height: 1.55,
                        ),
                      ),
                    ),
                  if (item.meals != null && item.meals!.trim().isNotEmpty) ...[
                    SizedBox(height: 1.h),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('🍽️ ', style: TextStyle(fontSize: 13)),
                        Expanded(
                          child: Text(
                            '${'meals_label'.tr}: ${item.meals}',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontSize: Responsive.font(10),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (item.highlights.isNotEmpty) ...[
                    SizedBox(height: 1.h),
                    Wrap(
                      spacing: 1.5.w,
                      runSpacing: 0.5.h,
                      children: item.highlights.map((h) {
                        return Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 2.w,
                            vertical: 0.4.h,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '#$h',
                            style: TextStyle(
                              fontSize: Responsive.font(9),
                              color: const Color(0xFF475569),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  /// Phần đánh giá khách hàng đồng bộ dữ liệu thật với Web
  Widget _reviewsSection(TourModel tour) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Hộp điểm số tổng quan
        Container(
          padding: EdgeInsets.all(3.5.w),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(Responsive.radius(12)),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.h),
                decoration: BoxDecoration(
                  color: AppColors.starBackground,
                  borderRadius: BorderRadius.circular(Responsive.radius(8)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.star_rounded, color: AppColors.star, size: 22),
                    SizedBox(width: 1.w),
                    Text(
                      tour.rating.toStringAsFixed(1),
                      style: TextStyle(
                        fontSize: Responsive.font(16),
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFFB45309),
                      ),
                    ),
                    Text(
                      ' / 5',
                      style: TextStyle(
                        fontSize: Responsive.font(11),
                        color: const Color(0xFFB45309),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(width: 3.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'average_rating'.tr,
                      style: TextStyle(
                        fontSize: Responsive.font(11),
                        fontWeight: FontWeight.w700,
                        color: AppColors.navy,
                      ),
                    ),
                    Text(
                      tour.reviewCount > 0
                          ? 'based_on_reviews'.trParams({'count': '${tour.reviewCount}'})
                          : 'no_reviews_yet'.tr,
                      style: TextStyle(
                        fontSize: Responsive.font(9.5),
                        color: AppColors.muted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: 1.5.h),

        // Danh sách các đánh giá chi tiết
        if (tour.reviews.isNotEmpty)
          ...tour.reviews.map((r) => Container(
                margin: EdgeInsets.only(bottom: 1.h),
                padding: EdgeInsets.all(3.5.w),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(Responsive.radius(10)),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          r.author,
                          style: TextStyle(
                            fontSize: Responsive.font(11),
                            fontWeight: FontWeight.w700,
                            color: AppColors.navy,
                          ),
                        ),
                        Text(
                          Formatters.date(r.date),
                          style: TextStyle(
                            fontSize: Responsive.font(9.5),
                            color: AppColors.muted,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 0.5.h),
                    Row(
                      children: List.generate(
                        5,
                        (starIdx) => Icon(
                          starIdx < r.rating
                              ? Icons.star_rounded
                              : Icons.star_outline_rounded,
                          color: AppColors.star,
                          size: 16,
                        ),
                      ),
                    ),
                    if (r.comment.isNotEmpty) ...[
                      SizedBox(height: 0.7.h),
                      Text(
                        r.comment,
                        style: TextStyle(
                          fontSize: Responsive.font(10.5),
                          color: const Color(0xFF334155),
                          height: 1.45,
                        ),
                      ),
                    ],
                  ],
                ),
              ))
        else
          Container(
            padding: EdgeInsets.all(3.w),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Chuyến đi tuyệt vời, hướng dẫn viên chuyên nghiệp và tận tình. 5 sao cho VietTour!',
              style: TextStyle(
                fontSize: Responsive.font(10.5),
                color: AppColors.muted,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
      ],
    );
  }

  Widget _circleAction(
    IconData icon,
    VoidCallback onTap, {
    Color color = AppColors.navy,
  }) => Padding(
    padding: EdgeInsets.only(left: 1.w),
    child: Material(
      color: Colors.white.withAlpha((255 * 0.95).round()),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.all(2.5.w),
          child: Icon(icon, size: 4.8.w, color: color),
        ),
      ),
    ),
  );

  Widget _section(String title, Widget child) => Container(
    width: double.infinity,
    margin: EdgeInsets.only(top: 2.5.h),
    padding: EdgeInsets.only(top: 2.h),
    decoration: const BoxDecoration(
      border: Border(top: BorderSide(color: AppColors.border)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            color: AppColors.navy,
            fontSize: Responsive.font(12),
            fontWeight: FontWeight.w800,
            letterSpacing: 0.3,
          ),
        ),
        SizedBox(height: 1.5.h),
        child,
      ],
    ),
  );

  Widget _bullet(String text) => Padding(
    padding: EdgeInsets.only(bottom: 1.h),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.check_circle_rounded, size: 4.w, color: AppColors.green),
        SizedBox(width: 2.w),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: AppColors.muted,
              fontSize: Responsive.font(10.5),
            ),
          ),
        ),
      ],
    ),
  );
}
