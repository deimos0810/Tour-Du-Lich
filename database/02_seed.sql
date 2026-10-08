-- =============================================================================
-- SEED DATA MẪU CHO DỰ ÁN QUẢN LÝ TOUR DU LỊCH (22 BẢNG)
-- =============================================================================

-- 1. TaiKhoan
INSERT INTO TaiKhoan (Email, MatKhauHash, SoDienThoai, TrangThai) VALUES
('admin@viettour.vn', '123456', '0901000001', 1),
('dieuhanh@viettour.vn', '123456', '0901000002', 1),
('ketoan@viettour.vn', '123456', '0901000003', 1),
('hdv.nam@viettour.vn', '123456', '0903112233', 1),
('khach.hung@gmail.com', '123456', '0908123456', 1),
('khach.thao@yahoo.com', '123456', '0912987654', 1)
ON CONFLICT DO NOTHING;

-- 3. PhanQuyen
INSERT INTO PhanQuyen (TaiKhoanID, VaiTroID) VALUES
(1, 1), -- Admin
(2, 2), -- Dieu hanh
(3, 3), -- Ke toan
(4, 4), -- HDV
(5, 5), -- Khach hang
(6, 5)
ON CONFLICT DO NOTHING;

-- 4. KhachHang
INSERT INTO KhachHang (TaiKhoanID, HoTen, SoDienThoai, Email, CCCD, NgaySinh, GioiTinh) VALUES
(5, 'Nguyễn Văn Hùng', '0908123456', 'khach.hung@gmail.com', '031092008761', '1992-05-15', 'Nam'),
(6, 'Trần Thị Thu Thảo', '0912987654', 'khach.thao@yahoo.com', '079188004321', '1988-11-20', 'Nu')
ON CONFLICT DO NOTHING;

-- 5. NhanVien
INSERT INTO NhanVien (TaiKhoanID, HoTen, SoDienThoai, Email, ChucVu, NgayVaoLam) VALUES
(1, 'Admin', '0901000001', 'admin@viettour.vn', 'Quản trị viên', '2023-01-01'),
(2, 'Phạm Thu Hà', '0901000002', 'dieuhanh@viettour.vn', 'Trưởng phòng Điều hành', '2023-03-15'),
(3, 'Trần Minh Đức', '0901000003', 'ketoan@viettour.vn', 'Kế toán trưởng', '2023-05-10'),
(4, 'Lê Hoàng Nam', '0903112233', 'hdv.nam@viettour.vn', 'Hướng dẫn viên', '2023-06-01')
ON CONFLICT DO NOTHING;

-- 6. HuongDanVien
INSERT INTO HuongDanVien (NhanVienID, SoTheHDV, NgonNgu, KinhNghiem, TrangThai) VALUES
(4, 'HDV-QUOCTE-8891', 'Anh, Trung', '5 năm kinh nghiệm dẫn đoàn Châu Á', 'San sang')
ON CONFLICT DO NOTHING;

