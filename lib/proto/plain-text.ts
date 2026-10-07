/**
 * Текст макета — без длинных тире и без примет ИИ-текста.
 *
 * Владелец, 07.10.2026: «Запиши правило — никаких длинных тире в макетах и
 * маркеров ИИ текста!». Владелец бизнеса открывает макет и за секунду
 * решает, делали его люди или «нагенерили». Длинное тире через строку и
 * «не просто клиника, а пространство заботы» — первое, по чему узнают
 * текст модели. После этого макету уже не верят, сколько бы в нём ни было
 * анимации.
 *
 * Правило для всех макетов: прототипов из панели (lib/proto/booking),
 * собранных руками (scripts/protos → content/proto-bundles) и будущих.
 * Держат проверка макета (`protoProblems`, коды `dash` и `ai`) и тест
 * `tests/proto-plain-text.test.ts` — по каждой странице каждой сборки.
 *
 * Чем заменять тире — по смыслу, а не значком:
 * - «Москва — столица» → «Москва: столица», точка или другая фраза;
 * - «Услуга — 100 $» → «Услуга: 100 $» или колонки;
 * - промежутки «9:00–18:00», «3–5 дней» → дефис без пробелов: «9:00-18:00»;
 * - тире, набранное дефисом с пробелами (« - »), — то же тире: его тоже нет.
 */

/** Длинное и среднее тире, цифровое и горизонтальная черта. Минус (−) — не тире. */
export const LONG_DASH = /[—–―‒]/;

