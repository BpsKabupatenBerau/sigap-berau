"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  FileSpreadsheet,
  Presentation,
  Files,
  Users,
  ArrowRight,
  Download,
  Plus,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PdfViewerModal,
  ViewableDocument,
} from "@/components/pdf-viewer-modal";

export interface MaterialItem {
  id: string;
  title: string;
  category: string;
  format: string;
  fileSize: string;
  fileUrl: string;
  targetAudience: string;
  domainCode: string | null;
  isFeatured: boolean;
  description: string;
  author: string;
  downloadCount: number;
  publishedLabel: string;
}

const CATEGORIES = [
  "Semua Materi",
  "Panduan EPSS",
  "Regulasi & Kebijakan",
  "Standar Data & Metadata",
  "Template & Instrumen",
  "Materi Sosialisasi",
];

export function MateriClient({
  materials,
  canManage,
}: {
  materials: MaterialItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] =
    React.useState("Semua Materi");
  const [selectedFormat, setSelectedFormat] = React.useState("ALL");
  const [selectedAudience, setSelectedAudience] = React.useState("ALL");
  const [previewDoc, setPreviewDoc] = React.useState<ViewableDocument | null>(
    null
  );
  const [showAddModal, setShowAddModal] = React.useState(false);

  // Add Material Form
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("Panduan EPSS");
  const [format, setFormat] = React.useState("PDF");
  const [fileSize, setFileSize] = React.useState("2,4 MB");
  const [targetAudience, setTargetAudience] = React.useState("Semua OPD");
  const [domainCode, setDomainCode] = React.useState("Semua Domain");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const featured =
    materials.find((m) => m.isFeatured) || materials[0] || null;

  const filtered = materials.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      selectedCategory === "Semua Materi" || item.category === selectedCategory;

    const matchFormat =
      selectedFormat === "ALL" ||
      item.format.toUpperCase() === selectedFormat.toUpperCase();

    const matchAudience =
      selectedAudience === "ALL" || item.targetAudience === selectedAudience;

    return matchSearch && matchCategory && matchFormat && matchAudience;
  });

  function openMaterialPreview(mat: MaterialItem) {
    setPreviewDoc({
      id: mat.id,
      originalName: `${mat.title}.${mat.format.toLowerCase()}`,
      filePath: mat.fileUrl,
      mimeType:
        mat.format === "PDF" ? "application/pdf" : "application/octet-stream",
      fileSize: 4200000,
      pageNumber: "Dokumen Lengkap",
      description: mat.description,
      indicatorCode: mat.domainCode || "Panduan",
      opdName: mat.targetAudience,
    });
  }

  async function handleCreateMaterial(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/materi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          format,
          fileSize,
          targetAudience,
          domainCode,
          description,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setTitle("");
        setDescription("");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  function renderFormatIcon(fmt: string) {
    switch (fmt.toUpperCase()) {
      case "XLSX":
        return <FileSpreadsheet className="h-[22px] w-[22px] text-emerald-600" />;
      case "PPTX":
        return <Presentation className="h-[22px] w-[22px] text-amber-600" />;
      case "ZIP":
        return <Files className="h-[22px] w-[22px] text-[#087f80]" />;
      default:
        return <FileText className="h-[22px] w-[22px] text-[#1557b0]" />;
    }
  }

  return (
    <div
      className="mx-auto max-w-[1160px] space-y-6"
      data-node-id="4:3376"
    >
      {/* Judul halaman (Figma 4:3432) */}
      <div
        className="flex flex-wrap items-end justify-between gap-4"
        data-node-id="4:3432"
      >
        <div className="max-w-3xl" data-node-id="4:3433">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#087f80] dark:text-teal-400">
            PUSTAKA RUJUKAN STATISTIK SEKTORAL
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-[#142b45] dark:text-white">
            Kumpulan Materi Pembinaan & Panduan EPSS
          </h1>
          <p className="mt-1 text-[14px] text-slate-600 dark:text-slate-400">
            Unduh petunjuk teknis penilaian 38 indikator EPSS, regulasi Satu
            Data Indonesia, template SOP kualitas data, dan instrumen metadata
            baku bagi seluruh OPD Kabupaten Berau.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="teal" className="h-[28px] px-3 text-[12px]">
            {materials.length} Referensi Resmi Tersedia
          </Badge>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-[#10345b] px-4 text-[13px] font-semibold text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Materi</span>
            </button>
          )}
        </div>
      </div>

      {/* Exact Figma Node 4:3439: Materi pilihan */}
      {featured && (
        <div
          className="bg-[#10345b] flex flex-col sm:flex-row gap-[24px] items-start sm:items-center overflow-clip p-[24px] relative rounded-[12px] w-full shadow-sm"
          data-node-id="4:3439"
          data-name="Materi pilihan"
        >
          <div
            className="bg-white flex flex-col justify-between gap-[12px] h-[114px] items-start overflow-clip p-[12px] relative rounded-[8px] shrink-0 w-[92px]"
            data-node-id="4:3440"
            data-name="Sampul panduan"
          >
            <div
              className="bg-[#087f80] h-[4px] relative rounded-[2px] shrink-0 w-[26px]"
              data-node-id="4:3441"
              data-name="Garis identitas"
            />
            <div
              className="font-semibold leading-[1.35] relative shrink-0 text-[#10345b] text-[10px]"
              data-node-id="4:3442"
            >
              <p className="mb-0">PANDUAN</p>
              <p className="mb-0">EPSS</p>
              <p>2026</p>
            </div>
            <div
              className="flex gap-[4px] h-[24px] items-end overflow-clip relative shrink-0"
              data-node-id="4:3443"
              data-name="Grafik sampul"
            >
              <div
                className="bg-[#ebf3ff] relative shrink-0 size-[12px]"
                data-node-id="4:3444"
                data-name="Batang"
              />
              <div
                className="bg-[#1557b0] h-[18px] relative shrink-0 w-[12px]"
                data-node-id="4:3445"
                data-name="Batang"
              />
              <div
                className="bg-[#087f80] h-[24px] relative shrink-0 w-[12px]"
                data-node-id="4:3446"
                data-name="Batang"
              />
            </div>
          </div>

          <div
            className="flex flex-1 flex-col gap-[7px] items-start leading-[1.5] min-w-0 relative"
            data-node-id="4:3447"
            data-name="Pengantar panduan"
          >
            <p
              className="relative shrink-0 text-[#90dfd7] text-[10px] font-semibold tracking-wider uppercase"
              data-node-id="4:3448"
            >
              REKOMENDASI PEMBINA
            </p>
            <p
              className="relative shrink-0 text-[21px] font-bold text-white"
              data-node-id="4:3449"
            >
              Mulai persiapan EPSS dari sini
            </p>
            <p
              className="relative shrink-0 text-[#acc5df] text-[13px]"
              data-node-id="4:3450"
            >
              Kenali lima domain evaluasi dan pelajari cara menyiapkan bukti
              dukung yang relevan bagi instansi Anda.
            </p>
            <p
              className="relative shrink-0 text-[#acc5df] text-[11px]"
              data-node-id="4:3451"
            >
              Panduan persiapan · PDF · 4,2 MB · Semua OPD
            </p>
          </div>

          <button
            type="button"
            onClick={() => openMaterialPreview(featured)}
            className="bg-white border border-[#e1e8f0] border-solid flex gap-[8px] h-[42px] items-center justify-center overflow-clip px-[16px] relative rounded-[8px] shrink-0 hover:bg-slate-50 transition cursor-pointer"
            data-node-id="4:3452"
            data-name="Tombol tindakan"
          >
            <div
              className="relative shrink-0 size-[16px]"
              data-node-id="4:4026"
              data-name="arrow-up-right"
            >
              <img
                alt=""
                width={16}
                height={16}
                className="block size-[16px]"
                src="/assets/figma/arrow-up-right.svg"
              />
            </div>
            <span
              className="font-semibold leading-[1.5] relative shrink-0 text-[#142b45] text-[13px] whitespace-nowrap"
              data-node-id="4:3454"
            >
              Buka panduan
            </span>
          </button>
        </div>
      )}

      {/* Pencarian materi (Figma 4:3455) */}
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        data-node-id="4:3455"
      >
        <div className="relative sm:col-span-2" data-node-id="4:3456">
          <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul panduan, nomor regulasi, SOP, atau kata kunci indikator..."
            className="h-[42px] w-full rounded-[8px] border border-[#e1e8f0] bg-white pl-10 pr-4 text-[13px] text-[#142b45] placeholder:text-slate-400 focus:border-[#1557b0] focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
          className="h-[42px] rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[13px] text-[#142b45] focus:border-[#1557b0] focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          data-node-id="4:3459"
        >
          <option value="ALL">Semua Format Berkas</option>
          <option value="PDF">Dokumen PDF (.pdf)</option>
          <option value="DOCX">Dokumen Word (.docx)</option>
          <option value="XLSX">Lembar Kerja (.xlsx)</option>
          <option value="PPTX">Paparan Slide (.pptx)</option>
          <option value="ZIP">Paket Bukti (.zip)</option>
        </select>

        <select
          value={selectedAudience}
          onChange={(e) => setSelectedAudience(e.target.value)}
          className="h-[42px] rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[13px] text-[#142b45] focus:border-[#1557b0] focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          data-node-id="4:3462"
        >
          <option value="ALL">Semua Sasaran OPD</option>
          <option value="Semua OPD">Semua OPD</option>
          <option value="Produsen Data">Produsen Data Sektoral</option>
          <option value="Walidata Daerah">Walidata Daerah</option>
        </select>
      </div>

      {/* Kategori materi pills (Figma 4:3468) */}
      <div
        className="flex flex-wrap items-center gap-2"
        data-node-id="4:3468"
      >
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`h-[36px] rounded-[8px] border px-3.5 text-[12px] font-semibold transition ${
                active
                  ? "border-[#10345b] bg-[#10345b] text-white dark:border-blue-500 dark:bg-blue-600"
                  : "border-[#e1e8f0] bg-white text-slate-600 hover:border-slate-300 hover:text-[#142b45] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Hasil pencarian (Figma 4:3483) */}
      <div
        className="flex items-center justify-between text-[13px] text-slate-500 dark:text-slate-400"
        data-node-id="4:3483"
      >
        <span>
          Menampilkan <strong>{filtered.length}</strong> materi pembinaan
        </span>
        <span>Diurutkan: Terbaru & Terpopuler</span>
      </div>

      {/* Kumpulan referensi (Figma 4:3486 — 3-column card grid) */}
      <div
        className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        data-node-id="4:3486"
      >
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-[12px] border border-[#e1e8f0] bg-white p-5 transition hover:border-[#1557b0]/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            data-node-id="4:3488"
          >
            <div>
              {/* Format materi (4:3489) */}
              <div
                className="flex items-center justify-between"
                data-node-id="4:3489"
              >
                <div
                  className="flex h-[48px] w-[44px] items-center justify-center rounded-[10px] bg-[#ebf3ff]/70 dark:bg-slate-800"
                  data-node-id="4:3490"
                >
                  {renderFormatIcon(item.format)}
                </div>
                <Badge variant="outline" className="font-bold">
                  {item.format}
                </Badge>
              </div>

              {/* Isi materi (4:3494) */}
              <div className="mt-4" data-node-id="4:3494">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#087f80] dark:text-teal-400">
                  {item.category}
                </p>
                <h3 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-[#142b45] dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#e1e8f0] dark:border-slate-800">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Ukuran: {item.fileSize} · {item.domainCode || "Semua Domain"}
              </p>

              {/* Akses dan pembaruan (4:3499) */}
              <div
                className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400"
                data-node-id="4:3499"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#1557b0]" />
                  <span>{item.targetAudience}</span>
                </span>
                <span>{item.publishedLabel}</span>
              </div>

              {/* Tindakan materi (4:3504) */}
              <div
                className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80"
                data-node-id="4:3504"
              >
                <button
                  type="button"
                  onClick={() => openMaterialPreview(item)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1557b0] hover:underline dark:text-blue-400"
                  data-node-id="4:3505"
                >
                  <span>Buka materi</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <a
                  href={item.fileUrl}
                  download={`${item.title}.${item.format.toLowerCase()}`}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#10345b] dark:hover:bg-slate-800 dark:hover:text-white"
                  title="Unduh Materi"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Materi */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-[12px] border border-[#e1e8f0] bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#142b45] dark:text-white">
                Tambah Materi Pembinaan Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateMaterial}
              className="mt-4 space-y-3.5 text-[13px]"
            >
              <div>
                <label className="block font-medium text-[#142b45] dark:text-slate-200">
                  Judul Materi / Pedoman
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Modul Penyusunan Standar Data Statistik Sektoral Daerah"
                  className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {CATEGORIES.filter((c) => c !== "Semua Materi").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Format Berkas
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOCX">DOCX</option>
                    <option value="XLSX">XLSX</option>
                    <option value="PPTX">PPTX</option>
                    <option value="ZIP">ZIP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Ukuran Berkas
                  </label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Sasaran
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="Semua OPD">Semua OPD</option>
                    <option value="Produsen Data">Produsen Data</option>
                    <option value="Walidata Daerah">Walidata Daerah</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Cakupan Domain
                  </label>
                  <input
                    type="text"
                    value={domainCode}
                    onChange={(e) => setDomainCode(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#142b45] dark:text-slate-200">
                  Deskripsi Ringkas Materi
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan manfaat dan isi materi bagi Operator OPD..."
                  className="mt-1 w-full rounded-[8px] border border-[#e1e8f0] p-2.5 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-[40px] rounded-[8px] border border-[#e1e8f0] px-4 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-[40px] rounded-[8px] bg-[#10345b] px-5 font-semibold text-white hover:bg-[#142b45]"
                >
                  {saving ? "Menyimpan..." : "Simpan Materi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}

