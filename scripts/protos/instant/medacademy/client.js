/* Скрипт шаблона «Учебный центр» (макет MedAcademy B). В макете был React:
   здесь то же поведение без библиотек. */
(function () {
  var doc = document, root = doc.documentElement;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function all(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }

  /* Появление блоков: класс is-in, когда блок вошёл в экран. */
  var ins = all('.ma-in');
  if (still || !('IntersectionObserver' in window)) {
    ins.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var seen = new IntersectionObserver(function (list) {
      list.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); seen.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: /*~*/0.12 });
    ins.forEach(function (el) { seen.observe(el); });
  }

  /* Шапка: при любой прокрутке прячется, возвращается через 3 секунды тишины. */
  var head = doc.getElementById('head'), idle = 0, IDLE = 3000;
  function show() { if (head) head.classList.remove('is-away'); }
  function hide() {
    if (!head) return;
    if (head.contains(doc.activeElement)) return;
    head.classList.add('is-away');
    clearTimeout(idle);
    idle = setTimeout(show, IDLE);
  }
  if (head) {
    window.addEventListener('scroll', hide, { passive: true });
    head.addEventListener('focusin', function () { clearTimeout(idle); show(); });
  }

  /* Курсы: вкладки. */
  var ON = ['bg-ma-accent', 'text-ma-accent-ink'], OFF = ['text-[#e5e4ee]', 'hover:text-white'];
  var tabs = all('#tabs [role="tab"]');
  function pick(tab, focus) {
    tabs.forEach(function (b) {
      var on = b === tab, panel = doc.getElementById(b.getAttribute('aria-controls'));
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      ON.forEach(function (c) { b.classList.toggle(c, on); });
      OFF.forEach(function (c) { b.classList.toggle(c, !on); });
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (b, i) {
    b.tabIndex = i ? -1 : 0;
    b.addEventListener('click', function () { pick(b, false); });
    b.addEventListener('keydown', function (e) {
      var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      pick(tabs[(i + step + tabs.length) % tabs.length], true);
    });
  });

  /* Преподаватели: карточка переворачивается по нажатию. */
  all('.ma-flip').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = b.getAttribute('data-flipped') !== 'true';
      b.setAttribute('data-flipped', on ? 'true' : 'false');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  });

  /* Молекулы за первым экраном: точки и связи на холсте. Двигаются, пока видны. */
  var node = doc.getElementById('mol'), ctx = node && node.getContext && node.getContext('2d');
  if (ctx) {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5), small = window.innerWidth < 768;
    var count = small ? 16 : 30, reach = small ? 110 : 150, w = 0, h = 0, frame = 0, visible = true;
    var css = getComputedStyle(doc.querySelector('[data-ma]'));
    var pop = (css.getPropertyValue('--ma-pop') || '#8d66ff').trim();
    var colors = ['#cff846', pop, '#e995be', '#7dc2e3'];
    var resize = function () {
      w = node.clientWidth; h = node.clientHeight;
      node.width = w * dpr; node.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    var dots = [];
    for (var i = 0; i < count; i += 1) {
      dots.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: i % 5 === 0 ? 5 : 2.5, c: colors[i % 4] });
    }
    var draw = function () {
      ctx.clearRect(0, 0, w, h);
      for (var a = 0; a < dots.length; a += 1) {
        for (var b = a + 1; b < dots.length; b += 1) {
          var dx = dots[a].x - dots[b].x, dy = dots[a].y - dots[b].y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < reach) {
            ctx.strokeStyle = 'rgba(229,228,238,' + (0.22 * (1 - d / reach)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(dots[a].x, dots[a].y); ctx.lineTo(dots[b].x, dots[b].y); ctx.stroke();
          }
        }
      }
      dots.forEach(function (dot) {
        ctx.fillStyle = dot.c; ctx.globalAlpha = 0.75;
        ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
    };
    var step = function () {
      frame = 0;
      if (!visible) return;
      dots.forEach(function (dot) {
        dot.x += dot.vx; dot.y += dot.vy;
        if (dot.x < 0 || dot.x > w) dot.vx *= -1;
        if (dot.y < 0 || dot.y > h) dot.vy *= -1;
      });
      draw();
      frame = window.requestAnimationFrame(step);
    };
    draw();
    if (!still) {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (list) {
          visible = list.some(function (e) { return e.isIntersecting; });
          if (visible && !frame) frame = window.requestAnimationFrame(step);
        }).observe(node);
      } else frame = window.requestAnimationFrame(step);
      window.addEventListener('resize', function () { resize(); draw(); });
    }
  }
  root.classList.add('im-ready');
})();
