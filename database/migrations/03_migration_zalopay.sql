-- =============================================================================
-- MIGRATION 03: Bổ sung phương thức thanh toán ZaloPay (theo đề cương CNTT-KLCN192)
-- Đề cương yêu cầu: "Quản lý thanh toán (tiền mặt, ZaloPay, VNPAY)"
-- Chạy: docker exec -i viettour-db psql -U viettour -d quanlytourdulich < database/03_migration_zalopay.sql
-- =============================================================================
ALTER TABLE DonDatTour DROP CONSTRAINT IF EXISTS dondattour_phuongthuctt_check;
ALTER TABLE DonDatTour ADD CONSTRAINT dondattour_phuongthuctt_check
    CHECK (PhuongThucTT IN ('VNPay','ZaloPay','Chuyen khoan','Tien mat','MoMo'));

ALTER TABLE ThanhToan DROP CONSTRAINT IF EXISTS thanhtoan_hinhthuctt_check;
ALTER TABLE ThanhToan ADD CONSTRAINT thanhtoan_hinhthuctt_check
    CHECK (HinhThucTT IN ('VNPay','ZaloPay','Chuyen khoan','Tien mat','MoMo'));

-- Bổ sung cột Dịch vụ đi kèm cho Tour (đề cương: 'Quản lý thông tin tour... lịch trình và dịch vụ đi kèm')
ALTER TABLE Tour ADD COLUMN IF NOT EXISTS DichVuDiKem TEXT NULL;
COMMENT ON COLUMN Tour.DichVuDiKem IS 'Danh sách dịch vụ bao gồm trong giá tour, mỗi dòng 1 dịch vụ';
