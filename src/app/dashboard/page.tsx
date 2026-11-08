import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ChartPie,
  ClipboardCheck,
  FileCheck2,
  ArrowRight,
  Award,
  Sparkles,
  Users,
  FileUp,
  CheckSquare,
} from "lucide-react";
import { getActiveSession, getRoleLabel } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDateId } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const selectedYear = Number(resolvedParams.year || 2026);
  const { effectiveUser } = session;

  const [
    periods,
    opds,
    totalIndicators,
    submissions,
    schedules,
    materialsCount,
    usersCount,
  ] = await Promise.all([
    prisma.epssPeriod.findMany({ orderBy: { year: "desc" } }),
    prisma.opd.findMany({ orderBy: { code: "asc" } }),
    prisma.epssIndicator.count(),
    prisma.epssSubmission.findMany({
      where: { periodYear: selectedYear },
      include: {
        indicator: {
          include: {
            aspect: {
              include: { domain: true },
            },
          },
        },
        documents: true,
        opd: true,
      },
    }),
    prisma.coachingSchedule.findMany({
      orderBy: { date: "asc" },
      include: { opd: true },
    }),
    prisma.learningMaterial.count(),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  const activePeriod =
    periods.find((p) => p.year === selectedYear) || periods[0];

  const totalOpds = opds.length;
  const activeSchedulesCount = schedules.filter(
    (s) => s.status === "TERJADWAL" || s.status === "BERLANGSUNG"
  ).length;

  // Compute completion for Operator's own OPD vs All OPDs
  const relevantSubmissions =
    effectiveUser.role === "OPERATOR_OPD" && effectiveUser.opdId
      ? submissions.filter((s) => s.opdId === effectiveUser.opdId)
      : submissions;

  const expectedTotalSubmissions =
    effectiveUser.role === "OPERATOR_OPD" && effectiveUser.opdId
      ? totalIndicators
      : totalOpds * totalIndicators;

  const filledCount = relevantSubmissions.filter(
    (s) => s.status !== "BELUM_DIISI"
  ).length;
  const verifiedCount = relevantSubmissions.filter(
    (s) => s.status === "TERVERIFIKASI"
  ).length;
  const waitingReviewCount = relevantSubmissions.filter(
    (s) => s.status === "MENUNGGU_PERIKSA"
  ).length;

  const completionPercentage =
    expectedTotalSubmissions > 0
      ? Math.round((filledCount / expectedTotalSubmissions) * 100)
      : 0;

  // Calculate per-OPD progress summary (Operator OPD hanya melihat instansinya sendiri)
  const visibleOpds =
    effectiveUser.role === "OPERATOR_OPD" && effectiveUser.opdId
      ? opds.filter((o) => o.id === effectiveUser.opdId)
      : opds;

  const opdProgressList = visibleOpds.map((opd) => {
    const opdSubs = submissions.filter((s) => s.opdId === opd.id);
    const filled = opdSubs.filter((s) => s.status !== "BELUM_DIISI").length;
    const verified = opdSubs.filter((s) => s.status === "TERVERIFIKASI").length;
    const waiting = opdSubs.filter((s) => s.status === "MENUNGGU_PERIKSA").length;
    const revision = opdSubs.filter((s) => s.status === "REVISI").length;
    const docCount = opdSubs.reduce((acc, s) => acc + s.documents.length, 0);
    const pct =
      totalIndicators > 0 ? Math.round((filled / totalIndicators) * 100) : 0;

    // Weighted IPS calculation based on verified/self maturity score
    let weightedSum = 0;
    let totalWeightUsed = 0;
    for (const sub of opdSubs) {
      const score = sub.maturityScore ?? sub.selfScore;
      if (score) {
        weightedSum += score * sub.indicator.totalWeight;
        totalWeightUsed += sub.indicator.totalWeight;
      }
    }
    const estimatedIps =
      totalWeightUsed > 0
        ? (weightedSum / totalWeightUsed).toFixed(2).replace(".", ",")
        : "1,00";

    return {
      ...opd,
      filled,
      verified,
      waiting,
      revision,
      docCount,
      pct,
      estimatedIps,
    };
  });

  const upcomingSchedules = schedules.slice(0, 4);

  return (
    <div className="mx-auto max-w-[1160px] space-y-6">
      {/* Page Title & Period Filter */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#087f80] dark:text-teal-400">
            PORTAL PEMBINAAN STATISTIK SEKTORAL · KABUPATEN BERAU
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-[#142b45] dark:text-white">
            Ringkasan Eksekutif SIGAP BERAU
          </h1>
          <p className="mt-1 text-[14px] text-slate-600 dark:text-slate-400">
            Selamat datang, <strong>{effectiveUser.name}</strong> (
            {getRoleLabel(effectiveUser.role)}). Pantau progres EPSS, agenda
            pembinaan, dan kelengkapan bukti dukung perangkat daerah.
          </p>
        </div>

        {/* Period Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
            Periode Evaluasi:
          </span>
          <div className="inline-flex rounded-[8px] border border-[#e1e8f0] bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {periods.map((p) => (
              <Link
                key={p.year}
                href={`/dashboard?year=${p.year}`}
                className={`rounded-[6px] px-3 py-1.5 text-[12px] font-semibold transition ${
                  p.year === selectedYear
                    ? "bg-[#10345b] text-white dark:bg-[#1557b0]"
                    : "text-slate-600 hover:text-[#10345b] dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Tahun {p.year}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Role-Specific Quick Action Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] bg-[#10345b] p-6 text-white shadow-sm">
        <div className="flex items-center gap-4 max-w-2xl">
          <div className="hidden sm:flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#10345b] ring-2 ring-[#90dfd7]/60 shadow-md">
            <img
              src="/assets/logo-sigap-emblem.jpg"
              alt="Emblem SIGAP BERAU"
              width={68}
              height={68}
              className="h-full w-full scale-110 object-cover"
            />
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-[#90dfd7]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {activePeriod?.label || `Evaluasi EPSS Tahun ${selectedYear}`}
              </span>
            </div>
            <h2 className="text-[20px] font-bold text-white">
              {effectiveUser.role === "OPERATOR_OPD"
                ? `Kelola Bukti Dukung EPSS — ${effectiveUser.opdName}`
                : effectiveUser.role === "PEMBINA_SEKTORAL"
                ? "Panel Pemeriksaan & Penilaian Kematangan EPSS Seluruh OPD"
                : "Panel Kendali Superadmin & Impersonasi Lintas Peran"}
            </h2>
            <p className="text-[13px] text-[#acc5df]">
              {effectiveUser.role === "OPERATOR_OPD"
                ? "Unggah dokumen bukti dukung (.pdf, .zip, .docx maks. 10MB) untuk 38 indikator resmi beserta narasi Simbatik (i)-(ii)-(iii)."
                : "Tinjau progres pengajuan seluruh OPD Kabupaten Berau, buka pratinjau PDF bukti dukung, dan tetapkan skor Tingkat Kematangan (Level 1–5)."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/dashboard/epss?year=${selectedYear}`}
            className="inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-white px-4 text-[13px] font-semibold text-[#142b45] hover:bg-slate-100"
          >
            {effectiveUser.role === "OPERATOR_OPD" ? (
              <>
                <FileUp className="h-4 w-4 text-[#1557b0]" />
                <span>Buka Penilaian & Unggah Bukti EPSS</span>
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4 text-[#087f80]" />
                <span>Buka Penilaian & Reviu EPSS</span>
              </>
            )}
          </Link>
        </div>
      </div>

      {/* Overview Metrics Cards (4 Core KPIs matching Figma Ringkasan) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              Total OPD Binaan
            </span>
            <Building2 className="h-5 w-5 text-[#1557b0]" />
          </div>
          <p className="mt-3 text-[30px] font-bold text-[#142b45] dark:text-white">
            {totalOpds} Instansi
          </p>
          <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
            {usersCount} akun pengguna aktif terdaftar
          </p>
        </div>

        <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              Kelengkapan Bukti ({selectedYear})
            </span>
            <ChartPie className="h-5 w-5 text-[#087f80]" />
          </div>
          <p className="mt-3 text-[30px] font-bold text-[#142b45] dark:text-white">
            {completionPercentage}%
          </p>
          <div className="mt-2">
            <ProgressBar
              percentage={completionPercentage}
              colorClass="bg-[#087f80]"
            />
          </div>
          <p className="mt-1.5 text-[12px] text-slate-500 dark:text-slate-400">
            {filledCount} dari {expectedTotalSubmissions} indikator terisi
          </p>
        </div>

        <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              Status Verifikasi Pembina
            </span>
            <FileCheck2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-[30px] font-bold text-[#142b45] dark:text-white">
            {verifiedCount}
          </p>
          <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
            Terverifikasi ·{" "}
            <strong className="text-amber-600 dark:text-amber-400">
              {waitingReviewCount} menunggu periksa
            </strong>
          </p>
        </div>

        <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              Jadwal Pembinaan Aktif
            </span>
            <CalendarDays className="h-5 w-5 text-[#1557b0]" />
          </div>
          <p className="mt-3 text-[30px] font-bold text-[#142b45] dark:text-white">
            {activeSchedulesCount} Agenda
          </p>
          <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
            {materialsCount} modul materi & juknis tersedia
          </p>
        </div>
      </div>

      {/* Progres Seluruh OPD Kabupaten Berau */}
      <div className="rounded-[12px] border border-[#e1e8f0] bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1e8f0] p-5 dark:border-slate-800">
          <div>
            <h2 className="text-[17px] font-bold text-[#142b45] dark:text-white">
              Progres Penilaian EPSS Perangkat Daerah — Periode {selectedYear}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              Pemantauan kelengkapan 38 indikator resmi, jumlah berkas bukti
              dukung, dan estimasi Indeks Pembangunan Statistik (IPS).
            </p>
          </div>
          <Link
            href={`/dashboard/epss?year=${selectedYear}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1557b0] hover:underline dark:text-blue-400"
          >
            <span>Lihat Rincian Semua Domain</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e1e8f0] bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="px-5 py-3.5">Organisasi Perangkat Daerah (OPD)</th>
                <th className="px-4 py-3.5">2 Lokus Kegiatan Statistik</th>
                <th className="px-4 py-3.5">Kelengkapan (38 Indikator)</th>
                <th className="px-4 py-3.5">Status Verifikasi</th>
                <th className="px-4 py-3.5">Estimasi IPS</th>
                <th className="px-5 py-3.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e8f0] dark:divide-slate-800">
              {opdProgressList.map((opd) => (
                <tr
                  key={opd.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#142b45] dark:text-white">
                      {opd.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                      {opd.code} · {opd.category}
                    </p>
                  </td>
                  <td className="max-w-[280px] px-4 py-4">
                    <p className="truncate text-[12px] text-slate-700 dark:text-slate-300">
                      1. {opd.activity1Name}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-400">
                      2. {opd.activity2Name}
                    </p>
                  </td>
                  <td className="w-[200px] px-4 py-4">
                    <div className="flex items-center justify-between text-[12px] font-semibold">
                      <span>{opd.pct}%</span>
                      <span className="text-slate-500 font-normal">
                        {opd.filled}/38 indikator
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar
                        percentage={opd.pct}
                        colorClass={
                          opd.pct >= 75
                            ? "bg-[#087f80]"
                            : opd.pct >= 40
                            ? "bg-[#1557b0]"
                            : "bg-amber-500"
                        }
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {opd.docCount} berkas bukti terunggah
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="success">
                        {opd.verified} Terverifikasi
                      </Badge>
                      {opd.waiting > 0 && (
                        <Badge variant="warning">
                          {opd.waiting} Menunggu
                        </Badge>
                      )}
                      {opd.revision > 0 && (
                        <Badge variant="destructive">
                          {opd.revision} Revisi
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#ebf3ff] px-2.5 py-1 text-[13px] font-bold text-[#10345b] dark:bg-blue-950/60 dark:text-blue-300">
                      <Award className="h-4 w-4 text-[#087f80]" />
                      <span>{opd.estimatedIps}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {effectiveUser.role === "OPERATOR_OPD" ? (
                      <Link
                        href={`/dashboard/epss?year=${selectedYear}`}
                        className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#10345b] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#142b45]"
                      >
                        <FileUp className="h-3.5 w-3.5" />
                        <span>Penilaian & Unggah Bukti</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/epss?opdId=${opd.id}&year=${selectedYear}`}
                        className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#087f80] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#066667]"
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Periksa & Nilai</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom 2 Columns: Upcoming Coaching Schedules & Quick Modules */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-[16px] font-bold text-[#142b45] dark:text-white">
                Agenda Pembinaan Statistik Sektoral Terdekat
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Pendampingan teknis BPS Kabupaten Berau bersama Perangkat Daerah
              </p>
            </div>
            <Link
              href="/dashboard/pembinaan"
              className="text-[12px] font-semibold text-[#1557b0] hover:underline dark:text-blue-400"
            >
              Semua Jadwal →
            </Link>
          </div>
          <div className="divide-y divide-[#e1e8f0] dark:divide-slate-800">
            {upcomingSchedules.map((sch) => (
              <div
                key={sch.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3.5"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        sch.status === "SELESAI" ? "success" : "secondary"
                      }
                    >
                      {sch.status}
                    </Badge>
                    <span className="text-[12px] font-medium text-slate-500">
                      {formatDateId(sch.date)} · {sch.startTime}–{sch.endTime}
                    </span>
                  </div>
                  <p className="text-[14px] font-semibold text-[#142b45] dark:text-white">
                    {sch.title}
                  </p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">
                    {sch.opd?.shortName || "Seluruh OPD Kabupaten Berau"} ·{" "}
                    {sch.location}
                  </p>
                </div>
                <Link
                  href="/dashboard/pembinaan"
                  className="rounded-lg border border-[#e1e8f0] px-3 py-1.5 text-[12px] font-semibold text-[#142b45] hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Detail
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-[16px] font-bold text-[#142b45] dark:text-white">
              Bobot Resmi 5 Domain EPSS
            </h3>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
              Sesuai Peraturan BPS Nomor 3 Tahun 2022
            </p>
            <div className="mt-4 space-y-3 text-[13px]">
              {[
                { code: "Domain 1", name: "Prinsip Satu Data Indonesia", w: 28 },
                { code: "Domain 2", name: "Kualitas Data", w: 24 },
                { code: "Domain 3", name: "Proses Bisnis Statistik", w: 19 },
                { code: "Domain 4", name: "Kelembagaan", w: 17 },
                { code: "Domain 5", name: "Sistem Statistik Nasional", w: 12 },
              ].map((d) => (
                <div key={d.code} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#142b45] dark:text-slate-200">
                      {d.code}: {d.name}
                    </span>
                    <span className="font-bold text-[#10345b] dark:text-blue-400">
                      {d.w}%
                    </span>
                  </div>
                  <ProgressBar
                    percentage={d.w * 3}
                    colorClass="bg-[#1557b0]"
                  />
                </div>
              ))}
            </div>
          </div>

          {session.realUser.role === "SUPERADMIN" && (
            <div className="rounded-[12px] border border-[#e1e8f0] bg-[#ebf3ff]/60 p-5 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="flex items-center gap-2 text-[#10345b] dark:text-blue-300">
                <Users className="h-5 w-5" />
                <h4 className="text-[14px] font-bold">
                  Akses Superadmin BPS
                </h4>
              </div>
              <p className="mt-1.5 text-[12px] text-slate-600 dark:text-slate-300">
                Kelola akun Operator OPD dan Pembina Sektoral, atau gunakan menu{" "}
                <strong>Peran Aktif</strong> di bilah atas untuk menguji
                tampilan setiap peran.
              </p>
              <Link
                href="/dashboard/users"
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1557b0] hover:underline dark:text-blue-400"
              >
                <span>Buka Manajemen Pengguna</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

