"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Clock,
  Globe,
  Building2,
  CheckCircle2,
  AlertCircle,
  Send,
  X,
  ArrowLeft,
  Award,
  Search,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatDateId } from "@/lib/utils";
import {
  OpdSimple,
  SerializedAssessment,
} from "@/components/asesmen-client";
import {
  ARAH_PEMBINAAN_RECOMMENDATIONS,
  getReadinessCategory,
  READINESS_CATEGORIES,
  SCALE_0_3_DEFINITIONS,
} from "@/lib/asesmen-presets";

const SCALE_1_5_LABELS: Record<number, { title: string; desc: string }> = {
  1: { title: "Level 1 — Rintisan", desc: "Belum ada pedoman / baru inisiatif" },
  2: { title: "Level 2 — Terkelola", desc: "Ada draf / bukti pelaksanaan awal" },
  3: { title: "Level 3 — Terdefinisi", desc: "Sesuai SOP / Juknis & baku" },
  4: { title: "Level 4 — Terpadu", desc: "Terintegrasi & direviu berkala" },
  5: { title: "Level 5 — Optimum", desc: "Pemutakhiran berkelanjutan" },
};

export function PublicAsesmenClient({
  opds,
  assessments,
  initialSelectedId,
}: {
  opds: OpdSimple[];
  assessments: SerializedAssessment[];
  initialSelectedId?: string;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showPedomanModal, setShowPedomanModal] = React.useState(false);
  const [fillingAssessment, setFillingAssessment] =
    React.useState<SerializedAssessment | null>(() => {
      if (initialSelectedId) {
        return assessments.find((a) => a.id === initialSelectedId) || null;
      }
      return null;
    });

  // Identity fields from Section B (IDENTITAS OPD) of Instrumen_Assessment_Kesiapan_OPD_Statistik_Sektoral_Berau.docx
  const [selectedOpdId, setSelectedOpdId] = React.useState<string>(
    opds[0]?.id || ""
  );
  const [unitAddress, setUnitAddress] = React.useState("");
  const [respondentName, setRespondentName] = React.useState("");
  const [respondentNip, setRespondentNip] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");

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
  const [submitting, setSubmitting] = React.useState(false);
  const [fillError, setFillError] = React.useState<string | null>(null);
  const [fillSuccess, setFillSuccess] = React.useState<{
    message: string;
    score?: number;
    pct?: number;
  } | null>(null);

  const initQuestionsForAssessment = React.useCallback(
    (assessment: SerializedAssessment, opdIdToLoad: string) => {
      const existingResp = assessment.responses.find(
        (r) => r.opdId === opdIdToLoad
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
        const prevAns = existingResp?.answers.find(
          (a) => a.questionId === q.id
        );
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
      setAnswerState(initialMap);
      setSummaryNotes(existingResp?.summaryNotes || "");
    },
    []
  );

  React.useEffect(() => {
    if (fillingAssessment) {
      const defaultOpd =
        fillingAssessment.targetOpdId || selectedOpdId || opds[0]?.id || "";
      setSelectedOpdId(defaultOpd);
      initQuestionsForAssessment(fillingAssessment, defaultOpd);
    }
  }, [fillingAssessment, initQuestionsForAssessment, opds, selectedOpdId]);

  function openPublicModal(assessment: SerializedAssessment) {
    const defaultOpd =
      assessment.targetOpdId || selectedOpdId || opds[0]?.id || "";
    setSelectedOpdId(defaultOpd);
    initQuestionsForAssessment(assessment, defaultOpd);
    setFillError(null);
    setFillSuccess(null);
    setFillingAssessment(assessment);
  }

  async function handleSubmitPublic(e: React.FormEvent) {
    e.preventDefault();
    if (!fillingAssessment) return;

    if (!selectedOpdId) {
      setFillError("Silakan pilih Nama OPD Anda.");
      return;
    }

    if (!respondentName.trim()) {
      setFillError("Silakan isi Nama Responden dan Jabatan (Bagian B Identitas OPD).");
      return;
    }

    setSubmitting(true);
    setFillError(null);
    setFillSuccess(null);

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

      const identityPrefix = [
        unitAddress.trim() ? `Unit/Alamat: ${unitAddress.trim()}` : null,
        contactEmail.trim() ? `Kontak: ${contactEmail.trim()}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      const combinedNotes = [identityPrefix, summaryNotes.trim()]
        .filter(Boolean)
        .join(" — ");

      const res = await fetch("/api/asesmen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_RESPONSE",
          assessmentId: fillingAssessment.id,
          opdId: selectedOpdId,
          submitMode: "DIKIRIM",
          respondentName: respondentName.trim(),
          respondentNip: respondentNip.trim(),
          summaryNotes: combinedNotes,
          answers: answersPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFillError(data.error || "Gagal mengirim jawaban assessment.");
        setSubmitting(false);
        return;
      }

      setFillSuccess({
        message: data.message,
        score: data.readinessScore,
        pct: data.readinessPct,
      });
      router.refresh();
    } catch {
      setFillError("Terjadi gangguan jaringan saat mengirim assessment.");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = assessments.filter((a) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#142b45] dark:bg-slate-950 dark:text-slate-100">
      {/* Top Navbar Publik */}
      <header className="sticky top-0 z-30 border-b border-[#e1e8f0] bg-white px-4 py-3.5 sm:px-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo-sigap.jpeg"
              alt="Logo SIGAP BERAU"
              width={44}
              height={44}
              className="h-11 w-11 rounded-[10px] object-contain bg-white border border-[#e1e8f0]"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] font-extrabold tracking-tight text-[#10345b] dark:text-white">
                  SIGAP <span className="text-[#087f80]">BERAU</span>
                </span>
                <Badge variant="teal" className="text-[10px]">
                  Assessment Umum (Tanpa Login)
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Badan Pusat Statistik Kabupaten Berau · Satu Data Indonesia
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowPedomanModal(true)}
              className="inline-flex h-[38px] items-center gap-1.5 rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[12px] font-semibold text-[#087f80] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-teal-300"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Pedoman Skala 0–3</span>
            </button>
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex h-[38px] items-center gap-1.5 rounded-[8px] border border-[#e1e8f0] bg-white px-3.5 text-[12px] font-semibold text-[#10345b] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Halaman Login Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1160px] px-4 py-8 sm:px-8 space-y-6">
        {/* Hero Banner */}
        <div className="rounded-[12px] bg-[#10345b] p-6 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-[#90dfd7]">
                <Globe className="h-3.5 w-3.5" />
                <span>
                  INSTRUMEN ASSESSMENT PEMAHAMAN DAN KESIAPAN OPD · TAHUN 2026
                </span>
              </div>
              <h1 className="text-[22px] font-bold text-white sm:text-[26px]">
                Assessment Kesiapan Penyelenggaraan Statistik Sektoral
              </h1>
              <p className="text-[13px] leading-relaxed text-[#acc5df]">
                Instrumen ini disusun BPS Kabupaten Berau untuk memperoleh
                gambaran tingkat pemahaman, kapasitas SDM, dan kesiapan OPD pada
                7 Aspek Statistik Sektoral. Pilih kartu di bawah ini untuk
                mengisi langsung tanpa login.
              </p>
            </div>

            <div className="rounded-[10px] border border-white/15 bg-white/10 px-4 py-3 text-center">
              <p className="text-[11px] font-semibold text-[#90dfd7]">
                INSTRUMEN TERSEDIA
              </p>
              <p className="mt-0.5 text-[26px] font-extrabold text-white">
                {assessments.length} Paket
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
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
          <span className="text-[12px] text-slate-500">
            Menampilkan <strong>{filtered.length}</strong> paket assessment umum
          </span>
        </div>

        {/* Assessment Cards Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-[12px] border border-[#e1e8f0] bg-white p-5 shadow-xs transition hover:border-[#1557b0]/50 dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="success"
                        className="inline-flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        <span>Umum (Tanpa Login)</span>
                      </Badge>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-[#087f80]" />
                      <span>Batas: {formatDateId(item.dueDate)}</span>
                    </span>
                  </div>

                  <h2 className="mt-3 text-[17px] font-bold text-[#142b45] dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-[13px] text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                    <span className="font-semibold text-[#10345b] dark:text-blue-300">
                      {item.questions.length} Butir Pertanyaan
                    </span>
                    <span>·</span>
                    <span>
                      Sasaran:{" "}
                      <strong>
                        {item.targetOpdShortName || "Seluruh OPD Kab. Berau"}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#e1e8f0] pt-3.5 dark:border-slate-800">
                  <span className="text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
                    ✓ Skala 0–3 & Kapasitas Aktual
                  </span>
                  <button
                    type="button"
                    onClick={() => openPublicModal(item)}
                    className="inline-flex h-[38px] items-center gap-1.5 rounded-[8px] bg-[#10345b] px-4 text-[12px] font-semibold text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span>Kerjakan Assessment</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-10 text-center text-[13px] text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Belum ada paket assessment berstatus Umum yang dibuka saat ini.
          </div>
        )}
      </main>

      {/* POP-UP MODAL PENGERJAAN ASSESSMENT UMUM (TANPA LOGIN) */}
      {fillingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[12px] border border-[#e1e8f0] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-[#e1e8f0] bg-[#10345b] px-6 py-4 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="teal">
                    Instrumen Assessment Kesiapan OPD
                  </Badge>
                  <span className="text-[11px] text-[#90dfd7]">
                    {fillingAssessment.questions.length} Pertanyaan
                  </span>
                </div>
                <h3 className="mt-1 text-[18px] font-bold text-white">
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

            <form
              onSubmit={handleSubmitPublic}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-[13px]">
                {fillError && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{fillError}</span>
                  </div>
                )}

                {fillSuccess && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                    <div className="flex items-center gap-2 font-bold text-[14px]">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span>{fillSuccess.message}</span>
                    </div>
                    {fillSuccess.pct !== undefined && (
                      <div className="mt-2 space-y-1 text-[13px]">
                        <p className="flex items-center gap-1.5 font-bold text-[#087f80]">
                          <Award className="h-4 w-4" />
                          <span>
                            Nilai Kesiapan OPD Anda: {fillSuccess.pct}% —
                            Kategori:{" "}
                            {getReadinessCategory(fillSuccess.pct).category}
                          </span>
                        </p>
                        <p className="text-[12px] text-slate-700">
                          <strong>Arahan Pembinaan BPS:</strong>{" "}
                          {
                            getReadinessCategory(fillSuccess.pct)
                              .arahanPembinaan
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Bagian B: IDENTITAS OPD sesuai dokumen Instrumen_Assessment_Kesiapan_OPD_Statistik_Sektoral_Berau.docx */}
                <div className="rounded-[10px] border border-[#d0e2ff] bg-[#ebf3ff]/50 p-4 space-y-3 dark:border-blue-900 dark:bg-blue-950/30">
                  <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#10345b] dark:text-blue-300">
                    <Building2 className="h-4 w-4 text-[#087f80]" />
                    <span>B. Identitas OPD & Responden</span>
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[12px] font-semibold text-[#142b45] dark:text-slate-200">
                        Nama OPD *
                      </label>
                      <select
                        required
                        disabled={Boolean(fillingAssessment.targetOpdId)}
                        value={selectedOpdId}
                        onChange={(e) => {
                          setSelectedOpdId(e.target.value);
                          initQuestionsForAssessment(
                            fillingAssessment,
                            e.target.value
                          );
                        }}
                        className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 font-semibold text-[#142b45] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        {opds.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.shortName} — {o.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-[#142b45] dark:text-slate-200">
                        Nama Responden *
                      </label>
                      <input
                        type="text"
                        required
                        value={respondentName}
                        onChange={(e) => setRespondentName(e.target.value)}
                        placeholder="Contoh: Hendra Wijaya, S.Kom."
                        className="mt-1 h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-[#142b45] dark:text-slate-200">
                        Jabatan / NIP
                      </label>
                      <input
                        type="text"
                        value={respondentNip}
                        onChange={(e) => setRespondentNip(e.target.value)}
                        placeholder="Pengelola Data / NIP"
                        className="mt-1 h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-[#142b45] dark:text-slate-200">
                        Unit Kerja / Alamat
                      </label>
                      <input
                        type="text"
                        value={unitAddress}
                        onChange={(e) => setUnitAddress(e.target.value)}
                        placeholder="Subbagian Perencanaan / Tanjung Redeb"
                        className="mt-1 h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-[#142b45] dark:text-slate-200">
                        Kontak / Email
                      </label>
                      <input
                        type="text"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="0812... / email@beraukab.go.id"
                        className="mt-1 h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Daftar Pertanyaan */}
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
                                      active
                                        ? "text-[#90dfd7]"
                                        : "text-slate-500"
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
                                      active
                                        ? "text-[#90dfd7]"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {SCALE_1_5_LABELS[lvl].desc}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {q.questionType === "YES_NO" && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {[
                            {
                              val: "YA",
                              label: "✓ YA — Sudah Dilaksanakan",
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
                    Ringkasan Kendala & Kebutuhan Pendampingan OPD (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={summaryNotes}
                    onChange={(e) => setSummaryNotes(e.target.value)}
                    placeholder="Tuliskan kesimpulan umum atau permintaan topik bimbingan teknis kepada BPS Kabupaten Berau..."
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
                  Tutup
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-[40px] items-center gap-1.5 rounded-[8px] bg-[#087f80] px-5 text-[13px] font-semibold text-white hover:bg-[#066667] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {submitting
                      ? "Mengirim Jawaban..."
                      : "Kirim Jawaban Assessment"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pedoman Skala Penilaian (0-3), Kategori Kesiapan & Arah Pembinaan */}
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
                  .
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
