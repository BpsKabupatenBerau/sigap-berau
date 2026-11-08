"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Building2,
  CircleCheck,
  Download,
  List,
  Search,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateId } from "@/lib/utils";

export interface ScheduleItem {
  id: string;
  title: string;
  topic: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  mode: string;
  status: string;
  opdId: string | null;
  opdName: string | null;
  opdShortName: string | null;
  pembinaName: string;
  participants: number;
  notes: string | null;
}

export function PembinaanClient({
  schedules,
  opds,
  canManage,
  defaultPembinaName,
}: {
  schedules: ScheduleItem[];
  opds: Array<{ id: string; name: string; shortName: string }>;
  canManage: boolean;
  defaultPembinaName: string;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = React.useState<"list" | "calendar">("list");
  const [search, setSearch] = React.useState("");
  const [selectedOpd, setSelectedOpd] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");
  const [selectedTopic, setSelectedTopic] = React.useState("ALL");
  const [detailItem, setDetailItem] = React.useState<ScheduleItem | null>(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  // Create form state
  const [title, setTitle] = React.useState("");
  const [topic, setTopic] = React.useState("Domain 1 — Prinsip Satu Data Indonesia");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState("2026-11-20");
  const [startTime, setStartTime] = React.useState("09.00");
  const [endTime, setEndTime] = React.useState("12.00 WITA");
  const [location, setLocation] = React.useState("Aula Kantor BPS Kabupaten Berau");
  const [mode, setMode] = React.useState("TATAP_MUKA");
  const [opdId, setOpdId] = React.useState("ALL");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const filtered = schedules.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.topic.toLowerCase().includes(search.toLowerCase()) ||
      (item.opdName || "Seluruh OPD")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());

    const matchOpd =
      selectedOpd === "ALL" ||
      item.opdId === selectedOpd ||
      (selectedOpd === "UMUM" && !item.opdId);

    const matchStatus =
      selectedStatus === "ALL" || item.status === selectedStatus;

    const matchTopic =
      selectedTopic === "ALL" ||
      item.topic.toLowerCase().includes(selectedTopic.toLowerCase());

    return matchSearch && matchOpd && matchStatus && matchTopic;
  });

  const scheduledCount = schedules.filter(
    (s) => s.status === "TERJADWAL" || s.status === "BERLANGSUNG"
  ).length;
  const completedCount = schedules.filter((s) => s.status === "SELESAI").length;
  const uniqueOpdCount = new Set(
    schedules.map((s) => s.opdId).filter(Boolean)
  ).size;

  const nearestSchedule =
    schedules.find((s) => s.status === "TERJADWAL") || schedules[0];

  function handleExportCsv() {
    const header =
      "Tanggal,Waktu,Kegiatan,Topik,Instansi OPD,Lokasi,Metode,Status,Pembina\n";
    const rows = filtered
      .map(
        (s) =>
          `"${formatDateId(s.date)}","${s.startTime}-${s.endTime}","${s.title.replace(
            /"/g,
            '""'
          )}","${s.topic}","${s.opdShortName || "Semua OPD"}","${
            s.location
          }","${s.mode}","${s.status}","${s.pembinaName}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Jadwal_Pembinaan_Statistik_Sektoral_Berau_2026.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCreateSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/pembinaan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          topic,
          description,
          date,
          startTime,
          endTime,
          location,
          mode,
          opdId,
          pembinaName: defaultPembinaName,
          notes,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setTitle("");
        setDescription("");
        setNotes("");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  // Group schedules by day of month for Calendar view
  const calendarDays = Array.from({ length: 30 }, (_, idx) => {
    const dayNum = idx + 1;
    const dayMatches = filtered.filter((s) => {
      const d = new Date(s.date);
      return d.getUTCDate() === dayNum;
    });
    return { dayNum, events: dayMatches };
  });

  return (
    <div
      className="mx-auto max-w-[1160px] space-y-6"
      data-node-id="4:3134"
    >
      {/* Judul halaman (Figma 4:3190) */}
      <div
        className="flex flex-wrap items-end justify-between gap-4"
        data-node-id="4:3190"
      >
        <div className="max-w-3xl" data-node-id="4:3191">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#087f80] dark:text-teal-400">
            AGENDA PEMBINAAN STATISTIK SEKTORAL
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-[#142b45] dark:text-white">
            Jadwal Pembinaan dan Kegiatan Sektoral
          </h1>
          <p className="mt-1 text-[14px] text-slate-600 dark:text-slate-400">
            Jadwal pendampingan teknis, klinik metadata INDAH, pengajuan
            rekomendasi Romantik, dan evaluasi bukti dukung EPSS bersama BPS
            Kabupaten Berau.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex h-[42px] items-center gap-2 rounded-[8px] border border-[#e1e8f0] bg-white px-4 text-[13px] font-semibold text-[#142b45] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            data-node-id="4:3195"
          >
            <Download className="h-4 w-4 text-[#1557b0]" />
            <span>Unduh Jadwal</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-[#10345b] px-4 text-[13px] font-semibold text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Agenda</span>
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan bulan (Figma 4:3198) */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        data-node-id="4:3198"
      >
        <div
          className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          data-node-id="4:3199"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              Agenda Terjadwal
            </span>
            <CalendarDays className="h-5 w-5 text-[#1557b0]" />
          </div>
          <p className="mt-3 text-[32px] font-bold leading-none text-[#142b45] dark:text-white">
            {scheduledCount}
          </p>
          <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
            Kegiatan pendampingan aktif periode berjalan
          </p>
        </div>

        <div
          className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          data-node-id="4:3205"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              OPD Lokus Terlibat
            </span>
            <Building2 className="h-5 w-5 text-[#087f80]" />
          </div>
          <p className="mt-3 text-[32px] font-bold leading-none text-[#142b45] dark:text-white">
            {uniqueOpdCount || opds.length}
          </p>
          <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
            Perangkat daerah binaan di Kabupaten Berau
          </p>
        </div>

        <div
          className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          data-node-id="4:3211"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              Kegiatan Terlaksana
            </span>
            <CircleCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-[32px] font-bold leading-none text-[#142b45] dark:text-white">
            {completedCount}
          </p>
          <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
            Berita acara & notula pembinaan terdokumentasi
          </p>
        </div>
      </div>

      {/* Daftar kegiatan (Figma 4:3217) */}
      <div
        className="rounded-[12px] border border-[#e1e8f0] bg-white dark:border-slate-800 dark:bg-slate-900"
        data-node-id="4:3217"
      >
        {/* Judul daftar & Mode tampilan (4:3218) */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1e8f0] p-5 dark:border-slate-800"
          data-node-id="4:3218"
        >
          <div className="flex items-center gap-2.5" data-node-id="4:3219">
            <h2 className="text-[17px] font-bold text-[#142b45] dark:text-white">
              Daftar Kegiatan Pembinaan
            </h2>
            <Badge variant="secondary">{filtered.length} kegiatan</Badge>
          </div>

          <div
            className="inline-flex rounded-[8px] border border-[#e1e8f0] bg-[#f8fafc] p-1 dark:border-slate-700 dark:bg-slate-800"
            data-node-id="4:3223"
          >
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex h-[30px] items-center gap-1.5 rounded-[6px] px-3 text-[12px] font-semibold transition ${
                viewMode === "list"
                  ? "bg-white text-[#10345b] shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-[#142b45] dark:text-slate-400"
              }`}
              data-node-id="4:3224"
            >
              <List className="h-3.5 w-3.5" />
              <span>Daftar</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`inline-flex h-[30px] items-center gap-1.5 rounded-[6px] px-3 text-[12px] font-semibold transition ${
                viewMode === "calendar"
                  ? "bg-white text-[#10345b] shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-[#142b45] dark:text-slate-400"
              }`}
              data-node-id="4:3227"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Kalender</span>
            </button>
          </div>
        </div>

        {/* Filter agenda (4:3229) */}
        <div
          className="grid grid-cols-1 gap-3 border-b border-[#e1e8f0] bg-[#f8fafc]/60 p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-800/30"
          data-node-id="4:3229"
        >
          <div className="relative" data-node-id="4:3230">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kegiatan, topik, atau lokasi..."
              className="h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white pl-10 pr-3 text-[13px] text-[#142b45] placeholder:text-slate-400 focus:border-[#1557b0] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <select
            value={selectedOpd}
            onChange={(e) => setSelectedOpd(e.target.value)}
            className="h-[40px] rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[13px] text-[#142b45] focus:border-[#1557b0] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            data-node-id="4:3233"
          >
            <option value="ALL">Semua Instansi OPD</option>
            <option value="UMUM">Kegiatan Gabungan Seluruh OPD</option>
            {opds.map((opd) => (
              <option key={opd.id} value={opd.id}>
                {opd.shortName} — {opd.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="h-[40px] rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[13px] text-[#142b45] focus:border-[#1557b0] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            data-node-id="4:3236"
          >
            <option value="ALL">Semua Topik Domain EPSS</option>
            <option value="Domain 1">Domain 1 — Prinsip SDI</option>
            <option value="Domain 2">Domain 2 — Kualitas Data</option>
            <option value="Domain 3">Domain 3 — Proses Bisnis</option>
            <option value="Domain 4">Domain 4 — Kelembagaan</option>
            <option value="Domain 5">Domain 5 — Sistem Statistik Nasional</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-[40px] rounded-[8px] border border-[#e1e8f0] bg-white px-3 text-[13px] text-[#142b45] focus:border-[#1557b0] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            data-node-id="4:3239"
          >
            <option value="ALL">Semua Status Kegiatan</option>
            <option value="TERJADWAL">Terjadwal</option>
            <option value="SELESAI">Selesai</option>
          </select>
        </div>

        {/* List View vs Interactive Calendar View */}
        {viewMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr
                  className="border-b border-[#e1e8f0] bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400"
                  data-node-id="4:3242"
                >
                  <th className="px-5 py-3.5">Tanggal & Waktu</th>
                  <th className="px-4 py-3.5">Kegiatan & Topik Pembinaan</th>
                  <th className="px-4 py-3.5">Instansi Sasaran</th>
                  <th className="px-4 py-3.5">Lokasi & Metode</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e8f0] dark:divide-slate-800">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setDetailItem(item)}
                    className="cursor-pointer transition hover:bg-slate-50/90 dark:hover:bg-slate-800/40"
                    data-node-id="4:3248"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="font-semibold text-[#142b45] dark:text-white">
                        {formatDateId(item.date)}
                      </p>
                      <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                        {item.startTime} – {item.endTime}
                      </p>
                    </td>
                    <td className="max-w-[340px] px-4 py-4">
                      <p className="font-semibold text-[#142b45] dark:text-white">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#087f80] dark:text-teal-400">
                        {item.topic}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-[#142b45] dark:text-slate-200">
                        {item.opdName || "Seluruh OPD Kabupaten Berau"}
                      </p>
                      <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                        Pembina: {item.pembinaName}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-slate-700 dark:text-slate-300">
                        {item.location}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                        Metode: {item.mode.replace("_", " ")}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Badge
                          variant={
                            item.status === "SELESAI" ? "success" : "secondary"
                          }
                        >
                          {item.status === "SELESAI" ? "Selesai" : "Terjadwal"}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      Tidak ada agenda pembinaan yang sesuai dengan filter
                      pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[#142b45] dark:text-white">
                Kalender Kegiatan Pembinaan Sektoral — Oktober / November 2026
              </h3>
              <span className="text-[12px] text-slate-500">
                Klik agenda pada tanggal untuk melihat rincian
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 lg:grid-cols-6">
              {calendarDays.map((day) => (
                <div
                  key={day.dayNum}
                  className={`min-h-[104px] rounded-[8px] border p-2.5 transition ${
                    day.events.length > 0
                      ? "border-[#1557b0]/40 bg-[#ebf3ff]/30 dark:border-blue-800 dark:bg-blue-950/30"
                      : "border-[#e1e8f0] bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400">
                      Tgl {day.dayNum}
                    </span>
                    {day.events.length > 0 && (
                      <span className="h-2 w-2 rounded-full bg-[#087f80]" />
                    )}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {day.events.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setDetailItem(ev)}
                        className="w-full rounded bg-[#10345b] p-1.5 text-left text-[11px] text-white hover:bg-[#1557b0]"
                      >
                        <p className="line-clamp-2 font-semibold leading-tight">
                          {ev.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#90dfd7]">
                          {ev.startTime} · {ev.opdShortName || "Semua OPD"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pendukung agenda (Figma 4:3358) */}
      <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        data-node-id="4:3358"
      >
        {/* Agenda terdekat OPD (4:3359) */}
        {nearestSchedule && (
          <div
            className="flex items-center gap-4 rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            data-node-id="4:3359"
          >
            <div
              className="flex h-[68px] w-[64px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-[#10345b] text-white"
              data-node-id="4:3360"
            >
              <span className="text-[22px] font-bold leading-none">
                {new Date(nearestSchedule.date).getUTCDate()}
              </span>
              <span className="mt-1 text-[11px] uppercase text-[#90dfd7]">
                NOV
              </span>
            </div>
            <div className="min-w-0 flex-1" data-node-id="4:3363">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#087f80] dark:text-teal-400">
                AGENDA PEMBINAAN TERDEKAT
              </p>
              <h3 className="mt-0.5 truncate text-[15px] font-bold text-[#142b45] dark:text-white">
                {nearestSchedule.title}
              </h3>
              <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                {nearestSchedule.startTime} – {nearestSchedule.endTime} ·{" "}
                {nearestSchedule.location}
              </p>
            </div>
          </div>
        )}

        {/* Persiapan kegiatan (4:3367) */}
        <div
          className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          data-node-id="4:3367"
        >
          <h3 className="text-[15px] font-bold text-[#142b45] dark:text-white">
            Persiapan Sebelum Mengikuti Pembinaan
          </h3>
          <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">
            Pastikan Operator OPD membawa KAK/TOR 2 kegiatan statistik sektoral,
            draf SOP internal, serta akses akun INDAH dan Romantik BPS.
          </p>
          <Link
            href="/dashboard/materi"
            className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1557b0] hover:underline dark:text-blue-400"
          >
            <span>Unduh bahan & template persiapan →</span>
          </Link>
        </div>
      </div>

      {/* Modal Detail Kegiatan */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-[12px] border border-[#e1e8f0] bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge
                  variant={
                    detailItem.status === "SELESAI" ? "success" : "secondary"
                  }
                >
                  {detailItem.status}
                </Badge>
                <h3 className="mt-2 text-[18px] font-bold text-[#142b45] dark:text-white">
                  {detailItem.title}
                </h3>
                <p className="mt-1 text-[13px] font-medium text-[#087f80] dark:text-teal-400">
                  {detailItem.topic}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 rounded-lg bg-[#f8fafc] p-4 text-[13px] dark:bg-slate-800/60">
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                <Clock className="h-4 w-4 text-[#1557b0]" />
                <span>
                  {formatDateId(detailItem.date)} · {detailItem.startTime} –{" "}
                  {detailItem.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                <MapPin className="h-4 w-4 text-[#087f80]" />
                <span>
                  {detailItem.location} ({detailItem.mode.replace("_", " ")})
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                <Building2 className="h-4 w-4 text-[#1557b0]" />
                <span>
                  Sasaran:{" "}
                  <strong>
                    {detailItem.opdName || "Seluruh OPD Kabupaten Berau"}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                <User className="h-4 w-4 text-[#087f80]" />
                <span>Pembina Sektoral: {detailItem.pembinaName}</span>
              </div>
            </div>

            {detailItem.description && (
              <p className="mt-4 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                {detailItem.description}
              </p>
            )}

            {detailItem.notes && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <strong>Catatan Persiapan:</strong> {detailItem.notes}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="h-[40px] rounded-[8px] bg-[#10345b] px-5 text-[13px] font-semibold text-white hover:bg-[#142b45]"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Jadwal (Pembina / Superadmin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-[12px] border border-[#e1e8f0] bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#142b45] dark:text-white">
                Tambah Jadwal Pembinaan Statistik Sektoral
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="mt-4 space-y-3.5 text-[13px]">
              <div>
                <label className="block font-medium text-[#142b45] dark:text-slate-200">
                  Nama Kegiatan Pembinaan
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Klinik Penyusunan Metadata Statistik Dinas Pendidikan"
                  className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Topik Domain EPSS
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="Domain 1 — Prinsip Satu Data Indonesia">
                      Domain 1 — Prinsip SDI
                    </option>
                    <option value="Domain 2 — Kualitas Data">
                      Domain 2 — Kualitas Data
                    </option>
                    <option value="Domain 3 — Proses Bisnis Statistik">
                      Domain 3 — Proses Bisnis Statistik
                    </option>
                    <option value="Domain 4 — Kelembagaan">
                      Domain 4 — Kelembagaan
                    </option>
                    <option value="Domain 5 — Sistem Statistik Nasional">
                      Domain 5 — Sistem Statistik Nasional
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Instansi OPD Sasaran
                  </label>
                  <select
                    value={opdId}
                    onChange={(e) => setOpdId(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="ALL">Seluruh OPD Kabupaten Berau</option>
                    {opds.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.shortName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Jam Mulai
                  </label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Jam Selesai
                  </label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Lokasi Pelaksanaan
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Metode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="TATAP_MUKA">Tatap Muka</option>
                    <option value="DARING">Daring (Zoom)</option>
                    <option value="HIBRIDA">Hibrida</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#142b45] dark:text-slate-200">
                  Catatan Persiapan Peserta
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Dokumen atau instrumen yang perlu disiapkan oleh Operator OPD..."
                  className="mt-1 w-full rounded-[8px] border border-[#e1e8f0] p-2.5 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-[40px] rounded-[8px] border border-[#e1e8f0] px-4 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-[40px] rounded-[8px] bg-[#10345b] px-5 font-semibold text-white hover:bg-[#142b45]"
                >
                  {saving ? "Menyimpan..." : "Simpan Agenda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

