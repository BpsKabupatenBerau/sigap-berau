import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getActiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/pembinaan?template=1 -> Unduh Template Excel (.xlsx) Resmi Jadwal Pembinaan
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("template") !== "1") {
    return NextResponse.json({ error: "Parameter tidak valid." }, { status: 400 });
  }

  const opds = await prisma.opd.findMany({
    orderBy: { shortName: "asc" },
    select: { code: true, shortName: true, name: true },
  });

  // Sheet 1: Template Jadwal Pembinaan
  const scheduleRows = [
    {
      "Nama Kegiatan": "Klinik Penyusunan Metadata Statistik Sektoral (INDAH BPS)",
      "Topik Domain": "Domain 1 — Prinsip Satu Data Indonesia",
      "Tanggal (YYYY-MM-DD)": "2026-11-24",
      "Jam Mulai": "09.00",
      "Jam Selesai": "12.00 WITA",
      "Lokasi Pelaksanaan": "Aula Kantor BPS Kabupaten Berau",
      "Metode (TATAP_MUKA / DARING / HIBRIDA)": "TATAP_MUKA",
      "Instansi OPD Sasaran": "Dinkes Berau",
      "Pembina Sektoral": "Dr. Hendra Kusuma, S.ST., M.Si.",
      "Status (TERJADWAL / BERLANGSUNG / SELESAI)": "TERJADWAL",
      "Deskripsi Kegiatan": "Pendampingan teknis pengisian MS-Keg, MS-Var, dan MS-Ind.",
      "Catatan Persiapan": "Membawa dokumen publikasi 2 kegiatan statistik.",
    },
    {
      "Nama Kegiatan": "Evaluasi Kelengkapan Bukti Dukung EPSS Tahap II",
      "Topik Domain": "Semua Domain — Simulasi Penilaian Mandiri EPSS",
      "Tanggal (YYYY-MM-DD)": "2026-11-27",
      "Jam Mulai": "13.30",
      "Jam Selesai": "16.00 WITA",
      "Lokasi Pelaksanaan": "Zoom Meeting / Command Center Diskominfo",
      "Metode (TATAP_MUKA / DARING / HIBRIDA)": "HIBRIDA",
      "Instansi OPD Sasaran": "Seluruh OPD",
      "Pembina Sektoral": "Nadia Putri Pratama, S.Tr.Stat.",
      "Status (TERJADWAL / BERLANGSUNG / SELESAI)": "TERJADWAL",
      "Deskripsi Kegiatan": "Pemeriksaan silang bukti dukung Level 3 dan Level 4.",
      "Catatan Persiapan": "Pastikan bukti PDF sudah diunggah di portal SIGAP BERAU.",
    },
  ];

  // Sheet 2: Referensi Daftar OPD & Petunjuk Pengisian
  const referenceRows = [
    {
      "Kode OPD": "ALL",
      "Singkatan OPD (Isi di Kolom Instansi OPD Sasaran)": "Seluruh OPD",
      "Nama Lengkap Instansi": "Seluruh Perangkat Daerah Kabupaten Berau",
    },
    ...opds.map((o) => ({
      "Kode OPD": o.code,
      "Singkatan OPD (Isi di Kolom Instansi OPD Sasaran)": o.shortName,
      "Nama Lengkap Instansi": o.name,
    })),
  ];

  const wb = XLSX.utils.book_new();
  const wsSchedule = XLSX.utils.json_to_sheet(scheduleRows);
  wsSchedule["!cols"] = [
    { wch: 45 },
    { wch: 36 },
    { wch: 22 },
    { wch: 12 },
    { wch: 15 },
    { wch: 34 },
    { wch: 36 },
    { wch: 24 },
    { wch: 30 },
    { wch: 38 },
    { wch: 42 },
    { wch: 38 },
  ];

  const wsRef = XLSX.utils.json_to_sheet(referenceRows);
  wsRef["!cols"] = [{ wch: 18 }, { wch: 45 }, { wch: 52 }];

  XLSX.utils.book_append_sheet(wb, wsSchedule, "Template_Jadwal");
  XLSX.utils.book_append_sheet(wb, wsRef, "Referensi_OPD");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="Template_Jadwal_Pembinaan_SIGAP_Berau.xlsx"',
    },
  });
}

