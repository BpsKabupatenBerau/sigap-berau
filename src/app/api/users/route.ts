import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getActiveSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users?template=1 -> Unduh Template Excel (.xlsx) Resmi Manajemen Pengguna
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("template") !== "1") {
    return NextResponse.json(
      { error: "Parameter tidak valid." },
      { status: 400 }
    );
  }

  const opds = await prisma.opd.findMany({
    orderBy: { code: "asc" },
    select: { code: true, shortName: true, name: true },
  });

  // Sheet 1: Template Akun Pengguna
  const userRows = [
    {
      "Nama Lengkap & Gelar": "Budi Santoso, S.Stat.",
      "Alamat Surel (Email)": "operator.distan@beraukab.go.id",
      "NIP Pegawai": "199204152019031004",
      "Peran (OPERATOR_OPD / PEMBINA_SEKTORAL / SUPERADMIN)": "OPERATOR_OPD",
      "Singkatan OPD": "Distan Berau",
      "Nama Lengkap OPD (Diisi jika OPD Baru)": "Dinas Tanaman Pangan, Hortikultura, dan Peternakan Kabupaten Berau",
      "Jabatan": "Pengelola Data Statistik Pertanian",
      "Nomor Telepon / WA": "081254001122",
      "Kata Sandi Awal": "sigap2026",
    },
    {
      "Nama Lengkap & Gelar": "Rina Wulandari, S.Tr.Stat.",
      "Alamat Surel (Email)": "rina.wulandari@bps.go.id",
      "NIP Pegawai": "199608122021022003",
      "Peran (OPERATOR_OPD / PEMBINA_SEKTORAL / SUPERADMIN)": "PEMBINA_SEKTORAL",
      "Singkatan OPD": "BPS Kab. Berau",
      "Nama Lengkap OPD (Diisi jika OPD Baru)": "",
      "Jabatan": "Statistisi Ahli Pertama — Tim Pembina EPSS",
      "Nomor Telepon / WA": "081347889900",
      "Kata Sandi Awal": "sigap2026",
    },
  ];

  // Sheet 2: Referensi Daftar OPD Terdaftar
  const refOpds = opds.map((o) => ({
    "Kode OPD": o.code,
    "Singkatan OPD": o.shortName,
    "Nama Lengkap Perangkat Daerah": o.name,
  }));

  const wb = XLSX.utils.book_new();
  const wsUsers = XLSX.utils.json_to_sheet(userRows);
  wsUsers["!cols"] = [
    { wch: 30 },
    { wch: 34 },
    { wch: 22 },
    { wch: 48 },
    { wch: 22 },
    { wch: 52 },
    { wch: 36 },
    { wch: 18 },
    { wch: 18 },
  ];

  const wsRef = XLSX.utils.json_to_sheet(refOpds);
  wsRef["!cols"] = [{ wch: 16 }, { wch: 24 }, { wch: 54 }];

  XLSX.utils.book_append_sheet(wb, wsUsers, "Template_Pengguna");
  XLSX.utils.book_append_sheet(wb, wsRef, "Referensi_OPD");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="Template_Manajemen_Pengguna_SIGAP_Berau.xlsx"',
    },
  });
}

function normalizeRole(raw: unknown): "SUPERADMIN" | "PEMBINA_SEKTORAL" | "OPERATOR_OPD" {
  const val = String(raw || "")
    .trim()
    .toUpperCase();
  if (val.includes("SUPERADMIN") || val.includes("ADMIN UTAMA")) {
    return "SUPERADMIN";
  }
  if (val.includes("PEMBINA") || val.includes("BPS")) {
    return "PEMBINA_SEKTORAL";
  }
  return "OPERATOR_OPD";
}

