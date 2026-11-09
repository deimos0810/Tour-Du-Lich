import type { PrismaClient } from '@prisma/client';
import { hashPassword } from '../common/password.js';

export const RICH_TOURS_CATALOG = [
  {
    TourID: 1,
    DanhMucID: 1,
    NhanVienTaoID: 2,
    MaTour: 'TOUR-DN-01',
    TenTour: 'Đà Nẵng - Hội An - Bà Nà Hills - Cầu Vàng',
    ThoiGian: '4 Ngày 3 Đêm',
    DiemKhoiHanh: 'TP.HCM',
    DiemDen: 'Đà Nẵng',
    MoTaChiTiet:
      'Hành trình di sản miền Trung hấp dẫn: Khám phá bán đảo Sơn Trà, chinh phục đỉnh Bà Nà Hills - Cầu Vàng bàn tay khổng lồ giữa tầng mây, dạo bước phố cổ Hội An rực rỡ đèn lồng và tắm biển Mỹ Khê.',
    LichTrinh: JSON.stringify([
      {
        day: 1,
        title: 'Ngày 1: TP.HCM - Đà Nẵng - Bán Đảo Sơn Trà - Biển Mỹ Khê',
        detail:
          'Đón quý khách tại sân bay Tân Sơn Nhất đáp chuyến bay đi Đà Nẵng. Đến nơi, xe đưa đoàn viếng Chùa Linh Ứng Bãi Bụt trên bán đảo Sơn Trà với tượng Phật Bà Quan Âm cao 67m hướng ra biển Đông. Chiều nhận phòng khách sạn 4 sao và tự do tắm biển Mỹ Khê.',
        image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=900',
        meals: 'Ăn trưa, Ăn tối',
        highlights: ['Chùa Linh Ứng Bán đảo Sơn Trà', 'Tắm biển Mỹ Khê', 'Dạo cầu Tình Yêu & Cá Chép Hóa Rồng'],
      },
      {
        day: 2,
        title: 'Ngày 2: Chinh Phục Đỉnh Bà Nà Hills - Cầu Vàng - Làng Pháp',
        detail:
          'Khởi hành đi khu du lịch Sun World Bà Nà Hills. Quý khách trải nghiệm tuyến cáp treo đạt 4 kỷ lục thế giới, check-in Cầu Vàng nâng đỡ bởi đôi bàn tay khổng lồ, tham quan Vườn hoa Le Jardin D’Amour, Hầm rượu cổ Debay, Làng Pháp cổ kính và vui chơi tại Fantasy Park.',
        image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=900',
        meals: 'Ăn sáng, Buffet trưa Bà Nà, Ăn tối',
        highlights: ['Check-in Cầu Vàng Bà Nà Hills', 'Buffet trưa 5 sao trên đỉnh núi', 'Khu vui chơi giải trí Fantasy Park'],
      },
      {
        day: 3,
        title: 'Ngày 3: Rừng Dừa Bảy Mẫu - Phố Cổ Hội An Đèn Lồng',
        detail:
          'Sáng tham quan Làng đá mỹ nghệ Non Nước - Ngũ Hành Sơn. Tiếp tục đến Rừng dừa Bảy Mẫu Cẩm Thanh trải nghiệm thuyền thúng lắc vui nhộn. Chiều tối bách bộ tham quan Phố cổ Hội An: Chùa Cầu Nhật Bản, Hội quán Phước Kiến, thả hoa đăng trên sông Hoài và thưởng thức đặc sản Cao Lầu.',
        image: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=900',
        meals: 'Ăn sáng, Ăn trưa, Ăn tối đặc sản Hội An',
        highlights: ['Chèo thuyền thúng Rừng dừa Bảy Mẫu', 'Chùa Cầu & Phố đèn lồng Hội An', 'Thưởng thức Cao lầu & Cơm gà phố Hội'],
      },
      {
        day: 4,
        title: 'Ngày 4: Cầu Rồng Sông Hàn - Mua Sắm Chợ Hàn - Tiễn Sân Bay',
        detail:
          'Quý khách dùng điểm tâm sáng tại khách sạn, tự do dạo mát bên bờ sông Hàn, chụp ảnh Cầu Rồng. Đoàn ghé Chợ Hàn mua sắm đặc sản miền Trung (chả bò, mực rim, bánh khô mè) làm quà, sau đó xe tiễn đoàn ra sân bay quốc tế Đà Nẵng bay về TP.HCM.',
        image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=900',
        meals: 'Ăn sáng, Ăn trưa',
        highlights: ['Check-in Cầu Rồng sông Hàn', 'Mua sắm đặc sản Chợ Hàn', 'Tiễn sân bay Đà Nẵng'],
      },
    ]),
    GiaNguoiLon: 5890000,
    GiaTreEm: 3200000,
    PhuThuPhongDon: 1200000,
    HinhAnhURL: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000',
    PhuongTien: 'Máy bay khứ hồi Vietjet / Xe du lịch Universe 45 chỗ đời mới',
    DichVuDiKem:
      'Vé máy bay khứ hồi có 20kg ký gửi\nKhách sạn Novotel 4 sao tiêu chuẩn quốc tế\nĂn uống trọn gói các bữa theo lịch trình\nVé cáp treo Bà Nà Hills và vé tham quan Hội An\nBảo hiểm du lịch mức 120.000.000 VNĐ/vụ',
    TrangThaiDuyet: 'Dang mo ban',
  },
  {
    TourID: 2,
    DanhMucID: 1,
    NhanVienTaoID: 2,
    MaTour: 'TOUR-SP-02',
    TenTour: 'Sapa - Chinh Phục Nóc Nhà Đông Dương Fansipan - Bản Cát Cát',
    ThoiGian: '3 Ngày 2 Đêm',
    DiemKhoiHanh: 'Hà Nội',
    DiemDen: 'Lào Cai',
    MoTaChiTiet:
      'Trải nghiệm mây ngàn Tây Bắc, đi cáp treo 3 dây hiện đại chinh phục đỉnh Fansipan 3.143m, khám phá văn hóa bản làng H’Mông tại Cát Cát và ngắm đèo Ô Quy Hồ hùng vĩ.',
    LichTrinh: JSON.stringify([
      {
        day: 1,
        title: 'Ngày 1: Hà Nội - Cao Tốc Nội Bài Lào Cai - Sapa - Bản Cát Cát',
        detail:
          'Xe Limousine VIP đón đoàn tại Hà Nội khởi hành theo cao tốc Nội Bài – Lào Cai lên thị trấn mờ sương Sapa. Chiều hướng dẫn viên đưa đoàn đi bộ khám phá Bản Cát Cát của người H’Mông, chiêm ngưỡng thác Tiên Sa, guồng nước khổng lồ và ruộng bậc thang thung lũng Mường Hoa.',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=900',
        meals: 'Ăn trưa, Ăn tối lẩu cá tầm',
        highlights: ['Bản cổ Cát Cát người H’Mông', 'Thác Tiên Sa & Thung lũng Mường Hoa', 'Dạo phố đêm Sapa'],
      },
      {
        day: 2,
        title: 'Ngày 2: Cáp Treo Đỉnh Fansipan 3.143m - Đèo Ô Quy Hồ - Cầu Kính',
        detail:
          'Sáng đoàn đi tàu hỏa leo núi Mường Hoa và cáp treo Sun World Fansipan Legend chinh phục Nóc nhà Đông Dương ở độ cao 3.143m, chiêm bái Đại Tượng Phật A Di Đà giữa biển mây. Chiều tham quan Đèo Ô Quy Hồ - một trong tứ đại đỉnh đèo Tây Bắc và thưởng thức lẩu cá hồi.',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900',
        meals: 'Ăn sáng, Ăn trưa buffet, Ăn tối lẩu cá hồi',
        highlights: ['Cột mốc đỉnh Fansipan 3.143m', 'Quần thể tâm linh Bích Vân Thiền Tự', 'Săn mây đỉnh đèo Ô Quy Hồ'],
      },
      {
        day: 3,
        title: 'Ngày 3: Nhà Thờ Đá Sapa - Chợ Phiên Vùng Cao - Hà Nội',
        detail:
          'Sáng quý khách thưởng thức cà phê phố núi, chụp hình tại Nhà thờ Đá Sapa cổ kính xây dựng từ năm 1895 và tự do mua sắm thổ cẩm, hạt dẻ rừng, thảo dược tại Chợ Sapa. Trưa trả phòng, lên xe Limousine trở về Hà Nội.',
        image: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=900',
        meals: 'Ăn sáng, Ăn trưa',
        highlights: ['Check-in Nhà thờ Đá Sapa', 'Mua đặc sản Chợ phiên vùng cao', 'Xe Limousine VIP về Hà Nội'],
      },
    ]),
    GiaNguoiLon: 4250000,
    GiaTreEm: 2100000,
    PhuThuPhongDon: 900000,
    HinhAnhURL: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1000',
    PhuongTien: 'Xe Limousine VIP 18 chỗ ngả lưng cao cấp',
    DichVuDiKem:
      'Xe Limousine đưa đón tận nơi\nKhách sạn 4 sao trung tâm view núi Hàm Rồng\nVé cáp treo Fansipan khứ hồi\nĂn lẩu cá hồi & cá tầm đặc sản Sapa',
    TrangThaiDuyet: 'Dang mo ban',
  },
  {
    TourID: 3,
    DanhMucID: 2,
    NhanVienTaoID: 2,
    MaTour: 'TOUR-TYO-01',
    TenTour: 'Nhật Bản Cung Đường Vàng: Tokyo - Núi Phú Sĩ - Kyoto - Osaka',
    ThoiGian: '6 Ngày 5 Đêm',
    DiemKhoiHanh: 'TP.HCM',
    DiemDen: 'Tokyo',
    MoTaChiTiet:
      'Khám phá trọn vẹn Cung Đường Vàng xứ sở Phù Tang: Thủ đô Tokyo sầm uất, Núi Phú Sĩ biểu tượng thiêng liêng, trải nghiệm tàu siêu tốc Shinkansen 300km/h, cố đô Kyoto cổ kính và thành phố Osaka náo nhiệt.',
    LichTrinh: JSON.stringify([
      {
        day: 1,
        title: 'Ngày 1: TP.HCM - Sân Bay Quốc Tế Narita - Thủ Đô Tokyo',
        detail:
          'Quý khách tập trung tại ga đi quốc tế sân bay Tân Sơn Nhất làm thủ tục chuyến bay thẳng hãng hàng không 5 sao All Nippon Airways (ANA) đi Tokyo. Đến sân bay Narita, xe đón đoàn về trung tâm Tokyo nhận phòng khách sạn nghỉ ngơi.',
        image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=900',
        meals: 'Ăn trên máy bay, Ăn tối',
        highlights: ['Hàng không 5 sao Nhật Bản ANA', 'Khám phá Tokyo về đêm'],
      },
      {
        day: 2,
        title: 'Ngày 2: Chùa Cổ Asakusa Kannon - Tháp Tokyo Skytree - Hoàng Cung',
        detail:
          'Tham quan Chùa Asakusa Kannon (Sensoji) – ngôi chùa cổ nhất Tokyo với chiếc đèn lồng đỏ khổng lồ Kaminarimon, chụp hình Tháp truyền hình Tokyo Skytree cao 634m bên bờ sông Sumida, ngoại thành Hoàng Cung Nhật Bản và mua sắm tại khu phố điện tử Akihabara.',
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900',
        meals: 'Ăn sáng, Ăn trưa Sushi, Ăn tối',
        highlights: ['Chùa cổ Sensoji Asakusa', 'Tháp truyền hình Tokyo Skytree', 'Phố mua sắm Ginza & Akihabara'],
      },
      {
        day: 3,
        title: 'Ngày 3: Núi Phú Sĩ Trạm 5 - Làng Cổ Oshino Hakkai - Tắm Onsen',
        detail:
          'Khởi hành lên Núi Phú Sĩ (Trạm 5 ở độ cao 2.300m) chiêm ngưỡng đỉnh núi phủ tuyết trắng biểu tượng của Nhật Bản. Chiều dạo bước tại ngôi làng cổ Oshino Hakkai yên bình dưới chân núi Phú Sĩ. Tối mặc Yukata và tắm suối khoáng nóng Onsen truyền thống.',
        image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=900',
        meals: 'Ăn sáng, Ăn trưa, Ăn tối Buffet Cua Tuyết',
        highlights: ['Núi Phú Sĩ Trạm 5', 'Làng cổ Oshino Hakkai', 'Tắm khoáng nóng Onsen & Buffet Cua Tuyết'],
      },
      {
        day: 4,
        title: 'Ngày 4: Tàu Siêu Tốc Shinkansen - Cố Đô Kyoto - Chùa Vàng Kinkakuji',
        detail:
          'Trải nghiệm tàu siêu tốc Shinkansen vận tốc 320km/h đến vùng Kansai. Tham quan Cố đô Kyoto: Chùa Thanh Thủy (Kiyomizu-dera), Chùa Gác Vàng Kinkakuji dát vàng lá rực rỡ soi bóng xuống mặt hồ và cổng Torii đỏ tại Đền Fushimi Inari.',
        image: 'https://images.unsplash.com/photo-1478436127897-769e00d0c715?w=900',
        meals: 'Ăn sáng, Ăn trưa, Ăn tối Bò Wagyu',
        highlights: ['Trải nghiệm tàu siêu tốc Shinkansen', 'Chùa Vàng Kinkakuji & Đền Fushimi Inari', 'Thưởng thức thịt bò Wagyu thượng hạng'],
      },
      {
        day: 5,
        title: 'Ngày 5: Lâu Đài Osaka Hùng Vĩ - Phố Ẩm Thực Dotonbori & Shinsaibashi',
        detail:
          'Đoàn khởi hành đi Osaka tham quan và chụp ảnh bên ngoài Lâu đài Osaka nguy nga nằm giữa công viên hào nước cổ kính. Chiều tự do mua sắm và thưởng thức ẩm thực đường phố Takoyaki, Ramen tại thiên đường Shinsaibashi và Dotonbori.',
        image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=900',
        meals: 'Ăn sáng, Ăn trưa, Ăn tối',
        highlights: ['Lâu đài lịch sử Osaka', 'Phố đi bộ Dotonbori & Biển hiệu Glico', 'Mua sắm miễn thuế Shinsaibashi'],
      },
      {
        day: 6,
        title: 'Ngày 6: Sân Bay Quốc Tế Kansai - TP.HCM',
        detail:
          'Sau bữa sáng tại khách sạn, xe đưa đoàn ra sân bay quốc tế Kansai làm thủ tục xuất cảnh và mua sắm tại khu Duty Free. Đáp chuyến bay về lại TP.HCM, kết thúc hành trình Nhật Bản Cung Đường Vàng.',
        image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=900',
        meals: 'Ăn sáng, Ăn trên máy bay',
        highlights: ['Mua sắm miễn thuế sân bay Kansai', 'Bay thẳng về TP.HCM'],
      },
    ]),
    GiaNguoiLon: 32900000,
    GiaTreEm: 24500000,
    PhuThuPhongDon: 5500000,
    HinhAnhURL: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000',
    PhuongTien: 'Hàng không All Nippon Airways (ANA) 5 sao / Tàu Shinkansen',
    DichVuDiKem:
      'Vé máy bay quốc tế khứ hồi\nVisa nhập cảnh Nhật Bản trọn gói\nKhách sạn 4 sao trung tâm, 1 đêm Onsen truyền thống\nTrải nghiệm bò Wagyu nướng và Sushi tươi sống',
    TrangThaiDuyet: 'Dang mo ban',
  },
  {
    TourID: 4,
    DanhMucID: 3,
    NhanVienTaoID: 2,
    MaTour: 'TOUR-HL-03',
    TenTour: 'Hạ Long - Du Thuyền 5 Sao Heritage - Hang Sửng Sốt',
    ThoiGian: '3 Ngày 2 Đêm',
    DiemKhoiHanh: 'Hà Nội',
    DiemDen: 'Quảng Ninh',
    MoTaChiTiet:
      'Hành trình nghỉ dưỡng thượng lưu trên du thuyền 5 sao giữa lòng kỳ quan thiên nhiên thế giới Vịnh Hạ Long, chèo thuyền kayak qua Hang Luồn, khám phá Hang Sửng Sốt và ngắm hoàng hôn trên đảo Ti Tốp.',
    LichTrinh: JSON.stringify([
      {
        day: 1,
        title: 'Ngày 1: Hà Nội - Cảng Quốc Tế Tuần Châu - Du Thuyền 5 Sao Heritage',
        detail:
          'Xe Limousine đón quý khách tại khu phố cổ Hà Nội đi cao tốc Hạ Long. Đến cảng tàu khách quốc tế Tuần Châu, đoàn làm thủ tục lên Du thuyền 5 sao Heritage Cruises, nhận phòng Suite có ban công riêng hướng vịnh và thưởng thức tiệc trà chiều ngắm hoàng hôn.',
        image: 'https://images.unsplash.com/photo-1573270689103-d7a4e42b609a?w=900',
        meals: 'Ăn trưa hải sản, Tiệc tối Fine Dining trên tàu',
        highlights: ['Phòng Suite ban công riêng trên du thuyền 5 sao', 'Hải trình qua Hòn Trống Mái & Đỉnh Hương', 'Tiệc Sunset Party trên Sundeck'],
      },
      {
        day: 2,
        title: 'Ngày 2: Khám Phá Hang Sửng Sốt - Đảo Ti Tốp - Chèo Kayak Hang Luồn',
        detail:
          'Sáng tham quan Hang Sửng Sốt – hang động thạch nhũ lớn và đẹp nhất Vịnh Hạ Long. Chiều tự do chèo thuyền Kayak khám phá Hang Luồn, tắm biển bãi cát trắng mịn tại Đảo Ti Tốp hoặc leo lên đỉnh núi ngắm toàn cảnh vịnh 360 độ. Tối trải nghiệm câu mực đêm.',
        image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=900',
        meals: 'Ăn sáng, Ăn trưa, Tiệc tối BBQ Hải sản',
        highlights: ['Hang Sửng Sốt kỳ vĩ', 'Tắm biển & ngắm toàn cảnh Vịnh từ đỉnh Ti Tốp', 'Chèo Kayak Hang Luồn & Câu mực đêm'],
      },
      {
        day: 3,
        title: 'Ngày 3: Thái Cực Quyền Đón Bình Minh - Làng Ngọc Trai - Hà Nội',
        detail:
          'Đón bình minh giữa biển đảo và tập Thái Cực Quyền trên boong tàu. Đoàn ghé thăm Làng nuôi cấy Ngọc trai Tùng Sâu, dùng bữa Brunch tự chọn trong khi tàu di chuyển về lại cảng Tuần Châu. Xe Limousine đón đoàn trở về Hà Nội.',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900',
        meals: 'Ăn sáng nhẹ, Buffet Brunch trưa',
        highlights: ['Tập Thái Cực Quyền đón bình minh', 'Tham quan Làng Ngọc trai Tùng Sâu', 'Xe Limousine đưa về Hà Nội'],
      },
    ]),
    GiaNguoiLon: 4890000,
    GiaTreEm: 2500000,
    PhuThuPhongDon: 1500000,
    HinhAnhURL: 'https://images.unsplash.com/photo-1573270689103-d7a4e42b609a?w=1000',
    PhuongTien: 'Du thuyền Heritage Cruises 5 sao / Xe đón tiễn Limousine',
    DichVuDiKem:
      'Cabin ban công riêng view trọn vịnh\nTrọn gói các bữa ăn hải sản cao cấp trên du thuyền\nVé tham quan vịnh, Hang Sửng Sốt và chèo kayak miễn phí',
    TrangThaiDuyet: 'Dang mo ban',
  },
  {
    TourID: 5,
    DanhMucID: 3,
    NhanVienTaoID: 2,
    MaTour: 'TOUR-PQ-04',
    TenTour: 'Phú Quốc Đảo Ngọc - Grand World - Cáp Treo Hòn Thơm',
    ThoiGian: '4 Ngày 3 Đêm',
    DiemKhoiHanh: 'TP.HCM',
    DiemDen: 'Phú Quốc',
    MoTaChiTiet:
      'Nghỉ dưỡng thiên đường biển đảo nhiệt đới Phú Quốc, trải nghiệm cáp treo 3 dây vượt biển Hòn Thơm dài nhất thế giới, cano lặn ngắm san hô 4 đảo và khám phá thành phố không ngủ Grand World.',
    LichTrinh: JSON.stringify([
      {
        day: 1,
        title: 'Ngày 1: TP.HCM - Đảo Ngọc Phú Quốc - Hoàng Hôn Sunset Sanato',
        detail:
          'Đón quý khách tại sân bay Tân Sơn Nhất bay thẳng đến Đảo Ngọc Phú Quốc. Xe đưa đoàn nhận phòng Resort 5 sao sát biển, chiều check-in tại bãi biển Sunset Sanato và Cầu Hôn (Kiss Bridge) ngắm hoàng hôn đỏ rực trên biển Tây Nam.',
        image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=900',
        meals: 'Ăn trưa, Ăn tối hải sản Hàm Ninh',
        highlights: ['Nghỉ dưỡng Resort 5 sao bãi biển riêng', 'Check-in hoàng hôn Sunset Sanato & Thị trấn Hoàng Hôn'],
      },
      {
        day: 2,
        title: 'Ngày 2: Cáp Treo Hòn Thơm Vượt Biển - Cano 4 Đảo Lặn Ngắm San Hô',
        detail:
          'Lên cano cao tốc khám phá quần đảo An Thới: Hòn Móng Tay, Hòn Gầm Ghì (lặn ngắm san hô tự nhiên), Hòn Mây Rút. Chiều vui chơi tại Công viên nước Aquatopia và đi Cáp treo Hòn Thơm vượt biển dài gần 8km ngắm toàn cảnh biển đảo từ trên cao.',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900',
        meals: 'Ăn sáng, Buffet trưa Hòn Thơm, Ăn tối',
        highlights: ['Cano 4 đảo & Lặn ngắm san hô', 'Cáp treo vượt biển Hòn Thơm', 'Công viên nước Aquatopia'],
      },
      {
        day: 3,
        title: 'Ngày 3: Vườn Thú Bán Hoang Dã Safari - Thành Phố Không Ngủ Grand World',
        detail:
          'Sáng tham quan Vinpearl Safari – công viên chăm sóc và bảo tồn động vật bán hoang dã lớn nhất Việt Nam với trải nghiệm "nhốt người thả thú". Chiều tối khám phá Grand World Phú Quốc, đi thuyền trên dòng sông Venice và xem show nhạc nước Sắc Màu Venice.',
        image: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=900',
        meals: 'Ăn sáng, Ăn trưa, Ăn tối Gỏi cá trích',
        highlights: ['Trải nghiệm xe bus Vinpearl Safari', 'Khu phố sắc màu sông Venice Grand World', 'Show thực cảnh & Nhạc nước ánh sáng'],
      },
      {
        day: 4,
        title: 'Ngày 4: Chợ Dương Đông - Vườn Tiêu & Ngọc Trai - Tiễn Sân Bay',
        detail:
          'Sáng tự do tắm biển và hồ bơi vô cực tại resort. Đoàn tham quan cơ sở nuôi cấy Ngọc trai Phú Quốc, Nhà thùng nước mắm truyền thống và Vườn tiêu xanh mướt, mua đặc sản tại chợ Dương Đông trước khi ra sân bay về lại TP.HCM.',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900',
        meals: 'Ăn sáng, Ăn trưa',
        highlights: ['Cơ sở Ngọc trai & Nhà thùng nước mắm', 'Mua sắm đặc sản Chợ Dương Đông', 'Bay thẳng về TP.HCM'],
      },
    ]),
    GiaNguoiLon: 6290000,
    GiaTreEm: 3400000,
    PhuThuPhongDon: 1400000,
    HinhAnhURL: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1000',
    PhuongTien: 'Máy bay khứ hồi Vietnam Airlines / Xe du lịch đời mới + Cano',
    DichVuDiKem:
      'Resort 5 sao có bãi biển riêng\nVé cáp treo Hòn Thơm & buffet trưa 3 miền\nVé tham quan Grand World và Cano 4 đảo lặn san hô',
    TrangThaiDuyet: 'Dang mo ban',
  },
  {
    TourID: 6,
    DanhMucID: 4,
    NhanVienTaoID: 2,
    MaTour: 'TOUR-HUE-05',
    TenTour: 'Cố Đô Huế - Đại Nội Kinh Thành - Động Phong Nha Kỳ Quan',
    ThoiGian: '4 Ngày 3 Đêm',
    DiemKhoiHanh: 'TP.HCM',
    DiemDen: 'Huế',
    MoTaChiTiet:
      'Hành trình tìm về cội nguồn Di sản Văn hóa và Thiên nhiên Thế giới UNESCO tại miền Trung: Tham quan Đại Nội Kinh Thành Huế, Lăng Khải Định, Chùa Thiên Mụ, nghe Ca Huế trên sông Hương và khám phá Động Phong Nha kỳ vĩ.',
    LichTrinh: JSON.stringify([
      {
        day: 1,
        title: 'Ngày 1: TP.HCM - Cố Đô Huế - Đại Nội Kinh Thành - Chùa Thiên Mụ',
        detail:
          'Đón quý khách tại sân bay Tân Sơn Nhất bay đi Phú Bài (Huế). Chiều tham quan Đại Nội Huế (Hoàng Thành của 13 vị vua triều Nguyễn) với Ngọ Môn, Điện Thái Hòa, Thế Miếu, Hiển Lâm Các và viếng Chùa Thiên Mụ cổ kính bên bờ sông Hương thơ mộng.',
        image: 'https://images.unsplash.com/photo-1583417267826-aebc4d1542e1?w=900',
        meals: 'Ăn trưa, Ăn tối Cơm Cung Đình Huế',
        highlights: ['Quần thể di tích Đại Nội Kinh Thành Huế', 'Chùa Thiên Mụ bên dòng sông Hương', 'Dạ tiệc Cơm Vua Cung Đình Huế'],
      },
      {
        day: 2,
        title: 'Ngày 2: Thánh Địa La Vang - Di Sản Thiên Nhiên Động Phong Nha',
        detail:
          'Khởi hành đi Quảng Bình, dừng chân chụp ảnh tại Thánh Địa La Vang và Vĩ tuyến 17 Cầu Hiền Lương – Sông Bến Hải. Chiều ngồi thuyền ngược dòng sông Son vào khám phá Động Phong Nha với Hang Bi Ký, Cô Tiên và Cung Đình rực rỡ thạch nhũ.',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900',
        meals: 'Ăn sáng, Ăn trưa, Ăn tối',
        highlights: ['Du thuyền sông Son khám phá Động Phong Nha', 'Di tích Cầu Hiền Lương - Sông Bến Hải', 'Thánh địa La Vang'],
      },
      {
        day: 3,
        title: 'Ngày 3: Lăng Khải Định - Lăng Tự Đức - Làng Hương Thủy Xuân - Ca Huế',
        detail:
          'Tham quan Lăng Khải Định với nghệ thuật khảm sành sứ tinh xảo bậc nhất, Lăng Tự Đức hữu tình và check-in Làng hương truyền thống Thủy Xuân rực rỡ sắc màu. Tối xuống thuyền Rồng thưởng thức Nhã nhạc Cung đình & thả hoa đăng trên sông Hương.',
        image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=900',
        meals: 'Ăn sáng, Ăn trưa, Ăn tối Bánh Huế',
        highlights: ['Kiến trúc khảm sứ Lăng Khải Định', 'Check-in Làng hương Thủy Xuân', 'Nghe Ca Huế trên thuyền Rồng sông Hương'],
      },
      {
        day: 4,
        title: 'Ngày 4: Cầu Trường Tiền - Mua Sắm Chợ Đông Ba - Tiễn Sân Bay',
        detail:
          'Sáng thưởng thức Bún bò Huế chính gốc, dạo bước bên Cầu Trường Tiền và mua sắm mè xửng, tôm chua, nón bài thơ tại Chợ Đông Ba. Trưa xe đưa đoàn ra sân bay Phú Bài đáp chuyến bay về lại TP.HCM.',
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900',
        meals: 'Ăn sáng Bún bò Huế, Ăn trưa',
        highlights: ['Dạo Cầu Trường Tiền', 'Mua sắm đặc sản Chợ Đông Ba', 'Bay thẳng Phú Bài - TP.HCM'],
      },
    ]),
    GiaNguoiLon: 5490000,
    GiaTreEm: 2950000,
    PhuThuPhongDon: 1100000,
    HinhAnhURL: 'https://images.unsplash.com/photo-1583417267826-aebc4d1542e1?w=1000',
    PhuongTien: 'Máy bay khứ hồi Vietnam Airlines / Xe du lịch 45 chỗ đời mới',
    DichVuDiKem:
      'Vé máy bay khứ hồi TP.HCM - Huế\nKhách sạn 4 sao trung tâm bên bờ sông Hương\nVé tham quan Đại Nội, Lăng Khải Định & thuyền Động Phong Nha\nVé thuyền Rồng nghe Ca Huế trên sông Hương',
    TrangThaiDuyet: 'Dang mo ban',
  },
  {
    TourID: 7,
    DanhMucID: 3,
    NhanVienTaoID: 2,
    MaTour: 'TOUR-NTDL-06',
    TenTour: 'Nha Trang - Đà Lạt: Giao Hòa Biển Xanh & Thành Phố Ngàn Hoa',
    ThoiGian: '4 Ngày 3 Đêm',
    DiemKhoiHanh: 'TP.HCM',
    DiemDen: 'Nha Trang - Đà Lạt',
    MoTaChiTiet:
      'Sự kết hợp hoàn hảo giữa thiên đường vịnh biển Nha Trang nắng vàng cát trắng với cao nguyên Đà Lạt mộng mơ se lạnh ngàn hoa trong cùng một hành trình nghỉ dưỡng 4 sao.',
    LichTrinh: JSON.stringify([
      {
        day: 1,
        title: 'Ngày 1: TP.HCM - Phố Biển Nha Trang - Tháp Bà Ponagar - Tắm Bùn Khoáng',
        detail:
          'Đón quý khách tại sân bay Tân Sơn Nhất bay đến sân bay Cam Ranh (Nha Trang). Xe đưa đoàn tham quan Tháp Bà Ponagar – quần thể kiến trúc Chăm Pa cổ kính, danh thắng Hòn Chồng và thư giãn tắm bùn khoáng nóng I-Resort.',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900',
        meals: 'Ăn trưa, Ăn tối Nem nướng & Hải sản',
        highlights: ['Tháp Bà Ponagar & Hòn Chồng', 'Tắm bùn khoáng nóng cao cấp', 'Dạo biển Trần Phú Nha Trang'],
      },
      {
        day: 2,
        title: 'Ngày 2: Du Ngoạn Vịnh Nha Trang - Đảo Hòn Mun - VinWonders Hòn Tre',
        detail:
          'Sáng lên cano tham quan Vịnh Nha Trang – một trong 29 vịnh biển đẹp nhất thế giới, tắm biển và ngắm san hô tại Hòn Mun – Bãi Tranh. Chiều trải nghiệm cáp treo vượt biển sang đảo Hòn Tre vui chơi tại VinWonders Nha Trang và xem Tata Show.',
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900',
        meals: 'Ăn sáng, Ăn trưa trên đảo, Ăn tối',
        highlights: ['Cano Vịnh Nha Trang & Đảo Hòn Mun', 'Khu giải trí VinWonders Hòn Tre', 'Xem siêu phẩm thực cảnh Tata Show'],
      },
      {
        day: 3,
        title: 'Ngày 3: Nha Trang - Đèo Khánh Lê - Thành Phố Ngàn Hoa Đà Lạt',
        detail:
          'Khởi hành chinh phục cung đường đèo Khánh Lê nối biển và hoa để lên cao nguyên Đà Lạt. Đến Đà Lạt, đoàn check-in Quảng trường Lâm Viên (nụ hoa Atiso khổng lồ bên Hồ Xuân Hương), Nhà thờ Domain De Marie và săn mây tại Đồi chè Cầu Đất.',
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900',
        meals: 'Ăn sáng, Ăn trưa, Ăn tối Buffet Rau Không Giới Hạn',
        highlights: ['Quảng trường Lâm Viên & Hồ Xuân Hương', 'Đồi chè Cầu Đất xanh ngát', 'Thưởng thức Buffet Lẩu Rau Đà Lạt & Chợ đêm'],
      },
      {
        day: 4,
        title: 'Ngày 4: Thiền Viện Trúc Lâm - Thác Datanla - Tiễn Sân Bay Liên Khương',
        detail:
          'Sáng viếng Thiền Viện Trúc Lâm bên Hồ Tuyền Lâm thơ mộng, trải nghiệm xe trượt thác Datanla xuyên rừng thông và mua sắm dâu tây tươi, mứt đặc sản tại Chợ Đà Lạt. Chiều ra sân bay Liên Khương đáp chuyến bay về lại TP.HCM.',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900',
        meals: 'Ăn sáng, Ăn trưa',
        highlights: ['Thiền Viện Trúc Lâm - Hồ Tuyền Lâm', 'Trải nghiệm máng trượt Thác Datanla', 'Bay Liên Khương về TP.HCM'],
      },
    ]),
    GiaNguoiLon: 5690000,
    GiaTreEm: 3100000,
    PhuThuPhongDon: 1200000,
    HinhAnhURL: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1000',
    PhuongTien: 'Máy bay khứ hồi + Xe du lịch Universe 45 chỗ đời mới',
    DichVuDiKem:
      'Vé máy bay khứ hồi (Bay đến Cam Ranh - Bay về từ Liên Khương)\nKhách sạn 4 sao trung tâm Nha Trang & Đà Lạt\nVé cano Vịnh Nha Trang, tắm bùn khoáng & vé tham quan Đà Lạt',
    TrangThaiDuyet: 'Dang mo ban',
  },
  {
    TourID: 8,
    DanhMucID: 4,
    NhanVienTaoID: 2,
    MaTour: 'TOUR-NB-07',
    TenTour: 'Hà Nội - Ninh Bình - Danh Thắng Tràng An - Chùa Bái Đính - Hang Múa',
    ThoiGian: '3 Ngày 2 Đêm',
    DiemKhoiHanh: 'Hà Nội',
    DiemDen: 'Ninh Bình',
    MoTaChiTiet:
      'Khám phá quần thể Di sản Thế giới kép Tràng An – Ninh Bình: Ngồi đò chèo xuôi dòng sông Ngô Đồng xuyên qua các hang động đá vôi huyền ảo, chiêm bái đại tự Chùa Bái Đính và chinh phục đỉnh Ngọa Long – Hang Múa.',
    LichTrinh: JSON.stringify([
      {
        day: 1,
        title: 'Ngày 1: Hà Nội 36 Phố Phường - Hồ Hoàn Kiếm - Văn Miếu Quốc Tử Giám',
        detail:
          'Đón quý khách tại Hà Nội, tham quan Hồ Hoàn Kiếm, Đền Ngọc Sơn, Cầu Thê Húc, Chùa Trấn Quốc bên Hồ Tây và Văn Miếu Quốc Tử Giám – trường đại học đầu tiên của Việt Nam. Tối thưởng thức Chả cá Lã Vọng và dạo phố cổ Hà Nội.',
        image: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=900',
        meals: 'Ăn trưa, Ăn tối Chả cá Lã Vọng',
        highlights: ['Hồ Gươm & Đền Ngọc Sơn', 'Văn Miếu Quốc Tử Giám', 'Ẩm thực 36 Phố phường Hà Nội'],
      },
      {
        day: 2,
        title: 'Ngày 2: Cố Đô Hoa Lư - Quần Thể Danh Thắng Tràng An - Chùa Bái Đính',
        detail:
          'Xe Limousine đưa đoàn về Ninh Bình viếng Cố đô Hoa Lư (Đền Vua Đinh, Vua Lê) và Chùa Bái Đính với tượng Phật bằng đồng lớn nhất Đông Nam Á. Chiều xuống thuyền nan xuôi dòng nước trong vắt khám phá Quần thể danh thắng Tràng An qua 9 hang động xuyên thủy.',
        image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=900',
        meals: 'Ăn sáng, Ăn trưa Dê núi Ninh Bình, Ăn tối',
        highlights: ['Đi thuyền nan Danh thắng Tràng An', 'Chiêm bái đại tự Chùa Bái Đính', 'Đặc sản Dê núi & Cơm cháy Ninh Bình'],
      },
      {
        day: 3,
        title: 'Ngày 3: Đỉnh Ngọa Long Hang Múa - Tuyệt Tình Cốc - Trở Về Hà Nội',
        detail:
          'Sáng chinh phục gần 500 bậc đá rêu phong lên đỉnh núi Ngọa Long (Hang Múa) thu trọn tầm mắt bức tranh thủy mặc Tam Cốc và đầm sen dưới chân núi. Tiếp tục ghé Động Am Tiên (Tuyệt Tình Cốc), ăn trưa và khởi hành về lại Hà Nội.',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=900',
        meals: 'Ăn sáng, Ăn trưa',
        highlights: ['Check-in đỉnh Rồng đá Ngọa Long - Hang Múa', 'Đầm sen Hang Múa & Tuyệt Tình Cốc', 'Xe Limousine đưa về Hà Nội'],
      },
    ]),
    GiaNguoiLon: 3890000,
    GiaTreEm: 1950000,
    PhuThuPhongDon: 850000,
    HinhAnhURL: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1000',
    PhuongTien: 'Xe Limousine VIP 18 chỗ / Đò chèo du lịch Tràng An',
    DichVuDiKem:
      'Xe Limousine đưa đón xuyên suốt Hà Nội - Ninh Bình\nKhách sạn & Resort sinh thái 4 sao tại Ninh Bình\nVé đò Tràng An, xe điện Chùa Bái Đính và vé đỉnh Hang Múa\nĐặc sản Dê núi Cơm cháy Hoa Lư chính hiệu',
    TrangThaiDuyet: 'Dang mo ban',
  },
  {
    TourID: 9,
    DanhMucID: 2,
    NhanVienTaoID: 2,
    MaTour: 'TOUR-KOR-02',
    TenTour: 'Hàn Quốc Mùa Lãng Mạn: Seoul - Đảo Nami - Công Viên Everland',
    ThoiGian: '5 Ngày 4 Đêm',
    DiemKhoiHanh: 'TP.HCM',
    DiemDen: 'Seoul - Hàn Quốc',
    MoTaChiTiet:
      'Hành trình khám phá xứ sở Kim Chi lãng mạn: Dạo bước dưới hàng cây ngân hạnh vàng rực trên Đảo Nami, mặc Hanbok truyền thống tại Cung điện Hoàng gia Gyeongbokgung, vui chơi bất tận tại Everland và mua sắm tại Myeongdong.',
    LichTrinh: JSON.stringify([
      {
        day: 1,
        title: 'Ngày 1: TP.HCM - Sân Bay Quốc Tế Incheon - Thủ Đô Seoul',
        detail:
          'Quý khách tập trung tại sân bay quốc tế Tân Sơn Nhất làm thủ tục chuyến bay thẳng đi Seoul (Hàn Quốc). Đến sân bay quốc tế Incheon, xe và hướng dẫn viên đón đoàn đi thưởng thức mì Udon nóng hổi và nhận phòng khách sạn 4 sao tại Seoul.',
        image: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=900',
        meals: 'Ăn trên máy bay, Ăn trưa, Ăn tối thịt nướng BBQ Hàn Quốc',
        highlights: ['Bay thẳng quốc tế đến Incheon', 'Thưởng thức BBQ Thịt nướng Hàn Quốc chính hiệu'],
      },
      {
        day: 2,
        title: 'Ngày 2: Đảo Nami Lãng Mạn - Tháp Truyền Hình Namsan Seoul Tower',
        detail:
          'Khởi hành đi thuyền ra Đảo Nami – bối cảnh bộ phim "Bản tình ca mùa đông" nổi tiếng với những hàng cây ngân hạnh và thủy sam thẳng tắp. Chiều lên đỉnh núi Namsan tham quan Tháp N Seoul Tower, gắn ổ khóa tình yêu và ngắm toàn cảnh thủ đô Seoul.',
        image: 'https://images.unsplash.com/photo-1546874177-9e664107314e?w=900',
        meals: 'Ăn sáng, Ăn trưa Gà nướng Đảo Nami, Ăn tối',
        highlights: ['Đảo Nami thơ mộng bốn mùa', 'Tháp Namsan Seoul Tower & Cầu khóa tình yêu', 'Đặc sản Gà nướng Chuncheon'],
      },
      {
        day: 3,
        title: 'Ngày 3: Cung Điện Hoàng Gia Gyeongbokgung - Làng Cổ Bukchon Hanok',
        detail:
          'Quý khách mặc trang phục truyền thống Hanbok chụp ảnh tại Cung điện Hoàng gia Gyeongbokgung (Cảnh Phúc Cung), Bảo tàng Dân gian Quốc gia, chụp ảnh bên ngoài Nhà Xanh Phủ Tổng Thống và dạo bước tại Làng cổ Bukchon Hanok hàng trăm năm tuổi.',
        image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=900',
        meals: 'Ăn sáng, Ăn trưa Gà hầm sâm, Ăn tối',
        highlights: ['Trải nghiệm mặc Hanbok tại Cung điện Gyeongbokgung', 'Làng cổ Bukchon Hanok truyền thống', 'Thưởng thức Gà hầm sâm bổ dưỡng'],
      },
      {
        day: 4,
        title: 'Ngày 4: Công Viên Giải Trí Everland - Chợ Đêm Myeongdong',
        detail:
          'Trọn ngày vui chơi tại Công viên chủ đề Everland – 1 trong 10 công viên giải trí lớn nhất thế giới: Tham quan vườn thú Safari World xem gấu trúc Panda, tàu lượn gỗ T-Express và vườn hoa bốn mùa. Tối tự do mua sắm mỹ phẩm và ẩm thực đường phố tại Myeongdong.',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900',
        meals: 'Ăn sáng, Ăn trưa, Ăn tối Lẩu Shabu Shabu',
        highlights: ['Vui chơi trọn gói Công viên Everland & Vườn thú Panda', 'Thiên đường mỹ phẩm & Phố đêm Myeongdong'],
      },
      {
        day: 5,
        title: 'Ngày 5: Trung Tâm Nhân Sâm Chính Phủ - Sân Bay Incheon - TP.HCM',
        detail:
          'Sáng đoàn tham quan Trung tâm Nhân sâm Chính phủ Hàn Quốc, Cửa hàng Tinh dầu Thông đỏ và siêu thị miễn thuế Ponglim. Xe đưa đoàn ra sân bay quốc tế Incheon đáp chuyến bay về lại TP.HCM.',
        image: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=900',
        meals: 'Ăn sáng, Ăn trưa, Ăn trên máy bay',
        highlights: ['Mua sắm Nhân sâm Hàn Quốc & Miễn thuế', 'Bay thẳng Incheon - TP.HCM'],
      },
    ]),
    GiaNguoiLon: 18900000,
    GiaTreEm: 14500000,
    PhuThuPhongDon: 3800000,
    HinhAnhURL: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1000',
    PhuongTien: 'Hàng không Korean Air / Asiana Airlines khứ hồi',
    DichVuDiKem:
      'Vé máy bay quốc tế khứ hồi + Visa Hàn Quốc trọn gói\nKhách sạn 4 sao tiêu chuẩn quốc tế tại trung tâm Seoul\nVé tàu Đảo Nami, vé trọn gói Công viên Everland & thuê Hanbok\nBảo hiểm du lịch quốc tế 1.000.000.000 VNĐ',
    TrangThaiDuyet: 'Dang mo ban',
  },
];