function parseExcelDateToUtc(rawDate: unknown): Date | null {
  if (!rawDate) return null;

  // Handle Excel serial number date
  if (typeof rawDate === "number") {
    const parsed = XLSX.SSF.parse_date_code(rawDate);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, 9, 0, 0));
    }
  }

  if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
    return rawDate;
  }

  const str = String(rawDate).trim();
  if (!str) return null;

  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]) - 1;
    const d = Number(isoMatch[3]);
    return new Date(Date.UTC(y, m, d, 9, 0, 0));
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = Number(dmyMatch[1]);
    const m = Number(dmyMatch[2]) - 1;
    const y = Number(dmyMatch[3]);
    return new Date(Date.UTC(y, m, d, 9, 0, 0));
  }

  const fallback = new Date(str);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function normalizeMode(raw: unknown): string {
  const val = String(raw || "")
    .trim()
    .toUpperCase();
  if (val.includes("DARING") || val.includes("ONLINE") || val.includes("ZOOM")) {
    return "DARING";
  }
  if (val.includes("HIBRIDA") || val.includes("HYBRID")) {
    return "HIBRIDA";
  }
  return "TATAP_MUKA";
}

function normalizeStatus(raw: unknown): string {
  const val = String(raw || "")
    .trim()
    .toUpperCase();
  if (val.includes("SELESAI")) return "SELESAI";
  if (val.includes("BERLANGSUNG")) return "BERLANGSUNG";
  return "TERJADWAL";
}

