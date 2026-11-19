"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
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
  Search,
  Globe,
  Link2,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { UserRole } from "@/lib/roles";
import { formatDateId } from "@/lib/utils";
import {
  ASSESSMENT_PRESET_TEMPLATES,
  AssessmentQuestionType,
  ARAH_PEMBINAAN_RECOMMENDATIONS,
  getReadinessCategory,
  OFFICIAL_30_INSTRUMEN_QUESTIONS,
  PresetQuestionItem,
  READINESS_CATEGORIES,
  SCALE_0_3_DEFINITIONS,
} from "@/lib/asesmen-presets";

export interface SerializedAssessmentQuestion {
  id: string;
  order: number;
  domainCode: string;
  indicatorRef: string | null;
  questionText: string;
  helpText: string | null;
  questionType: AssessmentQuestionType;
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
  isPublic?: boolean;
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

const SCALE_1_5_LABELS: Record<number, { title: string; desc: string }> = {
  1: { title: "Level 1 — Rintisan", desc: "Belum ada pedoman / baru inisiatif" },
  2: { title: "Level 2 — Terkelola", desc: "Ada draf / bukti pelaksanaan awal" },
  3: { title: "Level 3 — Terdefinisi", desc: "Sesuai SOP / Juknis & baku" },
  4: { title: "Level 4 — Terpadu", desc: "Terintegrasi & direviu berkala" },
  5: { title: "Level 5 — Optimum", desc: "Pemutakhiran berkelanjutan" },
};

const SEVEN_ASPECT_OPTIONS = [
  "I. Kelembagaan dan Tata Kelola",
  "II. SDM dan Kompetensi",
  "III. Perencanaan & Pelaksanaan",
  "IV. Standar Data & Metadata",
  "V. Kualitas & Pengolahan Data",
  "VI. Integrasi, Koordinasi & Pemanfaatan",
  "VII. Diseminasi & Publikasi",
];

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

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showPedomanModal, setShowPedomanModal] = React.useState(false);

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
  const [newIsPublic, setNewIsPublic] = React.useState(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [builderQuestions, setBuilderQuestions] = React.useState<
    PresetQuestionItem[]
  >(ASSESSMENT_PRESET_TEMPLATES[0].questions);
  const [creatingAssessment, setCreatingAssessment] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  function applyPresetTemplate(presetId: string) {
    const found = ASSESSMENT_PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (!found) return;
    setNewTitle(found.name);
    setNewCategory(found.category);
    setNewDescription(found.description);
    setBuilderQuestions(
      found.questions.map((q, idx) => ({ ...q, order: idx + 1 }))
    );
  }

  function addCustomQuestion() {
    setBuilderQuestions((prev) => [
      ...prev,
      {
        order: prev.length + 1,
        domainCode: SEVEN_ASPECT_OPTIONS[0],
        indicatorRef: `Aspek I.${prev.length + 1}`,
        questionText: "",
        helpText: "",
        questionType: "SCALE_0_3",
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
      const defaultScale =
        q.questionType === "SCALE_0_3"
          ? 2
          : q.questionType === "NUMBER"
          ? 0
          : q.questionType === "SCALE_1_5"
          ? 3
          : null;

      initialMap[q.id] = {
        scaleValue: prevAns?.scaleValue ?? defaultScale,
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
    const catInfo = getReadinessCategory(response.readinessPct);
    setReviewingData({ assessment, response });
    setPembinaFeedbackInput(
      response.pembinaFeedback ||
        `Kategori Kesiapan ${response.opdShortName}: ${catInfo.category.toUpperCase()} (${
          response.readinessPct ?? 0
        }%). Arahan Pembinaan BPS: ${catInfo.arahanPembinaan}`
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
          isPublic: newIsPublic,
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

  async function handleTogglePublic(assessment: SerializedAssessment) {
    const currentIsPublic = assessment.isPublic ?? true;
    await fetch("/api/asesmen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TOGGLE_PUBLIC",
        assessmentId: assessment.id,
        isPublic: !currentIsPublic,
      }),
    });
    router.refresh();
  }

  function handleCopyPublicLink(assessmentId: string) {
    const url = `${window.location.origin}/asesmen-publik?id=${encodeURIComponent(
      assessmentId
    )}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(assessmentId);
    setTimeout(() => setCopiedId(null), 2000);
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
      "Nama Asesmen,Instansi OPD,Status Pengisian,Nilai Kesiapan (%),Kategori Kesiapan,Catatan OPD,Arahan & Rekomendasi Pembina BPS\n";
    const targetedOpds = assessment.targetOpdId
      ? opds.filter((o) => o.id === assessment.targetOpdId)
      : opds;

    const rows = targetedOpds
      .map((o) => {
        const r = assessment.responses.find((resp) => resp.opdId === o.id);
        const cat = r?.readinessPct !== null && r?.readinessPct !== undefined
          ? getReadinessCategory(r.readinessPct).category
          : "-";
        return `"${assessment.title.replace(/"/g, '""')}","${o.name}","${
          r?.status || "BELUM_MENGISI"
        }","${r?.readinessPct !== null && r?.readinessPct !== undefined ? `${r.readinessPct}%` : "-"}","${cat}","${(
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
    a.download = `Hasil_Assessment_Kesiapan_OPD_Berau_${assessment.periodYear}.csv`;
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

  const categories = Array.from(new Set(assessments.map((a) => a.category)));

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
            INSTRUMEN ASSESSMENT PEMAHAMAN & KESIAPAN OPD · BPS KABUPATEN BERAU
          </p>
          <h1 className="mt-1 text-[24px] font-bold tracking-tight text-[#142b45] dark:text-white">
            {effectiveRole === "OPERATOR_OPD"
              ? `Assessment Kesiapan Statistik Sektoral — ${
                  userOpd?.shortName || "OPD"
                }`
              : "Assessment Pemahaman & Kesiapan OPD (7 Aspek)"}
          </h1>
          <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">
            Pemetaan pemahaman, kapasitas SDM, dan kesiapan Perangkat Daerah
            pada 7 Aspek Penyelenggaraan Statistik Sektoral (Skala 0–3 &
            Kapasitas Aktual).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPedomanModal(true)}
            className="inline-flex h-[40px] items-center gap-2 rounded-[8px] border border-[#e1e8f0] bg-white px-3.5 text-[12px] font-semibold text-[#10345b] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300"
          >
            <BookOpen className="h-4 w-4 text-[#087f80]" />
            <span>Pedoman Skala 0–3 & Kategori Kesiapan</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex h-[40px] items-center gap-2 rounded-[8px] bg-[#10345b] px-4 text-[13px] font-semibold text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Paket Assessment</span>
            </button>
          )}
        </div>
      </div>

      {/* Bilah Pencarian & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#e1e8f0] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul atau kategori instrumen assessment..."
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

      {/* Daftar Kartu Paket Assessment */}
      {filteredAssessments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredAssessments.map((item) => {
            const myResponse = userOpd
              ? item.responses.find((r) => r.opdId === userOpd.id)
              : null;
            const myCatInfo =
              myResponse?.readinessPct !== null &&
              myResponse?.readinessPct !== undefined
                ? getReadinessCategory(myResponse.readinessPct)
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
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant={
                          item.status === "AKTIF" ? "teal" : "secondary"
                        }
                      >
                        {item.status === "AKTIF" ? "Aktif Dibuka" : "Ditutup"}
                      </Badge>
                      <Badge
                        variant={
                          (item.isPublic ?? true) ? "success" : "outline"
                        }
                        className="inline-flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        <span>
                          {(item.isPublic ?? true)
                            ? "Umum (Tanpa Login)"
                            : "Wajib Login"}
                        </span>
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
                    {effectiveRole === "OPERATOR_OPD" && myCatInfo && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 font-bold text-[#087f80] dark:text-teal-400">
                          <Award className="h-3.5 w-3.5" />
                          Nilai: {myResponse?.readinessPct}% (
                          {myCatInfo.category})
                        </span>
                      </>
                    )}
                  </div>

                  {/* Cuplikan Umpan Balik Pembina jika sudah direviu */}
                  {effectiveRole === "OPERATOR_OPD" &&
                    myResponse?.pembinaFeedback && (
                      <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50/70 px-3 py-2 text-[12px] text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                        <p className="line-clamp-2">
                          <strong>Arahan Pembina BPS:</strong>{" "}
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

                {/* Footer Kartu */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#e1e8f0] pt-3.5 dark:border-slate-800">
                  {effectiveRole === "OPERATOR_OPD" && userOpd ? (
                    <>
                      <div>{renderResponseBadge(myResponse?.status)}</div>
                      <button
                        type="button"
                        disabled={item.status !== "AKTIF" && !myResponse}
                        onClick={() => openFillModal(item, userOpd)}
                        className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#10345b] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#142b45] disabled:opacity-50 dark:bg-[#1557b0]"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        <span>
                          {myResponse?.status === "DIKIRIM" ||
                          myResponse?.status === "DIREVIU"
                            ? "Lihat / Perbarui di Pop-up"
                            : myResponse?.status === "DRAF"
                            ? "Lanjutkan Assessment"
                            : "Kerjakan Assessment"}
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className="inline-flex h-[34px] items-center gap-1 rounded-[7px] border border-[#e1e8f0] bg-[#f8fafc] px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                          onClick={() => handleTogglePublic(item)}
                          className="inline-flex h-[34px] items-center gap-1 rounded-[7px] border border-[#e1e8f0] bg-[#f8fafc] px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <Globe className="h-3 w-3 text-[#087f80]" />
                          <span>
                            {(item.isPublic ?? true)
                              ? "Set Wajib Login"
                              : "Set Jadi Umum"}
                          </span>
                        </button>

                        {(item.isPublic ?? true) && (
                          <button
                            type="button"
                            onClick={() => handleCopyPublicLink(item.id)}
                            className="inline-flex h-[34px] items-center gap-1 rounded-[7px] border border-teal-200 bg-teal-50/70 px-2.5 text-[11px] font-semibold text-[#087f80] hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300"
                          >
                            <Link2 className="h-3 w-3" />
                            <span>
                              {copiedId === item.id
                                ? "Tautan Disalin!"
                                : "Link Umum"}
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleExportCsv(item)}
                          className="inline-flex h-[34px] items-center gap-1 rounded-[7px] border border-[#e1e8f0] bg-[#f8fafc] px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
          Tidak ada kartu paket assessment yang sesuai dengan filter pencarian
          Anda.
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
                      <th className="px-3 py-3">Nilai & Kategori Kesiapan</th>
                      <th className="px-3 py-3">Catatan & Arahan Pembinaan</th>
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
                      const catInfo =
                        resp?.readinessPct !== null &&
                        resp?.readinessPct !== undefined
                          ? getReadinessCategory(resp.readinessPct)
                          : null;

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
                            {catInfo ? (
                              <div className="flex flex-col items-start gap-1">
                                <span className="font-bold text-[#142b45] dark:text-white">
                                  {resp?.readinessPct}% (Rata-rata{" "}
                                  {resp?.readinessScore
                                    ?.toFixed(2)
                                    .replace(".", ",")}
                                  /3,00)
                                </span>
                                <Badge variant={catInfo.badgeVariant}>
                                  {catInfo.category}
                                </Badge>
                              </div>
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

      {/* MODAL 1: Fill Assessment Questionnaire (Skala 0-3 & Jumlah Aktual sesuai Instrumen BPS Berau) */}
      {fillingAssessment && fillingOpd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[12px] border border-[#e1e8f0] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-[#e1e8f0] bg-[#10345b] px-6 py-4 text-white">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#90dfd7]">
                  INSTRUMEN ASSESSMENT KESIAPAN OPD · {fillingOpd.shortName}
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

              {/* Ringkasan Petunjuk Pengisian (Bagian C & E Instrumen) */}
              <div className="rounded-[10px] border border-[#d0e2ff] bg-[#ebf3ff]/60 p-3.5 text-[12px] text-[#142b45] dark:border-blue-900 dark:bg-blue-950/30 dark:text-slate-200">
                <p className="font-bold text-[#10345b] dark:text-blue-300">
                  Petunjuk Pengisian Instrumen Assessment (BPS Kabupaten Berau):
                </p>
                <ul className="mt-1 list-disc pl-4 space-y-0.5 text-slate-700 dark:text-slate-300">
                  <li>
                    <strong>Pertanyaan Tingkat Penerapan (Skala 0–3):</strong>{" "}
                    Pilih <strong>0</strong> (Belum mengetahui/tersedia),{" "}
                    <strong>1</strong> (Mengetahui, belum melaksanakan),{" "}
                    <strong>2</strong> (Melaksanakan sebagian), atau{" "}
                    <strong>3</strong> (Konsisten & terdokumentasi).
                  </li>
                  <li>
                    <strong>Pertanyaan Jumlah (Kapasitas SDM/Kegiatan):</strong>{" "}
                    Isikan angka aktual (tuliskan 0 jika tidak ada). Digunakan
                    sebagai informasi kapasitas dan tidak dikonversi langsung
                    menjadi skor.
                  </li>
                  <li>
                    Sertakan nama dokumen bukti dukung (SK, SOP, KAK, metadata,
                    atau tautan publikasi) pada kolom catatan di tiap butir.
                  </li>
                </ul>
              </div>

              {(() => {
                const existingResp = fillingAssessment.responses.find(
                  (r) => r.opdId === fillingOpd.id
                );
                if (!existingResp?.pembinaFeedback) return null;
                return (
                  <div className="rounded-[10px] border border-teal-200 bg-teal-50/80 p-3.5 text-[12px] text-teal-950 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                    <p className="font-bold">
                      Arahan & Rekomendasi Pembina Sektoral BPS:
                    </p>
                    <p className="mt-1 leading-relaxed">
                      {existingResp.pembinaFeedback}
                    </p>
                  </div>
                );
              })()}

              {fillingAssessment.questions.map((q) => {
                const currentAns = answerState[q.id] || {
                  scaleValue: q.questionType === "NUMBER" ? 0 : 2,
                  yesNoValue: "YA",
                  textAnswer: "",
                };

                return (
                  <div
                    key={q.id}
                    className="rounded-[10px] border border-[#e1e8f0] bg-[#f8fafc] p-4 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10345b] text-[11px] font-bold text-white">
                          {q.order}
                        </span>
                        <Badge variant="secondary">{q.domainCode}</Badge>
                        {q.indicatorRef && (
                          <span className="text-[11px] font-mono font-semibold text-[#087f80] dark:text-teal-300">
                            {q.indicatorRef}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {q.questionType === "NUMBER"
                          ? "Informasi Kapasitas (Non-Skor)"
                          : "Skala Penilaian 0–3"}
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

                    {/* 1. Pertanyaan Skala 0-3 (Bagian E Instrumen) */}
                    {q.questionType === "SCALE_0_3" && (
                      <div className="mt-3 space-y-2.5">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                          {[0, 1, 2, 3].map((sc) => {
                            const active = currentAns.scaleValue === sc;
                            const def = SCALE_0_3_DEFINITIONS[sc];
                            return (
                              <button
                                key={sc}
                                type="button"
                                onClick={() =>
                                  setAnswerState((prev) => ({
                                    ...prev,
                                    [q.id]: {
                                      ...currentAns,
                                      scaleValue: sc,
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
                                  {def.title}
                                </span>
                                <span
                                  className={`mt-0.5 text-[10px] leading-snug ${
                                    active ? "text-[#90dfd7]" : "text-slate-500"
                                  }`}
                                >
                                  {def.desc}
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
                          placeholder="Bukti dukung / catatan (cantumkan nomor SK, SOP, dokumen perencanaan, metadata, atau tautan)..."
                          className="h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[12px] dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                    )}

                    {/* 2. Pertanyaan Jumlah Aktual (No. 5, 6, 7, 11) */}
                    {q.questionType === "NUMBER" && (
                      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            Jumlah Aktual (Angka):
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={
                              currentAns.scaleValue !== null &&
                              currentAns.scaleValue !== undefined
                                ? currentAns.scaleValue
                                : 0
                            }
                            onChange={(e) =>
                              setAnswerState((prev) => ({
                                ...prev,
                                [q.id]: {
                                  ...currentAns,
                                  scaleValue: Math.max(
                                    0,
                                    Number(e.target.value || 0)
                                  ),
                                },
                              }))
                            }
                            className="mt-1 h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 font-bold text-[#10345b] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            Keterangan / Rincian (Opsional):
                          </label>
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
                            placeholder="Sebutkan rincian unit/pegawai atau nama kegiatan..."
                            className="mt-1 h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[12px] dark:border-slate-700 dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    {/* 3. Fallback Skala 1-5 */}
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
                                  {SCALE_1_5_LABELS[lvl].title}
                                </span>
                                <span
                                  className={`mt-0.5 text-[10px] leading-snug ${
                                    active ? "text-[#90dfd7]" : "text-slate-500"
                                  }`}
                                >
                                  {SCALE_1_5_LABELS[lvl].desc}
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
                          placeholder="Tambahkan keterangan bukti dukung..."
                          className="h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[12px] dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                    )}

                    {/* 4. Fallback Pilihan Ya / Tidak */}
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
                              label: "✗ TIDAK — Belum Tersedia",
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
                                    ? "border-[#10345b] bg-[#10345b] text-white"
                                    : "border-[#e1e8f0] bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 5. Fallback Isian Teks */}
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
                          placeholder="Tuliskan uraian jawaban..."
                          className="w-full rounded-[8px] border border-[#e1e8f0] bg-white p-3 text-[12px] dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              <div>
                <label className="block font-bold text-[#142b45] dark:text-white">
                  Catatan Tambahan / Kendala Utama & Kebutuhan Pembinaan OPD
                </label>
                <textarea
                  rows={2}
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  placeholder="Tuliskan kendala utama atau kebutuhan bimbingan teknis Statistik Sektoral di OPD saudara..."
                  className="mt-1.5 w-full rounded-[8px] border border-[#e1e8f0] p-3 text-[12px] dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

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
                      : "Kirim Hasil Assessment ke BPS"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Pembina Sektoral Review & Arahan Pembinaan Modal */}
      {reviewingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[12px] border border-[#e1e8f0] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-[#e1e8f0] bg-[#10345b] px-6 py-4 text-white">
              <div>
                <Badge variant="teal">
                  Reviu Hasil Assessment · {reviewingData.response.opdName}
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

              {(() => {
                const catInfo = getReadinessCategory(
                  reviewingData.response.readinessPct
                );
                return (
                  <div className="rounded-lg border border-[#e1e8f0] bg-[#f8fafc] p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[12px] text-slate-500">
                          Instansi Perangkat Daerah
                        </p>
                        <p className="text-[15px] font-bold text-[#142b45] dark:text-white">
                          {reviewingData.response.opdName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] text-slate-500">
                          Nilai & Kategori Kesiapan (Bagian F)
                        </p>
                        <div className="mt-0.5 flex items-center justify-end gap-2">
                          <span className="text-[18px] font-bold text-[#087f80] dark:text-teal-400">
                            {reviewingData.response.readinessPct || 0}%
                          </span>
                          <Badge variant={catInfo.badgeVariant}>
                            {catInfo.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 border-t border-[#e1e8f0] pt-2 text-[12px] text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      <strong>Arahan Pembinaan Sesuai Kategori:</strong>{" "}
                      {catInfo.arahanPembinaan}
                    </p>
                  </div>
                );
              })()}

              {/* Pilih Cepat Rekomendasi Pembinaan Berdasarkan Bagian G */}
              <div className="rounded-lg border border-[#d0e2ff] bg-[#ebf3ff]/40 p-3.5 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="text-[12px] font-bold text-[#10345b] dark:text-blue-300">
                  Tambahkan Bentuk Pembinaan yang Disarankan (Bagian G Instrumen):
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ARAH_PEMBINAAN_RECOMMENDATIONS.map((rec, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setPembinaFeedbackInput((prev) =>
                          prev.includes(rec.rekomendasi)
                            ? prev
                            : `${prev ? `${prev}\n• ` : "• "}[${rec.temuan}] ${
                                rec.rekomendasi
                              }`
                        )
                      }
                      className="rounded-md border border-[#e1e8f0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#142b45] hover:border-[#1557b0] hover:text-[#1557b0] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      + {rec.temuan}
                    </button>
                  ))}
                </div>
              </div>

              {/* Answers Breakdown */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-[#142b45] dark:text-white">
                  Rincian Jawaban Responden OPD:
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
                          No. {q.order} · {q.domainCode}
                        </span>
                        {q.indicatorRef && <span>{q.indicatorRef}</span>}
                      </div>
                      <p className="mt-1 font-semibold text-[#142b45] dark:text-white">
                        {q.questionText}
                      </p>
                      <div className="mt-2 rounded bg-[#f8fafc] p-2.5 text-[12px] dark:bg-slate-800">
                        {ans ? (
                          <>
                            {q.questionType === "NUMBER" ? (
                              <p className="font-bold text-[#1557b0] dark:text-blue-300">
                                Jumlah Aktual: {ans.scaleValue ?? 0}
                              </p>
                            ) : q.questionType === "SCALE_0_3" &&
                              ans.scaleValue !== null &&
                              ans.scaleValue !== undefined ? (
                              <p className="font-bold text-[#087f80]">
                                {SCALE_0_3_DEFINITIONS[ans.scaleValue]?.title ||
                                  `Skor ${ans.scaleValue}`}
                              </p>
                            ) : ans.scaleValue !== null &&
                              ans.scaleValue !== undefined ? (
                              <p className="font-bold text-[#087f80]">
                                {SCALE_1_5_LABELS[ans.scaleValue]?.title ||
                                  `Skor ${ans.scaleValue}`}
                              </p>
                            ) : null}
                            {ans.yesNoValue && (
                              <p className="font-bold text-[#10345b] dark:text-blue-300">
                                Jawaban: {ans.yesNoValue}
                              </p>
                            )}
                            {ans.textAnswer && (
                              <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                                Bukti / Catatan: {ans.textAnswer}
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
                    Arahan Pembinaan & Tindak Lanjut Pembina Sektoral BPS
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={pembinaFeedbackInput}
                    onChange={(e) => setPembinaFeedbackInput(e.target.value)}
                    placeholder="Tuliskan arahan pembinaan berdasarkan kategori kesiapan dan temuan aspek..."
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
                      : "Simpan Arahan Pembinaan"}
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
                  INSTRUMEN ASSESSMENT KESIAPAN OPD · BPS KABUPATEN BERAU
                </span>
                <h3 className="mt-0.5 text-[18px] font-bold text-white">
                  Buat Paket Assessment Kesiapan Baru
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
                  Gunakan Template Resmi Instrumen Assessment Kesiapan OPD BPS
                  Kabupaten Berau:
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
                        {tpl.questions.length} pertanyaan resmi siap pakai
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#142b45] dark:text-white">
                    Judul Paket Assessment
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
                    Kategori Instrumen
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="Instrumen Kesiapan OPD (7 Aspek)">
                      Instrumen Kesiapan OPD Lengkap (7 Aspek · 30 Pertanyaan)
                    </option>
                    <option value="Kelembagaan, SDM & Perencanaan">
                      Aspek I–III (Kelembagaan, SDM & Perencanaan)
                    </option>
                    <option value="Metadata, Kualitas & Diseminasi">
                      Aspek IV–VII (Standar Data, Metadata, Kualitas &
                      Diseminasi)
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

                <div>
                  <label className="block font-bold text-[#142b45] dark:text-white">
                    Mode Akses Pengisian Assessment
                  </label>
                  <select
                    value={newIsPublic ? "PUBLIC" : "PRIVATE"}
                    onChange={(e) =>
                      setNewIsPublic(e.target.value === "PUBLIC")
                    }
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 font-semibold text-[#087f80] dark:border-slate-700 dark:bg-slate-800 dark:text-teal-300"
                  >
                    <option value="PUBLIC">
                      Umum — Dapat Diisi Tanpa Login Aplikasi
                    </option>
                    <option value="PRIVATE">
                      Internal — Wajib Login Akun Operator OPD
                    </option>
                  </select>
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
                        Pertanyaan #{idx + 1}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value=""
                          onChange={(e) => {
                            const orderNum = Number(e.target.value);
                            const presetQ =
                              OFFICIAL_30_INSTRUMEN_QUESTIONS.find(
                                (item) => item.order === orderNum
                              );
                            if (presetQ) {
                              setBuilderQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? {
                                        ...presetQ,
                                        order: idx + 1,
                                      }
                                    : item
                                )
                              );
                            }
                          }}
                          className="h-[32px] max-w-[230px] rounded border border-[#e1e8f0] bg-white px-2 text-[11px] font-semibold text-[#087f80] dark:border-slate-700 dark:bg-slate-900 dark:text-teal-300"
                        >
                          <option value="">
                            Pilih dari 30 Pertanyaan Instrumen...
                          </option>
                          {OFFICIAL_30_INSTRUMEN_QUESTIONS.map((item) => (
                            <option key={item.order} value={item.order}>
                              No. {item.order} — {item.questionText.slice(0, 55)}
                              ...
                            </option>
                          ))}
                        </select>

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
                          {SEVEN_ASPECT_OPTIONS.map((asp) => (
                            <option key={asp} value={asp}>
                              {asp}
                            </option>
                          ))}
                        </select>

                        <select
                          value={q.questionType}
                          onChange={(e) => {
                            const val =
                              e.target.value as AssessmentQuestionType;
                            setBuilderQuestions((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      questionType: val,
                                      weight: val === "NUMBER" ? 0 : 1,
                                    }
                                  : item
                              )
                            );
                          }}
                          className="h-[32px] rounded border border-[#e1e8f0] bg-white px-2 text-[11px] font-semibold dark:border-slate-700 dark:bg-slate-900"
                        >
                          <option value="SCALE_0_3">
                            Skala Penerapan (0–3)
                          </option>
                          <option value="NUMBER">
                            Jumlah Aktual (Kapasitas Non-Skor)
                          </option>
                          <option value="YES_NO">Pilihan Ya / Tidak</option>
                          <option value="TEXT">Isian Uraian / Catatan</option>
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
                      placeholder="Tuliskan kalimat pertanyaan assessment..."
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
                      placeholder="Pilihan jawaban / petunjuk bukti dukung (opsional)..."
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
                    ? "Menerbitkan Assessment..."
                    : "Terbitkan Paket Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Pedoman Skala Penilaian (0-3), Kategori Kesiapan & Arah Pembinaan (Bagian E, F, G Dokumen) */}
      {showPedomanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[12px] border border-[#e1e8f0] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-[#e1e8f0] bg-[#10345b] px-6 py-4 text-white">
              <div>
                <Badge variant="teal">
                  Pedoman Resmi Assessment BPS Kabupaten Berau Tahun 2026
                </Badge>
                <h3 className="mt-1 text-[18px] font-bold text-white">
                  Skala Penilaian (0–3), Kategori Kesiapan & Arah Pembinaan OPD
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPedomanModal(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-[13px]">
              {/* Bagian E: Skala Penilaian 0-3 */}
              <div>
                <h4 className="font-bold text-[#142b45] dark:text-white">
                  E. Skala Penilaian Tingkat Penerapan (0–3)
                </h4>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((sc) => {
                    const def = SCALE_0_3_DEFINITIONS[sc];
                    return (
                      <div
                        key={sc}
                        className="rounded-lg border border-[#e1e8f0] bg-[#f8fafc] p-3 dark:border-slate-800 dark:bg-slate-800/50"
                      >
                        <p className="font-bold text-[#10345b] dark:text-blue-300">
                          {def.title}
                        </p>
                        <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">
                          {def.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bagian F: Penghitungan Nilai dan Kategori Kesiapan */}
              <div>
                <h4 className="font-bold text-[#142b45] dark:text-white">
                  F. Penghitungan Nilai & Kategori Kesiapan OPD
                </h4>
                <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400">
                  Rumus:{" "}
                  <strong>
                    Nilai Kesiapan = (Total Skor Diperoleh ÷ Total Skor Maksimal)
                    × 100
                  </strong>
                  . Pertanyaan jumlah digunakan sebagai informasi kapasitas SDM
                  & kegiatan, bukan sebagai skor langsung.
                </p>
                <div className="mt-2.5 overflow-x-auto rounded-lg border border-[#e1e8f0] dark:border-slate-800">
                  <table className="w-full text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-[#e1e8f0] bg-[#f8fafc] font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                        <th className="px-3 py-2">Rentang Nilai</th>
                        <th className="px-3 py-2">Kategori</th>
                        <th className="px-3 py-2">Arahan Pembinaan BPS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e1e8f0] dark:divide-slate-800">
                      {READINESS_CATEGORIES.map((cat) => (
                        <tr key={cat.category}>
                          <td className="px-3 py-2 font-bold">
                            {cat.minPct}–{cat.maxPct}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={cat.badgeVariant}>
                              {cat.category}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            {cat.arahanPembinaan}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bagian G: Arah Pembinaan Berdasarkan Hasil Assessment */}
              <div>
                <h4 className="font-bold text-[#142b45] dark:text-white">
                  G. Arah Pembinaan Berdasarkan Temuan Assessment
                </h4>
                <div className="mt-2 overflow-x-auto rounded-lg border border-[#e1e8f0] dark:border-slate-800">
                  <table className="w-full text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-[#e1e8f0] bg-[#f8fafc] font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                        <th className="px-3 py-2">Temuan Assessment</th>
                        <th className="px-3 py-2">
                          Bentuk Pembinaan yang Disarankan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e1e8f0] dark:divide-slate-800">
                      {ARAH_PEMBINAAN_RECOMMENDATIONS.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-semibold text-[#142b45] dark:text-white">
                            {item.temuan}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            {item.rekomendasi}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-[#e1e8f0] bg-[#f8fafc] px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setShowPedomanModal(false)}
                className="h-[38px] rounded-[8px] bg-[#10345b] px-5 text-[12px] font-semibold text-white hover:bg-[#142b45]"
              >
                Tutup Pedoman
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
