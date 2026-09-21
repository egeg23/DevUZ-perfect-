/**
 * Код, который выполняется внутри чужой страницы.
 *
 * Эти функции уезжают в браузер исходником — playwright сериализует их и
 * выполняет в контексте открытого сайта. Поэтому они самодостаточны: ни
 * импортов, ни ссылок на что-либо за пределами своего тела. Любая такая
 * ссылка превратится в `ReferenceError` уже на чужой странице, где её никто
 * не увидит, кроме пустого снимка.
 *
 * По той же причине здесь нет типов сложнее примитивов: файл проходит через
 * срез типов, и всё, что от него останется в браузере, — обычный JavaScript.
 */

/** Прямоугольник в координатах страницы, а не окна. */
export type PageRect = { x: number; y: number; width: number; height: number };

/**
 * Закрывает имя компании и логотип.
 *
 * Выполняется в странице: только там известно, где что лежит после вёрстки.
 * Возвращает, сколько плашек поставило, — ноль означает, что имя на первом
 * экране не нашлось, и это повод посмотреть снимок глазами.
 *
 * Плашки, а не размытие: размытие обратимо, и однажды кто-нибудь восстановит
 * из него имя.
 */
export function redactInPage(words: string[]): number {
  const COVER = "__devuz_cover";

  /**
   * Сначала все замеры, потом все плашки.
   *
   * Смешивать нельзя: каждая добавленная плашка — узел в body, после
   * которого браузер пересчитывает раскладку, и следующий замер приходит уже
   * по сдвинутой странице. Первая версия так и делала, и плашки ложились
   * рядом с текстом, а не на него.
   */
  const targets: { rect: DOMRect; color: string }[] = [];

  /**
   * Непрозрачный фон ближайшего предка.
   *
   * Важно именно «непрозрачный». Первая версия брала первый попавшийся цвет
   * и получала что-нибудь вроде rgba(240,240,242,.55) — плашка выходила
   * полупрозрачной, и имя компании читалось сквозь неё. На снимке это
   * выглядело как выцветший текст, а не как затирание, то есть анонимности
   * не было вовсе.
   */
  const bg = (el: Element | null): string => {
    let node: Element | null = el;
    for (let i = 0; i < 8 && node; i++) {
      const color = getComputedStyle(node).backgroundColor;
      const m = color && color.match(/^rgba?\(([^)]+)\)$/);
      if (m) {
        const parts = m[1].split(",").map((v) => parseFloat(v.trim()));
        const alpha = parts.length > 3 ? parts[3] : 1;
        if (alpha >= 0.99) return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
      }
      // Фон может быть не цветом, а градиентом — тогда сплошного
      // background-color нет ни у кого до самого корня. Белая плашка на
      // тёмном экране выглядит не затиранием, а вырезанным куском, и
      // разбор начинает походить на утёкший документ. Берём первый цвет
      // градиента: он ближе к тому, что под плашкой, чем белый.
      const image = getComputedStyle(node).backgroundImage;
      const stop = image && image !== "none" ? image.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}\b/i) : null;
      if (stop) {
        const solid = stop[0].match(/^rgba\(([^)]+)\)$/i);
        if (!solid) return stop[0];
        const parts = solid[1].split(",").map((v) => parseFloat(v.trim()));
        if ((parts[3] ?? 1) >= 0.99) return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
      }

      node = node.parentElement;
    }

    // Ни у кого до корня нет сплошного фона. Последняя попытка — корень
    // документа: браузер рисует страницу на нём, каким бы он ни был.
    for (const root of [document.body, document.documentElement]) {
      if (!root) continue;
      const color = getComputedStyle(root).backgroundColor;
      const m = color && color.match(/^rgba?\(([^)]+)\)$/);
      if (!m) continue;
      const parts = m[1].split(",").map((v) => parseFloat(v.trim()));
      if ((parts.length > 3 ? parts[3] : 1) >= 0.99) return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
    }
    return "#ffffff";
  };

  // 1. Логотип. Ищется по всей странице, а не только в шапке.
  //
  // Первая версия смотрела в шапку и в ссылку на главную — и этого хватало,
  // пока снимался только первый экран. Снимок находки может быть где
  // угодно, и первый же такой снимок вышел с подвалом, где логотип с именем
  // компании стоял целым. Разбор у нас анонимный, и цена промаха здесь не
  // «некрасиво», а названная публично компания.
  const logos = new Set<Element>();
  const roots: (Element | null)[] = [
    document.querySelector("header, .header, #header, [role=banner]"),
    document.querySelector("footer, .footer, #footer, [role=contentinfo]"),
    document.querySelector('a[href="/"], a[href="./"]'),
  ];
  for (const root of roots) {
    if (!root) continue;
    for (const el of root.querySelectorAll("img, svg, picture")) logos.add(el);
    if (root.tagName === "IMG" || root.tagName === "SVG") logos.add(root);
  }
  // И всё, что само называет себя логотипом, где бы оно ни стояло.
  for (const el of document.querySelectorAll(
    '[class*="logo" i], [id*="logo" i], img[src*="logo" i], img[alt*="logo" i], [aria-label*="logo" i]',
  )) {
    logos.add(el);
  }
  for (const el of logos) {
    const rect = el.getBoundingClientRect();
    // Широкая картинка в шапке — баннер, а не логотип: закрыть её значит
    // закрыть первый экран целиком.
    if (rect.width > window.innerWidth * 0.5) continue;
    targets.push({ rect, color: bg(el) });
  }

  // 2. Имя текстом. По узлам, а не заменой в разметке: замена в innerHTML
  // ломает страницу там, где слово стоит в атрибуте.
  if (words.length) {
    const re = new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const hits: Node[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.nodeValue || !re.test(node.nodeValue)) continue;
      hits.push(node);
    }
    for (const node of hits.slice(0, 40)) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const color = bg(node.parentElement ?? document.body);
      for (const rect of range.getClientRects()) targets.push({ rect, color });
    }
  }

  // 3. И только теперь рисуем. Координаты — документа, а не окна: плашка
  // должна остаться на месте, даже если снимок когда-нибудь станет
  // полностраничным.
  let placed = 0;
  for (const { rect, color } of targets) {
    if (rect.width < 4 || rect.height < 4) continue;
    const box = document.createElement("div");
    box.className = COVER;

    /**
     * Стили задаются с !important поверх полного сброса.
     *
     * Потому что страница стилизует и нашу плашку тоже. На example.com для
     * div задано opacity: .8 — плашка вставала точно на место, но
     * становилась полупрозрачной, и имя читалось сквозь неё. Выглядело это
     * как выцветший текст, то есть как будто затирание сработало наполовину.
     * На чужом сайте таких правил может быть сколько угодно: filter,
     * mix-blend-mode, transform, visibility.
     *
     * `all: initial` сбрасывает всё унаследованное, дальше — только наше и
     * только с !important, чтобы правило страницы с !important не победило.
     */
    box.style.setProperty("all", "initial", "important");
    const rules: Record<string, string> = {
      position: "absolute",
      left: `${rect.left + window.scrollX}px`,
      top: `${rect.top + window.scrollY}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      "background-color": color,
      "z-index": "2147483647",
      opacity: "1",
      filter: "none",
      "mix-blend-mode": "normal",
      transform: "none",
      display: "block",
      visibility: "visible",
      "pointer-events": "none",
    };
    for (const name of Object.keys(rules)) {
      box.style.setProperty(name, rules[name], "important");
    }

    // В body, а не в documentElement. Плашка, добавленная в <html> рядом с
    // <body>, рисуется НИЖЕ его содержимого при любом z-index — на снимке
    // это выглядит как подсветка текста, а не как затирание.
    document.body.appendChild(box);
    placed++;
  }

  return placed;
}

/**
 * Найти место, о котором говорит находка, и обвести его.
 *
 * Возвращает прямоугольник в координатах страницы или null. Null — обычный
 * исход, а не сбой: проверка находит беду по разметке, отданной сервером, а
 * показать её надо в отрисованной странице, и элемент может оказаться
 * спрятанным, нулевого размера или вообще ниже первого экрана. Снимок,
 * снятый «примерно там», хуже отсутствующего: читатель ищет на нём
 * названное, не находит и перестаёт верить остальным снимкам.
 *
 * Приёмы поиска перечислены в `lib/razbor/evidence.ts`; здесь — как каждый
 * из них выглядит в живой странице.
 */
export function huntInPage(kind: string): PageRect | null {
  const MARK = "__devuz_mark";

  /**
   * Годится ли элемент в доказательство.
   *
   * Прокрутка допускается: снимок находки — не снимок первого экрана. Год
   * в подвале и стена текста живут ниже сгиба, и требовать от них быть
   * наверху значит не показать их никогда.
   *
   * А вот элемент размером с экран не годится: обводка по краям окна
   * говорит «смотрите сюда» про всё сразу, то есть ни про что. Так
   * находилась подложка-картинка вместо картинки без подписи.
   */
  const visible = (el: Element): boolean => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 12) return false;
    if (rect.width > window.innerWidth * 0.95 && rect.height > window.innerHeight * 0.7) return false;

    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) < 0.1) return false;
    return true;
  };

  /** Собственный текст узла, без текста потомков. */
  const own = (el: Element): string =>
    Array.from(el.childNodes)
      .filter((node) => node.nodeType === 3)
      .map((node) => node.nodeValue || "")
      .join(" ")
      .trim();

  const all = (selector: string): Element[] => Array.from(document.querySelectorAll(selector)).filter(visible);

  /** Самый крупный из подошедших: мелкий значок ничего не доказывает. */
  const biggest = (list: Element[]): Element | null => {
    let best: Element | null = null;
    let area = 0;
    for (const el of list) {
      const rect = el.getBoundingClientRect();
      const size = rect.width * rect.height;
      if (size > area) {
        area = size;
        best = el;
      }
    }
    return best;
  };

  /** Первый видимый элемент, чей собственный текст подошёл под выражение. */
  const byText = (re: RegExp): Element | null => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.nodeValue || "";
      if (!re.test(text)) continue;
      const parent = node.parentElement;
      if (parent && visible(parent)) return parent;
    }
    return null;
  };

  let found: Element | null = null;

  if (kind === "marquee") {
    found = biggest(all('marquee, blink, [class*="marquee"], [class*="ticker"], [class*="running-line"]'));
  } else if (kind === "counter") {
    found =
      biggest(all('[id*="counter" i], [class*="counter" i], [id*="schetchik" i], img[src*="counter" i], img[src*="hit" i]')) ??
      byText(/счётчик|счетчик|посетител|visitors?\s*:|хитов/i);
  } else if (kind === "construction") {
    found = byText(/в разработке|разрабатывается|under construction|coming soon|скоро открытие|ishlanmoqda|тестовый режим/i);
  } else if (kind === "placeholder") {
    found = byText(/lorem ipsum|ваш текст|your text here|текст заголовка|заголовок h\d|описание услуги|placeholder/i);
  } else if (kind === "footer") {
    found = biggest(all("footer, .footer, #footer")) ?? byText(/©|&copy;|\bcopyright\b/i);
  } else if (kind === "broken-img") {
    // Картинка, которую браузер уже пытался загрузить и не смог: загрузка
    // завершена, а собственной ширины нет.
    found = biggest(
      Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0 && visible(img)),
    );
  } else if (kind === "img-no-alt") {
    // Картинка, а не подложка: `visible` уже отсекает элементы размером с
    // экран, иначе находка про подписи показывала бы фон первого экрана.
    found = biggest(Array.from(document.images).filter((img) => !img.getAttribute("alt") && visible(img)));
  } else if (kind === "body-text") {
    // Обычный абзац, а не заголовок: находка про мелкий текст — про то, что
    // человек читает, а не про то, что он видит крупно.
    //
    // Считаем собственный текст, а не весь вложенный: у пункта меню с
    // выпадающим списком «текста» набирается на абзац, хотя на экране это
    // одно слово. Первая версия так и нашла кнопку в шапке вместо текста.
    found = biggest(all("p, li").filter((el) => own(el).length > 80));
  } else if (kind === "longest-text") {
    let longest: Element | null = null;
    let length = 0;
    for (const el of all("p, div, section, article")) {
      const text = own(el);
      if (text.length > length) {
        length = text.length;
        longest = el;
      }
    }
    found = length > 300 ? longest : null;
  } else if (kind === "contacts") {
    const phone = /(\+?\d[\d\s\-()]{8,}\d)/;
    found =
      biggest(all('a[href^="tel:"]')) ??
      (() => {
        const hit = byText(phone);
        // Поднимаемся на уровень выше: номер сам по себе — строка без
        // окружения, а показать надо шапку, в которой он стоит.
        return hit && hit.parentElement && visible(hit.parentElement) ? hit.parentElement : hit;
      })();
  } else if (kind === "popup") {
    found = biggest(
      all("div, section, aside").filter((el) => {
        const style = getComputedStyle(el);
        if (style.position !== "fixed" && style.position !== "absolute") return false;
        if (Number(style.zIndex) < 100) return false;
        const rect = el.getBoundingClientRect();
        // Окно, а не плашка cookie внизу: занимает заметную часть экрана.
        return rect.width > window.innerWidth * 0.3 && rect.height > window.innerHeight * 0.2;
      }),
    );
  } else if (kind === "media") {
    found = biggest(all('audio, video, embed[type*="audio"], iframe[src*="youtube" i], iframe[src*="player" i]'));
  } else if (kind === "legacy-embed") {
    found = biggest(all("object, embed, applet, frameset, frame, iframe"));
  } else if (kind === "ie-note") {
    found = byText(/internet explorer|интернет эксплорер|только в ie|best viewed in/i);
  }

  if (!found) return null;

  // Подводим найденное к середине окна: снимок режется по окну, а не по
  // документу, и элемент из подвала иначе в кадр не попадёт.
  found.scrollIntoView({ block: "center", inline: "nearest" });

  const rect = found.getBoundingClientRect();
  if (rect.width < 24 || rect.height < 12) return null;

  // Обводка: яркая рамка со светлым ореолом. Одного цвета мало — он
  // теряется то на белом, то на тёмном, а теряется он ровно на том сайте,
  // ради которого снимок и делается.
  const mark = document.createElement("div");
  mark.className = MARK;
  mark.style.setProperty("all", "initial", "important");
  const rules: Record<string, string> = {
    position: "absolute",
    left: `${rect.left + window.scrollX - 4}px`,
    top: `${rect.top + window.scrollY - 4}px`,
    width: `${rect.width + 8}px`,
    height: `${rect.height + 8}px`,
    border: "3px solid #ff3b30",
    "border-radius": "6px",
    "box-shadow": "0 0 0 2px rgba(255,255,255,0.9)",
    "z-index": "2147483646",
    display: "block",
    visibility: "visible",
    opacity: "1",
    "pointer-events": "none",
  };
  for (const name of Object.keys(rules)) mark.style.setProperty(name, rules[name], "important");
  document.body.appendChild(mark);

  // Координаты окна, а не документа: playwright режет кадр от левого
  // верхнего угла окна — это проверено опытом, а не взято из документации.
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}
