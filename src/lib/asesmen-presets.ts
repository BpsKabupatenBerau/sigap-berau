import { prisma } from "@/lib/prisma";

export type AssessmentQuestionType =
  | "SCALE_0_3"
  | "NUMBER"
  | "SCALE_1_5"
  | "YES_NO"
  | "TEXT";

export interface PresetQuestionItem {
  order: number;
  domainCode: string;
  indicatorRef: string;
  questionText: string;
  helpText: string;
  questionType: AssessmentQuestionType;
  weight: number;
}

export interface AssessmentPresetTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  questions: PresetQuestionItem[];
}

export interface ReadinessCategoryInfo {
  minPct: number;
  maxPct: number;
  category: "Belum Siap" | "Perlu Penguatan" | "Cukup Siap" | "Siap";
  badgeVariant: "destructive" | "warning" | "teal" | "success";
  arahanPembinaan: string;
}

// Bagian E: Skala Penilaian Resmi (0–3) dari Instrumen_Assessment_Kesiapan_OPD_Statistik_Sektoral_Berau.docx
export const SCALE_0_3_DEFINITIONS: Record<
  number,
  { score: number; title: string; desc: string }
> = {
  0: {
    score: 0,
    title: "Skor 0 — Belum Tersedia",
    desc: "Belum mengetahui / belum memahami atau belum memiliki mekanisme.",
  },
  1: {
    score: 1,
    title: "Skor 1 — Mengetahui (Belum Diterapkan)",
    desc: "Memahami secara umum / ditunjuk informal, tetapi belum diterapkan.",
  },
  2: {
    score: 2,
    title: "Skor 2 — Sebagian Diterapkan",
    desc: "Sudah melaksanakan sebagian, tetapi belum konsisten atau belum lengkap.",
  },
  3: {
    score: 3,
    title: "Skor 3 — Konsisten & Terdokumentasi",
    desc: "Dilaksanakan konsisten dan memiliki bukti dukung / mekanisme yang berjalan.",
  },
};

// Bagian F: Penghitungan Nilai dan Kategori Kesiapan (0–25, 26–50, 51–75, 76–100)
export const READINESS_CATEGORIES: ReadinessCategoryInfo[] = [
  {
    minPct: 0,
    maxPct: 25,
    category: "Belum Siap",
    badgeVariant: "destructive",
    arahanPembinaan:
      "Pembinaan mendasar mengenai konsep dan tahapan Statistik Sektoral.",
  },
  {
    minPct: 26,
    maxPct: 50,
    category: "Perlu Penguatan",
    badgeVariant: "warning",
    arahanPembinaan:
      "Penguatan pemahaman, tata kelola, dan penerapan dasar.",
  },
  {
    minPct: 51,
    maxPct: 75,
    category: "Cukup Siap",
    badgeVariant: "teal",
    arahanPembinaan:
      "Pendampingan untuk melengkapi dan meningkatkan konsistensi.",
  },
  {
    minPct: 76,
    maxPct: 100,
    category: "Siap",
    badgeVariant: "success",
    arahanPembinaan:
      "Penguatan keberlanjutan, kualitas, integrasi, dan pemanfaatan data.",
  },
];

export function getReadinessCategory(pct?: number | null): ReadinessCategoryInfo {
  const val = Math.min(100, Math.max(0, Math.round(pct || 0)));
  if (val <= 25) return READINESS_CATEGORIES[0];
  if (val <= 50) return READINESS_CATEGORIES[1];
  if (val <= 75) return READINESS_CATEGORIES[2];
  return READINESS_CATEGORIES[3];
}

