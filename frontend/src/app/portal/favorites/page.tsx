'use client';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import CustomerAccountLayout from '@/components/customer/CustomerAccountLayout';
import Link from 'next/link';
import { vnd } from '@/lib/ui';
import { Heart, Clock, ArrowRight } from 'lucide-react';

export default function FavoritesPage() {
  const favoriteTours = [
    {
      id: 1,
      name: 'Đà Nẵng - Hội An - Bà Nà Hills',
      time: '4 Ngày 3 Đêm',
      price: 5890000,
      image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=500',
      category: 'Du lịch Miền Trung'
    },
    {
      id: 3,
      name: 'Nhật Bản: Tokyo - Fuji - Kyoto - Osaka',
      time: '6 Ngày 5 Đêm',
      price: 32900000,
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500',
      category: 'Tour Châu Á'
    }
  ];

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerHeader />

      <CustomerAccountLayout>
        <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '8px', border: '1px solid #E4E4E7' }}>
          <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #E4E4E7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Heart size={18} strokeWidth={1.5} style={{ color: '#09090B' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#09090B', margin: 0, letterSpacing: '-0.02em' }}>Tour yêu thích của tôi</h2>
            </div>
            <p style={{ fontSize: '12.5px', color: '#71717A', margin: 0 }}>Danh sách các tour du lịch bạn đã lưu để xem và đặt lại sau</p>
          </div>

          {favoriteTours.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {favoriteTours.map((t) => (
                <div key={t.id} style={{ overflow: 'hidden', border: '1px solid #E4E4E7', borderRadius: '8px', background: '#FFFFFF' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image} alt={t.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ width: 'fit-content', fontSize: '11px', fontWeight: 600, color: '#09090B', background: '#F4F4F5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E4E4E7' }}>
                      {t.category}
                    </span>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#09090B', lineHeight: 1.4, margin: 0 }}>{t.name}</h3>
                    <div style={{ fontSize: '12px', color: '#71717A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} strokeWidth={1.5} />
                      <span>Thời gian: {t.time}</span>
                    </div>
                    <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: '1px solid #F4F4F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#71717A' }}>Giá từ:</div>
                        <strong style={{ color: '#09090B', fontSize: '14px', fontWeight: 700 }}>{vnd(t.price)}</strong>
                      </div>
                      <Link
                        href="/portal"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: '#09090B',
                          color: '#FAFAFA',
                          textDecoration: 'none'
                        }}
                      >
                        <span>Chi tiết</span>
                        <ArrowRight size={12} strokeWidth={1.5} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              Bạn chưa có tour yêu thích nào trong danh sách.
            </div>
          )}
        </div>
      </CustomerAccountLayout>

      <CustomerFooter />
    </div>
  );
}