/** То же тире в разметке — сущностью: `&mdash;`, `&#8212;`. */
export const DASH_ENTITY = /&(?:mdash|ndash|horbar|#8212|#8211|#8213|#8210|#x2014|#x2013|#x2015|#x2012);/i;

/** Тире, набранное дефисом: « - » между словами. */
export const SPACED_HYPHEN = /(?:^|[\s\p{L}\p{N}.,:;!?)»"'])\s-\s(?=[\s\p{L}\p{N}«"'(])/u;

export type Marker = { re: RegExp; say: string };

/**
 * Обороты, по которым читатель узнаёт текст модели.
 *
 * Не «плохие слова» вообще, а штампы, которых в живой речи владельца
 * автосервиса или клиники нет: «погрузитесь в мир», «индивидуальный подход»,
 * «на новый уровень». Если компания сама так пишет о себе на своём сайте, это
 * её слова, и проверка их пропускает (`aiMarkers(text, pool)`).
 */
export const AI_MARKERS: readonly Marker[] = [
  // Русский.
  { re: /не\s+просто\s+[^.!?\n]{1,60}?[,:]\s*(?:а|это)\s/iu, say: "«не просто …, а …»" },
  { re: /больше,?\s+чем\s+просто/iu, say: "«больше, чем просто»" },
  { re: /погруз(?:итесь|иться)\b/iu, say: "«погрузитесь»" },
  { re: /окун(?:итесь|уться)\b/iu, say: "«окунитесь»" },
  { re: /откройте\s+для\s+себя/iu, say: "«откройте для себя»" },
  { re: /добро\s+пожаловать\s+в\s+мир/iu, say: "«добро пожаловать в мир»" },
  {
    re: /(?:^|[^\p{L}])в\s+мир[еа]?\s+(?:красоты|вкуса|комфорта|здоровья|роскоши|стиля|технологий|возможностей|уюта|автомобилей|недвижимости|улыбок|заботы)/iu,
    say: "«в мир красоты / комфорта …»",
  },
  { re: /путешестви\p{L}*\s+в\s+мир/iu, say: "«путешествие в мир»" },
  { re: /уникальн\p{L}*/iu, say: "«уникальный»" },
  { re: /инновационн\p{L}*/iu, say: "«инновационный»" },
  { re: /передов\p{L}*\s+(?:технолог|метод|оборудован|решени)/iu, say: "«передовые технологии»" },
  { re: /непревзойд\p{L}*/iu, say: "«непревзойдённый»" },
  { re: /безупречн\p{L}*/iu, say: "«безупречный»" },
  { re: /идеальн\p{L}*\s+решени/iu, say: "«идеальное решение»" },
  { re: /(?:комплексн|индивидуальн)\p{L}*\s+подход/iu, say: "«индивидуальный / комплексный подход»" },
  { re: /высококвалифицированн\p{L}*/iu, say: "«высококвалифицированные»" },
  { re: /широк\p{L}*\s+спектр/iu, say: "«широкий спектр»" },
  { re: /команд\p{L}*\s+(?:настоящих\s+)?профессионалов/iu, say: "«команда профессионалов»" },
  { re: /надё?жн\p{L}*\s+партн[её]р/iu, say: "«надёжный партнёр»" },
  { re: /доверьтесь/iu, say: "«доверьтесь»" },
  { re: /с\s+любовью\s+к\s+(?:своему\s+)?делу/iu, say: "«с любовью к своему делу»" },
  { re: /забот\p{L}*\s+о\s+каждом/iu, say: "«забота о каждом»" },
  { re: /до\s+мелочей|каждой\s+детал|каждую\s+деталь/iu, say: "«продумано до мелочей / каждая деталь»" },
  { re: /на\s+новый\s+уровень|новый\s+уровень\s+(?:комфорта|качества|сервиса)/iu, say: "«на новый уровень»" },
  { re: /залог\s+(?:успеха|вашего)|ключ\s+к\s+(?:успеху|вашему|вашей|красоте|здоровью)/iu, say: "«залог / ключ к успеху»" },
  { re: /в\s+современном\s+мире|в\s+наше\s+время|ни\s+для\s+кого\s+не\s+секрет/iu, say: "«в современном мире»" },
  { re: /(?:стоит|важно|следует)\s+отметить/iu, say: "«стоит отметить»" },
  { re: /(?:^|[^\p{L}])будь\s+то\s/iu, say: "«будь то»" },
  { re: /мы\s+гордимся/iu, say: "«мы гордимся»" },
  { re: /атмосфер\p{L}*\s+(?:уюта|комфорта|тепла|роскоши|гармонии)/iu, say: "«атмосфера уюта»" },
  { re: /незабываем\p{L}*|неповторим\p{L}*|волшебн\p{L}*|(?:^|[^\p{L}])маги[яию](?![\p{L}])/iu, say: "«незабываемый / волшебный / магия»" },
  { re: /эксклюзивн\p{L}*/iu, say: "«эксклюзивный»" },
  { re: /открыва\p{L}*\s+(?:новые\s+)?(?:возможности|горизонты)|новые\s+горизонты/iu, say: "«открывает новые возможности»" },
  { re: /в\s+самом\s+сердце/iu, say: "«в самом сердце»" },
  { re: /(?:мечт\p{L}*|идеи)\s+в\s+(?:реальность|жизнь)/iu, say: "«воплотим мечты в реальность»" },
  { re: /сделайте\s+(?:первый\s+)?шаг/iu, say: "«сделайте первый шаг»" },
  { re: /не\s+упустите/iu, say: "«не упустите»" },
  { re: /(?:\d+|две|три|четыре|пять|шесть|семь|восемь|девять|десять)\s+причин\s+выбрать/iu, say: "«N причин выбрать нас»" },
  { re: /первое,?\s+что\s+(?:видит|замечает|бросается)/iu, say: "«первое, что видит клиент»" },
  // Узбекский.
  { re: /noyob/iu, say: "«noyob»" },
  { re: /innovatsion/iu, say: "«innovatsion»" },
  { re: /mukammal\s+yechim/iu, say: "«mukammal yechim»" },
  { re: /(?:individual|kompleks)\s+yondashuv/iu, say: "«individual / kompleks yondashuv»" },
  { re: /yuqori\s+malakali/iu, say: "«yuqori malakali»" },
  { re: /dunyosiga/iu, say: "«… dunyosiga»" },
  { re: /kashf\s+eting/iu, say: "«kashf eting»" },
  { re: /shunchaki\s+[^.!?\n]{1,40}?\s+emas/iu, say: "«shunchaki … emas»" },
  { re: /ishonchli\s+hamkor/iu, say: "«ishonchli hamkor»" },
  { re: /yangi\s+(?:bosqich|daraja)ga/iu, say: "«yangi bosqichga»" },
  { re: /har\s+bir\s+detal/iu, say: "«har bir detal»" },
  { re: /zamonaviy\s+dunyoda/iu, say: "«zamonaviy dunyoda»" },
  { re: /tanlash(?:ingiz)?\s+uchun\s+\S+\s+sabab/iu, say: "«… tanlash uchun N sabab»" },
  // Английский.
  { re: /\b(?:delve|elevate[sd]?|seamless(?:ly)?|unlock|unleash|tapestry|embark)\b/i, say: "«delve / elevate / seamless / unlock»" },
  { re: /\bcutting[- ]edge\b|\bstate[- ]of[- ]the[- ]art\b|\bworld[- ]class\b|\bgame[- ]chang/i, say: "«cutting-edge / world-class»" },
  { re: /\bin\s+today['’]s\b|\blook\s+no\s+further\b|\bnestled\b|\bin\s+the\s+heart\s+of\b|\btestament\s+to\b/i, say: "«in today's / look no further / nestled»" },
  { re: /\bnot\s+just\s+[^.!?\n]{1,40}?,?\s+but\b|\bmore\s+than\s+just\b/i, say: "«not just …, but»" },
  // Значки, которыми модель украшает текст.
  { re: /[✨🚀💫🌟]/u, say: "значки ✨ 🚀" },
];

/** Какие штампы в тексте. Обороты, которые есть в `pool` (слова самой компании), не считаются. */
export function aiMarkers(text: string, pool = ""): string[] {
  const found: string[] = [];
  for (const marker of AI_MARKERS) {
    const hit = text.match(marker.re);
    if (!hit) continue;
    if (pool && marker.re.test(pool) && pool.toLowerCase().includes(hit[0].trim().toLowerCase())) continue;
    found.push(marker.say);
  }
  return found;
}

/** Где в тексте тире: по несколько слов вокруг, чтобы найти глазами. */
export function dashSpots(text: string, limit = 5): string[] {
  const spots: string[] = [];
  const re = new RegExp(`${LONG_DASH.source}|${SPACED_HYPHEN.source}`, "gu");
  for (const hit of text.matchAll(re)) {
    const at = hit.index ?? 0;
    spots.push(text.slice(Math.max(0, at - 24), at + 24).replace(/\s+/g, " ").trim());
    if (spots.length >= limit) break;
  }
  return spots;
}

/**
 * Тире в словах компании — то есть в фактах, которые попадают на макет как
 * есть (название услуги, адрес, часы): «Пн–Пт 9:00–18:00» → «Пн-Пт
 * 9:00-18:00», «Протезирование — ортопедия» → «Протезирование, ортопедия».
 * Наш собственный текст так не чинится: его переписывают по смыслу.
 */
export function withoutDashes(text: string): string {
  return text
    .replace(/(\d)\s*[—–―‒]\s*(?=\d)/gu, "$1-")
    .replace(/(\S)[—–―‒](?=\S)/gu, "$1-")
    .replace(/\s+[—–―‒-]\s+/gu, ", ")
    .replace(/^\s*[—–―‒]\s*|\s*[—–―‒]\s*$/gu, "")
    .replace(/[—–―‒]/gu, "-");
}

/** Претензии к тексту макета: тире и штампы. Пустой список — текст чистый. */
export function plainTextProblems(input: { text: string; html?: string; pool?: string }): { code: "dash" | "ai"; text: string }[] {
  const out: { code: "dash" | "ai"; text: string }[] = [];
  const spots = dashSpots(input.text);
  if (spots.length || (input.html && DASH_ENTITY.test(input.html))) {
    out.push({
      code: "dash",
      text: `В тексте длинное тире: ${spots.length ? spots.map((s) => `«${s}»`).join(", ") : "сущностью в разметке"}. В макетах тире нет: двоеточие, точка или другая фраза.`,
    });
  }
  const markers = aiMarkers(input.text, input.pool);
  if (markers.length) {
    out.push({ code: "ai", text: `Штампы ИИ-текста: ${markers.join(", ")}. Написать, как сказал бы живой человек.` });
  }
  return out;
}

const ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", laquo: "«", raquo: "»",
  mdash: "—", ndash: "–", horbar: "―", hellip: "…", thinsp: " ", ensp: " ", emsp: " ",
};

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
    if (name[0] === "#") {
      const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
    }
    return ENTITIES[name.toLowerCase()] ?? " ";
  });
}