export const RICH_SCHEDULES_CATALOG = [
  { LichID: 1, TourID: 1, MaLich: 'LICH-DN-20261215', NgayKhoiHanh: new Date('2026-12-15T07:00:00Z'), NgayKetThuc: new Date('2026-12-18T18:00:00Z'), SoChoToiDa: 30, SoChoDaDat: 2, TrangThai: 'Cho khoi hanh' },
  { LichID: 2, TourID: 2, MaLich: 'LICH-SP-20261220', NgayKhoiHanh: new Date('2026-12-20T06:00:00Z'), NgayKetThuc: new Date('2026-12-22T17:00:00Z'), SoChoToiDa: 25, SoChoDaDat: 1, TrangThai: 'Cho khoi hanh' },
  { LichID: 3, TourID: 3, MaLich: 'LICH-TYO-20261225', NgayKhoiHanh: new Date('2026-12-25T01:00:00Z'), NgayKetThuc: new Date('2026-12-30T22:00:00Z'), SoChoToiDa: 20, SoChoDaDat: 1, TrangThai: 'Cho khoi hanh' },
  { LichID: 4, TourID: 4, MaLich: 'LICH-HL-20261222', NgayKhoiHanh: new Date('2026-12-22T07:00:00Z'), NgayKetThuc: new Date('2026-12-24T17:00:00Z'), SoChoToiDa: 25, SoChoDaDat: 2, TrangThai: 'Cho khoi hanh' },
  { LichID: 5, TourID: 5, MaLich: 'LICH-PQ-20261228', NgayKhoiHanh: new Date('2026-12-28T06:00:00Z'), NgayKetThuc: new Date('2026-12-31T18:00:00Z'), SoChoToiDa: 28, SoChoDaDat: 4, TrangThai: 'Cho khoi hanh' },
  { LichID: 6, TourID: 6, MaLich: 'LICH-HUE-20261218', NgayKhoiHanh: new Date('2026-12-18T07:00:00Z'), NgayKetThuc: new Date('2026-12-21T18:00:00Z'), SoChoToiDa: 30, SoChoDaDat: 6, TrangThai: 'Cho khoi hanh' },
  { LichID: 7, TourID: 7, MaLich: 'LICH-NTDL-20261224', NgayKhoiHanh: new Date('2026-12-24T06:30:00Z'), NgayKetThuc: new Date('2026-12-27T18:30:00Z'), SoChoToiDa: 30, SoChoDaDat: 8, TrangThai: 'Cho khoi hanh' },
  { LichID: 8, TourID: 8, MaLich: 'LICH-NB-20261219', NgayKhoiHanh: new Date('2026-12-19T07:00:00Z'), NgayKetThuc: new Date('2026-12-21T18:00:00Z'), SoChoToiDa: 25, SoChoDaDat: 5, TrangThai: 'Cho khoi hanh' },
  { LichID: 9, TourID: 9, MaLich: 'LICH-KOR-20261226', NgayKhoiHanh: new Date('2026-12-26T00:30:00Z'), NgayKetThuc: new Date('2026-12-30T21:00:00Z'), SoChoToiDa: 22, SoChoDaDat: 7, TrangThai: 'Cho khoi hanh' },
  { LichID: 10, TourID: 1, MaLich: 'LICH-DN-20261229', NgayKhoiHanh: new Date('2026-12-29T07:00:00Z'), NgayKetThuc: new Date('2027-01-01T18:00:00Z'), SoChoToiDa: 30, SoChoDaDat: 4, TrangThai: 'Cho khoi hanh' },
];

