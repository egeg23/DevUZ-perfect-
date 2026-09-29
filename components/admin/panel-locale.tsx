"use client";

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_PANEL_LOCALE, pick, type Msg, type PanelLocale, type Picked, type Tr } from "@/lib/admin/i18n";

/**
 * Язык панели для клиентских компонентов.
 *
 * Серверные берут его из сессии (`staff.panel_locale`), клиентские — отсюда:
 * провайдер ставит каркас панели, и пробрасывать язык пропом через три
 * уровня ради одной подписи на кнопке не нужно.
 */
const PanelLocaleContext = createContext<PanelLocale>(DEFAULT_PANEL_LOCALE);

export function PanelLocaleProvider({ locale, children }: { locale: PanelLocale; children: ReactNode }) {
  return <PanelLocaleContext.Provider value={locale}>{children}</PanelLocaleContext.Provider>;
}

export function usePanelLocale(): PanelLocale {
  return useContext(PanelLocaleContext);
}

/** Словарь на языке панели: `const t = usePanelDict(shellDict)`. */
export function usePanelDict<D extends Record<string, Tr<Msg>>>(dict: D): Picked<D> {
  return pick(dict, usePanelLocale());
}