export async function POST(request: Request) {
  try {
    const session = await getActiveSession();
    if (!session || session.realUser.role !== "SUPERADMIN") {
      return NextResponse.json(
        {
          error:
            "Akses ditolak. Hanya Superadmin yang dapat mengelola akun pengguna.",
        },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    // 1. Jika Impor Massal Pengguna via Template Excel (multipart/form-data)
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
          { error: "Tidak ada baris data pengguna di dalam berkas Excel." },
          { status: 400 }
        );
      }

      const opdList = await prisma.opd.findMany();
      let importedCount = 0;
      let updatedCount = 0;

      for (const row of rows) {
        const getCol = (keywords: string[]): unknown => {
          for (const key of Object.keys(row)) {
            const lowerKey = key.toLowerCase();
            if (keywords.some((kw) => lowerKey.includes(kw))) {
              return row[key];
            }
          }
          return "";
        };

        const rawName = String(
          getCol(["nama lengkap", "nama pegawai", "nama", "name"]) || ""
        ).trim();
        const rawEmail = String(
          getCol(["surel", "email"]) || ""
        )
          .trim()
          .toLowerCase();

        if (!rawName || !rawEmail || !rawEmail.includes("@")) {
          continue;
        }

        const rawNip = String(getCol(["nip"]) || "").trim() || null;
        const rawRole = normalizeRole(getCol(["peran", "role"]));
        const rawOpdShort = String(
          getCol(["singkatan opd", "kode opd", "instansi", "opd"]) || ""
        ).trim();
        const rawOpdFull = String(
          getCol(["nama lengkap opd", "nama opd"]) || ""
        ).trim();
        const rawJabatan =
          String(getCol(["jabatan", "posisi"]) || "").trim() || null;
        const rawPhone =
          String(getCol(["telepon", "wa", "hp", "phone"]) || "").trim() || null;
        const rawPassword =
          String(getCol(["sandi", "password"]) || "").trim() || "sigap2026";

        let matchedOpdId: string | null = null;
        if (rawRole === "OPERATOR_OPD") {
          const searchStr = (rawOpdShort || rawOpdFull).toLowerCase();
          if (searchStr) {
            const found = opdList.find(
              (o) =>
                o.code.toLowerCase() === searchStr ||
                o.shortName.toLowerCase() === searchStr ||
                o.shortName.toLowerCase().includes(searchStr) ||
                searchStr.includes(o.shortName.toLowerCase()) ||
                o.name.toLowerCase().includes(searchStr)
            );
            if (found) {
              matchedOpdId = found.id;
            } else {
              // Otomatis buat OPD baru jika belum ada di database
              const newCode = `OPD-6405-${String(opdList.length + 1).padStart(
                2,
                "0"
              )}`;
              const createdOpd = await prisma.opd.create({
                data: {
                  code: newCode,
                  name: rawOpdFull || rawOpdShort,
                  shortName: rawOpdShort || rawOpdFull,
                  category: "Perangkat Daerah Kabupaten Berau",
                  activity1Name:
                    "Kegiatan Kompilasi Data Statistik Sektoral Utama",
                  activity2Name: "Survei / Pendataan Sektoral Perangkat Daerah",
                },
              });
              opdList.push(createdOpd);
              matchedOpdId = createdOpd.id;
            }
          } else if (opdList[0]) {
            matchedOpdId = opdList[0].id;
          }
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: rawEmail },
        });

        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: rawName,
              nip: rawNip ?? existingUser.nip,
              role: rawRole,
              jabatan: rawJabatan ?? existingUser.jabatan,
              phone: rawPhone ?? existingUser.phone,
              opdId: rawRole === "OPERATOR_OPD" ? matchedOpdId : null,
            },
          });
          updatedCount += 1;
        } else {
          await prisma.user.create({
            data: {
              name: rawName,
              email: rawEmail,
              nip: rawNip,
              passwordHash: hashPassword(rawPassword),
              role: rawRole,
              jabatan: rawJabatan,
              phone: rawPhone,
              opdId: rawRole === "OPERATOR_OPD" ? matchedOpdId : null,
              isActive: true,
            },
          });
          importedCount += 1;
        }
      }

      if (importedCount === 0 && updatedCount === 0) {
        return NextResponse.json(
          {
            error:
              "Tidak ditemukan baris akun pengguna yang valid. Pastikan kolom Nama dan Email terisi.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        importedCount,
        updatedCount,
        message: `Berhasil memproses berkas Excel: ${importedCount} akun baru ditambahkan dan ${updatedCount} akun diperbarui.`,
      });
    }

    // 2. Jika Tambah Pengguna Satuan via Form JSON
    const body = await request.json();
    const {
      name,
      email,
      nip,
      password,
      role,
      jabatan,
      phone,
      opdId,
      newOpdName,
      newOpdShortName,
    } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          error:
            "Nama lengkap, alamat surel, kata sandi, dan peran wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!["SUPERADMIN", "PEMBINA_SEKTORAL", "OPERATOR_OPD"].includes(role)) {
      return NextResponse.json(
        { error: "Peran pengguna tidak valid." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Alamat surel tersebut sudah terdaftar di sistem SIGAP BERAU.",
        },
        { status: 409 }
      );
    }

    let resolvedOpdId: string | null = opdId || null;

    if (role === "OPERATOR_OPD" && !resolvedOpdId && newOpdName) {
      const count = await prisma.opd.count();
      const createdOpd = await prisma.opd.create({
        data: {
          code: `OPD-6405-${String(count + 1).padStart(2, "0")}`,
          name: String(newOpdName).trim(),
          shortName: String(newOpdShortName || newOpdName).trim(),
          category: "Perangkat Daerah Kabupaten Berau",
          activity1Name: "Kegiatan Kompilasi Data Statistik Sektoral Utama",
          activity2Name: "Survei / Pendataan Sektoral Perangkat Daerah",
        },
      });
      resolvedOpdId = createdOpd.id;
    }

    if (role === "OPERATOR_OPD" && !resolvedOpdId) {
      return NextResponse.json(
        {
          error:
            "Operator OPD wajib dikaitkan dengan Organisasi Perangkat Daerah (OPD).",
        },
        { status: 400 }
      );
    }

    const createdUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        nip: nip ? String(nip).trim() : null,
        passwordHash: hashPassword(String(password)),
        role,
        jabatan: jabatan ? String(jabatan).trim() : null,
        phone: phone ? String(phone).trim() : null,
        opdId: role === "OPERATOR_OPD" ? resolvedOpdId : null,
        isActive: true,
      },
      include: { opd: true },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        opdName: createdUser.opd?.name ?? null,
      },
    });
  } catch (error) {
    console.error("Create/Import user error:", error);
    return NextResponse.json(
      { error: "Gagal membuat atau mengimpor akun pengguna." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getActiveSession();
    if (!session || session.realUser.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      isActive,
      resetPassword,
      name,
      email,
      nip,
      role,
      jabatan,
      phone,
      opdId,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "ID pengguna wajib disertakan." },
        { status: 400 }
      );
    }

    const updateData: {
      isActive?: boolean;
      passwordHash?: string;
      name?: string;
      email?: string;
      nip?: string | null;
      role?: string;
      jabatan?: string | null;
      phone?: string | null;
      opdId?: string | null;
    } = {};

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }
    if (resetPassword && String(resetPassword).trim().length > 0) {
      updateData.passwordHash = hashPassword(String(resetPassword).trim());
    }
    if (name !== undefined) {
      updateData.name = String(name).trim();
    }
    if (email !== undefined) {
      updateData.email = String(email).trim().toLowerCase();
    }
    if (nip !== undefined) {
      updateData.nip = nip ? String(nip).trim() : null;
    }
    if (role !== undefined) {
      updateData.role = String(role);
    }
    if (jabatan !== undefined) {
      updateData.jabatan = jabatan ? String(jabatan).trim() : null;
    }
    if (phone !== undefined) {
      updateData.phone = phone ? String(phone).trim() : null;
    }
    if (opdId !== undefined) {
      updateData.opdId = opdId ? String(opdId) : null;
    }

    await prisma.user.update({
      where: { id: String(userId) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: resetPassword
        ? "Kata sandi pengguna berhasil direset."
        : "Data pengguna berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data pengguna." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getActiveSession();
    if (!session || session.realUser.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Superadmin yang dapat menghapus akun." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "ID pengguna tidak ditemukan." },
        { status: 400 }
      );
    }

    if (userId === session.realUser.id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Superadmin utama Anda sendiri." },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Akun pengguna berhasil dihapus secara permanen.",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus akun pengguna." },
      { status: 500 }
    );
  }
}
