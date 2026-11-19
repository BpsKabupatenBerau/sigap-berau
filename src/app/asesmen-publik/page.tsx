import { prisma } from "@/lib/prisma";
import {
  ASSESSMENT_PRESET_TEMPLATES,
  ensureDefaultAssessmentsSeeded,
} from "@/lib/asesmen-presets";
import { SerializedAssessment } from "@/components/asesmen-client";
import { PublicAsesmenClient } from "@/components/public-asesmen-client";

export default async function PublicAsesmenPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedParams = await searchParams;
  const selectedId = resolvedParams.id;

  const opds = await prisma.opd.findMany({
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      shortName: true,
    },
  });

  await ensureDefaultAssessmentsSeeded();

  let serializedAssessments: SerializedAssessment[] = [];

  try {
    const rawAssessments = await prisma.assessment.findMany({
      where: {
        status: "AKTIF",
      },
      orderBy: { createdAt: "desc" },
      include: {
        targetOpd: true,
        createdBy: true,
        questions: {
          orderBy: { order: "asc" },
        },
        responses: {
          include: {
            opd: true,
            submittedBy: true,
            reviewedBy: true,
            answers: true,
          },
        },
      },
    });

    serializedAssessments = rawAssessments
      .filter((a) => {
        const anyA = a as unknown as { isPublic?: boolean };
        return typeof anyA.isPublic === "boolean" ? anyA.isPublic : true;
      })
      .map((a) => {
        const anyA = a as unknown as { isPublic?: boolean };
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          category: a.category,
          periodYear: a.periodYear,
          status: a.status,
          isPublic:
            typeof anyA.isPublic === "boolean" ? anyA.isPublic : true,
          dueDate: a.dueDate.toISOString(),
          targetOpdId: a.targetOpdId,
          targetOpdName: a.targetOpd?.name || null,
          targetOpdShortName: a.targetOpd?.shortName || null,
          createdByName:
            a.createdBy?.name ||
            "Tim Pembina Statistik Sektoral BPS Kab. Berau",
          createdAt: a.createdAt.toISOString(),
          questions: a.questions.map((q) => ({
            id: q.id,
            order: q.order,
            domainCode: q.domainCode,
            indicatorRef: q.indicatorRef,
            questionText: q.questionText,
            helpText: q.helpText,
            questionType: q.questionType as
              | "SCALE_0_3"
              | "NUMBER"
              | "SCALE_1_5"
              | "YES_NO"
              | "TEXT",
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
        };
      });
  } catch {
    serializedAssessments = ASSESSMENT_PRESET_TEMPLATES.slice(0, 2).map(
      (tpl, idx) => ({
        id: `fallback-${tpl.id}`,
        title: tpl.name,
        description: tpl.description,
        category: tpl.category,
        periodYear: 2026,
        status: "AKTIF",
        isPublic: true,
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
    <PublicAsesmenClient
      opds={opds}
      assessments={serializedAssessments}
      initialSelectedId={selectedId}
    />
  );
}