/** Строки внутри скрипта, похожие на текст для человека: с пробелом или кириллицей. */
function scriptStrings(js: string): string[] {
  const out: string[] = [];
  const quoted = [
    ...[...js.matchAll(/(["'])((?:\\.|(?!\1)[^\\\n])*)\1/g)].map((hit) => hit[2]),
    // Шаблонные строки бывают в несколько строк; вставки `${…}` в них — код.
    ...[...js.matchAll(/`((?:\\.|[^\\`])*)`/g)].map((hit) => hit[1].replace(/\$\{[^}]*\}/g, " ")),
  ];
  for (const value of quoted) {
    // Селекторы, имена классов и ключи — не текст: в них нет ни пробела между словами, ни кириллицы.
    if (/[Ѐ-ӿ]/.test(value) || /\p{L}{2,}\s+\p{L}{2,}/u.test(value)) out.push(value.replace(/<[^>]+>/g, " "));
  }
  return out;
}

/**
 * Всё, что человек может прочитать на странице макета: текст, заголовок
 * вкладки, подписи в атрибутах (alt, title, placeholder, aria-label,
 * описание страницы, data-*) и строки скриптов, из которых страница рисует
 * карточки, подсказки и ответы. Без кода: в CSS и в скриптах дефис с
 * пробелами — это вычитание, а не тире.
 */
export function readableText(html: string): string {
  const parts: string[] = [];
  const noComments = html.replace(/<!--[\s\S]*?-->/g, " ");
  for (const script of noComments.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (/application\/(?:ld\+)?json/i.test(script[0].slice(0, 80))) parts.push(script[1]);
    else parts.push(...scriptStrings(stripJsComments(script[1])));
  }
  for (const svgText of noComments.matchAll(/<(?:text|title|desc)\b[^>]*>([^<]*)<\//gi)) parts.push(svgText[1]);
  for (const attr of noComments.matchAll(/\s(?:alt|title|placeholder|aria-label|content|value|label|data-[\w-]+)="([^"]*)"/gi)) {
    parts.push(attr[1]);
  }
  const body = noComments
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  parts.push(body);
  return decode(parts.join("\n")).replace(/[ \t ]+/g, " ");
}

/** Скрипт без комментариев. Грубо, но для поиска тире хватает: «//» после двоеточия — это адрес. */
function stripJsComments(js: string): string {
  return js.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");
}

/**
 * Тире где угодно в странице, кроме комментариев: в стилях (`content:"—"`
 * рисует тире на экране), в скриптах, в разметке. Комментарии клиент не
 * читает, но и они в готовую страницу лучше не попадают.
 */
export function dashInCode(html: string): boolean {
  const bare = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_, css: string) => css.replace(/\/\*[\s\S]*?\*\//g, " "))
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_, js: string) => stripJsComments(js));
  return LONG_DASH.test(bare) || DASH_ENTITY.test(bare);
}

/** Проверка готовой страницы макета: тире в тексте и в коде, штампы. */
export function pageProblems(html: string, pool = ""): { code: "dash" | "ai"; text: string }[] {
  const text = readableText(html);
  const out = plainTextProblems({ text, pool });
  if (!out.some((p) => p.code === "dash") && dashInCode(html)) {
    out.unshift({ code: "dash", text: "Длинное тире в стилях или скрипте страницы (например, content:\"—\")." });
  }
  return out;
}
