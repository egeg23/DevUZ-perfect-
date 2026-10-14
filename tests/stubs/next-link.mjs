import { createElement } from "react";
// Ссылка без роутера: в тесте нужен только её текст и адрес.
export default function Link({ href, prefetch: _prefetch, ...rest }) {
  return createElement("a", { href: typeof href === "string" ? href : String(href), ...rest });
}
// Статус перехода по ссылке: в тесте перехода нет — ссылка не «ждёт».
export const useLinkStatus = () => ({ pending: false });
