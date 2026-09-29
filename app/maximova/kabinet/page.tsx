import type { Metadata } from "next";

import { Cabinet, TABS, type Tab } from "@/components/clients/maximova/kabinet/Cabinet";
import { studentByInvite } from "@/lib/clients/maximova/school";
import { currentViewer } from "@/lib/clients/maximova/session";
import { botConfig } from "@/lib/clients/maximova/telegram";

export const metadata: Metadata = {
  title: "Личный кабинет — Дарья Максимова",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const viewer = await currentViewer();
  const bot = botConfig();

  const tabParam = typeof params.tab === "string" ? params.tab : "";
  const tab: Tab = TABS.some((t) => t.id === tabParam) ? (tabParam as Tab) : "zayavki";

  const code = typeof params.invite === "string" ? params.invite : "";
  let invite: { code: string; childName: string } | null = null;
  if (code) {
    try {
      const student = studentByInvite(code);
      if (student) invite = { code, childName: student.name };
    } catch {
      invite = null;
    }
  }

  return <Cabinet viewer={viewer} botReady={Boolean(bot)} botUsername={bot?.username ?? ""} tab={tab} invite={invite} />;
}
