import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login");
  }

  let impersonationCandidates: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    opdShortName: string | null;
  }> = [];

  if (session.realUser.role === "SUPERADMIN") {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        NOT: { id: session.realUser.id },
      },
      include: { opd: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    impersonationCandidates = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      opdShortName: u.opd?.shortName ?? null,
    }));
  }

  return (
    <DashboardShell
      session={session}
      impersonationCandidates={impersonationCandidates}
    >
      {children}
    </DashboardShell>
  );
}

