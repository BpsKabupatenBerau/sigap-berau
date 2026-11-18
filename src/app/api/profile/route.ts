import { NextResponse } from "next/server";
import { getActiveSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json(
        { error: "Sesi berakhir. Silakan masuk kembali." },
        { status: 401 }
      );
    }

    const targetUserId = session.effectiveUser.id;
    const body = await request.json();
    const {
      name,
      email,
      nip,
      jabatan,
      phone,
      currentPassword,
      newPassword,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: "Nama lengkap wajib diisi." },
        { status: 400 }
      );
    }

    if (!email || !String(email).trim()) {
      return NextResponse.json(
        { error: "Alamat surel wajib diisi." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Akun pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // Check email uniqueness if changed
    if (normalizedEmail !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (emailTaken && emailTaken.id !== targetUserId) {
        return NextResponse.json(
          { error: "Alamat surel tersebut sudah digunakan oleh akun lain." },
          { status: 409 }
        );
      }
    }

    const updateData: {
      name: string;
      email: string;
      nip: string | null;
      jabatan: string | null;
      phone: string | null;
      passwordHash?: string;
    } = {
      name: String(name).trim(),
      email: normalizedEmail,
      nip: nip ? String(nip).trim() : null,
      jabatan: jabatan ? String(jabatan).trim() : null,
      phone: phone ? String(phone).trim() : null,
    };

    // Optional password change
    if (newPassword && String(newPassword).trim().length > 0) {
      if (String(newPassword).trim().length < 6) {
        return NextResponse.json(
          { error: "Kata sandi baru minimal harus 6 karakter." },
          { status: 400 }
        );
      }

      // If not Superadmin impersonating, verify currentPassword when provided or required
      if (!session.isImpersonating && currentPassword) {
        const isCurrentValid = verifyPassword(
          String(currentPassword),
          existingUser.passwordHash
        );
        if (!isCurrentValid) {
          return NextResponse.json(
            { error: "Kata sandi lama yang Anda masukkan tidak sesuai." },
            { status: 400 }
          );
        }
      }

      updateData.passwordHash = hashPassword(String(newPassword).trim());
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Profil Anda berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui profil pengguna." },
      { status: 500 }
    );
  }
}
