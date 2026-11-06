"use client";

import { useEffect, useRef, useState } from "react";

import { usePanelDict } from "@/components/admin/panel-locale";
import { tasksDict } from "@/content/admin-panel/tasks";
import { pick, type PanelLocale } from "@/lib/admin/i18n";

/**
 * «Получат: …» над кнопкой «Поставить задачу» — кому на самом деле уйдёт
 * задача. «Себе» в «Кому» отмечено заранее (себе ставят чаще всего: 109 из
 * 188 постановок за 30 дней), и отметивший коллегу получал и свою копию:
 * 06.11.2026 «Прототип» Салихи ушёл ей самой и владельцу, а она считала,
 * что поставила задачу другому (владелец: «Салиха поставила задачу на
 * Александра, а Александр ее не видит нигде»). Строка слушает галочки формы.
 */
export function PickedAssignees({
  people,
  selfId,
  locale,
}: {
  people: { id: string; display_name: string }[];
  selfId: string;
  locale?: PanelLocale;
}) {
  const fromShell = usePanelDict(tasksDict);
  const t = locale ? pick(tasksDict, locale) : fromShell;
  const box = useRef<HTMLParagraphElement>(null);
  const [picked, setPicked] = useState<string[]>([selfId]);

  useEffect(() => {
    const form = box.current?.closest("form");
    if (!form) return;
    const read = () =>
      setPicked([...form.querySelectorAll<HTMLInputElement>('input[name="assignee"]:checked')].map((i) => i.value));
    read();
    form.addEventListener("change", read);
    return () => form.removeEventListener("change", read);
  }, []);

  const names = new Map(people.map((p) => [p.id, p.display_name]));
  const list = picked.map((id) => (id === selfId ? t.self(names.get(id) ?? "—") : names.get(id) ?? "—"));
  const selfAndOthers = picked.includes(selfId) && picked.length > 1;

  return (
    <p ref={box} aria-live="polite" className="text-xs">
      <span className={picked.length ? "text-text" : "text-gold"}>
        {picked.length ? t.willGet(list.join(", ")) : t.willGetNobody}
      </span>
      {selfAndOthers ? <span className="mt-0.5 block text-gold">{t.selfToo}</span> : null}
    </p>
  );
}
