"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Library,
  ClipboardCheck,
  ClipboardList,
  Users,
  Headset,
  ArrowUpRight,
  CircleHelp,
  LogOut,
  Building2,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  UserCheck,
  RotateCcw,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { ActiveSession, getRoleLabel } from "@/lib/roles";
import { cn, formatDateId } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  type: "EPSS_SUBMISSION" | "ASSESSMENT_SUBMISSION";
  title: string;
  description: string;
  opdShortName: string;
  href: string;
  createdAt: string;
}

interface ImpersonationCandidate {
  id: string;
  name: string;
  email: string;
  role: string;
  opdShortName: string | null;
}

export function DashboardShell({
  session,
  impersonationCandidates,
  notifications = [],
  children,
}: {
  session: ActiveSession;
  impersonationCandidates: ImpersonationCandidate[];
  notifications?: NotificationItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [switchingRole, setSwitchingRole] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifFilter, setNotifFilter] = React.useState<
    "ALL" | "EPSS_SUBMISSION" | "ASSESSMENT_SUBMISSION"
  >("ALL");
  const [readIds, setReadIds] = React.useState<string[]>([]);

  const unreadCount = notifications.filter(
    (n) => !readIds.includes(n.id)
  ).length;

  const filteredNotifications = notifications.filter(
    (n) => notifFilter === "ALL" || n.type === notifFilter
  );

  const { realUser, effectiveUser, isImpersonating } = session;

  const initials = effectiveUser.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleImpersonateChange(targetUserId: string) {
    setSwitchingRole(true);
    try {
      await fetch("/api/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      router.refresh();
    } finally {
      setSwitchingRole(false);
    }
  }

  const navItems = [
    {
      href: "/dashboard",
      label: "Ringkasan Portal",
      icon: LayoutDashboard,
      exact: true,
      show: true,
    },
    {
      href: "/dashboard/pembinaan",
      label: "Jadwal Pembinaan",
      icon: CalendarDays,
      exact: false,
      show: true,
    },
    {
      href: "/dashboard/materi",
      label: "Kumpulan Materi",
      icon: Library,
      exact: false,
      show: true,
    },
    {
      href: "/dashboard/asesmen",
      label: "Asesmen Kesiapan",
      icon: ClipboardList,
      exact: false,
      show: true,
    },
    {
      href: "/dashboard/epss",
      label: "Penilaian EPSS",
      icon: ClipboardCheck,
      exact: false,
      show: true,
    },
    {
      href: "/dashboard/users",
      label: "Manajemen Pengguna",
      icon: Users,
      exact: false,
      show: realUser.role === "SUPERADMIN",
    },
  ].filter((item) => item.show);

  return (
    <div className="flex min-h-screen w-full bg-[#f4f7fb] text-[#142b45] dark:bg-slate-950 dark:text-slate-100">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Persistent Collapsible Sidebar (Figma 4:3631) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col justify-between bg-[#10345b] text-white transition-all duration-200 lg:sticky lg:top-0 lg:h-screen",
          collapsed ? "w-[80px]" : "w-[256px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        data-node-id="4:3631"
      >
        <div className="flex flex-col gap-5 p-4">
          {/* Identitas portal (4:3632) */}
          <div
            className="flex items-center justify-between gap-2 pt-2"
            data-node-id="4:3632"
          >
            <Link
              href="/dashboard"
              className="flex items-center gap-3 overflow-hidden"
            >
              <div
                className="flex h-[40px] w-[40px] shrink-0 items-end justify-center gap-[3px] rounded-[10px] bg-white/10 pb-[9px] ring-1 ring-white/20"
                data-node-id="4:3633"
              >
                <span className="h-[12px] w-[5px] rounded-[2px] bg-[#90dfd7]" />
                <span className="h-[22px] w-[5px] rounded-[2px] bg-white" />
                <span className="h-[17px] w-[5px] rounded-[2px] bg-[#1557b0]" />
              </div>
              {!collapsed && (
                <div className="min-w-0" data-node-id="4:3637">
                  <p className="truncate text-[16px] font-bold tracking-tight text-white">
                    SIGAP BERAU
                  </p>
                  <p className="truncate text-[11px] text-[#acc5df]">
                    BPS Kabupaten Berau
                  </p>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden rounded-lg p-1.5 text-[#acc5df] hover:bg-white/10 hover:text-white lg:inline-flex"
              title={collapsed ? "Perluas Navigasi" : "Ciutkan Navigasi"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-[#acc5df] hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Wilayah layanan (4:3640) */}
          {!collapsed && (
            <div
              className="rounded-[10px] border border-white/10 bg-[#142b45]/90 p-3"
              data-node-id="4:3640"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#90dfd7]">
                WILAYAH LAYANAN
              </p>
              <p className="mt-1 text-[14px] font-semibold text-white">
                Kabupaten Berau
              </p>
              <p className="mt-0.5 text-[11px] text-[#acc5df]">
                Kalimantan Timur · Kode 6405
              </p>
            </div>
          )}

          {/* Menu layanan (4:3644) */}
          <nav className="space-y-1" data-node-id="4:3644">
            {!collapsed && (
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#acc5df]">
                MENU LAYANAN
              </p>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex h-[44px] items-center gap-3 rounded-[8px] px-3 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-[#1557b0] text-white shadow-sm"
                      : "text-[#acc5df] hover:bg-white/10 hover:text-white",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon className="h-[19px] w-[19px] shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Help & Account Menu */}
        <div className="space-y-4 p-4">
          {/* Bantuan pembinaan (4:3655) */}
          {!collapsed && (
            <div
              className="rounded-[10px] border border-white/15 bg-gradient-to-b from-white/10 to-white/5 p-3.5"
              data-node-id="4:3655"
            >
              <Headset className="h-5 w-5 text-[#90dfd7]" />
              <p className="mt-2.5 text-[13px] font-semibold text-white">
                Bantuan Pembinaan
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#acc5df]">
                Konsultasikan kendala pemenuhan bukti dukung EPSS bersama Tim
                Pembina BPS Berau.
              </p>
              <Link
                href="/dashboard/pembinaan"
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#90dfd7] hover:underline"
              >
                <span>Hubungi pembina</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Menu akun (4:3662) */}
          <div
            className="space-y-1 border-t border-white/10 pt-3"
            data-node-id="4:3662"
          >
            <Link
              href="/dashboard/materi"
              className={cn(
                "flex items-center gap-3 rounded-[8px] px-2.5 py-2 text-[13px] text-[#acc5df] hover:bg-white/10 hover:text-white",
                collapsed && "justify-center px-0"
              )}
              title="Panduan layanan"
            >
              <CircleHelp className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>Panduan layanan</span>}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-[13px] text-rose-300 hover:bg-rose-500/20 hover:text-rose-100",
                collapsed && "justify-center px-0"
              )}
              title="Keluar dari Portal"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>Keluar</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Figma 4:3669) */}
      <div className="flex min-w-0 flex-1 flex-col" data-node-id="4:3669">
        {/* Impersonation Banner when Superadmin is acting as Pembina or Operator OPD */}
        {isImpersonating && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-500 px-6 py-2 text-[13px] font-medium text-slate-950">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 shrink-0" />
              <span>
                Mode Impersonasi Superadmin Aktif: Anda sedang bertindak sebagai{" "}
                <strong>{effectiveUser.name}</strong> (
                {getRoleLabel(effectiveUser.role)}
                {effectiveUser.opdShortName
                  ? ` — ${effectiveUser.opdShortName}`
                  : ""}
                )
              </span>
            </div>
            <button
              type="button"
              disabled={switchingRole}
              onClick={() => handleImpersonateChange("STOP")}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Kembali ke Superadmin</span>
            </button>
          </div>
        )}

        {/* Top Header: Bilah atas (Figma 4:3670) */}
        <header
          className="sticky top-0 z-30 flex min-h-[80px] flex-wrap items-center justify-between gap-4 border-b border-[#e1e8f0] bg-white px-4 py-3 sm:px-8 dark:border-slate-800 dark:bg-slate-900"
          data-node-id="4:3670"
        >
          {/* Konteks akun (4:3671) */}
          <div className="flex items-center gap-3" data-node-id="4:3671">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-[#e1e8f0] p-2 text-[#142b45] lg:hidden dark:border-slate-700 dark:text-slate-200"
              aria-label="Buka navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Building2 className="hidden h-5 w-5 shrink-0 text-[#1557b0] sm:block dark:text-blue-400" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[14px] font-semibold text-[#142b45] dark:text-white">
                {effectiveUser.opdName ||
                  "Badan Pusat Statistik Kabupaten Berau"}
              </span>
              <Badge
                variant={
                  effectiveUser.role === "SUPERADMIN"
                    ? "default"
                    : effectiveUser.role === "PEMBINA_SEKTORAL"
                    ? "teal"
                    : "secondary"
                }
              >
                {getRoleLabel(effectiveUser.role)}
              </Badge>
            </div>
          </div>

          {/* Right Controls: Impersonation Selector (for Superadmin) + ThemeToggle + Profil pengguna (4:3676) */}
          <div
            className="flex flex-wrap items-center gap-3"
            data-node-id="4:3676"
          >
            {realUser.role === "SUPERADMIN" && (
              <div className="flex items-center gap-2 rounded-lg border border-[#e1e8f0] bg-[#f8fafc] px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                <UserCheck className="h-4 w-4 text-[#087f80]" />
                <label
                  htmlFor="impersonate-select"
                  className="hidden text-[11px] font-semibold text-slate-600 md:inline dark:text-slate-300"
                >
                  Peran Aktif:
                </label>
                <select
                  id="impersonate-select"
                  disabled={switchingRole}
                  value={isImpersonating ? effectiveUser.id : "STOP"}
                  onChange={(e) => handleImpersonateChange(e.target.value)}
                  className="rounded bg-transparent text-[12px] font-semibold text-[#10345b] focus:outline-none dark:text-blue-300"
                >
                  <option value="STOP" className="dark:bg-slate-900">
                    Superadmin Utama (BPS)
                  </option>
                  {impersonationCandidates.map((cand) => (
                    <option
                      key={cand.id}
                      value={cand.id}
                      className="dark:bg-slate-900"
                    >
                      {cand.role === "PEMBINA_SEKTORAL"
                        ? `[Pembina BPS] ${cand.name}`
                        : `[Operator ${cand.opdShortName || "OPD"}] ${cand.name}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <ThemeToggle />

            {/* Notification Bell Popover for EPSS Submissions & Assessment Submissions */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#10345b] dark:text-slate-400 dark:hover:bg-slate-800"
                title="Notifikasi Pengajuan Penilaian EPSS & Asesmen OPD"
                aria-label="Buka panel notifikasi"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#087f80] px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 top-12 z-50 w-[340px] sm:w-[400px] overflow-hidden rounded-[12px] border border-[#e1e8f0] bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-[#e1e8f0] bg-[#10345b] px-4 py-3 text-white">
                      <div>
                        <p className="text-[13px] font-bold">
                          Notifikasi Pengajuan OPD
                        </p>
                        <p className="text-[11px] text-[#90dfd7]">
                          Submit Penilaian EPSS & Asesmen Kesiapan
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setReadIds(notifications.map((n) => n.id))
                          }
                          className="rounded bg-white/10 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/20"
                        >
                          Tandai Dibaca
                        </button>
                      )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 border-b border-[#e1e8f0] bg-[#f8fafc] px-3 py-2 text-[11px] dark:border-slate-800 dark:bg-slate-800/60">
                      {[
                        { key: "ALL", label: "Semua" },
                        { key: "EPSS_SUBMISSION", label: "Penilaian EPSS" },
                        { key: "ASSESSMENT_SUBMISSION", label: "Asesmen OPD" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() =>
                            setNotifFilter(
                              tab.key as
                                | "ALL"
                                | "EPSS_SUBMISSION"
                                | "ASSESSMENT_SUBMISSION"
                            )
                          }
                          className={`rounded-md px-2.5 py-1 font-semibold transition ${
                            notifFilter === tab.key
                              ? "bg-[#10345b] text-white dark:bg-blue-600"
                              : "text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="max-h-[340px] divide-y divide-[#e1e8f0] overflow-y-auto dark:divide-slate-800">
                      {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((item) => {
                          const isUnread = !readIds.includes(item.id);
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => {
                                if (!readIds.includes(item.id)) {
                                  setReadIds((prev) => [...prev, item.id]);
                                }
                                setNotifOpen(false);
                              }}
                              className={`flex items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                                isUnread
                                  ? "bg-[#ebf3ff]/35 dark:bg-blue-950/20"
                                  : ""
                              }`}
                            >
                              <div
                                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                  item.type === "EPSS_SUBMISSION"
                                    ? "bg-[#ebf3ff] text-[#1557b0] dark:bg-blue-950 dark:text-blue-300"
                                    : "bg-teal-50 text-[#087f80] dark:bg-teal-950 dark:text-teal-300"
                                }`}
                              >
                                {item.type === "EPSS_SUBMISSION" ? (
                                  <ClipboardCheck className="h-4 w-4" />
                                ) : (
                                  <ClipboardList className="h-4 w-4" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <Badge
                                    variant={
                                      item.type === "EPSS_SUBMISSION"
                                        ? "secondary"
                                        : "teal"
                                    }
                                    className="px-1.5 py-0 text-[10px]"
                                  >
                                    {item.type === "EPSS_SUBMISSION"
                                      ? "Penilaian EPSS"
                                      : "Asesmen OPD"}
                                  </Badge>
                                  <span className="text-[10px] text-slate-400">
                                    {formatDateId(item.createdAt)}
                                  </span>
                                </div>
                                <p className="mt-1 text-[12px] font-bold text-[#142b45] dark:text-white">
                                  {item.title}
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          );
                        })
                      ) : (
                        <div className="px-4 py-8 text-center text-[12px] text-slate-500">
                          Belum ada notifikasi pengajuan baru pada kategori ini.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-[#e1e8f0] bg-[#f8fafc] px-4 py-2.5 text-[11px] font-semibold dark:border-slate-800 dark:bg-slate-800/40">
                      <Link
                        href="/dashboard/epss"
                        onClick={() => setNotifOpen(false)}
                        className="text-[#1557b0] hover:underline dark:text-blue-400"
                      >
                        Ke Penilaian EPSS →
                      </Link>
                      <Link
                        href="/dashboard/asesmen"
                        onClick={() => setNotifOpen(false)}
                        className="text-[#087f80] hover:underline dark:text-teal-400"
                      >
                        Ke Asesmen OPD →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="hidden h-7 w-[1px] bg-[#e1e8f0] sm:block dark:bg-slate-700" />

            <div className="flex items-center gap-2.5">
              <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[#10345b] text-[13px] font-bold text-white dark:bg-[#1557b0]">
                {initials}
              </div>
              <div className="hidden text-left sm:block">
                <p className="max-w-[160px] truncate text-[13px] font-semibold leading-tight text-[#142b45] dark:text-white">
                  {effectiveUser.name}
                </p>
                <p className="max-w-[160px] truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {effectiveUser.opdShortName || "BPS Kab. Berau"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content (Figma 4:3685) */}
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8" data-node-id="4:3685">
          {children}
        </main>

        {/* Footer: Kaki halaman (Figma 4:3881) */}
        <footer
          className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e1e8f0] bg-white px-4 py-4 text-[12px] text-slate-500 sm:px-8 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
          data-node-id="4:3881"
        >
          <p>
            © 2026 Badan Pusat Statistik Kabupaten Berau · Portal SIGAP BERAU
          </p>
          <p>Evaluasi Penyelenggaraan Statistik Sektoral (EPSS) Terintegrasi</p>
        </footer>
      </div>
    </div>
  );
}

