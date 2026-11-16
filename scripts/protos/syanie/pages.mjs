/*
 * Страницы рабочего сайта «Сияния Севера» сверх главной: услуги по разделам,
 * цены, врачи, о клинике, отзывы, акции, контакты, сведения о медицинской
 * организации, политика и согласие на обработку персональных данных.
 * Каркас страницы (шапка, подвал, запись, чат) — в gen.mjs (pageShell), здесь
 * только содержимое. Все строки клиники приходят уже экранированными
 * (site-content.mjs), значения по умолчанию — из data.mjs и catalog.mjs.
 * Только рабочий сайт: макет эти страницы не собирает.
 */

/**
 * c — помощники и данные текущей сборки из gen.mjs:
 * { B, D, ORG, AUTH, DOCS, CATS, LIST, PD_VERSION, IMG, tel, ic, txt, rub, esc,
 *   msgLinks, blocks: { price, trust, perks, rooms, contacts } , metrika, site }
 * Возвращает { ключ: { title, desc, path, main, ld, svc } }; ключ — адрес без «/».
 */
export function makePages(c) {
  const { B, D, ORG, AUTH, DOCS, CATS, LIST, ic, txt, IMG, tel } = c;
  /* Сумма с ₽ не разрывается переносом строки. */
  const rub = (n) => c.rub(n).replace(/ /g, "\u00a0");
  const U = "__SITE_URL__";
  const out = {};
  const nameOf = String(B.name).replace(/&quot;/g, '"');
  const clinicLd = { "@type": ["Dentist", "MedicalClinic"], "@id": `${U}/#clinic`, name: c.plain(B.name), url: `${U}/`, telephone: B.phoneRaw,
    address: { "@type": "PostalAddress", streetAddress: c.plain(B.street), addressLocality: c.plain(B.city), addressRegion: "Томская область", addressCountry: "RU" } };
  const crumbsLd = (list) => ({ "@type": "BreadcrumbList", itemListElement: list.map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: c.plain(n), item: `${U}${u}` })) });
  const ldOf = (crumbs, extra = []) => ({ "@context": "https://schema.org", "@graph": [clinicLd, crumbsLd(crumbs), ...extra] });

  const crumbs = (list) => `<nav class="pg-cr" aria-label="Вы здесь"><ol>${list.map(([n, u], i) => i < list.length - 1 ? `<li><a href="${u}">${n}</a></li>` : `<li><span aria-current="page">${n}</span></li>`).join("")}</ol></nav>`;
  const book = (svc, label = "Записаться на консультацию") => `<a class="btn btn-onyx" href="#zapis" data-book${svc ? ` data-svc="${svc}"` : ""}>${ic("msg")}<span>${label}</span></a>`;
  const call = `<a class="btn btn-ghost" href="${tel}">${ic("phone")}<span>${B.phone}</span></a>`;
  const imgOf = (n) => (n.charAt(0) === "/" ? n : `${IMG}/${n}.webp`);
  /* Первый экран страницы: тёмная полоса, текст слева, фото справа (на телефоне — под текстом). */
  function hero({ key, kick, h, p, img, alt, path, list, svc, noBtn }) {
    const t = txt(key, kick, h, p);
    return `<section class="pg-hero" data-tone="ink"><div class="wrap pg-hw${img ? "" : " pg-hw-t"}">
<div class="pg-ht">${crumbs(list)}<span class="kick">${t.kick}</span><h1>${t.h}</h1>${t.p ? `<p class="lead">${t.p}</p>` : ""}${noBtn ? "" : `<div class="pg-b">${book(svc)}${call}</div>`}</div>
${img ? `<figure class="pg-ph"><img src="${imgOf(img)}" alt="${alt}" decoding="async" fetchpriority="high"></figure>` : ""}
</div></section>`;
  }
  const priceOf = (x) => (x.p ? x.p : `<span class="pl-ask">уточните у администратора</span>`);
  const others = (slug) => `<nav class="pg-oth" aria-label="Другие услуги"><span class="kick">Другие услуги</span><ul>${CATS.filter((k) => k.slug !== slug).map((k) => `<li><a href="/${k.slug}">${k.t}</a></li>`).join("")}</ul></nav>`;
  const ctaBand = (svc) => `<section class="pg-cta" data-tone="ink"><div class="wrap"><div><span class="kick">Бесплатная консультация</span><p class="pg-cta-h">Расскажем, что можно сделать, и назовём цену до начала лечения</p></div><div class="pg-b">${book(svc, "Записаться")}${call}</div></div></section>`;
  const allOn6 = () => `<article class="sv-c sv-c-star"><span class="kick">Главная услуга клиники</span><h3><a href="/">All-on-6: все зубы на 6 имплантатах</a></h3><p>Несъёмный протез на шести имплантатах за один день, без искусственной десны.</p><b>от ${rub(Math.min(...D.PRICES.map((x) => x.price)))}</b><a class="sv-more" href="/">Как это проходит ${ic("arrow")}</a></article>`;
  const card = (x) => `<article class="sv-c"><h3>${x.t}</h3>${x.d ? `<p>${x.d}</p>` : ""}<b>${priceOf(x)}</b></article>`;
  const docCard = (d) => `<article class="vd"><div class="vd-ph">${c.docPic(d)}</div><div class="vd-t"><span class="kick">${d.role}</span><h3>${d.name}</h3>${d.facts.length ? `<ul>${d.facts.map((f) => `<li>${f}</li>`).join("")}</ul>` : ""}${d.edu ? `<p class="vd-x"><b>Образование</b>${String(d.edu).split("\n").join("<br>")}</p>` : ""}${d.cert ? `<p class="vd-x"><b>Квалификация</b>${String(d.cert).split("\n").join("<br>")}</p>` : ""}${d.sched ? `<p class="vd-x"><b>Приём</b>${d.sched}</p>` : ""}${d.quote ? `<p class="dr-q">«${d.quote}»</p>` : ""}</div></article>`;
  const HOME = ["Главная", "/"], SVC = ["Услуги", "/uslugi"];
  /* Врачи раздела — по специальности (хирург — хирургия и имплантация, ортопед — протезирование…); нет таких — все. */
  const docsFor = (slug) => { const own = D.DOCTORS.filter((d) => c.dirsOf(d).some((k) => k.slug === slug)); return own.length ? own : D.DOCTORS; };
  /* Рассрочка и вычет — из «Сервиса» клиники по словам, а не по месту в списке. */
  const PERK0 = { "рассроч": { t: "Рассрочка 0%", d: "От клиники, без первого взноса" }, "вычет": { t: "Вычет 13%", d: "Поможем оформить налоговый вычет со стоимости лечения" } };
  const perk = (re) => D.PERKS.find((p) => re.test(p.t)) || PERK0[re.source];

  /* ── Услуги ──────────────────────────────────────────────────────── */
  out.uslugi = {
    title: `Услуги стоматологии в Томске · «${nameOf}»`, desc: `Имплантация, протезирование, лечение зубов, хирургия, виниры, гигиена и КТ в клинике «${nameOf}», Томск, ${c.plain(B.street)}. Первая консультация бесплатно.`, path: "/uslugi",
    ld: ldOf([HOME, SVC]),
    main: `${hero({ key: "pg-uslugi", kick: "Услуги", h: "Услуги клиники", p: `Имплантация, протезирование, лечение, хирургия, эстетика, гигиена и диагностика в одной клинике. Первая консультация бесплатно.`, img: "film-16", alt: "Вход в клинику «Сияние Севера»", path: "/uslugi", list: [HOME, ["Услуги", "/uslugi"]] })}
<section class="pg-sec"><div class="wrap">
<div class="ct-cards">
<a class="cc cc-star" href="/"><span class="cc-ph"><img src="${IMG}/calm-4-16.webp" alt="Несъёмный протез на шести имплантах, 3D-визуализация" loading="lazy" decoding="async"></span><span class="cc-t"><span class="kick">Главная услуга</span><b>All-on-6: все зубы на 6 имплантатах</b><span>За один день, без искусственной десны. От ${rub(Math.min(...D.PRICES.map((x) => x.price)))}.</span></span></a>
${CATS.map((k) => { const items = LIST.filter((x) => x.cat === k.slug); return `<a class="cc" href="/${k.slug}"><span class="cc-ph"><img src="${imgOf(k.img)}" alt="${k.alt}" loading="lazy" decoding="async"></span><span class="cc-t"><b>${k.t}</b><span>${k.lead}</span>${items.length ? `<small>${items.slice(0, 4).map((x) => x.t).join(" · ")}</small>` : ""}</span></a>`; }).join("\n")}
</div>
<p class="pg-note">Цены по каждой услуге: <a href="/ceny">на странице «Цены»</a>.</p>
</div></section>
${ctaBand("")}`,
  };

  /* ── Разделы услуг ───────────────────────────────────────────────── */
  const deep = new Set(["implantatsiya-zubov", "protezirovanie-zubov", "khirurgiya"]);
  for (const k of CATS) {
    const items = LIST.filter((x) => x.cat === k.slug), path = "/" + k.slug;
    out[k.slug] = {
      title: `${k.t} в Томске · «${nameOf}»`, desc: `${k.t} в клинике «${nameOf}», Томск, ${c.plain(B.street)}: ${items.slice(0, 4).map((x) => c.plain(x.t).toLowerCase()).join(", ")}. Цены, врачи, запись на бесплатную консультацию.`, path, svc: k.nav,
      ld: ldOf([HOME, SVC, [k.t, path]], [{ "@type": "MedicalWebPage", "@id": `${U}${path}#page`, url: `${U}${path}`, name: c.plain(k.t), about: { "@id": `${U}/#clinic` }, inLanguage: "ru-RU" }]),
      main: `${hero({ key: "pg-" + k.slug, kick: "Услуги", h: k.t, p: k.lead, img: k.img, alt: k.alt, path, list: [HOME, SVC, [k.t, path]], svc: k.nav })}
<section class="pg-sec" id="ceny-uslug"><div class="wrap">
<div class="sh"><span class="kick">Услуги и цены</span><h2>Что делаем</h2><p>Цены в рублях. Точную стоимость врач назовёт после осмотра: она зависит от вашего случая.</p></div>
<div class="sv-grid">${k.slug === "implantatsiya-zubov" ? allOn6() : ""}${items.map(card).join("")}</div>
<p class="pg-note"><a href="/ceny#pl-${k.slug}">Все цены раздела</a> · <a href="/ceny">Все цены клиники</a></p>
</div></section>
${deep.has(k.slug) ? `<section class="pg-sec" data-tone="ink"><div class="wrap">
<div class="sh"><span class="kick">Гарантии</span><h2>Что записано в договоре</h2></div>
<ol class="gu pg-gu">${D.GUARANTEE.map((g) => `<li>${ic("shield")}<b>${g.t}</b><span>${g.d}</span></li>`).join("")}</ol>
</div></section>
<section class="pg-sec"><div class="wrap">
<div class="sh"><span class="kick">Врачи</span><h2>Кто будет вас лечить</h2></div>
<div class="vd-grid">${docsFor(k.slug).map(docCard).join("")}</div>
<p class="pg-note"><a href="/vrachi">Все врачи клиники</a></p>
</div></section>` : ""}
<section class="pg-sec pg-alt"><div class="wrap pg-pay">
<div class="pk"><span class="pk-i">${ic("card")}</span><b>${perk(/рассроч/i).t}</b><span>${perk(/рассроч/i).d}</span></div>
<div class="pk"><span class="pk-i">${ic("doc")}</span><b>${perk(/вычет/i).t}</b><span>${perk(/вычет/i).d}</span></div>
${others(k.slug)}
</div></section>
${ctaBand(k.nav)}`,
    };
  }

  /* ── Цены ────────────────────────────────────────────────────────── */
  const offers = LIST.map((x) => ({ x, n: Number(String(x.p).replace(/[^\d]/g, "")) })).filter((o) => o.n > 0 && /\d/.test(o.x.p));
  out.ceny = {
    title: `Цены на стоматологию в Томске · «${nameOf}»`, desc: `Цены клиники «${nameOf}»: All-on-6 от ${rub(Math.min(...D.PRICES.map((x) => x.price)))}, имплантация, протезирование, лечение, хирургия, гигиена и КТ. Рассрочка 0%, налоговый вычет.`, path: "/ceny",
    ld: ldOf([HOME, ["Цены", "/ceny"]], offers.length ? [{ "@type": "OfferCatalog", "@id": `${U}/ceny#prices`, name: "Цены клиники", itemListElement: offers.map(({ x, n }) => ({ "@type": "Offer", name: c.plain(x.t), price: n, priceCurrency: "RUB", ...(/^от\s/i.test(c.plain(x.p)) ? { priceSpecification: { "@type": "PriceSpecification", minPrice: n, priceCurrency: "RUB" } } : {}) })) }] : []),
    main: `${hero({ key: "pg-ceny", kick: "Цены", h: "Цены на услуги клиники", p: "Цены в рублях. Точную стоимость лечения врач назовёт после осмотра и снимка, до начала лечения. Первая консультация бесплатно.", img: "calm-4-16", alt: "Несъёмный протез на шести имплантах, 3D-визуализация", path: "/ceny", list: [HOME, ["Цены", "/ceny"]] })}
${c.blocks.price({ all: false })}
<section class="pg-sec" id="preyskurant"><div class="wrap">
<div class="sh"><span class="kick">Прейскурант</span><h2>Цены по разделам</h2></div>
<nav class="pl-nav" aria-label="Разделы прейскуранта"><ul>${CATS.map((k) => `<li><a href="#pl-${k.slug}">${k.nav}</a></li>`).join("")}</ul></nav>
${CATS.map((k) => { const items = LIST.filter((x) => x.cat === k.slug); return items.length ? `<div class="pl" id="pl-${k.slug}"><h3><a href="/${k.slug}">${k.t}</a></h3><table class="pl-t"><thead><tr><th scope="col">Услуга</th><th scope="col">Цена</th></tr></thead><tbody>${items.map((x) => `<tr><th scope="row">${x.t}${x.d ? `<small>${x.d}</small>` : ""}</th><td>${priceOf(x)}</td></tr>`).join("")}</tbody></table></div>` : ""; }).join("\n")}
<div class="pg-legal"><p>Цены указаны в рублях. Перед лечением врач составляет план и называет стоимость каждого этапа; медицинские услуги оказываются по договору, по Правилам предоставления медицинскими организациями платных медицинских услуг (постановление Правительства РФ от 11.05.2023 № 736). Информация на сайте не является публичной офертой.</p><p>За лечение можно вернуть 13% налоговым вычетом: клиника выдаёт справку об оплате медицинских услуг для налоговой. Есть рассрочка от клиники.</p></div>
</div></section>
${ctaBand("")}`,
  };

  /* ── Врачи ───────────────────────────────────────────────────────── */
  out.vrachi = {
    title: `Врачи клиники «${nameOf}», Томск`, desc: `Врачи «${nameOf}»: ${D.DOCTORS.map((d) => c.plain(d.name)).join(", ")}. Стаж, образование и квалификация, запись на консультацию.`, path: "/vrachi",
    ld: ldOf([HOME, ["Врачи", "/vrachi"]], D.DOCTORS.map((d, i) => ({ "@type": "Person", "@id": `${U}/vrachi#d${i + 1}`, name: c.plain(d.name), jobTitle: c.plain(d.role), worksFor: { "@id": `${U}/#clinic` } }))),
    main: `${c.team({ page: true, crumbs: crumbs([HOME, ["Врачи", "/vrachi"]]) })}
<section class="pg-sec"><div class="wrap"><div class="sh"><span class="kick">Стаж и квалификация</span><h2>Врачи клиники</h2></div><div class="vd-grid vd-full">${D.DOCTORS.map(docCard).join("")}</div>
<p class="pg-note">График приёма врачей уточняйте у администратора: <a href="${tel}">${B.phone}</a>.</p></div></section>
${ctaBand("")}`,
  };

  /* ── О клинике ───────────────────────────────────────────────────── */
  out["o-klinike"] = {
    title: `О клинике «${nameOf}»: центр имплантации в Томске`, desc: `«${nameOf}»: ${c.plain(B.what).toLowerCase()} в Томске, ${c.plain(B.street)}. Гарантии в договоре, своя лаборатория, фото клиники, сведения и документы.`, path: "/o-klinike",
    ld: ldOf([HOME, ["О клинике", "/o-klinike"]]),
    main: `${hero({ key: "pg-o-klinike", kick: "О клинике", h: `Центр имплантации «${B.name}»`, p: `${B.what} в Томске. ${B.near}. ${B.parking}.`, img: "p-rec", alt: "Ресепшен клиники «Сияние Севера» с названием на стене", path: "/o-klinike", list: [HOME, ["О клинике", "/o-klinike"]] })}
${c.blocks.trust()}
${c.blocks.perks()}
${c.blocks.rooms()}
<section class="pg-sec"><div class="wrap pg-docs-l"><div><span class="kick">Документы</span><h2>Сведения о клинике</h2><p>Лицензия, сведения о юридическом лице, контролирующие органы и документы клиники.</p></div><a class="btn btn-line" href="/svedeniya">${ic("doc")}<span>Открыть сведения</span></a></div></section>`,
  };

  /* ── Отзывы ──────────────────────────────────────────────────────── */
  out.otzyvy = {
    title: `Отзывы пациентов о клинике «${nameOf}», Томск`, desc: `Отзывы пациентов «${nameOf}»: оценка ${c.plain(D.RATING.value)} на ${c.plain(D.RATING.where)}. Имплантация, протезирование, лечение зубов в Томске.`, path: "/otzyvy",
    ld: ldOf([HOME, ["Отзывы", "/otzyvy"]]),
    main: `${hero({ key: "pg-otzyvy", kick: "Отзывы", h: "Отзывы пациентов", p: `Оценка ${D.RATING.value} на ${D.RATING.where}, ${D.RATING.rec}% пациентов рекомендуют клинику родным. Отзывы с сайта клиники и с карт.`, img: "p-cor", alt: "Коридор клиники со световыми линиями", path: "/otzyvy", list: [HOME, ["Отзывы", "/otzyvy"]] })}
<section class="pg-sec"><div class="wrap">
<div class="rv-grid">${D.REVIEWS.map((r) => `<blockquote class="rq"><span class="rq-st" aria-label="5 из 5">${"★".repeat(5)}</span><p>${r.t}</p><footer><b>${r.who}</b><span>${r.when} · ${r.src}</span></footer></blockquote>`).join("")}</div>
<p class="pg-note"><a href="${B.map}" rel="noopener">Все отзывы на Яндекс Картах</a></p>
</div></section>
${ctaBand("")}`,
  };

  /* ── Акции ───────────────────────────────────────────────────────── */
  out.akcii = {
    title: `Акции стоматологии «${nameOf}», Томск`, desc: `Акции «${nameOf}»: подарки к лечению All-on-6 на ${rub(D.BENEFIT)}, рассрочка 0% без первого взноса, налоговый вычет 13%.`, path: "/akcii",
    ld: ldOf([HOME, ["Акции", "/akcii"]]),
    main: `${hero({ key: "pg-akcii", kick: "Акции", h: "Акции и подарки", p: "Подарки к лечению All-on-6, рассрочка без переплаты и помощь с налоговым вычетом. Сроки и условия акций уточняйте у администратора.", img: "bg-onyx-16", alt: "", path: "/akcii", list: [HOME, ["Акции", "/akcii"]] })}
<section class="pg-sec"><div class="wrap ak-grid">
<article class="ak ak-big"><span class="kick">Подарки к лечению All-on-6</span><h2>Выгода ${rub(D.BENEFIT)}</h2><ul class="gf">${D.GIFTS.map((g) => `<li><span>${ic(g.sale ? "card" : "gift")}${g.t}</span><span class="gf-p"><s>${rub(g.was)}</s><b>${g.sale ? "в подарок" : "0 ₽"}</b></span></li>`).join("")}</ul>${book("All-on-6: методика", "Записаться по акции")}</article>
${D.PERKS.map((p, i) => `<article class="ak"><span class="pk-i">${ic(["car", "user", "doc", "card"][i % 4])}</span><h3>${p.t}</h3><p>${p.d}</p></article>`).join("")}
</div>
<div class="wrap"><p class="pg-legal">Подробности, сроки и условия акций уточняйте у администратора по телефону <a href="${tel}">${B.phone}</a>. Информация на сайте не является публичной офертой.</p></div></section>
${ctaBand("")}`,
  };

  /* ── Контакты ────────────────────────────────────────────────────── */
  const auth = () => `<ul class="au">${AUTH.map((a) => `<li><b>${a.t}</b>${a.addr ? `<span>${a.addr}</span>` : ""}${a.phone ? `<span>Телефон: ${a.phone}</span>` : ""}${a.mail ? `<span>Почта: <a href="mailto:${a.mail}">${a.mail}</a></span>` : ""}</li>`).join("")}</ul>`;
  out.kontakty = {
    title: `Контакты клиники «${nameOf}», Томск, ${c.plain(B.street)}`, desc: `«${nameOf}»: ${c.plain(B.addr)}, ${c.plain(B.hours)}, телефон ${c.plain(B.phone)}. Как доехать, парковка, реквизиты.`, path: "/kontakty",
    ld: ldOf([HOME, ["Контакты", "/kontakty"]]),
    main: `${hero({ key: "pg-kontakty", kick: "Контакты", h: "Как к нам добраться", p: `${B.addr}. ${B.hours}. ${B.near}.`, img: "bg-street-16", alt: "", path: "/kontakty", list: [HOME, ["Контакты", "/kontakty"]] })}
<section class="pg-sec"><div class="wrap kt-grid">
<ul class="kt">
<li>${ic("pin")}<span><b>${B.addr}</b><a href="${B.route}" rel="noopener">Построить маршрут в Яндекс Картах</a></span></li>
<li>${ic("clock")}<span><b>${B.hours}</b>без выходных</span></li>
<li>${ic("phone")}<span><b><a href="${tel}">${B.phone}</a></b>звонок в одно нажатие</span></li>
<li>${ic("park")}<span><b>Парковка</b>${B.parking}</span></li>
${c.msgLinks().map(([u, n, k]) => `<li>${ic(k)}<span><b><a href="${u}" rel="noopener">${n}</a></b>написать в мессенджер</span></li>`).join("")}
</ul>
<div class="kt-side">
<div class="kt-card"><span class="kick">Реквизиты</span><p><b>${ORG.full}</b></p><p>ИНН ${ORG.inn}${ORG.ogrn ? `, ОГРН ${ORG.ogrn}` : ""}</p><p>${ORG.addr}</p>${B.license ? `<p>${B.license}</p>` : ""}<p><a href="/svedeniya">Сведения о медицинской организации</a></p></div>
<div class="kt-card"><span class="kick">Куда обратиться, если что-то не так</span>${auth()}</div>
</div>
</div></section>
${ctaBand("")}`,
  };

  /* ── Сведения о медицинской организации (ПП РФ № 736, п. 11) ───────── */
  const row = (k, v) => (v ? `<div class="sd-r"><dt>${k}</dt><dd>${v}</dd></div>` : "");
  const lic = [ORG.licNo && `№ ${ORG.licNo}`, ORG.licDate && `от ${ORG.licDate}`].filter(Boolean).join(" ");
  const docs = [
    ["/privacy", "Политика обработки персональных данных"],
    ["/soglasie", "Согласие на обработку персональных данных"],
    ["/ceny", "Цены на медицинские услуги"],
    ...DOCS.map((d) => [d.file, d.t, true]),
  ];
  out.svedeniya = {
    title: `Сведения о медицинской организации · «${nameOf}»`, desc: `Сведения о клинике «${nameOf}»: юридическое лицо, лицензия, режим работы, врачи, контролирующие органы, документы.`, path: "/svedeniya",
    ld: ldOf([HOME, ["Сведения о клинике", "/svedeniya"]]),
    main: `${hero({ key: "pg-svedeniya", kick: "Пациентам", h: "Сведения о медицинской организации", p: "Информация для пациентов по Правилам предоставления медицинскими организациями платных медицинских услуг (постановление Правительства РФ от 11.05.2023 № 736).", path: "/svedeniya", list: [HOME, ["Сведения о клинике", "/svedeniya"]], noBtn: true })}
<section class="pg-sec pg-doc"><div class="wrap">
<h2 id="org">Организация</h2>
<dl class="sd">${row("Полное наименование", ORG.full)}${row("Сокращённое наименование", B.legal)}${row("ИНН", ORG.inn)}${row("ОГРН", ORG.ogrn)}${row("Государственная регистрация", ORG.reg)}${row("Адрес", ORG.addr)}${row("Руководство", ORG.chief)}</dl>
<h2 id="licenziya">Лицензия</h2>
<dl class="sd">${row("Лицензия на медицинскую деятельность", lic)}${row("Кем выдана", ORG.licBy)}${row("Работы и услуги по лицензии", ORG.licWorks ? String(ORG.licWorks).split("\n").join("<br>") : "")}${row("Проверить лицензию", `<a href="https://roszdravnadzor.gov.ru/services/licenses" rel="noopener">единый реестр лицензий Росздравнадзора</a>`)}</dl>
<h2 id="rezhim">Режим работы</h2>
<dl class="sd">${row("Клиника", `${B.hours}`)}${row("Врачи", `по записи, график уточняйте у администратора: <a href="${tel}">${B.phone}</a>`)}</dl>
<h2 id="vrachi">Медицинские работники</h2>
<p>Специальность, стаж, образование и квалификация врачей: <a href="/vrachi">страница «Врачи»</a>.</p>
<ul class="sd-l">${D.DOCTORS.map((d) => `<li><b>${d.name}</b>, ${d.role}${d.edu ? `. ${String(d.edu).split("\n").join("; ")}` : ""}${d.cert ? `. ${String(d.cert).split("\n").join("; ")}` : ""}</li>`).join("")}</ul>
<h2 id="platnye">Платные медицинские услуги</h2>
<p>Перечень услуг и цены в рублях: <a href="/ceny">страница «Цены»</a>. Медицинские услуги оказываются по договору с пациентом после осмотра и информированного добровольного согласия на медицинское вмешательство. До начала лечения врач составляет план и называет стоимость каждого этапа. Оплата по договору, есть рассрочка от клиники; для налогового вычета клиника выдаёт справку об оплате медицинских услуг.</p>
<h2 id="pgg">Бесплатная медицинская помощь</h2>
<p>${ORG.pgg}</p>
<h2 id="organy">Контролирующие органы</h2>
${auth()}
<h2 id="dokumenty">Документы</h2>
<ul class="sd-d">${docs.map(([u, t, file]) => `<li>${ic("doc")}<a href="${u}"${file ? ' rel="noopener" target="_blank"' : ""}>${t}</a></li>`).join("")}</ul>
</div></section>`,
  };

  /* ── Персональные данные: политика и согласие (152-ФЗ) ───────────── */
  const day = c.PD_VERSION.split("-").reverse().join(".");
  const opName = `${ORG.full} (ИНН ${ORG.inn}${ORG.ogrn ? `, ОГРН ${ORG.ogrn}` : ""}), адрес: ${ORG.addr}`;
  const ask = `письменно по адресу ${ORG.addr}${ORG.pdEmail ? `, по электронной почте <a href="mailto:${ORG.pdEmail}">${ORG.pdEmail}</a>` : ""} или лично в клинике. Если удобнее, позвоните по номеру <a href="${tel}">${B.phone}</a>: подскажем, как оформить заявление`;
  const tgNote = `<li>Сотрудникам клиники через мессенджер Telegram приходит уведомление о новой заявке и сообщении в чате сайта: имя, телефон, услуга, текст сообщения. Серверы Telegram находятся за пределами Российской Федерации, это трансграничная передача персональных данных (ст. 12 Закона).</li>`;
  const docMain = (key, kick, h, p, path, body) => `${hero({ key, kick, h, p, path, list: [HOME, [h, path]], noBtn: true })}
<section class="pg-sec pg-doc"><div class="wrap">${body}</div></section>`;
  out.privacy = {
    title: `Политика обработки персональных данных · «${nameOf}»`, desc: `Как ${c.plain(B.legal)} обрабатывает и защищает персональные данные посетителей сайта: цели, состав данных, сроки, права, cookie.`, path: "/privacy",
    ld: ldOf([HOME, ["Политика обработки персональных данных", "/privacy"]]),
    main: docMain("pg-privacy", "Документ", "Политика обработки персональных данных", `Редакция от ${day}. Действует для сайта ${c.site}.`, "/privacy", `
<h2>1. Общие положения</h2>
<p>1.1. Политика определяет, как ${ORG.full} (далее «Клиника», «Оператор») обрабатывает и защищает персональные данные посетителей сайта ${c.site} (далее «Сайт»). Политика составлена по Федеральному закону от 27.07.2006 № 152-ФЗ «О персональных данных» (далее «Закон») и опубликована на Сайте в открытом доступе.</p>
<p>1.2. Оператор: ${opName}. Телефон: <a href="${tel}">${B.phone}</a>.${ORG.pdEmail ? ` Почта для обращений о персональных данных: <a href="mailto:${ORG.pdEmail}">${ORG.pdEmail}</a>.` : ""}${ORG.pdWho ? ` Ответственный за организацию обработки персональных данных: ${ORG.pdWho}.` : ""}</p>
<p>1.3. Клиника обрабатывает только те данные, которые нужны для заявленных целей, и не использует их для рекламных рассылок, не продаёт и не передаёт третьим лицам для их собственных целей.</p>
<h2>2. Какие данные, зачем и на каком основании</h2>
<div class="pd-t" role="region" aria-label="Цели обработки" tabindex="0"><table><thead><tr><th scope="col">Цель</th><th scope="col">Данные</th><th scope="col">Основание</th><th scope="col">Срок</th></tr></thead><tbody>
<tr><td>Запись на консультацию и приём, обратный звонок, расчёт стоимости (формы «Записаться» и «Посчитайте свой случай»)</td><td>Имя, номер телефона, выбранная услуга, удобные день и время, ответы в расчёте (какую челюсть восстановить, остались ли свои зубы, как проводить операцию, нужна ли справка для вычета)</td><td>Ваше согласие (п. 1 ч. 1 ст. 6 Закона). Ответы о состоянии зубов относятся к сведениям о здоровье: их обрабатывает медицинская организация, сотрудники которой обязаны хранить врачебную тайну (п. 4 ч. 2 ст. 10 Закона)</td><td>До достижения цели, но не дольше 3 лет с последнего обращения, или до отзыва согласия</td></tr>
<tr><td>Ответ на вопрос в чате Сайта</td><td>Имя, если вы его написали, текст сообщений, служебный ключ чата</td><td>Ваше согласие (п. 1 ч. 1 ст. 6 Закона)</td><td>3 года с последнего сообщения или до отзыва согласия</td></tr>
<tr><td>Ответ на сообщение, которое вы сами написали клинике в мессенджере или соцсети, и запись на приём</td><td>Имя или ник, номер телефона или идентификатор аккаунта, текст переписки</td><td>Действия по вашему запросу до заключения договора (п. 5 ч. 1 ст. 6 Закона)</td><td>3 года с последнего сообщения</td></tr>
${c.metrika ? `<tr><td>Статистика посещений Сайта, чтобы понимать, какие страницы полезны пациентам</td><td>Файлы cookie, IP-адрес, сведения о браузере и устройстве, просмотренные страницы и действия на Сайте (сервис Яндекс Метрика, ООО «ЯНДЕКС»)</td><td>Ваше согласие в окне о cookie (п. 1 ч. 1 ст. 6 Закона)</td><td>До отзыва согласия; данные Метрики хранятся по правилам ООО «ЯНДЕКС»</td></tr>` : ""}
</tbody></table></div>
<p>Медицинская помощь в клинике оформляется отдельными документами: договором, информированным добровольным согласием и согласием на обработку персональных данных в медицинской карте. Эта Политика описывает обработку данных на Сайте.</p>
<h2>3. Как обрабатываются данные</h2>
<p>3.1. Действия с данными: сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передача (предоставление, доступ), блокирование, удаление, уничтожение. Обработка смешанная: с использованием средств автоматизации и без них.</p>
<p>3.2. Данные граждан Российской Федерации записываются и хранятся в базе данных на сервере, который находится в Российской Федерации (ч. 5 ст. 18 Закона).</p>
<p>3.3. Доступ к заявкам и переписке есть только у сотрудников клиники с личным входом в рабочую систему. Клиника может поручить обработку сервисам, которые использует для записи (ч. 3 ст. 6 Закона):</p>
<ul><li>CRM-система amoCRM: заявка становится сделкой, чтобы администратор не потерял её.</li><li>Сервис Wazzup: через него приходят и уходят сообщения из мессенджеров и соцсетей.</li>${tgNote}<li>Хостинг-провайдер сервера, на котором работает Сайт.</li></ul>
<p>3.4. Когда цель достигнута, срок истёк или согласие отозвано, данные удаляются или обезличиваются в течение 30 дней, если закон не требует хранить их дольше.</p>
<h2>4. Ваши права</h2>
<p>Вы можете узнать, какие ваши данные обрабатывает Клиника, потребовать уточнить, заблокировать или уничтожить их, если они неполные, устаревшие или обрабатываются без основания, отозвать согласие и обжаловать действия Клиники в Роскомнадзоре или в суде (ст. 14, 17 и 21 Закона).</p>
<p>Как обратиться: ${ask}. Клиника отвечает в течение 10 рабочих дней; срок может быть продлён ещё на 5 рабочих дней, о чём мы сообщим с объяснением причины.</p>
<h2>5. Как отозвать согласие</h2>
<p>Отправьте заявление об отзыве согласия ${ask}. После отзыва Клиника прекращает обработку и уничтожает данные в течение 30 дней, кроме данных, которые закон обязывает хранить, например медицинской документации.</p>
<h2>6. Как данные защищены</h2>
<ul><li>Соединение с Сайтом защищено (HTTPS).</li><li>Вход в рабочую систему клиники только по личному логину и паролю; пароли хранятся в виде необратимого хеша.</li><li>Ключи подключённых сервисов хранятся в зашифрованном виде.</li><li>Действия сотрудников с заявками записываются в журнал.</li><li>Сотрудники, которые работают с данными, знают требования Закона и обязаны хранить врачебную тайну.</li></ul>
<h2 id="cookies">7. Cookie и данные в браузере</h2>
<p>Сайт хранит в вашем браузере номер вашей заявки и ключ к её статусу, ключ чата, ваш выбор в окне о cookie и настройки версии для слабовидящих. Без них запись и чат не работают. На сервер уходят только номер заявки и ключ чата, чтобы показать вам ответ.</p>
<p>${c.metrika ? "Яндекс Метрика включается, только если вы нажали «Разрешить» в окне о cookie. Изменить выбор можно кнопкой «Настройки cookie» внизу любой страницы или удалив cookie в настройках браузера." : "Счётчиков посещаемости и рекламных меток на Сайте нет."}</p>
<p><button type="button" class="btn btn-line btn-sm" data-cookies>Настройки cookie</button></p>
<h2>8. Заключительные положения</h2>
<p>Клиника может обновлять Политику, новая редакция действует с момента публикации на Сайте. Согласие на обработку персональных данных: <a href="/soglasie">отдельный документ</a>.</p>`),
  };
  out.soglasie = {
    title: `Согласие на обработку персональных данных · «${nameOf}»`, desc: `Текст согласия на обработку персональных данных при записи и вопросах на сайте ${c.site}.`, path: "/soglasie",
    ld: ldOf([HOME, ["Согласие на обработку персональных данных", "/soglasie"]]),
    main: docMain("pg-soglasie", "Документ", "Согласие на обработку персональных данных", `Редакция от ${day}.`, "/soglasie", `
<p>Отмечая поле «Даю согласие на обработку персональных данных» и отправляя форму записи, расчёта стоимости или сообщение в чате на сайте ${c.site}, я свободно, своей волей и в своём интересе даю согласие ${opName} (далее «Клиника») на обработку моих персональных данных на следующих условиях.</p>
<h2>1. Какие данные</h2>
<p>Имя; номер телефона; выбранная услуга, удобные день и время приёма; ответы в расчёте стоимости, в том числе сведения о состоянии моих зубов; текст моих сообщений в чате сайта.</p>
<h2>2. Для чего</h2>
<p>Чтобы связаться со мной, записать меня на консультацию или приём, ответить на мой вопрос и подготовить ориентировочный расчёт стоимости лечения.</p>
<h2>3. Что можно делать с данными</h2>
<p>Сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передача (предоставление, доступ) лицам, которым Клиника поручила обработку, блокирование, удаление, уничтожение, с использованием средств автоматизации и без них.</p>
<h2>4. Кому могут передаваться</h2>
<p>Сервисам, которым Клиника поручила обработку для записи пациентов: CRM-системе amoCRM и хостинг-провайдеру сервера сайта. Я согласен(на), что сведения о моей заявке и сообщениях (имя, телефон, услуга, текст) приходят сотрудникам Клиники через мессенджер Telegram, серверы которого находятся за пределами Российской Федерации. Для рекламы и третьим лицам для их собственных целей данные не передаются.</p>
<h2>5. Срок</h2>
<p>Согласие действует до достижения целей обработки, но не дольше 3 лет с моего последнего обращения, или до его отзыва.</p>
<h2>6. Как отозвать</h2>
<p>Согласие можно отозвать в любой момент заявлением ${ask}. После отзыва Клиника прекращает обработку и уничтожает данные в течение 30 дней, если закон не требует хранить их дольше.</p>
<p>С <a href="/privacy">Политикой обработки персональных данных</a> я ознакомлен(а).</p>`),
  };
  return out;
}
