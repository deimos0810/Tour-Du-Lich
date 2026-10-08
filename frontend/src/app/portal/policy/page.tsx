'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import Link from 'next/link';

type TabKey = 'booking-cancellation' | 'privacy' | 'insurance' | 'payment-guide' | 'faq';

function PolicyContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>('booking-cancellation');

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabKey;
    if (tabParam && ['booking-cancellation', 'privacy', 'insurance', 'payment-guide', 'faq'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabs: { key: TabKey; title: string; icon: string }[] = [
    { key: 'booking-cancellation', title: 'Quy định đặt & hủy tour', icon: '📋' },
    { key: 'privacy', title: 'Chính sách bảo mật', icon: '🔒' },
    { key: 'insurance', title: 'Bảo hiểm du lịch', icon: '🛡️' },
    { key: 'payment-guide', title: 'Hướng dẫn thanh toán', icon: '💳' },
    { key: 'faq', title: 'Câu hỏi thường gặp (FAQ)', icon: '❓' },
  ];

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerHeader />

      {/* HEADER BANNER */}
      <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '50px 20px', borderBottom: '1px solid #1E293B' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, background: 'rgba(2, 132, 199, 0.2)', color: '#38BDF8', padding: '6px 16px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            TRUNG TÂM PHÁP LÝ & DỊCH VỤ KHÁCH HÀNG
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 900, marginTop: '14px', marginBottom: '8px', color: '#FFF' }}>
            Chính Sách, Quy Định & Hướng Dẫn
          </h1>
          <p style={{ fontSize: '15px', color: '#94A3B8', maxWidth: '680px', margin: '0 auto' }}>
            Minh bạch quyền lợi và cam kết chất lượng dịch vụ lữ hành trọn gói tiêu chuẩn quốc tế của VietTour.
          </p>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: '1180px', width: '100%', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', alignItems: 'flex-start' }}>
          {/* SIDEBAR TABS */}
          <aside style={{ background: '#FFFFFF', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', position: 'sticky', top: '90px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', padding: '8px 12px', letterSpacing: '0.5px' }}>
              Danh Mục Chính Sách
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === t.key ? '#F0F9FF' : 'transparent',
                    color: activeTab === t.key ? '#0284C7' : '#334155',
                    fontWeight: activeTab === t.key ? 800 : 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    borderLeft: activeTab === t.key ? '3px solid #0284C7' : '3px solid transparent',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{t.icon}</span>
                  <span>{t.title}</span>
                </button>
              ))}
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>Cần hỗ trợ trực tiếp?</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#0284C7', marginBottom: '8px' }}>1900 1234</div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Hỗ trợ 24/7 cả ngày lễ Tết</div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <article style={{ background: '#FFFFFF', borderRadius: '20px', padding: '36px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', minHeight: '600px' }}>
            {/* TAB 1: QUY ĐỊNH ĐẶT & HỦY TOUR */}
            {activeTab === 'booking-cancellation' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '28px' }}>📋</span>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', margin: 0 }}>Quy Định Đặt & Hủy Tour Du Lịch</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                  Áp dụng cho tất cả các chương trình du lịch trọn gói trong nước và quốc tế do VietTour tổ chức trong năm 2026.
                </p>

                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginTop: '24px', marginBottom: '10px' }}>1. Quy trình đặt tour & Xác nhận chỗ</h3>
                <ul style={{ color: '#334155', fontSize: '14.5px', lineHeight: 1.8, paddingLeft: '20px' }}>
                  <li>Quý khách có thể đặt chỗ trực tuyến qua website VietTour hoặc liên hệ tổng đài 1900 1234.</li>
                  <li>Khi đặt tour trực tuyến, Quý khách cần điền đầy đủ và chính xác thông tin hành khách (Họ tên đầy đủ và số CCCD 12 số hoặc Hộ chiếu còn hạn trên 6 tháng).</li>
                  <li>Sau khi hoàn tất thanh toán hoặc đặt cọc, hệ thống sẽ tự động xuất <strong>Vé điện tử QR & Thẻ lên tàu (Boarding Pass)</strong> có thể tra cứu và lưu trữ ngay trên website.</li>
                </ul>

                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginTop: '24px', marginBottom: '10px' }}>2. Quy định thanh toán & Đặt cọc</h3>
                <ul style={{ color: '#334155', fontSize: '14.5px', lineHeight: 1.8, paddingLeft: '20px' }}>
                  <li><strong>Tour Trong Nước:</strong> Đặt cọc tối thiểu 50% tổng giá trị tour ngay khi đăng ký. Số tiền còn lại thanh toán trước ngày khởi hành 03 ngày làm việc.</li>
                  <li><strong>Tour Quốc Tế:</strong> Đặt cọc tối thiểu 70% tổng giá trị tour để hoàn tất thủ tục visa và xuất vé máy bay quốc tế. Thanh toán toàn bộ trước khởi hành 07 ngày làm việc.</li>
                </ul>

                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginTop: '24px', marginBottom: '10px' }}>3. Chính sách hoàn tiền khi hủy tour (Khách hàng chủ động hủy)</h3>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', margin: '16px 0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>Thời điểm báo hủy trước khởi hành</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>Phí hủy tour áp dụng</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px' }}>Trước từ 15 ngày trở lên</td>
                        <td style={{ padding: '12px 16px', color: '#16A34A', fontWeight: 700 }}>Miễn phí hủy (Hoàn tiền 100%)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px' }}>Từ 07 đến 14 ngày trước khởi hành</td>
                        <td style={{ padding: '12px 16px', color: '#D97706', fontWeight: 700 }}>Phạt 30% tổng giá trị tour</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px' }}>Từ 03 đến 06 ngày trước khởi hành</td>
                        <td style={{ padding: '12px 16px', color: '#EA580C', fontWeight: 700 }}>Phạt 60% tổng giá trị tour</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 16px' }}>Dưới 03 ngày hoặc vắng mặt không lý do</td>
                        <td style={{ padding: '12px 16px', color: '#DC2626', fontWeight: 700 }}>Phạt 100% tổng giá trị tour</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '16px', marginTop: '20px' }}>
                  <strong style={{ color: '#0369A1', display: 'block', marginBottom: '4px' }}>💡 Hủy do điều kiện bất khả kháng:</strong>
                  <span style={{ fontSize: '13.5px', color: '#0C4A6E', lineHeight: 1.6 }}>
                    Trong trường hợp thiên tai, bão lũ, dịch bệnh hoặc chỉ thị tạm dừng vận chuyển từ Cục Hàng Không / Cơ quan nhà nước, VietTour sẽ hỗ trợ đổi ngày khởi hành miễn phí hoặc hoàn trả toàn bộ số tiền vé sau khi trừ các chi phí dịch vụ thực tế mà bên thứ ba không thể hoàn lại.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: CHÍNH SÁCH BẢO MẬT */}
            {activeTab === 'privacy' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '28px' }}>🔒</span>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', margin: 0 }}>Chính Sách Bảo Mật Thông Tin Khách Hàng</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                  VietTour cam kết bảo vệ toàn vẹn dữ liệu cá nhân của Quý khách tuân theo Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân.
                </p>

                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginTop: '24px', marginBottom: '10px' }}>1. Mục đích thu thập dữ liệu</h3>
                <p style={{ fontSize: '14.5px', color: '#334155', lineHeight: 1.7 }}>
                  Chúng tôi thu thập họ tên, số điện thoại, email, thông tin căn cước công dân (CCCD 12 số) và thông tin thanh toán chỉ nhằm các mục đích:
                </p>
                <ul style={{ color: '#334155', fontSize: '14.5px', lineHeight: 1.8, paddingLeft: '20px' }}>
                  <li>Khai báo danh sách hành khách đi máy bay với Hãng Hàng Không và Cục Hàng Không Việt Nam.</li>
                  <li>Mua bảo hiểm du lịch bắt buộc cho từng hành khách theo đúng quy định luật Lữ hành.</li>
                  <li>Cấp thẻ lên tàu E-Ticket và mã QR điểm danh tự động khi khởi hành.</li>
                  <li>Gửi thông báo cập nhật về thời gian bay, lịch đón tiễn và các cảnh báo thời tiết quan trọng.</li>
                </ul>

                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginTop: '24px', marginBottom: '10px' }}>2. Cam kết không chia sẻ cho bên thứ ba</h3>
                <p style={{ fontSize: '14.5px', color: '#334155', lineHeight: 1.7 }}>
                  VietTour cam kết <strong>tuyệt đối không mua bán, trao đổi hoặc tiết lộ</strong> thông tin cá nhân của khách hàng cho bất kỳ bên thứ ba nào vì mục đích quảng cáo hoặc tiếp thị trái phép. Thông tin thanh toán (thẻ ngân hàng, OTP) được xử lý trực tiếp qua cổng thanh toán VNPay / Napas và không bao giờ lưu trữ trên hệ thống của chúng tôi.
                </p>

                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginTop: '24px', marginBottom: '10px' }}>3. Quyền của chủ thể dữ liệu</h3>
                <p style={{ fontSize: '14.5px', color: '#334155', lineHeight: 1.7 }}>
                  Quý khách có quyền tra cứu, cập nhật thông tin cá nhân trong mục Thông Tin Tài Khoản hoặc yêu cầu xóa dữ liệu hồ sơ bất kỳ lúc nào bằng cách gửi yêu cầu về email: <strong>cskh@viettour.vn</strong>.
                </p>
              </div>
            )}

            {/* TAB 3: BẢO HIỂM DU LỊCH */}
            {activeTab === 'insurance' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '28px' }}>🛡️</span>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', margin: 0 }}>Bảo Hiểm Du Lịch Trọn Gói Cao Cấp</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                  Mọi hành khách tham gia chuyến đi cùng VietTour đều được tự động bảo hiểm bởi Tổng công ty Bảo hiểm Bảo Việt / Bảo Minh.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '24px 0' }}>
                  <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase' }}>TOUR TRONG NƯỚC</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', margin: '6px 0' }}>100.000.000 đ</div>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Mức bồi thường tối đa trên mỗi vụ việc cho một hành khách tham gia tour nội địa.</p>
                  </div>
                  <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#16A34A', textTransform: 'uppercase' }}>TOUR QUỐC TẾ</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', margin: '6px 0' }}>1.000.000.000 đ</div>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Bảo hiểm du lịch quốc tế hỗ trợ y tế khẩn cấp toàn cầu, thất lạc hành lý và hoãn chuyến.</p>
                  </div>
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginTop: '24px', marginBottom: '10px' }}>Phạm vi quyền lợi bảo hiểm:</h3>
                <ul style={{ color: '#334155', fontSize: '14.5px', lineHeight: 1.8, paddingLeft: '20px' }}>
                  <li>Chi trả toàn bộ chi phí cấp cứu, điều trị thương tật và nằm viện trong suốt hành trình tour.</li>
                  <li>Hỗ trợ vận chuyển y tế khẩn cấp hồi hương về nơi cư trú khi có chỉ định của bác sĩ.</li>
                  <li>Bồi thường tổn thất trong trường hợp thất lạc hoặc hư hỏng hành lý ký gửi hàng không.</li>
                  <li>Trợ giúp pháp lý và đại diện dịch vụ khẩn cấp 24/7 ở bất kỳ quốc gia nào.</li>
                </ul>
              </div>
            )}

            {/* TAB 4: HƯỚNG DẪN THANH TOÁN */}
            {activeTab === 'payment-guide' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '28px' }}>💳</span>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', margin: 0 }}>Hướng Dẫn Thanh Toán Trực Tuyến</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                  VietTour hỗ trợ đa dạng phương thức thanh toán an toàn, tức thì và hoàn toàn không mất phí trung gian.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px', color: '#0F172A' }}>Phương thức 1: Cổng thanh toán trực tuyến VNPay</strong>
                    </div>
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                      Hệ thống tự động kết nối trực tiếp đến Cổng thanh toán VNPay. Quý khách có thể sử dụng thẻ ATM nội địa của các ngân hàng Việt Nam hoặc thẻ quốc tế (Visa, MasterCard, JCB) với xác thực OTP bảo mật cao. Sau khi giao dịch hoàn tất, hệ thống tự động xuất Vé điện tử QR Code ngay lập tức.
                    </p>
                  </div>

                  <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px', color: '#0F172A' }}>Phương thức 2: Tiền mặt / Thẻ ngân hàng tại quầy (Giữ chỗ 24h)</strong>
                    </div>
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                      Quý khách chọn hình thức này sẽ được bảo lưu chỗ ngồi trong vòng 24 giờ. Quý khách vui lòng đến trực tiếp Văn phòng VietTour tại Số 40, Đường số 13, KĐT Vạn Phúc, TP. Hồ Chí Minh để thanh toán bằng tiền mặt hoặc quẹt thẻ POS với nhân viên tư vấn trước khi hết hạn giữ chỗ.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: FAQ */}
            {activeTab === 'faq' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '28px' }}>❓</span>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', margin: 0 }}>Câu Hỏi Thường Gặp (FAQ)</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                  Giải đáp các thắc mắc phổ biến nhất của hành khách trước và trong chuyến đi.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    {
                      q: 'Trẻ em đi tour máy bay cần những giấy tờ gì?',
                      a: 'Trẻ em dưới 14 tuổi chưa có CCCD bắt buộc phải có Giấy khai sinh bản chính hoặc bản sao trích lục có dấu đỏ. Đối với tour quốc tế, trẻ em bắt buộc phải có Hộ chiếu riêng còn hạn trên 6 tháng.',
                    },
                    {
                      q: 'Tôi có thể đổi ngày khởi hành sau khi đã đặt tour không?',
                      a: 'Quý khách được đổi ngày khởi hành miễn phí 01 lần nếu thông báo trước ngày khởi hành ít nhất 10 ngày (đối với tour nội địa) và chuyến bay của lịch mới còn chỗ trống.',
                    },
                    {
                      q: 'Vé điện tử QR (E-Ticket) sử dụng như thế nào khi đi tour?',
                      a: 'Sau khi thanh toán thành công, hệ thống cấp một mã đơn và mã QR độc nhất. Khi đến điểm tập kết hoặc sân bay, bạn chỉ cần mở màn hình điện thoại cho Hướng dẫn viên quét mã để check-in tức thì, không cần phải in vé giấy.',
                    },
                    {
                      q: 'Giá tour đã bao gồm tiền tip và các chi phí ăn uống chưa?',
                      a: 'Tất cả các tour trọn gói của VietTour đã bao gồm: Toàn bộ vé máy bay khứ hồi, khách sạn tiêu chuẩn 4-5 sao, các bữa ăn chính theo chương trình, vé tham quan danh lam thắng cảnh và bảo hiểm du lịch trọn gói.',
                    },
                  ].map((item, idx) => (
                    <div key={idx} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '18px 20px', border: '1px solid #E2E8F0' }}>
                      <strong style={{ fontSize: '15px', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                        {idx + 1}. {item.q}
                      </strong>
                      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
}

export default function PolicyPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Đang tải chính sách...</div>}>
      <PolicyContent />
    </Suspense>
  );
}