/**
 * Đồng bộ danh mục 9 Tour chuẩn (mỗi mục có ít nhất 2-3 tour, ảnh bìa & ảnh từng ngày chính xác theo địa danh)
 * và chuẩn hóa trạng thái đơn đã đánh giá -> 'Hoan thanh' trên cả Database cũ lẫn mới.
 */
export async function syncCatalogAndDemoState(prisma: PrismaClient): Promise<void> {
  // 1. Đảm bảo đủ 4 DanhMucTour
  await prisma.danhMucTour.createMany({
    data: [
      { DanhMucID: 1, TenDanhMuc: 'Tour Trong Nuoc', MoTa: 'Các chương trình du lịch di sản và danh lam thắng cảnh Việt Nam' },
      { DanhMucID: 2, TenDanhMuc: 'Tour Quoc Te', MoTa: 'Các chương trình tham quan khám phá các quốc gia trên thế giới' },
      { DanhMucID: 3, TenDanhMuc: 'Tour Nghi Duong', MoTa: 'Nghỉ dưỡng biển, du thuyền 5 sao, resort cao cấp' },
      { DanhMucID: 4, TenDanhMuc: 'Tour Van Hoa Di San', MoTa: 'Khám phá văn hóa, di tích lịch sử và ẩm thực địa phương' },
    ],
    skipDuplicates: true,
  });

  // 2. Upsert toàn bộ 9 Tour chuẩn với hình ảnh địa điểm & lịch trình JSON từng ngày chính xác
  for (const t of RICH_TOURS_CATALOG) {
    const existing = await prisma.tour.findUnique({ where: { TourID: t.TourID } });
    if (!existing) {
      await prisma.tour.create({ data: t });
    } else {
      await prisma.tour.update({
        where: { TourID: t.TourID },
        data: {
          DanhMucID: t.DanhMucID,
          TenTour: t.TenTour,
          ThoiGian: t.ThoiGian,
          DiemKhoiHanh: t.DiemKhoiHanh,
          DiemDen: t.DiemDen,
          MoTaChiTiet: t.MoTaChiTiet,
          LichTrinh: t.LichTrinh,
          GiaNguoiLon: t.GiaNguoiLon,
          GiaTreEm: t.GiaTreEm,
          PhuThuPhongDon: t.PhuThuPhongDon,
          HinhAnhURL: t.HinhAnhURL,
          PhuongTien: t.PhuongTien,
          DichVuDiKem: t.DichVuDiKem,
          TrangThaiDuyet: 'Dang mo ban',
        },
      });
    }
  }

  // 3. Đảm bảo các Lịch khởi hành cho cả 9 Tour đều có sẵn
  for (const s of RICH_SCHEDULES_CATALOG) {
    const existingLich = await prisma.lichKhoiHanh.findUnique({ where: { LichID: s.LichID } });
    if (!existingLich) {
      await prisma.lichKhoiHanh.create({ data: s });
    }
  }

  // 4. Chuẩn hóa mọi Đơn đặt tour đã có Đánh giá (DanhGia) hoặc đã điểm danh sang trạng thái 'Hoan thanh'
  await prisma.donDatTour.updateMany({
    where: {
      TrangThaiDon: 'Da thanh toan',
      DanhGia: { some: {} },
    },
    data: {
      TrangThaiDon: 'Hoan thanh',
    },
  });

  // 5. Đồng bộ lại PostgreSQL sequences
  const seqQueries = [
    `SELECT setval(pg_get_serial_sequence('danhmuctour', 'danhmucid'), (SELECT COALESCE(MAX(danhmucid), 1) FROM danhmuctour))`,
    `SELECT setval(pg_get_serial_sequence('tour', 'tourid'), (SELECT COALESCE(MAX(tourid), 1) FROM tour))`,
    `SELECT setval(pg_get_serial_sequence('lichkhoihanh', 'lichid'), (SELECT COALESCE(MAX(lichid), 1) FROM lichkhoihanh))`,
  ];
  for (const q of seqQueries) {
    try {
      await prisma.$executeRawUnsafe(q);
    } catch {}
  }
}

