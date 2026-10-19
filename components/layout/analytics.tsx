import Script from "next/script";

import { MetrikaHits } from "@/components/layout/metrika-hits";

/**
 * Веб-аналитика.
 *
 * Обе системы нужны намеренно: в Узбекистане Google даёт основной поток, но
 * Яндекс.Метрика распространена в местных отделах маркетинга и её отчёты
 * заказчики часто требуют отдельно.
 *
 * Скрипты подключаются стратегией lazyOnload — когда страница уже
 * загрузилась и браузер свободен. Раньше стояла afterInteractive, и на
 * телефоне 194 КБ Google и 64 КБ Метрики грузились вместе с первым экраном:
 * PageSpeed на мобильном 45, отрисовка главного блока 8,9 секунды
 * (sitechecker, 19.10.2026). Яндекс просит ставить счётчик «как можно ближе
 * к началу страницы» — цена переноса: не посчитаются те, кто закрыл
 * страницу, не дождавшись загрузки. Аналитика не должна отодвигать первый
 * экран — иначе она портит ровно тот показатель, который призвана измерять.
 *
 * Если идентификаторы не заданы, не рендерится вообще ничего: на локальной
 * разработке лишние запросы никому не нужны.
 */
export function Analytics() {
  // Номер счётчика подставляется в код числом, как в сниппете Яндекса, а не
  // строкой. Отсюда и проверка: в разметку уходит только то, что состоит из
  // цифр, а опечатка в окружении гасит счётчик целиком вместо того, чтобы
  // собрать сломанный вызов.
  const raw = (process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || "").trim();
  const ym = /^\d+$/.test(raw) ? raw : "";
  const ga = process.env.NEXT_PUBLIC_GA_ID;

  if (!ym && !ga) return null;

  return (
    <>
      {ym ? (
        <>
          <Script id="yandex-metrika" strategy="lazyOnload">
            {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window,document,"script","https://mc.yandex.ru/metrika/tag.js?id=${ym}","ym");
            ym(${ym}, "init", {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`}
          </Script>
          {/* Пиксель для тех, у кого выключен JavaScript. Отдаётся с
              сервера в разметке, а не через Script: Script — это как раз
              про JavaScript, которого в этом случае нет. */}
          <noscript>
            <div>
              <img src={`https://mc.yandex.ru/watch/${ym}`} style={{ position: "absolute", left: "-9999px" }} alt="" />
            </div>
          </noscript>
          <MetrikaHits id={Number(ym)} />
        </>
      ) : null}

      {ga ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="lazyOnload"
          />
          <Script id="ga4" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
            gtag('js',new Date());gtag('config',${JSON.stringify(ga)});`}
          </Script>
        </>
      ) : null}
    </>
  );
}
