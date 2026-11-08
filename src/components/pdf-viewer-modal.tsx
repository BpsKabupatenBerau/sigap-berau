"use client";

import * as React from "react";
import {
  FileText,
  Download,
  ExternalLink,
  X,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/utils";

export interface ViewableDocument {
  id: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  targetLevel?: number;
  pageNumber?: string | null;
  description?: string | null;
  indicatorCode?: string;
  indicatorName?: string;
  opdName?: string;
}

export function PdfViewerModal({
  document,
  onClose,
}: {
  document: ViewableDocument | null;
  onClose: () => void;
}) {
  if (!document) return null;

  const isPdf =
    document.mimeType === "application/pdf" ||
    document.filePath.toLowerCase().endsWith(".pdf");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau Dokumen ${document.originalName}`}
    >
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[12px] border border-[#e1e8f0] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e8f0] bg-[#10345b] px-5 py-4 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#90dfd7]">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {document.indicatorCode && (
                  <span className="rounded bg-[#087f80] px-2 py-0.5 text-[11px] font-semibold text-white">
                    Indikator {document.indicatorCode}
                  </span>
                )}
                {document.opdName && (
                  <span className="text-[12px] text-[#90dfd7]">
                    {document.opdName}
                  </span>
                )}
              </div>
              <h3 className="mt-0.5 truncate text-[15px] font-bold text-white">
                {document.originalName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={document.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-[12px] font-medium text-white hover:bg-white/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Tab Baru</span>
            </a>
            <a
              href={document.filePath}
              download={document.originalName}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-[12px] font-semibold text-[#10345b] hover:bg-slate-100"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Tutup peninjau dokumen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e1e8f0] bg-[#f8fafc] px-5 py-2.5 text-[12px] dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#10345b] dark:text-blue-300">
              <BookOpen className="h-3.5 w-3.5 text-[#087f80]" />
              Rujukan Halaman: {document.pageNumber || "Halaman 1 s.d. selesai"}
            </span>
            <span>·</span>
            <span>Ukuran: {formatBytes(document.fileSize)}</span>
            {document.targetLevel && (
              <>
                <span>·</span>
                <Badge variant="teal">
                  Target Kematangan Level {document.targetLevel}
                </Badge>
              </>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Peninjau Dokumen Resmi BPS Kab. Berau
          </span>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950">
          {isPdf ? (
            <iframe
              src={document.filePath}
              title={document.originalName}
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ebf3ff] text-[#1557b0] dark:bg-blue-950 dark:text-blue-300">
                <FileText className="h-8 w-8" />
              </div>
              <h4 className="mt-4 text-base font-bold text-[#142b45] dark:text-white">
                Berkas Arsip / Dokumen Kerja ({document.originalName})
              </h4>
              <p className="mt-2 max-w-md text-[13px] text-slate-600 dark:text-slate-400">
                Berkas ini berformat <strong>{document.mimeType}</strong>.
                Silakan unduh berkas untuk memeriksa seluruh isi dokumen atau
                paket bukti dukung secara lengkap.
              </p>
              <a
                href={document.filePath}
                download={document.originalName}
                className="mt-5 inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-[#10345b] px-5 text-[13px] font-semibold text-white hover:bg-[#142b45]"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Berkas ({formatBytes(document.fileSize)})</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

