import { NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface IncomingQuestion {
  domainCode?: string;
  indicatorRef?: string;
  questionText: string;
  helpText?: string;
  questionType: "SCALE_1_5" | "YES_NO" | "TEXT";
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
    if (!session) {
      return NextResponse.json(
        { error: "Sesi berakhir. Silakan masuk kembali." },
        { status: 401 }
      );
    }

    const { effectiveUser } = session;
    const body = await request.json();
    const action = body.action as string;

    // 1. CREATE_ASSESSMENT (Pembina Sektoral BPS & Superadmin)
    if (action === "CREATE_ASSESSMENT") {
      if (
        effectiveUser.role !== "PEMBINA_SEKTORAL" &&
        effectiveUser.role !== "SUPERADMIN"
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
          dueDate: new Date(`${dueDateStr}T23:59:59.000Z`),
          targetOpdId,
          createdById: effectiveUser.id,
          questions: {
            create: questions.map((q, idx) => ({
              order: idx + 1,
              domainCode: q.domainCode || "Domain 1",
              indicatorRef: q.indicatorRef || null,
              questionText: q.questionText.trim(),
              helpText: q.helpText?.trim() || null,
              questionType: q.questionType || "SCALE_1_5",
              weight: Number(q.weight || 1),
            })),
          },
        },
      });

      return NextResponse.json({
        ok: true,
        message: `Paket asesmen "${created.title}" berhasil diterbitkan untuk OPD.`,
        assessmentId: created.id,
      });
    }

    // 2. TOGGLE_STATUS (Pembina Sektoral BPS & Superadmin)
    if (action === "TOGGLE_STATUS") {
      if (
        effectiveUser.role !== "PEMBINA_SEKTORAL" &&
        effectiveUser.role !== "SUPERADMIN"
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

    // 3. SUBMIT_RESPONSE (Operator OPD mengisi draf/final, atau Superadmin)
    if (action === "SUBMIT_RESPONSE") {
      const assessmentId = body.assessmentId as string;
      const requestedOpdId = body.opdId as string | undefined;
      const submitMode =
        body.submitMode === "DRAF" ? "DRAF" : "DIKIRIM";
      const summaryNotes =
        (body.summaryNotes as string | undefined)?.trim() || null;
      const answers = (body.answers as IncomingAnswer[]) || [];

      // Kunci ketat: Operator OPD hanya boleh mengisi untuk OPD miliknya sendiri
      const resolvedOpdId =
        effectiveUser.role === "OPERATOR_OPD"
          ? effectiveUser.opdId
          : requestedOpdId || effectiveUser.opdId;

      if (!assessmentId || !resolvedOpdId) {
        return NextResponse.json(
          { error: "Data asesmen dan instansi OPD tidak valid." },
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
              "Anda hanya dapat mengisi asesmen untuk instansi OPD Anda sendiri.",
          },
          { status: 403 }
        );
      }

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

      // Compute weighted readiness score (1.00 - 5.00) & percentage (0 - 100%)
      const questionMap = new Map(
        assessment.questions.map((q) => [q.id, q])
      );
      let weightedSum = 0;
      let totalWeight = 0;

      for (const ans of answers) {
        const q = questionMap.get(ans.questionId);
        if (!q) continue;

        if (q.questionType === "SCALE_1_5" && ans.scaleValue) {
          const val = Math.min(5, Math.max(1, Number(ans.scaleValue)));
          weightedSum += val * q.weight;
          totalWeight += q.weight;
        } else if (q.questionType === "YES_NO" && ans.yesNoValue) {
          const equiv = ans.yesNoValue === "YA" ? 4.5 : 1.5;
          weightedSum += equiv * q.weight;
          totalWeight += q.weight;
        }
      }

      const readinessScore =
        totalWeight > 0
          ? Number((weightedSum / totalWeight).toFixed(2))
          : 3.0;
      const readinessPct = Math.round((readinessScore / 5) * 100);

      const responseRecord = await prisma.assessmentResponse.upsert({
        where: {
          assessmentId_opdId: {
            assessmentId,
            opdId: resolvedOpdId,
          },
        },
        update: {
          submittedById: effectiveUser.id,
          status: submitMode,
          readinessScore,
          readinessPct,
          summaryNotes,
          submittedAt: submitMode === "DIKIRIM" ? new Date() : undefined,
        },
        create: {
          assessmentId,
          opdId: resolvedOpdId,
          submittedById: effectiveUser.id,
          status: submitMode,
          readinessScore,
          readinessPct,
          summaryNotes,
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
        message:
          submitMode === "DIKIRIM"
            ? "Jawaban asesmen berhasil dikirim ke Pembina Sektoral BPS."
            : "Draf jawaban asesmen berhasil disimpan.",
      });
    }

    // 4. REVIEW_RESPONSE (Pembina Sektoral BPS & Superadmin memberikan umpan balik)
    if (action === "REVIEW_RESPONSE") {
      if (
        effectiveUser.role !== "PEMBINA_SEKTORAL" &&
        effectiveUser.role !== "SUPERADMIN"
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

