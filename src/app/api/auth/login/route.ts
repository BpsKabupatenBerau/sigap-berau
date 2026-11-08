import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Alamat surel dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      include: { opd: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          error:
            "Akun tidak ditemukan atau sedang dinonaktifkan. Hubungi Administrator BPS Kabupaten Berau.",
        },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(String(password), user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Kata sandi yang Anda masukkan tidak sesuai." },
        { status: 401 }
      );
    }

    await setSessionCookie(user.id, null);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        opdName: user.opd?.name ?? null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada peladen saat memproses masuk akun." },
      { status: 500 }
    );
  }
}

