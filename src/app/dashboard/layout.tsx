import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DashboardShell,
  NotificationItem,
} from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login");
  }

  const { effectiveUser } = session;

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

  // Load notifications for OPD EPSS Submissions & OPD Assessment Submissions
  const notifications: NotificationItem[] = [];

  try {
    const epssSubmissions = await prisma.epssSubmission.findMany({
      where:
        effectiveUser.role === "OPERATOR_OPD" && effectiveUser.opdId
          ? {
              opdId: effectiveUser.opdId,
              status: { in: ["MENUNGGU_PERIKSA", "REVISI", "TERVERIFIKASI"] },
            }
          : {
              status: "MENUNGGU_PERIKSA",
            },
      include: {
        opd: true,
        indicator: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    });

    for (const sub of epssSubmissions) {
      notifications.push({
        id: `epss-${sub.id}`,
        type: "EPSS_SUBMISSION",
        title:
          effectiveUser.role === "OPERATOR_OPD"
            ? `Status Indikator ${sub.indicator.code}: ${sub.status.replace(
                "_",
                " "
              )}`
            : `${sub.opd.shortName} Mengirim Bukti Indikator ${sub.indicator.code}`,
        description: `${sub.indicator.name} (Klaim Mandiri: Level ${
          sub.selfScore || "-"
        })`,
        opdShortName: sub.opd.shortName,
        href: `/dashboard/epss?opdId=${sub.opdId}&year=${sub.periodYear}`,
        createdAt: sub.updatedAt.toISOString(),
      });
    }
  } catch {
    // Ignore if query fails
  }

  try {
    const assessmentResponses = await prisma.assessmentResponse.findMany({
      where:
        effectiveUser.role === "OPERATOR_OPD" && effectiveUser.opdId
          ? {
              opdId: effectiveUser.opdId,
              status: { in: ["DIKIRIM", "DIREVIU"] },
            }
          : {
              status: { in: ["DIKIRIM", "DIREVIU"] },
            },
      include: {
        opd: true,
        assessment: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    });

    for (const resp of assessmentResponses) {
      notifications.push({
        id: `asesmen-${resp.id}`,
        type: "ASSESSMENT_SUBMISSION",
        title:
          effectiveUser.role === "OPERATOR_OPD" && resp.status === "DIREVIU"
            ? `Asesmen ${resp.opd.shortName} Telah Direviu Pembina`
            : `${resp.opd.shortName} Mengirim Jawaban Asesmen`,
        description: `${resp.assessment.title} (Skor Kesiapan: Level ${
          resp.readinessScore?.toFixed(2).replace(".", ",") || "-"
        })`,
        opdShortName: resp.opd.shortName,
        href: "/dashboard/asesmen",
        createdAt: (resp.submittedAt || resp.updatedAt).toISOString(),
      });
    }
  } catch {
    // Ignore if Assessment table has not been pushed yet
  }

  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <DashboardShell
      session={session}
      impersonationCandidates={impersonationCandidates}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}

