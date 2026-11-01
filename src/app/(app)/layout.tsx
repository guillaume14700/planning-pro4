import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppProvider from "@/components/app-provider";
import Shell from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <AppProvider>
      <Shell>{children}</Shell>
    </AppProvider>
  );
}