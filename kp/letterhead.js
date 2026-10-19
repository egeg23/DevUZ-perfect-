/*
 * Шапка и подвал фирменного бланка на каждом листе `.sheet`.
 *
 * Одна копия на все документы, а не вставка руками в каждый лист: шапка,
 * переписанная в пяти местах, рано или поздно разъедется — адрес поправят
 * на первом листе и забудут на третьем. Данные — те же, что в
 * `content/company.ts` и `components/docs/letterhead.tsx`; меняются там —
 * меняются и здесь.
 *
 * Номер страницы ставится сам: «2 / 4».
 */
(function () {
  var STAR =
    "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 " +
    "L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 " +
    "L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";

  function logo(i) {
    var id = "lh" + i;
    return (
      '<svg viewBox="-112 -112 224 224" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + 'g" x1="0" y1="-1" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#5B9BFF"/><stop offset="55%" stop-color="#3B82F6"/>' +
      '<stop offset="100%" stop-color="#22F0A0"/></linearGradient>' +
      '<mask id="' + id + 'm"><rect x="-112" y="-112" width="224" height="224" fill="#fff"/>' +
      '<path d="M-22 -34 L-58 0 L-22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</mask></defs>" +
      '<path d="' + STAR + '" fill="url(#' + id + 'g)" mask="url(#' + id + 'm)"/>' +
      '<rect x="-5" y="-27" width="10" height="54" rx="5" fill="#e8b14c"/></svg>'
    );
  }

  var head =
    '<div class="lh-brand">{logo}<div><p class="lh-name">DevUz Studio</p>' +
    '<p class="lh-tag">Разработка сайтов, приложений и ИИ-продуктов · Ташкент</p></div></div>' +
    '<div class="lh-contacts"><p>devuz.studio</p><p>t.me/Devuz_studio_bot</p>' +
    "<p>+998 90 912-05-78 · +48 574 050 123</p>" +
    "<p>Ташкент, улица Шота Руставели, 138</p></div>";

  var foot =
    "<span><b>ИП MAKSIMOV EGOR ANDREEVICH</b> · Республика Узбекистан, г. Ташкент, " +
    "улица Шота Руставели, 138</span><span>devuz.studio</span>";

  /* Черновик без юрлица (body data-no-legal): в подвале только сайт, пока
     стороны не решили, от какого лица подписывается договор. */
  if (document.body.hasAttribute("data-no-legal"))
    foot = "<span>DevUz Studio</span><span>devuz.studio</span>";

  var sheets = document.querySelectorAll(".sheet");
  for (var i = 0; i < sheets.length; i++) {
    var top = document.createElement("header");
    top.className = "lh-head";
    top.innerHTML = head.replace("{logo}", logo(i));
    sheets[i].insertBefore(top, sheets[i].firstChild);

    var bottom = document.createElement("footer");
    bottom.className = "lh-foot";
    bottom.innerHTML = foot;
    sheets[i].appendChild(bottom);

    var no = document.createElement("span");
    no.className = "page-no";
    no.textContent = i + 1 + " / " + sheets.length;
    sheets[i].appendChild(no);
  }
})();
