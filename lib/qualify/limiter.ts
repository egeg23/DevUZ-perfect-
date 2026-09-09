/**
 * Простейший лимитер частоты запросов.
 *
 * Счётчики живут в памяти процесса, поэтому на нескольких инстансах лимит
 * получается «мягким»: каждый инстанс считает своё. Для защиты от случайного
 * зацикливания и от одиночного скрипта этого достаточно, а вот перед
 * серьёзной нагрузкой счётчики надо вынести в Redis или Supabase —
 * см. README, раздел про эксплуатацию.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Подчищаем протухшие записи, чтобы карта не росла бесконечно на
    // долгоживущем инстансе.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Адрес клиента — ключ, по которому считается лимит частоты.
 *
 * Порядок здесь не стилистический. `X-Real-IP` наш nginx проставляет из
 * `$remote_addr` (`deploy/nginx-devuz.conf:103`, `:116`, `:130`) — это адрес
 * TCP-соединения, и подделать его посетитель не может. `X-Forwarded-For`
 * задаётся через `$proxy_add_x_forwarded_for`, то есть **дописывается** к
 * тому, что прислал клиент: первый элемент в нём — то, что посетитель
 * написал сам.
 *
 * Пока предпочтение отдавалось первому элементу X-Forwarded-For, любой лимит
 * обходился сменой одного заголовка — проверено на живом сайте: с фиксированным
 * X-Forwarded-For шестой запрос получал 429, а со сменой значения счётчик
 * начинался заново. Для /api/audit это особенно дорого: каждый запрос туда
 * заставляет наш сервер идти на чужой хост.
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();

  // Запасной путь для окружений без нашего nginx. Берём ПОСЛЕДНИЙ элемент:
  // он дописан ближайшим прокси, а не клиентом.
  const forwarded = request.headers.get("x-forwarded-for");
  const parts = (forwarded ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length) return parts[parts.length - 1];

  return "unknown";
}
