# Tài Liệu Lịch Sử Nâng Cấp Cơ Sở Dữ Liệu (Database Migrations)

## 1. Tệp SQL Chính (Sử Dụng Trực Tiếp)
> **Lưu ý quan trọng cho thành viên nhóm và hội đồng chấm:**
> Toàn bộ cấu trúc bảng, ràng buộc toàn vẹn 3NF, trigger tự động, dữ liệu mẫu chuẩn (11 tour du lịch, hành trình từng ngày kèm ảnh thực tế, 5 hướng dẫn viên, phân công điều hành, đơn đặt chỗ, vé điện tử và quyết toán tài chính) đã được **thống nhất đầy đủ vào 1 file duy nhất**:
> 
> 👉 `project/database/QuanLyTourDuLich.sql`
> 
> Khi cài đặt môi trường mới hoặc chạy đồ án, **chỉ cần import duy nhất file `QuanLyTourDuLich.sql` vào PostgreSQL**.

---

## 2. Lý Do Tồn Tại Thư Mục `migrations/`
Thư mục `migrations/` này được lưu trữ phục vụ việc **chứng minh quá trình phát triển phần mềm theo các giai đoạn (Iterative Software Development Lifecycle)** trong báo cáo khóa luận:

1. `01_schema.sql`: Cấu trúc bảng sơ khởi ban đầu (Users, Roles, Tours, Bookings).
2. `02_seed.sql`: Dữ liệu kiểm thử giai đoạn phân tích đặc tả yêu cầu ban đầu.
3. `03_migration_zalopay.sql`: Giai đoạn tích hợp cổng thanh toán trực tuyến ZaloPay & mã giao dịch tài chính.
4. `04_migration_promotion_newsletter_finance.sql`: Giai đoạn nâng cấp nghiệp vụ doanh nghiệp lữ hành chuyên sâu theo đề cương CNTT-KLCN192:
   - Hệ thống mã giảm giá & voucher khuyến mãi (`Promotions`, `TourVouchers`).
   - Đăng ký nhận tin tức & chính sách hủy hoàn tự động (`Newsletters`, `TourCancellations`).
   - Quản lý nhà cung cấp đối tác (`Suppliers`, `PurchaseOrders`).
   - Quyết toán chi phí, doanh thu và tạm ứng chi phí tour (`TourSettlements`).
   - Lịch trình chi tiết từng ngày có hình ảnh và lịch công tác hướng dẫn viên (`TourItineraries`, `GuideDispatches`).

