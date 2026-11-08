import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { getActiveSession } from "@/lib/auth";
import { loadEpssWorkspaceData } from "@/lib/epss-loader";
import { EpssWorkspaceClient } from "@/components/epss-workspace-client";

export default async function EpssPenilaianPage({
  searchParams,
}: {
  searchParams: Promise<{ opdId?: string; year?: string }>;
}) {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login");
  }

  const { effectiveUser } = session;

  // Strict RBAC guard: Only PEMBINA_SEKTORAL or SUPERADMIN can access /dashboard/epss/penilaian
  if (
    effectiveUser.role !== "PEMBINA_SEKTORAL" &&
    effectiveUser.role !== "SUPERADMIN"
  ) {
    return (
      <div className="mx-auto max-w-xl rounded-[12px] border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-900 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-[20px] font-bold text-[#142b45] dark:text-white">
          Akses Dibatasi — Khusus Pembina Sektoral BPS
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
          Halaman <strong>/dashboard/epss/penilaian</strong> hanya dapat diakses
          oleh <strong>Pembina Sektoral (BPS Kabupaten Berau)</strong> atau{" "}
          <strong>Superadmin</strong>. Sebagai Operator OPD, silakan gunakan
          halaman Unggah Bukti Dukung.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dashboard/epss/upload"
            className="inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-[#10345b] px-4 text-[13px] font-semibold text-white hover:bg-[#142b45]"
          >
            <span>Ke Halaman Unggah Bukti OPD</span>
          </Link>
          <Link
            href="/dashboard/epss"
            className="inline-flex h-[42px] items-center gap-2 rounded-[8px] border border-[#e1e8f0] px-4 text-[13px] font-semibold text-[#142b45]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Link>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const selectedYear = Number(params.year || 2026);

  const data = await loadEpssWorkspaceData({
    requestedOpdId: params.opdId,
    defaultOpdId: null,
    periodYear: selectedYear,
  });

  return (
    <EpssWorkspaceClient
      mode="penilaian"
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

