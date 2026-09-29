import type { Metadata } from "next";

import { Cabinet } from "@/components/clients/maximova/kabinet/Cabinet";
import { currentViewer } from "@/lib/clients/maximova/session";
import { botConfig } from "@/lib/clients/maximova/telegram";

export const metadata: Metadata = { title: "Личный кабинет — Дарья Максимова" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const viewer = await currentViewer();
  const bot = botConfig();
  return <Cabinet viewer={viewer} botReady={Boolean(bot)} botUsername={bot?.username ?? ""} />;
}
