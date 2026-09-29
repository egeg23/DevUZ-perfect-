/** Подпись студии в подвале — одна строка, без заставки и виджетов. */
export function Credit({ className }: { className?: string }) {
  return (
    <p className={className}>
      Сайт — <a href="https://devuz.studio">DevUz Studio</a>
    </p>
  );
}
