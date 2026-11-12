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
  const [expandedAspects, setExpandedAspects] = React.useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    for (const dom of domains) {
      for (const asp of dom.aspects) {
        initial[asp.id] = true;
      }
    }
    return initial;
  });

  function expandAllHierarchy() {
    const nextDomains: Record<string, boolean> = {};
    const nextAspects: Record<string, boolean> = {};
    for (const dom of domains) {
      nextDomains[dom.code] = true;
      for (const asp of dom.aspects) {
        nextAspects[asp.id] = true;
      }
    }
    setExpandedDomains(nextDomains);
    setExpandedAspects(nextAspects);
  }

  function collapseToAspects() {
    const nextDomains: Record<string, boolean> = {};
    const nextAspects: Record<string, boolean> = {};
    for (const dom of domains) {
      nextDomains[dom.code] = true;
      for (const asp of dom.aspects) {
        nextAspects[asp.id] = false;
      }
    }
    setExpandedDomains(nextDomains);
    setExpandedAspects(nextAspects);
  }

  function collapseToDomains() {
    const nextDomains: Record<string, boolean> = {};
    const nextAspects: Record<string, boolean> = {};
    for (const dom of domains) {
      nextDomains[dom.code] = false;
      for (const asp of dom.aspects) {
        nextAspects[asp.id] = false;
      }
    }
    setExpandedDomains(nextDomains);
    setExpandedAspects(nextAspects);
  }

  // Hitung tingkatan aktif untuk highlight tombol Lv.1 / Lv.2 / Lv.3
  const allDomainsCollapsed = domains.every((d) => !expandedDomains[d.code]);
  const allDomainsExpanded = domains.every(
    (d) => expandedDomains[d.code] ?? true
  );
  const allAspectsCollapsed = domains.every((d) =>
    d.aspects.every((a) => !expandedAspects[a.id])
  );
  const allAspectsExpanded = domains.every((d) =>
    d.aspects.every((a) => expandedAspects[a.id] ?? true)
  );

  const activeHierarchyLevel: 1 | 2 | 3 | null = allDomainsCollapsed
    ? 1
    : allDomainsExpanded && allAspectsCollapsed
    ? 2
    : allDomainsExpanded && allAspectsExpanded
    ? 3
    : null;

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

  const basePath = "/dashboard/epss";

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
    setUploadPageRef(ind.submission?.pageReference || "");
    setUploadNarrative(ind.submission?.narrative || "");
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
            {effectiveRole === "OPERATOR_OPD"
              ? `PENILAIAN EPSS & UNGGAH BUKTI DUKUNG — ${selectedOpd.shortName}`
              : effectiveRole === "PEMBINA_SEKTORAL"
              ? "PANEL PEMERIKSAAN & PENILAIAN PEMBINA SEKTORAL BPS"
              : "EVALUASI PENYELENGGARAAN STATISTIK SEKTORAL (EPSS)"}
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-[#142b45] dark:text-white">
            {effectiveRole === "OPERATOR_OPD"
              ? `Penilaian EPSS & Bukti Dukung — ${selectedOpd.shortName} (${selectedYear})`
              : effectiveRole === "PEMBINA_SEKTORAL"
              ? `Penilaian & Reviu Kematangan EPSS (${selectedYear})`
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

      {/* Satu Tabel Utuh Bertingkat (Tree-Table: Domain ▸ Aspek ▸ Indikator) */}
      <div className="overflow-hidden rounded-[12px] border border-[#e1e8f0] bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {/* Bilah Kontrol Atas: Pencarian, Filter Status, Filter Domain, & Kontrol Tingkatan */}
        <div className="border-b border-[#e1e8f0] p-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-[#142b45] dark:text-white">
                Tabel Bertingkat Penilaian EPSS (Domain ▸ Aspek ▸ Indikator)
              </h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Klik pada baris <strong>Domain</strong> atau{" "}
                <strong>Aspek</strong> untuk membuka/menutup tingkatan di
                bawahnya.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode (10101) atau nama..."
                  className="h-[34px] w-[210px] rounded-[8px] border border-[#e1e8f0] bg-[#f8fafc] pl-9 pr-3 text-[12px] focus:border-[#1557b0] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="h-[34px] rounded-[8px] border border-[#e1e8f0] bg-[#f8fafc] px-2.5 text-[12px] font-medium focus:border-[#1557b0] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="ALL">Semua Status</option>
                <option value="TERVERIFIKASI">Terverifikasi BPS</option>
                <option value="MENUNGGU_PERIKSA">Menunggu Periksa</option>
                <option value="REVISI">Perlu Revisi</option>
                <option value="BELUM_DIISI">Belum Diisi</option>
              </select>

              {/* Kontrol Buka/Tutup Tingkatan Hierarki */}
              <div className="inline-flex items-center rounded-[8px] border border-[#e1e8f0] bg-[#f8fafc] p-0.5 text-[11px] font-semibold dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={collapseToDomains}
                  className={`rounded-[6px] px-2.5 py-1 transition ${
                    activeHierarchyLevel === 1
                      ? "bg-[#10345b] text-white shadow-2xs dark:bg-blue-600"
                      : "text-slate-600 hover:bg-white hover:text-[#10345b] dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                  title="Tampilkan hanya ringkasan 5 Domain"
                >
                  Lv.1 Domain
                </button>
                <button
                  type="button"
                  onClick={collapseToAspects}
                  className={`rounded-[6px] px-2.5 py-1 transition ${
                    activeHierarchyLevel === 2
                      ? "bg-[#10345b] text-white shadow-2xs dark:bg-blue-600"
                      : "text-slate-600 hover:bg-white hover:text-[#10345b] dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                  title="Tampilkan sampai tingkat 19 Aspek"
                >
                  Lv.2 Aspek
                </button>
                <button
                  type="button"
                  onClick={expandAllHierarchy}
                  className={`rounded-[6px] px-2.5 py-1 transition ${
                    activeHierarchyLevel === 3
                      ? "bg-[#10345b] text-white shadow-2xs dark:bg-blue-600"
                      : "text-slate-600 hover:bg-white hover:text-[#10345b] dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                  title="Buka seluruh 38 Indikator"
                >
                  Lv.3 Semua Indikator
                </button>
              </div>
            </div>
          </div>

          {/* Pill Tabs Filter Cepat Domain */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#e1e8f0] dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedDomainFilter("ALL")}
              className={`inline-flex items-center gap-1.5 rounded-[7px] border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                selectedDomainFilter === "ALL"
                  ? "border-[#10345b] bg-[#10345b] text-white dark:border-blue-600 dark:bg-blue-600"
                  : "border-[#e1e8f0] bg-[#f8fafc] text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              <span>Semua Domain</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  selectedDomainFilter === "ALL"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {selectedOpd.filledCount}/38
              </span>
            </button>

            {domainSummaryRows.map((row) => {
              const isActive = selectedDomainFilter === row.domain.code;
              return (
                <button
                  key={row.domain.id}
                  type="button"
                  onClick={() => setSelectedDomainFilter(row.domain.code)}
                  className={`inline-flex items-center gap-1.5 rounded-[7px] border px-2.5 py-1.5 text-left text-[11px] font-semibold transition ${
                    isActive
                      ? "border-[#10345b] bg-[#10345b] text-white dark:border-blue-600 dark:bg-blue-600"
                      : "border-[#e1e8f0] bg-[#f8fafc] text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  <span>
                    D{row.domain.code}: {row.domain.name}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : row.filledInds === row.totalInds
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {row.filledInds}/{row.totalInds}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Satu Tabel Utuh dengan Header Kolom Bertingkat (2 Baris thead) */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              {/* Baris Header 1: Pengelompokan Kolom Utama */}
              <tr className="border-b border-white/15 bg-[#10345b] text-[11px] font-bold uppercase tracking-wider text-white">
                <th
                  rowSpan={2}
                  className="border-r border-white/15 px-4 py-3 align-middle"
                >
                  Hierarki Evaluasi EPSS (Domain ▸ Aspek ▸ Indikator)
                </th>
                <th
                  rowSpan={2}
                  className="w-[82px] border-r border-white/15 px-2.5 py-3 text-center align-middle"
                >
                  Bobot
                </th>
                <th
                  colSpan={2}
                  className="border-b border-r border-white/15 bg-[#142b45] px-3 py-2 text-center"
                >
                  Pemenuhan Bukti Dukung OPD
                </th>
                <th
                  colSpan={2}
                  className="border-b border-r border-white/15 bg-[#087f80] px-3 py-2 text-center"
                >
                  Tingkat Kematangan (Level 1–5)
                </th>
                <th
                  rowSpan={2}
                  className="w-[130px] px-4 py-3 text-right align-middle"
                >
                  Aksi
                </th>
              </tr>

              {/* Baris Header 2: Sub-Kolom */}
              <tr className="border-b border-[#cbd5e1] bg-[#f1f5f9] text-[11px] font-bold uppercase tracking-wider text-[#142b45] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <th className="w-[225px] border-r border-[#e1e8f0] px-3 py-2 dark:border-slate-700">
                  Berkas Dokumen
                </th>
                <th className="w-[135px] border-r border-[#e1e8f0] px-3 py-2 text-center dark:border-slate-700">
                  Status
                </th>
                <th className="w-[95px] border-r border-[#e1e8f0] px-2.5 py-2 text-center dark:border-slate-700">
                  Mandiri OPD
                </th>
                <th className="w-[180px] border-r border-[#e1e8f0] px-3 py-2 dark:border-slate-700">
                  Skor Akhir BPS
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#e1e8f0] dark:divide-slate-800">
              {domains
                .filter(
                  (dom) =>
                    selectedDomainFilter === "ALL" ||
                    dom.code === selectedDomainFilter
                )
                .map((dom) => {
                  const isDomainExpanded = expandedDomains[dom.code] ?? true;

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
                          asp.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase());
                        return matchStatus && matchQuery;
                      }),
                    }))
                    .filter((asp) => asp.indicators.length > 0);

                  if (filteredAspects.length === 0) return null;

                  // Hitung agregat tingkat Domain
                  const allDomInds = dom.aspects.flatMap((a) => a.indicators);
                  const domFilledCount = allDomInds.filter(
                    (i) => i.submission && i.submission.status !== "BELUM_DIISI"
                  ).length;
                  const domVerifiedCount = allDomInds.filter(
                    (i) => i.submission?.status === "TERVERIFIKASI"
                  ).length;
                  const domDocsCount = allDomInds.reduce(
                    (acc, i) => acc + (i.submission?.documents.length || 0),
                    0
                  );
                  const domSelfScored = allDomInds.filter(
                    (i) => i.submission?.selfScore
                  );
                  const avgDomSelf =
                    domSelfScored.length > 0
                      ? (
                          domSelfScored.reduce(
                            (acc, i) => acc + (i.submission?.selfScore || 0),
                            0
                          ) / domSelfScored.length
                        ).toFixed(2)
                      : "-";
                  const domBpsScored = allDomInds.filter(
                    (i) => i.submission?.maturityScore
                  );
                  const avgDomBps =
                    domBpsScored.length > 0
                      ? (
                          domBpsScored.reduce(
                            (acc, i) =>
                              acc + (i.submission?.maturityScore || 0),
                            0
                          ) / domBpsScored.length
                        ).toFixed(2)
                      : "-";

                  return (
                    <React.Fragment key={dom.id}>
                      {/* TINGKAT 1: BARIS DOMAIN */}
                      <tr
                        onClick={() =>
                          setExpandedDomains((prev) => ({
                            ...prev,
                            [dom.code]: !isDomainExpanded,
                          }))
                        }
                        className="cursor-pointer bg-[#10345b]/95 text-white transition hover:bg-[#10345b] dark:bg-slate-800 dark:hover:bg-slate-750"
                      >
                        <td className="border-r border-white/10 px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {isDomainExpanded ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-[#90dfd7]" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-[#90dfd7]" />
                            )}
                            <span className="rounded bg-[#087f80] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                              DOMAIN {dom.code}
                            </span>
                            <span className="text-[13px] font-bold">
                              {dom.name}
                            </span>
                            <span className="text-[11px] text-[#acc5df]">
                              ({dom.aspects.length} Aspek · {allDomInds.length}{" "}
                              Indikator)
                            </span>
                          </div>
                        </td>
                        <td className="border-r border-white/10 px-2.5 py-3 text-center font-mono text-[12px] font-bold text-[#90dfd7]">
                          {dom.weight}%
                        </td>
                        <td className="border-r border-white/10 px-3 py-3 text-[12px] text-[#acc5df]">
                          <span className="font-semibold text-white">
                            {domDocsCount}
                          </span>{" "}
                          berkas ({domFilledCount}/{allDomInds.length} terisi)
                        </td>
                        <td className="border-r border-white/10 px-3 py-3 text-center">
                          <span className="inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                            {domVerifiedCount}/{allDomInds.length} Terverifikasi
                          </span>
                        </td>
                        <td className="border-r border-white/10 px-2.5 py-3 text-center font-mono text-[12px] font-bold text-white">
                          {avgDomSelf}
                        </td>
                        <td className="border-r border-white/10 px-3 py-3 font-mono text-[12px] font-bold text-[#90dfd7]">
                          Rata-rata: {avgDomBps}
                        </td>
                        <td className="px-4 py-3 text-right text-[11px] font-medium text-[#acc5df]">
                          {isDomainExpanded ? "Tutup ▴" : "Buka ▾"}
                        </td>
                      </tr>

                      {/* TINGKAT 2: BARIS ASPEK */}
                      {isDomainExpanded &&
                        filteredAspects.map((asp) => {
                          const isAspectExpanded =
                            expandedAspects[asp.id] ?? true;
                          const aspTotal = asp.indicators.length;
                          const aspFilled = asp.indicators.filter(
                            (i) =>
                              i.submission &&
                              i.submission.status !== "BELUM_DIISI"
                          ).length;
                          const aspVerified = asp.indicators.filter(
                            (i) => i.submission?.status === "TERVERIFIKASI"
                          ).length;
                          const aspDocs = asp.indicators.reduce(
                            (acc, i) =>
                              acc + (i.submission?.documents.length || 0),
                            0
                          );
                          const aspSelfList = asp.indicators.filter(
                            (i) => i.submission?.selfScore
                          );
                          const avgAspSelf =
                            aspSelfList.length > 0
                              ? (
                                  aspSelfList.reduce(
                                    (acc, i) =>
                                      acc + (i.submission?.selfScore || 0),
                                    0
                                  ) / aspSelfList.length
                                ).toFixed(1)
                              : "-";
                          const aspBpsList = asp.indicators.filter(
                            (i) => i.submission?.maturityScore
                          );
                          const avgAspBps =
                            aspBpsList.length > 0
                              ? (
                                  aspBpsList.reduce(
                                    (acc, i) =>
                                      acc + (i.submission?.maturityScore || 0),
                                    0
                                  ) / aspBpsList.length
                                ).toFixed(1)
                              : "-";

                          return (
                            <React.Fragment key={asp.id}>
                              <tr
                                onClick={() =>
                                  setExpandedAspects((prev) => ({
                                    ...prev,
                                    [asp.id]: !isAspectExpanded,
                                  }))
                                }
                                className="cursor-pointer bg-[#ebf3ff]/75 text-[#10345b] transition hover:bg-[#dbeafe]/80 dark:bg-slate-800/70 dark:text-blue-200 dark:hover:bg-slate-800"
                              >
                                <td className="border-r border-[#e1e8f0] py-2.5 pl-8 pr-4 dark:border-slate-700">
                                  <div className="flex items-center gap-2">
                                    {isAspectExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#1557b0] dark:text-blue-400" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#1557b0] dark:text-blue-400" />
                                    )}
                                    <span className="rounded bg-[#1557b0]/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#1557b0] dark:bg-blue-900/60 dark:text-blue-300">
                                      Aspek {asp.code}
                                    </span>
                                    <span className="text-[12px] font-bold">
                                      {asp.name}
                                    </span>
                                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                      ({aspTotal} Indikator)
                                    </span>
                                  </div>
                                </td>
                                <td className="border-r border-[#e1e8f0] px-2.5 py-2.5 text-center font-mono text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                  {asp.weight}%
                                </td>
                                <td className="border-r border-[#e1e8f0] px-3 py-2.5 text-[11px] text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                  {aspDocs} berkas ({aspFilled}/{aspTotal}{" "}
                                  terisi)
                                </td>
                                <td className="border-r border-[#e1e8f0] px-3 py-2.5 text-center text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                  {aspVerified}/{aspTotal} selesai
                                </td>
                                <td className="border-r border-[#e1e8f0] px-2.5 py-2.5 text-center font-mono text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                                  {avgAspSelf}
                                </td>
                                <td className="border-r border-[#e1e8f0] px-3 py-2.5 font-mono text-[11px] font-semibold text-[#087f80] dark:border-slate-700 dark:text-teal-400">
                                  Rata-rata: {avgAspBps}
                                </td>
                                <td className="px-4 py-2.5 text-right text-[11px] font-medium text-[#1557b0] dark:text-blue-400">
                                  {isAspectExpanded
                                    ? "Sembunyikan"
                                    : "Tampilkan"}
                                </td>
                              </tr>

                              {/* TINGKAT 3: BARIS INDIKATOR */}
                              {isAspectExpanded &&
                                asp.indicators.map((ind) => {
                                  const sub = ind.submission;
                                  const docs = sub?.documents || [];
                                  const officialScore = sub?.maturityScore;
                                  const selfScore = sub?.selfScore;

                                  return (
                                    <tr
                                      key={ind.id}
                                      className="align-middle bg-white hover:bg-slate-50/90 dark:bg-slate-900 dark:hover:bg-slate-800/40"
                                    >
                                      {/* Kolom 1: Indikator dengan Konektor Pohon Bertingkat */}
                                      <td className="border-r border-[#e1e8f0] py-3 pl-12 pr-4 dark:border-slate-800">
                                        <div className="flex items-start gap-2.5">
                                          <span
                                            className="mt-0.5 select-none font-mono text-[12px] text-slate-300 dark:text-slate-600"
                                            aria-hidden="true"
                                          >
                                            └─
                                          </span>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="rounded bg-[#10345b]/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#10345b] dark:bg-blue-950 dark:text-blue-300">
                                                {ind.code}
                                              </span>
                                              <span className="font-semibold text-[#142b45] dark:text-white">
                                                {ind.name}
                                              </span>
                                            </div>

                                            <div className="mt-1 flex flex-wrap items-center gap-2.5">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setRubricModalIndicator(ind)
                                                }
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#087f80] hover:underline dark:text-teal-400"
                                              >
                                                <Info className="h-3 w-3" />
                                                <span>Rubrik Level 1–5</span>
                                              </button>

                                              {sub?.reviewerNotes && (
                                                <span
                                                  title={sub.reviewerNotes}
                                                  className="inline-flex max-w-[300px] items-center gap-1 truncate rounded border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-800 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300"
                                                >
                                                  <MessageSquare className="h-2.5 w-2.5 shrink-0" />
                                                  <span className="truncate">
                                                    Pembina: {sub.reviewerNotes}
                                                  </span>
                                                </span>
                                              )}

                                              {sub?.narrative &&
                                                !sub?.reviewerNotes && (
                                                  <span
                                                    title={sub.narrative}
                                                    className="inline-flex max-w-[280px] items-center gap-1 truncate text-[11px] text-slate-500 dark:text-slate-400"
                                                  >
                                                    <FileText className="h-3 w-3 shrink-0 text-slate-400" />
                                                    <span className="truncate">
                                                      {sub.narrative}
                                                    </span>
                                                  </span>
                                                )}
                                            </div>
                                          </div>
                                        </div>
                                      </td>

                                      {/* Kolom 2: Bobot Indikator */}
                                      <td className="border-r border-[#e1e8f0] px-2.5 py-3 text-center font-mono text-[11px] text-slate-500 dark:border-slate-800">
                                        {ind.totalWeight.toFixed(2)}%
                                      </td>

                                      {/* Kolom 3: Berkas Dokumen */}
                                      <td className="border-r border-[#e1e8f0] px-3 py-3 dark:border-slate-800">
                                        {docs.length > 0 ? (
                                          <div className="space-y-1">
                                            {docs.map((doc) => (
                                              <div
                                                key={doc.id}
                                                className="flex items-center justify-between gap-1.5 rounded-[6px] border border-[#e1e8f0] bg-[#f8fafc] px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
                                              >
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
                                                  className="flex min-w-0 items-center gap-1.5 text-left text-[11px] font-semibold text-[#1557b0] hover:underline dark:text-blue-400"
                                                  title={`Pratinjau: ${doc.originalName}`}
                                                >
                                                  <Eye className="h-3 w-3 shrink-0" />
                                                  <span className="truncate">
                                                    {doc.originalName}
                                                  </span>
                                                </button>
                                                <a
                                                  href={doc.filePath}
                                                  download={doc.originalName}
                                                  className="shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                                  title={`Unduh (${formatBytes(
                                                    doc.fileSize
                                                  )})`}
                                                >
                                                  <Download className="h-3 w-3" />
                                                </a>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-[11px] text-slate-400">
                                            Belum ada berkas
                                          </span>
                                        )}
                                      </td>

                                      {/* Kolom 4: Status Verifikasi */}
                                      <td className="border-r border-[#e1e8f0] px-3 py-3 text-center dark:border-slate-800">
                                        {renderStatusBadge(sub?.status)}
                                      </td>

                                      {/* Kolom 5: Mandiri OPD */}
                                      <td className="border-r border-[#e1e8f0] px-2.5 py-3 text-center dark:border-slate-800">
                                        {selfScore ? (
                                          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-[#142b45] dark:bg-slate-800 dark:text-white">
                                            Lvl {selfScore}
                                          </span>
                                        ) : (
                                          <span className="text-[11px] text-slate-400">
                                            -
                                          </span>
                                        )}
                                      </td>

                                      {/* Kolom 6: Skor Akhir BPS */}
                                      <td className="border-r border-[#e1e8f0] px-3 py-3 dark:border-slate-800">
                                        <div className="flex flex-col gap-1.5">
                                          {officialScore ? (
                                            <span
                                              className={`inline-flex w-fit items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-bold ${
                                                MATURITY_LEVEL_LABELS[
                                                  officialScore
                                                ]?.badgeClass || ""
                                              }`}
                                            >
                                              <Award className="h-3 w-3" />
                                              <span>
                                                {
                                                  MATURITY_LEVEL_LABELS[
                                                    officialScore
                                                  ]?.name
                                                }
                                              </span>
                                            </span>
                                          ) : (
                                            <span className="text-[11px] text-slate-400">
                                              Belum dinilai
                                            </span>
                                          )}

                                          {canReview && (
                                            <div className="flex items-center gap-1">
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
                                                  className={`h-5 w-5 rounded text-[10px] font-bold transition ${
                                                    officialScore === lvl
                                                      ? "bg-[#087f80] text-white"
                                                      : "border border-[#e1e8f0] bg-white text-slate-600 hover:border-[#087f80] hover:text-[#087f80] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                  }`}
                                                  title={`Tetapkan Skor BPS Level ${lvl}`}
                                                >
                                                  {lvl}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </td>

                                      {/* Kolom 7: Aksi */}
                                      <td className="whitespace-nowrap px-4 py-3 text-right">
                                        <div className="inline-flex items-center justify-end gap-1.5">
                                          {canUpload && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                openUploadModal(ind)
                                              }
                                              className={`inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1.5 text-[11px] font-semibold transition ${
                                                docs.length > 0
                                                  ? "border border-[#e1e8f0] bg-white text-[#142b45] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                  : "bg-[#10345b] text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
                                              }`}
                                            >
                                              <Upload className="h-3 w-3" />
                                              <span>
                                                {docs.length > 0
                                                  ? "Ubah"
                                                  : "Unggah"}
                                              </span>
                                            </button>
                                          )}

                                          {canReview && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                openReviewModal(ind)
                                              }
                                              className="inline-flex items-center gap-1 rounded-[6px] bg-[#087f80] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#066667]"
                                            >
                                              <MessageSquare className="h-3 w-3" />
                                              <span>Nilai</span>
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </React.Fragment>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Form Ringkas Pengisian & Unggah Bukti Dukung (Operator OPD & Superadmin) */}
      {uploadModalIndicator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-xl rounded-[12px] border border-[#e1e8f0] bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-[#e1e8f0] pb-4 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Indikator {uploadModalIndicator.code} ·{" "}
                    {selectedOpd.shortName}
                  </Badge>
                  <button
                    type="button"
                    onClick={() =>
                      setRubricModalIndicator(uploadModalIndicator)
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#087f80] hover:underline dark:text-teal-400"
                  >
                    <Info className="h-3 w-3" />
                    <span>Lihat Kriteria Rubrik</span>
                  </button>
                </div>
                <h3 className="mt-1.5 text-[17px] font-bold text-[#142b45] dark:text-white">
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

            {/* Daftar Berkas Terunggah Saat Ini */}
            {uploadModalIndicator.submission &&
              uploadModalIndicator.submission.documents.length > 0 && (
                <div className="mt-4 rounded-lg border border-[#e1e8f0] bg-[#f8fafc] p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-[12px] font-bold text-[#142b45] dark:text-white">
                    Berkas Bukti Saat Ini:
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {uploadModalIndicator.submission.documents.map((d) => (
                      <div
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#e1e8f0] bg-white px-3 py-1.5 text-[12px] dark:border-slate-700 dark:bg-slate-900"
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
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setReplaceDocId(
                                replaceDocId === d.id ? "" : d.id
                              )
                            }
                            className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                              replaceDocId === d.id
                                ? "bg-amber-500 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {replaceDocId === d.id ? "Akan Diganti" : "Ganti"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(d.id)}
                            className="rounded p-1 text-rose-600 hover:bg-rose-50"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
              {/* Langkah 1: Pilih Level Mandiri 1-5 dengan Tombol Cepat */}
              <div>
                <label className="block font-semibold text-[#142b45] dark:text-slate-200">
                  1. Pilih Klaim Tingkat Kematangan Mandiri (Level 1–5)
                </label>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {[
                    { lvl: 1, label: "Rintisan" },
                    { lvl: 2, label: "Terkelola" },
                    { lvl: 3, label: "Terdefinisi" },
                    { lvl: 4, label: "Terpadu" },
                    { lvl: 5, label: "Optimum" },
                  ].map((item) => (
                    <button
                      key={item.lvl}
                      type="button"
                      onClick={() => setUploadSelfScore(item.lvl)}
                      className={`flex flex-col items-center rounded-[8px] border p-2 text-center transition ${
                        uploadSelfScore === item.lvl
                          ? "border-[#10345b] bg-[#10345b] text-white shadow-xs dark:border-blue-600 dark:bg-blue-600"
                          : "border-[#e1e8f0] bg-white text-[#142b45] hover:border-[#1557b0] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      }`}
                    >
                      <span className="text-[14px] font-bold">
                        Level {item.lvl}
                      </span>
                      <span
                        className={`text-[10px] ${
                          uploadSelfScore === item.lvl
                            ? "text-[#90dfd7]"
                            : "text-slate-500"
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Langkah 2: Unggah Berkas Bukti */}
              <div>
                <label className="block font-semibold text-[#142b45] dark:text-slate-200">
                  2. Unggah Berkas Bukti Dukung (.pdf, .zip, .docx — Maks. 10 MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.zip,.docx,application/pdf,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="mt-1.5 block w-full rounded-[8px] border border-dashed border-[#1557b0] bg-[#ebf3ff]/30 p-2.5 text-[12px] file:mr-3 file:rounded-md file:border-0 file:bg-[#10345b] file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-white hover:file:bg-[#142b45] dark:border-blue-700 dark:bg-slate-800/60"
                />
                {replaceDocId && (
                  <p className="mt-1 text-[11px] font-medium text-amber-600">
                    Mode Ganti Berkas Aktif: Berkas baru akan menggantikan dokumen yang dipilih di atas.
                  </p>
                )}
              </div>

              {/* Langkah 3: Catatan / Keterangan Singkat (Opsional) */}
              <div>
                <label className="block font-semibold text-[#142b45] dark:text-slate-200">
                  3. Catatan / Keterangan Singkat{" "}
                  <span className="font-normal text-slate-400">(Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  value={uploadNarrative}
                  onChange={(e) => setUploadNarrative(e.target.value)}
                  placeholder="Opsional: Tambahkan keterangan singkat dokumen atau halaman rujukan bila diperlukan..."
                  className="mt-1.5 w-full rounded-[8px] border border-[#e1e8f0] p-2.5 text-[12px] leading-relaxed focus:border-[#1557b0] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[#e1e8f0] pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUploadModalIndicator(null)}
                  className="h-[38px] rounded-[8px] border border-[#e1e8f0] px-4 text-[12px] font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadSubmitting}
                  className="inline-flex h-[38px] items-center gap-2 rounded-[8px] bg-[#10345b] px-5 text-[12px] font-semibold text-white hover:bg-[#142b45]"
                >
                  <Upload className="h-4 w-4" />
                  <span>
                    {uploadSubmitting
                      ? "Menyimpan..."
                      : "Simpan Bukti"}
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