// Bagian G: Arah Pembinaan Berdasarkan Hasil Assessment
export const ARAH_PEMBINAAN_RECOMMENDATIONS: Array<{
  aspekRef: string;
  temuan: string;
  rekomendasi: string;
}> = [
  {
    aspekRef: "Aspek I & III",
    temuan: "Belum memahami konsep Statistik Sektoral",
    rekomendasi:
      "Sosialisasi dasar Statistik Sektoral dan tahapan penyelenggaraan kegiatan statistik.",
  },
  {
    aspekRef: "Aspek IV (No. 16–17)",
    temuan: "Belum memahami Standar Data Statistik",
    rekomendasi: "Bimbingan teknis Standar Data Statistik (SDS).",
  },
  {
    aspekRef: "Aspek IV (No. 18–20)",
    temuan: "Belum memiliki metadata",
    rekomendasi:
      "Pendampingan penyusunan metadata kegiatan (MS-Keg), variabel (MS-Var), dan indikator statistik (MS-Ind).",
  },
  {
    aspekRef: "Aspek III (No. 14–15)",
    temuan: "Belum memahami rekomendasi kegiatan statistik",
    rekomendasi:
      "Pendampingan konsultasi dan pengajuan rekomendasi melalui aplikasi Romantik BPS sesuai ketentuan.",
  },
  {
    aspekRef: "Aspek V (No. 21–24)",
    temuan: "Belum memiliki mekanisme pemeriksaan data",
    rekomendasi:
      "Bimbingan teknis penjaminan kualitas dan validasi data sebelum dipublikasikan.",
  },
  {
    aspekRef: "Aspek VII (No. 28–30)",
    temuan: "Belum memiliki publikasi/media diseminasi",
    rekomendasi: "Pendampingan penyusunan publikasi dan penyajian data statistik.",
  },
  {
    aspekRef: "Aspek VI (No. 25–27)",
    temuan: "Belum terintegrasi dengan mekanisme Satu Data Indonesia",
    rekomendasi:
      "Fasilitasi koordinasi dan integrasi dengan Walidata (Diskominfo) serta OPD terkait.",
  },
];

