import { formatTimeHHMM, getLogicalDateString } from './time';

/**
 * Trigger download of CSV file in the browser
 */
function downloadCsvFile(csvContent, fileName) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export all sessions to CSV
 */
export function exportSessionsToCsv({ sessions, tasks, categories, settings }) {
  const cutoffHour = settings.cutoffHour ?? 4;
  const taskMap = {};
  tasks.forEach(t => { taskMap[t.id] = t; });

  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  const headers = [
    'Tanggal (Logis)',
    'Jam Mulai',
    'Jam Selesai',
    'Durasi (Menit)',
    'Durasi (Jam)',
    'Kode Kategori',
    'Nama Kategori',
    'Kelompok',
    'Deskripsi Tugas',
    'Tipe',
    'Sumber'
  ];

  const rows = sessions.map(sess => {
    const task = taskMap[sess.taskId];
    const cat = catMap[sess.categoryId];
    const start = new Date(sess.start);
    const end = sess.end ? new Date(sess.end) : null;
    const durationMs = end ? end.getTime() - start.getTime() : 0;
    const durationMin = Math.round(durationMs / 60000);
    const durationHours = (durationMs / (3600 * 1000)).toFixed(2);
    const logicalDate = getLogicalDateString(start, cutoffHour);

    const groupLabel = {
      work: 'Produktif / Kerja',
      family: 'Keluarga',
      self: 'Diri Sendiri'
    }[cat?.group] || cat?.group || 'Produktif';

    return [
      `"${logicalDate}"`,
      `"${formatTimeHHMM(start)}"`,
      `"${end ? formatTimeHHMM(end) : 'Berjalan'}"`,
      durationMin,
      durationHours,
      `"${cat ? cat.code : 'OTHER'}"`,
      `"${cat ? cat.name : 'Lainnya'}"`,
      `"${groupLabel}"`,
      `"${(task ? task.description : 'Sesi').replace(/"/g, '""')}"`,
      `"${task?.type === 'routine' ? 'Rutinitas' : 'Tugas'}"`,
      `"${sess.source || 'timer'}"`
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\r\n');
  const filename = `Task_Tracking_Sesi_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsvFile(csv, filename);
}

/**
 * Export monthly report summary to CSV
 */
export function exportMonthlySummaryToCsv({ report, yearMonth }) {
  const headers = [
    'Kategori / Komponen',
    'Kode',
    'Kelompok',
    'Total Jam',
    'Persentase Waktu Tercatat (%)',
    'Jumlah Sesi'
  ];

  const catRows = report.rankedCategories.map(c => [
    `"${c.name}"`,
    `"${c.code}"`,
    `"${c.group}"`,
    c.hours,
    c.percentage,
    c.sessionCount
  ].join(','));

  const summarySection = [
    '',
    '=== RATA-RATA KOMPOSISI 24 JAM PER HARI ===',
    `"Produktif / Kerja",,,${report.avgDayComposition.workHours.toFixed(1)} jam`,
    `"Keluarga",,,${report.avgDayComposition.familyHours.toFixed(1)} jam`,
    `"Diri Sendiri",,,${report.avgDayComposition.selfHours.toFixed(1)} jam`,
    `"Tidur",,,${report.avgDayComposition.sleepHours.toFixed(1)} jam`,
    `"Istirahat Soft",,,${report.avgDayComposition.softRestHours.toFixed(1)} jam`,
    '',
    `"Hari Aktif/Tercatat",,,${report.activeDaysCount} dari ${report.daysEvaluated} hari`,
    `"Tugas Selesai",,,${report.tasksCompletedCount} tugas`
  ];

  const csv = [headers.join(','), ...catRows, ...summarySection].join('\r\n');
  const filename = `Laporan_Bulanan_${yearMonth}.csv`;
  downloadCsvFile(csv, filename);
}
