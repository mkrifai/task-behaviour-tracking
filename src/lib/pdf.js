import { jsPDF } from 'jspdf';
import { formatIndonesianMonth, formatDurationHuman } from './time';

const SHORT_DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatShortDate(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  const dayName = SHORT_DAY_NAMES[dt.getDay()] || '';
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')} (${dayName})`;
}

function formatSessionRange(startIso, endIso) {
  if (!startIso) return '-';
  const st = new Date(startIso);
  const et = endIso ? new Date(endIso) : null;
  const day = String(st.getDate()).padStart(2, '0');
  const mStr = SHORT_MONTH_NAMES[st.getMonth()] || '';
  const stStr = `${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')}`;
  const etStr = et ? `${String(et.getHours()).padStart(2, '0')}:${String(et.getMinutes()).padStart(2, '0')}` : 'Selesai';
  return `${day} ${mStr}, ${stStr}-${etStr}`;
}

/**
 * Generate and download a comprehensive PDF report for a given month,
 * including key metrics, 24h composition, all individual categories,
 * full daily trend breakdown, complete task session history, and AI reflection.
 */
export function exportMonthlyReportPdf({ report, categories = [], settings = {}, aiReport = null }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2); // 182mm

  let y = margin;

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - margin - 8) {
      doc.addPage();
      y = margin + 2;
      return true;
    }
    return false;
  };

  // =========================================================================
  // 1. HEADER BANNER
  // =========================================================================
  doc.setFillColor(79, 70, 229); // Indigo #4f46e5
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('HABITPULSE • LAPORAN BULANAN', margin + 8, y + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255);
  const dateLabel = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  doc.text(`Periode: ${formatIndonesianMonth(report.yearMonth)}   |   Dibuat: ${dateLabel} WIB`, margin + 8, y + 17.5);

  y += 30;

  // =========================================================================
  // 2. RINGKASAN EKSEKUTIF (KEY METRICS)
  // =========================================================================
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Ringkasan Eksekutif (Key Metrics)', margin, y);
  y += 5;

  const kpiItems = [
    { label: 'Total Waktu Kerja', value: `${(report.workMonthMs / (3600 * 1000)).toFixed(1)} Jam` },
    { label: 'Total Waktu Keluarga', value: `${(report.familyMonthMs / (3600 * 1000)).toFixed(1)} Jam` },
    { label: 'Total Diri Sendiri', value: `${(report.selfMonthMs / (3600 * 1000)).toFixed(1)} Jam` },
    { label: 'Rata-rata Tidur / Hari', value: `${report.avgDayComposition.sleepHours.toFixed(1)} Jam` },
    { label: 'Tugas Selesai', value: `${report.tasksCompletedCount} Tugas` },
    { label: 'Hari Aktif & Check-in', value: `${report.activeDaysCount} Hari (${report.checkinDaysCount} Check-in)` },
  ];

  const colWidth = (contentWidth - 8) / 3;
  const boxHeight = 15;

  kpiItems.forEach((item, idx) => {
    const colIdx = idx % 3;
    const rowIdx = Math.floor(idx / 3);
    const bx = margin + colIdx * (colWidth + 4);
    const by = y + rowIdx * (boxHeight + 3.5);

    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(bx, by, colWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(item.label, bx + 4, by + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(item.value, bx + 4, by + 11.5);
  });

  y += (2 * (boxHeight + 3.5)) + 6;

  // =========================================================================
  // 3. KOMPOSISI 24 JAM (RATA-RATA HARIAN)
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Komposisi 24 Jam (Rata-rata Harian)', margin, y);
  y += 5;

  const compData = [
    { name: 'Kerja', val: report.avgDayComposition.workHours, color: [100, 116, 139] },
    { name: 'Keluarga', val: report.avgDayComposition.familyHours, color: [244, 114, 182] },
    { name: 'Diri Sendiri', val: report.avgDayComposition.selfHours, color: [52, 211, 153] },
    { name: 'Tidur', val: report.avgDayComposition.sleepHours, color: [167, 139, 250] },
    { name: 'Istirahat Soft', val: report.avgDayComposition.softRestHours, color: [56, 189, 248] },
  ];

  compData.forEach((c) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    doc.text(c.name, margin + 2, y + 3.5);

    const valText = `${c.val.toFixed(1)} jam`;
    doc.setFont('helvetica', 'bold');
    doc.text(valText, margin + 34, y + 3.5);

    const barX = margin + 54;
    const barMaxW = contentWidth - 56;
    const barW = Math.max(2, Math.min(barMaxW, (c.val / 24) * barMaxW));

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(barX, y + 0.8, barMaxW, 3.5, 1, 1, 'F');

    doc.setFillColor(c.color[0], c.color[1], c.color[2]);
    doc.roundedRect(barX, y + 0.8, barW, 3.5, 1, 1, 'F');

    y += 5.5;
  });

  y += 6;

  // =========================================================================
  // 4. RINCIAN ALOKASI PER KATEGORI (SELURUH KATEGORI - TANPA OTHER)
  // =========================================================================
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Rincian Alokasi Per Kategori', margin, y);
  y += 5;

  // Header table
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 6.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  doc.text('KODE', margin + 4, y + 4.5);
  doc.text('NAMA KATEGORI', margin + 26, y + 4.5);
  doc.text('KELOMPOK', margin + 100, y + 4.5);
  doc.text('TOTAL WAKTU', margin + 138, y + 4.5);
  doc.text('PORSI', margin + 166, y + 4.5);

  y += 6.5;

  const categoriesToShow = report.allCategories || report.rankedCategories || [];

  if (categoriesToShow.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Belum ada kategori yang terdaftar.', margin + 4, y + 5);
    y += 9;
  } else {
    categoriesToShow.forEach((cat, index) => {
      checkPageBreak(7);
      const isAlt = index % 2 === 1;
      if (isAlt) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 6, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(15, 23, 42);
      doc.text(`[${cat.code}]`, margin + 4, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.text(cat.name || '-', margin + 26, y + 4.2);
      
      const groupLabel = cat.group === 'family' ? 'Keluarga' : cat.group === 'self' ? 'Diri Sendiri' : 'Kerja';
      doc.setTextColor(100, 116, 139);
      doc.text(groupLabel, margin + 100, y + 4.2);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${cat.hours || '0.0'}j`, margin + 138, y + 4.2);
      doc.text(`${cat.percentage || '0.0'}%`, margin + 166, y + 4.2);

      y += 6;
    });
  }

  y += 8;

  // =========================================================================
  // 5. TREN HARIAN (DAILY PROGRESSION BREAKDOWN)
  // =========================================================================
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Tren Harian (Rincian per Hari)', margin, y);
  y += 5;

  // Table header for Tren Harian
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 6.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('TANGGAL', margin + 4, y + 4.5);
  doc.text('KERJA', margin + 35, y + 4.5);
  doc.text('KELUARGA', margin + 60, y + 4.5);
  doc.text('DIRI SENDIRI', margin + 88, y + 4.5);
  doc.text('TIDUR', margin + 118, y + 4.5);
  doc.text('ISTIRAHAT', margin + 142, y + 4.5);
  doc.text('CHECK-IN', margin + 166, y + 4.5);

  y += 6.5;

  const evaluatedDaily = (report.dailyBreakdowns || []).filter(b => !b.isFuture);

  if (evaluatedDaily.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Belum ada data harian untuk periode ini.', margin + 4, y + 5);
    y += 9;
  } else {
    evaluatedDaily.forEach((day, index) => {
      checkPageBreak(6.5);
      const isAlt = index % 2 === 1;
      if (isAlt) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 5.8, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(formatShortDate(day.logicalDate), margin + 4, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${(day.workMs / 3600000).toFixed(1)}j`, margin + 35, y + 4);
      doc.text(`${(day.familyMs / 3600000).toFixed(1)}j`, margin + 60, y + 4);
      doc.text(`${(day.selfMs / 3600000).toFixed(1)}j`, margin + 88, y + 4);
      doc.text(`${(day.sleepMs / 3600000).toFixed(1)}j`, margin + 118, y + 4);
      doc.text(`${(day.softRestMs / 3600000).toFixed(1)}j`, margin + 142, y + 4);

      if (day.checkedIn) {
        doc.setTextColor(5, 150, 105);
        doc.setFont('helvetica', 'bold');
        doc.text('✓ Ya', margin + 166, y + 4);
      } else {
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text('-', margin + 166, y + 4);
      }

      y += 5.8;
    });
  }

  y += 8;

  // =========================================================================
  // 6. RIWAYAT TUGAS & SESI AKTIVITAS (COMPLETE TASK HISTORY LOG)
  // =========================================================================
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('5. Riwayat Tugas & Sesi Aktivitas', margin, y);
  y += 5;

  // Table header for Riwayat
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 6.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('WAKTU', margin + 4, y + 4.5);
  doc.text('KATEGORI', margin + 38, y + 4.5);
  doc.text('DESKRIPSI TUGAS / RUTINITAS', margin + 68, y + 4.5);
  doc.text('TIPE', margin + 148, y + 4.5);
  doc.text('DURASI', margin + 166, y + 4.5);

  y += 6.5;

  const monthSessions = report.monthSessions || [];

  if (monthSessions.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Belum ada sesi tugas atau rutinitas yang terekam pada bulan ini.', margin + 4, y + 5);
    y += 9;
  } else {
    monthSessions.forEach((sess, index) => {
      checkPageBreak(6.5);
      const isAlt = index % 2 === 1;
      if (isAlt) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 5.8, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(71, 85, 105);
      doc.text(formatSessionRange(sess.start, sess.end), margin + 4, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`[${sess.categoryCode || 'AKT'}]`, margin + 38, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const desc = sess.taskDescription || 'Aktivitas';
      const truncatedDesc = desc.length > 48 ? desc.slice(0, 46) + '...' : desc;
      doc.text(truncatedDesc, margin + 68, y + 4);

      doc.setTextColor(100, 116, 139);
      doc.text(sess.taskType === 'routine' ? 'Rutinitas' : 'Tugas', margin + 148, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatDurationHuman(sess.durationMs), margin + 166, y + 4);

      y += 5.8;
    });
  }

  y += 8;

  // =========================================================================
  // 7. REFLEKSI & REKOMENDASI AI (GOOGLE GEMINI)
  // =========================================================================
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('6. Refleksi & Rekomendasi AI (Google Gemini)', margin, y);
  y += 5;

  const aiContent = aiReport?.content?.trim();
  const boxPadding = 6;
  const textBoxWidth = contentWidth - (boxPadding * 2);

  if (aiContent) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    const splitLines = doc.splitTextToSize(aiContent, textBoxWidth);
    const lineHeight = 4.3;

    let currentLineIdx = 0;
    while (currentLineIdx < splitLines.length) {
      checkPageBreak(25);
      const availableHeight = pageHeight - margin - y - 10;
      const linesPerPage = Math.max(3, Math.floor((availableHeight - (boxPadding * 2)) / lineHeight));
      const chunk = splitLines.slice(currentLineIdx, currentLineIdx + linesPerPage);
      const chunkHeight = (chunk.length * lineHeight) + (boxPadding * 2);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(199, 210, 254); // indigo-200
      doc.roundedRect(margin, y, contentWidth, chunkHeight, 2, 2, 'FD');

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.3);
      doc.text(chunk, margin + boxPadding, y + boxPadding + 3.5);

      y += chunkHeight + 4;
      currentLineIdx += linesPerPage;
    }
  } else {
    const noticeHeight = 16;
    doc.setFillColor(254, 252, 232); // amber-50
    doc.setDrawColor(254, 240, 138); // amber-200
    doc.roundedRect(margin, y, contentWidth, noticeHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(161, 98, 7); // amber-700
    doc.text(
      'Catatan: Refleksi AI untuk periode ini belum di-generate di aplikasi. Silakan buka tab Laporan dan klik "Mulai Analisis" dengan Google Gemini API Key untuk menyertakan evaluasi personal otomatis.',
      margin + 4,
      y + 5.5,
      { maxWidth: textBoxWidth }
    );
    y += noticeHeight + 8;
  }

  // =========================================================================
  // FOOTER WITH PAGE NUMBERS
  // =========================================================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(148, 163, 184);
    doc.text('HabitPulse • Task Behaviour Tracking System', margin, pageHeight - 7);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin - 22, pageHeight - 7);
  }

  const filename = `HabitPulse_Laporan_${report.yearMonth}.pdf`;
  doc.save(filename);
}
