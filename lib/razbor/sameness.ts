/**
 * Проверка на шаблонность между разборами.
 *
 * Аудит отдаёт готовые `title`, `impact` и `fix` — человеческие и
 * правильные, их и надо показывать в отчёте аудитора. Но в статье они
 * годятся только как сырьё: они одинаковы для всех сайтов, и разбор,
 * собранный из них дословно, отличается от соседнего лишь скриншотом.
 *
 * При 336 запланированных парах «ниша + город» это 336 страниц с одними и
 * теми же пятью подзаголовками. Google такую группу видит целиком и
 * понижает целиком — то есть цена ошибки не одна страница, а раздел.
 *
 * Поэтому здесь не «похожесть», а точное совпадение: спорить не о чем, и
 * ложных срабатываний нет.
 */

export type Templated = {
  /** Строка, встретившаяся дословно больше чем в одном разборе. */
  text: string;
  /** Где именно — слаги. */
  slugs: string[];
};

/** Строки короче этого повторяться могут: «Диагностика», «Ташкент». */
const MIN_LENGTH = 25;

type Piece = { slug: string; strings: readonly string[] };

/**
 * Находит куски, дословно повторённые в разных разборах одного языка.
 *
 * Сравниваются только разборы одного языка: русский и узбекский тексты
 * одного и того же разбора и так разные, а вот два русских разбора с
 * одинаковым абзацем — это и есть шаблон.
 */
export function templatedAcross(pieces: readonly Piece[]): Templated[] {
  const where = new Map<string, Set<string>>();

  for (const piece of pieces) {
    for (const raw of piece.strings) {
      const text = raw.trim();
      if (text.length < MIN_LENGTH) continue;
      const slugs = where.get(text) ?? new Set<string>();
      slugs.add(piece.slug);
      where.set(text, slugs);
    }
  }

  const out: Templated[] = [];
  for (const [text, slugs] of where) {
    if (slugs.size > 1) out.push({ text, slugs: [...slugs].sort() });
  }
  return out.sort((a, b) => b.slugs.length - a.slugs.length);
}
