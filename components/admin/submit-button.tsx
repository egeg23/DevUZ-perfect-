"use client";

import { useFormStatus } from "react-dom";

/**
 * Кнопка, по которой видно, что её нажали и что нажатие кончилось.
 *
 * Серверное действие в App Router уходит не переходом, а запросом в фоне:
 * браузер не показывает ни полосы загрузки, ни курсора ожидания. Первая
 * попытка это лечить гасила кнопку прозрачностью — и менеджер сказал ровно
 * то, что и должен был: «кнопка остаётся того же цвета, и я не понимаю,
 * уходит сообщение или нет». Зелёная кнопка под семьюдесятью процентами
 * прозрачности выглядит зелёной кнопкой.
 *
 * Поэтому цвет меняется целиком, а не приглушается: на время ожидания
 * кнопка становится серой и неактивной, и рядом с текстом бьётся точка.
 * Отсюда и устройство: вид выбирает сам компонент, а снаружи приходит
 * только геометрия. Иначе «bg-green» из className и «bg-line» отсюда
 * спорили бы порядком в таблице стилей, и кто победит — зависело бы от
 * сборки.
 */

const TONE = {
  /** Главное действие: зелёная заливка, тёмный текст. */
  primary: "bg-green/90 text-ink hover:bg-green",
  /** Второстепенное: обводка, без заливки. */
  quiet: "border border-blue-soft/40 text-blue-soft hover:bg-blue-soft/10",
} as const;

/** Как выглядит любая кнопка, пока ждёт ответа. Одинаково у всех. */
const WAITING = "cursor-progress border border-line bg-line/60 text-muted";

export function SubmitButton({
  children,
  pendingLabel,
  base,
  tone = "primary",
}: {
  children: React.ReactNode;
  /** Что написано на кнопке, пока ждём. Здесь же говорим, сколько ждать. */
  pendingLabel: string;
  /** Только геометрия: скругление, отступы, кегль. Без цвета. */
  base: string;
  tone?: keyof typeof TONE;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      // aria-busy — для читалки экрана: она видит не цвет, а состояние.
      aria-busy={pending}
      className={`${base} inline-flex items-center gap-2 transition ${pending ? WAITING : TONE[tone]}`}
    >
      {pending ? (
        <span aria-hidden="true" className="h-2 w-2 animate-ping rounded-full bg-muted" />
      ) : null}
      {pending ? pendingLabel : children}
    </button>
  );
}

/**
 * Кнопка, которая своё уже отработала.
 *
 * Владелец: «кнопка после нажатия становится не активной, отправлено».
 * Не текст и не плашка рядом, а та же самая кнопка на том же месте —
 * серая, с галочкой и неактивная. Человек смотрит туда, куда нажал, и
 * должен увидеть там ответ, а не искать его в другом месте карточки.
 */
export function DoneButton({ children, base }: { children: React.ReactNode; base: string }) {
  return (
    <button
      type="button"
      disabled
      className={`${base} inline-flex cursor-default items-center gap-2 border border-line bg-line/50 text-muted`}
    >
      <span aria-hidden="true">✓</span>
      {children}
    </button>
  );
}
