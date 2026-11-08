import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { getActiveSession, UserRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UsersClient } from "@/components/users-client";

export default async function UsersManagementPage() {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login");
  }

  // Only real Superadmin can access /dashboard/users
  if (session.realUser.role !== "SUPERADMIN") {
    return (
      <div className="mx-auto max-w-xl rounded-[12px] border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-900 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-[20px] font-bold text-[#142b45] dark:text-white">
          Akses Ditolak — Khusus Superadmin
        </h1>
        <p className="mt-2 text-[13px] text-slate-600 dark:text-slate-400">
          Halaman Manajemen Pengguna hanya dapat diakses oleh akun{" "}
          <strong>Superadmin BPS Kabupaten Berau</strong>.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-[#10345b] px-4 text-[13px] font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Ringkasan</span>
          </Link>
        </div>
      </div>
    );
  }

  const [users, opds] = await Promise.all([
    prisma.user.findMany({
      include: { opd: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    prisma.opd.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, shortName: true },
    }),
  ]);

  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    nip: u.nip,
    role: u.role as UserRole,
    jabatan: u.jabatan,
    phone: u.phone,
    isActive: u.isActive,
    opdId: u.opdId,
    opdName: u.opd?.name ?? null,
    opdShortName: u.opd?.shortName ?? null,
  }));

  return (
    <UsersClient
      users={serializedUsers}
      opds={opds}
      realUserId={session.realUser.id}
      activeEffectiveUserId={session.effectiveUser.id}
      isImpersonating={session.isImpersonating}
    />
  );
}

