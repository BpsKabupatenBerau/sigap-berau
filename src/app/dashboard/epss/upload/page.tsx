import { redirect } from "next/navigation";

export default async function EpssUploadRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ opdId?: string; year?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.opdId) query.set("opdId", params.opdId);
  if (params.year) query.set("year", params.year);
  const qs = query.toString();
  redirect(qs ? `/dashboard/epss?${qs}` : "/dashboard/epss");
}

