import { prisma } from "@/lib/prisma";

export interface PresetQuestionItem {
  order: number;
  domainCode: string;
  indicatorRef: string;
  questionText: string;
  helpText: string;
  questionType: "SCALE_1_5" | "YES_NO" | "TEXT";
  weight: number;
}

export interface AssessmentPresetTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  questions: PresetQuestionItem[];
}

export const ASSESSMENT_PRESET_TEMPLATES: AssessmentPresetTemplate[] = [
  {
    id: "preset-pra-epss",
    name: "Diagnostik Kesiapan Pra-EPSS 5 Domain (Rekomendasi BPS)",
    category: "Diagnostik Pra-EPSS",
    description:
      "Instrumen pemetaan awal kesiapan Perangkat Daerah Kabupaten Berau pada 5 Domain EPSS (Standar Data, Metadata INDAH, Interoperabilitas, Kualitas Data, Proses Bisnis GSBPM, dan Kelembagaan SDI).",
    questions: [
      {
        order: 1,
        domainCode: "Domain 1",
        indicatorRef: "10101",
        questionText:
          "Sejauh mana penerapan Standar Data Statistik (SDS) pada 2 kegiatan statistik sektoral di instansi Anda?",
        helpText:
          "Level 1: Belum menerapkan SDS · Level 2: Sebagian variabel sesuai Katalog SDS · Level 3: Seluruh variabel utama mengacu pada SDS & Perbup SDI · Level 4: Telah direviu berkala bersama Walidata · Level 5: Termutakhirkan dan terintegrasi penuh.",
        questionType: "SCALE_1_5",
        weight: 1.5,
      },
      {
        order: 2,
        domainCode: "Domain 1",
        indicatorRef: "10201",
        questionText:
          "Apakah metadata kegiatan, variabel, dan indikator (MS-Keg, MS-Var, MS-Ind) telah diinput ke aplikasi INDAH BPS?",
        helpText:
          "Pilih Ya jika minimal draf metadata untuk 2 kegiatan statistik lokus EPSS telah disusun atau diajukan ke Walidata/INDAH BPS.",
        questionType: "YES_NO",
        weight: 1.5,
      },
      {
        order: 3,
        domainCode: "Domain 2",
        indicatorRef: "20101",
        questionText:
          "Bagaimana tingkat kematangan dokumentasi analisis kebutuhan data dan konsultasi pengguna data di instansi Anda?",
        helpText:
          "Level 1: Belum terdokumentasi · Level 2: Ada undangan/notula rapat · Level 3: Sesuai SOP/Juknis resmi · Level 4: Dievaluasi lintas unit · Level 5: Perbaikan berkelanjutan berbasis survei kepuasan.",
        questionType: "SCALE_1_5",
        weight: 1.2,
      },
      {
        order: 4,
        domainCode: "Domain 3",
        indicatorRef: "30101",
        questionText:
          "Apakah 2 kegiatan statistik sektoral yang dinilaikan telah memiliki surat Rekomendasi Kegiatan Statistik melalui aplikasi Romantik BPS?",
        helpText:
          "Pemberitahuan rancangan kegiatan statistik ke BPS melalui romantik.web.bps.go.id sebelum pengumpulan data.",
        questionType: "YES_NO",
        weight: 1.5,
      },
      {
        order: 5,
        domainCode: "Domain 3",
        indicatorRef: "30201",
        questionText:
          "Sejauh mana tahapan Perencanaan, Pengumpulan, Pemeriksaan (Editing/Coding), dan Diseminasi Data memiliki KAK/TOR dan Pedoman Teknis tertulis?",
        helpText:
          "Nilai kematangan ketersediaan KAK/TOR, instrumen kuesioner, buku pedoman petugas, dan berita acara validasi data.",
        questionType: "SCALE_1_5",
        weight: 1.3,
      },
      {
        order: 6,
        domainCode: "Domain 4",
        indicatorRef: "40101",
        questionText:
          "Bagaimana kesiapan SK Tim Pelaksana Statistik Sektoral / Produsen Data dan koordinasi dengan Walidata (Diskominfo) di instansi Anda?",
        helpText:
          "Mencakup penetapan SK Kepala Dinas, pembagian tugas pengelola data, serta keaktifan dalam Forum Satu Data Kabupaten Berau.",
        questionType: "SCALE_1_5",
        weight: 1.0,
      },
      {
        order: 7,
        domainCode: "Domain 5",
        indicatorRef: "50101",
        questionText:
          "Tuliskan kendala utama yang dihadapi Operator OPD dalam menyiapkan bukti dukung EPSS serta topik yang paling membutuhkan pendampingan teknis BPS:",
        helpText:
          "Jelaskan secara spesifik (misalnya: kesulitan pengisian MS-Ind di INDAH, penyusunan SOP internal, atau kelengkapan bukti Level 3–4).",
        questionType: "TEXT",
        weight: 1.0,
      },
    ],
  },
  {
    id: "preset-romantik-indah",
    name: "Asesmen Kesiapan Metadata INDAH & Rekomendasi Romantik",
    category: "Kesiapan Metadata & Romantik",
    description:
      "Kuesioner khusus untuk memeriksa kesiapan pengajuan Rekomendasi Statistik (Romantik) dan kelengkapan Metadata Baku (INDAH) pada 2 lokus kegiatan statistik sektoral OPD.",
    questions: [
      {
        order: 1,
        domainCode: "Domain 3",
        indicatorRef: "30101",
        questionText:
          "Apakah instansi Anda telah menetapkan 2 judul kegiatan statistik sektoral utama beserta KAK/TOR tahun berjalan?",
        helpText:
          "Pastikan 2 kegiatan tersebut menghasilkan output data sektoral secara rutin/berkala.",
        questionType: "YES_NO",
        weight: 1.5,
      },
      {
        order: 2,
        domainCode: "Domain 3",
        indicatorRef: "30101",
        questionText:
          "Sejauh mana kesiapan dokumen rancangan kegiatan untuk diajukan ke aplikasi Romantik BPS (romantik.web.bps.go.id)?",
        helpText:
          "Level 1: Belum ada akun/dokumen · Level 2: Draf KAK tersedia · Level 3: Sudah diajukan di Romantik · Level 4: Rekomendasi terbit & ditindaklanjuti · Level 5: Evaluasi kepatuhan rekomendasi terdokumentasi.",
        questionType: "SCALE_1_5",
        weight: 1.5,
      },
      {
        order: 3,
        domainCode: "Domain 1",
        indicatorRef: "10201",
        questionText:
          "Sejauh mana kelengkapan penyusunan Metadata Kegiatan (MS-Keg), Variabel (MS-Var), dan Indikator (MS-Ind) pada 2 kegiatan tersebut?",
        helpText:
          "Nilai kesiapan konsep, definisi, klasifikasi, ukuran, satuan, dan rumus penghitungan indikator.",
        questionType: "SCALE_1_5",
        weight: 1.5,
      },
      {
        order: 4,
        domainCode: "Domain 1",
        indicatorRef: "10301",
        questionText:
          "Apakah tabel output data telah disiapkan dalam format terbuka (CSV/XLSX/API) untuk dibagi-pakaikan ke Portal Satu Data Berau?",
        helpText:
          "Kesiapan interoperabilitas data bersama Walidata Daerah (Diskominfo Kab. Berau).",
        questionType: "YES_NO",
        weight: 1.0,
      },
      {
        order: 5,
        domainCode: "Domain 1",
        indicatorRef: "10201",
        questionText:
          "Sebutkan 2 judul kegiatan statistik sektoral yang akan dinilaikan beserta kendala teknis yang dihadapi saat ini:",
        helpText:
          "Cantumkan judul Kegiatan 1 dan Kegiatan 2 serta bantuan teknis yang diperlukan dari Tim Pembina BPS.",
        questionType: "TEXT",
        weight: 1.0,
      },
    ],
  },
  {
    id: "preset-pasca-pembinaan",
    name: "Evaluasi Tindak Lanjut Pasca-Pembinaan Statistik Sektoral",
    category: "Evaluasi Pasca-Pembinaan",
    description:
      "Instrumen evaluasi progres tindak lanjut OPD setelah mengikuti kegiatan pembinaan/klinik statistik sektoral bersama BPS Kabupaten Berau.",
    questions: [
      {
        order: 1,
        domainCode: "Domain 4",
        indicatorRef: "40202",
        questionText:
          "Sejauh mana rekomendasi hasil pembinaan BPS sebelumnya telah ditindaklanjuti melalui perbaikan dokumen atau SOP di instansi Anda?",
        helpText:
          "Level 1: Belum ditindaklanjuti · Level 3: Seluruh dokumen Level 3 telah dilengkapi · Level 5: Reviu berkala dan inovasi telah berjalan.",
        questionType: "SCALE_1_5",
        weight: 1.5,
      },
      {
        order: 2,
        domainCode: "Domain 2",
        indicatorRef: "20201",
        questionText:
          "Apakah laporan evaluasi kualitas data dan pemeriksaan kewajaran data (editing/validasi) sudah disusun untuk kedua kegiatan statistik?",
        helpText:
          "Mencakup berita acara pemeriksaan data antara pengumpul data dan penanggung jawab bidang.",
        questionType: "YES_NO",
        weight: 1.2,
      },
      {
        order: 3,
        domainCode: "Domain 5",
        indicatorRef: "50101",
        questionText:
          "Bagaimana tingkat pemanfaatan data hasil kegiatan statistik sektoral Anda dalam dokumen perencanaan daerah (Renja/RKPD/RPJMD)?",
        helpText:
          "Nilai sejauh mana data statistik sektoral dikutip dan digunakan sebagai dasar kebijakan pimpinan.",
        questionType: "SCALE_1_5",
        weight: 1.3,
      },
      {
        order: 4,
        domainCode: "Domain 4",
        indicatorRef: "40101",
        questionText:
          "Tuliskan ringkasan tindak lanjut yang telah diselesaikan serta indikator EPSS yang masih memerlukan verifikasi ulang Pembina BPS:",
        helpText:
          "Sebutkan kode indikator (mis. 10101, 20102) yang ingin diprioritaskan pada klinik pembinaan berikutnya.",
        questionType: "TEXT",
        weight: 1.0,
      },
    ],
  },
];

