"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Info,
  ChartPie,
  Files,
  FileClock,
  ChevronRight,
  ChevronDown,
  Upload,
  FolderOpen,
  Clock3,
  CheckSquare,
  FileText,
  Trash2,
  Eye,
  MessageSquare,
  Award,
  Building2,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  PdfViewerModal,
  ViewableDocument,
} from "@/components/pdf-viewer-modal";
import { MATURITY_LEVEL_LABELS } from "@/lib/epss-official-data";
import { UserRole } from "@/lib/roles";
import { formatBytes, formatDateId } from "@/lib/utils";

export interface SerializedDocument {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  targetLevel: number;
  pageNumber: string | null;
  description: string | null;
  createdAt: string;
}

export interface SerializedComment {
  id: string;
  authorName: string;
  authorRole: string;
  scoreGiven: number | null;
  statusAction: string | null;
  comment: string;
  createdAt: string;
}

export interface SerializedIndicator {
  id: string;
  code: string;
  name: string;
  weight: number;
  totalWeight: number;
  level1Criteria: string;
  level2Criteria: string;
  level3Criteria: string;
  level4Criteria: string;
  level5Criteria: string;
  notes: string | null;
  submission: {
    id: string;
    selfScore: number | null;
    maturityScore: number | null;
    targetLevel: number;
    narrative: string | null;
    pageReference: string | null;
    status: string;
    reviewerNotes: string | null;
    reviewedAt: string | null;
    documents: SerializedDocument[];
    comments: SerializedComment[];
  } | null;
}

export interface SerializedAspect {
  id: string;
  code: string;
  name: string;
  weight: number;
  indicators: SerializedIndicator[];
}

export interface SerializedDomain {
  id: string;
  code: string;
  name: string;
  weight: number;
  description: string | null;
  aspects: SerializedAspect[];
}

export interface OpdProgressSummary {
  id: string;
  code: string;
  name: string;
  shortName: string;
  category: string;
  activity1Name: string | null;
  activity2Name: string | null;
  filledCount: number;
  verifiedCount: number;
  waitingCount: number;
  revisionCount: number;
  documentCount: number;
  completionPct: number;
  estimatedIps: string;
}

