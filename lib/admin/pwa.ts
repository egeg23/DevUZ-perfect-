/**
 * Панель как приложение: манифест и сервис-воркер (CLAUDE.md, «Панель —
 * приложение на телефоне и пуш»).
 *
 * Только под /admin: публичный сайт, макеты, витрина и кабинеты
 * «устанавливаемыми» не становятся — ссылка на манифест стоит только в
 * каркасе панели (app/admin/layout.tsx), а сам он и воркер отдаются с
 * адресов /admin/….
 *
 * Область — «/admin», а не «/admin/»: «Лиды» живут по адресу /admin, и с
 * областью «/admin/» переход в них выкидывал бы из приложения в браузер с
 * адресной строкой. Поэтому воркер отдаётся с заголовком
 * Service-Worker-Allowed: /admin.
 */

export const PWA_SCOPE = "/admin";
export const PWA_START = "/admin/hq";
export const PWA_MANIFEST = "/admin/manifest.webmanifest";
export const PWA_WORKER = "/admin/sw.js";
export const PWA_BACKGROUND = "#05070B";

export function manifestOf() {
  return {
    id: "/admin/",
    name: "DevUz",
    short_name: "DevUz",
    description: "DevUz — панель команды: лиды, касания, макеты, задачи.",
    lang: "ru",
    start_url: PWA_START,
    scope: PWA_SCOPE,
    display: "standalone",
    orientation: "portrait",
    background_color: PWA_BACKGROUND,
    theme_color: PWA_BACKGROUND,
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

/**
 * Сервис-воркер. Только пуш и нажатие: ни кэша, ни работы без сети — панель
 * показывает базу прямо сейчас, и вчерашняя страница из кэша хуже ошибки.
 *
 * Нажатие ведёт в адрес из пуша, но только внутрь панели: адрес вне /admin
 * воркер заменяет «Главной».
 */
export const WORKER_SOURCE = `// DevUz — панель команды: уведомления.
const HOME = "${PWA_START}";
const keyBytes = (b64) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};
const inPanel = (path) => typeof path === "string" && (path === "/admin" || path.startsWith("/admin/") || path.startsWith("/admin?"));

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "DevUz", body: event.data ? event.data.text() : "" };
  }
  const url = inPanel(data.url) ? data.url : HOME;
  event.waitUntil(
    self.registration.showNotification(data.title || "DevUz", {
      body: data.body || "",
      icon: "/pwa/icon-192.png",
      data: { url },
      silent: data.silent === true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data && inPanel(event.notification.data.url) ? event.notification.data.url : HOME;
  const url = new URL(path, self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (!inPanel(new URL(client.url).pathname)) continue;
        try {
          await client.focus();
          if (client.navigate) {
            await client.navigate(url);
            return;
          }
        } catch {}
      }
      await self.clients.openWindow(url);
    })(),
  );
});

// Браузер сменил подписку сам — подписываемся заново и сообщаем панели.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const answer = await fetch("/admin/push", { credentials: "same-origin" });
      if (!answer.ok) return;
      const { publicKey } = await answer.json();
      if (!publicKey) return;
      const sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
      await fetch("/admin/push", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "subscribe", subscription: sub.toJSON(), standalone: true, old: event.oldSubscription ? event.oldSubscription.endpoint : null }),
      });
    })(),
  );
});
`;