-- 8. Tour
INSERT INTO Tour (DanhMucID, NhanVienTaoID, MaTour, TenTour, ThoiGian, DiemKhoiHanh, DiemDen, MoTaChiTiet, LichTrinh, GiaNguoiLon, GiaTreEm, HinhAnhURL, TrangThaiDuyet) VALUES
(1, 2, 'TOUR-DN-01', 'Đà Nẵng - Hội An - Bà Nà Hills', '4 Ngày 3 Đêm', 'TP.HCM', 'Đà Nẵng', 'Hành trình di sản miền Trung hấp dẫn.', 'Ngày 1: Sơn Trà. Ngày 2: Bà Nà. Ngày 3: Hội An. Ngày 4: Tiễn sân bay.', 5890000, 3200000, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=500', 'Dang mo ban'),
(1, 2, 'TOUR-SP-02', 'Sapa - Đỉnh Fansipan - Bản Cát Cát', '3 Ngày 2 Đêm', 'Hà Nội', 'Lào Cai', 'Chinh phục nóc nhà Đông Dương.', 'Ngày 1: Hà Nội - Sapa. Ngày 2: Fansipan. Ngày 3: Chợ Sapa.', 4250000, 2100000, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=500', 'Dang mo ban'),
(2, 2, 'TOUR-TYO-01', 'Nhật Bản: Tokyo - Fuji - Kyoto - Osaka', '6 Ngày 5 Đêm', 'TP.HCM', 'Tokyo', 'Tour Nhật Bản ngắm hoa anh đào.', 'Ngày 1: Bay Tokyo. Ngày 2: Núi Phú Sĩ. Ngày 3: Kyoto. Ngày 4-6: Osaka.', 32900000, 24500000, 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500', 'Dang mo ban'),
(1, 2, 'TOUR-HL-03', 'Vịnh Hạ Long - Du Thuyền 5 Sao Heritage - Hang Sửng Sốt', '3 Ngày 2 Đêm', 'Hà Nội', 'Quảng Ninh', 'Nghỉ dưỡng thượng lưu trên du thuyền 5 sao vịnh Hạ Long, chèo kayak khám phá Hang Sửng Sốt.', 'Ngày 1: Hà Nội - Cảng Tuần Châu - Vịnh Hạ Long. Ngày 2: Hang Sửng Sốt - Sunset Party. Ngày 3: Trở về Hà Nội.', 4890000, 2500000, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500', 'Dang mo ban'),
(1, 2, 'TOUR-PQ-04', 'Phú Quốc Đảo Ngọc - Grand World - Cáp Treo Hòn Thơm', '4 Ngày 3 Đêm', 'TP.HCM', 'Phú Quốc', 'Khám phá thiên đường đảo ngọc Phú Quốc, trải nghiệm Grand World và cáp treo Hòn Thơm vượt biển.', 'Ngày 1: Bay Phú Quốc - Sunset Sanato. Ngày 2: Tour 4 đảo - Cáp treo Hòn Thơm. Ngày 3: Grand World. Ngày 4: Tiễn sân bay.', 6290000, 3400000, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500', 'Dang mo ban')
ON CONFLICT DO NOTHING;

-- 9. LichKhoiHanh
INSERT INTO LichKhoiHanh (TourID, MaLich, NgayKhoiHanh, NgayKetThuc, SoChoToiDa, SoChoDaDat, TrangThai) VALUES
(1, 'CH-2026-1015', '2026-10-15 07:00:00', '2026-10-18 18:00:00', 30, 2, 'Cho khoi hanh'),
(2, 'CH-2026-1020', '2026-10-20 06:00:00', '2026-10-22 17:00:00', 25, 1, 'Cho khoi hanh'),
(3, 'CH-2026-1101', '2026-11-01 01:00:00', '2026-11-06 22:00:00', 20, 1, 'Cho khoi hanh'),
(4, 'CH-2026-1025', '2026-10-25 07:00:00', '2026-10-27 17:00:00', 25, 2, 'Cho khoi hanh'),
(5, 'CH-2026-1105', '2026-11-05 06:00:00', '2026-11-08 18:00:00', 28, 4, 'Cho khoi hanh')
ON CONFLICT DO NOTHING;

-- 12. DonDatTour
INSERT INTO DonDatTour (KhachHangID, LichID, NhanVienXuLyID, MaDon, SoLuongNguoiLon, SoLuongTreEm, TongTien, TienCoc, TienConLai, TrangThaiDon, PhuongThucTT) VALUES
(1, 1, 2, 'BK-9821', 2, 0, 11780000, 5000000, 6780000, 'Da dat coc', 'Chuyen khoan'),
(2, 3, 2, 'BK-9822', 1, 0, 32900000, 32900000, 0, 'Da thanh toan', 'VNPay')
ON CONFLICT DO NOTHING;

-- 16. NhaCungCap
INSERT INTO NhaCungCap (TenNCC, LoaiNCC, NguoiLienHe, SoDienThoai, Email, DiaChi, DanhGia) VALUES
('Khách sạn Novotel Đà Nẵng', 'Khach san', 'Nguyễn Thị Hương', '02363929999', 'novotel@danang.com', 'Đà Nẵng', 4.9),
('Công ty Xe Du Lịch Việt Thanh', 'Xe van chuyen', 'Trần Văn Bình', '0905888999', 'vietthanh@transport.vn', 'Hà Nội', 4.7)
ON CONFLICT DO NOTHING;

-- 18. KhuyenMai
INSERT INTO KhuyenMai (MaKhuyenMai, TenChuongTrinh, PhanTramGiam, GiamToiDa, GiaTriDonToiThieu, NgayBatDau, NgayKetThucKM, TrangThai) VALUES
('VIETTOUR2026', 'Ưu đãi Khách hàng Thân thiết VietTour 2026', 10, 1000000, 3000000, '2026-01-01', '2026-12-31', 1),
('BAYHE2026', 'Khuyến mãi Tour Máy bay Hè Rực Rỡ', 15, 1500000, 5000000, '2026-05-01', '2026-12-31', 1),
('TRIAN500K', 'Voucher Tri ân Khách hàng Mới', 5, 500000, 2000000, '2026-01-01', '2026-12-31', 1)
ON CONFLICT DO NOTHING;

-- 20. DanhGiaTour
INSERT INTO DanhGiaTour (KhachHangID, TourID, DonHangID, SoSao, BinhLuan, NgayDanhGia, TrangThaiDuyet) VALUES
(1, 1, 1, 5, 'Chuyến đi Đà Nẵng tuyệt vời! Hướng dẫn viên rất nhiệt tình, dịch vụ 5 sao.', '2026-10-01 10:00:00', 'Da hien thi'),
(2, 1, 1, 5, 'Dịch vụ chu đáo, ăn uống ngon miệng. Sẽ tiếp tục đặt tour tại VietTour!', '2026-10-02 11:30:00', 'Da hien thi'),
(1, 2, 1, 5, 'Đỉnh Fansipan đẹp xuất sắc, thời tiết mây mù rất thơ mộng. Hướng dẫn viên chu đáo!', '2026-10-03 14:00:00', 'Da hien thi'),
(2, 3, 2, 5, 'Tour Nhật Bản ngắm hoa anh đào rất chuyên nghiệp, khách sạn đẹp và ăn uống chuẩn vị.', '2026-10-04 16:45:00', 'Da hien thi')
ON CONFLICT DO NOTHING;
