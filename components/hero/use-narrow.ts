"use client";

import { useEffect, useState } from "react";

/**
 * Узкий экран — телефон в портретной ориентации.
 *
 * Начальное значение false, а не результат замера: на сервере ширины окна не
 * существует, и попытка угадать её привела бы к расхождению разметки при
 * гидратации. Первый кадр рисуется в широком варианте, сразу после
 * монтирования значение уточняется.
 *
 * Порог 768 px совпадает с брейкпоинтом md в Tailwind, чтобы поведение
 * скриптов и стилей переключалось в одной точке, а не в двух разных.
 */
export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const apply = () => setNarrow(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return narrow;
}
