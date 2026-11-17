"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  FileSpreadsheet,
  Presentation,
  Files,
  Folder,
  FolderOpen,
  Download,
  Eye,
  Plus,
  Trash2,
  X,
  BookOpen,
  Scale,
  GraduationCap,
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

export type FolderKey = "Modul Pembinaan" | "Panduan EPSS" | "Regulasi";

interface FolderDefinition {
  key: FolderKey;
  title: string;
  subtitle: string;
  accentColor: string;
  iconBg: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FOLDERS: FolderDefinition[] = [
  {
    key: "Modul Pembinaan",
    title: "Modul Pembinaan",
    subtitle: "Materi sosialisasi, modul bimbingan teknis, template SOP, dan instrumen metadata",
    accentColor: "text-[#1557b0] dark:text-blue-400",
    iconBg: "bg-[#ebf3ff] text-[#1557b0] dark:bg-blue-950/70 dark:text-blue-300",
    icon: GraduationCap,
  },
  {
    key: "Panduan EPSS",
    title: "Panduan EPSS",
    subtitle: "Petunjuk teknis penilaian 38 indikator, spesifikasi bukti dukung, dan contoh paket bukti",
    accentColor: "text-[#087f80] dark:text-teal-400",
    iconBg: "bg-teal-50 text-[#087f80] dark:bg-teal-950/70 dark:text-teal-300",
    icon: BookOpen,
  },
  {
    key: "Regulasi",
    title: "Regulasi",
    subtitle: "Peraturan BPS, Perpres/Perbup Satu Data Indonesia, dan SK penyelenggaraan statistik",
    accentColor: "text-amber-700 dark:text-amber-400",
    iconBg: "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
    icon: Scale,
  },
];

export function resolveFolderKey(rawCategory: string): FolderKey {
  const lower = (rawCategory || "").toLowerCase();
  if (lower.includes("regulasi") || lower.includes("kebijakan")) {
    return "Regulasi";
  }
  if (lower.includes("panduan")) {
    return "Panduan EPSS";
  }
  return "Modul Pembinaan";
}

export function MateriClient({
  materials,
  canManage,
}: {
  materials: MaterialItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [activeFolder, setActiveFolder] =
    React.useState<FolderKey>("Modul Pembinaan");
  const [search, setSearch] = React.useState("");
  const [previewDoc, setPreviewDoc] = React.useState<ViewableDocument | null>(
    null
  );
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Add Material Form State
  const [title, setTitle] = React.useState("");
  const [folderCategory, setFolderCategory] =
    React.useState<FolderKey>("Modul Pembinaan");
  const [format, setFormat] = React.useState("PDF");
  const [fileSize, setFileSize] = React.useState("2,0 MB");
  const [description, setDescription] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Group materials by the 3 folders
  const folderCounts = React.useMemo(() => {
    const counts: Record<FolderKey, number> = {
      "Modul Pembinaan": 0,
      "Panduan EPSS": 0,
      Regulasi: 0,
    };
    for (const item of materials) {
      const fKey = resolveFolderKey(item.category);
      counts[fKey] += 1;
    }
    return counts;
  }, [materials]);

  // Materials inside the currently selected folder (or matching search)
  const displayedMaterials = React.useMemo(() => {
    return materials.filter((item) => {
      const itemFolder = resolveFolderKey(item.category);
      const matchFolder = itemFolder === activeFolder;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.format.toLowerCase().includes(q);

      return matchFolder && matchSearch;
    });
  }, [materials, activeFolder, search]);

  function openAddModalForFolder(targetFolder: FolderKey) {
    setFolderCategory(targetFolder);
    setTitle("");
    setDescription("");
    setSelectedFile(null);
    setFormat("PDF");
    setFileSize("2,0 MB");
    setErrorMsg(null);
    setShowAddModal(true);
  }

  function openMaterialPreview(mat: MaterialItem) {
    setPreviewDoc({
      id: mat.id,
      originalName: `${mat.title}.${mat.format.toLowerCase()}`,
      filePath: mat.fileUrl,
      mimeType:
        mat.format.toUpperCase() === "PDF"
          ? "application/pdf"
          : "application/octet-stream",
      fileSize: 2500000,
      pageNumber: resolveFolderKey(mat.category),
      description: mat.description,
      indicatorCode: resolveFolderKey(mat.category),
      opdName: mat.targetAudience || "Semua OPD",
    });
  }

  async function handleCreateMaterial(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", folderCategory);
      formData.append("format", format);
      formData.append("fileSize", fileSize);
      formData.append("targetAudience", "Semua OPD");
      formData.append("domainCode", "Semua Domain");
      formData.append("description", description);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/materi", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal menyimpan materi.");
        return;
      }

      setActiveFolder(folderCategory);
      setShowAddModal(false);
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMaterial(id: string, matTitle: string) {
    if (!window.confirm(`Hapus materi "${matTitle}" dari folder ini?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/materi?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  function renderFormatIcon(fmt: string) {
    switch (fmt.toUpperCase()) {
      case "XLSX":
        return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
      case "PPTX":
        return <Presentation className="h-5 w-5 text-amber-600" />;
      case "ZIP":
        return <Files className="h-5 w-5 text-[#087f80]" />;
      default:
        return <FileText className="h-5 w-5 text-[#1557b0]" />;
    }
  }

  const currentFolderDef =
    FOLDERS.find((f) => f.key === activeFolder) || FOLDERS[0];

  return (
    <div className="mx-auto max-w-[1160px] space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#087f80] dark:text-teal-400">
            PUSTAKA RUJUKAN STATISTIK SEKTORAL
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-[#142b45] dark:text-white">
            Kumpulan Materi Pembinaan
          </h1>
          <p className="mt-1 text-[14px] text-slate-600 dark:text-slate-400">
            Pilih salah satu dari 3 folder utama di bawah ini untuk mengakses atau
            mengunggah berkas Modul Pembinaan, Panduan EPSS, dan Regulasi.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => openAddModalForFolder(activeFolder)}
            className="inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-[#10345b] px-4 text-[13px] font-semibold text-white transition hover:bg-[#142b45] dark:bg-[#1557b0]"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Materi ke "{activeFolder}"</span>
          </button>
        )}
      </div>

      {/* 3 Kartu Folder Utama */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {FOLDERS.map((folder) => {
          const isOpen = activeFolder === folder.key;
          const count = folderCounts[folder.key];
          const FolderIconComponent = isOpen ? FolderOpen : Folder;

          return (
            <div
              key={folder.key}
              onClick={() => setActiveFolder(folder.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveFolder(folder.key);
                }
              }}
              className={`group flex cursor-pointer flex-col justify-between rounded-[12px] border p-5 text-left transition ${
                isOpen
                  ? "border-[#10345b] bg-[#10345b] text-white shadow-md dark:border-blue-500 dark:bg-slate-900"
                  : "border-[#e1e8f0] bg-white text-[#142b45] hover:border-[#1557b0]/60 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-[10px] ${
                      isOpen
                        ? "bg-white/15 text-[#90dfd7]"
                        : folder.iconBg
                    }`}
                  >
                    <FolderIconComponent className="h-6 w-6" />
                  </div>

                  <Badge
                    variant={isOpen ? "teal" : "outline"}
                    className={
                      isOpen
                        ? "bg-white/15 text-white border-white/20"
                        : "font-semibold"
                    }
                  >
                    {count} Berkas
                  </Badge>
                </div>

                <h2
                  className={`mt-4 text-[18px] font-bold ${
                    isOpen ? "text-white" : "text-[#142b45] dark:text-white"
                  }`}
                >
                  {folder.title}
                </h2>
                <p
                  className={`mt-1 text-[12px] leading-relaxed ${
                    isOpen
                      ? "text-[#acc5df]"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {folder.subtitle}
                </p>
              </div>

              <div
                className={`mt-4 flex items-center justify-between border-t pt-3 text-[12px] font-semibold ${
                  isOpen
                    ? "border-white/15 text-[#90dfd7]"
                    : "border-slate-100 text-[#1557b0] dark:border-slate-800 dark:text-blue-400"
                }`}
              >
                <span>
                  {isOpen ? "Folder Sedang Dibuka" : "Klik untuk Buka Folder"}
                </span>

                {canManage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddModalForFolder(folder.key);
                    }}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                      isOpen
                        ? "bg-white text-[#10345b] hover:bg-slate-100"
                        : "bg-[#ebf3ff] text-[#1557b0] hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-300"
                    }`}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Isi Materi</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Isi Folder Aktif */}
      <div className="rounded-[12px] border border-[#e1e8f0] bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {/* Baris Judul Folder & Pencarian */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e8f0] px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="h-5 w-5 text-[#087f80] dark:text-teal-400" />
            <div>
              <h3 className="text-[16px] font-bold text-[#142b45] dark:text-white">
                Isi Folder: {currentFolderDef.title}
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Menampilkan {displayedMaterials.length} berkas di dalam folder{" "}
                <strong>{currentFolderDef.title}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Cari di folder ${currentFolderDef.title}...`}
                className="h-[36px] w-full rounded-[8px] border border-[#e1e8f0] bg-[#f8fafc] pl-9 pr-3 text-[12px] text-[#142b45] placeholder:text-slate-400 focus:border-[#1557b0] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => openAddModalForFolder(activeFolder)}
                className="inline-flex h-[36px] items-center gap-1.5 rounded-[8px] bg-[#087f80] px-3.5 text-[12px] font-semibold text-white hover:bg-[#066667]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Unggah ke Folder Ini</span>
              </button>
            )}
          </div>
        </div>

