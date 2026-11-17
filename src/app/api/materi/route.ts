import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getActiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isSupabaseStorageConfigured,
  uploadBufferToSupabase,
  deleteFromSupabaseByUrl,
} from "@/lib/supabase-storage";

const MAX_MATERIAL_BYTES = 5 * 1024 * 1024; // 5MB

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

    const contentType = request.headers.get("content-type") || "";

    let title = "";
    let category = "Modul Pembinaan";
    let format = "PDF";
    let fileSize = "2,1 MB";
    let fileUrl =
      "/uploads/materi/Panduan_Persiapan_EPSS_Kabupaten_Berau_2026.pdf";
    let targetAudience = "Semua OPD";
    let domainCode = "Semua Domain";
    let description = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      title = String(formData.get("title") || "").trim();
      category = String(formData.get("category") || "Modul Pembinaan").trim();
      format = String(formData.get("format") || "PDF").toUpperCase();
      fileSize = String(formData.get("fileSize") || "2,1 MB").trim();
      targetAudience = String(
        formData.get("targetAudience") || "Semua OPD"
      ).trim();
      domainCode = String(formData.get("domainCode") || "Semua Domain").trim();
      description = String(formData.get("description") || "").trim();

      const file = formData.get("file") as File | null;
      if (file && file.size > 0) {
        if (file.size > MAX_MATERIAL_BYTES) {
          return NextResponse.json(
            {
              error: "Ukuran berkas materi melebihi batas maksimum 5 MB.",
            },
            { status: 400 }
          );
        }

        const ext = path.extname(file.name).toLowerCase();
        if (ext) {
          format = ext.replace(".", "").toUpperCase();
        }
        const mbSize = (file.size / (1024 * 1024))
          .toFixed(1)
          .replace(".", ",");
        fileSize = `${mbSize} MB`;

        const safeName = file.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .replace(/_{2,}/g, "_");
        const uniqueFileName = `${Date.now()}_${safeName}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        if (isSupabaseStorageConfigured()) {
          const { publicUrl } = await uploadBufferToSupabase({
            folder: "materi",
            fileName: uniqueFileName,
            buffer,
            contentType: file.type || "application/octet-stream",
          });
          fileUrl = publicUrl;
        } else {
          try {
            const localDir = path.join(
              process.cwd(),
              "public",
              "uploads",
              "materi"
            );
            fs.mkdirSync(localDir, { recursive: true });
            fs.writeFileSync(path.join(localDir, uniqueFileName), buffer);
            fileUrl = `/uploads/materi/${uniqueFileName}`;
          } catch {
            fileUrl =
              "/uploads/materi/Panduan_Persiapan_EPSS_Kabupaten_Berau_2026.pdf";
          }
        }
      }
    } else {
      const body = await request.json();
      title = String(body.title || "").trim();
      category = String(body.category || "Modul Pembinaan").trim();
      format = String(body.format || "PDF").toUpperCase();
      fileSize = String(body.fileSize || "2,1 MB");
      fileUrl = String(
        body.fileUrl ||
          "/uploads/materi/Panduan_Persiapan_EPSS_Kabupaten_Berau_2026.pdf"
      );
      targetAudience = String(body.targetAudience || "Semua OPD");
      domainCode = String(body.domainCode || "Semua Domain");
      description = String(body.description || "").trim();
    }

    if (!title || !category) {
      return NextResponse.json(
        { error: "Judul materi dan folder tujuan wajib diisi." },
        { status: 400 }
      );
    }

    const created = await prisma.learningMaterial.create({
      data: {
        title,
        category,
        format,
        fileSize,
        fileUrl,
        targetAudience,
        domainCode,
        description:
          description ||
          `Materi dalam folder ${category} diunggah oleh ${session.effectiveUser.name}.`,
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
      { error: "Gagal menambahkan materi ke dalam folder." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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
            "Hanya Pembina Sektoral BPS atau Superadmin yang dapat menghapus materi.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID materi tidak ditemukan." },
        { status: 400 }
      );
    }

    const existing = await prisma.learningMaterial.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Materi tidak ditemukan." },
        { status: 404 }
      );
    }

    if (existing.fileUrl) {
      await deleteFromSupabaseByUrl(existing.fileUrl);
    }

    await prisma.learningMaterial.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Materi berhasil dihapus dari folder.",
    });
  } catch (error) {
    console.error("Delete material error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus materi." },
      { status: 500 }
    );
  }
}