export async function ensureDefaultAssessmentsSeeded() {
  try {
    const existingCount = await prisma.assessment.count();
    if (existingCount > 0) return;

    const [pembinaUser, opds] = await Promise.all([
      prisma.user.findFirst({
        where: {
          role: { in: ["PEMBINA_SEKTORAL", "SUPERADMIN"] },
        },
      }),
      prisma.opd.findMany({ orderBy: { code: "asc" } }),
    ]);

    const preset1 = ASSESSMENT_PRESET_TEMPLATES[0];
    const preset2 = ASSESSMENT_PRESET_TEMPLATES[1];

    const createdAssessment1 = await prisma.assessment.create({
      data: {
        title:
          "Asesmen Diagnostik Kesiapan Pra-EPSS & Satu Data Indonesia Tahun 2026",
        description: preset1.description,
        category: preset1.category,
        periodYear: 2026,
        status: "AKTIF",
        dueDate: new Date("2026-11-30T23:59:59.000Z"),
        targetOpdId: null, // Semua OPD
        createdById: pembinaUser?.id || null,
        questions: {
          create: preset1.questions.map((q) => ({
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

    await prisma.assessment.create({
      data: {
        title:
          "Asesmen Kesiapan Metadata INDAH & Pengajuan Rekomendasi Romantik BPS",
        description: preset2.description,
        category: preset2.category,
        periodYear: 2026,
        status: "AKTIF",
        dueDate: new Date("2026-12-15T23:59:59.000Z"),
        targetOpdId: null,
        createdById: pembinaUser?.id || null,
        questions: {
          create: preset2.questions.map((q) => ({
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
    });

    // Seed sample responses for the first 3 OPDs so Pembina & Operator OPD immediately see rich data
    if (opds.length >= 2 && createdAssessment1.questions.length > 0) {
      const sampleConfigs = [
        {
          opd: opds[0], // Dinkes
          status: "DIREVIU",
          scaleBase: 4,
          summaryNotes:
            "Kedua kegiatan statistik kesehatan (Profil Kesehatan & Surveilans Gizi) telah memiliki SK, SOP, dan rekomendasi Romantik, namun memerlukan pendampingan penajaman narasi Level 4 pada Domain 2.",
          pembinaFeedback:
            "Kesiapan Dinkes Berau sangat baik (Rata-rata Level 4,00). Segera unggah bukti evaluasi berkala kepuasan pengguna data pada Indikator 20101 untuk mengunci target Level 4.",
        },
        {
          opd: opds[1], // Diskominfo
          status: "DIKIRIM",
          scaleBase: 4,
          summaryNotes:
            "Sebagai Walidata Daerah, Portal Satu Data Berau dan pedoman interoperabilitas telah berjalan. Mohon arahan terkait integrasi SPLP dengan portal nasional.",
          pembinaFeedback: null,
        },
        {
          opd: opds[2] || opds[0], // Disdik
          status: "DRAF",
          scaleBase: 3,
          summaryNotes:
            "Sedang melengkapi pengisian metadata variabel (MS-Var) pada aplikasi INDAH BPS untuk Pendataan Satuan Pendidikan.",
          pembinaFeedback: null,
        },
      ];

      for (const cfg of sampleConfigs) {
        if (!cfg.opd) continue;
        const opdOperator = await prisma.user.findFirst({
          where: { opdId: cfg.opd.id, role: "OPERATOR_OPD" },
        });

        let weightedSum = 0;
        let totalWeight = 0;

        const answerPayloads = createdAssessment1.questions.map((q, idx) => {
          if (q.questionType === "SCALE_1_5") {
            const val = Math.min(5, Math.max(1, cfg.scaleBase - (idx % 2)));
            weightedSum += val * q.weight;
            totalWeight += q.weight;
            return {
              questionId: q.id,
              scaleValue: val,
              yesNoValue: null,
              textAnswer: `Pelaksanaan pada ${cfg.opd.shortName} telah mengacu pada pedoman internal dan regulasi Satu Data Kabupaten Berau.`,
            };
          } else if (q.questionType === "YES_NO") {
            const isYes = cfg.scaleBase >= 3;
            const numericEquiv = isYes ? 4 : 2;
            weightedSum += numericEquiv * q.weight;
            totalWeight += q.weight;
            return {
              questionId: q.id,
              scaleValue: null,
              yesNoValue: isYes ? "YA" : "TIDAK",
              textAnswer: isYes
                ? "Telah dilaksanakan pada kedua lokus kegiatan statistik sektoral."
                : "Masih dalam tahap penyusunan draf.",
            };
          } else {
            return {
              questionId: q.id,
              scaleValue: null,
              yesNoValue: null,
              textAnswer: cfg.summaryNotes,
            };
          }
        });

        const readinessScore =
          totalWeight > 0
            ? Number((weightedSum / totalWeight).toFixed(2))
            : 3.0;
        const readinessPct = Math.round((readinessScore / 5) * 100);

        await prisma.assessmentResponse.upsert({
          where: {
            assessmentId_opdId: {
              assessmentId: createdAssessment1.id,
              opdId: cfg.opd.id,
            },
          },
          update: {},
          create: {
            assessmentId: createdAssessment1.id,
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
  } catch {
    // Gracefully ignore if table has not been pushed yet
  }
}

