# 🌏 VIETTOUR — HỆ THỐNG QUẢN LÝ TOUR DU LỊCH & ĐIỀU HÀNH LỮ HÀNH

> **Khóa luận tốt nghiệp ngành Công nghệ Thông tin (HUIT) — Mã đề tài: CNTT-KLCN192**  
> **Đề tài:** Xây dựng hệ thống quản lý tour du lịch  
> **Kiến trúc công nghệ:**  
> - **Web Platform:** Next.js 16 (App Router), NestJS 11, TypeScript, PostgreSQL 16 (3NF), Prisma ORM 6.  
> - **Mobile Platform:** Flutter 3 (Dart), GetX Architecture, RESTful API Client.  
> - **Tích hợp mở rộng:** Cổng thanh toán VNPAY Sandbox, ZaloPay Sandbox, Mã hóa vé QR Code, Gmail SMTP.

---

## 📌 1. BẢNG PHÂN HỆ VÀ CÔNG NGHỆ

| Thư mục | Công nghệ | Cổng mặc định | Chức năng chính |
|---|---|---|---|
| `database/` | PostgreSQL 16 | `5433` (hoặc `5432`) | CSDL 22 bảng chuẩn 3NF: Trigger, Stored Procedure, Ràng buộc nghiệp vụ |
| `backend/` | NestJS 11 + Prisma ORM | `4000` (`/api`) | RESTful API, Auth JWT, Phân quyền RBAC, VNPAY, ZaloPay, Gmail SMTP |
| `frontend/` | Next.js 16 (App Router) | `3000` | Dashboard quản trị điều hành doanh nghiệp & Cổng du lịch khách hàng |
| `mobile/` | Flutter / Dart (GetX) | — | Ứng dụng di động đa nền tảng cho Khách hàng & Hướng dẫn viên |

---

## 🚀 2. HƯỚNG DẪN KHỞI CHẠY DÀNH CHO THÀNH VIÊN NHÓM

### Bước 1: Khởi tạo Cơ sở dữ liệu (PostgreSQL)
File SQL trọn gói duy nhất đã được tổng hợp tại: `database/QuanLyTourDuLich.sql`.

- **Cách 1: Nhập bằng pgAdmin / DBeaver**
  1. Tạo database mới tên `quanlytourdulich`.
  2. Mở file `database/QuanLyTourDuLich.sql` và nhấn **Execute (F5)**.

- **Cách 2: Nhập bằng lệnh psql (Terminal / PowerShell)**
  ```bash
  psql -U viettour -d quanlytourdulich -f database/QuanLyTourDuLich.sql
  ```
  *(Lưu ý: Thư mục `database/migrations/` lưu trữ lịch sử các giai đoạn phát triển CSDL theo đề cương).*

---

### Bước 2: Khởi chạy Backend (NestJS)
```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```
- Dịch vụ Backend hoạt động tại: `http://localhost:4000/api`
- File cấu hình môi trường mẫu: `.env.example` (sao chép thành `.env`).

---

### Bước 3: Khởi chạy Frontend Web (Next.js)
```bash
cd frontend
npm install
npm run dev
```
- Giao diện Web hoạt động tại: `http://localhost:3000`
- Cổng đặt tour du khách: `http://localhost:3000/portal`
- Cổng quản trị điều hành: `http://localhost:3000/login`

---

### Bước 4: Khởi chạy Ứng dụng Di động (Flutter)
```bash
cd mobile
flutter pub get
flutter run
```
- Ứng dụng tự động cấu hình địa chỉ API phù hợp:
  - Máy ảo Android Emulator: `http://10.0.2.2:4000/api`
  - Thiết bị thật / Web / Desktop: `http://localhost:4000/api`

---

## 🔑 3. DANH SÁCH TÀI KHOẢN MẪU KIỂM THỬ NGHIỆP VỤ

> **Mật khẩu dùng chung cho tất cả tài khoản:** `123456`

| Phân hệ / Vai trò | Email đăng nhập | Mật khẩu | Phạm vi nghiệp vụ |
|:---|:---|:---|:---|
| **Quản trị viên (Admin)** | `admin@viettour.vn` | `123456` | Toàn quyền hệ thống, thống kê doanh thu, giám sát HDV, phân quyền |
| **Điều hành tour (Operations)** | `dieuhanh@viettour.vn` | `123456` | Quản lý tour, lịch khởi hành, phân công HDV, phiếu dịch vụ NCC |
| **Kế toán (Accountant)** | `ketoan@viettour.vn` | `123456` | Quản lý booking, duyệt thanh toán, quyết toán tài chính, bảng lương |
| **Hướng dẫn viên (Guide)** | `hdv.nam@viettour.vn` | `123456` | Lịch dẫn tour, danh sách đoàn, máy quét vé QR Camera, tính công |
| **Khách hàng 1** | `khach.hung@gmail.com` | `123456` | Tìm tour, áp voucher, thanh toán VNPAY, lưu vé QR, đánh giá tour |
| **Khách hàng 2** | `khach.thao@yahoo.com` | `123456` | Tra cứu tour theo vùng miền, quản lý đơn đặt chỗ cá nhân |

---

## 💳 4. HƯỚNG DẪN THANH TOÁN VNPAY SANDBOX

Khi đặt tour và lựa chọn phương thức thanh toán **VNPAY Sandbox**:
1. Chọn hình thức: **"Thẻ nội địa & tài khoản ngân hàng"**.
2. Chọn ngân hàng thử nghiệm: **NCB**.
3. Điền thông tin thẻ kiểm thử chính thức của VNPAY Sandbox:
   - **Số thẻ:** `9704198526191432198`
   - **Tên chủ thẻ:** `NGUYEN VAN A`
   - **Ngày phát hành:** `07/15`
   - **Mã OTP xác thực:** `123456`
4. Sau khi giao dịch thành công, hệ thống tự động cập nhật trạng thái đơn thành **Đã thanh toán** và cấp phát **Vé điện tử kèm Mã QR bảo mật**.

---

## 📂 5. CẤU TRÚC THƯ MỤC CHUẨN DỰ ÁN

```
project/
├── database/
│   ├── QuanLyTourDuLich.sql                    # CSDL hoàn chỉnh 1-click import
│   └── migrations/                             # Lịch sử các giai đoạn phát triển CSDL
├── backend/
│   ├── src/
│   │   ├── modules/                            # Auth, Tours, Departures, Bookings, Guides, Reports, VNPAY...
│   │   ├── prisma/                             # Prisma ORM Schema & Client
│   │   └── main.ts                             # Điểm khởi động NestJS
│   ├── uploads/                                # Thư mục lưu trữ hình ảnh tour thực tế
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/                                # Next.js App Router (Admin + Portal)
│   │   ├── components/                         # UI Components dùng chung
│   │   └── lib/                                # API Client & Helper Functions
│   ├── public/uploads/                         # Thư mục ảnh đồng bộ cho web
│   └── .env.example
└── mobile/
    ├── lib/
    │   ├── core/                               # Constants, Theme, Localization (VI/EN), Network
    │   ├── data/                               # Models, Repositories
    │   ├── modules/                            # Auth, Home, Detail, Booking, Orders, Guide Schedule...
    │   ├── routes/                             # GetX App Pages & Routes
    │   └── main.dart                           # Điểm khởi động Flutter
    └── pubspec.yaml                            # Cấu hình thư viện di động
```