// 30 Pertanyaan Resmi dari Instrumen_Assessment_Kesiapan_OPD_Statistik_Sektoral_Berau.docx
export const OFFICIAL_30_INSTRUMEN_QUESTIONS: PresetQuestionItem[] = [
  // I. Kelembagaan dan Tata Kelola Statistik
  {
    order: 1,
    domainCode: "I. Kelembagaan dan Tata Kelola",
    indicatorRef: "Aspek I.1",
    questionText:
      "Apakah OPD telah menetapkan unit kerja atau pejabat yang bertanggung jawab dalam penyelenggaraan Statistik Sektoral?",
    helpText:
      "Pilihan Kondisi: Belum ada (Skor 0–1) / Ditunjuk informal (Skor 2) / Ditetapkan formal dengan SK (Skor 3). Sertakan nomor SK jika ada.",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 2,
    domainCode: "I. Kelembagaan dan Tata Kelola",
    indicatorRef: "Aspek I.2",
    questionText:
      "Apakah tersedia pembagian tugas antara bidang teknis, pengelola data, dan operator statistik?",
    helpText:
      "Pilihan Kondisi: Belum ada (Skor 0–1) / Sebagian (Skor 2) / Jelas dan terdokumentasi (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 3,
    domainCode: "I. Kelembagaan dan Tata Kelola",
    indicatorRef: "Aspek I.3",
    questionText:
      "Apakah OPD memiliki SOP/pedoman pengumpulan, pengolahan, pemeriksaan, dan penyebarluasan data?",
    helpText:
      "Pilihan Kondisi: Belum ada (Skor 0) / Sedang disusun (Skor 1–2) / Tersedia dan diterapkan (Skor 3). Cantumkan nomor/nama SOP pada kolom bukti.",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 4,
    domainCode: "I. Kelembagaan dan Tata Kelola",
    indicatorRef: "Aspek I.4",
    questionText:
      "Apakah kegiatan statistik telah dimasukkan ke dalam perencanaan dan program kerja OPD?",
    helpText:
      "Pilihan Kondisi: Belum (Skor 0–1) / Sebagian (Skor 2) / Sudah terintegrasi dalam Renja/DPA OPD (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },

  // II. Sumber Daya Manusia dan Kompetensi
  {
    order: 5,
    domainCode: "II. SDM dan Kompetensi",
    indicatorRef: "Aspek II.5 (Kapasitas)",
    questionText:
      "Berapa jumlah pegawai yang secara aktif menangani kegiatan statistik dan pengelolaan data di OPD saudara?",
    helpText:
      "Pertanyaan Jumlah (Informasi Kapasitas): Isikan angka aktual jumlah orang (tuliskan 0 jika tidak ada). Tidak dikonversi langsung menjadi skor.",
    questionType: "NUMBER",
    weight: 0,
  },
  {
    order: 6,
    domainCode: "II. SDM dan Kompetensi",
    indicatorRef: "Aspek II.6 (Kapasitas)",
    questionText:
      "Berapa pegawai yang memiliki latar belakang pendidikan statistik, matematika, atau bidang terkait di OPD saudara?",
    helpText:
      "Pertanyaan Jumlah (Informasi Kapasitas): Isikan angka aktual jumlah orang (tuliskan 0 jika tidak ada).",
    questionType: "NUMBER",
    weight: 0,
  },
  {
    order: 7,
    domainCode: "II. SDM dan Kompetensi",
    indicatorRef: "Aspek II.7 (Kapasitas)",
    questionText:
      "Berapa pegawai yang memiliki kompetensi/sertifikat pelatihan statistik, pengolahan data, atau Statistik Sektoral di OPD saudara?",
    helpText:
      "Pertanyaan Jumlah (Informasi Kapasitas): Isikan angka aktual jumlah orang yang memiliki sertifikat pelatihan (tuliskan 0 jika tidak ada).",
    questionType: "NUMBER",
    weight: 0,
  },
  {
    order: 8,
    domainCode: "II. SDM dan Kompetensi",
    indicatorRef: "Aspek II.8",
    questionText:
      "Apakah pegawai pengelola data mendapat pembinaan/pelatihan Statistik Sektoral dalam dua tahun terakhir di OPD saudara?",
    helpText:
      "Pilihan Kondisi: Belum pernah (Skor 0) / 1 kali (Skor 1) / 2–3 kali (Skor 2) / >3 kali (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 9,
    domainCode: "II. SDM dan Kompetensi",
    indicatorRef: "Aspek II.9",
    questionText:
      "Bagaimana kemampuan pegawai mengolah data dengan Excel, aplikasi statistik, atau perangkat pengolahan data lain di OPD saudara?",
    helpText:
      "Pilihan Kondisi: Belum mampu (Skor 0) / Dasar (Skor 1) / Menengah (Skor 2) / Mahir (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },

  // III. Perencanaan dan Pelaksanaan Kegiatan Statistik
  {
    order: 10,
    domainCode: "III. Perencanaan & Pelaksanaan",
    indicatorRef: "Aspek III.10",
    questionText:
      "Apakah OPD telah mengidentifikasi kebutuhan data dan indikator untuk mendukung tugas dan fungsinya?",
    helpText:
      "Pilihan Kondisi: Belum (Skor 0–1) / Sebagian (Skor 2) / Sudah lengkap terdokumentasi (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 11,
    domainCode: "III. Perencanaan & Pelaksanaan",
    indicatorRef: "Aspek III.11 (Kapasitas)",
    questionText:
      "Berapa jumlah kegiatan pengumpulan atau kompilasi data yang dilaksanakan OPD dalam satu tahun?",
    helpText:
      "Pertanyaan Jumlah (Informasi Kapasitas): Isikan angka aktual jumlah kegiatan statistik/kompilasi data per tahun (tuliskan 0 jika tidak ada).",
    questionType: "NUMBER",
    weight: 0,
  },
  {
    order: 12,
    domainCode: "III. Perencanaan & Pelaksanaan",
    indicatorRef: "Aspek III.12",
    questionText:
      "Apakah sebelum kegiatan statistik OPD menyusun rancangan yang mencakup tujuan, sasaran, variabel, metode, dan jadwal?",
    helpText:
      "Pilihan Kondisi: Belum (Skor 0–1) / Sebagian (Skor 2) / Sudah lengkap dalam KAK/TOR (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 13,
    domainCode: "III. Perencanaan & Pelaksanaan",
    indicatorRef: "Aspek III.13",
    questionText:
      "Apakah OPD memahami perbedaan data administrasi, kompilasi produk administrasi, dan kegiatan survei statistik?",
    helpText:
      "Pilihan Kondisi: Belum memahami (Skor 0–1) / Sebagian (Skor 2) / Memahami baik (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 14,
    domainCode: "III. Perencanaan & Pelaksanaan",
    indicatorRef: "Aspek III.14",
    questionText:
      "Apakah OPD berkonsultasi atau mengajukan rekomendasi kegiatan statistik kepada BPS sebelum melaksanakan kegiatan statistik sektoral yang memerlukannya?",
    helpText:
      "Pilihan Kondisi: Belum pernah (Skor 0–1) / Belum rutin (Skor 2) / Sesuai kebutuhan melalui Romantik BPS (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 15,
    domainCode: "III. Perencanaan & Pelaksanaan",
    indicatorRef: "Aspek III.15",
    questionText:
      "Apakah OPD berkoordinasi dengan BPS Kabupaten Berau dalam perencanaan atau pelaksanaan kegiatan Statistik Sektoral?",
    helpText:
      "Pilihan Kondisi: Belum (Skor 0–1) / Kadang-kadang (Skor 2) / Rutin dan terjadwal (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },

  // IV. Standar Data dan Metadata Statistik
  {
    order: 16,
    domainCode: "IV. Standar Data & Metadata",
    indicatorRef: "Aspek IV.16",
    questionText:
      "Apakah OPD memahami Standar Data Statistik, meliputi konsep, definisi, klasifikasi, ukuran, dan satuan?",
    helpText:
      "Pilihan Kondisi: Belum (Skor 0–1) / Sebagian (Skor 2) / Sudah memahami dengan baik (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 17,
    domainCode: "IV. Standar Data & Metadata",
    indicatorRef: "Aspek IV.17",
    questionText:
      "Apakah data dan indikator yang dihasilkan mengacu pada Standar Data Statistik yang berlaku?",
    helpText:
      "Pilihan Kondisi: Belum (Skor 0–1) / Sebagian (Skor 2) / Sudah mengacu pada SDSN/Katalog Standar Data (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 18,
    domainCode: "IV. Standar Data & Metadata",
    indicatorRef: "Aspek IV.18",
    questionText:
      "Apakah OPD telah menyusun metadata statistik untuk data atau indikator yang dihasilkan?",
    helpText:
      "Pilihan Kondisi: Belum (Skor 0–1) / Sebagian (Skor 2) / Sudah menyusun MS-Keg, MS-Var, MS-Ind (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 19,
    domainCode: "IV. Standar Data & Metadata",
    indicatorRef: "Aspek IV.19",
    questionText:
      "Apakah metadata memuat konsep, definisi, sumber data, metode pengumpulan, periode, dan penanggung jawab data?",
    helpText:
      "Pilihan Kondisi: Belum lengkap (Skor 0–1) / Sebagian lengkap (Skor 2) / Lengkap sesuai struktur baku (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 20,
    domainCode: "IV. Standar Data & Metadata",
    indicatorRef: "Aspek IV.20",
    questionText:
      "Apakah metadata dimutakhirkan apabila terjadi perubahan definisi, metode, sumber, atau proses pengumpulan data?",
    helpText:
      "Pilihan Kondisi: Tidak pernah (Skor 0) / Jika diperlukan (Skor 1–2) / Berkala dan terdokumentasi (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },

  // V. Kualitas Data dan Pengolahan Data
  {
    order: 21,
    domainCode: "V. Kualitas & Pengolahan Data",
    indicatorRef: "Aspek V.21",
    questionText:
      "Apakah tersedia mekanisme pemeriksaan dan validasi data sebelum dipublikasikan atau disampaikan kepada pengguna?",
    helpText:
      "Pilihan Kondisi: Belum ada (Skor 0) / Belum terdokumentasi (Skor 1–2) / Ada dan terdokumentasi (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 22,
    domainCode: "V. Kualitas & Pengolahan Data",
    indicatorRef: "Aspek V.22",
    questionText:
      "Apakah OPD memeriksa kelengkapan, konsistensi, kewajaran, serta kesesuaian data dengan konsep dan definisinya?",
    helpText:
      "Pilihan Kondisi: Tidak pernah (Skor 0) / Kadang-kadang (Skor 1–2) / Selalu diperiksa secara sistematis (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 23,
    domainCode: "V. Kualitas & Pengolahan Data",
    indicatorRef: "Aspek V.23",
    questionText:
      "Apakah OPD mendokumentasikan sumber data, proses pengumpulan, pengolahan, dan hasil pemeriksaan?",
    helpText:
      "Pilihan Kondisi: Belum ada (Skor 0–1) / Sebagian (Skor 2) / Lengkap terdokumentasi (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 24,
    domainCode: "V. Kualitas & Pengolahan Data",
    indicatorRef: "Aspek V.24",
    questionText:
      "Apakah OPD mengevaluasi kualitas data dan menindaklanjuti kesalahan/ketidaksesuaian?",
    helpText:
      "Pilihan Kondisi: Belum (Skor 0–1) / Kadang-kadang (Skor 2) / Berkala dan ditindaklanjuti (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },

  // VI. Integrasi, Koordinasi, dan Pemanfaatan Data
  {
    order: 25,
    domainCode: "VI. Integrasi, Koordinasi & Pemanfaatan",
    indicatorRef: "Aspek VI.25",
    questionText:
      "Apakah OPD berkoordinasi dengan bidang lain atau OPD terkait untuk menghindari duplikasi dan perbedaan data?",
    helpText:
      "Pilihan Kondisi: Belum (Skor 0–1) / Kadang-kadang (Skor 2) / Rutin melalui Forum Satu Data (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 26,
    domainCode: "VI. Integrasi, Koordinasi & Pemanfaatan",
    indicatorRef: "Aspek VI.26",
    questionText:
      "Apakah data OPD disampaikan atau diintegrasikan melalui portal data/mekanisme Satu Data Indonesia di Kabupaten Berau?",
    helpText:
      "Pilihan Kondisi: Belum (Skor 0–1) / Sebagian (Skor 2) / Sudah terintegrasi di Portal Satu Data Berau (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 27,
    domainCode: "VI. Integrasi, Koordinasi & Pemanfaatan",
    indicatorRef: "Aspek VI.27",
    questionText:
      "Apakah data statistik dimanfaatkan untuk perencanaan, penganggaran, monitoring, atau evaluasi program OPD?",
    helpText:
      "Pilihan Kondisi: Belum (Skor 0–1) / Sebagian (Skor 2) / Rutin dimanfaatkan dalam dokumen perencanaan (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },

  // VII. Diseminasi dan Publikasi Statistik
  {
    order: 28,
    domainCode: "VII. Diseminasi & Publikasi",
    indicatorRef: "Aspek VII.28",
    questionText:
      "Apakah OPD memiliki media penyebarluasan data, seperti website, portal data, publikasi, atau laporan statistik?",
    helpText:
      "Pilihan Kondisi: Belum ada (Skor 0) / Ada tetapi belum aktif (Skor 1–2) / Ada dan aktif (Skor 3). Cantumkan tautan website/publikasi pada kolom bukti.",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 29,
    domainCode: "VII. Diseminasi & Publikasi",
    indicatorRef: "Aspek VII.29",
    questionText:
      "Apakah data yang disajikan dilengkapi periode data, sumber data, definisi indikator, dan keterangan lainnya?",
    helpText:
      "Pilihan Kondisi: Belum (Skor 0–1) / Sebagian (Skor 2) / Sudah lengkap (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
  {
    order: 30,
    domainCode: "VII. Diseminasi & Publikasi",
    indicatorRef: "Aspek VII.30",
    questionText:
      "Apakah OPD memutakhirkan data yang dipublikasikan secara berkala dan memastikan data yang disajikan merupakan data terbaru?",
    helpText:
      "Pilihan Kondisi: Belum (Skor 0) / Tidak rutin (Skor 1–2) / Rutin dan terjadwal (Skor 3).",
    questionType: "SCALE_0_3",
    weight: 1,
  },
];

export const ASSESSMENT_PRESET_TEMPLATES: AssessmentPresetTemplate[] = [
  {
    id: "preset-instrumen-berau-30",
    name: "Instrumen Assessment Pemahaman dan Kesiapan OPD dalam Penyelenggaraan Statistik Sektoral (BPS Kab. Berau 2026)",
    category: "Instrumen Kesiapan OPD (7 Aspek)",
    description:
      "Instrumen resmi BPS Kabupaten Berau Tahun 2026 mencakup 7 Aspek dan 30 Pertanyaan (Kelembagaan, SDM & Kompetensi, Perencanaan Kegiatan, Standar Data & Metadata, Kualitas & Pengolahan Data, Integrasi & Pemanfaatan, serta Diseminasi Statistik) dengan Skala 0–3 dan Pertanyaan Kapasitas Jumlah.",
    questions: OFFICIAL_30_INSTRUMEN_QUESTIONS,
  },
  {
    id: "preset-aspek-1-2-3",
    name: "Assessment Kesiapan: Aspek I (Kelembagaan), Aspek II (SDM) & Aspek III (Perencanaan Kegiatan)",
    category: "Kelembagaan, SDM & Perencanaan",
    description:
      "Bagian I–III Instrumen Kesiapan OPD BPS Kabupaten Berau (Pertanyaan No. 1 s.d. 15): Menilai tata kelola, kapasitas jumlah SDM statistik, identifikasi kebutuhan data, dan koordinasi rekomendasi Romantik BPS.",
    questions: OFFICIAL_30_INSTRUMEN_QUESTIONS.slice(0, 15).map((q, idx) => ({
      ...q,
      order: idx + 1,
    })),
  },
  {
    id: "preset-aspek-4-5-6-7",
    name: "Assessment Kesiapan: Aspek IV (Standar Data & Metadata), Aspek V (Kualitas), Aspek VI (Integrasi) & Aspek VII (Diseminasi)",
    category: "Metadata, Kualitas & Diseminasi",
    description:
      "Bagian IV–VII Instrumen Kesiapan OPD BPS Kabupaten Berau (Pertanyaan No. 16 s.d. 30): Menilai penerapan Standar Data, Metadata, validasi kualitas data, integrasi Satu Data Berau, dan publikasi statistik.",
    questions: OFFICIAL_30_INSTRUMEN_QUESTIONS.slice(15, 30).map((q, idx) => ({
      ...q,
      order: idx + 1,
    })),
  },
];

export async function ensureDefaultAssessmentsSeeded() {
  try {
    const [pembinaUser, opds, existingAssessments] = await Promise.all([
      prisma.user.findFirst({
        where: {
          role: { in: ["PEMBINA_SEKTORAL", "SUPERADMIN"] },
        },
      }),
      prisma.opd.findMany({ orderBy: { code: "asc" } }),
      prisma.assessment.findMany({ select: { id: true, title: true } }),
    ]);

    // Remove the previously seeded "38 Indikator Juknis EPSS" assessment if it was created by mistake
    const wrongJuknis = existingAssessments.filter(
      (a) =>
        a.title.includes("38 Indikator") ||
        a.title.includes("Petunjuk Teknis Penilaian EPSS")
    );
    for (const item of wrongJuknis) {
      await prisma.assessment.delete({ where: { id: item.id } });
    }

    const mainPreset = ASSESSMENT_PRESET_TEMPLATES[0]; // 30 Pertanyaan Resmi Instrumen Assessment Kesiapan OPD
    const hasMainInstrumen = existingAssessments.some(
      (a) =>
        a.title.includes("Pemahaman dan Kesiapan OPD") ||
        a.title.includes("Instrumen Assessment")
    );

    if (!hasMainInstrumen) {
      const createdMain = await prisma.assessment.create({
        data: {
          title: mainPreset.name,
          description: mainPreset.description,
          category: mainPreset.category,
          periodYear: 2026,
          status: "AKTIF",
          dueDate: new Date("2026-12-20T23:59:59.000Z"),
          targetOpdId: null, // Semua OPD
          createdById: pembinaUser?.id || null,
          questions: {
            create: mainPreset.questions.map((q) => ({
              order: q.order,
              domainCode: q.domainCode,
              indicatorRef: q.indicatorRef,
              questionText: q.questionText,
              helpText: q.helpText,
              questionType: q.questionType,
              weight: q.weight,
            })),
          },
        },
        include: { questions: { orderBy: { order: "asc" } } },
      });

      // Seed contoh respons OPD pada Instrumen 30 Pertanyaan sesuai Skala 0-3 dan Jumlah Aktual
      if (opds.length >= 2 && createdMain.questions.length > 0) {
        const sampleConfigs = [
          {
            opd: opds[0], // Dinkes Berau
            status: "DIREVIU",
            baseScore: 3, // Siap (76-100%)
            summaryNotes:
              "SK Tim Statistik Sektoral dan SOP Pengelolaan Data Kesehatan telah ditetapkan. Memiliki 4 pengelola data aktif dan 3 kegiatan kompilasi data rutin.",
            pembinaFeedback:
              "Kategori Kesiapan: SIAP (86%). Arahan Pembinaan: Penguatan keberlanjutan, kualitas, integrasi, dan pemanfaatan data serta pemutakhiran metadata berkala di INDAH BPS.",
          },
          {
            opd: opds[1], // Diskominfo Berau
            status: "DIKIRIM",
            baseScore: 2, // Cukup Siap (51-75%)
            summaryNotes:
              "Sebagai Walidata Daerah, integrasi Portal Satu Data Berau telah berjalan baik, namun masih memerlukan bimbingan teknis penyusunan SOP validasi data lintas bidang.",
            pembinaFeedback: null,
          },
        ];

        for (const cfg of sampleConfigs) {
          if (!cfg.opd) continue;
          const opdOperator = await prisma.user.findFirst({
            where: { opdId: cfg.opd.id, role: "OPERATOR_OPD" },
          });

          let totalObtainedScore = 0;
          let maxPossibleScore = 0;

          const answerPayloads = createdMain.questions.map((q, idx) => {
            if (q.questionType === "NUMBER") {
              // Pertanyaan Jumlah (No. 5, 6, 7, 11): diisi angka aktual, tidak dikonversi menjadi skor langsung
              const actualCount =
                q.order === 5
                  ? 4
                  : q.order === 6
                  ? 1
                  : q.order === 7
                  ? 2
                  : 3;
              return {
                questionId: q.id,
                scaleValue: actualCount,
                yesNoValue: null,
                textAnswer: `Data kapasitas aktual pada ${cfg.opd.shortName}: ${actualCount}.`,
              };
            }

            // Pertanyaan Skala 0-3
            const score0to3 = Math.min(
              3,
              Math.max(0, cfg.baseScore - (idx % 3 === 0 ? 1 : 0))
            );
            totalObtainedScore += score0to3;
            maxPossibleScore += 3;

            return {
              questionId: q.id,
              scaleValue: score0to3,
              yesNoValue: null,
              textAnswer:
                score0to3 === 3
                  ? `Telah dilaksanakan konsisten dan terdokumentasi di ${cfg.opd.shortName}.`
                  : `Sudah dilaksanakan sebagian di ${cfg.opd.shortName}.`,
            };
          });

          const readinessPct =
            maxPossibleScore > 0
              ? Math.round((totalObtainedScore / maxPossibleScore) * 100)
              : 0;
          const readinessScore =
            maxPossibleScore > 0
              ? Number(((totalObtainedScore / maxPossibleScore) * 3).toFixed(2))
              : 0;

          await prisma.assessmentResponse.upsert({
            where: {
              assessmentId_opdId: {
                assessmentId: createdMain.id,
                opdId: cfg.opd.id,
              },
            },
            update: {},
            create: {
              assessmentId: createdMain.id,
              opdId: cfg.opd.id,
              submittedById: opdOperator?.id || null,
              status: cfg.status,
              readinessScore,
              readinessPct,
              summaryNotes: cfg.summaryNotes,
              pembinaFeedback: cfg.pembinaFeedback,
              reviewedById: cfg.status === "DIREVIU" ? pembinaUser?.id : null,
              submittedAt: cfg.status !== "DRAF" ? new Date() : null,
              reviewedAt: cfg.status === "DIREVIU" ? new Date() : null,
              answers: {
                create: answerPayloads,
              },
            },
          });
        }
      }
    }
  } catch {
    // Gracefully ignore if table has not been pushed yet
  }
}
