import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { getActiveSession } from "@/lib/auth";
import { loadEpssWorkspaceData } from "@/lib/epss-loader";
import { EpssWorkspaceClient } from "@/components/epss-workspace-client";

export default async function EpssUploadPage({
  searchParams,
}: {
  searchParams: Promise<{ opdId?: string; year?: string }>;
}) {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login");
  }

  const { effectiveUser } = session;

  // Strict RBAC guard: Only OPERATOR_OPD or SUPERADMIN can access /dashboard/epss/upload
  if (
    effectiveUser.role !== "OPERATOR_OPD" &&
    effectiveUser.role !== "SUPERADMIN"
  ) {
    return (
      <div className="mx-auto max-w-xl rounded-[12px] border border-amber-200 bg-white p-8 text-center shadow-sm dark:border-amber-900 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-[20px] font-bold text-[#142b45] dark:text-white">
          Akses Unggah Bukti Khusus Operator OPD
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
          Halaman <strong>/dashboard/epss/upload</strong> dikhususkan bagi{" "}
          <strong>Operator OPD</strong> untuk mengunggah dan memperbarui bukti
          dukung instansi. Sebagai Pembina Sektoral BPS, silakan gunakan halaman
          Pemeriksaan & Penilaian EPSS.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dashboard/epss/penilaian"
            className="inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-[#087f80] px-4 text-[13px] font-semibold text-white hover:bg-[#066667]"
          >
            <span>Buka Halaman Penilaian Pembina</span>
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

  // Operator OPD is locked to their own OPD
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
      mode="upload"
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

