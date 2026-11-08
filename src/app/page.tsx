import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login");
  }
  redirect("/dashboard");
}

