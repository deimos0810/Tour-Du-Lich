# 🌏 VIETTOUR — HỆ THỐNG QUẢN LÝ TOUR DU LỊCH & CỔNG ĐẶT TOUR TRỰC TUYẾN

> **Khóa luận tốt nghiệp:** Xây dựng Hệ thống Quản trị Doanh nghiệp Lữ hành & Cổng Đặt Tour Trực tuyến VietTour  
> **Kiến trúc công nghệ:** Next.js 16 (App Router), NestJS 11, PostgreSQL 16 (3NF - 22 Bảng), Prisma ORM 6, VNPay Sandbox, Docker Compose.

---

## 📌 1. BẢNG TỔNG QUAN PHÂN HỆ

| Thư mục | Công nghệ | Cổng mặc định | Chức năng chính |
|---|---|---|---|
| `database/` | PostgreSQL 16 | `5433` (`5432`) | CSDL 22 bảng 3NF: Trigger, Stored Procedure, Generated Columns |
| `backend/` | NestJS 11 + Prisma ORM | `4000` (`/api`) | RESTful API, Auth JWT, RBAC, Cổng VNPay Sandbox, Gmail SMTP OTP |
| `frontend/` | Next.js 16 (App Router) | `3000` | Quản trị Dashboard điều hành & Cổng đặt tour du lịch khách hàng |
| `mobile/` | Flutter / Dart | — | Ứng dụng di động dành cho Hướng dẫn viên & Khách du lịch (*phát triển riêng*) |

---

## 🚀 2. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG

### Bước 1: Khởi động Cơ sở dữ liệu (Docker)
Đảm bảo máy đã cài đặt và khởi động Docker Desktop:
```bash
cd project
docker compose up -d
```
*Ghi chú: Docker sẽ tự động nạp toàn bộ cấu trúc bảng và dữ liệu mẫu từ thư mục `database/` (`01_schema.sql` và `02_seed.sql`).*

### Bước 2: Khởi động Backend (NestJS)
```bash
cd project/backend
npm install
npx prisma generate
npm run start:dev
```
*Dịch vụ Backend REST API hoạt động tại: `http://localhost:4000/api`*

### Bước 3: Khởi động Frontend (Next.js)
```bash
cd project/frontend
npm install
npm run dev
```
*Website khách hàng và Quản trị hoạt động tại: `http://localhost:3000`*

---

## 🔑 3. DANH SÁCH TÀI KHOẢN MẪU KIỂM THỬ

> **Mật khẩu dùng chung cho tất cả các tài khoản:** `123456`

| Vai trò (Role) | Email Đăng Nhập | Mật Khẩu | Trang Chuyển Hướng Sau Đăng Nhập |
|:---|:---|:---|:---|
| **Quản trị viên (Admin)** | `admin@viettour.vn` | `123456` | Dashboard tổng quan KPI & Biểu đồ (`/`) |
| **Điều hành (Operations)** | `dieuhanh@viettour.vn` | `123456` | Quản lý thiết kế Tour & Lịch trình (`/tours`) |
| **Kế toán (Accountant)** | `ketoan@viettour.vn` | `123456` | Quản lý Booking & Duyệt thanh toán (`/bookings`) |
| **Hướng dẫn viên (Tour Guide)** | `hdv.nam@viettour.vn` | `123456` | Lịch khởi hành & Danh sách đoàn (`/departures`) |
| **Khách hàng 1** | `khach.hung@gmail.com` | `123456` | Cổng thông tin du lịch VietTour (`/portal`) |
| **Khách hàng 2** | `khach.thao@yahoo.com` | `123456` | Cổng thông tin du lịch VietTour (`/portal`) |

---

## 💳 4. HƯỚNG DẪN THANH TOÁN VNPAY SANDBOX

Khi đặt tour và chọn thanh toán qua **Cổng VNPay Sandbox**:
1. Hệ thống tự động chuyển hướng sang cổng thanh toán thử nghiệm của VNPay.
2. Chọn hình thức: **"Thẻ nội địa & tài khoản ngân hàng"** (Thẻ ATM).
3. Chọn ngân hàng: **NCB**.
4. Nhập thông tin thẻ thử nghiệm chính thức của VNPay:
   - **Số thẻ:** `9704198526191432198`
   - **Tên chủ thẻ:** `NGUYEN VAN A`
   - **Ngày phát hành:** `07/15`
   - **Mã OTP xác thực:** `123456`
5. Sau khi thanh toán thành công, hệ thống tự động xuất **Vé điện tử Boarding Pass kèm Mã QR xác thực**.

---

## 📂 5. KIẾN TRÚC THƯ MỤC DỰ ÁN

```
project/
├── database/
│   ├── 01_schema.sql           # Schema 22 bảng 3NF, ràng buộc toàn vẹn
│   └── 02_seed.sql             # Dữ liệu khởi tạo (Tài khoản, Tour, Lịch, Khuyến mãi)
├── backend/
│   ├── src/
│   │   ├── modules/            # Auth, Tours, Departures, Bookings, Operations, VNPay, Portal
│   │   ├── prisma/             # Schema Prisma kết nối PostgreSQL
│   │   └── app.module.ts
│   ├── .env.example            # Mẫu cấu hình môi trường chuẩn
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (admin)/        # Dashboard, Tours, Departures, Bookings, Settlements...
│   │   │   └── portal/         # Trang chủ du lịch, Chi tiết tour, Đơn của tôi, Vé QR...
│   │   ├── components/         # Header, Footer, AccountLayout, AppShell
│   │   └── services/           # API Client
│   ├── .env.example
│   └── package.json
├── docker-compose.yml          # Container PostgreSQL viettour-db (port 5433)
└── README.md
```
