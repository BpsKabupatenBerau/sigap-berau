"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  Building2,
  Sparkles,
  FileCheck2,
  MessageSquare,
  Download,
  Lock,
  Unlock,
  Trash2,
  Send,
  Save,
  X,
  AlertCircle,
  Award,
  ChevronRight,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { UserRole } from "@/lib/roles";
import { formatDateId } from "@/lib/utils";
import {
  ASSESSMENT_PRESET_TEMPLATES,
  PresetQuestionItem,
} from "@/lib/asesmen-presets";

export interface SerializedAssessmentQuestion {
  id: string;
  order: number;
  domainCode: string;
  indicatorRef: string | null;
  questionText: string;
  helpText: string | null;
  questionType: "SCALE_1_5" | "YES_NO" | "TEXT";
  weight: number;
}

export interface SerializedAssessmentAnswer {
  id: string;
  questionId: string;
  scaleValue: number | null;
  yesNoValue: string | null;
  textAnswer: string | null;
}

export interface SerializedAssessmentResponse {
  id: string;
  assessmentId: string;
  opdId: string;
  opdName: string;
  opdShortName: string;
  status: string; // DRAF | DIKIRIM | DIREVIU
  readinessScore: number | null;
  readinessPct: number | null;
  summaryNotes: string | null;
  pembinaFeedback: string | null;
  submittedByName: string | null;
  reviewedByName: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  answers: SerializedAssessmentAnswer[];
}

export interface SerializedAssessment {
  id: string;
  title: string;
  description: string;
  category: string;
  periodYear: number;
  status: string; // AKTIF | DITUTUP
  dueDate: string;
  targetOpdId: string | null;
  targetOpdName: string | null;
  targetOpdShortName: string | null;
  createdByName: string;
  createdAt: string;
  questions: SerializedAssessmentQuestion[];
  responses: SerializedAssessmentResponse[];
}

export interface OpdSimple {
  id: string;
  code: string;
  name: string;
  shortName: string;
}

const SCALE_LABELS: Record<number, { title: string; desc: string }> = {
  1: { title: "Level 1 — Rintisan", desc: "Belum ada pedoman / baru inisiatif" },
  2: { title: "Level 2 — Terkelola", desc: "Ada draf / bukti pelaksanaan awal" },
  3: { title: "Level 3 — Terdefinisi", desc: "Sesuai SOP / Juknis & baku" },
  4: { title: "Level 4 — Terpadu", desc: "Terintegrasi & direviu berkala" },
  5: { title: "Level 5 — Optimum", desc: "Pemutakhiran berkelanjutan" },
};