export function EpssWorkspaceClient({
  mode,
  effectiveRole,
  userOpdId,
  selectedYear,
  periods,
  selectedOpd,
  allOpdSummaries,
  domains,
}: {
  mode: "main" | "penilaian" | "upload";
  effectiveRole: UserRole;
  userOpdId: string | null;
  selectedYear: number;
  periods: Array<{ year: number; label: string; status: string }>;
  selectedOpd: OpdProgressSummary;
  allOpdSummaries: OpdProgressSummary[];
  domains: SerializedDomain[];
}) {
  const router = useRouter();
  const [selectedDomainFilter, setSelectedDomainFilter] =
    React.useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedDomains, setExpandedDomains] = React.useState<
    Record<string, boolean>
  >({
    "1": true,
    "2": true,
    "3": true,
    "4": true,
    "5": true,
  });

  // Modals state
  const [previewDoc, setPreviewDoc] = React.useState<ViewableDocument | null>(
    null
  );
  const [uploadModalIndicator, setUploadModalIndicator] =
    React.useState<SerializedIndicator | null>(null);
  const [reviewModalIndicator, setReviewModalIndicator] =
    React.useState<SerializedIndicator | null>(null);
  const [rubricModalIndicator, setRubricModalIndicator] =
    React.useState<SerializedIndicator | null>(null);

  // Upload form state
  const [uploadSelfScore, setUploadSelfScore] = React.useState<number>(3);
  const [uploadPageRef, setUploadPageRef] = React.useState<string>("");
  const [uploadNarrative, setUploadNarrative] = React.useState<string>("");
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [replaceDocId, setReplaceDocId] = React.useState<string>("");
  const [uploadSubmitting, setUploadSubmitting] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = React.useState<string | null>(null);

  // Review form state (Pembina Sektoral / Superadmin)
  const [reviewScore, setReviewScore] = React.useState<number>(3);
  const [reviewStatus, setReviewStatus] =
    React.useState<string>("TERVERIFIKASI");
  const [reviewNotes, setReviewNotes] = React.useState<string>("");
  const [reviewSubmitting, setReviewSubmitting] = React.useState(false);
  const [reviewMessage, setReviewMessage] = React.useState<string | null>(null);

  // Inline quick score state per indicator
  const [inlineSavingId, setInlineSavingId] = React.useState<string | null>(
    null
  );

  const canUpload =
    effectiveRole === "SUPERADMIN" ||
    (effectiveRole === "OPERATOR_OPD" && userOpdId === selectedOpd.id);

  const canReview =
    effectiveRole === "PEMBINA_SEKTORAL" || effectiveRole === "SUPERADMIN";

  const basePath =
    mode === "penilaian"
      ? "/dashboard/epss/penilaian"
      : mode === "upload"
      ? "/dashboard/epss/upload"
      : "/dashboard/epss";

  function handleYearChange(newYear: number) {
    router.push(`${basePath}?opdId=${selectedOpd.id}&year=${newYear}`);
  }

  function handleOpdChange(newOpdId: string) {
    if (effectiveRole === "OPERATOR_OPD") return;
    router.push(`${basePath}?opdId=${newOpdId}&year=${selectedYear}`);
  }

  function openUploadModal(ind: SerializedIndicator) {
    setUploadModalIndicator(ind);
    setUploadSelfScore(ind.submission?.selfScore || 3);
    setUploadPageRef(
      ind.submission?.pageReference || "Halaman 1 - 12, Pasal 8 Perbup SDI"
    );
    setUploadNarrative(
      ind.submission?.narrative ||
        `(i) Bukti dukung menunjukkan pemenuhan indikator ${ind.code} (${ind.name}) pada 2 kegiatan statistik sektoral yang dinilaikan.\n(ii) Bukti_${ind.code}_${selectedOpd.shortName.replace(
          /\s+/g,
          "_"
        )}_${selectedYear}.pdf\n(iii) Halaman 1-12.`
    );
    setUploadFile(null);
    setReplaceDocId("");
    setUploadError(null);
    setUploadSuccess(null);
  }

  function openReviewModal(ind: SerializedIndicator) {
    setReviewModalIndicator(ind);
    setReviewScore(
      ind.submission?.maturityScore || ind.submission?.selfScore || 3
    );
    setReviewStatus(
      ind.submission?.status === "REVISI" ? "REVISI" : "TERVERIFIKASI"
    );
    setReviewNotes(ind.submission?.reviewerNotes || "");
    setReviewMessage(null);
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadModalIndicator) return;

    setUploadError(null);
    setUploadSuccess(null);

    if (uploadFile) {
      const maxBytes = 10 * 1024 * 1024;
      if (uploadFile.size > maxBytes) {
        setUploadError(
          `Ukuran berkas (${formatBytes(
            uploadFile.size
          )}) melebihi batas maksimum 10 MB per berkas.`
        );
        return;
      }
      const lower = uploadFile.name.toLowerCase();
      if (
        !lower.endsWith(".pdf") &&
        !lower.endsWith(".zip") &&
        !lower.endsWith(".docx")
      ) {
        setUploadError(
          "Format berkas tidak diizinkan. Gunakan hanya berkas .pdf, .zip, atau .docx."
        );
        return;
      }
    }

    setUploadSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("indicatorId", uploadModalIndicator.id);
      formData.append("opdId", selectedOpd.id);
      formData.append("periodYear", String(selectedYear));
      formData.append("selfScore", String(uploadSelfScore));
      formData.append("targetLevel", String(uploadSelfScore));
      formData.append("pageReference", uploadPageRef);
      formData.append("narrative", uploadNarrative);
      if (replaceDocId) {
        formData.append("replaceDocumentId", replaceDocId);
      }
      if (uploadFile) {
        formData.append("file", uploadFile);
      }

      const res = await fetch("/api/epss/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Gagal mengunggah bukti dukung.");
        setUploadSubmitting(false);
        return;
      }

      setUploadSuccess(data.message);
      setUploadFile(null);
      router.refresh();
      setTimeout(() => {
        setUploadModalIndicator(null);
      }, 900);
    } catch {
      setUploadError("Terjadi kesalahan jaringan saat mengunggah berkas.");
    } finally {
      setUploadSubmitting(false);
    }
  }

  async function handleDeleteDocument(docId: string) {
    const res = await fetch(`/api/epss/upload?documentId=${docId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
      setUploadModalIndicator(null);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewModalIndicator) return;

    setReviewSubmitting(true);
    setReviewMessage(null);
    try {
      const res = await fetch("/api/epss/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opdId: selectedOpd.id,
          indicatorId: reviewModalIndicator.id,
          periodYear: selectedYear,
          maturityScore: reviewScore,
          status: reviewStatus,
          reviewerNotes: reviewNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewMessage(data.message);
        router.refresh();
        setTimeout(() => {
          setReviewModalIndicator(null);
        }, 800);
      }
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleInlineQuickScore(
    indicatorId: string,
    newScore: number
  ) {
    setInlineSavingId(indicatorId);
    try {
      await fetch("/api/epss/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opdId: selectedOpd.id,
          indicatorId,
          periodYear: selectedYear,
          maturityScore: newScore,
          status: "TERVERIFIKASI",
          reviewerNotes: `Skor Tingkat Kematangan Level ${newScore} ditetapkan oleh Pembina Sektoral BPS.`,
        }),
      });
      router.refresh();
    } finally {
      setInlineSavingId(null);
    }
  }

  function handleExportCsv() {
    const rows: string[] = [
      "Kode Domain,Nama Domain,Kode Aspek,Nama Aspek,Kode Indikator,Nama Indikator,Bobot IPS (%),Status,Skor Mandiri OPD,Skor Kematangan BPS,Jumlah Bukti,Catatan Pembina",
    ];
    for (const dom of domains) {
      for (const asp of dom.aspects) {
        for (const ind of asp.indicators) {
          const sub = ind.submission;
          rows.push(
            `"${dom.code}","${dom.name}","${asp.code}","${asp.name}","${
              ind.code
            }","${ind.name.replace(/"/g, '""')}","${ind.totalWeight}","${
              sub?.status || "BELUM_DIISI"
            }","${sub?.selfScore || "-"}","${sub?.maturityScore || "-"}","${
              sub?.documents.length || 0
            }","${(sub?.reviewerNotes || "").replace(/"/g, '""')}"`
          );
        }
      }
    }
    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rekap_EPSS_${selectedOpd.shortName.replace(
      /\s+/g,
      "_"
    )}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Compute domain-level summary rows for Figma 4:3744 ("Tabel kebutuhan bukti")
  const domainSummaryRows = domains.map((dom) => {
    const allInds = dom.aspects.flatMap((a) => a.indicators);
    const totalInds = allInds.length;
    const filledInds = allInds.filter(
      (i) => i.submission && i.submission.status !== "BELUM_DIISI"
    ).length;
    const verifiedInds = allInds.filter(
      (i) => i.submission?.status === "TERVERIFIKASI"
    ).length;
    const docsCount = allInds.reduce(
      (acc, i) => acc + (i.submission?.documents.length || 0),
      0
    );
    const pct = totalInds > 0 ? Math.round((filledInds / totalInds) * 100) : 0;
    const firstInd = allInds[0];
    const firstDoc = allInds.flatMap((i) => i.submission?.documents || [])[0];

    return {
      domain: dom,
      totalInds,
      filledInds,
      verifiedInds,
      docsCount,
      pct,
      firstInd,
      firstDoc,
    };
  });

  function renderStatusBadge(status?: string) {
    switch (status) {
      case "TERVERIFIKASI":
        return <Badge variant="success">Terverifikasi BPS</Badge>;
      case "MENUNGGU_PERIKSA":
        return <Badge variant="warning">Menunggu Periksa</Badge>;
      case "REVISI":
        return <Badge variant="destructive">Perlu Revisi</Badge>;
      case "DRAF":
        return <Badge variant="secondary">Draf Mandiri</Badge>;
      default:
        return <Badge variant="outline">Belum Diisi</Badge>;
    }
  }

  return (
    <div
      className="mx-auto max-w-[1160px] space-y-6"
      data-node-id="4:3630"
    >
      {/* Judul halaman (Figma 4:3686) */}
      <div
        className="flex flex-wrap items-end justify-between gap-4"
        data-node-id="4:3686"
      >
        <div className="max-w-3xl" data-node-id="4:3687">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#087f80] dark:text-teal-400">
            {mode === "penilaian"
              ? "PANEL PEMERIKSAAN PEMBINA SEKTORAL BPS"
              : effectiveRole === "OPERATOR_OPD"
              ? `PENILAIAN EPSS & UNGGAH BUKTI DUKUNG — ${selectedOpd.shortName}`
              : "EVALUASI PENYELENGGARAAN STATISTIK SEKTORAL (EPSS)"}
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-[#142b45] dark:text-white">
            {mode === "penilaian"
              ? `Pemeriksaan & Penilaian Kematangan EPSS (${selectedYear})`
              : effectiveRole === "OPERATOR_OPD"
              ? `Penilaian EPSS & Bukti Dukung — ${selectedOpd.shortName} (${selectedYear})`
              : `Penilaian EPSS — Persiapan Bukti & Evaluasi (${selectedYear})`}
          </h1>
          <p className="mt-1 text-[14px] text-slate-600 dark:text-slate-400">
            Hierarki lengkap 5 Domain, 19 Aspek, dan 38 Indikator resmi sesuai
            Petunjuk Teknis Penilaian EPSS Badan Pusat Statistik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex h-[42px] items-center gap-2 rounded-[8px] border border-[#e1e8f0] bg-white px-4 text-[13px] font-semibold text-[#142b45] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            data-node-id="4:3691"
          >
            <Download className="h-4 w-4 text-[#1557b0]" />
            <span>Unduh Rekap CSV</span>
          </button>

          {mode !== "penilaian" && canReview && (
            <Link
              href={`/dashboard/epss/penilaian?opdId=${selectedOpd.id}&year=${selectedYear}`}
              className="inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-[#087f80] px-4 text-[13px] font-semibold text-white hover:bg-[#066667]"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Mode Penilaian Pembina</span>
            </Link>
          )}
        </div>
      </div>

      {/* Requirement: Pembina Sektoral can see all progress for all OPDs before entering/reviewing */}
      {canReview && (
        <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
            <div>
              <h2 className="text-[15px] font-bold text-[#142b45] dark:text-white">
                Ringkasan Progres Seluruh OPD Kabupaten Berau — Periode{" "}
                {selectedYear}
              </h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Pilih instansi OPD di bawah ini untuk memeriksa bukti dukung PDF
                dan memberikan skor Tingkat Kematangan (Level 1–5).
              </p>
            </div>
            <Badge variant="teal">
              Sedang Memeriksa: {selectedOpd.shortName}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allOpdSummaries.map((opd) => {
              const isSelected = opd.id === selectedOpd.id;
              return (
                <button
                  key={opd.id}
                  type="button"
                  onClick={() => handleOpdChange(opd.id)}
                  className={`flex flex-col justify-between rounded-[10px] border p-3.5 text-left transition ${
                    isSelected
                      ? "border-[#1557b0] bg-[#ebf3ff]/60 ring-2 ring-[#1557b0]/20 dark:border-blue-500 dark:bg-blue-950/50"
                      : "border-[#e1e8f0] bg-[#f8fafc]/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#142b45] dark:text-white">
                        <Building2 className="h-3.5 w-3.5 text-[#1557b0]" />
                        {opd.shortName}
                      </span>
                      <span className="rounded bg-[#10345b] px-2 py-0.5 text-[11px] font-bold text-white dark:bg-blue-600">
                        IPS {opd.estimatedIps}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {opd.name}
                    </p>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span>Progres: {opd.completionPct}%</span>
                      <span className="text-slate-500">
                        {opd.filledCount}/38 Indikator · {opd.documentCount} File
                      </span>
                    </div>
                    <ProgressBar
                      percentage={opd.completionPct}
                      colorClass={
                        opd.completionPct >= 70
                          ? "bg-[#087f80]"
                          : "bg-[#1557b0]"
                      }
                    />
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        {opd.verifiedCount} Terverifikasi
                      </span>
                      {opd.waitingCount > 0 ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {opd.waitingCount} Menunggu Reviu →
                        </span>
                      ) : (
                        <span className="text-slate-400">Pilih OPD →</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pemberitahuan data contoh / Lokus Kegiatan (Figma 4:3694) */}
      <div
        className="flex items-start gap-3.5 rounded-[12px] border border-[#d0e2ff] bg-[#ebf3ff]/70 p-4 dark:border-blue-900 dark:bg-blue-950/40"
        data-node-id="4:3694"
      >
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#1557b0] dark:text-blue-400" />
        <div className="space-y-1 text-[13px]" data-node-id="4:3696">
          <p className="font-bold text-[#10345b] dark:text-blue-200">
            Lokus 2 Kegiatan Statistik Sektoral — {selectedOpd.name}
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            <strong>Kegiatan 1:</strong> {selectedOpd.activity1Name} ·{" "}
            <strong>Kegiatan 2:</strong> {selectedOpd.activity2Name}. Sesuai
            Petunjuk Teknis Penilaian EPSS, setiap indikator wajib dilengkapi
            bukti dukung yang mandiri dan utuh.
          </p>
        </div>
      </div>

      {/* Konteks evaluasi: Pemilihan periode & OPD (Figma 4:3699) */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-[#e1e8f0] bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        data-node-id="4:3699"
      >
        <div
          className="flex flex-wrap items-center gap-3"
          data-node-id="4:3700"
        >
          <span className="text-[13px] font-semibold text-[#142b45] dark:text-slate-200">
            Periode & Instansi:
          </span>

          {/* Year selector (4:3702) */}
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="h-[42px] rounded-[8px] border border-[#e1e8f0] bg-[#f8fafc] px-3.5 text-[13px] font-semibold text-[#10345b] focus:border-[#1557b0] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300"
            data-node-id="4:3702"
          >
            {periods.map((p) => (
              <option key={p.year} value={p.year}>
                Periode EPSS {p.year} ({p.status})
              </option>
            ))}
          </select>

          {/* OPD selector (4:3705): Hanya Pembina BPS & Superadmin yang dapat berpindah OPD */}
          {effectiveRole === "OPERATOR_OPD" ? (
            <div
              className="inline-flex h-[42px] items-center gap-2 rounded-[8px] border border-[#e1e8f0] bg-[#f8fafc] px-3.5 text-[13px] font-semibold text-[#142b45] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              data-node-id="4:3705"
            >
              <Building2 className="h-4 w-4 text-[#1557b0]" />
              <span>
                {selectedOpd.name} ({selectedOpd.completionPct}%)
              </span>
            </div>
          ) : (
            <select
              value={selectedOpd.id}
              onChange={(e) => handleOpdChange(e.target.value)}
              className="h-[42px] rounded-[8px] border border-[#e1e8f0] bg-[#f8fafc] px-3.5 text-[13px] font-semibold text-[#142b45] focus:border-[#1557b0] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              data-node-id="4:3705"
            >
              {allOpdSummaries.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.completionPct}%)
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2.5" data-node-id="4:3708">
          <Badge variant="teal" className="px-3 py-1 text-[12px]">
            Estimasi IPS {selectedOpd.shortName}: {selectedOpd.estimatedIps}
          </Badge>
        </div>
      </div>

      {/* Ringkasan persiapan (Figma 4:3710 — 3 cards) */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        data-node-id="4:3710"
      >
        <div
          className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          data-node-id="4:3711"
        >
          <div
            className="flex items-center justify-between"
            data-node-id="4:3712"
          >
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              Kelengkapan Bukti Indikator
            </span>
            <ChartPie className="h-5 w-5 text-[#1557b0]" />
          </div>
          <p className="mt-3 text-[32px] font-bold leading-none text-[#142b45] dark:text-white">
            {selectedOpd.completionPct}%
          </p>
          <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
            {selectedOpd.filledCount} dari 38 indikator resmi telah diisi
          </p>
        </div>

        <div
          className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          data-node-id="4:3717"
        >
          <div
            className="flex items-center justify-between"
            data-node-id="4:3718"
          >
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              Berkas Bukti Dukung
            </span>
            <Files className="h-5 w-5 text-[#087f80]" />
          </div>
          <p className="mt-3 text-[32px] font-bold leading-none text-[#142b45] dark:text-white">
            {selectedOpd.documentCount}
          </p>
          <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
            Dokumen (.pdf / .zip / .docx) tersimpan di peladen
          </p>
        </div>

        <div
          className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          data-node-id="4:3723"
        >
          <div
            className="flex items-center justify-between"
            data-node-id="4:3724"
          >
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              Status Pemeriksaan BPS
            </span>
            <FileClock className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-3 text-[32px] font-bold leading-none text-[#142b45] dark:text-white">
            {selectedOpd.verifiedCount}/38
          </p>
          <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
            {selectedOpd.waitingCount} menunggu periksa ·{" "}
            {selectedOpd.revisionCount} perlu revisi
          </p>
        </div>
      </div>

      {/* Tahapan evaluasi (Figma 4:3729) */}
      <div
        className="grid grid-cols-1 gap-3 rounded-[12px] border border-[#e1e8f0] bg-white p-4 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900"
        data-node-id="4:3729"
      >
        <div className="flex items-center gap-3" data-node-id="4:3730">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#10345b] text-[12px] font-bold text-white">
            1
          </span>
          <span className="text-[13px] font-semibold text-[#142b45] dark:text-white">
            Penyiapan & Unggah Bukti OPD
          </span>
          <ChevronRight className="ml-auto hidden h-4 w-4 text-slate-400 sm:block" />
        </div>
        <div className="flex items-center gap-3" data-node-id="4:3735">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#087f80] text-[12px] font-bold text-white">
            2
          </span>
          <span className="text-[13px] font-semibold text-[#142b45] dark:text-white">
            Verifikasi & Catatan Pembina BPS
          </span>
          <ChevronRight className="ml-auto hidden h-4 w-4 text-slate-400 sm:block" />
        </div>
        <div className="flex items-center gap-3" data-node-id="4:3740">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ebf3ff] text-[12px] font-bold text-[#1557b0] dark:bg-blue-950 dark:text-blue-300">
            3
          </span>
          <span className="text-[13px] font-semibold text-[#142b45] dark:text-white">
            Penetapan Skor Kematangan (1–5)
          </span>
        </div>
      </div>

      {/* Tabel kebutuhan bukti — Ringkasan 5 Domain EPSS (Figma 4:3744) */}
      <div
        className="rounded-[12px] border border-[#e1e8f0] bg-white dark:border-slate-800 dark:bg-slate-900"
        data-node-id="4:3744"
      >
        <div
          className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1e8f0] p-5 dark:border-slate-800"
          data-node-id="4:3745"
        >
          <div data-node-id="4:3746">
            <h2 className="text-[17px] font-bold text-[#142b45] dark:text-white">
              Ringkasan 5 Domain Evaluasi EPSS — {selectedOpd.shortName}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              Ikhtisar kelengkapan bukti dukung pada lima domain utama sebelum
              memeriksa 38 rincian indikator di bawah.
            </p>
          </div>
          <Badge variant="secondary">Total Bobot: 100%</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr
                className="border-b border-[#e1e8f0] bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400"
                data-node-id="4:3752"
              >
                <th className="px-5 py-3.5">Domain EPSS & Bobot</th>
                <th className="px-4 py-3.5">Cakupan Aspek & Indikator</th>
                <th className="px-4 py-3.5">Kelengkapan Bukti</th>
                <th className="px-4 py-3.5">Status Persiapan</th>
                <th className="px-5 py-3.5 text-right">Tindakan Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e8f0] dark:divide-slate-800">
              {domainSummaryRows.map((row) => (
                <tr
                  key={row.domain.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  data-node-id="4:3758"
                >
                  <td className="px-5 py-4" data-node-id="4:3759">
                    <p className="font-bold text-[#142b45] dark:text-white">
                      Domain {row.domain.code}: {row.domain.name}
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-[#087f80] dark:text-teal-400">
                      Bobot Domain: {row.domain.weight}%
                    </p>
                  </td>
                  <td className="max-w-[340px] px-4 py-4" data-node-id="4:3762">
                    <p className="text-slate-700 dark:text-slate-200">
                      {row.domain.aspects.length} Aspek · {row.totalInds}{" "}
                      Indikator Penilaian
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-400">
                      {row.domain.description}
                    </p>
                  </td>
                  <td className="w-[180px] px-4 py-4" data-node-id="4:3765">
                    <div className="flex items-center justify-between text-[12px] font-semibold">
                      <span>{row.pct}%</span>
                      <span className="font-normal text-slate-500">
                        {row.filledInds}/{row.totalInds} terisi
                      </span>
                    </div>
                    <div className="mt-1.5" data-node-id="4:3767">
                      <ProgressBar
                        percentage={row.pct}
                        colorClass={
                          row.pct >= 75
                            ? "bg-[#087f80]"
                            : row.pct >= 40
                            ? "bg-[#1557b0]"
                            : "bg-amber-500"
                        }
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {row.docsCount} berkas bukti
                    </p>
                  </td>
                  <td className="px-4 py-4" data-node-id="4:3770">
                    {row.pct === 100 ? (
                      <Badge variant="success">Lengkap Terisi</Badge>
                    ) : row.pct > 0 ? (
                      <Badge variant="secondary">
                        {row.verifiedInds} Terverifikasi
                      </Badge>
                    ) : (
                      <Badge variant="outline">Belum Diisi</Badge>
                    )}
                  </td>
                  <td
                    className="whitespace-nowrap px-5 py-4 text-right"
                    data-node-id="4:3773"
                  >
                    <div className="inline-flex flex-col items-end gap-1.5">
                      {canUpload && row.firstInd && (
                        <button
                          type="button"
                          onClick={() => openUploadModal(row.firstInd)}
                          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1557b0] hover:underline dark:text-blue-400"
                          data-node-id="4:3774"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Unggah bukti</span>
                        </button>
                      )}
                      {row.firstDoc ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              id: row.firstDoc.id,
                              originalName: row.firstDoc.originalName,
                              filePath: row.firstDoc.filePath,
                              mimeType: row.firstDoc.mimeType,
                              fileSize: row.firstDoc.fileSize,
                              targetLevel: row.firstDoc.targetLevel,
                              pageNumber: row.firstDoc.pageNumber,
                              description: row.firstDoc.description,
                              indicatorCode: `Domain ${row.domain.code}`,
                              opdName: selectedOpd.name,
                            })
                          }
                          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-600 hover:text-[#10345b] dark:text-slate-300"
                          data-node-id="4:3777"
                        >
                          <FolderOpen className="h-3.5 w-3.5 text-[#087f80]" />
                          <span>Lihat bukti ({row.docsCount})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedDomainFilter(row.domain.code)
                          }
                          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-[#10345b]"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          <span>Rincian indikator</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Catatan bukti (Figma 4:3868) */}
        <div
          className="flex items-center gap-2.5 border-t border-[#e1e8f0] bg-[#f8fafc] px-5 py-3 text-[12px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400"
          data-node-id="4:3868"
        >
          <Clock3 className="h-3.5 w-3.5 text-[#087f80]" />
          <span>
            Pembaruan bukti dukung dan skor kematangan disimpan secara waktu
            nyata (real-time) pada basis data PostgreSQL SIGAP BERAU.
          </span>
        </div>
      </div>

      {/* Comprehensive Hierarchical Data Table: 5 Domains -> 19 Aspects -> 38 Indicators */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#e1e8f0] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-[17px] font-bold text-[#142b45] dark:text-white">
              Tabel Hierarki Penilaian 38 Indikator Resmi EPSS
            </h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              Klik pada tombol <strong>Unggah / Ganti Bukti</strong> untuk
              mengelola dokumen OPD, atau <strong>Nilai & Komentar</strong>{" "}
              untuk menetapkan skor Tingkat Kematangan (Skala 1–5).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode (mis. 10101) atau indikator..."
                className="h-[36px] w-[240px] rounded-[8px] border border-[#e1e8f0] bg-white pl-9 pr-3 text-[12px] focus:border-[#1557b0] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <select
              value={selectedDomainFilter}
              onChange={(e) => setSelectedDomainFilter(e.target.value)}
              className="h-[36px] rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[12px] font-medium dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="ALL">Semua Domain (1–5)</option>
              {domains.map((d) => (
                <option key={d.code} value={d.code}>
                  Domain {d.code} — {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-[36px] rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[12px] font-medium dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="ALL">Semua Status Indikator</option>
              <option value="TERVERIFIKASI">Terverifikasi BPS</option>
              <option value="MENUNGGU_PERIKSA">Menunggu Pemeriksaan</option>
              <option value="REVISI">Perlu Revisi</option>
              <option value="BELUM_DIISI">Belum Diisi</option>
            </select>
          </div>
        </div>

        {domains
          .filter(
            (dom) =>
              selectedDomainFilter === "ALL" ||
              dom.code === selectedDomainFilter
          )
          .map((dom) => {
            const isExpanded = expandedDomains[dom.code] ?? true;

            // Filter aspects & indicators inside domain
            const filteredAspects = dom.aspects
              .map((asp) => ({
                ...asp,
                indicators: asp.indicators.filter((ind) => {
                  const status = ind.submission?.status || "BELUM_DIISI";
                  const matchStatus =
                    selectedStatusFilter === "ALL" ||
                    status === selectedStatusFilter;
                  const matchQuery =
                    !searchQuery ||
                    ind.code.includes(searchQuery) ||
                    ind.name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    asp.name.toLowerCase().includes(searchQuery.toLowerCase());
                  return matchStatus && matchQuery;
                }),
              }))
              .filter((asp) => asp.indicators.length > 0);

            if (filteredAspects.length === 0) return null;

            return (
              <div
                key={dom.id}
                className="overflow-hidden rounded-[12px] border border-[#e1e8f0] bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Domain Header Bar */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedDomains((prev) => ({
                      ...prev,
                      [dom.code]: !isExpanded,
                    }))
                  }
                  className="flex w-full items-center justify-between gap-4 bg-[#10345b] px-5 py-3.5 text-left text-white hover:bg-[#142b45]"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded bg-[#087f80] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                      DOMAIN {dom.code}
                    </span>
                    <span className="text-[15px] font-bold">{dom.name}</span>
                    <span className="text-[12px] text-[#90dfd7]">
                      (Bobot Domain: {dom.weight}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[#acc5df]">
                    <span>{isExpanded ? "Ciutkan" : "Perluas"}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-[#e1e8f0] dark:divide-slate-800">
                    {filteredAspects.map((asp) => (
                      <div key={asp.id}>
                        {/* Aspect Subheader */}
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#ebf3ff]/60 px-5 py-2.5 text-[12px] font-semibold text-[#10345b] dark:bg-slate-800/80 dark:text-blue-300">
                          <span>
                            Aspek {asp.code}: {asp.name}
                          </span>
                          <span>Bobot Aspek: {asp.weight}% dari Domain</span>
                        </div>

                        {/* Indicators Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[13px]">
                            <thead>
                              <tr className="border-b border-[#e1e8f0] bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                                <th className="w-[90px] px-5 py-3">Kode</th>
                                <th className="px-4 py-3">
                                  Indikator & Narasi Bukti (Simbatik)
                                </th>
                                <th className="w-[230px] px-4 py-3">
                                  Dokumen Bukti (.pdf/.zip/.docx)
                                </th>
                                <th className="w-[140px] px-4 py-3">
                                  Status & Mandiri
                                </th>
                                <th className="w-[190px] px-4 py-3">
                                  Skor Kematangan BPS (1–5)
                                </th>
                                <th className="w-[170px] px-5 py-3 text-right">
                                  Tindakan
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e1e8f0] dark:divide-slate-800">
                              {asp.indicators.map((ind) => {
                                const sub = ind.submission;
                                const docs = sub?.documents || [];
                                const officialScore = sub?.maturityScore;
                                const selfScore = sub?.selfScore;

                                return (
                                  <tr
                                    key={ind.id}
                                    className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                                  >
                                    {/* Code & Weight */}
                                    <td className="px-5 py-4">
                                      <span className="inline-block rounded bg-[#10345b]/10 px-2 py-1 font-mono text-[12px] font-bold text-[#10345b] dark:bg-blue-950 dark:text-blue-300">
                                        {ind.code}
                                      </span>
                                      <p className="mt-1 text-[11px] text-slate-500">
                                        Bobot: {ind.totalWeight.toFixed(2)}%
                                      </p>
                                    </td>

                                    {/* Indicator Name, Rubric Button, Narrative & Reviewer Feedback */}
                                    <td className="max-w-[360px] px-4 py-4">
                                      <p className="font-bold text-[#142b45] dark:text-white">
                                        {ind.name}
                                      </p>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setRubricModalIndicator(ind)
                                        }
                                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#087f80] hover:underline dark:text-teal-400"
                                      >
                                        <Info className="h-3 w-3" />
                                        <span>
                                          Lihat Rubrik Kriteria Level 1–5
                                        </span>
                                      </button>

                                      {sub?.narrative && (
                                        <div className="mt-2.5 rounded-lg border border-[#e1e8f0] bg-[#f8fafc] p-2.5 text-[11px] leading-relaxed text-slate-600 whitespace-pre-line dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                                          {sub.narrative}
                                        </div>
                                      )}

                                      {sub?.reviewerNotes && (
                                        <div className="mt-2 rounded-lg border border-teal-200 bg-teal-50/70 p-2.5 text-[11px] text-teal-950 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                                          <p className="font-bold">
                                            Catatan Pembina Sektoral BPS:
                                          </p>
                                          <p className="mt-0.5">
                                            {sub.reviewerNotes}
                                          </p>
                                        </div>
                                      )}
                                    </td>

                                    {/* Uploaded Evidence Documents with PDF Viewer trigger */}
                                    <td className="px-4 py-4">
                                      {docs.length > 0 ? (
                                        <div className="space-y-2">
                                          {docs.map((doc) => (
                                            <div
                                              key={doc.id}
                                              className="rounded-lg border border-[#e1e8f0] bg-white p-2 dark:border-slate-700 dark:bg-slate-800"
                                            >
                                              <p className="truncate text-[12px] font-semibold text-[#142b45] dark:text-white">
                                                {doc.originalName}
                                              </p>
                                              <p className="text-[11px] text-slate-500">
                                                {formatBytes(doc.fileSize)} ·{" "}
                                                {doc.pageNumber || "Hal. 1"}
                                              </p>
                                              <div className="mt-1.5 flex items-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setPreviewDoc({
                                                      id: doc.id,
                                                      originalName:
                                                        doc.originalName,
                                                      filePath: doc.filePath,
                                                      mimeType: doc.mimeType,
                                                      fileSize: doc.fileSize,
                                                      targetLevel:
                                                        doc.targetLevel,
                                                      pageNumber:
                                                        doc.pageNumber,
                                                      description:
                                                        doc.description,
                                                      indicatorCode: ind.code,
                                                      indicatorName: ind.name,
                                                      opdName: selectedOpd.name,
                                                    })
                                                  }
                                                  className="inline-flex items-center gap-1 rounded bg-[#ebf3ff] px-2 py-0.5 text-[11px] font-semibold text-[#1557b0] hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
                                                >
                                                  <Eye className="h-3 w-3" />
                                                  <span>Lihat PDF</span>
                                                </button>
                                                <a
                                                  href={doc.filePath}
                                                  download={doc.originalName}
                                                  className="text-[11px] font-medium text-slate-500 hover:underline"
                                                >
                                                  Unduh
                                                </a>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-[12px] italic text-slate-400">
                                          Belum ada berkas bukti
                                        </span>
                                      )}
                                    </td>

                                    {/* Status & OPD Self Score */}
                                    <td className="px-4 py-4">
                                      <div>{renderStatusBadge(sub?.status)}</div>
                                      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                        Klaim Mandiri OPD:{" "}
                                        <strong className="text-[#142b45] dark:text-white">
                                          {selfScore
                                            ? `Level ${selfScore}`
                                            : "-"}
                                        </strong>
                                      </p>
                                    </td>

                                    {/* Maturity Score (Scale 1-5) — Inline interactive for Pembina / Superadmin */}
                                    <td className="px-4 py-4">
                                      {officialScore ? (
                                        <div
                                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold ${
                                            MATURITY_LEVEL_LABELS[officialScore]
                                              ?.badgeClass || ""
                                          }`}
                                        >
                                          <Award className="h-3.5 w-3.5" />
                                          <span>
                                            {
                                              MATURITY_LEVEL_LABELS[
                                                officialScore
                                              ]?.name
                                            }
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-[12px] text-slate-400">
                                          Belum dinilai Pembina
                                        </span>
                                      )}

                                      {canReview && (
                                        <div className="mt-2">
                                          <p className="text-[10px] font-semibold uppercase text-slate-400">
                                            Input Cepat Skor (1–5):
                                          </p>
                                          <div className="mt-1 flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((lvl) => (
                                              <button
                                                key={lvl}
                                                type="button"
                                                disabled={
                                                  inlineSavingId === ind.id
                                                }
                                                onClick={() =>
                                                  handleInlineQuickScore(
                                                    ind.id,
                                                    lvl
                                                  )
                                                }
                                                className={`h-6 w-6 rounded text-[11px] font-bold transition ${
                                                  officialScore === lvl
                                                    ? "bg-[#087f80] text-white"
                                                    : "border border-[#e1e8f0] bg-white text-slate-700 hover:border-[#087f80] hover:text-[#087f80] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                }`}
                                                title={`Tetapkan Tingkat Kematangan Level ${lvl}`}
                                              >
                                                {lvl}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </td>

                                    {/* Actions Column */}
                                    <td className="whitespace-nowrap px-5 py-4 text-right">
                                      <div className="flex flex-col items-end gap-1.5">
                                        {canUpload && (
                                          <button
                                            type="button"
                                            onClick={() => openUploadModal(ind)}
                                            className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#10345b] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
                                          >
                                            <Upload className="h-3.5 w-3.5" />
                                            <span>
                                              {docs.length > 0
                                                ? "Kelola / Ganti Bukti"
                                                : "Unggah Bukti"}
                                            </span>
                                          </button>
                                        )}

                                        {canReview && (
                                          <button
                                            type="button"
                                            onClick={() => openReviewModal(ind)}
                                            className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#087f80] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#066667]"
                                          >
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            <span>Nilai & Komentar</span>
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Panduan unggah dan tinjauan (Figma 4:3871) */}
      <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        data-node-id="4:3871"
      >
        <div
          className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          data-node-id="4:3872"
        >
          <h3 className="text-[15px] font-bold text-[#142b45] dark:text-white">
            Ketentuan Unggah Dokumen Bukti Dukung OPD
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
            Format berkas yang diizinkan adalah <strong>.pdf</strong>,{" "}
            <strong>.zip</strong>, atau <strong>.docx</strong> dengan batas
            ukuran maksimum <strong>10 MB per berkas</strong>. Untuk pemenuhan
            Level 3, dokumen kebijakan (Perbup/SOP/Juknis) wajib diunggah secara
            utuh beserta ringkasan pasal dan halaman.
          </p>
          <p className="mt-2 text-[12px] font-semibold text-[#1557b0] dark:text-blue-400">
            Validasi keamanan peladen aktif · Penyimpanan lokal terintegrasi
          </p>
        </div>

        <div
          className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          data-node-id="4:3876"
        >
          <h3 className="text-[15px] font-bold text-[#142b45] dark:text-white">
            Kaidah Penilaian Berjenjang (Kumulatif Level 1–5)
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
            Tingkat Kematangan dinilai secara kumulatif dari Level 1 (Rintisan),
            Level 2 (Terkelola), Level 3 (Terdefinisi), Level 4 (Terpadu dan
            Terukur), hingga Level 5 (Optimum) berdasarkan kelengkapan 2
            kegiatan statistik sektoral.
          </p>
          <p className="mt-2 text-[12px] font-semibold text-[#087f80] dark:text-teal-400">
            Rubrik resmi Petunjuk Teknis Penilaian EPSS BPS
          </p>
        </div>
      </div>

      {/* Modal 1: Upload / Replace / Manage Evidence Document (Operator OPD & Superadmin) */}
      {uploadModalIndicator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-[12px] border border-[#e1e8f0] bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-[#e1e8f0] pb-4 dark:border-slate-800">
              <div>
                <Badge variant="secondary">
                  Indikator {uploadModalIndicator.code} ·{" "}
                  {selectedOpd.shortName}
                </Badge>
                <h3 className="mt-1.5 text-[18px] font-bold text-[#142b45] dark:text-white">
                  {uploadModalIndicator.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalIndicator(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {uploadError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-[13px] text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[13px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Existing Documents List with Replace / Delete */}
            {uploadModalIndicator.submission &&
              uploadModalIndicator.submission.documents.length > 0 && (
                <div className="mt-4 rounded-lg border border-[#e1e8f0] bg-[#f8fafc] p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-[12px] font-bold text-[#142b45] dark:text-white">
                    Berkas Bukti Dukung Terunggah Saat Ini:
                  </p>
                  <div className="mt-2 space-y-2">
                    {uploadModalIndicator.submission.documents.map((d) => (
                      <div
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#e1e8f0] bg-white px-3 py-2 text-[12px] dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 shrink-0 text-[#1557b0]" />
                          <span className="truncate font-semibold">
                            {d.originalName}
                          </span>
                          <span className="text-slate-400">
                            ({formatBytes(d.fileSize)})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setReplaceDocId(
                                replaceDocId === d.id ? "" : d.id
                              )
                            }
                            className={`rounded px-2 py-1 text-[11px] font-semibold ${
                              replaceDocId === d.id
                                ? "bg-amber-500 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {replaceDocId === d.id
                              ? "Akan Diganti"
                              : "Ganti Berkas Ini"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(d.id)}
                            className="rounded p-1 text-rose-600 hover:bg-rose-50"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <form
              onSubmit={handleUploadSubmit}
              className="mt-4 space-y-4 text-[13px]"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-[#142b45] dark:text-slate-200">
                    Klaim Tingkat Kematangan Mandiri (1–5)
                  </label>
                  <select
                    value={uploadSelfScore}
                    onChange={(e) => setUploadSelfScore(Number(e.target.value))}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 font-medium dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value={1}>Level 1 — Rintisan</option>
                    <option value={2}>Level 2 — Terkelola</option>
                    <option value={3}>Level 3 — Terdefinisi</option>
                    <option value={4}>Level 4 — Terpadu dan Terukur</option>
                    <option value={5}>Level 5 — Optimum</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#142b45] dark:text-slate-200">
                    Nomor Halaman & Pasal Rujukan
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadPageRef}
                    onChange={(e) => setUploadPageRef(e.target.value)}
                    placeholder="Contoh: Hal. 12-18, Pasal 14 Perbup SDI"
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#142b45] dark:text-slate-200">
                  Pilih Berkas Bukti Dukung (.pdf, .zip, .docx — Maks. 10 MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.zip,.docx,application/pdf,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full rounded-[8px] border border-dashed border-[#1557b0] bg-[#ebf3ff]/30 p-2.5 text-[12px] file:mr-3 file:rounded-md file:border-0 file:bg-[#10345b] file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-white hover:file:bg-[#142b45] dark:border-blue-700 dark:bg-slate-800/60"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  {replaceDocId
                    ? "Mode Ganti Berkas Aktif: Berkas baru akan menggantikan dokumen yang dipilih di atas."
                    : "Unggah berkas baru untuk ditambahkan pada indikator ini."}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#142b45] dark:text-slate-200">
                  Narasi Penjelasan Bukti Dukung Format Simbatik (i), (ii), (iii)
                </label>
                <textarea
                  rows={4}
                  required
                  value={uploadNarrative}
                  onChange={(e) => setUploadNarrative(e.target.value)}
                  className="mt-1 w-full rounded-[8px] border border-[#e1e8f0] p-3 text-[12px] leading-relaxed dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[#e1e8f0] pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUploadModalIndicator(null)}
                  className="h-[40px] rounded-[8px] border border-[#e1e8f0] px-4 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadSubmitting}
                  className="inline-flex h-[40px] items-center gap-2 rounded-[8px] bg-[#10345b] px-5 font-semibold text-white hover:bg-[#142b45]"
                >
                  <Upload className="h-4 w-4" />
                  <span>
                    {uploadSubmitting
                      ? "Mengunggah & Menyimpan..."
                      : "Simpan & Ajukan Bukti"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Pembina Sektoral Scoring (Scale 1-5) & Review Feedback */}
      {reviewModalIndicator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-[12px] border border-[#e1e8f0] bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-[#e1e8f0] pb-4 dark:border-slate-800">
              <div>
                <Badge variant="teal">
                  Evaluasi Pembina BPS · Indikator {reviewModalIndicator.code}
                </Badge>
                <h3 className="mt-1.5 text-[18px] font-bold text-[#142b45] dark:text-white">
                  {reviewModalIndicator.name}
                </h3>
                <p className="text-[12px] text-slate-500">
                  Instansi: <strong>{selectedOpd.name}</strong> · Periode{" "}
                  {selectedYear}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalIndicator(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reviewMessage && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[13px] font-medium text-emerald-800">
                {reviewMessage}
              </div>
            )}

            {/* Quick Evidence Preview inside Review Modal */}
            <div className="mt-4 rounded-lg border border-[#e1e8f0] bg-[#f8fafc] p-3.5 text-[12px] dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#142b45] dark:text-white">
                  Bukti Dukung & Klaim Mandiri OPD (Level{" "}
                  {reviewModalIndicator.submission?.selfScore || "-"}):
                </span>
                {reviewModalIndicator.submission?.documents.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() =>
                      setPreviewDoc({
                        id: doc.id,
                        originalName: doc.originalName,
                        filePath: doc.filePath,
                        mimeType: doc.mimeType,
                        fileSize: doc.fileSize,
                        targetLevel: doc.targetLevel,
                        pageNumber: doc.pageNumber,
                        description: doc.description,
                        indicatorCode: reviewModalIndicator.code,
                        indicatorName: reviewModalIndicator.name,
                        opdName: selectedOpd.name,
                      })
                    }
                    className="inline-flex items-center gap-1 rounded bg-[#10345b] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#1557b0]"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Buka PDF: {doc.originalName}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 whitespace-pre-line text-slate-600 dark:text-slate-300">
                {reviewModalIndicator.submission?.narrative ||
                  "Operator OPD belum menuliskan narasi penjelasan bukti dukung."}
              </p>
            </div>

            <form
              onSubmit={handleReviewSubmit}
              className="mt-4 space-y-4 text-[13px]"
            >
              <div>
                <label className="block font-bold text-[#142b45] dark:text-white">
                  Tetapkan Skor Tingkat Kematangan (Skala 1–5)
                </label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setReviewScore(lvl)}
                      className={`flex flex-col items-center rounded-[8px] border p-2.5 text-center transition ${
                        reviewScore === lvl
                          ? "border-[#087f80] bg-[#087f80] text-white shadow-xs"
                          : "border-[#e1e8f0] bg-white text-[#142b45] hover:border-[#087f80] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      }`}
                    >
                      <span className="text-[16px] font-bold">Level {lvl}</span>
                      <span
                        className={`mt-0.5 text-[10px] ${
                          reviewScore === lvl
                            ? "text-[#90dfd7]"
                            : "text-slate-500"
                        }`}
                      >
                        {lvl === 1
                          ? "Rintisan"
                          : lvl === 2
                          ? "Terkelola"
                          : lvl === 3
                          ? "Terdefinisi"
                          : lvl === 4
                          ? "Terpadu"
                          : "Optimum"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#142b45] dark:text-white">
                  Status Keputusan Pemeriksaan
                </label>
                <div className="mt-1.5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewStatus("TERVERIFIKASI")}
                    className={`rounded-[8px] border px-4 py-2 text-[12px] font-semibold ${
                      reviewStatus === "TERVERIFIKASI"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-[#e1e8f0] bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    ✓ Terverifikasi (Bukti Sesuai)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus("REVISI")}
                    className={`rounded-[8px] border px-4 py-2 text-[12px] font-semibold ${
                      reviewStatus === "REVISI"
                        ? "border-rose-600 bg-rose-600 text-white"
                        : "border-[#e1e8f0] bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    ! Minta Revisi / Lengkapi Bukti
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#142b45] dark:text-white">
                  Catatan Reviu & Umpan Balik Pembina Sektoral BPS
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Tuliskan evaluasi kelengkapan bukti dukung, kesesuaian dengan 2 kegiatan statistik, atau saran perbaikan bagi Operator OPD..."
                  className="mt-1.5 w-full rounded-[8px] border border-[#e1e8f0] p-3 text-[13px] dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {/* History of Review Comments */}
              {reviewModalIndicator.submission &&
                reviewModalIndicator.submission.comments.length > 0 && (
                  <div className="rounded-lg border border-[#e1e8f0] bg-[#f8fafc] p-3 text-[12px] dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="font-bold text-slate-700 dark:text-slate-200">
                      Riwayat Catatan Pemeriksaan:
                    </p>
                    <div className="mt-2 space-y-2">
                      {reviewModalIndicator.submission.comments.map((c) => (
                        <div
                          key={c.id}
                          className="rounded border border-[#e1e8f0] bg-white p-2 dark:border-slate-700 dark:bg-slate-900"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-semibold text-[#10345b] dark:text-blue-300">
                              {c.authorName} (Level {c.scoreGiven})
                            </span>
                            <span>{formatDateId(c.createdAt)}</span>
                          </div>
                          <p className="mt-1 text-slate-700 dark:text-slate-300">
                            {c.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="flex justify-end gap-2 border-t border-[#e1e8f0] pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewModalIndicator(null)}
                  className="h-[40px] rounded-[8px] border border-[#e1e8f0] px-4 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="h-[40px] rounded-[8px] bg-[#087f80] px-5 font-semibold text-white hover:bg-[#066667]"
                >
                  {reviewSubmitting
                    ? "Menyimpan Penilaian..."
                    : "Simpan Skor & Catatan Reviu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Official EPSS Rubric Criteria (Level 1 to Level 5 from Petunjuk Teknis Penilaian EPSS.docx) */}
      {rubricModalIndicator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-3xl rounded-[12px] border border-[#e1e8f0] bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-[#e1e8f0] pb-4 dark:border-slate-800">
              <div>
                <Badge variant="default">
                  Rubrik Resmi Juknis EPSS · Indikator{" "}
                  {rubricModalIndicator.code}
                </Badge>
                <h3 className="mt-1.5 text-[18px] font-bold text-[#142b45] dark:text-white">
                  {rubricModalIndicator.name}
                </h3>
                <p className="text-[12px] text-slate-500">
                  Bobot dalam Aspek: {rubricModalIndicator.weight}% · Bobot
                  Total IPS: {rubricModalIndicator.totalWeight.toFixed(2)}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRubricModalIndicator(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-[13px]">
              {[
                {
                  lvl: 1,
                  title: "Level 1 — Rintisan",
                  text: rubricModalIndicator.level1Criteria,
                },
                {
                  lvl: 2,
                  title: "Level 2 — Terkelola",
                  text: rubricModalIndicator.level2Criteria,
                },
                {
                  lvl: 3,
                  title: "Level 3 — Terdefinisi",
                  text: rubricModalIndicator.level3Criteria,
                },
                {
                  lvl: 4,
                  title: "Level 4 — Terpadu dan Terukur",
                  text: rubricModalIndicator.level4Criteria,
                },
                {
                  lvl: 5,
                  title: "Level 5 — Optimum",
                  text: rubricModalIndicator.level5Criteria,
                },
              ].map((item) => (
                <div
                  key={item.lvl}
                  className="rounded-lg border border-[#e1e8f0] bg-[#f8fafc] p-3.5 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <p className="font-bold text-[#10345b] dark:text-blue-300">
                    {item.title}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-slate-700 dark:text-slate-300">
                    {item.text}
                  </p>
                </div>
              ))}

              {rubricModalIndicator.notes && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-[12px] text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <strong>Catatan Petunjuk Teknis EPSS:</strong>{" "}
                  {rubricModalIndicator.notes}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setRubricModalIndicator(null)}
                className="h-[40px] rounded-[8px] bg-[#10345b] px-5 text-[13px] font-semibold text-white"
              >
                Tutup Rubrik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Built-in PDF Viewer Modal */}
      <PdfViewerModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}

