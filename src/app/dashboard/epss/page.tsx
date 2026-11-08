import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";
import { loadEpssWorkspaceData } from "@/lib/epss-loader";
import { EpssWorkspaceClient } from "@/components/epss-workspace-client";

export default async function EpssMainPage({
  searchParams,
}: {
  searchParams: Promise<{ opdId?: string; year?: string }>;
}) {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const selectedYear = Number(params.year || 2026);
  const { effectiveUser } = session;

  // Operator OPD hanya dapat mengakses instansi OPD miliknya sendiri
  const resolvedOpdId =
    effectiveUser.role === "OPERATOR_OPD"
      ? effectiveUser.opdId || undefined
      : params.opdId;

  const data = await loadEpssWorkspaceData({
    requestedOpdId: resolvedOpdId,
    defaultOpdId: effectiveUser.opdId,
    periodYear: selectedYear,
  });

  return (
    <EpssWorkspaceClient
      mode="main"
      effectiveRole={effectiveUser.role}
      userOpdId={effectiveUser.opdId}
      selectedYear={selectedYear}
      periods={data.periods}
      selectedOpd={data.selectedOpd}
      allOpdSummaries={data.allOpdSummaries}
      domains={data.domains}
    />
  );
}

