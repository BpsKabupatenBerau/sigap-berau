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
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateId } from "@/lib/utils";

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const MONTH_SHORT_ID = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MEI",
  "JUN",
  "JUL",
  "AGU",
  "SEP",
  "OKT",
  "NOV",
  "DES",
];

// Monday-first day names for calendar grid header
const WEEKDAY_HEADERS_ID = [
  { short: "Sen", full: "Senin", isWeekend: false },
  { short: "Sel", full: "Selasa", isWeekend: false },
  { short: "Rab", full: "Rabu", isWeekend: false },
  { short: "Kam", full: "Kamis", isWeekend: false },
  { short: "Jum", full: "Jumat", isWeekend: false },
  { short: "Sab", full: "Sabtu", isWeekend: true },
  { short: "Min", full: "Minggu", isWeekend: true },
];

// JS getUTCDay() is 0=Minggu .. 6=Sabtu
const UTC_DAY_NAMES_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

function getDayNameId(dateInput: Date | string): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return "";
  return UTC_DAY_NAMES_ID[d.getUTCDay()] || "";
}

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

  // Determine default calendar month & year from nearest schedule (or Nov 2026)
  const initialDateObj = nearestSchedule
    ? new Date(nearestSchedule.date)
    : new Date("2026-11-01T00:00:00.000Z");

  const [calendarYear, setCalendarYear] = React.useState<number>(
    Number.isNaN(initialDateObj.getTime())
      ? 2026
      : initialDateObj.getUTCFullYear()
  );
  const [calendarMonth, setCalendarMonth] = React.useState<number>(
    Number.isNaN(initialDateObj.getTime()) ? 10 : initialDateObj.getUTCMonth()
  );

  function handlePrevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  }

  // Distinct months that have schedules for quick jump buttons
  const scheduleMonthGroups = React.useMemo(() => {
    const map = new Map<
      string,
      { year: number; month: number; count: number }
    >();
    for (const s of filtered) {
      const d = new Date(s.date);
      if (Number.isNaN(d.getTime())) continue;
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth();
      const key = `${y}-${String(m).padStart(2, "0")}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { year: y, month: m, count: 1 });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => a.year - b.year || a.month - b.month
    );
  }, [filtered]);

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

  // Build accurate Monday-first 7-column calendar cells for (calendarYear, calendarMonth)
  const calendarCells = React.useMemo(() => {
    const firstDayOfMonth = new Date(
      Date.UTC(calendarYear, calendarMonth, 1)
    );
    const daysInCurrentMonth = new Date(
      Date.UTC(calendarYear, calendarMonth + 1, 0)
    ).getUTCDate();
    const daysInPrevMonth = new Date(
      Date.UTC(calendarYear, calendarMonth, 0)
    ).getUTCDate();

    // Convert Sunday=0..Saturday=6 into Monday=0..Sunday=6
    const startWeekdayMondayIndex = (firstDayOfMonth.getUTCDay() + 6) % 7;

    const cells: Array<{
      key: string;
      year: number;
      month: number;
      dayNum: number;
      isoDate: string;
      dayName: string;
      isCurrentMonth: boolean;
      isWeekend: boolean;
      events: ScheduleItem[];
    }> = [];

    // 1. Leading days from previous month
    const prevYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
    const prevMonth = calendarMonth === 0 ? 11 : calendarMonth - 1;
    for (let i = startWeekdayMondayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const dateObj = new Date(Date.UTC(prevYear, prevMonth, dayNum));
      const weekdayIdx = (dateObj.getUTCDay() + 6) % 7;
      const isoDate = `${prevYear}-${String(prevMonth + 1).padStart(
        2,
        "0"
      )}-${String(dayNum).padStart(2, "0")}`;
      const dayEvents = filtered.filter((s) => {
        const d = new Date(s.date);
        return (
          d.getUTCFullYear() === prevYear &&
          d.getUTCMonth() === prevMonth &&
          d.getUTCDate() === dayNum
        );
      });
      cells.push({
        key: `prev-${isoDate}`,
        year: prevYear,
        month: prevMonth,
        dayNum,
        isoDate,
        dayName: WEEKDAY_HEADERS_ID[weekdayIdx].full,
        isCurrentMonth: false,
        isWeekend: weekdayIdx >= 5,
        events: dayEvents,
      });
    }

    // 2. Days of the active month
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const dateObj = new Date(Date.UTC(calendarYear, calendarMonth, dayNum));
      const weekdayIdx = (dateObj.getUTCDay() + 6) % 7;
      const isoDate = `${calendarYear}-${String(calendarMonth + 1).padStart(
        2,
        "0"
      )}-${String(dayNum).padStart(2, "0")}`;
      const dayEvents = filtered.filter((s) => {
        const d = new Date(s.date);
        return (
          d.getUTCFullYear() === calendarYear &&
          d.getUTCMonth() === calendarMonth &&
          d.getUTCDate() === dayNum
        );
      });
      cells.push({
        key: `curr-${isoDate}`,
        year: calendarYear,
        month: calendarMonth,
        dayNum,
        isoDate,
        dayName: WEEKDAY_HEADERS_ID[weekdayIdx].full,
        isCurrentMonth: true,
        isWeekend: weekdayIdx >= 5,
        events: dayEvents,
      });
    }

    // 3. Trailing days from next month to complete the 7-column week row
    const remainder = cells.length % 7;
    const trailingCount = remainder === 0 ? 0 : 7 - remainder;
    const nextYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
    const nextMonth = calendarMonth === 11 ? 0 : calendarMonth + 1;
    for (let dayNum = 1; dayNum <= trailingCount; dayNum++) {
      const dateObj = new Date(Date.UTC(nextYear, nextMonth, dayNum));
      const weekdayIdx = (dateObj.getUTCDay() + 6) % 7;
      const isoDate = `${nextYear}-${String(nextMonth + 1).padStart(
        2,
        "0"
      )}-${String(dayNum).padStart(2, "0")}`;
      const dayEvents = filtered.filter((s) => {
        const d = new Date(s.date);
        return (
          d.getUTCFullYear() === nextYear &&
          d.getUTCMonth() === nextMonth &&
          d.getUTCDate() === dayNum
        );
      });
      cells.push({
        key: `next-${isoDate}`,
        year: nextYear,
        month: nextMonth,
        dayNum,
        isoDate,
        dayName: WEEKDAY_HEADERS_ID[weekdayIdx].full,
        isCurrentMonth: false,
        isWeekend: weekdayIdx >= 5,
        events: dayEvents,
      });
    }

    return cells;
  }, [calendarYear, calendarMonth, filtered]);

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
                        {getDayNameId(item.date)}, {formatDateId(item.date)}
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
          <div className="p-5 space-y-4">
            {/* Calendar Top Bar: Month/Year Navigation & Quick Jump Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e1e8f0] bg-white text-[#142b45] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="min-w-[180px] text-center">
                  <h3 className="text-[16px] font-bold text-[#142b45] dark:text-white">
                    {MONTH_NAMES_ID[calendarMonth]} {calendarYear}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e1e8f0] bg-white text-[#142b45] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Jump to Months with Agendas */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-medium text-slate-500">
                  Bulan Agenda:
                </span>
                {scheduleMonthGroups.map((grp) => {
                  const isActiveMonth =
                    grp.year === calendarYear && grp.month === calendarMonth;
                  return (
                    <button
                      key={`${grp.year}-${grp.month}`}
                      type="button"
                      onClick={() => {
                        setCalendarYear(grp.year);
                        setCalendarMonth(grp.month);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                        isActiveMonth
                          ? "border-[#10345b] bg-[#10345b] text-white dark:border-blue-500 dark:bg-blue-600"
                          : "border-[#e1e8f0] bg-[#f8fafc] text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <span>
                        {MONTH_NAMES_ID[grp.month]} {grp.year}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                          isActiveMonth
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {grp.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f8fafc] px-3.5 py-2 text-[11px] text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#10345b]" />
                  <span>Agenda Terjadwal</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#087f80]" />
                  <span>Kegiatan Selesai</span>
                </span>
              </div>
              <span>
                Klik kartu kegiatan pada tanggal untuk melihat rincian lengkap
              </span>
            </div>

            {/* 7-Column Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                {/* Day of Week Header Row (Senin - Minggu) */}
                <div className="grid grid-cols-7 rounded-t-[10px] border border-[#e1e8f0] bg-[#10345b] text-white dark:border-slate-800">
                  {WEEKDAY_HEADERS_ID.map((dayHeader) => (
                    <div
                      key={dayHeader.full}
                      className={`px-3 py-2.5 text-center text-[12px] font-bold tracking-wide ${
                        dayHeader.isWeekend ? "text-[#90dfd7]" : "text-white"
                      }`}
                    >
                      {dayHeader.full}
                    </div>
                  ))}
                </div>

                {/* Calendar Date Cells */}
                <div className="grid grid-cols-7 border-x border-b border-[#e1e8f0] dark:border-slate-800">
                  {calendarCells.map((cell) => {
                    const hasEvents = cell.events.length > 0;
                    return (
                      <div
                        key={cell.key}
                        className={`flex min-h-[124px] flex-col justify-between border-r border-b border-[#e1e8f0] p-2.5 transition last:border-r-0 dark:border-slate-800 ${
                          !cell.isCurrentMonth
                            ? "bg-slate-50/70 text-slate-400 dark:bg-slate-900/40 dark:text-slate-600"
                            : hasEvents
                            ? "bg-[#ebf3ff]/35 dark:bg-blue-950/25"
                            : cell.isWeekend
                            ? "bg-slate-50/40 dark:bg-slate-900/70"
                            : "bg-white dark:bg-slate-900"
                        }`}
                      >
                        <div>
                          {/* Cell Top Row: Date Number + Month (if edge) + Add Button */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center gap-1 text-[12px] font-bold ${
                                !cell.isCurrentMonth
                                  ? "text-slate-400 dark:text-slate-600"
                                  : hasEvents
                                  ? "rounded-md bg-[#10345b] px-2 py-0.5 text-white dark:bg-blue-600"
                                  : cell.isWeekend
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-[#142b45] dark:text-slate-200"
                              }`}
                            >
                              <span>{cell.dayNum}</span>
                              {(!cell.isCurrentMonth || cell.dayNum === 1) && (
                                <span className="text-[10px] font-semibold uppercase opacity-80">
                                  {MONTH_SHORT_ID[cell.month]}
                                </span>
                              )}
                            </span>

                            {canManage && cell.isCurrentMonth && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDate(cell.isoDate);
                                  setShowCreateModal(true);
                                }}
                                className="rounded p-0.5 text-slate-400 hover:bg-slate-200/70 hover:text-[#10345b] dark:hover:bg-slate-800 dark:hover:text-white"
                                title={`Tambah agenda pada ${cell.dayName}, ${cell.dayNum} ${MONTH_NAMES_ID[cell.month]} ${cell.year}`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Events List in this Date Cell */}
                          <div className="mt-2 space-y-1.5">
                            {cell.events.map((ev) => (
                              <button
                                key={ev.id}
                                type="button"
                                onClick={() => setDetailItem(ev)}
                                className={`w-full rounded-[6px] p-1.5 text-left text-[11px] text-white shadow-2xs transition ${
                                  ev.status === "SELESAI"
                                    ? "bg-[#087f80] hover:bg-[#066667]"
                                    : "bg-[#10345b] hover:bg-[#1557b0]"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 text-[10px] text-[#90dfd7]">
                                  <span className="font-semibold">
                                    {ev.startTime}
                                  </span>
                                  <span className="truncate">
                                    {ev.opdShortName || "Semua OPD"}
                                  </span>
                                </div>
                                <p className="mt-0.5 line-clamp-2 font-semibold leading-snug text-white">
                                  {ev.title}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {hasEvents && (
                          <p className="mt-1.5 text-right text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {cell.events.length} agenda
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
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
              <span className="text-[10px] font-semibold text-[#90dfd7]">
                {getDayNameId(nearestSchedule.date).slice(0, 3).toUpperCase()}
              </span>
              <span className="text-[20px] font-bold leading-none">
                {new Date(nearestSchedule.date).getUTCDate()}
              </span>
              <span className="mt-0.5 text-[10px] uppercase text-[#90dfd7]">
                {MONTH_SHORT_ID[new Date(nearestSchedule.date).getUTCMonth()] ||
                  "NOV"}
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

