"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  UserCheck,
  ShieldCheck,
  Building2,
  Search,
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRole, getRoleLabel } from "@/lib/roles";

export interface ManagedUserItem {
  id: string;
  name: string;
  email: string;
  nip: string | null;
  role: UserRole;
  jabatan: string | null;
  phone: string | null;
  isActive: boolean;
  opdId: string | null;
  opdName: string | null;
  opdShortName: string | null;
}

export function UsersClient({
  users,
  opds,
  realUserId,
  activeEffectiveUserId,
  isImpersonating,
}: {
  users: ManagedUserItem[];
  opds: Array<{ id: string; code: string; name: string; shortName: string }>;
  realUserId: string;
  activeEffectiveUserId: string;
  isImpersonating: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  // Create form state
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [nip, setNip] = React.useState("");
  const [password, setPassword] = React.useState("sigap2026");
  const [role, setRole] = React.useState<UserRole>("OPERATOR_OPD");
  const [jabatan, setJabatan] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [opdId, setOpdId] = React.useState(opds[0]?.id || "");
  const [createNewOpd, setCreateNewOpd] = React.useState(false);
  const [newOpdName, setNewOpdName] = React.useState("");
  const [newOpdShortName, setNewOpdShortName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.opdName || "BPS Kabupaten Berau")
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  async function handleImpersonate(targetUserId: string) {
    const res = await fetch("/api/auth/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    if (res.ok) {
      router.push("/dashboard/epss");
      router.refresh();
    }
  }

  async function handleToggleActive(user: ManagedUserItem) {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        isActive: !user.isActive,
      }),
    });
    router.refresh();
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          nip,
          password,
          role,
          jabatan,
          phone,
          opdId: createNewOpd ? null : opdId,
          newOpdName: createNewOpd ? newOpdName : null,
          newOpdShortName: createNewOpd ? newOpdShortName : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat akun pengguna.");
        setSubmitting(false);
        return;
      }

      setMessage(`Akun ${data.user.name} berhasil ditambahkan.`);
      setName("");
      setEmail("");
      setNip("");
      setJabatan("");
      setPhone("");
      setNewOpdName("");
      setNewOpdShortName("");
      router.refresh();
      setTimeout(() => {
        setShowCreateModal(false);
        setMessage(null);
      }, 900);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1160px] space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#087f80] dark:text-teal-400">
            MANAJEMEN HAK AKSES & IMPERSONASI SUPERADMIN
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-[#142b45] dark:text-white">
            Manajemen Akun Pengguna & Peran (RBAC)
          </h1>
          <p className="mt-1 text-[14px] text-slate-600 dark:text-slate-400">
            Kelola akun <strong>Pembina Sektoral (BPS)</strong> dan{" "}
            <strong>Operator OPD</strong>, serta jalankan fitur{" "}
            <strong>Impersonasi</strong> untuk bertindak sebagai pengguna
            tertentu.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isImpersonating && (
            <button
              type="button"
              onClick={() => handleImpersonate("STOP")}
              className="inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-amber-500 px-4 text-[13px] font-semibold text-slate-950 hover:bg-amber-400"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Hentikan Impersonasi</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-[#10345b] px-4 text-[13px] font-semibold text-white hover:bg-[#142b45] dark:bg-[#1557b0]"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah Akun Pengguna</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">
              Total Akun Terdaftar
            </span>
            <Users className="h-5 w-5 text-[#1557b0]" />
          </div>
          <p className="mt-3 text-[30px] font-bold text-[#142b45] dark:text-white">
            {users.length} Pengguna
          </p>
          <p className="mt-1 text-[12px] text-slate-500">
            Seluruh akun dilindungi enkripsi PBKDF2-SHA512
          </p>
        </div>

        <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">
              Pembina Sektoral BPS
            </span>
            <ShieldCheck className="h-5 w-5 text-[#087f80]" />
          </div>
          <p className="mt-3 text-[30px] font-bold text-[#142b45] dark:text-white">
            {users.filter((u) => u.role === "PEMBINA_SEKTORAL").length} Pembina
          </p>
          <p className="mt-1 text-[12px] text-slate-500">
            Penilai Tingkat Kematangan & Reviu EPSS
          </p>
        </div>

        <div className="rounded-[12px] border border-[#e1e8f0] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">
              Operator Perangkat Daerah
            </span>
            <Building2 className="h-5 w-5 text-[#1557b0]" />
          </div>
          <p className="mt-3 text-[30px] font-bold text-[#142b45] dark:text-white">
            {users.filter((u) => u.role === "OPERATOR_OPD").length} Operator OPD
          </p>
          <p className="mt-1 text-[12px] text-slate-500">
             tersebar pada {opds.length} OPD Kabupaten Berau
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-[12px] border border-[#e1e8f0] bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e8f0] p-4 dark:border-slate-800">
          <div className="relative w-full sm:w-[320px]">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, surel, NIP, atau instansi OPD..."
              className="h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white pl-10 pr-3 text-[13px] focus:border-[#1557b0] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {["ALL", "SUPERADMIN", "PEMBINA_SEKTORAL", "OPERATOR_OPD"].map(
              (r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`h-[34px] rounded-[8px] px-3 text-[12px] font-semibold transition ${
                    roleFilter === r
                      ? "bg-[#10345b] text-white dark:bg-blue-600"
                      : "border border-[#e1e8f0] bg-white text-slate-600 hover:text-[#142b45] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {r === "ALL"
                    ? "Semua Peran"
                    : getRoleLabel(r as UserRole)}
                </button>
              )
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e1e8f0] bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="px-5 py-3.5">Nama & NIP Pegawai</th>
                <th className="px-4 py-3.5">Surel & Jabatan</th>
                <th className="px-4 py-3.5">Peran (RBAC)</th>
                <th className="px-4 py-3.5">Unit Kerja / OPD</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">
                  Tindakan & Impersonasi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e8f0] dark:divide-slate-800">
              {filtered.map((user) => {
                const isCurrentlyImpersonated =
                  isImpersonating && activeEffectiveUserId === user.id;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#142b45] dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        NIP: {user.nip || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-[#1557b0] dark:text-blue-400">
                        {user.email}
                      </p>
                      <p className="text-[12px] text-slate-500">
                        {user.jabatan || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant={
                          user.role === "SUPERADMIN"
                            ? "default"
                            : user.role === "PEMBINA_SEKTORAL"
                            ? "teal"
                            : "secondary"
                        }
                      >
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-[#142b45] dark:text-slate-200">
                        {user.opdName || "BPS Kabupaten Berau"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {user.isActive ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : (
                        <Badge variant="destructive">Nonaktif</Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {user.id !== realUserId && user.isActive && (
                          <button
                            type="button"
                            onClick={() =>
                              handleImpersonate(
                                isCurrentlyImpersonated ? "STOP" : user.id
                              )
                            }
                            className={`inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[12px] font-semibold transition ${
                              isCurrentlyImpersonated
                                ? "bg-amber-500 text-slate-950"
                                : "bg-[#087f80] text-white hover:bg-[#066667]"
                            }`}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>
                              {isCurrentlyImpersonated
                                ? "Sedang Diimpersonasi"
                                : "Impersonasi Peran"}
                            </span>
                          </button>
                        )}

                        {user.id !== realUserId && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(user)}
                            className="rounded-[7px] border border-[#e1e8f0] px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                          >
                            {user.isActive ? "Nonaktifkan" : "Aktifkan"}
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

      {/* Modal Tambah Akun Pengguna Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-lg rounded-[12px] border border-[#e1e8f0] bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-[#e1e8f0] pb-4 dark:border-slate-800">
              <h3 className="text-[18px] font-bold text-[#142b45] dark:text-white">
                Buat Akun Pengguna Baru (Operator OPD / Pembina BPS)
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-[13px] text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[13px] text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <form
              onSubmit={handleCreateUser}
              className="mt-4 space-y-3.5 text-[13px]"
            >
              <div>
                <label className="block font-semibold text-[#142b45] dark:text-slate-200">
                  Peran Hak Akses (RBAC)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 font-semibold text-[#10345b] dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300"
                >
                  <option value="OPERATOR_OPD">
                    Operator OPD (Unggah & Kelola Bukti Dukung OPD)
                  </option>
                  <option value="PEMBINA_SEKTORAL">
                    Pembina Sektoral BPS (Penilaian Skor 1–5 & Reviu)
                  </option>
                  <option value="SUPERADMIN">
                    Superadmin BPS (Manajemen Penuh & Impersonasi)
                  </option>
                </select>
              </div>

              {role === "OPERATOR_OPD" && (
                <div className="rounded-lg border border-[#e1e8f0] bg-[#f8fafc] p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#142b45] dark:text-white">
                      Organisasi Perangkat Daerah (OPD)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCreateNewOpd(!createNewOpd)}
                      className="text-[11px] font-semibold text-[#1557b0] hover:underline"
                    >
                      {createNewOpd
                        ? "Pilih dari OPD Terdaftar"
                        : "+ Tambah OPD Baru"}
                    </button>
                  </div>

                  {!createNewOpd ? (
                    <select
                      value={opdId}
                      onChange={(e) => setOpdId(e.target.value)}
                      className="mt-2 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
                    >
                      {opds.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.shortName} — {o.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        required
                        value={newOpdName}
                        onChange={(e) => setNewOpdName(e.target.value)}
                        placeholder="Nama Lengkap OPD (mis. Dinas Pertanian Kab. Berau)"
                        className="h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
                      />
                      <input
                        type="text"
                        required
                        value={newOpdShortName}
                        onChange={(e) => setNewOpdShortName(e.target.value)}
                        placeholder="Singkatan OPD (mis. Distan Berau)"
                        className="h-[38px] w-full rounded-[8px] border border-[#e1e8f0] bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Hendra Wijaya, S.Stat."
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    NIP Pegawai
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="199001012019031001"
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Alamat Surel Resmi
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@beraukab.go.id"
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Kata Sandi Awal
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Jabatan Fungsional / Struktural
                  </label>
                  <input
                    type="text"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="Contoh: Pengelola Data Statistik"
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#142b45] dark:text-slate-200">
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812..."
                    className="mt-1 h-[40px] w-full rounded-[8px] border border-[#e1e8f0] px-3 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
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
                  disabled={submitting}
                  className="h-[40px] rounded-[8px] bg-[#10345b] px-5 font-semibold text-white hover:bg-[#142b45]"
                >
                  {submitting ? "Menyimpan..." : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

