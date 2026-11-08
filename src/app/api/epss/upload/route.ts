import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getActiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = [".pdf", ".zip", ".docx"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "multipart/x-zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream", // fallback when browser sends generic mime for .zip/.docx, verified by extension
];

export async function POST(request: Request) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json(
        { error: "Sesi berakhir. Silakan masuk kembali." },
        { status: 401 }
      );
    }

    const { effectiveUser } = session;
    const formData = await request.formData();

    const indicatorId = formData.get("indicatorId") as string | null;
    const opdIdParam = formData.get("opdId") as string | null;
    const periodYear = Number(formData.get("periodYear") || 2026);
    const selfScore = Number(formData.get("selfScore") || 3);
    const targetLevel = Number(formData.get("targetLevel") || selfScore || 3);
    const pageReference = (formData.get("pageReference") as string | null) || "";
    const narrative = (formData.get("narrative") as string | null) || "";
    const replaceDocumentId = formData.get("replaceDocumentId") as string | null;
    const file = formData.get("file") as File | null;

    const resolvedOpdId =
      effectiveUser.role === "OPERATOR_OPD"
        ? effectiveUser.opdId
        : opdIdParam || effectiveUser.opdId;

    if (!resolvedOpdId || !indicatorId) {
      return NextResponse.json(
        { error: "Data OPD dan Indikator EPSS wajib dipilih." },
        { status: 400 }
      );
    }

    if (
      effectiveUser.role === "OPERATOR_OPD" &&
      effectiveUser.opdId !== resolvedOpdId
    ) {
      return NextResponse.json(
        {
          error:
            "Anda hanya diizinkan mengunggah bukti dukung untuk instansi OPD Anda sendiri.",
        },
        { status: 403 }
      );
    }

    let savedDocInfo: {
      fileName: string;
      originalName: string;
      filePath: string;
      mimeType: string;
      fileSize: number;
    } | null = null;

    if (file && file.size > 0) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(
              2
            )} MB) melebihi batas maksimum 10 MB per berkas.`,
          },
          { status: 400 }
        );
      }

      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          {
            error: `Format berkas "${ext}" tidak didukung. Hanya berkas .pdf, .zip, dan .docx yang diizinkan.`,
          },
          { status: 400 }
        );
      }

      if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Tipe MIME berkas (${file.type}) tidak valid. Gunakan berkas resmi berformat .pdf, .zip, atau .docx.`,
          },
          { status: 400 }
        );
      }

      const uploadBaseDir = process.env.UPLOAD_DIR
        ? path.resolve(process.env.UPLOAD_DIR)
        : path.join(process.cwd(), "public", "uploads", "epss");

      fs.mkdirSync(uploadBaseDir, { recursive: true });

      const safeBaseName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_{2,}/g, "_");
      const uniqueFileName = `${periodYear}_${Date.now()}_${safeBaseName}`;
      const diskPath = path.join(uploadBaseDir, uniqueFileName);

      // Also write to public/uploads/epss so static /uploads/epss/... works seamlessly
      const publicUploadDir = path.join(process.cwd(), "public", "uploads", "epss");
      fs.mkdirSync(publicUploadDir, { recursive: true });

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(diskPath, buffer);

      const publicFilePath = path.join(publicUploadDir, uniqueFileName);
      if (publicFilePath !== diskPath) {
        fs.writeFileSync(publicFilePath, buffer);
      }

      const resolvedMime =
        ext === ".pdf"
          ? "application/pdf"
          : ext === ".zip"
          ? "application/zip"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      savedDocInfo = {
        fileName: uniqueFileName,
        originalName: file.name,
        filePath: `/uploads/epss/${uniqueFileName}`,
        mimeType: resolvedMime,
        fileSize: file.size,
      };
    }

    const submission = await prisma.epssSubmission.upsert({
      where: {
        opdId_indicatorId_periodYear: {
          opdId: resolvedOpdId,
          indicatorId,
          periodYear,
        },
      },
      update: {
        selfScore,
        targetLevel,
        pageReference: pageReference.trim() || null,
        narrative: narrative.trim() || null,
        status: "MENUNGGU_PERIKSA",
      },
      create: {
        opdId: resolvedOpdId,
        indicatorId,
        periodYear,
        selfScore,
        targetLevel,
        pageReference: pageReference.trim() || null,
        narrative: narrative.trim() || null,
        status: "MENUNGGU_PERIKSA",
      },
    });

    if (replaceDocumentId && savedDocInfo) {
      await prisma.epssDocument.deleteMany({
        where: {
          id: replaceDocumentId,
          submissionId: submission.id,
        },
      });
    }

    if (savedDocInfo) {
      await prisma.epssDocument.create({
        data: {
          submissionId: submission.id,
          fileName: savedDocInfo.fileName,
          originalName: savedDocInfo.originalName,
          filePath: savedDocInfo.filePath,
          mimeType: savedDocInfo.mimeType,
          fileSize: savedDocInfo.fileSize,
          targetLevel,
          pageNumber: pageReference.trim() || "Hal. 1",
          description:
            narrative.trim().slice(0, 180) ||
            `Bukti dukung indikator diunggah oleh ${effectiveUser.name}`,
          uploadedById: effectiveUser.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: savedDocInfo
        ? `Berkas "${savedDocInfo.originalName}" berhasil diunggah dan diajukan untuk pemeriksaan Pembina.`
        : "Data penjelasan bukti dukung dan penilaian mandiri berhasil diperbarui.",
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("Upload EPSS error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan berkas bukti dukung EPSS." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    if (!documentId) {
      return NextResponse.json(
        { error: "ID dokumen bukti dukung tidak ditemukan." },
        { status: 400 }
      );
    }

    const doc = await prisma.epssDocument.findUnique({
      where: { id: documentId },
      include: { submission: true },
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Dokumen tidak ditemukan." },
        { status: 404 }
      );
    }

    if (
      session.effectiveUser.role === "OPERATOR_OPD" &&
      doc.submission.opdId !== session.effectiveUser.opdId
    ) {
      return NextResponse.json(
        { error: "Anda tidak memiliki izin menghapus dokumen OPD lain." },
        { status: 403 }
      );
    }

    await prisma.epssDocument.delete({ where: { id: documentId } });

    return NextResponse.json({
      success: true,
      message: "Dokumen bukti dukung berhasil dihapus.",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus dokumen bukti dukung." },
      { status: 500 }
    );
  }
}

