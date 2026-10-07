import React, { useState } from 'react';
import { 
  generateMonthlyReport, 
  compareWithPreviousMonth 
} from '../lib/reports';
import { formatIndonesianMonth, getCurrentLogicalMonth } from '../lib/time';
import { exportSessionsToCsv, exportMonthlySummaryToCsv } from '../lib/csv';
import { exportMonthlyReportPdf } from '../lib/pdf';
import { buildMonthlyPrompt, fetchGeminiMonthlyFeedback } from '../lib/ai';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  FileText,
  Sparkles, 
  AlertCircle
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export function ReportsPage({
  sessions,
  tasks,
  categories,
  daysMap,
  settings,
  aiReports,
  onSaveAiReport
}) {
  const cutoffHour = settings.cutoffHour ?? 4;
  const currentMonth = getCurrentLogicalMonth(cutoffHour);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const report = generateMonthlyReport({
    yearMonth: selectedMonth,
    sessions,
    tasks,
    categories,
    daysMap,
    settings
  });

  const [currY, currM] = selectedMonth.split('-').map(Number);
  const prevDate = new Date(currY, currM - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevReport = generateMonthlyReport({
    yearMonth: prevMonthStr,
    sessions,
    tasks,
    categories,
    daysMap,
    settings
  });

  const monthDiff = compareWithPreviousMonth(report, prevReport);
  const cachedAiReport = aiReports[selectedMonth];

  const handlePrevMonth = () => setSelectedMonth(prevMonthStr);
  const handleNextMonth = () => {
    const nextDate = new Date(currY, currM, 1);
    setSelectedMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleGenerateAi = async () => {
    setIsAiLoading(true);
    setAiError('');

    try {
      const apiKey = settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
      const prompt = buildMonthlyPrompt({
        report,
        categories,
        monthLabel: formatIndonesianMonth(selectedMonth)
      });

      const responseText = await fetchGeminiMonthlyFeedback({ apiKey, prompt });

      onSaveAiReport(selectedMonth, {
        content: responseText,
        statsSnapshot: {
          trackedMs: report.totalTrackedMonthMs,
          workMs: report.workMonthMs,
          familyMs: report.familyMonthMs
        }
      });
    } catch (err) {
      setAiError(err.message || 'Terjadi kesalahan saat memproses feedback AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Chart 1: Horizontal Bar - 24-Hour Average Day Composition
  const balanceChartData = {
    labels: ['Kerja', 'Keluarga', 'Diri Sendiri', 'Tidur', 'Istirahat Soft'],
    datasets: [
      {
        label: 'Jam / Hari',
        data: [
          parseFloat(report.avgDayComposition.workHours.toFixed(1)),
          parseFloat(report.avgDayComposition.familyHours.toFixed(1)),
          parseFloat(report.avgDayComposition.selfHours.toFixed(1)),
          parseFloat(report.avgDayComposition.sleepHours.toFixed(1)),
          parseFloat(report.avgDayComposition.softRestHours.toFixed(1)),
        ],
        backgroundColor: [
          '#64748b',
          '#f472b6',
          '#34d399',
          '#a78bfa',
          '#38bdf8',
        ],
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  const horizontalBalanceOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.parsed.x} jam / hari`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#94a3b8',
          callback: (val) => `${val}j`
        }
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#475569',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }
        }
      }
    }
  };

  // Chart 2: Horizontal Bar - Category Breakdown
  const catChartData = {
    labels: report.rankedCategories.map(c => `[${c.code}] ${c.name}`),
    datasets: [
      {
        label: 'Total Jam',
        data: report.rankedCategories.map(c => parseFloat(c.hours)),
        backgroundColor: report.rankedCategories.map(c => c.color || '#6366f1'),
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  const horizontalCatOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.parsed.x} jam (${report.rankedCategories[context.dataIndex]?.percentage}%)`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#94a3b8',
          callback: (val) => `${val}j`
        }
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#475569',
          font: { family: 'Plus Jakarta Sans', size: 10.5, weight: '500' }
        }
      }
    }
  };

  // Chart 3: Stacked Daily Trend across month
  const trendLabels = report.dailyBreakdowns.map((_, i) => String(i + 1));
  const trendChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Kerja',
        data: report.dailyBreakdowns.map(b => (b.workMs / (3600 * 1000)).toFixed(1)),
        backgroundColor: '#64748b',
        borderRadius: 2,
      },
      {
        label: 'Keluarga',
        data: report.dailyBreakdowns.map(b => (b.familyMs / (3600 * 1000)).toFixed(1)),
        backgroundColor: '#f472b6',
        borderRadius: 2,
      },
      {
        label: 'Diri Sendiri',
        data: report.dailyBreakdowns.map(b => (b.selfMs / (3600 * 1000)).toFixed(1)),
        backgroundColor: '#34d399',
        borderRadius: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#64748b', font: { family: 'Plus Jakarta Sans', size: 11 } }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { display: false } },
      y: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#f1f5f9' } }
    },
    plugins: {
      legend: {
        labels: { color: '#64748b', font: { family: 'Plus Jakarta Sans', size: 11 } }
      }
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Month Navigator Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={handlePrevMonth} className="action-icon-btn" title="Bulan sebelumnya">
            <ChevronLeft size={18} />
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', minWidth: '150px', textAlign: 'center' }}>
            {formatIndonesianMonth(selectedMonth)}
          </h1>
          <button onClick={handleNextMonth} className="action-icon-btn" title="Bulan berikutnya">
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => exportSessionsToCsv({ sessions, tasks, categories, settings })}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 10px' }}
            title="Unduh log sesi CSV"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>

          <button
            onClick={() => exportMonthlyReportPdf({ report, categories, settings, aiReport: cachedAiReport })}
            className="btn-primary"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            title="Unduh laporan bulanan lengkap dan refleksi AI dalam format PDF"
          >
            <FileText size={13} />
            <span>Unduh Laporan (PDF)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Compact on Android) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '16px' }}>
        <div className="card-elevated" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Kerja</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
            {(report.workMonthMs / (3600 * 1000)).toFixed(1)}j
          </div>
          {monthDiff && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
              {monthDiff.workDiffHours}
            </div>
          )}
        </div>

        <div className="card-elevated" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Keluarga</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
            {(report.familyMonthMs / (3600 * 1000)).toFixed(1)}j
          </div>
          {monthDiff && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
              {monthDiff.familyDiffHours}
            </div>
          )}
        </div>

        <div className="card-elevated" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Diri Sendiri</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
            {(report.selfMonthMs / (3600 * 1000)).toFixed(1)}j
          </div>
          {monthDiff && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
              {monthDiff.selfDiffHours}
            </div>
          )}
        </div>

        <div className="card-elevated" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tidur/Hari</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
            {report.avgDayComposition.sleepHours.toFixed(1)}j
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Selesai</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
            {report.tasksCompletedCount}
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '14px' }}>
        <div className="card-glass" style={{ padding: '14px 16px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
            Komposisi 24 Jam
          </h3>
          <div style={{ height: '200px', position: 'relative' }}>
            <Bar data={balanceChartData} options={horizontalBalanceOptions} />
          </div>
        </div>

        <div className="card-glass" style={{ padding: '14px 16px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
            Alokasi Kategori
          </h3>
          {report.rankedCategories.length === 0 ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
              Belum ada data
            </div>
          ) : (
            <div style={{ height: Math.max(200, report.rankedCategories.length * 32) + 'px', position: 'relative' }}>
              <Bar data={catChartData} options={horizontalCatOptions} />
            </div>
          )}
        </div>
      </div>

      {/* Daily Progression Bar */}
      <div className="card-glass" style={{ padding: '14px 16px', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
          Tren Harian
        </h3>
        <div style={{ height: '190px', position: 'relative' }}>
          <Bar data={trendChartData} options={barOptions} />
        </div>
      </div>

      {/* AI Monthly Reflection */}
      <div className="card-elevated" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} style={{ color: 'var(--accent-emerald)' }} />
            <span>Refleksi Bulanan AI</span>
          </div>

          <button
            onClick={handleGenerateAi}
            disabled={isAiLoading}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <span>{isAiLoading ? 'Menganalisis...' : cachedAiReport ? 'Perbarui' : 'Mulai Analisis'}</span>
          </button>
        </div>

        {aiError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.78rem', marginBottom: '10px' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{aiError}</span>
          </div>
        )}

        {cachedAiReport ? (
          <div 
            style={{ 
              background: 'var(--bg-base)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '14px', 
              border: '1px solid var(--border-subtle)',
              lineHeight: '1.6',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              whiteSpace: 'pre-wrap'
            }}
          >
            {cachedAiReport.content}
          </div>
        ) : (
          !isAiLoading && (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
              Klik tombol untuk ulasan pola waktu bulan ini.
            </div>
          )
        )}
      </div>
    </div>
  );
}
