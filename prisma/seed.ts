import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { OFFICIAL_EPSS_DOMAINS } from "../src/lib/epss-official-data";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = "sigap-berau-salt-2026";
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function generateSamplePdfBuffer(title: string, subtitle: string, bodyLines: string[]): Buffer {
  const sanitize = (str: string) =>
    str.replace(/[()\\]/g, "").slice(0, 95);

  const textOps: string[] = [
    "BT",
    "/F1 16 Tf",
    "50 770 Td",
    `(${sanitize(title)}) Tj`,
    "/F1 11 Tf",
    "0 -22 Td",
    `(${sanitize(subtitle)}) Tj`,
    "0 -14 Td",
    "(BPS Kabupaten Berau - Portal SIGAP BERAU - Dokumen Bukti Dukung Resmi) Tj",
    "0 -24 Td",
    "/F1 10 Tf",
  ];

  for (const line of bodyLines) {
    textOps.push(`(${sanitize(line)}) Tj`);
    textOps.push("0 -16 Td");
  }
  textOps.push("ET");

  const streamContent = textOps.join("\n");
  const objects: string[] = [];

  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 595 842] /Contents 5 0 R >>\nendobj\n"
  );
  objects.push(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
  );
  objects.push(
    `5 0 obj\n<< /Length ${Buffer.byteLength(streamContent, "utf8")} >>\nstream\n${streamContent}\nendstream\nendobj\n`
  );

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    const off = String(offsets[i]).padStart(10, "0");
    pdf += `${off} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}

async function main() {
  console.log("Memulai seeding database SIGAP BERAU...");

  // Ensure upload and materi directories exist and contain valid sample PDFs
  const uploadDir = path.join(process.cwd(), "public", "uploads", "epss");
  const materiDir = path.join(process.cwd(), "public", "uploads", "materi");
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(materiDir, { recursive: true });

  const sampleFiles = [
    {
      dir: uploadDir,
      name: "Bukti_10101_SDSN_Dinkes_Berau_2026.pdf",
      title: "BUKTI DUKUNG INDIKATOR 10101 - PENERAPAN STANDAR DATA STATISTIK",
      subtitle: "Dinas Kesehatan Kabupaten Berau | Tahun Evaluasi 2026",
      lines: [
        "Kegiatan 1: Kompilasi Data Profil Kesehatan Kabupaten Berau Tahun 2025",
        "Kegiatan 2: Survei Kepuasan Layanan Fasilitas Kesehatan Tingkat Pertama (FKTP)",
        "--------------------------------------------------------------------------------",
        "1. Standar Data Statistik Nasional (SDSN) telah diacu melalui aplikasi INDAH BPS",
        "   (indah.bps.go.id) dengan status Published sesuai Keputusan Kepala BPS.",
        "2. Tercantum pada Halaman 14-18 Buku Profil Kesehatan Kabupaten Berau 2025.",
        "3. Kebijakan internal mengacu pada Peraturan Bupati Berau tentang Satu Data",
        "   Indonesia Tingkat Kabupaten Berau Pasal 12 Ayat (1) s.d. Ayat (4).",
        "4. Hasil Reviu Tahap I (Mei 2025) dan Reviu Tahap II (November 2025) telah",
        "   ditindaklanjuti dengan penyempurnaan kamus standar data kesehatan daerah.",
      ],
    },
    {
      dir: uploadDir,
      name: "Bukti_10201_Metadata_Indah_Dinkes_2026.pdf",
      title: "BUKTI DUKUNG INDIKATOR 10201 - PENERAPAN METADATA STATISTIK",
      subtitle: "Dinas Kesehatan Kabupaten Berau | MS-Keg, MS-Var, MS-Ind",
      lines: [
        "Kegiatan 1: Kompilasi Data Profil Kesehatan Kabupaten Berau Tahun 2025",
        "Kegiatan 2: Survei Kepuasan Layanan FKTP Kabupaten Berau Tahun 2025",
        "--------------------------------------------------------------------------------",
        "1. Screenshot persetujuan Metadata Kegiatan (MS-Keg), Metadata Variabel (MS-Var),",
        "   dan Metadata Indikator (MS-Ind) pada aplikasi INDAH berstatus SUBMIT.",
        "2. SOP Penyusunan dan Pengelolaan Metadata Statistik Sektoral Nomor",
        "   440/118/SOP-SDK/DINKES/2025 tanggal 10 Februari 2025 (Halaman 3-9).",
        "3. Berita Acara Reviu Berkala Metadata Statistik bersama Walidata Daerah",
        "   (Diskominfo Kabupaten Berau) dan Pembina Data (BPS Kabupaten Berau).",
      ],
    },
    {
      dir: uploadDir,
      name: "Bukti_50201_Rekomendasi_Romantik_BPS_2026.pdf",
      title: "SURAT REKOMENDASI KEGIATAN STATISTIK SEKTORAL (ROMANTIK)",
      subtitle: "Badan Pusat Statistik Kabupaten Berau | Nomor: B-142/64050/VS.350/2025",
      lines: [
        "Berdasarkan hasil pemeriksaan rancangan kegiatan statistik sektoral yang diajukan",
        "melalui Aplikasi Romantik (romantik.web.bps.go.id), BPS Kabupaten Berau menerbitkan",
        "Rekomendasi Kegiatan Statistik dengan status LAYAK DILAKSANAKAN.",
        "--------------------------------------------------------------------------------",
        "Instansi Penyelenggara : Pemerintah Kabupaten Berau",
        "Nomor Rekomendasi      : K-25.6405.0012",
        "Judul Kegiatan         : Kompilasi Data Statistik Sektoral Daerah Tahun 2025/2026",
        "Halaman Referensi      : Halaman 1 - 6 (Formulir Pemberitahuan & Surat Rekomendasi)",
      ],
    },
    {
      dir: materiDir,
      name: "Panduan_Persiapan_EPSS_Kabupaten_Berau_2026.pdf",
      title: "PANDUAN PERSIAPAN DAN RUBRIK PENILAIAN EPSS 2026",
      subtitle: "BPS Kabupaten Berau - Tim Pembina Statistik Sektoral",
      lines: [
        "Dokumen ini merupakan panduan resmi bagi seluruh Organisasi Perangkat Daerah (OPD)",
        "di lingkungan Pemerintah Kabupaten Berau dalam menyiapkan bukti dukung Evaluasi",
        "Penyelenggaraan Statistik Sektoral (EPSS) Tahun 2026.",
        "--------------------------------------------------------------------------------",
        "Lima Domain Evaluasi EPSS:",
        "1. Domain 1: Prinsip Satu Data Indonesia (Bobot 28%) - 4 Aspek, 4 Indikator",
        "2. Domain 2: Kualitas Data (Bobot 24%) - 5 Aspek, 10 Indikator",
        "3. Domain 3: Proses Bisnis Statistik (Bobot 19%) - 4 Aspek, 7 Indikator",
        "4. Domain 4: Kelembagaan (Bobot 17%) - 3 Aspek, 10 Indikator",
        "5. Domain 5: Sistem Statistik Nasional (Bobot 12%) - 3 Aspek, 7 Indikator",
        "--------------------------------------------------------------------------------",
        "Format Narasi Bukti Dukung wajib memuat:",
        "(i)  Penjelasan relevansi indikator dengan bukti dukung serta ringkasan isi file;",
        "(ii) Nama file bukti dukung yang diunggah;",
        "(iii) Nomor halaman dan pasal operasionalisasi yang dirujuk.",
      ],
    },
  ];

  for (const sf of sampleFiles) {
    const targetPath = path.join(sf.dir, sf.name);
    fs.writeFileSync(
      targetPath,
      generateSamplePdfBuffer(sf.title, sf.subtitle, sf.lines)
    );
  }

  // Clean existing records in reverse dependency order
  await prisma.epssReviewComment.deleteMany();
  await prisma.epssDocument.deleteMany();
  await prisma.epssSubmission.deleteMany();
  await prisma.epssIndicator.deleteMany();
  await prisma.epssAspect.deleteMany();
  await prisma.epssDomain.deleteMany();
  await prisma.epssPeriod.deleteMany();
  await prisma.coachingSchedule.deleteMany();
  await prisma.learningMaterial.deleteMany();
  await prisma.user.deleteMany();
  await prisma.opd.deleteMany();

  // 1. Seed Periods
  await prisma.epssPeriod.createMany({
    data: [
      {
        year: 2026,
        label: "EPSS 2026 — Penilaian Mandiri & Bukti Dukung",
        stage: "Tahap Penilaian Mandiri & Pemeriksaan Pembina",
        status: "AKTIF",
        startDate: new Date("2026-01-15T00:00:00Z"),
        endDate: new Date("2026-11-30T23:59:59Z"),
        isActive: true,
        description:
          "Periode aktif Evaluasi Penyelenggaraan Statistik Sektoral (EPSS) Tahun 2026 Kabupaten Berau.",
      },
      {
        year: 2025,
        label: "EPSS 2025 — Evaluasi Tahunan (Arsip Nilai Akhir)",
        stage: "Selesai — IPS Kab. Berau: 2,84 (Baik)",
        status: "SELESAI",
        startDate: new Date("2025-01-15T00:00:00Z"),
        endDate: new Date("2025-10-31T23:59:59Z"),
        isActive: false,
        description:
          "Arsip hasil Evaluasi Penyelenggaraan Statistik Sektoral Tahun 2025 Kabupaten Berau.",
      },
      {
        year: 2024,
        label: "EPSS 2024 — Evaluasi Tahunan (Arsip Nilai Akhir)",
        stage: "Selesai — IPS Kab. Berau: 2,45 (Cukup)",
        status: "SELESAI",
        startDate: new Date("2024-01-15T00:00:00Z"),
        endDate: new Date("2024-10-31T23:59:59Z"),
        isActive: false,
        description:
          "Arsip hasil Evaluasi Penyelenggaraan Statistik Sektoral Tahun 2024 Kabupaten Berau.",
      },
    ],
  });

  // 2. Seed OPDs in Kabupaten Berau
  const opdData = [
    {
      code: "OPD-6405-01",
      name: "Dinas Kesehatan Kabupaten Berau",
      shortName: "Dinkes Berau",
      category: "Dinas Daerah (Lokus Utama EPSS)",
      address: "Jl. R.A. Kartini No. 12, Tanjung Redeb, Kabupaten Berau",
      phone: "(0554) 21053",
      email: "dinkes@beraukab.go.id",
      activity1Name: "Kompilasi Data Profil Kesehatan Kabupaten Berau Tahun 2025",
      activity2Name: "Survei Kepuasan Layanan Fasilitas Kesehatan Tingkat Pertama (FKTP)",
    },
    {
      code: "OPD-6405-02",
      name: "Dinas Komunikasi dan Informatika Kabupaten Berau",
      shortName: "Diskominfo Berau",
      category: "Walidata Daerah",
      address: "Jl. APT Pranoto No. 1, Tanjung Redeb, Kabupaten Berau",
      phone: "(0554) 22109",
      email: "diskominfo@beraukab.go.id",
      activity1Name: "Kompilasi Data Statistik Sektoral Daerah Kabupaten Berau (Satu Data Berau)",
      activity2Name: "Survei Indeks Masyarakat Digital & Literasi Statistik Sektoral",
    },
    {
      code: "OPD-6405-03",
      name: "Badan Perencanaan, Penelitian dan Pengembangan Kabupaten Berau",
      shortName: "Bapelitbang Berau",
      category: "Koordinator Satu Data Daerah",
      address: "Jl. APT Pranoto No. 5, Tanjung Redeb, Kabupaten Berau",
      phone: "(0554) 21412",
      email: "bapelitbang@beraukab.go.id",
      activity1Name: "Kompilasi Indikator Makro Pembangunan Daerah (RKPD & RPJMD)",
      activity2Name: "Evaluasi Capaian Indikator Tujuan Pembangunan Berkelanjutan (SDGs)",
    },
    {
      code: "OPD-6405-04",
      name: "Dinas Pendidikan Kabupaten Berau",
      shortName: "Disdik Berau",
      category: "Dinas Daerah (Lokus Utama EPSS)",
      address: "Jl. Mangga I No. 8, Tanjung Redeb, Kabupaten Berau",
      phone: "(0554) 21145",
      email: "disdik@beraukab.go.id",
      activity1Name: "Pendataan Profil Satuan Pendidikan Dasar dan Menengah Pertama",
      activity2Name: "Kompilasi Data Angka Partisipasi Sekolah dan Rasio Guru-Murid",
    },
    {
      code: "OPD-6405-05",
      name: "Dinas Kebudayaan dan Pariwisata Kabupaten Berau",
      shortName: "Disbudpar Berau",
      category: "Dinas Daerah",
      address: "Jl. Pulau Derawan No. 24, Tanjung Redeb, Kabupaten Berau",
      phone: "(0554) 21670",
      email: "disbudpar@beraukab.go.id",
      activity1Name: "Pendataan Kunjungan Wisatawan Nusantara dan Mancanegara Destinasi Derawan-Maratua",
      activity2Name: "Kompilasi Direktori Usaha Jasa Pariwisata dan Ekonomi Kreatif",
    },
    {
      code: "OPD-6405-06",
      name: "Dinas Perikanan Kabupaten Berau",
      shortName: "Diskan Berau",
      category: "Dinas Daerah",
      address: "Jl. Pemuda No. 41, Tanjung Redeb, Kabupaten Berau",
      phone: "(0554) 21833",
      email: "perikanan@beraukab.go.id",
      activity1Name: "Kompilasi Data Produksi Perikanan Tangkap dan Budidaya Kabupaten Berau",
      activity2Name: "Pendataan Rumah Tangga Perikanan dan Kapal Penangkap Ikan",
    },
  ];

  const createdOpds: Record<string, { id: string; code: string; shortName: string }> = {};
  for (const opd of opdData) {
    const created = await prisma.opd.create({ data: opd });
    createdOpds[opd.code] = created;
  }

  // 3. Seed Users for 3 Roles (Superadmin, Pembina Sektoral BPS, Operator OPD)
  const defaultPasswordHash = hashPassword("sigap2026");

  const superadmin = await prisma.user.create({
    data: {
      name: "Administrator Utama BPS Berau",
      email: "superadmin@bps-berau.go.id",
      nip: "198804122010121001",
      passwordHash: defaultPasswordHash,
      role: "SUPERADMIN",
      jabatan: "Koordinator Fungsi IPDS & Pembinaan Statistik Sektoral",
      phone: "081254001122",
      isActive: true,
    },
  });

  const pembina1 = await prisma.user.create({
    data: {
      name: "Dr. Hendra Kusuma, S.ST., M.Si.",
      email: "pembina@bps-berau.go.id",
      nip: "198507192008011004",
      passwordHash: defaultPasswordHash,
      role: "PEMBINA_SEKTORAL",
      jabatan: "Statistisi Ahli Muda — Ketua Tim Pembina EPSS BPS Kab. Berau",
      phone: "081347889900",
      isActive: true,
    },
  });

  const pembina2 = await prisma.user.create({
    data: {
      name: "Nadia Putri Pratama, S.Tr.Stat.",
      email: "nadia.pembina@bps-berau.go.id",
      nip: "199611032019012002",
      passwordHash: defaultPasswordHash,
      role: "PEMBINA_SEKTORAL",
      jabatan: "Statistisi Ahli Pertama — Tim Penilai EPSS BPS Kab. Berau",
      phone: "082155667788",
      isActive: true,
    },
  });

  const operatorDinkes = await prisma.user.create({
    data: {
      name: "Rizky Pratama, S.KM.",
      email: "operator.dinkes@beraukab.go.id",
      nip: "199203152018031005",
      passwordHash: defaultPasswordHash,
      role: "OPERATOR_OPD",
      jabatan: "Pengelola Data dan Informasi Kesehatan",
      phone: "085246112233",
      opdId: createdOpds["OPD-6405-01"].id,
      isActive: true,
    },
  });

  const operatorDiskominfo = await prisma.user.create({
    data: {
      name: "Siti Rahmawati, S.Kom.",
      email: "operator.diskominfo@beraukab.go.id",
      nip: "199408212019032008",
      passwordHash: defaultPasswordHash,
      role: "OPERATOR_OPD",
      jabatan: "Pranata Komputer Ahli Pertama — Walidata Daerah",
      phone: "081258994411",
      opdId: createdOpds["OPD-6405-02"].id,
      isActive: true,
    },
  });

  const operatorBapelitbang = await prisma.user.create({
    data: {
      name: "Arif Budiman, S.E., M.Ec.Dev.",
      email: "operator.bapelitbang@beraukab.go.id",
      nip: "199001102015031002",
      passwordHash: defaultPasswordHash,
      role: "OPERATOR_OPD",
      jabatan: "Perencana Ahli Muda — Sekretariat Satu Data",
      phone: "081349002211",
      opdId: createdOpds["OPD-6405-03"].id,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: "Dewi Lestari, S.Pd.",
      email: "operator.disdik@beraukab.go.id",
      nip: "199305142020122009",
      passwordHash: defaultPasswordHash,
      role: "OPERATOR_OPD",
      jabatan: "Pengelola Data Dapodik & Statistik Pendidikan",
      phone: "085345667711",
      opdId: createdOpds["OPD-6405-04"].id,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: "Fajar Nugroho, S.Par.",
      email: "operator.disbudpar@beraukab.go.id",
      nip: "199509282022031003",
      passwordHash: defaultPasswordHash,
      role: "OPERATOR_OPD",
      jabatan: "Analis Data Destinasi dan Kunjungan Wisata",
      phone: "082251003344",
      opdId: createdOpds["OPD-6405-05"].id,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: "Bambang Supriyadi, S.Pi.",
      email: "operator.perikanan@beraukab.go.id",
      nip: "199112042019031007",
      passwordHash: defaultPasswordHash,
      role: "OPERATOR_OPD",
      jabatan: "Pengelola Statistik Perikanan Tangkap & Budidaya",
      phone: "081253448899",
      opdId: createdOpds["OPD-6405-06"].id,
      isActive: true,
    },
  });

  // 4. Seed Official 5 Domains, 19 Aspects, and 38 Indicators from Petunjuk Teknis Penilaian EPSS.docx
  const indicatorMap: Record<string, string> = {};

  for (const dom of OFFICIAL_EPSS_DOMAINS) {
    const createdDomain = await prisma.epssDomain.create({
      data: {
        code: dom.code,
        name: dom.name,
        weight: dom.weight,
        description: dom.description,
      },
    });

    for (const asp of dom.aspects) {
      const createdAspect = await prisma.epssAspect.create({
        data: {
          code: asp.code,
          name: asp.name,
          weight: asp.weight,
          domainId: createdDomain.id,
        },
      });

      for (const ind of asp.indicators) {
        const createdInd = await prisma.epssIndicator.create({
          data: {
            code: ind.code,
            name: ind.name,
            weight: ind.weight,
            totalWeight: ind.totalWeight,
            aspectId: createdAspect.id,
            level1Criteria: ind.level1Criteria,
            level2Criteria: ind.level2Criteria,
            level3Criteria: ind.level3Criteria,
            level4Criteria: ind.level4Criteria,
            level5Criteria: ind.level5Criteria,
            notes: ind.notes ?? null,
          },
        });
        indicatorMap[ind.code] = createdInd.id;
      }
    }
  }

  // 5. Seed Realistic Submissions, Documents & Pembina Reviews across OPDs and Periods (2026, 2025, 2024)
  const allIndicatorCodes = Object.keys(indicatorMap);

  // Dinkes Berau (OPD-6405-01) — rich progress in 2026 (28 of 38 indicators filled, 18 verified, 7 waiting review, 3 revision)
  for (let i = 0; i < allIndicatorCodes.length; i++) {
    const code = allIndicatorCodes[i];
    const indId = indicatorMap[code];

    if (i < 18) {
      const score = i % 3 === 0 ? 4 : 3;
      const sub = await prisma.epssSubmission.create({
        data: {
          opdId: createdOpds["OPD-6405-01"].id,
          indicatorId: indId,
          periodYear: 2026,
          targetLevel: 4,
          selfScore: score,
          maturityScore: score,
          status: "TERVERIFIKASI",
          pageReference: "Halaman 12 - 18, Pasal 8 Perbup SDI No. 24 Tahun 2024",
          narrative: `(i) Bukti dukung menunjukkan penerapan indikator ${code} pada Kompilasi Data Profil Kesehatan Kabupaten Berau dan Survei Kepuasan Layanan FKTP secara konsisten sesuai Perbup SDI.\n(ii) Bukti_10101_SDSN_Dinkes_Berau_2026.pdf\n(iii) Halaman 12-18 (operasionalisasi standar dan reviu berkala).`,
          reviewerNotes:
            "Bukti dukung lengkap untuk 2 kegiatan statistik sektoral, telah dilengkapi dokumen kebijakan Perbup SDI dan notula reviu berkala.",
          reviewedById: pembina1.id,
          reviewedAt: new Date("2026-10-25T09:30:00Z"),
        },
      });

      await prisma.epssDocument.create({
        data: {
          submissionId: sub.id,
          fileName:
            code === "10201"
              ? "Bukti_10201_Metadata_Indah_Dinkes_2026.pdf"
              : "Bukti_10101_SDSN_Dinkes_Berau_2026.pdf",
          originalName: `Bukti_${code}_Dinkes_Berau_2026.pdf`,
          filePath:
            code === "10201"
              ? "/uploads/epss/Bukti_10201_Metadata_Indah_Dinkes_2026.pdf"
              : "/uploads/epss/Bukti_10101_SDSN_Dinkes_Berau_2026.pdf",
          mimeType: "application/pdf",
          fileSize: 1458200,
          targetLevel: score,
          pageNumber: "Hal. 12-18",
          description: `Dokumen bukti dukung indikator ${code} untuk 2 kegiatan statistik Dinkes Berau`,
          uploadedById: operatorDinkes.id,
        },
      });

      await prisma.epssReviewComment.create({
        data: {
          submissionId: sub.id,
          authorId: pembina1.id,
          scoreGiven: score,
          statusAction: "TERVERIFIKASI",
          comment: `Bukti dukung indikator ${code} telah memenuhi kriteria Tingkat Kematangan Level ${score}. Struktur dokumen utuh dan penunjukan halaman sudah tepat.`,
        },
      });
    } else if (i < 25) {
      const sub = await prisma.epssSubmission.create({
        data: {
          opdId: createdOpds["OPD-6405-01"].id,
          indicatorId: indId,
          periodYear: 2026,
          targetLevel: 3,
          selfScore: 3,
          maturityScore: null,
          status: "MENUNGGU_PERIKSA",
          pageReference: "Halaman 4 - 9 SOP Penyelenggaraan Statistik Dinkes",
          narrative: `(i) Dokumen bukti pelaksanaan indikator ${code} untuk kedua lokus kegiatan statistik beserta SOP tingkat instansi.\n(ii) Bukti_50201_Rekomendasi_Romantik_BPS_2026.pdf\n(iii) Halaman 4-9.`,
        },
      });

      await prisma.epssDocument.create({
        data: {
          submissionId: sub.id,
          fileName: "Bukti_50201_Rekomendasi_Romantik_BPS_2026.pdf",
          originalName: `Bukti_${code}_Pengajuan_Dinkes_2026.pdf`,
          filePath: "/uploads/epss/Bukti_50201_Rekomendasi_Romantik_BPS_2026.pdf",
          mimeType: "application/pdf",
          fileSize: 982400,
          targetLevel: 3,
          pageNumber: "Hal. 4-9",
          description: `Dokumen bukti dukung indikator ${code} siap diperiksa Pembina BPS`,
          uploadedById: operatorDinkes.id,
        },
      });
    } else if (i < 28) {
      const sub = await prisma.epssSubmission.create({
        data: {
          opdId: createdOpds["OPD-6405-01"].id,
          indicatorId: indId,
          periodYear: 2026,
          targetLevel: 3,
          selfScore: 3,
          maturityScore: 2,
          status: "REVISI",
          pageReference: "Halaman 2 - 5",
          narrative: `(i) Lampiran bukti pelaksanaan kegiatan statistik.\n(ii) Bukti_10101_SDSN_Dinkes_Berau_2026.pdf\n(iii) Halaman 2-5.`,
          reviewerNotes:
            "Baru melampirkan bukti untuk 1 kegiatan statistik sektoral. Sesuai Juknis EPSS, wajib melampirkan bukti untuk 2 kegiatan yang dinilaikan serta dokumen kebijakan utuh.",
          reviewedById: pembina2.id,
          reviewedAt: new Date("2026-10-28T14:15:00Z"),
        },
      });

      await prisma.epssDocument.create({
        data: {
          submissionId: sub.id,
          fileName: "Bukti_10101_SDSN_Dinkes_Berau_2026.pdf",
          originalName: `Bukti_${code}_Draf_Awal.pdf`,
          filePath: "/uploads/epss/Bukti_10101_SDSN_Dinkes_Berau_2026.pdf",
          mimeType: "application/pdf",
          fileSize: 642000,
          targetLevel: 2,
          pageNumber: "Hal. 2-5",
          description: `Bukti awal indikator ${code} (perlu kelengkapan kegiatan ke-2)`,
          uploadedById: operatorDinkes.id,
        },
      });

      await prisma.epssReviewComment.create({
        data: {
          submissionId: sub.id,
          authorId: pembina2.id,
          scoreGiven: 2,
          statusAction: "REVISI",
          comment:
            "Mohon lengkapi bukti untuk kegiatan statistik kedua dan unggah dokumen Perbup/SOP secara utuh (bukan hanya potongan halaman) untuk mencapai Level 3.",
        },
      });
    }
  }

  // Diskominfo Berau (OPD-6405-02) — 32 of 38 indicators in 2026
  for (let i = 0; i < 32; i++) {
    const code = allIndicatorCodes[i];
    const indId = indicatorMap[code];
    const isVerified = i < 24;
    const score = i % 2 === 0 ? 4 : 3;

    const sub = await prisma.epssSubmission.create({
      data: {
        opdId: createdOpds["OPD-6405-02"].id,
        indicatorId: indId,
        periodYear: 2026,
        targetLevel: 4,
        selfScore: score,
        maturityScore: isVerified ? score : null,
        status: isVerified ? "TERVERIFIKASI" : "MENUNGGU_PERIKSA",
        pageReference: "Halaman 6 - 15 Perbup Satu Data Kab. Berau",
        narrative: `(i) Bukti penyelenggaraan Walidata Daerah pada Portal Satu Data Berau untuk indikator ${code}.\n(ii) Bukti_10201_Metadata_Indah_Dinkes_2026.pdf\n(iii) Halaman 6-15.`,
        reviewerNotes: isVerified
          ? "Telah diverifikasi oleh Tim Pembina Statistik Sektoral BPS Kab. Berau. Memenuhi kriteria Level " +
            score
          : null,
        reviewedById: isVerified ? pembina1.id : null,
        reviewedAt: isVerified ? new Date("2026-10-26T10:00:00Z") : null,
      },
    });

    await prisma.epssDocument.create({
      data: {
        submissionId: sub.id,
        fileName: "Bukti_10201_Metadata_Indah_Dinkes_2026.pdf",
        originalName: `Bukti_${code}_Walidata_Diskominfo_2026.pdf`,
        filePath: "/uploads/epss/Bukti_10201_Metadata_Indah_Dinkes_2026.pdf",
        mimeType: "application/pdf",
        fileSize: 1820000,
        targetLevel: score,
        pageNumber: "Hal. 6-15",
        description: `Dokumen bukti dukung Walidata Diskominfo indikator ${code}`,
        uploadedById: operatorDiskominfo.id,
      },
    });
  }

  // Bapelitbang (OPD-6405-03) — 22 of 38 indicators in 2026
  for (let i = 0; i < 22; i++) {
    const code = allIndicatorCodes[i];
    const indId = indicatorMap[code];
    const isVerified = i < 15;
    const sub = await prisma.epssSubmission.create({
      data: {
        opdId: createdOpds["OPD-6405-03"].id,
        indicatorId: indId,
        periodYear: 2026,
        targetLevel: 3,
        selfScore: 3,
        maturityScore: isVerified ? 3 : null,
        status: isVerified ? "TERVERIFIKASI" : "MENUNGGU_PERIKSA",
        pageReference: "Halaman 20 - 31 Dokumen RKPD & Forum SDI Berau",
        narrative: `(i) Pemanfaatan dan perencanaan data makro pembangunan Kabupaten Berau pada indikator ${code}.\n(ii) Bukti_50201_Rekomendasi_Romantik_BPS_2026.pdf\n(iii) Halaman 20-31.`,
        reviewedById: isVerified ? pembina1.id : null,
        reviewedAt: isVerified ? new Date("2026-10-24T11:00:00Z") : null,
      },
    });

    await prisma.epssDocument.create({
      data: {
        submissionId: sub.id,
        fileName: "Bukti_50201_Rekomendasi_Romantik_BPS_2026.pdf",
        originalName: `Bukti_${code}_Bapelitbang_Berau_2026.pdf`,
        filePath: "/uploads/epss/Bukti_50201_Rekomendasi_Romantik_BPS_2026.pdf",
        mimeType: "application/pdf",
        fileSize: 1210000,
        targetLevel: 3,
        pageNumber: "Hal. 20-31",
        description: `Dokumen bukti dukung Bapelitbang indikator ${code}`,
        uploadedById: operatorBapelitbang.id,
      },
    });
  }

  // Disdik (16 indicators), Disbudpar (11 indicators), Diskan (9 indicators) in 2026
  const otherOpdCounts: Array<{ opdCode: string; count: number; verified: number }> = [
    { opdCode: "OPD-6405-04", count: 16, verified: 10 },
    { opdCode: "OPD-6405-05", count: 11, verified: 6 },
    { opdCode: "OPD-6405-06", count: 9, verified: 4 },
  ];

  for (const item of otherOpdCounts) {
    for (let i = 0; i < item.count; i++) {
      const code = allIndicatorCodes[i];
      const indId = indicatorMap[code];
      const isVer = i < item.verified;
      const sub = await prisma.epssSubmission.create({
        data: {
          opdId: createdOpds[item.opdCode].id,
          indicatorId: indId,
          periodYear: 2026,
          targetLevel: 3,
          selfScore: 3,
          maturityScore: isVer ? 3 : null,
          status: isVer ? "TERVERIFIKASI" : "MENUNGGU_PERIKSA",
          pageReference: "Halaman 5 - 12 Publikasi Sektoral OPD",
          narrative: `(i) Bukti dukung indikator ${code} telah diunggah sesuai pedoman EPSS.\n(ii) Bukti_10101_SDSN_Dinkes_Berau_2026.pdf\n(iii) Halaman 5-12.`,
          reviewedById: isVer ? pembina2.id : null,
          reviewedAt: isVer ? new Date("2026-10-22T15:00:00Z") : null,
        },
      });

      await prisma.epssDocument.create({
        data: {
          submissionId: sub.id,
          fileName: "Bukti_10101_SDSN_Dinkes_Berau_2026.pdf",
          originalName: `Bukti_${code}_${createdOpds[item.opdCode].shortName.replace(/\s+/g, "_")}.pdf`,
          filePath: "/uploads/epss/Bukti_10101_SDSN_Dinkes_Berau_2026.pdf",
          mimeType: "application/pdf",
          fileSize: 950000,
          targetLevel: 3,
          pageNumber: "Hal. 5-12",
          description: `Bukti dukung indikator ${code}`,
        },
      });
    }
  }

  // Historical Period 2025 & 2024 submissions for Dinkes & Diskominfo so period filter works richly!
  for (const year of [2025, 2024]) {
    for (const opdCode of ["OPD-6405-01", "OPD-6405-02", "OPD-6405-03"]) {
      for (let i = 0; i < allIndicatorCodes.length; i++) {
        const code = allIndicatorCodes[i];
        const indId = indicatorMap[code];
        const score = year === 2025 ? (i % 3 === 0 ? 3 : 3) : i % 2 === 0 ? 3 : 2;
        await prisma.epssSubmission.create({
          data: {
            opdId: createdOpds[opdCode].id,
            indicatorId: indId,
            periodYear: year,
            targetLevel: 3,
            selfScore: score,
            maturityScore: score,
            status: "TERVERIFIKASI",
            pageReference: `Arsip Bukti EPSS Tahun ${year} Hal. 1-15`,
            narrative: `(i) Arsip bukti dukung terverifikasi untuk indikator ${code} pada periode evaluasi tahun ${year}.\n(ii) Arsip_EPSS_${year}_${code}.pdf\n(iii) Halaman 1-15.`,
            reviewerNotes: `Evaluasi akhir tahun ${year} selesai diverifikasi oleh Tim Penilai Badan Pusat Statistik.`,
            reviewedById: pembina1.id,
            reviewedAt: new Date(`${year}-09-20T10:00:00Z`),
          },
        });
      }
    }
  }

  // 6. Seed Coaching Schedules (/dashboard/pembinaan) matching Figma design
  await prisma.coachingSchedule.createMany({
    data: [
      {
        title: "Pendampingan Penyusunan Metadata Statistik (MS-Keg, MS-Var, MS-Ind) di Aplikasi INDAH",
        topic: "Domain 1 — Prinsip Satu Data Indonesia",
        description:
          "Bimbingan teknis pengisian dan verifikasi metadata statistik sektoral pada portal INDAH BPS bagi operator OPD lokus EPSS 2026.",
        date: new Date("2026-11-10T09:00:00Z"),
        startTime: "09.00",
        endTime: "12.00 WITA",
        location: "Ruang Rapat Bapelitbang Kab. Berau Lt. 2",
        mode: "TATAP_MUKA",
        status: "TERJADWAL",
        opdId: createdOpds["OPD-6405-01"].id,
        pembinaName: "Dr. Hendra Kusuma, S.ST., M.Si.",
        participants: 24,
        notes: "Harap membawa draf kuesioner dan buku publikasi 2 kegiatan statistik yang dinilaikan.",
      },
      {
        title: "Klinik Pengajuan Rekomendasi Kegiatan Statistik (Aplikasi Romantik BPS)",
        topic: "Domain 3 & 5 — Desain Statistik & Rekomendasi Kegiatan",
        description:
          "Pendampingan pengisian formulir pemberitahuan rancangan survei dan kompilasi produk administrasi melalui romantik.web.bps.go.id.",
        date: new Date("2026-11-14T08:30:00Z"),
        startTime: "08.30",
        endTime: "11.30 WITA",
        location: "Aula Kantor BPS Kabupaten Berau, Jl. Mangga II",
        mode: "TATAP_MUKA",
        status: "TERJADWAL",
        opdId: createdOpds["OPD-6405-04"].id,
        pembinaName: "Nadia Putri Pratama, S.Tr.Stat.",
        participants: 18,
        notes: "Wajib membawa KAK/TOR kegiatan statistik sektoral tahun berjalan.",
      },
      {
        title: "Reviu Kelengkapan Bukti Dukung Level 3 & Level 4 (Dokumen Kebijakan & Notula Evaluasi)",
        topic: "Semua Domain — Simulasi Penilaian Mandiri EPSS",
        description:
          "Pemeriksaan silang (cross-check) bukti dukung Perbup SDI, SOP internal OPD, dan berita acara reviu berkala dua periode.",
        date: new Date("2026-11-18T13:30:00Z"),
        startTime: "13.30",
        endTime: "16.00 WITA",
        location: "Command Center Diskominfo Kabupaten Berau / Zoom Meeting",
        mode: "HIBRIDA",
        status: "TERJADWAL",
        opdId: createdOpds["OPD-6405-02"].id,
        pembinaName: "Dr. Hendra Kusuma, S.ST., M.Si.",
        participants: 35,
        notes: "Koordinasi bersama Walidata Daerah (Diskominfo) dan Sekretariat SDI (Bapelitbang).",
      },
      {
        title: "Forum Satu Data Indonesia Kabupaten Berau: Penetapan Daftar Data & Data Prioritas 2026",
        topic: "Domain 4 — Kelembagaan & Pengorganisasian Statistik",
        description:
          "Rapat koordinasi Forum SDI Kabupaten Berau untuk menyepakati Daftar Data Daerah, Kode Referensi, dan Rencana Aksi Satu Data.",
        date: new Date("2026-10-28T09:00:00Z"),
        startTime: "09.00",
        endTime: "12.30 WITA",
        location: "Ruang RPJMD Bapelitbang Kabupaten Berau",
        mode: "TATAP_MUKA",
        status: "SELESAI",
        opdId: createdOpds["OPD-6405-03"].id,
        pembinaName: "Dr. Hendra Kusuma, S.ST., M.Si.",
        participants: 42,
        notes: "Berita acara dan daftar hadir telah diunggah ke repositori materi sebagai bukti Domain 4.",
      },
      {
        title: "Pembinaan Kualitas Data & Pemeriksaan Outlier Statistik Pariwisata dan Perikanan",
        topic: "Domain 2 — Kualitas Data (Akurasi & Keterbandingan)",
        description:
          "Evaluasi prosedur pemeriksaan akurasi, validasi berjenjang, dan konsistensi antar waktu untuk data produksi perikanan dan kunjungan wisata.",
        date: new Date("2026-10-21T09:00:00Z"),
        startTime: "09.00",
        endTime: "11.30 WITA",
        location: "Ruang Rapat Dinas Perikanan Kab. Berau",
        mode: "TATAP_MUKA",
        status: "SELESAI",
        opdId: createdOpds["OPD-6405-06"].id,
        pembinaName: "Nadia Putri Pratama, S.Tr.Stat.",
        participants: 16,
        notes: "Telah disusun draf SOP Pemeriksaan Akurasi Data Sektoral.",
      },
      {
        title: "Sosialisasi Petunjuk Teknis Penilaian EPSS 2026 & Penggunaan Portal SIGAP BERAU",
        topic: "Semua Domain — Orientasi Portal Pembinaan",
        description:
          "Pengenalan fitur unggah bukti dukung, format narasi Simbatik (i)-(ii)-(iii), dan alur verifikasi berjenjang di aplikasi SIGAP BERAU.",
        date: new Date("2026-10-12T08:30:00Z"),
        startTime: "08.30",
        endTime: "12.00 WITA",
        location: "Ballroom Hotel Bumi Segah, Tanjung Redeb",
        mode: "TATAP_MUKA",
        status: "SELESAI",
        opdId: null,
        pembinaName: "Administrator Utama BPS Berau",
        participants: 65,
        notes: "Diikuti oleh seluruh Operator OPD dan Walidata Pendukung se-Kabupaten Berau.",
      },
    ],
  });

  // 7. Seed Knowledge Base Materials (/dashboard/materi) matching Figma design
  await prisma.learningMaterial.createMany({
    data: [
      {
        title: "Petunjuk Teknis Penilaian EPSS & Spesifikasi Bukti Dukung 38 Indikator (Edisi 2026)",
        category: "Panduan EPSS",
        format: "PDF",
        fileSize: "4,2 MB",
        fileUrl: "/uploads/materi/Panduan_Persiapan_EPSS_Kabupaten_Berau_2026.pdf",
        targetAudience: "Semua OPD",
        domainCode: "Semua Domain",
        isFeatured: true,
        description:
          "Kenali lima domain evaluasi (38 indikator) dan pelajari cara menyiapkan bukti dukung Tingkat Kematangan Level 1 hingga Level 5 beserta format narasi Simbatik yang relevan bagi instansi Anda.",
        author: "Tim Pembina Statistik Sektoral BPS Kab. Berau",
        downloadCount: 148,
        publishedLabel: "Okt 2026",
      },
      {
        title: "Peraturan BPS Nomor 3 Tahun 2022 tentang Evaluasi Penyelenggaraan Statistik Sektoral",
        category: "Regulasi & Kebijakan",
        format: "PDF",
        fileSize: "2,8 MB",
        fileUrl: "/uploads/materi/Panduan_Persiapan_EPSS_Kabupaten_Berau_2026.pdf",
        targetAudience: "Semua OPD",
        domainCode: "Semua Domain",
        isFeatured: false,
        description:
          "Landasan hukum penyelenggaraan EPSS, bobot penilaian 5 domain, 19 aspek, dan 38 indikator serta tata cara penetapan Indeks Pembangunan Statistik (IPS).",
        author: "Badan Pusat Statistik RI",
        downloadCount: 112,
        publishedLabel: "Jan 2026",
      },
      {
        title: "Template SOP Penyelenggaraan Statistik Sektoral & Pemeriksaan Kualitas Data OPD",
        category: "Template & Instrumen",
        format: "DOCX",
        fileSize: "1,4 MB",
        fileUrl: "/uploads/materi/Panduan_Persiapan_EPSS_Kabupaten_Berau_2026.pdf",
        targetAudience: "Produsen Data",
        domainCode: "Domain 2 & 3",
        isFeatured: false,
        description:
          "Contoh dokumen kebijakan internal (SOP Identifikasi Kebutuhan Data, SOP Penilaian Akurasi, dan SOP Diseminasi) untuk pemenuhan syarat Tingkat Kematangan Level 3.",
        author: "Tim Pembina Statistik Sektoral BPS Kab. Berau",
        downloadCount: 96,
        publishedLabel: "Sep 2026",
      },
      {
        title: "Formulir Baku Metadata Statistik Kegiatan (MS-Keg), Variabel (MS-Var), dan Indikator (MS-Ind)",
        category: "Standar Data & Metadata",
        format: "XLSX",
        fileSize: "860 KB",
        fileUrl: "/uploads/materi/Panduan_Persiapan_EPSS_Kabupaten_Berau_2026.pdf",
        targetAudience: "Produsen Data",
        domainCode: "Domain 1",
        isFeatured: false,
        description:
          "Lembar kerja pengisian metadata statistik sesuai Peraturan BPS Nomor 5 Tahun 2020 sebelum diunggah ke aplikasi INDAH BPS.",
        author: "BPS Kabupaten Berau",
        downloadCount: 134,
        publishedLabel: "Agu 2026",
      },
      {
        title: "Paparan Strategi Akselerasi Indeks Pembangunan Statistik (IPS) Kabupaten Berau Menuju Predikat Memuaskan",
        category: "Materi Sosialisasi",
        format: "PPTX",
        fileSize: "5,6 MB",
        fileUrl: "/uploads/materi/Panduan_Persiapan_EPSS_Kabupaten_Berau_2026.pdf",
        targetAudience: "Semua OPD",
        domainCode: "Semua Domain",
        isFeatured: false,
        description:
          "Slide presentasi kunci pemenuhan bukti dukung Level 3 (Kebijakan), Level 4 (Reviu Berkala 2 Periode), dan Level 5 (Before-After Tindak Lanjut).",
        author: "Kepala BPS Kabupaten Berau",
        downloadCount: 89,
        publishedLabel: "Okt 2026",
      },
      {
        title: "Panduan Pengajuan Rekomendasi Kegiatan Statistik Sektoral Melalui Aplikasi Romantik BPS",
        category: "Standar Data & Metadata",
        format: "PDF",
        fileSize: "3,1 MB",
        fileUrl: "/uploads/epss/Bukti_50201_Rekomendasi_Romantik_BPS_2026.pdf",
        targetAudience: "Produsen Data",
        domainCode: "Domain 5",
        isFeatured: false,
        description:
          "Langkah demi langkah pemberitahuan rancangan survei dan kompilasi produk administrasi di romantik.web.bps.go.id untuk memenuhi Indikator 30102 dan 50201.",
        author: "Tim Pembina Statistik Sektoral BPS Kab. Berau",
        downloadCount: 77,
        publishedLabel: "Sep 2026",
      },
      {
        title: "Contoh Paket Bukti Dukung Lengkap (Notula Reviu Berkala & Laporan Tindak Lanjut Before-After)",
        category: "Template & Instrumen",
        format: "ZIP",
        fileSize: "6,4 MB",
        fileUrl: "/uploads/epss/Bukti_10101_SDSN_Dinkes_Berau_2026.pdf",
        targetAudience: "Semua OPD",
        domainCode: "Domain 1 - 5",
        isFeatured: false,
        description:
          "Kumpulan contoh dokumen berita acara reviu tahap I & II serta matriks penyempurnaan tata kelola statistik untuk mencapai Tingkat Kematangan Level 4 dan 5.",
        author: "Walidata Daerah & BPS Kab. Berau",
        downloadCount: 105,
        publishedLabel: "Okt 2026",
      },
    ],
  });

  console.log("Seeding database SIGAP BERAU berhasil diselesaikan!");
  console.log("Akun Demo (Kata sandi semua akun: sigap2026):");
  console.log(`- Superadmin       : ${superadmin.email}`);
  console.log(`- Pembina Sektoral : ${pembina1.email}`);
  console.log(`- Operator Dinkes  : ${operatorDinkes.email}`);
  console.log(`- Operator Kominfo : ${operatorDiskominfo.email}`);
}

main()
  .catch((e) => {
    console.error("Gagal melakukan seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

