"use client";

import { useFormStatus } from "react-dom";

/**
 * Кнопка, по которой видно, что её нажали.
 *
 * Серверное действие в App Router уходит не переходом, а запросом в фоне:
 * браузер не показывает ни полосы загрузки, ни курсора ожидания. Пока
 * действие занимало пару секунд, это сходило с рук. Потом за «Связаться»
 * встал обход сайта — двенадцать-двадцать пять секунд, — и страница на всё
 * это время замирает: кнопка нажимается, ничего не происходит, и вывод у
 * менеджера ровно один — «не работает». Именно так владелец это и описал.
 *
 * Отдельным клиентским компонентом, потому что useFormStatus читает
 * состояние ближайшей формы сверху и работать может только внутри неё. Это
 * дешевле, чем делать клиентским весь список: иначе в браузер уехали бы
 * находки и контакты всех полусотни сайтов.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  /** Что написано на кнопке, пока ждём. Здесь же говорим, сколько ждать. */
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      // aria-busy — для читалки экрана: она видит не цвет, а состояние.
      aria-busy={pending}
      className={`${className ?? ""} disabled:cursor-progress disabled:opacity-70`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
