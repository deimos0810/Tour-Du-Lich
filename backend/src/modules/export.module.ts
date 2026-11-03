import { Controller, Get, Injectable, Logger, Module, NotFoundException, Param, ParseIntPipe, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { createMailTransporter, getMailUser } from '../common/mailer.js';

const num = (v: unknown) => Number(v ?? 0);
const VND_FMT = '#,##0 "VND"';
const fmtVnd = (v: unknown) => `${num(v).toLocaleString('vi-VN')} đ`;
const fmtDate = (d: Date | string | null | undefined) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');
const fmtDateTime = (d: Date | string | null | undefined) => (d ? new Date(d).toLocaleString('vi-VN') : '');

/* ---------- Font tiếng Việt cho PDFKit (Helvetica mặc định không có dấu) ---------- */
function findFont(bold: boolean): string | null {
  const files = bold ? ['arialbd.ttf', 'DejaVuSans-Bold.ttf'] : ['arial.ttf', 'DejaVuSans.ttf'];
  const dirs = [
    process.env.PDF_FONT_DIR,
    join(process.cwd(), 'assets', 'fonts'),
    'C:\\Windows\\Fonts',
    '/usr/share/fonts/truetype/dejavu',
    '/Library/Fonts',
    '/System/Library/Fonts/Supplemental',
  ].filter(Boolean) as string[];
  for (const d of dirs) for (const f of files) if (existsSync(join(d, f))) return join(d, f);
  return null;
}

function stripVietnamese(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

type Pdf = { doc: PDFKit.PDFDocument; t: (s: string) => string; regular: string; bold: string };

function createPdf(opts?: PDFKit.PDFDocumentOptions): Pdf {
  const doc = new PDFDocument({ size: 'A4', margin: 40, ...opts });
  const r = findFont(false);
  const b = findFont(true);
  if (r && b) {
    doc.registerFont('VT-Regular', r);
    doc.registerFont('VT-Bold', b);
    return { doc, t: (s) => s, regular: 'VT-Regular', bold: 'VT-Bold' };
  }
  return { doc, t: stripVietnamese, regular: 'Helvetica', bold: 'Helvetica-Bold' };
}

function pdfToBuffer(pdf: Pdf, build: () => void | Promise<void>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdf.doc.on('data', (c: Buffer) => chunks.push(c));
    pdf.doc.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.doc.on('error', reject);
    Promise.resolve(build()).then(() => pdf.doc.end(), reject);
  });
}

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  private async loadSettlement(id: number) {
    const s = await this.prisma.baoCaoQuyetToan.findUnique({
      where: { QuyetToanID: id },
      include: {
        NhanVienLap: { select: { HoTen: true, ChucVu: true } },
        LichKhoiHanh: {
          include: {
            Tour: true,
            DonDatTour: { where: { TrangThaiDon: { not: 'Da huy' } }, include: { KhachHang: { select: { HoTen: true } } }, orderBy: { NgayDat: 'asc' } },
            PhieuDatDichVu: { include: { NhaCungCap: { select: { TenNCC: true, LoaiNCC: true } } }, orderBy: { NgayDat: 'asc' } },
          },
        },
      },
    });
    if (!s) throw new NotFoundException('Không tìm thấy báo cáo quyết toán');
    return s;
  }

  /** 3.2 Xuất Excel quyết toán 1 chuyến: tiêu đề, độ rộng cột, định dạng tiền tệ, tổng thu/chi/lợi nhuận, khối chữ ký kế toán. */
  async exportSettlementExcel(id: number): Promise<Buffer> {
    const s = await this.loadSettlement(id);
    const lich = s.LichKhoiHanh;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'VietTour Enterprise Travel System';
    wb.lastModifiedBy = 'VietTour Accounting';
    wb.created = new Date();
    wb.modified = new Date();

    const ws = wb.addWorksheet('Quyet toan', { views: [{ showGridLines: true }] });
    // Căn chỉnh độ rộng cột chuẩn mực tránh hiện tượng ### hoặc tràn ô
    ws.columns = [{ width: 8 }, { width: 42 }, { width: 26 }, { width: 18 }, { width: 22 }, { width: 26 }];

    // Dòng 1: Tên doanh nghiệp
    ws.mergeCells('A1:F1');
    const cA1 = ws.getCell('A1');
    cA1.value = 'CÔNG TY TNHH DU LỊCH & LỮ HÀNH VIETTOUR';
    cA1.font = { name: 'Arial', bold: true, size: 14, color: { argb: 'FFC8102E' } };
    cA1.alignment = { vertical: 'middle', horizontal: 'left' };

    // Dòng 2: Tiêu đề biểu mẫu
    ws.mergeCells('A2:F2');
    const cA2 = ws.getCell('A2');
    cA2.value = 'BẢNG QUYẾT TOÁN TÀI CHÍNH TOUR DU LỊCH';
    cA2.font = { name: 'Arial', bold: true, size: 15, color: { argb: 'FF0F172A' } };
    cA2.alignment = { vertical: 'middle', horizontal: 'center' };

    // Dòng 3: Thông tin chuyến tour
    ws.mergeCells('A3:F3');
    const cA3 = ws.getCell('A3');
    cA3.value = `Chuyến đi: ${lich.Tour.TenTour}  |  Mã lịch: ${lich.MaLich}  |  Thời gian: ${fmtDate(lich.NgayKhoiHanh)} - ${fmtDate(lich.NgayKetThuc)}`;
    cA3.font = { name: 'Arial', italic: true, size: 10.5, color: { argb: 'FF334155' } };
    cA3.alignment = { vertical: 'middle', horizontal: 'center' };

    // Dòng 4: Người lập & ngày lập
    ws.mergeCells('A4:F4');
    const cA4 = ws.getCell('A4');
    cA4.value = `Người lập: ${s.NhanVienLap.HoTen}  |  Ngày lập biểu: ${fmtDate(s.NgayLap)}  |  Trạng thái: ${s.TrangThaiDuyet}`;
    cA4.font = { name: 'Arial', italic: true, size: 10.5, color: { argb: 'FF475569' } };
    cA4.alignment = { vertical: 'middle', horizontal: 'center' };

    const headFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    const border: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };

    const writeHeader = (rowNo: number, labels: string[]) => {
      const row = ws.getRow(rowNo);
      row.height = 24;
      labels.forEach((l, i) => {
        const c = row.getCell(i + 1);
        c.value = l;
        c.font = { name: 'Arial', bold: true, size: 10.5, color: { argb: 'FFFFFFFF' } };
        c.fill = headFill;
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        c.border = border;
      });
    };

    // I. DOANH THU TỪ BOOKING
    let r = 6;
    const cSec1 = ws.getCell(`A${r}`);
    cSec1.value = 'I. DOANH THU BÁN VÉ / BOOKING KHÁCH HÀNG';
    cSec1.font = { name: 'Arial', bold: true, size: 11.5, color: { argb: 'FF0F172A' } };
    r++;
    writeHeader(r, ['STT', 'Họ tên khách hàng', 'Mã đơn đặt', 'Số lượng khách', 'Giảm giá (Voucher)', 'Doanh thu thực thu']);
    lich.DonDatTour.forEach((d, i) => {
      r++;
      const row = ws.getRow(r);
      row.height = 20;
      row.values = [
        i + 1,
        d.KhachHang?.HoTen || 'Khách vãng lai',
        d.MaDon,
        d.SoLuongNguoiLon + d.SoLuongTreEm,
        num(d.GiamGia),
        num(d.TongTien) - num(d.GiamGia),
      ];
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(5).numFmt = VND_FMT;
      row.getCell(6).numFmt = VND_FMT;
      for (let c = 1; c <= 6; c++) {
        row.getCell(c).border = border;
        row.getCell(c).font = { name: 'Arial', size: 10 };
      }
    });

    // II. CHI PHÍ NHÀ CUNG CẤP
    r += 2;
    const cSec2 = ws.getCell(`A${r}`);
    cSec2.value = 'II. CHI PHÍ NHÀ CUNG CẤP DỊCH VỤ (VẬN CHUYỂN, KHÁCH SẠN, ĂN UỐNG)';
    cSec2.font = { name: 'Arial', bold: true, size: 11.5, color: { argb: 'FF0F172A' } };
    r++;
    writeHeader(r, ['STT', 'Tên nhà cung cấp', 'Mã phiếu chi', 'Loại hình dịch vụ', 'Trạng thái', 'Chi phí thực chi']);
    lich.PhieuDatDichVu.forEach((p, i) => {
      r++;
      const row = ws.getRow(r);
      row.height = 20;
      row.values = [i + 1, p.NhaCungCap.TenNCC, p.MaPhieu, p.NhaCungCap.LoaiNCC, p.TrangThai, num(p.TongTienDichVu)];
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(6).numFmt = VND_FMT;
      for (let c = 1; c <= 6; c++) {
        row.getCell(c).border = border;
        row.getCell(c).font = { name: 'Arial', size: 10 };
      }
    });

    // III. BẢNG TỔNG HỢP & HIỆU QUẢ KINH DOANH
    r += 2;
    const summary: Array<[string, number, string]> = [
      ['TỔNG DOANH THU THỰC THU (1)', num(s.TongThu), 'FF0F766E'],
      ['TỔNG CHI PHÍ DỊCH VỤ NCC (2)', num(s.TongChi), 'FFB91C1C'],
      ['LỢI NHUẬN RÒNG (1 - 2)', num(s.TongThu) - num(s.TongChi), num(s.TongThu) - num(s.TongChi) >= 0 ? 'FF15803D' : 'FFB91C1C'],
    ];
    for (const [label, value, color] of summary) {
      ws.mergeCells(`A${r}:E${r}`);
      const row = ws.getRow(r);
      row.height = 22;
      const cLabel = ws.getCell(`A${r}`);
      cLabel.value = label;
      cLabel.font = { name: 'Arial', bold: true, size: 10.5 };
      cLabel.alignment = { horizontal: 'right', vertical: 'middle' };
      for (let c = 1; c <= 5; c++) row.getCell(c).border = border;

      const cVal = ws.getCell(`F${r}`);
      cVal.value = value;
      cVal.numFmt = VND_FMT;
      cVal.font = { name: 'Arial', bold: true, size: 11, color: { argb: color } };
      cVal.border = border;
      r++;
    }

    // Khối chữ ký kế toán & Ban giám đốc
    r += 2;
    ws.mergeCells(`B${r}:C${r}`);
    ws.mergeCells(`E${r}:F${r}`);
    ws.getCell(`B${r}`).value = 'NGƯỜI LẬP BIỂU (Kế toán)';
    ws.getCell(`E${r}`).value = 'BAN GIÁM ĐỐC PHÊ DUYỆT';
    ws.getCell(`B${r + 1}`).value = '(Ký, đóng dấu và ghi rõ họ tên)';
    ws.getCell(`E${r + 1}`).value = '(Ký, đóng dấu và ghi rõ họ tên)';
    ws.getCell(`B${r + 5}`).value = s.NhanVienLap.HoTen;

    for (const a of [`B${r}`, `E${r}`, `B${r + 1}`, `E${r + 1}`, `B${r + 5}`]) {
      ws.getCell(a).alignment = { horizontal: 'center', vertical: 'middle' };
    }
    ws.getCell(`B${r}`).font = { name: 'Arial', bold: true, size: 11 };
    ws.getCell(`E${r}`).font = { name: 'Arial', bold: true, size: 11 };
    ws.getCell(`B${r + 1}`).font = { name: 'Arial', italic: true, size: 9.5, color: { argb: 'FF64748B' } };
    ws.getCell(`E${r + 1}`).font = { name: 'Arial', italic: true, size: 9.5, color: { argb: 'FF64748B' } };
    ws.getCell(`B${r + 5}`).font = { name: 'Arial', bold: true, size: 11 };

    // Bảo đảm 100% các ô trên toàn bộ sheet đều dùng font Arial chuẩn Unicode tiếng Việt
    ws.eachRow((row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (!cell.font) {
          cell.font = { name: 'Arial', size: 10 };
        } else if (!cell.font.name) {
          cell.font.name = 'Arial';
        }
      });
    });

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  /** Báo cáo tài chính tổng hợp tất cả các chuyến (nút "Xuất Excel" ở trang Báo cáo). */
  async exportFinancialReportExcel(): Promise<Buffer> {
    const rows = await this.prisma.baoCaoQuyetToan.findMany({
      include: { LichKhoiHanh: { include: { Tour: { select: { TenTour: true } } } }, NhanVienLap: { select: { HoTen: true } } },
      orderBy: { NgayLap: 'desc' },
    });
    const wb = new ExcelJS.Workbook();
    wb.creator = 'VietTour Enterprise Travel System';
    wb.lastModifiedBy = 'VietTour Accounting';
    wb.created = new Date();
    wb.modified = new Date();

    const ws = wb.addWorksheet('Bao cao tai chinh', { views: [{ showGridLines: true }] });
    ws.columns = [
      { header: 'Mã lịch', key: 'ma', width: 18 },
      { header: 'Tên Tour Du Lịch', key: 'tour', width: 44 },
      { header: 'Ngày khởi hành', key: 'ngay', width: 18 },
      { header: 'Tổng thu vé', key: 'thu', width: 22 },
      { header: 'Tổng chi NCC', key: 'chi', width: 22 },
      { header: 'Lợi nhuận ròng', key: 'ln', width: 22 },
      { header: 'Người lập biểu', key: 'nguoi', width: 24 },
      { header: 'Trạng thái duyệt', key: 'tt', width: 18 },
    ];

    const headRow = ws.getRow(1);
    headRow.height = 24;
    headRow.eachCell((c) => {
      c.font = { name: 'Arial', bold: true, size: 10.5, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let tThu = 0, tChi = 0;
    for (const s of rows) {
      tThu += num(s.TongThu);
      tChi += num(s.TongChi);
      const r = ws.addRow({
        ma: s.LichKhoiHanh.MaLich,
        tour: s.LichKhoiHanh.Tour.TenTour,
        ngay: fmtDate(s.LichKhoiHanh.NgayKhoiHanh),
        thu: num(s.TongThu),
        chi: num(s.TongChi),
        ln: num(s.TongThu) - num(s.TongChi),
        nguoi: s.NhanVienLap.HoTen,
        tt: s.TrangThaiDuyet,
      });
      r.height = 20;
      r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(7).alignment = { horizontal: 'left', vertical: 'middle' };
      r.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
      for (let i = 1; i <= 8; i++) {
        r.getCell(i).font = { name: 'Arial', size: 10 };
      }
    }

    const total = ws.addRow({
      tour: 'TỔNG CỘNG TOÀN HỆ THỐNG',
      thu: tThu,
      chi: tChi,
      ln: tThu - tChi,
    });
    total.height = 22;
    total.font = { name: 'Arial', bold: true, size: 11 };
    for (const k of ['thu', 'chi', 'ln']) ws.getColumn(k).numFmt = VND_FMT;

    // Đảm bảo 100% ô đều dùng font Arial
    ws.eachRow((row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (!cell.font) {
          cell.font = { name: 'Arial', size: 10 };
        } else if (!cell.font.name) {
          cell.font.name = 'Arial';
        }
      });
    });

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  /** 3.3 PDF "BẢNG QUYẾT TOÁN TÀI CHÍNH TOUR DU LỊCH" có viền bảng, chi tiết lợi nhuận, trạng thái duyệt. */
  async generateSettlementPDF(id: number): Promise<Buffer> {
    const s = await this.loadSettlement(id);
    const lich = s.LichKhoiHanh;
    const pdf = createPdf();
    const { doc, t } = pdf;
    const left = doc.page.margins.left;
    const width = doc.page.width - left - doc.page.margins.right;

    return pdfToBuffer(pdf, () => {
      doc.font(pdf.bold).fontSize(11).fillColor('#C8102E').text(t('CÔNG TY LỮ HÀNH VIETTOUR'), { align: 'left' });
      doc.moveDown(0.5).font(pdf.bold).fontSize(17).fillColor('#0F172A').text(t('BẢNG QUYẾT TOÁN TÀI CHÍNH TOUR DU LỊCH'), { align: 'center' });
      doc.moveDown(0.6).font(pdf.regular).fontSize(10.5).fillColor('#334155');
      doc.text(t(`Tour: ${lich.Tour.TenTour}`));
      doc.text(t(`Mã lịch khởi hành: ${lich.MaLich}    Thời gian: ${fmtDate(lich.NgayKhoiHanh)} - ${fmtDate(lich.NgayKetThuc)}`));
      doc.text(t(`Người lập: ${s.NhanVienLap.HoTen}    Ngày lập: ${fmtDate(s.NgayLap)}`));
      doc.text(t(`Trạng thái duyệt: ${s.TrangThaiDuyet}`));
      doc.moveDown(0.8);

      const table = (title: string, heads: string[], widths: number[], body: string[][]) => {
        doc.font(pdf.bold).fontSize(11).fillColor('#0F172A').text(t(title));
        doc.moveDown(0.3);
        const rowH = 20;
        const drawRow = (cells: string[], head = false) => {
          if (doc.y + rowH > doc.page.height - doc.page.margins.bottom - 20) doc.addPage();
          const y = doc.y;
          let x = left;
          cells.forEach((c, i) => {
            if (head) doc.rect(x, y, widths[i], rowH).fillAndStroke('#E2E8F0', '#64748B');
            else doc.rect(x, y, widths[i], rowH).stroke('#94A3B8');
            doc.fillColor('#0F172A').font(head ? pdf.bold : pdf.regular).fontSize(9.5)
              .text(t(c), x + 5, y + 5, { width: widths[i] - 10, height: rowH - 6, ellipsis: true, lineBreak: false, align: i === cells.length - 1 && !head ? 'right' : 'left' });
            x += widths[i];
          });
          doc.y = y + rowH;
          doc.x = left;
        };
        drawRow(heads, true);
        if (body.length === 0) drawRow(['—', ...Array(heads.length - 1).fill('')]);
        body.forEach((b) => drawRow(b));
        doc.moveDown(0.8);
      };

      table('I. DOANH THU TỪ BOOKING', ['STT', 'Khách hàng', 'Mã đơn', 'Thành tiền'], [35, 200, 120, width - 355],
        lich.DonDatTour.map((d, i) => [String(i + 1), d.KhachHang.HoTen, d.MaDon, fmtVnd(num(d.TongTien) - num(d.GiamGia))]));
      table('II. CHI PHÍ NHÀ CUNG CẤP', ['STT', 'Nhà cung cấp', 'Mã phiếu', 'Thành tiền'], [35, 200, 120, width - 355],
        lich.PhieuDatDichVu.map((p, i) => [String(i + 1), p.NhaCungCap.TenNCC, p.MaPhieu, fmtVnd(p.TongTienDichVu)]));

      const profit = num(s.TongThu) - num(s.TongChi);
      table('III. PHÂN TÍCH LỢI NHUẬN', ['Hạng mục', 'Giá trị'], [width - 180, 180], [
        ['Tổng doanh thu', fmtVnd(s.TongThu)],
        ['Tổng chi phí nhà cung cấp', fmtVnd(s.TongChi)],
        ['Lợi nhuận ròng', fmtVnd(profit)],
        ['Biên lợi nhuận', num(s.TongThu) > 0 ? `${((profit / num(s.TongThu)) * 100).toFixed(1)} %` : '0 %'],
      ]);

      if (doc.y > doc.page.height - 190) doc.addPage();
      doc.moveDown(1).font(pdf.regular).fontSize(10).fillColor('#334155');
      const y = doc.y;
      doc.text(t('Người lập biểu (Kế toán)'), left, y, { width: width / 2, align: 'center' });
      doc.text(t('Giám đốc phê duyệt'), left + width / 2, y, { width: width / 2, align: 'center' });
      doc.fontSize(9).text(t('(Ký, ghi rõ họ tên)'), left, y + 14, { width: width / 2, align: 'center' });
      doc.text(t('(Ký, ghi rõ họ tên)'), left + width / 2, y + 14, { width: width / 2, align: 'center' });
      doc.font(pdf.bold).fontSize(10).text(t(s.NhanVienLap.HoTen), left, y + 80, { width: width / 2, align: 'center' });
    });
  }

  /** 3.4 PDF "BOARDING PASS / VÉ ĐIỆN TỬ VIETTOUR": thông tin hành trình, danh sách hành khách, mã QR. */
  async generateTicketPDF(maDon: string): Promise<Buffer> {
    const don = await this.prisma.donDatTour.findUnique({
      where: { MaDon: maDon },
      include: { KhachHang: true, ChiTietHanhKhach: { orderBy: { ChiTietID: 'asc' } }, LichKhoiHanh: { include: { Tour: true } } },
    });
    if (!don) throw new NotFoundException(`Không tìm thấy vé điện tử cho mã đơn: ${maDon}`);
    const lich = don.LichKhoiHanh;
    const tour = lich.Tour;
    const orderQr = await QRCode.toBuffer(don.MaDon, { width: 220, margin: 1 });
    const paxQrs = await Promise.all(don.ChiTietHanhKhach.map((p) => QRCode.toBuffer(p.MaQRVe || `VT-${don.MaDon}-${p.ChiTietID}`, { width: 140, margin: 1 })));

    const pdf = createPdf();
    const { doc, t } = pdf;
    const left = doc.page.margins.left;
    const width = doc.page.width - left - doc.page.margins.right;

    return pdfToBuffer(pdf, () => {
      doc.rect(0, 0, doc.page.width, 92).fill('#C8102E');
      doc.fillColor('#FFFFFF').font(pdf.bold).fontSize(22).text('VIETTOUR', left, 26);
      doc.font(pdf.regular).fontSize(11).text(t('BOARDING PASS / VÉ ĐIỆN TỬ'), left, 56);
      doc.font(pdf.bold).fontSize(12).text(don.MaDon, left, 34, { width, align: 'right' });
      doc.font(pdf.regular).fontSize(10).text(t(`Trạng thái: ${don.TrangThaiDon}`), left, 56, { width, align: 'right' });

      doc.fillColor('#0F172A').font(pdf.bold).fontSize(16).text(t(tour.TenTour), left, 112, { width: width - 150 });
      doc.image(orderQr, left + width - 120, 104, { width: 120 });
      doc.font(pdf.regular).fontSize(11).fillColor('#334155');
      const info: Array<[string, string]> = [
        ['Hành trình', `${tour.DiemKhoiHanh}  →  ${tour.DiemDen}`],
        ['Mã lịch', lich.MaLich],
        ['Khởi hành', fmtDateTime(lich.NgayKhoiHanh)],
        ['Kết thúc', fmtDateTime(lich.NgayKetThuc)],
        ['Phương tiện', tour.PhuongTien || '—'],
        ['Người đặt', `${don.KhachHang.HoTen} - ${don.KhachHang.SoDienThoai}`],
        ['Số khách', `${don.SoLuongNguoiLon} người lớn, ${don.SoLuongTreEm} trẻ em`],
        ['Tổng thanh toán', fmtVnd(num(don.TongTien) - num(don.GiamGia))],
      ];
      doc.y = 150;
      for (const [k, v] of info) {
        const y = doc.y;
        doc.font(pdf.bold).text(t(k), left, y, { width: 110, continued: false });
        doc.font(pdf.regular).text(t(v), left + 115, y, { width: width - 270 });
        doc.y = Math.max(doc.y, y + 16);
      }

      doc.moveDown(1.2);
      doc.font(pdf.bold).fontSize(12).fillColor('#0F172A').text(t('DANH SÁCH HÀNH KHÁCH & MÃ QR SOÁT VÉ'), left);
      doc.moveDown(0.4);

      don.ChiTietHanhKhach.forEach((p, i) => {
        const rowH = 76;
        if (doc.y + rowH > doc.page.height - doc.page.margins.bottom) doc.addPage();
        const y = doc.y;
        doc.rect(left, y, width, rowH - 6).stroke('#CBD5E1');
        doc.image(paxQrs[i], left + width - rowH + 2, y + 3, { width: rowH - 12 });
        doc.fillColor('#0F172A').font(pdf.bold).fontSize(11).text(t(`${i + 1}. ${p.HoTen}`), left + 10, y + 10, { width: width - rowH - 20 });
        doc.font(pdf.regular).fontSize(9.5).fillColor('#475569');
        doc.text(t(`Loại: ${p.LoaiKhach}${p.CCCD ? `   CCCD: ${p.CCCD}` : ''}`), left + 10, y + 28, { width: width - rowH - 20 });
        doc.text(t(`Mã vé: ${p.MaQRVe ?? '—'}`), left + 10, y + 43, { width: width - rowH - 20 });
        doc.y = y + rowH;
        doc.x = left;
      });

      doc.moveDown(0.5).font(pdf.regular).fontSize(9).fillColor('#64748B')
        .text(t('Vui lòng xuất trình mã QR này cho Hướng dẫn viên khi tập trung. Hotline: 1900 1234 — VietTour © 2026'), left, doc.y, { width, align: 'center' });
    });
  }
}

/** 4. Gửi email xác nhận kèm vé điện tử QR sau khi thanh toán thành công. Không bao giờ làm hỏng luồng thanh toán. */
@Injectable()
export class TicketMailService {
  private readonly logger = new Logger(TicketMailService.name);
  constructor(private prisma: PrismaService) {}

  async sendTicketEmail(maDon: string): Promise<void> {
    try {
      const don = await this.prisma.donDatTour.findUnique({
        where: { MaDon: maDon },
        include: { KhachHang: true, ChiTietHanhKhach: { orderBy: { ChiTietID: 'asc' } }, LichKhoiHanh: { include: { Tour: true } } },
      });
      const to = don?.KhachHang.Email;
      if (!don || !to) {
        this.logger.warn(`Bỏ qua gửi vé ${maDon}: không có email khách hàng`);
        return;
      }
      const tour = don.LichKhoiHanh.Tour;
      const attachments: Array<{ filename: string; content: Buffer; cid: string }> = [];
      let paxHtml = '';
      for (const p of don.ChiTietHanhKhach) {
        const cid = `qr-${p.ChiTietID}@viettour`;
        attachments.push({ filename: `${p.MaQRVe || p.ChiTietID}.png`, content: await QRCode.toBuffer(p.MaQRVe || `VT-${don.MaDon}-${p.ChiTietID}`, { width: 220, margin: 1 }), cid });
        paxHtml += `<tr><td style="padding:10px;border-bottom:1px solid #e2e8f0"><b>${p.HoTen}</b><br/><span style="color:#64748b;font-size:12px">${p.LoaiKhach} — ${p.MaQRVe ?? ''}</span></td><td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right"><img src="cid:${cid}" width="110" height="110" alt="QR"/></td></tr>`;
      }
      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;padding:28px 32px;color:#111111">
          <div style="border-bottom:1px solid #e5e7eb;padding-bottom:14px;margin-bottom:20px">
            <div style="font-size:16px;font-weight:700;color:#111111;letter-spacing:0.5px">VIETTOUR</div>
            <div style="font-size:13.5px;font-weight:600;color:#374151;margin-top:4px">Xác nhận thanh toán &amp; Vé điện tử (E-Ticket)</div>
          </div>
          <div style="color:#111111;font-size:14px;line-height:1.6">
            <p style="margin-top:0">Xin chào <b>${don.KhachHang.HoTen}</b>, VietTour xác nhận đã nhận đủ thanh toán cho đơn đặt tour <b>${don.MaDon}</b>.</p>
            <table style="width:100%;font-size:13.5px;border-collapse:collapse;border:1px solid #e5e7eb;margin:16px 0">
              <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563">Hành trình</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right"><b>${tour.TenTour}</b></td></tr>
              <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563">Khởi hành</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${fmtDateTime(don.LichKhoiHanh.NgayKhoiHanh)}</td></tr>
              <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563">Tuyến điểm</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${tour.DiemKhoiHanh} → ${tour.DiemDen}</td></tr>
              <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563">Số lượng khách</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${don.SoLuongNguoiLon} người lớn, ${don.SoLuongTreEm} trẻ em</td></tr>
              <tr><td style="padding:8px 12px;color:#111111"><b>Đã thanh toán</b></td><td style="padding:8px 12px;text-align:right"><b>${fmtVnd(num(don.TongTien) - num(don.GiamGia))}</b></td></tr>
            </table>
            <div style="font-size:14px;font-weight:700;margin:20px 0 8px;color:#111111">Danh sách vé điện tử &amp; Mã QR soát vé</div>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb">${paxHtml}</table>
            <p style="font-size:12px;color:#6b7280;margin-top:20px;border-top:1px solid #e5e7eb;padding-top:14px">
              Quý khách vui lòng xuất trình mã QR này và CCCD cho Hướng dẫn viên khi tập trung.<br/>
              Quầy giao dịch: Ga Quốc Nội, Sân bay Quốc tế Tân Sơn Nhất, TP.HCM • Hotline: 1900 1234
            </p>
          </div>
        </div>`;
      await createMailTransporter().sendMail({
        from: `"VietTour" <${getMailUser()}>`,
        to,
        subject: `[VietTour] Vé điện tử đơn ${don.MaDon} - ${tour.TenTour}`,
        html,
        attachments,
      });
      this.logger.log(`Đã gửi email vé điện tử ${don.MaDon} tới ${to}`);
    } catch (err) {
      this.logger.error(`Không thể gửi email vé ${maDon}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Controller('export')
export class ExportController {
  constructor(private service: ExportService) {}

  private send(res: Response, buf: Buffer, mime: string, filename: string) {
    res.set({
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buf.length),
      'Access-Control-Expose-Headers': 'Content-Disposition',
    });
    res.end(buf);
  }

  @Get('settlement/excel/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Ke toan')
  async settlementExcel(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    this.send(res, await this.service.exportSettlementExcel(id), XLSX_MIME, `quyet-toan-${id}.xlsx`);
  }

  @Get('settlement/pdf/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Ke toan')
  async settlementPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    this.send(res, await this.service.generateSettlementPDF(id), 'application/pdf', `quyet-toan-${id}.pdf`);
  }

  @Get('reports/excel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Ke toan')
  async reportExcel(@Res() res: Response) {
    this.send(res, await this.service.exportFinancialReportExcel(), XLSX_MIME, 'bao-cao-tai-chinh.xlsx');
  }

  /** Vé điện tử: mã đơn đóng vai trò mã tra cứu công khai (giống GET /bookings/ticket/:maDon). */
  @Get('ticket/pdf/:maDon')
  async ticketPdf(@Param('maDon') maDon: string, @Res() res: Response) {
    this.send(res, await this.service.generateTicketPDF(maDon), 'application/pdf', `ve-dien-tu-${maDon}.pdf`);
  }
}

@Module({
  controllers: [ExportController],
  providers: [ExportService, TicketMailService],
  exports: [ExportService, TicketMailService],
})
export class ExportModule {}
