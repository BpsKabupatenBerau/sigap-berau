import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";
import { LoginClient } from "@/components/login-client";

export default async function LoginPage() {
  const session = await getActiveSession();
  if (session) {
    redirect("/dashboard");
  }

  return <LoginClient />;
}

