import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ASSESSMENT_PRESET_TEMPLATES,
  ensureDefaultAssessmentsSeeded,
} from "@/lib/asesmen-presets";
import {
  AsesmenClient,
  SerializedAssessment,
} from "@/components/asesmen-client";

export default async function AsesmenPage() {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login");
  }

  const { effectiveUser } = session;

  const opds = await prisma.opd.findMany({
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      shortName: true,
    },
  });

  const userOpd =
    (effectiveUser.opdId
      ? opds.find((o) => o.id === effectiveUser.opdId)
      : opds[0]) || null;

  await ensureDefaultAssessmentsSeeded();

  let serializedAssessments: SerializedAssessment[] = [];

  try {
    const rawAssessments = await prisma.assessment.findMany({
      where:
        effectiveUser.role === "OPERATOR_OPD" && effectiveUser.opdId
          ? {
              OR: [
                { targetOpdId: null },
                { targetOpdId: effectiveUser.opdId },
              ],
            }
          : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        targetOpd: true,
        createdBy: true,
        questions: {
          orderBy: { order: "asc" },
        },
        responses: {
          where:
            effectiveUser.role === "OPERATOR_OPD" && effectiveUser.opdId
              ? { opdId: effectiveUser.opdId }
              : undefined,
          include: {
            opd: true,
            submittedBy: true,
            reviewedBy: true,
            answers: true,
          },
        },
      },
    });

    serializedAssessments = rawAssessments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category,
      periodYear: a.periodYear,
      status: a.status,
      dueDate: a.dueDate.toISOString(),
      targetOpdId: a.targetOpdId,
      targetOpdName: a.targetOpd?.name || null,
      targetOpdShortName: a.targetOpd?.shortName || null,
      createdByName:
        a.createdBy?.name || "Tim Pembina Statistik Sektoral BPS Kab. Berau",
      createdAt: a.createdAt.toISOString(),
      questions: a.questions.map((q) => ({
        id: q.id,
        order: q.order,
        domainCode: q.domainCode,
        indicatorRef: q.indicatorRef,
        questionText: q.questionText,
        helpText: q.helpText,
        questionType: q.questionType as "SCALE_1_5" | "YES_NO" | "TEXT",
        weight: q.weight,
      })),
      responses: a.responses.map((r) => ({
        id: r.id,
        assessmentId: r.assessmentId,
        opdId: r.opdId,
        opdName: r.opd.name,
        opdShortName: r.opd.shortName,
        status: r.status,
        readinessScore: r.readinessScore,
        readinessPct: r.readinessPct,
        summaryNotes: r.summaryNotes,
        pembinaFeedback: r.pembinaFeedback,
        submittedByName: r.submittedBy?.name || null,
        reviewedByName: r.reviewedBy?.name || null,
        submittedAt: r.submittedAt?.toISOString() || null,
        reviewedAt: r.reviewedAt?.toISOString() || null,
        answers: r.answers.map((ans) => ({
          id: ans.id,
          questionId: ans.questionId,
          scaleValue: ans.scaleValue,
          yesNoValue: ans.yesNoValue,
          textAnswer: ans.textAnswer,
        })),
      })),
    }));
  } catch {
    // Fallback preview if database schema has not had `npx prisma db push` run yet
    serializedAssessments = ASSESSMENT_PRESET_TEMPLATES.slice(0, 2).map(
      (tpl, idx) => ({
        id: `fallback-${tpl.id}`,
        title: tpl.name,
        description: tpl.description,
        category: tpl.category,
        periodYear: 2026,
        status: "AKTIF",
        dueDate:
          idx === 0
            ? "2026-11-30T23:59:59.000Z"
            : "2026-12-15T23:59:59.000Z",
        targetOpdId: null,
        targetOpdName: null,
        targetOpdShortName: null,
        createdByName: "Tim Pembina Statistik Sektoral BPS Kab. Berau",
        createdAt: new Date("2026-10-01T00:00:00.000Z").toISOString(),
        questions: tpl.questions.map((q) => ({
          id: `${tpl.id}-q-${q.order}`,
          order: q.order,
          domainCode: q.domainCode,
          indicatorRef: q.indicatorRef,
          questionText: q.questionText,
          helpText: q.helpText,
          questionType: q.questionType,
          weight: q.weight,
        })),
        responses: [],
      })
    );
  }

  return (
    <AsesmenClient
      effectiveRole={effectiveUser.role}
      userOpd={userOpd}
      opds={opds}
      assessments={serializedAssessments}
    />
  );
}

