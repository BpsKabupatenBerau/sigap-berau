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

    const { effectiveUser } = session;
    if (
      effectiveUser.role !== "PEMBINA_SEKTORAL" &&
      effectiveUser.role !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Hanya Pembina Sektoral (BPS) atau Superadmin yang berwenang memberikan nilai kematangan dan catatan reviu.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      opdId,
      indicatorId,
      periodYear = 2026,
      maturityScore,
      status = "TERVERIFIKASI",
      reviewerNotes,
    } = body;

    if (!opdId || !indicatorId) {
      return NextResponse.json(
        { error: "OPD dan Indikator EPSS wajib ditentukan." },
        { status: 400 }
      );
    }

    const numericScore = Number(maturityScore);
    if (!numericScore || numericScore < 1 || numericScore > 5) {
      return NextResponse.json(
        { error: "Skor Tingkat Kematangan wajib bernilai antara 1 hingga 5." },
        { status: 400 }
      );
    }

    const submission = await prisma.epssSubmission.upsert({
      where: {
        opdId_indicatorId_periodYear: {
          opdId: String(opdId),
          indicatorId: String(indicatorId),
          periodYear: Number(periodYear),
        },
      },
      update: {
        maturityScore: numericScore,
        status: String(status),
        reviewerNotes: reviewerNotes ? String(reviewerNotes).trim() : null,
        reviewedById: effectiveUser.id,
        reviewedAt: new Date(),
      },
      create: {
        opdId: String(opdId),
        indicatorId: String(indicatorId),
        periodYear: Number(periodYear),
        selfScore: numericScore,
        maturityScore: numericScore,
        status: String(status),
        reviewerNotes: reviewerNotes ? String(reviewerNotes).trim() : null,
        reviewedById: effectiveUser.id,
        reviewedAt: new Date(),
      },
    });

    if (reviewerNotes && String(reviewerNotes).trim().length > 0) {
      await prisma.epssReviewComment.create({
        data: {
          submissionId: submission.id,
          authorId: effectiveUser.id,
          scoreGiven: numericScore,
          statusAction: String(status),
          comment: String(reviewerNotes).trim(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Nilai Tingkat Kematangan Level ${numericScore} dan catatan pemeriksaan berhasil disimpan.`,
      submission,
    });
  } catch (error) {
    console.error("Review EPSS error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan penilaian kematangan EPSS." },
      { status: 500 }
    );
  }
}

