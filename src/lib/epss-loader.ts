import { prisma } from "@/lib/prisma";
import {
  OpdProgressSummary,
  SerializedDomain,
} from "@/components/epss-workspace-client";

export async function loadEpssWorkspaceData({
  requestedOpdId,
  defaultOpdId,
  periodYear,
}: {
  requestedOpdId?: string;
  defaultOpdId?: string | null;
  periodYear: number;
}) {
  const [periods, opds, rawDomains, allPeriodSubmissions] = await Promise.all([
    prisma.epssPeriod.findMany({ orderBy: { year: "desc" } }),
    prisma.opd.findMany({ orderBy: { code: "asc" } }),
    prisma.epssDomain.findMany({
      orderBy: { code: "asc" },
      include: {
        aspects: {
          orderBy: { code: "asc" },
          include: {
            indicators: {
              orderBy: { code: "asc" },
            },
          },
        },
      },
    }),
    prisma.epssSubmission.findMany({
      where: { periodYear },
      include: {
        indicator: true,
        documents: {
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: { author: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  const totalIndicatorsCount = rawDomains.reduce(
    (acc, d) =>
      acc + d.aspects.reduce((aAcc, a) => aAcc + a.indicators.length, 0),
    0
  );

  const allOpdSummaries: OpdProgressSummary[] = opds.map((opd) => {
    const subs = allPeriodSubmissions.filter((s) => s.opdId === opd.id);
    const filledCount = subs.filter((s) => s.status !== "BELUM_DIISI").length;
    const verifiedCount = subs.filter(
      (s) => s.status === "TERVERIFIKASI"
    ).length;
    const waitingCount = subs.filter(
      (s) => s.status === "MENUNGGU_PERIKSA"
    ).length;
    const revisionCount = subs.filter((s) => s.status === "REVISI").length;
    const documentCount = subs.reduce((acc, s) => acc + s.documents.length, 0);
    const completionPct =
      totalIndicatorsCount > 0
        ? Math.round((filledCount / totalIndicatorsCount) * 100)
        : 0;

    let weightedSum = 0;
    let totalWeightUsed = 0;
    for (const s of subs) {
      const score = s.maturityScore ?? s.selfScore;
      if (score) {
        weightedSum += score * s.indicator.totalWeight;
        totalWeightUsed += s.indicator.totalWeight;
      }
    }
    const estimatedIps =
      totalWeightUsed > 0
        ? (weightedSum / totalWeightUsed).toFixed(2).replace(".", ",")
        : "1,00";

    return {
      id: opd.id,
      code: opd.code,
      name: opd.name,
      shortName: opd.shortName,
      category: opd.category,
      activity1Name: opd.activity1Name,
      activity2Name: opd.activity2Name,
      filledCount,
      verifiedCount,
      waitingCount,
      revisionCount,
      documentCount,
      completionPct,
      estimatedIps,
    };
  });

  const selectedOpd =
    allOpdSummaries.find((o) => o.id === requestedOpdId) ||
    allOpdSummaries.find((o) => o.id === defaultOpdId) ||
    allOpdSummaries[0];

  const opdSubmissionsMap = new Map(
    allPeriodSubmissions
      .filter((s) => s.opdId === selectedOpd.id)
      .map((s) => [s.indicatorId, s])
  );

  const serializedDomains: SerializedDomain[] = rawDomains.map((dom) => ({
    id: dom.id,
    code: dom.code,
    name: dom.name,
    weight: dom.weight,
    description: dom.description,
    aspects: dom.aspects.map((asp) => ({
      id: asp.id,
      code: asp.code,
      name: asp.name,
      weight: asp.weight,
      indicators: asp.indicators.map((ind) => {
        const sub = opdSubmissionsMap.get(ind.id);
        return {
          id: ind.id,
          code: ind.code,
          name: ind.name,
          weight: ind.weight,
          totalWeight: ind.totalWeight,
          level1Criteria: ind.level1Criteria,
          level2Criteria: ind.level2Criteria,
          level3Criteria: ind.level3Criteria,
          level4Criteria: ind.level4Criteria,
          level5Criteria: ind.level5Criteria,
          notes: ind.notes,
          submission: sub
            ? {
                id: sub.id,
                selfScore: sub.selfScore,
                maturityScore: sub.maturityScore,
                targetLevel: sub.targetLevel,
                narrative: sub.narrative,
                pageReference: sub.pageReference,
                status: sub.status,
                reviewerNotes: sub.reviewerNotes,
                reviewedAt: sub.reviewedAt?.toISOString() ?? null,
                documents: sub.documents.map((d) => ({
                  id: d.id,
                  fileName: d.fileName,
                  originalName: d.originalName,
                  filePath: d.filePath,
                  mimeType: d.mimeType,
                  fileSize: d.fileSize,
                  targetLevel: d.targetLevel,
                  pageNumber: d.pageNumber,
                  description: d.description,
                  createdAt: d.createdAt.toISOString(),
                })),
                comments: sub.comments.map((c) => ({
                  id: c.id,
                  authorName: c.author.name,
                  authorRole: c.author.role,
                  scoreGiven: c.scoreGiven,
                  statusAction: c.statusAction,
                  comment: c.comment,
                  createdAt: c.createdAt.toISOString(),
                })),
              }
            : null,
        };
      }),
    })),
  }));

  return {
    periods: periods.map((p) => ({
      year: p.year,
      label: p.label,
      status: p.status,
    })),
    selectedOpd,
    allOpdSummaries,
    domains: serializedDomains,
  };
}

