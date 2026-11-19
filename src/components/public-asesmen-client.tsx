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
  ShieldCheck,
  Award,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatDateId } from "@/lib/utils";
import {
  OpdSimple,
  SerializedAssessment,
} from "@/components/asesmen-client";

const SCALE_LABELS: Record<number, { title: string; desc: string }> = {
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
  const [fillingAssessment, setFillingAssessment] =
    React.useState<SerializedAssessment | null>(() => {
      if (initialSelectedId) {
        return (
          assessments.find((a) => a.id === initialSelectedId) || null
        );
      }
      return null;
    });

  // Identity fields for public (no-login) respondent
  const [selectedOpdId, setSelectedOpdId] = React.useState<string>(
    opds[0]?.id || ""
  );
  const [respondentName, setRespondentName] = React.useState("");
  const [respondentNip, setRespondentNip] = React.useState("");

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
        initialMap[q.id] = {
          scaleValue:
            prevAns?.scaleValue ?? (q.questionType === "SCALE_1_5" ? 3 : null),
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
      setFillError("Silakan pilih Instansi Perangkat Daerah (OPD) Anda.");
      return;
    }

    if (!respondentName.trim()) {
      setFillError("Silakan isi Nama Lengkap Pengisi Asesmen.");
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
          summaryNotes,
          answers: answersPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFillError(data.error || "Gagal mengirim jawaban asesmen.");
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
      setFillError("Terjadi gangguan jaringan saat mengirim asesmen.");
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
                  Asesmen Umum (Tanpa Login)
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Badan Pusat Statistik Kabupaten Berau · Satu Data Indonesia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
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
                <span>LAYANAN ASESMEN TERBUKA PERANGKAT DAERAH (TANPA LOGIN)</span>
              </div>
              <h1 className="text-[22px] font-bold text-white sm:text-[26px]">
                Asesmen Kesiapan Statistik Sektoral Kabupaten Berau
              </h1>
              <p className="text-[13px] leading-relaxed text-[#acc5df]">
                Pilih salah satu kartu paket asesmen di bawah ini, pilih
                instansi Perangkat Daerah (OPD) Anda, dan kerjakan kuesioner
                langsung di dalam pop-up tanpa perlu masuk (login) ke akun
                aplikasi.
              </p>
            </div>

            <div className="rounded-[10px] border border-white/15 bg-white/10 px-4 py-3 text-center">
              <p className="text-[11px] font-semibold text-[#90dfd7]">
                ASESMEN UMUM TERSEDIA
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
              placeholder="Cari judul atau kategori asesmen umum..."
              className="h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-[#f8fafc] pl-9 pr-3 text-[13px] focus:border-[#1557b0] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <span className="text-[12px] text-slate-500">
            Menampilkan <strong>{filtered.length}</strong> paket asesmen umum
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
                      <Badge variant="success" className="inline-flex items-center gap-1">
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
                    ✓ Terbuka untuk Perangkat Daerah
                  </span>
                  <button
                    type="button"
                    onClick={() => openPublicModal(item)}
                    className="inline-flex h-[38px] items-center gap-1.5 rounded-[8px] bg-[#10345b] px-4 text-[12px] font-semibold text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span>Kerjakan Asesmen</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-10 text-center text-[13px] text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Belum ada paket asesmen berstatus Umum yang dibuka saat ini.
          </div>
        )}
      </main>

      {/* POP-UP MODAL PENGERJAAN ASESMEN UMUM (TANPA LOGIN) */}
      {fillingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[12px] border border-[#e1e8f0] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-[#e1e8f0] bg-[#10345b] px-6 py-4 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="teal">Formulir Asesmen Umum</Badge>
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
                    {fillSuccess.score && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#087f80]">
                        <Award className="h-4 w-4" />
                        <span>
                          Estimasi Skor Kesiapan OPD Anda: Level{" "}
                          {fillSuccess.score.toFixed(2).replace(".", ",")} (
                          {fillSuccess.pct}%)
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {/* Bagian Identitas Instansi OPD & Responden */}
                <div className="rounded-[10px] border border-[#d0e2ff] bg-[#ebf3ff]/50 p-4 space-y-3 dark:border-blue-900 dark:bg-blue-950/30">
                  <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#10345b] dark:text-blue-300">
                    <Building2 className="h-4 w-4 text-[#087f80]" />
                    <span>Identitas Instansi Perangkat Daerah & Pengisi</span>
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-3">
                      <label className="block text-[12px] font-semibold text-[#142b45] dark:text-slate-200">
                        Pilih Organisasi Perangkat Daerah (OPD) *
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

                    <div className="sm:col-span-2">
                      <label className="block text-[12px] font-semibold text-[#142b45] dark:text-slate-200">
                        Nama Lengkap Pengisi / Responden *
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
                        NIP / Jabatan (Opsional)
                      </label>
                      <input
                        type="text"
                        value={respondentNip}
                        onChange={(e) => setRespondentNip(e.target.value)}
                        placeholder="Pengelola Data / NIP"
                        className="mt-1 h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Daftar Pertanyaan */}
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
                            placeholder="Sebutkan nomor dokumen / keterangan pendukung (opsional)..."
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
                    Ringkasan Kendala & Kebutuhan Pendampingan OPD (Opsional)
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
                      : "Kirim Jawaban Asesmen"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
