// Адрес страницы в тесте задаёт globalThis.__pathname.
export const usePathname = () => globalThis.__pathname ?? "/admin";
export const useSearchParams = () => new URLSearchParams();
export const useRouter = () => ({ push() {}, replace() {}, refresh() {}, back() {} });
export function redirect(to) {
  throw new Error(`redirect ${to}`);
}
export function notFound() {
  throw new Error("notFound");
}
