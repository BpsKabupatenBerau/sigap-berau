import { NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
            "Hanya Pembina Sektoral BPS atau Superadmin yang dapat menambahkan materi pembinaan.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      category,
      format = "PDF",
      fileSize = "2,1 MB",
      fileUrl = "/uploads/materi/Panduan_Persiapan_EPSS_Kabupaten_Berau_2026.pdf",
      targetAudience = "Semua OPD",
      domainCode = "Semua Domain",
      description,
    } = body;

    if (!title || !category || !description) {
      return NextResponse.json(
        { error: "Judul materi, kategori, dan deskripsi ringkas wajib diisi." },
        { status: 400 }
      );
    }

    const created = await prisma.learningMaterial.create({
      data: {
        title: String(title).trim(),
        category: String(category).trim(),
        format: String(format).toUpperCase(),
        fileSize: String(fileSize),
        fileUrl: String(fileUrl),
        targetAudience: String(targetAudience),
        domainCode: String(domainCode),
        description: String(description).trim(),
        author: session.effectiveUser.name,
        publishedLabel: "Nov 2026",
      },
    });

    return NextResponse.json({
      success: true,
      material: created,
    });
  } catch (error) {
    console.error("Create material error:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan materi ke repositori." },
      { status: 500 }
    );
  }
}

