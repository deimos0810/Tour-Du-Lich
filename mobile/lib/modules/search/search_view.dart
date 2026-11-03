import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:sizer/sizer.dart';
import 'package:viet_tour/core/utils/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/widgets/skeleton_tour_card.dart';
import '../home/home_controller.dart';
import 'search_controller.dart' as search;

class SearchView extends GetView<search.SearchController> {
  const SearchView({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(
        'search_title'.tr,
        style: TextStyle(
          fontSize: Responsive.font(18),
          fontWeight: FontWeight.w800,
        ),
      ),
      actions: [
        IconButton(
          onPressed: () => _showFilters(context),
          icon: const Icon(Icons.tune_rounded),
        ),
      ],
    ),
    body: Padding(
      padding: EdgeInsets.symmetric(horizontal: 5.w),
      child: Column(
        children: [
          TextField(
            onChanged: controller.applyQuery,
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search_rounded),
              hintText: 'home_search_hint'.tr,
            ),
          ),
          Obx(() {
            final date = controller.departureDate.value;
            if (date == null) return const SizedBox.shrink();
            return Container(
              margin: EdgeInsets.only(top: 1.h),
              child: Row(
                children: [
                  Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: 3.w,
                      vertical: 0.6.h,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(25),
                      borderRadius: BorderRadius.circular(Responsive.radius(20)),
                      border: Border.all(
                        color: AppColors.primary.withAlpha(100),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.calendar_month_outlined,
                          size: 15,
                          color: AppColors.primary,
                        ),
                        SizedBox(width: 1.5.w),
                        Text(
                          'Khởi hành: ${Formatters.date(date)}',
                          style: TextStyle(
                            fontSize: Responsive.font(10),
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                        SizedBox(width: 1.5.w),
                        InkWell(
                          onTap: controller.clearDateFilter,
                          child: const Icon(
                            Icons.close_rounded,
                            size: 16,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
          SizedBox(height: 1.5.h),
          Row(
            children: [
              Expanded(
                child: Text(
                  'search_results'.tr,
                  style: TextStyle(
                    fontSize: Responsive.font(13),
                    color: AppColors.muted,
                  ),
                ),
              ),
              Obx(
                () => Text(
                  '${controller.results.length} tour',
                  style: TextStyle(
                    fontSize: Responsive.font(11),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              IconButton(
                onPressed: () => controller.gridView.toggle(),
                icon: Obx(
                  () => Icon(
                    controller.gridView.value
                        ? Icons.view_list_rounded
                        : Icons.grid_view_rounded,
                    color: AppColors.navy,
                  ),
                ),
              ),
            ],
          ),
          Expanded(
            child: Obx(() {
              final homeController = Get.find<HomeController>();
              if (homeController.isLoading) {
                return ListView.separated(
                  itemCount: 3,
                  padding: EdgeInsets.only(bottom: 3.h),
                  separatorBuilder: (context, index) => SizedBox(height: 1.5.h),
                  itemBuilder: (context, index) => const SkeletonTourCard(),
                );
              }
              final tours = controller.results;
              if (tours.isEmpty) {
                return const EmptyState(
                  title: 'Chưa tìm thấy tour phù hợp',
                  message: 'Thử đổi từ khóa hoặc xóa bớt bộ lọc.',
                  icon: Icons.search_off_rounded,
                );
              }
              if (controller.gridView.value) {
                return GridView.builder(
                  padding: EdgeInsets.only(bottom: 3.h),
                  itemCount: tours.length,
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 3.w,
                    mainAxisSpacing: 2.h,
                    childAspectRatio: 0.45,
                  ),
                  itemBuilder: (context, index) => TourCard(tour: tours[index]),
                );
              }
              return ListView.separated(
                padding: EdgeInsets.only(bottom: 3.h),
                itemCount: tours.length,
                separatorBuilder: (context, index) => SizedBox(height: 1.5.h),
                itemBuilder: (context, index) => SizedBox(
                  height: 25.h,
                  child: TourCard(tour: tours[index], horizontal: true),
                ),
              );
            }),
          ),
        ],
      ),
    ),
  );

  void _showFilters(BuildContext context) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(Responsive.radius(22)),
      ),
    ),
    builder: (context) => Padding(
      padding: EdgeInsets.fromLTRB(6.w, 1.h, 6.w, 4.h),
      child: SafeArea(
        top: false,
        child: Obx(
          () => SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 12.w,
                    height: 0.5.h,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(
                        Responsive.radius(99),
                      ),
                    ),
                  ),
                ),
                SizedBox(height: 2.h),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Bộ lọc tour',
                        style: TextStyle(
                          fontSize: Responsive.font(18),
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: controller.resetFilters,
                      child: const Text('Đặt lại'),
                    ),
                  ],
                ),
                SizedBox(height: 1.h),
                Text(
                  'Khu vực',
                  style: TextStyle(
                    fontSize: Responsive.font(12),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: 1.h),
                Wrap(
                  spacing: 2.w,
                  children:
                      [
                            'Tất cả',
                            'Miền Bắc',
                            'Miền Trung',
                            'Miền Nam',
                            'Quốc tế',
                          ]
                          .map(
                            (region) => CategoryChip(
                              label: region,
                              selected: controller.region.value == region,
                              onTap: () => controller.region.value = region,
                            ),
                          )
                          .toList(),
                ),
                SizedBox(height: 1.5.h),
                Text(
                  'Ngày khởi hành',
                  style: TextStyle(
                    fontSize: Responsive.font(12),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: 0.8.h),
                Row(
                  children: [
                    OutlinedButton.icon(
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: controller.departureDate.value ??
                              DateTime.now().add(const Duration(days: 7)),
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                        );
                        if (picked != null) {
                          controller.departureDate.value = picked;
                        }
                      },
                      icon: const Icon(Icons.calendar_month_outlined, size: 18),
                      label: Text(
                        controller.departureDate.value == null
                            ? 'Chọn ngày khởi hành'
                            : Formatters.date(controller.departureDate.value!),
                        style: TextStyle(fontSize: Responsive.font(10.5)),
                      ),
                    ),
                    if (controller.departureDate.value != null) ...[
                      SizedBox(width: 2.w),
                      TextButton(
                        onPressed: controller.clearDateFilter,
                        child: const Text('Xóa ngày'),
                      ),
                    ],
                  ],
                ),
                SizedBox(height: 1.5.h),
                Text(
                  'Thời lượng',
                  style: TextStyle(
                    fontSize: Responsive.font(12),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: 1.h),
                Wrap(
                  spacing: 2.w,
                  children: ['Tất cả', '3 ngày trở xuống', '4 ngày trở lên']
                      .map(
                        (value) => CategoryChip(
                          label: value,
                          selected: controller.duration.value == value,
                          onTap: () => controller.duration.value = value,
                        ),
                      )
                      .toList(),
                ),
                SizedBox(height: 1.5.h),
                Text(
                  'Điểm khởi hành',
                  style: TextStyle(
                    fontSize: Responsive.font(12),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: 1.h),
                Wrap(
                  spacing: 2.w,
                  children: ['Tất cả', 'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng']
                      .map(
                        (value) => CategoryChip(
                          label: value,
                          selected: controller.departure.value == value,
                          onTap: () => controller.departure.value = value,
                        ),
                      )
                      .toList(),
                ),
                SizedBox(height: 2.h),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Khoảng giá',
                        style: TextStyle(
                          fontSize: Responsive.font(12),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Text(
                      '${(controller.minPrice.value / 1000000).round()} – ${(controller.maxPrice.value / 1000000).round()} triệu',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: Responsive.font(10),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                RangeSlider(
                  values: RangeValues(
                    controller.minPrice.value,
                    controller.maxPrice.value,
                  ),
                  min: 0,
                  max: 35000000,
                  divisions: 35,
                  activeColor: AppColors.primary,
                  onChanged: (range) {
                    controller.minPrice.value = range.start;
                    controller.maxPrice.value = range.end;
                  },
                ),
                Row(
                  children: [
                    Text(
                      'Đánh giá từ',
                      style: TextStyle(
                        fontSize: Responsive.font(12),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(width: 2.w),
                    DropdownButton<double>(
                      value: controller.minRating.value,
                      items: [0.0, 4.0, 4.5, 4.8]
                          .map(
                            (value) => DropdownMenuItem(
                              value: value,
                              child: Text(
                                value == 0 ? 'Tất cả' : '$value+ sao',
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (value) =>
                          controller.minRating.value = value ?? 0,
                    ),
                  ],
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  activeThumbColor: AppColors.primary,
                  title: Text(
                    'Bao gồm vé máy bay',
                    style: TextStyle(
                      fontSize: Responsive.font(12),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  value: controller.airfareOnly.value,
                  onChanged: (value) => controller.airfareOnly.value = value,
                ),
                Text(
                  'Sắp xếp theo',
                  style: TextStyle(
                    fontSize: Responsive.font(12),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Wrap(
                  spacing: 2.w,
                  children: ['Phổ biến', 'Giá thấp đến cao', 'Đánh giá cao']
                      .map(
                        (sort) => CategoryChip(
                          label: sort,
                          selected: controller.sortBy.value == sort,
                          onTap: () => controller.sortBy.value = sort,
                        ),
                      )
                      .toList(),
                ),
                SizedBox(height: 2.h),
                AppButton(
                  label: 'Xem ${controller.results.length} tour',
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
