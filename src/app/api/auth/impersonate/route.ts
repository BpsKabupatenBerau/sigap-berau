import { NextResponse } from "next/server";
import { getActiveSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getActiveSession();
    if (!session || session.realUser.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Hanya Superadmin yang memiliki hak akses impersonasi peran." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId || targetUserId === "STOP") {
      await setSessionCookie(session.realUser.id, null);
      return NextResponse.json({
        success: true,
        message: "Kembali ke mode Superadmin Utama.",
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: String(targetUserId) },
      include: { opd: true },
    });

    if (!targetUser || !targetUser.isActive) {
      return NextResponse.json(
        { error: "Pengguna target tidak ditemukan atau tidak aktif." },
        { status: 404 }
      );
    }

    await setSessionCookie(session.realUser.id, targetUser.id);

    return NextResponse.json({
      success: true,
      message: `Berhasil berperan sebagai ${targetUser.name} (${targetUser.role}).`,
      effectiveRole: targetUser.role,
    });
  } catch (error) {
    console.error("Impersonate error:", error);
    return NextResponse.json(
      { error: "Gagal mengubah sesi impersonasi pengguna." },
      { status: 500 }
    );
  }
}