export function AsesmenClient({
  effectiveRole,
  userOpd,
  opds,
  assessments,
}: {
  effectiveRole: UserRole;
  userOpd: OpdSimple | null;
  opds: OpdSimple[];
  assessments: SerializedAssessment[];
}) {
  const router = useRouter();
  const canManage =
    effectiveRole === "PEMBINA_SEKTORAL" || effectiveRole === "SUPERADMIN";

  const [selectedAssessmentId, setSelectedAssessmentId] =
    React.useState<string>(assessments[0]?.id || "");
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  // Pop-up Modal Daftar Respons OPD untuk Pembina / Superadmin
  const [managingAssessment, setManagingAssessment] =
    React.useState<SerializedAssessment | null>(null);

  // Fill Questionnaire Modal State (for Operator OPD / Superadmin)
  const [fillingAssessment, setFillingAssessment] =
    React.useState<SerializedAssessment | null>(null);
  const [fillingOpd, setFillingOpd] = React.useState<OpdSimple | null>(null);
  const [answerState, setAnswerState] = React.useState<
    Record<
      string,
      {
        scaleValue: number | null;
        yesNoValue: string | null;
        textAnswer: string;
      }
    >
  >({});
  const [summaryNotes, setSummaryNotes] = React.useState("");
  const [submittingAnswers, setSubmittingAnswers] = React.useState(false);
  const [fillMessage, setFillMessage] = React.useState<string | null>(null);
  const [fillError, setFillError] = React.useState<string | null>(null);

  // Review Response Modal State (for Pembina Sektoral BPS / Superadmin)
  const [reviewingData, setReviewingData] = React.useState<{
    assessment: SerializedAssessment;
    response: SerializedAssessmentResponse;
  } | null>(null);
  const [pembinaFeedbackInput, setPembinaFeedbackInput] = React.useState("");
  const [savingReview, setSavingReview] = React.useState(false);
  const [reviewNotice, setReviewNotice] = React.useState<string | null>(null);

  // Create Assessment Builder State (for Pembina / Superadmin)
  const [newTitle, setNewTitle] = React.useState(
    ASSESSMENT_PRESET_TEMPLATES[0].name
  );
  const [newCategory, setNewCategory] = React.useState(
    ASSESSMENT_PRESET_TEMPLATES[0].category
  );
  const [newDescription, setNewDescription] = React.useState(
    ASSESSMENT_PRESET_TEMPLATES[0].description
  );
  const [newDueDate, setNewDueDate] = React.useState("2026-12-20");
  const [newTargetOpdId, setNewTargetOpdId] = React.useState("ALL");
  const [builderQuestions, setBuilderQuestions] = React.useState<
    PresetQuestionItem[]
  >(ASSESSMENT_PRESET_TEMPLATES[0].questions);
  const [creatingAssessment, setCreatingAssessment] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  const activeAssessment =
    assessments.find((a) => a.id === selectedAssessmentId) ||
    assessments[0] ||
    null;

  function applyPresetTemplate(presetId: string) {
    const found = ASSESSMENT_PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (!found) return;
    setNewTitle(found.name);
    setNewCategory(found.category);
    setNewDescription(found.description);
    setBuilderQuestions(found.questions.map((q, idx) => ({ ...q, order: idx + 1 })));
  }

  function addCustomQuestion() {
    setBuilderQuestions((prev) => [
      ...prev,
      {
        order: prev.length + 1,
        domainCode: "Domain 1",
        indicatorRef: "10101",
        questionText: "",
        helpText: "",
        questionType: "SCALE_1_5",
        weight: 1.0,
      },
    ]);
  }

  function removeQuestion(index: number) {
    if (builderQuestions.length <= 1) return;
    setBuilderQuestions((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((q, idx) => ({ ...q, order: idx + 1 }))
    );
  }

  function openFillModal(
    assessment: SerializedAssessment,
    targetOpd: OpdSimple
  ) {
    const existingResp = assessment.responses.find(
      (r) => r.opdId === targetOpd.id
    );
    const initialMap: Record<
      string,
      {
        scaleValue: number | null;
        yesNoValue: string | null;
        textAnswer: string;
      }
    > = {};

    for (const q of assessment.questions) {
      const prevAns = existingResp?.answers.find((a) => a.questionId === q.id);
      initialMap[q.id] = {
        scaleValue:
          prevAns?.scaleValue ?? (q.questionType === "SCALE_1_5" ? 3 : null),
        yesNoValue:
          prevAns?.yesNoValue ?? (q.questionType === "YES_NO" ? "YA" : null),
        textAnswer: prevAns?.textAnswer || "",
      };
    }

    setFillingAssessment(assessment);
    setFillingOpd(targetOpd);
    setAnswerState(initialMap);
    setSummaryNotes(existingResp?.summaryNotes || "");
    setFillMessage(null);
    setFillError(null);
  }

  function openReviewModal(
    assessment: SerializedAssessment,
    response: SerializedAssessmentResponse
  ) {
    setReviewingData({ assessment, response });
    setPembinaFeedbackInput(
      response.pembinaFeedback ||
        `Berdasarkan hasil asesmen ${response.opdShortName} (Skor Kesiapan: ${
          response.readinessScore?.toFixed(2).replace(".", ",") || "-"
        }), tim Pembina BPS merekomendasikan percepatan kelengkapan dokumen bukti Level 3–4 dan pemutakhiran metadata pada aplikasi INDAH BPS.`
    );
    setReviewNotice(null);
  }

  async function handleCreateAssessment(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    const validQuestions = builderQuestions.filter(
      (q) => q.questionText.trim().length > 0
    );
    if (validQuestions.length === 0) {
      setCreateError("Mohon isi minimal 1 teks pertanyaan asesmen.");
      return;
    }

    setCreatingAssessment(true);
    try {
      const res = await fetch("/api/asesmen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ASSESSMENT",
          title: newTitle,
          description: newDescription,
          category: newCategory,
          periodYear: 2026,
          dueDate: newDueDate,
          targetOpdId: newTargetOpdId,
          questions: validQuestions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Gagal menerbitkan asesmen.");
        setCreatingAssessment(false);
        return;
      }

      setShowCreateModal(false);
      if (data.assessmentId) {
        setSelectedAssessmentId(data.assessmentId);
      }
      router.refresh();
    } catch {
      setCreateError("Terjadi gangguan jaringan saat menyimpan asesmen.");
    } finally {
      setCreatingAssessment(false);
    }
  }

  async function handleToggleStatus(assessment: SerializedAssessment) {
    const nextStatus = assessment.status === "AKTIF" ? "DITUTUP" : "AKTIF";
    await fetch("/api/asesmen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TOGGLE_STATUS",
        assessmentId: assessment.id,
        status: nextStatus,
      }),
    });
    router.refresh();
  }

  async function handleSaveOrSubmitAnswers(submitMode: "DRAF" | "DIKIRIM") {
    if (!fillingAssessment || !fillingOpd) return;
    setSubmittingAnswers(true);
    setFillError(null);
    setFillMessage(null);

    try {
      const answersPayload = fillingAssessment.questions.map((q) => {
        const current = answerState[q.id];
        return {
          questionId: q.id,
          scaleValue: current?.scaleValue ?? null,
          yesNoValue: current?.yesNoValue ?? null,
          textAnswer: current?.textAnswer ?? "",
        };
      });

      const res = await fetch("/api/asesmen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_RESPONSE",
          assessmentId: fillingAssessment.id,
          opdId: fillingOpd.id,
          submitMode,
          summaryNotes,
          answers: answersPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFillError(data.error || "Gagal menyimpan jawaban asesmen.");
        setSubmittingAnswers(false);
        return;
      }

      setFillMessage(data.message);
      router.refresh();
      setTimeout(() => {
        setFillingAssessment(null);
      }, 900);
    } catch {
      setFillError("Gagal menghubungi peladen. Periksa koneksi Anda.");
    } finally {
      setSubmittingAnswers(false);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewingData) return;
    setSavingReview(true);
    setReviewNotice(null);

    try {
      const res = await fetch("/api/asesmen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVIEW_RESPONSE",
          responseId: reviewingData.response.id,
          pembinaFeedback: pembinaFeedbackInput,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewNotice(data.message);
        router.refresh();
        setTimeout(() => {
          setReviewingData(null);
        }, 900);
      }
    } finally {
      setSavingReview(false);
    }
  }

  function handleExportCsv(assessment: SerializedAssessment) {
    const header =
      "Nama Asesmen,Instansi OPD,Status Pengisian,Skor Kesiapan (1-5),Persentase Kesiapan (%),Catatan OPD,Rekomendasi Pembina BPS\n";
    const targetedOpds = assessment.targetOpdId
      ? opds.filter((o) => o.id === assessment.targetOpdId)
      : opds;

    const rows = targetedOpds
      .map((o) => {
        const r = assessment.responses.find((resp) => resp.opdId === o.id);
        return `"${assessment.title.replace(/"/g, '""')}","${o.name}","${
          r?.status || "BELUM_MENGISI"
        }","${
          r?.readinessScore
            ? r.readinessScore.toFixed(2).replace(".", ",")
            : "-"
        }","${r?.readinessPct ? `${r.readinessPct}%` : "-"}","${(
          r?.summaryNotes || ""
        ).replace(/"/g, '""')}","${(r?.pembinaFeedback || "").replace(
          /"/g,
          '""'
        )}"`;
      })
      .join("\n");

    const blob = new Blob([header + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Hasil_Asesmen_SIGAP_Berau_${assessment.periodYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderResponseBadge(status?: string) {
    switch (status) {
      case "DIREVIU":
        return <Badge variant="success">Telah Direviu Pembina</Badge>;
      case "DIKIRIM":
        return <Badge variant="teal">Sudah Dikirim OPD</Badge>;
      case "DRAF":
        return <Badge variant="warning">Draf Tersimpan</Badge>;
      default:
        return <Badge variant="outline">Belum Mengisi</Badge>;
    }
  }

  // Filter daftar paket asesmen berdasarkan pencarian, kategori, dan status
  const categories = Array.from(
    new Set(assessments.map((a) => a.category))
  );

  const filteredAssessments = assessments.filter((item) => {
    const matchQuery =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory =
      categoryFilter === "ALL" || item.category === categoryFilter;

    if (!matchQuery || !matchCategory) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "AKTIF" || statusFilter === "DITUTUP") {
      return item.status === statusFilter;
    }

    if (effectiveRole === "OPERATOR_OPD" && userOpd) {
      const myResp = item.responses.find((r) => r.opdId === userOpd.id);
      if (statusFilter === "SUDAH_DIISI") {
        return myResp?.status === "DIKIRIM" || myResp?.status === "DIREVIU";
      }
      if (statusFilter === "BELUM_DIISI") {
        return !myResp || myResp.status === "DRAF";
      }
    }

    return true;
  });

  // Sinkronkan managingAssessment bila data ter-refresh dari server
  const currentManagedAssessment = managingAssessment
    ? assessments.find((a) => a.id === managingAssessment.id) ||
      managingAssessment
    : null;

  return (
    <div className="mx-auto max-w-[1160px] space-y-5">
      {/* Header Ringkas */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#087f80] dark:text-teal-400">
            {effectiveRole === "OPERATOR_OPD"
              ? `ASESMEN KESIAPAN STATISTIK SEKTORAL — ${
                  userOpd?.shortName || "OPD"
                }`
              : "MANAJEMEN ASESMEN & PEMETAAN KESIAPAN OPD — PEMBINA BPS"}
          </p>
          <h1 className="mt-1 text-[24px] font-bold tracking-tight text-[#142b45] dark:text-white">
            {effectiveRole === "OPERATOR_OPD"
              ? `Asesmen Kesiapan — ${userOpd?.shortName || "Perangkat Daerah"}`
              : "Asesmen Diagnostik & Pemetaan Kesiapan OPD"}
          </h1>
          <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">
            Pilih kartu asesmen di bawah ini untuk mengerjakan kuesioner atau
            memeriksa hasil melalui jendela pop-up.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-[40px] items-center gap-2 rounded-[8px] bg-[#10345b] px-4 text-[13px] font-semibold text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Paket Asesmen Baru</span>
          </button>
        )}
      </div>

      {/* Bilah Pencarian & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#e1e8f0] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul atau topik paket asesmen..."
            className="h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-[#f8fafc] pl-9 pr-3 text-[13px] focus:border-[#1557b0] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-[38px] rounded-[8px] border border-[#e1e8f0] bg-[#f8fafc] px-3 text-[12px] font-semibold text-[#142b45] focus:border-[#1557b0] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Kategori ({assessments.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[38px] rounded-[8px] border border-[#e1e8f0] bg-[#f8fafc] px-3 text-[12px] font-semibold text-[#142b45] focus:border-[#1557b0] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Status</option>
            <option value="AKTIF">Status: Aktif Dibuka</option>
            <option value="DITUTUP">Status: Ditutup</option>
            {effectiveRole === "OPERATOR_OPD" && (
              <>
                <option value="BELUM_DIISI">Belum Dikirim OPD</option>
                <option value="SUDAH_DIISI">Sudah Dikirim OPD</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Daftar Kartu Paket Asesmen */}
      {filteredAssessments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredAssessments.map((item) => {
            const myResponse = userOpd
              ? item.responses.find((r) => r.opdId === userOpd.id)
              : null;
            const targetedCount = item.targetOpdId ? 1 : opds.length;
            const submittedCount = item.responses.filter(
              (r) => r.status === "DIKIRIM" || r.status === "DIREVIU"
            ).length;
            const progressPct =
              targetedCount > 0
                ? Math.round((submittedCount / targetedCount) * 100)
                : 0;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-[12px] border border-[#e1e8f0] bg-white p-5 shadow-xs transition hover:border-[#1557b0]/50 dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  {/* Baris Lencana Atas */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          item.status === "AKTIF" ? "teal" : "secondary"
                        }
                      >
                        {item.status === "AKTIF" ? "Aktif Dibuka" : "Ditutup"}
                      </Badge>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-[#087f80]" />
                      <span>Batas: {formatDateId(item.dueDate)}</span>
                    </span>
                  </div>

                  {/* Judul & Deskripsi */}
                  <h2 className="mt-3 text-[17px] font-bold text-[#142b45] dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-[13px] text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>

                  {/* Info Meta Ringkas */}
                  <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[12px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-[#10345b] dark:text-blue-300">
                      {item.questions.length} Pertanyaan
                    </span>
                    <span>·</span>
                    <span>
                      Sasaran:{" "}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {item.targetOpdShortName || "Seluruh OPD"}
                      </strong>
                    </span>
                    {effectiveRole === "OPERATOR_OPD" &&
                      myResponse?.readinessScore && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 font-bold text-[#087f80] dark:text-teal-400">
                            <Award className="h-3.5 w-3.5" />
                            Skor Anda:{" "}
                            {myResponse.readinessScore
                              .toFixed(2)
                              .replace(".", ",")}{" "}
                            ({myResponse.readinessPct}%)
                          </span>
                        </>
                      )}
                  </div>

                  {/* Cuplikan Umpan Balik Pembina jika sudah direviu (Operator OPD) */}
                  {effectiveRole === "OPERATOR_OPD" &&
                    myResponse?.pembinaFeedback && (
                      <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50/70 px-3 py-2 text-[12px] text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                        <p className="line-clamp-2">
                          <strong>Catatan Pembina BPS:</strong>{" "}
                          {myResponse.pembinaFeedback}
                        </p>
                      </div>
                    )}

                  {/* Bar Progres Pengumpulan untuk Pembina / Superadmin */}
                  {canManage && (
                    <div className="mt-3.5 rounded-lg border border-[#e1e8f0] bg-[#f8fafc] p-3 dark:border-slate-800 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between text-[12px] font-semibold">
                        <span className="text-[#142b45] dark:text-slate-200">
                          Progres Respons OPD: {submittedCount}/{targetedCount}{" "}
                          OPD
                        </span>
                        <span className="text-[#087f80] dark:text-teal-400">
                          {progressPct}%
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar
                          percentage={progressPct}
                          colorClass={
                            progressPct >= 70 ? "bg-[#087f80]" : "bg-[#1557b0]"
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Kartu: Status & Tombol Pop-up */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#e1e8f0] pt-3.5 dark:border-slate-800">
                  {effectiveRole === "OPERATOR_OPD" && userOpd ? (
                    <>
                      <div>{renderResponseBadge(myResponse?.status)}</div>
                      <button
                        type="button"
                        disabled={
                          item.status !== "AKTIF" && !myResponse
                        }
                        onClick={() => openFillModal(item, userOpd)}
                        className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#10345b] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#142b45] disabled:opacity-50 dark:bg-[#1557b0]"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        <span>
                          {myResponse?.status === "DIKIRIM" ||
                          myResponse?.status === "DIREVIU"
                            ? "Lihat / Perbarui di Pop-up"
                            : myResponse?.status === "DRAF"
                            ? "Lanjutkan Asesmen"
                            : "Kerjakan Asesmen"}
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className="inline-flex h-[34px] items-center gap-1 rounded-[7px] border border-[#e1e8f0] bg-[#f8fafc] px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          title={
                            item.status === "AKTIF"
                              ? "Tutup Pengisian"
                              : "Buka Kembali"
                          }
                        >
                          {item.status === "AKTIF" ? (
                            <>
                              <Lock className="h-3 w-3 text-amber-600" />
                              <span>Tutup</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3 w-3 text-emerald-600" />
                              <span>Buka</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportCsv(item)}
                          className="inline-flex h-[34px] items-center gap-1 rounded-[7px] border border-[#e1e8f0] bg-[#f8fafc] px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          title="Unduh Rekap CSV"
                        >
                          <Download className="h-3 w-3 text-[#1557b0]" />
                          <span>CSV</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setManagingAssessment(item)}
                        className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] bg-[#10345b] px-3.5 text-[12px] font-semibold text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        <span>Buka & Reviu Respons OPD</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-10 text-center text-[13px] text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Tidak ada kartu paket asesmen yang sesuai dengan filter pencarian Anda.
        </div>
      )}

      {/* POP-UP MODAL DAFTAR RESPONS OPD (Untuk Pembina Sektoral & Superadmin) */}
      {currentManagedAssessment && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[12px] border border-[#e1e8f0] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-[#e1e8f0] bg-[#10345b] px-6 py-4 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="teal">
                    {currentManagedAssessment.category}
                  </Badge>
                  <span className="text-[11px] text-[#90dfd7]">
                    {currentManagedAssessment.questions.length} Pertanyaan ·
                    Batas: {formatDateId(currentManagedAssessment.dueDate)}
                  </span>
                </div>
                <h3 className="mt-1 text-[18px] font-bold text-white">
                  {currentManagedAssessment.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setManagingAssessment(null)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="overflow-x-auto rounded-[10px] border border-[#e1e8f0] dark:border-slate-800">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#e1e8f0] bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                      <th className="px-4 py-3">Perangkat Daerah (OPD)</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Skor Kesiapan</th>
                      <th className="px-3 py-3">Catatan & Rekomendasi</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e8f0] dark:divide-slate-800">
                    {(currentManagedAssessment.targetOpdId
                      ? opds.filter(
                          (o) => o.id === currentManagedAssessment.targetOpdId
                        )
                      : opds
                    ).map((opd) => {
                      const resp = currentManagedAssessment.responses.find(
                        (r) => r.opdId === opd.id
                      );
                      return (
                        <tr
                          key={opd.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-3">
                            <p className="font-bold text-[#142b45] dark:text-white">
                              {opd.shortName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {opd.name}
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            {renderResponseBadge(resp?.status)}
                          </td>
                          <td className="px-3 py-3">
                            {resp?.readinessScore ? (
                              <span className="font-bold text-[#087f80] dark:text-teal-400">
                                Lvl{" "}
                                {resp.readinessScore
                                  .toFixed(2)
                                  .replace(".", ",")}{" "}
                                ({resp.readinessPct}%)
                              </span>
                            ) : (
                              <span className="text-[12px] text-slate-400">
                                -
                              </span>
                            )}
                          </td>
                          <td className="max-w-[260px] px-3 py-3 text-[12px]">
                            {resp?.pembinaFeedback ? (
                              <p className="line-clamp-2 text-[#087f80] dark:text-teal-400">
                                <strong>BPS:</strong> {resp.pembinaFeedback}
                              </p>
                            ) : resp?.summaryNotes ? (
                              <p className="line-clamp-2 text-slate-600 dark:text-slate-300">
                                {resp.summaryNotes}
                              </p>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {resp && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openReviewModal(
                                      currentManagedAssessment,
                                      resp
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-[7px] bg-[#087f80] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#066667]"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  <span>Reviu</span>
                                </button>
                              )}

                              {effectiveRole === "SUPERADMIN" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openFillModal(currentManagedAssessment, opd)
                                  }
                                  className="inline-flex items-center gap-1 rounded-[7px] border border-[#e1e8f0] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#142b45] hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                  <ClipboardList className="h-3 w-3" />
                                  <span>Kerjakan</span>
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

            <div className="flex justify-end border-t border-[#e1e8f0] bg-[#f8fafc] px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setManagingAssessment(null)}
                className="h-[38px] rounded-[8px] border border-[#e1e8f0] bg-white px-4 text-[12px] font-semibold dark:border-slate-700 dark:bg-slate-800"
              >
                Tutup Pop-up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Fill Assessment Questionnaire (Operator OPD / Superadmin) */}
      {fillingAssessment && fillingOpd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[12px] border border-[#e1e8f0] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#e1e8f0] bg-[#10345b] px-6 py-4 text-white">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#90dfd7]">
                  FORMULIR PENGISIAN ASESMEN OPD · {fillingOpd.shortName}
                </span>
                <h3 className="mt-0.5 text-[18px] font-bold text-white">
                  {fillingAssessment.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFillingAssessment(null)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-[13px]">
              {fillError && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{fillError}</span>
                </div>
              )}

              {fillMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 font-medium text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{fillMessage}</span>
                </div>
              )}

              {(() => {
                const existingResp = fillingAssessment.responses.find(
                  (r) => r.opdId === fillingOpd.id
                );
                if (!existingResp?.pembinaFeedback) return null;
                return (
                  <div className="rounded-[10px] border border-teal-200 bg-teal-50/80 p-3.5 text-[12px] text-teal-950 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                    <p className="font-bold">
                      Rekomendasi & Catatan Pembina Sektoral BPS:
                    </p>
                    <p className="mt-1 leading-relaxed">
                      {existingResp.pembinaFeedback}
                    </p>
                  </div>
                );
              })()}

              {fillingAssessment.questions.map((q) => {
                const currentAns = answerState[q.id] || {
                  scaleValue: 3,
                  yesNoValue: "YA",
                  textAnswer: "",
                };

                return (
                  <div
                    key={q.id}
                    className="rounded-[10px] border border-[#e1e8f0] bg-[#f8fafc] p-4 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10345b] text-[11px] font-bold text-white">
                          {q.order}
                        </span>
                        <Badge variant="secondary">{q.domainCode}</Badge>
                        {q.indicatorRef && (
                          <span className="text-[11px] font-mono text-slate-500">
                            Indikator {q.indicatorRef}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Bobot: {q.weight}
                      </span>
                    </div>

                    <p className="mt-2 text-[14px] font-bold text-[#142b45] dark:text-white">
                      {q.questionText}
                    </p>
                    {q.helpText && (
                      <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                        {q.helpText}
                      </p>
                    )}

                    {/* Input Controls by Question Type */}
                    {q.questionType === "SCALE_1_5" && (
                      <div className="mt-3 space-y-2.5">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                          {[1, 2, 3, 4, 5].map((lvl) => {
                            const active = currentAns.scaleValue === lvl;
                            return (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() =>
                                  setAnswerState((prev) => ({
                                    ...prev,
                                    [q.id]: {
                                      ...currentAns,
                                      scaleValue: lvl,
                                    },
                                  }))
                                }
                                className={`flex flex-col items-start rounded-[8px] border p-2.5 text-left transition ${
                                  active
                                    ? "border-[#087f80] bg-[#087f80] text-white"
                                    : "border-[#e1e8f0] bg-white text-[#142b45] hover:border-[#087f80] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                }`}
                              >
                                <span className="text-[12px] font-bold">
                                  {SCALE_LABELS[lvl].title}
                                </span>
                                <span
                                  className={`mt-0.5 text-[10px] leading-snug ${
                                    active ? "text-[#90dfd7]" : "text-slate-500"
                                  }`}
                                >
                                  {SCALE_LABELS[lvl].desc}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          value={currentAns.textAnswer}
                          onChange={(e) =>
                            setAnswerState((prev) => ({
                              ...prev,
                              [q.id]: {
                                ...currentAns,
                                textAnswer: e.target.value,
                              },
                            }))
                          }
                          placeholder="Tambahkan keterangan bukti / kondisi saat ini di OPD (opsional)..."
                          className="h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[12px] dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                    )}

                    {q.questionType === "YES_NO" && (
                      <div className="mt-3 space-y-2.5">
                        <div className="flex flex-wrap gap-3">
                          {[
                            {
                              val: "YA",
                              label: "✓ YA — Sudah Dilaksanakan / Tersedia",
                            },
                            {
                              val: "TIDAK",
                              label: "✗ TIDAK — Belum Tersedia / Masih Draf",
                            },
                          ].map((opt) => {
                            const active = currentAns.yesNoValue === opt.val;
                            return (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() =>
                                  setAnswerState((prev) => ({
                                    ...prev,
                                    [q.id]: {
                                      ...currentAns,
                                      yesNoValue: opt.val,
                                    },
                                  }))
                                }
                                className={`rounded-[8px] border px-4 py-2 text-[12px] font-semibold transition ${
                                  active
                                    ? "border-[#10345b] bg-[#10345b] text-white dark:border-blue-500 dark:bg-blue-600"
                                    : "border-[#e1e8f0] bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          value={currentAns.textAnswer}
                          onChange={(e) =>
                            setAnswerState((prev) => ({
                              ...prev,
                              [q.id]: {
                                ...currentAns,
                                textAnswer: e.target.value,
                              },
                            }))
                          }
                          placeholder="Sebutkan nomor dokumen / tautan / keterangan pendukung..."
                          className="h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[12px] dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                    )}

                    {q.questionType === "TEXT" && (
                      <div className="mt-3">
                        <textarea
                          rows={3}
                          value={currentAns.textAnswer}
                          onChange={(e) =>
                            setAnswerState((prev) => ({
                              ...prev,
                              [q.id]: {
                                ...currentAns,
                                textAnswer: e.target.value,
                              },
                            }))
                          }
                          placeholder="Tuliskan uraian jawaban atau kendala teknis di instansi Anda..."
                          className="w-full rounded-[8px] border border-[#e1e8f0] bg-white p-3 text-[12px] dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              <div>
                <label className="block font-bold text-[#142b45] dark:text-white">
                  Ringkasan Kendala & Kebutuhan Pendampingan OPD
                </label>
                <textarea
                  rows={2}
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  placeholder="Tuliskan kesimpulan umum atau permintaan topik klinik pembinaan kepada BPS Kabupaten Berau..."
                  className="mt-1.5 w-full rounded-[8px] border border-[#e1e8f0] p-3 text-[12px] dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e8f0] bg-[#f8fafc] px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setFillingAssessment(null)}
                className="h-[40px] rounded-[8px] border border-[#e1e8f0] bg-white px-4 text-[13px] font-semibold dark:border-slate-700 dark:bg-slate-800"
              >
                Batal
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={submittingAnswers}
                  onClick={() => handleSaveOrSubmitAnswers("DRAF")}
                  className="inline-flex h-[40px] items-center gap-1.5 rounded-[8px] border border-[#10345b] bg-white px-4 text-[13px] font-semibold text-[#10345b] hover:bg-slate-50 dark:border-blue-400 dark:bg-slate-800 dark:text-blue-300"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Draf</span>
                </button>
                <button
                  type="button"
                  disabled={submittingAnswers}
                  onClick={() => handleSaveOrSubmitAnswers("DIKIRIM")}
                  className="inline-flex h-[40px] items-center gap-1.5 rounded-[8px] bg-[#087f80] px-5 text-[13px] font-semibold text-white hover:bg-[#066667]"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {submittingAnswers
                      ? "Mengirim..."
                      : "Kirim Jawaban ke Pembina BPS"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Pembina Sektoral Review & Feedback Modal */}
      {reviewingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[12px] border border-[#e1e8f0] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-[#e1e8f0] bg-[#10345b] px-6 py-4 text-white">
              <div>
                <Badge variant="teal">
                  Reviu Hasil Asesmen · {reviewingData.response.opdName}
                </Badge>
                <h3 className="mt-1 text-[18px] font-bold text-white">
                  {reviewingData.assessment.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewingData(null)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[13px]">
              {reviewNotice && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 font-medium text-emerald-800">
                  {reviewNotice}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e1e8f0] bg-[#f8fafc] p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <div>
                  <p className="text-[12px] text-slate-500">
                    Instansi Pengisi Asesmen
                  </p>
                  <p className="text-[15px] font-bold text-[#142b45] dark:text-white">
                    {reviewingData.response.opdName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-slate-500">
                    Skor Kesiapan Terhitung
                  </p>
                  <p className="text-[18px] font-bold text-[#087f80] dark:text-teal-400">
                    Level{" "}
                    {reviewingData.response.readinessScore
                      ?.toFixed(2)
                      .replace(".", ",") || "-"}{" "}
                    ({reviewingData.response.readinessPct || 0}%)
                  </p>
                </div>
              </div>

              {/* Answers Breakdown */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-[#142b45] dark:text-white">
                  Rincian Jawaban Operator OPD:
                </h4>
                {reviewingData.assessment.questions.map((q) => {
                  const ans = reviewingData.response.answers.find(
                    (a) => a.questionId === q.id
                  );
                  return (
                    <div
                      key={q.id}
                      className="rounded-lg border border-[#e1e8f0] p-3.5 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-bold text-[#10345b] dark:text-blue-300">
                          Pertanyaan #{q.order} ({q.domainCode})
                        </span>
                        {q.indicatorRef && (
                          <span>Indikator {q.indicatorRef}</span>
                        )}
                      </div>
                      <p className="mt-1 font-semibold text-[#142b45] dark:text-white">
                        {q.questionText}
                      </p>
                      <div className="mt-2 rounded bg-[#f8fafc] p-2.5 text-[12px] dark:bg-slate-800">
                        {ans ? (
                          <>
                            {ans.scaleValue && (
                              <p className="font-bold text-[#087f80]">
                                {SCALE_LABELS[ans.scaleValue]?.title}
                              </p>
                            )}
                            {ans.yesNoValue && (
                              <p className="font-bold text-[#10345b] dark:text-blue-300">
                                Jawaban: {ans.yesNoValue}
                              </p>
                            )}
                            {ans.textAnswer && (
                              <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                                {ans.textAnswer}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="italic text-slate-400">
                            Tidak dijawab
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block font-bold text-[#142b45] dark:text-white">
                    Catatan Rekomendasi & Tindak Lanjut Pembina Sektoral BPS
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={pembinaFeedbackInput}
                    onChange={(e) => setPembinaFeedbackInput(e.target.value)}
                    placeholder="Tuliskan arahan teknis, prioritas domain yang perlu diperbaiki, atau jadwal klinik pembinaan bagi OPD ini..."
                    className="mt-1.5 w-full rounded-[8px] border border-[#e1e8f0] p-3 text-[13px] dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewingData(null)}
                    className="h-[40px] rounded-[8px] border border-[#e1e8f0] px-4 font-semibold"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={savingReview}
                    className="h-[40px] rounded-[8px] bg-[#087f80] px-5 font-semibold text-white hover:bg-[#066667]"
                  >
                    {savingReview
                      ? "Menyimpan..."
                      : "Simpan Rekomendasi Pembina"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create New Assessment Builder (Pembina Sektoral BPS & Superadmin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[12px] border border-[#e1e8f0] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-[#e1e8f0] bg-[#10345b] px-6 py-4 text-white">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#90dfd7]">
                  PEMBUATAN INSTRUMEN ASESMEN PEMBINA BPS
                </span>
                <h3 className="mt-0.5 text-[18px] font-bold text-white">
                  Buat Paket Asesmen Baru untuk Operator OPD
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateAssessment}
              className="flex-1 overflow-y-auto p-6 space-y-5 text-[13px]"
            >
              {createError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
                  {createError}
                </div>
              )}

              {/* Quick Preset Selector */}
              <div className="rounded-[10px] border border-[#d0e2ff] bg-[#ebf3ff]/60 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#10345b] dark:text-blue-300">
                  <Sparkles className="h-4 w-4 text-[#087f80]" />
                  Gunakan Template Cepat Asesmen BPS Kabupaten Berau:
                </p>
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {ASSESSMENT_PRESET_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyPresetTemplate(tpl.id)}
                      className="rounded-[8px] border border-[#e1e8f0] bg-white p-2.5 text-left transition hover:border-[#1557b0] dark:border-slate-700 dark:bg-slate-900"
                    >
                      <p className="text-[12px] font-bold text-[#142b45] dark:text-white">
                        {tpl.category}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {tpl.questions.length} pertanyaan siap pakai
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#142b45] dark:text-white">
                    Judul Paket Asesmen
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#142b45] dark:text-white">
                    Kategori Asesmen
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="Diagnostik Pra-EPSS">
                      Diagnostik Pra-EPSS (5 Domain)
                    </option>
                    <option value="Kesiapan Metadata & Romantik">
                      Kesiapan Metadata INDAH & Romantik
                    </option>
                    <option value="Evaluasi Pasca-Pembinaan">
                      Evaluasi Tindak Lanjut Pasca-Pembinaan
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#142b45] dark:text-white">
                    Target Sasaran OPD
                  </label>
                  <select
                    value={newTargetOpdId}
                    onChange={(e) => setNewTargetOpdId(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="ALL">
                      Seluruh OPD Kabupaten Berau ({opds.length} OPD)
                    </option>
                    {opds.map((o) => (
                      <option key={o.id} value={o.id}>
                        Khusus {o.shortName} — {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#142b45] dark:text-white">
                    Batas Waktu Pengisian (Deadline)
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#142b45] dark:text-white">
                    Deskripsi & Petunjuk Pengisian
                  </label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-[#e1e8f0] p-2.5 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Dynamic Question Builder */}
              <div className="space-y-3 border-t border-[#e1e8f0] pt-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-bold text-[#142b45] dark:text-white">
                    Daftar Butir Pertanyaan ({builderQuestions.length} Soal)
                  </h4>
                  <button
                    type="button"
                    onClick={addCustomQuestion}
                    className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#ebf3ff] px-3 py-1.5 text-[12px] font-semibold text-[#1557b0] hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Pertanyaan</span>
                  </button>
                </div>

                {builderQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-[#e1e8f0] bg-[#f8fafc] p-3.5 space-y-2.5 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#10345b] dark:text-blue-300">
                        Butir Pertanyaan #{idx + 1}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={q.domainCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBuilderQuestions((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, domainCode: val } : item
                              )
                            );
                          }}
                          className="h-[32px] rounded border border-[#e1e8f0] bg-white px-2 text-[11px] font-semibold dark:border-slate-700 dark:bg-slate-900"
                        >
                          <option value="Domain 1">Domain 1 — SDI</option>
                          <option value="Domain 2">Domain 2 — Kualitas</option>
                          <option value="Domain 3">
                            Domain 3 — Proses Bisnis
                          </option>
                          <option value="Domain 4">
                            Domain 4 — Kelembagaan
                          </option>
                          <option value="Domain 5">Domain 5 — SSN</option>
                        </select>

                        <select
                          value={q.questionType}
                          onChange={(e) => {
                            const val = e.target.value as
                              | "SCALE_1_5"
                              | "YES_NO"
                              | "TEXT";
                            setBuilderQuestions((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, questionType: val }
                                  : item
                              )
                            );
                          }}
                          className="h-[32px] rounded border border-[#e1e8f0] bg-white px-2 text-[11px] font-semibold dark:border-slate-700 dark:bg-slate-900"
                        >
                          <option value="SCALE_1_5">
                            Skala Kematangan (1–5)
                          </option>
                          <option value="YES_NO">Pilihan Ya / Tidak</option>
                          <option value="TEXT">Isian Uraian / Kendala</option>
                        </select>

                        {builderQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(idx)}
                            className="rounded p-1 text-rose-600 hover:bg-rose-50"
                            title="Hapus Pertanyaan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      required
                      value={q.questionText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBuilderQuestions((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, questionText: val } : item
                          )
                        );
                      }}
                      placeholder="Tuliskan kalimat pertanyaan asesmen..."
                      className="h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[13px] dark:border-slate-700 dark:bg-slate-900"
                    />

                    <input
                      type="text"
                      value={q.helpText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBuilderQuestions((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, helpText: val } : item
                          )
                        );
                      }}
                      placeholder="Petunjuk teknis / keterangan kriteria penilaian (opsional)..."
                      className="h-[34px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 border-t border-[#e1e8f0] pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-[40px] rounded-[8px] border border-[#e1e8f0] px-4 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingAssessment}
                  className="h-[40px] rounded-[8px] bg-[#10345b] px-5 font-semibold text-white hover:bg-[#142b45]"
                >
                  {creatingAssessment
                    ? "Menerbitkan Asesmen..."
                    : "Terbitkan Paket Asesmen ke OPD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

