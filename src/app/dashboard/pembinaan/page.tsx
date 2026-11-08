import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PembinaanClient } from "@/components/pembinaan-client";

export default async function PembinaanPage() {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login");
  }

  const [schedules, opds] = await Promise.all([
    prisma.coachingSchedule.findMany({
      include: { opd: true },
      orderBy: { date: "desc" },
    }),
    prisma.opd.findMany({
      orderBy: { shortName: "asc" },
      select: { id: true, name: true, shortName: true },
    }),
  ]);

  const serialized = schedules.map((s) => ({
    id: s.id,
    title: s.title,
    topic: s.topic,
    description: s.description,
    date: s.date.toISOString(),
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.location,
    mode: s.mode,
    status: s.status,
    opdId: s.opdId,
    opdName: s.opd?.name ?? null,
    opdShortName: s.opd?.shortName ?? null,
    pembinaName: s.pembinaName,
    participants: s.participants,
    notes: s.notes,
  }));

  const canManage =
    session.effectiveUser.role === "PEMBINA_SEKTORAL" ||
    session.effectiveUser.role === "SUPERADMIN";

  return (
    <PembinaanClient
      schedules={serialized}
      opds={opds}
      canManage={canManage}
      defaultPembinaName={session.effectiveUser.name}
    />
  );
}