        {/* Daftar Berkas di Dalam Folder */}
        {displayedMaterials.length > 0 ? (
          <div className="divide-y divide-[#e1e8f0] dark:divide-slate-800">
            {displayedMaterials.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/80 sm:flex-row sm:items-center dark:hover:bg-slate-800/40"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#ebf3ff]/70 dark:bg-slate-800">
                    {renderFormatIcon(item.format)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[14px] font-bold text-[#142b45] dark:text-white">
                        {item.title}
                      </h4>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {item.format}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {item.fileSize}
                      </span>
                    </div>

                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-[12px] text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    )}

                    <p className="mt-1 text-[11px] text-slate-400">
                      Diunggah oleh {item.author} · {item.publishedLabel}
                    </p>
                  </div>
                </div>

                {/* Tombol Aksi Berkas */}
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openMaterialPreview(item)}
                    className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[12px] font-semibold text-[#142b45] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#1557b0]" />
                    <span>Buka</span>
                  </button>

                  <a
                    href={item.fileUrl}
                    download={`${item.title}.${item.format.toLowerCase()}`}
                    className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] bg-[#10345b] px-3 text-[12px] font-semibold text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Unduh</span>
                  </a>

                  {canManage && (
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDeleteMaterial(item.id, item.title)}
                      className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-rose-200 bg-rose-50/60 text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                      title="Hapus materi dari folder"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Folder className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-[14px] font-semibold text-[#142b45] dark:text-white">
              Belum ada berkas materi di folder "{currentFolderDef.title}"
            </p>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
              {canManage
                ? "Klik tombol 'Unggah ke Folder Ini' untuk memasukkan berkas baru ke dalam folder ini."
                : "Tim Pembina BPS belum menambahkan berkas pada folder ini."}
            </p>
          </div>
        )}
      </div>

      {/* Modal Tambah Materi ke Dalam Folder (Admin & Pembina) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-[12px] border border-[#e1e8f0] bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-[#e1e8f0] pb-3 dark:border-slate-800">
              <div>
                <Badge variant="teal">Unggah Materi Baru</Badge>
                <h3 className="mt-1 text-[18px] font-bold text-[#142b45] dark:text-white">
                  Masukkan Materi ke Folder
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">
                {errorMsg}
              </div>
            )}

            <form
              onSubmit={handleCreateMaterial}
              className="mt-4 space-y-4 text-[13px]"
            >
              {/* Pilihan 3 Folder Tujuan */}
              <div>
                <label className="block font-semibold text-[#142b45] dark:text-slate-200">
                  1. Pilih Folder Tujuan
                </label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {FOLDERS.map((f) => {
                    const selected = folderCategory === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFolderCategory(f.key)}
                        className={`flex flex-col items-center justify-center rounded-[8px] border p-2.5 text-center text-[12px] font-semibold transition ${
                          selected
                            ? "border-[#10345b] bg-[#10345b] text-white dark:border-blue-500 dark:bg-blue-600"
                            : "border-[#e1e8f0] bg-[#f8fafc] text-[#142b45] hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <Folder className="mb-1 h-4 w-4" />
                        <span>{f.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Judul Materi */}
              <div>
                <label className="block font-semibold text-[#142b45] dark:text-slate-200">
                  2. Judul Materi / Dokumen
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Modul Penyusunan Metadata Statistik Sektoral"
                  className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {/* Unggah Berkas */}
              <div>
                <label className="block font-semibold text-[#142b45] dark:text-slate-200">
                  3. Pilih Berkas (.pdf, .docx, .xlsx, .pptx, .zip — Maks. 5 MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.xlsx,.pptx,.zip"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setSelectedFile(f);
                    if (f) {
                      if (!title.trim()) {
                        setTitle(f.name.replace(/\.[^/.]+$/, ""));
                      }
                      const ext = f.name.split(".").pop()?.toUpperCase();
                      if (
                        ext &&
                        ["PDF", "DOCX", "XLSX", "PPTX", "ZIP"].includes(ext)
                      ) {
                        setFormat(ext);
                      }
                      const mb = (f.size / (1024 * 1024))
                        .toFixed(1)
                        .replace(".", ",");
                      setFileSize(`${mb} MB`);
                    }
                  }}
                  className="mt-1 block w-full rounded-[8px] border border-dashed border-[#1557b0] bg-[#ebf3ff]/30 p-2 text-[12px] text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#10345b] file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-white hover:file:bg-[#142b45] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                />
              </div>

              {/* Keterangan Singkat (Opsional) */}
              <div>
                <label className="block font-semibold text-[#142b45] dark:text-slate-200">
                  4. Keterangan Singkat{" "}
                  <span className="font-normal text-slate-400">(Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan ringkasan isi berkas bila diperlukan..."
                  className="mt-1 w-full rounded-[8px] border border-[#e1e8f0] p-2.5 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[#e1e8f0] pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-[38px] rounded-[8px] border border-[#e1e8f0] px-4 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-[38px] rounded-[8px] bg-[#10345b] px-5 font-semibold text-white hover:bg-[#142b45]"
                >
                  {saving ? "Mengunggah..." : "Simpan ke Folder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pratinjau PDF */}
      <PdfViewerModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