export async function POST(request: Request) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json(
        { error: "Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    if (
      session.effectiveUser.role !== "PEMBINA_SEKTORAL" &&
      session.effectiveUser.role !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Hanya Pembina Sektoral BPS atau Superadmin yang dapat menambahkan jadwal pembinaan.",
        },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    // 1. Jika unggah berkas Template Excel (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file || file.size === 0) {
        return NextResponse.json(
          { error: "Pilih berkas Excel (.xlsx / .xls / .csv) terlebih dahulu." },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        return NextResponse.json(
          { error: "Berkas Excel tidak memiliki lembar kerja (sheet)." },
          { status: 400 }
        );
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      if (rows.length === 0) {
        return NextResponse.json(
          { error: "Tidak ada baris data jadwal di dalam berkas Excel." },
          { status: 400 }
        );
      }

      const allOpds = await prisma.opd.findMany();

      const schedulesToInsert: Array<{
        title: string;
        topic: string;
        description: string | null;
        date: Date;
        startTime: string;
        endTime: string;
        location: string;
        mode: string;
        status: string;
        opdId: string | null;
        pembinaName: string;
        participants: number;
        notes: string | null;
      }> = [];

      for (const row of rows) {
        // Flexible column lookup (case-insensitive & partial key match)
        const getCol = (keywords: string[]): unknown => {
          for (const key of Object.keys(row)) {
            const lowerKey = key.toLowerCase();
            if (keywords.some((kw) => lowerKey.includes(kw))) {
              return row[key];
            }
          }
          return "";
        };

        const rawTitle = String(
          getCol(["nama kegiatan", "judul", "kegiatan", "title"]) || ""
        ).trim();
        if (!rawTitle) continue;

        const rawTopic =
          String(getCol(["topik", "domain", "topic"]) || "").trim() ||
          "Domain 1 — Prinsip Satu Data Indonesia";
        const rawDate = getCol(["tanggal", "date"]);
        const parsedDate =
          parseExcelDateToUtc(rawDate) || new Date("2026-11-20T09:00:00Z");

        const rawStart =
          String(getCol(["jam mulai", "mulai", "start"]) || "").trim() ||
          "09.00";
        const rawEnd =
          String(getCol(["jam selesai", "selesai", "end"]) || "").trim() ||
          "12.00 WITA";
        const rawLocation =
          String(getCol(["lokasi", "tempat", "location"]) || "").trim() ||
          "Aula Kantor BPS Kabupaten Berau";
        const rawMode = normalizeMode(getCol(["metode", "mode"]));
        const rawStatus = normalizeStatus(getCol(["status"]));
        const rawOpd = String(
          getCol(["instansi", "opd", "sasaran"]) || ""
        ).trim();
        const rawPembina =
          String(getCol(["pembina", "narasumber"]) || "").trim() ||
          session.effectiveUser.name;
        const rawDesc = String(
          getCol(["deskripsi", "uraian", "description"]) || ""
        ).trim();
        const rawNotes = String(
          getCol(["catatan", "persiapan", "notes"]) || ""
        ).trim();

        // Match OPD by code, shortName, or name
        let matchedOpdId: string | null = null;
        if (
          rawOpd &&
          !rawOpd.toLowerCase().includes("seluruh") &&
          !rawOpd.toLowerCase().includes("semua") &&
          rawOpd.toUpperCase() !== "ALL"
        ) {
          const lowerOpd = rawOpd.toLowerCase();
          const foundOpd = allOpds.find(
            (o) =>
              o.code.toLowerCase() === lowerOpd ||
              o.shortName.toLowerCase().includes(lowerOpd) ||
              lowerOpd.includes(o.shortName.toLowerCase()) ||
              o.name.toLowerCase().includes(lowerOpd)
          );
          if (foundOpd) {
            matchedOpdId = foundOpd.id;
          }
        }

        schedulesToInsert.push({
          title: rawTitle,
          topic: rawTopic,
          description: rawDesc || null,
          date: parsedDate,
          startTime: rawStart,
          endTime: rawEnd,
          location: rawLocation,
          mode: rawMode,
          status: rawStatus,
          opdId: matchedOpdId,
          pembinaName: rawPembina,
          participants: 25,
          notes: rawNotes || null,
        });
      }

      if (schedulesToInsert.length === 0) {
        return NextResponse.json(
          {
            error:
              "Tidak ditemukan baris kegiatan yang valid. Pastikan kolom 'Nama Kegiatan' terisi sesuai template.",
          },
          { status: 400 }
        );
      }

      const result = await prisma.coachingSchedule.createMany({
        data: schedulesToInsert,
      });

      return NextResponse.json({
        success: true,
        importedCount: result.count,
        message: `Berhasil mengimpor ${result.count} jadwal pembinaan dari berkas Excel.`,
      });
    }

    // 2. Jika input satuan via form JSON biasa
    const body = await request.json();
    const {
      title,
      topic,
      description,
      date,
      startTime,
      endTime,
      location,
      mode = "TATAP_MUKA",
      status = "TERJADWAL",
      opdId,
      pembinaName,
      notes,
    } = body;

    if (!title || !topic || !date || !location) {
      return NextResponse.json(
        { error: "Nama kegiatan, topik domain, tanggal, dan lokasi wajib diisi." },
        { status: 400 }
      );
    }

    const created = await prisma.coachingSchedule.create({
      data: {
        title: String(title).trim(),
        topic: String(topic).trim(),
        description: description ? String(description).trim() : null,
        date: new Date(date),
        startTime: String(startTime || "09.00"),
        endTime: String(endTime || "12.00 WITA"),
        location: String(location).trim(),
        mode: String(mode),
        status: String(status),
        opdId: opdId && opdId !== "ALL" ? String(opdId) : null,
        pembinaName: String(pembinaName || session.effectiveUser.name),
        notes: notes ? String(notes).trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      schedule: created,
    });
  } catch (error) {
    console.error("Create/Import coaching schedule error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan atau mengimpor jadwal pembinaan." },
      { status: 500 }
    );
  }
}
