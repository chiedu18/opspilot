import { redirect } from "next/navigation";

import { getDemoSession } from "@/lib/auth/demo-session";

export const requireSandboxWorkspaceId = async () => {
  const session = await getDemoSession();

  if (!session) {
    redirect("/login");
  }

  return session.workspaceId;
};
