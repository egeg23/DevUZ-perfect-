"use client";

import { useEffect } from "react";

import { rememberVisit } from "@/lib/visit/client";

/**
 * Запоминает источник перехода при первой загрузке страницы.
 *
 * Стоит в раскладке рядом с ловушкой партнёрских ссылок: человек может
 * прийти из поиска на любую страницу, а не только на главную.
 */
export function FirstTouch() {
  useEffect(rememberVisit, []);
  return null;
}
