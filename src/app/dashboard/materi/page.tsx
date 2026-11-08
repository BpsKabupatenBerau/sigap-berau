import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MateriClient } from "@/components/materi-client";

export default async function MateriPage() {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login");
  }

  const materials = await prisma.learningMaterial.findMany({
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  const canManage =
    session.effectiveUser.role === "PEMBINA_SEKTORAL" ||
    session.effectiveUser.role === "SUPERADMIN";

  return <MateriClient materials={materials} canManage={canManage} />;
}

