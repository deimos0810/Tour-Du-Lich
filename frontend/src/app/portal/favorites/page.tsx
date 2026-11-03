'use client';
import { useState, useEffect, useMemo } from 'react';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import CustomerAccountLayout from '@/components/customer/CustomerAccountLayout';
import Link from 'next/link';
import { useApi, getImageUrl } from '@/lib/api';
import { vnd } from '@/lib/ui';
import { Heart, Clock, MapPin, ArrowRight, Trash2 } from 'lucide-react';

type TourItem = {
  TourID: number;
  MaTour: string;
  TenTour: string;
  ThoiGian: string;
  DiemKhoiHanh?: string | null;
  DiemDen: string;
  GiaNguoiLon: string;
  HinhAnhURL: string | null;
  DanhMuc?: { TenDanhMuc: string };
  KhuyenMai?: {
    PhanTramGiam: number;
    GiaNguoiLonKM: number;
    NgayKetThuc: string;
  } | null;
};

export default function FavoritesPage() {
  const toursApi = useApi<TourItem[]>('/tours');
  const [favoriteIds, setFavoriteIds] = useState<number[]>([1, 3, 5]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('viettour_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFavoriteIds(parsed.map(Number).filter(Boolean));
        }
      }
    } catch {
      // ignore localStorage parse error
    }
  }, []);

  const handleRemoveFavorite = (id: number) => {
    setFavoriteIds((prev) => {
      const next = prev.filter((item) => item !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('viettour_favorites', JSON.stringify(next));
      }
      return next;
    });
  };

  const favoriteTours = useMemo<TourItem[]>(() => {
    const all = toursApi.data ?? [];
    if (all.length > 0) {
      return all.filter((t) => favoriteIds.includes(t.TourID));
    }
    return [
      {
        TourID: 1,
        MaTour: 'TOUR-DN-01',
        TenTour: 'Đà Nẵng - Hội An - Bà Nà Hills',
        ThoiGian: '4 Ngày 3 Đêm',
        DiemKhoiHanh: 'TP.HCM',
        DiemDen: 'Đà Nẵng',
        GiaNguoiLon: '3890000',
        HinhAnhURL: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=500',
        DanhMuc: { TenDanhMuc: 'Du lịch Miền Trung' },
      },
      {
        TourID: 3,
        MaTour: 'TOUR-NB-03',
        TenTour: 'Nhật Bản: Tokyo - Fuji - Kyoto - Osaka',
        ThoiGian: '6 Ngày 5 Đêm',
        DiemKhoiHanh: 'TP.HCM',
        DiemDen: 'Nhật Bản',
        GiaNguoiLon: '32900000',
        HinhAnhURL: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500',
        DanhMuc: { TenDanhMuc: 'Tour Quốc Tế' },
      },
    ].filter((t) => favoriteIds.includes(t.TourID));
  }, [toursApi.data, favoriteIds]);

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerHeader />

      <CustomerAccountLayout>
        <div style={{ background: '#FFFFFF', padding: '24px 28px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Heart size={18} strokeWidth={1.6} style={{ color: '#0F172A' }} />
                <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Tour Yêu Thích Của Tôi</h2>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                Danh sách các hành trình quý khách đã lưu — bấm vào tên tour hoặc nút Chi tiết để xem lịch khởi hành và đặt vé ngay
              </p>
            </div>
            <Link href="/portal" className="btn btn-outline btn-sm" style={{ fontWeight: 600, fontSize: '12.5px', textDecoration: 'none' }}>
              + Khám phá thêm tour
            </Link>
          </div>

          {favoriteTours.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '18px' }}>
              {favoriteTours.map((t) => {
                const km = t.KhuyenMai && new Date(t.KhuyenMai.NgayKetThuc).getTime() > Date.now() ? t.KhuyenMai : null;

                return (
                  <div
                    key={t.TourID}
                    style={{
                      overflow: 'hidden',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      background: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ position: 'relative', height: '165px', overflow: 'hidden' }}>
                      <Link href={`/portal/tours/${t.TourID}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getImageUrl(t.HinhAnhURL) || 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=500'}
                          alt={t.TenTour}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Link>
                      {km && (
                        <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#BE123C', color: '#FFFFFF', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                          GIẢM {km.PhanTramGiam}%
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(t.TourID)}
                        title="Bỏ khỏi danh sách yêu thích"
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.92)',
                          border: '1px solid #E2E8F0',
                          color: '#475569',
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} strokeWidth={1.6} />
                      </button>
                    </div>

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155', background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px' }}>
                          {t.DanhMuc?.TenDanhMuc || 'Tour trọn gói'}
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#64748B' }}>Mã: {t.MaTour}</span>
                      </div>

                      <Link href={`/portal/tours/${t.TourID}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', lineHeight: 1.4, margin: 0 }}>
                          {t.TenTour}
                        </h3>
                      </Link>

                      <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={12} strokeWidth={1.5} />
                          <span>{t.DiemKhoiHanh || 'TP.HCM'} → <strong>{t.DiemDen}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={12} strokeWidth={1.5} />
                          <span>Thời gian: {t.ThoiGian}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Giá trọn gói:</div>
                          {km ? (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                              <strong style={{ color: '#BE123C', fontSize: '15px', fontWeight: 800 }}>{vnd(km.GiaNguoiLonKM)}</strong>
                              <span style={{ fontSize: '11.5px', color: '#94A3B8', textDecoration: 'line-through' }}>{vnd(t.GiaNguoiLon)}</span>
                            </div>
                          ) : (
                            <strong style={{ color: '#0F172A', fontSize: '15px', fontWeight: 800 }}>{vnd(t.GiaNguoiLon)}</strong>
                          )}
                        </div>

                        <Link
                          href={`/portal/tours/${t.TourID}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            padding: '7px 14px',
                            borderRadius: '6px',
                            background: '#0F172A',
                            color: '#FFFFFF',
                            textDecoration: 'none',
                          }}
                        >
                          <span>Chi tiết</span>
                          <ArrowRight size={13} strokeWidth={1.6} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13.5px' }}>
              Danh sách yêu thích đang trống.{' '}
              <Link href="/portal" style={{ color: '#0F172A', fontWeight: 700 }}>
                Khám phá các hành trình đang mở bán →
              </Link>
            </div>
          )}
        </div>
      </CustomerAccountLayout>

      <CustomerFooter />
    </div>
  );
}
