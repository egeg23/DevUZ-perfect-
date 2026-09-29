import { createElement } from "react";
// Ссылка без роутера: в тесте нужен только её текст и адрес.
export default function Link({ href, prefetch: _prefetch, ...rest }) {
  return createElement("a", { href: typeof href === "string" ? href : String(href), ...rest });
}