/**
 * Tự động nạp dữ liệu mẫu (Seed Data) chuẩn UTF-8 nếu Database trên Cloud mới khởi tạo còn trống.
 * Giúp quá trình Deploy lên Render / Supabase / Neon hoàn toàn tự động 100% không cần chạy SQL tay.
 */
export async function autoSeedIfEmpty(prisma: PrismaClient): Promise<boolean> {
  const roleCount = await prisma.vaiTro.count();
  if (roleCount > 0) {
    await syncCatalogAndDemoState(prisma);
    return false;
  }

  const defaultHash = hashPassword('VietTour@2026');

  // 1. VaiTro
  await prisma.vaiTro.createMany({
    data: [
      { VaiTroID: 1, TenVaiTro: 'Admin', MoTa: 'Quản trị viên toàn quyền hệ thống' },
      { VaiTroID: 2, TenVaiTro: 'Dieu hanh', MoTa: 'Trưởng phòng / Nhân viên điều hành tour' },
      { VaiTroID: 3, TenVaiTro: 'Ke toan', MoTa: 'Kế toán trưởng / Tài chính doanh nghiệp' },
      { VaiTroID: 4, TenVaiTro: 'HDV', MoTa: 'Hướng dẫn viên du lịch dẫn đoàn' },
      { VaiTroID: 5, TenVaiTro: 'Khach hang', MoTa: 'Khách du lịch đặt tour' },
    ],
    skipDuplicates: true,
  });

  // 2. TaiKhoan
  await prisma.taiKhoan.createMany({
    data: [
      { TaiKhoanID: 1, Email: 'admin@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0901000001', TrangThai: 1 },
      { TaiKhoanID: 2, Email: 'dieuhanh@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0901000002', TrangThai: 1 },
      { TaiKhoanID: 3, Email: 'ketoan@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0901000003', TrangThai: 1 },
      { TaiKhoanID: 4, Email: 'hdv1@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0903112233', TrangThai: 1 },
      { TaiKhoanID: 5, Email: 'khach1@gmail.com', MatKhauHash: defaultHash, SoDienThoai: '0908123456', TrangThai: 1 },
      { TaiKhoanID: 6, Email: 'khach.thao@yahoo.com', MatKhauHash: defaultHash, SoDienThoai: '0912987654', TrangThai: 1 },
      { TaiKhoanID: 7, Email: 'hdv.mai@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0903223344', TrangThai: 1 },
      { TaiKhoanID: 8, Email: 'hdv.khoa@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0903334455', TrangThai: 1 },
      { TaiKhoanID: 9, Email: 'hdv.huong@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0903445566', TrangThai: 1 },
      { TaiKhoanID: 10, Email: 'hdv.tuan@viettour.vn', MatKhauHash: defaultHash, SoDienThoai: '0903556677', TrangThai: 1 },
    ],
    skipDuplicates: true,
  });

  // 3. PhanQuyen
  await prisma.phanQuyen.createMany({
    data: [
      { TaiKhoanID: 1, VaiTroID: 1 },
      { TaiKhoanID: 2, VaiTroID: 2 },
      { TaiKhoanID: 3, VaiTroID: 3 },
      { TaiKhoanID: 4, VaiTroID: 4 },
      { TaiKhoanID: 5, VaiTroID: 5 },
      { TaiKhoanID: 6, VaiTroID: 5 },
      { TaiKhoanID: 7, VaiTroID: 4 },
      { TaiKhoanID: 8, VaiTroID: 4 },
      { TaiKhoanID: 9, VaiTroID: 4 },
      { TaiKhoanID: 10, VaiTroID: 4 },
    ],
    skipDuplicates: true,
  });

  // 4. NhanVien
  await prisma.nhanVien.createMany({
    data: [
      { NhanVienID: 1, TaiKhoanID: 1, HoTen: 'Nguyễn Văn Quản Trị', SoDienThoai: '0901000001', Email: 'admin@viettour.vn', ChucVu: 'Tổng Giám Đốc', NgayVaoLam: new Date('2023-01-01') },
      { NhanVienID: 2, TaiKhoanID: 2, HoTen: 'Phạm Thu Hà', SoDienThoai: '0901000002', Email: 'dieuhanh@viettour.vn', ChucVu: 'Trưởng phòng Điều hành', NgayVaoLam: new Date('2023-03-15') },
      { NhanVienID: 3, TaiKhoanID: 3, HoTen: 'Trần Minh Đức', SoDienThoai: '0901000003', Email: 'ketoan@viettour.vn', ChucVu: 'Kế toán trưởng', NgayVaoLam: new Date('2023-05-10') },
      { NhanVienID: 4, TaiKhoanID: 4, HoTen: 'Lê Hoàng Nam', SoDienThoai: '0903112233', Email: 'hdv1@viettour.vn', ChucVu: 'Hướng dẫn viên Quốc tế', NgayVaoLam: new Date('2023-06-01') },
      { NhanVienID: 5, TaiKhoanID: 7, HoTen: 'Trần Thị Tuyết Mai', SoDienThoai: '0903223344', Email: 'hdv.mai@viettour.vn', ChucVu: 'Hướng dẫn viên Quốc tế', NgayVaoLam: new Date('2023-08-01') },
      { NhanVienID: 6, TaiKhoanID: 8, HoTen: 'Nguyễn Đăng Khoa', SoDienThoai: '0903334455', Email: 'hdv.khoa@viettour.vn', ChucVu: 'Hướng dẫn viên Nội địa', NgayVaoLam: new Date('2023-08-01') },
      { NhanVienID: 7, TaiKhoanID: 9, HoTen: 'Đỗ Lan Hương', SoDienThoai: '0903445566', Email: 'hdv.huong@viettour.vn', ChucVu: 'Hướng dẫn viên Quốc tế', NgayVaoLam: new Date('2023-08-01') },
      { NhanVienID: 8, TaiKhoanID: 10, HoTen: 'Vũ Minh Tuấn', SoDienThoai: '0903556677', Email: 'hdv.tuan@viettour.vn', ChucVu: 'Hướng dẫn viên Nội địa', NgayVaoLam: new Date('2023-08-01') },
    ],
    skipDuplicates: true,
  });

  // 5. HuongDanVien
  await prisma.huongDanVien.createMany({
    data: [
      { HDVID: 1, NhanVienID: 4, SoTheHDV: 'HDV-QUOCTE-8891', NgonNgu: 'Anh, Trung', KinhNghiem: '5 năm kinh nghiệm dẫn tour Cao cấp & Di sản', TrangThai: 'San sang' },
      { HDVID: 2, NhanVienID: 5, SoTheHDV: 'HDV-QUOCTE-5542', NgonNgu: 'Nhật, Anh', KinhNghiem: '6 năm chuyên tour Nhật Bản & Đông Bắc Á', TrangThai: 'San sang' },
      { HDVID: 3, NhanVienID: 6, SoTheHDV: 'HDV-NOIDIA-3319', NgonNgu: 'Việt, Anh', KinhNghiem: '4 năm chuyên tour Miền Trung & Tây Bắc', TrangThai: 'Dang di tour' },
      { HDVID: 4, NhanVienID: 7, SoTheHDV: 'HDV-QUOCTE-9921', NgonNgu: 'Pháp, Anh', KinhNghiem: '7 năm dẫn tour Di sản & Biển đảo cao cấp', TrangThai: 'San sang' },
      { HDVID: 5, NhanVienID: 8, SoTheHDV: 'HDV-NOIDIA-4488', NgonNgu: 'Việt', KinhNghiem: '3 năm chuyên tour Phú Quốc & Miền Tây', TrangThai: 'San sang' },
    ],
    skipDuplicates: true,
  });

  // 6. KhachHang
  await prisma.khachHang.createMany({
    data: [
      { KhachHangID: 1, TaiKhoanID: 5, HoTen: 'Nguyễn Văn Hùng', SoDienThoai: '0908123456', Email: 'khach1@gmail.com', CCCD: '031092008761', NgaySinh: new Date('1992-05-15'), GioiTinh: 'Nam' },
      { KhachHangID: 2, TaiKhoanID: 6, HoTen: 'Trần Thị Thu Thảo', SoDienThoai: '0912987654', Email: 'khach.thao@yahoo.com', CCCD: '079188004321', NgaySinh: new Date('1988-11-20'), GioiTinh: 'Nu' },
    ],
    skipDuplicates: true,
  });

  // 7, 8, 9. DanhMucTour, Tour (9 tours), LichKhoiHanh (10 schedules)
  await syncCatalogAndDemoState(prisma);

  // 10. Voucher
  await prisma.voucher.createMany({
    data: [
      { VoucherID: 1, MaVoucher: 'VIETTOUR2026', TenChuongTrinh: 'Ưu đãi Khách hàng Thân thiết VietTour 2026', PhanTramGiam: 10, GiamToiDa: 1000000, GiaTriDonToiThieu: 3000000, SoLuongToiDa: 500, NgayBatDau: new Date('2026-01-01'), NgayKetThuc: new Date('2026-12-31'), TrangThai: 1 },
      { VoucherID: 2, MaVoucher: 'BAYHE2026', TenChuongTrinh: 'Khuyến mãi Tour Máy bay Trọn Gói 2026', PhanTramGiam: 15, GiamToiDa: 1500000, GiaTriDonToiThieu: 5000000, SoLuongToiDa: 200, NgayBatDau: new Date('2026-05-01'), NgayKetThuc: new Date('2026-12-31'), TrangThai: 1 },
      { VoucherID: 3, MaVoucher: 'WELCOME10', TenChuongTrinh: 'Mã Chào Mừng Thành Viên Mới Giảm 10%', PhanTramGiam: 10, GiamToiDa: 500000, GiaTriDonToiThieu: 2000000, SoLuongToiDa: 300, NgayBatDau: new Date('2026-01-01'), NgayKetThuc: new Date('2026-12-31'), TrangThai: 1 },
    ],
    skipDuplicates: true,
  });

  // 11. NhaCungCap & DichVuNhaCungCap
  await prisma.nhaCungCap.createMany({
    data: [
      { NhaCungCapID: 1, TenNCC: 'Khách sạn Novotel Danang Premier', LoaiNCC: 'Khach san', NguoiLienHe: 'Nguyễn Thị Thu Hương', SoDienThoai: '02363929999', Email: 'novotel@danang.com', DiaChi: '36 Bạch Đằng, Hải Châu, Đà Nẵng', DanhGia: 4.9, TrangThai: 1 },
      { NhaCungCapID: 2, TenNCC: 'Công ty Vận Tải Du Lịch Việt Thanh', LoaiNCC: 'Xe van chuyen', NguoiLienHe: 'Trần Văn Bình', SoDienThoai: '0905888999', Email: 'vietthanh@transport.vn', DiaChi: '120 Nguyễn Văn Linh, Đà Nẵng', DanhGia: 4.8, TrangThai: 1 },
      { NhaCungCapID: 3, TenNCC: 'Nhà Hàng Ẩm Thực Cung Đình Huế', LoaiNCC: 'Nha hang', NguoiLienHe: 'Lê Thị Ngọc Mai', SoDienThoai: '02343888777', Email: 'cungdinh@huecuisine.vn', DiaChi: '38 Nguyễn Sinh Cung, TP Huế', DanhGia: 4.7, TrangThai: 1 },
    ],
    skipDuplicates: true,
  });

  await prisma.dichVuNhaCungCap.createMany({
    data: [
      { DichVuNCCID: 1, NhaCungCapID: 1, TenDichVu: 'Phòng Deluxe Hướng Sông Hàn (2 người)', LoaiDichVu: 'Luu tru', DonGia: 1650000, DonViTinh: 'Đêm/Phòng', MoTa: 'Bao gồm buffet sáng tiêu chuẩn quốc tế', TrangThai: 1 },
      { DichVuNCCID: 2, NhaCungCapID: 2, TenDichVu: 'Xe Universe 45 chỗ đời mới 2024', LoaiDichVu: 'Van chuyen', DonGia: 3500000, DonViTinh: 'Ngày/Xe', MoTa: 'Tài xế chuyên nghiệp, máy lạnh mát sâu', TrangThai: 1 },
      { DichVuNCCID: 3, NhaCungCapID: 3, TenDichVu: 'Set Menu Đặc Sản Cung Đình 8 món', LoaiDichVu: 'An uong', DonGia: 250000, DonViTinh: 'Suất/Khách', MoTa: 'Gồm nem công, chả phượng, cơm sen', TrangThai: 1 },
    ],
    skipDuplicates: true,
  });

  // 12. DonDatTour, ChiTietHanhKhach, ThanhToan, HoaDon, DieuPhoiTour, PhieuDatDichVu, DanhGia
  await prisma.donDatTour.createMany({
    data: [
      { DonHangID: 1, KhachHangID: 1, LichID: 1, NhanVienXuLyID: 2, VoucherID: 1, MaDon: 'BK-9821', SoLuongNguoiLon: 2, SoLuongTreEm: 0, TongTien: 11780000, GiamGia: 1000000, TienCoc: 10780000, TienConLai: 0, TrangThaiDon: 'Hoan thanh', PhuongThucTT: 'ZaloPay' },
      { DonHangID: 2, KhachHangID: 2, LichID: 3, NhanVienXuLyID: 2, VoucherID: null, MaDon: 'BK-9822', SoLuongNguoiLon: 1, SoLuongTreEm: 0, TongTien: 32900000, GiamGia: 0, TienCoc: 32900000, TienConLai: 0, TrangThaiDon: 'Da thanh toan', PhuongThucTT: 'VNPay' },
    ],
    skipDuplicates: true,
  });

  await prisma.chiTietHanhKhach.createMany({
    data: [
      { ChiTietID: 1, DonHangID: 1, HoTen: 'Nguyễn Văn Hùng', LoaiKhach: 'Nguoi lon', CCCD: '031092008761', MaQRVe: 'VT-BK-9821-P1', TrangThaiDiemDanh: 1 },
      { ChiTietID: 2, DonHangID: 1, HoTen: 'Lê Thị Mai Trang', LoaiKhach: 'Nguoi lon', CCCD: '031195009872', MaQRVe: 'VT-BK-9821-P2', TrangThaiDiemDanh: 1 },
      { ChiTietID: 3, DonHangID: 2, HoTen: 'Trần Thị Thu Thảo', LoaiKhach: 'Nguoi lon', CCCD: '079188004321', MaQRVe: 'VT-BK-9822-P1', TrangThaiDiemDanh: 0 },
    ],
    skipDuplicates: true,
  });

  await prisma.thanhToan.createMany({
    data: [
      { ThanhToanID: 1, DonHangID: 1, SoTien: 10780000, HinhThucTT: 'ZaloPay', MaGiaoDich: 'ZP-20261015-8831', TrangThai: 'Thanh cong' },
      { ThanhToanID: 2, DonHangID: 2, SoTien: 32900000, HinhThucTT: 'VNPay', MaGiaoDich: 'VNP-20261101-9921', TrangThai: 'Thanh cong' },
    ],
    skipDuplicates: true,
  });

  await prisma.hoaDon.createMany({
    data: [
      { HoaDonID: 1, DonHangID: 1, ThanhToanID: 1, SoHoaDon: 'HD-2026-9821', TenCongTy: 'CÔNG TY CP TẬP ĐOÀN HÙNG VƯƠNG', MaSoThue: '0315889922', TongTienVat: 10780000 },
    ],
    skipDuplicates: true,
  });

  await prisma.dieuPhoiTour.createMany({
    data: [
      { DieuPhoiID: 1, LichID: 1, HDVID: 1, NhanVienID: 2, TrangThai: 'Da xac nhan' },
      { DieuPhoiID: 2, LichID: 2, HDVID: 3, NhanVienID: 2, TrangThai: 'Da xac nhan' },
      { DieuPhoiID: 3, LichID: 3, HDVID: 2, NhanVienID: 2, TrangThai: 'Da xac nhan' },
      { DieuPhoiID: 4, LichID: 6, HDVID: 4, NhanVienID: 2, TrangThai: 'Da xac nhan' },
      { DieuPhoiID: 5, LichID: 7, HDVID: 5, NhanVienID: 2, TrangThai: 'Da xac nhan' },
    ],
    skipDuplicates: true,
  });

  await prisma.phieuDatDichVu.createMany({
    data: [
      { PhieuDatID: 1, LichID: 1, NhanVienID: 2, NhaCungCapID: 1, MaPhieu: 'PO-2026-NOV01', TongTienDichVu: 9900000, TienDaCoc: 5000000, TrangThai: 'Da xac nhan' },
      { PhieuDatID: 2, LichID: 1, NhanVienID: 2, NhaCungCapID: 2, MaPhieu: 'PO-2026-CAR01', TongTienDichVu: 14000000, TienDaCoc: 14000000, TrangThai: 'Hoan thanh' },
    ],
    skipDuplicates: true,
  });

  await prisma.danhGia.createMany({
    data: [
      { DanhGiaID: 1, KhachHangID: 1, TourID: 1, DonHangID: 1, SoSao: 5, BinhLuan: 'Tour Đà Nẵng - Hội An đi rất đúng giờ, xe sạch sẽ, HDV nhiệt tình và chu đáo!', TrangThaiDuyet: 'Da hien thi' },
    ],
    skipDuplicates: true,
  });

  // Đồng bộ lại các PostgreSQL sequences sau khi insert ID cố định
  const seqQueries = [
    `SELECT setval(pg_get_serial_sequence('taikhoan', 'taikhoanid'), (SELECT COALESCE(MAX(taikhoanid), 1) FROM taikhoan))`,
    `SELECT setval(pg_get_serial_sequence('vaitro', 'vaitroid'), (SELECT COALESCE(MAX(vaitroid), 1) FROM vaitro))`,
    `SELECT setval(pg_get_serial_sequence('khachhang', 'khachhangid'), (SELECT COALESCE(MAX(khachhangid), 1) FROM khachhang))`,
    `SELECT setval(pg_get_serial_sequence('nhanvien', 'nhanvienid'), (SELECT COALESCE(MAX(nhanvienid), 1) FROM nhanvien))`,
    `SELECT setval(pg_get_serial_sequence('huongdanvien', 'hdvid'), (SELECT COALESCE(MAX(hdvid), 1) FROM huongdanvien))`,
    `SELECT setval(pg_get_serial_sequence('danhmuctour', 'danhmucid'), (SELECT COALESCE(MAX(danhmucid), 1) FROM danhmuctour))`,
    `SELECT setval(pg_get_serial_sequence('tour', 'tourid'), (SELECT COALESCE(MAX(tourid), 1) FROM tour))`,
    `SELECT setval(pg_get_serial_sequence('lichkhoihanh', 'lichid'), (SELECT COALESCE(MAX(lichid), 1) FROM lichkhoihanh))`,
    `SELECT setval(pg_get_serial_sequence('voucher', 'voucherid'), (SELECT COALESCE(MAX(voucherid), 1) FROM voucher))`,
    `SELECT setval(pg_get_serial_sequence('dondattour', 'donhangid'), (SELECT COALESCE(MAX(donhangid), 1) FROM dondattour))`,
    `SELECT setval(pg_get_serial_sequence('chitiethanhkhach', 'chitietid'), (SELECT COALESCE(MAX(chitietid), 1) FROM chitiethanhkhach))`,
    `SELECT setval(pg_get_serial_sequence('thanhtoan', 'thanhtoanid'), (SELECT COALESCE(MAX(thanhtoanid), 1) FROM thanhtoan))`,
    `SELECT setval(pg_get_serial_sequence('hoadon', 'hoadonid'), (SELECT COALESCE(MAX(hoadonid), 1) FROM hoadon))`,
    `SELECT setval(pg_get_serial_sequence('nhacungcap', 'nhacungcapid'), (SELECT COALESCE(MAX(nhacungcapid), 1) FROM nhacungcap))`,
    `SELECT setval(pg_get_serial_sequence('dichvunhacungcap', 'dichvunccid'), (SELECT COALESCE(MAX(dichvunccid), 1) FROM dichvunhacungcap))`,
    `SELECT setval(pg_get_serial_sequence('phieudatdichvu', 'phieudatid'), (SELECT COALESCE(MAX(phieudatid), 1) FROM phieudatdichvu))`,
    `SELECT setval(pg_get_serial_sequence('dieuphoitour', 'dieuphoiid'), (SELECT COALESCE(MAX(dieuphoiid), 1) FROM dieuphoitour))`,
    `SELECT setval(pg_get_serial_sequence('danhgia', 'danhgiaid'), (SELECT COALESCE(MAX(danhgiaid), 1) FROM danhgia))`,
  ];

  for (const q of seqQueries) {
    try {
      await prisma.$executeRawUnsafe(q);
    } catch {}
  }

  return true;
}
