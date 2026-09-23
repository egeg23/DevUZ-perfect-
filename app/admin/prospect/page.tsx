import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { HelpHint } from "@/components/admin/help-link";
import { helpAnchor } from "@/lib/admin/help";
import { OutreachList } from "@/components/admin/outreach-list";
import { ProspectRunner } from "@/components/admin/prospect-runner";
import { TouchPlanLine } from "@/components/admin/touch-plan-line";
import { requireStaff } from "@/lib/admin/guard";
import { touchProgressOf } from "@/lib/admin/touch-store";
import { outcomeOf } from "@/lib/admin/portion";
import { portionOf } from "@/lib/admin/portion-store";
import { todayInTashkent } from "@/lib/admin/pulse";
import { MapsCampaigns } from "@/components/admin/maps-campaigns";
import { TouchLegend } from "@/components/admin/touch-legend";
import { dailyCap, placesConfigured } from "@/lib/maps/places";
import { listCampaigns, pendingPlaces, usageToday } from "@/lib/maps/store";
import { sentLastHour } from "@/lib/admin/outreach-queue";
import { listProspects, manualReplies } from "@/lib/admin/outreach-store";
import { BATCH_CAP } from "@/lib/audit/batch";

export const dynamic = "force-dynamic";

export default async function ProspectPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string; e?: string; sent?: string; maps?: string }>;
}) {
  const staff = await requireStaff();
  const { open, e, sent, maps } = await searchParams;
  // Автопоиск ведут владелец и руководитель; менеджеру он приходит порцией.
  const seesMaps = staff.role === "admin" || staff.role === "head";
  const [campaigns, mapsUsage, mapsPending] = seesMaps
    ? await Promise.all([listCampaigns(), usageToday(), pendingPlaces()])
    : [[], 0, 0];
  const [rows, hour, replies, plan, portion] = await Promise.all([
    listProspects(),
    sentLastHour(),
    manualReplies(),
    touchProgressOf(staff.id),
    portionOf(staff.id),
  ]);
  const today = todayInTashkent(new Date());
  const portionDone = portion.filter((p) => outcomeOf(p, staff.id, today) !== null).length;

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">Холодные касания</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Тот же аудитор, что на публичной странице, но по списку. На выходе не
        баллы, а черновик первого сообщения по каждому сайту — построенный
        вокруг одной находки, которую адресат может пойти и проверить сам.
      </p>

      <TouchPlanLine progress={plan} />

      {/* Порция дня — выше всего остального: это то, с чего сегодня
          начинать. Те же компании пришли утром в Telegram с кнопками. */}
      {portion.length ? (
        <section className="mb-6 rounded-xl border border-green/30 bg-green/5 px-5 py-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-green">
            Ваша порция на сегодня: сделано {portionDone} из {portion.length}
            <HelpHint topic={helpAnchor("/admin/prospect", "portion")} label="Как работает порция дня" />
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {portion.map((p) => {
              const outcome = outcomeOf(p, staff.id, today);
              const state =
                outcome === "skipped"
                  ? "не подошла"
                  : outcome
                    ? "сделано"
                    : p.message
                      ? "текст готов"
                      : "текст готовится";
              return (
                <li key={p.id} className="flex flex-wrap items-baseline gap-x-2">
                  <Link href={`/admin/prospect?open=${p.id}#p-${p.id}`} className="hover:text-green">
                    {p.label || p.host || "Компания без сайта"}
                  </Link>
                  <span className={`text-xs ${outcome ? "text-faint" : "text-muted"}`}>{state}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-faint">Что не сделано до 18:00, вернётся в общий пул.</p>
        </section>
      ) : null}

      <ProspectRunner />

      {seesMaps ? (
        <MapsCampaigns
          campaigns={campaigns}
          configured={placesConfigured()}
          usage={mapsUsage}
          cap={dailyCap()}
          pending={mapsPending}
          canEdit
          notice={maps}
        />
      ) : null}

      <TouchLegend />

      <OutreachList rows={rows} hour={hour} open={open} error={e} sent={sent === "1"} replies={replies} />

      <div className="mt-10 max-w-2xl space-y-3 border-t border-line pt-6 text-xs leading-relaxed text-faint">
        <p>
          <span className="text-muted">Список приносите вы.</span> Инструмент не
          обходит чужие каталоги и не выгружает базы: он открывает публичный сайт
          компании ровно так же, как его открывает любой посетитель. Там, где
          начинается выгрузка чужих баз, начинаются правила, которые мы не
          проверяли.
        </p>
        <p>
          <span className="text-muted">Пустая строка вместо черновика — это результат.</span>{" "}
          Если к сайту нет претензий, писать не о чем, и придумывать повод не
          надо: касание без содержания портит и адресата, и того, кто пишет.
        </p>
        <p>
          <span className="text-muted">Находок стало меньше, и это к лучшему.</span>{" "}
          Аудитор читает то, что отдал сервер. Если сайт собирается уже в
          браузере — а так устроена половина новых сайтов, — по проводу
          приходит пустая заготовка, и «нет телефона» означало бы только то,
          что мы его не увидели. Такие претензии больше не выписываются: вместо
          них одна проверяемая — сколько слов получил поисковик. Владелец
          проверяет её за минуту, открыв просмотр кода своей страницы.
        </p>
        <p>
          <span className="text-muted">Черновик — это черновик.</span> Прочитайте
          его перед отправкой и поправьте под человека. За один прогон —
          не больше {BATCH_CAP} адресов; внутри прогона сайты проверяются по
          одному, чтобы не стучаться к десятку сразу.
        </p>
      </div>
    </AdminShell>
  );
}
