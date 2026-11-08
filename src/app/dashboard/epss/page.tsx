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

  const data = await loadEpssWorkspaceData({
    requestedOpdId: params.opdId,
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

