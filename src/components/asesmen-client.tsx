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

  // Summary KPIs
  const totalAssessments = assessments.length;
  const activeCount = assessments.filter((a) => a.status === "AKTIF").length;
  const allResponses = assessments.flatMap((a) => a.responses);
  const submittedResponsesCount = allResponses.filter(
    (r) => r.status === "DIKIRIM" || r.status === "DIREVIU"
  ).length;
  const reviewedResponsesCount = allResponses.filter(
    (r) => r.status === "DIREVIU"
  ).length;

  return (
    <div className="mx-auto max-w-[1160px] space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#087f80] dark:text-teal-400">
            {effectiveRole === "OPERATOR_OPD"
              ? `ASESMEN KESIAPAN STATISTIK SEKTORAL — ${
                  userOpd?.shortName || "OPD"
                }`
              : "MANAJEMEN ASESMEN & PEMETAAN KESIAPAN OPD — PEMBINA BPS"}
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-[#142b45] dark:text-white">
            {effectiveRole === "OPERATOR_OPD"
              ? `Asesmen Kesiapan Statistik Sektoral — ${
                  userOpd?.shortName || "Perangkat Daerah"
                }`
              : "Asesmen Diagnostik & Pemetaan Kesiapan OPD"}
          </h1>
          <p className="mt-1 text-[14px] text-slate-600 dark:text-slate-400">
            {effectiveRole === "OPERATOR_OPD"
              ? "Isi instrumen asesmen dari Tim Pembina BPS Kabupaten Berau untuk memetakan kesiapan 5 domain EPSS, metadata INDAH, dan rekomendasi Romantik di instansi Anda."
              : "Buat paket asesmen kesiapan bagi Operator OPD, pantau skor kesiapan setiap perangkat daerah, dan berikan rekomendasi tindak lanjut pembinaan."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeAssessment && (
            <button
              type="button"
              onClick={() => handleExportCsv(activeAssessment)}
              className="inline-flex h-[42px] items-center gap-2 rounded-[8px] border border-[#e1e8f0] bg-white px-4 text-[13px] font-semibold text-[#142b45] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <Download className="h-4 w-4 text-[#1557b0]" />
              <span>Unduh Rekap CSV</span>
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-[#10345b] px-4 text-[13px] font-semibold text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Paket Asesmen Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              Paket Asesmen Tersedia
            </span>
            <ClipboardList className="h-5 w-5 text-[#1557b0]" />
          </div>
          <p className="mt-3 text-[32px] font-bold leading-none text-[#142b45] dark:text-white">
            {totalAssessments}
          </p>
          <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
            {activeCount} paket asesmen berstatus aktif dibuka
          </p>
        </div>

        <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              {effectiveRole === "OPERATOR_OPD"
                ? "Status Pengisian Instansi Anda"
                : "Total Respons OPD Masuk"}
            </span>
            <FileCheck2 className="h-5 w-5 text-[#087f80]" />
          </div>
          <p className="mt-3 text-[32px] font-bold leading-none text-[#142b45] dark:text-white">
            {effectiveRole === "OPERATOR_OPD" && userOpd
              ? `${
                  assessments.filter((a) =>
                    a.responses.some(
                      (r) =>
                        r.opdId === userOpd.id &&
                        (r.status === "DIKIRIM" || r.status === "DIREVIU")
                    )
                  ).length
                }/${totalAssessments}`
              : submittedResponsesCount}
          </p>
          <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
            {effectiveRole === "OPERATOR_OPD"
              ? "Asesmen telah dikirim ke Pembina BPS"
              : "Respons kuesioner OPD yang telah dikirim"}
          </p>
        </div>

        <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              Telah Direviu Pembina BPS
            </span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-[32px] font-bold leading-none text-[#142b45] dark:text-white">
            {reviewedResponsesCount}
          </p>
          <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
            Dilengkapi rekomendasi tindak lanjut pembinaan
          </p>
        </div>
      </div>

      {/* Assessment Selector Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#142b45] dark:text-white">
            Daftar Paket Asesmen Statistik Sektoral
          </h2>
          <span className="text-[12px] text-slate-500">
            Pilih paket asesmen untuk melihat rincian
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {assessments.map((item) => {
            const isSelected = activeAssessment?.id === item.id;
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
                onClick={() => setSelectedAssessmentId(item.id)}
                className={`cursor-pointer rounded-[12px] border p-5 transition ${
                  isSelected
                    ? "border-[#1557b0] bg-[#ebf3ff]/40 ring-2 ring-[#1557b0]/20 dark:border-blue-500 dark:bg-blue-950/30"
                    : "border-[#e1e8f0] bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.status === "AKTIF" ? "teal" : "secondary"
                      }
                    >
                      {item.status === "AKTIF" ? "Aktif Dibuka" : "Ditutup"}
                    </Badge>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-[#087f80]" />
                    <span>Batas: {formatDateId(item.dueDate)}</span>
                  </span>
                </div>

                <h3 className="mt-3 text-[17px] font-bold text-[#142b45] dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-[13px] text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e8f0] pt-3.5 text-[12px] dark:border-slate-800">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-[#10345b] dark:text-blue-300">
                      {item.questions.length} Pertanyaan
                    </span>
                    <span>·</span>
                    <span>
                      Sasaran:{" "}
                      <strong>
                        {item.targetOpdShortName || "Seluruh OPD"}
                      </strong>
                    </span>
                  </div>

                  {effectiveRole === "OPERATOR_OPD" && userOpd ? (
                    <div className="flex items-center gap-2">
                      {renderResponseBadge(myResponse?.status)}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFillModal(item, userOpd);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#10345b] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
                      >
                        <span>
                          {myResponse?.status === "DIKIRIM" ||
                          myResponse?.status === "DIREVIU"
                            ? "Lihat / Perbarui Jawaban"
                            : myResponse?.status === "DRAF"
                            ? "Lanjutkan Draf"
                            : "Mulai Isi Asesmen"}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-[#087f80] dark:text-teal-400">
                        {submittedCount}/{targetedCount} OPD Selesai ({progressPct}
                        %)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Assessment Workspace */}
      {activeAssessment && (
        <div className="rounded-[12px] border border-[#e1e8f0] bg-white dark:border-slate-800 dark:bg-slate-900">
          {/* Workspace Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1e8f0] p-5 dark:border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#087f80]">
                  RINCIAN PAKET ASESMEN TERPILIH
                </span>
                <Badge variant="secondary">
                  {activeAssessment.questions.length} Butir Instrumen
                </Badge>
              </div>
              <h2 className="mt-1 text-[19px] font-bold text-[#142b45] dark:text-white">
                {activeAssessment.title}
              </h2>
              <p className="mt-0.5 text-[12px] text-slate-500">
                Disusun oleh: {activeAssessment.createdByName} · Tenggat:{" "}
                {formatDateId(activeAssessment.dueDate)}
              </p>
            </div>

            {canManage && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(activeAssessment)}
                  className="inline-flex h-[38px] items-center gap-1.5 rounded-[8px] border border-[#e1e8f0] bg-[#f8fafc] px-3.5 text-[12px] font-semibold text-[#142b45] hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {activeAssessment.status === "AKTIF" ? (
                    <>
                      <Lock className="h-3.5 w-3.5 text-amber-600" />
                      <span>Tutup Pengisian</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Buka Kembali Asesmen</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Role-Specific Body: Operator OPD vs Pembina / Superadmin */}
          {effectiveRole === "OPERATOR_OPD" && userOpd ? (
            <div className="p-5 space-y-5">
              {(() => {
                const myResp = activeAssessment.responses.find(
                  (r) => r.opdId === userOpd.id
                );

                return (
                  <>
                    {/* Operator Status & Score Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-[#d0e2ff] bg-[#ebf3ff]/60 p-4 dark:border-blue-900 dark:bg-blue-950/40">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-[#10345b] dark:text-blue-200">
                            Status Asesmen {userOpd.name}:
                          </span>
                          {renderResponseBadge(myResp?.status)}
                        </div>
                        <p className="text-[12px] text-slate-600 dark:text-slate-300">
                          {myResp?.submittedAt
                            ? `Terakhir dikirim pada ${formatDateId(
                                myResp.submittedAt
                              )}`
                            : "Silakan lengkapi seluruh butir pertanyaan di bawah ini dan kirimkan kepada Pembina Sektoral BPS."}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {myResp?.readinessScore && (
                          <div className="rounded-lg bg-white px-3.5 py-2 text-right shadow-2xs dark:bg-slate-900">
                            <p className="text-[10px] font-semibold uppercase text-slate-400">
                              Skor Kesiapan Instansi
                            </p>
                            <p className="text-[16px] font-bold text-[#087f80] dark:text-teal-400">
                              Level{" "}
                              {myResp.readinessScore
                                .toFixed(2)
                                .replace(".", ",")}{" "}
                              ({myResp.readinessPct}%)
                            </p>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            openFillModal(activeAssessment, userOpd)
                          }
                          className="inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-[#10345b] px-4 text-[13px] font-semibold text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
                        >
                          <ClipboardList className="h-4 w-4" />
                          <span>
                            {myResp
                              ? "Perbarui / Lihat Jawaban Anda"
                              : "Mulai Isi Kuesioner Asesmen"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Pembina Feedback Box if Reviewed */}
                    {myResp?.pembinaFeedback && (
                      <div className="rounded-[10px] border border-teal-200 bg-teal-50/80 p-4 dark:border-teal-800 dark:bg-teal-950/40">
                        <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
                          <MessageSquare className="h-4 w-4 text-[#087f80]" />
                          <h4 className="text-[14px] font-bold">
                            Rekomendasi & Catatan Pembina Sektoral BPS
                          </h4>
                        </div>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-teal-950 dark:text-teal-100">
                          {myResp.pembinaFeedback}
                        </p>
                      </div>
                    )}

                    {/* List of Questions & Current OPD Answers */}
                    <div className="space-y-3">
                      <h3 className="text-[15px] font-bold text-[#142b45] dark:text-white">
                        Daftar Butir Pertanyaan & Jawaban Instansi Anda
                      </h3>
                      {activeAssessment.questions.map((q) => {
                        const ans = myResp?.answers.find(
                          (a) => a.questionId === q.id
                        );
                        return (
                          <div
                            key={q.id}
                            className="rounded-[10px] border border-[#e1e8f0] bg-[#f8fafc]/70 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10345b] text-[11px] font-bold text-white">
                                  {q.order}
                                </span>
                                <Badge variant="secondary">{q.domainCode}</Badge>
                                {q.indicatorRef && (
                                  <span className="text-[11px] font-mono font-semibold text-slate-500">
                                    Rujukan Indikator {q.indicatorRef}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-medium text-slate-400">
                                Bobot: {q.weight}
                              </span>
                            </div>

                            <p className="mt-2 text-[14px] font-semibold text-[#142b45] dark:text-white">
                              {q.questionText}
                            </p>
                            {q.helpText && (
                              <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                                {q.helpText}
                              </p>
                            )}

                            <div className="mt-3 rounded-lg border border-[#e1e8f0] bg-white p-3 text-[12px] dark:border-slate-700 dark:bg-slate-900">
                              {ans ? (
                                <div className="space-y-1">
                                  {q.questionType === "SCALE_1_5" &&
                                    ans.scaleValue && (
                                      <p className="font-bold text-[#087f80] dark:text-teal-400">
                                        Pilihan:{" "}
                                        {SCALE_LABELS[ans.scaleValue]?.title}
                                      </p>
                                    )}
                                  {q.questionType === "YES_NO" &&
                                    ans.yesNoValue && (
                                      <p className="font-bold text-[#10345b] dark:text-blue-300">
                                        Jawaban:{" "}
                                        {ans.yesNoValue === "YA"
                                          ? "YA (Sudah Dilaksanakan)"
                                          : "TIDAK (Belum Dilaksanakan)"}
                                      </p>
                                    )}
                                  {ans.textAnswer && (
                                    <p className="text-slate-600 dark:text-slate-300">
                                      Keterangan: {ans.textAnswer}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="italic text-slate-400">
                                  Belum diisi — klik tombol &ldquo;Mulai Isi
                                  Kuesioner Asesmen&rdquo; di atas.
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            /* Pembina Sektoral BPS & Superadmin View: Matrix of All Targeted OPDs */
            <div className="space-y-5 p-5">
              <div className="overflow-x-auto rounded-[10px] border border-[#e1e8f0] dark:border-slate-800">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#e1e8f0] bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                      <th className="px-5 py-3.5">
                        Organisasi Perangkat Daerah (OPD)
                      </th>
                      <th className="px-4 py-3.5">Status Pengisian</th>
                      <th className="px-4 py-3.5">Skor Kesiapan Asesmen</th>
                      <th className="px-4 py-3.5">
                        Ringkasan Kendala & Rekomendasi Pembina
                      </th>
                      <th className="px-5 py-3.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e8f0] dark:divide-slate-800">
                    {(activeAssessment.targetOpdId
                      ? opds.filter(
                          (o) => o.id === activeAssessment.targetOpdId
                        )
                      : opds
                    ).map((opd) => {
                      const resp = activeAssessment.responses.find(
                        (r) => r.opdId === opd.id
                      );
                      return (
                        <tr
                          key={opd.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-[#142b45] dark:text-white">
                              {opd.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {opd.code} · {opd.shortName}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            {renderResponseBadge(resp?.status)}
                            {resp?.submittedAt && (
                              <p className="mt-1 text-[11px] text-slate-500">
                                {formatDateId(resp.submittedAt)}
                              </p>
                            )}
                          </td>

                          <td className="w-[210px] px-4 py-4">
                            {resp?.readinessScore ? (
                              <div>
                                <div className="flex items-center justify-between text-[12px] font-bold">
                                  <span className="inline-flex items-center gap-1 text-[#10345b] dark:text-blue-300">
                                    <Award className="h-3.5 w-3.5 text-[#087f80]" />
                                    Level{" "}
                                    {resp.readinessScore
                                      .toFixed(2)
                                      .replace(".", ",")}
                                  </span>
                                  <span className="text-slate-500">
                                    {resp.readinessPct}%
                                  </span>
                                </div>
                                <div className="mt-1.5">
                                  <ProgressBar
                                    percentage={resp.readinessPct || 0}
                                    colorClass={
                                      (resp.readinessPct || 0) >= 75
                                        ? "bg-[#087f80]"
                                        : "bg-[#1557b0]"
                                    }
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[12px] text-slate-400">
                                Belum ada skor
                              </span>
                            )}
                          </td>

                          <td className="max-w-[340px] px-4 py-4">
                            {resp?.summaryNotes ? (
                              <p className="line-clamp-2 text-[12px] text-slate-700 dark:text-slate-300">
                                <strong>Catatan OPD:</strong> {resp.summaryNotes}
                              </p>
                            ) : (
                              <p className="text-[12px] italic text-slate-400">
                                Belum ada jawaban masuk dari Operator OPD
                              </p>
                            )}
                            {resp?.pembinaFeedback && (
                              <p className="mt-1 line-clamp-2 text-[11px] font-medium text-[#087f80] dark:text-teal-400">
                                <strong>Rekomendasi BPS:</strong>{" "}
                                {resp.pembinaFeedback}
                              </p>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              {resp && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openReviewModal(activeAssessment, resp)
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#087f80] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#066667]"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  <span>Periksa & Beri Rekomendasi</span>
                                </button>
                              )}

                              {effectiveRole === "SUPERADMIN" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openFillModal(activeAssessment, opd)
                                  }
                                  className="rounded-[7px] border border-[#e1e8f0] px-2.5 py-1.5 text-[11px] font-semibold text-[#142b45] hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                                >
                                  Isi / Ubah
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

              {/* Preview of Questions in this Assessment */}
              <div className="rounded-[10px] border border-[#e1e8f0] bg-[#f8fafc] p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <h3 className="text-[14px] font-bold text-[#142b45] dark:text-white">
                  Daftar Butir Pertanyaan dalam Paket Asesmen Ini (
                  {activeAssessment.questions.length} Pertanyaan)
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  {activeAssessment.questions.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-lg border border-[#e1e8f0] bg-white p-3 text-[12px] dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#10345b] dark:text-blue-300">
                          #{q.order} · {q.domainCode}{" "}
                          {q.indicatorRef ? `(${q.indicatorRef})` : ""}
                        </span>
                        <Badge variant="outline">
                          {q.questionType === "SCALE_1_5"
                            ? "Skala 1–5"
                            : q.questionType === "YES_NO"
                            ? "Ya / Tidak"
                            : "Isian Uraian"}
                        </Badge>
                      </div>
                      <p className="mt-1.5 font-medium text-[#142b45] dark:text-slate-200">
                        {q.questionText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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

