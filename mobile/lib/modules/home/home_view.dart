import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import '../../core/controllers/app_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/widgets/skeleton_tour_card.dart';
import '../../data/mock/mock_data.dart';
import '../search/search_controller.dart' as search;
import 'home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final app = Get.find<AppController>();
    final searchController = Get.find<search.SearchController>();
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: controller.fetchTours,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(5.w, 1.5.h, 5.w, 1.h),
                  child: Row(
                    children: [
                      Container(
                        width: 11.w,
                        height: 11.w,
                        alignment: Alignment.center,
                        decoration: const BoxDecoration(
                          color: AppColors.blue,
                          shape: BoxShape.circle,
                        ),
                        child: Obx(
                          () => Text(
                            app.userInitials,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: Responsive.font(11),
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                      SizedBox(width: 3.w),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'hello'.tr,
                              style: TextStyle(
                                color: AppColors.muted,
                                fontSize: Responsive.font(10),
                              ),
                            ),
                            Obx(
                              () => Text(
                                app.displayName,
                                style: TextStyle(
                                  color: AppColors.navy,
                                  fontSize: Responsive.font(13),
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    app.buildNotificationBellButton(context),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 5.w),
                child: InkWell(
                  borderRadius: BorderRadius.circular(Responsive.radius(10)),
                  onTap: () => app.showNotificationsSheet(context),
                  child: Container(
                    padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.h),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(Responsive.radius(10)),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.notifications_active_rounded,
                          color: AppColors.orange,
                        ),
                        SizedBox(width: 2.w),
                        Expanded(
                          child: Obx(
                            () => Text(
                              app.notificationCount > 0
                                  ? 'Bạn có ${app.notificationCount} thông báo nhắc lịch khởi hành & đánh giá tour'
                                  : 'promo_banner_text'.tr,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: AppColors.navy,
                                fontSize: Responsive.font(10.2),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 3.w,
                          color: AppColors.orange,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(child: _hero(context, app, searchController)),
            SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.only(top: 2.5.h),
                child: _promoCarousel(),
              ),
            ),
            // Consolidated filter: single clean tab
            // _categories removed
            SliverToBoxAdapter(child: _featuredTours()),
            SliverToBoxAdapter(child: _flashSale()),
            SliverToBoxAdapter(child: _popularDestinations()),
            SliverToBoxAdapter(child: SizedBox(height: 3.h)),
          ],
        ),
      ),
    ),
  );
}

  Widget _hero(
    BuildContext context,
    AppController app,
    search.SearchController searchController,
  ) => Container(
    margin: EdgeInsets.only(top: 1.5.h),
    padding: EdgeInsets.fromLTRB(5.w, 3.h, 5.w, 2.5.h),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [AppColors.navy, AppColors.primaryDark],
      ),
      borderRadius: BorderRadius.vertical(
        bottom: Radius.circular(Responsive.radius(24)),
      ),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 0.8.h),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha((255 * 0.12).round()),
            borderRadius: BorderRadius.circular(Responsive.radius(99)),
          ),
          child: Text(
            'VIETTOUR  ·  HÀNH TRÌNH ĐẲNG CẤP',
            style: TextStyle(
              color: Colors.white,
              fontSize: Responsive.font(9),
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        SizedBox(height: 2.h),
        Text(
          'Khám Phá Việt Nam\n& Thế Giới',
          style: TextStyle(
            color: Colors.white,
            fontSize: Responsive.font(23),
            height: 1.1,
            fontWeight: FontWeight.w800,
          ),
        ),
        SizedBox(height: 1.h),
        Text(
          'Chạm đến những hành trình đáng nhớ.',
          style: TextStyle(
            color: Colors.white70,
            fontSize: Responsive.font(11),
          ),
        ),
        SizedBox(height: 2.5.h),
        Container(
          padding: EdgeInsets.all(4.w),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(Responsive.radius(16)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha((255 * 0.16).round()),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            children: [
              TextField(
                onChanged: (value) => app.searchQuery.value = value,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search_rounded),
                  hintText: 'home_search_hint'.tr,
                  border: InputBorder.none,
                  filled: false,
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              Divider(height: 2.h, color: AppColors.border),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: DateTime.now().add(
                            const Duration(days: 7),
                          ),
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(
                            const Duration(days: 365),
                          ),
                        );
                        if (picked != null) app.departureDate.value = picked;
                      },
                      child: Row(
                        children: [
                          const Icon(
                            Icons.calendar_month_outlined,
                            color: AppColors.primary,
                          ),
                          SizedBox(width: 2.w),
                          Expanded(
                            child: Obx(
                              () => Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'departure'.tr,
                                    style: TextStyle(
                                      color: AppColors.muted,
                                      fontSize: Responsive.font(8.5),
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  Text(
                                    app.departureDate.value == null
                                        ? 'select_date'.tr
                                        : '${app.departureDate.value!.day.toString().padLeft(2, '0')}/${app.departureDate.value!.month.toString().padLeft(2, '0')}/${app.departureDate.value!.year}',
                                    style: TextStyle(
                                      fontSize: Responsive.font(10),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Container(width: 1, height: 4.h, color: AppColors.border),
                  SizedBox(width: 3.w),
                  Icon(
                    Icons.people_outline_rounded,
                    color: AppColors.primary,
                    size: 5.w,
                  ),
                  SizedBox(width: 1.w),
                  Text(
                    'guests'.tr,
                    style: TextStyle(
                      color: AppColors.muted,
                      fontSize: Responsive.font(9),
                    ),
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    onPressed: () {
                      if (app.guestCount.value > 1) app.guestCount.value--;
                    },
                    icon: const Icon(
                      Icons.remove_circle_outline_rounded,
                      color: AppColors.muted,
                    ),
                  ),
                  Obx(
                    () => Text(
                      '${app.guestCount.value}',
                      style: TextStyle(
                        fontSize: Responsive.font(12),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    onPressed: () => app.guestCount.value++,
                    icon: const Icon(
                      Icons.add_circle_outline_rounded,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 1.h),
              AppButton(
                label: 'find_tour'.tr,
                icon: Icons.search_rounded,
                height: 5.5,
                onPressed: () {
                  searchController.departureDate.value = app.departureDate.value;
                  searchController.applyQuery(app.searchQuery.value);
                  app.selectedTab.value = 1;
                },
              ),
            ],
          ),
        ),
      ],
    ),
  );

  Widget _promoCarousel() {
    final banners = [
      (
        'banner_summer'.tr,
        'banner_summer_sub'.tr,
        '/uploads/tours/phuquoc.jpg',
      ),
      (
        'banner_japan'.tr,
        'banner_japan_sub'.tr,
        '/uploads/tours/tokyo.jpg',
      ),
      (
        'banner_sapa'.tr,
        'banner_sapa_sub'.tr,
        '/uploads/tours/sapa.jpg',
      ),
    ];
    return Column(
      children: [
        CarouselSlider.builder(
          options: CarouselOptions(
            height: 19.h,
            viewportFraction: 0.9,
            autoPlay: false,
            onPageChanged: (index, _) => controller.bannerIndex.value = index,
          ),
          itemCount: banners.length,
          itemBuilder: (context, index, _) => Container(
            margin: EdgeInsets.symmetric(horizontal: 1.w),
            width: double.infinity,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(Responsive.radius(16)),
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              fit: StackFit.expand,
              children: [
                AppNetworkImage(url: banners[index].$3),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [Color(0xD90F172A), Colors.transparent],
                    ),
                  ),
                ),
                Padding(
                  padding: EdgeInsets.all(5.w),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        banners[index].$1,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: Responsive.font(18),
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      SizedBox(height: 0.7.h),
                      Text(
                        banners[index].$2,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: Responsive.font(10),
                        ),
                      ),
                      SizedBox(height: 1.h),
                      Text(
                        'KHÁM PHÁ NGAY  →',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: Responsive.font(9),
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        SizedBox(height: 1.5.h),
        Obx(
          () => AnimatedSmoothIndicator(
            activeIndex: controller.bannerIndex.value,
            count: banners.length,
            effect: const ExpandingDotsEffect(
              activeDotColor: AppColors.primary,
              dotColor: AppColors.border,
              dotHeight: 7,
              dotWidth: 7,
              expansionFactor: 3,
            ),
          ),
        ),
      ],
    );
  }

  // ignore: unused_element
  Widget _categories(search.SearchController searchController) => Padding(
    padding: EdgeInsets.fromLTRB(5.w, 3.h, 0, 2.h),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(
          label: 'Danh mục lữ hành',
          title: 'Khám phá theo sở thích',
        ),
        SizedBox(height: 2.h),
        SizedBox(
          height: 11.h,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: MockData.categories.length,
            separatorBuilder: (_, _) => SizedBox(width: 4.w),
            itemBuilder: (context, index) {
              final category = MockData.categories[index];
              return InkWell(
                onTap: () {
                  searchController.region.value = category.query == 'Ưu đãi'
                      ? 'view_all'.tr
                      : category.query;
                  Get.find<AppController>().selectedTab.value = 1;
                },
                child: SizedBox(
                  width: 16.w,
                  child: Column(
                    children: [
                      Container(
                        width: 13.w,
                        height: 13.w,
                        decoration: BoxDecoration(
                          color: category.color.withAlpha((255 * 0.12).round()),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          category.icon,
                          color: category.color,
                          size: 6.w,
                        ),
                      ),
                      SizedBox(height: 0.8.h),
                      Text(
                        category.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: Responsive.font(9),
                          color: AppColors.text,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    ),
  );

  Widget _featuredTours() => Padding(
    padding: EdgeInsets.fromLTRB(5.w, 1.h, 0, 1.h),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          label: 'Lựa chọn của du khách',
          title: 'Tour du lịch nổi bật 2026',
          action: 'Tất cả',
          onAction: () => Get.find<AppController>().selectedTab.value = 1,
        ),
        SizedBox(height: 1.5.h),
        SizedBox(
          height: 5.h,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: controller.filters
                .map(
                  (filter) => Obx(
                    () => CategoryChip(
                      label: filter,
                      selected: controller.selectedFilter.value == filter,
                      onTap: () => controller.selectFilter(filter),
                    ),
                  ),
                )
                .toList(),
          ),
        ),
        SizedBox(height: 1.5.h),
        // ── API-aware tour list ──────────────────────────────────────────────
        SizedBox(
          height: 58.h,
          child: Obx(() {
            final state = controller.loadState.value;

            // Loading — shimmer skeletons
            if (state == LoadState.loading) {
              return ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.only(right: 5.w),
                itemCount: 3,
                separatorBuilder: (_, _) => SizedBox(width: 4.w),
                itemBuilder: (_, _) =>
                    SizedBox(width: 82.w, child: const SkeletonTourCard()),
              );
            }

            // Error — message + retry button (still shows tours from fallback)
            if (state == LoadState.error) {
              return Column(
                children: [
                  Container(
                    margin: EdgeInsets.only(right: 5.w, bottom: 1.h),
                    padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.5.h),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF3CD),
                      borderRadius: BorderRadius.circular(Responsive.radius(10)),
                      border: Border.all(color: const Color(0xFFFFCA2C)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.wifi_off_rounded,
                            color: Color(0xFF664D03), size: 18),
                        SizedBox(width: 2.w),
                        Expanded(
                          child: Text(
                            controller.errorMessage.value,
                            style: TextStyle(
                              fontSize: Responsive.font(9),
                              color: const Color(0xFF664D03),
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        TextButton(
                          onPressed: controller.fetchTours,
                          child: Text(
                            'Thử lại',
                            style: TextStyle(
                              fontSize: Responsive.font(9.5),
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: _tourListView(),
                  ),
                ],
              );
            }

            // Empty state
            if (state == LoadState.empty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.travel_explore_rounded,
                        size: 14.w, color: AppColors.muted),
                    SizedBox(height: 2.h),
                    Text(
                      'Chưa có tour nào trong hệ thống.',
                      style: TextStyle(
                        color: AppColors.muted,
                        fontSize: Responsive.font(11),
                      ),
                    ),
                    SizedBox(height: 1.h),
                    TextButton.icon(
                      onPressed: controller.fetchTours,
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Tải lại'),
                    ),
                  ],
                ),
              );
            }

            // Success
            return _tourListView();
          }),
        ),
      ],
    ),
  );

  /// The horizontal list of [TourCard] widgets (used in success & error states).
  Widget _tourListView() {
    final tours = controller.visibleTours;
    if (tours.isEmpty) {
      return Center(
        child: Text(
          'Không có tour phù hợp với bộ lọc.',
          style: TextStyle(
              color: AppColors.muted, fontSize: Responsive.font(10)),
        ),
      );
    }
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      itemCount: tours.length,
      padding: EdgeInsets.only(right: 5.w, bottom: 1.h),
      separatorBuilder: (_, _) => SizedBox(width: 4.w),
      itemBuilder: (context, index) =>
          SizedBox(width: 82.w, child: TourCard(tour: tours[index])),
    );
  }

  Widget _flashSale() => Padding(
    padding: EdgeInsets.fromLTRB(5.w, 2.h, 5.w, 2.h),
    child: Container(
      padding: EdgeInsets.all(4.w),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.orange],
        ),
        borderRadius: BorderRadius.circular(Responsive.radius(16)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ƯU ĐÃI GIỜ CHÓT',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: Responsive.font(9),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 0.6.h),
                Text(
                  'Săn tour giá tốt\nChỉ hôm nay!',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: Responsive.font(17),
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
                ),
                SizedBox(height: 1.h),
                Text(
                  '03 : 22 : 18',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: Responsive.font(12),
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.bolt_rounded,
            color: Colors.white.withAlpha((255 * 0.9).round()),
            size: 18.w,
          ),
        ],
      ),
    ),
  );

  Widget _popularDestinations() {
    const destinations = [
      (
        'Đà Nẵng',
        '/uploads/tours/danang.jpg',
      ),
      (
        'Phú Quốc',
        '/uploads/tours/phuquoc.jpg',
      ),
      (
        'Sa Pa',
        '/uploads/tours/sapa.jpg',
      ),
      (
        'Hạ Long',
        '/uploads/tours/halong.jpg',
      ),
      (
        'Tokyo',
        '/uploads/tours/tokyo.jpg',
      ),
    ];
    return Padding(
      padding: EdgeInsets.fromLTRB(5.w, 1.h, 0, 2.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(
            label: 'Lên đường thôi',
            title: 'Điểm đến phổ biến',
          ),
          SizedBox(height: 1.5.h),
          SizedBox(
            height: 20.h,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: destinations.length,
              separatorBuilder: (_, _) => SizedBox(width: 3.w),
              itemBuilder: (context, index) => SizedBox(
                width: 31.w,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(Responsive.radius(14)),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      AppNetworkImage(url: destinations[index].$2),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [Color(0xB3000000), Colors.transparent],
                          ),
                        ),
                      ),
                      Positioned(
                        left: 3.w,
                        bottom: 1.5.h,
                        child: Text(
                          destinations[index].$1,
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: Responsive.font(12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
