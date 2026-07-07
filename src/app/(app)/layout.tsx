import { redirect } from "next/navigation";

import { getDemoSession } from "@/lib/auth/demo-session";

import { AppShell } from "./_components/app-shell";

export default async function OperationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getDemoSession();

  if (!session) {
    redirect("/login");
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
