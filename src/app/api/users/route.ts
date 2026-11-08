import { NextResponse } from "next/server";
import { getActiveSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getActiveSession();
    if (!session || session.realUser.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Superadmin yang dapat mengelola akun pengguna." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, nip, password, role, jabatan, phone, opdId, newOpdName, newOpdShortName } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Nama lengkap, alamat surel, kata sandi, dan peran wajib diisi." },
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
        { error: "Alamat surel tersebut sudah terdaftar di sistem SIGAP BERAU." },
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
        { error: "Operator OPD wajib dikaitkan dengan Organisasi Perangkat Daerah (OPD)." },
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
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Gagal membuat akun pengguna baru." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getActiveSession();
    if (!session || session.realUser.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, isActive, resetPassword } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "ID pengguna wajib disertakan." },
        { status: 400 }
      );
    }

    const updateData: { isActive?: boolean; passwordHash?: string } = {};
    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }
    if (resetPassword) {
      updateData.passwordHash = hashPassword(String(resetPassword));
    }

    await prisma.user.update({
      where: { id: String(userId) },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data pengguna." },
      { status: 500 }
    );
  }
}

