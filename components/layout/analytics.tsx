import Script from "next/script";

/**
 * Веб-аналитика.
 *
 * Обе системы нужны намеренно: в Узбекистане Google даёт основной поток, но
 * Яндекс.Метрика распространена в местных отделах маркетинга и её отчёты
 * заказчики часто требуют отдельно.
 *
 * Скрипты подключаются стратегией afterInteractive, то есть уже после того,
 * как страница стала интерактивной. Аналитика не должна отодвигать LCP —
 * иначе она портит ровно тот показатель, который призвана измерять.
 *
 * Если идентификаторы не заданы, не рендерится вообще ничего: на локальной
 * разработке лишние запросы никому не нужны.
 */
export function Analytics() {
  const ym = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
  const ga = process.env.NEXT_PUBLIC_GA_ID;

  if (!ym && !ga) return null;

  return (
    <>
      {ym ? (
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
          ym(${JSON.stringify(ym)}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });`}
        </Script>
      ) : null}

      {ga ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
            gtag('js',new Date());gtag('config',${JSON.stringify(ga)});`}
          </Script>
        </>
      ) : null}
    </>
  );
}
