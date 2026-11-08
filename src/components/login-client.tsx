"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Library,
  ClipboardCheck,
  ShieldCheck,
  Mail,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  LockKeyhole,
  MapPin,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const DEMO_ACCOUNTS = [
  {
    label: "Superadmin BPS",
    roleBadge: "Superadmin",
    email: "superadmin@bps-berau.go.id",
    desc: "Kelola akun & Impersonasi semua peran",
  },
  {
    label: "Pembina Sektoral (BPS)",
    roleBadge: "Pembina BPS",
    email: "pembina@bps-berau.go.id",
    desc: "Penilaian skor 1–5, PDF viewer & reviu OPD",
  },
  {
    label: "Operator Dinkes Berau",
    roleBadge: "Operator OPD",
    email: "operator.dinkes@beraukab.go.id",
    desc: "Unggah & kelola bukti dukung EPSS Dinkes",
  },
  {
    label: "Operator Diskominfo",
    roleBadge: "Walidata OPD",
    email: "operator.diskominfo@beraukab.go.id",
    desc: "Unggah & kelola bukti dukung Diskominfo",
  },
];

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = React.useState("pembina@bps-berau.go.id");
  const [password, setPassword] = React.useState("sigap2026");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal masuk ke portal SIGAP BERAU.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Gagal menghubungi peladen autentikasi. Periksa koneksi Anda.");
      setLoading(false);
    }
  }

  function handleQuickSelect(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("sigap2026");
    setError(null);
  }

  return (
    <div
      className="flex min-h-screen w-full flex-col lg:flex-row bg-white dark:bg-slate-950"
      data-node-id="4:3058"
    >
      {/* Left Panel: Tentang layanan (Figma 4:3059) */}
      <aside
        className="flex w-full flex-col justify-between bg-[#10345b] p-8 text-white lg:w-[46%] lg:min-w-[520px] lg:max-w-[664px] lg:px-[56px] lg:py-[48px]"
        data-node-id="4:3059"
      >
        <div>
          {/* Identitas portal (4:3060) */}
          <div className="flex items-center gap-3" data-node-id="4:3060">
            <div
              className="flex h-[40px] w-[40px] items-end justify-center gap-[3px] rounded-[10px] bg-white/10 pb-[9px] ring-1 ring-white/20"
              data-node-id="4:3061"
            >
              <span className="h-[12px] w-[5px] rounded-[2px] bg-[#90dfd7]" />
              <span className="h-[22px] w-[5px] rounded-[2px] bg-white" />
              <span className="h-[17px] w-[5px] rounded-[2px] bg-[#1557b0]" />
            </div>
            <div>
              <p className="text-[18px] font-bold tracking-tight text-white leading-tight">
                SIGAP BERAU
              </p>
              <p className="text-[12px] text-[#acc5df]">
                BPS Kabupaten Berau
              </p>
            </div>
          </div>

          {/* Pesan utama (4:3068) */}
          <div className="mt-10 lg:mt-14" data-node-id="4:3068">
            <div className="flex items-center gap-2.5">
              <span className="h-[2px] w-[20px] rounded-full bg-[#90dfd7]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#90dfd7]">
                PEMBINAAN STATISTIK SEKTORAL
              </span>
            </div>
            <h1 className="mt-4 text-[26px] font-bold leading-[1.3] text-white lg:text-[30px]">
              Sistem Pembinaan Statistik Sektoral yang Terintegrasi untuk
              Akselerasi Pembangunan Kabupaten Berau
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-[#acc5df]">
              Kelola jadwal pembinaan, pelajari panduan standar data dan
              metadata, serta siapkan bukti dukung Evaluasi Penyelenggaraan
              Statistik Sektoral (EPSS) secara terstruktur dalam satu portal
              terpadu.
            </p>
          </div>

          {/* Visual wilayah (4:3074) */}
          <div
            className="relative mt-8 overflow-hidden rounded-[12px] border border-white/15 bg-gradient-to-br from-[#142b45] via-[#10345b] to-[#087f80]/50 p-6"
            data-node-id="4:3074"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3.5">
                <p className="text-[11px] text-[#90dfd7]">DOMAIN EPSS</p>
                <p className="mt-1 text-2xl font-bold text-white">5 Domain</p>
                <p className="mt-0.5 text-[11px] text-[#acc5df]">
                  19 Aspek · 38 Indikator
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3.5">
                <p className="text-[11px] text-[#90dfd7]">SKALA KEMATANGAN</p>
                <p className="mt-1 text-2xl font-bold text-white">Level 1–5</p>
                <p className="mt-0.5 text-[11px] text-[#acc5df]">
                  Rintisan s.d. Optimum
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3.5">
                <p className="text-[11px] text-[#90dfd7]">TARGET IPS 2026</p>
                <p className="mt-1 text-2xl font-bold text-white">&gt; 3,00</p>
                <p className="mt-0.5 text-[11px] text-[#acc5df]">
                  Predikat Baik / Memuaskan
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white">
                <MapPin className="h-3.5 w-3.5 text-[#90dfd7]" />
                <span>Kabupaten Berau, Kalimantan Timur (Kode BPS: 6405)</span>
              </div>
              <span className="text-[11px] text-[#acc5df]">
                Perban BPS No. 3 Tahun 2022
              </span>
            </div>
          </div>

          {/* Manfaat portal (4:3079) */}
          <div
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
            data-node-id="4:3079"
          >
            <div className="rounded-lg border border-white/10 bg-white/5 p-3.5">
              <CalendarDays className="h-[22px] w-[22px] text-[#90dfd7]" />
              <p className="mt-2.5 text-[13px] font-semibold text-white">
                Jadwal Pembinaan
              </p>
              <p className="mt-1 text-[12px] text-[#acc5df]">
                Kalender & daftar pendampingan OPD
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3.5">
              <Library className="h-[22px] w-[22px] text-[#90dfd7]" />
              <p className="mt-2.5 text-[13px] font-semibold text-white">
                Kumpulan Materi
              </p>
              <p className="mt-1 text-[12px] text-[#acc5df]">
                Repositori juknis, SOP & template
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3.5">
              <ClipboardCheck className="h-[22px] w-[22px] text-[#90dfd7]" />
              <p className="mt-2.5 text-[13px] font-semibold text-white">
                Penilaian EPSS
              </p>
              <p className="mt-1 text-[12px] text-[#acc5df]">
                Unggah bukti & reviu kematangan
              </p>
            </div>
          </div>
        </div>

        <p
          className="mt-8 text-[12px] text-[#acc5df]"
          data-node-id="4:3092"
        >
          © 2026 Badan Pusat Statistik Kabupaten Berau · Satu Data Indonesia
        </p>
      </aside>

      {/* Right Panel: Area masuk (Figma 4:3093) */}
      <main
        className="flex flex-1 flex-col justify-between px-6 py-8 sm:px-12 lg:px-[80px] lg:py-[48px]"
        data-node-id="4:3093"
      >
        {/* Top bar: Bantuan akses (4:3094) */}
        <div
          className="flex items-center justify-between text-[13px]"
          data-node-id="4:3094"
        >
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Portal Resmi Pembinaan Statistik Sektoral
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>

        {/* Center Form: Formulir masuk (4:3097) */}
        <div
          className="mx-auto my-8 w-full max-w-[440px]"
          data-node-id="4:3097"
        >
          <div data-node-id="4:3098">
            <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[12px] bg-[#ebf3ff] text-[#1557b0] dark:bg-blue-950 dark:text-blue-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-[26px] font-bold tracking-tight text-[#142b45] dark:text-white">
              Masuk ke Portal SIGAP
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
              Gunakan akun resmi{" "}
              <span className="font-medium text-[#10345b] dark:text-blue-300">
                Operator OPD
              </span>
              ,{" "}
              <span className="font-medium text-[#10345b] dark:text-blue-300">
                Pembina Sektoral BPS
              </span>
              , atau{" "}
              <span className="font-medium text-[#10345b] dark:text-blue-300">
                Superadmin
              </span>{" "}
              untuk melanjutkan.
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
            data-node-id="4:3103"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-medium text-[#142b45] dark:text-slate-200"
              >
                Alamat Surel Instansi
              </label>
              <div className="relative mt-1.5">
                <input
                  id="email"
                  type="email"
                  required
                  suppressHydrationWarning
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@beraukab.go.id"
                  className="h-[48px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-4 pr-11 text-[14px] text-[#142b45] placeholder:text-slate-400 focus:border-[#1557b0] focus:outline-none focus:ring-2 focus:ring-[#1557b0]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <Mail className="pointer-events-none absolute right-3.5 top-3.5 h-[18px] w-[18px] text-slate-400" />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-medium text-[#142b45] dark:text-slate-200"
              >
                Kata Sandi
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  suppressHydrationWarning
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="h-[48px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-4 pr-11 text-[14px] text-[#142b45] placeholder:text-slate-400 focus:border-[#1557b0] focus:outline-none focus:ring-2 focus:ring-[#1557b0]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Tampilkan atau sembunyikan kata sandi"
                >
                  {showPassword ? (
                    <Eye className="h-[18px] w-[18px]" />
                  ) : (
                    <EyeOff className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[13px]">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    rememberMe
                      ? "border-[#10345b] bg-[#10345b] text-white dark:border-blue-500 dark:bg-blue-600"
                      : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                  }`}
                >
                  {rememberMe && <Check className="h-3 w-3" />}
                </span>
                <span>Ingat sesi perangkat ini</span>
              </button>
              <span className="text-[12px] text-[#1557b0] dark:text-blue-400">
                Sandi bawaan: <strong>sigap2026</strong>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#10345b] px-6 text-[14px] font-semibold text-white transition hover:bg-[#142b45] disabled:opacity-60 dark:bg-[#1557b0] dark:hover:bg-blue-700"
              data-node-id="4:3120"
            >
              <span>{loading ? "Memverifikasi Akun..." : "Masuk ke Portal"}</span>
              <ArrowRight className="h-[18px] w-[18px]" />
            </button>
          </form>

          {/* Informasi akses & Akun Simulasi Cepat (4:3123) */}
          <div
            className="mt-6 rounded-[10px] border border-[#e1e8f0] bg-[#f8fafc] p-4 dark:border-slate-800 dark:bg-slate-900/70"
            data-node-id="4:3123"
          >
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#10345b] dark:text-blue-300">
                <Sparkles className="h-3.5 w-3.5 text-[#087f80]" />
                Pilih Cepat Akun Demo (Sandi: sigap2026)
              </p>
              <span className="text-[11px] text-slate-500">Klik untuk isi</span>
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickSelect(acc.email)}
                    className={`flex flex-col items-start rounded-[8px] border p-2.5 text-left transition ${
                      isSelected
                        ? "border-[#1557b0] bg-[#ebf3ff]/70 dark:border-blue-500 dark:bg-blue-950/60"
                        : "border-[#e1e8f0] bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-1">
                      <span className="text-[12px] font-semibold text-[#142b45] dark:text-white">
                        {acc.label}
                      </span>
                      <span className="rounded bg-[#10345b]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#10345b] dark:bg-blue-900/50 dark:text-blue-300">
                        {acc.roleBadge}
                      </span>
                    </div>
                    <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {acc.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Perlindungan akses (4:3127) */}
          <div
            className="mt-5 flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400"
            data-node-id="4:3127"
          >
            <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-[#087f80]" />
            <span>
              Dilindungi kontrol akses berbasis peran (RBAC) BPS Kabupaten Berau
            </span>
          </div>
        </div>

        {/* Kaki halaman masuk (4:3130) */}
        <footer
          className="text-center text-[12px] text-slate-400 dark:text-slate-500"
          data-node-id="4:3130"
        >
          <p>Badan Pusat Statistik Kabupaten Berau · Jl. Mangga II Tanjung Redeb</p>
          <p className="mt-1">Bantuan Teknis: (0554) 21084 · bps6405@bps.go.id</p>
        </footer>
      </main>
    </div>
  );
}

