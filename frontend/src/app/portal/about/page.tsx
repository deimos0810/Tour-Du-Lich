'use client';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerHeader />

      {/* BANNER HEADER */}
      <section style={{
        background: 'linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.88)), url("https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2000&q=85") center/cover no-repeat',
        color: '#FFFFFF',
        padding: '70px 20px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
            VỀ CHÚNG TÔI
          </div>
          <h1 style={{ fontSize: '34px', fontWeight: 800, margin: '0 0 12px', color: '#FFF' }}>
            Công Ty Cổ Phần Du Lịch & Lữ Hành VietTour
          </h1>
          <p style={{ fontSize: '15px', color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
            Hơn 10 năm đồng hành cùng hàng triệu du khách khám phá vẻ đẹp danh lam thắng cảnh Việt Nam và thế giới.
          </p>
        </div>
      </section>

      {/* NỘI DUNG CHÍNH */}
      <main style={{ flex: 1, maxWidth: '1120px', width: '100%', margin: '0 auto', padding: '50px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '50px' }}>
          <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>
              Sứ Mệnh Của VietTour
            </h3>
            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.7, margin: 0 }}>
              VietTour ra đời với khát vọng tôn vinh vẻ đẹp non sông Việt Nam và kết nối những trải nghiệm văn hóa đa dạng trên toàn cầu. Chúng tôi tin rằng mỗi chuyến đi không chỉ là một kỳ nghỉ dưỡng đơn thuần, mà là hành trình làm giàu tâm hồn, gắn kết gia đình và mở rộng chân trời hiểu biết.
            </p>
          </div>

          <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>
              Tầm Nhìn & Giá Trị Cốt Lõi
            </h3>
            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.7, margin: 0 }}>
              Trở thành thương hiệu du lịch lữ hành hàng đầu tại Việt Nam về chất lượng dịch vụ và tính tiên phong số hóa. Chúng tôi cam kết minh bạch chi phí, chuẩn mực dịch vụ hàng không - khách sạn 4-5 sao và lấy sự an toàn, hài lòng của khách hàng làm kim chỉ nam.
            </p>
          </div>
        </div>

        {/* 4 TRỤ CỘT CAM KẾT */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', textAlign: 'center', marginBottom: '30px' }}>
            Cam Kết Dịch Vụ Của VietTour
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0284C7', marginBottom: '6px' }}>Hàng Không & Khách Sạn Cao Cấp</div>
              <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                100% chuyến bay trọn gói cùng các hãng hàng không uy tín, lưu trú resort và khách sạn 4 - 5 sao tiện nghi.
              </p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0284C7', marginBottom: '6px' }}>Bảo Hiểm Du Lịch Trọn Gói</div>
              <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                Bảo hiểm toàn diện tới 100.000.000 VNĐ cho tour nội địa và 1.000.000.000 VNĐ cho tour quốc tế của Bảo Việt/Bảo Minh.
              </p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0284C7', marginBottom: '6px' }}>Số Hóa Vé Điện Tử QR</div>
              <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                Tra cứu, xuất vé và điểm danh check-in tức thì bằng mã QR trên điện thoại di động mà không cần in giấy.
              </p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0284C7', marginBottom: '6px' }}>Đội Ngũ Hướng Dẫn Viên Tận Tâm</div>
              <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                Đội ngũ hướng dẫn viên chuyên nghiệp, am hiểu sâu sắc văn hóa lịch sử và chu đáo chăm sóc khách hàng.
              </p>
            </div>
          </div>
        </div>

        {/* THÔNG TIN DOANH NGHIỆP */}
        <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '30px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Công Ty Cổ Phần Du Lịch & Lữ Hành VietTour</div>
            <div style={{ fontSize: '14px', color: '#475569', marginTop: '6px' }}>
              Trụ sở: Số 40, Đường số 13, KĐT Vạn Phúc, P. Hiệp Bình Phước, TP. Thủ Đức, TP. Hồ Chí Minh
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
              Giấy phép kinh doanh lữ hành quốc tế: 79-1234/2020/TCDL-GP LHQT | MST: 0312345678
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
              Tổng đài: <strong>1900 1234</strong> | Email: <strong>cskh@viettour.vn</strong>
            </div>
          </div>
          <Link
            href="/portal#tours"
            className="btn btn-primary"
            style={{ padding: '12px 24px', background: '#0284C7', borderColor: '#0284C7', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}
          >
            Khám Phá Các Tour Mới Nhất →
          </Link>
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
}
