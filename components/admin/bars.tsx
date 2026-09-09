import type { Bucket } from "@/lib/admin/stats";

/**
 * Горизонтальные столбики.
 *
 * Каждый подписан своим значением рядом — не «числа на каждой точке» из
 * анти-паттернов, а единственная подпись у единственного ряда: без неё
 * пришлось бы держать ось, которая на четырёх строках занимает больше
 * места, чем данные.
 *
 * Столбик закруглён только со стороны данных и упирается в базовую линию:
 * закругление у основания визуально укорачивает короткие значения.
 */
export function Bars({
  rows,
  labels,
  colors,
  total,
  empty = "нет данных",
}: {
  rows: Bucket[];
  labels?: Record<string, string>;
  /** Цвет на ключ. Не задан — один тон: это измерение величины, не различие. */
  colors?: Record<string, string>;
  total?: number;
  empty?: string;
}) {
  if (!rows.length) {
    return <p className="mt-3 text-sm text-muted">{empty}</p>;
  }

  const max = Math.max(...rows.map((row) => row.count), 1);
  const sum = total ?? rows.reduce((acc, row) => acc + row.count, 0);

  return (
    <ul className="mt-3 space-y-2">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 leading-snug text-muted sm:w-44">
            {labels?.[row.key] ?? row.key}
          </span>

          <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-line-soft">
            <span
              className="block h-full rounded-r-[4px]"
              style={{
                width: `${Math.max((row.count / max) * 100, 2)}%`,
                background: colors?.[row.key] ?? "var(--color-chart-bar)",
              }}
            />
          </span>

          <span className="w-20 shrink-0 text-right font-mono text-xs text-text">
            {row.count}
            {sum ? (
              <span className="ml-1 text-faint">{Math.round((row.count / sum) * 100)}%</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Объём по неделям. Вертикальные столбики: время идёт слева направо, и
 * горизонтальные строки читались бы как список, а не как динамика.
 */
export function WeeklyBars({ rows }: { rows: Bucket[] }) {
  if (!rows.length) {
    return <p className="mt-3 text-sm text-muted">Пока не по чему считать.</p>;
  }

  const max = Math.max(...rows.map((row) => row.count), 1);

  // На узком экране одиннадцать колонок ужимают дату до «06-…», то есть до
  // бесполезного. Прокрутка внутри блока — тот же приём, что у таблицы
  // лидов: страница вбок не едет, а подписи остаются читаемыми.
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[520px]">
      <div className="flex gap-[2px]">
        {rows.map((row) => (
          <span
            key={row.key}
            className="min-w-0 flex-1 text-center font-mono text-[11px] text-faint"
          >
            {row.count}
          </span>
        ))}
      </div>

      <div className="mt-1 flex h-28 items-end gap-[2px]">
        {rows.map((row) => (
          <span key={row.key} className="flex h-full min-w-0 flex-1 items-end">
            <span
              className="w-full rounded-t-[4px]"
              style={{
                height: `${Math.max((row.count / max) * 100, 3)}%`,
                background: "var(--color-chart-bar)",
              }}
              title={`неделя с ${row.key}: ${row.count}`}
            />
          </span>
        ))}
      </div>

      <div className="mt-1.5 flex gap-[2px]">
        {rows.map((row) => (
          <span
            key={row.key}
            className="min-w-0 flex-1 truncate text-center font-mono text-[10px] text-faint"
          >
            {row.key.slice(5)}
          </span>
        ))}
      </div>
      </div>
    </div>
  );
}
