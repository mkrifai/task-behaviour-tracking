/**
 * AI Monthly Feedback Generator using Gemini
 */

export function buildMonthlyPrompt({ report, categories, monthLabel }) {
  const {
    avgDayComposition,
    rankedCategories,
    activeDaysCount,
    daysEvaluated,
    tasksCompletedCount,
    fragmentedTasks
  } = report;

  const categoryLines = rankedCategories
    .map(c => `- ${c.name} (${c.code}) [Kelompok: ${c.group}]: ${c.hours} jam (${c.percentage}%) dalam ${c.sessionCount} sesi`)
    .join('\n');

  const fragmentedLines = fragmentedTasks.length > 0
    ? fragmentedTasks.map(f => `- "${f.description}" (${f.category?.name || 'Umum'}): dipecah menjadi ${f.sessionCount} sesi kerja`).join('\n')
    : '- Tidak ada tugas dengan pemecahan sesi berlebih.';

  return `
Kamu adalah seorang penasihat & coach produktivitas personal yang bijak, empatik, konstruktif, dan sangat menghargai keseimbangan hidup (work-life harmony).

Berikut adalah ringkasan pola aktivitas dan alokasi waktu saya selama bulan **${monthLabel}**:

### 1. Rata-rata Komposisi 24 Jam per Hari:
- **Produktif / Kerja**: ${avgDayComposition.workHours.toFixed(1)} jam / hari
- **Waktu Keluarga (FAM)**: ${avgDayComposition.familyHours.toFixed(1)} jam / hari
- **Waktu untuk Diri Sendiri (ME)**: ${avgDayComposition.selfHours.toFixed(1)} jam / hari
- **Tidur**: ${avgDayComposition.sleepHours.toFixed(1)} jam / hari (malam + siang)
- **Istirahat Soft / Waktu Luang**: ${avgDayComposition.softRestHours.toFixed(1)} jam / hari
*(Berdasarkan ${activeDaysCount} hari aktif dari total ${daysEvaluated} hari yang dievaluasi).*

### 2. Alokasi Waktu per Kategori:
${categoryLines || '- Belum ada tugas yang dicatat.'}

### 3. Tugas & Efisiensi:
- Total Tugas Diselesaikan: **${tasksCompletedCount} tugas**
- Tugas yang Paling Sering Terjeda/Terpecah ke Banyak Sesi:
${fragmentedLines}

---

### Instruksi untuk Kamu:
Buatkan analisis bulanan yang mendalam, ramah, dan tidak menghakimi dalam Bahasa Indonesia dengan format Markdown:

1. **Apresiasi & Refleksi Keseimbangan Hidup**:
   - Berikan pandangan objektif mengenai proporsi antara Kerja, Keluarga (FAM), Diri Sendiri (ME), dan Istirahat (Tidur & Soft Rest).
   - Apakah alokasi waktu untuk keluarga dan istirahat sudah sehat dan berkelanjutan?

2. **Analisis Pola Kerja & Efisiensi**:
   - Soroti kategori yang menyerap energi terbesar bulan ini.
   - Analisis tugas yang terpecah ke banyak sesi: apakah ini indikasi multitasking / interupsi, atau ritme kerja yang wajar?

3. **3–4 Saran Konkret & Realistis untuk Bulan Depan**:
   - Berikan langkah kecil yang mudah diterapkan tanpa menambah beban stres.
   - Saran untuk menjaga kehadiran utuh bersama anak/keluarga tanpa merasa bersalah pada pekerjaan.

Gunakan gaya bahasa yang hangat, menyemangati, dan elegan.
`.trim();
}

/**
 * Call Gemini API using direct API key
 */
export async function fetchGeminiMonthlyFeedback({ apiKey, prompt }) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API Key Gemini belum diatur. Silakan masukkan di Pengaturan.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gagal menghubungi Gemini API (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Respons dari Gemini kosong atau tidak valid.');
  }

  return text;
}
