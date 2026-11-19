import { NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface IncomingQuestion {
  domainCode?: string;
  indicatorRef?: string;
  questionText: string;
  helpText?: string;
  questionType: "SCALE_0_3" | "NUMBER" | "SCALE_1_5" | "YES_NO" | "TEXT";
  weight?: number;
}

interface IncomingAnswer {
  questionId: string;
  scaleValue?: number | null;
  yesNoValue?: string | null;
  textAnswer?: string | null;
}

export async function POST(request: Request) {
  try {
    const session = await getActiveSession();
    const effectiveUser = session?.effectiveUser || null;
    const body = await request.json();
    const action = body.action as string;

    // 1. CREATE_ASSESSMENT (Pembina Sektoral BPS & Superadmin)
    if (action === "CREATE_ASSESSMENT") {
      if (
        !effectiveUser ||
        (effectiveUser.role !== "PEMBINA_SEKTORAL" &&
          effectiveUser.role !== "SUPERADMIN")
      ) {
        return NextResponse.json(
          {
            error:
              "Hanya Pembina Sektoral BPS atau Superadmin yang dapat membuat paket asesmen.",
          },
          { status: 403 }
        );
      }

      const title = (body.title as string | undefined)?.trim();
      const description = (body.description as string | undefined)?.trim() || "";
      const category =
        (body.category as string | undefined) || "Diagnostik Pra-EPSS";
      const periodYear = Number(body.periodYear || 2026);
      const dueDateStr = (body.dueDate as string | undefined) || "2026-12-15";
      const isPublic =
        typeof body.isPublic === "boolean" ? body.isPublic : true;
      const targetOpdId =
        body.targetOpdId && body.targetOpdId !== "ALL"
          ? (body.targetOpdId as string)
          : null;
      const questions = (body.questions as IncomingQuestion[]) || [];

      if (!title || questions.length === 0) {
        return NextResponse.json(
          {
            error:
              "Judul asesmen dan minimal 1 butir pertanyaan wajib diisi.",
          },
          { status: 400 }
        );
      }

      const created = await prisma.assessment.create({
        data: {
          title,
          description:
            description ||
            "Instrumen asesmen kesiapan statistik sektoral Perangkat Daerah Kabupaten Berau.",
          category,
          periodYear,
          status: "AKTIF",
          ...(isPublic !== undefined ? ({ isPublic } as Record<string, unknown>) : {}),
          dueDate: new Date(`${dueDateStr}T23:59:59.000Z`),
          targetOpdId,
          createdById: effectiveUser.id,
          questions: {
            create: questions.map((q, idx) => ({
              order: idx + 1,
              domainCode: q.domainCode || "I. Kelembagaan dan Tata Kelola",
              indicatorRef: q.indicatorRef || null,
              questionText: q.questionText.trim(),
              helpText: q.helpText?.trim() || null,
              questionType: q.questionType || "SCALE_0_3",
              weight:
                q.questionType === "NUMBER"
                  ? 0
                  : Number(q.weight !== undefined ? q.weight : 1),
            })),
          },
        } as Parameters<typeof prisma.assessment.create>[0]["data"],
      });

      return NextResponse.json({
        ok: true,
        message: `Paket asesmen "${created.title}" berhasil diterbitkan.`,
        assessmentId: created.id,
      });
    }

    // 2. TOGGLE_STATUS (Pembina Sektoral BPS & Superadmin)
    if (action === "TOGGLE_STATUS") {
      if (
        !effectiveUser ||
        (effectiveUser.role !== "PEMBINA_SEKTORAL" &&
          effectiveUser.role !== "SUPERADMIN")
      ) {
        return NextResponse.json(
          { error: "Tidak memiliki izin mengubah status asesmen." },
          { status: 403 }
        );
      }

      const assessmentId = body.assessmentId as string;
      const newStatus = body.status as string; // "AKTIF" | "DITUTUP"

      await prisma.assessment.update({
        where: { id: assessmentId },
        data: { status: newStatus },
      });

      return NextResponse.json({
        ok: true,
        message: `Status asesmen diperbarui menjadi ${newStatus}.`,
      });
    }

    // 2b. TOGGLE_PUBLIC (Pembina Sektoral BPS & Superadmin mengubah akses Umum vs Wajib Login)
    if (action === "TOGGLE_PUBLIC") {
      if (
        !effectiveUser ||
        (effectiveUser.role !== "PEMBINA_SEKTORAL" &&
          effectiveUser.role !== "SUPERADMIN")
      ) {
        return NextResponse.json(
          { error: "Tidak memiliki izin mengubah mode akses asesmen." },
          { status: 403 }
        );
      }

      const assessmentId = body.assessmentId as string;
      const isPublic = Boolean(body.isPublic);

      await prisma.assessment.update({
        where: { id: assessmentId },
        data: { isPublic } as unknown as Parameters<
          typeof prisma.assessment.update
        >[0]["data"],
      });

      return NextResponse.json({
        ok: true,
        message: isPublic
          ? "Asesmen kini dibuka untuk Umum (dapat diisi tanpa login)."
          : "Asesmen kini diatur khusus Internal (wajib login aplikasi).",
      });
    }

    // 3. SUBMIT_RESPONSE (Operator OPD yang login, Superadmin, ATAU Responden Umum tanpa login jika isPublic=true)
    if (action === "SUBMIT_RESPONSE") {
      const assessmentId = body.assessmentId as string;
      const requestedOpdId = body.opdId as string | undefined;
      const submitMode = body.submitMode === "DRAF" ? "DRAF" : "DIKIRIM";
      const summaryNotes =
        (body.summaryNotes as string | undefined)?.trim() || null;
      const respondentName =
        (body.respondentName as string | undefined)?.trim() || null;
      const respondentNip =
        (body.respondentNip as string | undefined)?.trim() || null;
      const answers = (body.answers as IncomingAnswer[]) || [];

      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: { questions: true },
      });

      if (!assessment) {
        return NextResponse.json(
          { error: "Paket asesmen tidak ditemukan." },
          { status: 404 }
        );
      }

      if (assessment.status === "DITUTUP") {
        return NextResponse.json(
          { error: "Periode pengisian asesmen ini telah ditutup oleh Pembina." },
          { status: 400 }
        );
      }

      // Jika pengguna tidak login, pastikan asesmen memang berstatus Umum (isPublic)
      const isPublicAssessment =
        (assessment as unknown as { isPublic?: boolean }).isPublic ?? true;
      if (!effectiveUser && !isPublicAssessment) {
        return NextResponse.json(
          {
            error:
              "Asesmen ini khusus internal. Silakan masuk (login) terlebih dahulu.",
          },
          { status: 401 }
        );
      }

      // Tentukan OPD: Jika Operator OPD login -> kunci ke OPD miliknya; jika Umum / Superadmin -> gunakan requestedOpdId
      const resolvedOpdId =
        effectiveUser?.role === "OPERATOR_OPD"
          ? effectiveUser.opdId
          : requestedOpdId || effectiveUser?.opdId || null;

      if (!assessmentId || !resolvedOpdId) {
        return NextResponse.json(
          { error: "Silakan pilih Instansi Perangkat Daerah (OPD) Anda." },
          { status: 400 }
        );
      }

      if (
        effectiveUser?.role === "OPERATOR_OPD" &&
        effectiveUser.opdId !== resolvedOpdId
      ) {
        return NextResponse.json(
          {
            error:
              "Anda hanya dapat mengisi asesmen untuk instansi OPD Anda sendiri.",
          },
          { status: 403 }
        );
      }

      // Compute readiness score & percentage according to Instrumen Assessment Section F:
      // Nilai Kesiapan = (Total Skor Diperoleh ÷ Total Skor Maksimal) × 100
      // Pertanyaan jumlah (NUMBER) tidak langsung dikonversi menjadi skor.
      const questionMap = new Map(
        assessment.questions.map((q) => [q.id, q])
      );
      let obtainedWeightedScore = 0;
      let maxPossibleWeightedScore = 0;
      let uses0To3Scale = false;

      for (const ans of answers) {
        const q = questionMap.get(ans.questionId);
        if (!q || q.questionType === "NUMBER" || q.questionType === "TEXT") {
          continue;
        }
        const w = q.weight > 0 ? q.weight : 1;

        if (q.questionType === "SCALE_0_3") {
          uses0To3Scale = true;
          const val =
            ans.scaleValue !== undefined && ans.scaleValue !== null
              ? Math.min(3, Math.max(0, Number(ans.scaleValue)))
              : 0;
          obtainedWeightedScore += val * w;
          maxPossibleWeightedScore += 3 * w;
        } else if (q.questionType === "SCALE_1_5" && ans.scaleValue) {
          const val = Math.min(5, Math.max(1, Number(ans.scaleValue)));
          obtainedWeightedScore += val * w;
          maxPossibleWeightedScore += 5 * w;
        } else if (q.questionType === "YES_NO" && ans.yesNoValue) {
          const val = ans.yesNoValue === "YA" ? 3 : 0;
          obtainedWeightedScore += val * w;
          maxPossibleWeightedScore += 3 * w;
        }
      }

      const readinessPct =
        maxPossibleWeightedScore > 0
          ? Math.round((obtainedWeightedScore / maxPossibleWeightedScore) * 100)
          : 0;
      const readinessScore =
        maxPossibleWeightedScore > 0
          ? Number(
              (
                (obtainedWeightedScore / maxPossibleWeightedScore) *
                (uses0To3Scale ? 3 : 5)
              ).toFixed(2)
            )
          : 0;

      const extraNotesWithRespondent =
        !effectiveUser && respondentName
          ? `[Pengisi Umum: ${respondentName}${
              respondentNip ? ` — ${respondentNip}` : ""
            }] ${summaryNotes || ""}`.trim()
          : summaryNotes;

      const responseRecord = await prisma.assessmentResponse.upsert({
        where: {
          assessmentId_opdId: {
            assessmentId,
            opdId: resolvedOpdId,
          },
        },
        update: {
          submittedById: effectiveUser?.id || null,
          status: submitMode,
          readinessScore,
          readinessPct,
          summaryNotes: extraNotesWithRespondent,
          submittedAt: submitMode === "DIKIRIM" ? new Date() : undefined,
        },
        create: {
          assessmentId,
          opdId: resolvedOpdId,
          submittedById: effectiveUser?.id || null,
          status: submitMode,
          readinessScore,
          readinessPct,
          summaryNotes: extraNotesWithRespondent,
          submittedAt: submitMode === "DIKIRIM" ? new Date() : null,
        },
      });

      // Upsert each answer
      for (const ans of answers) {
        if (!questionMap.has(ans.questionId)) continue;
        await prisma.assessmentAnswer.upsert({
          where: {
            responseId_questionId: {
              responseId: responseRecord.id,
              questionId: ans.questionId,
            },
          },
          update: {
            scaleValue:
              ans.scaleValue !== undefined && ans.scaleValue !== null
                ? Number(ans.scaleValue)
                : null,
            yesNoValue: ans.yesNoValue || null,
            textAnswer: ans.textAnswer?.trim() || null,
          },
          create: {
            responseId: responseRecord.id,
            questionId: ans.questionId,
            scaleValue:
              ans.scaleValue !== undefined && ans.scaleValue !== null
                ? Number(ans.scaleValue)
                : null,
            yesNoValue: ans.yesNoValue || null,
            textAnswer: ans.textAnswer?.trim() || null,
          },
        });
      }

      return NextResponse.json({
        ok: true,
        readinessScore,
        readinessPct,
        message:
          submitMode === "DIKIRIM"
            ? "Jawaban asesmen berhasil dikirim ke Pembina Sektoral BPS Kabupaten Berau."
            : "Draf jawaban asesmen berhasil disimpan.",
      });
    }

    // 4. REVIEW_RESPONSE (Pembina Sektoral BPS & Superadmin memberikan umpan balik)
    if (action === "REVIEW_RESPONSE") {
      if (
        !effectiveUser ||
        (effectiveUser.role !== "PEMBINA_SEKTORAL" &&
          effectiveUser.role !== "SUPERADMIN")
      ) {
        return NextResponse.json(
          {
            error:
              "Hanya Pembina Sektoral BPS atau Superadmin yang dapat mereviu hasil asesmen.",
          },
          { status: 403 }
        );
      }

      const responseId = body.responseId as string;
      const pembinaFeedback =
        (body.pembinaFeedback as string | undefined)?.trim() || "";

      if (!responseId || !pembinaFeedback) {
        return NextResponse.json(
          { error: "Catatan rekomendasi Pembina wajib diisi." },
          { status: 400 }
        );
      }

      await prisma.assessmentResponse.update({
        where: { id: responseId },
        data: {
          status: "DIREVIU",
          pembinaFeedback,
          reviewedById: effectiveUser.id,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({
        ok: true,
        message:
          "Rekomendasi Pembina Sektoral berhasil disimpan dan diteruskan ke Operator OPD.",
      });
    }

    return NextResponse.json(
      { error: "Tindakan tidak dikenali." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Asesmen API Error:", err);
    return NextResponse.json(
      {
        error:
          "Terjadi kesalahan pada peladen saat memproses asesmen. Pastikan tabel basis data telah diperbarui (npx prisma db push).",
      },
      { status: 500 }
    );
  }
}
