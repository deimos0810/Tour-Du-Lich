'use client';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import CustomerAccountLayout from '@/components/customer/CustomerAccountLayout';
import Link from 'next/link';
import { vnd } from '@/lib/ui';

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
    <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerHeader />

      <CustomerAccountLayout>
        <div className="card" style={{ padding: '28px', borderRadius: '12px' }}>
          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>❤️ Tour yêu thích của tôi</h2>
            <p style={{ fontSize: '13px', color: '#64748B' }}>Danh sách các tour du lịch bạn đã lưu để xem và đặt lại sau</p>
          </div>

          {favoriteTours.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {favoriteTours.map((t) => (
                <div key={t.id} className="card" style={{ overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image} alt={t.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="badge badge-info" style={{ width: 'fit-content', fontSize: '11px' }}>{t.category}</span>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{t.name}</h3>
                    <div style={{ fontSize: '12.5px', color: '#64748B' }}>⏱ Thời gian: {t.time}</div>
                    <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Giá từ:</div>
                        <strong style={{ color: '#0D6EFD', fontSize: '15px' }}>{vnd(t.price)}</strong>
                      </div>
                      <Link href="/portal" className="btn btn-primary btn-sm">Xem chi tiết</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
              Bạn chưa có tour yêu thích nào trong danh sách.
            </div>
          )}
        </div>
      </CustomerAccountLayout>

      <CustomerFooter />
    </div>
  );
}
