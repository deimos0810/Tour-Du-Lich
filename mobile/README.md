# Mobile (Flutter / Dart) — làm sau

Thư mục dành cho app mobile, dùng chung REST API của backend NestJS.

## Khởi tạo khi bắt đầu
```bash
# tại thư mục project/mobile (cần cài Flutter SDK trước)
flutter create --org vn.viettour --project-name viettour_mobile .
flutter pub add dio flutter_riverpod go_router intl
```

## Kết nối API
- Base URL: `http://10.0.2.2:4000/api` (Android emulator) hoặc `http://localhost:4000/api` (iOS simulator).
- Nhớ thêm origin/thiết bị vào `CORS_ORIGIN` của backend nếu chạy Flutter Web.

## Gợi ý phạm vi mobile
- **Khách hàng**: xem tour, đặt tour, thanh toán, vé QR (`ChiTietHanhKhach.MaQRVe`), đánh giá.
- **Hướng dẫn viên**: xem lịch được phân công (`DieuPhoiTour`), điểm danh khách bằng QR.
