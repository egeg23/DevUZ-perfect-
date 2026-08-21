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

/** IP клиента за прокси Vercel/nginx. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
