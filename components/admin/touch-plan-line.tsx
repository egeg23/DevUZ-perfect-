import { planLine, type TouchProgress } from "@/lib/admin/touch-plan";

/**
 * Недельный план касаний — строкой.
 *
 * Показывается в двух местах: на главной панели и в самих касаниях. Слова
 * собирает `planLine`, здесь только вид — иначе две копии текста разошлись бы
 * на первой же правке, и человек видел бы на двух страницах разное про одно
 * и то же число.
 *
 * Плана нет — нет и строки. Пустая рамка «плана нет» на видном месте читается
 * как упрёк, которого никто не делал.
 */
export function TouchPlanLine({ progress }: { progress: TouchProgress }) {
  const line = planLine(progress);
  if (!line) return null;

  const done = progress.left === 0;
  return (
    <p
      className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
        done ? "border-green/30 bg-green/5 text-green" : "border-line bg-surface-2 text-text"
      }`}
    >
      <span aria-hidden="true" className={done ? "text-green" : "text-gold"}>
        {done ? "✓" : "→"}
      </span>
      {line}
    </p>
  );
}
