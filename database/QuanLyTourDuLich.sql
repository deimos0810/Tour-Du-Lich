--
-- PostgreSQL database dump
--

\restrict tdrL3aTXSEppGMxXmRGJF5dlNZkzKPc8yu4OCnCfyh7NMmqbeLahdpWv0gL66dV

-- Dumped from database version 16.15
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.tour DROP CONSTRAINT IF EXISTS tour_nhanvientaoid_fkey;
ALTER TABLE IF EXISTS ONLY public.tour DROP CONSTRAINT IF EXISTS tour_danhmucid_fkey;
ALTER TABLE IF EXISTS ONLY public.thanhtoan DROP CONSTRAINT IF EXISTS thanhtoan_nhanvienid_fkey;
ALTER TABLE IF EXISTS ONLY public.thanhtoan DROP CONSTRAINT IF EXISTS thanhtoan_donhangid_fkey;
ALTER TABLE IF EXISTS ONLY public.phieudatdichvu DROP CONSTRAINT IF EXISTS phieudatdichvu_nhanvienid_fkey;
ALTER TABLE IF EXISTS ONLY public.phieudatdichvu DROP CONSTRAINT IF EXISTS phieudatdichvu_nhacungcapid_fkey;
ALTER TABLE IF EXISTS ONLY public.phieudatdichvu DROP CONSTRAINT IF EXISTS phieudatdichvu_lichid_fkey;
ALTER TABLE IF EXISTS ONLY public.phanquyen DROP CONSTRAINT IF EXISTS phanquyen_vaitroid_fkey;
ALTER TABLE IF EXISTS ONLY public.phanquyen DROP CONSTRAINT IF EXISTS phanquyen_taikhoanid_fkey;
ALTER TABLE IF EXISTS ONLY public.nhanvien DROP CONSTRAINT IF EXISTS nhanvien_taikhoanid_fkey;
ALTER TABLE IF EXISTS ONLY public.lichkhoihanh DROP CONSTRAINT IF EXISTS lichkhoihanh_tourid_fkey;
ALTER TABLE IF EXISTS ONLY public.khachhang DROP CONSTRAINT IF EXISTS khachhang_taikhoanid_fkey;
ALTER TABLE IF EXISTS ONLY public.huongdanvien DROP CONSTRAINT IF EXISTS huongdanvien_nhanvienid_fkey;
ALTER TABLE IF EXISTS ONLY public.hoadon DROP CONSTRAINT IF EXISTS hoadon_thanhtoanid_fkey;
ALTER TABLE IF EXISTS ONLY public.hoadon DROP CONSTRAINT IF EXISTS hoadon_donhangid_fkey;
ALTER TABLE IF EXISTS ONLY public.dondattour DROP CONSTRAINT IF EXISTS dondattour_nhanvienxulyid_fkey;
ALTER TABLE IF EXISTS ONLY public.dondattour DROP CONSTRAINT IF EXISTS dondattour_lichid_fkey;
ALTER TABLE IF EXISTS ONLY public.dondattour DROP CONSTRAINT IF EXISTS dondattour_khuyenmaiid_fkey;
ALTER TABLE IF EXISTS ONLY public.dondattour DROP CONSTRAINT IF EXISTS dondattour_khachhangid_fkey;
ALTER TABLE IF EXISTS ONLY public.dondattour DROP CONSTRAINT IF EXISTS dondattour_ctkmid_fkey;
ALTER TABLE IF EXISTS ONLY public.dieuphoitour DROP CONSTRAINT IF EXISTS dieuphoitour_nhanvienid_fkey;
ALTER TABLE IF EXISTS ONLY public.dieuphoitour DROP CONSTRAINT IF EXISTS dieuphoitour_lichid_fkey;
ALTER TABLE IF EXISTS ONLY public.dieuphoitour DROP CONSTRAINT IF EXISTS dieuphoitour_hdvid_fkey;
ALTER TABLE IF EXISTS ONLY public.dichvunhacungcap DROP CONSTRAINT IF EXISTS dichvunhacungcap_nhacungcapid_fkey;
ALTER TABLE IF EXISTS ONLY public.danhgia DROP CONSTRAINT IF EXISTS danhgia_tourid_fkey;
ALTER TABLE IF EXISTS ONLY public.danhgia DROP CONSTRAINT IF EXISTS danhgia_khachhangid_fkey;
ALTER TABLE IF EXISTS ONLY public.danhgia DROP CONSTRAINT IF EXISTS danhgia_donhangid_fkey;
ALTER TABLE IF EXISTS ONLY public.chuongtrinhkhuyenmai DROP CONSTRAINT IF EXISTS chuongtrinhkhuyenmai_nhanvientaoid_fkey;
ALTER TABLE IF EXISTS ONLY public.chitiethanhkhach DROP CONSTRAINT IF EXISTS chitiethanhkhach_donhangid_fkey;
ALTER TABLE IF EXISTS ONLY public.chitietdatdichvu DROP CONSTRAINT IF EXISTS chitietdatdichvu_phieudatid_fkey;
ALTER TABLE IF EXISTS ONLY public.chitietdatdichvu DROP CONSTRAINT IF EXISTS chitietdatdichvu_dichvunccid_fkey;
ALTER TABLE IF EXISTS ONLY public.chiphiphatsinh DROP CONSTRAINT IF EXISTS chiphiphatsinh_nhanvienid_fkey;
ALTER TABLE IF EXISTS ONLY public.chiphiphatsinh DROP CONSTRAINT IF EXISTS chiphiphatsinh_lichid_fkey;
ALTER TABLE IF EXISTS ONLY public.baocaoquyettoan DROP CONSTRAINT IF EXISTS baocaoquyettoan_nhanvienlapid_fkey;
ALTER TABLE IF EXISTS ONLY public.baocaoquyettoan DROP CONSTRAINT IF EXISTS baocaoquyettoan_nhanvienduyetid_fkey;
ALTER TABLE IF EXISTS ONLY public.baocaoquyettoan DROP CONSTRAINT IF EXISTS baocaoquyettoan_lichid_fkey;
ALTER TABLE IF EXISTS ONLY public.apdungvoucher DROP CONSTRAINT IF EXISTS apdungkhuyenmai_tourid_fkey;
ALTER TABLE IF EXISTS ONLY public.apdungvoucher DROP CONSTRAINT IF EXISTS apdungkhuyenmai_khuyenmaiid_fkey;
ALTER TABLE IF EXISTS ONLY public.apdungctkm DROP CONSTRAINT IF EXISTS apdungctkm_tourid_fkey;
ALTER TABLE IF EXISTS ONLY public.apdungctkm DROP CONSTRAINT IF EXISTS apdungctkm_ctkmid_fkey;
DROP INDEX IF EXISTS public.idx_tour_trangthai;
DROP INDEX IF EXISTS public.idx_tour_danhmuc;
DROP INDEX IF EXISTS public.idx_thanhtoan_don;
DROP INDEX IF EXISTS public.idx_taikhoan_email;
DROP INDEX IF EXISTS public.idx_phieu_ncc;
DROP INDEX IF EXISTS public.idx_phieu_lich;
DROP INDEX IF EXISTS public.idx_nhatkymail_ngay;
DROP INDEX IF EXISTS public.idx_nhatkymail_dedupe;
DROP INDEX IF EXISTS public.idx_lich_tourid;
DROP INDEX IF EXISTS public.idx_lich_ngaykhoihanh;
DROP INDEX IF EXISTS public.idx_don_trangthai;
DROP INDEX IF EXISTS public.idx_don_lich;
DROP INDEX IF EXISTS public.idx_don_khachhang;
DROP INDEX IF EXISTS public.idx_dieupho_lich;
DROP INDEX IF EXISTS public.idx_dieupho_hdv;
DROP INDEX IF EXISTS public.idx_danhgia_tour;
DROP INDEX IF EXISTS public.idx_ctkm_thoigian;
DROP INDEX IF EXISTS public.idx_chitiethk_don;
DROP INDEX IF EXISTS public.idx_chiphi_lich;
ALTER TABLE IF EXISTS ONLY public.vaitro DROP CONSTRAINT IF EXISTS vaitro_tenvaitro_key;
ALTER TABLE IF EXISTS ONLY public.vaitro DROP CONSTRAINT IF EXISTS vaitro_pkey;
ALTER TABLE IF EXISTS ONLY public.tour DROP CONSTRAINT IF EXISTS tour_pkey;
ALTER TABLE IF EXISTS ONLY public.tour DROP CONSTRAINT IF EXISTS tour_matour_key;
ALTER TABLE IF EXISTS ONLY public.thanhtoan DROP CONSTRAINT IF EXISTS thanhtoan_pkey;
ALTER TABLE IF EXISTS ONLY public.thanhtoan DROP CONSTRAINT IF EXISTS thanhtoan_magiaodich_key;
ALTER TABLE IF EXISTS ONLY public.taikhoan DROP CONSTRAINT IF EXISTS taikhoan_sodienthoai_key;
ALTER TABLE IF EXISTS ONLY public.taikhoan DROP CONSTRAINT IF EXISTS taikhoan_pkey;
ALTER TABLE IF EXISTS ONLY public.taikhoan DROP CONSTRAINT IF EXISTS taikhoan_email_key;
ALTER TABLE IF EXISTS ONLY public.phieudatdichvu DROP CONSTRAINT IF EXISTS phieudatdichvu_pkey;
ALTER TABLE IF EXISTS ONLY public.phieudatdichvu DROP CONSTRAINT IF EXISTS phieudatdichvu_maphieu_key;
ALTER TABLE IF EXISTS ONLY public.phanquyen DROP CONSTRAINT IF EXISTS phanquyen_pkey;
ALTER TABLE IF EXISTS ONLY public.nhatkyguimail DROP CONSTRAINT IF EXISTS nhatkyguimail_pkey;
ALTER TABLE IF EXISTS ONLY public.nhanvien DROP CONSTRAINT IF EXISTS nhanvien_taikhoanid_key;
ALTER TABLE IF EXISTS ONLY public.nhanvien DROP CONSTRAINT IF EXISTS nhanvien_pkey;
ALTER TABLE IF EXISTS ONLY public.nhacungcap DROP CONSTRAINT IF EXISTS nhacungcap_pkey;
ALTER TABLE IF EXISTS ONLY public.lichkhoihanh DROP CONSTRAINT IF EXISTS lichkhoihanh_pkey;
ALTER TABLE IF EXISTS ONLY public.lichkhoihanh DROP CONSTRAINT IF EXISTS lichkhoihanh_malich_key;
ALTER TABLE IF EXISTS ONLY public.voucher DROP CONSTRAINT IF EXISTS khuyenmai_pkey;
ALTER TABLE IF EXISTS ONLY public.voucher DROP CONSTRAINT IF EXISTS khuyenmai_makhuyenmai_key;
ALTER TABLE IF EXISTS ONLY public.khachhang DROP CONSTRAINT IF EXISTS khachhang_taikhoanid_key;
ALTER TABLE IF EXISTS ONLY public.khachhang DROP CONSTRAINT IF EXISTS khachhang_pkey;
ALTER TABLE IF EXISTS ONLY public.huongdanvien DROP CONSTRAINT IF EXISTS huongdanvien_sothehdv_key;
ALTER TABLE IF EXISTS ONLY public.huongdanvien DROP CONSTRAINT IF EXISTS huongdanvien_pkey;
ALTER TABLE IF EXISTS ONLY public.huongdanvien DROP CONSTRAINT IF EXISTS huongdanvien_nhanvienid_key;
ALTER TABLE IF EXISTS ONLY public.hoadon DROP CONSTRAINT IF EXISTS hoadon_sohoadon_key;
ALTER TABLE IF EXISTS ONLY public.hoadon DROP CONSTRAINT IF EXISTS hoadon_pkey;
ALTER TABLE IF EXISTS ONLY public.dondattour DROP CONSTRAINT IF EXISTS dondattour_pkey;
ALTER TABLE IF EXISTS ONLY public.dondattour DROP CONSTRAINT IF EXISTS dondattour_madon_key;
ALTER TABLE IF EXISTS ONLY public.dieuphoitour DROP CONSTRAINT IF EXISTS dieuphoitour_pkey;
ALTER TABLE IF EXISTS ONLY public.dieuphoitour DROP CONSTRAINT IF EXISTS dieuphoitour_lichid_hdvid_key;
ALTER TABLE IF EXISTS ONLY public.dichvunhacungcap DROP CONSTRAINT IF EXISTS dichvunhacungcap_pkey;
ALTER TABLE IF EXISTS ONLY public.danhmuctour DROP CONSTRAINT IF EXISTS danhmuctour_tendanhmuc_key;
ALTER TABLE IF EXISTS ONLY public.danhmuctour DROP CONSTRAINT IF EXISTS danhmuctour_pkey;
ALTER TABLE IF EXISTS ONLY public.danhgia DROP CONSTRAINT IF EXISTS danhgia_pkey;
ALTER TABLE IF EXISTS ONLY public.danhgia DROP CONSTRAINT IF EXISTS danhgia_khachhangid_donhangid_key;
ALTER TABLE IF EXISTS ONLY public.dangkynhantin DROP CONSTRAINT IF EXISTS dangkynhantin_token_key;
ALTER TABLE IF EXISTS ONLY public.dangkynhantin DROP CONSTRAINT IF EXISTS dangkynhantin_pkey;
ALTER TABLE IF EXISTS ONLY public.dangkynhantin DROP CONSTRAINT IF EXISTS dangkynhantin_email_key;
ALTER TABLE IF EXISTS ONLY public.chuongtrinhkhuyenmai DROP CONSTRAINT IF EXISTS chuongtrinhkhuyenmai_pkey;
ALTER TABLE IF EXISTS ONLY public.chitiethanhkhach DROP CONSTRAINT IF EXISTS chitiethanhkhach_pkey;
ALTER TABLE IF EXISTS ONLY public.chitiethanhkhach DROP CONSTRAINT IF EXISTS chitiethanhkhach_maqrve_key;
ALTER TABLE IF EXISTS ONLY public.chitietdatdichvu DROP CONSTRAINT IF EXISTS chitietdatdichvu_pkey;
ALTER TABLE IF EXISTS ONLY public.chiphiphatsinh DROP CONSTRAINT IF EXISTS chiphiphatsinh_pkey;
ALTER TABLE IF EXISTS ONLY public.baocaoquyettoan DROP CONSTRAINT IF EXISTS baocaoquyettoan_pkey;
ALTER TABLE IF EXISTS ONLY public.baocaoquyettoan DROP CONSTRAINT IF EXISTS baocaoquyettoan_lichid_key;
ALTER TABLE IF EXISTS ONLY public.apdungvoucher DROP CONSTRAINT IF EXISTS apdungkhuyenmai_pkey;
ALTER TABLE IF EXISTS ONLY public.apdungvoucher DROP CONSTRAINT IF EXISTS apdungkhuyenmai_khuyenmaiid_tourid_key;
ALTER TABLE IF EXISTS ONLY public.apdungctkm DROP CONSTRAINT IF EXISTS apdungctkm_pkey;
ALTER TABLE IF EXISTS ONLY public.apdungctkm DROP CONSTRAINT IF EXISTS apdungctkm_ctkmid_tourid_key;
ALTER TABLE IF EXISTS public.voucher ALTER COLUMN voucherid DROP DEFAULT;
ALTER TABLE IF EXISTS public.vaitro ALTER COLUMN vaitroid DROP DEFAULT;
ALTER TABLE IF EXISTS public.tour ALTER COLUMN tourid DROP DEFAULT;
ALTER TABLE IF EXISTS public.thanhtoan ALTER COLUMN thanhtoanid DROP DEFAULT;
ALTER TABLE IF EXISTS public.taikhoan ALTER COLUMN taikhoanid DROP DEFAULT;
ALTER TABLE IF EXISTS public.phieudatdichvu ALTER COLUMN phieudatid DROP DEFAULT;
ALTER TABLE IF EXISTS public.nhatkyguimail ALTER COLUMN nhatkyid DROP DEFAULT;
ALTER TABLE IF EXISTS public.nhanvien ALTER COLUMN nhanvienid DROP DEFAULT;
ALTER TABLE IF EXISTS public.nhacungcap ALTER COLUMN nhacungcapid DROP DEFAULT;
ALTER TABLE IF EXISTS public.lichkhoihanh ALTER COLUMN lichid DROP DEFAULT;
ALTER TABLE IF EXISTS public.khachhang ALTER COLUMN khachhangid DROP DEFAULT;
ALTER TABLE IF EXISTS public.huongdanvien ALTER COLUMN hdvid DROP DEFAULT;
ALTER TABLE IF EXISTS public.hoadon ALTER COLUMN hoadonid DROP DEFAULT;
ALTER TABLE IF EXISTS public.dondattour ALTER COLUMN donhangid DROP DEFAULT;
ALTER TABLE IF EXISTS public.dieuphoitour ALTER COLUMN dieuphoiid DROP DEFAULT;
ALTER TABLE IF EXISTS public.dichvunhacungcap ALTER COLUMN dichvunccid DROP DEFAULT;
ALTER TABLE IF EXISTS public.danhmuctour ALTER COLUMN danhmucid DROP DEFAULT;
ALTER TABLE IF EXISTS public.danhgia ALTER COLUMN danhgiaid DROP DEFAULT;
ALTER TABLE IF EXISTS public.dangkynhantin ALTER COLUMN dangkyid DROP DEFAULT;
ALTER TABLE IF EXISTS public.chuongtrinhkhuyenmai ALTER COLUMN ctkmid DROP DEFAULT;
ALTER TABLE IF EXISTS public.chitiethanhkhach ALTER COLUMN chitietid DROP DEFAULT;
ALTER TABLE IF EXISTS public.chitietdatdichvu ALTER COLUMN chitietphieuid DROP DEFAULT;
ALTER TABLE IF EXISTS public.chiphiphatsinh ALTER COLUMN chiphiid DROP DEFAULT;
ALTER TABLE IF EXISTS public.baocaoquyettoan ALTER COLUMN quyettoanid DROP DEFAULT;
ALTER TABLE IF EXISTS public.apdungvoucher ALTER COLUMN apdungvoucherid DROP DEFAULT;
ALTER TABLE IF EXISTS public.apdungctkm ALTER COLUMN apdungctkmid DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.vaitro_vaitroid_seq;
DROP TABLE IF EXISTS public.vaitro;
DROP SEQUENCE IF EXISTS public.tour_tourid_seq;
DROP TABLE IF EXISTS public.tour;
DROP SEQUENCE IF EXISTS public.thanhtoan_thanhtoanid_seq;
DROP TABLE IF EXISTS public.thanhtoan;
DROP SEQUENCE IF EXISTS public.taikhoan_taikhoanid_seq;
DROP TABLE IF EXISTS public.taikhoan;
DROP SEQUENCE IF EXISTS public.phieudatdichvu_phieudatid_seq;
DROP TABLE IF EXISTS public.phieudatdichvu;
DROP TABLE IF EXISTS public.phanquyen;
DROP SEQUENCE IF EXISTS public.nhatkyguimail_nhatkyid_seq;
DROP TABLE IF EXISTS public.nhatkyguimail;
DROP SEQUENCE IF EXISTS public.nhanvien_nhanvienid_seq;
DROP TABLE IF EXISTS public.nhanvien;
DROP SEQUENCE IF EXISTS public.nhacungcap_nhacungcapid_seq;
DROP TABLE IF EXISTS public.nhacungcap;
DROP SEQUENCE IF EXISTS public.lichkhoihanh_lichid_seq;
DROP TABLE IF EXISTS public.lichkhoihanh;
DROP SEQUENCE IF EXISTS public.khuyenmai_khuyenmaiid_seq;
DROP TABLE IF EXISTS public.voucher;
DROP SEQUENCE IF EXISTS public.khachhang_khachhangid_seq;
DROP TABLE IF EXISTS public.khachhang;
DROP SEQUENCE IF EXISTS public.huongdanvien_hdvid_seq;
DROP TABLE IF EXISTS public.huongdanvien;
DROP SEQUENCE IF EXISTS public.hoadon_hoadonid_seq;
DROP TABLE IF EXISTS public.hoadon;
DROP SEQUENCE IF EXISTS public.dondattour_donhangid_seq;
DROP TABLE IF EXISTS public.dondattour;
DROP SEQUENCE IF EXISTS public.dieuphoitour_dieuphoiid_seq;
DROP TABLE IF EXISTS public.dieuphoitour;
DROP SEQUENCE IF EXISTS public.dichvunhacungcap_dichvunccid_seq;
DROP TABLE IF EXISTS public.dichvunhacungcap;
DROP SEQUENCE IF EXISTS public.danhmuctour_danhmucid_seq;
DROP TABLE IF EXISTS public.danhmuctour;
DROP SEQUENCE IF EXISTS public.danhgia_danhgiaid_seq;
DROP TABLE IF EXISTS public.danhgia;
DROP SEQUENCE IF EXISTS public.dangkynhantin_dangkyid_seq;
DROP TABLE IF EXISTS public.dangkynhantin;
DROP SEQUENCE IF EXISTS public.chuongtrinhkhuyenmai_ctkmid_seq;
DROP TABLE IF EXISTS public.chuongtrinhkhuyenmai;
DROP SEQUENCE IF EXISTS public.chitiethanhkhach_chitietid_seq;
DROP TABLE IF EXISTS public.chitiethanhkhach;
DROP SEQUENCE IF EXISTS public.chitietdatdichvu_chitietphieuid_seq;
DROP TABLE IF EXISTS public.chitietdatdichvu;
DROP SEQUENCE IF EXISTS public.chiphiphatsinh_chiphiid_seq;
DROP TABLE IF EXISTS public.chiphiphatsinh;
DROP SEQUENCE IF EXISTS public.baocaoquyettoan_quyettoanid_seq;
DROP TABLE IF EXISTS public.baocaoquyettoan;
DROP SEQUENCE IF EXISTS public.apdungkhuyenmai_apdungkmid_seq;
DROP TABLE IF EXISTS public.apdungvoucher;
DROP SEQUENCE IF EXISTS public.apdungctkm_apdungctkmid_seq;
DROP TABLE IF EXISTS public.apdungctkm;
DROP FUNCTION IF EXISTS public.fn_kiemtrahieulucvoucher(p_voucherid integer);
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: fn_kiemtrahieulucvoucher(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_kiemtrahieulucvoucher(p_voucherid integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_ngaybatdau DATE; v_ngayketthuc DATE; v_trangthai SMALLINT;
BEGIN
    SELECT ngaybatdau, ngayketthuc, trangthai INTO v_ngaybatdau, v_ngayketthuc, v_trangthai
    FROM voucher WHERE voucherid = p_VoucherID;
    IF NOT FOUND THEN RETURN FALSE; END IF;
    RETURN v_trangthai = 1 AND CURRENT_DATE BETWEEN v_ngaybatdau AND v_ngayketthuc;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: apdungctkm; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apdungctkm (
    apdungctkmid integer NOT NULL,
    ctkmid integer NOT NULL,
    tourid integer NOT NULL
);


--
-- Name: apdungctkm_apdungctkmid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.apdungctkm_apdungctkmid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: apdungctkm_apdungctkmid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.apdungctkm_apdungctkmid_seq OWNED BY public.apdungctkm.apdungctkmid;


--
-- Name: apdungvoucher; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apdungvoucher (
    apdungvoucherid integer NOT NULL,
    voucherid integer NOT NULL,
    tourid integer NOT NULL,
    ngayapdung date DEFAULT CURRENT_DATE NOT NULL
);


--
-- Name: TABLE apdungvoucher; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.apdungvoucher IS 'Bảng liên kết: khuyến mãi nào áp dụng cho tour nào';


--
-- Name: apdungkhuyenmai_apdungkmid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.apdungkhuyenmai_apdungkmid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: apdungkhuyenmai_apdungkmid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.apdungkhuyenmai_apdungkmid_seq OWNED BY public.apdungvoucher.apdungvoucherid;


--
-- Name: baocaoquyettoan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.baocaoquyettoan (
    quyettoanid integer NOT NULL,
    lichid integer NOT NULL,
    nhanvienlapid integer NOT NULL,
    tongthu numeric(15,2) DEFAULT 0 NOT NULL,
    tongchi numeric(15,2) DEFAULT 0 NOT NULL,
    loinhuan numeric(15,2) GENERATED ALWAYS AS ((tongthu - tongchi)) STORED,
    ngaylap timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trangthaiduyet character varying(20) DEFAULT 'Nhap'::character varying NOT NULL,
    ghichu text,
    thucthu numeric(15,2) DEFAULT 0 NOT NULL,
    congnophaithu numeric(15,2) DEFAULT 0 NOT NULL,
    chiphincc numeric(15,2) DEFAULT 0 NOT NULL,
    chiphihdv numeric(15,2) DEFAULT 0 NOT NULL,
    chiphikhac numeric(15,2) DEFAULT 0 NOT NULL,
    congnophaitra numeric(15,2) DEFAULT 0 NOT NULL,
    nhanvienduyetid integer,
    ngayduyet timestamp without time zone,
    lydotralai text,
    CONSTRAINT baocaoquyettoan_tongchi_check CHECK ((tongchi >= (0)::numeric)),
    CONSTRAINT baocaoquyettoan_tongthu_check CHECK ((tongthu >= (0)::numeric)),
    CONSTRAINT baocaoquyettoan_trangthaiduyet_check CHECK (((trangthaiduyet)::text = ANY ((ARRAY['Nhap'::character varying, 'Da trinh duyet'::character varying, 'Da phe duyet'::character varying, 'Yeu cau chinh sua'::character varying])::text[])))
);


--
-- Name: TABLE baocaoquyettoan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.baocaoquyettoan IS 'Quyết toán tài chính sau tour: tổng thu, tổng chi, lợi nhuận tự tính (GENERATED)';


--
-- Name: baocaoquyettoan_quyettoanid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.baocaoquyettoan_quyettoanid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: baocaoquyettoan_quyettoanid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.baocaoquyettoan_quyettoanid_seq OWNED BY public.baocaoquyettoan.quyettoanid;


--
-- Name: chiphiphatsinh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chiphiphatsinh (
    chiphiid integer NOT NULL,
    lichid integer NOT NULL,
    nhanvienid integer NOT NULL,
    loaichiphi character varying(40) NOT NULL,
    noidung character varying(255) NOT NULL,
    sotien numeric(15,2) DEFAULT 0 NOT NULL,
    ngaychi date DEFAULT CURRENT_DATE NOT NULL,
    sochungtu character varying(50),
    ghichu text
);


--
-- Name: chiphiphatsinh_chiphiid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chiphiphatsinh_chiphiid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chiphiphatsinh_chiphiid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chiphiphatsinh_chiphiid_seq OWNED BY public.chiphiphatsinh.chiphiid;


--
-- Name: chitietdatdichvu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chitietdatdichvu (
    chitietphieuid integer NOT NULL,
    phieudatid integer NOT NULL,
    dichvunccid integer NOT NULL,
    soluong integer NOT NULL,
    dongia numeric(15,2) NOT NULL,
    thanhtien numeric(15,2) NOT NULL,
    ngaysudung date NOT NULL,
    CONSTRAINT chitietdatdichvu_dongia_check CHECK ((dongia >= (0)::numeric)),
    CONSTRAINT chitietdatdichvu_soluong_check CHECK ((soluong > 0)),
    CONSTRAINT chitietdatdichvu_thanhtien_check CHECK ((thanhtien >= (0)::numeric))
);


--
-- Name: TABLE chitietdatdichvu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chitietdatdichvu IS 'Dòng chi tiết trong phiếu đặt NCC: loại dịch vụ, số lượng, đơn giá';


--
-- Name: chitietdatdichvu_chitietphieuid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chitietdatdichvu_chitietphieuid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chitietdatdichvu_chitietphieuid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chitietdatdichvu_chitietphieuid_seq OWNED BY public.chitietdatdichvu.chitietphieuid;


--
-- Name: chitiethanhkhach; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chitiethanhkhach (
    chitietid integer NOT NULL,
    donhangid integer NOT NULL,
    hoten character varying(100) NOT NULL,
    ngaysinh date,
    loaikhach character varying(20) DEFAULT 'Nguoi lon'::character varying NOT NULL,
    cccd character varying(12),
    maqrve character varying(255),
    trangthaidiemdanh smallint DEFAULT 0 NOT NULL,
    ghichu text,
    CONSTRAINT chitiethanhkhach_loaikhach_check CHECK (((loaikhach)::text = ANY ((ARRAY['Nguoi lon'::character varying, 'Tre em'::character varying, 'Em be'::character varying])::text[]))),
    CONSTRAINT chitiethanhkhach_trangthaidiemdanh_check CHECK ((trangthaidiemdanh = ANY (ARRAY[0, 1])))
);


--
-- Name: TABLE chitiethanhkhach; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chitiethanhkhach IS 'Từng hành khách trong đơn đặt tour (kèm mã QR vé điện tử)';


--
-- Name: COLUMN chitiethanhkhach.cccd; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chitiethanhkhach.cccd IS 'Số Căn cước công dân (12 số)';


--
-- Name: COLUMN chitiethanhkhach.trangthaidiemdanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chitiethanhkhach.trangthaidiemdanh IS '0 = Chưa điểm danh | 1 = Đã điểm danh';


--
-- Name: chitiethanhkhach_chitietid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chitiethanhkhach_chitietid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chitiethanhkhach_chitietid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chitiethanhkhach_chitietid_seq OWNED BY public.chitiethanhkhach.chitietid;


--
-- Name: chuongtrinhkhuyenmai; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chuongtrinhkhuyenmai (
    ctkmid integer NOT NULL,
    tenchuongtrinh character varying(200) NOT NULL,
    mota text,
    phantramgiam numeric(5,2) DEFAULT 10 NOT NULL,
    ngaybatdau timestamp(6) without time zone DEFAULT now() NOT NULL,
    ngayketthuc timestamp(6) without time zone DEFAULT (now() + '30 days'::interval) NOT NULL,
    trangthai smallint DEFAULT 1 NOT NULL,
    nhanvientaoid integer DEFAULT 1 NOT NULL,
    ngaytao timestamp(6) without time zone DEFAULT now() NOT NULL,
    ngaycapnhat timestamp(6) without time zone
);


--
-- Name: TABLE chuongtrinhkhuyenmai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chuongtrinhkhuyenmai IS 'Khuyến mãi tour: giảm x% cho các tour được gán, chỉ có hiệu lực trong [NgayBatDau, NgayKetThuc]; hết hạn thì giá về như cũ (không cần job)';


--
-- Name: chuongtrinhkhuyenmai_ctkmid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chuongtrinhkhuyenmai_ctkmid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chuongtrinhkhuyenmai_ctkmid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chuongtrinhkhuyenmai_ctkmid_seq OWNED BY public.chuongtrinhkhuyenmai.ctkmid;


--
-- Name: dangkynhantin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dangkynhantin (
    dangkyid integer NOT NULL,
    email character varying(100) NOT NULL,
    khachhangid integer,
    token character varying(64) NOT NULL,
    trangthai smallint DEFAULT 1 NOT NULL,
    nguondangky character varying(30) DEFAULT 'Website'::character varying NOT NULL,
    ngaydangky timestamp(6) without time zone DEFAULT now() NOT NULL,
    ngayhuy timestamp(6) without time zone
);


--
-- Name: dangkynhantin_dangkyid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dangkynhantin_dangkyid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dangkynhantin_dangkyid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dangkynhantin_dangkyid_seq OWNED BY public.dangkynhantin.dangkyid;


--
-- Name: danhgia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.danhgia (
    danhgiaid integer NOT NULL,
    khachhangid integer NOT NULL,
    tourid integer NOT NULL,
    donhangid integer NOT NULL,
    sosao smallint NOT NULL,
    binhluan text,
    ngaydanhgia timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trangthaiduyet character varying(20) DEFAULT 'Cho duyet'::character varying NOT NULL,
    CONSTRAINT danhgia_sosao_check CHECK (((sosao >= 1) AND (sosao <= 5))),
    CONSTRAINT danhgia_trangthaiduyet_check CHECK (((trangthaiduyet)::text = ANY ((ARRAY['Cho duyet'::character varying, 'Da hien thi'::character varying, 'An/Vi pham'::character varying])::text[])))
);


--
-- Name: TABLE danhgia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.danhgia IS 'Đánh giá sao + nhận xét của khách sau tour (mỗi đơn chỉ được đánh giá 1 lần)';


--
-- Name: danhgia_danhgiaid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.danhgia_danhgiaid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: danhgia_danhgiaid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.danhgia_danhgiaid_seq OWNED BY public.danhgia.danhgiaid;


--
-- Name: danhmuctour; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.danhmuctour (
    danhmucid integer NOT NULL,
    tendanhmuc character varying(100) NOT NULL,
    mota text
);


--
-- Name: TABLE danhmuctour; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.danhmuctour IS 'Phân loại tour: Trong Nước, Quốc Tế, Mạo Hiểm, Nghỉ Dưỡng...';


--
-- Name: danhmuctour_danhmucid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.danhmuctour_danhmucid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: danhmuctour_danhmucid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.danhmuctour_danhmucid_seq OWNED BY public.danhmuctour.danhmucid;


--
-- Name: dichvunhacungcap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dichvunhacungcap (
    dichvunccid integer NOT NULL,
    nhacungcapid integer NOT NULL,
    tendichvu character varying(200) NOT NULL,
    loaidichvu character varying(100),
    dongia numeric(15,2) NOT NULL,
    donvitinh character varying(50) NOT NULL,
    mota text,
    trangthai smallint DEFAULT 1 NOT NULL,
    CONSTRAINT dichvunhacungcap_dongia_check CHECK ((dongia >= (0)::numeric))
);


--
-- Name: TABLE dichvunhacungcap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dichvunhacungcap IS 'Từng loại dịch vụ cụ thể của mỗi NCC (phòng đôi, xe 45 chỗ, set bữa ăn...)';


--
-- Name: dichvunhacungcap_dichvunccid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dichvunhacungcap_dichvunccid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dichvunhacungcap_dichvunccid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dichvunhacungcap_dichvunccid_seq OWNED BY public.dichvunhacungcap.dichvunccid;


--
-- Name: dieuphoitour; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dieuphoitour (
    dieuphoiid integer NOT NULL,
    lichid integer NOT NULL,
    hdvid integer NOT NULL,
    nhanvienid integer NOT NULL,
    ngayphancong timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trangthai character varying(20) DEFAULT 'Cho xac nhan'::character varying NOT NULL,
    ghichu text,
    CONSTRAINT dieuphoitour_trangthai_check CHECK (((trangthai)::text = ANY ((ARRAY['Cho xac nhan'::character varying, 'Da xac nhan'::character varying, 'Tu choi'::character varying, 'Hoan thanh'::character varying])::text[])))
);


--
-- Name: TABLE dieuphoitour; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dieuphoitour IS 'Phân công HDV phụ trách từng đợt lịch khởi hành';


--
-- Name: dieuphoitour_dieuphoiid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dieuphoitour_dieuphoiid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dieuphoitour_dieuphoiid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dieuphoitour_dieuphoiid_seq OWNED BY public.dieuphoitour.dieuphoiid;


--
-- Name: dondattour; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dondattour (
    donhangid integer NOT NULL,
    khachhangid integer NOT NULL,
    lichid integer NOT NULL,
    nhanvienxulyid integer,
    voucherid integer,
    madon character varying(30) NOT NULL,
    ngaydat timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    soluongnguoilon integer DEFAULT 1 NOT NULL,
    soluongtreem integer DEFAULT 0 NOT NULL,
    tongtien numeric(15,2) NOT NULL,
    giamgia numeric(15,2) DEFAULT 0 NOT NULL,
    tiencoc numeric(15,2) DEFAULT 0 NOT NULL,
    tienconlai numeric(15,2) DEFAULT 0 NOT NULL,
    trangthaidon character varying(20) DEFAULT 'Cho thanh toan'::character varying NOT NULL,
    phuongthuctt character varying(20),
    ghichu text,
    ctkmid integer,
    giamgiakhuyenmai numeric(15,2) DEFAULT 0 NOT NULL,
    CONSTRAINT chk_sl_khach CHECK (((soluongnguoilon + soluongtreem) > 0)),
    CONSTRAINT dondattour_phuongthuctt_check CHECK (((phuongthuctt)::text = ANY ((ARRAY['VNPay'::character varying, 'ZaloPay'::character varying, 'Chuyen khoan'::character varying, 'Tien mat'::character varying, 'MoMo'::character varying])::text[]))),
    CONSTRAINT dondattour_soluongnguoilon_check CHECK ((soluongnguoilon >= 0)),
    CONSTRAINT dondattour_soluongtreem_check CHECK ((soluongtreem >= 0)),
    CONSTRAINT dondattour_tongtien_check CHECK ((tongtien >= (0)::numeric)),
    CONSTRAINT dondattour_trangthaidon_check CHECK (((trangthaidon)::text = ANY ((ARRAY['Cho thanh toan'::character varying, 'Da dat coc'::character varying, 'Da thanh toan'::character varying, 'Da xac nhan'::character varying, 'Dang thuc hien'::character varying, 'Hoan thanh'::character varying, 'Da huy'::character varying])::text[])))
);


--
-- Name: TABLE dondattour; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dondattour IS 'Đơn đặt tour: khách đặt, lịch chọn, mã giảm giá, tổng tiền, trạng thái';


--
-- Name: COLUMN dondattour.giamgia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dondattour.giamgia IS 'Tổng giảm giá = giamgiakhuyenmai (CTKM tour) + giảm giá voucher';


--
-- Name: dondattour_donhangid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dondattour_donhangid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dondattour_donhangid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dondattour_donhangid_seq OWNED BY public.dondattour.donhangid;


--
-- Name: hoadon; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hoadon (
    hoadonid integer NOT NULL,
    donhangid integer NOT NULL,
    thanhtoanid integer,
    sohoadon character varying(50) NOT NULL,
    tencongty character varying(200),
    masothue character varying(20),
    diachicongty character varying(255),
    ngayxuat date DEFAULT CURRENT_DATE NOT NULL,
    tongtienvat numeric(15,2) NOT NULL,
    filehoadonurl character varying(500),
    CONSTRAINT hoadon_tongtienvat_check CHECK ((tongtienvat >= (0)::numeric))
);


--
-- Name: TABLE hoadon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.hoadon IS 'Hóa đơn điện tử VAT xuất cho khách hàng doanh nghiệp';


--
-- Name: hoadon_hoadonid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hoadon_hoadonid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hoadon_hoadonid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hoadon_hoadonid_seq OWNED BY public.hoadon.hoadonid;


--
-- Name: huongdanvien; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.huongdanvien (
    hdvid integer NOT NULL,
    nhanvienid integer NOT NULL,
    sothehdv character varying(50) NOT NULL,
    ngonngu character varying(100) NOT NULL,
    kinhnghiem character varying(100),
    trangthai character varying(30) DEFAULT 'San sang'::character varying NOT NULL,
    CONSTRAINT huongdanvien_trangthai_check CHECK (((trangthai)::text = ANY ((ARRAY['San sang'::character varying, 'Dang di tour'::character varying, 'Nghi phep'::character varying, 'Nghi viec'::character varying])::text[])))
);


--
-- Name: TABLE huongdanvien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.huongdanvien IS 'Thông tin chuyên biệt của HDV: thẻ hành nghề, ngôn ngữ, trạng thái';


--
-- Name: huongdanvien_hdvid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.huongdanvien_hdvid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: huongdanvien_hdvid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.huongdanvien_hdvid_seq OWNED BY public.huongdanvien.hdvid;


--
-- Name: khachhang; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.khachhang (
    khachhangid integer NOT NULL,
    taikhoanid integer NOT NULL,
    hoten character varying(100) NOT NULL,
    diachigiaohang character varying(255),
    sodienthoai character varying(20) NOT NULL,
    email character varying(100) NOT NULL,
    cccd character varying(12),
    ngaysinh date,
    gioitinh character varying(10),
    CONSTRAINT khachhang_gioitinh_check CHECK (((gioitinh)::text = ANY ((ARRAY['Nam'::character varying, 'Nu'::character varying, 'Khac'::character varying])::text[])))
);


--
-- Name: TABLE khachhang; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.khachhang IS 'Thông tin cá nhân của khách du lịch đăng ký tài khoản';


--
-- Name: COLUMN khachhang.cccd; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.khachhang.cccd IS 'Số Căn cước công dân (12 số)';


--
-- Name: khachhang_khachhangid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.khachhang_khachhangid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: khachhang_khachhangid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.khachhang_khachhangid_seq OWNED BY public.khachhang.khachhangid;


--
-- Name: voucher; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voucher (
    voucherid integer NOT NULL,
    mavoucher character varying(50) NOT NULL,
    tenchuongtrinh character varying(200) NOT NULL,
    phantramgiam numeric(5,2) NOT NULL,
    giamtoida numeric(15,2) NOT NULL,
    giatridontoithieu numeric(15,2) DEFAULT 0 NOT NULL,
    ngaybatdau date NOT NULL,
    ngayketthuc date NOT NULL,
    trangthai smallint DEFAULT 1 NOT NULL,
    soluongtoida integer,
    CONSTRAINT chk_km_ngay CHECK ((ngayketthuc >= ngaybatdau)),
    CONSTRAINT khuyenmai_giamtoida_check CHECK ((giamtoida > (0)::numeric)),
    CONSTRAINT khuyenmai_phantramgiam_check CHECK (((phantramgiam > (0)::numeric) AND (phantramgiam <= (100)::numeric))),
    CONSTRAINT khuyenmai_trangthai_check CHECK ((trangthai = ANY (ARRAY[0, 1]))),
    CONSTRAINT voucher_soluongtoida_check CHECK (((soluongtoida IS NULL) OR (soluongtoida > 0)))
);


--
-- Name: TABLE voucher; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.voucher IS 'Mã giảm giá (voucher): khách nhập mã khi đặt tour. Khác với Khuyến mãi tour (ChuongTrinhKhuyenMai) là giảm giá tự động theo tour';


--
-- Name: COLUMN voucher.ngayketthuc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.voucher.ngayketthuc IS 'Ngày hết hạn khuyến mãi - Hệ thống từ chối áp dụng mã nếu CURRENT_DATE > NgayKetThucKM (ngăn mã dùng vĩnh viễn)';


--
-- Name: khuyenmai_khuyenmaiid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.khuyenmai_khuyenmaiid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: khuyenmai_khuyenmaiid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.khuyenmai_khuyenmaiid_seq OWNED BY public.voucher.voucherid;


--
-- Name: lichkhoihanh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lichkhoihanh (
    lichid integer NOT NULL,
    tourid integer NOT NULL,
    malich character varying(30) NOT NULL,
    ngaykhoihanh timestamp without time zone NOT NULL,
    ngayketthuc timestamp without time zone NOT NULL,
    sochotoida integer NOT NULL,
    sochodadat integer DEFAULT 0 NOT NULL,
    giatourkhuyenmai numeric(15,2),
    trangthai character varying(20) DEFAULT 'Cho khoi hanh'::character varying NOT NULL,
    CONSTRAINT chk_cho_dat CHECK ((sochodadat <= sochotoida)),
    CONSTRAINT chk_ngay_lich CHECK ((ngayketthuc > ngaykhoihanh)),
    CONSTRAINT lichkhoihanh_sochodadat_check CHECK ((sochodadat >= 0)),
    CONSTRAINT lichkhoihanh_sochotoida_check CHECK ((sochotoida > 0)),
    CONSTRAINT lichkhoihanh_trangthai_check CHECK (((trangthai)::text = ANY ((ARRAY['Cho khoi hanh'::character varying, 'Dang di'::character varying, 'Hoan thanh'::character varying, 'Huy'::character varying])::text[])))
);


--
-- Name: TABLE lichkhoihanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lichkhoihanh IS 'Từng đợt đi cụ thể của một tour (số chỗ, ngày đi, ngày về, trạng thái)';


--
-- Name: lichkhoihanh_lichid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lichkhoihanh_lichid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lichkhoihanh_lichid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lichkhoihanh_lichid_seq OWNED BY public.lichkhoihanh.lichid;


--
-- Name: nhacungcap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nhacungcap (
    nhacungcapid integer NOT NULL,
    tenncc character varying(200) NOT NULL,
    loaincc character varying(50) NOT NULL,
    nguoilienhe character varying(100),
    sodienthoai character varying(20) NOT NULL,
    email character varying(100),
    diachi character varying(255),
    danhgia numeric(3,2),
    masothue character varying(20),
    trangthai smallint DEFAULT 1 NOT NULL,
    CONSTRAINT nhacungcap_danhgia_check CHECK (((danhgia >= (0)::numeric) AND (danhgia <= (5)::numeric))),
    CONSTRAINT nhacungcap_loaincc_check CHECK (((loaincc)::text = ANY ((ARRAY['Khach san'::character varying, 'Nha hang'::character varying, 'Xe van chuyen'::character varying, 'Cong ty bay'::character varying, 'Khu du lich'::character varying, 'Khac'::character varying])::text[])))
);


--
-- Name: TABLE nhacungcap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.nhacungcap IS 'Đối tác cung cấp dịch vụ cho đoàn tour: khách sạn, xe, nhà hàng...';


--
-- Name: nhacungcap_nhacungcapid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nhacungcap_nhacungcapid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nhacungcap_nhacungcapid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nhacungcap_nhacungcapid_seq OWNED BY public.nhacungcap.nhacungcapid;


--
-- Name: nhanvien; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nhanvien (
    nhanvienid integer NOT NULL,
    taikhoanid integer NOT NULL,
    hoten character varying(100) NOT NULL,
    diachi character varying(255),
    sodienthoai character varying(20) NOT NULL,
    email character varying(100) NOT NULL,
    chucvu character varying(50) NOT NULL,
    ngayvaolam date
);


--
-- Name: TABLE nhanvien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.nhanvien IS 'Nhân viên công ty: Điều hành, Kế toán, Quản lý';


--
-- Name: nhanvien_nhanvienid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nhanvien_nhanvienid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nhanvien_nhanvienid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nhanvien_nhanvienid_seq OWNED BY public.nhanvien.nhanvienid;


--
-- Name: nhatkyguimail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nhatkyguimail (
    nhatkyid integer NOT NULL,
    loaimail character varying(40) NOT NULL,
    emailnhan character varying(100) NOT NULL,
    tieude character varying(255) NOT NULL,
    trangthai character varying(20) NOT NULL,
    chitietloi text,
    thamchieu character varying(100),
    ngaygui timestamp(6) without time zone DEFAULT now() NOT NULL
);


--
-- Name: nhatkyguimail_nhatkyid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nhatkyguimail_nhatkyid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nhatkyguimail_nhatkyid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nhatkyguimail_nhatkyid_seq OWNED BY public.nhatkyguimail.nhatkyid;


--
-- Name: phanquyen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phanquyen (
    taikhoanid integer NOT NULL,
    vaitroid integer NOT NULL,
    ngaygan timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE phanquyen; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.phanquyen IS 'Gán vai trò cho tài khoản (1 tài khoản có thể có nhiều vai trò)';


--
-- Name: phieudatdichvu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phieudatdichvu (
    phieudatid integer NOT NULL,
    lichid integer NOT NULL,
    nhanvienid integer NOT NULL,
    nhacungcapid integer NOT NULL,
    maphieu character varying(30) NOT NULL,
    ngaydat date DEFAULT CURRENT_DATE NOT NULL,
    tongtiendichvu numeric(15,2) DEFAULT 0 NOT NULL,
    tiendacoc numeric(15,2) DEFAULT 0 NOT NULL,
    trangthai character varying(20) DEFAULT 'Moi tao'::character varying NOT NULL,
    ghichu text,
    hanthanhtoan date,
    sohoadonncc character varying(50),
    CONSTRAINT phieudatdichvu_trangthai_check CHECK (((trangthai)::text = ANY ((ARRAY['Moi tao'::character varying, 'Da gui NCC'::character varying, 'NCC xac nhan'::character varying, 'NCC tu choi'::character varying, 'Da huy'::character varying])::text[])))
);


--
-- Name: TABLE phieudatdichvu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.phieudatdichvu IS 'Phiếu đặt dịch vụ từ nhân viên điều hành gửi NCC cho một đợt khởi hành';


--
-- Name: COLUMN phieudatdichvu.tiendacoc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.phieudatdichvu.tiendacoc IS 'Tổng tiền đã trả NCC (cọc + các lần thanh toán sau). Công nợ phải trả = tongtiendichvu - tiendacoc';


--
-- Name: phieudatdichvu_phieudatid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.phieudatdichvu_phieudatid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: phieudatdichvu_phieudatid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.phieudatdichvu_phieudatid_seq OWNED BY public.phieudatdichvu.phieudatid;


--
-- Name: taikhoan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taikhoan (
    taikhoanid integer NOT NULL,
    email character varying(100) NOT NULL,
    matkhauhash character varying(255) NOT NULL,
    sodienthoai character varying(20),
    trangthai smallint DEFAULT 1 NOT NULL,
    ngaytao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    email_verified_at timestamp without time zone,
    remember_token character varying(100),
    CONSTRAINT taikhoan_trangthai_check CHECK ((trangthai = ANY (ARRAY[0, 1])))
);


--
-- Name: TABLE taikhoan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.taikhoan IS 'Tài khoản đăng nhập của tất cả người dùng hệ thống';


--
-- Name: COLUMN taikhoan.trangthai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.taikhoan.trangthai IS '1 = Hoạt động | 0 = Đã khóa';


--
-- Name: taikhoan_taikhoanid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.taikhoan_taikhoanid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: taikhoan_taikhoanid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.taikhoan_taikhoanid_seq OWNED BY public.taikhoan.taikhoanid;


--
-- Name: thanhtoan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thanhtoan (
    thanhtoanid integer NOT NULL,
    donhangid integer NOT NULL,
    nhanvienid integer,
    magiaodich character varying(100),
    sotien numeric(15,2) NOT NULL,
    hinhthuctt character varying(20) NOT NULL,
    ngaythanhtoan timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trangthai character varying(20) DEFAULT 'Cho xu ly'::character varying NOT NULL,
    ghichu text,
    CONSTRAINT thanhtoan_hinhthuctt_check CHECK (((hinhthuctt)::text = ANY ((ARRAY['VNPay'::character varying, 'ZaloPay'::character varying, 'Chuyen khoan'::character varying, 'Tien mat'::character varying, 'MoMo'::character varying])::text[]))),
    CONSTRAINT thanhtoan_sotien_check CHECK ((sotien > (0)::numeric)),
    CONSTRAINT thanhtoan_trangthai_check CHECK (((trangthai)::text = ANY ((ARRAY['Cho xu ly'::character varying, 'Thanh cong'::character varying, 'That bai'::character varying, 'Da hoan tien'::character varying])::text[])))
);


--
-- Name: TABLE thanhtoan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.thanhtoan IS 'Lịch sử từng giao dịch: đặt cọc, thanh toán đủ, hoàn tiền';


--
-- Name: thanhtoan_thanhtoanid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.thanhtoan_thanhtoanid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: thanhtoan_thanhtoanid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.thanhtoan_thanhtoanid_seq OWNED BY public.thanhtoan.thanhtoanid;


--
-- Name: tour; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tour (
    tourid integer NOT NULL,
    danhmucid integer NOT NULL,
    nhanvientaoid integer NOT NULL,
    matour character varying(20) NOT NULL,
    tentour character varying(255) NOT NULL,
    thoigian character varying(50) NOT NULL,
    diemkhoihanh character varying(100) NOT NULL,
    diemden character varying(100) NOT NULL,
    motachitiet text,
    lichtrinh text,
    phongcachtour character varying(50),
    phuongtien character varying(100),
    gianguoilon numeric(15,2) NOT NULL,
    giatreem numeric(15,2) NOT NULL,
    phuthuphongdon numeric(15,2) DEFAULT 0 NOT NULL,
    hinhanhurl character varying(500),
    trangthaiduyet character varying(20) DEFAULT 'Nhap'::character varying NOT NULL,
    ngaytao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ngaycapnhat timestamp without time zone,
    dichvudikem text,
    CONSTRAINT tour_gianguoilon_check CHECK ((gianguoilon >= (0)::numeric)),
    CONSTRAINT tour_giatreem_check CHECK ((giatreem >= (0)::numeric)),
    CONSTRAINT tour_trangthaiduyet_check CHECK (((trangthaiduyet)::text = ANY ((ARRAY['Nhap'::character varying, 'Cho duyet'::character varying, 'Da duyet'::character varying, 'Dang mo ban'::character varying, 'Dong ban'::character varying, 'Huy'::character varying])::text[])))
);


--
-- Name: TABLE tour; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tour IS 'Chương trình tour du lịch do nhân viên điều hành thiết kế và trình duyệt';


--
-- Name: tour_tourid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tour_tourid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tour_tourid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tour_tourid_seq OWNED BY public.tour.tourid;


--
-- Name: vaitro; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vaitro (
    vaitroid integer NOT NULL,
    tenvaitro character varying(50) NOT NULL,
    mota character varying(255)
);


--
-- Name: TABLE vaitro; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vaitro IS 'Danh sách vai trò: Admin, Điều hành, Kế toán, HDV, Khách hàng';


--
-- Name: vaitro_vaitroid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vaitro_vaitroid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vaitro_vaitroid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vaitro_vaitroid_seq OWNED BY public.vaitro.vaitroid;


--
-- Name: apdungctkm apdungctkmid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apdungctkm ALTER COLUMN apdungctkmid SET DEFAULT nextval('public.apdungctkm_apdungctkmid_seq'::regclass);


--
-- Name: apdungvoucher apdungvoucherid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apdungvoucher ALTER COLUMN apdungvoucherid SET DEFAULT nextval('public.apdungkhuyenmai_apdungkmid_seq'::regclass);


--
-- Name: baocaoquyettoan quyettoanid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baocaoquyettoan ALTER COLUMN quyettoanid SET DEFAULT nextval('public.baocaoquyettoan_quyettoanid_seq'::regclass);


--
-- Name: chiphiphatsinh chiphiid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chiphiphatsinh ALTER COLUMN chiphiid SET DEFAULT nextval('public.chiphiphatsinh_chiphiid_seq'::regclass);


--
-- Name: chitietdatdichvu chitietphieuid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitietdatdichvu ALTER COLUMN chitietphieuid SET DEFAULT nextval('public.chitietdatdichvu_chitietphieuid_seq'::regclass);


--
-- Name: chitiethanhkhach chitietid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitiethanhkhach ALTER COLUMN chitietid SET DEFAULT nextval('public.chitiethanhkhach_chitietid_seq'::regclass);


--
-- Name: chuongtrinhkhuyenmai ctkmid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chuongtrinhkhuyenmai ALTER COLUMN ctkmid SET DEFAULT nextval('public.chuongtrinhkhuyenmai_ctkmid_seq'::regclass);


--
-- Name: dangkynhantin dangkyid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dangkynhantin ALTER COLUMN dangkyid SET DEFAULT nextval('public.dangkynhantin_dangkyid_seq'::regclass);


--
-- Name: danhgia danhgiaid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.danhgia ALTER COLUMN danhgiaid SET DEFAULT nextval('public.danhgia_danhgiaid_seq'::regclass);


--
-- Name: danhmuctour danhmucid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.danhmuctour ALTER COLUMN danhmucid SET DEFAULT nextval('public.danhmuctour_danhmucid_seq'::regclass);


--
-- Name: dichvunhacungcap dichvunccid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dichvunhacungcap ALTER COLUMN dichvunccid SET DEFAULT nextval('public.dichvunhacungcap_dichvunccid_seq'::regclass);


--
-- Name: dieuphoitour dieuphoiid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dieuphoitour ALTER COLUMN dieuphoiid SET DEFAULT nextval('public.dieuphoitour_dieuphoiid_seq'::regclass);


--
-- Name: dondattour donhangid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dondattour ALTER COLUMN donhangid SET DEFAULT nextval('public.dondattour_donhangid_seq'::regclass);


--
-- Name: hoadon hoadonid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hoadon ALTER COLUMN hoadonid SET DEFAULT nextval('public.hoadon_hoadonid_seq'::regclass);


--
-- Name: huongdanvien hdvid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.huongdanvien ALTER COLUMN hdvid SET DEFAULT nextval('public.huongdanvien_hdvid_seq'::regclass);


--
-- Name: khachhang khachhangid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.khachhang ALTER COLUMN khachhangid SET DEFAULT nextval('public.khachhang_khachhangid_seq'::regclass);


--
-- Name: lichkhoihanh lichid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lichkhoihanh ALTER COLUMN lichid SET DEFAULT nextval('public.lichkhoihanh_lichid_seq'::regclass);


--
-- Name: nhacungcap nhacungcapid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhacungcap ALTER COLUMN nhacungcapid SET DEFAULT nextval('public.nhacungcap_nhacungcapid_seq'::regclass);


--
-- Name: nhanvien nhanvienid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhanvien ALTER COLUMN nhanvienid SET DEFAULT nextval('public.nhanvien_nhanvienid_seq'::regclass);


--
-- Name: nhatkyguimail nhatkyid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyguimail ALTER COLUMN nhatkyid SET DEFAULT nextval('public.nhatkyguimail_nhatkyid_seq'::regclass);


--
-- Name: phieudatdichvu phieudatid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phieudatdichvu ALTER COLUMN phieudatid SET DEFAULT nextval('public.phieudatdichvu_phieudatid_seq'::regclass);


--
-- Name: taikhoan taikhoanid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taikhoan ALTER COLUMN taikhoanid SET DEFAULT nextval('public.taikhoan_taikhoanid_seq'::regclass);


--
-- Name: thanhtoan thanhtoanid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thanhtoan ALTER COLUMN thanhtoanid SET DEFAULT nextval('public.thanhtoan_thanhtoanid_seq'::regclass);


--
-- Name: tour tourid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour ALTER COLUMN tourid SET DEFAULT nextval('public.tour_tourid_seq'::regclass);


--
-- Name: vaitro vaitroid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vaitro ALTER COLUMN vaitroid SET DEFAULT nextval('public.vaitro_vaitroid_seq'::regclass);


--
-- Name: voucher voucherid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher ALTER COLUMN voucherid SET DEFAULT nextval('public.khuyenmai_khuyenmaiid_seq'::regclass);


--
-- Data for Name: apdungctkm; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.apdungctkm (apdungctkmid, ctkmid, tourid) FROM stdin;
1	1	5
2	1	1
\.


--
-- Data for Name: apdungvoucher; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.apdungvoucher (apdungvoucherid, voucherid, tourid, ngayapdung) FROM stdin;
\.


--
-- Data for Name: baocaoquyettoan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.baocaoquyettoan (quyettoanid, lichid, nhanvienlapid, tongthu, tongchi, ngaylap, trangthaiduyet, ghichu, thucthu, congnophaithu, chiphincc, chiphihdv, chiphikhac, congnophaitra, nhanvienduyetid, ngayduyet, lydotralai) FROM stdin;
1	1	3	35340000.00	25200000.00	2026-10-19 09:30:00	Da phe duyet	Quyết toán đợt khởi hành Đà Nẵng tháng 10/2026. Lợi nhuận ròng đạt 10.140.000 đ.	35340000.00	0.00	25200000.00	0.00	0.00	0.00	\N	\N	\N
2	3	3	32900000.00	21300000.00	2026-10-22 14:00:00	Da trinh duyet	Quyết toán đoàn Tokyo - Osaka khởi hành đầu tháng 11/2026. Biên lợi nhuận dự kiến 35.3%.	32900000.00	0.00	21300000.00	0.00	0.00	0.00	\N	\N	\N
3	18	3	6290000.00	4300000.00	2026-10-23 08:30:00	Da phe duyet	Quyết toán đợt tour Phú Quốc trải nghiệm Grand World và cáp treo Hòn Thơm.	6290000.00	0.00	4300000.00	0.00	0.00	0.00	\N	\N	\N
4	7	1	31960000.00	4300000.00	2026-10-30 05:58:33.045	Da phe duyet	\N	31960000.00	0.00	0.00	4300000.00	0.00	0.00	1	2026-10-30 05:58:50.192	\N
\.


--
-- Data for Name: chiphiphatsinh; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chiphiphatsinh (chiphiid, lichid, nhanvienid, loaichiphi, noidung, sotien, ngaychi, sochungtu, ghichu) FROM stdin;
\.


--
-- Data for Name: chitietdatdichvu; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chitietdatdichvu (chitietphieuid, phieudatid, dichvunccid, soluong, dongia, thanhtien, ngaysudung) FROM stdin;
1	8	1	5	2200000.00	11000000.00	2026-10-15
2	8	4	10	250000.00	2500000.00	2026-10-16
3	9	5	3	2400000.00	7200000.00	2026-10-15
4	10	8	10	250000.00	2500000.00	2026-10-16
5	10	9	4	500000.00	2000000.00	2026-10-17
6	11	10	5	2900000.00	14500000.00	2026-11-01
7	12	12	2	3400000.00	6800000.00	2026-11-02
8	13	13	2	1600000.00	3200000.00	2026-10-25
9	14	15	2	550000.00	1100000.00	2026-10-26
\.


--
-- Data for Name: chitiethanhkhach; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chitiethanhkhach (chitietid, donhangid, hoten, ngaysinh, loaikhach, cccd, maqrve, trangthaidiemdanh, ghichu) FROM stdin;
5	10	Lương Viễn Đông	\N	Nguoi lon	\N	VT-BK-579472-1-9483	0	Giới tính: Nam
6	11	Lương Viễn Đông	\N	Nguoi lon	\N	VT-BK-67501072-1-5030	0	Giới tính: Nam
7	12	Lương Viễn Đông	\N	Nguoi lon	\N	VT-BK-72265421-1-2659	0	Giới tính: Nam
8	13	Lương Viễn Đông	\N	Nguoi lon	\N	VT-BK-07742565-1-7454	0	Giới tính: Nam
9	13	Hành khách 2	\N	Nguoi lon	\N	VT-BK-07742565-2-7454	0	Giới tính: Nam
10	13	Hành khách 3	\N	Nguoi lon	\N	VT-BK-07742565-3-7454	0	Giới tính: Nam
11	13	Hành khách 4	\N	Nguoi lon	\N	VT-BK-07742565-4-7454	0	Giới tính: Nam
12	13	Hành khách 5	\N	Nguoi lon	\N	VT-BK-07742565-5-7454	0	Giới tính: Nam
13	13	Hành khách 6	\N	Nguoi lon	\N	VT-BK-07742565-6-7454	0	Giới tính: Nam
14	13	Hành khách 7	\N	Nguoi lon	\N	VT-BK-07742565-7-7454	0	Giới tính: Nam
15	13	Hành khách 8	\N	Nguoi lon	\N	VT-BK-07742565-8-7454	0	Giới tính: Nam
16	13	Hành khách 9	\N	Nguoi lon	\N	VT-BK-07742565-9-7454	0	Giới tính: Nam
17	13	Hành khách 10	\N	Nguoi lon	\N	VT-BK-07742565-10-7454	0	Giới tính: Nam
18	13	Hành khách 11	\N	Nguoi lon	\N	VT-BK-07742565-11-7454	0	Giới tính: Nam
19	13	Hành khách 12	\N	Nguoi lon	\N	VT-BK-07742565-12-7454	0	Giới tính: Nam
20	13	Hành khách 13	\N	Nguoi lon	\N	VT-BK-07742565-13-7454	0	Giới tính: Nam
21	13	Hành khách 14	\N	Nguoi lon	\N	VT-BK-07742565-14-7454	0	Giới tính: Nam
22	13	Hành khách 15	\N	Nguoi lon	\N	VT-BK-07742565-15-7454	0	Giới tính: Nam
23	13	Hành khách 16	\N	Nguoi lon	\N	VT-BK-07742565-16-7454	0	Giới tính: Nam
24	13	Hành khách 17	\N	Nguoi lon	\N	VT-BK-07742565-17-7454	0	Giới tính: Nam
25	13	Hành khách 18	\N	Nguoi lon	\N	VT-BK-07742565-18-7454	0	Giới tính: Nam
26	13	Hành khách 19	\N	Nguoi lon	\N	VT-BK-07742565-19-7454	0	Giới tính: Nam
27	14	Lương Viễn Đông	\N	Nguoi lon	\N	VT-BK-88436047-1-4373	0	Giới tính: Nam
29	15	Hành khách 2	\N	Nguoi lon	\N	VT-BK-24235665-2-2369	0	Giới tính: Nam
30	15	Hành khách 3	\N	Nguoi lon	\N	VT-BK-24235665-3-2369	0	Giới tính: Nam
3	9	Lê Hoàng Bảo An	2018-06-04	Tre em	079118003322	QR-CH1015-HK04-LEBAOAN	0	Ghế: 02B | Giới tính: Nữ | Đón: Nhà hát TP.HCM | Đi cùng phụ huynh
1	8	Lương Viễn Đông	1992-05-15	Nguoi lon	079201001234	QR-CH1015-HK01-LUONGDONG	1	Ghế: 01A | Giới tính: Nam | Đón: Sân bay TSN Cổng D2 | Điểm danh: 07:15 15/10/2026
4	9	Nguyễn Văn Hùng	1988-12-10	Nguoi lon	079088009911	QR-CH1015-HK03-NGUYENHUNG	1	Ghế: 02A | Giới tính: Nam | Đón: Nhà hát TP.HCM | Yêu cầu: Ăn chay
2	8	Trần Thị Mai Phương	1995-08-20	Nguoi lon	079301005678	QR-CH1015-HK02-TRANPHUONG	0	Ghế: 01B | Giới tính: Nữ | Đón: Sân bay TSN Cổng D2 | Điểm danh: 07:18 15/10/2026
31	24	Lương Viễn Đông	\N	Nguoi lon	123123141244	VT-BK-69159620-1-1615	0	Giới tính: Nam
28	15	Lương Viễn Đông	\N	Nguoi lon	\N	VT-BK-24235665-1-2369	1	Giới tính: Nam
33	26	Lương Viễn Đông	\N	Nguoi lon	\N	VT-BK-36211426-1-2165	0	Giới tính: Nam
34	26	Hành khách 2	\N	Nguoi lon	\N	VT-BK-36211426-2-2165	0	Giới tính: Nam
32	25	Lương Viễn Đông	\N	Nguoi lon	212143541353	VT-BK-81937469-1-9384	1	Giới tính: Nam
35	27	Nguyễn Văn Hùng	\N	Nguoi lon	031092008761	VT-SP-27-1-7890	1	\N
36	27	Trần Thu Thảo	\N	Nguoi lon	079188004321	VT-SP-27-2-7890	1	\N
37	27	Nguyễn Hoàng Nam	\N	Nguoi lon	031095009988	VT-SP-27-3-7890	1	\N
38	27	Lê Diệu Linh	\N	Nguoi lon	031097007766	VT-SP-27-4-7890	1	\N
39	27	Nguyễn Bảo An	\N	Tre em	\N	VT-SP-27-5-7890	1	\N
40	27	Nguyễn Bảo Nhi	\N	Tre em	\N	VT-SP-27-6-7890	1	\N
\.


--
-- Data for Name: chuongtrinhkhuyenmai; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chuongtrinhkhuyenmai (ctkmid, tenchuongtrinh, mota, phantramgiam, ngaybatdau, ngayketthuc, trangthai, nhanvientaoid, ngaytao, ngaycapnhat) FROM stdin;
1	Ưu Đãi Mùa Thu Vàng 2026	Giảm trực tiếp 10% cho toàn bộ tour biển đảo miền Trung và Phú Quốc	10.00	2026-09-01 00:00:00	2026-12-31 23:59:59	1	2	2026-10-30 03:29:40.780792	2026-10-30 07:24:41.328
\.


--
-- Data for Name: dangkynhantin; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dangkynhantin (dangkyid, email, khachhangid, token, trangthai, nguondangky, ngaydangky, ngayhuy) FROM stdin;
1	luongviendong1152011@gmail.com	\N	deffe964749a1dab6f33f8f013d784eefd43081133beb6bf	1	Website	2026-10-30 07:25:28.753	\N
\.


--
-- Data for Name: danhgia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.danhgia (danhgiaid, khachhangid, tourid, donhangid, sosao, binhluan, ngaydanhgia, trangthaiduyet) FROM stdin;
1	1	1	1	5	Chuyến đi Đà Nẵng tuyệt vời! Hướng dẫn viên rất nhiệt tình, dịch vụ 5 sao.	2026-10-06 03:29:41.536	Da hien thi
2	2	1	1	5	Dịch vụ chu đáo, ăn uống ngon miệng. Sẽ tiếp tục đặt tour tại VietTour!	2026-10-06 03:29:41.536	Da hien thi
4	2	3	2	5	Tour Nhật Bản ngắm hoa anh đào rất chuyên nghiệp, khách sạn đẹp và ăn uống chuẩn vị.	2026-10-06 03:29:41.536	Da hien thi
8	3	5	7	5	đẹp	2026-10-23 03:51:55.693	Da hien thi
9	3	5	15	5	đẹp	2026-10-23 07:51:02.02	Da hien thi
10	1	2	16	5	Dịch vụ tuyệt vời trong chuyến đi Sapa - Đỉnh Fansipan - Bản Cát Cát! Hướng dẫn viên chu đáo, lịch trình hợp lý.	2026-02-15 10:00:00	Da hien thi
11	2	1	17	5	Dịch vụ tuyệt vời trong chuyến đi Đà Nẵng - Hội An - Bà Nà Hills! Hướng dẫn viên chu đáo, lịch trình hợp lý.	2026-03-08 14:30:00	Da hien thi
12	1	1	18	5	Dịch vụ tuyệt vời trong chuyến đi Đà Nẵng - Hội An - Bà Nà Hills! Hướng dẫn viên chu đáo, lịch trình hợp lý.	2026-04-28 09:15:00	Da hien thi
13	2	1	19	5	Dịch vụ tuyệt vời trong chuyến đi Đà Nẵng - Hội An - Bà Nà Hills! Hướng dẫn viên chu đáo, lịch trình hợp lý.	2026-05-18 16:00:00	Da hien thi
14	1	1	20	5	Dịch vụ tuyệt vời trong chuyến đi Đà Nẵng - Hội An - Bà Nà Hills! Hướng dẫn viên chu đáo, lịch trình hợp lý.	2026-06-12 11:20:00	Da hien thi
15	2	2	21	5	Dịch vụ tuyệt vời trong chuyến đi Sapa - Đỉnh Fansipan - Bản Cát Cát! Hướng dẫn viên chu đáo, lịch trình hợp lý.	2026-07-20 10:00:00	Da hien thi
16	1	1	22	5	Dịch vụ tuyệt vời trong chuyến đi Đà Nẵng - Hội An - Bà Nà Hills! Hướng dẫn viên chu đáo, lịch trình hợp lý.	2026-08-15 15:45:00	Da hien thi
17	2	1	23	5	Dịch vụ tuyệt vời trong chuyến đi Đà Nẵng - Hội An - Bà Nà Hills! Hướng dẫn viên chu đáo, lịch trình hợp lý.	2026-09-02 08:30:00	Da hien thi
\.


--
-- Data for Name: danhmuctour; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.danhmuctour (danhmucid, tendanhmuc, mota) FROM stdin;
1	Tour Trong Nuoc	Các chương trình du lịch trong lãnh thổ Việt Nam
2	Tour Quoc Te	Các chương trình du lịch nước ngoài
3	Tour Mao Hiem	Tour leo núi, chèo thuyền, camping, dã ngoại
4	Tour Nghi Duong	Tour nghỉ dưỡng biển, spa, resort cao cấp
5	Tour Van Hoa Lich Su	Tham quan di tích, bảo tàng, lễ hội truyền thống
\.


--
-- Data for Name: dichvunhacungcap; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dichvunhacungcap (dichvunccid, nhacungcapid, tendichvu, loaidichvu, dongia, donvitinh, mota, trangthai) FROM stdin;
1	1	Phòng Deluxe King hướng sông Hàn	Khách sạn - Deluxe King	2200000.00	Đêm/Phòng	Phòng 38m2, giường King size, view trọn sông Hàn và cầu Rồng, kèm bữa sáng buffet	1
2	1	Phòng Premier Suite hướng biển	Khách sạn - Suite	3500000.00	Đêm/Phòng	Phòng Suite 65m2 ban công ngắm biển Mỹ Khê, bồn tắm nằm cao cấp, đặc quyền Executive Lounge	1
3	1	Phòng Superior Twin 2 giường đơn	Khách sạn - Superior Twin	1800000.00	Đêm/Phòng	Tiêu chuẩn 2 khách, tiện nghi 5 sao, máy pha cà phê, bàn làm việc	1
4	1	Buffet sáng quốc tế The Square Restaurant	Ẩm thực - Buffet	250000.00	Suất	Hơn 60 món Á - Âu, quầy bánh nướng tươi, nước ép trái cây nhiệt đới	1
5	2	Xe Universe Express 29 chỗ đời mới	Vận chuyển - Universe 29	2400000.00	Ngày/Xe	Ghế ngả cao cấp, máy lạnh ion kháng khuẩn, micro dẫn đoàn, nước suối khăn lạnh	1
6	2	Xe Universe 45 chỗ đời mới cao cấp	Vận chuyển - Universe 45	3200000.00	Ngày/Xe	Xe du lịch phục vụ đoàn lớn xuyên suốt tuyến tham quan miền Trung	1
7	2	Xe Dcar Limousine VIP 9 chỗ đưa đón	Vận chuyển - Limousine VIP	1500000.00	Chuyến	Ghế massage da thật cao cấp, sạc USB, tivi trần, phục vụ khách VIP	1
8	16	Set thực đơn Cơm niêu đặc sản Đà Nẵng (8 món)	Ẩm thực - Bữa trưa	250000.00	Suất	Cá bống kho tộ, canh cua mồng tơi, thịt luộc mắm nêm, rau luộc kho quẹt, tráng miệng chè bắp	1
9	16	Set tiệc Gala Dinner hải sản tươi sống Hội An	Ẩm thực - Gala Dinner	500000.00	Suất	Tôm hùm baby nướng phô mai, mực một nắng nướng sa tế, lẩu cá bớp măng chua, hoa quả bốn mùa	1
10	12	Phòng Superior Twin City View trung tâm Tokyo	Khách sạn - Superior Twin	2900000.00	Đêm/Phòng	Khách sạn 4 sao gần ga Shinjuku, view ngắm tháp Tokyo, bao gồm buffet sáng Nhật - Âu	1
11	12	Phòng Deluxe Tatami Onsen truyền thống	Khách sạn - Tatami Ryokan	4350000.00	Đêm/Phòng	Phòng phong cách Ryokan ngắm núi Phú Sĩ, kèm tắm suối khoáng nóng Onsen khoáng tự nhiên	1
12	13	Xe Hato Bus du lịch tham quan Tokyo - Phú Sĩ 45 chỗ	Vận chuyển quốc tế	3400000.00	Ngày/Xe	Xe bus điều hòa tiêu chuẩn du lịch Nhật Bản, tài xế bản địa giàu kinh nghiệm	1
13	14	Phòng Deluxe Ocean View ban công biển Bãi Dài	Resort 5 sao - Deluxe	1600000.00	Đêm/Phòng	Phòng 42m2 hướng biển, buffet sáng quốc tế tại nhà hàng Coral, hồ bơi vô cực ngoài trời	1
14	14	Villa 2 phòng ngủ Private Pool hướng vườn nhiệt đới	Resort 5 sao - Villa	5500000.00	Đêm/Căn	Biệt thự 190m2 có hồ bơi riêng biệt, xe điện đưa đón trong khuôn viên 24/7	1
15	15	Vé cáp treo Hòn Thơm khứ hồi + Công viên nước Aquatopia	Vé thắng cảnh & Vui chơi	550000.00	Vé/Khách	Trải nghiệm cáp treo 3 dây vượt biển 7.899m dài nhất thế giới, vui chơi không giới hạn	1
\.


--
-- Data for Name: dieuphoitour; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dieuphoitour (dieuphoiid, lichid, hdvid, nhanvienid, ngayphancong, trangthai, ghichu) FROM stdin;
3	2	1	1	2026-10-23 07:44:34.293	Cho xac nhan	\N
4	5	1	2	2026-10-23 14:57:51.378	Da xac nhan	HDV chính dẫn đoàn khách gia đình cao cấp
5	17	1	2	2026-10-23 14:57:51.39	Da xac nhan	HDV phụ trách đoàn du thuyền 5 sao
6	3	2	2	2026-10-23 15:54:48.968	Da xac nhan	Chuyên gia tiếng Nhật dẫn đoàn cao cấp Tokyo
7	6	2	2	2026-10-23 15:54:49.011	Cho xac nhan	Hỗ trợ dẫn đoàn khách quốc tế
8	8	3	2	2026-10-23 15:54:49.019	Da xac nhan	Trekking Fansipan & trải nghiệm Cát Cát
9	9	3	2	2026-10-23 15:54:49.028	Cho xac nhan	Dẫn đoàn trekking Sa Pa mùa vàng
10	7	4	2	2026-10-23 15:54:49.036	Da xac nhan	Thuyết minh di sản Hội An & Cố đô
11	10	4	2	2026-10-23 15:54:49.046	Cho xac nhan	Phụ trách đoàn gia đình cao cấp
12	4	5	2	2026-10-23 15:54:49.056	Da xac nhan	HDV dẫn đoàn trải nghiệm văn hóa địa phương
13	18	5	2	2026-10-23 15:55:06.824	Da xac nhan	Dẫn đoàn Phú Quốc trải nghiệm Cáp Treo Hòn Thơm
2	1	1	1	2026-10-23 07:44:13.077	Da xac nhan	\N
14	11	1	2	2026-11-20 08:00:00	Da xac nhan	Dẫn đoàn Sa Pa Fansipan 6 khách gia đình
15	16	1	2	2026-11-01 08:00:00	Da xac nhan	Phân công HDV dẫn tour Vịnh Hạ Long - Du Thuyền 5 Sao Heritage - Hang Sửng Sốt
16	18	1	2	2026-11-01 08:00:00	Da xac nhan	Phân công HDV dẫn tour Phú Quốc Đảo Ngọc - Grand World - Cáp Treo Hòn Thơm
17	3	1	2	2026-11-01 08:00:00	Da xac nhan	Phân công HDV dẫn tour Nhật Bản: Tokyo - Núi Phú Sĩ - Cố Đô Kyoto - Osaka
18	20	1	2	2026-11-01 08:00:00	Da xac nhan	Phân công HDV dẫn tour Nha Trang - VinWonders - Vịnh San Hô - Tháp Bà Ponagar
19	21	1	2	2026-11-01 08:00:00	Da xac nhan	Phân công HDV dẫn tour Đà Lạt - Thung Lũng Tình Yêu - Đồi Chè Cầu Đất - Đỉnh Langbiang
20	22	1	2	2026-11-01 08:00:00	Da xac nhan	Phân công HDV dẫn tour Miền Tây: Cần Thơ - Chợ Nổi Cái Răng - Rừng Tràm Trà Sư - Bến Tre
21	23	1	2	2026-11-01 08:00:00	Da xac nhan	Phân công HDV dẫn tour Hà Giang - Cột Cờ Lũng Cú - Đèo Mã Pí Lèng - Hẻm Tu Sản
22	24	1	2	2026-11-01 08:00:00	Da xac nhan	Phân công HDV dẫn tour Hàn Quốc: Seoul - Đảo Nami - Tháp Namsan - Cung Điện Gyeongbokgung
23	25	1	2	2026-11-01 08:00:00	Da xac nhan	Phân công HDV dẫn tour Thái Lan: Bangkok - Pattaya - Đảo San Hô Coral - Chùa Wat Arun
\.


--
-- Data for Name: dondattour; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dondattour (donhangid, khachhangid, lichid, nhanvienxulyid, voucherid, madon, ngaydat, soluongnguoilon, soluongtreem, tongtien, giamgia, tiencoc, tienconlai, trangthaidon, phuongthuctt, ghichu, ctkmid, giamgiakhuyenmai) FROM stdin;
2	2	3	2	\N	BK-9822	2026-10-06 01:17:14.794436	1	0	32900000.00	0.00	32900000.00	0.00	Da thanh toan	VNPay	\N	\N	0.00
3	3	1	\N	\N	BK-916370	2026-10-06 03:21:56.371	1	0	5890000.00	0.00	0.00	5890000.00	Cho thanh toan	\N	Khách đăng ký qua website VietTour	\N	0.00
4	3	1	\N	\N	BK-923951	2026-10-06 03:22:03.952	1	0	5890000.00	0.00	0.00	5890000.00	Cho thanh toan	\N	Khách đăng ký qua website VietTour	\N	0.00
5	3	1	\N	\N	BK-937303	2026-10-06 03:22:17.305	1	0	5890000.00	0.00	0.00	5890000.00	Cho thanh toan	\N	Khách đăng ký qua website VietTour	\N	0.00
6	3	1	\N	\N	BK-579864	2026-10-06 03:32:59.866	1	0	5890000.00	0.00	0.00	5890000.00	Cho thanh toan	\N	Khách đăng ký qua website VietTour	\N	0.00
8	1	1	\N	1	BK-864158	2026-10-08 10:04:24.163	2	0	11780000.00	1000000.00	0.00	10780000.00	Da thanh toan	Chuyen khoan	Test dat tour qua he thong	\N	0.00
9	1	1	\N	1	BK-946076	2026-10-08 10:05:46.082	2	0	11780000.00	1000000.00	10780000.00	0.00	Da thanh toan	Chuyen khoan	Test dat tour qua he thong	\N	0.00
7	3	18	\N	\N	BK-815793	2026-10-06 03:53:35.794	1	0	6290000.00	0.00	6290000.00	0.00	Da thanh toan	Chuyen khoan	Khách đặt tour trực tuyến từ trang chi tiết #TOUR-PQ-04	\N	0.00
11	3	18	\N	\N	BK-67501072	2026-10-22 12:54:35.013	1	0	4590000.00	0.00	0.00	4590000.00	Cho thanh toan	\N	Khách đặt trực tuyến từ trang chi tiết #TOUR-PQ-04	\N	0.00
12	3	18	\N	\N	BK-72265421	2026-10-22 12:55:22.655	1	0	4590000.00	0.00	0.00	4590000.00	Da huy	\N	Khách đặt trực tuyến từ trang chi tiết #TOUR-PQ-04	\N	0.00
13	3	3	\N	\N	BK-07742565	2026-10-23 07:21:17.427	19	0	474810000.00	0.00	0.00	474810000.00	Cho thanh toan	\N	Khách đăng ký trực tuyến qua website VietTour	\N	0.00
15	3	19	\N	\N	BK-24235665	2026-10-23 07:40:42.357	3	0	13770000.00	0.00	13770000.00	0.00	Da thanh toan	ZaloPay	Khách đặt trực tuyến từ trang chi tiết #TOUR-PQ-04	\N	0.00
10	3	18	\N	\N	BK-579472	2026-10-16 12:09:39.474	1	0	4590000.00	0.00	0.00	4590000.00	Da huy	\N	Khách đăng ký trực tuyến qua website VietTour\n[QUẢN TRỊ VIÊN HỦY] 14:53 23/10/2026 (bởi admin@viettour.vn) - Lý do: Quá hạn thanh toán tiền cọc theo quy định	\N	0.00
16	1	2	\N	\N	BK-Q1-001	2026-02-15 10:00:00	2	1	14980000.00	0.00	14980000.00	0.00	Da thanh toan	VNPay	\N	\N	0.00
17	2	4	\N	\N	BK-Q1-002	2026-03-08 14:30:00	4	0	17000000.00	0.00	17000000.00	0.00	Da thanh toan	Chuyen khoan	\N	\N	0.00
18	1	5	\N	\N	BK-Q2-001	2026-04-28 09:15:00	2	2	114800000.00	0.00	114800000.00	0.00	Da thanh toan	VNPay	\N	\N	0.00
19	2	6	\N	\N	BK-Q2-002	2026-05-18 16:00:00	3	1	17170000.00	0.00	17170000.00	0.00	Da thanh toan	ZaloPay	\N	\N	0.00
20	1	7	\N	\N	BK-Q2-003	2026-06-12 11:20:00	4	2	31960000.00	0.00	31960000.00	0.00	Da thanh toan	VNPay	\N	\N	0.00
21	2	2	\N	\N	BK-Q3-001	2026-07-20 10:00:00	2	0	11780000.00	0.00	11780000.00	0.00	Da thanh toan	VNPay	\N	\N	0.00
22	1	4	\N	\N	BK-Q3-002	2026-08-15 15:45:00	2	1	10600000.00	0.00	10600000.00	0.00	Da thanh toan	Chuyen khoan	\N	\N	0.00
23	2	5	\N	\N	BK-Q3-003	2026-09-02 08:30:00	2	0	65800000.00	0.00	65800000.00	0.00	Da thanh toan	VNPay	\N	\N	0.00
25	3	19	\N	\N	BK-81937469	2026-10-30 04:16:59.379	1	0	4590000.00	0.00	4590000.00	0.00	Da thanh toan	VNPay	Khách đăng ký trực tuyến qua website VietTour	\N	0.00
14	3	18	\N	\N	BK-88436047	2026-10-23 07:34:44.363	1	0	4590000.00	0.00	0.00	4590000.00	Cho thanh toan	Tien mat	Khách đặt trực tuyến từ trang chi tiết #TOUR-PQ-04\n[ĐĂNG KÝ TIỀN MẶT TẠI QUẦY] 12:07 3/11/2026 - Khách xác nhận nộp tiền mặt tại quầy giao dịch VietTour (App Mobile)	\N	0.00
1	1	1	2	\N	BK-9821	2026-10-06 01:17:14.794436	2	0	11780000.00	0.00	11780000.00	0.00	Da thanh toan	VNPay	\N	\N	0.00
26	3	19	\N	\N	BK-36211426	2026-11-03 03:26:02.125	2	0	9180000.00	918000.00	8262000.00	0.00	Da thanh toan	VNPay	\N	1	918000.00
24	3	19	\N	3	BK-69159620	2026-10-30 04:14:51.604	1	0	4590000.00	229500.00	4360500.00	0.00	Da thanh toan	VNPay	Khách đăng ký trực tuyến qua website VietTour	\N	0.00
27	1	11	2	\N	BK-SP-2026-88	2026-11-03 06:38:20.861	4	2	21200000.00	0.00	21200000.00	0.00	Da thanh toan	VNPay	Đoàn gia đình anh Hùng 6 người (4 NL, 2 TE)	\N	0.00
\.


--
-- Data for Name: hoadon; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hoadon (hoadonid, donhangid, thanhtoanid, sohoadon, tencongty, masothue, diachicongty, ngayxuat, tongtienvat, filehoadonurl) FROM stdin;
\.


--
-- Data for Name: huongdanvien; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.huongdanvien (hdvid, nhanvienid, sothehdv, ngonngu, kinhnghiem, trangthai) FROM stdin;
1	4	HDV-QUOCTE-8891	Anh, Trung	5 năm kinh nghiệm dẫn đoàn Châu Á	San sang
2	5	HDV-QUOCTE-5542	Anh, Nhật	6 năm chuyên tour Nhật Bản & Đông Bắc Á	San sang
3	6	HDV-NOIDIA-3319	Việt, Anh	4 năm chuyên tour Miền Trung & Tây Bắc	Dang di tour
4	7	HDV-QUOCTE-9921	Anh, Pháp	7 năm dẫn tour Di sản & Biển đảo cao cấp	San sang
5	8	HDV-NOIDIA-4488	Việt, Hàn	3 năm chuyên tour Phú Quốc & Miền Tây sông nước	San sang
\.


--
-- Data for Name: khachhang; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.khachhang (khachhangid, taikhoanid, hoten, diachigiaohang, sodienthoai, email, cccd, ngaysinh, gioitinh) FROM stdin;
1	5	Nguyễn Văn Hùng	\N	0908123456	khach.hung@gmail.com	031092008761	1992-05-15	Nam
2	6	Trần Thị Thu Thảo	\N	0912987654	khach.thao@yahoo.com	079188004321	1988-11-20	Nu
3	7	Lương Viễn Đông	\N	0815649330	luongviendong1152011@gmail.com	\N	\N	\N
4	9	Lương Thanh	\N	09081152011	luongthanh1152011@gmail.com	\N	\N	\N
5	14	Test User	\N	0901234567	test@example.com	\N	\N	\N
\.


--
-- Data for Name: lichkhoihanh; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lichkhoihanh (lichid, tourid, malich, ngaykhoihanh, ngayketthuc, sochotoida, sochodadat, giatourkhuyenmai, trangthai) FROM stdin;
2	2	CH-2026-1020	2026-10-20 06:00:00	2026-10-22 17:00:00	25	1	\N	Cho khoi hanh
4	1	LICH-1-OCT15	2026-10-15 07:00:00	2026-10-18 18:00:00	30	9	\N	Cho khoi hanh
5	1	LICH-1-NOV01	2026-11-01 07:00:00	2026-11-04 18:00:00	30	3	\N	Cho khoi hanh
6	1	LICH-1-NOV20	2026-11-20 07:00:00	2026-11-23 18:00:00	30	9	\N	Cho khoi hanh
7	1	LICH-1-DEC05	2026-12-05 07:00:00	2026-12-08 18:00:00	30	2	\N	Cho khoi hanh
9	2	LICH-2-NOV01	2026-11-01 07:00:00	2026-11-04 18:00:00	30	3	\N	Cho khoi hanh
10	2	LICH-2-NOV20	2026-11-20 07:00:00	2026-11-23 18:00:00	30	6	\N	Cho khoi hanh
12	3	LICH-3-OCT15	2026-10-15 07:00:00	2026-10-18 18:00:00	30	3	\N	Cho khoi hanh
13	3	LICH-3-NOV01	2026-11-01 07:00:00	2026-11-04 18:00:00	30	1	\N	Cho khoi hanh
14	3	LICH-3-NOV20	2026-11-20 07:00:00	2026-11-23 18:00:00	30	8	\N	Cho khoi hanh
15	3	LICH-3-DEC05	2026-12-05 07:00:00	2026-12-08 18:00:00	30	5	\N	Cho khoi hanh
16	4	LICH-HL-OCT20	2026-10-20 07:00:00	2026-10-22 17:00:00	25	2	\N	Cho khoi hanh
17	4	LICH-HL-NOV05	2026-11-05 07:00:00	2026-11-07 17:00:00	30	0	\N	Cho khoi hanh
1	1	CH-2026-1015	2026-10-15 07:00:00	2026-10-18 18:00:00	30	10	\N	Cho khoi hanh
8	2	LICH-2-OCT15	2026-10-15 07:00:00	2026-10-18 18:00:00	30	7	\N	Hoan thanh
3	3	CH-2026-1101	2026-11-01 01:00:00	2026-11-06 22:00:00	20	20	\N	Cho khoi hanh
18	5	LICH-PQ-OCT25	2026-10-25 06:00:00	2026-10-28 18:00:00	28	7	\N	Cho khoi hanh
19	5	LICH-PQ-NOV12	2026-11-12 06:00:00	2026-11-15 18:00:00	30	8	\N	Cho khoi hanh
11	2	LICH-2-DEC05	2026-12-05 07:00:00	2026-12-08 18:00:00	30	6	\N	Hoan thanh
20	6	CH-NT-05-NOV	2026-11-15 07:00:00	2026-11-18 18:00:00	28	4	\N	Cho khoi hanh
21	7	CH-DL-06-NOV	2026-11-15 07:00:00	2026-11-18 18:00:00	28	4	\N	Cho khoi hanh
22	8	CH-MT-07-NOV	2026-11-15 07:00:00	2026-11-18 18:00:00	28	4	\N	Cho khoi hanh
23	9	CH-HG-08-NOV	2026-11-15 07:00:00	2026-11-18 18:00:00	28	4	\N	Cho khoi hanh
24	10	CH-KR-09-NOV	2026-11-15 07:00:00	2026-11-18 18:00:00	28	4	\N	Cho khoi hanh
25	11	CH-TH-10-NOV	2026-11-15 07:00:00	2026-11-18 18:00:00	28	4	\N	Cho khoi hanh
\.


--
-- Data for Name: nhacungcap; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nhacungcap (nhacungcapid, tenncc, loaincc, nguoilienhe, sodienthoai, email, diachi, danhgia, masothue, trangthai) FROM stdin;
1	Khách sạn Novotel Đà Nẵng	Khach san	Nguyễn Thị Hương	02363929999	novotel@danang.com	Đà Nẵng	4.90	\N	1
2	Công ty Xe Du Lịch Việt Thanh	Xe van chuyen	Trần Văn Bình	0905888999	vietthanh@transport.vn	Hà Nội	4.70	\N	1
12	Tập đoàn Khách sạn Prince Hotel Japan	Khach san	Kenji Tanaka	0901234567	kenji@princehotels.co.jp	Tokyo, Nhật Bản	4.90	\N	1
13	Công ty Vận tải & Xe Du lịch Hato Bus	Xe van chuyen	Yuki Sato	0902345678	contact@hatobus.co.jp	Tokyo, Nhật Bản	4.80	\N	1
14	Khu nghỉ dưỡng Vinpearl Resort & Spa Phú Quốc	Khach san	Nguyễn Thu Trang	02973550550	res.vprspq@vinpearl.com	Bãi Dài, Phú Quốc	4.90	\N	1
15	Công ty Cáp treo Mặt trời Phú Quốc - Sun World	Khac	Phạm Quốc Hưng	02973847847	honthom@sunworld.vn	An Thới, Phú Quốc	4.85	\N	1
16	Nhà hàng Bếp Miền Trung	Nha hang	Lê Văn Cường	02363889988	bepmientrung@danang.vn	Hải Châu, Đà Nẵng	4.70	\N	1
17	Khách sạn Bamboo Sapa Hotel 4 Sao	Khach san	Hoàng Anh Tuấn	02143871075	bamboosapa@hotel.vn	Thị xã Sa Pa, Lào Cai	4.80	\N	1
18	Công ty Cáp treo Sun World Fansipan Legend	Khac	Trần Đức Hạnh	02143818888	fansipan@sunworld.vn	Sa Pa, Lào Cai	4.80	\N	1
19	Du Thuyền Heritage Bình Chuẩn Vịnh Hạ Long	Khach san	Phạm Quang Minh	02033845845	heritage@halongcruises.vn	Cảng Tuần Châu, Hạ Long	4.80	\N	1
20	Khách sạn Mường Thanh Luxury Nha Trang	Khach san	Đặng Mai Lan	02583898888	nhatrang@muongthanh.vn	Trần Phú, Nha Trang	4.80	\N	1
21	Trung tâm Lặn Biển Nha Trang Coral Diving	Khac	Vũ Trọng Nam	02583526789	diving@nhatrangbay.vn	Cảng Cầu Đá, Nha Trang	4.80	\N	1
22	Khách sạn Colline Đà Lạt 4 Sao	Khach san	Bùi Thanh Thảo	02633665588	colline@dalathotel.vn	Phan Bội Châu, Đà Lạt	4.80	\N	1
23	Khu du lịch Làng Hoa Vạn Thành & Langbiang	Khac	Nguyễn Văn Định	02633822119	langbiang@dalattour.vn	Lạc Dương, Lâm Đồng	4.80	\N	1
24	Khách sạn Vinpearl Cần Thơ 5 Sao	Khach san	Đỗ Hữu Nghĩa	02923761888	cantho@vinpearl.com	Ninh Kiều, Cần Thơ	4.80	\N	1
25	Hợp tác xã Thuyền Du lịch Chợ nổi Cái Răng	Xe van chuyen	Lâm Văn Út	02923838383	cairang@mientaytour.vn	Cái Răng, Cần Thơ	4.80	\N	1
26	Khách sạn Hoa Cương Đồng Văn Hà Giang	Khach san	Giàng A Phố	02193856789	hoacuong@dongvan.vn	Đồng Văn, Hà Giang	4.80	\N	1
27	Đội Thuyền Du lịch Hẻm Tu Sản Sông Nho Quế	Xe van chuyen	Mùa A Vàng	02193789999	nhoque@hagiang.vn	Mèo Vạc, Hà Giang	4.80	\N	1
28	Khách sạn Lotte Hotel Seoul	Khach san	Park Ji-sung	+8227711000	seoul@lottehotel.com	Myeongdong, Seoul	4.80	\N	1
29	Khách sạn The Berkeley Hotel Pratunam Bangkok	Khach san	Somchai Prasert	+6623099999	berkeley@bangkokhotel.th	Pratunam, Bangkok	4.80	\N	1
\.


--
-- Data for Name: nhanvien; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nhanvien (nhanvienid, taikhoanid, hoten, diachi, sodienthoai, email, chucvu, ngayvaolam) FROM stdin;
2	2	Phạm Thu Hà	\N	0901000002	dieuhanh@viettour.vn	Trưởng phòng Điều hành	2023-03-15
3	3	Trần Minh Đức	\N	0901000003	ketoan@viettour.vn	Kế toán trưởng	2023-05-10
4	4	Lê Hoàng Nam	\N	0903112233	hdv.nam@viettour.vn	Hướng dẫn viên	2023-06-01
1	1	Admin	\N	0901000001	admin@viettour.vn	Quản trị viên	2023-01-01
5	10	Trần Thị Tuyết Mai	\N	0903223344	hdv.mai@viettour.vn	Hướng dẫn viên	2023-08-01
6	11	Nguyễn Đăng Khoa	\N	0903334455	hdv.khoa@viettour.vn	Hướng dẫn viên	2023-08-01
7	12	Đỗ Lan Hương	\N	0903445566	hdv.huong@viettour.vn	Hướng dẫn viên	2023-08-01
8	13	Vũ Minh Tuấn	\N	0903556677	hdv.tuan@viettour.vn	Hướng dẫn viên	2023-08-01
\.


--
-- Data for Name: nhatkyguimail; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nhatkyguimail (nhatkyid, loaimail, emailnhan, tieude, trangthai, chitietloi, thamchieu, ngaygui) FROM stdin;
1	REMIND_PAYMENT	luongviendong1152011@gmail.com	[VietTour] Nhắc thanh toán đơn BK-07742565	Thanh cong	\N	BK-07742565	2026-10-30 03:30:42.596
2	REMIND_DEPARTURE	khach.thao@yahoo.com	[VietTour] Còn 3 ngày khởi hành — Nhật Bản: Tokyo - Fuji - Kyoto - Osaka	Thanh cong	\N	BK-9822:D3	2026-10-30 03:30:47.712
3	REMIND_DEPARTURE	khach.hung@gmail.com	[VietTour] Còn 3 ngày khởi hành — Đà Nẵng - Hội An - Bà Nà Hills	Thanh cong	\N	BK-Q2-001:D3	2026-10-30 03:30:57.953
4	REMIND_DEPARTURE	khach.thao@yahoo.com	[VietTour] Còn 3 ngày khởi hành — Đà Nẵng - Hội An - Bà Nà Hills	Thanh cong	\N	BK-Q3-003:D3	2026-10-30 03:31:22.81
5	REVIEW_INVITE	khach.hung@gmail.com	[VietTour] Bạn thấy chuyến Đà Nẵng - Hội An - Bà Nà Hills thế nào?	Thanh cong	\N	BK-864158	2026-10-30 03:31:47.926
6	REVIEW_INVITE	khach.hung@gmail.com	[VietTour] Bạn thấy chuyến Đà Nẵng - Hội An - Bà Nà Hills thế nào?	Thanh cong	\N	BK-946076	2026-10-30 03:32:12.07
7	WELCOME	luongviendong1152011@gmail.com	✈️ Chào mừng bạn đến với VietTour — quà tặng mã giảm giá	Thanh cong	\N	SUB:1	2026-10-30 03:35:01.093
8	WELCOME	luongviendong1152011@gmail.com	[VietTour] Mã giảm giá & Ưu đãi tour đang diễn ra dành cho bạn	Thanh cong	\N	SUB:1:1793334205572	2026-10-30 04:23:34.916
9	REMIND_PAYMENT	luongviendong1152011@gmail.com	[VietTour] Nhắc thanh toán đơn BK-69159620	Thanh cong	\N	BK-69159620	2026-10-30 07:19:07.626
10	WELCOME	luongviendong1152011@gmail.com	[VietTour] Mã giảm giá & Ưu đãi tour đang diễn ra dành cho bạn	Thanh cong	\N	SUB:1:1793345128793	2026-10-30 07:25:34.542
11	REMIND_PAYMENT	luongviendong1152011@gmail.com	[VietTour] Nhắc thanh toán đơn BK-36211426	Thanh cong	\N	BK-36211426	2026-11-03 05:39:25.293
\.


--
-- Data for Name: phanquyen; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.phanquyen (taikhoanid, vaitroid, ngaygan) FROM stdin;
1	1	2026-10-06 01:17:14.786275
2	2	2026-10-06 01:17:14.786275
3	3	2026-10-06 01:17:14.786275
4	4	2026-10-06 01:17:14.786275
5	5	2026-10-06 01:17:14.786275
6	5	2026-10-06 01:17:14.786275
7	5	2026-10-06 02:24:50.76
10	4	2026-10-23 15:51:16.851
11	4	2026-10-23 15:51:16.89
12	4	2026-10-23 15:51:16.918
13	4	2026-10-23 15:51:16.938
14	5	2026-10-23 16:15:42.598
\.


--
-- Data for Name: phieudatdichvu; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.phieudatdichvu (phieudatid, lichid, nhanvienid, nhacungcapid, maphieu, ngaydat, tongtiendichvu, tiendacoc, trangthai, ghichu, hanthanhtoan, sohoadonncc) FROM stdin;
8	1	2	1	PO-DN-2026-001	2026-10-10	13500000.00	13500000.00	NCC xac nhan	3 đêm phòng Deluxe + buffet sáng cho đoàn 6 khách	\N	\N
9	1	2	2	PO-DN-2026-002	2026-10-10	7200000.00	7200000.00	NCC xac nhan	Xe Universe 29 chỗ đưa đón đoàn suốt hành trình 4N3D	\N	\N
10	1	2	16	PO-DN-2026-003	2026-10-11	4500000.00	4500000.00	NCC xac nhan	Set ăn đặc sản Đà Nẵng - Hội An cho đoàn 6 khách	\N	\N
11	3	2	12	PO-TYO-2026-001	2026-10-20	14500000.00	14500000.00	NCC xac nhan	Khách sạn 4 sao Tokyo & Osaka 5 đêm	\N	\N
12	3	2	13	PO-TYO-2026-002	2026-10-20	6800000.00	6800000.00	NCC xac nhan	Xe đưa đón sân bay Haneda, Núi Phú Sĩ và vé Shinkansen	\N	\N
13	18	2	14	PO-PQ-2026-001	2026-10-21	3200000.00	3200000.00	NCC xac nhan	Phòng nghỉ Vinpearl Resort 3 đêm + buffet sáng	\N	\N
14	18	2	15	PO-PQ-2026-002	2026-10-21	1100000.00	1100000.00	NCC xac nhan	Vé cáp treo Hòn Thơm 2 chiều & cano 4 đảo	\N	\N
15	11	2	17	PO-SP-2026-001	2026-11-03	8500000.00	8500000.00	NCC xac nhan	4 phòng Deluxe Mountain View 3 đêm + buffet sáng đặc sản	\N	VAT-PO-SP-2026-001
16	11	2	2	PO-SP-2026-002	2026-11-03	5400000.00	5400000.00	NCC xac nhan	Xe Universe 29 chỗ đưa đón Hà Nội - Sa Pa suốt hành trình	\N	VAT-PO-SP-2026-002
17	11	2	18	PO-SP-2026-003	2026-11-03	4500000.00	4500000.00	NCC xac nhan	Vé cáp treo Fansipan khứ hồi + tàu hỏa leo núi Mường Hoa cho 6 khách	\N	VAT-PO-SP-2026-003
\.


--
-- Data for Name: taikhoan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.taikhoan (taikhoanid, email, matkhauhash, sodienthoai, trangthai, ngaytao, email_verified_at, remember_token) FROM stdin;
3	ketoan@viettour.vn	123456	0901000003	1	2026-10-06 01:17:14.784875	\N	\N
5	khach.hung@gmail.com	123456	0908123456	1	2026-10-06 01:17:14.784875	\N	\N
6	khach.thao@yahoo.com	123456	0912987654	1	2026-10-06 01:17:14.784875	\N	\N
9	luongthanh1152011@gmail.com	123456	09081152011	1	2026-10-06 02:41:56.998	\N	\N
1	admin@viettour.vn	scrypt$41759cacc2bd0f602dd8f0af91a11039$aeefa5aa4e4016037562894b46f25c65c801728e5aa35a1ac4e6799e5589c6a59820df9f06e9af30aff004761e777b26dac8d599632ff49090e0e5809c1e09b8	0901000001	1	2026-10-06 01:17:14.784875	\N	\N
2	dieuhanh@viettour.vn	scrypt$48aff9c8162616a22006efc08ccdadeb$c66ec361f55be5aaf0da48e5817f78efb6fbe757830332961c822a3ea16f235640212c2d805b548e6a02a93fa3d1f99ebdc42de062767440bfb23ed2a017ac78	0901000002	1	2026-10-06 01:17:14.784875	\N	\N
4	hdv.nam@viettour.vn	scrypt$bcad07561a040e91bc9bd02e47e11584$a003e83c99d891cf9ea263929f30a833a816a3024150c1c3ad102a55c14616b97efc1ec4d1f4c5bb9d2c3de841a313c753f954fa9af5f18a6730b3656649dfd7	0903112233	1	2026-10-06 01:17:14.784875	\N	\N
10	hdv.mai@viettour.vn	123456	0903223344	1	2026-10-23 15:51:16.835	\N	\N
11	hdv.khoa@viettour.vn	123456	0903334455	1	2026-10-23 15:51:16.879	\N	\N
12	hdv.huong@viettour.vn	123456	0903445566	1	2026-10-23 15:51:16.912	\N	\N
13	hdv.tuan@viettour.vn	123456	0903556677	1	2026-10-23 15:51:16.934	\N	\N
14	test@example.com	scrypt$52933cd3c9e8a50c084dfb820921b0ac$4669946cceeffe9c0968d9cf8a48bc7d8a23c72a236a24ab93bb53b886ae9ae69cc836bb8e6f0bc85cca0955b51f198af9eac0a39e2f9ee0f6e4bd6023a6d350	0901234567	1	2026-10-23 16:15:42.578	\N	\N
7	luongviendong1152011@gmail.com	scrypt$eeab3565c5477f100434bc394cbc4358$3faf06d74845c352fa504e1b303364f2eea40a000538726b9304ae0b4d8f8712ee22d1211a4c6f3ec6271f797b051eaa7e3cbf8c12b8f5e31199d22a63115384	0815649330	1	2026-10-06 02:24:50.746	\N	\N
\.


--
-- Data for Name: thanhtoan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.thanhtoan (thanhtoanid, donhangid, nhanvienid, magiaodich, sotien, hinhthuctt, ngaythanhtoan, trangthai, ghichu) FROM stdin;
3	9	\N	VQR-53946103	10780000.00	Chuyen khoan	2026-10-08 10:05:46.108	Thanh cong	Thanh toán VietQR Napas 24/7
4	7	\N	VQR-57129987	6290000.00	Chuyen khoan	2026-10-08 10:58:49.988	Thanh cong	Test Sandbox QR
5	15	\N	261023_BK-24235665_1355	13770000.00	ZaloPay	2026-10-23 07:50:53.628	Thanh cong	Thanh toán qua Ví điện tử ZaloPay (Mã GD: 261023_BK-24235665_1355)
6	25	\N	15720013-4879	4590000.00	VNPay	2026-10-30 05:57:14.88	Thanh cong	Thanh toán trực tuyến thành công qua cổng VNPAY. Mã GD: 15720013
7	1	\N	VNP-1793683487614-7623	11780000.00	VNPay	2026-11-03 05:24:47.624	Thanh cong	Thanh toán trực tuyến thành công qua cổng VNPAY. Mã GD: VNP-1793683487614
8	26	\N	15723703-2943	8262000.00	VNPay	2026-11-03 05:56:42.944	Thanh cong	Thanh toán trực tuyến thành công qua cổng VNPAY. Mã GD: 15723703
9	24	\N	15723713-1473	4360500.00	VNPay	2026-11-03 06:05:51.474	Thanh cong	Thanh toán trực tuyến thành công qua cổng VNPAY. Mã GD: 15723713
10	27	\N	VNP-BK-SP-2026-88-001	21200000.00	VNPay	2026-11-03 06:51:19.957	Thanh cong	Thanh toán trực tuyến 100% qua cổng VNPay
\.


--
-- Data for Name: tour; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tour (tourid, danhmucid, nhanvientaoid, matour, tentour, thoigian, diemkhoihanh, diemden, motachitiet, lichtrinh, phongcachtour, phuongtien, gianguoilon, giatreem, phuthuphongdon, hinhanhurl, trangthaiduyet, ngaytao, ngaycapnhat, dichvudikem) FROM stdin;
1	1	2	TOUR-DN-01	Đà Nẵng - Hội An - Bà Nà Hills - Cầu Vàng	4 Ngày 3 Đêm	TP.HCM	Đà Nẵng	Hành trình di sản Miền Trung tuyệt mỹ: chiêm ngưỡng Cầu Vàng Bà Nà Hills bồng bềnh giữa mây, thả đèn hoa đăng lung linh trên sông Hoài Phố cổ Hội An, viếng chùa Linh Ứng Bán đảo Sơn Trà và thư giãn bên bãi biển Mỹ Khê xinh đẹp.	[{"day":1,"title":"Đón sân bay Đà Nẵng – Bán đảo Sơn Trà – Biển Mỹ Khê","detail":"Xe và HDV VietTour đón quý khách tại sân bay Đà Nẵng. Khởi hành tham quan Chùa Linh Ứng trên Bán đảo Sơn Trà, chiêm ngưỡng tượng Phật Bà Quan Âm cao 67m hướng ra biển Đông. Buổi chiều tắm biển Mỹ Khê – một trong sáu bãi biển quyến rũ nhất hành tinh.","image":"/uploads/tours/dn_day1.jpg","highlights":["Sân bay Đà Nẵng","Chùa Linh Ứng Sơn Trà","Biển Mỹ Khê"],"meals":"Ăn trưa đặc sản bánh tráng cuốn thịt heo, Ăn tối hải sản Mỹ Khê"},{"day":2,"title":"Sun World Bà Nà Hills – Kỳ quan Cầu Vàng – Làng Pháp","detail":"Trải nghiệm hệ thống cáp treo đạt nhiều kỷ lục thế giới lên đỉnh Bà Nà. Dạo bước check-in kỳ quan Cầu Vàng được nâng đỡ bởi đôi bàn tay khổng lồ rêu phong. Khám phá Làng Pháp cổ kính, Hầm rượu Debay và công viên giải trí Fantasy Park.","image":"/uploads/tours/dn_day2.jpg","highlights":["Cáp treo Bà Nà","Cầu Vàng","Làng Pháp cổ kính","Fantasy Park"],"meals":"Ăn sáng buffet khách sạn, Ăn trưa buffet Bà Nà 100 món, Ăn tối Cơm niêu Đà Nẵng"},{"day":3,"title":"Ngũ Hành Sơn – Làng đá Non Nước – Phố cổ Hội An lung linh đèn lồng","detail":"Khám phá Ngũ Hành Sơn với động Huyền Không linh thiêng, viếng Chùa Tam Thai. Tham quan Làng đá mỹ nghệ Non Nước hơn 300 năm tuổi. Buổi chiều về Phố cổ Hội An bách bộ qua Chùa Cầu Nhật Bản, nhà cổ Phùng Hưng, hội quán Phúc Kiến, trải nghiệm thả hoa đăng trên sông Hoài thơ mộng.","image":"/uploads/tours/dn_day3.jpg","highlights":["Động Huyền Không Ngũ Hành Sơn","Làng đá Non Nước","Chùa Cầu Hội An","Thả hoa đăng sông Hoài"],"meals":"Ăn sáng khách sạn, Ăn trưa Cơm gà Hội An, Ăn tối Cao lầu & Hoành thánh phố cổ"},{"day":4,"title":"Chợ Hàn – Mua sắm đặc sản Miền Trung – Tiễn sân bay Đà Nẵng","detail":"Tham quan mua sắm tại Chợ Hàn trung tâm Đà Nẵng với đặc sản chả bò, mực một nắng, tré bà Đệ. Check-in Cầu Rồng và Cầu Tình Yêu bên bờ sông Hàn thơ mộng. Xe đưa đoàn ra sân bay Đà Nẵng làm thủ tục về lại điểm xuất phát.","image":"/uploads/tours/dn_day4.jpg","highlights":["Chợ Hàn Đà Nẵng","Cầu Rồng sông Hàn","Tiễn sân bay"],"meals":"Ăn sáng khách sạn, Ăn trưa Mì Quảng ếch trứ danh"}]	\N	Xe du lịch đời mới & Máy bay	5890000.00	3200000.00	0.00	/uploads/tours/danang.jpg	Dang mo ban	2026-10-06 01:17:14.791432	\N	Khách sạn 4-5 sao, Ăn uống trọn gói, Bảo hiểm du lịch 100.000.000 đ
5	4	2	TOUR-PQ-04	Phú Quốc Đảo Ngọc - Grand World - Cáp Treo Hòn Thơm	4 Ngày 3 Đêm	TP.HCM	Phú Quốc	Thiên đường nghỉ dưỡng biển đảo nhiệt đới: trải nghiệm cáp treo vượt biển dài nhất thế giới Hòn Thơm, lặn ngắm san hô tự nhiên tại quần đảo An Thới, check-in "thành phố không ngủ" Grand World và ngắm hoàng hôn Sunset Sanato rực rỡ.	[{"day":1,"title":"Bay Phú Quốc – Sunset Sanato ngắm hoàng hôn – Chợ đêm Dinh Cậu","detail":"Đáp chuyến bay đến sân bay Phú Quốc, xe đưa đoàn về nhận phòng tại Vinpearl Resort Bãi Dài. Buổi chiều check-in Sunset Sanato Beach Club ngắm hoàng hôn rực rỡ bên những bức tượng voi chân dài và đàn cá nghệ thuật. Tối dạo Chợ đêm Dinh Cậu thưởng thức hải sản tươi sống.","image":"/uploads/tours/pq_day1.jpg","highlights":["Sân bay Phú Quốc","Sunset Sanato Beach Club","Chợ đêm Dinh Cậu"],"meals":"Ăn trưa gỏi cá trích trứ danh, Ăn tối hải sản nướng chợ đêm"},{"day":2,"title":"Cáp treo Hòn Thơm 7.899m – Tour Cano 4 Đảo lặn ngắm san hô","detail":"Trải nghiệm cáp treo vượt biển Hòn Thơm dài 7.899m ngắm toàn cảnh vịnh An Thới từ trên cao. Lên cano cao tốc lướt sóng tham quan cụm 4 đảo: Hòn Mây Rút, Hòn Gầm Ghì, Hòn Móng Tay. Lặn ngắm rạn san hô tự nhiên rực rỡ sắc màu.","image":"/uploads/tours/pq_day2.jpg","highlights":["Cáp treo Hòn Thơm 7.899m","Hòn Móng Tay cát trắng","Lặn ngắm san hô Gầm Ghì"],"meals":"Ăn sáng buffet resort, Ăn trưa hải sản trên đảo Mây Rút, Ăn tối Cơm gia đình Nam Bộ"},{"day":3,"title":"Thành phố không ngủ Grand World – Show Tinh Hoa Việt Nam & Kênh Venice","detail":"Khám phá Grand World Phú Quốc: du ngoạn thuyền Gondola trên dòng kênh đào Venice lãng mạn, chiêm ngưỡng công trình Huyền Thoại Tre khổng lồ. Buổi tối thưởng thức đại nhạc kịch thực cảnh Tinh Hoa Việt Nam và show nhạc nước Sắc Màu Venice triệu đô.","image":"/uploads/tours/pq_day3.jpg","highlights":["Kênh đào Venice Grand World","Công trình Nhà Tre Huyền Thoại","Show thực cảnh Tinh Hoa Việt Nam"],"meals":"Ăn sáng resort, Ăn trưa nhà hàng ẩm thực Grand World, Ăn tối Bún Quậy Kiến Xây"},{"day":4,"title":"Nhà thùng nước mắm truyền thống – Vườn tiêu Suối Đá – Tiễn Sân Bay","detail":"Tham quan nhà thùng nước mắm truyền thống hàng trăm năm tuổi Phú Quốc, vườn tiêu Suối Đá bạt ngàn trĩu quả. Mua đặc sản rượu sim, ngọc trai biển làm quà. Xe tiễn quý khách ra sân bay Phú Quốc làm thủ tục về lại TP.HCM.","image":"/uploads/tours/pq_day4.jpg","highlights":["Nhà thùng nước mắm","Vườn tiêu Suối Đá","Tiễn sân bay Phú Quốc"],"meals":"Ăn sáng buffet resort, Ăn trưa nhẹ trước giờ bay"}]	\N	Xe du lịch đời mới & Máy bay	6290000.00	3400000.00	0.00	/uploads/tours/phuquoc.jpg	Dang mo ban	2026-10-06 03:42:58.767	2026-10-23 03:17:56.429	Khách sạn 4-5 sao, Ăn uống trọn gói, Bảo hiểm du lịch 100.000.000 đ
3	2	2	TOUR-TYO-01	Nhật Bản: Tokyo - Núi Phú Sĩ - Cố Đô Kyoto - Osaka	4 Ngày 3 Đêm	TP.HCM	Tokyo	Hành trình cung đường vàng xứ sở Mặt Trời Mọc: chiêm ngưỡng Núi Phú Sĩ biểu tượng thiêng liêng, thăm ngôi chùa cổ nhất Asakusa Sensoji, trải nghiệm tàu cao tốc Shinkansen 300km/h và dạo bước trong rừng trúc cổ tích Arashiyama Kyoto.	[{"day":1,"title":"TP.HCM – Bay đến Tokyo – Khám phá Shibuya & Shinjuku về đêm","detail":"Đoàn tập trung tại sân bay Tân Sơn Nhất đáp chuyến bay đi Tokyo. Đến sân bay Narita, xe đón đoàn tham quan giao lộ nhộn nhịp nhất hành tinh Shibuya Crossing và chụp ảnh tượng chú chó Hachiko trung thành. Buổi tối khám phá khu phố sầm uất Shinjuku.","image":"/uploads/tours/jp_day1.jpg","highlights":["Sân bay Narita","Giao lộ Shibuya Crossing","Tượng chó Hachiko","Shinjuku"],"meals":"Ăn nhẹ trên máy bay, Ăn tối Lẩu Shabu Shabu bò Wagyu trứ danh"},{"day":2,"title":"Chùa cổ Asakusa Sensoji – Tháp Tokyo Skytree – Akihabara","detail":"Viếng Chùa cổ Asakusa Sensoji linh thiêng được xây dựng từ thế kỷ thứ 7. Bách bộ dọc con phố Nakamise mua đồ thủ công truyền thống. Check-in Tháp truyền hình Tokyo Skytree cao nhất thế giới và tham quan thiên đường điện tử Akihabara.","image":"/uploads/tours/jp_day2.jpg","highlights":["Chùa Asakusa Sensoji","Phố cổ Nakamise","Tokyo Skytree","Akihabara"],"meals":"Ăn sáng khách sạn, Ăn trưa Cơm lươn nướng Unagi, Ăn tối Ramen truyền thống Nhật"},{"day":3,"title":"Núi Phú Sĩ Trạm 5 – Làng cổ Oshino Hakkai – Tắm Onsen khoáng nóng","detail":"Xe đưa đoàn lên Trạm 5 Núi Phú Sĩ (tùy điều kiện thời tiết) ngắm toàn cảnh ngoạn mục. Ghé thăm Làng cổ Oshino Hakkai thanh bình dưới chân núi với các hồ nước ngầm trong vắt từ tuyết tan. Trải nghiệm tắm khoáng nóng Onsen phục hồi sức khỏe.","image":"/uploads/tours/jp_day3.jpg","highlights":["Núi Phú Sĩ Trạm 5","Làng cổ Oshino Hakkai hồ tuyết","Tắm khoáng nóng Onsen"],"meals":"Ăn sáng khách sạn, Ăn trưa Set menu ẩm thực Kaiseki Nhật Bản, Ăn tối Buffet cua tuyết"},{"day":4,"title":"Tàu Shinkansen – Cố đô Kyoto – Rừng trúc Arashiyama","detail":"Trải nghiệm tàu cao tốc Shinkansen đạt vận tốc 300km/h đến cố đô Kyoto. Bách bộ dạo rừng trúc Arashiyama xanh mướt ngỡ như lạc vào phim cổ trang, chiêm ngưỡng Cầu Togetsukyo bắc qua sông Oi thơ mộng. Xe đưa đoàn ra sân bay làm thủ tục về Việt Nam.","image":"/uploads/tours/jp_day4.jpg","highlights":["Tàu cao tốc Shinkansen","Rừng trúc Arashiyama","Cầu Togetsukyo Kyoto"],"meals":"Ăn sáng khách sạn, Ăn trưa Bento trên tàu Shinkansen, Ăn tối nhẹ sân bay"}]	\N	Xe du lịch đời mới & Máy bay	32900000.00	24500000.00	0.00	/uploads/tours/tokyo.jpg	Dang mo ban	2026-10-06 01:17:14.791432	\N	Khách sạn 4-5 sao, Ăn uống trọn gói, Bảo hiểm du lịch 100.000.000 đ
2	3	2	TOUR-SP-02	Sa Pa - Đỉnh Fansipan - Bản Cát Cát - Đèo Ô Quy Hồ	3 Ngày 2 Đêm	Hà Nội	Lào Cai	Chinh phục "Nóc nhà Đông Dương" Fansipan 3.143m ngắm biển mây hùng vĩ. Khám phá vẻ đẹp bình yên của Bản Cát Cát với suối Tiên Sa róc rách, săn mây trên Đèo Ô Quy Hồ – một trong Tứ đại đỉnh đèo Việt Nam và thưởng thức lẩu cá hồi Tây Bắc.	[{"day":1,"title":"Hà Nội – Cao tốc Nội Bài Lào Cai – Thị trấn Sa Pa – Bản Cát Cát","detail":"Xe đón quý khách tại Hà Nội, di chuyển trên cao tốc Nội Bài - Lào Cai êm ái ngắm núi rừng Tây Bắc. Đến Sa Pa nhận phòng khách sạn, buổi chiều bách bộ khám phá Bản Cát Cát của người H’Mông, chiêm ngưỡng guồng nước khổng lồ, suối Tiên Sa và những nếp nhà gỗ truyền thống.","image":"/uploads/tours/sp_day1.jpg","highlights":["Bản Cát Cát H’Mông","Thác Tiên Sa","Guồng nước gỗ"],"meals":"Ăn trưa lẩu gà đen nấm rừng, Ăn tối thịt lợn cắp nách nướng than hoa"},{"day":2,"title":"Chinh phục đỉnh Fansipan 3.143m – Sun World Fansipan Legend","detail":"Trải nghiệm cáp treo 3 dây hiện đại nhất thế giới vượt Thung lũng Mường Hoa. Bách bộ qua quần thể tâm linh Đại Tượng Phật A Di Đà bằng đồng, chạm tay vào cột mốc Nóc nhà Đông Dương 3.143m giữa biển mây bồng bềnh kỳ vĩ.","image":"/uploads/tours/sp_day2.jpg","highlights":["Cáp treo Fansipan","Cột mốc Fansipan 3.143m","Đại Phật tượng A Di Đà"],"meals":"Ăn sáng buffet khách sạn, Ăn trưa buffet Fansipan Legend, Ăn tối Lẩu cá hồi Tả Van"},{"day":3,"title":"Đèo Ô Quy Hồ – Cổng trời Sa Pa – Nhà thờ Đá – Trở về Hà Nội","detail":"Chinh phục Đèo Ô Quy Hồ săn mây tại Cổng Trời. Trở về trung tâm thị xã tham quan Nhà thờ Đá Sa Pa cổ kính được xây dựng từ thời Pháp thuộc. Tự do mua quà lưu niệm mận, đào, hạt dẻ nướng. Lên xe khởi hành về lại Hà Nội.","image":"/uploads/tours/sp_day3.jpg","highlights":["Đèo Ô Quy Hồ","Cổng trời săn mây","Nhà thờ Đá Sa Pa"],"meals":"Ăn sáng khách sạn, Ăn trưa đặc sản cơm lam thịt nướng"}]	\N	Xe du lịch đời mới & Máy bay	4250000.00	2100000.00	0.00	/uploads/tours/sapa.jpg	Dang mo ban	2026-10-06 01:17:14.791432	2026-10-23 03:20:34.15	Khách sạn 4-5 sao, Ăn uống trọn gói, Bảo hiểm du lịch 100.000.000 đ
6	4	2	TOUR-NT-05	Nha Trang - VinWonders - Vịnh San Hô - Tháp Bà Ponagar	3 Ngày 2 Đêm	TP.HCM	Nha Trang	Kỳ nghỉ biển rực rỡ tại thành phố vịnh ngọc Nha Trang: vui chơi không giới hạn tại đảo thiên đường VinWonders, lặn biển ngắm rạn san hô đa sắc tại Hòn Mun và chiêm bái di sản tháp gạch Chăm Pa cổ kính Ponagar nghìn năm tuổi.	[{"day":1,"title":"Đón sân bay Cam Ranh – Đảo Hòn Tre – VinWonders Nha Trang","detail":"Đón đoàn tại Cam Ranh, di chuyển theo cung đường biển ngoạn mục về thành phố. Sang đảo Hòn Tre trải nghiệm VinWonders: công viên nước kỷ lục, xem show Tata Show triệu đô và ngắm toàn cảnh vịnh Nha Trang từ Vòng quay mặt trời khổng lồ.","image":"/uploads/tours/nt_day1.jpg","highlights":["Đảo Hòn Tre","VinWonders Nha Trang","Tata Show thực cảnh"],"meals":"Ăn trưa nem nướng Ninh Hòa, Ăn tối hải sản đầm Nha Phu"},{"day":2,"title":"Cano du ngoạn vịnh Nha Trang – Lặn ngắm san hô Hòn Mun – Hòn Một","detail":"Cano cao tốc đưa đoàn ra Vịnh Nha Trang – một trong 29 vịnh biển đẹp nhất thế giới. Lặn biển với bình dưỡng khí ngắm san hô quý hiếm tại Khu bảo tồn Hòn Mun. Thưởng thức tiệc bar nổi trên biển và chèo sup thư giãn tại Bãi Tranh.","image":"/uploads/tours/nt_day2.jpg","highlights":["Khu bảo tồn biển Hòn Mun","Lặn ngắm rạn san hô","Bar nổi trên biển Bãi Tranh"],"meals":"Ăn sáng khách sạn, Ăn trưa hải sản trên bè nổi Làng Chài, Ăn tối Bò nướng Lạc Cảnh"},{"day":3,"title":"Tháp Bà Ponagar – Suối khoáng nóng Tháp Bà – Chợ Đầm","detail":"Chiêm bái quần thể kiến trúc Chăm Pa cổ kính Tháp Bà Ponagar nghìn năm tuổi rêu phong. Ngâm tắm bùn khoáng nóng thiên nhiên phục hồi năng lượng. Ghé Chợ Đầm mua yến sào, chả cá Nha Trang và tiễn đoàn ra sân bay.","image":"/uploads/tours/nt_day3.jpg","highlights":["Quần thể Tháp Bà Ponagar","Tắm bùn khoáng nóng","Chợ Đầm Nha Trang"],"meals":"Ăn sáng khách sạn, Ăn trưa Bún sứa chả cá đặc sản"}]	\N	Xe du lịch đời mới & Máy bay	4890000.00	2450000.00	0.00	/uploads/tours/nhatrang.jpg	Dang mo ban	2026-11-03 06:38:20.749	\N	Khách sạn 4-5 sao, Ăn uống trọn gói, Bảo hiểm du lịch 100.000.000 đ
8	5	2	TOUR-MT-07	Miền Tây: Cần Thơ - Chợ Nổi Cái Răng - Rừng Tràm Trà Sư - Bến Tre	3 Ngày 2 Đêm	TP.HCM	Cần Thơ	Hành trình khám phá văn hóa sông nước miệt vườn Nam Bộ chân chất: len lỏi thuyền ba lá giữa Chợ nổi Cái Răng tấp nập trái cây, chèo xuồng giữa thảm bèo xanh mướt Rừng tràm Trà Sư và thưởng thức đờn ca tài tử tại cồn Bến Tre.	[{"day":1,"title":"TP.HCM – Bến Tre xứ dừa – Thuyền nan rợp bóng dừa nước – Cần Thơ","detail":"Khởi hành từ TP.HCM về Bến Tre. Đi thuyền trên sông Tiền ngắm cù lao Long - Lân - Quy - Phụng. Ngồi thuyền nan ba lá len lỏi trong rạch dừa nước rợp bóng, nếm mật ong hoa nhãn, nghe đờn ca tài tử Nam Bộ và xem lò kẹo dừa truyền thống. Chiều về Tây Đô Cần Thơ.","image":"/uploads/tours/mt_day1.jpg","highlights":["Rạch dừa nước Bến Tre","Thuyền nan ba lá","Lò kẹo dừa truyền thống","Đờn ca tài tử"],"meals":"Ăn trưa cá tai tượng chiên xù cuốn bánh tráng, Ăn tối du thuyền bến Ninh Kiều"},{"day":2,"title":"Chợ nổi Cái Răng tấp nập – Châu Đốc – Rừng tràm Trà Sư mùa nước nổi","detail":"Sáng sớm lên thuyền du ngoạn Chợ nổi Cái Răng – nét sinh hoạt độc đáo trên sông với những cây \\"bẹo\\" treo lủng lẳng dưa hấu, khóm, bưởi. Khởi hành về An Giang khám phá Rừng tràm Trà Sư, ngồi xuồng chèo lướt nhẹ trên thảm bèo xanh bạt ngàn ngắm đàn chim bay lượn.","image":"/uploads/tours/mt_day2.jpg","highlights":["Chợ nổi Cái Răng Cần Thơ","Cây bẹo trên thuyền","Rừng tràm Trà Sư thảm bèo xanh"],"meals":"Ăn sáng hủ tiếu chợ nổi Cái Răng, Ăn trưa gà nướng lá chúc lẩu mắm cá linh"},{"day":3,"title":"Chùa Hang Châu Đốc – Miếu Bà Chúa Xứ Núi Sam – Về lại TP.HCM","detail":"Chiêm bái Miếu Bà Chúa Xứ Núi Sam linh thiêng nổi tiếng nhất Miền Tây, viếng Chùa Hang thanh tịnh. Thưởng thức thốt nốt ngọt mát dọc đường. Khởi hành về TP.HCM kết thúc chuyến hành trình miệt vườn ấm áp tình người.","image":"/uploads/tours/mt_day3.jpg","highlights":["Miếu Bà Chúa Xứ Núi Sam","Chùa Hang Châu Đốc","Về lại TP.HCM"],"meals":"Ăn sáng khách sạn, Ăn trưa bánh xèo bông điên điển giòn rụm"}]	\N	Xe du lịch đời mới & Máy bay	3290000.00	1650000.00	0.00	/uploads/tours/mientay.jpg	Dang mo ban	2026-11-03 06:38:20.773	\N	Khách sạn 4-5 sao, Ăn uống trọn gói, Bảo hiểm du lịch 100.000.000 đ
10	2	2	TOUR-KR-09	Hàn Quốc: Seoul - Đảo Nami - Tháp Namsan - Cung Điện Gyeongbokgung	4 Ngày 3 Đêm	Hà Nội	Seoul	Hành trình xứ sở Kim Chi lãng mạn như phim truyền hình: ngắm hàng cây ngân hạnh vàng rực trên đảo Nami, mặc Hanbok chụp ảnh tại Cung điện Hoàng gia Gyeongbokgung, gắn ổ khóa tình yêu trên Tháp Namsan và shopping sầm uất tại Myeongdong.	[{"day":1,"title":"Hà Nội – Bay đến Seoul Incheon – Tháp Namsan ổ khóa tình yêu","detail":"Đoàn đáp chuyến bay đến Seoul. Xe đón đoàn đến Tháp truyền hình N Seoul Tower ngắm toàn cảnh thành phố hiện đại từ trên cao. Trải nghiệm gắn ổ khóa tình yêu lãng mạn trên sân thượng tháp. Dạo phố đêm Myeongdong thưởng thức ẩm thực đường phố.","image":"/uploads/tours/kr_day1.jpg","highlights":["Sân bay Incheon","Tháp Namsan Tower","Cầu khóa tình yêu","Chợ đêm Myeongdong"],"meals":"Ăn nhẹ trên máy bay, Ăn tối Gà hầm sâm Samgyetang bồi bổ sức khỏe"},{"day":2,"title":"Đảo Nami lãng mạn Bản Tình Ca Mùa Đông – Làng cổ Petite France","detail":"Khởi hành đi Đảo Nami – bối cảnh huyền thoại của bộ phim Bản Tình Ca Mùa Đông. Tản bộ dưới những tán cây thủy sam thẳng tắp thơ mộng. Buổi chiều tham quan Làng Pháp Petite France với những ngôi nhà đầy màu sắc rực rỡ.","image":"/uploads/tours/kr_day2.jpg","highlights":["Đảo Nami lãng mạn","Hàng cây thủy sam thẳng tắp","Làng Pháp Petite France"],"meals":"Ăn sáng buffet khách sạn, Ăn trưa Gà nướng cay Dakgalbi Nami, Ăn tối Thịt nướng Samgyeopsal"},{"day":3,"title":"Cung điện Hoàng Gia Gyeongbokgung – Làng Hanok Bukchon","detail":"Mặc trang phục Hanbok truyền thống hóa thân thành công chúa hoàng tử tham quan Cung điện Gyeongbokgung đồ sộ, xem lễ đổi gác của thị vệ hoàng gia. Bách bộ trong Làng cổ Bukchon Hanok lưu giữ nếp nhà cổ xưa giữa lòng thủ đô Seoul hiện đại.","image":"/uploads/tours/kr_day3.jpg","highlights":["Cung điện Gyeongbokgung","Trang phục Hanbok truyền thống","Làng cổ Bukchon Hanok"],"meals":"Ăn sáng khách sạn, Ăn trưa Cơm trộn Bibimbap niêu đá, Ăn tối Lẩu Bulgogi bò hoàng gia"},{"day":4,"title":"Công viên Everland – Mua sắm trung tâm miễn thuế – Bay về Hà Nội","detail":"Khám phá Everland – công viên giải trí ngoài trời lớn nhất Hàn Quốc với tàu lượn siêu tốc gỗ T-Express và vườn thú hoang dã Safari. Mua sắm sâm chính phủ, mỹ phẩm cao cấp trước khi ra sân bay Incheon đáp chuyến bay về Việt Nam.","image":"/uploads/tours/kr_day4.jpg","highlights":["Công viên Everland","Tàu lượn T-Express","Vườn thú Safari","Tiễn sân bay Incheon"],"meals":"Ăn sáng khách sạn, Ăn trưa voucher tại công viên, Ăn nhẹ sân bay"}]	\N	Xe du lịch đời mới & Máy bay	19890000.00	14900000.00	0.00	/uploads/tours/seoul.jpg	Dang mo ban	2026-11-03 06:38:20.788	\N	Khách sạn 4-5 sao, Ăn uống trọn gói, Bảo hiểm du lịch 100.000.000 đ
11	2	2	TOUR-TH-10	Thái Lan: Bangkok - Pattaya - Đảo San Hô Coral - Chùa Wat Arun	4 Ngày 3 Đêm	TP.HCM	Bangkok	Khám phá "Xứ sở nụ cười" Thái Lan rực rỡ: du thuyền ngắm hoàng hôn chùa bình minh Wat Arun trên sông Chao Phraya, lướt cano can trường khám phá Đảo San hô Koh Larn Pattaya, viếng tượng Phật Bốn Mặt linh thiêng và xem Alcazar Cabaret Show hoành tráng.	[{"day":1,"title":"TP.HCM – Bay đến Bangkok – Du thuyền sông Chao Phraya","detail":"Đoàn đáp chuyến bay đến sân bay Suvarnabhumi Bangkok. Lên du thuyền 5 sao lướt êm đềm trên sông huyền thoại Chao Phraya, ngắm Chùa Bình Minh Wat Arun rực sáng về đêm. Thưởng thức buffet quốc tế và nghe nhạc sống sôi động.","image":"/uploads/tours/th_day1.jpg","highlights":["Sân bay Suvarnabhumi","Sông Chao Phraya","Du thuyền 5 sao đêm Bangkok","Wat Arun rực sáng"],"meals":"Ăn nhẹ máy bay, Ăn tối buffet du thuyền Chao Phraya Princess"},{"day":2,"title":"Hoàng Cung Grand Palace – Chùa Phật Ngọc – Thành phố biển Pattaya","detail":"Chiêm bái Chùa Phật Ngọc Wat Phra Kaew và Hoàng Cung Grand Palace lộng lẫy bằng vàng rực rỡ. Khởi hành về thành phố biển Pattaya náo nhiệt. Tối thưởng thức đại tiệc Alcazar Cabaret Show được dàn dựng công phu đẳng cấp thế giới.","image":"/uploads/tours/th_day2.jpg","highlights":["Hoàng Cung Grand Palace","Chùa Phật Ngọc Wat Phra Kaew","Thành phố biển Pattaya","Alcazar Show"],"meals":"Ăn sáng khách sạn, Ăn trưa lẩu Suki Nhật Bản, Ăn tối hải sản nướng Pattaya"},{"day":3,"title":"Cano cao tốc Đảo Coral – Vườn nhiệt đới Nong Nooch – Núi Phật Vàng","detail":"Lên cano cao tốc vượt sóng ra Đảo San hô Coral (Koh Larn). Nước biển trong vắt như ngọc, tự do tắm biển và trải nghiệm nhảy dù dù kéo, lặn ngắm san hô. Chiều tham quan Vườn nhiệt đới Nong Nooch và chiêm bái tượng Phật dát vàng 130m khắc trên Núi Phật Vàng Trân Bảo Phật Sơn.","image":"/uploads/tours/th_day3.jpg","highlights":["Đảo San hô Koh Larn Coral","Vườn thực vật Nong Nooch","Núi Phật Vàng Khao Chi Chan"],"meals":"Ăn sáng khách sạn, Ăn trưa hải sản trên đảo Coral, Ăn tối tiệc BBQ nướng kiểu Thái"},{"day":4,"title":"Phật Bốn Mặt Erawan – Trung tâm mua sắm IconSiam – Về TP.HCM","detail":"Trở về Bangkok viếng đền thờ Tứ Diện Thần Erawan (Phật Bốn Mặt) linh thiêng nhất xứ sở Chùa Vàng. Thỏa thích mua sắm và thưởng thức chợ nổi trong nhà tại siêu trung tâm thương mại IconSiam. Xe đưa đoàn ra sân bay về lại TP.HCM.","image":"/uploads/tours/th_day4.jpg","highlights":["Phật Bốn Mặt Erawan","Trung tâm thương mại IconSiam","Chợ nổi trong nhà","Về TP.HCM"],"meals":"Ăn sáng khách sạn, Ăn trưa coupon tại Foodcourt IconSiam, Ăn nhẹ sân bay"}]	\N	Xe du lịch đời mới & Máy bay	8990000.00	6500000.00	0.00	/uploads/tours/thailand.jpg	Dang mo ban	2026-11-03 06:38:20.796	\N	Khách sạn 4-5 sao, Ăn uống trọn gói, Bảo hiểm du lịch 100.000.000 đ
4	4	2	TOUR-HL-03	Vịnh Hạ Long - Du Thuyền 5 Sao Heritage - Hang Sửng Sốt	3 Ngày 2 Đêm	Hà Nội	Quảng Ninh	Nghỉ dưỡng thượng lưu trên du thuyền 5 sao đẳng cấp giữa lòng di sản thiên nhiên thế giới Vịnh Hạ Long. Khám phá Hang Sửng Sốt huyền ảo, chinh phục đỉnh đảo Ti Tốp ngắm toàn cảnh vịnh ngọc và chèo kayak xuyên Hang Luồn.	[{"day":1,"title":"Hà Nội – Cảng tàu Tuần Châu – Check-in Du Thuyền 5 Sao – Vịnh Hạ Long","detail":"Đón quý khách tại Hà Nội theo cao tốc đến Cảng quốc tế Tuần Châu. Lên du thuyền 5 sao thưởng thức welcome drink. Du thuyền nhổ neo len lỏi qua hàng nghìn đảo đá vôi kỳ vĩ: Hòn Đỉnh Hương, Hòn Trống Mái. Chiều tham gia Sunset Party trên boong sundeck.","image":"/uploads/tours/hl_day1.jpg","highlights":["Cảng Tuần Châu","Du thuyền 5 sao Heritage","Hòn Trống Mái","Sunset Party"],"meals":"Ăn trưa hải sản tươi sống trên vịnh, Ăn tối tiệc Gala Âu - Á thượng hạng"},{"day":2,"title":"Hang Sửng Sốt – Đảo Ti Tốp ngắm toàn cảnh – Chèo Kayak Hang Luồn","detail":"Buổi sáng tập Taichi trên sundeck đón bình minh vịnh di sản. Khám phá Hang Sửng Sốt – hang động lớn và đẹp nhất Vịnh Hạ Long với hàng ngàn nhũ đá kỳ ảo. Ghé thăm Đảo Ti Tốp tắm biển và leo 400 bậc đá lên đỉnh ngắm 360 độ toàn cảnh vịnh.","image":"/uploads/tours/hl_day2.jpg","highlights":["Hang Sửng Sốt","Đảo Ti Tốp bãi cát trắng","Chèo Kayak Hang Luồn"],"meals":"Ăn sáng buffet du thuyền, Ăn trưa set menu hải sản, Ăn tối BBQ nướng trên vịnh"},{"day":3,"title":"Làng chài nổi Vung Viêng – Vịnh Bái Tử Long – Trở về Hà Nội","detail":"Chèo thuyền nan tham quan Làng chài nổi cổ tích Vung Viêng, tìm hiểu cuộc sống ngư dân trên biển. Du thuyền cập bến Tuần Châu, xe đón đoàn trở về Hà Nội, kết thúc kỳ nghỉ dưỡng 5 sao đáng nhớ.","image":"/uploads/tours/hl_day3.jpg","highlights":["Làng chài Vung Viêng","Vịnh Bái Tử Long hoang sơ","Về lại Hà Nội"],"meals":"Ăn sáng nhẹ, Ăn trưa buffet chia tay tại bến cảng"}]	\N	Xe du lịch đời mới & Máy bay	4890000.00	2500000.00	0.00	/uploads/tours/halong.jpg	Dang mo ban	2026-10-06 03:42:58.733	2026-10-23 03:19:01.555	Khách sạn 4-5 sao, Ăn uống trọn gói, Bảo hiểm du lịch 100.000.000 đ
7	1	2	TOUR-DL-06	Đà Lạt - Thung Lũng Tình Yêu - Đồi Chè Cầu Đất - Đỉnh Langbiang	3 Ngày 2 Đêm	TP.HCM	Lâm Đồng	Xứ sở ngàn hoa lãng mạn giữa cao nguyên sương mù: săn mây đón bình minh tại Đồi chè Cầu Đất, chinh phục đỉnh Langbiang huyền thoại bằng xe Jeep địa hình, dạo bờ Hồ Xuân Hương và ngắm ngàn hoa khoe sắc tại Thung Lũng Tình Yêu.	[{"day":1,"title":"Đón sân bay Liên Khương – Ga Đà Lạt – Hồ Xuân Hương – Chợ Đêm","detail":"Xe đón quý khách tại Liên Khương, vượt Đèo Prenn ngoạn mục lên thành phố sương mù. Tham quan Nhà ga Đà Lạt – công trình đường sắt răng cưa cổ kính nhất Đông Dương. Dạo bước bên bờ Hồ Xuân Hương ngắm hoàng hôn tím và khám phá Chợ đêm Đà Lạt.","image":"/uploads/tours/dl_day1.jpg","highlights":["Ga xe lửa cổ Đà Lạt","Hồ Xuân Hương thơ mộng","Chợ đêm ẩm thực bánh tráng nướng"],"meals":"Ăn trưa cơm niêu Atiso, Ăn tối lẩu gà lá é Tao Ngộ"},{"day":2,"title":"Săn mây Đồi chè Cầu Đất – Xe Jeep đỉnh Langbiang huyền thoại","detail":"Buổi sớm xe đưa đoàn đến Đồi chè Cầu Đất săn mây đón những tia nắng đầu tiên xuyên qua thảm chè xanh mướt. Trải nghiệm xe Jeep leo dốc uốn lượn lên đỉnh Radar Langbiang ở độ cao 2.169m ngắm Suối Vàng Suối Bạc thơ mộng.","image":"/uploads/tours/dl_day2.jpg","highlights":["Săn mây Đồi chè Cầu Đất","Xe Jeep địa hình Langbiang","Suối Vàng Suối Bạc"],"meals":"Ăn sáng khách sạn, Ăn trưa buffet rau không giới hạn Léuda, Ăn tối tiệc nướng BBQ ngói"},{"day":3,"title":"Thung Lũng Tình Yêu – Vườn dâu tây công nghệ cao – Tiễn sân bay","detail":"Khám phá Thung Lũng Tình Yêu thơ mộng với mê cung hoa rực rỡ, hồ Đa Thiện trong xanh. Tự tay hái những quả dâu tây chín mọng tại vườn dâu công nghệ cao. Mua đặc sản mứt dâu, trà Atiso làm quà trước khi ra sân bay.","image":"/uploads/tours/dl_day3.jpg","highlights":["Thung Lũng Tình Yêu","Vườn dâu tây hái tại vườn","Tiễn sân bay Liên Khương"],"meals":"Ăn sáng khách sạn, Ăn trưa lẩu bò ba toa Quán Gỗ"}]	\N	Xe du lịch đời mới & Máy bay	3850000.00	1950000.00	0.00	/uploads/tours/dalat.jpg	Dang mo ban	2026-11-03 06:38:20.762	\N	Khách sạn 4-5 sao, Ăn uống trọn gói, Bảo hiểm du lịch 100.000.000 đ
9	3	2	TOUR-HG-08	Hà Giang - Cột Cờ Lũng Cú - Đèo Mã Pí Lèng - Hẻm Tu Sản	3 Ngày 2 Đêm	Hà Nội	Hà Giang	Hành trình chạm đỉnh địa đầu Tổ quốc hùng vĩ: chinh phục Cột cờ Lũng Cú linh thiêng, vượt Đèo Mã Pí Lèng hiểm trở bậc nhất Việt Nam và ngồi thuyền lướt sóng trên dòng sông Nho Quế xanh như ngọc xuyên hẻm vực Tu Sản sâu nhất Đông Nam Á.	[{"day":1,"title":"Hà Nội – Km0 Hà Giang – Cổng trời Quản Bạ – Núi Đôi Cô Tiên","detail":"Xe đón đoàn tại Hà Nội khởi hành đi Hà Giang. Check-in cột mốc Km0 trung tâm thành phố. Vượt đèo lên Cổng trời Quản Bạ ngắm toàn cảnh thung lũng Tam Sơn và kiệt tác thiên nhiên Núi Đôi Cô Tiên tròn trịa đầy mê hoặc. Nghỉ đêm tại Phố cổ Đồng Văn.","image":"/uploads/tours/hg_day1.jpg","highlights":["Cột mốc Km0 Hà Giang","Cổng trời Quản Bạ","Núi Đôi Cô Tiên","Phố cổ Đồng Văn"],"meals":"Ăn trưa cơm lam gà đồi, Ăn tối thắng dền và lẩu thắng cố rượu ngô men lá"},{"day":2,"title":"Cột cờ Quốc gia Lũng Cú – Dinh Thự Vua Mèo – Đèo Mã Pí Lèng","detail":"Chinh phục Đỉnh Cột cờ Lũng Cú – điểm cực Bắc linh thiêng của Tổ quốc nơi lá cờ 54m2 bay phấp phới. Thăm Dinh thự Vua Mèo Vương Chính Đức với kiến trúc đá tinh xảo kết hợp Trung - Pháp - H’Mông. Vượt Đèo Mã Pí Lèng ngắm toàn cảnh hẻm vực kỳ vĩ.","image":"/uploads/tours/hg_day2.jpg","highlights":["Cột cờ cực Bắc Lũng Cú","Dinh thự Vua Mèo","Đèo Mã Pí Lèng Tứ đại đỉnh đèo"],"meals":"Ăn sáng bánh cuốn phố cổ Đồng Văn, Ăn trưa lợn đen nướng mật ong, Ăn tối BBQ Mèo Vạc"},{"day":3,"title":"Du thuyền Hẻm Tu Sản – Sông Nho Quế xanh ngọc bích – Về Hà Nội","detail":"Xuống bến thuyền sông Nho Quế, ngồi du thuyền len lỏi qua Hẻm vực Tu Sản với vách đá dựng đứng cao hơn 800m. Nước sông xanh biếc như ngọc soi bóng mây trời. Trưa lên xe theo quốc lộ 2 trở về Hà Nội, kết thúc chuyến phiêu lưu Đông Bắc tuyệt vời.","image":"/uploads/tours/hg_day3.jpg","highlights":["Du thuyền Sông Nho Quế","Hẻm vực Tu Sản sâu nhất Đông Nam Á","Về lại Hà Nội"],"meals":"Ăn sáng khách sạn, Ăn trưa cá suối nướng tại Tuyên Quang"}]	\N	Xe du lịch đời mới & Máy bay	4350000.00	2200000.00	0.00	/uploads/tours/hagiang.jpg	Dang mo ban	2026-11-03 06:38:20.781	\N	Khách sạn 4-5 sao, Ăn uống trọn gói, Bảo hiểm du lịch 100.000.000 đ
\.


--
-- Data for Name: vaitro; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vaitro (vaitroid, tenvaitro, mota) FROM stdin;
1	Admin	Quản trị viên hệ thống - toàn quyền
2	Dieu hanh	Nhân viên điều hành tour
3	Ke toan	Nhân viên kế toán
4	HDV	Hướng dẫn viên du lịch
5	Khach hang	Khách du lịch
\.


--
-- Data for Name: voucher; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.voucher (voucherid, mavoucher, tenchuongtrinh, phantramgiam, giamtoida, giatridontoithieu, ngaybatdau, ngayketthuc, trangthai, soluongtoida) FROM stdin;
1	VIETTOUR2026	Ưu đãi Khách hàng Thân thiết VietTour 2026	10.00	1000000.00	3000000.00	2026-01-01	2026-12-31	1	\N
2	BAYHE2026	Khuyến mãi Tour Máy bay Hè Rực Rỡ	15.00	1500000.00	5000000.00	2026-05-01	2026-12-31	1	\N
3	TRIAN500K	Voucher Tri ân Khách hàng Mới	5.00	500000.00	2000000.00	2026-01-01	2026-12-31	1	\N
\.


--
-- Name: apdungctkm_apdungctkmid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.apdungctkm_apdungctkmid_seq', 148, true);


--
-- Name: apdungkhuyenmai_apdungkmid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.apdungkhuyenmai_apdungkmid_seq', 1, false);


--
-- Name: baocaoquyettoan_quyettoanid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.baocaoquyettoan_quyettoanid_seq', 4, true);


--
-- Name: chiphiphatsinh_chiphiid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chiphiphatsinh_chiphiid_seq', 1, false);


--
-- Name: chitietdatdichvu_chitietphieuid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chitietdatdichvu_chitietphieuid_seq', 9, true);


--
-- Name: chitiethanhkhach_chitietid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chitiethanhkhach_chitietid_seq', 40, true);


--
-- Name: chuongtrinhkhuyenmai_ctkmid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chuongtrinhkhuyenmai_ctkmid_seq', 1, true);


--
-- Name: dangkynhantin_dangkyid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dangkynhantin_dangkyid_seq', 1, true);


--
-- Name: danhgia_danhgiaid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.danhgia_danhgiaid_seq', 17, true);


--
-- Name: danhmuctour_danhmucid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.danhmuctour_danhmucid_seq', 10, true);


--
-- Name: dichvunhacungcap_dichvunccid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dichvunhacungcap_dichvunccid_seq', 15, true);


--
-- Name: dieuphoitour_dieuphoiid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dieuphoitour_dieuphoiid_seq', 23, true);


--
-- Name: dondattour_donhangid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dondattour_donhangid_seq', 28, true);


--
-- Name: hoadon_hoadonid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hoadon_hoadonid_seq', 1, false);


--
-- Name: huongdanvien_hdvid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.huongdanvien_hdvid_seq', 5, true);


--
-- Name: khachhang_khachhangid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.khachhang_khachhangid_seq', 5, true);


--
-- Name: khuyenmai_khuyenmaiid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.khuyenmai_khuyenmaiid_seq', 3, true);


--
-- Name: lichkhoihanh_lichid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lichkhoihanh_lichid_seq', 25, true);


--
-- Name: nhacungcap_nhacungcapid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.nhacungcap_nhacungcapid_seq', 29, true);


--
-- Name: nhanvien_nhanvienid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.nhanvien_nhanvienid_seq', 8, true);


--
-- Name: nhatkyguimail_nhatkyid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.nhatkyguimail_nhatkyid_seq', 11, true);


--
-- Name: phieudatdichvu_phieudatid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.phieudatdichvu_phieudatid_seq', 17, true);


--
-- Name: taikhoan_taikhoanid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.taikhoan_taikhoanid_seq', 14, true);


--
-- Name: thanhtoan_thanhtoanid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.thanhtoan_thanhtoanid_seq', 10, true);


--
-- Name: tour_tourid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tour_tourid_seq', 11, true);


--
-- Name: vaitro_vaitroid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vaitro_vaitroid_seq', 10, true);


--
-- Name: apdungctkm apdungctkm_ctkmid_tourid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apdungctkm
    ADD CONSTRAINT apdungctkm_ctkmid_tourid_key UNIQUE (ctkmid, tourid);


--
-- Name: apdungctkm apdungctkm_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apdungctkm
    ADD CONSTRAINT apdungctkm_pkey PRIMARY KEY (apdungctkmid);


--
-- Name: apdungvoucher apdungkhuyenmai_khuyenmaiid_tourid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apdungvoucher
    ADD CONSTRAINT apdungkhuyenmai_khuyenmaiid_tourid_key UNIQUE (voucherid, tourid);


--
-- Name: apdungvoucher apdungkhuyenmai_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apdungvoucher
    ADD CONSTRAINT apdungkhuyenmai_pkey PRIMARY KEY (apdungvoucherid);


--
-- Name: baocaoquyettoan baocaoquyettoan_lichid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baocaoquyettoan
    ADD CONSTRAINT baocaoquyettoan_lichid_key UNIQUE (lichid);


--
-- Name: baocaoquyettoan baocaoquyettoan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baocaoquyettoan
    ADD CONSTRAINT baocaoquyettoan_pkey PRIMARY KEY (quyettoanid);


--
-- Name: chiphiphatsinh chiphiphatsinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chiphiphatsinh
    ADD CONSTRAINT chiphiphatsinh_pkey PRIMARY KEY (chiphiid);


--
-- Name: chitietdatdichvu chitietdatdichvu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitietdatdichvu
    ADD CONSTRAINT chitietdatdichvu_pkey PRIMARY KEY (chitietphieuid);


--
-- Name: chitiethanhkhach chitiethanhkhach_maqrve_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitiethanhkhach
    ADD CONSTRAINT chitiethanhkhach_maqrve_key UNIQUE (maqrve);


--
-- Name: chitiethanhkhach chitiethanhkhach_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitiethanhkhach
    ADD CONSTRAINT chitiethanhkhach_pkey PRIMARY KEY (chitietid);


--
-- Name: chuongtrinhkhuyenmai chuongtrinhkhuyenmai_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chuongtrinhkhuyenmai
    ADD CONSTRAINT chuongtrinhkhuyenmai_pkey PRIMARY KEY (ctkmid);


--
-- Name: dangkynhantin dangkynhantin_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dangkynhantin
    ADD CONSTRAINT dangkynhantin_email_key UNIQUE (email);


--
-- Name: dangkynhantin dangkynhantin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dangkynhantin
    ADD CONSTRAINT dangkynhantin_pkey PRIMARY KEY (dangkyid);


--
-- Name: dangkynhantin dangkynhantin_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dangkynhantin
    ADD CONSTRAINT dangkynhantin_token_key UNIQUE (token);


--
-- Name: danhgia danhgia_khachhangid_donhangid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.danhgia
    ADD CONSTRAINT danhgia_khachhangid_donhangid_key UNIQUE (khachhangid, donhangid);


--
-- Name: danhgia danhgia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.danhgia
    ADD CONSTRAINT danhgia_pkey PRIMARY KEY (danhgiaid);


--
-- Name: danhmuctour danhmuctour_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.danhmuctour
    ADD CONSTRAINT danhmuctour_pkey PRIMARY KEY (danhmucid);


--
-- Name: danhmuctour danhmuctour_tendanhmuc_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.danhmuctour
    ADD CONSTRAINT danhmuctour_tendanhmuc_key UNIQUE (tendanhmuc);


--
-- Name: dichvunhacungcap dichvunhacungcap_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dichvunhacungcap
    ADD CONSTRAINT dichvunhacungcap_pkey PRIMARY KEY (dichvunccid);


--
-- Name: dieuphoitour dieuphoitour_lichid_hdvid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dieuphoitour
    ADD CONSTRAINT dieuphoitour_lichid_hdvid_key UNIQUE (lichid, hdvid);


--
-- Name: dieuphoitour dieuphoitour_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dieuphoitour
    ADD CONSTRAINT dieuphoitour_pkey PRIMARY KEY (dieuphoiid);


--
-- Name: dondattour dondattour_madon_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dondattour
    ADD CONSTRAINT dondattour_madon_key UNIQUE (madon);


--
-- Name: dondattour dondattour_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dondattour
    ADD CONSTRAINT dondattour_pkey PRIMARY KEY (donhangid);


--
-- Name: hoadon hoadon_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hoadon
    ADD CONSTRAINT hoadon_pkey PRIMARY KEY (hoadonid);


--
-- Name: hoadon hoadon_sohoadon_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hoadon
    ADD CONSTRAINT hoadon_sohoadon_key UNIQUE (sohoadon);


--
-- Name: huongdanvien huongdanvien_nhanvienid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.huongdanvien
    ADD CONSTRAINT huongdanvien_nhanvienid_key UNIQUE (nhanvienid);


--
-- Name: huongdanvien huongdanvien_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.huongdanvien
    ADD CONSTRAINT huongdanvien_pkey PRIMARY KEY (hdvid);


--
-- Name: huongdanvien huongdanvien_sothehdv_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.huongdanvien
    ADD CONSTRAINT huongdanvien_sothehdv_key UNIQUE (sothehdv);


--
-- Name: khachhang khachhang_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.khachhang
    ADD CONSTRAINT khachhang_pkey PRIMARY KEY (khachhangid);


--
-- Name: khachhang khachhang_taikhoanid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.khachhang
    ADD CONSTRAINT khachhang_taikhoanid_key UNIQUE (taikhoanid);


--
-- Name: voucher khuyenmai_makhuyenmai_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT khuyenmai_makhuyenmai_key UNIQUE (mavoucher);


--
-- Name: voucher khuyenmai_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT khuyenmai_pkey PRIMARY KEY (voucherid);


--
-- Name: lichkhoihanh lichkhoihanh_malich_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lichkhoihanh
    ADD CONSTRAINT lichkhoihanh_malich_key UNIQUE (malich);


--
-- Name: lichkhoihanh lichkhoihanh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lichkhoihanh
    ADD CONSTRAINT lichkhoihanh_pkey PRIMARY KEY (lichid);


--
-- Name: nhacungcap nhacungcap_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhacungcap
    ADD CONSTRAINT nhacungcap_pkey PRIMARY KEY (nhacungcapid);


--
-- Name: nhanvien nhanvien_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhanvien
    ADD CONSTRAINT nhanvien_pkey PRIMARY KEY (nhanvienid);


--
-- Name: nhanvien nhanvien_taikhoanid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhanvien
    ADD CONSTRAINT nhanvien_taikhoanid_key UNIQUE (taikhoanid);


--
-- Name: nhatkyguimail nhatkyguimail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhatkyguimail
    ADD CONSTRAINT nhatkyguimail_pkey PRIMARY KEY (nhatkyid);


--
-- Name: phanquyen phanquyen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phanquyen
    ADD CONSTRAINT phanquyen_pkey PRIMARY KEY (taikhoanid, vaitroid);


--
-- Name: phieudatdichvu phieudatdichvu_maphieu_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phieudatdichvu
    ADD CONSTRAINT phieudatdichvu_maphieu_key UNIQUE (maphieu);


--
-- Name: phieudatdichvu phieudatdichvu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phieudatdichvu
    ADD CONSTRAINT phieudatdichvu_pkey PRIMARY KEY (phieudatid);


--
-- Name: taikhoan taikhoan_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taikhoan
    ADD CONSTRAINT taikhoan_email_key UNIQUE (email);


--
-- Name: taikhoan taikhoan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taikhoan
    ADD CONSTRAINT taikhoan_pkey PRIMARY KEY (taikhoanid);


--
-- Name: taikhoan taikhoan_sodienthoai_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taikhoan
    ADD CONSTRAINT taikhoan_sodienthoai_key UNIQUE (sodienthoai);


--
-- Name: thanhtoan thanhtoan_magiaodich_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thanhtoan
    ADD CONSTRAINT thanhtoan_magiaodich_key UNIQUE (magiaodich);


--
-- Name: thanhtoan thanhtoan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thanhtoan
    ADD CONSTRAINT thanhtoan_pkey PRIMARY KEY (thanhtoanid);


--
-- Name: tour tour_matour_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour
    ADD CONSTRAINT tour_matour_key UNIQUE (matour);


--
-- Name: tour tour_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour
    ADD CONSTRAINT tour_pkey PRIMARY KEY (tourid);


--
-- Name: vaitro vaitro_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vaitro
    ADD CONSTRAINT vaitro_pkey PRIMARY KEY (vaitroid);


--
-- Name: vaitro vaitro_tenvaitro_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vaitro
    ADD CONSTRAINT vaitro_tenvaitro_key UNIQUE (tenvaitro);


--
-- Name: idx_chiphi_lich; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chiphi_lich ON public.chiphiphatsinh USING btree (lichid);


--
-- Name: idx_chitiethk_don; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chitiethk_don ON public.chitiethanhkhach USING btree (donhangid);


--
-- Name: idx_ctkm_thoigian; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ctkm_thoigian ON public.chuongtrinhkhuyenmai USING btree (ngaybatdau, ngayketthuc);


--
-- Name: idx_danhgia_tour; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_danhgia_tour ON public.danhgia USING btree (tourid);


--
-- Name: idx_dieupho_hdv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dieupho_hdv ON public.dieuphoitour USING btree (hdvid);


--
-- Name: idx_dieupho_lich; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dieupho_lich ON public.dieuphoitour USING btree (lichid);


--
-- Name: idx_don_khachhang; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_don_khachhang ON public.dondattour USING btree (khachhangid);


--
-- Name: idx_don_lich; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_don_lich ON public.dondattour USING btree (lichid);


--
-- Name: idx_don_trangthai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_don_trangthai ON public.dondattour USING btree (trangthaidon);


--
-- Name: idx_lich_ngaykhoihanh; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lich_ngaykhoihanh ON public.lichkhoihanh USING btree (ngaykhoihanh);


--
-- Name: idx_lich_tourid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lich_tourid ON public.lichkhoihanh USING btree (tourid);


--
-- Name: idx_nhatkymail_dedupe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nhatkymail_dedupe ON public.nhatkyguimail USING btree (loaimail, thamchieu, emailnhan);


--
-- Name: idx_nhatkymail_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nhatkymail_ngay ON public.nhatkyguimail USING btree (ngaygui);


--
-- Name: idx_phieu_lich; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phieu_lich ON public.phieudatdichvu USING btree (lichid);


--
-- Name: idx_phieu_ncc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phieu_ncc ON public.phieudatdichvu USING btree (nhacungcapid);


--
-- Name: idx_taikhoan_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_taikhoan_email ON public.taikhoan USING btree (email);


--
-- Name: idx_thanhtoan_don; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thanhtoan_don ON public.thanhtoan USING btree (donhangid);


--
-- Name: idx_tour_danhmuc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tour_danhmuc ON public.tour USING btree (danhmucid);


--
-- Name: idx_tour_trangthai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tour_trangthai ON public.tour USING btree (trangthaiduyet);


--
-- Name: apdungctkm apdungctkm_ctkmid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apdungctkm
    ADD CONSTRAINT apdungctkm_ctkmid_fkey FOREIGN KEY (ctkmid) REFERENCES public.chuongtrinhkhuyenmai(ctkmid) ON DELETE CASCADE;


--
-- Name: apdungctkm apdungctkm_tourid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apdungctkm
    ADD CONSTRAINT apdungctkm_tourid_fkey FOREIGN KEY (tourid) REFERENCES public.tour(tourid) ON DELETE CASCADE;


--
-- Name: apdungvoucher apdungkhuyenmai_khuyenmaiid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apdungvoucher
    ADD CONSTRAINT apdungkhuyenmai_khuyenmaiid_fkey FOREIGN KEY (voucherid) REFERENCES public.voucher(voucherid) ON DELETE CASCADE;


--
-- Name: apdungvoucher apdungkhuyenmai_tourid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apdungvoucher
    ADD CONSTRAINT apdungkhuyenmai_tourid_fkey FOREIGN KEY (tourid) REFERENCES public.tour(tourid) ON DELETE CASCADE;


--
-- Name: baocaoquyettoan baocaoquyettoan_lichid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baocaoquyettoan
    ADD CONSTRAINT baocaoquyettoan_lichid_fkey FOREIGN KEY (lichid) REFERENCES public.lichkhoihanh(lichid);


--
-- Name: baocaoquyettoan baocaoquyettoan_nhanvienduyetid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baocaoquyettoan
    ADD CONSTRAINT baocaoquyettoan_nhanvienduyetid_fkey FOREIGN KEY (nhanvienduyetid) REFERENCES public.nhanvien(nhanvienid);


--
-- Name: baocaoquyettoan baocaoquyettoan_nhanvienlapid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baocaoquyettoan
    ADD CONSTRAINT baocaoquyettoan_nhanvienlapid_fkey FOREIGN KEY (nhanvienlapid) REFERENCES public.nhanvien(nhanvienid);


--
-- Name: chiphiphatsinh chiphiphatsinh_lichid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chiphiphatsinh
    ADD CONSTRAINT chiphiphatsinh_lichid_fkey FOREIGN KEY (lichid) REFERENCES public.lichkhoihanh(lichid) ON DELETE CASCADE;


--
-- Name: chiphiphatsinh chiphiphatsinh_nhanvienid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chiphiphatsinh
    ADD CONSTRAINT chiphiphatsinh_nhanvienid_fkey FOREIGN KEY (nhanvienid) REFERENCES public.nhanvien(nhanvienid) ON DELETE CASCADE;


--
-- Name: chitietdatdichvu chitietdatdichvu_dichvunccid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitietdatdichvu
    ADD CONSTRAINT chitietdatdichvu_dichvunccid_fkey FOREIGN KEY (dichvunccid) REFERENCES public.dichvunhacungcap(dichvunccid);


--
-- Name: chitietdatdichvu chitietdatdichvu_phieudatid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitietdatdichvu
    ADD CONSTRAINT chitietdatdichvu_phieudatid_fkey FOREIGN KEY (phieudatid) REFERENCES public.phieudatdichvu(phieudatid) ON DELETE CASCADE;


--
-- Name: chitiethanhkhach chitiethanhkhach_donhangid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chitiethanhkhach
    ADD CONSTRAINT chitiethanhkhach_donhangid_fkey FOREIGN KEY (donhangid) REFERENCES public.dondattour(donhangid) ON DELETE CASCADE;


--
-- Name: chuongtrinhkhuyenmai chuongtrinhkhuyenmai_nhanvientaoid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chuongtrinhkhuyenmai
    ADD CONSTRAINT chuongtrinhkhuyenmai_nhanvientaoid_fkey FOREIGN KEY (nhanvientaoid) REFERENCES public.nhanvien(nhanvienid) ON DELETE CASCADE;


--
-- Name: danhgia danhgia_donhangid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.danhgia
    ADD CONSTRAINT danhgia_donhangid_fkey FOREIGN KEY (donhangid) REFERENCES public.dondattour(donhangid);


--
-- Name: danhgia danhgia_khachhangid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.danhgia
    ADD CONSTRAINT danhgia_khachhangid_fkey FOREIGN KEY (khachhangid) REFERENCES public.khachhang(khachhangid);


--
-- Name: danhgia danhgia_tourid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.danhgia
    ADD CONSTRAINT danhgia_tourid_fkey FOREIGN KEY (tourid) REFERENCES public.tour(tourid);


--
-- Name: dichvunhacungcap dichvunhacungcap_nhacungcapid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dichvunhacungcap
    ADD CONSTRAINT dichvunhacungcap_nhacungcapid_fkey FOREIGN KEY (nhacungcapid) REFERENCES public.nhacungcap(nhacungcapid) ON DELETE CASCADE;


--
-- Name: dieuphoitour dieuphoitour_hdvid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dieuphoitour
    ADD CONSTRAINT dieuphoitour_hdvid_fkey FOREIGN KEY (hdvid) REFERENCES public.huongdanvien(hdvid);


--
-- Name: dieuphoitour dieuphoitour_lichid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dieuphoitour
    ADD CONSTRAINT dieuphoitour_lichid_fkey FOREIGN KEY (lichid) REFERENCES public.lichkhoihanh(lichid);


--
-- Name: dieuphoitour dieuphoitour_nhanvienid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dieuphoitour
    ADD CONSTRAINT dieuphoitour_nhanvienid_fkey FOREIGN KEY (nhanvienid) REFERENCES public.nhanvien(nhanvienid);


--
-- Name: dondattour dondattour_ctkmid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dondattour
    ADD CONSTRAINT dondattour_ctkmid_fkey FOREIGN KEY (ctkmid) REFERENCES public.chuongtrinhkhuyenmai(ctkmid);


--
-- Name: dondattour dondattour_khachhangid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dondattour
    ADD CONSTRAINT dondattour_khachhangid_fkey FOREIGN KEY (khachhangid) REFERENCES public.khachhang(khachhangid);


--
-- Name: dondattour dondattour_khuyenmaiid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dondattour
    ADD CONSTRAINT dondattour_khuyenmaiid_fkey FOREIGN KEY (voucherid) REFERENCES public.voucher(voucherid);


--
-- Name: dondattour dondattour_lichid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dondattour
    ADD CONSTRAINT dondattour_lichid_fkey FOREIGN KEY (lichid) REFERENCES public.lichkhoihanh(lichid);


--
-- Name: dondattour dondattour_nhanvienxulyid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dondattour
    ADD CONSTRAINT dondattour_nhanvienxulyid_fkey FOREIGN KEY (nhanvienxulyid) REFERENCES public.nhanvien(nhanvienid);


--
-- Name: hoadon hoadon_donhangid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hoadon
    ADD CONSTRAINT hoadon_donhangid_fkey FOREIGN KEY (donhangid) REFERENCES public.dondattour(donhangid);


--
-- Name: hoadon hoadon_thanhtoanid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hoadon
    ADD CONSTRAINT hoadon_thanhtoanid_fkey FOREIGN KEY (thanhtoanid) REFERENCES public.thanhtoan(thanhtoanid);


--
-- Name: huongdanvien huongdanvien_nhanvienid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.huongdanvien
    ADD CONSTRAINT huongdanvien_nhanvienid_fkey FOREIGN KEY (nhanvienid) REFERENCES public.nhanvien(nhanvienid) ON DELETE CASCADE;


--
-- Name: khachhang khachhang_taikhoanid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.khachhang
    ADD CONSTRAINT khachhang_taikhoanid_fkey FOREIGN KEY (taikhoanid) REFERENCES public.taikhoan(taikhoanid) ON DELETE CASCADE;


--
-- Name: lichkhoihanh lichkhoihanh_tourid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lichkhoihanh
    ADD CONSTRAINT lichkhoihanh_tourid_fkey FOREIGN KEY (tourid) REFERENCES public.tour(tourid);


--
-- Name: nhanvien nhanvien_taikhoanid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhanvien
    ADD CONSTRAINT nhanvien_taikhoanid_fkey FOREIGN KEY (taikhoanid) REFERENCES public.taikhoan(taikhoanid) ON DELETE CASCADE;


--
-- Name: phanquyen phanquyen_taikhoanid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phanquyen
    ADD CONSTRAINT phanquyen_taikhoanid_fkey FOREIGN KEY (taikhoanid) REFERENCES public.taikhoan(taikhoanid) ON DELETE CASCADE;


--
-- Name: phanquyen phanquyen_vaitroid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phanquyen
    ADD CONSTRAINT phanquyen_vaitroid_fkey FOREIGN KEY (vaitroid) REFERENCES public.vaitro(vaitroid) ON DELETE CASCADE;


--
-- Name: phieudatdichvu phieudatdichvu_lichid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phieudatdichvu
    ADD CONSTRAINT phieudatdichvu_lichid_fkey FOREIGN KEY (lichid) REFERENCES public.lichkhoihanh(lichid);


--
-- Name: phieudatdichvu phieudatdichvu_nhacungcapid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phieudatdichvu
    ADD CONSTRAINT phieudatdichvu_nhacungcapid_fkey FOREIGN KEY (nhacungcapid) REFERENCES public.nhacungcap(nhacungcapid);


--
-- Name: phieudatdichvu phieudatdichvu_nhanvienid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phieudatdichvu
    ADD CONSTRAINT phieudatdichvu_nhanvienid_fkey FOREIGN KEY (nhanvienid) REFERENCES public.nhanvien(nhanvienid);


--
-- Name: thanhtoan thanhtoan_donhangid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thanhtoan
    ADD CONSTRAINT thanhtoan_donhangid_fkey FOREIGN KEY (donhangid) REFERENCES public.dondattour(donhangid);


--
-- Name: thanhtoan thanhtoan_nhanvienid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thanhtoan
    ADD CONSTRAINT thanhtoan_nhanvienid_fkey FOREIGN KEY (nhanvienid) REFERENCES public.nhanvien(nhanvienid);


--
-- Name: tour tour_danhmucid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour
    ADD CONSTRAINT tour_danhmucid_fkey FOREIGN KEY (danhmucid) REFERENCES public.danhmuctour(danhmucid);


--
-- Name: tour tour_nhanvientaoid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour
    ADD CONSTRAINT tour_nhanvientaoid_fkey FOREIGN KEY (nhanvientaoid) REFERENCES public.nhanvien(nhanvienid);


--
-- PostgreSQL database dump complete
--

\unrestrict tdrL3aTXSEppGMxXmRGJF5dlNZkzKPc8yu4OCnCfyh7NMmqbeLahdpWv0gL66dV

